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
      captchaToken: z.string().optional(),
      captchaAnswer: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const ipAddress = ctx.req.headers['x-forwarded-for']?.toString().split(',')[0] || ctx.req.socket.remoteAddress || '0.0.0.0';

      // 检查账户是否被锁定
      const isLocked = await db.isAccountLocked(input.username);
      if (isLocked) {
        await db.recordLoginAttempt(input.username, ipAddress, false, '账户已锁定');
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: '账户已被锁定，请联系管理员解锁',
        });
      }

      // 检查登录失败次数
      const failureCount = await db.getLoginFailureCount(input.username, ipAddress);
      const remainingAttempts = Math.max(0, 10 - failureCount);

      // 如果失败次数超过3，需要验证码
      if (failureCount >= 3) {
        if (!input.captchaToken || !input.captchaAnswer) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: '需要验证码',
            cause: { requiresCaptcha: true, remainingAttempts },
          });
        }

        // 验证验证码
        const isValidCaptcha = await db.verifyCaptcha(input.captchaToken, input.captchaAnswer);
        if (!isValidCaptcha) {
          await db.recordLoginAttempt(input.username, ipAddress, false, '验证码错误');
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: '验证码错误',
            cause: { requiresCaptcha: true, remainingAttempts },
          });
        }
      }

      // 查找用户
      const user = await db.getUserByUsername(input.username);
      if (!user) {
        await db.recordLoginAttempt(input.username, ipAddress, false, '用户名或密码错误');
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: '用户名或密码错误',
          cause: { requiresCaptcha: failureCount >= 3, remainingAttempts },
        });
      }

      // 验证密码
      if (!user.passwordHash || !db.verifyPassword(input.password, user.passwordHash)) {
        const newFailureCount = failureCount + 1;
        await db.recordLoginAttempt(input.username, ipAddress, false, '用户名或密码错误');

        // 检查是否超过10次失败，如果是则锁定账户
        if (newFailureCount >= 10) {
          await db.lockAccount(input.username);
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: '登录尝试次数过多，账户已锁定',
          });
        }

        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: '用户名或密码错误',
          cause: { requiresCaptcha: newFailureCount >= 3, remainingAttempts: Math.max(0, 10 - newFailureCount) },
        });
      }

      // 登录成功，记录成功的登录尝试
      await db.recordLoginAttempt(input.username, ipAddress, true);

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
});
