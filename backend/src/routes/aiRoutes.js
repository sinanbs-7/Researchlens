import { Router } from 'express';
import * as aiController from '../controllers/aiController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  analyzeRequestSchema,
  askRequestSchema,
  compareRequestSchema,
  gapsRequestSchema,
  conflictsRequestSchema,
  literatureOutlineRequestSchema,
  relevanceRequestSchema
} from '../validators/aiValidator.js';

const router = Router();

router.use(authenticateToken);

router.post('/analyze', validate(analyzeRequestSchema), aiController.analyze);
router.get('/analyses/:id', aiController.getAnalysis);
router.post('/relevance', validate(relevanceRequestSchema), aiController.checkRelevance);
router.post('/ask', validate(askRequestSchema), aiController.askQuestion);
router.post('/compare', validate(compareRequestSchema), aiController.compare);
router.post('/conflicts', validate(conflictsRequestSchema), aiController.conflicts);
router.post('/gaps', validate(gapsRequestSchema), aiController.gaps);
router.get('/gaps/:workspaceId', aiController.getExistingGaps);
router.post('/literature-outline', validate(literatureOutlineRequestSchema), aiController.literatureOutline);
router.get('/literature-review/:workspaceId', aiController.getExistingLiteratureReview);
router.put('/literature-review/:workspaceId', aiController.updateLiteratureReview);

export default router;
