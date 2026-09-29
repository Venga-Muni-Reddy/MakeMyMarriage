export type GuestSideType = 'BRIDE' | 'GROOM' | 'BOTH' | 'NEUTRAL';
export type GuestRsvpStatusType = 'ATTENDING' | 'AWAITING' | 'DECLINED';
export type DietaryOption = 'JAIN' | 'PURE_VEG' | 'NON_VEG' | 'VEGAN' | 'GLUTEN_FREE' | 'CUSTOM';

export interface CompanionPax {
  name: string;
  relation: string;
  dietary?: string;
  dietaryNote?: string;
}

export interface GuestMetadata {
  honorific?: string;
  householdName?: string;
  householdRole?: 'HEAD' | 'SPOUSE' | 'CHILD' | 'COMPANION' | 'SOLO';
  paxCount?: number;
  companions?: CompanionPax[];
  dietary?: DietaryOption;
  dietaryLabel?: string;
  allergies?: string;
  city?: string;
  allocatedSuite?: string;
  rsvpStatus?: GuestRsvpStatusType;
  rsvpPax?: number;
  qrPassCode?: string;
  [key: string]: any;
}

export interface CreateGuestDTO {
  firstName: string;
  lastName?: string;
  displayName?: string;
  email?: string;
  phone?: string;
  side?: GuestSideType;
  categoryId?: string | null;
  categoryName?: string;
  notes?: string;
  honorific?: string;
  householdName?: string;
  householdRole?: string;
  paxCount?: number;
  companions?: CompanionPax[];
  dietary?: DietaryOption;
  dietaryLabel?: string;
  allergies?: string;
  city?: string;
  allocatedSuite?: string;
  rsvpStatus?: GuestRsvpStatusType;
  eventIds?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateGuestDTO {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  email?: string;
  phone?: string;
  side?: GuestSideType;
  categoryId?: string | null;
  notes?: string;
  honorific?: string;
  householdName?: string;
  householdRole?: string;
  paxCount?: number;
  companions?: CompanionPax[];
  dietary?: DietaryOption;
  dietaryLabel?: string;
  allergies?: string;
  city?: string;
  allocatedSuite?: string;
  rsvpStatus?: GuestRsvpStatusType;
  eventIds?: string[];
  metadata?: Record<string, any>;
}

export interface GuestQueryFilters {
  page?: number;
  limit?: number;
  search?: string;
  side?: string;
  categoryId?: string;
  rsvpStatus?: string;
  eventId?: string;
  isArchived?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface GuestTelemetry {
  totalGuests: number;
  totalHouseholds: number;
  archivedHouseholds: number;
  capacityPercentage: number;
  confirmedAttending: number;
  awaitingResponse: number;
  regretfullyDeclined: number;
  attendingPercentage: number;
  dietarySplit: {
    pureVeg: number;
    jainSaatvik: number;
    nonVeg: number;
    allergies: number;
  };
  mandapAccessCount: number;
  mandapHouseholdsCount?: number;
  mandapUnassignedHouseholdsCount?: number;
  haldiAccessCount: number;
  receptionAccessCount: number;
}
