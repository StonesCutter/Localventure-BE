import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

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

const prisma = new PrismaClient();
const router = Router();

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

// Register endpoint
router.post('/register', (async (req: Request, res: Response) => {
  try {
    const { email, password, username, role_id = 2 } = req.body as RegisterRequest;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
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
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password_hash: hashedPassword,
        role_id,
        is_active: true
      },
    });

    // Generate JWT
    const token = jwt.sign(
      { 
        sub: user.user_id.toString(),
        role_id: user.role_id 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Return user data (excluding password) and token
    const { password_hash, ...userWithoutPassword } = user;
    res.status(201).json({ 
      user: {
        ...userWithoutPassword,
        id: user.user_id
      }, 
      token 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error registering user' });
  }
}) as RequestHandler);

// Login endpoint
router.post('/login', (async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as LoginRequest;

    // Find user by email or username
    const user = await prisma.user.findFirst({
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
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { 
        sub: user.user_id.toString(),
        role_id: user.role_id 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Return user data (excluding password) and token
    const { password_hash, ...userWithoutPassword } = user;
    res.json({ 
      user: {
        ...userWithoutPassword,
        id: user.user_id
      }, 
      token 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in' });
  }
}) as RequestHandler);

// Get profile endpoint
router.get(
  '/profile',
  passport.authenticate('jwt', { session: false }),
  ((req: Request, res: Response) => {
    // req.user is set by passport
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Exclude password from the response
    const { password_hash, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  }) as RequestHandler
);

export { router as authRoutes };
