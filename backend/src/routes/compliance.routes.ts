import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
    getMyCompliance,
    uploadComplianceDoc,
    getMyCarrierCompliance,
    uploadCarrierComplianceDoc,
    adminListCompliance,
    adminGetDriverCompliance,
    adminGetCarrierCompliance,
    adminApproveDoc,
    adminRejectDoc,
} from '../controllers/compliance.controller';

const router = Router();
router.use(authenticate);

// ─── Driver routes ────────────────────────────────────────────────────────────
router.get('/', getMyCompliance);
router.post('/upload', uploadComplianceDoc);

// ─── Carrier routes ───────────────────────────────────────────────────────────
router.get('/carrier', getMyCarrierCompliance);
router.post('/carrier/upload', uploadCarrierComplianceDoc);

// ─── Admin routes ────────────────────────────────────────────────────────────
router.get('/admin/all', adminListCompliance);
router.get('/admin/driver/:driverId', adminGetDriverCompliance);
router.get('/admin/carrier/:carrierId', adminGetCarrierCompliance);
router.post('/admin/:docId/approve', adminApproveDoc);
router.post('/admin/:docId/reject', adminRejectDoc);

export default router;
