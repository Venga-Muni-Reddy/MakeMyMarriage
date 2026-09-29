export interface HeritageTheme {
  id: string;
  name: string;
  subtitle: string;
  tagline: string;
  accentColor: string;
  bgGradient: string;
  parchmentBg: string;
  borderStyle: string;
  tags: string[];
}

export interface AuspiciousVerse {
  id: string;
  language: 'SANSKRIT' | 'ENGLISH' | 'HINDI' | 'TELUGU';
  title: string;
  verse: string;
  translation: string;
}

export interface SoundscapeRaga {
  id: string;
  title: string;
  artist: string;
  description: string;
  raga: string;
  duration: string;
  audioUrl?: string;
}

export interface InvitationStudioSettings {
  activeThemeId: string;
  verseLanguage: 'SANSKRIT' | 'ENGLISH' | 'HINDI' | 'TELUGU';
  verseText: string;
  verseFont: string;
  activeSoundscapeId: string;
  autoplaySoundscape: boolean;
  activeEventIds: string[];
  customMonogramText?: string;
}

export interface HouseholdInvitation {
  id: string;
  weddingId: string;
  guestId: string;
  templateId?: string | null;
  status: 'DRAFT' | 'QUEUED' | 'SENT' | 'DELIVERED' | 'OPENED' | 'REVOKED' | 'FAILED';
  sentAt?: Date | string | null;
  deliveredAt?: Date | string | null;
  openedAt?: Date | string | null;
  lastSentAt?: Date | string | null;
  magicToken: string;
  magicTokenUrl: string;
  guest: {
    id: string;
    firstName: string;
    lastName?: string | null;
    displayName: string;
    phone?: string | null;
    email?: string | null;
    side: string;
    category?: {
      id: string;
      name: string;
    } | null;
    metadata?: Record<string, any>;
    assignedEventIds: string[];
  };
}

export interface InvitationTelemetry {
  totalMinted: number;
  totalHouseholds: number;
  coveragePercentage: number;
  whatsappDispatchedCount: number;
  whatsappDispatchedPercentage: number;
  queuedCount: number;
  openedCount: number;
  openRatePercentage: number;
  securityStatus: {
    encryption: string;
    protocol: string;
    zeroPasswordActive: boolean;
  };
}

export interface PublicInvitationPass {
  invitationId: string;
  weddingId: string;
  weddingName: string;
  coupleNames: {
    brideName: string;
    groomName: string;
    monogram: string;
  };
  venueName: string;
  weddingDate?: string | null;
  theme: HeritageTheme;
  verse: {
    text: string;
    font: string;
  };
  soundscape: SoundscapeRaga | null;
  guest: {
    id: string;
    displayName: string;
    honorific?: string;
    householdName: string;
    paxCount: number;
    companions: Array<{ name: string; relation: string; dietary?: string }>;
    allocatedSuite?: string;
    dietary?: string;
    rsvpStatus: string;
    qrPassCode: string;
  };
  events: Array<{
    id: string;
    name: string;
    startAt: string;
    endAt?: string | null;
    venueName?: string;
    ritualType?: string;
    isMandap: boolean;
  }>;
}
