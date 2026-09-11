import express from 'express';
import cors from 'cors';
import { config, validateEnv } from './config/env.js';
import analyzeRoutes from './routes/analyze.routes.js';
import feedRoutes from './routes/feed.routes.js';
import healthRoutes from './routes/health.routes.js';
import { notFoundHandler, errorHandler } from './middleware/error.middleware.js';

// Validate environment on boot
validateEnv();

const app = express();

// CORS configuration (allow frontend dev and production origins)
const allowedOrigins = config.frontendUrl.split(',').map((o) => o.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman) or matching whitelist
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin) || config.nodeEnv === 'development') {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in hackathon mode to avoid frontend blockage
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Root welcome route
app.get('/', (req, res) => {
  res.json({
    project: 'ScamShield - AI Scam/Fraud Message Detector',
    hackathon: 'BUILD WITH भारत 2.0',
    team: 'ScamStop',
    documentation: 'See /api/health for system status and /Readme.md for API contract',
    endpoints: {
      health: 'GET /api/health',
      analyze: 'POST /api/analyze',
      feed: 'GET /api/feed',
      stats: 'GET /api/feed/stats',
      report: 'POST /api/feed/report',
    },
  });
});

// Mount API routes
app.use('/api/analyze', analyzeRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/health', healthRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const server = app.listen(config.port, () => {
  console.log(`🚀 ScamShield API server running on http://localhost:${config.port}`);
  console.log(`🔗 Health Check: http://localhost:${config.port}/api/health`);
  console.log(`🛡️  Ready to analyze Indian fraud patterns!`);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

export default app;
