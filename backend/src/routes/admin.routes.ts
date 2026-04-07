import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getDashboardOverview, getComplianceList, getHRList, getUsersList, adminListJobs, getBusinessesList, adminCreateJob, adminUpdateCompliance, adminUpdateHR, adminUpdateUserStatus, adminAssignJob, adminUpdateBusiness } from '../controllers/admin.controller';
import { listSettlements, listLedger, approveSettlement, listInvoices, getInvoiceDetails, markInvoicePaid } from '../controllers/admin-accounting.controller';

const router = Router();

// Fully shielded behind authentication
router.use(authenticate);

router.get('/dashboard', getDashboardOverview);
router.get('/compliance', getComplianceList);
router.patch('/compliance/:id', adminUpdateCompliance);
router.get('/hr-records', getHRList);
router.patch('/hr-records/:id', adminUpdateHR);
router.get('/users', getUsersList);
router.patch('/users/:id/status', adminUpdateUserStatus);
router.get('/businesses', getBusinessesList);
router.patch('/businesses/:id', adminUpdateBusiness);
router.post('/jobs', adminCreateJob);
router.get('/jobs', adminListJobs);
router.patch('/jobs/:jobId/assign', adminAssignJob);

// Accounting & Settlement (Financials)
router.get('/accounting/settlements', listSettlements);
router.patch('/accounting/settlements/:id/approve', approveSettlement);
router.get('/accounting/ledger', listLedger);
router.get('/accounting/invoices', listInvoices);
router.get('/accounting/invoices/:id', getInvoiceDetails);
router.patch('/accounting/invoices/:id/paid', markInvoicePaid);

export default router;
