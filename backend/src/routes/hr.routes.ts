import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { 
    getHRRecord, 
    upsertHRRecord, 
    requestTimeOff, 
    getTimeOffRequests 
} from '../controllers/hr.controller';

const router = Router();

// All HR routes require authentication
router.use(authenticate);

// HR Record
router.get('/record', getHRRecord);
router.post('/record', upsertHRRecord);

// Time Off Management
router.get('/time-off', getTimeOffRequests);
router.post('/time-off', requestTimeOff);

export default router;
