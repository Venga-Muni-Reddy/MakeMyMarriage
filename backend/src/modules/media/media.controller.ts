import { Request, Response, NextFunction } from 'express';
import { mediaService, MediaService } from './media.service';
import { ApiResponse } from '../../shared/response/api-response';
import { PhotoVisibility, PhotoModerationStatus } from '@prisma/client';

export class MediaController {
  constructor(private service: MediaService = mediaService) {}

  /**
   * GET /api/v1/weddings/:weddingId/media/signature
   */
  getSignature = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { weddingId } = req.params;
      const signatureData = await this.service.generateUploadSignature(weddingId);
      return ApiResponse.success(res, { data: signatureData });
    } catch (err: any) {
      next(err);
    }
  };

  /**
   * GET /api/v1/weddings/:weddingId/media/photos
   */
  getPhotos = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { weddingId } = req.params;
      const { eventId, visibility, moderationStatus, search, sortBy } = req.query;

      const photos = await this.service.getPhotos(weddingId, {
        eventId: eventId ? String(eventId) : undefined,
        visibility: visibility ? (String(visibility) as PhotoVisibility) : undefined,
        moderationStatus: moderationStatus
          ? (String(moderationStatus) as PhotoModerationStatus)
          : undefined,
        search: search ? String(search) : undefined,
        sortBy: sortBy as any,
      });

      return ApiResponse.success(res, { data: photos });
    } catch (err: any) {
      next(err);
    }
  };

  /**
   * POST /api/v1/weddings/:weddingId/media/photos
   */
  registerPhoto = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { weddingId } = req.params;
      const {
        publicId,
        secureUrl,
        format,
        width,
        height,
        bytes,
        caption,
        eventId,
        visibility,
        guestName,
        tableNumber,
        cameraModel,
      } = req.body;

      if (!publicId || !secureUrl) {
        return res.status(400).json({ success: false, message: 'publicId and secureUrl are required fields.' });
      }

      const userId = (req as any).user?.userId || (req as any).user?.id;

      const photo = await this.service.registerPhoto(
        weddingId,
        {
          publicId,
          secureUrl,
          format,
          width: width ? Number(width) : undefined,
          height: height ? Number(height) : undefined,
          bytes: bytes ? Number(bytes) : undefined,
          caption,
          eventId: eventId && eventId !== 'all' ? eventId : undefined,
          visibility,
          guestName,
          tableNumber,
          cameraModel,
        },
        userId
      );

      return ApiResponse.created(res, photo);
    } catch (err: any) {
      next(err);
    }
  };

  /**
   * PATCH /api/v1/weddings/:weddingId/media/photos/:photoId/moderate
   */
  moderatePhoto = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { weddingId, photoId } = req.params;
      const { moderationStatus, visibility, rejectionReason } = req.body;

      if (!moderationStatus) {
        return res.status(400).json({ success: false, message: 'moderationStatus is required (APPROVED, REJECTED, PENDING).' });
      }

      const photo = await this.service.moderatePhoto(photoId, weddingId, {
        moderationStatus: moderationStatus as PhotoModerationStatus,
        visibility: visibility as PhotoVisibility,
        rejectionReason,
      });

      return ApiResponse.success(res, { data: photo });
    } catch (err: any) {
      next(err);
    }
  };

  /**
   * POST /api/v1/weddings/:weddingId/media/photos/:photoId/like
   */
  toggleLike = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { weddingId, photoId } = req.params;
      const userId = (req as any).user?.userId || (req as any).user?.id || 'guest_client_' + (req.ip || 'anon');

      const photo = await this.service.toggleLike(photoId, weddingId, userId);
      if (!photo) {
        return res.status(404).json({ success: false, message: 'Photo not found in vault' });
      }

      return ApiResponse.success(res, { data: photo });
    } catch (err: any) {
      next(err);
    }
  };

  /**
   * DELETE /api/v1/weddings/:weddingId/media/photos/:photoId
   */
  deletePhoto = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { weddingId, photoId } = req.params;
      await this.service.deletePhoto(photoId, weddingId);
      return ApiResponse.success(res, { message: 'Photo removed successfully from media vault' });
    } catch (err: any) {
      next(err);
    }
  };

  /**
   * GET /api/v1/weddings/:weddingId/media/telemetry
   */
  getTelemetry = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { weddingId } = req.params;
      const telemetry = await this.service.getTelemetry(weddingId);
      return ApiResponse.success(res, { data: telemetry });
    } catch (err: any) {
      next(err);
    }
  };

  /**
   * POST /api/v1/weddings/:weddingId/media/guest-upload
   */
  guestUpload = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { weddingId } = req.params;
      const {
        publicId,
        secureUrl,
        format,
        width,
        height,
        bytes,
        caption,
        eventId,
        guestName,
        tableNumber,
      } = req.body;

      if (!publicId || !secureUrl) {
        return res.status(400).json({ success: false, message: 'publicId and secureUrl are required for guest upload.' });
      }

      const photo = await this.service.guestUpload(weddingId, {
        publicId,
        secureUrl,
        format,
        width,
        height,
        bytes,
        caption,
        eventId: eventId && eventId !== 'all' ? eventId : undefined,
        guestName,
        tableNumber,
      });

      return ApiResponse.created(res, photo);
    } catch (err: any) {
      next(err);
    }
  };

  /**
   * GET /api/v1/weddings/:weddingId/media/public-gallery
   */
  getPublicGallery = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { weddingId } = req.params;
      const { eventId } = req.query;

      const photos = await this.service.getPublicGallery(
        weddingId,
        eventId ? String(eventId) : undefined
      );

      return ApiResponse.success(res, { data: photos });
    } catch (err: any) {
      next(err);
    }
  };
}

export const mediaController = new MediaController();
