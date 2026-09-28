import { Router, Request, Response } from 'express';
import { ApiResponse } from '../../shared/response/api-response';

export class WebsiteController {
  getWebsite = async (_req: Request, res: Response) => {
    return ApiResponse.success(res, { message: 'Get wedding website config endpoint scaffolded' });
  };
  updateWebsite = async (_req: Request, res: Response) => {
    return ApiResponse.success(res, { message: 'Update wedding website config endpoint scaffolded' });
  };
}

export const websiteController = new WebsiteController();
export const websiteService = {};
export const websiteRepository = {};

export const websiteRouter = Router({ mergeParams: true });
websiteRouter.get('/', websiteController.getWebsite);
websiteRouter.patch('/', websiteController.updateWebsite);
