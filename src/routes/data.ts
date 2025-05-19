import { Router } from 'express';
import { prisma } from '../prisma';

const router = Router();

// GET all users
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET all cities
router.get('/cities', async (req, res) => {
  try {
    const cities = await prisma.city.findMany();
    res.json(cities);
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({ error: 'Failed to fetch cities' });
  }
});

// GET all spots
router.get('/spots', async (req, res) => {
  try {
    const spots = await prisma.spot.findMany({
      include: {
        city: true // Include city information for each spot
      }
    });
    res.json(spots);
  } catch (error) {
    console.error('Error fetching spots:', error);
    res.status(500).json({ error: 'Failed to fetch spots' });
  }
});

export const dataRoutes = router;
