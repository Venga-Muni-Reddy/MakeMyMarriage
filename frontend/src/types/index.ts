export interface User {
  id: string;
  email: string;
  name: string;
  preferredLanguage: string;
}

export interface Wedding {
  id: string;
  name: string;
  slug: string;
  description?: string;
  weddingDate?: string;
  timezone: string;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  visibility: 'PRIVATE' | 'PUBLIC';
}

export interface WeddingEvent {
  id: string;
  weddingId: string;
  name: string;
  description?: string;
  startAt: string;
  endAt: string;
  timezone: string;
  status: 'DRAFT' | 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  visibility: 'PUBLIC' | 'INVITED_GUESTS_ONLY' | 'PRIVATE';
}

export interface Guest {
  id: string;
  weddingId: string;
  firstName: string;
  lastName?: string;
  displayName: string;
  email?: string;
  phone?: string;
  side: 'BRIDE' | 'GROOM' | 'BOTH' | 'NEUTRAL';
}

export interface ApiResponseEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}
