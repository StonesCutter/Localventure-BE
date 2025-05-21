import { Router, Request, Response, RequestHandler } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { requireRole } from '../auth/strategy';

const router = Router();
const prisma = new PrismaClient();

// Register a new user
router.post('/register', (async (req: Request, res: Response) => {
  try {
    const { email, password, username, role_id = 2 } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password_hash: hashedPassword,
        role_id,
        is_active: true
      },
      select: {
        user_id: true,
        email: true,
        username: true,
        role_id: true,
      },
    });

    res.status(201).json(user);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error registering user' });
  }
}) as RequestHandler);

// Login user
router.post('/login', (async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user
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
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create JWT payload
    const payload = {
      sub: user.user_id.toString(),
      role_id: user.role_id,
    };

    // Sign token
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', {
      expiresIn: '24h',
    });

    // Return user info (excluding password) and token
    const { password_hash, ...userWithoutPassword } = user;
    res.json({
      user: {
        ...userWithoutPassword,
        id: user.user_id // For backward compatibility
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in' });
  }
}) as RequestHandler);

// Get current user profile
router.get(
  '/profile',
  passport.authenticate('jwt', { session: false }),
  ((req: Request, res: Response) => {
    // req.user is set by passport-jwt
    const user = req.user as Express.User;
    const { password_hash, ...userWithoutPassword } = user;
    res.json({
      ...userWithoutPassword,
      id: user.user_id // For backward compatibility
    });
  }) as RequestHandler
);

export default router;
export { router as authRoutes };
