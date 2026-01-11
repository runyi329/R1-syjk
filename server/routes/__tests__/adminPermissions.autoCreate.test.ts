import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "../../db";
import { users, adminPermissions } from "../../../drizzle/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "../../db";
import { appRouter } from "../../routers";

describe("Admin Permissions Auto-Create", () => {
  let superAdminId: number;
  let staffAdminId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // 创建超级管理员测试账户
    const testUsername = `test_super_autocreate_${Date.now()}`;
    const [result] = await db.insert(users).values({
      username: testUsername,
      passwordHash: hashPassword("test123"),
      role: "super_admin",
      registerMethod: "password",
      openId: `test_super_${Date.now()}`,
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

  it("应该为没有权限配置的staff_admin自动创建权限配置", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // 创建一个没有权限配置的staff_admin用户
    const staffUsername = `test_staff_no_perms_${Date.now()}`;
    const openId = `staff_no_perms_${Date.now()}`;
    const [result] = await db.insert(users).values({
      username: staffUsername,
      passwordHash: hashPassword("staff123"),
      role: "staff_admin",
      registerMethod: "password",
      openId,
    });
    staffAdminId = result.insertId;

    // 验证权限配置不存在
    const [permsBefore] = await db.select().from(adminPermissions).where(eq(adminPermissions.userId, staffAdminId));
    expect(permsBefore).toBeUndefined();

    // 创建caller并调用getMyPermissions
    const caller = appRouter.createCaller({
      user: { id: staffAdminId, openId, role: "staff_admin" },
      req: {} as any,
      res: {} as any,
    });

    // 调用getMyPermissions应该自动创建权限配置
    const permissions = await caller.adminPermissions.getMyPermissions();

    // 验证返回的权限
    expect(permissions.role).toBe("staff_admin");
    expect(permissions.status).toBe("active");
    expect(permissions.permissions.balanceManagement).toBe(true);
    expect(permissions.permissions.userManagement).toBe(true);
    expect(permissions.permissions.memberManagement).toBe(true);
    expect(permissions.permissions.permissionManagement).toBe(false);
    expect(permissions.permissions.staffManagement).toBe(false);

    // 验证权限配置已在数据库中创建
    const [permsAfter] = await db.select().from(adminPermissions).where(eq(adminPermissions.userId, staffAdminId));
    expect(permsAfter).toBeDefined();
    expect(permsAfter.balanceManagement).toBe(true);
    expect(permsAfter.userManagement).toBe(true);
    expect(permsAfter.memberManagement).toBe(true);
    expect(permsAfter.status).toBe("active");
  });

  it("超级管理员不需要权限配置记录", async () => {
    // 创建caller并调用getMyPermissions
    const caller = appRouter.createCaller({
      user: { id: superAdminId, openId: `test_super_${Date.now()}`, role: "super_admin" },
      req: {} as any,
      res: {} as any,
    });

    const permissions = await caller.adminPermissions.getMyPermissions();

    // 验证超级管理员拥有所有权限
    expect(permissions.role).toBe("super_admin");
    expect(permissions.status).toBe("active");
    expect(permissions.permissions.balanceManagement).toBe(true);
    expect(permissions.permissions.userManagement).toBe(true);
    expect(permissions.permissions.permissionManagement).toBe(true);
    expect(permissions.permissions.memberManagement).toBe(true);
    expect(permissions.permissions.staffManagement).toBe(true);
  });

  it("普通用户应该没有管理员权限", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // 创建普通用户
    const normalUsername = `test_normal_${Date.now()}`;
    const openId = `normal_${Date.now()}`;
    const [result] = await db.insert(users).values({
      username: normalUsername,
      passwordHash: hashPassword("normal123"),
      role: "user",
      registerMethod: "password",
      openId,
    });
    const normalUserId = result.insertId;

    try {
      // 创建caller并调用getMyPermissions
      const caller = appRouter.createCaller({
        user: { id: normalUserId, openId, role: "user" },
        req: {} as any,
        res: {} as any,
      });

      const permissions = await caller.adminPermissions.getMyPermissions();

      // 验证普通用户没有管理员权限
      expect(permissions.role).toBe("user");
      expect(permissions.status).toBe("active");
      expect(permissions.permissions.balanceManagement).toBe(false);
      expect(permissions.permissions.userManagement).toBe(false);
      expect(permissions.permissions.permissionManagement).toBe(false);
      expect(permissions.permissions.memberManagement).toBe(false);
      expect(permissions.permissions.staffManagement).toBe(false);
    } finally {
      // 清理普通用户
      await db.delete(users).where(eq(users.id, normalUserId));
    }
  });
});
