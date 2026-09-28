import { Router, Request, Response } from 'express';
import { ApiResponse } from '../../shared/response/api-response';

export class CheckinController {
  getEntries = async (_req: Request, res: Response) => {
    return ApiResponse.success(res, { message: 'List check-in entries endpoint scaffolded', data: [] });
  };
  checkInGuest = async (_req: Request, res: Response) => {
    return ApiResponse.created(res, null, 'Check-in guest endpoint scaffolded');
  };
}

export const checkinController = new CheckinController();
export const checkinService = {};
export const checkinRepository = {};

export const checkinRouter = Router({ mergeParams: true });
checkinRouter.get('/', checkinController.getEntries);
checkinRouter.post('/', checkinController.checkInGuest);
