import { z } from 'zod';

export const createEventSchema = z.object({
  name: z.string().trim().min(2, 'Ceremony name is required').max(200),
  description: z.string().trim().max(1000).optional(),
  startAt: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)),
  endAt: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)),
  timezone: z.string().default('Asia/Kolkata'),
  venueId: z.string().uuid().optional(),
  locationName: z.string().trim().max(200).optional(),
  dressCode: z.string().trim().max(200).optional(),
  dressCodeColors: z.array(z.string()).optional(),
  status: z.enum(['DRAFT', 'SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED']).default('SCHEDULED'),
  visibility: z.enum(['PUBLIC', 'INVITED_GUESTS_ONLY', 'PRIVATE']).default('PUBLIC'),
  settings: z.record(z.any()).optional(),
});

export const updateEventSchema = z.object({
  name: z.string().trim().min(2).max(200).optional(),
  description: z.string().trim().max(1000).optional(),
  startAt: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)).optional(),
  endAt: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)).optional(),
  timezone: z.string().optional(),
  venueId: z.string().uuid().nullable().optional(),
  locationName: z.string().trim().max(200).optional(),
  dressCode: z.string().trim().max(200).optional(),
  dressCodeColors: z.array(z.string()).optional(),
  status: z.enum(['DRAFT', 'SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED']).optional(),
  visibility: z.enum(['PUBLIC', 'INVITED_GUESTS_ONLY', 'PRIVATE']).optional(),
  settings: z.record(z.any()).optional(),
});
