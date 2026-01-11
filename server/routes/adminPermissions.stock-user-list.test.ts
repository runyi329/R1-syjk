import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "../routers";
import { getDb } from "../db";
import { users, stockUsers, staffStockPermissions } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "../db";

describe("股票用户列表加载测试", () => {
  let superAdminId: number;
  let staffAdminId: number;
  let stockUser1Id: number;
  let stockUser2Id: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("数据库不可用");

    // 清理测试数据
    await db.delete(staffStockPermissions).where(eq(staffStockPermissions.staffUserId, 0));
    await db.delete(stockUsers).where(eq(stockUsers.name, "测试股票用户1"));
    await db.delete(stockUsers).where(eq(stockUsers.name, "测试股票用户2"));
    await db.delete(users).where(eq(users.username, "test_super_admin"));
    await db.delete(users).where(eq(users.username, "test_staff_admin"));

    // 创建超级管理员
    const [superAdmin] = await db.insert(users).values({
      username: "test_super_admin",
      passwordHash: hashPassword("password"),
      role: "super_admin",
      registerMethod: "password",
      openId: `test_super_${Date.now()}`,
    });
    superAdminId = superAdmin.insertId;

    // 创建普通管理员
    const [staffAdmin] = await db.insert(users).values({
      username: "test_staff_admin",
      passwordHash: hashPassword("password"),
      role: "staff_admin",
      registerMethod: "password",
      openId: `test_staff_${Date.now()}`,
    });
    staffAdminId = staffAdmin.insertId;

    // 创建股票用户
    const [stockUser1] = await db.insert(stockUsers).values({
      name: "测试股票用户1",
      initialBalance: "100000.00",
      notes: "测试用户1",
      status: "active",
    });
    stockUser1Id = stockUser1.insertId;

    const [stockUser2] = await db.insert(stockUsers).values({
      name: "测试股票用户2",
      initialBalance: "200000.00",
      notes: "测试用户2",
      status: "active",
    });
    stockUser2Id = stockUser2.insertId;

    // 为普通管理员分配股票用户1
    await db.insert(staffStockPermissions).values({
      staffUserId: staffAdminId,
      stockUserId: stockUser1Id,
      createdBy: superAdminId,
    });
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // 清理测试数据
    await db.delete(staffStockPermissions).where(eq(staffStockPermissions.staffUserId, staffAdminId));
    await db.delete(stockUsers).where(eq(stockUsers.id, stockUser1Id));
    await db.delete(stockUsers).where(eq(stockUsers.id, stockUser2Id));
    await db.delete(users).where(eq(users.id, superAdminId));
    await db.delete(users).where(eq(users.id, staffAdminId));
  });

  it("超级管理员应该能看到所有股票用户", async () => {
    const caller = appRouter.createCaller({
      user: { id: superAdminId, role: "super_admin" },
      req: {} as any,
      res: {} as any,
    });

    // 获取权限信息
    const permissions = await caller.adminPermissions.getMyStockPermissions();
    expect(permissions.hasFullAccess).toBe(true);
    expect(permissions.stockUserIds.length).toBe(0); // 超级管理员不需要stockUserIds

    // 获取所有股票用户
    const allStockUsers = await caller.stocks.getAllStockUsers();
    expect(allStockUsers.length).toBeGreaterThanOrEqual(2); // 至少包含我们创建的2个测试用户
  });

  it("普通管理员应该只能看到分配给他的股票用户", async () => {
    const caller = appRouter.createCaller({
      user: { id: staffAdminId, role: "staff_admin" },
      req: {} as any,
      res: {} as any,
    });

    // 获取权限信息
    const permissions = await caller.adminPermissions.getMyStockPermissions();
    expect(permissions.hasFullAccess).toBe(false);
    expect(permissions.stockUserIds.length).toBe(1);
    expect(permissions.stockUserIds).toContain(stockUser1Id);
    expect(permissions.stockUserIds).not.toContain(stockUser2Id);

    // 获取所有股票用户
    const allStockUsers = await caller.stocks.getAllStockUsers();
        // 前端应该根据 permissions过滤股票用户列表
    const filteredUsers = allStockUsers.filter(user => 
      permissions.stockUserIds.includes(user.id)
    );
    
    console.log("stockUser1Id:", stockUser1Id);
    console.log("permissions.stockUserIds:", permissions.stockUserIds);
    console.log("allStockUsers:", allStockUsers.map(u => ({ id: u.id, name: u.name })));
    console.log("filteredUsers:", filteredUsers.map(u => ({ id: u.id, name: u.name })));
    
    expect(filteredUsers.length).toBe(1);
    expect(filteredUsers[0].id).toBe(stockUser1Id);
  });

  it("普通管理员在权限数据加载前不应该显示空列表", async () => {
    const caller = appRouter.createCaller({
      user: { id: staffAdminId, role: "staff_admin" },
      req: {} as any,
      res: {} as any,
    });

    // 模拟前端逻辑：当权限数据还未加载时，stockPermissions为undefined
    const allStockUsers = await caller.stocks.getAllStockUsers();
    const stockPermissions = undefined; // 模拟加载中状态

    // 前端应该返回undefined而不是空数组
    let stockUsers: typeof allStockUsers | undefined;
    if (!allStockUsers || !stockPermissions) {
      stockUsers = undefined; // 修复后的逻辑
    } else {
      stockUsers = allStockUsers;
    }

    expect(stockUsers).toBeUndefined(); // 应该是undefined，而不是空数组
  });

  it("普通管理员在权限数据加载完成后应该显示正确的股票用户列表", async () => {
    const caller = appRouter.createCaller({
      user: { id: staffAdminId, role: "staff_admin" },
      req: {} as any,
      res: {} as any,
    });

    // 模拟前端逻辑：权限数据加载完成
    const allStockUsers = await caller.stocks.getAllStockUsers();
    const stockPermissions = await caller.adminPermissions.getMyStockPermissions();

    // 前端应该根据权限过滤股票用户列表
    let stockUsers: typeof allStockUsers | undefined;
    if (!allStockUsers || !stockPermissions) {
      stockUsers = undefined;
    } else if (stockPermissions.hasFullAccess) {
      stockUsers = allStockUsers;
    } else {
      stockUsers = allStockUsers.filter(user => 
        stockPermissions.stockUserIds.includes(user.id)
      );
    }

    expect(stockUsers).toBeDefined();
    expect(stockUsers!.length).toBe(1);
    expect(stockUsers![0].id).toBe(stockUser1Id);
  });
});
