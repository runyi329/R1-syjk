import { z } from "zod";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const usersRouter = router({
  // 用户：获取自己的信息
  getMe: protectedProcedure.query(async ({ ctx }) => {
    return ctx.user;
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
});
