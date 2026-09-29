import { Router, Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../../shared/response/api-response';
import { requireAuth } from '../../middleware/auth.middleware';
import { requireWeddingMember } from '../../middleware/wedding.middleware';
import { invitationService } from './invitation.service';
import {
  updateStudioSettingsSchema,
  singleDispatchSchema,
  bulkDispatchSchema,
  invitationQuerySchema,
} from './invitation.validation';

export class InvitationController {
  getInvitations = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const weddingId = req.params.weddingId;
      const query = invitationQuerySchema.parse(req.query);
      const items = await invitationService.getInvitations(weddingId, {
        search: query.search,
        status: query.status,
      });
      return ApiResponse.success(res, { data: items, message: 'Chancery invitation manifest retrieved' });
    } catch (err: any) {
      next(err);
    }
  };

  getTelemetry = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const weddingId = req.params.weddingId;
      const telemetry = await invitationService.getTelemetry(weddingId);
      return ApiResponse.success(res, { data: telemetry, message: 'Invitation telemetry computed' });
    } catch (err: any) {
      next(err);
    }
  };

  getSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const weddingId = req.params.weddingId;
      const settings = await invitationService.getSettings(weddingId);
      return ApiResponse.success(res, { data: settings, message: 'Studio settings retrieved' });
    } catch (err: any) {
      next(err);
    }
  };

  updateSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const weddingId = req.params.weddingId;
      const validated = updateStudioSettingsSchema.parse(req.body);
      const updated = await invitationService.updateSettings(weddingId, validated);
      return ApiResponse.success(res, { data: updated, message: 'Studio settings saved successfully' });
    } catch (err: any) {
      next(err);
    }
  };

  mintTokens = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const weddingId = req.params.weddingId;
      const result = await invitationService.mintInvitations(weddingId);
      return ApiResponse.success(res, { data: result, message: result.message });
    } catch (err: any) {
      next(err);
    }
  };

  dispatchSingle = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const weddingId = req.params.weddingId;
      const invitationId = req.params.invitationId;
      const validated = singleDispatchSchema.parse(req.body);
      const result = await invitationService.dispatchSingle(
        weddingId,
        invitationId,
        validated.channel,
        validated.customNote
      );
      return ApiResponse.success(res, { data: result, message: result.message });
    } catch (err: any) {
      next(err);
    }
  };

  bulkDispatch = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const weddingId = req.params.weddingId;
      const validated = bulkDispatchSchema.parse(req.body);
      const result = await invitationService.bulkDispatch(
        weddingId,
        validated.invitationIds,
        validated.channel
      );
      return ApiResponse.success(res, { data: result, message: result.message });
    } catch (err: any) {
      next(err);
    }
  };

  getThemes = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      return ApiResponse.success(res, { data: invitationService.getThemes(), message: 'Themes retrieved' });
    } catch (err: any) {
      next(err);
    }
  };

  getSoundscapes = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      return ApiResponse.success(res, { data: invitationService.getSoundscapes(), message: 'Soundscapes retrieved' });
    } catch (err: any) {
      next(err);
    }
  };

  // Public endpoint (Zero-password guest pass unboxing)
  getGuestInvitation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.params.token;
      const pass = await invitationService.resolvePublicPass(token);
      return ApiResponse.success(res, { data: pass, message: 'Royal invitation pass unveiled' });
    } catch (err: any) {
      return res.status(404).json({ success: false, message: err.message || 'Invitation pass not found' });
    }
  };
}

export const invitationController = new InvitationController();

// Wedding-scoped protected router
export const invitationRouter = Router({ mergeParams: true });

invitationRouter.use(requireAuth);
invitationRouter.use(requireWeddingMember);

invitationRouter.get('/', invitationController.getInvitations);
invitationRouter.get('/telemetry', invitationController.getTelemetry);
invitationRouter.get('/settings', invitationController.getSettings);
invitationRouter.put('/settings', invitationController.updateSettings);
invitationRouter.post('/mint', invitationController.mintTokens);
invitationRouter.get('/themes', invitationController.getThemes);
invitationRouter.get('/soundscapes', invitationController.getSoundscapes);
invitationRouter.post('/bulk-dispatch', invitationController.bulkDispatch);
invitationRouter.post('/:invitationId/dispatch', invitationController.dispatchSingle);

// Public unboxing router (No session or auth required)
export const publicInvitationRouter = Router();
publicInvitationRouter.get('/:token', invitationController.getGuestInvitation);
