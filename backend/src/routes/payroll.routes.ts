import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { generatePayslip, getMyPayslips } from '../controllers/payroll.controller';

const router = Router();

router.use(authenticate);

router.get('/my-payslips', getMyPayslips);
router.post('/generate', generatePayslip);

export default router;
