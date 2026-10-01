import prisma from '../../infrastructure/prisma/client';
import {
  PublicRsvpSubmissionDTO,
  RsvpTelemetry,
  GuestRsvpResponseItem,
  RsvpStatusType,
} from './rsvp.types';
import { invitationRepository } from '../invitations/invitation.repository';

export const DIETARY_LABELS: Record<string, string> = {
  PURE_VEG: '🥦 Pure Vegetarian (Satvik)',
  JAIN: '🌿 Jain Saatvik (No Root/Garlic)',
  NON_VEG: '🍗 Standard Non-Vegetarian',
  VEGAN: '🌱 Vegan',
  GLUTEN_FREE: '🌾 Gluten-Free Veg',
  OTHER: 'Custom Dietary Note',
};

export class RsvpRepository {
  /**
   * Resolves guest and invitation context from a raw magicToken or qrPassCode
   */
  async resolveGuestByToken(token: string) {
    const pass = await invitationRepository.findByToken(token);
    if (!pass) return null;

    // Fetch existing RSVPs for this guest
    const rsvps = await prisma.rSVP.findMany({
      where: {
        weddingId: pass.weddingId,
        guestId: pass.guest.id,
      },
      include: {
        event: true,
      },
    });

    return {
      pass,
      rsvps,
    };
  }

  /**
   * Submits or updates an RSVP for a given guest
   */
  async submitRsvpForGuest(
    weddingId: string,
    guestId: string,
    data: PublicRsvpSubmissionDTO
  ) {
    const guest = await prisma.guest.findFirst({
      where: { id: guestId, weddingId, deletedAt: null },
      include: {
        guestEvents: {
          include: { event: true },
        },
      },
    });

    if (!guest) {
      throw new Error('Guest not found for this royal wedding workspace');
    }

    const {
      overallStatus,
      attendeeCount,
      foodPreference,
      allergies,
      accommodationRequired = false,
      transportationRequired = false,
      transportationDetails = '',
      message = '',
      ceremonyResponses = [],
    } = data;

    const dietaryLabel = foodPreference
      ? DIETARY_LABELS[foodPreference] || foodPreference
      : 'Pure Vegetarian';

    return prisma.$transaction(async (tx) => {
      // 1. Process individual ceremony RSVPs
      const now = new Date();
      const eventsToProcess =
        ceremonyResponses.length > 0
          ? ceremonyResponses
          : guest.guestEvents.map((ge) => ({
              eventId: ge.eventId,
              status: overallStatus,
              attendeeCount: overallStatus === 'ATTENDING' ? attendeeCount : 0,
            }));

      for (const cr of eventsToProcess) {
        await tx.rSVP.upsert({
          where: {
            guestId_eventId: {
              guestId,
              eventId: cr.eventId,
            },
          },
          update: {
            status: cr.status as any,
            attendeeCount: cr.status === 'ATTENDING' ? (cr.attendeeCount ?? attendeeCount) : 0,
            foodPreference: foodPreference || null,
            accommodationRequired: Boolean(accommodationRequired),
            transportationRequired: Boolean(transportationRequired),
            message: message || null,
            respondedAt: now,
          },
          create: {
            weddingId,
            guestId,
            eventId: cr.eventId,
            status: cr.status as any,
            attendeeCount: cr.status === 'ATTENDING' ? (cr.attendeeCount ?? attendeeCount) : 0,
            foodPreference: foodPreference || null,
            accommodationRequired: Boolean(accommodationRequired),
            transportationRequired: Boolean(transportationRequired),
            message: message || null,
            respondedAt: now,
          },
        });
      }

      // 2. Update guest metadata
      const existingMeta = (guest.metadata as Record<string, any>) || {};
      const updatedMeta = {
        ...existingMeta,
        rsvpStatus: overallStatus,
        rsvpPax: overallStatus === 'ATTENDING' ? attendeeCount : 0,
        paxCount: attendeeCount || Number(existingMeta.paxCount) || 1,
        dietary: foodPreference || existingMeta.dietary || 'PURE_VEG',
        dietaryLabel,
        allergies: allergies ?? existingMeta.allergies ?? '',
        accommodationRequired: Boolean(accommodationRequired),
        transportationRequired: Boolean(transportationRequired),
        transportationDetails: transportationDetails || existingMeta.transportationDetails || '',
        blessingMessage: message || existingMeta.blessingMessage || '',
        respondedAt: now.toISOString(),
      };

      await tx.guest.update({
        where: { id: guestId },
        data: { metadata: updatedMeta },
      });

      // 3. Update invitation status to opened/responded if exists
      await tx.invitation.updateMany({
        where: { guestId, weddingId },
        data: {
          openedAt: now,
        },
      });

      return {
        guestId,
        weddingId,
        overallStatus,
        attendeeCount,
        foodPreference,
        dietaryLabel,
        allergies,
        accommodationRequired,
        transportationRequired,
        message,
        respondedAt: now.toISOString(),
      };
    });
  }

