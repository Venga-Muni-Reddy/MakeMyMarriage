import { v2 as cloudinary } from 'cloudinary';
import { mediaRepository, MediaRepository } from './media.repository';
import {
  CloudinarySignatureResponse,
  RegisterPhotoDto,
  PhotoQueryFilter,
  ModeratePhotoDto,
  GuestUploadDto,
  MediaTelemetryDto,
} from './media.types';
import { PhotoVisibility, PhotoModerationStatus } from '@prisma/client';

export class MediaService {
  constructor(private repo: MediaRepository = mediaRepository) {
    // Configure Cloudinary SDK with environment variables
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'makemymarriage_dev';
    const apiKey = process.env.CLOUDINARY_API_KEY || 'mock_key';
    const apiSecret = process.env.CLOUDINARY_API_SECRET || 'mock_secret';

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
  }

  /**
   * Generate secure signed upload parameters for direct client-to-Cloudinary upload
   */
  async generateUploadSignature(weddingId: string): Promise<CloudinarySignatureResponse> {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'makemymarriage_dev';
    const apiKey = process.env.CLOUDINARY_API_KEY || 'mock_key';
    const apiSecret = process.env.CLOUDINARY_API_SECRET || 'mock_secret';
    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = `makemymarriage/weddings/${weddingId}/memories`;

    const isMock = !apiSecret || apiSecret === 'mock_secret' || apiKey === 'mock_key';

    if (isMock) {
      // In development / mock mode, generate simulated signature
      return {
        timestamp,
        signature: `mock_sig_${timestamp}_${weddingId.slice(0, 8)}`,
        apiKey,
        cloudName,
        folder,
        uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        isMockMode: true,
      };
    }

    // Real signed upload generation via Cloudinary SDK
    const paramsToSign = {
      timestamp,
      folder,
    };

    const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

    return {
      timestamp,
      signature,
      apiKey,
      cloudName,
      folder,
      uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      isMockMode: false,
    };
  }

  /**
   * Fetch wedding photos with automatic demonstration showcase fallback
   */
  async getPhotos(weddingId: string, filter: PhotoQueryFilter = {}) {
    return this.repo.findPhotos(weddingId, filter);
  }

  /**
   * Fetch single photo
   */
  async getPhotoById(photoId: string, weddingId?: string) {
    return this.repo.findById(photoId, weddingId);
  }

  /**
   * Register a freshly uploaded photo in DB
   */
  async registerPhoto(
    weddingId: string,
    dto: RegisterPhotoDto,
    uploaderUserId?: string,
    uploaderGuestId?: string
  ) {
    return this.repo.createPhoto(weddingId, dto, uploaderUserId, uploaderGuestId);
  }

  /**
   * Review & moderate photo status
   */
  async moderatePhoto(photoId: string, weddingId: string, dto: ModeratePhotoDto) {
    const existing = await this.repo.findById(photoId, weddingId);
    if (!existing) {
      throw new Error(`Photo with ID ${photoId} not found in this wedding.`);
    }

    return this.repo.updateModeration(photoId, weddingId, dto);
  }

  /**
   * Like / celebrate a photo
   */
  async toggleLike(photoId: string, weddingId: string, userOrGuestId: string) {
    return this.repo.toggleLike(photoId, weddingId, userOrGuestId);
  }

  /**
   * Delete a photo from vault
   */
  async deletePhoto(photoId: string, weddingId: string) {
    const existing = await this.repo.findById(photoId, weddingId);
    if (!existing) {
      throw new Error(`Photo with ID ${photoId} not found in this wedding.`);
    }

    // Attempt Cloudinary deletion if real API key configured
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (apiSecret && apiSecret !== 'mock_secret' && existing.mediaAsset?.publicId) {
      try {
        await cloudinary.uploader.destroy(existing.mediaAsset.publicId);
      } catch (err) {
        console.warn(`[Cloudinary Warning] Failed to delete remote asset: ${err}`);
      }
    }

    return this.repo.softDelete(photoId, weddingId);
  }

  /**
   * Get media telemetry aggregates
   */
  async getTelemetry(weddingId: string): Promise<MediaTelemetryDto> {
    return this.repo.getTelemetry(weddingId);
  }

  /**
   * Guest banquet table QR upload handler
   */
  async guestUpload(weddingId: string, dto: GuestUploadDto) {
    return this.repo.createPhoto(
      weddingId,
      {
        publicId: dto.publicId,
        secureUrl: dto.secureUrl,
        format: dto.format || 'jpg',
        width: dto.width || 1920,
        height: dto.height || 1080,
        bytes: dto.bytes || 2500000,
        caption: dto.caption || 'Candid Banquet Memory',
        eventId: dto.eventId,
        visibility: PhotoVisibility.PUBLIC,
        guestName: dto.guestName || 'Esteemed Guest',
        tableNumber: dto.tableNumber || 'Banquet Stream',
        cameraModel: 'Smartphone Camera',
      },
      undefined,
      undefined
    );
  }

  /**
   * Public gallery feed for guests and public website
   */
  async getPublicGallery(weddingId: string, eventId?: string) {
    return this.repo.findPhotos(weddingId, {
      eventId: eventId && eventId !== 'all' ? eventId : undefined,
      visibility: PhotoVisibility.PUBLIC,
      moderationStatus: PhotoModerationStatus.APPROVED,
    });
  }
}

export const mediaService = new MediaService();
