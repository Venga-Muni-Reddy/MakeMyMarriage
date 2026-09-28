import { Router, Request, Response } from 'express';
import { ApiResponse } from '../../shared/response/api-response';

export class ActivityController {
  getActivities = async (_req: Request, res: Response) => {
    return ApiResponse.success(res, { message: 'List activities feed endpoint scaffolded', data: [] });
  };
}

export const activityController = new ActivityController();
export const activityService = {};
export const activityRepository = {};

export const activityRouter = Router({ mergeParams: true });
activityRouter.get('/', activityController.getActivities);
