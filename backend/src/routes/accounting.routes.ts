import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { 
    getConnectionStatus, 
    connectProvider, 
    oauthCallbackMock, 
    disconnectProvider 
} from '../controllers/accounting.controller';

const router = Router();

// Secure all endpoints to verified carriers/users dynamically
router.use(authenticate);

router.get('/status', getConnectionStatus);
router.get('/connect/:provider', connectProvider);
router.post('/callback', oauthCallbackMock);
router.delete('/disconnect', disconnectProvider);

export default router;
