import { Router } from 'express';
import { verifyToken, optionalVerifyToken, requireRole } from '../middleware/auth.middleware';
import {
  getReviews,
  postReview,
  approveReview,
  rejectReview,
  deleteReview,
} from '../controllers/review.controller';
import { validateReview } from '../middleware/validate.middleware';

const router = Router();

// Public routes
router.get('/', getReviews);
router.post('/', optionalVerifyToken, validateReview, postReview);

// Admin-only routes
router.patch('/:id/approve', verifyToken, requireRole('admin'), approveReview);
router.patch('/:id/reject', verifyToken, requireRole('admin'), rejectReview);
router.delete('/:id', verifyToken, requireRole('admin'), deleteReview);

export default router;
