import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create a new Prisma client instance
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

/**
 * Set the idle_in_transaction_session_timeout at the session level
 * @param timeoutMs Timeout in milliseconds (0 to disable timeout)
 */
async function setIdleTimeout(timeoutMs: number = 0) {
  const timeoutSeconds = Math.floor(timeoutMs / 1000);
  console.log(`Setting idle_in_transaction_session_timeout to ${timeoutSeconds} seconds (${timeoutMs}ms)`);
  
  try {
    // Execute raw SQL to set the timeout
    await prisma.$executeRaw`SET idle_in_transaction_session_timeout = ${timeoutSeconds * 1000};`;
    console.log(`Successfully set idle_in_transaction_session_timeout to ${timeoutSeconds} seconds`);
    
    // Verify the setting
    const result = await prisma.$queryRaw`SHOW idle_in_transaction_session_timeout;`;
    console.log('Current idle_in_transaction_session_timeout:', result);
    
    return true;
  } catch (error) {
    console.error('Failed to set idle_in_transaction_session_timeout:', error);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const timeoutMs = args.length > 0 ? parseInt(args[0], 10) : 0; // Default to 0 (disabled)
  
  console.log('=== IDLE TRANSACTION TIMEOUT CONFIGURATION ===');
  console.log('Database URL:', process.env.DATABASE_URL ? '(set)' : '(not set)');
  
  try {
    // Connect to the database
    console.log('Connecting to database...');
    await prisma.$connect();
    console.log('Connected to database successfully');
    
    // Set the timeout
    await setIdleTimeout(timeoutMs);
    
  } catch (error) {
    console.error('Failed to connect to database:', error);
  } finally {
    // Disconnect
    await prisma.$disconnect();
    console.log('Disconnected from database');
  }
}

// Run the main function
main()
  .catch(e => {
    console.error('Unhandled error:', e);
    process.exit(1);
  });
