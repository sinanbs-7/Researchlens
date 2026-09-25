import { Router } from 'express';
import * as workspaceController from '../controllers/workspaceController.js';
import * as paperController from '../controllers/paperController.js';
import * as documentController from '../controllers/documentController.js';
import * as noteController from '../controllers/noteController.js';
import * as mapController from '../controllers/mapController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createWorkspaceSchema, updateWorkspaceSchema } from '../validators/workspaceValidator.js';
import { savePaperSchema } from '../validators/paperValidator.js';
import { createNoteSchema } from '../validators/noteValidator.js';

const router = Router();

router.use(authenticateToken);

// Core Workspace CRUD
router.get('/', workspaceController.getWorkspaces);
router.post('/', validate(createWorkspaceSchema), workspaceController.createWorkspace);
router.get('/:id', workspaceController.getWorkspace);
router.put('/:id', validate(updateWorkspaceSchema), workspaceController.updateWorkspace);
router.delete('/:id', workspaceController.deleteWorkspace);
router.post('/:id/archive', workspaceController.archiveWorkspace);

// Nested Workspace Resources
router.get('/:workspaceId/papers', paperController.getPapers);
router.post('/:workspaceId/papers', validate(savePaperSchema), paperController.savePaper);

router.get('/:workspaceId/documents', documentController.getWorkspaceDocuments);

router.get('/:workspaceId/notes', noteController.getNotes);
router.post('/:workspaceId/notes', validate(createNoteSchema), noteController.createNote);

router.get('/:workspaceId/map', mapController.getResearchMap);
router.get('/:workspaceId/timeline', mapController.getTimeline);

export default router;
