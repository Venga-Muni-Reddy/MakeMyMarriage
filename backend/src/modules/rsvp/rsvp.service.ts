import { rsvpRepository } from './rsvp.repository';
import {
  PublicRsvpSubmissionDTO,
  ManualRsvpSubmissionDTO,
} from './rsvp.types';
import { NotFoundError, BadRequestError } from '../../shared/errors/api-error';

export class RsvpService {
  /**
   * Resolves guest and current RSVP status from a public token
   */
  async getPublicRsvp(token: string) {
    const resolved = await rsvpRepository.resolveGuestByToken(token);
    if (!resolved) {
      throw new NotFoundError('Invalid or expired royal invitation token');
    }

    const { pass, rsvps } = resolved;
    return {
      guest: pass.guest,
      events: pass.events,
      weddingName: pass.weddingName,
      coupleNames: pass.coupleNames,
      rsvps,
      currentRsvp: {
        status: pass.guest.rsvpStatus,
        paxCount: pass.guest.paxCount,
        dietary: pass.guest.dietary,
        allocatedSuite: pass.guest.allocatedSuite,
      },
    };
  }

  /**
   * Submits RSVP from public invitation page
   */
  async submitPublicRsvp(token: string, data: PublicRsvpSubmissionDTO) {
    const resolved = await rsvpRepository.resolveGuestByToken(token);
    if (!resolved) {
      throw new NotFoundError('Invalid or expired royal invitation token');
    }

    const { pass } = resolved;
    if (!data.overallStatus) {
      throw new BadRequestError('RSVP attendance status is required');
    }

    const attendeeCount = Math.max(1, Number(data.attendeeCount) || 1);

    return rsvpRepository.submitRsvpForGuest(pass.weddingId, pass.guest.id, {
      ...data,
      attendeeCount,
    });
  }

  /**
   * Calculates live telemetry for organizers
   */
  async getTelemetry(weddingId: string) {
    return rsvpRepository.calculateTelemetry(weddingId);
  }

  /**
   * Lists all guest RSVP entries with filters
   */
  async getRsvps(
    weddingId: string,
    filters?: { status?: string; search?: string; eventId?: string }
  ) {
    return rsvpRepository.findMany(weddingId, filters);
  }

  /**
   * Submits manual RSVP recorded by organizer/concierge
   */
  async submitManualRsvp(weddingId: string, data: ManualRsvpSubmissionDTO) {
    if (!data.guestId) {
      throw new BadRequestError('Guest ID is required for manual RSVP entry');
    }

    const attendeeCount = Math.max(1, Number(data.attendeeCount) || 1);
    return rsvpRepository.submitRsvpForGuest(weddingId, data.guestId, {
      ...data,
      attendeeCount,
    });
  }
}

export const rsvpService = new RsvpService();
