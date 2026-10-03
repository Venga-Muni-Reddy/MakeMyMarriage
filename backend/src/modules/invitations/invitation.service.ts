import {
  invitationRepository,
  HERITAGE_THEMES,
  SOUNDSCAPES,
} from './invitation.repository';
import { InvitationStudioSettings } from './invitation.types';
import { generateInvitationEmailHtml, generateInvitationEmailText } from './invitation.email';
import { emailService } from '../../infrastructure/email/email.service';
import { config } from '../../config';
import prisma from '../../infrastructure/prisma/client';

export const invitationService = {
  async getInvitations(weddingId: string, query?: { search?: string; status?: string }) {
    return invitationRepository.findMany(weddingId, query);
  },

  async getTelemetry(weddingId: string) {
    return invitationRepository.calculateTelemetry(weddingId);
  },

  async getSettings(weddingId: string) {
    return invitationRepository.getSettings(weddingId);
  },

  async updateSettings(weddingId: string, data: Partial<InvitationStudioSettings>) {
    return invitationRepository.updateSettings(weddingId, data);
  },

  async mintInvitations(weddingId: string) {
    await invitationRepository.ensureInvitationsMinted(weddingId);
    return { success: true, message: 'Cryptographic invitation tokens minted for active roll' };
  },

  async dispatchSingle(
    weddingId: string,
    invitationId: string,
    channel: string = 'WHATSAPP',
    customNote?: string
  ) {
    let deliveredMessage = 'Royal invitation pass dispatched successfully';

    if (channel === 'EMAIL') {
      const inv = await prisma.invitation.findFirst({
        where: { id: invitationId, weddingId },
        include: { guest: true, wedding: true },
      });

      if (!inv) throw new Error('Invitation record not found');
      if (!inv.guest.email) {
        throw new Error(`Guest "${inv.guest.displayName}" does not have an email address configured.`);
      }

      const guestMeta = (inv.guest.metadata as Record<string, any>) || {};
      const magicToken = guestMeta.magicToken || `tok_${inv.id.replace(/-/g, '').substring(0, 24)}`;
      const appUrl = process.env.APP_URL || process.env.CORS_ORIGIN || 'http://localhost:5173';
      const magicUrl = `${appUrl}/invite/${magicToken}`;

      const weddingSettings = (inv.wedding.settings as any)?.invitationStudio || {};

      const emailHtml = generateInvitationEmailHtml({
        recipientName: inv.guest.displayName,
        recipientEmail: inv.guest.email,
        weddingTitle: inv.wedding.name,
        coupleNames: weddingSettings.customMonogramText ? `${inv.wedding.name}` : (inv.wedding.name || 'Royal Couple'),
        venueName: (inv.wedding.settings as any)?.primaryVenueName || 'The Leela Palace, Udaipur',
        magicUrl,
        paxCount: Number(guestMeta.paxCount) || 1,
        allocatedSuite: guestMeta.allocatedSuite || 'Palace Heritage Wing',
        shlokaVerse: weddingSettings.verseText,
      });

      const emailText = generateInvitationEmailText({
        recipientName: inv.guest.displayName,
        recipientEmail: inv.guest.email,
        weddingTitle: inv.wedding.name,
        coupleNames: (inv.wedding.name || 'Royal Couple'),
        venueName: (inv.wedding.settings as any)?.primaryVenueName || 'The Leela Palace, Udaipur',
        magicUrl,
        paxCount: Number(guestMeta.paxCount) || 1,
        allocatedSuite: guestMeta.allocatedSuite || 'Palace Heritage Wing',
      });

      const sendResult = await emailService.sendEmail({
        to: inv.guest.email,
        subject: `✨ Royal Vivah Aamantran: Nuptials of ${inv.wedding.name}`,
        html: emailHtml,
        text: emailText,
        recipientName: inv.guest.displayName,
      });

      if (!sendResult.success) {
        throw new Error(`Email dispatch failed: ${sendResult.error || 'Check SMTP/Resend configuration'}`);
      }

      if (sendResult.channel === 'SMTP') {
        deliveredMessage = `Royal digital invitation dispatched via SMTP to ${inv.guest.email}`;
      } else if (sendResult.channel === 'SANDBOX_REDIRECT') {
        deliveredMessage = `Royal invitation delivered to ${sendResult.deliveredTo} (Resend sandbox preview for ${inv.guest.displayName})`;
      } else {
        deliveredMessage = `Royal digital invitation delivered to ${inv.guest.email}`;
      }
    }

    await invitationRepository.dispatchSingle(weddingId, invitationId, channel);

    return {
      success: true,
      invitationId,
      channel,
      message: deliveredMessage,
    };
  },

  async bulkDispatch(weddingId: string, invitationIds: string[], channel: string = 'WHATSAPP') {
    if (channel === 'EMAIL') {
      let sentCount = 0;
      const errors: string[] = [];

      for (const id of invitationIds) {
        try {
          await this.dispatchSingle(weddingId, id, 'EMAIL');
          sentCount++;
        } catch (e: any) {
          errors.push(e.message);
        }
      }

      return {
        success: true,
        count: sentCount,
        channel,
        message: `${sentCount} royal email invitations dispatched${errors.length > 0 ? ` (${errors.length} failed/no email)` : ''}`,
      };
    }

    const result = await invitationRepository.bulkDispatch(weddingId, invitationIds, channel);
    return {
      success: true,
      count: result.count,
      channel,
      message: `${result.count} digital imperial passes dispatched via ${channel}`,
    };
  },

  async resolvePublicPass(token: string) {
    const pass = await invitationRepository.findByToken(token);
    if (!pass) {
      throw new Error('Royal invitation pass token invalid or expired');
    }
    return pass;
  },

  getThemes() {
    return HERITAGE_THEMES;
  },

  getSoundscapes() {
    return SOUNDSCAPES;
  },
};
