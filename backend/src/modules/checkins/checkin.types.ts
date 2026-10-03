import { CheckInSource } from '@prisma/client';

export interface ScanPassDto {
  qrToken?: string;
  phone?: string;
  manualCode?: string;
  eventId?: string;
  gateName?: string;
  usherName?: string;
}

export interface ConfirmCheckInDto {
  guestId: string;
  eventId?: string;
  attendeeCount?: number;
  gateName?: string;
  usherName?: string;
  notes?: string;
}

export interface ManualWalkInDto {
  firstName: string;
  lastName?: string;
  phone?: string;
  category?: string;
  tableNumber?: string;
  attendeeCount?: number;
  foodPreference?: string;
  eventId?: string;
  gateName?: string;
  usherName?: string;
}

export type ScanStatus = 'ACCESS_GRANTED' | 'ALREADY_CHECKED_IN' | 'NOT_INVITED' | 'INVALID_TOKEN';

export interface GuestVerificationDossier {
  status: ScanStatus;
  guestId: string;
  name: string;
  initials: string;
  title?: string;
  category: string;
  isVip: boolean;
  phone?: string;
  passToken: string;
  headcount: number;
  companions?: string[];
  assignedTable: string;
  zone: string;
  foodPreference?: string;
  dietaryNotes?: string;
  previousCheckIn?: {
    checkedInAt: string;
    gateName: string;
    usherName: string;
  };
  warningMessage?: string;
}

export interface CheckInTelemetry {
  totalExpected: number;
  totalWelcomed: number;
  totalVipExpected: number;
  totalVipArrived: number;
  attendancePace: number;
  avgTurnaroundSeconds: number;
  dietaryCounts: {
    jain: number;
    vegan: number;
    halal: number;
    regular: number;
  };
  zones: {
    name: string;
    capacity: number;
    seated: number;
    percentage: number;
  }[];
}

export interface CheckInLedgerItem {
  id: string;
  guestName: string;
  initials: string;
  category: string;
  headcount: number;
  assignedTable: string;
  gateName: string;
  usherName: string;
  checkedInAt: string;
  status: 'VERIFIED' | 'VIP' | 'DIETARY' | 'WARNING';
  isVip: boolean;
  hasDietaryFlag: boolean;
  dietaryNotes?: string;
  warningNote?: string;
}
