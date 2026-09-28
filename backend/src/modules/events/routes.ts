import { Router, Request, Response } from 'express';
import { ApiResponse } from '../../shared/response/api-response';

export const eventRouter = Router({ mergeParams: true });

eventRouter.get('/', (_req: Request, res: Response) => {
  return ApiResponse.success(res, { message: 'List events endpoint scaffolded', data: [] });
});

eventRouter.post('/', (_req: Request, res: Response) => {
  return ApiResponse.created(res, null, 'Create event endpoint scaffolded');
});

eventRouter.get('/:eventId', (_req: Request, res: Response) => {
  return ApiResponse.success(res, { message: 'Get event endpoint scaffolded' });
});

eventRouter.patch('/:eventId', (_req: Request, res: Response) => {
  return ApiResponse.success(res, { message: 'Update event endpoint scaffolded' });
});

eventRouter.delete('/:eventId', (_req: Request, res: Response) => {
  return ApiResponse.success(res, { message: 'Delete event endpoint scaffolded' });
});
