import { Request, Response, NextFunction } from 'express';
import { livestreamService } from './livestream.service';
import { ApiResponse } from '../../shared/response/api-response';

export class LivestreamController {
  /**
   * GET /api/v1/weddings/:weddingId/livestreams/active
   */
  getActiveStream = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { weddingId } = req.params;
      const { eventId } = req.query as { eventId?: string };
      const stream = await livestreamService.getActiveStream(weddingId, eventId);
      return ApiResponse.success(res, { data: stream, message: 'Active live stream fetched' });
    } catch (err: any) {
      next(err);
    }
  };

  /**
   * GET /api/v1/weddings/:weddingId/livestreams
   */
  getStreams = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { weddingId } = req.params;
      const streams = await livestreamService.listStreams(weddingId);
      return ApiResponse.success(res, { data: streams, message: 'Live streams listed' });
    } catch (err: any) {
      next(err);
    }
  };

  /**
   * PATCH /api/v1/weddings/:weddingId/livestreams/:streamId
   */
  updateStream = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { weddingId, streamId } = req.params;
      const updated = await livestreamService.updateStream(weddingId, streamId, req.body);
      return ApiResponse.success(res, { data: updated, message: 'Stream settings updated' });
    } catch (err: any) {
      next(err);
    }
  };

  /**
   * POST /api/v1/weddings/:weddingId/livestreams/:streamId/blessings
   */
  sendBlessing = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { weddingId, streamId } = req.params;
      const blessing = await livestreamService.sendBlessing(weddingId, streamId, req.body);
      return ApiResponse.created(res, blessing, 'Blessing published and petals showered');
    } catch (err: any) {
      next(err);
    }
  };

  /**
   * POST /api/v1/weddings/:weddingId/livestreams/:streamId/petals
   */
  showerPetals = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { weddingId, streamId } = req.params;
      const count = Number(req.body.count || 25);
      const result = await livestreamService.showerPetals(weddingId, streamId, count);
      return ApiResponse.success(res, { data: result, message: 'Rose petals showered' });
    } catch (err: any) {
      next(err);
    }
  };

  /**
   * Legacy alias: POST /api/v1/weddings/:weddingId/livestreams
   */
  createStream = async (req: Request, res: Response, next: NextFunction) => {
    return this.updateStream(req, res, next);
  };
}

export const livestreamController = new LivestreamController();
