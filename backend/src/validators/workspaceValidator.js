import { z } from 'zod';

export const createWorkspaceSchema = z.object({
  title: z.string().min(2, 'Workspace title must be at least 2 characters long.').max(255).trim(),
  researchQuestion: z.string().min(5, 'Research question must be at least 5 characters long.').trim(),
  description: z.string().optional().default(''),
  researchField: z.string().optional().default(''),
  keywords: z.array(z.string()).optional().default([]),
  preferredSourceTypes: z.array(z.string()).optional().default([])
});

export const updateWorkspaceSchema = z.object({
  title: z.string().min(2).max(255).trim().optional(),
  researchQuestion: z.string().min(5).trim().optional(),
  description: z.string().optional(),
  researchField: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  preferredSourceTypes: z.array(z.string()).optional(),
  status: z.enum(['active', 'archived']).optional()
});
