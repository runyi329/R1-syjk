import { z } from "zod";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { TRPCError } from "@trpc/server";

export const productsRouter = router({
  // 公开：获取所有上架商品
  getActiveProducts: publicProcedure.query(async () => {
    return await db.getActiveProducts();
  }),

  // 管理员：获取所有商品（包括下架）
  getAllProducts: adminProcedure.query(async () => {
    return await db.getAllProducts();
  }),

  // 管理员：创建新商品
  createProduct: adminProcedure
    .input(
      z.object({
        name: z.string().min(1, "Product name is required"),
        description: z.string().optional(),
        price: z.string().regex(/^\d+(\.\d{1,8})?$/, "Invalid price"),
        stock: z.number().int().default(-1),
        imageUrl: z.string().optional(),
        status: z.enum(["active", "inactive"]).default("active"),
      })
    )
    .mutation(async ({ input }) => {
      await db.createProduct({
        name: input.name,
        description: input.description || null,
        price: input.price,
        stock: input.stock,
        imageUrl: input.imageUrl || null,
        status: input.status,
      });

      return { success: true };
    }),

  // 管理员：更新商品信息
  updateProduct: adminProcedure
    .input(
      z.object({
        productId: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        price: z.string().regex(/^\d+(\.\d{1,8})?$/).optional(),
        stock: z.number().int().optional(),
        imageUrl: z.string().optional(),
        status: z.enum(["active", "inactive"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { productId, ...updates } = input;

      const product = await db.getProductById(productId);
      if (!product) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      }

      const updateData: Record<string, any> = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description || null;
      if (updates.price !== undefined) updateData.price = updates.price;
      if (updates.stock !== undefined) updateData.stock = updates.stock;
      if (updates.imageUrl !== undefined) updateData.imageUrl = updates.imageUrl || null;
      if (updates.status !== undefined) updateData.status = updates.status;

      await db.updateProduct(productId, updateData);

      return { success: true };
    }),

  // 管理员：删除商品（实际是下架）
  deleteProduct: adminProcedure
    .input(z.object({ productId: z.number() }))
    .mutation(async ({ input }) => {
      const product = await db.getProductById(input.productId);
      if (!product) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      }

      await db.updateProduct(input.productId, { status: "inactive" });

      return { success: true };
    }),
});
