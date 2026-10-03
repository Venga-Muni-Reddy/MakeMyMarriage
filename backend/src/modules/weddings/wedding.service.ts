import { weddingRepository } from './wedding.repository';
import { CreateWeddingDTO, UpdateWeddingDTO } from './wedding.types';
import prisma from '../../infrastructure/prisma/client';
import { emailService } from '../../infrastructure/email/email.service';
import {
  ConflictError,
  NotFoundError,
  ForbiddenError,
  BadRequestError,
} from '../../shared/errors/api-error';

export class WeddingService {
  async createWedding(ownerId: string, data: CreateWeddingDTO) {
    if (data.slug) {
      const existing = await weddingRepository.findBySlug(data.slug);
      if (existing) {
        throw new ConflictError(`The web handle '${data.slug}' is already taken. Please choose another.`);
      }
    }

    return weddingRepository.create(ownerId, data);
  }

  async getUserWeddings(userId: string) {
    return weddingRepository.findAllByUserId(userId);
  }

  async getWeddingById(weddingId: string, userId: string) {
    const wedding = await weddingRepository.findById(weddingId);
    if (!wedding) {
      throw new NotFoundError('Wedding workspace not found');
    }

    const membership = await weddingRepository.findMembership(weddingId, userId);
    if (!membership || membership.status !== 'ACTIVE') {
      throw new ForbiddenError('You do not have access to this wedding workspace');
    }

    return {
      ...wedding,
      userRole: membership.role.name,
    };
  }

  async checkSlugAvailability(slug: string) {
    const cleanSlug = slug.toLowerCase().trim();
    if (!cleanSlug || cleanSlug.length < 3) {
      return { available: false, slug: cleanSlug, message: 'Handle must be at least 3 characters' };
    }

    const existing = await weddingRepository.findBySlug(cleanSlug);
    return {
      available: !existing,
      slug: cleanSlug,
      message: existing ? 'Handle is already reserved' : 'Handle is available',
    };
  }

  async updateWedding(weddingId: string, userId: string, data: UpdateWeddingDTO) {
    const wedding = await weddingRepository.findById(weddingId);
    if (!wedding) {
      throw new NotFoundError('Wedding workspace not found');
    }

    const membership = await weddingRepository.findMembership(weddingId, userId);
    if (!membership || !['OWNER', 'ORGANIZER'].includes(membership.role.name)) {
      throw new ForbiddenError('Only workspace Owners and Organizers can update wedding settings');
    }

    if (data.slug && data.slug.toLowerCase().trim() !== wedding.slug) {
      const existing = await weddingRepository.findBySlug(data.slug);
      if (existing && existing.id !== weddingId) {
        throw new ConflictError(`The web handle '${data.slug}' is already taken.`);
      }
    }

    return weddingRepository.update(weddingId, data);
  }

  async deleteWedding(weddingId: string, userId: string) {
    const wedding = await weddingRepository.findById(weddingId);
    if (!wedding) {
      throw new NotFoundError('Wedding workspace not found');
    }

    const membership = await weddingRepository.findMembership(weddingId, userId);
    if (!membership || membership.role.name !== 'OWNER') {
      throw new ForbiddenError('Only the wedding workspace Owner can delete this workspace');
    }

    return weddingRepository.softDelete(weddingId);
  }

  async getWeddingMembers(weddingId: string, userId: string) {
    const membership = await weddingRepository.findMembership(weddingId, userId);
    if (!membership || membership.status !== 'ACTIVE') {
      throw new ForbiddenError('You do not have access to this wedding workspace');
    }

    return weddingRepository.getMembersWithMetadata(weddingId);
  }

  async getCollaboratorTelemetry(weddingId: string, userId: string) {
    const membership = await weddingRepository.findMembership(weddingId, userId);
    if (!membership || membership.status !== 'ACTIVE') {
      throw new ForbiddenError('You do not have access to this wedding workspace');
    }

    return weddingRepository.getTelemetry(weddingId);
  }

