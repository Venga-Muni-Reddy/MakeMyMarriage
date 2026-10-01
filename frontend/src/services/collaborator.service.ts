import api from './api';

export type CollaboratorRole =
  | 'OWNER'
  | 'CO_HOST'
  | 'PLANNER'
  | 'ORGANIZER'
  | 'HOSPITALITY'
  | 'COLLABORATOR'
  | 'VIEWER';

export interface CollaboratorMember {
  id: string;
  weddingId: string;
  userId: string;
  status: 'INVITED' | 'ACTIVE' | 'SUSPENDED' | 'REMOVED';
  invitedAt?: string | null;
  joinedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    preferredLanguage?: string;
  };
  role: {
    id: string;
    name: string;
    description?: string | null;
    permissions?: any;
  };
  relation?: string;
  phone?: string;
  ceremonyScope?: string;
  personalNote?: string;
}

export interface CollaboratorTelemetry {
  activeCount: number;
  pendingCount: number;
  totalPasskeys: number;
  roleBreakdown: {
    hosts: number;
    coHosts: number;
    planners: number;
    hospitality: number;
    observers: number;
  };
  securityHealth: string;
  zeroPermissionLeaks: boolean;
}

export interface InviteCollaboratorPayload {
  email: string;
  name?: string;
  phone?: string;
  roleName: CollaboratorRole | string;
  relation?: string;
  ceremonyScope?: string;
  personalNote?: string;
}

export interface UpdateCollaboratorPayload {
  roleName?: string;
  status?: 'INVITED' | 'ACTIVE' | 'SUSPENDED' | 'REMOVED';
  relation?: string;
  phone?: string;
  ceremonyScope?: string;
}

export const collaboratorService = {
  async getMembers(weddingId: string): Promise<CollaboratorMember[]> {
    const res: any = await api.get(`/weddings/${weddingId}/members`);
    return res?.data ?? (Array.isArray(res) ? res : []);
  },

  async getTelemetry(weddingId: string): Promise<CollaboratorTelemetry> {
    const res: any = await api.get(`/weddings/${weddingId}/members/telemetry`);
    return res?.data;
  },

  async inviteCollaborator(
    weddingId: string,
    payload: InviteCollaboratorPayload
  ): Promise<CollaboratorMember> {
    const res: any = await api.post(`/weddings/${weddingId}/members/invite`, payload);
    return res?.data;
  },

  async updateCollaborator(
    weddingId: string,
    memberId: string,
    payload: UpdateCollaboratorPayload
  ): Promise<CollaboratorMember> {
    const res: any = await api.patch(`/weddings/${weddingId}/members/${memberId}`, payload);
    return res?.data;
  },

  async removeCollaborator(weddingId: string, memberId: string): Promise<void> {
    await api.delete(`/weddings/${weddingId}/members/${memberId}`);
  },

  async resendInvite(weddingId: string, memberId: string): Promise<CollaboratorMember> {
    const res: any = await api.post(`/weddings/${weddingId}/members/${memberId}/resend`);
    return res?.data;
  },

  async seedImperialCouncil(weddingId: string): Promise<CollaboratorMember[]> {
    const res: any = await api.post(`/weddings/${weddingId}/members/seed-council`);
    return res?.data ?? [];
  },
};
