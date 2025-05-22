import express from 'express';
import dotenv from 'dotenv';
import passport from 'passport';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { jwtStrategy } from './auth/strategy';
import { authRoutes } from './auth/routes';
import { articleRoutes } from './routes/articles';
import { dataRoutes } from './routes/data';
import { healthRoutes } from './routes/health';
import { prisma } from './prisma';

console.log(`[${new Date().toISOString()}] [index.ts] Application startup beginning...`);

// Load environment variables
console.log(`[${new Date().toISOString()}] [index.ts] Loading environment variables...`);
dotenv.config();
console.log(`[${new Date().toISOString()}] [index.ts] Environment variables loaded`);

// Validate required environment variables
console.log(`[${new Date().toISOString()}] [index.ts] Validating required environment variables...`);

// Check all important environment variables
const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL', 'PORT'];
const optionalEnvVars = ['NODE_ENV', 'CLIENT_URL', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];

// Check required vars
requiredEnvVars.forEach(varName => {
  console.log(`[${new Date().toISOString()}] [index.ts] ${varName} is set: ${Boolean(process.env[varName])}`);
  if (!process.env[varName]) {
    console.error(`[${new Date().toISOString()}] [index.ts] FATAL ERROR: ${varName} is not defined`);
    process.exit(1);
  }
});

// Log optional vars existence (not values)
optionalEnvVars.forEach(varName => {
  console.log(`[${new Date().toISOString()}] [index.ts] ${varName} is set: ${Boolean(process.env[varName])}`);
});

// For DATABASE_URL, log parts of it (host only) for debugging
if (process.env.DATABASE_URL) {
  try {
    const url = new URL(process.env.DATABASE_URL);
    console.log(`[${new Date().toISOString()}] [index.ts] Database host: ${url.hostname}, protocol: ${url.protocol}`);
  } catch (e) {
    console.error(`[${new Date().toISOString()}] [index.ts] DATABASE_URL is invalid format: ${e}`);
  }
}

console.log(`[${new Date().toISOString()}] [index.ts] Creating Express application instance...`);
const app = express();
console.log(`[${new Date().toISOString()}] [index.ts] Express application instance created`);

// Railway expects port 3000 specifically based on configuration
const PORT = Number(process.env.PORT ?? 3000);
console.log(`[${new Date().toISOString()}] [index.ts] PORT configured as: ${PORT}`);

console.log(`[${new Date().toISOString()}] [index.ts] Registering health check routes first...`);
// Register health check routes FIRST - before any other middleware
// This ensures health checks pass even if other middleware has errors
app.use(healthRoutes);
console.log(`[${new Date().toISOString()}] [index.ts] Health check routes registered`);

console.log(`[${new Date().toISOString()}] [index.ts] Setting up Helmet security middleware...`);
// Security middleware
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production',
}));
console.log(`[${new Date().toISOString()}] [index.ts] Helmet security middleware configured`);

console.log(`[${new Date().toISOString()}] [index.ts] Setting up CORS middleware...`);
// Enable CORS
app.use(cors());
console.log(`[${new Date().toISOString()}] [index.ts] CORS middleware configured`);

console.log(`[${new Date().toISOString()}] [index.ts] Setting up basic Express middleware...`);
// Basic middleware
app.use(express.json());
console.log(`[${new Date().toISOString()}] [index.ts] express.json middleware configured`);

app.use(express.urlencoded({ extended: true }));
console.log(`[${new Date().toISOString()}] [index.ts] express.urlencoded middleware configured`);

console.log(`[${new Date().toISOString()}] [index.ts] Configuring rate limiting middleware...`);
// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});
console.log(`[${new Date().toISOString()}] [index.ts] Rate limiting middleware configured`);

console.log(`[${new Date().toISOString()}] [index.ts] Initializing Passport authentication...`);
// Initialize Passport
app.use(passport.initialize());
passport.use(jwtStrategy);
console.log(`[${new Date().toISOString()}] [index.ts] Passport initialized with JWT strategy`);

console.log(`[${new Date().toISOString()}] [index.ts] Registering auth routes with rate limiting...`);
// Auth routes with rate limiting
app.use('/auth', authLimiter, authRoutes);
console.log(`[${new Date().toISOString()}] [index.ts] Auth routes registered`);

console.log(`[${new Date().toISOString()}] [index.ts] Registering article routes...`);
// Article routes
app.use('/articles', articleRoutes);
console.log(`[${new Date().toISOString()}] [index.ts] Article routes registered`);

console.log(`[${new Date().toISOString()}] [index.ts] Registering data routes (users, cities, spots)...`);
// Data routes (users, cities, spots)
app.use('/api', dataRoutes);
console.log(`[${new Date().toISOString()}] [index.ts] Data routes registered`);

console.log(`[${new Date().toISOString()}] [index.ts] Setting up global error handling middleware...`);
// Error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error(`[${new Date().toISOString()}] [index.ts] Global error handler caught error: ${err.message}`);
  console.error(`[${new Date().toISOString()}] [index.ts] Error stack: ${err.stack}`);
  res.status(500).json({ message: 'Something went wrong!' });
});
console.log(`[${new Date().toISOString()}] [index.ts] Global error handling middleware configured`);

