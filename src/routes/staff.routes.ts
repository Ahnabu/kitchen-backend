import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.middleware';
import {
  getStaff,
  addStaff,
  updateStaff,
  deleteStaff,
} from '../controllers/staff.controller';

const router = Router();

// Apply auth middleware to all staff routes
router.use(verifyToken);
router.use(requireRole('admin'));

router.get('/', getStaff);
router.post('/', addStaff);
router.put('/:id', updateStaff);
router.delete('/:id', deleteStaff);

export default router;
