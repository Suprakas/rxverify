import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { connectDB } from './utils/db.js';
import authRoutes from './routes/authRoutes.js';
import prescriptionRoutes from './routes/prescriptionRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

export const app = express();
const BACKEND_PORT = process.env.BACKEND_PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// Connect to Database
await connectDB();

const allowedOrigins = [
  CLIENT_URL,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  process.env.APP_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || true) {
        return callback(null, true);
      }
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/prescriptions', prescriptionRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'RxVerify',
    timestamp: new Date().toISOString(),
  });
});

// Central Error Handler for API
app.use('/api', errorHandler);
app.use(errorHandler);

// If executed directly as standalone server
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain || process.env.STANDALONE_SERVER === 'true') {
  app.listen(BACKEND_PORT, '0.0.0.0', () => {
    console.log(`[RxVerify Backend Server] Running on http://0.0.0.0:${BACKEND_PORT}`);
  });
}

export default app;
