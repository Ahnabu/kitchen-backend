import { Router } from 'express';
import {
  createReservation,
  getReservationByRef,
  getAllReservations,
  confirmReservation,
  cancelReservation,
  updateReservation,
} from '../controllers/reservation.controller';
import { verifyToken, requireRole, optionalVerifyToken } from '../middleware/auth.middleware';

const router = Router();

// Public / User routes
router.post('/', optionalVerifyToken, createReservation);
router.get('/:ref', getReservationByRef); // e.g. GET /api/v1/reservations/RES-1234
router.patch('/:id/cancel', optionalVerifyToken, cancelReservation); // owner or admin

// Admin routes
router.get('/', verifyToken, requireRole('admin'), getAllReservations);
router.patch('/:id/confirm', verifyToken, requireRole('admin'), confirmReservation);
router.put('/:id', verifyToken, requireRole('admin'), updateReservation);

export default router;
