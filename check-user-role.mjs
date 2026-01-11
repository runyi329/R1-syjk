import { getDb } from './server/_core/db.ts';
import { users } from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';

const db = await getDb();
if (!db) {
  console.error('Database not available');
  process.exit(1);
}

const result = await db
  .select({
    id: users.id,
    username: users.username,
    role: users.role,
  })
  .from(users)
  .where(eq(users.username, 'runyi'));

console.log('User runyi info:', JSON.stringify(result, null, 2));
process.exit(0);
