import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { prisma } from './db/prisma';

// Import route modules
import authRoutes from './routes/auth';
import sportsRoutes from './routes/sports';
import protocolsRoutes from './routes/protocols';
import assessmentsRoutes from './routes/assessments';
import adminRoutes from './routes/admin';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const STORAGE_DIR = process.env.STORAGE_DIR || path.resolve(__dirname, '../../../storage');

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// Serve static storage for video playback & evidence inspection
fs.mkdirSync(STORAGE_DIR, { recursive: true });
app.use('/storage', express.static(STORAGE_DIR));

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  try {
    // Test PostgreSQL database connectivity
    await prisma.$queryRaw`SELECT 1`;

    // Test AI Service reachability
    let aiServiceStatus = 'DISCONNECTED';
    try {
      const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
      const aiResp = await fetch(`${aiUrl}/health`, { signal: AbortSignal.timeout(2000) });
      if (aiResp.ok) {
        aiServiceStatus = 'CONNECTED';
      }
    } catch (e) {
      aiServiceStatus = 'UNAVAILABLE';
    }

    return res.json({
      status: 'UP',
      service: 'khelkhoj-backend-api',
      timestamp: new Date().toISOString(),
      database: {
        status: 'CONNECTED',
        provider: 'postgresql'
      },
      aiService: {
        status: aiServiceStatus,
        url: process.env.AI_SERVICE_URL || 'http://localhost:8000'
      }
    });
  } catch (error: any) {
    return res.status(503).json({
      status: 'DOWN',
      error: error.message
    });
  }
});

// API v1 routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/sports', sportsRoutes);
app.use('/api/v1/protocols', protocolsRoutes);
app.use('/api/v1/assessments', assessmentsRoutes);
app.use('/api/v1/admin', adminRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.url}` });
});

// Centralized error handling
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Unhandled Server Error]', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`[KhelKhoj Backend] Server running on http://localhost:${PORT}`);
  console.log(`[KhelKhoj Backend] Storage directory mounted at ${STORAGE_DIR}`);
});
