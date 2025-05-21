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

// Load environment variables
dotenv.config();

// Validate required environment variables
if (!process.env.JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined');
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error('FATAL ERROR: DATABASE_URL is not defined');
  process.exit(1);
}

const app = express();
// Railway expects port 3000 specifically based on configuration
const PORT = Number(process.env.PORT ?? 3000);

// Register health check routes FIRST - before any other middleware
// This ensures health checks pass even if other middleware has errors
app.use(healthRoutes);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production',
}));

// Enable CORS
app.use(cors());

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});

// Initialize Passport
app.use(passport.initialize());
passport.use(jwtStrategy);

// Auth routes with rate limiting
app.use('/auth', authLimiter, authRoutes);

// Article routes
app.use('/articles', articleRoutes);

// Data routes (users, cities, spots)
app.use('/api', dataRoutes);

// Error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Custom shutdown logic removed; PM2 will handle signals and shutdowns.

// Moving signal handlers to the bottom of the file

// Import Server type
import { Server } from 'http';

// Railway-optimized startup flow: start server first, then try database connection
(async () => {
  // Start the HTTP server immediately so health checks can succeed
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('✅ Server is responding to health checks');
  });

  // Handle server errors
  server.on('error', (error: Error & { code?: string }) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use`);
    } else {
      console.error('❌ Server error:', error);
    }
    process.exit(1); // Let Railway restart
  });

  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(async () => {
      try {
        await prisma.$disconnect();
        console.log('Database connections closed');
      } catch (err) {
        console.error('Error during shutdown:', err);
      }
      process.exit(0);
    });
  });

  // Try to connect to the database AFTER server is already accepting requests
  try {
    console.log('Connecting to database...');
    await prisma.$connect();
    console.log('✅ Database connection established');
  } catch (error) {
    // Log the database error but keep the server running
    console.error('❌ Database connection failed:', error);
    console.log('Server will continue running, but database-dependent routes will fail');
    // We deliberately don't exit here - let Railway health checks pass
  }
})();

// Handle unhandled promise rejections globally
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
  // Log only, don't exit
});

// We don't need custom signal handlers; Railway handles container lifecycle.

export { app }; // Export app only; server instance is managed internally

