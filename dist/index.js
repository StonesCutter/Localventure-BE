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
// Routes
app.get('/', (_, res) => {
    res.status(200).send("OK");
});
// Health check endpoint
app.get('/healthz', (_, res) => {
    res.send('ok');
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
// Keep track of whether we're already shutting down
let isShuttingDown = false;
// Graceful shutdown
function shutdown() {
    return __awaiter(this, void 0, void 0, function* () {
        // Prevent multiple shutdown attempts
        if (isShuttingDown)
            return;
        isShuttingDown = true;
        console.log('Shutting down server gracefully...');
        try {
            // Close database connection if it exists
            if (prisma_1.prisma) {
                console.log('Closing database connection...');
                yield prisma_1.prisma.$disconnect();
                console.log('✅ Database connection closed');
            }
            // Close the server
            const currentServer = yield server;
            if (currentServer) {
                currentServer.close(() => {
                    console.log('✅ Server closed');
                    process.exit(0);
                });
                // Force close after 5 seconds
                setTimeout(() => {
                    console.error('❌ Could not close connections in time, forcefully shutting down');
                    process.exit(1);
                }, 5000);
            }
            else {
                console.log('No active server to close');
                process.exit(0);
            }
        }
        catch (err) {
            console.error('❌ Error during shutdown:', err);
            process.exit(1);
        }
    });
}
// Create and start the server
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Create server
        const server = app.listen(PORT, '0.0.0.0', () => __awaiter(void 0, void 0, void 0, function* () {
            const address = server.address();
            const host = typeof address === 'string' ? address : `${address === null || address === void 0 ? void 0 : address.address}:${address === null || address === void 0 ? void 0 : address.port}`;
            console.log(`🚀 Server is running on ${host}`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
            try {
                // Test database connection
                yield prisma_1.prisma.$connect();
                console.log('✅ Database connection established');
            }
            catch (err) {
                console.error('❌ Database connection failed:', err);
                // Don't exit immediately, let the server keep running
                // The next database operation will trigger a retry
            }
        }));
        // Handle server errors
        server.on('error', (error) => {
            if (error.name === 'EADDRINUSE') {
                console.error(`❌ Port ${PORT} is already in use`);
            }
            else {
                console.error('❌ Server error:', error);
            }
            process.exit(1);
        });
        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
            // Don't exit on unhandled rejections, just log them
        });
        return server;
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
});
// Start the server
const server = startServer();
exports.server = server;
// Handle different shutdown signals after server is running
process.on("SIGTERM", () => {
    console.log("Shutting down server...");
    setTimeout(() => {
        // Wait for connections to drain before closing
        server.then(s => {
            if (s)
                s.close(() => console.log("Server closed"));
        });
    }, 500);
});
process.on("SIGINT", () => {
    console.log("Shutting down server...");
    setTimeout(() => {
        server.then(s => {
            if (s)
                s.close(() => console.log("Server closed"));
        });
    }, 500);
});
// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
    // Wait a bit before shutting down
    setTimeout(() => {
        server.then(s => {
            if (s)
                s.close(() => console.log("Server closed"));
            process.exit(1);
        });
    }, 500);
});
