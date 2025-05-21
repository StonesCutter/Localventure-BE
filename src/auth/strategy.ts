import { Strategy as JwtStrategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type JwtPayload = {
  sub: string;
  role_id: number;
  iat?: number;
  exp?: number;
};

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

const jwtOptions: StrategyOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
  passReqToCallback: true,
};

export const jwtStrategy = new JwtStrategy(
  jwtOptions,
  async (req: Request, payload: JwtPayload, done: (error: any, user?: Express.User | false) => void) => {
    try {
      const user = await prisma.user.findUnique({
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
        const userForAuth: Express.User = {
          user_id: user.user_id,
          email: user.email,
          username: user.username,
          role_id: user.role_id,
          password_hash: user.password_hash
        };
        return done(null, userForAuth);
      }
      return done(null, false);
    } catch (error) {
      console.error('JWT Strategy Error:', error);
      return done(error, false);
    }
  }
);

// Role-based middleware
export const requireRole = (roleIds: number[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!req.user || !roleIds.includes(req.user.role_id)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};
