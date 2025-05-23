"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.articleRoutes = void 0;
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const db_1 = require("../db");
const passport_1 = __importDefault(require("passport"));
const safeQuery_1 = require("../utils/safeQuery");
console.log(`[${new Date().toISOString()}] [articles.ts] Initializing articles routes module...`);
console.log(`[${new Date().toISOString()}] [articles.ts] Creating Express router instance...`);
const router = (0, express_1.Router)();
exports.articleRoutes = router;
console.log(`[${new Date().toISOString()}] [articles.ts] Express router instance created`);
console.log(`[${new Date().toISOString()}] [articles.ts] DB query helper initialized for articles routes...`);
console.log(`[${new Date().toISOString()}] [articles.ts] Setting up validation middleware for articles...`);
// Validation middleware for creating/updating articles
const validateArticle = [
    (0, express_validator_1.body)('title')
        .trim()
        .isLength({ min: 5, max: 120 })
        .withMessage('Title must be between 5 and 120 characters'),
    (0, express_validator_1.body)('content')
        .trim()
        .notEmpty()
        .withMessage('Content cannot be empty'),
    (0, express_validator_1.body)('cityId')
        .isInt()
        .withMessage('City ID must be a valid integer'),
    (req, res, next) => {
        console.log(`[${new Date().toISOString()}] [articles.ts] ${req.method} ${req.originalUrl} - Validating article request body`);
        const errors = (0, express_validator_1.validationResult)(req);
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
router.post('/', passport_1.default.authenticate('jwt', { session: false }), validateArticle, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log(`[${new Date().toISOString()}] [articles.ts] ${req.method} ${req.originalUrl} - Create article request received, passed JWT auth and validation`);
    console.log(`[${new Date().toISOString()}] [articles.ts] ${req.method} ${req.originalUrl} - User ID: ${(_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id}`);
    try {
        console.log(`[${new Date().toISOString()}] [articles.ts] ${req.method} ${req.originalUrl} - Extracting article data from request body`);
        const { title, content, cityId } = req.body;
        console.log(`[${new Date().toISOString()}] [articles.ts] ${req.method} ${req.originalUrl} - Creating article with title: "${title}", cityId: ${cityId}`);
        const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
        console.log(`[${new Date().toISOString()}] [articles.ts] ${req.method} ${req.originalUrl} - Generated slug: ${slug}`);
        console.log(`[${new Date().toISOString()}] [articles.ts] ${req.method} ${req.originalUrl} - Executing SQL insert query`);
        const articles = yield (0, db_1.query)(`
        INSERT INTO "Spot" (name, summary, city_id, category_id, slug, status)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [title, content, cityId, 1, slug, 'published']);
        const article = articles[0];
        // Get city information to match the previous include behavior
        const cities = yield (0, db_1.query)(`
        SELECT * FROM "City" WHERE city_id = $1
      `, [cityId]);
        // Attach city to article like Prisma would do with include
        if (cities.length > 0) {
            article.city = cities[0];
        }
        console.log(`[${new Date().toISOString()}] [articles.ts] ${req.method} ${req.originalUrl} - Article created successfully with ID: ${article.spot_id}`);
        console.log(`[${new Date().toISOString()}] [articles.ts] ${req.method} ${req.originalUrl} - Sending 201 Created response with article data`);
        res.status(201).json(article);
        console.log(`[${new Date().toISOString()}] [articles.ts] ${req.method} ${req.originalUrl} - Create article request completed`);
    }
    catch (error) {
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
}));
console.log(`[${new Date().toISOString()}] [articles.ts] POST / endpoint configured`);
console.log(`[${new Date().toISOString()}] [articles.ts] Configuring GET / endpoint...`);
// Get all articles with optional city filter
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`[${new Date().toISOString()}] [articles.ts] ${req.method} ${req.originalUrl} - Get articles request received`);
    try {
        console.log(`[${new Date().toISOString()}] [articles.ts] ${req.method} ${req.originalUrl} - Extracting query parameters`);
        const { cityId } = req.query;
        const filterCondition = cityId ? `with cityId: ${cityId}` : 'without city filter';
        console.log(`[${new Date().toISOString()}] [articles.ts] ${req.method} ${req.originalUrl} - Fetching articles ${filterCondition}`);
        console.log(`[${new Date().toISOString()}] [articles.ts] ${req.method} ${req.originalUrl} - Executing query with retry logic`);
        // Use safeQuery with retry logic for listing articles (critical user-facing operation)
        let articles = [];
        if (cityId) {
            const query = `
          SELECT s.*, c.* 
          FROM "Spot" s
          LEFT JOIN "City" c ON s.city_id = c.city_id
          WHERE s.city_id = $1 AND s.status = 'published'
          ORDER BY s.spot_id DESC
        `;
            articles = (yield (0, safeQuery_1.safeQuery)(query, [Number(cityId)])) || [];
        }
        else {
            const query = `
          SELECT s.*, c.* 
          FROM "Spot" s
          LEFT JOIN "City" c ON s.city_id = c.city_id
          WHERE s.status = 'published'
          ORDER BY s.spot_id DESC
        `;
            articles = (yield (0, safeQuery_1.safeQuery)(query)) || [];
        }
        console.log(`[${new Date().toISOString()}] [articles.ts] ${req.method} ${req.originalUrl} - Successfully fetched ${articles.length} articles`);
        console.log(`[${new Date().toISOString()}] [articles.ts] ${req.method} ${req.originalUrl} - Sending 200 OK response with articles data`);
        res.json(articles);
        console.log(`[${new Date().toISOString()}] [articles.ts] ${req.method} ${req.originalUrl} - Get articles request completed`);
    }
    catch (error) {
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
}));
console.log(`[${new Date().toISOString()}] [articles.ts] GET / endpoint configured`);
console.log(`[${new Date().toISOString()}] [articles.ts] Articles routes configuration complete`);
//# sourceMappingURL=articles.js.map