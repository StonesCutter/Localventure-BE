import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { body, validationResult, ValidationChain } from 'express-validator';
import { query } from '../db';
import passport from 'passport';
import { safeQuery } from '../utils/safeQuery';

console.log(`[${new Date().toISOString()}] [articles.ts] Initializing articles routes module...`);

console.log(`[${new Date().toISOString()}] [articles.ts] Creating Express router instance...`);
const router = Router();
console.log(`[${new Date().toISOString()}] [articles.ts] Express router instance created`);

console.log(`[${new Date().toISOString()}] [articles.ts] DB query helper initialized for articles routes...`);

console.log(`[${new Date().toISOString()}] [articles.ts] Setting up validation middleware for articles...`);
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
    .withMessage('city ID must be a valid integer'),
  (req: Request, res: Response, next: NextFunction) => {
    console.log(`[${new Date().toISOString()}] [articles.ts] ${req.method} ${req.originalUrl} - Validating article request body`);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(`[${new Date().toISOString()}] [articles.ts] ${req.method} ${req.originalUrl} - Validation failed: ${JSON.stringify(errors.array())}`);
      res.status(400).json({ errors: errors.array() });
      return;
    }
    console.log(`[${new Date().toISOString()}] [articles.ts] ${req.method} ${req.originalUrl} - Validation passed successfully`);
    next();
  }
];
console.log(`[${new Date().toISOString()}] [articles.ts] Article validation middleware configured`);

