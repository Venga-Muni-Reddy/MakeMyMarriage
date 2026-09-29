import api from './api';

export interface CompanionPax {
  name: string;
  relation: string;
  dietary?: string;
  dietaryNote?: string;
}

export interface GuestCategory {
  id: string;
  weddingId: string;
  name: string;
  _count?: {
    guests: number;
  };
}

export interface GuestEventAccess {
  id: string;
  guestId: string;
  eventId: string;
  invitationStatus: string;
  accessStatus: string;
  event: {
    id: string;
    name: string;
    startAt: string;
    settings?: Record<string, any>;
  };
}

export interface RoyalGuest {
  id: string;
  weddingId: string;
  categoryId?: string | null;
  firstName: string;
  lastName?: string | null;
  displayName: string;
  email?: string | null;
  phone?: string | null;
  side: 'BRIDE' | 'GROOM' | 'BOTH' | 'NEUTRAL';
  notes?: string | null;
  metadata?: {
    honorific?: string;
    householdName?: string;
    householdRole?: 'HEAD' | 'SPOUSE' | 'CHILD' | 'COMPANION' | 'SOLO';
    paxCount?: number;
    companions?: CompanionPax[];
    dietary?: 'JAIN' | 'PURE_VEG' | 'NON_VEG' | 'VEGAN' | 'GLUTEN_FREE' | 'CUSTOM';
    dietaryLabel?: string;
    allergies?: string;
    city?: string;
    allocatedSuite?: string;
    rsvpStatus?: 'ATTENDING' | 'AWAITING' | 'DECLINED';
    rsvpPax?: number;
    qrPassCode?: string;
    [key: string]: any;
  };
  category?: GuestCategory | null;
  guestEvents?: GuestEventAccess[];
  createdAt: string;
  updatedAt: string;
}

export interface GuestTelemetry {
  totalGuests: number;
  totalHouseholds: number;
  archivedHouseholds?: number;
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

export interface GuestListResponse {
  items: RoyalGuest[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  telemetry: GuestTelemetry;
  categories: GuestCategory[];
}

export interface CreateGuestPayload {
  firstName: string;
  lastName?: string;
  displayName?: string;
  email?: string;
  phone?: string;
  side?: 'BRIDE' | 'GROOM' | 'BOTH' | 'NEUTRAL';
  categoryId?: string | null;
  categoryName?: string;
  notes?: string;
  honorific?: string;
  householdName?: string;
  householdRole?: string;
  paxCount?: number;
  companions?: CompanionPax[];
  dietary?: string;
  dietaryLabel?: string;
  allergies?: string;
  city?: string;
  allocatedSuite?: string;
  rsvpStatus?: 'ATTENDING' | 'AWAITING' | 'DECLINED';
  eventIds?: string[];
  metadata?: Record<string, any>;
}

export const guestService = {
  async getGuests(weddingId: string, params: Record<string, any> = {}): Promise<GuestListResponse> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 'ALL') {
        query.append(k, String(v));
      }
    });

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res: any = await api.get(`/weddings/${weddingId}/guests${queryString}`);
    return res.data;
  },

  async getGuest(weddingId: string, guestId: string): Promise<RoyalGuest> {
    const res: any = await api.get(`/weddings/${weddingId}/guests/${guestId}`);
    return res.data;
  },

  async createGuest(weddingId: string, payload: CreateGuestPayload): Promise<RoyalGuest> {
    const res: any = await api.post(`/weddings/${weddingId}/guests`, payload);
    return res.data;
  },

  async updateGuest(
    weddingId: string,
    guestId: string,
    payload: Partial<CreateGuestPayload>
  ): Promise<RoyalGuest> {
    const res: any = await api.patch(`/weddings/${weddingId}/guests/${guestId}`, payload);
    return res.data;
  },

  async deleteGuest(weddingId: string, guestId: string): Promise<void> {
    await api.delete(`/weddings/${weddingId}/guests/${guestId}`);
  },

  async unarchiveGuest(weddingId: string, guestId: string): Promise<void> {
    await api.post(`/weddings/${weddingId}/guests/${guestId}/unarchive`);
  },

  async bulkAction(
    weddingId: string,
    payload: {
      guestIds: string[];
      action: 'ASSIGN_CEREMONY' | 'UPDATE_DIETARY' | 'ARCHIVE' | 'UNARCHIVE' | 'DISPATCH_WHATSAPP';
      eventId?: string;
      dietary?: string;
    }
  ): Promise<any> {
    const res: any = await api.post(`/weddings/${weddingId}/guests/bulk`, payload);
    return res.data;
  },

  async getCategories(weddingId: string): Promise<GuestCategory[]> {
    const res: any = await api.get(`/weddings/${weddingId}/guests/categories`);
    return res.data || [];
  },

  async createCategory(weddingId: string, name: string): Promise<GuestCategory> {
    const res: any = await api.post(`/weddings/${weddingId}/guests/categories`, { name });
    return res.data;
  },

  async getTelemetry(weddingId: string): Promise<GuestTelemetry> {
    const res: any = await api.get(`/weddings/${weddingId}/guests/telemetry`);
    return res.data;
  },

  async downloadExportCsv(weddingId: string): Promise<void> {
    const res = await api.get(`/weddings/${weddingId}/guests/export`, {
      responseType: 'blob',
    });
    const blob = new Blob([res.data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `royal_guest_manifesto_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};
