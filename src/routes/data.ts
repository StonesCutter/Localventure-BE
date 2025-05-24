import { Router } from 'express';
import { query } from '../db';

console.log(`[${new Date().toISOString()}] [data.ts] Initializing data routes module...`);

const router = Router();

// GET all users
router.get('/users', async (req, res) => {
  console.log(`[${new Date().toISOString()}] [data.ts] ${req.method} ${req.originalUrl} - Fetching all users`);
  try {
    console.log(`[${new Date().toISOString()}] [data.ts] ${req.method} ${req.originalUrl} - Executing SQL query for users`);
    const users = await query('SELECT * FROM user');
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
    console.log(`[${new Date().toISOString()}] [data.ts] ${req.method} ${req.originalUrl} - Executing SQL query for cities`);
    const cities = await query('SELECT * FROM city');
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
    console.log(`[${new Date().toISOString()}] [data.ts] ${req.method} ${req.originalUrl} - Executing SQL query for spots with city join`);
    const spots = await query(`
      SELECT 
        s.id, s.name, s.description, s.latitude, s.longitude, s.city_id, s.created_at, s.updated_at,
        c.id as c_id, c.name as c_name, c.country as c_country, c.latitude as c_latitude, c.longitude as c_longitude, c.created_at as c_created_at, c.updated_at as c_updated_at
      FROM spot s
      LEFT JOIN city c ON s.city_id = c.id
    `);
    
    // Transform the result to include city information in a nested object
    const formattedSpots = spots.map(spot => {
      // Extract city properties (all fields that start with 'c_')
      const cityProps: Record<string, any> = {};
      const spotProps: Record<string, any> = {};
      
      // Separate city and spot properties
      Object.entries(spot).forEach(([key, value]) => {
        if (key === 'name' && 'c_name' in spot) {
          // This is the spot name
          spotProps[key] = value;
        } else if (key === 'id' && 'c_id' in spot) {
          // This is the spot id
          spotProps[key] = value;
        } else if (key.startsWith('c_')) {
          // This is a city property with 'c_' prefix
          cityProps[key.substring(2)] = value; // Remove 'c_' prefix
        } else {
          // This is a spot property
          spotProps[key] = value;
        }
      });
      
      return {
        ...spotProps,
        city: cityProps
      };
    });
    console.log(`[${new Date().toISOString()}] [data.ts] ${req.method} ${req.originalUrl} - Successfully fetched ${spots.length} spots`);
    
    console.log(`[${new Date().toISOString()}] [data.ts] ${req.method} ${req.originalUrl} - Sending 200 response with formatted spots data`);
    res.json(formattedSpots);
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
