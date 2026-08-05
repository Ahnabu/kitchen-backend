import { Response } from 'express';
import { Request as AuthRequest } from '../middleware/auth.middleware';
import { User, Order, OrderItem, LoyaltyTransaction, Address } from '../models';

// Helper to determine loyalty tier from points
const getTierFromPoints = (points: number): 'silver' | 'gold' | 'platinum' => {
  if (points >= 3000) return 'platinum';
  if (points >= 1000) return 'gold';
  return 'silver';
};

// Helper to calculate tier progress
const calculateTierProgress = (points: number) => {
  if (points >= 3000) {
    return {
      tierProgress: 100,
      nextTierName: 'Max Tier reached',
      pointsToNextTier: 0,
    };
  }
  if (points >= 1000) {
    const progress = Math.round(((points - 1000) / 2000) * 100);
    return {
      tierProgress: Math.min(Math.max(progress, 0), 100),
      nextTierName: 'Platinum',
      pointsToNextTier: 3000 - points,
    };
  }
  const progress = Math.round((points / 1000) * 100);
  return {
    tierProgress: Math.min(Math.max(progress, 0), 100),
    nextTierName: 'Gold',
    pointsToNextTier: 1000 - points,
  };
};

// GET /users/me
export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['passwordHash'] },
    });

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found',
      });
    }

    res.status(200).json({
      status: 'success',
      data: { user },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error',
    });
  }
};

// PUT /users/me
export const updateMe = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { name, phone, newsletterSubscribed } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found',
      });
    }

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (newsletterSubscribed !== undefined) {
      user.newsletterSubscribed = newsletterSubscribed;
    }

    await user.save();

    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          avatarUrl: user.avatarUrl,
          loyaltyPoints: user.loyaltyPoints,
          loyaltyTier: user.loyaltyTier,
          newsletterSubscribed: user.newsletterSubscribed,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error',
    });
  }
};

// PUT /users/me/avatar
export const updateAvatar = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!req.file) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please upload an image file.',
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found',
      });
    }

    const baseUrl = process.env.UPLOAD_BASE_URL || '/uploads';
    user.avatarUrl = `${baseUrl}/avatars/${req.file.filename}`;
    await user.save();

    res.status(200).json({
      status: 'success',
      data: {
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error',
    });
  }
};

// GET /users/me/orders
export const getMyOrders = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const { count, rows: orders } = await Order.findAndCountAll({
      where: { userId },
      include: [
        {
          model: OrderItem,
          as: 'items',
        },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      distinct: true, // ensures correct count when including hasMany
    });

    res.status(200).json({
      status: 'success',
      results: orders.length,
      data: {
        total: count,
        pages: Math.ceil(count / limit),
        currentPage: page,
        orders,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error',
    });
  }
};

// GET /users/me/loyalty
export const getMyLoyalty = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found',
      });
    }

    const { tierProgress, nextTierName, pointsToNextTier } = calculateTierProgress(
      user.loyaltyPoints
    );

    const history = await LoyaltyTransaction.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
      status: 'success',
      data: {
        points: user.loyaltyPoints,
        tier: user.loyaltyTier,
        tierProgress,
        nextTierName,
        pointsToNextTier,
        history,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error',
    });
  }
};

// POST /users/me/loyalty/redeem
export const redeemLoyalty = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { points } = req.body;

    const pointsToRedeem = Number(points);
    if (isNaN(pointsToRedeem) || pointsToRedeem <= 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide a valid positive number of points to redeem.',
      });
    }

    // Validate minimum redemption threshold of 500 points
    if (pointsToRedeem < 500) {
      return res.status(400).json({
        status: 'fail',
        message: 'Minimum redemption threshold is 500 points.',
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found',
      });
    }

    if (user.loyaltyPoints < pointsToRedeem) {
      return res.status(400).json({
        status: 'fail',
        message: `Insufficient loyalty points. You only have ${user.loyaltyPoints} points.`,
      });
    }

    // Deduct points and adjust tier
    user.loyaltyPoints -= pointsToRedeem;
    user.loyaltyTier = getTierFromPoints(user.loyaltyPoints);
    await user.save();

    // Log the transaction
    const transaction = await LoyaltyTransaction.create({
      userId,
      points: -pointsToRedeem,
      type: 'redeem',
      description: `Redeemed ${pointsToRedeem} points for discount`,
    });

    const { tierProgress, nextTierName, pointsToNextTier } = calculateTierProgress(
      user.loyaltyPoints
    );

    res.status(200).json({
      status: 'success',
      message: `Successfully redeemed ${pointsToRedeem} points.`,
      data: {
        points: user.loyaltyPoints,
        tier: user.loyaltyTier,
        tierProgress,
        nextTierName,
        pointsToNextTier,
        transaction,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error',
    });
  }
};

// GET /users/me/addresses
export const getAddresses = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const addresses = await Address.findAll({
      where: { userId },
      order: [['isDefault', 'DESC'], ['createdAt', 'DESC']],
    });

    res.status(200).json({
      status: 'success',
      results: addresses.length,
      data: { addresses },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error',
    });
  }
};

// POST /users/me/addresses
export const addAddress = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { label, address, area, city, isDefault } = req.body;

    const shouldBeDefault = !!isDefault;

    if (shouldBeDefault) {
      // Set all other addresses for this user to isDefault = false
      await Address.update({ isDefault: false }, { where: { userId } });
    }

    const newAddress = await Address.create({
      userId,
      label,
      address,
      area,
      city: city || 'Malta',
      isDefault: shouldBeDefault,
    });

    res.status(201).json({
      status: 'success',
      data: { address: newAddress },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error',
    });
  }
};

// PUT /users/me/addresses/:id
export const updateAddress = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const id = req.params.id as string;
    const { label, address, area, city, isDefault } = req.body;

    const savedAddress = await Address.findOne({ where: { id, userId } });
    if (!savedAddress) {
      return res.status(404).json({
        status: 'fail',
        message: 'Address not found',
      });
    }

    const shouldBeDefault = isDefault !== undefined ? !!isDefault : savedAddress.isDefault;

    if (shouldBeDefault && !savedAddress.isDefault) {
      // Set all other addresses for this user to isDefault = false
      await Address.update({ isDefault: false }, { where: { userId } });
    }

    if (label !== undefined) savedAddress.label = label;
    if (address !== undefined) savedAddress.address = address;
    if (area !== undefined) savedAddress.area = area;
    if (city !== undefined) savedAddress.city = city;
    savedAddress.isDefault = shouldBeDefault;

    await savedAddress.save();

    res.status(200).json({
      status: 'success',
      data: { address: savedAddress },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error',
    });
  }
};

// DELETE /users/me/addresses/:id
export const deleteAddress = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const id = req.params.id as string;

    const savedAddress = await Address.findOne({ where: { id, userId } });
    if (!savedAddress) {
      return res.status(404).json({
        status: 'fail',
        message: 'Address not found',
      });
    }

    await savedAddress.destroy();

    res.status(200).json({
      status: 'success',
      message: 'Address deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error',
    });
  }
};

