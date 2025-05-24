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
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.jwtStrategy = void 0;
const passport_jwt_1 = require("passport-jwt");
const db_1 = require("../db");
console.log(`[${new Date().toISOString()}] [auth/strategy.ts] Initializing JWT authentication strategy...`);
console.log(`[${new Date().toISOString()}] [auth/strategy.ts] DB query helper initialized for JWT strategy...`);
console.log(`[${new Date().toISOString()}] [auth/strategy.ts] Configuring JWT strategy options...`);
const jwtOptions = {
    jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
    passReqToCallback: true,
};
console.log(`[${new Date().toISOString()}] [auth/strategy.ts] JWT token extraction method: Bearer Token`);
console.log(`[${new Date().toISOString()}] [auth/strategy.ts] JWT secret key is ${process.env.JWT_SECRET ? 'properly configured' : 'using fallback value'}`);
console.log(`[${new Date().toISOString()}] [auth/strategy.ts] Creating JWT Strategy instance...`);
exports.jwtStrategy = new passport_jwt_1.Strategy(jwtOptions, (req, payload, done) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`[${new Date().toISOString()}] [auth/strategy.ts] JWT Strategy verifying token for subject: ${payload.sub}, role: ${payload.role_id}`);
    console.log(`[${new Date().toISOString()}] [auth/strategy.ts] JWT token expiration: ${payload.exp ? new Date(payload.exp * 1000).toISOString() : 'not set'}`);
    try {
        console.log(`[${new Date().toISOString()}] [auth/strategy.ts] Attempting to find user with ID: ${payload.sub}`);
        const users = yield (0, db_1.query)('SELECT user_id, email, username, role_id, password_hash, created_at, is_active FROM user WHERE user_id = $1', [parseInt(payload.sub)]);
        const user = users[0];
        if (user) {
            console.log(`[${new Date().toISOString()}] [auth/strategy.ts] User found: ID ${user.user_id}, username: ${user.username}, role: ${user.role_id}`);
            // Map to Express.User interface
            const userForAuth = {
                user_id: user.user_id,
                email: user.email,
                username: user.username,
                role_id: user.role_id,
                password_hash: user.password_hash
            };
            console.log(`[${new Date().toISOString()}] [auth/strategy.ts] User authentication successful`);
            return done(null, userForAuth);
        }
        console.log(`[${new Date().toISOString()}] [auth/strategy.ts] User not found for ID: ${payload.sub}`);
        return done(null, false);
    }
    catch (error) {
        console.error(`[${new Date().toISOString()}] [auth/strategy.ts] JWT Strategy Error: ${error}`);
        if (error instanceof Error) {
            console.error(`[${new Date().toISOString()}] [auth/strategy.ts] Error message: ${error.message}`);
            console.error(`[${new Date().toISOString()}] [auth/strategy.ts] Error stack: ${error.stack}`);
        }
        if (typeof error === 'object' && error !== null && 'code' in error) {
            console.error(`[${new Date().toISOString()}] [auth/strategy.ts] Error code: ${error.code}`);
        }
        return done(error, false);
    }
}));
console.log(`[${new Date().toISOString()}] [auth/strategy.ts] JWT Strategy instance created`);
console.log(`[${new Date().toISOString()}] [auth/strategy.ts] Setting up role-based authorization middleware...`);
// Role-based middleware
const requireRole = (roleIds) => {
    console.log(`[${new Date().toISOString()}] [auth/strategy.ts] Creating middleware that requires roles: ${JSON.stringify(roleIds)}`);
    return (req, res, next) => {
        console.log(`[${new Date().toISOString()}] [auth/strategy.ts] ${req.method} ${req.originalUrl} - Checking role authorization`);
        if (!req.user) {
            console.log(`[${new Date().toISOString()}] [auth/strategy.ts] ${req.method} ${req.originalUrl} - Authorization failed: No authenticated user`);
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const userRoleId = req.user.role_id;
        if (!roleIds.includes(userRoleId)) {
            console.log(`[${new Date().toISOString()}] [auth/strategy.ts] ${req.method} ${req.originalUrl} - Authorization failed: User role ${userRoleId} not in allowed roles ${JSON.stringify(roleIds)}`);
            return res.status(403).json({ message: 'Insufficient permissions' });
        }
        console.log(`[${new Date().toISOString()}] [auth/strategy.ts] ${req.method} ${req.originalUrl} - Role authorization successful for user ${req.user.user_id} with role ${userRoleId}`);
        next();
    };
};
exports.requireRole = requireRole;
console.log(`[${new Date().toISOString()}] [auth/strategy.ts] JWT authentication strategy module initialization complete`);
//# sourceMappingURL=strategy.js.map