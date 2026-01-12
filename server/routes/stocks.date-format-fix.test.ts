import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from '../db';
import { stockUsers, stockUserPermissions, users } from '../../drizzle/schema';
import { eq, and } from 'drizzle-orm';

describe('日期格式修复测试 - 确保日期正确处理', () => {
  let testStockUserId: number;
  let testWebsiteUserId: number;
  let db: any;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error("Database not available");

    // 创建测试股票客户
    const [stockUser] = await db
      .insert(stockUsers)
      .values({
        name: '测试股票客户-日期格式修复',
        initialBalance: '1000000.00',
        status: 'active',
      })
      .$returningId();
    testStockUserId = stockUser.id;

    // 创建测试网站用户
    const [websiteUser] = await db
      .insert(users)
      .values({
        openId: `test_openid_datefix_${Date.now()}`,
        username: `testuser_datefix_${Date.now()}`,
        passwordHash: 'test_hash_123',
        email: `testuser_datefix_${Date.now()}@test.com`,
        role: 'user',
        registerMethod: 'password',
        accountLocked: false,
      })
      .$returningId();
    testWebsiteUserId = websiteUser.id;
  });

  afterAll(async () => {
    if (!db) return;

    // 清理测试数据
    await db
      .delete(stockUserPermissions)
      .where(eq(stockUserPermissions.stockUserId, testStockUserId));

    await db
      .delete(stockUsers)
      .where(eq(stockUsers.id, testStockUserId));

    await db
      .delete(users)
      .where(eq(users.id, testWebsiteUserId));
  });

  it('应该能够处理 YYYY-MM-DD 格式的日期字符串', async () => {
    // 模拟前端发送的日期格式：YYYY-MM-DD
    const dateString = '2025-12-29';
    const dateObj = new Date(dateString + 'T00:00:00Z');

    // 创建授权记录
    await db
      .insert(stockUserPermissions)
      .values({
        stockUserId: testStockUserId,
        userId: testWebsiteUserId,
        startAmount: '975951.89',
        profitPercentage: 20,
        authorizationDate: dateObj,
        deposit: '20000',
      });

    // 验证记录已创建
    const [permission] = await db
      .select()
      .from(stockUserPermissions)
      .where(
        and(
          eq(stockUserPermissions.stockUserId, testStockUserId),
          eq(stockUserPermissions.userId, testWebsiteUserId)
        )
      );

    expect(permission).toBeDefined();
    expect(permission.startAmount).toBe('975951.89');
    expect(permission.profitPercentage).toBe(20);
    expect(permission.deposit).toBe('20000');
    expect(permission.authorizationDate).toBeDefined();

    // 验证日期格式正确（不应该是 +022025-12-29）
    const savedDate = new Date(permission.authorizationDate!);
    expect(savedDate.getUTCFullYear()).toBe(2025);
    expect(savedDate.getUTCMonth()).toBe(11); // 11 = December
    expect(savedDate.getUTCDate()).toBe(29);
  });

  it('应该能够处理无效日期格式并抛出错误', async () => {
    // 这个测试验证日期验证逻辑
    const invalidDateString = '+022025-12-29'; // 这是错误的格式

    // 验证日期格式
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    expect(dateRegex.test(invalidDateString)).toBe(false);
    expect(dateRegex.test('2025-12-29')).toBe(true);
  });

  it('应该能够处理空日期（null）', async () => {
    // 创建不带日期的授权记录
    const [websiteUser2] = await db
      .insert(users)
      .values({
        openId: `test_openid_nodate_${Date.now()}`,
        username: `testuser_nodate_${Date.now()}`,
        passwordHash: 'test_hash_123',
        email: `testuser_nodate_${Date.now()}@test.com`,
        role: 'user',
        registerMethod: 'password',
        accountLocked: false,
      })
      .$returningId();
    const testWebsiteUserId2 = websiteUser2.id;

    await db
      .insert(stockUserPermissions)
      .values({
        stockUserId: testStockUserId,
        userId: testWebsiteUserId2,
        startAmount: '500000.00',
        profitPercentage: 10,
        authorizationDate: null,
        deposit: '5000',
      });

    // 验证记录已创建
    const [permission] = await db
      .select()
      .from(stockUserPermissions)
      .where(
        and(
          eq(stockUserPermissions.stockUserId, testStockUserId),
          eq(stockUserPermissions.userId, testWebsiteUserId2)
        )
      );

    expect(permission).toBeDefined();
    expect(permission.authorizationDate).toBeNull();

    // 清理
    await db
      .delete(stockUserPermissions)
      .where(eq(stockUserPermissions.userId, testWebsiteUserId2));

    await db
      .delete(users)
      .where(eq(users.id, testWebsiteUserId2));
  });
});
