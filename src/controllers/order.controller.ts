import { Response } from 'express';
import { Request } from '../middleware/auth.middleware'; // custom extended request
import { Order, OrderItem, MenuItem, User, LoyaltyTransaction } from '../models';
import { generateOrderRef } from '../utils/orderRef.utils';

export const placeOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      deliveryAddress,
      deliveryArea,
      specialInstructions,
      paymentMethod,
      items,
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({
        status: 'fail',
        message: 'Order items are required.',
      });
      return;
    }

    let subtotal = 0;
    const itemsData = [];

    // Verify items and prices from DB
    for (const item of items) {
      const menuItem = await MenuItem.findByPk(item.menuItemId);
      if (!menuItem) {
        res.status(400).json({
          status: 'fail',
          message: `Menu item with ID ${item.menuItemId} not found.`,
        });
        return;
      }

      if (menuItem.soldOut) {
        res.status(400).json({
          status: 'fail',
          message: `Menu item '${menuItem.name}' is currently sold out.`,
        });
        return;
      }

      const qty = Number(item.quantity) || 1;
      const itemSubtotal = Number(menuItem.price) * qty;
      subtotal += itemSubtotal;

      itemsData.push({
        menuItemId: menuItem.id,
        itemName: menuItem.name,
        itemPrice: Number(menuItem.price),
        quantity: qty,
        subtotal: itemSubtotal,
      });
    }

    const deliveryFee = 2.0; // flat fee matching frontend
    const total = subtotal + deliveryFee;
    const orderRef = await generateOrderRef();
    const userId = req.user ? req.user.userId : null;

    // Create Order record
    const order = await Order.create({
      orderRef,
      userId,
      customerName,
      customerEmail: customerEmail || null,
      customerPhone,
      deliveryAddress,
      deliveryArea: deliveryArea || null,
      specialInstructions: specialInstructions || null,
      paymentMethod: paymentMethod || 'cash',
      paymentStatus: paymentMethod === 'cash' ? 'pending' : 'paid', // card/revolut mock as paid
      subtotal,
      deliveryFee,
      total,
      status: 'confirmed',
      estimatedMinutes: 35,
    });

    // Create Order Items records
    const orderItemsToCreate = itemsData.map((item) => ({
      ...item,
      orderId: order.id,
    }));
    await OrderItem.bulkCreate(orderItemsToCreate);

    // Award loyalty points if logged in
    let loyaltyPointsEarned = 0;
    if (userId) {
      const user = await User.findByPk(userId);
      if (user) {
        // Earn rate: 2.5 points per Euro spent on subtotal
        loyaltyPointsEarned = Math.round(subtotal * 2.5);
        user.loyaltyPoints += loyaltyPointsEarned;

        // Upgrade tier if points thresholds are crossed
        if (user.loyaltyPoints >= 3000) {
          user.loyaltyTier = 'platinum';
        } else if (user.loyaltyPoints >= 1000) {
          user.loyaltyTier = 'gold';
        }

        await user.save();

        // Create transaction log
        await LoyaltyTransaction.create({
          userId: user.id,
          orderId: order.id,
          points: loyaltyPointsEarned,
          type: 'earn',
          description: `Points earned from Order #${orderRef}`,
        });
      }
    }

    res.status(201).json({
      status: 'success',
      data: {
        order: {
          id: order.id,
          orderRef: order.orderRef,
          customerName: order.customerName,
          total: order.total,
          status: order.status,
          loyaltyPointsEarned,
          estimatedMinutes: order.estimatedMinutes,
        },
      },
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to place order',
      error: err?.message,
    });
  }
};

export const trackOrderByRef = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ref } = req.params;
    const order = await Order.findOne({
      where: { orderRef: ref },
      include: [
        {
          model: OrderItem,
          as: 'items',
        },
      ],
    });

    if (!order) {
      res.status(404).json({
        status: 'fail',
        message: `Order reference ${ref} not found.`,
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: { order },
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to track order',
      error: err?.message,
    });
  }
};

export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { status, riderName, estimatedMinutes } = req.body;

    const order = await Order.findByPk(id);
    if (!order) {
      res.status(404).json({
        status: 'fail',
        message: 'Order not found.',
      });
      return;
    }

    await order.update({
      status: status !== undefined ? status : order.status,
      riderName: riderName !== undefined ? riderName : order.riderName,
      estimatedMinutes:
        estimatedMinutes !== undefined ? Number(estimatedMinutes) : order.estimatedMinutes,
    });

    // Emit live update to Socket.IO room `order:<ref>`
    const io = req.app.get('io');
    if (io) {
      io.to(`order:${order.orderRef}`).emit('order:updated', {
        status: order.status,
        riderName: order.riderName,
        estimatedMinutes: order.estimatedMinutes,
      });
    }

    res.status(200).json({
      status: 'success',
      data: { order },
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to update order status',
      error: err?.message,
    });
  }
};

export const getAllOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const orders = await Order.findAll({
      include: [
        {
          model: OrderItem,
          as: 'items',
        },
      ],
      order: [['created_at', 'DESC']],
    });

    res.status(200).json({
      status: 'success',
      results: orders.length,
      data: { orders },
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve orders',
      error: err?.message,
    });
  }
};

export const getOrderById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const order = await Order.findByPk(id, {
      include: [
        {
          model: OrderItem,
          as: 'items',
        },
      ],
    });

    if (!order) {
      res.status(404).json({
        status: 'fail',
        message: 'Order not found.',
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: { order },
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve order',
      error: err?.message,
    });
  }
};
