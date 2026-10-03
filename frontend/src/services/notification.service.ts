import api from './api';

export type NotificationChannel = 'EMAIL' | 'SMS' | 'WHATSAPP' | 'PUSH';
export type NotificationStatus = 'PENDING' | 'QUEUED' | 'SENT' | 'DELIVERED' | 'FAILED' | 'CANCELLED';
export type NotificationType =
  | 'INVITATION_DISPATCH'
  | 'RSVP_CONFIRMATION'
  | 'COUNTDOWN_REMINDER'
  | 'TASK_ASSIGNED'
  | 'COLLABORATOR_INVITED'
  | 'BROADCAST_ANNOUNCEMENT';

export interface NotificationItem {
  id: string;
  weddingId: string;
  recipientUserId?: string | null;
  recipientGuestId?: string | null;
  type: NotificationType;
  channel: NotificationChannel;
  status: NotificationStatus;
  subject?: string | null;
  payload: {
    message?: string;
    recipientName?: string;
    recipientEmail?: string;
    recipientPhone?: string;
    passCode?: string;
    actionUrl?: string;
    ceremonyName?: string;
    segment?: string;
    isRead?: boolean;
    lastError?: string;
    [key: string]: any;
  };
  scheduledAt?: string | null;
  sentAt?: string | null;
  failedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  recipientUser?: {
    id: string;
    name: string;
    email: string;
  } | null;
  recipientGuest?: {
    id: string;
    displayName: string;
    email?: string | null;
    phone?: string | null;
  } | null;
}

export interface NotificationTelemetry {
  totalDispatches: number;
  deliveredCount: number;
  pendingQueuedCount: number;
  failedCount: number;
  deliverySuccessRate: number;
  channels: {
    whatsapp: number;
    email: number;
    sms: number;
    push: number;
  };
  recentTriggers: {
    autoInviteOnGuestAdd: boolean;
    autoRsvpConfirmation: boolean;
    ceremonyCountdown24h: boolean;
    ceremonyCountdown7d: boolean;
    taskDeadlineAlerts: boolean;
  };
}

export interface TriggerSettings {
  autoInviteOnGuestAdd: boolean;
  autoRsvpConfirmation: boolean;
  ceremonyCountdown24h: boolean;
  ceremonyCountdown7d: boolean;
  taskDeadlineAlerts: boolean;
  whatsappPassDispatch: boolean;
  emailPassDispatch: boolean;
}

export interface BroadcastPayload {
  segment: 'ALL_GUESTS' | 'CONFIRMED_RSVP' | 'PENDING_RSVP' | 'COUNCIL_COLLABORATORS';
  channel: NotificationChannel | 'BOTH';
  subject: string;
  message: string;
  ceremonyScope?: string;
}

export const notificationService = {
  async getNotifications(
    weddingId: string,
    filters?: { channel?: string; status?: string; type?: string; search?: string }
  ): Promise<NotificationItem[]> {
    const params = new URLSearchParams();
    if (filters?.channel && filters.channel !== 'ALL') params.append('channel', filters.channel);
    if (filters?.status && filters.status !== 'ALL') params.append('status', filters.status);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.search) params.append('search', filters.search);

    const res: any = await api.get(`/weddings/${weddingId}/notifications?${params.toString()}`);
    return res?.data ?? [];
  },

  async getTelemetry(weddingId: string): Promise<NotificationTelemetry> {
    const res: any = await api.get(`/weddings/${weddingId}/notifications/telemetry`);
    return res?.data;
  },

  async broadcast(weddingId: string, payload: BroadcastPayload): Promise<any> {
    const res: any = await api.post(`/weddings/${weddingId}/notifications/broadcast`, payload);
    return res?.data;
  },

  async triggerCeremonyReminders(weddingId: string): Promise<any> {
    const res: any = await api.post(`/weddings/${weddingId}/notifications/trigger-reminders`, {});
    return res?.data;
  },

  async retryNotification(weddingId: string, id: string): Promise<NotificationItem> {
    const res: any = await api.post(`/weddings/${weddingId}/notifications/${id}/retry`, {});
    return res?.data;
  },

  async getTriggerSettings(weddingId: string): Promise<TriggerSettings> {
    const res: any = await api.get(`/weddings/${weddingId}/notifications/triggers`);
    return res?.data;
  },

  async updateTriggerSettings(weddingId: string, settings: Partial<TriggerSettings>): Promise<TriggerSettings> {
    const res: any = await api.patch(`/weddings/${weddingId}/notifications/triggers`, settings);
    return res?.data;
  },

  async getUserInbox(weddingId?: string): Promise<NotificationItem[]> {
    const url = weddingId ? `/weddings/${weddingId}/notifications/inbox` : `/notifications/inbox`;
    const res: any = await api.get(url);
    return res?.data ?? [];
  },

  async markAsRead(weddingId: string, id: string): Promise<void> {
    await api.patch(`/weddings/${weddingId}/notifications/${id}/read`, {});
  },

  async markAllAsRead(weddingId: string): Promise<void> {
    await api.patch(`/weddings/${weddingId}/notifications/inbox/read-all`, {});
  },
};
