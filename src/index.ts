import express from 'express';
import dotenv from 'dotenv';
import passport from 'passport';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { logger } from './utils/logger';
import { initCloudinary } from './utils/cloudinary';
import { jwtStrategy } from './auth/strategy';
import { authRoutes } from './auth/routes';
import { articleRoutes } from './routes/articles';
import { dataRoutes } from './routes/data';
import { healthRoutes } from './routes/health';
import { pool } from './db';
import { initDb } from './db/init';

logger.info('[index] Starting application');

// Load environment variables
logger.info('[index] Loading environment variables');
dotenv.config();
logger.info('[index] Environment variables loaded');

// Log important environment variables
logger.info(`[index] NODE_ENV=${process.env.NODE_ENV}`);
logger.info(`[index] PORT present=${Boolean(process.env.PORT)}`);
logger.info(`[index] DATABASE_URL present=${Boolean(process.env.DATABASE_URL)}`);
logger.info(`[index] Cloudinary vars present=${
  ['CLOUDINARY_CLOUD_NAME','CLOUDINARY_API_KEY','CLOUDINARY_API_SECRET']
    .map(k=>Boolean(process.env[k])).join(',')
}`);

// Validate required environment variables
logger.info('[index] Validating required environment variables');

// Check all important environment variables
const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL'];

// Check required vars
requiredEnvVars.forEach(varName => {
  logger.info(`[index] ${varName} is set: ${Boolean(process.env[varName])}`);
  if (!process.env[varName]) {
    logger.error(`[index] FATAL ERROR: ${varName} is not defined`);
    process.exit(1);
  }
});

// For DATABASE_URL, log parts of it (host only) for debugging
if (process.env.DATABASE_URL) {
  try {
    const url = new URL(process.env.DATABASE_URL);
    logger.info(`[index] Database host: ${url.hostname}, protocol: ${url.protocol}`);
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    logger.error(`[index] DATABASE_URL is invalid format: ${errorMessage}`);
  }
}

logger.info('[index] Creating Express application instance');
const app = express();
logger.info('[index] Express application instance created');

// Set port using environment variable or default to 3000
const PORT = Number(process.env.PORT) || 3000;
console.log(`[index] PORT chosen → ${PORT} (env=${process.env.PORT || 'undefined'})`);
logger.info(`[index] PORT configured as: ${PORT}`);

// Add direct health check endpoint
app.get('/healthz', (_req, res) => {
  logger.info('[index] Health check request received');
  res.status(200).send('ok');
  logger.info('[index] Health check response sent');
});

logger.info('[index] Registering health check routes');
// Register health check routes before other middleware
// This ensures health checks pass even if other middleware has errors
app.use(healthRoutes);
logger.info('[index] Health check routes registered');

logger.info('[index] Setting up Helmet security middleware');
// Security middleware
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production',
}));
logger.info('[index] Helmet security middleware configured');

logger.info('[index] Setting up CORS middleware');
// Enable CORS
app.use(cors());
logger.info('[index] CORS middleware configured');

logger.info('[index] Setting up basic Express middleware');
// Basic middleware
app.use(express.json());
logger.info('[index] express.json middleware configured');

app.use(express.urlencoded({ extended: true }));
logger.info('[index] express.urlencoded middleware configured');

logger.info('[index] Configuring rate limiting middleware');
// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});
logger.info('[index] Rate limiting middleware configured');

logger.info('[index] Initializing Passport authentication');
// Initialize Passport
app.use(passport.initialize());
passport.use(jwtStrategy);
logger.info('[index] Passport initialized with JWT strategy');

logger.info('[index] Registering auth routes with rate limiting');
// Auth routes with rate limiting
app.use('/auth', authLimiter, authRoutes);
logger.info('[index] Auth routes registered');

logger.info('[index] Deferring registration of routes that depend on DB tables until after initialization');
let routesRegistered = false;

const registerAllRoutes = () => {
  if (routesRegistered) return;
  
  // Article routes
  app.use('/articles', articleRoutes);
  logger.info('[index] Article routes registered');
  
  logger.info('[index] Registering data routes');
  // Data routes
  app.use('/api', dataRoutes);
  
  routesRegistered = true;
};

logger.info('[index] Setting up global error handling middleware');
// Error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  logger.error({ err }, '[error] Uncaught handler error');
  res.status(500).json({ message: 'Something went wrong!' });
});
logger.info('[index] Global error handling middleware configured');

