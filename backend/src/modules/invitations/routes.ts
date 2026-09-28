import { Router, Request, Response } from 'express';
import { ApiResponse } from '../../shared/response/api-response';

export class InvitationController {
  getInvitations = async (_req: Request, res: Response) => {
    return ApiResponse.success(res, { message: 'List invitations endpoint scaffolded', data: [] });
  };
  createInvitation = async (_req: Request, res: Response) => {
    return ApiResponse.created(res, null, 'Create invitation endpoint scaffolded');
  };
  getGuestInvitation = async (_req: Request, res: Response) => {
    return ApiResponse.success(res, { message: 'Guest access invitation by secure token endpoint scaffolded' });
  };
}

export const invitationController = new InvitationController();
export const invitationService = {};
export const invitationRepository = {};

export const invitationRouter = Router({ mergeParams: true });
invitationRouter.get('/', invitationController.getInvitations);
invitationRouter.post('/', invitationController.createInvitation);
invitationRouter.get('/token/:token', invitationController.getGuestInvitation);
