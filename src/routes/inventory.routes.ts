import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.middleware';
import {
  getInventory,
  getInventoryAlerts,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
} from '../controllers/inventory.controller';

const router = Router();

// Apply auth middleware to all inventory routes
router.use(verifyToken);
router.use(requireRole('admin'));

router.get('/', getInventory);
router.get('/alerts', getInventoryAlerts);
router.post('/', addInventoryItem);
router.put('/:id', updateInventoryItem);
router.delete('/:id', deleteInventoryItem);

export default router;
