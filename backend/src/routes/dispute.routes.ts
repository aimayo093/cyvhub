import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { 
    raiseDispute, 
    getDisputes, 
    getDisputeDetails, 
    addDisputeMessage, 
    resolveDispute 
} from '../controllers/dispute.controller';

const router = Router();

router.use(authenticate);

router.post('/', raiseDispute);
router.get('/', getDisputes);
router.get('/:id', getDisputeDetails);
router.post('/:id/messages', addDisputeMessage);
router.patch('/:id/resolve', resolveDispute);

export default router;