// Custom shutdown logic removed; PM2 will handle signals and shutdowns.

// Moving signal handlers to the bottom of the file

// Import Server type
import { Server } from 'http';

logger.info('[index] Starting Railway-optimized startup flow');
// Railway-optimized startup flow: start server first, then try database connection
(async () => {
  logger.info(`[index] Starting HTTP server on port ${PORT}`);
  // Start the HTTP server immediately so health checks can succeed
  const server = app.listen(PORT, '0.0.0.0', () => {
    logger.info(`[index] Listening on ${PORT} (bound to all interfaces 0.0.0.0)`);
    logger.info(`[index] Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info('[index] Server is responding to health checks');
  });

  logger.info('[index] Setting up server error handlers');
  // Handle server errors
  server.on('error', (error: Error & { code?: string }) => {
    if (error.code === 'EADDRINUSE') {
      logger.error(`[index] Port ${PORT} is already in use`);
    } else {
      logger.error({ err: error }, '[index] Server error');
    }
    process.exit(1); // Let Railway restart
  });
  logger.info('[index] Server error handlers configured');

  logger.info('[index] Setting up graceful shutdown handlers');
  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('[index] SIGTERM received, shutting down gracefully');
    server.close(async () => {
      logger.info('[index] HTTP server closed, disconnecting from database');
      try {
        // Interval will be cleared by the handler added during DB connection
        await pool.end();
        logger.info('[index] Database connections closed successfully');
      } catch (err) {
        logger.error({ err }, '[index] Error during database disconnect');
      }
      logger.info('[index] Exiting process with code 0');
      process.exit(0);
    });
  });
  logger.info('[index] Graceful shutdown handlers configured');

  logger.info('[index] Attempting database connection AFTER server startup');
  // Try to connect to the database AFTER server is already accepting requests
  try {
    logger.info('[db] Testing pg connection');
    const res = await pool.query('SELECT 1');
    logger.info('[db] Connection established');
    logger.info('[db] Test query successful:', res.rows);
    
    // Initialize database tables
    logger.info('[db] Running table initialization');
    try {
      await initDb();
      logger.info('[db] Tables created or verified successfully');
      
      // Register routes that depend on database tables
      registerAllRoutes();
      logger.info('[index] All routes registered after database initialization');
    } catch (err) {
      logger.error({ err }, '[db] Table initialization failed');
      process.exit(1);
    }
    
    /*************  KEEP-ALIVE (Neon free tier)  *************/
    const KEEPALIVE_MS = 4 * 60_000;          // 4 minutes
    const keepAliveInterval = setInterval(async () => {
      try {
        await pool.query('SELECT 1');
        console.log('[keep-alive] SELECT 1 OK');
      } catch (err) {
        console.error('[keep-alive] failed', err);
      }
    }, KEEPALIVE_MS);
    
    // Make sure to clear the interval on SIGTERM
    process.on('SIGTERM', () => {
      logger.info('[keep-alive] Clearing interval on SIGTERM');
      clearInterval(keepAliveInterval);
    });
    
    // Initialize Cloudinary if environment variables are available
    if (process.env.CLOUDINARY_CLOUD_NAME && 
        process.env.CLOUDINARY_API_KEY && 
        process.env.CLOUDINARY_API_SECRET) {
      try {
        initCloudinary();
      } catch (err) {
        logger.error({ err }, '[index] Cloudinary initialization failed, but continuing');
        // Continue running even if Cloudinary fails
      }
    } else {
      logger.warn('[index] Cloudinary environment variables missing, skipping initialization');
    }
  } catch (err) {
    // Log the database error and exit (as requested in the requirements)
    logger.error({ err }, '[db] Connection FAILED');
    process.exit(1);
  }
})();

logger.info('[index] Setting up global unhandled rejection handler');
// Handle unhandled promise rejections globally
process.on('unhandledRejection', (reason, promise) => {
  if (reason instanceof Error) {
    logger.error({ err: reason }, '[error] Unhandled Rejection');
  } else {
    logger.error({ reason, promise }, '[error] Unhandled Rejection');
  }
  // Log only, don't exit
});
logger.info('[index] Global unhandled rejection handler configured');

// We don't need custom signal handlers; Railway handles container lifecycle.

export { app }; // Export app only; server instance is managed internally

