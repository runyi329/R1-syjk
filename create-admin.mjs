import { getDb, hashPassword } from './server/db.ts';
import { users } from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';

async function createAdmin() {
  try {
    const db = await getDb();
    if (!db) {
      console.error('❌ 数据库连接失败');
      process.exit(1);
    }

    // 检查是否已存在该用户
    const existingUser = await db.select().from(users).where(eq(users.username, 'runyi')).limit(1);

    if (existingUser.length > 0) {
      console.log('⚠️  管理员账户已存在，跳过创建');
      process.exit(0);
    }

    // 创建管理员账户
    const passwordHash = hashPassword('831118');
    
    const result = await db.insert(users).values({
      openId: `admin-${Date.now()}`,
      username: 'runyi',
      passwordHash: passwordHash,
      name: 'runyi',
      email: 'admin@runyi.com',
      role: 'admin',
      registerMethod: 'password',
      usdtBalance: '0.00000000',
      accountStatus: 'active',
    });

    console.log('✅ 管理员账户创建成功');
    console.log('用户名: runyi');
    console.log('密码: 831118');
    console.log('角色: admin');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 创建管理员账户失败:', error);
    process.exit(1);
  }
}

createAdmin();
