import { z } from 'zod';

export const updateStudioSettingsSchema = z.object({
  activeThemeId: z.string().min(1),
  verseLanguage: z.enum(['SANSKRIT', 'ENGLISH', 'HINDI', 'TELUGU']),
  verseText: z.string().min(5).max(1000),
  verseFont: z.string().min(1),
  activeSoundscapeId: z.string().min(1),
  autoplaySoundscape: z.boolean().default(true),
  activeEventIds: z.array(z.string().uuid()).optional(),
  customMonogramText: z.string().max(10).optional(),
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
