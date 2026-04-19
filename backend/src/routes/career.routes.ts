import { Router } from 'express';
import {
    getCareers,
    createCareerPosting,
    updateCareerPosting,
    deleteCareerPosting,
    reorderCareers
} from '../controllers/career.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.get('/', getCareers);

// Admin routes
router.post('/', authenticate, createCareerPosting);
router.patch('/:id', authenticate, updateCareerPosting);
router.delete('/:id', authenticate, deleteCareerPosting);
router.patch('/reorder/all', authenticate, reorderCareers);

export default router;
