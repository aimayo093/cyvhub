import { Router } from 'express';
import { getJobs, updateJobStatus } from '../controllers/job.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Retrieve jobs relevant to the user's role
router.get('/', authenticate, getJobs);

// Update a specific job status
router.patch('/:id/status', authenticate, updateJobStatus);

export default router;
