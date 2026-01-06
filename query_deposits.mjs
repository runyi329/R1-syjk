import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './drizzle/schema.ts';

const pool = await mysql.createPool({
  host: process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'baccarat_house_edge',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const db = drizzle(pool, { schema });

try {
  const deposits = await db.select().from(schema.deposits);
  console.log('Current deposits with adminNotes:');
  deposits.forEach(d => {
    console.log(`ID: ${d.id}, Amount: ${d.amount}, AdminNotes: "${d.adminNotes}"`);
  });
} catch (error) {
  console.error('Error:', error);
} finally {
  await pool.end();
}
