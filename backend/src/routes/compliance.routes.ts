import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
    getMyCompliance,
    uploadComplianceDoc,
    adminListCompliance,
    adminGetDriverCompliance,
    adminApproveDoc,
    adminRejectDoc,
} from '../controllers/compliance.controller';

const router = Router();
router.use(authenticate);

// ─── Driver routes ────────────────────────────────────────────────────────────
// GET  /api/compliance               — driver gets their own docs + overall status
// POST /api/compliance/upload        — driver uploads / re-uploads a document
router.get('/', getMyCompliance);
router.post('/upload', uploadComplianceDoc);

// ─── Admin routes ────────────────────────────────────────────────────────────
// GET  /api/compliance/admin/all              — list all (filterable by ?status=)
// GET  /api/compliance/admin/driver/:driverId — single driver's compliance
// POST /api/compliance/admin/:docId/approve  — approve a document
// POST /api/compliance/admin/:docId/reject   — reject with reason
router.get('/admin/all', adminListCompliance);
router.get('/admin/driver/:driverId', adminGetDriverCompliance);
router.post('/admin/:docId/approve', adminApproveDoc);
router.post('/admin/:docId/reject', adminRejectDoc);

export default router;
