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
const db_1 = require("../db");
const safeQuery_1 = require("../utils/safeQuery");
console.log(`[${new Date().toISOString()}] [auth/routes.ts] Initializing auth routes module...`);
console.log(`[${new Date().toISOString()}] [auth/routes.ts] DB query helper initialized for auth routes...`);
console.log(`[${new Date().toISOString()}] [auth/routes.ts] Creating Express router instance...`);
const router = (0, express_1.Router)();
exports.authRoutes = router;
console.log(`[${new Date().toISOString()}] [auth/routes.ts] Express router instance created`);
console.log(`[${new Date().toISOString()}] [auth/routes.ts] Configuring /register POST endpoint...`);
// Register endpoint
router.post('/register', ((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - Registration request received`);
    try {
        console.log(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - Extracting registration data from request body`);
        const { email, password, username, role_id = 2 } = req.body;
        console.log(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - Registration attempt for email: ${email}, username: ${username}, role_id: ${role_id}`);
        // Check if user already exists
        console.log(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - Checking if user already exists...`);
        const existingUsers = yield (0, db_1.query)('SELECT * FROM users WHERE email = $1 OR username = $2 LIMIT 1', [email, username]);
        const existingUser = existingUsers[0];
        if (existingUser) {
            const duplicateField = existingUser.email === email ? 'email' : 'username';
            console.log(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - Registration failed: ${duplicateField} already in use`);
            return res.status(400).json({
                message: 'Email or username already in use',
                field: duplicateField
            });
        }
        console.log(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - User does not exist, proceeding with registration`);
        console.log(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - User does not exist, proceeding with registration`);
        // Hash password
        console.log(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - Hashing password...`);
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        console.log(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - Password hashed successfully`);
        // Create user
        console.log(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - Creating new user in database...`);
        const users = yield (0, db_1.query)('INSERT INTO users (email, username, password_hash, role_id, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING *', [email, username, hashedPassword, role_id, true]);
        const user = users[0];
        console.log(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - User created successfully with ID: ${user.user_id}`);
        // Generate JWT
        console.log(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - Generating JWT token...`);
        const token = jsonwebtoken_1.default.sign({
            sub: user.user_id.toString(),
            role_id: user.role_id
        }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '24h' });
        console.log(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - JWT token generated successfully`);
        // Return user data (excluding password) and token
        console.log(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - Sending 201 Created response with user data and token`);
        const { password_hash } = user, userWithoutPassword = __rest(user, ["password_hash"]);
        res.status(201).json({
            user: Object.assign(Object.assign({}, userWithoutPassword), { id: user.user_id }),
            token
        });
        console.log(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - Registration completed successfully`);
    }
    catch (error) {
        console.error(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - Registration ERROR: ${error}`);
        if (error instanceof Error) {
            console.error(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - Error message: ${error.message}`);
            console.error(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - Error stack: ${error.stack}`);
        }
        if (typeof error === 'object' && error !== null && 'code' in error) {
            console.error(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - Error code: ${error.code}`);
        }
        console.log(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - Sending 500 error response`);
        res.status(500).json({ message: 'Error registering user' });
    }
})));
console.log(`[${new Date().toISOString()}] [auth/routes.ts] Configuring /login POST endpoint...`);
// Login endpoint
router.post('/login', ((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - Login request received`);
    try {
        console.log(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - Extracting login credentials from request body`);
        const { email, password } = req.body;
        console.log(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - Login attempt for email/username: ${email}`);
        // Find user by email - use safeQuery for login which is a critical path
        console.log(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - Looking up user by email...`);
        try {
            // Using raw query with retry logic for critical login path
            const users = yield (0, safeQuery_1.safeQuery)('SELECT user_id, email, username, password_hash, role_id, is_active FROM "User" WHERE email = $1 LIMIT 1', [email]);
            const user = users && users.length > 0 ? users[0] : null;
            if (!user) {
                console.log(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - Login failed: User not found`);
                return res.status(401).json({ message: 'Invalid credentials' });
            }
            console.log(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - User found, ID: ${user.user_id}`);
            // Check password
            console.log(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - Verifying password...`);
            const isPasswordValid = yield bcryptjs_1.default.compare(password, user.password_hash);
            if (!isPasswordValid) {
                console.log(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - Login failed: Invalid password`);
                return res.status(401).json({ message: 'Invalid credentials' });
            }
            console.log(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - Password verified successfully`);
            // Generate JWT
            console.log(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - Generating JWT token...`);
            const token = jsonwebtoken_1.default.sign({
                sub: user.user_id.toString(),
                role_id: user.role_id
            }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '24h' });
            console.log(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - JWT token generated successfully`);
            // Return user data (excluding password) and token
            console.log(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - Sending 200 OK response with user data and token`);
            const { password_hash } = user, userWithoutPassword = __rest(user, ["password_hash"]);
            res.json({
                user: Object.assign(Object.assign({}, userWithoutPassword), { id: user.user_id }),
                token
            });
            console.log(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - Login completed successfully`);
        }
        catch (error) {
            console.error(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - Login ERROR: ${error}`);
            if (error instanceof Error) {
                console.error(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - Error message: ${error.message}`);
                console.error(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - Error stack: ${error.stack}`);
            }
            if (typeof error === 'object' && error !== null && 'code' in error) {
                console.error(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - Error code: ${error.code}`);
            }
            console.log(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - Sending 500 error response`);
            res.status(500).json({ message: 'Error logging in' });
        }
    }
    catch (queryError) {
        console.error(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - Database query ERROR: ${queryError}`);
        res.status(500).json({ message: 'Error during login - database connection issue' });
    }
})));
console.log(`[${new Date().toISOString()}] [auth/routes.ts] Configuring /profile GET endpoint with JWT authentication...`);
// Get profile endpoint
router.get('/profile', passport_1.default.authenticate('jwt', { session: false }), ((req, res) => {
    console.log(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - Profile request received and passed JWT authentication`);
    // req.user is set by passport
    if (!req.user) {
        console.log(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - Profile request unauthorized: No user in request`);
        return res.status(401).json({ message: 'Unauthorized' });
    }
    console.log(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - User authenticated, ID: ${req.user.user_id}`);
    // Exclude password from the response
    console.log(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - Preparing user profile data (excluding password)`);
    const _a = req.user, { password_hash } = _a, userWithoutPassword = __rest(_a, ["password_hash"]);
    console.log(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - Sending 200 OK response with user profile`);
    res.json(userWithoutPassword);
    console.log(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - Profile request completed successfully`);
}));
console.log(`[${new Date().toISOString()}] [auth/routes.ts] Auth routes configuration complete`);
//# sourceMappingURL=routes.js.map