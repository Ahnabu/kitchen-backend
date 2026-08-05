import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.middleware';
import {
  postContact,
  getContact,
  updateContactStatus,
  deleteContact,
} from '../controllers/contact.controller';
import { validateContact } from '../middleware/validate.middleware';

const router = Router();

// Public route to submit contact messages
router.post('/', validateContact, postContact);

// Admin-only routes
router.get('/', verifyToken, requireRole('admin'), getContact);
router.patch('/:id/status', verifyToken, requireRole('admin'), updateContactStatus);
router.delete('/:id', verifyToken, requireRole('admin'), deleteContact);

export default router;
