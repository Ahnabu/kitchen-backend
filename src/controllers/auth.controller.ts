import { Request, Response } from 'express';
import { User, LoyaltyTransaction } from '../models';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt.utils';
import bcrypt from 'bcryptjs';

const setRefreshCookie = (res: Response, token: string) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // true in production
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      res.status(400).json({
        status: 'fail',
        message: 'A user with this email address already exists.',
      });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const userRole = role === 'admin' ? 'admin' : 'customer';
    const user = await User.create({
      name,
      email,
      phone,
      passwordHash,
      role: userRole,
      loyaltyPoints: 500, // starting points
    });

    // Create loyalty signup bonus transaction
    await LoyaltyTransaction.create({
      userId: user.id,
      points: 500,
      type: 'bonus',
      description: 'Sign-up Loyalty Bonus',
    });

    // Generate tokens
    const payload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Set refresh token in cookie
    setRefreshCookie(res, refreshToken);

    res.status(201).json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          loyaltyPoints: user.loyaltyPoints,
          loyaltyTier: user.loyaltyTier,
          newsletterSubscribed: user.newsletterSubscribed,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
        },
        accessToken,
      },
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'error',
      message: 'An error occurred during registration.',
      error: err?.message,
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user || !user.passwordHash) {
      res.status(401).json({
        status: 'fail',
        message: 'Incorrect email or password.',
      });
      return;
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({
        status: 'fail',
        message: 'Incorrect email or password.',
      });
      return;
    }

    // Generate tokens
    const payload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Set refresh token in cookie
    setRefreshCookie(res, refreshToken);

    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          loyaltyPoints: user.loyaltyPoints,
          loyaltyTier: user.loyaltyTier,
          newsletterSubscribed: user.newsletterSubscribed,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
        },
        accessToken,
      },
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'error',
      message: 'An error occurred during login.',
      error: err?.message,
    });
  }
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      res.status(401).json({
        status: 'fail',
        message: 'Refresh token not found.',
      });
      return;
    }

    const decoded = verifyRefreshToken(token);
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      res.status(401).json({
        status: 'fail',
        message: 'User belonging to this token no longer exists.',
      });
      return;
    }

    // Generate new access token
    const payload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(payload);

    res.status(200).json({
      status: 'success',
      accessToken,
    });
  } catch (err: any) {
    res.status(401).json({
      status: 'fail',
      message: 'Invalid or expired refresh token.',
      error: err?.message,
    });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully.',
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'error',
      message: 'An error occurred during logout.',
      error: err?.message,
    });
  }
};
