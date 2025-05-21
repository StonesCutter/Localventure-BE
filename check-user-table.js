const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUserTable() {
  try {
    // Check if the user table exists
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user'
      ) as exists;
    `;
    
    console.log('User table exists:', tableExists[0].exists);
    
    if (tableExists[0].exists) {
      // Get all columns from the user table
      const columns = await prisma.$queryRaw`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'user';
      `;
      
      console.log('Columns in user table:');
      console.table(columns);
      
      // Check if join_date column exists
      const joinDateColumn = columns.find(col => col.column_name === 'join_date');
      console.log('join_date column exists:', !!joinDateColumn);
      
      if (joinDateColumn) {
        console.log('join_date column type:', joinDateColumn.data_type);
      }
    }
    
    // Check the role table since user has a role_id foreign key
    const roleTableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'role'
      ) as exists;
    `;
    
    console.log('Role table exists:', roleTableExists[0].exists);
    
  } catch (error) {
    console.error('Error checking user table:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserTable();
