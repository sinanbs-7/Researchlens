import { Router } from 'express';
import * as noteController from '../controllers/noteController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { updateNoteSchema } from '../validators/noteValidator.js';

const router = Router();

router.use(authenticateToken);

router.put('/:id', validate(updateNoteSchema), noteController.updateNote);
router.delete('/:id', noteController.deleteNote);

export default router;
