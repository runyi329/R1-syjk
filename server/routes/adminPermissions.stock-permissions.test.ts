import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "../routers";
import { getDb } from "../db";
import { users, stockUsers, staffStockPermissions, adminPermissions } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "../db";

describe("员工股票权限管理API测试", () => {
  let superAdminId: number;
  let staffAdminId: number;
  let stockUser1Id: number;
  let stockUser2Id: number;
  let stockUser3Id: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // 清理测试数据
    await db.delete(staffStockPermissions);
    await db.delete(stockUsers);
    await db.delete(adminPermissions);
    await db.delete(users).where(eq(users.username, "test_super_admin"));
    await db.delete(users).where(eq(users.username, "test_staff_admin"));

    // 创建超级管理员
    const [superAdmin] = await db.insert(users).values({
      username: "test_super_admin",
      passwordHash: hashPassword("password123"),
      role: "super_admin",
      registerMethod: "password",
      openId: `test_super_${Date.now()}`,
    });
    superAdminId = superAdmin.insertId;

    // 创建普通管理员
    const [staffAdmin] = await db.insert(users).values({
      username: "test_staff_admin",
      passwordHash: hashPassword("password123"),
      role: "staff_admin",
      registerMethod: "password",
      openId: `test_staff_${Date.now()}`,
    });
    staffAdminId = staffAdmin.insertId;

    // 创建权限配置
    await db.insert(adminPermissions).values({
      userId: staffAdminId,
      balanceManagement: false,
      userManagement: false,
      permissionManagement: false,
      memberManagement: false,
      staffManagement: false,
      status: "active",
      createdBy: superAdminId,
    });

    // 创建3个股票用户
    const [stock1] = await db.insert(stockUsers).values({
      name: "测试股票用户1",
      initialBalance: "100000.00",
      notes: "测试用户1",
      status: "active",
    });
    stockUser1Id = stock1.insertId;

    const [stock2] = await db.insert(stockUsers).values({
      name: "测试股票用户2",
      initialBalance: "200000.00",
      notes: "测试用户2",
      status: "active",
    });
    stockUser2Id = stock2.insertId;

    const [stock3] = await db.insert(stockUsers).values({
      name: "测试股票用户3",
      initialBalance: "300000.00",
      notes: "测试用户3",
      status: "active",
    });
    stockUser3Id = stock3.insertId;
  });

  it("超级管理员可以为员工分配股票权限", async () => {
    const caller = appRouter.createCaller({
      user: { id: superAdminId, role: "super_admin" },
      req: {} as any,
      res: {} as any,
    });

    const result = await caller.adminPermissions.assignStockToStaff({
      staffUserId: staffAdminId,
      stockUserIds: [stockUser1Id, stockUser2Id],
    });

    expect(result.success).toBe(true);
    expect(result.message).toBe("股票权限分配成功");
  });

  it("超级管理员可以查询员工的股票权限", async () => {
    const caller = appRouter.createCaller({
      user: { id: superAdminId, role: "super_admin" },
      req: {} as any,
      res: {} as any,
    });

    const permissions = await caller.adminPermissions.getStaffStockPermissions({
      staffUserId: staffAdminId,
    });

    expect(permissions.length).toBe(2);
    expect(permissions.map((p) => p.stockUserId)).toContain(stockUser1Id);
    expect(permissions.map((p) => p.stockUserId)).toContain(stockUser2Id);
  });

  it("超级管理员可以修改员工的股票权限", async () => {
    const caller = appRouter.createCaller({
      user: { id: superAdminId, role: "super_admin" },
      req: {} as any,
      res: {} as any,
    });

    // 修改权限：移除stockUser1，添加stockUser3
    const result = await caller.adminPermissions.assignStockToStaff({
      staffUserId: staffAdminId,
      stockUserIds: [stockUser2Id, stockUser3Id],
    });

    expect(result.success).toBe(true);

    // 验证修改结果
    const permissions = await caller.adminPermissions.getStaffStockPermissions({
      staffUserId: staffAdminId,
    });

    expect(permissions.length).toBe(2);
    expect(permissions.map((p) => p.stockUserId)).toContain(stockUser2Id);
    expect(permissions.map((p) => p.stockUserId)).toContain(stockUser3Id);
    expect(permissions.map((p) => p.stockUserId)).not.toContain(stockUser1Id);
  });

  it("员工可以查询自己的股票权限", async () => {
    const caller = appRouter.createCaller({
      user: { id: staffAdminId, role: "staff_admin" },
      req: {} as any,
      res: {} as any,
    });

    const permissions = await caller.adminPermissions.getMyStockPermissions();

    expect(permissions.hasFullAccess).toBe(false);
    expect(permissions.stockUserIds.length).toBe(2);
    expect(permissions.stockUserIds).toContain(stockUser2Id);
    expect(permissions.stockUserIds).toContain(stockUser3Id);
  });

  it("超级管理员查询自己的权限时应返回完全访问权限", async () => {
    const caller = appRouter.createCaller({
      user: { id: superAdminId, role: "super_admin" },
      req: {} as any,
      res: {} as any,
    });

    const permissions = await caller.adminPermissions.getMyStockPermissions();

    expect(permissions.hasFullAccess).toBe(true);
    expect(permissions.stockUserIds.length).toBe(0);
  });

  it("超级管理员可以清空员工的所有股票权限", async () => {
    const caller = appRouter.createCaller({
      user: { id: superAdminId, role: "super_admin" },
      req: {} as any,
      res: {} as any,
    });

    // 清空权限
    const result = await caller.adminPermissions.assignStockToStaff({
      staffUserId: staffAdminId,
      stockUserIds: [],
    });

    expect(result.success).toBe(true);

    // 验证清空结果
    const permissions = await caller.adminPermissions.getStaffStockPermissions({
      staffUserId: staffAdminId,
    });

    expect(permissions.length).toBe(0);
  });
});
