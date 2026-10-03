import { LiveStreamProvider, LiveStreamStatus } from '@prisma/client';

export interface CreateStreamDto {
  eventId?: string;
  title: string;
  provider?: LiveStreamProvider;
  streamUrl: string;
  embedUrl?: string;
  status?: LiveStreamStatus;
  privacy?: 'PUBLIC' | 'PRIVATE';
  passcode?: string;
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
