import { z } from "zod";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { TRPCError } from "@trpc/server";

export const pointsRouter = router({
  // 管理员：为用户充值积分
  creditPoints: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        amount: z.string().regex(/^\d+(\.\d{1,8})?$/, "Invalid USDT amount"),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = await db.getUserById(input.userId);
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      const currentBalance = parseFloat(user.usdtBalance);
      const addAmount = parseFloat(input.amount);
      const newBalance = (currentBalance + addAmount).toFixed(8);

      await db.updateUserBalance(input.userId, newBalance);
      await db.createPointTransaction({
        userId: input.userId,
        type: "credit",
        amount: input.amount,
        balanceAfter: newBalance,
        operatorId: ctx.user.id,
        notes: input.notes || `充值 ${input.amount} USDT`,
      });

      return { success: true, newBalance };
    }),

  // 管理员：扣除用户积分
  debitPoints: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        amount: z.string().regex(/^\d+(\.\d{1,8})?$/, "Invalid USDT amount"),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = await db.getUserById(input.userId);
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      const currentBalance = parseFloat(user.usdtBalance);
      const deductAmount = parseFloat(input.amount);

      if (currentBalance < deductAmount) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Insufficient balance" });
      }

      const newBalance = (currentBalance - deductAmount).toFixed(8);

      await db.updateUserBalance(input.userId, newBalance);
      await db.createPointTransaction({
        userId: input.userId,
        type: "debit",
        amount: `-${input.amount}`,
        balanceAfter: newBalance,
        operatorId: ctx.user.id,
        notes: input.notes || `提现 ${input.amount} USDT`,
      });

      return { success: true, newBalance };
    }),

  // 管理员：冻结用户账户
  freezeAccount: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = await db.getUserById(input.userId);
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      if (user.accountStatus === "frozen") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Account already frozen" });
      }

      await db.updateUserStatus(input.userId, "frozen");
      await db.createPointTransaction({
        userId: input.userId,
        type: "freeze",
        amount: "0",
        balanceAfter: user.usdtBalance,
        operatorId: ctx.user.id,
        notes: input.notes || "管理员冻结账户",
      });

      return { success: true };
    }),

  // 管理员：解冻用户账户
  unfreezeAccount: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = await db.getUserById(input.userId);
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      if (user.accountStatus === "active") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Account already active" });
      }

      await db.updateUserStatus(input.userId, "active");
      await db.createPointTransaction({
        userId: input.userId,
        type: "unfreeze",
        amount: "0",
        balanceAfter: user.usdtBalance,
        operatorId: ctx.user.id,
        notes: input.notes || "管理员解冻账户",
      });

      return { success: true };
    }),

  // 用户：查看自己的积分流水
  getMyTransactions: protectedProcedure.query(async ({ ctx }) => {
    return await db.getPointTransactionsByUserId(ctx.user.id);
  }),

  // 管理员：查看指定用户的积分流水
  getUserTransactions: adminProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      return await db.getPointTransactionsByUserId(input.userId);
    }),
});
