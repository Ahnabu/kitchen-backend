import { Sequelize } from 'sequelize';
import path from 'path';

let sequelize: Sequelize;

const databaseUrl = process.env.DATABASE_URL;

if (databaseUrl) {
  console.log('Connecting to database using DATABASE_URL...');
  // Check if connection is to mysql or sqlite (helpful for testing)
  const isMysql = databaseUrl.startsWith('mysql');
  sequelize = new Sequelize(databaseUrl, {
    dialect: isMysql ? 'mysql' : 'sqlite',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    dialectOptions: isMysql
      ? {
          ssl: {
            rejectUnauthorized: false, // typical requirement for cloud databases
          },
        }
      : {},
  });
} else if (
  process.env.DB_HOST &&
  process.env.DB_USER &&
  process.env.DB_NAME &&
  process.env.DB_HOST !== 'localhost' // fallback if it's localhost but no server is active
) {
  console.log('Connecting to database using individual MySQL credentials...');
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS || '',
    {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 3306,
      dialect: 'mysql',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
    }
  );
} else {
  const dbFile = process.env.NODE_ENV === 'test' ? 'database.test.sqlite' : 'database.sqlite';
  const storagePath = process.env.VERCEL
    ? `/tmp/${dbFile}`
    : path.join(__dirname, `../../${dbFile}`);
  console.warn(`⚠️ Cloud/Local MySQL config not found or set to localhost. Falling back to persistent ${storagePath}...`);
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: storagePath,
    logging: false,
  });
}

export default sequelize;
