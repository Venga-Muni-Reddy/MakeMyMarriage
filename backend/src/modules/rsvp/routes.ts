import { Router } from 'express';
import { rsvpController } from './rsvp.controller';
import { requireAuth } from '../../middleware/auth.middleware';
import { requireWeddingMember } from '../../middleware/wedding.middleware';

export const rsvpRouter = Router({ mergeParams: true });

rsvpRouter.use(requireAuth);
rsvpRouter.use(requireWeddingMember);

rsvpRouter.get('/', rsvpController.getRsvps);
rsvpRouter.get('/telemetry', rsvpController.getTelemetry);
rsvpRouter.post('/manual', rsvpController.submitManualRsvp);

// Public router for guest unboxing RSVP
export const publicRsvpRouter = Router();
publicRsvpRouter.get('/:token', rsvpController.getPublicRsvp);
publicRsvpRouter.post('/:token', rsvpController.submitPublicRsvp);
