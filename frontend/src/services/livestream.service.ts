import api from './api';

export type LiveStreamStatus = 'SCHEDULED' | 'LIVE' | 'ENDED' | 'DISABLED';
export type LiveStreamProvider = 'YOUTUBE' | 'VIMEO' | 'CUSTOM' | 'OTHER';

export interface ChatMessageItem {
  id: string;
  authorName: string;
  location: string;
  time: string;
  message: string;
  isFamily?: boolean;
  isPinned?: boolean;
}

export interface RitualMilestoneItem {
  id: number;
  name: string;
  time: string;
  status: 'COMPLETED' | 'LIVE' | 'UPCOMING';
  detail?: string;
}

export interface LiveStreamTelemetry {
  status: LiveStreamStatus;
  resolution: string;
  fps: number;
  latencySeconds: number;
  viewerCount: number;
  petalsCount: number;
  viewerBreakdown: {
    us: number;
    uk: number;
    ca: number;
    ae: number;
    in: number;
  };
  privacy: 'PUBLIC' | 'PRIVATE';
  passcode: string;
}

export interface ActiveStreamResponse {
  id: string;
  weddingId: string;
  eventId: string;
  eventName: string;
  title: string;
  provider: LiveStreamProvider;
  streamUrl: string;
  embedUrl: string;
  status: LiveStreamStatus;
  activeCamera: string;
  currentRitual: string;
  activeVow: number;
  telemetry: LiveStreamTelemetry;
  pinnedBlessing: {
    quote: string;
    author: string;
    location: string;
    time: string;
  };
  chatMessages: ChatMessageItem[];
  rituals: RitualMilestoneItem[];
}

export interface UpdateStreamDto {
  status?: LiveStreamStatus;
  streamUrl?: string;
  embedUrl?: string;
  title?: string;
  activeCamera?: string;
  currentRitual?: string;
  activeVow?: number;
  privacy?: 'PUBLIC' | 'PRIVATE';
  passcode?: string;
}

export interface SendBlessingDto {
  authorName: string;
  location?: string;
  message: string;
  isFamily?: boolean;
}

export const livestreamService = {
  async getActiveStream(weddingId: string): Promise<ActiveStreamResponse> {
    const res = await api.get<{ data: ActiveStreamResponse }>(`/weddings/${weddingId}/livestreams/active`);
    return (res as any).data || (res as any);
  },

  async updateStream(weddingId: string, streamId: string, data: UpdateStreamDto): Promise<ActiveStreamResponse> {
    const res = await api.patch<{ data: ActiveStreamResponse }>(`/weddings/${weddingId}/livestreams/${streamId}`, data);
    return (res as any).data || (res as any);
  },

  async sendBlessing(weddingId: string, streamId: string, data: SendBlessingDto): Promise<{ message: ChatMessageItem; petalsCount: number }> {
    const res = await api.post<{ data: { message: ChatMessageItem; petalsCount: number } }>(`/weddings/${weddingId}/livestreams/${streamId}/blessings`, data);
    return (res as any).data || (res as any);
  },

  async showerPetals(weddingId: string, streamId: string, count: number = 25): Promise<{ petalsCount: number }> {
    const res = await api.post<{ data: { petalsCount: number } }>(`/weddings/${weddingId}/livestreams/${streamId}/petals`, { count });
    return (res as any).data || (res as any);
  },

  async listStreams(weddingId: string): Promise<any[]> {
    const res = await api.get<{ data: any[] }>(`/weddings/${weddingId}/livestreams`);
    return (res as any).data || (res as any);
  },
};
