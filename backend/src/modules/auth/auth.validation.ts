import { z } from 'zod';

export const signupSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(150, 'Name must not exceed 150 characters'),
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .email('Invalid email address')
    .toLowerCase(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must not exceed 100 characters'),
  preferredLanguage: z.enum(['en', 'hi', 'te']).optional().default('en'),
});

export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .email('Invalid email address')
    .toLowerCase(),
  password: z.string({ required_error: 'Password is required' }).min(1, 'Password cannot be empty'),
  rememberMe: z.boolean().optional().default(false),
});

export type LoginInput = z.infer<typeof loginSchema>;
