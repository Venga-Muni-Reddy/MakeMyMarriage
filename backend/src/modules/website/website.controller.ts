import { Request, Response, NextFunction } from 'express';
import { websiteService } from './website.service';
import { ApiResponse } from '../../shared/response/api-response';

export class WebsiteController {
  getPublicWebsite = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const slug = req.params.slug;
      const data = await websiteService.getPublicWebsite(slug);
      return ApiResponse.success(res, { data });
    } catch (error: any) {
      if (error.message?.includes('not found')) {
        return res.status(404).json({ success: false, message: error.message });
      }
      next(error);
    }
  };

  lookupGuestPass = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const slug = req.params.slug;
      const query = (req.body?.query || req.query?.query || '') as string;
      const result = await websiteService.lookupGuestPass(slug, query);
      return ApiResponse.success(res, { data: result });
    } catch (error: any) {
      if (error.message?.includes('No invitation pass found')) {
        return res.status(404).json({ success: false, message: error.message });
      }
      next(error);
    }
  };

  addBlessing = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const slug = req.params.slug;
      const { authorName, side, message } = req.body;
      const blessing = await websiteService.addBlessing(slug, {
        authorName,
        side,
        message,
      });
      return ApiResponse.created(res, blessing, 'Your auspicious blessing has been inscribed in the royal registry');
    } catch (error: any) {
      next(error);
    }
  };

  getWebsiteConfig = async (_req: Request, res: Response) => {
    return ApiResponse.success(res, { message: 'Website configuration retrieved' });
  };

  updateWebsiteConfig = async (_req: Request, res: Response) => {
    return ApiResponse.success(res, { message: 'Website configuration updated' });
  };
}

export const websiteController = new WebsiteController();
