// db.ts
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';

// Validate required environment variables
const requiredEnvVars = {
  TURSO_CONNECTION_URL: process.env.TURSO_CONNECTION_URL,
  TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN,
  NODE_ENV: process.env.NODE_ENV
};

// Check for missing required environment variables
for (const [key, value] of Object.entries(requiredEnvVars)) {
  if (!value && key !== 'TURSO_AUTH_TOKEN') {
    throw new Error(`${key} environment variable is not set`);
  }
}

// Initialize the SQLite client
const client = createClient({
  url: requiredEnvVars.TURSO_CONNECTION_URL!,
  authToken: requiredEnvVars.TURSO_AUTH_TOKEN,
  // Enable better error messages in development
  fetch: (url: string, options?: RequestInit) => {
    if (requiredEnvVars.NODE_ENV !== 'production') {
      console.log('Database request:', { url, method: options?.method });
    }
    return fetch(url, options);
  },
});

// Create the database instance
const db = drizzle(client, { 
  schema,
  logger: requiredEnvVars.NODE_ENV !== 'production',
});

// Export types
export type Database = typeof db;
export type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

// Test the database connection on startup
async function testConnection() {
  try {
    await client.execute('SELECT 1 as test');
    console.log('✅ Database connection successful');
  } catch (error) {
    console.error('❌ Failed to connect to the database:');
    console.error(error);
    process.exit(1);
  }
}

// Only test connection in development or when explicitly enabled
if (requiredEnvVars.NODE_ENV !== 'test' && !process.env.SKIP_DB_CONNECTION_TEST) {
  testConnection().catch(console.error);
}

// Helper function to safely execute database operations with error handling
export async function withDatabase<T>(
  operation: (db: Database) => Promise<T>,
  errorMessage = 'Database operation failed'
): Promise<T> {
  try {
    return await operation(db);
  } catch (error) {
    console.error(errorMessage, error);
    throw new Error(
      `${errorMessage}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// Export the db instance as default
export { db };