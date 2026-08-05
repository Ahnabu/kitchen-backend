import { Request, Response } from 'express';
import { MenuItem } from '../models';
import { Op } from 'sequelize';
import fs from 'fs';
import path from 'path';

export const getAllMenuItems = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, diet, search } = req.query;

    const whereClause: any = {};

    if (category) {
      whereClause.category = category;
    }

    if (diet) {
      whereClause.diet = diet;
    }

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    const items = await MenuItem.findAll({ where: whereClause });

    res.status(200).json({
      status: 'success',
      results: items.length,
      data: { items },
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve menu items',
      error: err?.message,
    });
  }
};

export const getPopularMenuItems = async (req: Request, res: Response): Promise<void> => {
  try {
    const items = await MenuItem.findAll({ where: { popular: true } });
    res.status(200).json({
      status: 'success',
      results: items.length,
      data: { items },
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve popular menu items',
      error: err?.message,
    });
  }
};

export const getMenuItemById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const item = await MenuItem.findByPk(id);

    if (!item) {
      res.status(404).json({
        status: 'fail',
        message: 'Menu item not found',
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: { item },
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve menu item',
      error: err?.message,
    });
  }
};

export const createMenuItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, name, nameAr, description, price, category, diet, spicy, tags, popular } = req.body;

    // Check if ID already exists
    const existing = await MenuItem.findByPk(id);
    if (existing) {
      res.status(400).json({
        status: 'fail',
        message: `A menu item with ID '${id}' already exists.`,
      });
      return;
    }

    // Validate uploaded file
    if (!req.file) {
      res.status(400).json({
        status: 'fail',
        message: 'Image file is required for creating a menu item.',
      });
      return;
    }

    const hostUrl = process.env.UPLOAD_BASE_URL || `${req.protocol}://${req.get('host')}/uploads`;
    const imageUrl = `${hostUrl}/menu/${req.file.filename}`;

    // Parse tags if sent as JSON string
    let parsedTags = null;
    if (tags) {
      try {
        parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      } catch (e) {
        parsedTags = [tags];
      }
    }

    const item = await MenuItem.create({
      id,
      name,
      nameAr: nameAr || null,
      description,
      price: Number(price),
      category,
      diet,
      spicy: spicy === 'true' || spicy === true,
      imageUrl,
      tags: parsedTags,
      popular: popular === 'true' || popular === true,
    });

    res.status(201).json({
      status: 'success',
      data: { item },
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to create menu item',
      error: err?.message,
    });
  }
};

export const updateMenuItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const item = await MenuItem.findByPk(id);

    if (!item) {
      res.status(404).json({
        status: 'fail',
        message: 'Menu item not found',
      });
      return;
    }

    const { name, nameAr, description, price, category, diet, spicy, tags, popular, soldOut } = req.body;

    let imageUrl = item.imageUrl;
    if (req.file) {
      // Delete old file if exists
      const oldFilename = item.imageUrl.split('/').pop();
      if (oldFilename) {
        const oldPath = path.join(__dirname, '../../uploads/menu/', oldFilename);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      const hostUrl = process.env.UPLOAD_BASE_URL || `${req.protocol}://${req.get('host')}/uploads`;
      imageUrl = `${hostUrl}/menu/${req.file.filename}`;
    }

    let parsedTags = item.tags;
    if (tags !== undefined) {
      try {
        parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      } catch (e) {
        parsedTags = [tags];
      }
    }

    await item.update({
      name: name !== undefined ? name : item.name,
      nameAr: nameAr !== undefined ? nameAr : item.nameAr,
      description: description !== undefined ? description : item.description,
      price: price !== undefined ? Number(price) : item.price,
      category: category !== undefined ? category : item.category,
      diet: diet !== undefined ? diet : item.diet,
      spicy: spicy !== undefined ? (spicy === 'true' || spicy === true) : item.spicy,
      soldOut: soldOut !== undefined ? (soldOut === 'true' || soldOut === true) : item.soldOut,
      imageUrl,
      tags: parsedTags,
      popular: popular !== undefined ? (popular === 'true' || popular === true) : item.popular,
    });

    res.status(200).json({
      status: 'success',
      data: { item },
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to update menu item',
      error: err?.message,
    });
  }
};

export const toggleSoldOut = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const item = await MenuItem.findByPk(id);

    if (!item) {
      res.status(404).json({
        status: 'fail',
        message: 'Menu item not found',
      });
      return;
    }

    await item.update({ soldOut: !item.soldOut });

    res.status(200).json({
      status: 'success',
      data: { item },
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to toggle status',
      error: err?.message,
    });
  }
};

export const deleteMenuItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const item = await MenuItem.findByPk(id);

    if (!item) {
      res.status(404).json({
        status: 'fail',
        message: 'Menu item not found',
      });
      return;
    }

    // Delete image file
    const filename = item.imageUrl.split('/').pop();
    if (filename) {
      const imgPath = path.join(__dirname, '../../uploads/menu/', filename);
      if (fs.existsSync(imgPath)) {
        fs.unlinkSync(imgPath);
      }
    }

    await item.destroy();

    res.status(200).json({
      status: 'success',
      message: 'Menu item deleted successfully.',
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete menu item',
      error: err?.message,
    });
  }
};
