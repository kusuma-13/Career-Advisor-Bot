import 'dotenv/config';
import { db } from './db';
import { sql } from 'drizzle-orm';

async function testDatabaseConnection() {
  try {
    console.log('🔌 Testing database connection...');
    console.log('Using database URL:', process.env.TURSO_CONNECTION_URL?.substring(0, 30) + '...');
    
    // Test a simple query with correct SQL syntax
    const result = await db.select({ test: sql<number>`1` }).from(sql`sqlite_master`).limit(1);
    console.log('✅ Database connection successful!');
    console.log('Test query result:', result);
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error(error);
    return false;
  }
}

// Run the test
if (require.main === module) {
  testDatabaseConnection()
    .then(success => {
      if (success) {
        console.log('✅ All tests passed!');
        process.exit(0);
      } else {
        console.error('❌ Some tests failed');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Test failed with error:', error);
      process.exit(1);
    });
}

export { testDatabaseConnection };
