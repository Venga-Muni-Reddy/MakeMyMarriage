import { z } from 'zod';

export const createGuestSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().max(100).optional(),
  displayName: z.string().max(200).optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().max(30).optional().or(z.literal('')),
  side: z.enum(['BRIDE', 'GROOM', 'BOTH', 'NEUTRAL']).optional().default('NEUTRAL'),
  categoryId: z.string().uuid().optional().nullable(),
  categoryName: z.string().optional(),
  notes: z.string().optional(),
  honorific: z.string().optional().default('Shri'),
  householdName: z.string().optional(),
  householdRole: z.string().optional().default('HEAD'),
  paxCount: z.coerce.number().min(1).default(1),
  companions: z
    .array(
      z.object({
        name: z.string().min(1),
        relation: z.string(),
        dietary: z.string().optional(),
        dietaryNote: z.string().optional(),
      })
    )
    .optional()
    .default([]),
  dietary: z.enum(['JAIN', 'PURE_VEG', 'NON_VEG', 'VEGAN', 'GLUTEN_FREE', 'CUSTOM']).optional().default('PURE_VEG'),
  dietaryLabel: z.string().optional(),
  allergies: z.string().optional(),
  city: z.string().optional(),
  allocatedSuite: z.string().optional(),
  rsvpStatus: z.enum(['ATTENDING', 'AWAITING', 'DECLINED']).optional().default('AWAITING'),
  eventIds: z.array(z.string().uuid()).optional(),
  metadata: z.record(z.any()).optional(),
});

export const updateGuestSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().max(100).optional(),
  displayName: z.string().max(200).optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(30).optional().or(z.literal('')),
  side: z.enum(['BRIDE', 'GROOM', 'BOTH', 'NEUTRAL']).optional(),
  categoryId: z.string().uuid().optional().nullable(),
  notes: z.string().optional(),
  honorific: z.string().optional(),
  householdName: z.string().optional(),
  householdRole: z.string().optional(),
  paxCount: z.coerce.number().min(1).optional(),
  companions: z
    .array(
      z.object({
        name: z.string().min(1),
        relation: z.string(),
        dietary: z.string().optional(),
        dietaryNote: z.string().optional(),
      })
    )
    .optional(),
  dietary: z.enum(['JAIN', 'PURE_VEG', 'NON_VEG', 'VEGAN', 'GLUTEN_FREE', 'CUSTOM']).optional(),
  dietaryLabel: z.string().optional(),
  allergies: z.string().optional(),
  city: z.string().optional(),
  allocatedSuite: z.string().optional(),
  rsvpStatus: z.enum(['ATTENDING', 'AWAITING', 'DECLINED']).optional(),
  eventIds: z.array(z.string().uuid()).optional(),
  metadata: z.record(z.any()).optional(),
});

export const guestQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(200).optional().default(50),
  search: z.string().optional(),
  side: z.string().optional(),
  categoryId: z.string().optional(),
  rsvpStatus: z.string().optional(),
  eventId: z.string().optional(),
  isArchived: z.preprocess((val) => val === 'true' || val === true, z.boolean()).optional(),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const bulkActionSchema = z.object({
  guestIds: z.array(z.string().uuid()).min(1, 'Select at least one guest'),
  action: z.enum(['ASSIGN_CEREMONY', 'UPDATE_DIETARY', 'ARCHIVE', 'UNARCHIVE', 'DISPATCH_WHATSAPP']),
  eventId: z.string().uuid().optional(),
  dietary: z.string().optional(),
});

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100),
});
