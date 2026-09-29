import { Router, Request, Response, NextFunction } from 'express';
import { guestService } from './guest.service';
import {
  createGuestSchema,
  updateGuestSchema,
  guestQuerySchema,
  bulkActionSchema,
  createCategorySchema,
} from './guest.validation';
import { requireAuth } from '../../middleware/auth.middleware';
import { requireWeddingMember, requireWeddingRole } from '../../middleware/wedding.middleware';
import { ApiResponse } from '../../shared/response/api-response';

export const guestRouter = Router({ mergeParams: true });

/**
 * @openapi
 * /api/v1/weddings/{weddingId}/guests:
 *   get:
 *     summary: Retrieve royal guest registry with filters, categories, and telemetry
 *     tags: [Guests]
 */
guestRouter.get(
  '/',
  requireAuth,
  requireWeddingMember,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = guestQuerySchema.parse(req.query);
      const result = await guestService.getGuests(req.params.weddingId, query);
      return ApiResponse.success(res, { data: result });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @openapi
 * /api/v1/weddings/{weddingId}/guests/export:
 *   get:
 *     summary: Export imperial guest manifesto as CSV
 *     tags: [Guests]
 */
guestRouter.get(
  '/export',
  requireAuth,
  requireWeddingMember,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const csv = await guestService.exportGuestsCsv(req.params.weddingId);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="royal_guest_manifesto.csv"');
      return res.status(200).send(csv);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @openapi
 * /api/v1/weddings/{weddingId}/guests/telemetry:
 *   get:
 *     summary: Get live guest count and dietary telemetry
 *     tags: [Guests]
 */
guestRouter.get(
  '/telemetry',
  requireAuth,
  requireWeddingMember,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const telemetry = await guestService.getTelemetry(req.params.weddingId);
      return ApiResponse.success(res, { data: telemetry });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @openapi
 * /api/v1/weddings/{weddingId}/guests/categories:
 *   get:
 *     summary: List guest circles / categories
 *     tags: [Guests]
 */
guestRouter.get(
  '/categories',
  requireAuth,
  requireWeddingMember,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const categories = await guestService.getCategories(req.params.weddingId);
      return ApiResponse.success(res, { data: categories });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @openapi
 * /api/v1/weddings/{weddingId}/guests/categories:
 *   post:
 *     summary: Create custom guest circle
 *     tags: [Guests]
 */
guestRouter.post(
  '/categories',
  requireAuth,
  requireWeddingMember,
  requireWeddingRole('OWNER', 'ORGANIZER'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name } = createCategorySchema.parse(req.body);
      const category = await guestService.createCategory(req.params.weddingId, name);
      return ApiResponse.created(res, category, 'Guest circle created');
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @openapi
 * /api/v1/weddings/{weddingId}/guests/bulk:
 *   post:
 *     summary: Perform bulk actions across selected royal households
 *     tags: [Guests]
 */
guestRouter.post(
  '/bulk',
  requireAuth,
  requireWeddingMember,
  requireWeddingRole('OWNER', 'ORGANIZER'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payload = bulkActionSchema.parse(req.body);
      const result = await guestService.bulkAction(req.params.weddingId, payload);
      return ApiResponse.success(res, { data: result });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @openapi
 * /api/v1/weddings/{weddingId}/guests:
 *   post:
 *     summary: Enroll new noble guest / household in wedding chancery
 *     tags: [Guests]
 */
guestRouter.post(
  '/',
  requireAuth,
  requireWeddingMember,
  requireWeddingRole('OWNER', 'ORGANIZER'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = createGuestSchema.parse(req.body);
      const guest = await guestService.createGuest(req.params.weddingId, validatedData);
      return ApiResponse.created(res, guest, 'Royal guest enrolled in chancery roll');
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @openapi
 * /api/v1/weddings/{weddingId}/guests/{guestId}:
 *   get:
 *     summary: Retrieve noble guest profile and ceremonial passes
 *     tags: [Guests]
 */
guestRouter.get(
  '/:guestId',
  requireAuth,
  requireWeddingMember,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const guest = await guestService.getGuest(req.params.weddingId, req.params.guestId);
      return ApiResponse.success(res, { data: guest });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @openapi
 * /api/v1/weddings/{weddingId}/guests/{guestId}:
 *   patch:
 *     summary: Update noble guest attributes, household pax, or dietary mandate
 *     tags: [Guests]
 */
guestRouter.patch(
  '/:guestId',
  requireAuth,
  requireWeddingMember,
  requireWeddingRole('OWNER', 'ORGANIZER'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = updateGuestSchema.parse(req.body);
      const guest = await guestService.updateGuest(req.params.weddingId, req.params.guestId, validatedData);
      return ApiResponse.success(res, { data: guest, message: 'Guest details updated' });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @openapi
 * /api/v1/weddings/{weddingId}/guests/{guestId}:
 *   delete:
 *     summary: Archive noble guest from wedding roll
 *     tags: [Guests]
 */
guestRouter.delete(
  '/:guestId',
  requireAuth,
  requireWeddingMember,
  requireWeddingRole('OWNER', 'ORGANIZER'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await guestService.deleteGuest(req.params.weddingId, req.params.guestId);
      return ApiResponse.success(res, { message: 'Noble guest archived from chancery roll' });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @openapi
 * /api/v1/weddings/{weddingId}/guests/{guestId}/unarchive:
 *   post:
 *     summary: Restore noble guest to active wedding chancery roll
 *     tags: [Guests]
 */
guestRouter.post(
  '/:guestId/unarchive',
  requireAuth,
  requireWeddingMember,
  requireWeddingRole('OWNER', 'ORGANIZER'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await guestService.unarchiveGuest(req.params.weddingId, req.params.guestId);
      return ApiResponse.success(res, { message: 'Noble guest restored to active chancery roll' });
    } catch (error) {
      next(error);
    }
  }
);
