import { Router } from "express";
import bcrypt from "bcrypt";
import { SignJWT } from "jose";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { ENV } from "../_core/env";

const router = Router();

/**
 * 注册新用户
 * POST /api/auth/register
 */
router.post("/register", async (req, res) => {
  try {
    const { username, password, name, email } = req.body;

    // 验证必填字段
    if (!username || !password) {
      return res.status(400).json({ error: "用户名和密码不能为空" });
    }

    // 验证用户名长度
    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ error: "用户名长度必须在3-20个字符之间" });
    }

    // 验证密码长度
    if (password.length < 6) {
      return res.status(400).json({ error: "密码长度至少为6个字符" });
    }

    // 检查用户名是否已存在
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "数据库连接失败" });
    }
    
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (existingUser.length > 0) {
      return res.status(400).json({ error: "用户名已存在" });
    }

    // 加密密码
    const passwordHash = await bcrypt.hash(password, 10);

    // 创建新用户
    const [newUser] = await db.insert(users).values({
      username,
      passwordHash,
      name: name || username,
      email: email || null,
      registerMethod: "password",
      role: "user",
      accountStatus: "active",
      vipLevel: 0,
      usdtBalance: "0.00000000",
    });

    // 生成 JWT token
    const secret = new TextEncoder().encode(ENV.JWT_SECRET);
    const token = await new SignJWT({
        userId: newUser.insertId,
        username,
        role: "user",
      })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(secret);

    // 设置 cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7天
    });

    res.json({
      success: true,
      user: {
        id: newUser.insertId,
        username,
        name: name || username,
        role: "user",
      },
    });
  } catch (error) {
    console.error("注册错误:", error);
    res.status(500).json({ error: "注册失败，请稍后重试" });
  }
});

/**
 * 用户登录
 * POST /api/auth/login
 */
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // 验证必填字段
    if (!username || !password) {
      return res.status(400).json({ error: "用户名和密码不能为空" });
    }

    // 查找用户
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "数据库连接失败" });
    }
    
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (!user) {
      return res.status(401).json({ error: "用户名或密码错误" });
    }

    // 检查账户状态
    if (user.accountStatus === "frozen") {
      return res.status(403).json({ error: "账户已被冻结，请联系管理员" });
    }

    // 验证密码
    if (!user.passwordHash) {
      return res.status(401).json({ error: "该账户未设置密码，请使用其他登录方式" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "用户名或密码错误" });
    }

    // 更新最后登录时间
    await db
      .update(users)
      .set({ lastSignedIn: new Date() })
      .where(eq(users.id, user.id));

    // 生成 JWT token
    const secret = new TextEncoder().encode(ENV.JWT_SECRET);
    const token = await new SignJWT({
        userId: user.id,
        username: user.username,
        role: user.role,
      })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(secret);

    // 设置 cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7天
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        vipLevel: user.vipLevel,
        usdtBalance: user.usdtBalance,
      },
    });
  } catch (error) {
    console.error("登录错误:", error);
    res.status(500).json({ error: "登录失败，请稍后重试" });
  }
});

/**
 * 用户登出
 * POST /api/auth/logout
 */
router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ success: true });
});

export default router;
