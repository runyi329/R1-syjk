import { z } from "zod";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { TRPCError } from "@trpc/server";
import { sdk } from "../_core/sdk";
import { getSessionCookieOptions } from "../_core/cookies";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const usersRouter = router({
  // 用户：获取自己的信息
  getMe: protectedProcedure.query(async ({ ctx }) => {
    return ctx.user;
  }),

  // 用户：更新自己的用户名
  updateMyName: protectedProcedure
    .input(z.object({ name: z.string().min(2).max(20) }))
    .mutation(async ({ ctx, input }) => {
      await db.updateUserName(ctx.user.id, input.name);
      return { success: true };
    }),

  // 管理员：获取所有用户
  getAllUsers: adminProcedure.query(async () => {
    return await db.getAllUsers();
  }),

  // 管理员：获取指定用户信息
  getUserById: adminProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      return await db.getUserById(input.userId);
    }),

  // 管理员：冻结账户
  freezeAccount: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input }) => {
      await db.updateUserStatus(input.userId, "frozen");
      return { success: true };
    }),

  // 管理员：解冻账户
  unfreezeAccount: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input }) => {
      await db.updateUserStatus(input.userId, "active");
      return { success: true };
    }),

  // 公开：用户名+密码注册
  register: publicProcedure
    .input(z.object({
      username: z.string().min(2).max(20),
      password: z.string().min(6).max(50),
      name: z.string().min(2).max(20),
    }))
    .mutation(async ({ input }) => {
      // 检查用户名是否已存在
      const existingUser = await db.getUserByUsername(input.username);
      if (existingUser) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: '用户名已存在',
        });
      }

      // 哈希密码
      const passwordHash = db.hashPassword(input.password);

      // 创建用户
      const newUser = await db.registerUserWithPassword(
        input.username,
        passwordHash,
        input.name
      );

      if (!newUser) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: '注册失败',
        });
      }

      return {
        success: true,
        user: newUser,
      };
    }),

  // 公开：用户名+密码登录
  loginWithPassword: publicProcedure
    .input(z.object({
      username: z.string(),
      password: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      // 查找用户
      const user = await db.getUserByUsername(input.username);
      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: '用户名或密码错误',
        });
      }

      // 验证密码
      if (!user.passwordHash || !db.verifyPassword(input.password, user.passwordHash)) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: '用户名或密码错误',
        });
      }

      // 创建session - 使用sdk创建session token
      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      return {
        success: true,
        user,
      };
    }),
});