  async inviteCollaborator(
    weddingId: string,
    currentUserId: string,
    payload: {
      email: string;
      name?: string;
      phone?: string;
      roleName: string;
      relation?: string;
      ceremonyScope?: string;
      personalNote?: string;
    }
  ) {
    const membership = await weddingRepository.findMembership(weddingId, currentUserId);
    const callerRole = membership?.role.name.toUpperCase();
    if (!membership || !['OWNER', 'CO_HOST', 'ORGANIZER', 'PLANNER'].includes(callerRole || '')) {
      throw new ForbiddenError('Only the wedding Owner, Co-Hosts, or Planners can inscribe collaborators');
    }

    if (payload.roleName.toUpperCase() === 'OWNER' && callerRole !== 'OWNER') {
      throw new ForbiddenError('Only the Sovereign Owner can bestow Owner privileges');
    }

    const member = await weddingRepository.inviteCollaborator(weddingId, payload.email, payload.roleName, {
      name: payload.name,
      phone: payload.phone,
      relation: payload.relation,
      ceremonyScope: payload.ceremonyScope,
      personalNote: payload.personalNote,
    });

    // Dispatch official email notification via SMTP
    const wedding = await weddingRepository.findById(weddingId);
    const weddingName = wedding?.name || 'Wedding Workspace';
    const roleTitle = payload.roleName.replace('_', ' ');
    const appUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const loginUrl = `${appUrl}/login?redirect=/dashboard/${weddingId}`;

    try {
      await emailService.sendEmail({
        to: payload.email,
        recipientName: payload.name || payload.email,
        subject: `💍 Council Invitation: Appointed as ${roleTitle} for ${weddingName}`,
        html: `
          <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; background: #FFFDF9; border: 1px solid #E9E1DD; border-radius: 16px; overflow: hidden; color: #1E1B19;">
            <div style="background: #780616; padding: 28px 24px; text-align: center; color: #FAF7F2;">
              <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #D4AF37; font-weight: bold;">Vivaha Council Invitation</span>
              <h1 style="font-size: 26px; margin: 8px 0 0; font-family: 'Georgia', serif; font-weight: normal; color: #FFFFFF;">${weddingName}</h1>
            </div>
            <div style="padding: 32px 28px;">
              <p style="font-size: 16px; line-height: 1.6; margin-top: 0;">Namaste <strong>${payload.name || 'Esteemed Collaborator'}</strong>,</p>
              <p style="font-size: 14px; line-height: 1.6; color: #4B4643;">
                You have been formally invited to join the inner planning council for <strong>${weddingName}</strong> as <strong>${roleTitle}</strong>.
              </p>
              ${payload.personalNote ? `
                <div style="background: #FAF2EE; border-left: 3px solid #B32446; padding: 14px 18px; margin: 20px 0; border-radius: 0 8px 8px 0; font-style: italic; color: #4A4543; font-size: 13px;">
                  "${payload.personalNote}"
                </div>
              ` : ''}
              <div style="background: #FFFFFF; border: 1px solid #E9E1DD; border-radius: 12px; padding: 18px; margin: 24px 0;">
                <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 6px 0; color: #78716C; width: 140px;">Assigned Role:</td>
                    <td style="padding: 6px 0; font-weight: bold; color: #780616;">${roleTitle}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #78716C;">Ceremony Scope:</td>
                    <td style="padding: 6px 0; font-weight: 500; color: #1E1B19;">${payload.ceremonyScope || 'All Ceremonies'}</td>
                  </tr>
                  ${payload.relation ? `
                  <tr>
                    <td style="padding: 6px 0; color: #78716C;">Designation:</td>
                    <td style="padding: 6px 0; font-weight: 500; color: #1E1B19;">${payload.relation}</td>
                  </tr>
                  ` : ''}
                </table>
              </div>
              <div style="text-align: center; margin: 32px 0 16px;">
                <a href="${loginUrl}" style="display: inline-block; background: #B32446; color: #FFFFFF; padding: 14px 32px; border-radius: 10px; font-weight: bold; text-decoration: none; font-size: 14px; letter-spacing: 0.5px;">
                  Access Wedding Workspace ✦
                </a>
              </div>
              <p style="text-align: center; font-size: 12px; color: #8C827A; margin-top: 16px;">
                Log in with <strong>${payload.email}</strong> to collaborate on schedules, ceremonies, checklists, and team coordination.
              </p>
            </div>
            <div style="background: #FAF2EE; padding: 16px; text-align: center; font-size: 11px; color: #78716C; border-top: 1px solid #E9E1DD;">
              MakeMyMarriage Council Governance • Sovereign Vivaha Protocol
            </div>
          </div>
        `,
        text: `You have been invited to join the planning council for ${weddingName} as ${roleTitle}. Access the workspace at ${loginUrl}`,
      });
    } catch (err: any) {
      console.error('Failed to dispatch collaborator invitation email:', err?.message || err);
    }

    return member;
  }

  async updateCollaborator(
    weddingId: string,
    currentUserId: string,
    memberId: string,
    payload: {
      roleName?: string;
      status?: any;
      relation?: string;
      phone?: string;
      ceremonyScope?: string;
    }
  ) {
    const membership = await weddingRepository.findMembership(weddingId, currentUserId);
    const callerRole = membership?.role.name.toUpperCase();
    if (!membership || !['OWNER', 'CO_HOST', 'ORGANIZER', 'PLANNER'].includes(callerRole || '')) {
      throw new ForbiddenError('Only the wedding Owner, Co-Hosts, or Planners can alter collaborator access');
    }

    if (payload.roleName?.toUpperCase() === 'OWNER' && callerRole !== 'OWNER') {
      throw new ForbiddenError('Only the Sovereign Owner can bestow Owner privileges');
    }

    return weddingRepository.updateMemberRecord(weddingId, memberId, payload);
  }

