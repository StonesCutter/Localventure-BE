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
const PORT = Number(process.env.PORT ?? 8080);

// Security middleware
app.use(helmet());
app.use(cors());

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// This route will be removed since we already have a root route handler below

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});

// Initialize Passport
app.use(passport.initialize());
passport.use(jwtStrategy);

// --- Health checks -------------------------------------------------
app.get('/healthz', (_req: express.Request, res: express.Response) => {
  res.status(200).send('OK');
});
app.get('/', (_req: express.Request, res: express.Response) => {
  res.status(200).send('OK');
}); // optional root check
// ------------------------------------------------------------------

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

// Create and start the server
const startServer = async (): Promise<Server> => {
  return new Promise<Server>((resolve, reject) => {
    const httpServer = app.listen(PORT, '0.0.0.0', async () => {
      const address = httpServer.address();
      const host = typeof address === 'string' ? address : `${address?.address}:${address?.port}`;
      console.log(`🚀 Server is running on ${host}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);

      try {
        await prisma.$connect();
        console.log('✅ Database connection established');

        // Note: We're now using plain Node.js, no need for PM2 process.send signaling
        console.log('✅ Server ready and accepting connections');
        resolve(httpServer);
      } catch (dbError) {
        console.error('❌ Database connection failed during startup:', dbError);
        httpServer.close(() => {
          console.log('Server instance closed due to database connection failure during startup.');
        });
        reject(dbError); // Reject the main promise, signaling a startup failure
      }
    });

    httpServer.on('error', (error: Error & { code?: string }) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
      } else {
        console.error('❌ Server error:', error);
      }
      reject(error); // Reject the main promise, signaling a startup failure
    });
  });
};

// Initialize and start the application
(async () => {
  try {
    await startServer();
    console.log('✅ Application startup sequence completed successfully.');
  } catch (error) {
    console.error('💥 Application failed to start:', error);
    process.exit(1); // Exit with error code, Railway will handle container restart
  }
})();

// Handle unhandled promise rejections globally
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
  // Consider exiting on unhandled rejections for production robustness, letting Railway restart the container
  // For now, aligns with previous behavior of just logging.
  // if (process.env.NODE_ENV === 'production') { process.exit(1); }
});

// We don't need custom signal handlers; Railway handles container lifecycle.

export { app }; // Export app only; server instance is managed internally

