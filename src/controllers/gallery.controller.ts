import { Request, Response } from 'express';
import { Request as AuthRequest } from '../middleware/auth.middleware';
import { GalleryImage } from '../models';
import fs from 'fs';
import path from 'path';

// GET /gallery (Public)
// Returns all active images, optionally filtered by category
export const getGalleryImages = async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    const whereClause: any = {
      active: true,
    };

    if (category) {
      whereClause.category = category;
    }

    const images = await GalleryImage.findAll({
      where: whereClause,
      order: [
        ['sortOrder', 'ASC'],
        ['createdAt', 'DESC'],
      ],
    });

    res.status(200).json({
      status: 'success',
      results: images.length,
      data: { images },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error',
    });
  }
};

// POST /gallery (Admin only - upload image)
export const addGalleryImage = async (req: AuthRequest, res: Response) => {
  try {
    const { alt, category, sortOrder } = req.body;

    if (!req.file) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please upload an image file.',
      });
    }

    if (!alt || !category) {
      // Remove uploaded file if validation fails
      if (req.file.path) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        status: 'fail',
        message: 'Alt text and category are required.',
      });
    }

    const allowedCategories = ['Food', 'Smokehouse', 'Drinks', 'Interior', 'Ambience'];
    if (!allowedCategories.includes(category)) {
      if (req.file.path) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        status: 'fail',
        message: `Invalid category. Must be one of: ${allowedCategories.join(', ')}`,
      });
    }

    const baseUrl = process.env.UPLOAD_BASE_URL || '/uploads';
    const src = `${baseUrl}/gallery/${req.file.filename}`;

    const newImage = await GalleryImage.create({
      src,
      alt,
      category,
      sortOrder: parseInt(sortOrder) || 0,
      active: true,
    });

    res.status(201).json({
      status: 'success',
      data: { image: newImage },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error',
    });
  }
};

// PUT /gallery/:id (Admin only)
export const updateGalleryImage = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { alt, category, sortOrder, active } = req.body;

    const image = await GalleryImage.findByPk(id);
    if (!image) {
      return res.status(404).json({
        status: 'fail',
        message: 'Gallery image not found',
      });
    }

    if (alt !== undefined) image.alt = alt;
    if (category !== undefined) {
      const allowedCategories = ['Food', 'Smokehouse', 'Drinks', 'Interior', 'Ambience'];
      if (!allowedCategories.includes(category)) {
        return res.status(400).json({
          status: 'fail',
          message: `Invalid category. Must be one of: ${allowedCategories.join(', ')}`,
        });
      }
      image.category = category;
    }
    if (sortOrder !== undefined) image.sortOrder = parseInt(sortOrder) || 0;
    if (active !== undefined) image.active = !!active;

    await image.save();

    res.status(200).json({
      status: 'success',
      data: { image },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error',
    });
  }
};

// DELETE /gallery/:id (Admin only)
export const deleteGalleryImage = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const image = await GalleryImage.findByPk(id);

    if (!image) {
      return res.status(404).json({
        status: 'fail',
        message: 'Gallery image not found',
      });
    }

    // Try deleting image file from uploads folder
    const filename = image.src.split('/').pop();
    if (filename) {
      const filePath = path.join(__dirname, '../../uploads/gallery', filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await image.destroy();

    res.status(200).json({
      status: 'success',
      message: 'Gallery image deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error',
    });
  }
};
