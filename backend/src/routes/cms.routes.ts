import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { 
    getPages, 
    getPageBySlug, 
    upsertPage, 
    deletePage,
    getConfig,
    upsertConfig,
    restoreRevision,
    getRevisions,
    syncCMSData
} from '../controllers/cms.controller';
import { PublishController } from '../controllers/publish.controller';

const router = Router();

// --- Page Content (Marketing Landing Pages) ---
router.get('/pages', getPages);
router.get('/pages/:slug', getPageBySlug);

// --- Global Config (Homepage, Announcement Bar, etc.) ---
router.get('/config/:key', getConfig);

// --- Admin-only endpoints ---
router.post('/pages', authenticate, upsertPage);
router.post('/config', authenticate, upsertConfig);
router.post('/sync', authenticate, syncCMSData);
router.post('/publish', authenticate, PublishController.publishToLive);
router.delete('/pages/:id', authenticate, deletePage);

// --- Revision endpoints ---
router.get('/revisions', authenticate, getRevisions);
router.post('/revisions/:revisionId/restore', authenticate, restoreRevision);

export default router;