  /**
   * Calculates comprehensive live RSVP telemetry & catering counts
   */
  async calculateTelemetry(weddingId: string): Promise<RsvpTelemetry> {
    const guests = await prisma.guest.findMany({
      where: { weddingId, deletedAt: null },
      include: {
        rsvps: {
          include: { event: true },
        },
      },
    });

    const events = await prisma.event.findMany({
      where: { weddingId, deletedAt: null },
      orderBy: { startAt: 'asc' },
      include: {
        venue: true,
        rsvps: true,
      },
    });

    let totalInvitedPax = 0;
    let confirmedPax = 0;
    let declinedPax = 0;
    let awaitingPax = 0;
    let respondedHouseholds = 0;

    const dietaryBreakdown = {
      pureVeg: 0,
      jain: 0,
      nonVeg: 0,
      vegan: 0,
      glutenFree: 0,
      other: 0,
    };

    let accommodationCount = 0;
    let transportationCount = 0;

    for (const g of guests) {
      const meta = (g.metadata as Record<string, any>) || {};
      const pax = Number(meta.paxCount) || 1;
      totalInvitedPax += pax;

      const rsvp = meta.rsvpStatus || 'AWAITING';
      if (rsvp === 'ATTENDING') {
        confirmedPax += Number(meta.rsvpPax) || pax;
        respondedHouseholds++;

        // Dietary counts for confirmed pax
        const d = (meta.dietary || 'PURE_VEG').toUpperCase();
        const confPax = Number(meta.rsvpPax) || pax;
        if (d.includes('JAIN')) dietaryBreakdown.jain += confPax;
        else if (d.includes('NON_VEG')) dietaryBreakdown.nonVeg += confPax;
        else if (d.includes('VEGAN')) dietaryBreakdown.vegan += confPax;
        else if (d.includes('GLUTEN')) dietaryBreakdown.glutenFree += confPax;
        else if (d.includes('PURE_VEG') || d.includes('VEG')) dietaryBreakdown.pureVeg += confPax;
        else dietaryBreakdown.other += confPax;

        if (meta.accommodationRequired) accommodationCount++;
        if (meta.transportationRequired) transportationCount++;
      } else if (rsvp === 'NOT_ATTENDING' || rsvp === 'DECLINED') {
        declinedPax += pax;
        respondedHouseholds++;
      } else {
        awaitingPax += pax;
      }
    }

    const totalHouseholds = guests.length;
    const responseRatePercentage =
      totalHouseholds > 0
        ? Math.round((respondedHouseholds / totalHouseholds) * 100)
        : 0;

    // Per-Ceremony Headcounts
    const ceremonyHeadcounts = events.map((ev) => {
      let attendingPax = 0;
      for (const r of ev.rsvps) {
        if (r.status === 'ATTENDING') {
          attendingPax += r.attendeeCount || 1;
        }
      }

      const isMandap =
        ev.name.toLowerCase().includes('vivaha') ||
        ev.name.toLowerCase().includes('mandap') ||
        ev.name.toLowerCase().includes('pher');

      return {
        eventId: ev.id,
        eventName: ev.name,
        startAt: ev.startAt.toISOString(),
        venueName: ev.venue?.name || (ev.settings as any)?.locationName || 'Palace Courtyard',
        attendingPax,
        isMandap,
      };
    });

    return {
      totalInvitedPax,
      confirmedPax,
      declinedPax,
      awaitingPax,
      totalHouseholds,
      respondedHouseholds,
      responseRatePercentage,
      ceremonyHeadcounts,
      dietaryBreakdown,
      hospitality: {
        accommodationCount,
        transportationCount,
      },
    };
  }

