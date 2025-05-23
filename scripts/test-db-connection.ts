import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create a new Prisma client instance
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

/**
 * Test a simple query
 */
async function testSimpleQuery() {
  console.log('Testing simple query...');
  try {
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('Simple query result:', result);
    return true;
  } catch (error) {
    console.error('Simple query failed:', error);
    return false;
  }
}

/**
 * Test a transaction that remains idle for a specified time
 */
async function testIdleTransaction(idleTimeMs: number = 310000) { // Just over 5 minutes by default
  console.log(`Testing idle transaction with ${idleTimeMs}ms idle time...`);
  
  try {
    // Start a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Execute initial query
      console.log('Starting transaction with initial query...');
      await tx.$queryRaw`SELECT 1 as start`;
      
      // Simulate idle time
      console.log(`Now waiting for ${idleTimeMs}ms to simulate idle transaction...`);
      await new Promise(resolve => setTimeout(resolve, idleTimeMs));
      
      // Try to execute a query after the idle time
      console.log('Executing query after idle period...');
      const result = await tx.$queryRaw`SELECT 2 as end`;
      
      return result;
    });
    
    console.log('Transaction completed successfully after idle period:', result);
    return true;
  } catch (error) {
    console.error('Transaction failed after idle period:', error);
    return false;
  }
}

/**
 * Test connection pooling behavior
 */
async function testConnectionPool(numConnections: number = 5) {
  console.log(`Testing connection pool with ${numConnections} simultaneous connections...`);
  
  const promises: Promise<boolean>[] = [];
  for (let i = 0; i < numConnections; i++) {
    promises.push(
      (async () => {
        try {
          const result = await prisma.$queryRaw`SELECT ${i} as connection_id`;
          console.log(`Connection ${i} succeeded:`, result);
          return true;
        } catch (error) {
          console.error(`Connection ${i} failed:`, error);
          return false;
        }
      })()
    );
  }
  
  const results = await Promise.all(promises);
  const successCount = results.filter(Boolean).length;
  console.log(`${successCount} of ${numConnections} connections succeeded`);
  return successCount === numConnections;
}

/**
 * Main function to run all tests
 */
async function main() {
  console.log('=== DATABASE CONNECTION TESTS ===');
  console.log('Database URL:', process.env.DATABASE_URL ? '(set)' : '(not set)');
  
  try {
    // Connect to the database
    console.log('Connecting to database...');
    await prisma.$connect();
    console.log('Connected to database successfully');
    
    // Run the tests
    await testSimpleQuery();
    
    // You can enable these tests by uncommenting
    // WARNING: The idle transaction test will block for over 5 minutes
    // console.log('\nRunning idle transaction test (this will take 5+ minutes)...');
    // await testIdleTransaction();
    
    console.log('\nRunning connection pool test...');
    await testConnectionPool();
    
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
