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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const passport_1 = __importDefault(require("passport"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const strategy_1 = require("./auth/strategy");
const routes_1 = require("./auth/routes");
const articles_1 = require("./routes/articles");
const data_1 = require("./routes/data");
const prisma_1 = require("./prisma");
// Load environment variables
dotenv_1.default.config();
// Validate required environment variables
if (!process.env.JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET is not defined');
    process.exit(1);
}
if (!process.env.DATABASE_URL) {
    console.error('FATAL ERROR: DATABASE_URL is not defined');
    process.exit(1);
}
const app = (0, express_1.default)();
exports.app = app;
const PORT = Number((_a = process.env.PORT) !== null && _a !== void 0 ? _a : 8080);
// Security middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
// Basic middleware
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// This route will be removed since we already have a root route handler below
// Rate limiting for auth routes
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later'
});
// Initialize Passport
app.use(passport_1.default.initialize());
passport_1.default.use(strategy_1.jwtStrategy);
// --- Health checks -------------------------------------------------
app.get('/healthz', (_req, res) => {
    res.status(200).send('OK');
});
app.get('/', (_req, res) => {
    res.status(200).send('OK');
}); // optional root check
// ------------------------------------------------------------------
// Auth routes with rate limiting
app.use('/auth', authLimiter, routes_1.authRoutes);
// Article routes
app.use('/articles', articles_1.articleRoutes);
// Data routes (users, cities, spots)
app.use('/api', data_1.dataRoutes);
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});
// Create and start the server
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve, reject) => {
        const httpServer = app.listen(PORT, '0.0.0.0', () => __awaiter(void 0, void 0, void 0, function* () {
            const address = httpServer.address();
            const host = typeof address === 'string' ? address : `${address === null || address === void 0 ? void 0 : address.address}:${address === null || address === void 0 ? void 0 : address.port}`;
            console.log(`🚀 Server is running on ${host}`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
            try {
                yield prisma_1.prisma.$connect();
                console.log('✅ Database connection established');
                if (process.env.NODE_ENV === 'production' && process.send) {
                    process.send('ready');
                    console.log('✅ Signaled ready to process manager');
                }
                resolve(httpServer);
            }
            catch (dbError) {
                console.error('❌ Database connection failed during startup:', dbError);
                httpServer.close(() => {
                    console.log('Server instance closed due to database connection failure during startup.');
                });
                reject(dbError); // Reject the main promise, signaling a startup failure
            }
        }));
        httpServer.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                console.error(`❌ Port ${PORT} is already in use`);
            }
            else {
                console.error('❌ Server error:', error);
            }
            reject(error); // Reject the main promise, signaling a startup failure
        });
    });
});
// Initialize and start the application
(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield startServer();
        console.log('✅ Application startup sequence completed successfully.');
    }
    catch (error) {
        console.error('💥 Application failed to start:', error);
        process.exit(1); // Exit with error code, PM2 will handle restart
    }
}))();
// Handle unhandled promise rejections globally
process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
    // Consider exiting on unhandled rejections for production robustness, letting PM2 restart
    // For now, aligns with previous behavior of just logging.
    // if (process.env.NODE_ENV === 'production') { process.exit(1); }
});
