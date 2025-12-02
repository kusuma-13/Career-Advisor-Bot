import { db } from '../src/db';
import { sql } from 'drizzle-orm';

async function pushSchema() {
  try {
    console.log('🚀 Pushing database schema...');
    
    // Create all tables
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS user (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        email_verified INTEGER NOT NULL DEFAULT 0,
        image TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS session (
        id TEXT PRIMARY KEY,
        expires_at INTEGER NOT NULL,
        token TEXT NOT NULL UNIQUE,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        user_id TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
      )
    `);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS account (
        id TEXT PRIMARY KEY,
        account_id TEXT NOT NULL,
        provider_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        access_token TEXT,
        refresh_token TEXT,
        id_token TEXT,
        access_token_expires_at INTEGER,
        refresh_token_expires_at INTEGER,
        scope TEXT,
        password TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
      )
    `);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS verification (
        id TEXT PRIMARY KEY,
        identifier TEXT NOT NULL,
        value TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        created_at INTEGER,
        updated_at INTEGER
      )
    `);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        experience_level TEXT NOT NULL,
        education TEXT NOT NULL,
        skills TEXT NOT NULL,
        interests TEXT NOT NULL,
        resume_url TEXT,
        resume_text TEXT,
        phone TEXT,
        location TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
      )
    `);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS job_applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        job_title TEXT NOT NULL,
        company TEXT NOT NULL,
        location TEXT NOT NULL,
        salary INTEGER NOT NULL,
        job_description TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Applied',
        applied_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
      )
    `);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS course_views (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        course_name TEXT NOT NULL,
        course_category TEXT NOT NULL,
        viewed_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
      )
    `);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS user_interactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        interaction_type TEXT NOT NULL,
        metadata TEXT,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
      )
    `);

    console.log('✅ Database schema pushed successfully!');
    console.log('📊 Tables created:');
    console.log('   - user');
    console.log('   - session');
    console.log('   - account');
    console.log('   - verification');
    console.log('   - profiles');
    console.log('   - job_applications');
    console.log('   - course_views');
    console.log('   - user_interactions');
  } catch (error) {
    console.error('❌ Error pushing schema:', error);
    process.exit(1);
  }
}

pushSchema();