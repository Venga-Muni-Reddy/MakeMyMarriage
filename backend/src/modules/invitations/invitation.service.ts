import {
  invitationRepository,
  HERITAGE_THEMES,
  SOUNDSCAPES,
} from './invitation.repository';
import { InvitationStudioSettings } from './invitation.types';
import { generateInvitationEmailHtml, generateInvitationEmailText } from './invitation.email';
import { resend } from '../../infrastructure/resend/client';
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

      if (!resend) {
        throw new Error('Resend email client is not configured. Please set RESEND_API_KEY in backend/.env');
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
        coupleNames: weddingSettings.customMonogramText ? `${inv.wedding.name}` : 'Radhika & Aarav',
        venueName: 'The Leela Palace, Udaipur',
        magicUrl,
        paxCount: Number(guestMeta.paxCount) || 1,
        allocatedSuite: guestMeta.allocatedSuite || 'Palace Heritage Wing',
        shlokaVerse: weddingSettings.verseText,
      });

      const emailText = generateInvitationEmailText({
        recipientName: inv.guest.displayName,
        recipientEmail: inv.guest.email,
        weddingTitle: inv.wedding.name,
        coupleNames: 'Radhika & Aarav',
        venueName: 'The Leela Palace, Udaipur',
        magicUrl,
        paxCount: Number(guestMeta.paxCount) || 1,
        allocatedSuite: guestMeta.allocatedSuite || 'Palace Heritage Wing',
      });

      const fromAddress = config.resend.emailFrom || 'MakeMyMarriage <onboarding@resend.dev>';
      const isSandbox = fromAddress.includes('resend.dev');
      const devOverride = process.env.RESEND_DEV_OVERRIDE_EMAIL || 'vengamunireddy040404@gmail.com';

      // Resend Sandbox Handling:
      // When using the default onboarding@resend.dev test domain, Resend strictly allows sending only
      // to the verified account owner. In dev/sandbox mode, we deliver to the owner's inbox for testing!
      const targetEmail = isSandbox ? devOverride : inv.guest.email;
      const isRedirected = isSandbox && inv.guest.email.toLowerCase() !== devOverride.toLowerCase();

      const subject = isRedirected
        ? `[Preview for ${inv.guest.displayName}] ✨ Royal Vivah Aamantran: Nuptials of ${inv.wedding.name}`
        : `✨ Royal Vivah Aamantran: Nuptials of ${inv.wedding.name}`;

      try {
        const sendResult = await resend.emails.send({
          from: fromAddress,
          to: targetEmail,
          subject,
          html: emailHtml,
          text: emailText,
        });

        if (sendResult.error) {
          throw new Error(sendResult.error.message);
        }

        if (isSandbox) {
          deliveredMessage = `Royal invitation delivered to ${devOverride} (Resend sandbox test for ${inv.guest.displayName})`;
        } else {
          deliveredMessage = `Royal digital invitation delivered to ${inv.guest.email}`;
        }
      } catch (err: any) {
        console.error('Resend delivery error:', err);
        throw new Error(`Email dispatch failed via Resend: ${err.message}`);
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
