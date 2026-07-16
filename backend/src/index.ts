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

// Lazy database connection & syncing for serverless environment
let isDbSynced = false;
const ensureDbConnected = async () => {
  if (!isDbSynced) {
    await sequelize.authenticate();
    await sequelize.sync();
    isDbSynced = true;
    console.log('✅ Database connected and synced.');
  }
};

app.use(async (req, res, next) => {
  try {
    await ensureDbConnected();
    next();
  } catch (error) {
    console.error('❌ Database connection/sync failed:', error);
    res.status(500).json({ error: 'Database connection/sync failed' });
  }
});

// API routes
app.use('/api', apiRouter);

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

// Run server only if not in Vercel serverless environment
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Express API server running on http://localhost:${PORT}`);
  });
}

export default app;
