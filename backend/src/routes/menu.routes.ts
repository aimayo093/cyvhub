import { Router } from 'express';
import {
    getMenuByLocation,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    reorderMenuItems
} from '../controllers/menu.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.get('/', getMenuByLocation);

// Admin routes
router.post('/', authenticate, createMenuItem);
router.patch('/:id', authenticate, updateMenuItem);
router.delete('/:id', authenticate, deleteMenuItem);
router.patch('/reorder/all', authenticate, reorderMenuItems);

export default router;
