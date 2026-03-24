import { Router } from 'express';
import { getProfile, updateProfile } from '../controllers/profile.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Retrieve own profile
router.get('/', authenticate, getProfile);

// Update profile (with IDOR checks inside controller)
router.patch('/:id', authenticate, updateProfile);

export default router;
