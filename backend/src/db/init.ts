import fs from 'fs';
import path from 'path';
import { pool } from '../config/db';

export async function initializeDatabase() {
  console.log('⚡ Initializing Database Schema...');
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(schemaSql);
    await client.query('COMMIT');
    console.log('✅ Database schema initialized successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Failed to initialize database schema:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  initializeDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
