import api from './api';

export type RsvpStatusType = 'PENDING' | 'ATTENDING' | 'NOT_ATTENDING' | 'MAYBE' | 'AWAITING' | 'DECLINED';

export interface CeremonyRsvpInput {
  eventId: string;
  status: RsvpStatusType;
  attendeeCount?: number;
}

export interface PublicRsvpSubmissionPayload {
  overallStatus: RsvpStatusType;
  attendeeCount: number;
  foodPreference?: string;
  allergies?: string;
  accommodationRequired?: boolean;
  transportationRequired?: boolean;
  transportationDetails?: string;
  message?: string;
  ceremonyResponses?: CeremonyRsvpInput[];
}

export interface ManualRsvpPayload extends PublicRsvpSubmissionPayload {
  guestId: string;
}

export interface RsvpTelemetry {
  totalInvitedPax: number;
  confirmedPax: number;
  declinedPax: number;
  awaitingPax: number;
  totalHouseholds: number;
  respondedHouseholds: number;
  responseRatePercentage: number;
  ceremonyHeadcounts: {
    eventId: string;
    eventName: string;
    startAt: string;
    venueName: string;
    attendingPax: number;
    isMandap: boolean;
  }[];
  dietaryBreakdown: {
    pureVeg: number;
    jain: number;
    nonVeg: number;
    vegan: number;
    glutenFree: number;
    other: number;
  };
  hospitality: {
    accommodationCount: number;
    transportationCount: number;
  };
}

export interface GuestRsvpResponseItem {
  id: string;
  guestId: string;
  displayName: string;
  householdName: string;
  side: string;
  categoryName?: string;
  phone?: string | null;
  email?: string | null;
  overallStatus: RsvpStatusType;
  paxCount: number;
  rsvpPax: number;
  dietary: string;
  dietaryLabel: string;
  allergies?: string;
  accommodationRequired: boolean;
  transportationRequired: boolean;
  transportationDetails?: string;
  blessingMessage?: string;
  respondedAt?: string;
  ceremonyAttendance: {
    eventId: string;
    eventName: string;
    status: RsvpStatusType;
    attendeeCount: number;
    isMandap: boolean;
  }[];
}

export const rsvpService = {
  async getPublicRsvp(token: string) {
    const res: any = await api.get(`/public/invitations/${token}/rsvp`);
    return res?.data ?? res;
  },

  async submitPublicRsvp(token: string, payload: PublicRsvpSubmissionPayload) {
    const res: any = await api.post(`/public/invitations/${token}/rsvp`, payload);
    return res?.data ?? res;
  },

  async getRsvpTelemetry(weddingId: string): Promise<RsvpTelemetry> {
    const res: any = await api.get(`/weddings/${weddingId}/rsvps/telemetry`);
    return res?.data ?? res;
  },

  async getRsvps(
    weddingId: string,
    filters?: { status?: string; search?: string; eventId?: string }
  ): Promise<GuestRsvpResponseItem[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.search) params.set('search', filters.search);
    if (filters?.eventId) params.set('eventId', filters.eventId);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res: any = await api.get(`/weddings/${weddingId}/rsvps${qs}`);
    return res?.data ?? (Array.isArray(res) ? res : []);
  },

  async submitManualRsvp(weddingId: string, payload: ManualRsvpPayload) {
    const res: any = await api.post(`/weddings/${weddingId}/rsvps/manual`, payload);
    return res?.data ?? res;
  },
};
