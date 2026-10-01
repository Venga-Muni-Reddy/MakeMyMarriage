import { Request, Response, NextFunction } from 'express';
import { rsvpService } from './rsvp.service';
import { ApiResponse } from '../../shared/response/api-response';

export class RsvpController {
  /**
   * Public: Get guest current RSVP details by magic token / qr pass code
   */
  getPublicRsvp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.params;
      const data = await rsvpService.getPublicRsvp(token);
      return ApiResponse.success(res, { data });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Public: Submit guest RSVP via magic token / qr pass code
   */
  submitPublicRsvp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.params;
      const result = await rsvpService.submitPublicRsvp(token, req.body);
      return ApiResponse.success(res, {
        data: result,
        message: 'Royal RSVP confirmed successfully with auspicious blessings.',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Protected: Get RSVP manifest for wedding
   */
  getRsvps = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { weddingId } = req.params;
      const { status, search, eventId } = req.query as {
        status?: string;
        search?: string;
        eventId?: string;
      };

      const data = await rsvpService.getRsvps(weddingId, { status, search, eventId });
      return ApiResponse.success(res, { data });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Protected: Get real-time RSVP telemetry & catering numbers
   */
  getTelemetry = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { weddingId } = req.params;
      const data = await rsvpService.getTelemetry(weddingId);
      return ApiResponse.success(res, { data });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Protected: Manually record guest RSVP on behalf of guest
   */
  submitManualRsvp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { weddingId } = req.params;
      const result = await rsvpService.submitManualRsvp(weddingId, req.body);
      return ApiResponse.success(res, {
        data: result,
        message: 'Manual RSVP successfully recorded into royal registry',
      });
    } catch (error) {
      next(error);
    }
  };
}

export const rsvpController = new RsvpController();
