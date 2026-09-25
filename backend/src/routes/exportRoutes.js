import { Router } from 'express';
import * as exportController from '../controllers/exportController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

// Support both /:workspaceId/export/summary and /:workspaceId/summary
router.get('/:workspaceId/export/summary', exportController.exportSummary);
router.get('/:workspaceId/summary', exportController.exportSummary);

router.get('/:workspaceId/export/evidence', exportController.exportEvidence);
router.get('/:workspaceId/evidence', exportController.exportEvidence);

router.get('/:workspaceId/export/gaps', exportController.exportGaps);
router.get('/:workspaceId/gaps', exportController.exportGaps);

router.get('/:workspaceId/export/literature-review', exportController.exportLiteratureReview);
router.get('/:workspaceId/literature-review', exportController.exportLiteratureReview);

export default router;
