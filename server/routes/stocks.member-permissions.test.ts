import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { stocksRouter } from "./stocks";
import { getDb } from "../db";
import { users, stockUsers, stockUserPermissions } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import type { TrpcContext } from "../_core/context";

function createTestContext(userId: number, role: "admin" | "user"): TrpcContext {
  return {
    user: {
      id: userId,
      openId: `test-openid-${userId}`,
      email: `test${userId}@test.com`,
      name: `Test User ${userId}`,
      loginMethod: "password",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("会员授权管理功能测试", () => {
  let adminUserId: number;
  let testUser1Id: number;
  let testUser2Id: number;
  let stockUser1Id: number;
  let stockUser2Id: number;
  let stockUser3Id: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // 创建管理员用户
    const [adminResult] = await db.insert(users).values({
      openId: `test-openid-admin-${Date.now()}`,
      username: "test_admin_member_perms",
      passwordHash: "test-hash-123",
      email: "admin_member_perms@test.com",
      role: "admin",
      registerMethod: "password",
    });
    adminUserId = adminResult.insertId;

    // 创建测试网站用户１
    const [user1Result] = await db.insert(users).values({
      openId: `test-openid-member1-${Date.now()}`,
      username: "test_member_1",
      passwordHash: "test-hash-123",
      email: "member1@test.com",
      role: "user",
      registerMethod: "password",
    });
    testUser1Id = user1Result.insertId;

    // 创建测试网站用户２
    const [user2Result] = await db.insert(users).values({
      openId: `test-openid-member2-${Date.now()}`,
      username: "test_member_2",
      passwordHash: "test-hash-123",
      email: "member2@test.com",
      role: "user",
      registerMethod: "password",
    });
    testUser2Id = user2Result.insertId;

    // 创建测试股票用户1
    const [stock1Result] = await db.insert(stockUsers).values({
      name: "测试股票客户A",
      initialBalance: "100000",
      status: "active",
    });
    stockUser1Id = stock1Result.insertId;

    // 创建测试股票用户2
    const [stock2Result] = await db.insert(stockUsers).values({
      name: "测试股票客户B",
      initialBalance: "200000",
      status: "active",
    });
    stockUser2Id = stock2Result.insertId;

    // 创建测试股票用户3
    const [stock3Result] = await db.insert(stockUsers).values({
      name: "测试股票客户C",
      initialBalance: "300000",
      status: "active",
    });
    stockUser3Id = stock3Result.insertId;

    // 创建授权关系：会员1 -> 股票客户A和B
    await db.insert(stockUserPermissions).values([
      {
        stockUserId: stockUser1Id,
        userId: testUser1Id,
        startAmount: "100000",
        profitPercentage: 10,
        authorizationDate: new Date("2025-01-01"),
        deposit: "5000",
      },
      {
        stockUserId: stockUser2Id,
        userId: testUser1Id,
        startAmount: "200000",
        profitPercentage: 15,
        authorizationDate: new Date("2025-01-05"),
        deposit: "10000",
      },
    ]);

    // 创建授权关系：会员2 -> 股票客户C
    await db.insert(stockUserPermissions).values([
      {
        stockUserId: stockUser3Id,
        userId: testUser2Id,
        startAmount: "300000",
        profitPercentage: 20,
        authorizationDate: new Date("2025-01-10"),
        deposit: "15000",
      },
    ]);
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // 清理测试数据
    await db.delete(stockUserPermissions).where(eq(stockUserPermissions.userId, testUser1Id));
    await db.delete(stockUserPermissions).where(eq(stockUserPermissions.userId, testUser2Id));
    await db.delete(stockUsers).where(eq(stockUsers.id, stockUser1Id));
    await db.delete(stockUsers).where(eq(stockUsers.id, stockUser2Id));
    await db.delete(stockUsers).where(eq(stockUsers.id, stockUser3Id));
    await db.delete(users).where(eq(users.id, testUser1Id));
    await db.delete(users).where(eq(users.id, testUser2Id));
    await db.delete(users).where(eq(users.id, adminUserId));
  });

  it("应该成功获取所有会员的授权列表", async () => {
    const ctx = createTestContext(adminUserId, "admin");
    const caller = stocksRouter.createCaller(ctx);

    const result = await caller.getMemberPermissions();

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(2);

    // 查找测试会员1
    const member1 = result.find((m) => m.userId === testUser1Id);
    expect(member1).toBeDefined();
    expect(member1?.username).toBe("test_member_1");
    expect(member1?.email).toBe("member1@test.com");
    expect(member1?.authorizedStockUsers.length).toBe(2);

    // 验证会员1的授权详情
    const auth1 = member1?.authorizedStockUsers.find((a) => a.stockUserId === stockUser1Id);
    expect(auth1).toBeDefined();
    expect(auth1?.stockUserName).toBe("测试股票客户A");
    expect(auth1?.startAmount).toBe("100000.00");
    expect(auth1?.profitPercentage).toBe(10);
    expect(auth1?.deposit).toBe("5000.00");

    const auth2 = member1?.authorizedStockUsers.find((a) => a.stockUserId === stockUser2Id);
    expect(auth2).toBeDefined();
    expect(auth2?.stockUserName).toBe("测试股票客户B");
    expect(auth2?.startAmount).toBe("200000.00");
    expect(auth2?.profitPercentage).toBe(15);
    expect(auth2?.deposit).toBe("10000.00");

    // 查找测试会员2
    const member2 = result.find((m) => m.userId === testUser2Id);
    expect(member2).toBeDefined();
    expect(member2?.username).toBe("test_member_2");
    expect(member2?.email).toBe("member2@test.com");
    expect(member2?.authorizedStockUsers.length).toBe(1);

    // 验证会员2的授权详情
    const auth3 = member2?.authorizedStockUsers.find((a) => a.stockUserId === stockUser3Id);
    expect(auth3).toBeDefined();
    expect(auth3?.stockUserName).toBe("测试股票客户C");
    expect(auth3?.startAmount).toBe("300000.00");
    expect(auth3?.profitPercentage).toBe(20);
    expect(auth3?.deposit).toBe("15000.00");
  });

  it("应该按用户名排序会员列表", async () => {
    const ctx = createTestContext(adminUserId, "admin");
    const caller = stocksRouter.createCaller(ctx);

    const result = await caller.getMemberPermissions();

    // 找到我们的测试用户
    const testMembers = result.filter(
      (m) => m.userId === testUser1Id || m.userId === testUser2Id
    );

    expect(testMembers.length).toBe(2);

    // 验证按用户名排序（test_member_1 应该在 test_member_2 前面）
    const member1Index = result.findIndex((m) => m.userId === testUser1Id);
    const member2Index = result.findIndex((m) => m.userId === testUser2Id);
    expect(member1Index).toBeLessThan(member2Index);
  });

  it("应该正确处理授权日期", async () => {
    const ctx = createTestContext(adminUserId, "admin");
    const caller = stocksRouter.createCaller(ctx);

    const result = await caller.getMemberPermissions();
    const member1 = result.find((m) => m.userId === testUser1Id);

    expect(member1).toBeDefined();
    const auth1 = member1?.authorizedStockUsers.find((a) => a.stockUserId === stockUser1Id);
    expect(auth1?.authorizationDate).toBeInstanceOf(Date);
    expect(auth1?.authorizationDate?.toISOString().split("T")[0]).toBe("2025-01-01");
  });

  it("没有授权的会员不应该出现在列表中", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // 创建一个没有授权的会员
    const [noAuthUserResult] = await db.insert(users).values({
      openId: `test-openid-noauth-${Date.now()}`,
      username: "test_no_auth_member",
      passwordHash: "test-hash-123",
      email: "noauth@test.com",
      role: "user",
      registerMethod: "password",
    });
    const noAuthUserId = noAuthUserResult.insertId;

    const ctx = createTestContext(adminUserId, "admin");
    const caller = stocksRouter.createCaller(ctx);

    const result = await caller.getMemberPermissions();
    const noAuthMember = result.find((m) => m.userId === noAuthUserId);

    expect(noAuthMember).toBeUndefined();

    // 清理测试数据
    await db.delete(users).where(eq(users.id, noAuthUserId));
  });
});
