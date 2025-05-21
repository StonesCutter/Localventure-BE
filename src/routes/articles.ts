import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { body, validationResult, ValidationChain } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import passport from 'passport';

const router = Router();
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});

// Validation middleware for creating/updating articles
const validateArticle = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 120 })
    .withMessage('Title must be between 5 and 120 characters'),
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Content cannot be empty'),
  body('cityId')
    .isInt()
    .withMessage('City ID must be a valid integer'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    next();
  }
];

// Create article (protected route with validation)
router.post(
  '/',
  passport.authenticate('jwt', { session: false }),
  validateArticle,
  async (req: Request & { user?: Express.User }, res: Response) => {
    try {
      const { title, content, cityId } = req.body;
      const article = await prisma.spot.create({
        data: {
          name: title,
          summary: content,
          city_id: cityId,
          category_id: 1, // Default category, adjust as needed
          slug: title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
          status: 'published',
          city: {
            connect: { city_id: cityId }
          }
        },
        include: {
          city: true
        },
      });
      res.status(201).json(article);
    } catch (error) {
      console.error('Error creating article:', error);
      res.status(500).json({ message: 'Error creating article' });
    }
  }
);

// Get all articles with optional city filter
router.get(
  '/',
  async (req: Request, res: Response) => {
    try {
      const { cityId } = req.query;
      const articles = await prisma.spot.findMany({
        where: {
          ...(cityId ? { city_id: Number(cityId) } : {}),
          status: 'published'
        },
        include: {
          city: true
        },
        orderBy: { spot_id: 'desc' },
      });
      res.json(articles);
    } catch (error) {
      console.error('Error fetching articles:', error);
      res.status(500).json({ message: 'Error fetching articles' });
    }
  }
);

export { router as articleRoutes };
