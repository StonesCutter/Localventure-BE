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
exports.server = exports.app = void 0;
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
const app = (0, express_1.default)();
exports.app = app;
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
// Security middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
// Basic middleware
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Rate limiting for auth routes
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later'
});
// Initialize Passport
app.use(passport_1.default.initialize());
passport_1.default.use(strategy_1.jwtStrategy);
// Routes
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Localventure API' });
});
// Health check endpoint
app.get('/healthz', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});
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
// Graceful shutdown
function shutdown() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Shutting down server...');
        try {
            yield prisma_1.prisma.$disconnect();
            console.log('Database connection closed');
            server.close(() => {
                console.log('Server closed');
                process.exit(0);
            });
        }
        catch (err) {
            console.error('Error during shutdown:', err);
            process.exit(1);
        }
    });
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
// Start the server
const server = app.listen(port, '0.0.0.0', () => {
    const address = server.address();
    const host = typeof address === 'string' ? address : `${address === null || address === void 0 ? void 0 : address.address}:${address === null || address === void 0 ? void 0 : address.port}`;
    console.log(`Server is running on ${host}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    // Test database connection
    prisma_1.prisma.$connect()
        .then(() => console.log('✅ Database connection established'))
        .catch((err) => {
        console.error('❌ Database connection failed:', err);
        process.exit(1);
    });
});
exports.server = server;
// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
    // Close server and exit process
    server.close(() => process.exit(1));
});
