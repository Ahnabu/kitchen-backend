import { Request, Response } from 'express';
import { Request as AuthRequest } from '../middleware/auth.middleware';
import { Review, User } from '../models';

// GET /reviews (Public)
// Returns only published reviews. Supports ?rating=&page=&limit=
export const getReviews = async (req: Request, res: Response) => {
  try {
    const rating = req.query.rating ? parseInt(req.query.rating as string) : undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const whereClause: any = {
      status: 'published',
    };

    if (rating !== undefined && !isNaN(rating)) {
      whereClause.rating = rating;
    }

    const { count, rows: reviews } = await Review.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    res.status(200).json({
      status: 'success',
      results: reviews.length,
      data: {
        total: count,
        pages: Math.ceil(count / limit),
        currentPage: page,
        reviews,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error',
    });
  }
};

// POST /reviews (Public/Auth - Submit Review)
// Always goes in as pending. If auth, set verified = true, link userId
export const postReview = async (req: AuthRequest, res: Response) => {
  try {
    const { name, rating, dish, text } = req.body;
    const userId = req.user?.userId || null;

    let reviewerName = name;
    let reviewerAvatar: string | null = null;
    let isVerified = false;

    if (userId) {
      const user = await User.findByPk(userId);
      if (user) {
        reviewerName = name || user.name;
        reviewerAvatar = user.avatarUrl;
        isVerified = true;
      }
    }

    if (!reviewerName) {
      return res.status(400).json({
        status: 'fail',
        message: 'Name is required for guest reviews.',
      });
    }

    const review = await Review.create({
      userId,
      name: reviewerName,
      avatarUrl: reviewerAvatar,
      rating: parseInt(rating),
      dish,
      text,
      verified: isVerified,
      status: 'pending',
    });

    res.status(201).json({
      status: 'success',
      data: { review },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error',
    });
  }
};

// PATCH /reviews/:id/approve (Admin only)
export const approveReview = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const review = await Review.findByPk(id);

    if (!review) {
      return res.status(404).json({
        status: 'fail',
        message: 'Review not found',
      });
    }

    review.status = 'published';
    await review.save();

    res.status(200).json({
      status: 'success',
      message: 'Review approved and published successfully',
      data: { review },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error',
    });
  }
};

// PATCH /reviews/:id/reject (Admin only)
export const rejectReview = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const review = await Review.findByPk(id);

    if (!review) {
      return res.status(404).json({
        status: 'fail',
        message: 'Review not found',
      });
    }

    review.status = 'rejected';
    await review.save();

    res.status(200).json({
      status: 'success',
      message: 'Review rejected successfully',
      data: { review },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error',
    });
  }
};

// DELETE /reviews/:id (Admin only)
export const deleteReview = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const review = await Review.findByPk(id);

    if (!review) {
      return res.status(404).json({
        status: 'fail',
        message: 'Review not found',
      });
    }

    await review.destroy();

    res.status(200).json({
      status: 'success',
      message: 'Review deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error',
    });
  }
};
