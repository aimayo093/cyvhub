import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getPages, getPageBySlug, upsertPage, deletePage } from '../controllers/cms.controller';

const router = Router();

// Publicly readable endpoints (for the main CyvHub website to render marketing pages dynamically)
router.get('/', getPages);
router.get('/:slug', getPageBySlug);

// Admin-only endpoints
router.post('/', authenticate, upsertPage);
router.delete('/:id', authenticate, deletePage);

export default router;
