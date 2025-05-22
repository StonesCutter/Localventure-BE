import { Strategy as JwtStrategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

console.log(`[${new Date().toISOString()}] [auth/strategy.ts] Initializing JWT authentication strategy...`);

console.log(`[${new Date().toISOString()}] [auth/strategy.ts] Creating PrismaClient instance for JWT strategy...`);
const prisma = new PrismaClient();
console.log(`[${new Date().toISOString()}] [auth/strategy.ts] PrismaClient instance created`);

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

console.log(`[${new Date().toISOString()}] [auth/strategy.ts] Configuring JWT strategy options...`);
const jwtOptions: StrategyOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
  passReqToCallback: true,
};
console.log(`[${new Date().toISOString()}] [auth/strategy.ts] JWT token extraction method: Bearer Token`);
console.log(`[${new Date().toISOString()}] [auth/strategy.ts] JWT secret key is ${process.env.JWT_SECRET ? 'properly configured' : 'using fallback value'}`);

console.log(`[${new Date().toISOString()}] [auth/strategy.ts] Creating JWT Strategy instance...`);
export const jwtStrategy = new JwtStrategy(
  jwtOptions,
  async (req: Request, payload: JwtPayload, done: (error: any, user?: Express.User | false) => void) => {
    console.log(`[${new Date().toISOString()}] [auth/strategy.ts] JWT Strategy verifying token for subject: ${payload.sub}, role: ${payload.role_id}`);
    console.log(`[${new Date().toISOString()}] [auth/strategy.ts] JWT token expiration: ${payload.exp ? new Date(payload.exp * 1000).toISOString() : 'not set'}`);
    
    try {
      console.log(`[${new Date().toISOString()}] [auth/strategy.ts] Attempting to find user with ID: ${payload.sub}`);
      const user = await prisma.user.findUnique({
        where: { user_id: parseInt(payload.sub) },
        select: {
          user_id: true,
          email: true,
          username: true,
          role_id: true,
          password_hash: true,
          created_at: true,
          is_active: true
        }
      });
      
      if (user) {
        console.log(`[${new Date().toISOString()}] [auth/strategy.ts] User found: ID ${user.user_id}, username: ${user.username}, role: ${user.role_id}`);
        
        // Map to Express.User interface
        const userForAuth: Express.User = {
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
    } catch (error: any) {
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
  }
);
console.log(`[${new Date().toISOString()}] [auth/strategy.ts] JWT Strategy instance created`);

console.log(`[${new Date().toISOString()}] [auth/strategy.ts] Setting up role-based authorization middleware...`);
// Role-based middleware
export const requireRole = (roleIds: number[]) => {
  console.log(`[${new Date().toISOString()}] [auth/strategy.ts] Creating middleware that requires roles: ${JSON.stringify(roleIds)}`);
  
  return (req: Request, res: Response, next: NextFunction) => {
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

console.log(`[${new Date().toISOString()}] [auth/strategy.ts] JWT authentication strategy module initialization complete`);
