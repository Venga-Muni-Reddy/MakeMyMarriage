import { z } from 'zod';

export const createWeddingSchema = z.object({
  partner1Name: z.string().trim().min(1, 'Partner 1 name is required').max(100),
  partner2Name: z.string().trim().min(1, 'Partner 2 name is required').max(100),
  title: z.string().trim().max(255).optional(),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
    .min(3, 'Slug must be at least 3 characters')
    .max(100, 'Slug cannot exceed 100 characters')
    .optional(),
  startDate: z.string().datetime({ offset: true }).optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  endDate: z.string().datetime({ offset: true }).optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  timezone: z.string().default('Asia/Kolkata'),
  primaryVenueName: z.string().trim().max(255).optional(),
  primaryCity: z.string().trim().max(100).optional(),
  themePalette: z.enum(['gold', 'rose', 'amber']).default('gold'),
  settings: z.record(z.any()).optional(),
});

export const updateWeddingSchema = z.object({
  title: z.string().trim().min(1).max(255).optional(),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
    .min(3)
    .max(100)
    .optional(),
  startDate: z.string().datetime({ offset: true }).optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  endDate: z.string().datetime({ offset: true }).optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  timezone: z.string().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED', 'DELETED']).optional(),
  visibility: z.enum(['PRIVATE', 'PUBLIC']).optional(),
  settings: z.record(z.any()).optional(),
});
