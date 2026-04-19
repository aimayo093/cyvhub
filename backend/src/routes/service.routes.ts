import { Router, Request, Response } from 'express';
import {
    getServices,
    getServiceBySlug,
    createService,
    updateService,
    deleteService,
    reorderServices
} from '../controllers/service.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.get('/', getServices);
router.get('/:slug', getServiceBySlug);

// Admin routes
router.post('/', authenticate, createService);
router.patch('/:id', authenticate, updateService);
router.delete('/:id', authenticate, deleteService);
router.patch('/reorder/all', authenticate, reorderServices);

export default router;
