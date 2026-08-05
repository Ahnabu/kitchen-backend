import { Request, Response } from 'express';
import { Request as AuthRequest } from '../middleware/auth.middleware';
import { ContactMessage } from '../models';

// POST /contact (Public)
export const postContact = async (req: Request, res: Response) => {
  try {
    const { name, email, subject, message } = req.body;

    const contact = await ContactMessage.create({
      name,
      email,
      subject: subject || null,
      message,
      status: 'new',
    });

    res.status(201).json({
      status: 'success',
      data: { contact },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error',
    });
  }
};

// GET /contact (Admin only)
export const getContact = async (req: AuthRequest, res: Response) => {
  try {
    const status = req.query.status as 'new' | 'read' | 'replied' | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const whereClause: any = {};
    if (status) {
      whereClause.status = status;
    }

    const { count, rows: messages } = await ContactMessage.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    res.status(200).json({
      status: 'success',
      results: messages.length,
      data: {
        total: count,
        pages: Math.ceil(count / limit),
        currentPage: page,
        messages,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error',
    });
  }
};

// PATCH /contact/:id/status (Admin only)
export const updateContactStatus = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    if (!['new', 'read', 'replied'].includes(status)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid status value. Must be new, read, or replied.',
      });
    }

    const contact = await ContactMessage.findByPk(id);
    if (!contact) {
      return res.status(404).json({
        status: 'fail',
        message: 'Contact message not found',
      });
    }

    contact.status = status;
    await contact.save();

    res.status(200).json({
      status: 'success',
      message: 'Status updated successfully',
      data: { contact },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error',
    });
  }
};

// DELETE /contact/:id (Admin only)
export const deleteContact = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const contact = await ContactMessage.findByPk(id);

    if (!contact) {
      return res.status(404).json({
        status: 'fail',
        message: 'Contact message not found',
      });
    }

    await contact.destroy();

    res.status(200).json({
      status: 'success',
      message: 'Contact message deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error',
    });
  }
};
