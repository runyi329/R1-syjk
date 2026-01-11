import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { users, adminPermissions } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { hashPassword, verifyPassword } from "../db";
import { TRPCError } from "@trpc/server";

/**
 * 检查用户是否为超级管理员
 */
async function checkSuperAdmin(userId: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "数据库不可用" });
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user[0] || (user[0].role !== "super_admin" && user[0].role !== "admin")) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "只有超级管理员可以执行此操作",
    });
  }
  return user[0];
}

/**
 * 检查用户是否有指定权限
 */
async function checkPermission(userId: number, permission: keyof typeof adminPermissions.$inferSelect) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "数据库不可用" });
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  
  // 超级管理员拥有所有权限
  if (user[0]?.role === "super_admin" || user[0]?.role === "admin") {
    return true;
  }
  
  // 检查普通管理员的权限
  if (user[0]?.role === "staff_admin") {
    const perms = await db.select().from(adminPermissions).where(eq(adminPermissions.userId, userId)).limit(1);
    if (!perms[0] || perms[0].status === "disabled") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "您的账户已被禁用",
      });
    }
    
    if (permission && !perms[0][permission]) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "您没有权限执行此操作",
      });
    }
    
    return true;
  }
  
  throw new TRPCError({
    code: "FORBIDDEN",
    message: "您没有管理员权限",
  });
}

