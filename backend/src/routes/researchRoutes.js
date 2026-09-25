import { Router } from 'express';
import * as researchController from '../controllers/researchController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { researchSearchSchema } from '../validators/researchValidator.js';

const router = Router();

// Allow authenticated users to search scholarly sources
router.use(authenticateToken);

router.get('/search', validate(researchSearchSchema, 'query'), researchController.search);
router.get('/paper/:externalId', researchController.getPaperDetails);

export default router;
