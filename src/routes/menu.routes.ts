import { Router } from 'express';
import {
  getAllMenuItems,
  getPopularMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  toggleSoldOut,
  deleteMenuItem,
} from '../controllers/menu.controller';
import { verifyToken, requireRole } from '../middleware/auth.middleware';
import { uploadMenuImage } from '../middleware/upload.middleware';

const router = Router();

// Public routes
router.get('/', getAllMenuItems);
router.get('/popular', getPopularMenuItems);
router.get('/:id', getMenuItemById);

// Admin-only write routes
router.post('/', verifyToken, requireRole('admin'), uploadMenuImage, createMenuItem);
router.put('/:id', verifyToken, requireRole('admin'), uploadMenuImage, updateMenuItem);
router.patch('/:id/toggle-sold-out', verifyToken, requireRole('admin'), toggleSoldOut);
router.delete('/:id', verifyToken, requireRole('admin'), deleteMenuItem);

export default router;
