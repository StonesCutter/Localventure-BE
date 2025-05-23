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
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const passport_1 = __importDefault(require("passport"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const logger_1 = require("./utils/logger");
const cloudinary_1 = require("./utils/cloudinary");
const strategy_1 = require("./auth/strategy");
const routes_1 = require("./auth/routes");
const articles_1 = require("./routes/articles");
const data_1 = require("./routes/data");
const health_1 = require("./routes/health");
const db_1 = require("./db");
logger_1.logger.info('[index] Starting application');
// Load environment variables
logger_1.logger.info('[index] Loading environment variables');
dotenv_1.default.config();
logger_1.logger.info('[index] Environment variables loaded');
// Log important environment variables
logger_1.logger.info(`[index] NODE_ENV=${process.env.NODE_ENV}`);
logger_1.logger.info(`[index] PORT present=${Boolean(process.env.PORT)}`);
logger_1.logger.info(`[index] DATABASE_URL present=${Boolean(process.env.DATABASE_URL)}`);
logger_1.logger.info(`[index] Cloudinary vars present=${['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']
    .map(k => Boolean(process.env[k])).join(',')}`);
// Validate required environment variables
logger_1.logger.info('[index] Validating required environment variables');
// Check all important environment variables
const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL'];
// Check required vars
requiredEnvVars.forEach(varName => {
    logger_1.logger.info(`[index] ${varName} is set: ${Boolean(process.env[varName])}`);
    if (!process.env[varName]) {
        logger_1.logger.error(`[index] FATAL ERROR: ${varName} is not defined`);
        process.exit(1);
    }
});
// For DATABASE_URL, log parts of it (host only) for debugging
if (process.env.DATABASE_URL) {
    try {
        const url = new URL(process.env.DATABASE_URL);
        logger_1.logger.info(`[index] Database host: ${url.hostname}, protocol: ${url.protocol}`);
    }
    catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        logger_1.logger.error(`[index] DATABASE_URL is invalid format: ${errorMessage}`);
    }
}
logger_1.logger.info('[index] Creating Express application instance');
const app = (0, express_1.default)();
exports.app = app;
logger_1.logger.info('[index] Express application instance created');
// Set port using environment variable or default to 3000
const PORT = Number(process.env.PORT) || 3000;
console.log(`[index] PORT chosen → ${PORT} (env=${process.env.PORT || 'undefined'})`);
logger_1.logger.info(`[index] PORT configured as: ${PORT}`);
// Add direct health check endpoint
app.get('/healthz', (_req, res) => {
    logger_1.logger.info('[index] Health check request received');
    res.status(200).send('ok');
    logger_1.logger.info('[index] Health check response sent');
});
logger_1.logger.info('[index] Registering health check routes');
// Register health check routes before other middleware
// This ensures health checks pass even if other middleware has errors
app.use(health_1.healthRoutes);
logger_1.logger.info('[index] Health check routes registered');
logger_1.logger.info('[index] Setting up Helmet security middleware');
// Security middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: process.env.NODE_ENV === 'production',
}));
logger_1.logger.info('[index] Helmet security middleware configured');
logger_1.logger.info('[index] Setting up CORS middleware');
// Enable CORS
app.use((0, cors_1.default)());
logger_1.logger.info('[index] CORS middleware configured');
logger_1.logger.info('[index] Setting up basic Express middleware');
// Basic middleware
app.use(express_1.default.json());
logger_1.logger.info('[index] express.json middleware configured');
app.use(express_1.default.urlencoded({ extended: true }));
logger_1.logger.info('[index] express.urlencoded middleware configured');
logger_1.logger.info('[index] Configuring rate limiting middleware');
// Rate limiting for auth routes
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later'
});
logger_1.logger.info('[index] Rate limiting middleware configured');
logger_1.logger.info('[index] Initializing Passport authentication');
// Initialize Passport
app.use(passport_1.default.initialize());
passport_1.default.use(strategy_1.jwtStrategy);
logger_1.logger.info('[index] Passport initialized with JWT strategy');
logger_1.logger.info('[index] Registering auth routes with rate limiting');
// Auth routes with rate limiting
app.use('/auth', authLimiter, routes_1.authRoutes);
logger_1.logger.info('[index] Auth routes registered');
logger_1.logger.info('[index] Registering article routes');
// Article routes
app.use('/articles', articles_1.articleRoutes);
logger_1.logger.info('[index] Article routes registered');
logger_1.logger.info('[index] Registering data routes (users, cities, spots)');
// Data routes (users, cities, spots)
app.use('/api', data_1.dataRoutes);
logger_1.logger.info('[index] Data routes registered');
logger_1.logger.info('[index] Setting up global error handling middleware');
// Error handling middleware
app.use((err, req, res, next) => {
    logger_1.logger.error({ err }, '[error] Uncaught handler error');
    res.status(500).json({ message: 'Something went wrong!' });
});
logger_1.logger.info('[index] Global error handling middleware configured');
logger_1.logger.info('[index] Starting Railway-optimized startup flow');
// Railway-optimized startup flow: start server first, then try database connection
(() => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.logger.info(`[index] Starting HTTP server on port ${PORT}`);
    // Start the HTTP server immediately so health checks can succeed
    const server = app.listen(PORT, '0.0.0.0', () => {
        logger_1.logger.info(`[index] Listening on ${PORT} (bound to all interfaces 0.0.0.0)`);
        logger_1.logger.info(`[index] Environment: ${process.env.NODE_ENV || 'development'}`);
        logger_1.logger.info('[index] Server is responding to health checks');
    });
    logger_1.logger.info('[index] Setting up server error handlers');
    // Handle server errors
    server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
            logger_1.logger.error(`[index] Port ${PORT} is already in use`);
        }
        else {
            logger_1.logger.error({ err: error }, '[index] Server error');
        }
        process.exit(1); // Let Railway restart
    });
    logger_1.logger.info('[index] Server error handlers configured');
    logger_1.logger.info('[index] Setting up graceful shutdown handlers');
    // Handle graceful shutdown
    process.on('SIGTERM', () => {
        logger_1.logger.info('[index] SIGTERM received, shutting down gracefully');
        server.close(() => __awaiter(void 0, void 0, void 0, function* () {
            logger_1.logger.info('[index] HTTP server closed, disconnecting from database');
            try {
                // Interval will be cleared by the handler added during DB connection
                yield db_1.pool.end();
                logger_1.logger.info('[index] Database connections closed successfully');
            }
            catch (err) {
                logger_1.logger.error({ err }, '[index] Error during database disconnect');
            }
            logger_1.logger.info('[index] Exiting process with code 0');
            process.exit(0);
        }));
    });
    logger_1.logger.info('[index] Graceful shutdown handlers configured');
    logger_1.logger.info('[index] Attempting database connection AFTER server startup');
    // Try to connect to the database AFTER server is already accepting requests
    try {
        logger_1.logger.info('[db] Testing pg connection');
        const res = yield db_1.pool.query('SELECT 1');
        logger_1.logger.info('[db] Connection established');
        logger_1.logger.info('[db] Test query successful:', res.rows);
        /*************  KEEP-ALIVE (Neon free tier)  *************/
        const KEEPALIVE_MS = 4 * 60000; // 4 minutes
        const keepAliveInterval = setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
            try {
                yield db_1.pool.query('SELECT 1');
                console.log('[keep-alive] SELECT 1 OK');
            }
            catch (err) {
                console.error('[keep-alive] failed', err);
            }
        }), KEEPALIVE_MS);
        // Make sure to clear the interval on SIGTERM
        process.on('SIGTERM', () => {
            logger_1.logger.info('[keep-alive] Clearing interval on SIGTERM');
            clearInterval(keepAliveInterval);
        });
        // Initialize Cloudinary if environment variables are available
        if (process.env.CLOUDINARY_CLOUD_NAME &&
            process.env.CLOUDINARY_API_KEY &&
            process.env.CLOUDINARY_API_SECRET) {
            try {
                (0, cloudinary_1.initCloudinary)();
            }
            catch (err) {
                logger_1.logger.error({ err }, '[index] Cloudinary initialization failed, but continuing');
                // Continue running even if Cloudinary fails
            }
        }
        else {
            logger_1.logger.warn('[index] Cloudinary environment variables missing, skipping initialization');
        }
    }
    catch (err) {
        // Log the database error and exit (as requested in the requirements)
        logger_1.logger.error({ err }, '[db] Connection FAILED');
        process.exit(1);
    }
}))();
logger_1.logger.info('[index] Setting up global unhandled rejection handler');
// Handle unhandled promise rejections globally
process.on('unhandledRejection', (reason, promise) => {
    if (reason instanceof Error) {
        logger_1.logger.error({ err: reason }, '[error] Unhandled Rejection');
    }
    else {
        logger_1.logger.error({ reason, promise }, '[error] Unhandled Rejection');
    }
    // Log only, don't exit
});
logger_1.logger.info('[index] Global unhandled rejection handler configured');
//# sourceMappingURL=index.js.map