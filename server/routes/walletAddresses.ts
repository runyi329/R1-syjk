import { z } from "zod";
import { publicProcedure, router, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { walletAddresses, users } from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const walletAddressesRouter = router({
  // 创建钱包地址（绑定）
  create: publicProcedure
    .input(
      z.object({
        address: z.string(),
        network: z.string(),
        label: z.string().optional(),
        qrCodeUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [walletAddress] = await db.insert(walletAddresses).values({
        userId: ctx.user.id,
        address: input.address,
        network: input.network,
        label: input.label,
        qrCodeUrl: input.qrCodeUrl,
        status: "pending",
      });

      return { success: true, walletAddressId: walletAddress.insertId };
    }),

  // 获取当前用户的钱包地址列表
  getMyWalletAddresses: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const userWalletAddresses = await db
      .select()
      .from(walletAddresses)
      .where(eq(walletAddresses.userId, ctx.user.id))
      .orderBy(desc(walletAddresses.createdAt));

    return userWalletAddresses;
  }),

  // 获取当前用户已批准的钱包地址
  getMyApprovedWalletAddresses: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const approvedAddresses = await db
      .select()
      .from(walletAddresses)
      .where(
        and(
          eq(walletAddresses.userId, ctx.user.id),
          eq(walletAddresses.status, "approved")
        )
      )
      .orderBy(desc(walletAddresses.createdAt));

    return approvedAddresses;
  }),

  // 删除钱包地址
  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // 验证地址属于当前用户
      const [walletAddress] = await db
        .select()
        .from(walletAddresses)
        .where(
          and(
            eq(walletAddresses.id, input.id),
            eq(walletAddresses.userId, ctx.user.id)
          )
        );

      if (!walletAddress) {
        throw new TRPCError({ code: "NOT_FOUND", message: "钱包地址不存在" });
      }

      await db
        .delete(walletAddresses)
        .where(eq(walletAddresses.id, input.id));

      return { success: true };
    }),

  // 管理员：获取所有待审核的钱包地址
  getPendingWalletAddresses: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const result = await db
      .select({
        walletAddress: walletAddresses,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(walletAddresses)
      .leftJoin(users, eq(walletAddresses.userId, users.id))
      .where(eq(walletAddresses.status, "pending"))
      .orderBy(desc(walletAddresses.createdAt));

    return result;
  }),

  // 管理员：获取所有钱包地址
  getAllWalletAddresses: adminProcedure
    .input(
      z.object({
        status: z.enum(["pending", "approved", "rejected"]).optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      let query = db
        .select({
          walletAddress: walletAddresses,
          user: {
            id: users.id,
            name: users.name,
            email: users.email,
          },
        })
        .from(walletAddresses)
        .leftJoin(users, eq(walletAddresses.userId, users.id))
        .orderBy(desc(walletAddresses.createdAt));

      if (input?.status) {
        query = query.where(eq(walletAddresses.status, input.status)) as any;
      }

      const result = await query;
      return result;
    }),

  // 管理员：批准钱包地址
  approveWalletAddress: adminProcedure
    .input(
      z.object({
        id: z.number(),
        adminNotes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [walletAddress] = await db
        .select()
        .from(walletAddresses)
        .where(eq(walletAddresses.id, input.id));

      if (!walletAddress) {
        throw new TRPCError({ code: "NOT_FOUND", message: "钱包地址不存在" });
      }

      await db
        .update(walletAddresses)
        .set({
          status: "approved",
          adminNotes: input.adminNotes,
          reviewerId: ctx.user!.id,
          reviewedAt: new Date(),
        })
        .where(eq(walletAddresses.id, input.id));

      return { success: true };
    }),

  // 管理员：拒绝钱包地址
  rejectWalletAddress: adminProcedure
    .input(
      z.object({
        id: z.number(),
        adminNotes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [walletAddress] = await db
        .select()
        .from(walletAddresses)
        .where(eq(walletAddresses.id, input.id));

      if (!walletAddress) {
        throw new TRPCError({ code: "NOT_FOUND", message: "钱包地址不存在" });
      }

      await db
        .update(walletAddresses)
        .set({
          status: "rejected",
          adminNotes: input.adminNotes,
          reviewerId: ctx.user!.id,
          reviewedAt: new Date(),
        })
        .where(eq(walletAddresses.id, input.id));

      return { success: true };
    }),
});
