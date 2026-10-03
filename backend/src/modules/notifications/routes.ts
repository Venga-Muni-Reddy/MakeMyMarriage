import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { requireWeddingMember } from '../../middleware/wedding.middleware';
import { notificationController } from './notification.controller';

export const notificationRouter = Router({ mergeParams: true });

// Wedding-scoped notification endpoints
notificationRouter.use(requireAuth, requireWeddingMember);

/**
 * @openapi
 * /api/v1/weddings/{weddingId}/notifications:
 *   get:
 *     summary: List notifications for a wedding with status, channel, and search filters
 *     tags: [Notifications]
 */
notificationRouter.get('/', notificationController.getNotifications);

/**
 * @openapi
 * /api/v1/weddings/{weddingId}/notifications/telemetry:
 *   get:
 *     summary: Get notification delivery metrics and channel breakdown
 *     tags: [Notifications]
 */
notificationRouter.get('/telemetry', notificationController.getTelemetry);

/**
 * @openapi
 * /api/v1/weddings/{weddingId}/notifications/send:
 *   post:
 *     summary: Send a direct email or WhatsApp notification to a guest or user
 *     tags: [Notifications]
 */
notificationRouter.post('/send', notificationController.sendNotification);

/**
 * @openapi
 * /api/v1/weddings/{weddingId}/notifications/broadcast:
 *   post:
 *     summary: Broadcast an announcement to a guest segment via WhatsApp or Email
 *     tags: [Notifications]
 */
notificationRouter.post('/broadcast', notificationController.broadcast);

/**
 * @openapi
 * /api/v1/weddings/{weddingId}/notifications/trigger-reminders:
 *   post:
 *     summary: Run countdown check and trigger upcoming ceremonial reminders
 *     tags: [Notifications]
 */
notificationRouter.post('/trigger-reminders', notificationController.triggerCeremonyReminders);

/**
 * @openapi
 * /api/v1/weddings/{weddingId}/notifications/{id}/retry:
 *   post:
 *     summary: Retry a failed notification dispatch
 *     tags: [Notifications]
 */
notificationRouter.post('/:id/retry', notificationController.retryNotification);

/**
 * @openapi
 * /api/v1/weddings/{weddingId}/notifications/triggers:
 *   get:
 *     summary: Get automated trigger settings
 *     tags: [Notifications]
 */
notificationRouter.get('/triggers', notificationController.getTriggerSettings);

/**
 * @openapi
 * /api/v1/weddings/{weddingId}/notifications/triggers:
 *   patch:
 *     summary: Update automated trigger settings
 *     tags: [Notifications]
 */
notificationRouter.patch('/triggers', notificationController.updateTriggerSettings);

/**
 * @openapi
 * /api/v1/weddings/{weddingId}/notifications/inbox:
 *   get:
 *     summary: Get current user in-app notifications
 *     tags: [Notifications]
 */
notificationRouter.get('/inbox', notificationController.getUserInbox);

/**
 * @openapi
 * /api/v1/weddings/{weddingId}/notifications/inbox/read-all:
 *   patch:
 *     summary: Mark all user in-app notifications as read
 *     tags: [Notifications]
 */
notificationRouter.patch('/inbox/read-all', notificationController.markAllAsRead);

/**
 * @openapi
 * /api/v1/weddings/{weddingId}/notifications/{id}/read:
 *   patch:
 *     summary: Mark a single notification as read
 *     tags: [Notifications]
 */
notificationRouter.patch('/:id/read', notificationController.markAsRead);
