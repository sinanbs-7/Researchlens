import { Router } from 'express';
import * as paperController from '../controllers/paperController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { savePaperSchema, updatePaperStatusSchema, addTagSchema } from '../validators/paperValidator.js';

const router = Router();

router.use(authenticateToken);

// Direct /api/papers/:id operations
router.get('/:id', paperController.getPaper);
router.put('/:id', paperController.updatePaper);
router.delete('/:id', paperController.deletePaper);
router.post('/:id/status', validate(updatePaperStatusSchema), paperController.updateStatus);
router.post('/:id/tags', validate(addTagSchema), paperController.addTag);
router.delete('/:id/tags/:tagId', paperController.removeTag);

export default router;
