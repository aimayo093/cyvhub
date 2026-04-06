import { Router } from 'express';
import { getJobs, updateJobStatus, createJob, assignJob, editJob, addNote, cancelJob, getTracking, getTrackingByNumber } from '../controllers/job.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Retrieve jobs relevant to the user's role
router.get('/', authenticate, getJobs);

// Create a new job (Admin only)
router.post('/', authenticate, requireRole(['admin']), createJob);

// Update a specific job status
router.patch('/:id/status', authenticate, updateJobStatus);

// Edit job details (Admin only)
router.patch('/:id', authenticate, requireRole(['admin']), editJob);

// Assign/Reassign job (Admin only)
router.post('/:id/assign', authenticate, requireRole(['admin']), assignJob);

// Add internal note
router.post('/:id/notes', authenticate, addNote);

// Cancel job (Admin only)
router.post('/:id/cancel', authenticate, requireRole(['admin']), cancelJob);

// Tracking (Authenticated)
router.get('/:id/tracking', authenticate, getTracking);

// Tracking (Public)
router.get('/tracking/:trackingNumber', getTrackingByNumber);

export default router;
