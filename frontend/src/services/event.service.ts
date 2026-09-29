import api from './api';

export interface RitualMilestone {
  time: string;
  title: string;
  description: string;
}

export interface WeddingEvent {
  id: string;
  weddingId: string;
  venueId?: string | null;
  name: string;
  description?: string | null;
  startAt: string;
  endAt: string;
  timezone: string;
  status: 'DRAFT' | 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  visibility: 'PUBLIC' | 'INVITED_GUESTS_ONLY' | 'PRIVATE';
  settings?: {
    ritualType?: string;
    isMuhurtham?: boolean;
    muhurthamTime?: string;
    locationName?: string;
    dressCode?: string;
    dressCodeColors?: string[];
    guestTier?: string;
    milestones?: RitualMilestone[];
    [key: string]: any;
  };
  venue?: any;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventPayload {
  name: string;
  description?: string;
  startAt: string;
  endAt: string;
  timezone?: string;
  venueId?: string;
  locationName?: string;
  dressCode?: string;
  dressCodeColors?: string[];
  status?: string;
  visibility?: string;
  settings?: Record<string, any>;
}

export const eventService = {
  async getEvents(weddingId: string): Promise<WeddingEvent[]> {
    const res: any = await api.get(`/weddings/${weddingId}/events`);
    return res.data || [];
  },

  async getEvent(weddingId: string, eventId: string): Promise<WeddingEvent> {
    const res: any = await api.get(`/weddings/${weddingId}/events/${eventId}`);
    return res.data;
  },

  async createEvent(weddingId: string, payload: CreateEventPayload): Promise<WeddingEvent> {
    const res: any = await api.post(`/weddings/${weddingId}/events`, payload);
    return res.data;
  },

  async updateEvent(
    weddingId: string,
    eventId: string,
    payload: Partial<CreateEventPayload>
  ): Promise<WeddingEvent> {
    const res: any = await api.patch(`/weddings/${weddingId}/events/${eventId}`, payload);
    return res.data;
  },

  async deleteEvent(weddingId: string, eventId: string): Promise<void> {
    await api.delete(`/weddings/${weddingId}/events/${eventId}`);
  },

  async seedTemplates(weddingId: string): Promise<WeddingEvent[]> {
    const res: any = await api.post(`/weddings/${weddingId}/events/templates`);
    return res.data || [];
  },
};
