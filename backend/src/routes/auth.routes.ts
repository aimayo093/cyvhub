import { Router } from 'express';
import { login, signup, verifySession, logout, verifyEmail, forgotPassword, resetPassword, refresh, changePassword } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/login', login);
router.post('/signup', signup);
router.get('/verify', authenticate as any, verifySession);
router.get('/verify-email', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
// SEC-AUDIT-6: Logout clears the HTTP-only session cookie for web clients
router.post('/logout', logout);
router.post('/refresh', refresh);
router.post('/change-password', authenticate as any, changePassword);

export default router;
