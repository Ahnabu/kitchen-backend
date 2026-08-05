import { Request, Response } from 'express';
import { Request as AuthRequest } from '../middleware/auth.middleware';
import { NewsletterSubscriber } from '../models';

// POST /newsletter/subscribe (Public)
export const subscribe = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: 'fail',
        message: 'Email address is required.',
      });
    }

    // Try to find if email already exists
    const subscriber = await NewsletterSubscriber.findOne({ where: { email } });

    if (subscriber) {
      if (subscriber.active) {
        return res.status(200).json({
          status: 'success',
          message: 'You are already subscribed to our newsletter.',
          data: { subscriber },
        });
      }

      // Re-activate subscription
      subscriber.active = true;
      subscriber.subscribedAt = new Date();
      await subscriber.save();

      return res.status(200).json({
        status: 'success',
        message: 'Welcome back! Your newsletter subscription has been reactivated.',
        data: { subscriber },
      });
    }

    // Create new subscriber
    const newSubscriber = await NewsletterSubscriber.create({
      email,
      active: true,
      subscribedAt: new Date(),
    });

    res.status(201).json({
      status: 'success',
      message: 'Thank you for subscribing to our newsletter!',
      data: { subscriber: newSubscriber },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error',
    });
  }
};

// DELETE /newsletter/unsubscribe (Public)
export const unsubscribe = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: 'fail',
        message: 'Email address is required to unsubscribe.',
      });
    }

    const subscriber = await NewsletterSubscriber.findOne({ where: { email } });

    if (!subscriber) {
      return res.status(404).json({
        status: 'fail',
        message: 'Email address not found in our subscriber list.',
      });
    }

    if (!subscriber.active) {
      return res.status(200).json({
        status: 'success',
        message: 'You are already unsubscribed.',
      });
    }

    subscriber.active = false;
    await subscriber.save();

    res.status(200).json({
      status: 'success',
      message: 'You have successfully unsubscribed from our newsletter.',
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error',
    });
  }
};

// GET /newsletter (Admin only)
export const getSubscribers = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const { count, rows: subscribers } = await NewsletterSubscriber.findAndCountAll({
      where: { active: true },
      order: [['subscribedAt', 'DESC']],
      limit,
      offset,
    });

    res.status(200).json({
      status: 'success',
      results: subscribers.length,
      data: {
        total: count,
        pages: Math.ceil(count / limit),
        currentPage: page,
        subscribers,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error',
    });
  }
};
