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
 * /api/v1/weddings/{weddingId}/members/telemetry:
 *   get:
 *     summary: Get wedding collaborator telemetry & authority metrics
 *     tags: [Weddings]
 */
weddingRouter.get('/:weddingId/members/telemetry', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const telemetry = await weddingService.getCollaboratorTelemetry(req.params.weddingId, req.user!.userId);
    return ApiResponse.success(res, { data: telemetry });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/v1/weddings/{weddingId}/members:
 *   get:
 *     summary: List collaborators and hosts of a wedding workspace with rich metadata
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
 * /api/v1/weddings/{weddingId}/members/invite:
 *   post:
 *     summary: Inscribe and invite a new collaborator to the royal council
 *     tags: [Weddings]
 */
weddingRouter.post('/:weddingId/members/invite', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, name, phone, roleName, relation, ceremonyScope, personalNote } = req.body;
    if (!email || !roleName) {
      return res.status(400).json({ success: false, message: 'Email and roleName are required' });
    }

    const member = await weddingService.inviteCollaborator(req.params.weddingId, req.user!.userId, {
      email,
      name,
      phone,
      roleName,
      relation,
      ceremonyScope,
      personalNote,
    });

    return ApiResponse.created(res, {
      data: member,
      message: `Royal invitation dispatched successfully to ${email}`,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/v1/weddings/{weddingId}/members/seed-council:
 *   post:
 *     summary: Seed Mewar royal council sample stewards for rich collaboration demo
 *     tags: [Weddings]
 */
weddingRouter.post('/:weddingId/members/seed-council', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const council = await weddingService.seedImperialCouncil(req.params.weddingId, req.user!.userId);
    return ApiResponse.success(res, {
      data: council,
      message: 'Mewar Royal Council stewards inscribed successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/v1/weddings/{weddingId}/members/{memberId}:
 *   patch:
 *     summary: Update role or permissions of a collaborator
 *     tags: [Weddings]
 */
weddingRouter.patch('/:weddingId/members/:memberId', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { roleName, status, relation, phone, ceremonyScope } = req.body;
    const updated = await weddingService.updateCollaborator(
      req.params.weddingId,
      req.user!.userId,
      req.params.memberId,
      { roleName, status, relation, phone, ceremonyScope }
    );
    return ApiResponse.success(res, { data: updated, message: 'Collaborator authority updated' });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/v1/weddings/{weddingId}/members/{memberId}:
 *   delete:
 *     summary: Revoke access and remove a collaborator
 *     tags: [Weddings]
 */
weddingRouter.delete('/:weddingId/members/:memberId', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await weddingService.removeCollaborator(req.params.weddingId, req.user!.userId, req.params.memberId);
    return ApiResponse.success(res, { data: null, message: 'Collaborator privileges revoked' });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/v1/weddings/{weddingId}/members/{memberId}/resend:
 *   post:
 *     summary: Resend royal invitation passkey link
 *     tags: [Weddings]
 */
weddingRouter.post('/:weddingId/members/:memberId/resend', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await weddingService.resendCollaboratorInvite(
      req.params.weddingId,
      req.user!.userId,
      req.params.memberId
    );
    return ApiResponse.success(res, {
      data: result,
      message: 'Royal passkey invitation refreshed and redispatched',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/v1/weddings/{weddingId}/members/accept:
 *   post:
 *     summary: Accept pending council invitation and activate membership
 *     tags: [Weddings]
 */
weddingRouter.post('/:weddingId/members/accept', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await weddingService.acceptInvitation(req.params.weddingId, req.user!.userId);
    return ApiResponse.success(res, {
      data: result,
      message: 'Council invitation successfully accepted. Welcome to the Vivaha planning council!',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/v1/weddings/{weddingId}/members:
 *   post:
 *     summary: Assign or update role of a collaborator/member (legacy)
 *     tags: [Weddings]
 */
weddingRouter.post('/:weddingId/members', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, role, roleName } = req.body;
    const targetRole = role || roleName;
    if (!email || !targetRole) {
      return res.status(400).json({ success: false, message: 'Email and role are required' });
    }
    const member = await weddingService.assignMemberRole(
      req.params.weddingId,
      req.user!.userId,
      email,
      targetRole
    );
    return ApiResponse.success(res, { data: member, message: `Role "${targetRole}" successfully assigned to ${email}` });
  } catch (error) {
    next(error);
  }
});

