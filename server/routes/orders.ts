import { z } from "zod";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { TRPCError } from "@trpc/server";

export const ordersRouter = router({
  // 用户：兑换商品
  redeemProduct: protectedProcedure
    .input(
      z.object({
        productId: z.number(),
        quantity: z.number().int().min(1, "Quantity must be at least 1"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = await db.getUserById(ctx.user.id);
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      // 检查账户状态
      if (user.accountStatus === "frozen") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Account is frozen" });
      }

      // 检查商品
      const product = await db.getProductById(input.productId);
      if (!product) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      }

      if (product.status !== "active") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Product is not available" });
      }

      // 检查库存
      if (product.stock !== -1 && product.stock < input.quantity) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Insufficient stock" });
      }

      // 计算总价
      const unitPrice = parseFloat(product.price);
      const totalPrice = (unitPrice * input.quantity).toFixed(8);
      const currentBalance = parseFloat(user.usdtBalance);

      // 检查余额
      if (currentBalance < parseFloat(totalPrice)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Insufficient balance" });
      }

      // 扣除积分
      const newBalance = (currentBalance - parseFloat(totalPrice)).toFixed(8);
      await db.updateUserBalance(ctx.user.id, newBalance);

      // 创建订单
      const orderId = await db.createOrder({
        userId: ctx.user.id,
        productId: input.productId,
        quantity: input.quantity,
        totalPrice: totalPrice,
        status: "pending",
        notes: null,
      });

      // 记录积分流水
      await db.createPointTransaction({
        userId: ctx.user.id,
        type: "debit",
        amount: `-${totalPrice}`,
        balanceAfter: newBalance,
        orderId: Number(orderId),
        notes: `兑换商品：${product.name} x ${input.quantity}`,
      });

      // 更新库存
      if (product.stock !== -1) {
        await db.updateProductStock(input.productId, product.stock - input.quantity);
      }

      return { success: true, orderId, newBalance };
    }),

  // 用户：查看自己的订单
  getMyOrders: protectedProcedure.query(async ({ ctx }) => {
    return await db.getOrdersByUserId(ctx.user.id);
  }),

  // 管理员：查看所有订单
  getAllOrders: adminProcedure.query(async () => {
    return await db.getAllOrders();
  }),

  // 管理员：更新订单状态
  updateOrderStatus: adminProcedure
    .input(
      z.object({
        orderId: z.number(),
        status: z.enum(["pending", "completed", "cancelled"]),
      })
    )
    .mutation(async ({ input }) => {
      await db.updateOrderStatus(input.orderId, input.status);
      return { success: true };
    }),
});
