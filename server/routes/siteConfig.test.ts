import { describe, it, expect, beforeEach } from "vitest";
import { appRouter } from "../routers";
import { getDb } from "../db";
import { siteConfigs } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

describe("siteConfig Router", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(async () => {
    // 创建一个不带认证的 caller 用于测试公开接口
    caller = appRouter.createCaller({
      user: null,
      req: {} as any,
      res: {} as any,
    });

    // 清空 siteConfigs 表
    const db = await getDb();
    if (db) {
      await db.delete(siteConfigs);
    }
  });

  describe("getConfig", () => {
    it("应该返回网站配置", async () => {
      const config = await caller.siteConfig.getConfig();
      
      expect(config).toBeDefined();
      expect(config.logoUrl).toBeDefined();
      expect(config.siteTitle).toBeDefined();
      expect(config.siteDescription).toBeDefined();
    });

    it("应该返回默认配置（如果数据库为空）", async () => {
      const config = await caller.siteConfig.getConfig();
      
      expect(config.logoUrl).toBe("/logo.png");
      expect(config.siteTitle).toBe("数金研投");
      expect(config.siteDescription).toBe("RUNYI INVESTMENT");
    });

    it("应该返回保存的自定义配置", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // 插入自定义配置
      await db.insert(siteConfigs).values({
        logoUrl: "https://example.com/custom-logo.png",
        siteTitle: "自定义标题",
        siteDescription: "自定义描述",
      });

      const config = await caller.siteConfig.getConfig();
      
      expect(config.logoUrl).toBe("https://example.com/custom-logo.png");
      expect(config.siteTitle).toBe("自定义标题");
      expect(config.siteDescription).toBe("自定义描述");
    });
  });

  describe("updateConfig", () => {
    it("应该拒绝非超级管理员的更新请求", async () => {
      // 创建一个普通用户的 caller
      const userCaller = appRouter.createCaller({
        user: {
          id: 1,
          role: "user",
          openId: "test-user",
        } as any,
        req: {} as any,
        res: {} as any,
      });

      try {
        await userCaller.siteConfig.updateConfig({
          logoUrl: "https://example.com/new-logo.png",
        });
        expect.fail("应该抛出错误");
      } catch (error: any) {
        expect(error.message).toContain("只有超级管理员");
      }
    });

    it("应该允许超级管理员更新配置", async () => {
      // 创建一个超级管理员的 caller
      const adminCaller = appRouter.createCaller({
        user: {
          id: 1,
          role: "super_admin",
          openId: "admin-user",
        } as any,
        req: {} as any,
        res: {} as any,
      });

      const result = await adminCaller.siteConfig.updateConfig({
        logoUrl: "https://example.com/admin-logo.png",
        siteTitle: "管理员标题",
        siteDescription: "管理员描述",
      });

      expect(result.success).toBe(true);
      expect(result.config.logoUrl).toBe("https://example.com/admin-logo.png");
      expect(result.config.siteTitle).toBe("管理员标题");
      expect(result.config.siteDescription).toBe("管理员描述");
    });

    it("应该部分更新配置（只更新指定字段）", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // 插入初始配置
      await db.insert(siteConfigs).values({
        logoUrl: "https://example.com/initial-logo.png",
        siteTitle: "初始标题",
        siteDescription: "初始描述",
      });

      // 创建一个超级管理员的 caller
      const adminCaller = appRouter.createCaller({
        user: {
          id: 1,
          role: "super_admin",
          openId: "admin-user",
        } as any,
        req: {} as any,
        res: {} as any,
      });

      // 只更新 logoUrl
      const result = await adminCaller.siteConfig.updateConfig({
        logoUrl: "https://example.com/new-logo.png",
      });

      expect(result.success).toBe(true);
      expect(result.config.logoUrl).toBe("https://example.com/new-logo.png");
      expect(result.config.siteTitle).toBe("初始标题"); // 应该保持不变
      expect(result.config.siteDescription).toBe("初始描述"); // 应该保持不变
    });

    it("应该验证 logoUrl 必须是有效的 URL", async () => {
      // 创建一个超级管理员的 caller
      const adminCaller = appRouter.createCaller({
        user: {
          id: 1,
          role: "super_admin",
          openId: "admin-user",
        } as any,
        req: {} as any,
        res: {} as any,
      });

      try {
        await adminCaller.siteConfig.updateConfig({
          logoUrl: "not-a-valid-url",
        });
        expect.fail("应该抛出错误");
      } catch (error: any) {
        expect(error.message).toContain("Invalid");
      }
    });

    it("应该允许 logoUrl 为 undefined（不更新该字段）", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // 插入初始配置
      await db.insert(siteConfigs).values({
        logoUrl: "https://example.com/initial-logo.png",
        siteTitle: "初始标题",
      });

      // 创建一个超级管理员的 caller
      const adminCaller = appRouter.createCaller({
        user: {
          id: 1,
          role: "super_admin",
          openId: "admin-user",
        } as any,
        req: {} as any,
        res: {} as any,
      });

      // 不更新 logoUrl
      const result = await adminCaller.siteConfig.updateConfig({
        siteTitle: "新标题",
      });

      expect(result.success).toBe(true);
      expect(result.config.logoUrl).toBe("https://example.com/initial-logo.png"); // 应该保持不变
      expect(result.config.siteTitle).toBe("新标题");
    });
  });
});
