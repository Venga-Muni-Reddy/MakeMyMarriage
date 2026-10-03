import api from './api';

export type PhotoVisibility = 'PUBLIC' | 'PRIVATE' | 'EVENT_ONLY';
export type PhotoModerationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface MediaAsset {
  id: string;
  publicId: string;
  secureUrl: string;
  format: string;
  width?: number;
  height?: number;
  bytes?: number;
  metadata?: {
    cameraModel?: string;
    guestName?: string;
    tableNumber?: string;
    likesCount?: number;
    likedBy?: string[];
    aspectRatio?: string;
    [key: string]: any;
  };
}

export interface PhotoItem {
  id: string;
  weddingId: string;
  eventId?: string | null;
  eventName: string;
  eventDate?: string | null;
  venueName?: string | null;
  caption?: string | null;
  visibility: PhotoVisibility;
  moderationStatus: PhotoModerationStatus;
  createdAt: string;
  mediaAsset: MediaAsset | null;
  uploader: {
    type: 'HOST' | 'GUEST' | 'QR_SCAN';
    name: string;
    email?: string | null;
    tableNumber?: string | null;
    cameraModel?: string;
  };
  likesCount: number;
  aspectRatio: string;
}

export interface MediaTelemetry {
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

export interface CloudinarySignature {
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
  folder: string;
  uploadUrl: string;
  isMockMode?: boolean;
}

export interface RegisterPhotoPayload {
  publicId: string;
  secureUrl: string;
  format?: string;
  width?: number;
  height?: number;
  bytes?: number;
  caption?: string;
  eventId?: string;
  visibility?: PhotoVisibility;
  guestName?: string;
  tableNumber?: string;
  cameraModel?: string;
}

export class MediaService {
  /**
   * Fetch upload signature from backend
   */
  async getSignature(weddingId: string): Promise<CloudinarySignature> {
    const res: any = await api.get(`/weddings/${weddingId}/media/signature`);
    return res?.data ?? res;
  }

  /**
   * List photos with filters
   */
  async getPhotos(
    weddingId: string,
    filters?: {
      eventId?: string;
      visibility?: PhotoVisibility;
      moderationStatus?: PhotoModerationStatus;
      search?: string;
      sortBy?: 'newest' | 'most_liked' | 'ceremony_order' | 'pending';
    }
  ): Promise<PhotoItem[]> {
    const res: any = await api.get(`/weddings/${weddingId}/media/photos`, {
      params: filters,
    });
    const items = res?.data ?? res;
    return Array.isArray(items) ? items : [];
  }

  /**
   * Get media telemetry aggregates
   */
  async getTelemetry(weddingId: string): Promise<MediaTelemetry> {
    const res: any = await api.get(`/weddings/${weddingId}/media/telemetry`);
    return res?.data ?? res;
  }

  /**
   * Register a new photo after upload
   */
  async registerPhoto(weddingId: string, payload: RegisterPhotoPayload): Promise<PhotoItem> {
    const res: any = await api.post(`/weddings/${weddingId}/media/photos`, payload);
    return res?.data ?? res;
  }

  /**
   * Moderate photo status
   */
  async moderatePhoto(
    weddingId: string,
    photoId: string,
    payload: {
      moderationStatus: PhotoModerationStatus;
      visibility?: PhotoVisibility;
      rejectionReason?: string;
    }
  ): Promise<PhotoItem> {
    const res: any = await api.patch(
      `/weddings/${weddingId}/media/photos/${photoId}/moderate`,
      payload
    );
    return res?.data ?? res;
  }

  /**
   * Toggle like on photo
   */
  async toggleLike(weddingId: string, photoId: string): Promise<PhotoItem> {
    const res: any = await api.post(`/weddings/${weddingId}/media/photos/${photoId}/like`);
    return res?.data ?? res;
  }

  /**
   * Delete photo from vault
   */
  async deletePhoto(weddingId: string, photoId: string): Promise<void> {
    await api.delete(`/weddings/${weddingId}/media/photos/${photoId}`);
  }

  /**
   * Guest banquet table QR upload
   */
  async guestUpload(
    weddingId: string,
    payload: {
      publicId: string;
      secureUrl: string;
      caption?: string;
      eventId?: string;
      guestName?: string;
      tableNumber?: string;
      format?: string;
    }
  ): Promise<PhotoItem> {
    const res: any = await api.post(`/weddings/${weddingId}/media/guest-upload`, payload);
    return res?.data ?? res;
  }

  /**
   * Public gallery feed for website
   */
  async getPublicGallery(weddingId: string, eventId?: string): Promise<PhotoItem[]> {
    const res: any = await api.get(`/weddings/${weddingId}/media/public-gallery`, {
      params: { eventId },
    });
    const items = res?.data ?? res;
    return Array.isArray(items) ? items : [];
  }

  /**
   * Upload file to Cloudinary directly with progress callback.
   * If mock mode, creates an in-memory preview URL and simulates high-speed CDN transfer.
   */
  async uploadFileToCloudinary(
    file: File,
    sig: CloudinarySignature,
    onProgress?: (percent: number) => void
  ): Promise<{
    publicId: string;
    secureUrl: string;
    format: string;
    width: number;
    height: number;
    bytes: number;
  }> {
    if (sig.isMockMode) {
      // Simulate fast direct upload progression
      return new Promise((resolve) => {
        let current = 0;
        const interval = setInterval(() => {
          current += 20;
          if (onProgress) onProgress(Math.min(current, 95));
          if (current >= 100) {
            clearInterval(interval);
            const reader = new FileReader();
            reader.onload = (e) => {
              const url = (e.target?.result as string) || URL.createObjectURL(file);
              if (onProgress) onProgress(100);
              resolve({
                publicId: `mock_${Date.now()}_${file.name.replace(/\.[^/.]+$/, '')}`,
                secureUrl: url,
                format: file.name.split('.').pop() || 'jpg',
                width: 1920,
                height: 1080,
                bytes: file.size,
              });
            };
            reader.readAsDataURL(file);
          }
        }, 120);
      });
    }

    // Real Cloudinary multipart/form-data upload
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', sig.apiKey);
      formData.append('timestamp', String(sig.timestamp));
      formData.append('signature', sig.signature);
      formData.append('folder', sig.folder);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', sig.uploadUrl, true);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve({
              publicId: data.public_id,
              secureUrl: data.secure_url,
              format: data.format || file.name.split('.').pop() || 'jpg',
              width: data.width || 1920,
              height: data.height || 1080,
              bytes: data.bytes || file.size,
            });
          } catch (e) {
            reject(new Error('Failed to parse Cloudinary response'));
          }
        } else {
          reject(new Error(`Cloudinary upload failed with status ${xhr.status}: ${xhr.responseText}`));
        }
      };

      xhr.onerror = () => reject(new Error('Network error during Cloudinary upload'));
      xhr.send(formData);
    });
  }
}

export const mediaService = new MediaService();
