import { Router } from 'express';
import { mediaController } from './media.controller';
import { requireAuth } from '../../middleware/auth.middleware';

export const mediaRouter = Router({ mergeParams: true });

/**
 * @openapi
 * /api/v1/weddings/{weddingId}/media/signature:
 *   get:
 *     summary: Generate signed Cloudinary upload params
 *     tags: [Media & Photos]
 */
mediaRouter.get('/signature', requireAuth, mediaController.getSignature);

/**
 * @openapi
 * /api/v1/weddings/{weddingId}/media/telemetry:
 *   get:
 *     summary: Get media vault telemetry and counters
 *     tags: [Media & Photos]
 */
mediaRouter.get('/telemetry', requireAuth, mediaController.getTelemetry);

/**
 * @openapi
 * /api/v1/weddings/{weddingId}/media/photos:
 *   get:
 *     summary: List photos in the royal media vault
 *     tags: [Media & Photos]
 *   post:
 *     summary: Inscribe and register a newly uploaded photo
 *     tags: [Media & Photos]
 */
mediaRouter.get('/photos', requireAuth, mediaController.getPhotos);
mediaRouter.post('/photos', requireAuth, mediaController.registerPhoto);

/**
 * @openapi
 * /api/v1/weddings/{weddingId}/media/photos/{photoId}/moderate:
 *   patch:
 *     summary: Moderate photo status (APPROVED, REJECTED, PENDING)
 *     tags: [Media & Photos]
 */
mediaRouter.patch('/photos/:photoId/moderate', requireAuth, mediaController.moderatePhoto);

/**
 * @openapi
 * /api/v1/weddings/{weddingId}/media/photos/{photoId}/like:
 *   post:
 *     summary: Toggle like / celebrate on a photo
 *     tags: [Media & Photos]
 */
mediaRouter.post('/photos/:photoId/like', mediaController.toggleLike);

/**
 * @openapi
 * /api/v1/weddings/{weddingId}/media/photos/{photoId}:
 *   delete:
 *     summary: Remove photo from vault
 *     tags: [Media & Photos]
 */
mediaRouter.delete('/photos/:photoId', requireAuth, mediaController.deletePhoto);

/**
 * @openapi
 * /api/v1/weddings/{weddingId}/media/guest-upload:
 *   post:
 *     summary: Unauthenticated / passkey upload from banquet table QR
 *     tags: [Media & Photos]
 */
mediaRouter.post('/guest-upload', mediaController.guestUpload);

/**
 * @openapi
 * /api/v1/weddings/{weddingId}/media/public-gallery:
 *   get:
 *     summary: Public approved gallery for guest unboxing and website
 *     tags: [Media & Photos]
 */
mediaRouter.get('/public-gallery', mediaController.getPublicGallery);

export { mediaController };
export { mediaService } from './media.service';
export { mediaRepository } from './media.repository';
