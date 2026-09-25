import { z } from 'zod';

// ==========================================
// REQUEST SCHEMAS
// ==========================================

export const analyzeRequestSchema = z.object({
  workspaceId: z.string().uuid(),
  documentId: z.string().uuid().optional(),
  paperId: z.string().uuid().optional()
}).refine(data => data.documentId || data.paperId, {
  message: "Either documentId or paperId must be provided."
});

export const askRequestSchema = z.object({
  workspaceId: z.string().uuid(),
  question: z.string().min(3, "Question must be at least 3 characters long.").trim()
});

export const compareRequestSchema = z.object({
  workspaceId: z.string().uuid(),
  paperIds: z.array(z.string().uuid()).min(2, "Select at least 2 papers to compare.").max(10, "You can compare up to 10 papers at once.")
});

export const gapsRequestSchema = z.object({
  workspaceId: z.string().uuid()
});

export const conflictsRequestSchema = z.object({
  workspaceId: z.string().uuid(),
  paperIds: z.array(z.string().uuid()).optional()
});

export const literatureOutlineRequestSchema = z.object({
  workspaceId: z.string().uuid()
});

export const relevanceRequestSchema = z.object({
  workspaceId: z.string().uuid(),
  paperId: z.string().uuid()
});

// ==========================================
// AI OUTPUT SCHEMAS (Validated against Gemini outputs)
// ==========================================

export const paperAnalysisOutputSchema = z.object({
  researchQuestion: z.string().default("Not found in the available document."),
  methodology: z.string().default("Not found in the available document."),
  datasetSample: z.string().default("Not found in the available document."),
  mainFindings: z.array(z.string()).default([]),
  keyEvidence: z.array(z.object({
    claim: z.string(),
    evidence: z.string(),
    pageNumber: z.number().nullable().optional().default(null),
    section: z.string().optional().default("General"),
    sourceType: z.string().optional().default("document")
  })).default([]),
  limitations: z.array(z.string()).default([]),
  futureWork: z.array(z.string()).default([]),
  keyConcepts: z.array(z.string()).default([]),
  researchArea: z.string().default("General Research")
});

export const paperRelevanceOutputSchema = z.object({
  relevanceLevel: z.enum(['high', 'medium', 'low', 'unclear']).default('unclear'),
  reason: z.string().default("Relevance analysis completed based on abstract and workspace topic."),
  matchingConcepts: z.array(z.string()).default([])
});

export const sourceGroundedQaOutputSchema = z.object({
  answer: z.string(),
  sourceSupportedPoints: z.array(z.object({
    claim: z.string(),
    sourceId: z.string(),
    evidence: z.string(),
    pageNumber: z.number().nullable().optional().default(null),
    section: z.string().optional().default("Relevant passage")
  })).default([]),
  aiInterpretation: z.array(z.string()).default([]),
  missingEvidence: z.array(z.string()).default([])
});

export const paperComparisonOutputSchema = z.object({
  comparison: z.array(z.object({
    criterion: z.string(),
    papers: z.array(z.object({
      paperId: z.string(),
      value: z.string()
    }))
  })).default([]),
  similarities: z.array(z.string()).default([]),
  differences: z.array(z.string()).default([]),
  evidence: z.array(z.object({
    claim: z.string(),
    sourceIds: z.array(z.string())
  })).default([])
});

export const conflictAgreementOutputSchema = z.object({
  agreements: z.array(z.object({
    claim: z.string(),
    sourceIds: z.array(z.string()),
    evidence: z.array(z.string()).default([])
  })).default([]),
  mixedEvidence: z.array(z.object({
    topic: z.string(),
    sourceIds: z.array(z.string()),
    summary: z.string()
  })).default([]),
  potentialDisagreements: z.array(z.object({
    topic: z.string(),
    sourceA: z.object({
      sourceId: z.string(),
      finding: z.string(),
      evidence: z.string()
    }),
    sourceB: z.object({
      sourceId: z.string(),
      finding: z.string(),
      evidence: z.string()
    }),
    possibleContextualDifferences: z.array(z.string()).default([])
  })).default([])
});

export const researchGapsOutputSchema = z.object({
  gaps: z.array(z.object({
    title: z.string(),
    description: z.string(),
    category: z.string(),
    supportingSourceIds: z.array(z.string()).default([]),
    reasoning: z.string().default(""),
    confidenceContext: z.string().default("Identified from current workspace literature collection.")
  })).default([])
});

export const literatureOutlineOutputSchema = z.object({
  title: z.string(),
  sections: z.array(z.object({
    heading: z.string(),
    description: z.string(),
    sourceIds: z.array(z.string()).default([]),
    keyPoints: z.array(z.string()).default([])
  })).default([])
});
