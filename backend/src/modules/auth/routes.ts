import { Router, Request, Response } from 'express';
import { ApiResponse } from '../../shared/response/api-response';

export const authRouter = Router();

authRouter.post('/signup', (_req: Request, res: Response) => {
  return ApiResponse.created(res, null, 'Auth signup endpoint scaffolded');
});

authRouter.post('/login', (_req: Request, res: Response) => {
  return ApiResponse.success(res, { message: 'Auth login endpoint scaffolded' });
});

authRouter.post('/logout', (_req: Request, res: Response) => {
  return ApiResponse.success(res, { message: 'Auth logout endpoint scaffolded' });
});

authRouter.get('/me', (_req: Request, res: Response) => {
  return ApiResponse.success(res, { message: 'Auth me endpoint scaffolded' });
});
