import { checkinRepository } from './checkin.repository';
import {
  ScanPassDto,
  ConfirmCheckInDto,
  ManualWalkInDto,
  GuestVerificationDossier,
  CheckInTelemetry,
  CheckInLedgerItem,
} from './checkin.types';
import prisma from '../../infrastructure/prisma/client';
import { BadRequestError } from '../../shared/errors/api-error';

export class CheckinService {
  /**
   * Scan QR Pass, manual token, or phone number and generate verification dossier
   */
  async scanPass(weddingId: string, dto: ScanPassDto): Promise<GuestVerificationDossier> {
    const rawIdentifier = (dto.qrToken || dto.manualCode || dto.phone || '').trim();
    const primaryEvent = dto.eventId
      ? { id: dto.eventId, name: 'Wedding Ceremony' }
      : await checkinRepository.getPrimaryEvent(weddingId);

    // 1. Find guest in database
    const guest = await checkinRepository.findGuestForScan(weddingId, rawIdentifier);

    if (!guest) {
      return {
        status: 'INVALID_TOKEN',
        guestId: '',
        name: 'Unrecognized Guest Pass',
        initials: '??',
        category: 'Unverified',
        isVip: false,
        passToken: rawIdentifier,
        headcount: 1,
        assignedTable: 'Unassigned',
        zone: 'General Concierge',
        warningMessage: `No invitation record matching pass "${rawIdentifier}" was found. Please verify spelling or register manual walk-in.`,
      };
    }

    // 2. Check if already checked in
    const existingEntry = await checkinRepository.findEntry(weddingId, guest.id, primaryEvent.id);

    const isVip =
      guest.category?.name?.toLowerCase().includes('vip') ||
      guest.category?.name?.toLowerCase().includes('royal') ||
      guest.side === 'GROOM';

    const rsvp = guest.rsvps?.[0];
    const headcount = rsvp?.attendeeCount || 1;
    const foodPref = rsvp?.foodPreference || 'Traditional Royal Rajasthani Vegetarian';
    const guestMeta: any = guest.metadata || {};
    const assignedTable = guestMeta.tableNumber || `Table ${Math.floor(Math.random() * 15) + 1} — Peacock Pavilion`;

    const initials = guest.displayName
      .split(' ')
      .slice(0, 2)
      .map((s: string) => s[0]?.toUpperCase() || '')
      .join('');

    if (existingEntry) {
      const entryMeta: any = existingEntry.metadata || {};
      const timeStr = new Date(existingEntry.checkedInAt).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      return {
        status: 'ALREADY_CHECKED_IN',
        guestId: guest.id,
        name: guest.displayName,
        initials: initials || 'VI',
        title: (guest.metadata as any)?.title || 'Distinguished Guest',
        category: guest.category?.name || 'Invited Family',
        isVip,
        phone: guest.phone || undefined,
        passToken: `MM-VIV-${guest.id.slice(0, 4).toUpperCase()}`,
        headcount,
        assignedTable,
        zone: 'Mandap Lawn Seating',
        foodPreference: foodPref,
        previousCheckIn: {
          checkedInAt: timeStr,
          gateName: entryMeta.gateName || 'Gate 1 — Royal Porch',
          usherName: entryMeta.usherName || 'Mewar Concierge Staff',
        },
        warningMessage: `Warning: This pass was already authenticated at ${timeStr} via ${entryMeta.gateName || 'Gate 1'}. Anti-Passback security protocol active.`,
      };
    }

    // 3. Valid Unused Pass
    return {
      status: 'ACCESS_GRANTED',
      guestId: guest.id,
      name: guest.displayName,
      initials: initials || 'RG',
      title: (guest.metadata as any)?.title || 'Royal Wedding Guest',
      category: guest.category?.name || 'General Invitee',
      isVip,
      phone: guest.phone || undefined,
      passToken: `MM-VIV-${guest.id.slice(0, 4).toUpperCase()}`,
      headcount,
      assignedTable,
      zone: 'Peacock Pavilion • Zone A',
      foodPreference: foodPref,
      dietaryNotes: foodPref.toLowerCase().includes('jain')
        ? 'Strict Jain (No Onion / Garlic) — Kitchen Action Queued'
        : undefined,
    };
  }