  /**
   * Lists all guest RSVP entries with filters for the organizer manifest table
   */
  async findMany(
    weddingId: string,
    filters?: { status?: string; search?: string; eventId?: string }
  ): Promise<GuestRsvpResponseItem[]> {
    const { status, search, eventId } = filters || {};

    const guests = await prisma.guest.findMany({
      where: {
        weddingId,
        deletedAt: null,
        ...(search
          ? {
              OR: [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { displayName: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        category: true,
        guestEvents: {
          include: { event: true },
        },
        rsvps: {
          include: { event: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const result: GuestRsvpResponseItem[] = [];

    for (const g of guests) {
      const meta = (g.metadata as Record<string, any>) || {};
      const overallStatus = (meta.rsvpStatus || 'AWAITING') as RsvpStatusType;

      // Filter by status if provided
      if (status && status !== 'ALL') {
        if (status === 'CONFIRMED' && overallStatus !== 'ATTENDING') continue;
        if (status === 'AWAITING' && overallStatus !== 'AWAITING' && overallStatus !== 'PENDING') continue;
        if (status === 'DECLINED' && overallStatus !== 'NOT_ATTENDING' && overallStatus !== 'DECLINED') continue;
        if (status === 'SPECIAL_DIETARY' && (meta.dietary === 'PURE_VEG' || !meta.dietary)) continue;
      }

      // Filter by event if provided
      if (eventId) {
        const hasEvent = g.rsvps.some((r) => r.eventId === eventId);
        if (!hasEvent) continue;
      }

      const ceremonyAttendance = g.guestEvents.map((ge) => {
        const matchingRsvp = g.rsvps.find((r) => r.eventId === ge.eventId);
        const ev = ge.event;
        const isMandap =
          ev.name.toLowerCase().includes('vivaha') ||
          ev.name.toLowerCase().includes('mandap') ||
          ev.name.toLowerCase().includes('pher');

        return {
          eventId: ev.id,
          eventName: ev.name,
          status: (matchingRsvp?.status || overallStatus || 'PENDING') as RsvpStatusType,
          attendeeCount: matchingRsvp?.attendeeCount || (overallStatus === 'ATTENDING' ? Number(meta.paxCount) || 1 : 0),
          isMandap,
        };
      });

      result.push({
        id: g.id,
        guestId: g.id,
        displayName: g.displayName,
        householdName: meta.householdName || `${g.lastName || g.firstName} Household`,
        side: g.side,
        categoryName: g.category?.name,
        phone: g.phone,
        email: g.email,
        overallStatus,
        paxCount: Number(meta.paxCount) || 1,
        rsvpPax: Number(meta.rsvpPax) || 0,
        dietary: meta.dietary || 'PURE_VEG',
        dietaryLabel: meta.dietaryLabel || DIETARY_LABELS[meta.dietary] || 'Pure Vegetarian',
        allergies: meta.allergies,
        accommodationRequired: Boolean(meta.accommodationRequired),
        transportationRequired: Boolean(meta.transportationRequired),
        transportationDetails: meta.transportationDetails,
        blessingMessage: meta.blessingMessage,
        respondedAt: meta.respondedAt,
        ceremonyAttendance,
      });
    }

    return result;
  }
}

export const rsvpRepository = new RsvpRepository();
