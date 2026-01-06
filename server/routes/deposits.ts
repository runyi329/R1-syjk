import { z } from "zod";
import { publicProcedure, router, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { deposits, pointTransactions, users } from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const depositsRouter = router({
  // 创建充值订单
  create: publicProcedure
    .input(
      z.object({
        amount: z.string(),
        network: z.string(),
        depositAddress: z.string(),
        txHash: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [deposit] = await db.insert(deposits).values({
        userId: ctx.user.id,
        amount: input.amount,
        network: input.network,
        depositAddress: input.depositAddress,
        txHash: input.txHash,
        status: "pending",
      });

      return { success: true, depositId: deposit.insertId };
    }),

  // 获取当前用户的充值记录
  getMyDeposits: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const userDeposits = await db
      .select()
      .from(deposits)
      .where(eq(deposits.userId, ctx.user.id))
      .orderBy(desc(deposits.createdAt));

    return userDeposits;
  }),

  // 获取充值订单详情
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [deposit] = await db
        .select()
        .from(deposits)
        .where(
          and(
            eq(deposits.id, input.id),
            eq(deposits.userId, ctx.user.id)
          )
        );

      if (!deposit) {
        throw new TRPCError({ code: "NOT_FOUND", message: "充值订单不存在" });
      }

      return deposit;
    }),

  // 管理员：获取所有充值订单
  getAllDeposits: adminProcedure
    .input(
      z.object({
        status: z.enum(["pending", "confirmed", "failed"]).optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      let query = db
        .select({
          deposit: deposits,
          user: {
            id: users.id,
            name: users.name,
            email: users.email,
          },
        })
        .from(deposits)
        .leftJoin(users, eq(deposits.userId, users.id))
        .orderBy(desc(deposits.createdAt));

      if (input?.status) {
        query = query.where(eq(deposits.status, input.status)) as any;
      }

      const result = await query;
      return result;
    }),

  // 管理员：确认充值到账
  confirmDeposit: adminProcedure
    .input(
      z.object({
        id: z.number(),
        adminNotes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // 获取充值订单
      const [deposit] = await db
        .select()
        .from(deposits)
        .where(eq(deposits.id, input.id));

      if (!deposit) {
        throw new TRPCError({ code: "NOT_FOUND", message: "充值订单不存在" });
      }

      if (deposit.status !== "pending") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "订单状态不正确" });
      }

      // 获取用户信息
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, deposit.userId));

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "用户不存在" });
      }

      // 计算新余额
      const currentBalance = parseFloat(user.usdtBalance);
      const depositAmount = parseFloat(deposit.amount);
      const newBalance = currentBalance + depositAmount;

      // 更新用户余额
      await db
        .update(users)
        .set({ usdtBalance: newBalance.toFixed(8) })
        .where(eq(users.id, deposit.userId));

      // 更新充值订单状态
      await db
        .update(deposits)
        .set({
          status: "confirmed",
          adminNotes: input.adminNotes,
          reviewerId: ctx.user!.id,
          reviewedAt: new Date(),
        })
        .where(eq(deposits.id, input.id));

      // 记录积分流水
      await db.insert(pointTransactions).values({
        userId: deposit.userId,
        type: "credit",
        amount: deposit.amount,
        balanceAfter: newBalance.toFixed(8),
        operatorId: ctx.user!.id,
        notes: `充值到账 - 订单ID: ${input.id}`,
      });

      return { success: true };
    }),

  // 管理员：标记充值失败
  failDeposit: adminProcedure
    .input(
      z.object({
        id: z.number(),
        adminNotes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [deposit] = await db
        .select()
        .from(deposits)
        .where(eq(deposits.id, input.id));

      if (!deposit) {
        throw new TRPCError({ code: "NOT_FOUND", message: "充值订单不存在" });
      }

      await db
        .update(deposits)
        .set({
          status: "failed",
          adminNotes: input.adminNotes,
          reviewerId: ctx.user!.id,
          reviewedAt: new Date(),
        })
        .where(eq(deposits.id, input.id));

      return { success: true };
    }),

  // 管理员：编辑充值订单
  updateDeposit: adminProcedure
    .input(
      z.object({
        id: z.number(),
        amount: z.string().optional(),
        txHash: z.string().optional(),
        adminNotes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { id, ...updateData } = input;

      await db
        .update(deposits)
        .set(updateData)
        .where(eq(deposits.id, id));

      return { success: true };
    }),
});