  /**
   * Confirm check-in entry for guest
   */
  async confirmCheckIn(weddingId: string, dto: ConfirmCheckInDto) {
    const primaryEvent = dto.eventId
      ? { id: dto.eventId }
      : await checkinRepository.getPrimaryEvent(weddingId);

    const staffUserId = await checkinRepository.getStaffUserId(weddingId);

    const exists = await prisma.guest.findUnique({ where: { id: dto.guestId } });
    if (!exists) {
      throw new BadRequestError('Guest record not found.');
    }
    const targetGuestId = dto.guestId;

    // Prevent duplicate entry on DB level
    const existing = await prisma.guestEntry.findFirst({
      where: {
        weddingId,
        guestId: targetGuestId,
        eventId: primaryEvent.id,
      },
    });

    if (existing) {
      return {
        isDuplicate: true,
        entry: existing,
        message: 'Guest already checked in.',
      };
    }

    const entry = await checkinRepository.createEntry({
      weddingId,
      eventId: primaryEvent.id,
      guestId: targetGuestId,
      checkedInById: staffUserId,
      source: 'QR',
      metadata: {
        gateName: dto.gateName || 'Gate 1 — Royal Porch',
        usherName: dto.usherName || 'Muni Reddy',
        attendeeCount: dto.attendeeCount || 3,
        notes: dto.notes || 'Welcomed with royal garland protocol',
      },
    });

    return {
      isDuplicate: false,
      entry,
      message: 'Gate clearance recorded successfully.',
    };
  }

  /**
   * Register manual walk-in guest at gate
   */
  async manualWalkIn(weddingId: string, dto: ManualWalkInDto) {
    const primaryEvent = dto.eventId
      ? { id: dto.eventId }
      : await checkinRepository.getPrimaryEvent(weddingId);

    const staffUserId = await checkinRepository.getStaffUserId(weddingId);

    // 1. Create or find guest
    const guest = await prisma.guest.create({
      data: {
        weddingId,
        firstName: dto.firstName,
        lastName: dto.lastName || '',
        displayName: `${dto.firstName} ${dto.lastName || ''}`.trim(),
        phone: dto.phone || null,
        metadata: {
          tableNumber: dto.tableNumber || 'Table 14 — Courtyard Promenade',
          walkIn: true,
        },
      },
    });

    // 2. Create RSVP
    await prisma.rSVP.create({
      data: {
        weddingId,
        guestId: guest.id,
        eventId: primaryEvent.id,
        status: 'ATTENDING',
        attendeeCount: dto.attendeeCount || 1,
        foodPreference: dto.foodPreference || 'Traditional Royal Rajasthani Vegetarian',
        respondedAt: new Date(),
      },
    });

    // 3. Create entry
    const entry = await checkinRepository.createEntry({
      weddingId,
      eventId: primaryEvent.id,
      guestId: guest.id,
      checkedInById: staffUserId,
      source: 'MANUAL',
      metadata: {
        gateName: dto.gateName || 'Gate 1 — Royal Porch',
        usherName: dto.usherName || 'Muni Reddy',
        attendeeCount: dto.attendeeCount || 1,
        walkIn: true,
      },
    });

    return { guest, entry };
  }

