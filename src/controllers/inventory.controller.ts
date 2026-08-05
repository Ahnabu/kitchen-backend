import { Response } from 'express';
import { Request as AuthRequest } from '../middleware/auth.middleware';
import { Inventory } from '../models';
import { Op } from 'sequelize';

// GET /inventory (Admin only)
export const getInventory = async (req: AuthRequest, res: Response) => {
  try {
    const items = await Inventory.findAll({
      order: [['item', 'ASC']],
    });

    res.status(200).json({
      status: 'success',
      results: items.length,
      data: { items },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error',
    });
  }
};

// GET /inventory/alerts (Admin only)
// Returns only low or critical stock items
export const getInventoryAlerts = async (req: AuthRequest, res: Response) => {
  try {
    const items = await Inventory.findAll({
      where: {
        status: {
          [Op.in]: ['low', 'critical'],
        },
      },
      order: [['status', 'ASC'], ['item', 'ASC']], // Show critical first, then low
    });

    res.status(200).json({
      status: 'success',
      results: items.length,
      data: { items },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error',
    });
  }
};

// POST /inventory (Admin only)
export const addInventoryItem = async (req: AuthRequest, res: Response) => {
  try {
    const { item, stock, minLevel, unit } = req.body;

    if (!item) {
      return res.status(400).json({
        status: 'fail',
        message: 'Item name is required.',
      });
    }

    const newItem = await Inventory.create({
      item,
      stock: stock !== undefined ? parseFloat(stock) : 0,
      minLevel: minLevel !== undefined ? parseFloat(minLevel) : 0,
      unit: unit || 'pcs',
    });

    res.status(201).json({
      status: 'success',
      data: { item: newItem },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error',
    });
  }
};

// PUT /inventory/:id (Admin only)
export const updateInventoryItem = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { item, stock, minLevel, unit } = req.body;

    const inventoryItem = await Inventory.findByPk(id);
    if (!inventoryItem) {
      return res.status(404).json({
        status: 'fail',
        message: 'Inventory item not found',
      });
    }

    if (item !== undefined) inventoryItem.item = item;
    if (stock !== undefined) inventoryItem.stock = parseFloat(stock);
    if (minLevel !== undefined) inventoryItem.minLevel = parseFloat(minLevel);
    if (unit !== undefined) inventoryItem.unit = unit;

    await inventoryItem.save();

    res.status(200).json({
      status: 'success',
      data: { item: inventoryItem },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error',
    });
  }
};

// DELETE /inventory/:id (Admin only)
export const deleteInventoryItem = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const inventoryItem = await Inventory.findByPk(id);

    if (!inventoryItem) {
      return res.status(404).json({
        status: 'fail',
        message: 'Inventory item not found',
      });
    }

    await inventoryItem.destroy();

    res.status(200).json({
      status: 'success',
      message: 'Inventory item deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error',
    });
  }
};
