import { Router } from 'express';
import { authRouter } from './modules/auth/routes';
import { weddingRouter } from './modules/weddings/routes';
import { eventRouter } from './modules/events/routes';
import { guestRouter } from './modules/guests/routes';
import { invitationRouter, publicInvitationRouter } from './modules/invitations/routes';
import { rsvpRouter } from './modules/rsvp/routes';
import { taskRouter } from './modules/tasks/routes';
import { mediaRouter } from './modules/media/routes';
import { checkinRouter } from './modules/checkins/routes';
import { livestreamRouter } from './modules/livestream/routes';
import { websiteRouter } from './modules/website/routes';
import { notificationRouter } from './modules/notifications/routes';
import { activityRouter } from './modules/activities/routes';
import { sseService } from './infrastructure/realtime/sse.service';

export const apiRouter = Router();

// Health check endpoint
apiRouter.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'makemymarriage-backend',
  });
});

// Domain modules
apiRouter.use('/auth', authRouter);
apiRouter.use('/weddings', weddingRouter);
apiRouter.use('/weddings/:weddingId/events', eventRouter);
apiRouter.use('/weddings/:weddingId/guests', guestRouter);
apiRouter.use('/weddings/:weddingId/invitations', invitationRouter);
apiRouter.use('/weddings/:weddingId/rsvps', rsvpRouter);
apiRouter.use('/weddings/:weddingId/tasks', taskRouter);
apiRouter.use('/weddings/:weddingId/media', mediaRouter);
apiRouter.use('/weddings/:weddingId/checkins', checkinRouter);
apiRouter.use('/weddings/:weddingId/livestreams', livestreamRouter);
apiRouter.use('/weddings/:weddingId/website', websiteRouter);
apiRouter.use('/weddings/:weddingId/notifications', notificationRouter);
apiRouter.use('/weddings/:weddingId/activities', activityRouter);
apiRouter.use('/public/invitations', publicInvitationRouter);

// Realtime SSE stream endpoint (/api/v1/weddings/:weddingId/events/stream)
apiRouter.get('/weddings/:weddingId/events/stream', (req, res) => {
  const weddingId = req.params.weddingId;
  const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const userId = 'guest_or_user';
  sseService.registerClient(clientId, weddingId, userId, res);
});
