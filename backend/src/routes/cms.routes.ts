import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { 
    getPages, 
    getPageBySlug, 
    upsertPage, 
    deletePage,
    getConfig,
    upsertConfig
} from '../controllers/cms.controller';

const router = Router();

// --- Page Content (Marketing Landing Pages) ---
router.get('/pages', getPages);
router.get('/pages/:slug', getPageBySlug);

// --- Global Config (Homepage, Announcement Bar, etc.) ---
router.get('/config/:key', getConfig);

// --- Admin-only endpoints ---
router.post('/pages', authenticate, upsertPage);
router.post('/config', authenticate, upsertConfig);
router.delete('/pages/:id', authenticate, deletePage);

export default router;

