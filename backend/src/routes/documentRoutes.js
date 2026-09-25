import { Router } from 'express';
import * as documentController from '../controllers/documentController.js';
import { authenticateToken } from '../middleware/auth.js';
import { uploadPdf } from '../middleware/upload.js';

const router = Router();

router.use(authenticateToken);

router.post('/upload', uploadPdf.single('file'), documentController.uploadDocument);
router.get('/:id', documentController.getDocument);
router.get('/:id/status', documentController.getDocumentStatus);
router.get('/:id/chunks', documentController.getChunks);
router.delete('/:id', documentController.deleteDocument);

export default router;
