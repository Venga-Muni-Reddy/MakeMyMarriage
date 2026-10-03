import prisma from '../../infrastructure/prisma/client';
import {
  NotificationChannel,
  NotificationStatus,
  NotificationType,
  NotificationPayload,
  NotificationTelemetryDTO,
  NotificationTriggerSettingsDTO,
} from './notification.types';

export class NotificationRepository {
  async create(data: {
    weddingId: string;
    recipientUserId?: string | null;
    recipientGuestId?: string | null;
    type: NotificationType;
    channel: NotificationChannel;
    status: NotificationStatus;
    subject?: string | null;
    payload?: NotificationPayload;
    scheduledAt?: Date | null;
    sentAt?: Date | null;
    failedAt?: Date | null;
  }) {
    return prisma.notification.create({
      data: {
        weddingId: data.weddingId,
        recipientUserId: data.recipientUserId || null,
        recipientGuestId: data.recipientGuestId || null,
        type: data.type,
        channel: data.channel,
        status: data.status,
        subject: data.subject || null,
        payload: (data.payload as any) || {},
        scheduledAt: data.scheduledAt || null,
        sentAt: data.sentAt || null,
        failedAt: data.failedAt || null,
      },
      include: {
        recipientUser: {
          select: { id: true, name: true, email: true },
        },
        recipientGuest: {
          select: { id: true, displayName: true, email: true, phone: true },
        },
      },
    });
  }

