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
const passport_1 = __importDefault(require("passport"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
exports.authRoutes = router;
// Register endpoint
router.post('/register', ((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password, username, role_id = 2 } = req.body;
        // Check if user already exists
        const existingUser = yield prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    { username }
                ]
            }
        });
        if (existingUser) {
            return res.status(400).json({
                message: 'Email or username already in use',
                field: existingUser.email === email ? 'email' : 'username'
            });
        }
        // Hash password
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        // Create user
        const user = yield prisma.user.create({
            data: {
                email,
                username,
                password_hash: hashedPassword,
                role_id,
                is_active: true
            },
        });
        // Generate JWT
        const token = jsonwebtoken_1.default.sign({
            sub: user.user_id.toString(),
            role_id: user.role_id
        }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '24h' });
        // Return user data (excluding password) and token
        const { password_hash } = user, userWithoutPassword = __rest(user, ["password_hash"]);
        res.status(201).json({
            user: Object.assign(Object.assign({}, userWithoutPassword), { id: user.user_id }),
            token
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Error registering user' });
    }
})));
// Login endpoint
router.post('/login', ((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        // Find user by email or username
        const user = yield prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    { username: email }
                ]
            }
        });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        // Check password
        const isPasswordValid = yield bcryptjs_1.default.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        // Generate JWT
        const token = jsonwebtoken_1.default.sign({
            sub: user.user_id.toString(),
            role_id: user.role_id
        }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '24h' });
        // Return user data (excluding password) and token
        const { password_hash } = user, userWithoutPassword = __rest(user, ["password_hash"]);
        res.json({
            user: Object.assign(Object.assign({}, userWithoutPassword), { id: user.user_id }),
            token
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Error logging in' });
    }
})));
// Get profile endpoint
router.get('/profile', passport_1.default.authenticate('jwt', { session: false }), ((req, res) => {
    // req.user is set by passport
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    // Exclude password from the response
    const _a = req.user, { password_hash } = _a, userWithoutPassword = __rest(_a, ["password_hash"]);
    res.json(userWithoutPassword);
}));
