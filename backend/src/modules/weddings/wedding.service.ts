import { weddingRepository } from './wedding.repository';
import { CreateWeddingDTO, UpdateWeddingDTO } from './wedding.types';
import prisma from '../../infrastructure/prisma/client';
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

    return weddingRepository.inviteCollaborator(weddingId, payload.email, payload.roleName, {
      name: payload.name,
      phone: payload.phone,
      relation: payload.relation,
      ceremonyScope: payload.ceremonyScope,
      personalNote: payload.personalNote,
    });
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

    return weddingRepository.resendInviteRecord(weddingId, memberId);
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
