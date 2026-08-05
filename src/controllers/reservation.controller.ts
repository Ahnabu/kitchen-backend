import { Response } from 'express';
import { Request } from '../middleware/auth.middleware';
import { Reservation } from '../models';

const generateReservationRef = async (): Promise<string> => {
  let isUnique = false;
  let ref = '';

  while (!isUnique) {
    const randomNum = Math.floor(1000 + Math.random() * 9000); // 4-digit number
    ref = `RES-${randomNum}`;

    const existing = await Reservation.findOne({ where: { ref } });
    if (!existing) {
      isUnique = true;
    }
  }

  return ref;
};

export const createReservation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, phone, date, time, guests, seating, occasion, notes } = req.body;

    const ref = await generateReservationRef();
    const userId = req.user ? req.user.userId : null;

    const reservation = await Reservation.create({
      ref,
      userId,
      name,
      email,
      phone: phone || null,
      date,
      time,
      guests,
      seating: seating || 'indoor',
      occasion: occasion || 'None',
      notes: notes || null,
      status: 'pending',
    });

    res.status(201).json({
      status: 'success',
      data: { reservation },
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to create reservation',
      error: err?.message,
    });
  }
};

export const getReservationByRef = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ref } = req.params;
    const reservation = await Reservation.findOne({ where: { ref } });

    if (!reservation) {
      res.status(404).json({
        status: 'fail',
        message: `Reservation booking code ${ref} not found.`,
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: { reservation },
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve reservation details',
      error: err?.message,
    });
  }
};

export const getAllReservations = async (req: Request, res: Response): Promise<void> => {
  try {
    const reservations = await Reservation.findAll({ order: [['date', 'ASC']] });
    res.status(200).json({
      status: 'success',
      results: reservations.length,
      data: { reservations },
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve reservations list',
      error: err?.message,
    });
  }
};

export const confirmReservation = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const reservation = await Reservation.findByPk(id);

    if (!reservation) {
      res.status(404).json({
        status: 'fail',
        message: 'Reservation not found.',
      });
      return;
    }

    await reservation.update({ status: 'confirmed' });

    res.status(200).json({
      status: 'success',
      data: { reservation },
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to confirm reservation',
      error: err?.message,
    });
  }
};

export const cancelReservation = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const reservation = await Reservation.findByPk(id);

    if (!reservation) {
      res.status(404).json({
        status: 'fail',
        message: 'Reservation not found.',
      });
      return;
    }

    // Auth validation check: ensure owner or admin is requesting cancellation
    if (req.user && req.user.role !== 'admin' && reservation.userId !== req.user.userId) {
      res.status(403).json({
        status: 'fail',
        message: 'Access denied. You do not have permission to cancel this booking.',
      });
      return;
    }

    await reservation.update({ status: 'cancelled' });

    res.status(200).json({
      status: 'success',
      data: { reservation },
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to cancel reservation',
      error: err?.message,
    });
  }
};

export const updateReservation = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { tableRef, status, seating, date, time, guests } = req.body;

    const reservation = await Reservation.findByPk(id);
    if (!reservation) {
      res.status(404).json({
        status: 'fail',
        message: 'Reservation not found.',
      });
      return;
    }

    await reservation.update({
      tableRef: tableRef !== undefined ? tableRef : reservation.tableRef,
      status: status !== undefined ? status : reservation.status,
      seating: seating !== undefined ? seating : reservation.seating,
      date: date !== undefined ? date : reservation.date,
      time: time !== undefined ? time : reservation.time,
      guests: guests !== undefined ? guests : reservation.guests,
    });

    res.status(200).json({
      status: 'success',
      data: { reservation },
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to update reservation details',
      error: err?.message,
    });
  }
};
