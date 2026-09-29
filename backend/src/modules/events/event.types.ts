export type EventStatusType = 'DRAFT' | 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
export type EventVisibilityType = 'PUBLIC' | 'INVITED_GUESTS_ONLY' | 'PRIVATE';

export interface RitualMilestone {
  time: string;
  title: string;
  description: string;
}

export interface CreateEventDTO {
  name: string;
  description?: string;
  startTime: string; // ISO
  endTime: string;   // ISO
  timezone?: string;
  venueId?: string;
  locationName?: string;
  dressCode?: string;
  dressCodeColors?: string[];
  status?: EventStatusType;
  visibility?: EventVisibilityType;
  metadata?: {
    ritualType?: string;
    isMuhurtham?: boolean;
    muhurthamTime?: string;
    milestones?: RitualMilestone[];
    broadcastChannel?: string;
    [key: string]: any;
  };
}

export interface UpdateEventDTO {
  name?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  timezone?: string;
  venueId?: string;
  locationName?: string;
  dressCode?: string;
  dressCodeColors?: string[];
  status?: EventStatusType;
  visibility?: EventVisibilityType;
  metadata?: Record<string, any>;
}

export interface EventEntity {
  id: string;
  weddingId: string;
  venueId: string | null;
  name: string;
  description: string | null;
  startTime: Date;
  endTime: Date;
  timezone: string;
  status: string;
  visibility: string;
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