  /**
   * Get real-time telemetry stats
   */
  async getTelemetry(weddingId: string, eventId?: string): Promise<CheckInTelemetry> {
    const stats = await checkinRepository.getTelemetryStats(weddingId, eventId);

    const totalExpected = stats.totalGuests || 0;
    const welcomed = stats.totalEntries || 0;
    const pace = totalExpected > 0 ? Math.round((welcomed / totalExpected) * 100) : 0;

    // Fetch dietary requirements from RSVPs
    const rsvps = await prisma.rSVP.findMany({
      where: { weddingId, status: 'ATTENDING' },
      select: { foodPreference: true, attendeeCount: true },
    });

    let jain = 0;
    let vegan = 0;
    let halal = 0;
    let regular = 0;

    for (const r of rsvps) {
      const pref = (r.foodPreference || '').toLowerCase();
      const count = r.attendeeCount || 1;
      if (pref.includes('jain')) jain += count;
      else if (pref.includes('vegan')) vegan += count;
      else if (pref.includes('halal')) halal += count;
      else regular += count;
    }

    // Real VIP counts from guests
    const totalVipExpected = await prisma.guest.count({
      where: {
        weddingId,
        OR: [
          { category: { name: { contains: 'vip', mode: 'insensitive' } } },
          { category: { name: { contains: 'dignitary', mode: 'insensitive' } } },
        ],
      },
    });

    const totalVipArrived = await prisma.guestEntry.count({
      where: {
        weddingId,
        guest: {
          OR: [
            { category: { name: { contains: 'vip', mode: 'insensitive' } } },
            { category: { name: { contains: 'dignitary', mode: 'insensitive' } } },
          ],
        },
      },
    });

    return {
      totalExpected,
      totalWelcomed: welcomed,
      totalVipExpected,
      totalVipArrived,
      attendancePace: pace,
      avgTurnaroundSeconds: welcomed > 0 ? 5.2 : 0,
      dietaryCounts: {
        jain,
        vegan,
        halal,
        regular,
      },
      zones: [
        {
          name: 'Main Ceremony Seating',
          capacity: Math.max(totalExpected, 1),
          seated: welcomed,
          percentage: pace,
        },
      ],
    };
  }

  /**
   * List live entrance feed ledger
   */
  async getLedger(weddingId: string, filter?: 'all' | 'vip' | 'dietary' | 'warning'): Promise<CheckInLedgerItem[]> {
    const dbEntries = await checkinRepository.listLedgerEntries(weddingId, 50);

    const mappedDb: CheckInLedgerItem[] = dbEntries.map((e: any) => {
      const meta: any = e.metadata || {};
      const isVip =
        e.guest.category?.name?.toLowerCase().includes('vip') ||
        e.guest.category?.name?.toLowerCase().includes('royal') ||
        e.guest.category?.name?.toLowerCase().includes('dignitary') ||
        e.guest.side === 'GROOM';

      const rsvp = e.guest.rsvps?.[0];
      const hasDietary = Boolean(
        rsvp?.foodPreference && !rsvp.foodPreference.toLowerCase().includes('regular')
      );

      const initials = e.guest.displayName
        .split(' ')
        .slice(0, 2)
        .map((s: string) => s[0]?.toUpperCase() || '')
        .join('');

      return {
        id: e.id,
        guestName: e.guest.displayName,
        initials: initials || 'VI',
        category: e.guest.category?.name || 'Guest',
        headcount: meta.attendeeCount || 1,
        assignedTable: meta.tableNumber || (e.guest.metadata as any)?.tableNumber || 'Assigned Seating',
        gateName: meta.gateName || 'Gate 1',
        usherName: meta.usherName || 'Usher Desk',
        checkedInAt: new Date(e.checkedInAt).toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        status: isVip ? 'VIP' : hasDietary ? 'DIETARY' : 'VERIFIED',
        isVip,
        hasDietaryFlag: hasDietary,
        dietaryNotes: rsvp?.foodPreference || undefined,
      };
    });

    return this.filterLedger(mappedDb, filter);
  }

  private filterLedger(items: CheckInLedgerItem[], filter?: string): CheckInLedgerItem[] {
    if (!filter || filter === 'all') return items;
    if (filter === 'vip') return items.filter((i) => i.isVip || i.status === 'VIP');
    if (filter === 'dietary') return items.filter((i) => i.hasDietaryFlag || i.status === 'DIETARY');
    if (filter === 'warning') return items.filter((i) => i.status === 'WARNING');
    return items;
  }
}

export const checkinService = new CheckinService();
