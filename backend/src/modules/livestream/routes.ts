import { Router, Request, Response } from 'express';
import { ApiResponse } from '../../shared/response/api-response';

export class LivestreamController {
  getStreams = async (_req: Request, res: Response) => {
    return ApiResponse.success(res, { message: 'List live streams endpoint scaffolded', data: [] });
  };
  createStream = async (_req: Request, res: Response) => {
    return ApiResponse.created(res, null, 'Create live stream endpoint scaffolded');
  };
}

export const livestreamController = new LivestreamController();
export const livestreamService = {};
export const livestreamRepository = {};

export const livestreamRouter = Router({ mergeParams: true });
livestreamRouter.get('/', livestreamController.getStreams);
livestreamRouter.post('/', livestreamController.createStream);
