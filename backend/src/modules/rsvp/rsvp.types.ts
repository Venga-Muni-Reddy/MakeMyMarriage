export type RsvpStatusType =
  | 'PENDING'
  | 'ATTENDING'
  | 'NOT_ATTENDING'
  | 'MAYBE'
  | 'AWAITING'
  | 'DECLINED';

export type DietaryType =
  | 'PURE_VEG'
  | 'JAIN'
  | 'NON_VEG'
  | 'VEGAN'
  | 'GLUTEN_FREE'
  | 'OTHER';

export interface CeremonyRsvpInput {
  eventId: string;
  status: RsvpStatusType;
  attendeeCount?: number;
}

export interface PublicRsvpSubmissionDTO {
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

export interface ManualRsvpSubmissionDTO extends PublicRsvpSubmissionDTO {
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
