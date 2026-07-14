import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const dbUri = process.env.DATABASE_URL;
let sequelize: Sequelize;

if (dbUri) {
  const isSqlite = dbUri.startsWith('sqlite:');
  sequelize = new Sequelize(dbUri, {
    dialect: isSqlite ? 'sqlite' : 'mysql',
    logging: false,
    dialectOptions: isSqlite ? {} : {
      // Support secure connection if using services like RDS/Tidb/etc.
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    }
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

export default sequelize;
