import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware';
import {
    createInquiry,
    deleteFaq,
    deletePolicy,
    deleteTemplate,
    getInquiry,
    listAuditLogs,
    listCategories,
    listFaq,
    listInquiries,
    listPolicies,
    listTemplates,
    sendInquiryResponse,
    updateInquiry,
    upsertCategory,
    upsertFaq,
    upsertPolicy,
    upsertTemplate,
} from '../controllers/knowledge.controller';

const router = Router();

router.get('/categories', optionalAuthenticate, listCategories);
router.post('/categories', authenticate, upsertCategory);

router.get('/faq', optionalAuthenticate, listFaq);
router.post('/faq', authenticate, upsertFaq);
router.delete('/faq/:id', authenticate, deleteFaq);

router.post('/inquiries', createInquiry);
router.get('/inquiries', authenticate, listInquiries);
router.get('/inquiries/:id', authenticate, getInquiry);
router.patch('/inquiries/:id', authenticate, updateInquiry);
router.post('/inquiries/:id/responses', authenticate, sendInquiryResponse);

router.get('/templates', authenticate, listTemplates);
router.post('/templates', authenticate, upsertTemplate);
router.delete('/templates/:id', authenticate, deleteTemplate);

router.get('/policies', authenticate, listPolicies);
router.post('/policies', authenticate, upsertPolicy);
router.delete('/policies/:id', authenticate, deletePolicy);

router.get('/audit-logs', authenticate, listAuditLogs);

export default router;
