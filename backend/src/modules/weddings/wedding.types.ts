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
