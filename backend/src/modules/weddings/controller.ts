import { Request, Response } from 'express';
import { ApiResponse } from '../../shared/response/api-response';

export class WeddingController {
  getMyWeddings = async (_req: Request, res: Response) => {
    return ApiResponse.success(res, { message: 'List weddings endpoint scaffolded', data: [] });
  };

  getWedding = async (_req: Request, res: Response) => {
    return ApiResponse.success(res, { message: 'Get wedding endpoint scaffolded' });
  };

  createWedding = async (_req: Request, res: Response) => {
    return ApiResponse.created(res, null, 'Create wedding endpoint scaffolded');
  };

  updateWedding = async (_req: Request, res: Response) => {
    return ApiResponse.success(res, { message: 'Update wedding endpoint scaffolded' });
  };

  deleteWedding = async (_req: Request, res: Response) => {
    return ApiResponse.success(res, { message: 'Delete wedding endpoint scaffolded' });
  };
}

export const weddingController = new WeddingController();
