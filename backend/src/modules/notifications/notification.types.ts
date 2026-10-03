import { NotificationChannel, NotificationStatus } from '@prisma/client';

export type { NotificationChannel, NotificationStatus };

export type NotificationType =
  | 'INVITATION_DISPATCH'
  | 'RSVP_CONFIRMATION'
  | 'COUNTDOWN_REMINDER'
  | 'TASK_ASSIGNED'
  | 'COLLABORATOR_INVITED'
  | 'BROADCAST_ANNOUNCEMENT';

export interface NotificationPayload {
  recipientName?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  weddingTitle?: string;
  coupleTitle?: string;
  venueName?: string;
  ceremonyName?: string;
  magicUrl?: string;
  passCode?: string;
  message?: string;
  paxCount?: number;
  dietary?: string;
  daysRemaining?: number;
  actionUrl?: string;
  metadata?: Record<string, any>;
  [key: string]: any;
}

export interface SendNotificationDTO {
  recipientUserId?: string;
  recipientGuestId?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  recipientName?: string;
  type: NotificationType;
  channel: NotificationChannel;
  subject?: string;
  message: string;
  payload?: NotificationPayload;
}

export interface BroadcastNotificationDTO {
  segment: 'ALL_GUESTS' | 'CONFIRMED_RSVP' | 'PENDING_RSVP' | 'COUNCIL_COLLABORATORS';
  channel: NotificationChannel | 'BOTH';
  subject: string;
  message: string;
  ceremonyScope?: string;
}

export interface NotificationTelemetryDTO {
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

export interface NotificationTriggerSettingsDTO {
  autoInviteOnGuestAdd: boolean;
  autoRsvpConfirmation: boolean;
  ceremonyCountdown24h: boolean;
  ceremonyCountdown7d: boolean;
  taskDeadlineAlerts: boolean;
  whatsappPassDispatch: boolean;
  emailPassDispatch: boolean;
}
