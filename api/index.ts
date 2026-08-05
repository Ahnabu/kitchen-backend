import 'mysql2';
import app from '../src/app';
import { sequelize } from '../src/models';

let isSynced = false;

// Middleware to dynamically synchronize database tables in serverless environment
app.use(async (req, res, next) => {
  if (!isSynced) {
    try {
      console.log('🔄 Serverless request received. Synchronizing database tables...');
      await sequelize.sync();
      isSynced = true;
      console.log('✅ Serverless database synchronization successful.');
    } catch (error) {
      console.error('❌ Serverless database synchronization failed:', error);
    }
  }
  next();
});

export default app;
