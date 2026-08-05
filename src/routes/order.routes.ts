import { Router } from 'express';
import {
  placeOrder,
  trackOrderByRef,
  updateOrderStatus,
  getAllOrders,
  getOrderById,
} from '../controllers/order.controller';
import { verifyToken, requireRole, optionalVerifyToken } from '../middleware/auth.middleware';

const router = Router();

// Public / User routes
router.post('/', optionalVerifyToken, placeOrder);
router.get('/:ref', trackOrderByRef); // e.g. GET /api/v1/orders/TK-2847

// Admin routes
router.get('/', verifyToken, requireRole('admin'), getAllOrders);
router.get('/id/:id', verifyToken, requireRole('admin'), getOrderById);
router.patch('/:id/status', verifyToken, requireRole('admin'), updateOrderStatus);

export default router;
