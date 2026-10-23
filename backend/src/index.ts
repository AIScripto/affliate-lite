import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import router from './routes';
import { pool } from './config/db';
import { initializeDatabase } from './db/init';
import { seedDatabase } from './db/seed';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Postback-Secret', 'X-Ref-Code']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Attach routes
app.use(router);

// Auto-bootstrap DB if empty
async function bootstrap() {
  try {
    console.log('🔍 Checking database readiness...');
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'clicks_traffic'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('⚡ Empty database detected. Auto-running schema initialization and seed...');
      await initializeDatabase();
      await seedDatabase();
    } else {
      console.log('✅ PostgreSQL database tables verified.');
    }
  } catch (error) {
    console.warn('⚠️ Auto-bootstrap warning (will retry on next request):', error);
  }
}

app.listen(PORT, async () => {
  console.log(`🚀 Affiliate Tracking Hub Backend listening on port ${PORT}`);
  console.log(`🔗 Inbound Redirect: http://localhost:${PORT}/go/:product_slug?ref=sub_ali_05`);
  console.log(`🔔 S2S Postback: http://localhost:${PORT}/api/v1/postback`);
  await bootstrap();
});

export default app;
