import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

console.log(`[${new Date().toISOString()}] [auth/routes.ts] Initializing auth routes module...`);

// Define User interface to extend Express
declare global {
  namespace Express {
    interface User {
      user_id: number;
      email: string;
      username: string;
      role_id: number;
      password_hash: string;
    }
  }
}

console.log(`[${new Date().toISOString()}] [auth/routes.ts] Creating PrismaClient instance for auth routes...`);
const prisma = new PrismaClient();
console.log(`[${new Date().toISOString()}] [auth/routes.ts] PrismaClient instance created`);

console.log(`[${new Date().toISOString()}] [auth/routes.ts] Creating Express router instance...`);
const router = Router();
console.log(`[${new Date().toISOString()}] [auth/routes.ts] Express router instance created`);

// Type definitions
interface RegisterRequest {
  email: string;
  password: string;
  username: string;
  role_id?: number;
}

interface LoginRequest {
  email: string;
  password: string;
}

console.log(`[${new Date().toISOString()}] [auth/routes.ts] Configuring /register POST endpoint...`);
// Register endpoint
router.post('/register', (async (req: Request, res: Response) => {
  console.log(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - Registration request received`);
  try {
    console.log(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - Extracting registration data from request body`);
    const { email, password, username, role_id = 2 } = req.body as RegisterRequest;
    console.log(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - Registration attempt for email: ${email}, username: ${username}, role_id: ${role_id}`);

    // Check if user already exists
    console.log(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - Checking if user already exists...`);
    const existingUser = await prisma.user.findFirst({
      where: { 
        OR: [
          { email },
          { username }
        ]
      }
    });
    
    if (existingUser) {
      const duplicateField = existingUser.email === email ? 'email' : 'username';
      console.log(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - Registration failed: ${duplicateField} already in use`);
      return res.status(400).json({ 
        message: 'Email or username already in use',
        field: duplicateField
      });
    }
    console.log(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - User does not exist, proceeding with registration`);

    // Hash password
    console.log(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - Hashing password...`);
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - Password hashed successfully`);

    // Create user
    console.log(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - Creating new user in database...`);
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password_hash: hashedPassword,
        role_id,
        is_active: true
      },
    });
    console.log(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - User created successfully with ID: ${user.user_id}`);

    // Generate JWT
    console.log(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - Generating JWT token...`);
    const token = jwt.sign(
      { 
        sub: user.user_id.toString(),
        role_id: user.role_id 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    console.log(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - JWT token generated successfully`);

    // Return user data (excluding password) and token
    console.log(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - Sending 201 Created response with user data and token`);
    const { password_hash, ...userWithoutPassword } = user;
    res.status(201).json({ 
      user: {
        ...userWithoutPassword,
        id: user.user_id
      }, 
      token 
    });
    console.log(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - Registration completed successfully`);
  } catch (error: any) {
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
}) as RequestHandler);

console.log(`[${new Date().toISOString()}] [auth/routes.ts] Configuring /login POST endpoint...`);
// Login endpoint
router.post('/login', (async (req: Request, res: Response) => {
  console.log(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - Login request received`);
  try {
    console.log(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - Extracting login credentials from request body`);
    const { email, password } = req.body as LoginRequest;
    console.log(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - Login attempt for email/username: ${email}`);

    // Find user by email or username
    console.log(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - Finding user by email or username...`);
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username: email }
        ]
      }
    });
    
    if (!user) {
      console.log(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - Login failed: User not found`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    console.log(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - User found with ID: ${user.user_id}`);

    // Check password
    console.log(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - Verifying password...`);
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      console.log(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - Login failed: Invalid password`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    console.log(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - Password verified successfully`);

    // Generate JWT
    console.log(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - Generating JWT token...`);
    const token = jwt.sign(
      { 
        sub: user.user_id.toString(),
        role_id: user.role_id 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    console.log(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - JWT token generated successfully`);

    // Return user data (excluding password) and token
    console.log(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - Sending 200 OK response with user data and token`);
    const { password_hash, ...userWithoutPassword } = user;
    res.json({ 
      user: {
        ...userWithoutPassword,
        id: user.user_id
      }, 
      token 
    });
    console.log(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - Login completed successfully`);
  } catch (error: any) {
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
}) as RequestHandler);

console.log(`[${new Date().toISOString()}] [auth/routes.ts] Configuring /profile GET endpoint with JWT authentication...`);
// Get profile endpoint
router.get(
  '/profile',
  passport.authenticate('jwt', { session: false }),
  ((req: Request, res: Response) => {
    console.log(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - Profile request received and passed JWT authentication`);
    
    // req.user is set by passport
    if (!req.user) {
      console.log(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - Profile request unauthorized: No user in request`);
      return res.status(401).json({ message: 'Unauthorized' });
    }
    console.log(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - User authenticated, ID: ${req.user.user_id}`);
    
    // Exclude password from the response
    console.log(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - Preparing user profile data (excluding password)`);
    const { password_hash, ...userWithoutPassword } = req.user;
    
    console.log(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - Sending 200 OK response with user profile`);
    res.json(userWithoutPassword);
    console.log(`[${new Date().toISOString()}] [auth/routes.ts] ${req.method} ${req.originalUrl} - Profile request completed successfully`);
  }) as RequestHandler
);

console.log(`[${new Date().toISOString()}] [auth/routes.ts] Auth routes configuration complete`);

export { router as authRoutes };
