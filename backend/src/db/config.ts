import { Sequelize, Dialect } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const dbUri = process.env.DATABASE_URL || process.env.POSTGRES_URL;
let sequelize: Sequelize;

if (dbUri) {
  const isSqlite = dbUri.startsWith('sqlite:');
  const isPostgres = dbUri.startsWith('postgres:') || dbUri.startsWith('postgresql:');
  const dialect: Dialect = isSqlite ? 'sqlite' : (isPostgres ? 'postgres' : 'mysql');
  
  sequelize = new Sequelize(dbUri, {
    dialect: dialect,
    logging: false,
    dialectOptions: isSqlite ? {} : {
      // Support secure connection if using services like Neon/Supabase/RDS/etc.
      ssl: (isPostgres || process.env.DB_SSL === 'true') ? { rejectUnauthorized: false } : false
    }
  });
} else {
  if (process.env.VERCEL) {
    // On Vercel, if connection string is missing, use a dummy Postgres instance to avoid loading sqlite3 (which crashes)
    sequelize = new Sequelize('postgres://localhost/dummy', {
      dialect: 'postgres',
      logging: false,
    });
  } else {
    // Use local SQLite database file
    const storagePath = path.resolve(__dirname, '../../database.sqlite');
    sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: storagePath,
      logging: false,
    });
  }
}

export default sequelize;
