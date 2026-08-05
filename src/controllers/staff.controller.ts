import { Response } from 'express';
import { Request as AuthRequest } from '../middleware/auth.middleware';
import { Staff } from '../models';

// GET /staff (Admin only)
export const getStaff = async (req: AuthRequest, res: Response) => {
  try {
    const staff = await Staff.findAll({
      order: [['name', 'ASC']],
    });

    res.status(200).json({
      status: 'success',
      results: staff.length,
      data: { staff },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error',
    });
  }
};

// POST /staff (Admin only)
export const addStaff = async (req: AuthRequest, res: Response) => {
  try {
    const { name, role, status, shift, userId } = req.body;

    if (!name || !role || !shift) {
      return res.status(400).json({
        status: 'fail',
        message: 'Name, role, and shift are required.',
      });
    }

    const allowedStatus = ['on-duty', 'off-duty'];
    if (status && !allowedStatus.includes(status)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid status. Must be on-duty or off-duty.',
      });
    }

    const newStaff = await Staff.create({
      name,
      role,
      status: status || 'off-duty',
      shift,
      userId: userId || null,
    });

    res.status(201).json({
      status: 'success',
      data: { staff: newStaff },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error',
    });
  }
};

// PUT /staff/:id (Admin only)
export const updateStaff = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { name, role, status, shift, userId } = req.body;

    const staffMember = await Staff.findByPk(id);
    if (!staffMember) {
      return res.status(404).json({
        status: 'fail',
        message: 'Staff member not found',
      });
    }

    if (name !== undefined) staffMember.name = name;
    if (role !== undefined) staffMember.role = role;
    if (status !== undefined) {
      const allowedStatus = ['on-duty', 'off-duty'];
      if (!allowedStatus.includes(status)) {
        return res.status(400).json({
          status: 'fail',
          message: 'Invalid status. Must be on-duty or off-duty.',
        });
      }
      staffMember.status = status;
    }
    if (shift !== undefined) staffMember.shift = shift;
    if (userId !== undefined) staffMember.userId = userId || null;

    await staffMember.save();

    res.status(200).json({
      status: 'success',
      data: { staff: staffMember },
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error',
    });
  }
};

// DELETE /staff/:id (Admin only)
export const deleteStaff = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const staffMember = await Staff.findByPk(id);

    if (!staffMember) {
      return res.status(404).json({
        status: 'fail',
        message: 'Staff member not found',
      });
    }

    await staffMember.destroy();

    res.status(200).json({
      status: 'success',
      message: 'Staff member deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error',
    });
  }
};
