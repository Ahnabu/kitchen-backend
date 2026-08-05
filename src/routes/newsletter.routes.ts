import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.middleware';
import {
  subscribe,
  unsubscribe,
  getSubscribers,
} from '../controllers/newsletter.controller';
import { validateNewsletter } from '../middleware/validate.middleware';

const router = Router();

// Public routes
router.post('/subscribe', validateNewsletter, subscribe);
router.post('/unsubscribe', validateNewsletter, unsubscribe);

// Admin-only route
router.get('/', verifyToken, requireRole('admin'), getSubscribers);

export default router;
