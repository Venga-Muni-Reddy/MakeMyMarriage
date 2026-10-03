import { z } from 'zod';

export const updateStudioSettingsSchema = z.object({
  activeThemeId: z.string().optional(),
  verseLanguage: z.enum(['SANSKRIT', 'ENGLISH', 'HINDI', 'TELUGU']).optional().default('SANSKRIT'),
  verseText: z.string().max(2000).optional(),
  verseFont: z.string().optional(),
  activeSoundscapeId: z.string().optional(),
  autoplaySoundscape: z.boolean().optional(),
  activeEventIds: z.array(z.string()).optional(),
  customMonogramText: z.string().max(30).optional(),
});

export const singleDispatchSchema = z.object({
  channel: z.enum(['WHATSAPP', 'SMS', 'EMAIL']).default('WHATSAPP'),
  customNote: z.string().max(500).optional(),
});

export const bulkDispatchSchema = z.object({
  invitationIds: z.array(z.string().uuid()).min(1),
  channel: z.enum(['WHATSAPP', 'SMS', 'EMAIL']).default('WHATSAPP'),
});

export const invitationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(500).default(100),
  search: z.string().optional(),
  status: z.enum(['ALL', 'DRAFT', 'QUEUED', 'SENT', 'DELIVERED', 'OPENED']).default('ALL'),
  tier: z.string().optional(),
});
