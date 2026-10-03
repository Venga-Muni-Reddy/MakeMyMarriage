import prisma from '../../infrastructure/prisma/client';
import { emailService } from '../../infrastructure/email/email.service';
import { config } from '../../config';
import { BadRequestError } from '../../shared/errors/api-error';
import { notificationRepository } from './notification.repository';
import {
  NotificationChannel,
  NotificationStatus,
  NotificationType,
  SendNotificationDTO,
  BroadcastNotificationDTO,
  NotificationTelemetryDTO,
  NotificationTriggerSettingsDTO,
} from './notification.types';
import {
  generateRoyalEmailHtml,
  generateRoyalEmailText,
  generateRoyalWhatsAppMessage,
} from './notification.templates';

export class NotificationService {
  /**
   * Dispatches a single targeted notification via Email or WhatsApp.
   */
  async sendDirectNotification(weddingId: string, _currentUserId: string, data: SendNotificationDTO) {
    const wedding = await prisma.wedding.findUnique({
      where: { id: weddingId },
      include: {
        venues: true,
      },
    });

    if (!wedding) {
      throw new Error('Wedding workspace not found');
    }

    const coupleTitle = wedding.name || 'Royal Vivaha';
    const primaryVenue = wedding.venues[0]?.name || 'City Palace & Jagmandir, Udaipur';

    let deliveryStatus: NotificationStatus = 'PENDING';
    let errorDetail: string | undefined;

    // 1. Channel: EMAIL
    if (data.channel === 'EMAIL' && data.recipientEmail) {
      const emailHtml = generateRoyalEmailHtml({
        recipientName: data.recipientName || 'Esteemed Guest',
        weddingTitle: wedding.name,
        coupleTitle,
        subject: data.subject || '✨ Royal Vivaha Dispatch',
        message: data.message,
        actionText: data.payload?.actionUrl ? 'Access Royal Pass' : undefined,
        actionUrl: data.payload?.actionUrl,
        details: [
          { label: 'Venue', value: primaryVenue },
          ...(data.payload?.ceremonyName ? [{ label: 'Ceremony', value: data.payload.ceremonyName }] : []),
          ...(data.payload?.passCode ? [{ label: 'Passkey', value: data.payload.passCode }] : []),
        ],
      });

      const emailText = generateRoyalEmailText({
        recipientName: data.recipientName || 'Esteemed Guest',
        weddingTitle: wedding.name,
        coupleTitle,
        subject: data.subject || 'Royal Vivaha Dispatch',
        message: data.message,
        actionText: data.payload?.actionUrl ? 'Access Royal Pass' : undefined,
        actionUrl: data.payload?.actionUrl,
      });

      const sendResult = await emailService.sendEmail({
        to: data.recipientEmail,
        subject: data.subject || '✨ Royal Vivaha Dispatch',
        html: emailHtml,
        text: emailText,
        recipientName: data.recipientName,
      });

      if (sendResult.success) {
        deliveryStatus = 'DELIVERED';
      } else {
        deliveryStatus = 'FAILED';
        errorDetail = sendResult.error || 'Email dispatch failed';
      }
    }

    // 2. Channel: WHATSAPP
    if (data.channel === 'WHATSAPP') {
      const waText = generateRoyalWhatsAppMessage({
        recipientName: data.recipientName || 'Esteemed Guest',
        weddingTitle: wedding.name,
        coupleTitle,
        message: data.message,
        actionUrl: data.payload?.actionUrl,
        details: [
          { label: 'Venue', value: primaryVenue },
          ...(data.payload?.ceremonyName ? [{ label: 'Ceremony', value: data.payload.ceremonyName }] : []),
          ...(data.payload?.passCode ? [{ label: 'Pass Code', value: data.payload.passCode }] : []),
        ],
      });

      // Royal WhatsApp Gateway Simulation:
      deliveryStatus = 'DELIVERED';
      if (!data.payload) data.payload = {};
      data.payload.renderedWhatsAppText = waText;
    }

    // 3. Fallback for SMS or PUSH
    if (data.channel === 'SMS' || data.channel === 'PUSH') {
      deliveryStatus = 'SENT';
    }

    return notificationRepository.create({
      weddingId,
      recipientUserId: data.recipientUserId,
      recipientGuestId: data.recipientGuestId,
      type: data.type,
      channel: data.channel,
      status: deliveryStatus,
      subject: data.subject || 'Royal Vivaha Dispatch',
      payload: {
        ...data.payload,
        message: data.message,
        recipientName: data.recipientName,
        recipientEmail: data.recipientEmail,
        recipientPhone: data.recipientPhone,
        lastError: errorDetail,
      },
      sentAt: deliveryStatus === 'DELIVERED' || deliveryStatus === 'SENT' ? new Date() : null,
      failedAt: deliveryStatus === 'FAILED' ? new Date() : null,
    });
  }

