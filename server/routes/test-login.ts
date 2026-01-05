import { Router } from "express";
import { getUserByOpenId, upsertUser } from "../db.js";
import { sdk } from "../_core/sdk.js";
import { getSessionCookieOptions } from "../_core/cookies.js";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

const router = Router();

// 测试登录端点 - 仅用于开发和演示
router.get("/test-login", async (req: any, res: any) => {
  try {
    const testOpenId = "test-user-demo-001";
    const testEmail = "test@demo.com";
    
    // 查找或创建测试用户
    let user = await getUserByOpenId(testOpenId);
    
    if (!user) {
      // 创建新的测试用户
      await upsertUser({
        openId: testOpenId,
        email: testEmail,
        name: "测试用户",
        role: "user",
      });
      user = await getUserByOpenId(testOpenId);
    }
    
    if (!user) {
      throw new Error("创建测试用户失败");
    }
    
    // 创建session token
    const sessionToken = await sdk.createSessionToken(user.openId, {
      name: user.name || "测试用户",
      expiresInMs: ONE_YEAR_MS,
    });
    
    // 设置cookie
    const cookieOptions = getSessionCookieOptions(req);
    res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
    
    // 重定向到首页
    res.redirect("/");
  } catch (error) {
    console.error("[Test Login] Error:", error);
    res.status(500).json({ error: "测试登录失败" });
  }
});

export default router;
