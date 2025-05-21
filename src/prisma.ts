import { PrismaClient } from '@prisma/client';

// Validate required environment variables
if (!process.env.DATABASE_URL) {
  console.error('FATAL ERROR: DATABASE_URL is not defined');
  process.exit(1);
}

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Prevent multiple instances of Prisma Client in development
export const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Export the Prisma types
export * from '@prisma/client';