  async findMany(
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
    const where: any = { weddingId };

    if (filters?.channel) where.channel = filters.channel;
    if (filters?.status) where.status = filters.status;
    if (filters?.type) where.type = filters.type;
    if (filters?.search) {
      where.OR = [
        { subject: { contains: filters.search, mode: 'insensitive' } },
        { recipientUser: { name: { contains: filters.search, mode: 'insensitive' } } },
        { recipientUser: { email: { contains: filters.search, mode: 'insensitive' } } },
        { recipientGuest: { displayName: { contains: filters.search, mode: 'insensitive' } } },
        { recipientGuest: { email: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    return prisma.notification.findMany({
      where,
      include: {
        recipientUser: {
          select: { id: true, name: true, email: true },
        },
        recipientGuest: {
          select: { id: true, displayName: true, email: true, phone: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 50,
      skip: filters?.offset || 0,
    });
  }

  async findById(weddingId: string, id: string) {
    return prisma.notification.findFirst({
      where: { id, weddingId },
      include: {
        recipientUser: { select: { id: true, name: true, email: true } },
        recipientGuest: { select: { id: true, displayName: true, email: true, phone: true } },
      },
    });
  }

  async updateStatus(
    id: string,
    status: NotificationStatus,
    extra?: { sentAt?: Date | null; failedAt?: Date | null; error?: string }
  ) {
    const current = await prisma.notification.findUnique({
      where: { id },
      select: { payload: true },
    });
    const currentPayload = (current?.payload as any) || {};
    if (extra?.error) {
      currentPayload.lastError = extra.error;
    }

    return prisma.notification.update({
      where: { id },
      data: {
        status,
        ...(extra?.sentAt !== undefined ? { sentAt: extra.sentAt } : {}),
        ...(extra?.failedAt !== undefined ? { failedAt: extra.failedAt } : {}),
        payload: currentPayload,
      },
      include: {
        recipientUser: { select: { id: true, name: true, email: true } },
        recipientGuest: { select: { id: true, displayName: true, email: true, phone: true } },
      },
    });
  }

  async getTelemetry(weddingId: string): Promise<NotificationTelemetryDTO> {
    const [all, triggerSettings] = await Promise.all([
      prisma.notification.findMany({
        where: { weddingId },
        select: { channel: true, status: true },
      }),
      this.getTriggerSettings(weddingId),
    ]);

    const totalDispatches = all.length;
    let deliveredCount = 0;
    let pendingQueuedCount = 0;
    let failedCount = 0;
    const channels = { whatsapp: 0, email: 0, sms: 0, push: 0 };

    for (const item of all) {
      if (item.status === 'DELIVERED' || item.status === 'SENT') deliveredCount++;
      else if (item.status === 'PENDING' || item.status === 'QUEUED') pendingQueuedCount++;
      else if (item.status === 'FAILED') failedCount++;

      if (item.channel === 'WHATSAPP') channels.whatsapp++;
      else if (item.channel === 'EMAIL') channels.email++;
      else if (item.channel === 'SMS') channels.sms++;
      else if (item.channel === 'PUSH') channels.push++;
    }

    const deliverySuccessRate =
      totalDispatches > 0 ? Math.round((deliveredCount / totalDispatches) * 100) : 100;

    return {
      totalDispatches,
      deliveredCount,
      pendingQueuedCount,
      failedCount,
      deliverySuccessRate,
      channels,
      recentTriggers: {
        autoInviteOnGuestAdd: triggerSettings.autoInviteOnGuestAdd,
        autoRsvpConfirmation: triggerSettings.autoRsvpConfirmation,
        ceremonyCountdown24h: triggerSettings.ceremonyCountdown24h,
        ceremonyCountdown7d: triggerSettings.ceremonyCountdown7d,
        taskDeadlineAlerts: triggerSettings.taskDeadlineAlerts,
      },
    };
  }

  async getTriggerSettings(weddingId: string): Promise<NotificationTriggerSettingsDTO> {
    const wedding = await prisma.wedding.findUnique({
      where: { id: weddingId },
      select: { settings: true },
    });
    const s = ((wedding?.settings as any) || {}).notificationTriggers || {};
    return {
      autoInviteOnGuestAdd: s.autoInviteOnGuestAdd ?? true,
      autoRsvpConfirmation: s.autoRsvpConfirmation ?? true,
      ceremonyCountdown24h: s.ceremonyCountdown24h ?? true,
      ceremonyCountdown7d: s.ceremonyCountdown7d ?? true,
      taskDeadlineAlerts: s.taskDeadlineAlerts ?? true,
      whatsappPassDispatch: s.whatsappPassDispatch ?? true,
      emailPassDispatch: s.emailPassDispatch ?? true,
    };
  }

  async updateTriggerSettings(
    weddingId: string,
    newSettings: Partial<NotificationTriggerSettingsDTO>
  ): Promise<NotificationTriggerSettingsDTO> {
    const wedding = await prisma.wedding.findUnique({
      where: { id: weddingId },
      select: { settings: true },
    });
    const currentSettings = (wedding?.settings as any) || {};
    const existingTriggers = currentSettings.notificationTriggers || {};
    const updatedTriggers = {
      ...existingTriggers,
      ...newSettings,
    };

    await prisma.wedding.update({
      where: { id: weddingId },
      data: {
        settings: {
          ...currentSettings,
          notificationTriggers: updatedTriggers,
        },
      },
    });

    return this.getTriggerSettings(weddingId);
  }

  async getUserInbox(userId: string, weddingId?: string) {
    const where: any = {
      OR: [
        { recipientUserId: userId },
        ...(weddingId ? [{ weddingId }] : []),
      ],
    };

    return prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async markAsRead(id: string) {
    const current = await prisma.notification.findUnique({
      where: { id },
      select: { payload: true },
    });
    const payload = (current?.payload as any) || {};
    payload.isRead = true;
    payload.readAt = new Date().toISOString();

    return prisma.notification.update({
      where: { id },
      data: { payload },
    });
  }

  async markAllAsRead(userId: string, weddingId?: string) {
    const where: any = {
      OR: [
        { recipientUserId: userId },
        ...(weddingId ? [{ weddingId }] : []),
      ],
    };

    const notifs = await prisma.notification.findMany({
      where,
      select: { id: true, payload: true },
    });

    for (const n of notifs) {
      const payload = (n.payload as any) || {};
      payload.isRead = true;
      payload.readAt = new Date().toISOString();
      await prisma.notification.update({
        where: { id: n.id },
        data: { payload },
      });
    }

    return true;
  }
}

export const notificationRepository = new NotificationRepository();
