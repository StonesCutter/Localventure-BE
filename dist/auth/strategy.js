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
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const jwtOptions = {
    jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
    passReqToCallback: true,
};
exports.jwtStrategy = new passport_jwt_1.Strategy(jwtOptions, (req, payload, done) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield prisma.user.findUnique({
            where: { user_id: parseInt(payload.sub) },
            select: {
                user_id: true,
                email: true,
                username: true,
                role_id: true,
                password_hash: true,
                join_date: true,
                is_active: true
            }
        });
        if (user) {
            // Map to Express.User interface
            const userForAuth = {
                user_id: user.user_id,
                email: user.email,
                username: user.username,
                role_id: user.role_id,
                password_hash: user.password_hash
            };
            return done(null, userForAuth);
        }
        return done(null, false);
    }
    catch (error) {
        console.error('JWT Strategy Error:', error);
        return done(error, false);
    }
}));
// Role-based middleware
const requireRole = (roleIds) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        if (!req.user || !roleIds.includes(req.user.role_id)) {
            return res.status(403).json({ message: 'Insufficient permissions' });
        }
        next();
    };
};
exports.requireRole = requireRole;
