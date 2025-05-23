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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const express_1 = require("express");
const db_1 = require("../db");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const passport_1 = __importDefault(require("passport"));
const router = (0, express_1.Router)();
exports.authRoutes = router;
// DB query helper is imported from '../db'
// Register a new user
router.post('/register', ((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password, username, role_id = 2 } = req.body;
        // Check if user already exists
        const existingUsers = yield (0, db_1.query)('SELECT * FROM users WHERE email = $1 LIMIT 1', [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }
        // Hash password
        const salt = yield bcryptjs_1.default.genSalt(10);
        const hashedPassword = yield bcryptjs_1.default.hash(password, salt);
        // Create user
        const users = yield (0, db_1.query)('INSERT INTO users (email, username, password_hash, role_id, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING user_id, email, username, role_id', [email, username, hashedPassword, role_id, true]);
        const user = users[0];
        res.status(201).json(user);
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Error registering user' });
    }
})));
// Login user
router.post('/login', ((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        // Find user
        const users = yield (0, db_1.query)('SELECT * FROM users WHERE email = $1 OR username = $1 LIMIT 1', [email]);
        const user = users[0];
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        // Check password
        const isMatch = yield bcryptjs_1.default.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        // Create JWT payload
        const payload = {
            sub: user.user_id.toString(),
            role_id: user.role_id,
        };
        // Sign token
        const token = jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET || 'your-secret-key', {
            expiresIn: '24h',
        });
        // Return user info (excluding password) and token
        const { password_hash } = user, userWithoutPassword = __rest(user, ["password_hash"]);
        res.json({
            user: Object.assign(Object.assign({}, userWithoutPassword), { id: user.user_id // For backward compatibility
             }),
            token,
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Error logging in' });
    }
})));
// Get current user profile
router.get('/profile', passport_1.default.authenticate('jwt', { session: false }), ((req, res) => {
    // req.user is set by passport-jwt
    const user = req.user;
    const { password_hash } = user, userWithoutPassword = __rest(user, ["password_hash"]);
    res.json(Object.assign(Object.assign({}, userWithoutPassword), { id: user.user_id // For backward compatibility
     }));
}));
exports.default = router;
//# sourceMappingURL=auth.js.map