import api from './api';

export interface CreateWeddingPayload {
  partner1Name: string;
  partner2Name: string;
  title?: string;
  slug?: string;
  startDate?: string;
  endDate?: string;
  timezone?: string;
  primaryVenueName?: string;
  primaryCity?: string;
  themePalette?: 'gold' | 'rose' | 'amber';
  settings?: Record<string, any>;
}

export interface Wedding {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  description?: string | null;
  weddingDate?: string | null;
  timezone: string;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED' | 'DELETED';
  visibility: 'PRIVATE' | 'PUBLIC';
  settings: {
    partner1Name?: string;
    partner2Name?: string;
    themePalette?: 'gold' | 'rose' | 'amber';
    primaryCity?: string;
    primaryVenueName?: string;
    isMultiDay?: boolean;
    [key: string]: any;
  };
  userRole?: string;
  createdAt: string;
  updatedAt: string;
  venues?: any[];
  members?: any[];
}

export interface SlugCheckResponse {
  available: boolean;
  slug: string;
  message: string;
}

export interface WeddingMemberItem {
  id: string;
  weddingId: string;
  userId: string;
  roleId: string;
  status: 'INVITED' | 'ACTIVE' | 'SUSPENDED' | 'REMOVED';
  joinedAt?: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    preferredLanguage?: string;
  };
  role: {
    id: string;
    name: string;
    description?: string;
  };
}

export const weddingService = {
  async getWeddings(): Promise<Wedding[]> {
    const res: any = await api.get('/weddings');
    return res.data || [];
  },

  async getWedding(id: string): Promise<Wedding> {
    const res: any = await api.get(`/weddings/${id}`);
    return res.data;
  },

  async createWedding(payload: CreateWeddingPayload): Promise<Wedding> {
    const res: any = await api.post('/weddings', payload);
    return res.data;
  },

  async checkSlug(slug: string): Promise<SlugCheckResponse> {
    const res: any = await api.get(`/weddings/check-slug?slug=${encodeURIComponent(slug)}`);
    return res.data;
  },

  async updateWedding(id: string, payload: Partial<CreateWeddingPayload>): Promise<Wedding> {
    const res: any = await api.patch(`/weddings/${id}`, payload);
    return res.data;
  },

  async deleteWedding(id: string): Promise<void> {
    await api.delete(`/weddings/${id}`);
  },

  async getMembers(weddingId: string): Promise<WeddingMemberItem[]> {
    const res: any = await api.get(`/weddings/${weddingId}/members`);
    return res?.data ?? (Array.isArray(res) ? res : []);
  },

  async assignMemberRole(
    weddingId: string,
    email: string,
    role: string
  ): Promise<WeddingMemberItem> {
    const res: any = await api.post(`/weddings/${weddingId}/members`, { email, role });
    return res?.data ?? res;
  },

  async acceptInvitation(weddingId: string): Promise<any> {
    const res: any = await api.post(`/weddings/${weddingId}/members/accept`);
    return res?.data ?? res;
  },
};
