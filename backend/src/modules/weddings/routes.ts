import { Router, Request, Response, NextFunction } from 'express';
import { weddingService } from './wedding.service';
import { createWeddingSchema, updateWeddingSchema } from './wedding.validation';
import { requireAuth } from '../../middleware/auth.middleware';
import { ApiResponse } from '../../shared/response/api-response';

export const weddingRouter = Router();

/**
 * @openapi
 * /api/v1/weddings/check-slug:
 *   get:
 *     summary: Verify availability of custom wedding URL handle
 *     tags: [Weddings]
 */
weddingRouter.get('/check-slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const slug = (req.query.slug as string) || '';
    const result = await weddingService.checkSlugAvailability(slug);
    return ApiResponse.success(res, { data: result });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/v1/weddings:
 *   get:
 *     summary: List all wedding workspaces user belongs to
 *     tags: [Weddings]
 */
weddingRouter.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const weddings = await weddingService.getUserWeddings(req.user!.userId);
    return ApiResponse.success(res, { data: weddings });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/v1/weddings:
 *   post:
 *     summary: Create a new royal wedding workspace
 *     tags: [Weddings]
 */
weddingRouter.post('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = createWeddingSchema.parse(req.body);
    const wedding = await weddingService.createWedding(req.user!.userId, validatedData);
    return ApiResponse.created(res, wedding, 'Royal wedding workspace created successfully');
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/v1/weddings/{weddingId}:
 *   get:
 *     summary: Retrieve full details of a specific wedding workspace
 *     tags: [Weddings]
 */
weddingRouter.get('/:weddingId', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const wedding = await weddingService.getWeddingById(req.params.weddingId, req.user!.userId);
    return ApiResponse.success(res, { data: wedding });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/v1/weddings/{weddingId}:
 *   patch:
 *     summary: Update wedding workspace configurations
 *     tags: [Weddings]
 */
weddingRouter.patch('/:weddingId', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = updateWeddingSchema.parse(req.body);
    const updated = await weddingService.updateWedding(
      req.params.weddingId,
      req.user!.userId,
      validatedData
    );
    return ApiResponse.success(res, { data: updated, message: 'Wedding updated successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/v1/weddings/{weddingId}:
 *   delete:
 *     summary: Soft-delete a wedding workspace
 *     tags: [Weddings]
 */
weddingRouter.delete('/:weddingId', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await weddingService.deleteWedding(req.params.weddingId, req.user!.userId);
    return ApiResponse.success(res, { data: null, message: 'Wedding workspace deleted successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/v1/weddings/{weddingId}/members:
 *   get:
 *     summary: List collaborators and hosts of a wedding workspace
 *     tags: [Weddings]
 */
weddingRouter.get('/:weddingId/members', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const members = await weddingService.getWeddingMembers(req.params.weddingId, req.user!.userId);
    return ApiResponse.success(res, { data: members });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/v1/weddings/{weddingId}/members:
 *   post:
 *     summary: Assign or update role of a collaborator/member
 *     tags: [Weddings]
 */
weddingRouter.post('/:weddingId/members', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, role } = req.body;
    if (!email || !role) {
      return res.status(400).json({ success: false, message: 'Email and role are required' });
    }
    const member = await weddingService.assignMemberRole(
      req.params.weddingId,
      req.user!.userId,
      email,
      role
    );
    return ApiResponse.success(res, { data: member, message: `Role "${role}" successfully assigned to ${email}` });
  } catch (error) {
    next(error);
  }
});
