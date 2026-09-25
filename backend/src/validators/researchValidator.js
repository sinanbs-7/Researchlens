import { z } from 'zod';

export const researchSearchSchema = z.object({
  query: z.string().min(1, 'Search query cannot be empty.').trim(),
  yearFrom: z.coerce.number().int().min(1800).max(2100).optional(),
  yearTo: z.coerce.number().int().min(1800).max(2100).optional(),
  author: z.string().optional(),
  openAccess: z.preprocess((val) => {
    if (val === 'true' || val === true) return true;
    if (val === 'false' || val === false) return false;
    return undefined;
  }, z.boolean().optional()),
  sourceType: z.string().optional(),
  sort: z.enum(['relevance', 'cited_by_count', 'publication_date', 'year_desc']).optional().default('relevance'),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(50).default(15)
});
