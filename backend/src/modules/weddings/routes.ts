import { Router, Request, Response } from 'express';
import { ApiResponse } from '../../shared/response/api-response';

export const weddingRouter = Router();

weddingRouter.get('/', (_req: Request, res: Response) => {
  return ApiResponse.success(res, { message: 'List weddings endpoint scaffolded', data: [] });
});

weddingRouter.post('/', (_req: Request, res: Response) => {
  return ApiResponse.created(res, null, 'Create wedding endpoint scaffolded');
});

weddingRouter.get('/:weddingId', (_req: Request, res: Response) => {
  return ApiResponse.success(res, { message: 'Get wedding endpoint scaffolded' });
});

weddingRouter.patch('/:weddingId', (_req: Request, res: Response) => {
  return ApiResponse.success(res, { message: 'Update wedding endpoint scaffolded' });
});

weddingRouter.delete('/:weddingId', (_req: Request, res: Response) => {
  return ApiResponse.success(res, { message: 'Delete wedding endpoint scaffolded' });
});
