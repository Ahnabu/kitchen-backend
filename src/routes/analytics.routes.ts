import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.middleware';
import {
  getOverview,
  getWeekly,
  getTopDishes,
} from '../controllers/analytics.controller';

const router = Router();

// Apply auth middleware to all analytics routes
router.use(verifyToken);
router.use(requireRole('admin'));

router.get('/overview', getOverview);
router.get('/weekly', getWeekly);
router.get('/top-dishes', getTopDishes);

export default router;
