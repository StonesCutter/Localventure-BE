// Localventure API Server
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

// Initialize Express app and Prisma client
const app = express();
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
const PORT = 3002; // Using a completely different port to avoid conflicts

// Middleware
app.use(express.json());
app.use(cors());

// Request logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Root endpoint
app.get('/', (req, res) => {
  console.log('Root endpoint accessed');
  res.json({ 
    message: 'Welcome to Localventure API',
    endpoints: {
      users: '/api/users',
      cities: '/api/cities',
      spots: '/api/spots'
    }
  });
});

// GET all users
app.get('/api/users', async (req, res) => {
  console.log('Users endpoint accessed');
  try {
    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} users`);
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      error: 'Failed to fetch users',
      details: error.message 
    });
  }
});

// GET all cities
app.get('/api/cities', async (req, res) => {
  console.log('Cities endpoint accessed');
  try {
    const cities = await prisma.city.findMany();
    console.log(`Found ${cities.length} cities`);
    res.json(cities);
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({ 
      error: 'Failed to fetch cities',
      details: error.message 
    });
  }
});

// GET all spots
app.get('/api/spots', async (req, res) => {
  console.log('Spots endpoint accessed');
  try {
    const spots = await prisma.spot.findMany({
      include: {
        city: true // Include city information for each spot
      }
    });
    console.log(`Found ${spots.length} spots`);
    res.json(spots);
  } catch (error) {
    console.error('Error fetching spots:', error);
    res.status(500).json({ 
      error: 'Failed to fetch spots',
      details: error.message 
    });
  }
});

// 404 handler for undefined routes
app.use((req, res) => {
  console.error(`404 - ${req.method} ${req.url} - Route not found`);
  res.status(404).json({
    error: 'Not Found',
    message: `The requested route ${req.url} was not found on this server.`
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Database connection and server startup
async function startServer() {
  try {
    console.log('Attempting to connect to the database...');
    await prisma.$connect();
    console.log('Successfully connected to the database');
    
    // Start the server
    const server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log('Available endpoints:');
      console.log(`  - http://localhost:${PORT}/api/users`);
      console.log(`  - http://localhost:${PORT}/api/cities`);
      console.log(`  - http://localhost:${PORT}/api/spots`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => shutdown(server));
    process.on('SIGINT', () => shutdown(server));
    
    return server;
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

async function shutdown(server) {
  console.log('\nShutting down server...');
  try {
    await prisma.$disconnect();
    console.log('Database connection closed');
    
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
}

// Start the server - directly invoking without condition
startServer();

// Export for testing
module.exports = { app, startServer, shutdown };
