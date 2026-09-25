import { z } from 'zod';

export const savePaperSchema = z.object({
  externalId: z.string().nullable().optional(),
  title: z.string().min(1, 'Paper title is required.').trim(),
  authors: z.array(z.any()).default([]),
  abstract: z.string().nullable().optional().default(''),
  publicationYear: z.number().int().nullable().optional(),
  journalName: z.string().nullable().optional().default(''),
  conferenceName: z.string().nullable().optional().default(''),
  doi: z.string().nullable().optional().default(''),
  sourceUrl: z.string().nullable().optional().default(''),
  openAccessUrl: z.string().nullable().optional().default(''),
  sourceType: z.string().nullable().optional().default('journal-article'),
  metadata: z.record(z.any()).optional().default({})
});

export const updatePaperStatusSchema = z.object({
  status: z.enum(['to_read', 'reading', 'read', 'analyzed', 'archived'])
});

export const addTagSchema = z.object({
  name: z.string().min(1, 'Tag name is required.').max(50).trim()
});
