import { Router } from 'express';
import { ContractController } from '../controllers/contract.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/', ContractController.getContracts);
router.post('/', requireRole(['admin']), ContractController.createContract);

export default router;
