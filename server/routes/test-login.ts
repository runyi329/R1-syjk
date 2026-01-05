import { Router } from "express";
import { getUserByOpenId, upsertUser } from "../db.js";

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
    
    // 设置session
    req.session.userId = user.id;
    req.session.openId = user.openId;
    
    // 重定向到首页
    res.redirect("/");
  } catch (error) {
    console.error("[Test Login] Error:", error);
    res.status(500).json({ error: "测试登录失败" });
  }
});

export default router;
