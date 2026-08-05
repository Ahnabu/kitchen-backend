import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import errorHandler from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import menuRoutes from './routes/menu.routes';
import orderRoutes from './routes/order.routes';
import reservationRoutes from './routes/reservation.routes';
import userRoutes from './routes/user.routes';
import reviewRoutes from './routes/review.routes';
import contactRoutes from './routes/contact.routes';
import newsletterRoutes from './routes/newsletter.routes';
import galleryRoutes from './routes/gallery.routes';
import inventoryRoutes from './routes/inventory.routes';
import staffRoutes from './routes/staff.routes';
import analyticsRoutes from './routes/analytics.routes';


const app = express();

// Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false, // allow images to be loaded by frontend
}));

// CORS Configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
};
app.use(cors(corsOptions));

// HTTP Request Logger
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body Parsers & Cookie Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static uploads directory mapping
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Root welcome routes
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome to The Kitchen Malta API!',
    documentation: 'https://github.com/Ahnabu/kitchen-backend#readme'
  });
});

app.get('/api/v1', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'The Kitchen Malta API version 1 is active.',
    endpoints: {
      auth: '/api/v1/auth',
      menu: '/api/v1/menu',
      orders: '/api/v1/orders',
      reservations: '/api/v1/reservations',
      reviews: '/api/v1/reviews',
      gallery: '/api/v1/gallery',
      status: '/api/v1/status'
    }
  });
});

// Base status checking route
app.use('/api/v1/status', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'The Kitchen Malta REST API is online',
    timestamp: new Date(),
    environment: process.env.NODE_ENV,
  });
});

import { verifyToken, Request as AuthRequest } from './middleware/auth.middleware';

// Protected test route to verify authentication middleware
app.use('/api/v1/test-protected', verifyToken, (req: AuthRequest, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'You have accessed the protected route',
    user: req.user,
  });
});

// Mount routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/menu', menuRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/reservations', reservationRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/contact', contactRoutes);
app.use('/api/v1/newsletter', newsletterRoutes);
app.use('/api/v1/gallery', galleryRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/staff', staffRoutes);
app.use('/api/v1/analytics', analyticsRoutes);

// Catch-all 404 handler
app.use((req: Request, res: Response, next: NextFunction) => {
  const err = new Error(`Route ${req.originalUrl} not found`) as any;
  err.status = 404;
  next(err);
});

// Global Error Handler
app.use(errorHandler);

export default app;
