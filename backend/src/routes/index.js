import { Router } from 'express';
import authRoutes from './authRoutes.js';
import workspaceRoutes from './workspaceRoutes.js';
import researchRoutes from './researchRoutes.js';
import paperRoutes from './paperRoutes.js';
import documentRoutes from './documentRoutes.js';
import aiRoutes from './aiRoutes.js';
import noteRoutes from './noteRoutes.js';
import exportRoutes from './exportRoutes.js';
import * as aiController from '../controllers/aiController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'ResearchLens API'
  });
});

router.use('/auth', authRoutes);
router.use('/workspaces', workspaceRoutes);
router.use('/research', researchRoutes);
router.use('/papers', paperRoutes);
router.use('/documents', documentRoutes);
router.use('/ai', aiRoutes);
router.use('/notes', noteRoutes);
router.use('/workspaces', exportRoutes); // /api/workspaces/:workspaceId/export/...
router.use('/export', exportRoutes);

// Direct analysis endpoint as specified in Section 12: GET /api/analyses/:id
router.get('/analyses/:id', authenticateToken, aiController.getAnalysis);

export default router;
