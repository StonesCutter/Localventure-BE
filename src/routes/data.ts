import { Router } from 'express';
import { prisma } from '../prisma';

console.log(`[${new Date().toISOString()}] [data.ts] Initializing data routes module...`);

const router = Router();

// GET all users
router.get('/users', async (req, res) => {
  console.log(`[${new Date().toISOString()}] [data.ts] ${req.method} ${req.originalUrl} - Fetching all users`);
  try {
    console.log(`[${new Date().toISOString()}] [data.ts] ${req.method} ${req.originalUrl} - Executing prisma.user.findMany()`);
    const users = await prisma.user.findMany();
    console.log(`[${new Date().toISOString()}] [data.ts] ${req.method} ${req.originalUrl} - Successfully fetched ${users.length} users`);
    
    console.log(`[${new Date().toISOString()}] [data.ts] ${req.method} ${req.originalUrl} - Sending 200 response with users data`);
    res.json(users);
  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] [data.ts] ${req.method} ${req.originalUrl} - ERROR fetching users: ${error}`);
    
    if (error instanceof Error) {
      console.error(`[${new Date().toISOString()}] [data.ts] ${req.method} ${req.originalUrl} - Error message: ${error.message}`);
      console.error(`[${new Date().toISOString()}] [data.ts] ${req.method} ${req.originalUrl} - Error stack: ${error.stack}`);
    }
    
    if (typeof error === 'object' && error !== null && 'code' in error) {
      console.error(`[${new Date().toISOString()}] [data.ts] ${req.method} ${req.originalUrl} - Error code: ${error.code}`);
    }
    
    console.log(`[${new Date().toISOString()}] [data.ts] ${req.method} ${req.originalUrl} - Sending 500 error response`);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET all cities
router.get('/cities', async (req, res) => {
  console.log(`[${new Date().toISOString()}] [data.ts] ${req.method} ${req.originalUrl} - Fetching all cities`);
  try {
    console.log(`[${new Date().toISOString()}] [data.ts] ${req.method} ${req.originalUrl} - Executing prisma.city.findMany()`);
    const cities = await prisma.city.findMany();
    console.log(`[${new Date().toISOString()}] [data.ts] ${req.method} ${req.originalUrl} - Successfully fetched ${cities.length} cities`);
    
    console.log(`[${new Date().toISOString()}] [data.ts] ${req.method} ${req.originalUrl} - Sending 200 response with cities data`);
    res.json(cities);
  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] [data.ts] ${req.method} ${req.originalUrl} - ERROR fetching cities: ${error}`);
    
    if (error instanceof Error) {
      console.error(`[${new Date().toISOString()}] [data.ts] ${req.method} ${req.originalUrl} - Error message: ${error.message}`);
      console.error(`[${new Date().toISOString()}] [data.ts] ${req.method} ${req.originalUrl} - Error stack: ${error.stack}`);
    }
    
    if (typeof error === 'object' && error !== null && 'code' in error) {
      console.error(`[${new Date().toISOString()}] [data.ts] ${req.method} ${req.originalUrl} - Error code: ${error.code}`);
    }
    
    console.log(`[${new Date().toISOString()}] [data.ts] ${req.method} ${req.originalUrl} - Sending 500 error response`);
    res.status(500).json({ error: 'Failed to fetch cities' });
  }
});

// GET all spots
router.get('/spots', async (req, res) => {
  console.log(`[${new Date().toISOString()}] [data.ts] ${req.method} ${req.originalUrl} - Fetching all spots with city info`);
  try {
    console.log(`[${new Date().toISOString()}] [data.ts] ${req.method} ${req.originalUrl} - Executing prisma.spot.findMany() with city include`);
    const spots = await prisma.spot.findMany({
      include: {
        city: true // Include city information for each spot
      }
    });
    console.log(`[${new Date().toISOString()}] [data.ts] ${req.method} ${req.originalUrl} - Successfully fetched ${spots.length} spots`);
    
    console.log(`[${new Date().toISOString()}] [data.ts] ${req.method} ${req.originalUrl} - Sending 200 response with spots data`);
    res.json(spots);
  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] [data.ts] ${req.method} ${req.originalUrl} - ERROR fetching spots: ${error}`);
    
    if (error instanceof Error) {
      console.error(`[${new Date().toISOString()}] [data.ts] ${req.method} ${req.originalUrl} - Error message: ${error.message}`);
      console.error(`[${new Date().toISOString()}] [data.ts] ${req.method} ${req.originalUrl} - Error stack: ${error.stack}`);
    }
    
    if (typeof error === 'object' && error !== null && 'code' in error) {
      console.error(`[${new Date().toISOString()}] [data.ts] ${req.method} ${req.originalUrl} - Error code: ${error.code}`);
    }
    
    console.log(`[${new Date().toISOString()}] [data.ts] ${req.method} ${req.originalUrl} - Sending 500 error response`);
    res.status(500).json({ error: 'Failed to fetch spots' });
  }
});

console.log(`[${new Date().toISOString()}] [data.ts] Data routes configuration complete`);

export const dataRoutes = router;
