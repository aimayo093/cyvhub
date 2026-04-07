import { Router } from 'express';
import { login, signup, verifySession, logout, verifyEmail, forgotPassword, resetPassword, refresh } from '../controllers/auth.controller';
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

export default router;
