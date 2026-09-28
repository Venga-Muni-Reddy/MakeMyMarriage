import { Router, Request, Response } from 'express';
import { ApiResponse } from '../../shared/response/api-response';

export class RsvpController {
  getRsvps = async (_req: Request, res: Response) => {
    return ApiResponse.success(res, { message: 'List RSVPs endpoint scaffolded', data: [] });
  };
  submitRsvp = async (_req: Request, res: Response) => {
    return ApiResponse.success(res, { message: 'Submit RSVP endpoint scaffolded' });
  };
}

export const rsvpController = new RsvpController();
export const rsvpService = {};
export const rsvpRepository = {};

export const rsvpRouter = Router({ mergeParams: true });
rsvpRouter.get('/', rsvpController.getRsvps);
rsvpRouter.post('/', rsvpController.submitRsvp);
