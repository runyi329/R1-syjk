import { describe, it, expect, beforeEach } from 'vitest';
import { appRouter } from '../../routers';
import * as db from '../../db';
import { eq } from 'drizzle-orm';
import { users } from '../../../drizzle/schema';

describe('用户角色修改功能测试', () => {
  let adminUserId: number;
  let testUserId: number;
  let adminCaller: any;

  beforeEach(async () => {
    const database = await db.getDb();
    if (!database) throw new Error('Database not available');

    // 清理测试数据
    await database.delete(users).where(eq(users.username, 'admin_test_role'));
    await database.delete(users).where(eq(users.username, 'user_test_role'));

    // 创建管理员账户
    await database.insert(users).values({
      openId: 'admin_test_role_openid',
      username: 'admin_test_role',
      name: 'Admin Test',
      passwordHash: db.hashPassword('admin123'),
      role: 'admin',
      accountStatus: 'active',
      usdtBalance: '0',
      registerMethod: 'password',
    });

    const adminResult = await database.select().from(users).where(eq(users.username, 'admin_test_role')).limit(1);
    adminUserId = adminResult[0].id;

    // 创建普通用户账户
    await database.insert(users).values({
      openId: 'user_test_role_openid',
      username: 'user_test_role',
      name: 'User Test',
      passwordHash: db.hashPassword('user123'),
      role: 'user',
      accountStatus: 'active',
      usdtBalance: '0',
      registerMethod: 'password',
    });

    const userResult = await database.select().from(users).where(eq(users.username, 'user_test_role')).limit(1);
    testUserId = userResult[0].id;

    // 创建管理员caller
    adminCaller = appRouter.createCaller({
      user: { id: adminUserId, role: 'admin' },
    });
  });

  it('管理员应该能够将普通用户提升为管理员', async () => {
    // 修改用户角色为admin
    const result = await adminCaller.users.updateUserRole({
      userId: testUserId,
      role: 'admin',
    });

    expect(result.success).toBe(true);

    // 验证数据库中的角色已更新
    const database = await db.getDb();
    if (!database) throw new Error('Database not available');
    
    const updatedUser = await database.select().from(users).where(eq(users.id, testUserId)).limit(1);
    expect(updatedUser[0].role).toBe('admin');
  });

  it('管理员应该能够将管理员降级为普通用户', async () => {
    // 先将用户提升为管理员
    await adminCaller.users.updateUserRole({
      userId: testUserId,
      role: 'admin',
    });

    // 再将管理员降级为普通用户
    const result = await adminCaller.users.updateUserRole({
      userId: testUserId,
      role: 'user',
    });

    expect(result.success).toBe(true);

    // 验证数据库中的角色已更新
    const database = await db.getDb();
    if (!database) throw new Error('Database not available');
    
    const updatedUser = await database.select().from(users).where(eq(users.id, testUserId)).limit(1);
    expect(updatedUser[0].role).toBe('user');
  });

  it('普通用户不应该能够修改角色', async () => {
    // 创建普通用户caller
    const userCaller = appRouter.createCaller({
      user: { id: testUserId, role: 'user' },
    });

    // 尝试修改角色应该失败
    await expect(
      userCaller.users.updateUserRole({
        userId: testUserId,
        role: 'admin',
      })
    ).rejects.toThrow();
  });

  it('未登录用户不应该能够修改角色', async () => {
    // 创建未登录caller
    const publicCaller = appRouter.createCaller({
      user: null,
    });

    // 尝试修改角色应该失败
    await expect(
      publicCaller.users.updateUserRole({
        userId: testUserId,
        role: 'admin',
      })
    ).rejects.toThrow();
  });

  it('不应该接受无效的角色值', async () => {
    // 尝试设置无效角色应该失败（通过TypeScript类型检查）
    // 这个测试主要验证Zod schema的验证
    await expect(
      adminCaller.users.updateUserRole({
        userId: testUserId,
        role: 'invalid_role' as any,
      })
    ).rejects.toThrow();
  });
});
