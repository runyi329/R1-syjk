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

  // 公开：生成验证码
  generateCaptcha: publicProcedure.mutation(async () => {
    const { answer, answerHash } = db.generateCaptchaAnswer();
    const token = await db.createCaptcha(answerHash);

    return {
      token,
    };
  }),

  // 公开：获取验证码信息
  getCaptchaInfo: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const info = await db.getCaptchaInfo(input.token);
      if (!info) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '验证码已过期',
        });
      }
      return info;
    }),

  // 管理员：解锁账户
  unlockAccount: adminProcedure
    .input(z.object({ username: z.string() }))
    .mutation(async ({ input }) => {
      await db.unlockAccount(input.username);
      return { success: true };
    }),

  // 密码重置：发送重置验证码
  sendPasswordResetCode: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const { sendPasswordResetEmail } = await import("../_core/mailer");
      
      // 检查邮箱是否存在
      const user = await db.getUserByEmail(input.email);
      if (!user) {
        // 不返回错误信息，以不泄露邮箱是否存在
        return { success: true, message: '如果邮箱存在，您将收到重置验证码' };
      }

      // 生成验证码
      const { code, codeHash } = db.generatePasswordResetCode();
      const token = await db.createPasswordReset(user.id, input.email, codeHash);

      // 发送邮件
      try {
        const resetLink = `${process.env.VITE_FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
        await sendPasswordResetEmail(input.email, code, resetLink);
      } catch (error) {
        console.error('[Users] Failed to send password reset email:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: '发送邮件失败，请稍后再试',
        });
      }

      return { success: true, message: '如果邮箱存在，您将收到重置验证码' };
    }),

  // 密码重置：验证重置码
  verifyPasswordResetCode: publicProcedure
    .input(z.object({ token: z.string(), code: z.string() }))
    .mutation(async ({ input }) => {
      const isValid = await db.verifyPasswordResetCode(input.token, input.code);
      if (!isValid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '验证码错误或已过期',
        });
      }
      return { success: true };
    }),

  // 密码重置：重置密码
  resetPassword: publicProcedure
    .input(z.object({ token: z.string(), newPassword: z.string().min(8) }))
    .mutation(async ({ input }) => {
      // 获取重置请求信息
      const resetInfo = await db.getPasswordResetInfo(input.token);
      if (!resetInfo || resetInfo.used) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '重置链接已过期或已使用',
        });
      }

      // 添加密码验证
      if (input.newPassword.length < 8) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '密码至少需要8个字符',
        });
      }

      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(input.newPassword)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '密码必须包含大写字母、小写字母和数字',
        });
      }

      // 重置密码
      const newPasswordHash = db.hashPassword(input.newPassword);
      await db.resetUserPassword(resetInfo.userId, newPasswordHash);

      return { success: true };
    }),

  // 用户：修改密码
  changePassword: protectedProcedure
    .input(z.object({
      currentPassword: z.string(),
      newPassword: z.string().min(6).max(50),
    }))
    .mutation(async ({ ctx, input }) => {
      // 验证当前密码
      const user = ctx.user;
      const isPasswordValid = db.verifyPassword(input.currentPassword, user.passwordHash || '');
      
      if (!isPasswordValid) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: '当前密码错误',
        });
      }

      // 检查新密码是否与当前密码相同
      if (input.currentPassword === input.newPassword) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '新密码不能与当前密码相同',
        });
      }

      // 哈希新密码
      const newPasswordHash = db.hashPassword(input.newPassword);

      // 更新密码
      await db.updateUserPassword(user.id, newPasswordHash);

      return { success: true };
    }),

  // 管理员：修改用户VIP等级
  updateUserVipLevel: adminProcedure
    .input(z.object({ userId: z.number(), vipLevel: z.number().min(0).max(5) }))
    .mutation(async ({ input }) => {
      await db.updateUserVipLevel(input.userId, input.vipLevel);
      return { success: true };
    }),

  // 管理员：修改用户账户状态
  updateUserStatus: adminProcedure
    .input(z.object({ userId: z.number(), status: z.enum(['active', 'frozen']) }))
    .mutation(async ({ input }) => {
      await db.updateUserStatus(input.userId, input.status);
      return { success: true };
    }),

  // 管理员：修改用户名
  updateUserName: adminProcedure
    .input(z.object({ userId: z.number(), name: z.string().min(2).max(20) }))
    .mutation(async ({ input }) => {
      await db.updateUserName(input.userId, input.name);
      return { success: true };
    }),

  // 管理员：删除用户
  deleteUser: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input }) => {
      // 删除用户及相关数据
      await db.deleteUser(input.userId);
      return { success: true };
    }),

  // 管理员：以客户身份登录
  loginAsUser: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      // 获取目标用户信息
      const targetUser = await db.getUserById(input.userId);
      if (!targetUser) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '用户不存在',
        });
      }

      // 创建session - 使用sdk创建session token
      const sessionToken = await sdk.createSessionToken(targetUser.openId, {
        name: targetUser.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      return {
        success: true,
        user: targetUser,
      };
    }),
});
