import { z } from "zod";
import { publicProcedure, router, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { withdrawals, walletAddresses, pointTransactions, users } from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const withdrawalsRouter = router({
  // 创建提现订单
  create: publicProcedure
    .input(
      z.object({
        walletAddressId: z.number(),
        amount: z.string(),
        fee: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // 验证钱包地址
      const [walletAddress] = await db
        .select()
        .from(walletAddresses)
        .where(
          and(
            eq(walletAddresses.id, input.walletAddressId),
            eq(walletAddresses.userId, ctx.user.id),
            eq(walletAddresses.status, "approved")
          )
        );

      if (!walletAddress) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "钱包地址不存在或未审核通过" });
      }

      // 验证余额
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id));

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "用户不存在" });
      }

      const currentBalance = parseFloat(user.usdtBalance);
      const withdrawAmount = parseFloat(input.amount);

      if (withdrawAmount > currentBalance) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "余额不足" });
      }

      // 计算实际到账金额
      const feeAmount = parseFloat(input.fee);
      const actualAmount = withdrawAmount - feeAmount;

      // 扣除用户余额
      const newBalance = currentBalance - withdrawAmount;
      await db
        .update(users)
        .set({ usdtBalance: newBalance.toFixed(8) })
        .where(eq(users.id, ctx.user.id));

      // 创建提现订单
      const [withdrawal] = await db.insert(withdrawals).values({
        userId: ctx.user.id,
        walletAddressId: input.walletAddressId,
        amount: input.amount,
        fee: input.fee,
        actualAmount: actualAmount.toFixed(8),
        network: walletAddress.network,
        withdrawAddress: walletAddress.address,
        status: "pending",
      });

      // 记录积分流水
      await db.insert(pointTransactions).values({
        userId: ctx.user.id,
        type: "debit",
        amount: `-${input.amount}`,
        balanceAfter: newBalance.toFixed(8),
        notes: `提现申请 - 订单ID: ${withdrawal.insertId}`,
      });

      return { success: true, withdrawalId: withdrawal.insertId };
    }),

  // 获取当前用户的提现记录
  getMyWithdrawals: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const userWithdrawals = await db
      .select({
        withdrawal: withdrawals,
        walletAddress: walletAddresses,
      })
      .from(withdrawals)
      .leftJoin(walletAddresses, eq(withdrawals.walletAddressId, walletAddresses.id))
      .where(eq(withdrawals.userId, ctx.user.id))
      .orderBy(desc(withdrawals.createdAt));

    return userWithdrawals;
  }),

  // 获取提现订单详情
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [result] = await db
        .select({
          withdrawal: withdrawals,
          walletAddress: walletAddresses,
        })
        .from(withdrawals)
        .leftJoin(walletAddresses, eq(withdrawals.walletAddressId, walletAddresses.id))
        .where(
          and(
            eq(withdrawals.id, input.id),
            eq(withdrawals.userId, ctx.user.id)
          )
        );

      if (!result) {
        throw new TRPCError({ code: "NOT_FOUND", message: "提现订单不存在" });
      }

      return result;
    }),

  // 管理员：获取所有提现订单
  getAllWithdrawals: adminProcedure
    .input(
      z.object({
        status: z.enum(["pending", "approved", "processing", "completed", "rejected"]).optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      let query = db
        .select({
          withdrawal: withdrawals,
          walletAddress: walletAddresses,
          user: {
            id: users.id,
            name: users.name,
            email: users.email,
          },
        })
        .from(withdrawals)
        .leftJoin(walletAddresses, eq(withdrawals.walletAddressId, walletAddresses.id))
        .leftJoin(users, eq(withdrawals.userId, users.id))
        .orderBy(desc(withdrawals.createdAt));

      if (input?.status) {
        query = query.where(eq(withdrawals.status, input.status)) as any;
      }

      const result = await query;
      return result;
    }),

  // 管理员：批准提现
  approveWithdrawal: adminProcedure
    .input(
      z.object({
        id: z.number(),
        adminNotes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [withdrawal] = await db
        .select()
        .from(withdrawals)
        .where(eq(withdrawals.id, input.id));

      if (!withdrawal) {
        throw new TRPCError({ code: "NOT_FOUND", message: "提现订单不存在" });
      }

      if (withdrawal.status !== "pending") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "订单状态不正确" });
      }

      await db
        .update(withdrawals)
        .set({
          status: "approved",
          adminNotes: input.adminNotes,
          reviewerId: ctx.user!.id,
          reviewedAt: new Date(),
        })
        .where(eq(withdrawals.id, input.id));

      return { success: true };
    }),

  // 管理员：拒绝提现（退回余额）
  rejectWithdrawal: adminProcedure
    .input(
      z.object({
        id: z.number(),
        rejectReason: z.string(),
        adminNotes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [withdrawal] = await db
        .select()
        .from(withdrawals)
        .where(eq(withdrawals.id, input.id));

      if (!withdrawal) {
        throw new TRPCError({ code: "NOT_FOUND", message: "提现订单不存在" });
      }

      if (withdrawal.status !== "pending" && withdrawal.status !== "approved") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "订单状态不正确" });
      }

      // 退回用户余额
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, withdrawal.userId));

      if (user) {
        const currentBalance = parseFloat(user.usdtBalance);
        const refundAmount = parseFloat(withdrawal.amount);
        const newBalance = currentBalance + refundAmount;

        await db
          .update(users)
          .set({ usdtBalance: newBalance.toFixed(8) })
          .where(eq(users.id, withdrawal.userId));

        // 记录积分流水
        await db.insert(pointTransactions).values({
          userId: withdrawal.userId,
          type: "credit",
          amount: withdrawal.amount,
          balanceAfter: newBalance.toFixed(8),
          operatorId: ctx.user!.id,
          notes: `提现拒绝退回 - 订单ID: ${input.id}`,
        });
      }

      await db
        .update(withdrawals)
        .set({
          status: "rejected",
          rejectReason: input.rejectReason,
          adminNotes: input.adminNotes,
          reviewerId: ctx.user!.id,
          reviewedAt: new Date(),
        })
        .where(eq(withdrawals.id, input.id));

      return { success: true };
    }),

  // 管理员：标记提现处理中
  markProcessing: adminProcedure
    .input(
      z.object({
        id: z.number(),
        txHash: z.string().optional(),
        adminNotes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [withdrawal] = await db
        .select()
        .from(withdrawals)
        .where(eq(withdrawals.id, input.id));

      if (!withdrawal) {
        throw new TRPCError({ code: "NOT_FOUND", message: "提现订单不存在" });
      }

      await db
        .update(withdrawals)
        .set({
          status: "processing",
          txHash: input.txHash,
          adminNotes: input.adminNotes,
        })
        .where(eq(withdrawals.id, input.id));

      return { success: true };
    }),

  // 管理员：标记提现完成
  completeWithdrawal: adminProcedure
    .input(
      z.object({
        id: z.number(),
        txHash: z.string().optional(),
        adminNotes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [withdrawal] = await db
        .select()
        .from(withdrawals)
        .where(eq(withdrawals.id, input.id));

      if (!withdrawal) {
        throw new TRPCError({ code: "NOT_FOUND", message: "提现订单不存在" });
      }

      await db
        .update(withdrawals)
        .set({
          status: "completed",
          txHash: input.txHash || withdrawal.txHash,
          adminNotes: input.adminNotes,
          completedAt: new Date(),
        })
        .where(eq(withdrawals.id, input.id));

      return { success: true };
    }),

  // 管理员：编辑提现订单
  updateWithdrawal: adminProcedure
    .input(
      z.object({
        id: z.number(),
        amount: z.string().optional(),
        fee: z.string().optional(),
        txHash: z.string().optional(),
        adminNotes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { id, amount, fee, ...otherUpdates } = input;
      
      // 如果修改了金额或手续费，需要重新计算实际到账金额
      if (amount || fee) {
        const [withdrawal] = await db
          .select()
          .from(withdrawals)
          .where(eq(withdrawals.id, id));

        if (withdrawal) {
          const newAmount = amount ? parseFloat(amount) : parseFloat(withdrawal.amount);
          const newFee = fee ? parseFloat(fee) : parseFloat(withdrawal.fee);
          const actualAmount = newAmount - newFee;

          await db
            .update(withdrawals)
            .set({
              amount: amount || withdrawal.amount,
              fee: fee || withdrawal.fee,
              actualAmount: actualAmount.toFixed(8),
              ...otherUpdates,
            })
            .where(eq(withdrawals.id, id));
        }
      } else {
        await db
          .update(withdrawals)
          .set(otherUpdates)
          .where(eq(withdrawals.id, id));
      }

      return { success: true };
    }),
});
