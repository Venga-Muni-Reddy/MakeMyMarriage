import { Router, Request, Response } from 'express';
import { ApiResponse } from '../../shared/response/api-response';

export class MediaController {
  getSignature = async (_req: Request, res: Response) => {
    return ApiResponse.success(res, { message: 'Cloudinary upload signature endpoint scaffolded' });
  };
  getPhotos = async (_req: Request, res: Response) => {
    return ApiResponse.success(res, { message: 'List photos endpoint scaffolded', data: [] });
  };
  moderatePhoto = async (_req: Request, res: Response) => {
    return ApiResponse.success(res, { message: 'Photo moderation endpoint scaffolded' });
  };
}

export const mediaController = new MediaController();
export const mediaService = {};
export const mediaRepository = {};

export const mediaRouter = Router({ mergeParams: true });
mediaRouter.get('/signature', mediaController.getSignature);
mediaRouter.get('/photos', mediaController.getPhotos);
mediaRouter.patch('/photos/:photoId/moderate', mediaController.moderatePhoto);
