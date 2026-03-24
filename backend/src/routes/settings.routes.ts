import { Router } from 'express';
import { SettingsController } from '../controllers/settings.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

// All settings routes are strictly for Admins
router.use(authenticate, requireRole(['admin']));

router.get('/notifications', SettingsController.getSettings);
router.put('/notifications', SettingsController.updateSettings);
router.post('/notifications/test-email', SettingsController.testEmail);
router.post('/notifications/test-sms', SettingsController.testSms);
router.get('/notifications/logs', SettingsController.getLogs);

export default router;
