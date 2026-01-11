import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "../../db";
import { users, adminPermissions } from "../../../drizzle/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "../../db";

describe("Admin Permissions API", () => {
  let superAdminId: number;
  let staffAdminId: number;
  let testUsername: string;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // 创建超级管理员测试账户
    testUsername = `test_super_${Date.now()}`;
    const [result] = await db.insert(users).values({
      username: testUsername,
      passwordHash: hashPassword("test123"),
      role: "super_admin",
      registerMethod: "password",
      openId: `test_${Date.now()}`,
    });
    superAdminId = result.insertId;
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // 清理测试数据
    if (staffAdminId) {
      await db.delete(adminPermissions).where(eq(adminPermissions.userId, staffAdminId));
      await db.delete(users).where(eq(users.id, staffAdminId));
    }
    if (superAdminId) {
      await db.delete(users).where(eq(users.id, superAdminId));
    }
  });

  it("应该能创建普通管理员账户", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const staffUsername = `test_staff_${Date.now()}`;
    const staffPassword = hashPassword("staff123");

    // 创建普通管理员
    const [result] = await db.insert(users).values({
      username: staffUsername,
      passwordHash: staffPassword,
      role: "staff_admin",
      registerMethod: "password",
      openId: `staff_${Date.now()}`,
    });
    staffAdminId = result.insertId;

    // 创建权限配置
    await db.insert(adminPermissions).values({
      userId: staffAdminId,
      balanceManagement: true,
      userManagement: false,
      permissionManagement: false,
      memberManagement: false,
      staffManagement: false,
      status: "active",
      createdBy: superAdminId,
    });

    // 验证用户创建成功
    const [user] = await db.select().from(users).where(eq(users.id, staffAdminId));
    expect(user).toBeDefined();
    expect(user.role).toBe("staff_admin");
    expect(user.username).toBe(staffUsername);

    // 验证权限配置创建成功
    const [perms] = await db.select().from(adminPermissions).where(eq(adminPermissions.userId, staffAdminId));
    expect(perms).toBeDefined();
    expect(perms.balanceManagement).toBe(true);
    expect(perms.userManagement).toBe(false);
    expect(perms.staffManagement).toBe(false);
  });

  it("应该能查询普通管理员列表", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // 查询所有普通管理员
    const staffList = await db
      .select({
        id: users.id,
        username: users.username,
        role: users.role,
        permissions: adminPermissions,
      })
      .from(users)
      .leftJoin(adminPermissions, eq(users.id, adminPermissions.userId))
      .where(eq(users.role, "staff_admin"));

    expect(staffList.length).toBeGreaterThan(0);
    const staff = staffList.find((s) => s.id === staffAdminId);
    expect(staff).toBeDefined();
    expect(staff?.permissions?.balanceManagement).toBe(true);
  });

  it("应该能更新普通管理员权限", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // 更新权限
    await db
      .update(adminPermissions)
      .set({
        balanceManagement: true,
        userManagement: true,
        permissionManagement: false,
        memberManagement: false,
      })
      .where(eq(adminPermissions.userId, staffAdminId));

    // 验证权限更新成功
    const [perms] = await db.select().from(adminPermissions).where(eq(adminPermissions.userId, staffAdminId));
    expect(perms.balanceManagement).toBe(true);
    expect(perms.userManagement).toBe(true);
    expect(perms.permissionManagement).toBe(false);
  });

  it("应该能禁用普通管理员账户", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // 禁用账户
    await db
      .update(adminPermissions)
      .set({ status: "disabled" })
      .where(eq(adminPermissions.userId, staffAdminId));

    // 验证账户已禁用
    const [perms] = await db.select().from(adminPermissions).where(eq(adminPermissions.userId, staffAdminId));
    expect(perms.status).toBe("disabled");
  });

  it("应该能启用普通管理员账户", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // 启用账户
    await db
      .update(adminPermissions)
      .set({ status: "active" })
      .where(eq(adminPermissions.userId, staffAdminId));

    // 验证账户已启用
    const [perms] = await db.select().from(adminPermissions).where(eq(adminPermissions.userId, staffAdminId));
    expect(perms.status).toBe("active");
  });

  it("超级管理员应该拥有所有权限", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [user] = await db.select().from(users).where(eq(users.id, superAdminId));
    expect(user.role).toBe("super_admin");

    // 超级管理员不需要在adminPermissions表中有记录
    // 他们默认拥有所有权限
  });

  it("普通管理员应该只有分配的权限", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [perms] = await db.select().from(adminPermissions).where(eq(adminPermissions.userId, staffAdminId));
    
    // 验证只有分配的权限为true
    expect(perms.balanceManagement).toBe(true);
    expect(perms.userManagement).toBe(true);
    expect(perms.permissionManagement).toBe(false);
    expect(perms.memberManagement).toBe(false);
    expect(perms.staffManagement).toBe(false);
  });

  it("应该能删除普通管理员账户", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // 删除权限配置
    await db.delete(adminPermissions).where(eq(adminPermissions.userId, staffAdminId));

    // 删除用户
    await db.delete(users).where(eq(users.id, staffAdminId));

    // 验证删除成功
    const [user] = await db.select().from(users).where(eq(users.id, staffAdminId));
    expect(user).toBeUndefined();

    const [perms] = await db.select().from(adminPermissions).where(eq(adminPermissions.userId, staffAdminId));
    expect(perms).toBeUndefined();

    // 清空staffAdminId,避免afterAll重复删除
    staffAdminId = 0;
  });
});
