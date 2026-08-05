import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.middleware';
import {
  getGalleryImages,
  addGalleryImage,
  updateGalleryImage,
  deleteGalleryImage,
} from '../controllers/gallery.controller';
import { uploadGalleryImage } from '../middleware/upload.middleware';

const router = Router();

// Public routes
router.get('/', getGalleryImages);

// Admin routes
router.post('/', verifyToken, requireRole('admin'), uploadGalleryImage, addGalleryImage);
router.put('/:id', verifyToken, requireRole('admin'), updateGalleryImage);
router.delete('/:id', verifyToken, requireRole('admin'), deleteGalleryImage);

export default router;
