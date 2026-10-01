export interface CreateWeddingDTO {
  title?: string;
  slug?: string;
  partner1Name: string; // e.g. Bride
  partner2Name: string; // e.g. Groom
  startDate?: string;
  endDate?: string;
  timezone?: string;
  primaryVenueName?: string;
  primaryCity?: string;
  themePalette?: 'gold' | 'rose' | 'amber';
  settings?: Record<string, any>;
}

export interface UpdateWeddingDTO {
  title?: string;
  slug?: string;
  startDate?: string;
  endDate?: string;
  timezone?: string;
  status?: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED' | 'DELETED';
  visibility?: 'PRIVATE' | 'PUBLIC';
  settings?: Record<string, any>;
}

export interface WeddingEntity {
  id: string;
  slug: string;
  title: string;
  status: string;
  visibility: string;
  startDate: Date | null;
  endDate: Date | null;
  timezone: string;
  settings: any;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface InviteCollaboratorDTO {
  email: string;
  name?: string;
  phone?: string;
  roleName: string;
  relation?: string;
  ceremonyScope?: string;
  personalNote?: string;
}

export interface UpdateCollaboratorDTO {
  roleName?: string;
  status?: 'INVITED' | 'ACTIVE' | 'SUSPENDED' | 'REMOVED';
  relation?: string;
  ceremonyScope?: string;
  phone?: string;
}

export interface CollaboratorMemberEntity {
  id: string;
  weddingId: string;
  userId: string;
  status: 'INVITED' | 'ACTIVE' | 'SUSPENDED' | 'REMOVED';
  invitedAt: Date | null;
  joinedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  role: {
    id: string;
    name: string;
    description: string | null;
    permissions: any;
  };
  user: {
    id: string;
    name: string;
    email: string;
    preferredLanguage?: string;
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

