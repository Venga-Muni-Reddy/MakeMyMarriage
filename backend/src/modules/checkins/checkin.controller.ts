import { Request, Response, NextFunction } from 'express';
import { checkinService } from './checkin.service';
import { ApiResponse } from '../../shared/response/api-response';

export class CheckinController {
  /**
   * POST /api/v1/weddings/:weddingId/checkins/scan
   * Scan QR pass or manual token code
   */
  scanPass = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { weddingId } = req.params;
      const dossier = await checkinService.scanPass(weddingId, req.body);
      return ApiResponse.success(res, { data: dossier, message: 'Pass scanned and analyzed' });
    } catch (err: any) {
      next(err);
    }
  };

  /**
   * POST /api/v1/weddings/:weddingId/checkins/confirm
   * Confirm gate clearance and commit check-in entry
   */
  confirmCheckIn = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { weddingId } = req.params;
      const result = await checkinService.confirmCheckIn(weddingId, req.body);
      return ApiResponse.created(res, result, result.message);
    } catch (err: any) {
      next(err);
    }
  };

  /**
   * POST /api/v1/weddings/:weddingId/checkins/walk-in
   * Register manual walk-in guest at gate
   */
  manualWalkIn = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { weddingId } = req.params;
      const result = await checkinService.manualWalkIn(weddingId, req.body);
      return ApiResponse.created(res, result, 'Manual walk-in registered successfully');
    } catch (err: any) {
      next(err);
    }
  };

  /**
   * GET /api/v1/weddings/:weddingId/checkins/telemetry
   * Get real-time gate telemetry statistics
   */
  getTelemetry = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { weddingId } = req.params;
      const { eventId } = req.query as { eventId?: string };
      const telemetry = await checkinService.getTelemetry(weddingId, eventId);
      return ApiResponse.success(res, { data: telemetry, message: 'Gate telemetry retrieved' });
    } catch (err: any) {
      next(err);
    }
  };

  /**
   * GET /api/v1/weddings/:weddingId/checkins/ledger
   * Get recent gate check-in chronological arrivals
   */
  getLedger = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { weddingId } = req.params;
      const { filter } = req.query as { filter?: any };
      const ledger = await checkinService.getLedger(weddingId, filter);
      return ApiResponse.success(res, { data: ledger, message: 'Gate ledger retrieved' });
    } catch (err: any) {
      next(err);
    }
  };

  /**
   * Legacy alias: GET /api/v1/weddings/:weddingId/checkins
   */
  getEntries = async (req: Request, res: Response, next: NextFunction) => {
    return this.getLedger(req, res, next);
  };

  /**
   * Legacy alias: POST /api/v1/weddings/:weddingId/checkins
   */
  checkInGuest = async (req: Request, res: Response, next: NextFunction) => {
    return this.confirmCheckIn(req, res, next);
  };
}

export const checkinController = new CheckinController();
