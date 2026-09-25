import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long.').max(120, 'Name must be at most 120 characters.'),
  email: z.string().email('Please provide a valid email address.').toLowerCase().trim(),
  password: z.string().min(8, 'Password must be at least 8 characters long.')
});

export const loginSchema = z.object({
  email: z.string().email('Please provide a valid email address.').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required.')
});