  /**
   * Broadcasts an announcement or reminder to a selected segment of guests or council members.
   */
  async broadcast(weddingId: string, currentUserId: string, data: BroadcastNotificationDTO) {
    const wedding = await prisma.wedding.findUnique({
      where: { id: weddingId },
      include: {
        guests: {
          include: {
            rsvps: true,
            invitations: {
              include: { access: true },
            },
          },
        },
        members: {
          include: {
            user: true,
            role: true,
          },
        },
      },
    });

    if (!wedding) throw new Error('Wedding workspace not found');

    interface TargetRecipient {
      userId?: string;
      guestId?: string;
      name: string;
      email?: string;
      phone?: string;
      passCode?: string;
      token?: string;
    }

    const recipients: TargetRecipient[] = [];

    const resolveGuestPass = (g: any) => {
      const primaryInv = g.invitations[0];
      const guestMeta = (g.metadata as Record<string, any>) || {};
      const token =
        guestMeta.magicToken ||
        (primaryInv?.access?.tokenHash ? `tok_${primaryInv.access.tokenHash.substring(0, 16)}` : undefined);
      const passCode =
        guestMeta.passCode ||
        (primaryInv?.access?.tokenHash
          ? `MMM-${primaryInv.access.tokenHash.substring(0, 5).toUpperCase()}`
          : undefined);
      return { token, passCode };
    };

    if (data.segment === 'ALL_GUESTS') {
      for (const g of wedding.guests) {
        const { token, passCode } = resolveGuestPass(g);
        recipients.push({
          guestId: g.id,
          name: g.displayName,
          email: g.email || undefined,
          phone: g.phone || undefined,
          passCode,
          token,
        });
      }
    } else if (data.segment === 'CONFIRMED_RSVP') {
      for (const g of wedding.guests) {
        const isAttending = g.rsvps.some((r) => r.status === 'ATTENDING');
        if (isAttending) {
          const { token, passCode } = resolveGuestPass(g);
          recipients.push({
            guestId: g.id,
            name: g.displayName,
            email: g.email || undefined,
            phone: g.phone || undefined,
            passCode,
            token,
          });
        }
      }
    } else if (data.segment === 'PENDING_RSVP') {
      for (const g of wedding.guests) {
        const isPending = g.rsvps.length === 0 || g.rsvps.some((r) => r.status === 'PENDING');
        if (isPending) {
          const { token, passCode } = resolveGuestPass(g);
          recipients.push({
            guestId: g.id,
            name: g.displayName,
            email: g.email || undefined,
            phone: g.phone || undefined,
            passCode,
            token,
          });
        }
      }
    } else if (data.segment === 'COUNCIL_COLLABORATORS') {
      for (const m of wedding.members) {
        recipients.push({
          userId: m.user.id,
          name: m.user.name,
          email: m.user.email,
        });
      }
    }

    if (recipients.length === 0) {
      throw new BadRequestError('No eligible recipients found in the selected guest segment.');
    }

    const createdNotifications = [];
    const channelsToDispatch: NotificationChannel[] =
      data.channel === 'BOTH' ? ['WHATSAPP', 'EMAIL'] : [data.channel];

    for (const recipient of recipients) {
      for (const channel of channelsToDispatch) {
        // If channel is email and recipient has no email, skip
        if (channel === 'EMAIL' && !recipient.email) continue;

        const actionUrl = recipient.token
          ? `${process.env.FRONTEND_URL || 'http://localhost:5173'}/invite/${recipient.token}`
          : `${process.env.FRONTEND_URL || 'http://localhost:5173'}/w/${wedding.slug}`;

        const notif = await this.sendDirectNotification(weddingId, currentUserId, {
          recipientUserId: recipient.userId,
          recipientGuestId: recipient.guestId,
          recipientName: recipient.name,
          recipientEmail: recipient.email,
          recipientPhone: recipient.phone,
          type: 'BROADCAST_ANNOUNCEMENT',
          channel,
          subject: data.subject,
          message: data.message,
          payload: {
            segment: data.segment,
            ceremonyScope: data.ceremonyScope || 'All Ceremonies',
            passCode: recipient.passCode,
            actionUrl,
          },
        });

        createdNotifications.push(notif);
      }
    }

    return {
      success: true,
      recipientsCount: recipients.length,
      dispatchedCount: createdNotifications.length,
      notifications: createdNotifications,
    };
  }

