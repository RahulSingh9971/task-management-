import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import sequelize from './db/config';
import apiRouter from './routes/api';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({
  origin: '*', // Allow all origins for development ease
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve file uploads statically
const uploadsPath = path.resolve(__dirname, '../../uploads');
app.use('/uploads', express.static(uploadsPath));

// API routes
app.use('/api', apiRouter);

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

// Database Sync & Server Launch
const startServer = async () => {
  try {
    // Synchronize DB models (creates tables if they do not exist)
    await sequelize.authenticate();
    console.log('✅ Connection to the database has been established successfully.');
    
    await sequelize.sync();
    console.log('✅ All database models synchronized.');

    app.listen(PORT, () => {
      console.log(`🚀 Express API server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Unable to connect/start backend server:', error);
    process.exit(1);
  }
};

startServer();
