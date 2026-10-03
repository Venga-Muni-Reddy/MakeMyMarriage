import { PhotoVisibility, PhotoModerationStatus, MediaProvider } from '@prisma/client';

export interface CloudinarySignatureParams {
  timestamp: number;
  folder: string;
  uploadPreset?: string;
  source?: string;
  tags?: string;
  transformation?: string;
}

export interface CloudinarySignatureResponse {
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
  folder: string;
  uploadUrl: string;
  isMockMode?: boolean;
}

export interface RegisterPhotoDto {
  publicId: string;
  secureUrl: string;
  providerAssetId?: string;
  resourceType?: string;
  format?: string;
  width?: number;
  height?: number;
  bytes?: number;
  caption?: string;
  eventId?: string;
  visibility?: PhotoVisibility;
  uploadedByGuestId?: string;
  guestName?: string;
  tableNumber?: string;
  cameraModel?: string;
}

export interface PhotoQueryFilter {
  eventId?: string;
  visibility?: PhotoVisibility;
  moderationStatus?: PhotoModerationStatus;
  search?: string;
  sortBy?: 'newest' | 'most_liked' | 'ceremony_order' | 'pending';
  page?: number;
  limit?: number;
}

export interface ModeratePhotoDto {
  moderationStatus: PhotoModerationStatus;
  visibility?: PhotoVisibility;
  rejectionReason?: string;
}

export interface GuestUploadDto {
  publicId: string;
  secureUrl: string;
  format?: string;
  width?: number;
  height?: number;
  bytes?: number;
  caption?: string;
  eventId?: string;
  guestName?: string;
  tableNumber?: string;
  magicToken?: string;
}

export interface MediaTelemetryDto {
  totalMemories: number;
  ritualAlbums: number;
  banquetQrScans: number;
  pendingReview: number;
  totalBytes: number;
  approvedCount: number;
  todayUploadsCount: number;
  albums: {
    id: string;
    name: string;
    count: number;
  }[];
}
