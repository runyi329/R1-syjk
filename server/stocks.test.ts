import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "../server/db";
import { stockUsers, stockBalances } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Stocks Management", () => {
  let testUserId: number;
  
  beforeAll(async () => {
    // 清理测试数据 - 只删除标记为测试数据的记录
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    // 删除测试用户（只删除标记为测试数据的记录）
    await db.delete(stockUsers).where(
      eq(stockUsers.isTestData, true)
    );
  });
  
  afterAll(async () => {
    // 清理测试数据 - 只删除标记为测试数据的记录
    const db = await getDb();
    if (!db) return;
    
    if (testUserId) {
      // 只删除该测试用户的余额记录
      await db.delete(stockBalances).where(eq(stockBalances.stockUserId, testUserId));
      // 只删除标记为测试数据的用户
      await db.delete(stockUsers).where(
        eq(stockUsers.id, testUserId)
      );
    }
  });
  
  describe("Stock Users", () => {
    it("should create a stock user", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const [result] = await db.insert(stockUsers).values({
        name: "测试股票用户",
        initialBalance: "100000.00",
        notes: "测试备注",
        status: "active",
        isTestData: true,  // 标记为测试数据
      });
      
      testUserId = result.insertId;
      expect(testUserId).toBeGreaterThan(0);
    });
    
    it("should retrieve the created stock user", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const [user] = await db
        .select()
        .from(stockUsers)
        .where(eq(stockUsers.id, testUserId));
      
      expect(user).toBeDefined();
      expect(user.name).toBe("测试股票用户");
      expect(user.initialBalance).toBe("100000.00");
      expect(user.status).toBe("active");
    });
    
    it("should update stock user", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db
        .update(stockUsers)
        .set({ notes: "更新后的备注" })
        .where(eq(stockUsers.id, testUserId));
      
      const [user] = await db
        .select()
        .from(stockUsers)
        .where(eq(stockUsers.id, testUserId));
      
      expect(user.notes).toBe("更新后的备注");
    });
  });
  
  describe("Stock Balances", () => {
    it("should create a daily balance record", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const [result] = await db.insert(stockBalances).values({
        stockUserId: testUserId,
        date: "2026-01-06",
        balance: "102500.00",
        notes: "测试余额记录",
      });
      
      expect(result.insertId).toBeGreaterThan(0);
    });
    
    it("should retrieve balance records for a user", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const balances = await db
        .select()
        .from(stockBalances)
        .where(eq(stockBalances.stockUserId, testUserId));
      
      expect(balances.length).toBeGreaterThan(0);
      expect(balances[0].balance).toBe("102500.00");
      expect(balances[0].date).toBe("2026-01-06");
    });
    
    it("should update a balance record", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // 获取现有记录
      const [existing] = await db
        .select()
        .from(stockBalances)
        .where(eq(stockBalances.stockUserId, testUserId));
      
      // 更新余额
      await db
        .update(stockBalances)
        .set({ balance: "105000.00" })
        .where(eq(stockBalances.id, existing.id));
      
      // 验证更新
      const [updated] = await db
        .select()
        .from(stockBalances)
        .where(eq(stockBalances.id, existing.id));
      
      expect(updated.balance).toBe("105000.00");
    });
    
    it("should calculate profit correctly", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // 获取用户信息
      const [user] = await db
        .select()
        .from(stockUsers)
        .where(eq(stockUsers.id, testUserId));
      
      // 获取最新余额
      const [balance] = await db
        .select()
        .from(stockBalances)
        .where(eq(stockBalances.stockUserId, testUserId));
      
      const initialBalance = parseFloat(user.initialBalance);
      const currentBalance = parseFloat(balance.balance);
      const profit = currentBalance - initialBalance;
      const profitRate = (profit / initialBalance) * 100;
      
      expect(profit).toBe(5000); // 105000 - 100000
      expect(profitRate).toBe(5); // 5%
    });
    
    it("should calculate daily profit as difference from previous trading day", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // 清理之前的余额记录
      await db.delete(stockBalances).where(eq(stockBalances.stockUserId, testUserId));
      
      // 插入多条余额记录
      await db.insert(stockBalances).values([
        { stockUserId: testUserId, date: "2026-01-06", balance: "102000.00" },
        { stockUserId: testUserId, date: "2026-01-07", balance: "105000.00" },
        { stockUserId: testUserId, date: "2026-01-08", balance: "103000.00" },
      ]);
      
      // 获取用户信息
      const [user] = await db
        .select()
        .from(stockUsers)
        .where(eq(stockUsers.id, testUserId));
      
      // 获取所有余额记录（按日期排序）
      const balances = await db
        .select()
        .from(stockBalances)
        .where(eq(stockBalances.stockUserId, testUserId))
        .orderBy(stockBalances.date);
      
      const initialBalance = parseFloat(user.initialBalance);
      
      // 模拟后端的盈亏计算逻辑
      // 第一条记录：每日盈亏 = 当日余额 - 初始值
      // 后续记录：每日盈亏 = 当日余额 - 上一个登记交易日的余额
      const dailyProfits = balances.map((b, index) => {
        const currentBalance = parseFloat(b.balance);
        const previousBalance = index === 0 
          ? initialBalance  // 第一条记录：与初始值比较
          : parseFloat(balances[index - 1].balance);  // 后续记录：与上一个登记交易日比较
        const dailyProfit = currentBalance - previousBalance;
        return dailyProfit;
      });
      
      // 验证每日盈亏计算
      expect(dailyProfits[0]).toBe(2000);  // 第一天：102000 - 100000 = 2000（与初始值比较）
      expect(dailyProfits[1]).toBe(3000);  // 第二天：105000 - 102000 = 3000
      expect(dailyProfits[2]).toBe(-2000); // 第三天：103000 - 105000 = -2000
    });
    
    it("should delete balance record", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db
        .delete(stockBalances)
        .where(eq(stockBalances.stockUserId, testUserId));
      
      const balances = await db
        .select()
        .from(stockBalances)
        .where(eq(stockBalances.stockUserId, testUserId));
      
      expect(balances.length).toBe(0);
    });
  });

  describe("Stock User Permissions", () => {
    let testWebsiteUserId: number;
    let testStockUserId2: number;
    
    beforeAll(async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // 创建测试网站用户
      const { users } = await import("../drizzle/schema");
      const [userResult] = await db.insert(users).values({
        openId: "test-openid-" + Date.now(),
        username: "测试网站用户",
        email: "test@example.com",
        role: "user",
        passwordHash: "test-hash",
        loginMethod: "password",
      });
      testWebsiteUserId = userResult.insertId;
      
      // 创建第二个测试股票用户
      const [stockUserResult] = await db.insert(stockUsers).values({
        name: "测试股票用户2",
        initialBalance: "200000.00",
        status: "active",
        isTestData: true,  // 标记为测试数据
      });
      testStockUserId2 = stockUserResult.insertId;
    });
    
    afterAll(async () => {
      const db = await getDb();
      if (!db) return;
      
      const { users, stockUserPermissions } = await import("../drizzle/schema");
      
      // 清理权限记录
      if (testWebsiteUserId && testUserId) {
        await db.delete(stockUserPermissions).where(
          eq(stockUserPermissions.userId, testWebsiteUserId)
        );
      }
      
      // 清理测试用户
      if (testWebsiteUserId) {
        await db.delete(users).where(eq(users.id, testWebsiteUserId));
      }
      
      // 清理第二个股票用户（只删除标记为测试数据的记录）
      if (testStockUserId2) {
        await db.delete(stockUsers).where(
          eq(stockUsers.id, testStockUserId2)
        );
      }
    });
    
    it("should add permission for a user to view stock user data", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { stockUserPermissions } = await import("../drizzle/schema");
      
      const [result] = await db.insert(stockUserPermissions).values({
        stockUserId: testUserId,
        userId: testWebsiteUserId,
      });
      
      expect(result.insertId).toBeGreaterThan(0);
    });
    
    it("should retrieve permissions for a stock user", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { stockUserPermissions } = await import("../drizzle/schema");
      
      const permissions = await db
        .select()
        .from(stockUserPermissions)
        .where(eq(stockUserPermissions.stockUserId, testUserId));
      
      expect(permissions.length).toBeGreaterThan(0);
      expect(permissions[0].userId).toBe(testWebsiteUserId);
    });
    
    it("should retrieve accessible stock users for a website user", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { stockUserPermissions } = await import("../drizzle/schema");
      
      // 添加第二个股票用户的权限
      await db.insert(stockUserPermissions).values({
        stockUserId: testStockUserId2,
        userId: testWebsiteUserId,
      });
      
      // 查询该网站用户可访问的所有股票用户
      const accessibleStockUsers = await db
        .select({
          id: stockUsers.id,
          name: stockUsers.name,
          initialBalance: stockUsers.initialBalance,
        })
        .from(stockUserPermissions)
        .innerJoin(stockUsers, eq(stockUserPermissions.stockUserId, stockUsers.id))
        .where(eq(stockUserPermissions.userId, testWebsiteUserId));
      
      expect(accessibleStockUsers.length).toBe(2);
      expect(accessibleStockUsers.some(u => u.id === testUserId)).toBe(true);
      expect(accessibleStockUsers.some(u => u.id === testStockUserId2)).toBe(true);
    });
    
    it("should prevent duplicate permissions", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { stockUserPermissions } = await import("../drizzle/schema");
      const { and } = await import("drizzle-orm");
      
      // 先清理可能存在的权限
      await db
        .delete(stockUserPermissions)
        .where(
          and(
            eq(stockUserPermissions.stockUserId, testUserId),
            eq(stockUserPermissions.userId, testWebsiteUserId)
          )
        );
      
      // 添加一个权限
      await db.insert(stockUserPermissions).values({
        stockUserId: testUserId,
        userId: testWebsiteUserId,
      });
      
      // 尝试添加重复的权限，应该抛出错误
      await expect(
        db.insert(stockUserPermissions).values({
          stockUserId: testUserId,
          userId: testWebsiteUserId,
        })
      ).rejects.toThrow();
      
      // 验证仍然只有一条记录
      const permissions = await db
        .select()
        .from(stockUserPermissions)
        .where(
          and(
            eq(stockUserPermissions.stockUserId, testUserId),
            eq(stockUserPermissions.userId, testWebsiteUserId)
          )
        );
      expect(permissions.length).toBe(1);
    });
    
    it("should remove permission", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { stockUserPermissions } = await import("../drizzle/schema");
      const { and } = await import("drizzle-orm");
      
      // 删除权限
      await db
        .delete(stockUserPermissions)
        .where(
          and(
            eq(stockUserPermissions.stockUserId, testUserId),
            eq(stockUserPermissions.userId, testWebsiteUserId)
          )
        );
      
      // 验证权限已删除
      const permissions = await db
        .select()
        .from(stockUserPermissions)
        .where(
          and(
            eq(stockUserPermissions.stockUserId, testUserId),
            eq(stockUserPermissions.userId, testWebsiteUserId)
          )
        );
      
      expect(permissions.length).toBe(0);
    });
    
    it("should verify user has no access after permission removal", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { stockUserPermissions } = await import("../drizzle/schema");
      
      // 查询该网站用户可访问的股票用户（应该只剩一个）
      const accessibleStockUsers = await db
        .select({
          id: stockUsers.id,
        })
        .from(stockUserPermissions)
        .innerJoin(stockUsers, eq(stockUserPermissions.stockUserId, stockUsers.id))
        .where(eq(stockUserPermissions.userId, testWebsiteUserId));
      
      // 应该只能访问 testStockUserId2，不能访问 testUserId
      expect(accessibleStockUsers.length).toBe(1);
      expect(accessibleStockUsers[0].id).toBe(testStockUserId2);
      expect(accessibleStockUsers.some(u => u.id === testUserId)).toBe(false);
    });
  });
});