console.log(`[${new Date().toISOString()}] [articles.ts] Configuring POST / endpoint with JWT authentication and validation...`);
// Create article (protected route with validation)
router.post(
  '/',
  passport.authenticate('jwt', { session: false }),
  validateArticle,
  async (req: Request & { user?: Express.User }, res: Response) => {
    console.log(`[${new Date().toISOString()}] [articles.ts] ${req.method} ${req.originalUrl} - Create article request received, passed JWT auth and validation`);
    console.log(`[${new Date().toISOString()}] [articles.ts] ${req.method} ${req.originalUrl} - User ID: ${req.user?.user_id}`);
    
    try {
      console.log(`[${new Date().toISOString()}] [articles.ts] ${req.method} ${req.originalUrl} - Extracting article data from request body`);
      const { title, content, cityId } = req.body;
      console.log(`[${new Date().toISOString()}] [articles.ts] ${req.method} ${req.originalUrl} - Creating article with title: "${title}", cityId: ${cityId}`);
      
      const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
      console.log(`[${new Date().toISOString()}] [articles.ts] ${req.method} ${req.originalUrl} - Generated slug: ${slug}`);
      
      console.log(`[${new Date().toISOString()}] [articles.ts] ${req.method} ${req.originalUrl} - Executing SQL insert query`);
      const articles = await query<any>(`
        INSERT INTO spot (name, summary, city_id, category_id, slug, status)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [title, content, cityId, 1, slug, 'published']);
      
      const article = articles[0];
      
      // Get city information to match the previous include behavior
      const cities = await query<any>(`
        SELECT * FROM city WHERE city_id = $1
      `, [cityId]);
      
      // Attach city to article like Prisma would do with include
      if (cities.length > 0) {
        article.city = cities[0];
      }
      console.log(`[${new Date().toISOString()}] [articles.ts] ${req.method} ${req.originalUrl} - Article created successfully with ID: ${article.spot_id}`);
      
      console.log(`[${new Date().toISOString()}] [articles.ts] ${req.method} ${req.originalUrl} - Sending 201 Created response with article data`);
      res.status(201).json(article);
      console.log(`[${new Date().toISOString()}] [articles.ts] ${req.method} ${req.originalUrl} - Create article request completed`);
    } catch (error: any) {
      console.error(`[${new Date().toISOString()}] [articles.ts] ${req.method} ${req.originalUrl} - ERROR creating article: ${error}`);
      
      if (error instanceof Error) {
        console.error(`[${new Date().toISOString()}] [articles.ts] ${req.method} ${req.originalUrl} - Error message: ${error.message}`);
        console.error(`[${new Date().toISOString()}] [articles.ts] ${req.method} ${req.originalUrl} - Error stack: ${error.stack}`);
      }
      
      if (typeof error === 'object' && error !== null && 'code' in error) {
        console.error(`[${new Date().toISOString()}] [articles.ts] ${req.method} ${req.originalUrl} - Error code: ${error.code}`);
      }
      
      if (typeof error === 'object' && error !== null && 'meta' in error) {
        console.error(`[${new Date().toISOString()}] [articles.ts] ${req.method} ${req.originalUrl} - Error meta: ${JSON.stringify(error.meta)}`);
      }
      
      console.log(`[${new Date().toISOString()}] [articles.ts] ${req.method} ${req.originalUrl} - Sending 500 error response`);
      res.status(500).json({ message: 'Error creating article' });
    }
  }
);
console.log(`[${new Date().toISOString()}] [articles.ts] POST / endpoint configured`);

console.log(`[${new Date().toISOString()}] [articles.ts] Configuring GET / endpoint...`);
// Get all articles with optional city filter
router.get(
  '/',
  async (req: Request, res: Response) => {
    console.log(`[${new Date().toISOString()}] [articles.ts] ${req.method} ${req.originalUrl} - Get articles request received`);
    try {
      console.log(`[${new Date().toISOString()}] [articles.ts] ${req.method} ${req.originalUrl} - Extracting query parameters`);
      const { cityId } = req.query;
      
      const filterCondition = cityId ? `with cityId: ${cityId}` : 'without city filter';
      console.log(`[${new Date().toISOString()}] [articles.ts] ${req.method} ${req.originalUrl} - Fetching articles ${filterCondition}`);
      
      console.log(`[${new Date().toISOString()}] [articles.ts] ${req.method} ${req.originalUrl} - Executing query with retry logic`);
      
      // Use safeQuery with retry logic for listing articles (critical user-facing operation)
      let articles: any[] = [];
      if (cityId) {
        const query = `
          SELECT s.*, c.* 
          FROM "Spot" s
          LEFT JOIN "city" c ON s.city_id = c.city_id
          WHERE s.city_id = $1 AND s.status = 'published'
          ORDER BY s.spot_id DESC
        `;
        articles = await safeQuery<any[]>(query, [Number(cityId)]) || [];
      } else {
        const query = `
          SELECT s.*, c.* 
          FROM "Spot" s
          LEFT JOIN "city" c ON s.city_id = c.city_id
          WHERE s.status = 'published'
          ORDER BY s.spot_id DESC
        `;
        articles = await safeQuery<any[]>(query) || [];
      }
      console.log(`[${new Date().toISOString()}] [articles.ts] ${req.method} ${req.originalUrl} - Successfully fetched ${articles.length} articles`);
      
      console.log(`[${new Date().toISOString()}] [articles.ts] ${req.method} ${req.originalUrl} - Sending 200 OK response with articles data`);
      res.json(articles);
      console.log(`[${new Date().toISOString()}] [articles.ts] ${req.method} ${req.originalUrl} - Get articles request completed`);
    } catch (error: any) {
      console.error(`[${new Date().toISOString()}] [articles.ts] ${req.method} ${req.originalUrl} - ERROR fetching articles: ${error}`);
      
      if (error instanceof Error) {
        console.error(`[${new Date().toISOString()}] [articles.ts] ${req.method} ${req.originalUrl} - Error message: ${error.message}`);
        console.error(`[${new Date().toISOString()}] [articles.ts] ${req.method} ${req.originalUrl} - Error stack: ${error.stack}`);
      }
      
      if (typeof error === 'object' && error !== null && 'code' in error) {
        console.error(`[${new Date().toISOString()}] [articles.ts] ${req.method} ${req.originalUrl} - Error code: ${error.code}`);
      }
      
      console.log(`[${new Date().toISOString()}] [articles.ts] ${req.method} ${req.originalUrl} - Sending 500 error response`);
      res.status(500).json({ message: 'Error fetching articles' });
    }
  }
);
console.log(`[${new Date().toISOString()}] [articles.ts] GET / endpoint configured`);

console.log(`[${new Date().toISOString()}] [articles.ts] Articles routes configuration complete`);

export { router as articleRoutes };
