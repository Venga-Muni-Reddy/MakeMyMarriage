import { Router, Request, Response, NextFunction } from 'express';
import { eventService } from './event.service';
import { createEventSchema, updateEventSchema } from './event.validation';
import { requireAuth } from '../../middleware/auth.middleware';
import { requireWeddingMember, requireWeddingRole } from '../../middleware/wedding.middleware';
import { ApiResponse } from '../../shared/response/api-response';

export const eventRouter = Router({ mergeParams: true });

/**
 * @openapi
 * /api/v1/weddings/{weddingId}/events:
 *   get:
 *     summary: Retrieve chronological itinerary of wedding ceremonies
 *     tags: [Events]
 */
eventRouter.get(
  '/',
  requireAuth,
  requireWeddingMember,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const events = await eventService.getEvents(req.params.weddingId);
      return ApiResponse.success(res, { data: events });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @openapi
 * /api/v1/weddings/{weddingId}/events:
 *   post:
 *     summary: Inaugurate a new sacred ceremony in the wedding schedule
 *     tags: [Events]
 */
eventRouter.post(
  '/',
  requireAuth,
  requireWeddingMember,
  requireWeddingRole('OWNER', 'ORGANIZER'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = createEventSchema.parse(req.body);
      const event = await eventService.createEvent(req.params.weddingId, validatedData);
      return ApiResponse.created(res, event, 'Ceremony added to royal itinerary');
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @openapi
 * /api/v1/weddings/{weddingId}/events/templates:
 *   post:
 *     summary: Seed royal multi-day ceremony presets (Haldi, Sangeet, Pheras, Reception)
 *     tags: [Events]
 */
eventRouter.post(
  '/templates',
  requireAuth,
  requireWeddingMember,
  requireWeddingRole('OWNER', 'ORGANIZER'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ceremonies = await eventService.seedTemplates(req.params.weddingId);
      return ApiResponse.created(res, ceremonies, 'Standard royal ceremonies seeded');
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @openapi
 * /api/v1/weddings/{weddingId}/events/{eventId}:
 *   get:
 *     summary: Retrieve details of a specific ceremony
 *     tags: [Events]
 */
eventRouter.get(
  '/:eventId',
  requireAuth,
  requireWeddingMember,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const event = await eventService.getEventById(req.params.weddingId, req.params.eventId);
      return ApiResponse.success(res, { data: event });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @openapi
 * /api/v1/weddings/{weddingId}/events/{eventId}:
 *   patch:
 *     summary: Update ceremony timing, location, dress code, or status
 *     tags: [Events]
 */
eventRouter.patch(
  '/:eventId',
  requireAuth,
  requireWeddingMember,
  requireWeddingRole('OWNER', 'ORGANIZER'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = updateEventSchema.parse(req.body);
      const updated = await eventService.updateEvent(
        req.params.weddingId,
        req.params.eventId,
        validatedData
      );
      return ApiResponse.success(res, { data: updated, message: 'Ceremony updated successfully' });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @openapi
 * /api/v1/weddings/{weddingId}/events/{eventId}:
 *   delete:
 *     summary: Soft-delete a ceremony from the itinerary
 *     tags: [Events]
 */
eventRouter.delete(
  '/:eventId',
  requireAuth,
  requireWeddingMember,
  requireWeddingRole('OWNER', 'ORGANIZER'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await eventService.deleteEvent(req.params.weddingId, req.params.eventId);
      return ApiResponse.success(res, { data: null, message: 'Ceremony deleted from schedule' });
    } catch (error) {
      next(error);
    }
  }
);
