import { Router } from 'express';
import { checkinController } from './checkin.controller';
import { checkinService } from './checkin.service';
import { checkinRepository } from './checkin.repository';

export { checkinController, checkinService, checkinRepository };

export const checkinRouter = Router({ mergeParams: true });

// QR Pass Scan & Validation
checkinRouter.post('/scan', checkinController.scanPass);

// Confirm Gate Clearance
checkinRouter.post('/confirm', checkinController.confirmCheckIn);

// Manual Walk-in Registration
checkinRouter.post('/walk-in', checkinController.manualWalkIn);

// Gate Telemetry & Counts
checkinRouter.get('/telemetry', checkinController.getTelemetry);

// Recent Chronological Ledger
checkinRouter.get('/ledger', checkinController.getLedger);

// Root aliases
checkinRouter.get('/', checkinController.getEntries);
checkinRouter.post('/', checkinController.checkInGuest);