  async removeCollaborator(weddingId: string, currentUserId: string, memberId: string) {
    const membership = await weddingRepository.findMembership(weddingId, currentUserId);
    const callerRole = membership?.role.name.toUpperCase();
    if (!membership || !['OWNER', 'CO_HOST', 'ORGANIZER', 'PLANNER'].includes(callerRole || '')) {
      throw new ForbiddenError('Only the wedding Owner, Co-Hosts, or Planners can revoke access');
    }

    return weddingRepository.removeMemberRecord(weddingId, memberId);
  }

  async resendCollaboratorInvite(weddingId: string, currentUserId: string, memberId: string) {
    const membership = await weddingRepository.findMembership(weddingId, currentUserId);
    if (!membership || membership.status !== 'ACTIVE') {
      throw new ForbiddenError('You do not have access to this wedding workspace');
    }

    const updated = await weddingRepository.resendInviteRecord(weddingId, memberId);

    // Dispatch email
    const wedding = await weddingRepository.findById(weddingId);
    const weddingName = wedding?.name || 'Wedding Workspace';
    const roleTitle = updated.role.name.replace('_', ' ');
    const appUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const loginUrl = `${appUrl}/login?redirect=/dashboard/${weddingId}`;

    try {
      await emailService.sendEmail({
        to: updated.user.email,
        recipientName: updated.user.name || updated.user.email,
        subject: `💍 Council Passkey: Access Invitation for ${weddingName}`,
        html: `
          <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; background: #FFFDF9; border: 1px solid #E9E1DD; border-radius: 16px; overflow: hidden; color: #1E1B19;">
            <div style="background: #780616; padding: 28px 24px; text-align: center; color: #FAF7F2;">
              <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #D4AF37; font-weight: bold;">Vivaha Council Passkey</span>
              <h1 style="font-size: 26px; margin: 8px 0 0; font-family: 'Georgia', serif; font-weight: normal; color: #FFFFFF;">${weddingName}</h1>
            </div>
            <div style="padding: 32px 28px;">
              <p style="font-size: 16px; line-height: 1.6; margin-top: 0;">Namaste <strong>${updated.user.name || 'Esteemed Collaborator'}</strong>,</p>
              <p style="font-size: 14px; line-height: 1.6; color: #4B4643;">
                Your invitation passkey to join the inner planning council for <strong>${weddingName}</strong> as <strong>${roleTitle}</strong> has been refreshed.
              </p>
              <div style="text-align: center; margin: 32px 0 16px;">
                <a href="${loginUrl}" style="display: inline-block; background: #B32446; color: #FFFFFF; padding: 14px 32px; border-radius: 10px; font-weight: bold; text-decoration: none; font-size: 14px; letter-spacing: 0.5px;">
                  Access Wedding Workspace ✦
                </a>
              </div>
              <p style="text-align: center; font-size: 12px; color: #8C827A; margin-top: 16px;">
                Log in with <strong>${updated.user.email}</strong> to collaborate on schedules, ceremonies, checklists, and team coordination.
              </p>
            </div>
          </div>
        `,
        text: `Your invitation passkey for ${weddingName} (${roleTitle}) has been refreshed. Access the workspace at ${loginUrl}`,
      });
    } catch (err: any) {
      console.error('Failed to dispatch collaborator passkey email:', err?.message || err);
    }

    return updated;
  }

  async acceptInvitation(weddingId: string, currentUserId: string) {
    return weddingRepository.acceptMemberInvitation(weddingId, currentUserId);
  }

  async seedImperialCouncil(weddingId: string, currentUserId: string) {
    const membership = await weddingRepository.findMembership(weddingId, currentUserId);
    if (!membership || membership.status !== 'ACTIVE') {
      throw new ForbiddenError('You do not have access to this wedding workspace');
    }

    return weddingRepository.seedImperialCouncil(weddingId);
  }

  async assignMemberRole(weddingId: string, currentUserId: string, email: string, roleName: string) {
    const membership = await weddingRepository.findMembership(weddingId, currentUserId);
    if (!membership || !['OWNER', 'ORGANIZER', 'CO_HOST', 'PLANNER'].includes(membership.role.name)) {
      throw new ForbiddenError('Only the wedding workspace Owner, Co-Host or Organizer can assign roles');
    }

    const targetUser = await weddingRepository.findOrCreateUser(email);
    return weddingRepository.assignMemberRole(weddingId, targetUser.id, roleName);
  }
}

export const weddingService = new WeddingService();
