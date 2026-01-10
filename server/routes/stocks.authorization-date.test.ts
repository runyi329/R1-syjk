import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from '../db';
import { stockUsers, stockUserPermissions, users } from '../../drizzle/schema';
import { eq, and } from 'drizzle-orm';

describe('股票客户授权日期功能测试', () => {
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
        name: '测试股票客户-授权日期',
        initialBalance: '1000000.00',
        status: 'active',
      })
      .$returningId();
    testStockUserId = stockUser.id;

    // 创建测试网站用户
    const [websiteUser] = await db
      .insert(users)
      .values({
        openId: 'test_openid_authdate',
        username: 'testuser_authdate',
        passwordHash: 'test_hash_123',
        email: 'testuser_authdate@test.com',
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

  it('应该能够创建带授权日期的权限记录', async () => {
    const authDate = new Date('2025-01-10T00:00:00Z');
    
    // 创建授权记录
    await db
      .insert(stockUserPermissions)
      .values({
        stockUserId: testStockUserId,
        userId: testWebsiteUserId,
        startAmount: '500000.00',
        profitPercentage: 10,
        authorizationDate: authDate,
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
    expect(permission.profitPercentage).toBe(10);
    expect(permission.authorizationDate).toBeDefined();
    
    // 验证日期格式正确（使用UTC避免时区问题）
    const savedDate = new Date(permission.authorizationDate!);
    expect(savedDate.getUTCFullYear()).toBe(2025);
    expect(savedDate.getUTCMonth()).toBe(0); // 0 = January
    expect(savedDate.getUTCDate()).toBe(10);
  });

  it('应该能够创建不带授权日期的权限记录', async () => {
    // 先删除之前的测试记录
    await db
      .delete(stockUserPermissions)
      .where(
        and(
          eq(stockUserPermissions.stockUserId, testStockUserId),
          eq(stockUserPermissions.userId, testWebsiteUserId)
        )
      );

    // 创建不带授权日期的记录
    await db
      .insert(stockUserPermissions)
      .values({
        stockUserId: testStockUserId,
        userId: testWebsiteUserId,
        startAmount: '500000.00',
        profitPercentage: 15,
        authorizationDate: null,
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
    expect(permission.profitPercentage).toBe(15);
    expect(permission.authorizationDate).toBeNull();
  });

  it('应该能够更新授权日期', async () => {
    const newAuthDate = new Date('2025-02-15T00:00:00Z');

    // 更新授权日期
    await db
      .update(stockUserPermissions)
      .set({ authorizationDate: newAuthDate })
      .where(
        and(
          eq(stockUserPermissions.stockUserId, testStockUserId),
          eq(stockUserPermissions.userId, testWebsiteUserId)
        )
      );

    // 验证更新成功
    const [permission] = await db
      .select()
      .from(stockUserPermissions)
      .where(
        and(
          eq(stockUserPermissions.stockUserId, testStockUserId),
          eq(stockUserPermissions.userId, testWebsiteUserId)
        )
      );

    expect(permission.authorizationDate).toBeDefined();
    const savedDate = new Date(permission.authorizationDate!);
    expect(savedDate.getUTCFullYear()).toBe(2025);
    expect(savedDate.getUTCMonth()).toBe(1); // 1 = February
    expect(savedDate.getUTCDate()).toBe(15);
  });

  it('授权日期应该在查询结果中正确返回', async () => {
    // 查询权限记录
    const [permission] = await db
      .select({
        id: stockUserPermissions.id,
        stockUserId: stockUserPermissions.stockUserId,
        userId: stockUserPermissions.userId,
        startAmount: stockUserPermissions.startAmount,
        profitPercentage: stockUserPermissions.profitPercentage,
        authorizationDate: stockUserPermissions.authorizationDate,
      })
      .from(stockUserPermissions)
      .where(
        and(
          eq(stockUserPermissions.stockUserId, testStockUserId),
          eq(stockUserPermissions.userId, testWebsiteUserId)
        )
      );

    expect(permission).toBeDefined();
    expect(permission.authorizationDate).toBeDefined();
    expect(permission.profitPercentage).toBe(15);
    
    // 验证日期可以被正确格式化
    const savedDate = new Date(permission.authorizationDate!);
    expect(savedDate.getUTCFullYear()).toBe(2025);
    expect(savedDate.getUTCMonth()).toBe(1); // 1 = February
    expect(savedDate.getUTCDate()).toBe(15);
  });
});