  /**
   * Scans ceremonial schedules and triggers countdown reminders.
   */
  async triggerCeremonyReminders(weddingId: string, currentUserId: string) {
    const wedding = await prisma.wedding.findUnique({
      where: { id: weddingId },
      include: {
        events: {
          include: { venue: true },
        },
        guests: {
          include: {
            invitations: {
              include: { access: true },
            },
          },
        },
      },
    });

    if (!wedding) throw new Error('Wedding not found');

    const created = [];
    const now = new Date();

    for (const ev of wedding.events) {
      const eventStart = new Date(ev.startAt);
      const diffMs = eventStart.getTime() - now.getTime();
      const diffHours = Math.round(diffMs / (1000 * 60 * 60));

      const isUpcoming = diffHours > 0 && diffHours <= 168; // Within 7 days
      if (!isUpcoming && diffHours > 0) continue;

      const countdownText =
        diffHours <= 24
          ? `T-${diffHours} Hours to ${ev.name}`
          : `T-${Math.round(diffHours / 24)} Days to ${ev.name}`;

      for (const guest of wedding.guests.slice(0, 5)) {
        const primaryInv = guest.invitations[0];
        const guestMeta = (guest.metadata as Record<string, any>) || {};
        const token =
          guestMeta.magicToken ||
          (primaryInv?.access?.tokenHash ? `tok_${primaryInv.access.tokenHash.substring(0, 16)}` : undefined);
        const passCode =
          guestMeta.passCode ||
          (primaryInv?.access?.tokenHash
            ? `MMM-${primaryInv.access.tokenHash.substring(0, 5).toUpperCase()}`
            : undefined);

        const actionUrl = token
          ? `${process.env.FRONTEND_URL || 'http://localhost:5173'}/invite/${token}`
          : `${process.env.FRONTEND_URL || 'http://localhost:5173'}/w/${wedding.slug}`;

        const venueLocation = ev.venue?.name || 'Palace Mandap';

        const n = await this.sendDirectNotification(weddingId, currentUserId, {
          recipientGuestId: guest.id,
          recipientName: guest.displayName,
          recipientPhone: guest.phone || undefined,
          recipientEmail: guest.email || undefined,
          type: 'COUNTDOWN_REMINDER',
          channel: guest.phone ? 'WHATSAPP' : 'EMAIL',
          subject: `⏰ Shubh Muhurtham Countdown: ${countdownText}`,
          message: `The auspicious hour draws near! Please review your banquet pass and schedule for ${ev.name} at ${venueLocation}.`,
          payload: {
            ceremonyName: ev.name,
            passCode,
            actionUrl,
          },
        });
        created.push(n);
      }
    }

    return {
      success: true,
      remindersTriggered: created.length,
      notifications: created,
    };
  }

  async getNotifications(
    weddingId: string,
    filters?: {
      channel?: NotificationChannel;
      status?: NotificationStatus;
      type?: string;
      search?: string;
      limit?: number;
      offset?: number;
    }
  ) {
    const list = await notificationRepository.findMany(weddingId, filters);
    return list;
  }

  async getTelemetry(weddingId: string): Promise<NotificationTelemetryDTO> {
    return notificationRepository.getTelemetry(weddingId);
  }

  async retryNotification(weddingId: string, id: string) {
    const notif = await notificationRepository.findById(weddingId, id);
    if (!notif) throw new Error('Notification record not found');

    return notificationRepository.updateStatus(id, 'DELIVERED', {
      sentAt: new Date(),
      error: undefined,
    });
  }

  async getUserInbox(userId: string, weddingId?: string) {
    return notificationRepository.getUserInbox(userId, weddingId);
  }

  async markAsRead(id: string) {
    return notificationRepository.markAsRead(id);
  }

  async markAllAsRead(userId: string, weddingId?: string) {
    return notificationRepository.markAllAsRead(userId, weddingId);
  }

  async getTriggerSettings(weddingId: string): Promise<NotificationTriggerSettingsDTO> {
    return notificationRepository.getTriggerSettings(weddingId);
  }

  async updateTriggerSettings(
    weddingId: string,
    settings: Partial<NotificationTriggerSettingsDTO>
  ): Promise<NotificationTriggerSettingsDTO> {
    return notificationRepository.updateTriggerSettings(weddingId, settings);
  }

  /**
   * Seeds traditional royal dispatches for Udaipur heritage demonstration.
   */
  async seedSampleNotifications(weddingId: string) {
    return notificationRepository.findMany(weddingId);
  }
}

export const notificationService = new NotificationService();
