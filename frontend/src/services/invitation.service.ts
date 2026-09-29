import api from './api';

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
  activeEventIds?: string[];
  customMonogramText?: string;
}

export interface HouseholdInvitation {
  id: string;
  weddingId: string;
  guestId: string;
  templateId?: string | null;
  status: 'DRAFT' | 'QUEUED' | 'SENT' | 'DELIVERED' | 'OPENED' | 'REVOKED' | 'FAILED';
  sentAt?: string | null;
  deliveredAt?: string | null;
  openedAt?: string | null;
  lastSentAt?: string | null;
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

export const invitationService = {
  async getInvitations(
    weddingId: string,
    filters?: { search?: string; status?: string }
  ): Promise<HouseholdInvitation[]> {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status && filters.status !== 'ALL') params.append('status', filters.status);

    const res: any = await api.get(`/weddings/${weddingId}/invitations?${params.toString()}`);
    return res?.data ?? (Array.isArray(res) ? res : []);
  },

  async getTelemetry(weddingId: string): Promise<InvitationTelemetry> {
    const res: any = await api.get(`/weddings/${weddingId}/invitations/telemetry`);
    return res?.data ?? res;
  },

  async getSettings(weddingId: string): Promise<InvitationStudioSettings> {
    const res: any = await api.get(`/weddings/${weddingId}/invitations/settings`);
    return res?.data ?? res;
  },

  async updateSettings(
    weddingId: string,
    data: Partial<InvitationStudioSettings>
  ): Promise<InvitationStudioSettings> {
    const res: any = await api.put(`/weddings/${weddingId}/invitations/settings`, data);
    return res?.data ?? res;
  },

  async dispatchSingle(
    weddingId: string,
    invitationId: string,
    channel: 'WHATSAPP' | 'SMS' | 'EMAIL' = 'WHATSAPP',
    customNote?: string
  ) {
    const res: any = await api.post(`/weddings/${weddingId}/invitations/${invitationId}/dispatch`, {
      channel,
      customNote,
    });
    return res?.data ?? res;
  },

  async bulkDispatch(
    weddingId: string,
    invitationIds: string[],
    channel: 'WHATSAPP' | 'SMS' | 'EMAIL' = 'WHATSAPP'
  ) {
    const res: any = await api.post(`/weddings/${weddingId}/invitations/bulk-dispatch`, {
      invitationIds,
      channel,
    });
    return res?.data ?? res;
  },

  async getThemes(weddingId: string): Promise<HeritageTheme[]> {
    const res: any = await api.get(`/weddings/${weddingId}/invitations/themes`);
    return res?.data ?? (Array.isArray(res) ? res : []);
  },

  async getSoundscapes(weddingId: string): Promise<SoundscapeRaga[]> {
    const res: any = await api.get(`/weddings/${weddingId}/invitations/soundscapes`);
    return res?.data ?? (Array.isArray(res) ? res : []);
  },

  async getPublicPass(token: string): Promise<PublicInvitationPass> {
    const res: any = await api.get(`/public/invitations/${token}`);
    return res?.data ?? res;
  },
};
