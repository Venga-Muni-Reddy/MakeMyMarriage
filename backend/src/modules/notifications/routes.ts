import { Router, Request, Response } from 'express';
import { ApiResponse } from '../../shared/response/api-response';

export class NotificationController {
  getNotifications = async (_req: Request, res: Response) => {
    return ApiResponse.success(res, { message: 'List notifications endpoint scaffolded', data: [] });
  };
  sendNotification = async (_req: Request, res: Response) => {
    return ApiResponse.created(res, null, 'Send notification endpoint scaffolded');
  };
}

export const notificationController = new NotificationController();
export const notificationService = {};
export const notificationRepository = {};

export const notificationRouter = Router({ mergeParams: true });
notificationRouter.get('/', notificationController.getNotifications);
notificationRouter.post('/send', notificationController.sendNotification);
