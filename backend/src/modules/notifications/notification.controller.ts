import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../../shared/response/api-response';
import { notificationService } from './notification.service';
import { NotificationChannel, NotificationStatus } from './notification.types';

export class NotificationController {
  getNotifications = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const weddingId = req.params.weddingId;
      const { channel, status, type, search, limit, offset } = req.query;

      const notifications = await notificationService.getNotifications(weddingId, {
        channel: channel ? (String(channel).toUpperCase() as NotificationChannel) : undefined,
        status: status ? (String(status).toUpperCase() as NotificationStatus) : undefined,
        type: type ? String(type) : undefined,
        search: search ? String(search) : undefined,
        limit: limit ? Number(limit) : 50,
        offset: offset ? Number(offset) : 0,
      });

      return ApiResponse.success(res, { data: notifications });
    } catch (error) {
      next(error);
    }
  };

  getTelemetry = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const telemetry = await notificationService.getTelemetry(req.params.weddingId);
      return ApiResponse.success(res, { data: telemetry });
    } catch (error) {
      next(error);
    }
  };

  sendNotification = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const weddingId = req.params.weddingId;
      const currentUserId = req.user?.userId || 'system';
      const {
        recipientUserId,
        recipientGuestId,
        recipientEmail,
        recipientPhone,
        recipientName,
        type,
        channel,
        subject,
        message,
        payload,
      } = req.body;

      if (!channel || !message) {
        return res.status(400).json({ success: false, message: 'Channel and message are required' });
      }

      const notif = await notificationService.sendDirectNotification(weddingId, currentUserId, {
        recipientUserId,
        recipientGuestId,
        recipientEmail,
        recipientPhone,
        recipientName,
        type: type || 'BROADCAST_ANNOUNCEMENT',
        channel,
        subject,
        message,
        payload,
      });

      return ApiResponse.created(res, {
        data: notif,
        message: `Royal dispatch queued via ${channel}`,
      });
    } catch (error) {
      next(error);
    }
  };

  broadcast = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const weddingId = req.params.weddingId;
      const currentUserId = req.user?.userId || 'system';
      const { segment, channel, subject, message, ceremonyScope } = req.body;

      if (!segment || !channel || !message) {
        return res.status(400).json({
          success: false,
          message: 'Segment, channel, and message are required for royal broadcast',
        });
      }

      const result = await notificationService.broadcast(weddingId, currentUserId, {
        segment,
        channel,
        subject: subject || '👑 Royal Vivaha Announcement',
        message,
        ceremonyScope,
      });

      return ApiResponse.success(res, {
        data: result,
        message: `Broadcast dispatched to ${result.dispatchedCount} channels across ${result.recipientsCount} recipients`,
      });
    } catch (error) {
      next(error);
    }
  };

  triggerCeremonyReminders = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const weddingId = req.params.weddingId;
      const currentUserId = req.user?.userId || 'system';

      const result = await notificationService.triggerCeremonyReminders(weddingId, currentUserId);
      return ApiResponse.success(res, {
        data: result,
        message: `Muhurtham countdown alerts generated for ${result.remindersTriggered} recipients`,
      });
    } catch (error) {
      next(error);
    }
  };

  retryNotification = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { weddingId, id } = req.params;
      const retried = await notificationService.retryNotification(weddingId, id);
      return ApiResponse.success(res, {
        data: retried,
        message: 'Notification redispatched successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  getUserInbox = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const weddingId = req.params.weddingId || (req.query.weddingId as string);
      const inbox = await notificationService.getUserInbox(userId, weddingId);
      return ApiResponse.success(res, { data: inbox });
    } catch (error) {
      next(error);
    }
  };

  markAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updated = await notificationService.markAsRead(req.params.id);
      return ApiResponse.success(res, { data: updated, message: 'Notification marked as read' });
    } catch (error) {
      next(error);
    }
  };

  markAllAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const weddingId = req.params.weddingId || (req.query.weddingId as string);
      await notificationService.markAllAsRead(userId, weddingId);
      return ApiResponse.success(res, { message: 'All notifications marked as read' });
    } catch (error) {
      next(error);
    }
  };

  getTriggerSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const settings = await notificationService.getTriggerSettings(req.params.weddingId);
      return ApiResponse.success(res, { data: settings });
    } catch (error) {
      next(error);
    }
  };

  updateTriggerSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updated = await notificationService.updateTriggerSettings(req.params.weddingId, req.body);
      return ApiResponse.success(res, {
        data: updated,
        message: 'Automated notification triggers updated successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}

export const notificationController = new NotificationController();
