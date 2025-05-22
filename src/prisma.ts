import { PrismaClient } from '@prisma/client';

console.log(`[${new Date().toISOString()}] [prisma.ts] Initializing Prisma client module...`);

// Validate required environment variables
console.log(`[${new Date().toISOString()}] [prisma.ts] Validating DATABASE_URL environment variable...`);
if (!process.env.DATABASE_URL) {
  console.error(`[${new Date().toISOString()}] [prisma.ts] FATAL ERROR: DATABASE_URL is not defined`);
  process.exit(1);
}

// Log parts of the DATABASE_URL without exposing credentials
try {
  const url = new URL(process.env.DATABASE_URL);
  console.log(`[${new Date().toISOString()}] [prisma.ts] Database connection details:`);
  console.log(`[${new Date().toISOString()}] [prisma.ts] - Protocol: ${url.protocol}`);
  console.log(`[${new Date().toISOString()}] [prisma.ts] - Host: ${url.hostname}`);
  console.log(`[${new Date().toISOString()}] [prisma.ts] - Port: ${url.port || 'default'}`);
  console.log(`[${new Date().toISOString()}] [prisma.ts] - Database path: ${url.pathname}`);
  console.log(`[${new Date().toISOString()}] [prisma.ts] - SSL required: ${url.searchParams.get('sslmode') === 'require' || false}`);
} catch (e: unknown) {
  const errorMessage = e instanceof Error ? e.message : String(e);
  console.error(`[${new Date().toISOString()}] [prisma.ts] WARNING: DATABASE_URL is invalid format: ${errorMessage}`);
}

console.log(`[${new Date().toISOString()}] [prisma.ts] Setting up global prisma type declaration...`);
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}
console.log(`[${new Date().toISOString()}] [prisma.ts] Global prisma type declaration complete`);

console.log(`[${new Date().toISOString()}] [prisma.ts] Creating PrismaClient instance...`);

// Configure logging level based on environment
const logLevels = process.env.NODE_ENV === 'development' 
  ? ['query', 'info', 'warn', 'error']
  : ['error'];
console.log(`[${new Date().toISOString()}] [prisma.ts] Prisma log levels configured as: ${JSON.stringify(logLevels)}`);

// Prevent multiple instances of Prisma Client in development
export const prisma = global.prisma || new PrismaClient({
  log: logLevels as any, // Type assertion to bypass TypeScript error
});

console.log(`[${new Date().toISOString()}] [prisma.ts] PrismaClient instance created (${global.prisma ? 're-used existing' : 'new instance'})`);

console.log(`[${new Date().toISOString()}] [prisma.ts] Checking if we should store Prisma instance globally...`);
if (process.env.NODE_ENV !== 'production') {
  console.log(`[${new Date().toISOString()}] [prisma.ts] Running in non-production mode, storing Prisma instance globally`);
  global.prisma = prisma;
} else {
  console.log(`[${new Date().toISOString()}] [prisma.ts] Running in production mode, not storing Prisma instance globally`);
}

console.log(`[${new Date().toISOString()}] [prisma.ts] Exporting Prisma types from '@prisma/client'...`);
// Export the Prisma types
export * from '@prisma/client';

console.log(`[${new Date().toISOString()}] [prisma.ts] Prisma client module initialization complete`);