// Custom shutdown logic removed; PM2 will handle signals and shutdowns.

// Moving signal handlers to the bottom of the file

// Import Server type
import { Server } from 'http';

console.log(`[${new Date().toISOString()}] [index.ts] Starting Railway-optimized startup flow...`);
// Railway-optimized startup flow: start server first, then try database connection
(async () => {
  console.log(`[${new Date().toISOString()}] [index.ts] Starting HTTP server on port ${PORT} and host 0.0.0.0...`);
  // Start the HTTP server immediately so health checks can succeed
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[${new Date().toISOString()}] [index.ts] 🚀 Server is running on port ${PORT}`);
    console.log(`[${new Date().toISOString()}] [index.ts] 🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`[${new Date().toISOString()}] [index.ts] ✅ Server is responding to health checks`);
  });

  console.log(`[${new Date().toISOString()}] [index.ts] Setting up server error handlers...`);
  // Handle server errors
  server.on('error', (error: Error & { code?: string }) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`[${new Date().toISOString()}] [index.ts] ❌ Port ${PORT} is already in use`);
    } else {
      console.error(`[${new Date().toISOString()}] [index.ts] ❌ Server error: ${error.message}`);
      console.error(`[${new Date().toISOString()}] [index.ts] Error stack: ${error.stack}`);
    }
    process.exit(1); // Let Railway restart
  });
  console.log(`[${new Date().toISOString()}] [index.ts] Server error handlers configured`);

  console.log(`[${new Date().toISOString()}] [index.ts] Setting up graceful shutdown handlers...`);
  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    console.log(`[${new Date().toISOString()}] [index.ts] SIGTERM received, shutting down gracefully`);
    server.close(async () => {
      console.log(`[${new Date().toISOString()}] [index.ts] HTTP server closed, disconnecting from database...`);
      try {
        await prisma.$disconnect();
        console.log(`[${new Date().toISOString()}] [index.ts] Database connections closed successfully`);
      } catch (err) {
        console.error(`[${new Date().toISOString()}] [index.ts] Error during database disconnect: ${err}`);
      }
      console.log(`[${new Date().toISOString()}] [index.ts] Exiting process with code 0`);
      process.exit(0);
    });
  });
  console.log(`[${new Date().toISOString()}] [index.ts] Graceful shutdown handlers configured`);

  console.log(`[${new Date().toISOString()}] [index.ts] Attempting database connection AFTER server startup...`);
  // Try to connect to the database AFTER server is already accepting requests
  try {
    console.log(`[${new Date().toISOString()}] [index.ts] Connecting to database using Prisma client...`);
    console.log(`[${new Date().toISOString()}] [index.ts] Database URL format validity was checked earlier`);
    await prisma.$connect();
    console.log(`[${new Date().toISOString()}] [index.ts] ✅ Database connection established successfully`);
    
    // Perform a test query to verify connection works fully
    console.log(`[${new Date().toISOString()}] [index.ts] Executing test query to verify connection...`);
    const result = await prisma.$queryRaw`SELECT NOW()`;
    console.log(`[${new Date().toISOString()}] [index.ts] Test query successful: ${JSON.stringify(result)}`);
  } catch (error: any) {
    // Log the database error but keep the server running
    console.error(`[${new Date().toISOString()}] [index.ts] ❌ Database connection failed: ${error}`);
    console.error(`[${new Date().toISOString()}] [index.ts] Error object details:`);
    
    if (error instanceof Error) {
      console.error(`[${new Date().toISOString()}] [index.ts] - Message: ${error.message}`);
      console.error(`[${new Date().toISOString()}] [index.ts] - Stack: ${error.stack}`);
    }
    
    if (typeof error === 'object' && error !== null && 'code' in error) {
      console.error(`[${new Date().toISOString()}] [index.ts] - Error code: ${error.code}`);
    }
    
    if (typeof error === 'object' && error !== null && 'meta' in error) {
      console.error(`[${new Date().toISOString()}] [index.ts] - Error meta: ${JSON.stringify(error.meta)}`);
    }
    
    console.log(`[${new Date().toISOString()}] [index.ts] Server will continue running, but database-dependent routes will fail`);
    // We deliberately don't exit here - let Railway health checks pass
  }
})();

console.log(`[${new Date().toISOString()}] [index.ts] Setting up global unhandled rejection handler...`);
// Handle unhandled promise rejections globally
process.on('unhandledRejection', (reason, promise) => {
  console.error(`[${new Date().toISOString()}] [index.ts] 🚨 Unhandled Rejection at:`, promise);
  console.error(`[${new Date().toISOString()}] [index.ts] Reason:`, reason);
  
  // If reason is an error, log its stack trace
  if (reason instanceof Error) {
    console.error(`[${new Date().toISOString()}] [index.ts] Error stack:`, reason.stack);
  }
  
  // Log only, don't exit
});
console.log(`[${new Date().toISOString()}] [index.ts] Global unhandled rejection handler configured`);

// We don't need custom signal handlers; Railway handles container lifecycle.

export { app }; // Export app only; server instance is managed internally

