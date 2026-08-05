import { Response } from 'express';
import { Request as AuthRequest } from '../middleware/auth.middleware';
import { Order, Reservation, Review, OrderItem } from '../models';
import { Op, fn, col } from 'sequelize';

// GET /analytics/overview (Admin only)
export const getOverview = async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const endOfToday = new Date(today.setHours(23, 59, 59, 999));

    // 1. Today's Revenue (only delivered orders)
    const revenueTodayResult = await Order.sum('total', {
      where: {
        status: 'delivered',
        createdAt: {
          [Op.between]: [startOfToday, endOfToday],
        },
      },
    });
    const revenueToday = parseFloat(revenueTodayResult?.toString() || '0');

    // 2. Orders Today (all statuses)
    const ordersToday = await Order.count({
      where: {
        createdAt: {
          [Op.between]: [startOfToday, endOfToday],
        },
      },
    });

    // 3. Covers Tonight (reservations today)
    const todayDateStr = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"
    const reservationsToday = await Reservation.findAll({
      where: {
        date: todayDateStr,
        status: {
          [Op.ne]: 'cancelled',
        },
      },
    });
    const coversTonight = reservationsToday.reduce((sum, resv) => {
      const guests = parseInt(String(resv.guests).replace('+', '')) || 0;
      return sum + guests;
    }, 0);

    // 4. Average Rating (published reviews)
    const averageRatingResult = await Review.aggregate('rating', 'AVG', {
      where: {
        status: 'published',
      },
    });
    const averageRating = parseFloat(parseFloat(averageRatingResult?.toString() || '0').toFixed(1));

    res.status(200).json({
      status: 'success',
      data: {
        revenueToday,
        ordersToday,
        coversTonight,
        averageRating,
      },
    });
  } catch (error: any) {
    console.error('Error in getOverview analytics:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error',
    });
  }
};

// GET /analytics/weekly (Admin only)
export const getWeekly = async (req: AuthRequest, res: Response) => {
  try {
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const result = [];

    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // Get all orders for last 7 days
    const orders = await Order.findAll({
      where: {
        createdAt: {
          [Op.gte]: sevenDaysAgo,
        },
      },
    });

    // Process each of the 7 days (ending with today)
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dayLabel = daysOfWeek[d.getDay()];
      const dateStr = d.toDateString();

      const dayOrders = orders.filter((o) => {
        const orderDate = new Date(o.createdAt);
        return orderDate.toDateString() === dateStr;
      });

      const dayRevenue = dayOrders
        .filter((o) => o.status === 'delivered')
        .reduce((sum, o) => sum + parseFloat(o.total.toString()), 0);

      result.push({
        day: dayLabel,
        revenue: parseFloat(dayRevenue.toFixed(2)),
        orders: dayOrders.length,
      });
    }

    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error',
    });
  }
};

// GET /analytics/top-dishes (Admin only)
export const getTopDishes = async (req: AuthRequest, res: Response) => {
  try {
    const topItems = await OrderItem.findAll({
      attributes: [
        'menuItemId',
        'itemName',
        [fn('SUM', col('quantity')), 'quantitySold'],
      ],
      group: ['menuItemId', 'itemName'],
      order: [[fn('SUM', col('quantity')), 'DESC']],
      limit: 5,
    });

    const formatted = topItems.map((item: any) => ({
      itemId: item.menuItemId,
      name: item.itemName,
      quantitySold: parseInt(item.getDataValue('quantitySold')) || 0,
    }));

    res.status(200).json({
      status: 'success',
      data: formatted,
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error',
    });
  }
};
