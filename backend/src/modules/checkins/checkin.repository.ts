import prisma from '../../infrastructure/prisma/client';
import { CheckInSource } from '@prisma/client';

export class CheckinRepository {
  /**
   * Find guest by token, phone, or manual identifier
   */
  async findGuestForScan(weddingId: string, identifier: string) {
    const cleanId = identifier.trim();
    const tokenPart = cleanId.replace(/^MM-VIV-/i, '').replace(/^tok_/i, '').trim();

    // 1. Try finding by InvitationAccess tokenHash
    const invitationAccess = await prisma.invitationAccess.findFirst({
      where: {
        invitation: { weddingId },
        tokenHash: { contains: tokenPart, mode: 'insensitive' },
      },
      include: {
        invitation: {
          include: {
            guest: {
              include: {
                category: true,
                rsvps: true,
                guestEntries: true,
              },
            },
          },
        },
      },
    });

    if (invitationAccess?.invitation?.guest) {
      return invitationAccess.invitation.guest;
    }

    // 2. Try finding by phone or ID or name
    return prisma.guest.findFirst({
      where: {
        weddingId,
        OR: [
          { id: cleanId },
          { phone: { contains: cleanId } },
          { displayName: { contains: cleanId, mode: 'insensitive' } },
          { firstName: { contains: cleanId, mode: 'insensitive' } },
        ],
      },
      include: {
        category: true,
        rsvps: true,
        guestEntries: true,
      },
    });
  }

  /**
   * Find an existing check-in entry for guest & event
   */
  async findEntry(weddingId: string, guestId: string, eventId: string) {
    return prisma.guestEntry.findFirst({
      where: {
        weddingId,
        guestId,
        eventId,
      },
      include: {
        checkedInBy: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Find any check-in entry for guest across wedding ceremonies (within recent time window)
   */
  async findRecentEntryForGuest(weddingId: string, guestId: string) {
    return prisma.guestEntry.findFirst({
      where: {
        weddingId,
        guestId,
      },
      orderBy: {
        checkedInAt: 'desc',
      },
      include: {
        event: true,
        checkedInBy: true,
      },
    });
  }

  /**
   * Create check-in entry
   */
  async createEntry(data: {
    weddingId: string;
    eventId: string;
    guestId: string;
    checkedInById: string;
    source?: CheckInSource;
    metadata?: any;
  }) {
    return prisma.guestEntry.create({
      data: {
        weddingId: data.weddingId,
        eventId: data.eventId,
        guestId: data.guestId,
        checkedInById: data.checkedInById,
        source: data.source || 'QR',
        metadata: data.metadata || {},
      },
      include: {
        guest: {
          include: { category: true },
        },
        event: true,
        checkedInBy: true,
      },
    });
  }

  /**
   * List recent check-in ledger entries
   */
  async listLedgerEntries(weddingId: string, limit = 50) {
    return prisma.guestEntry.findMany({
      where: { weddingId },
      orderBy: { checkedInAt: 'desc' },
      take: limit,
      include: {
        guest: {
          include: { category: true, rsvps: true },
        },
        event: true,
      },
    });
  }

  /**
   * Get primary event for wedding if eventId not specified
   */
  async getPrimaryEvent(weddingId: string) {
    const event = await prisma.event.findFirst({
      where: { weddingId },
      orderBy: { startAt: 'asc' },
    });
    if (event) return event;

    // Create a default Muhurtham ceremony if none exists
    return prisma.event.create({
      data: {
        weddingId,
        name: 'Sacred Muhurtham',
        startAt: new Date(),
        endAt: new Date(Date.now() + 4 * 3600 * 1000),
        description: 'Primary Vedic Vivaha Ceremony',
      },
    });
  }

  /**
   * Find wedding host/admin user for check-in records
   */
  async getStaffUserId(weddingId: string): Promise<string> {
    const wedding = await prisma.wedding.findUnique({
      where: { id: weddingId },
      select: { ownerId: true },
    });
    if (wedding?.ownerId) return wedding.ownerId;

    const anyUser = await prisma.user.findFirst();
    if (anyUser) return anyUser.id;

    // Fallback creates minimal system user
    const sysUser = await prisma.user.create({
      data: {
        email: 'concierge@makemymarriage.internal',
        name: 'Concierge Staff',
        passwordHash: 'system_gate_concierge',
      },
    });
    return sysUser.id;
  }

  /**
   * Aggregate telemetry statistics
   */
  async getTelemetryStats(weddingId: string, eventId?: string) {
    const [totalGuests, totalEntries, rsvps, categories] = await Promise.all([
      prisma.guest.count({ where: { weddingId, deletedAt: null } }),
      prisma.guestEntry.count({
        where: {
          weddingId,
          ...(eventId ? { eventId } : {}),
        },
      }),
      prisma.rSVP.findMany({
        where: { weddingId },
        select: { foodPreference: true, attendeeCount: true },
      }),
      prisma.guestCategory.findMany({
        where: { weddingId },
        include: { _count: { select: { guests: true } } },
      }),
    ]);

    return { totalGuests, totalEntries, rsvps, categories };
  }
}

export const checkinRepository = new CheckinRepository();
