import { Router } from 'express';
import {
    getIndustries,
    getIndustryBySlug,
    createIndustry,
    updateIndustry,
    deleteIndustry,
    reorderIndustries
} from '../controllers/industry.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.get('/', getIndustries);
router.get('/:slug', getIndustryBySlug);

// Admin routes
router.post('/', authenticate, createIndustry);
router.patch('/:id', authenticate, updateIndustry);
router.delete('/:id', authenticate, deleteIndustry);
router.patch('/reorder/all', authenticate, reorderIndustries);

export default router;
