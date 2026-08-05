import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import app from './src/app';
import { Server, Socket } from 'socket.io';
import { sequelize } from './src/models';

const PORT = process.env.PORT || 3000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Real-time tracking Socket namespace/handlers
io.on('connection', (socket: Socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Handle joining specific order tracking room
  socket.on('join_order', ({ orderRef }: { orderRef?: string }) => {
    if (orderRef) {
      socket.join(`order:${orderRef}`);
      console.log(`Socket ${socket.id} joined tracking room: order:${orderRef}`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Expose io instance via application settings to be used in controllers
app.set('io', io);

// Sync database and start server
sequelize.sync().then(() => {
  server.listen(PORT, () => {
    console.log(`============================================`);
    console.log(`Server listening on port: ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`Local url: http://localhost:${PORT}`);
    console.log(`============================================`);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: any) => {
  console.error(`Error: ${err?.message || err}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
