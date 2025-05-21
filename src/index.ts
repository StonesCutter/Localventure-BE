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

// Keep track of whether we're already shutting down
let isShuttingDown = false;

// Graceful shutdown
async function shutdown() {
  // Prevent multiple shutdown attempts
  if (isShuttingDown) return;
  isShuttingDown = true;
  
  console.log('Shutting down server gracefully...');
  
  try {
    // Close database connection if it exists
    if (prisma) {
      console.log('Closing database connection...');
      await prisma.$disconnect();
      console.log('✅ Database connection closed');
    }
    
    // Close the server
    const currentServer = await server;
    if (currentServer) {
      currentServer.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
      
      // Force close after 5 seconds
      setTimeout(() => {
        console.error('❌ Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 5000);
    } else {
      console.log('No active server to close');
      process.exit(0);
    }
  } catch (err) {
    console.error('❌ Error during shutdown:', err);
    process.exit(1);
  }
}

// Moving signal handlers to the bottom of the file

// Import Server type
import { Server } from 'http';

// Create and start the server
const startServer = async () => {
  try {
    // Create server
    const server = app.listen(PORT, '0.0.0.0', async () => {
      const address = server.address();
      const host = typeof address === 'string' ? address : `${address?.address}:${address?.port}`;
      console.log(`🚀 Server is running on ${host}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      
      try {
        // Test database connection
        await prisma.$connect();
        console.log('✅ Database connection established');
      } catch (err) {
        console.error('❌ Database connection failed:', err);
        // Don't exit immediately, let the server keep running
        // The next database operation will trigger a retry
      }
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.name === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
      } else {
        console.error('❌ Server error:', error);
      }
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      // Don't exit on unhandled rejections, just log them
    });

    return server;
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
const server = startServer();

// Handle different shutdown signals after server is running
process.on("SIGTERM", () => {
  console.log("Shutting down server...");
  setTimeout(() => {
    // Wait for connections to drain before closing
    server.then(s => {
      if (s) s.close(() => console.log("Server closed"));
    });
  }, 500);
});

process.on("SIGINT", () => {
  console.log("Shutting down server...");
  setTimeout(() => {
    server.then(s => {
      if (s) s.close(() => console.log("Server closed"));
    });
  }, 500);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  // Wait a bit before shutting down
  setTimeout(() => {
    server.then(s => {
      if (s) s.close(() => console.log("Server closed"));
      process.exit(1);
    });
  }, 500);
});

export { app, server };
