import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'test_generator_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
};

// Create connection pool
export const pool = new Pool(dbConfig);

// Test database connection
export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Initialize database tables
export async function initializeDatabase(): Promise<void> {
  const client = await pool.connect();
  
  try {
    // Create test_cases table
    await client.query(`
      CREATE TABLE IF NOT EXISTS test_cases (
        id SERIAL PRIMARY KEY,
        test_case_id VARCHAR(100) UNIQUE NOT NULL,
        title VARCHAR(500) NOT NULL,
        description TEXT NOT NULL,
        type VARCHAR(50) NOT NULL,
        priority VARCHAR(20) NOT NULL,
        steps JSONB NOT NULL,
        expected_result TEXT NOT NULL,
        playwright_code TEXT,
        website_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create test_executions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS test_executions (
        id SERIAL PRIMARY KEY,
        test_case_id VARCHAR(100) NOT NULL,
        status VARCHAR(20) NOT NULL,
        execution_time INTEGER NOT NULL,
        error_message TEXT,
        results JSONB,
        executed_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create flaky_tests table
    await client.query(`
      CREATE TABLE IF NOT EXISTS flaky_tests (
        id SERIAL PRIMARY KEY,
        test_case_id VARCHAR(100) UNIQUE NOT NULL,
        flakiness_score DOUBLE PRECISION NOT NULL,
        timing_variance DOUBLE PRECISION NOT NULL,
        failure_rate DOUBLE PRECISION NOT NULL,
        total_runs INTEGER NOT NULL,
        failed_runs INTEGER NOT NULL,
        root_causes JSONB NOT NULL,
        last_failed_at TIMESTAMP,
        is_resolved BOOLEAN DEFAULT FALSE,
        detected_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Add is_resolved column if it doesn't exist (for existing databases)
    await client.query(`
      ALTER TABLE flaky_tests 
      ADD COLUMN IF NOT EXISTS is_resolved BOOLEAN DEFAULT FALSE
    `);

    console.log('✅ Database tables initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Graceful shutdown
export async function closeDatabase(): Promise<void> {
  await pool.end();
  console.log('✅ Database connection pool closed');
}

// Handle process termination
process.on('SIGINT', async () => {
  await closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeDatabase();
  process.exit(0);
});