export const adminPermissionsRouter = router({
  /**
   * 创建普通管理员账户
   */
  createStaffAdmin: protectedProcedure
    .input(
      z.object({
        username: z.string().min(3).max(64),
        password: z.string().min(6),
        email: z.string().email().optional(),
        permissions: z.object({
          balanceManagement: z.boolean().default(false),
          userManagement: z.boolean().default(false),
          permissionManagement: z.boolean().default(false),
          memberManagement: z.boolean().default(false),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 检查是否为超级管理员
      await checkSuperAdmin(ctx.user.id);

      // 检查用户名是否已存在
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "数据库不可用" });
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.username, input.username))
        .limit(1);

      if (existingUser.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "用户名已存在",
        });
      }

      // 创建密码哈希
      const passwordHash = hashPassword(input.password);

      // 创建管理员账户
      const [newUser] = await db.insert(users).values({
        username: input.username,
        passwordHash,
        email: input.email,
        role: "staff_admin",
        registerMethod: "password",
        openId: `staff_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      });

      // 创建权限配置
      await db.insert(adminPermissions).values({
        userId: newUser.insertId,
        balanceManagement: input.permissions.balanceManagement,
        userManagement: input.permissions.userManagement,
        permissionManagement: input.permissions.permissionManagement,
        memberManagement: input.permissions.memberManagement,
        staffManagement: false, // 普通管理员不能管理员工
        status: "active",
        createdBy: ctx.user.id,
      });

      return {
        success: true,
        userId: newUser.insertId,
        message: "管理员账户创建成功",
      };
    }),

  /**
   * 获取所有员工管理员列表
   */
  listStaffAdmins: protectedProcedure.query(async ({ ctx }) => {
    // 检查是否为超级管理员
    await checkSuperAdmin(ctx.user.id);

    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "数据库不可用" });

    // 查询所有普通管理员
    const staffAdmins = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        createdAt: users.createdAt,
        lastSignedIn: users.lastSignedIn,
        permissions: adminPermissions,
      })
      .from(users)
      .leftJoin(adminPermissions, eq(users.id, adminPermissions.userId))
      .where(eq(users.role, "staff_admin"));

    return staffAdmins;
  }),

  /**
   * 更新员工管理员权限
   */
  updateStaffPermissions: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        permissions: z.object({
          balanceManagement: z.boolean(),
          userManagement: z.boolean(),
          permissionManagement: z.boolean(),
          memberManagement: z.boolean(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 检查是否为超级管理员
      await checkSuperAdmin(ctx.user.id);

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "数据库不可用" });

      // 检查目标用户是否为普通管理员
      const targetUser = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
      if (!targetUser[0] || targetUser[0].role !== "staff_admin") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "目标用户不是普通管理员",
        });
      }

      // 更新权限
      await db
        .update(adminPermissions)
        .set({
          balanceManagement: input.permissions.balanceManagement,
          userManagement: input.permissions.userManagement,
          permissionManagement: input.permissions.permissionManagement,
          memberManagement: input.permissions.memberManagement,
        })
        .where(eq(adminPermissions.userId, input.userId));

      return {
        success: true,
        message: "权限更新成功",
      };
    }),

  /**
   * 禁用/启用员工管理员账户
   */
  toggleStaffStatus: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        status: z.enum(["active", "disabled"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 检查是否为超级管理员
      await checkSuperAdmin(ctx.user.id);

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "数据库不可用" });

      // 检查目标用户是否为普通管理员
      const targetUser = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
      if (!targetUser[0] || targetUser[0].role !== "staff_admin") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "目标用户不是普通管理员",
        });
      }

      // 更新状态
      await db
        .update(adminPermissions)
        .set({ status: input.status })
        .where(eq(adminPermissions.userId, input.userId));

      return {
        success: true,
        message: input.status === "active" ? "账户已启用" : "账户已禁用",
      };
    }),

  /**
   * 获取当前用户的权限
   */
  getMyPermissions: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "数据库不可用" });
    const user = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);

    // 超级管理员拥有所有权限
    if (user[0]?.role === "super_admin" || user[0]?.role === "admin") {
      return {
        role: user[0].role,
        permissions: {
          balanceManagement: true,
          userManagement: true,
          permissionManagement: true,
          memberManagement: true,
          staffManagement: true,
        },
        status: "active",
      };
    }

    // 普通管理员查询权限配置
    if (user[0]?.role === "staff_admin") {
      const perms = await db.select().from(adminPermissions).where(eq(adminPermissions.userId, ctx.user.id)).limit(1);
      if (!perms[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "权限配置不存在",
        });
      }

      return {
        role: user[0].role,
        permissions: {
          balanceManagement: perms[0].balanceManagement,
          userManagement: perms[0].userManagement,
          permissionManagement: perms[0].permissionManagement,
          memberManagement: perms[0].memberManagement,
          staffManagement: false,
        },
        status: perms[0].status,
      };
    }

    // 普通用户没有管理员权限
    return {
      role: "user",
      permissions: {
        balanceManagement: false,
        userManagement: false,
        permissionManagement: false,
        memberManagement: false,
        staffManagement: false,
      },
      status: "active",
    };
  }),

  /**
   * 删除员工管理员账户
   */
  deleteStaffAdmin: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // 检查是否为超级管理员
      await checkSuperAdmin(ctx.user.id);

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "数据库不可用" });

      // 检查目标用户是否为普通管理员
      const targetUser = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
      if (!targetUser[0] || targetUser[0].role !== "staff_admin") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "目标用户不是普通管理员",
        });
      }

      // 删除权限配置
      await db.delete(adminPermissions).where(eq(adminPermissions.userId, input.userId));

      // 删除用户账户
      await db.delete(users).where(eq(users.id, input.userId));

      return {
        success: true,
        message: "管理员账户已删除",
      };
    }),
});

/**
 * 为员工分配股票用户权限
 */
export const assignStockPermissionsRouter = router({
  assignStockToStaff: protectedProcedure
    .input(
      z.object({
        staffUserId: z.number(),
        stockUserIds: z.array(z.number()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 检查是否为超级管理员
      await checkSuperAdmin(ctx.user.id);

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "数据库不可用" });

      // 导入staffStockPermissions表
      const { staffStockPermissions } = await import("../../drizzle/schema");

      // 先删除该员工的所有股票权限
      await db.delete(staffStockPermissions).where(eq(staffStockPermissions.staffUserId, input.staffUserId));

      // 批量插入新的权限
      if (input.stockUserIds.length > 0) {
        const values = input.stockUserIds.map((stockUserId) => ({
          staffUserId: input.staffUserId,
          stockUserId,
          createdBy: ctx.user.id,
        }));
        await db.insert(staffStockPermissions).values(values);
      }

      return {
        success: true,
        message: "股票权限分配成功",
      };
    }),

  /**
   * 获取员工可访问的股票用户列表
   */
  getStaffStockPermissions: protectedProcedure
    .input(z.object({ staffUserId: z.number() }))
    .query(async ({ ctx, input }) => {
      // 检查是否为超级管理员
      await checkSuperAdmin(ctx.user.id);

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "数据库不可用" });

      const { staffStockPermissions, stockUsers } = await import("../../drizzle/schema");

      // 查询该员工的所有股票权限
      const permissions = await db
        .select({
          id: staffStockPermissions.id,
          stockUserId: staffStockPermissions.stockUserId,
          stockUserName: stockUsers.name,
          createdAt: staffStockPermissions.createdAt,
        })
        .from(staffStockPermissions)
        .leftJoin(stockUsers, eq(staffStockPermissions.stockUserId, stockUsers.id))
        .where(eq(staffStockPermissions.staffUserId, input.staffUserId));

      return permissions;
    }),

  /**
   * 获取当前员工可访问的股票用户ID列表（用于前端筛选）
   */
  getMyStockPermissions: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "数据库不可用" });

    const user = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);

    // 超级管理员可以访问所有股票用户
    if (user[0]?.role === "super_admin" || user[0]?.role === "admin") {
      return { hasFullAccess: true, stockUserIds: [] };
    }

    // 普通管理员只能访问分配给他的股票用户
    if (user[0]?.role === "staff_admin") {
      const { staffStockPermissions } = await import("../../drizzle/schema");
      const permissions = await db
        .select({ stockUserId: staffStockPermissions.stockUserId })
        .from(staffStockPermissions)
        .where(eq(staffStockPermissions.staffUserId, ctx.user.id));

      return {
        hasFullAccess: false,
        stockUserIds: permissions.map((p) => p.stockUserId),
      };
    }

    // 普通用户没有权限
    return { hasFullAccess: false, stockUserIds: [] };
  }),
});

// 合并所有路由
export const adminPermissionsRouterWithStockPermissions = router({
  ...adminPermissionsRouter._def.procedures,
  ...assignStockPermissionsRouter._def.procedures,
});

// 导出权限检查函数供其他路由使用
export { checkSuperAdmin, checkPermission };
