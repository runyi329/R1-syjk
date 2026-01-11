import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { siteConfigs } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * 获取或初始化网站配置
 */
async function getOrCreateSiteConfig() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const records = await db.select().from(siteConfigs).limit(1);
  
  if (records.length === 0) {
    // 创建初始配置，使用默认 logo
    await db.insert(siteConfigs).values({
      logoUrl: "/logo.png",
      siteTitle: "数金研投",
      siteDescription: "RUNYI INVESTMENT",
    });
    return {
      id: 1,
      logoUrl: "/logo.png",
      siteTitle: "数金研投",
      siteDescription: "RUNYI INVESTMENT",
      updatedBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
  
  return records[0];
}

export const siteConfigRouter = router({
  /**
   * 获取网站配置
   * 公开接口，任何人都可以访问
   */
  getConfig: publicProcedure.query(async () => {
    const config = await getOrCreateSiteConfig();
    return {
      id: config.id,
      logoUrl: config.logoUrl,
      siteTitle: config.siteTitle,
      siteDescription: config.siteDescription,
    };
  }),

  /**
   * 更新网站配置
   * 仅超级管理员可以访问
   */
  updateConfig: publicProcedure
    .input(z.object({
      logoUrl: z.string().url().optional(),
      siteTitle: z.string().max(255).optional(),
      siteDescription: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // 检查权限：仅超级管理员可以更新配置
      if (!ctx.user || ctx.user.role !== "super_admin") {
        throw new Error("只有超级管理员可以修改网站配置");
      }

      const config = await getOrCreateSiteConfig();
      
      // 构建更新数据
      const updateData: any = {
        updatedBy: ctx.user.id,
        updatedAt: new Date(),
      };
      
      if (input.logoUrl !== undefined) {
        updateData.logoUrl = input.logoUrl;
      }
      if (input.siteTitle !== undefined) {
        updateData.siteTitle = input.siteTitle;
      }
      if (input.siteDescription !== undefined) {
        updateData.siteDescription = input.siteDescription;
      }
      
      await db.update(siteConfigs)
        .set(updateData)
        .where(eq(siteConfigs.id, config.id));
      
      return {
        success: true,
        message: "网站配置已更新",
        config: {
          logoUrl: input.logoUrl || config.logoUrl,
          siteTitle: input.siteTitle || config.siteTitle,
          siteDescription: input.siteDescription || config.siteDescription,
        },
      };
    }),
});
