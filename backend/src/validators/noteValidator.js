import { z } from 'zod';

export const createNoteSchema = z.object({
  content: z.string().min(1, 'Note content cannot be empty.').trim(),
  paperId: z.string().uuid().optional(),
  documentId: z.string().uuid().optional(),
  evidenceId: z.string().uuid().optional(),
  researchGapId: z.string().uuid().optional()
});

export const updateNoteSchema = z.object({
  content: z.string().min(1, 'Note content cannot be empty.').trim()
});
