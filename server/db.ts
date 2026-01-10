import { eq, desc, and, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, products, orders, pointTransactions, InsertProduct, InsertOrder, InsertPointTransaction } from "../drizzle/schema";
import * as crypto from 'crypto';

// 密码哈希和验证函数
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ========== 用户管理 ==========

export async function getAllUsers() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(users).orderBy(desc(users.createdAt));
}

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserBalance(userId: number, newBalance: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ usdtBalance: newBalance }).where(eq(users.id, userId));
}

export async function updateUserStatus(userId: number, status: "active" | "frozen") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ accountStatus: status }).where(eq(users.id, userId));
}

export async function updateUserName(userId: number, name: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ name }).where(eq(users.id, userId));
}

export async function updateUserPassword(userId: number, passwordHash: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ passwordHash }).where(eq(users.id, userId));
}

export async function updateUserVipLevel(userId: number, vipLevel: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ vipLevel }).where(eq(users.id, userId));
}

export async function deleteUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // 删除用户相关的所有数据
  // 1. 删除积分流水
  await db.delete(pointTransactions).where(eq(pointTransactions.userId, userId));
  
  // 2. 删除订单
  await db.delete(orders).where(eq(orders.userId, userId));
  
  // 3. 删除充值记录
  const { deposits } = await import("../drizzle/schema");
  await db.delete(deposits).where(eq(deposits.userId, userId));
  
  // 4. 删除提现记录
  const { withdrawals } = await import("../drizzle/schema");
  await db.delete(withdrawals).where(eq(withdrawals.userId, userId));
  
  // 5. 删除钱包地址
  const { walletAddresses } = await import("../drizzle/schema");
  await db.delete(walletAddresses).where(eq(walletAddresses.userId, userId));
  
  // 6. 删除登录尝试记录
  const { loginAttempts } = await import("../drizzle/schema");
  const user = await getUserById(userId);
  if (user && user.username) {
    await db.delete(loginAttempts).where(eq(loginAttempts.username, user.username));
  }
  
  // 7. 删除密码重置记录
  const { passwordResets } = await import("../drizzle/schema");
  await db.delete(passwordResets).where(eq(passwordResets.userId, userId));
  
  // 8. 最后删除用户
  await db.delete(users).where(eq(users.id, userId));
}

// ========== 用户名+密码注册 ==========

export async function getUserByUsername(username: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function registerUserWithPassword(username: string, passwordHash: string, name: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // 生成一个唯一的openId用于内部系统
  const openId = `password_${username}_${Date.now()}`;
  
  await db.insert(users).values({
    openId,
    username,
    passwordHash,
    name,
    registerMethod: 'password',
    role: 'user',
  });
  
  // 返回新创建的用户
  return await getUserByUsername(username);
}

// ========== 积分流水 ==========

export async function createPointTransaction(transaction: InsertPointTransaction) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(pointTransactions).values(transaction);
}

export async function getPointTransactionsByUserId(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(pointTransactions).where(eq(pointTransactions.userId, userId)).orderBy(desc(pointTransactions.createdAt));
}

// ========== 商品管理 ==========

export async function getAllProducts() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(products).orderBy(desc(products.createdAt));
}

export async function getActiveProducts() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(products).where(eq(products.status, "active")).orderBy(desc(products.createdAt));
}

export async function getProductById(productId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(products).where(eq(products.id, productId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createProduct(product: InsertProduct) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(products).values(product);
}

export async function updateProduct(productId: number, updates: Partial<InsertProduct>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(products).set(updates).where(eq(products.id, productId));
}

export async function updateProductStock(productId: number, newStock: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(products).set({ stock: newStock }).where(eq(products.id, productId));
}

// ========== 订单管理 ==========

export async function createOrder(order: InsertOrder) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(orders).values(order);
  return result[0].insertId;
}

export async function getOrdersByUserId(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
}

export async function getAllOrders() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(orders).orderBy(desc(orders.createdAt));
}

export async function updateOrderStatus(orderId: number, status: "pending" | "completed" | "cancelled") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(orders).set({ status }).where(eq(orders.id, orderId));
}


// ========== 登录安全防护 ==========

/**
 * 记录登录尝试
 */
export async function recordLoginAttempt(username: string, ipAddress: string, success: boolean, failureReason?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { loginAttempts } = await import("../drizzle/schema");
  await db.insert(loginAttempts).values({
    username,
    ipAddress,
    success,
    failureReason: failureReason || null,
  });
}

/**
 * 获取用户在指定IP地址上的登录失败次数（最近24小时）
 */
export async function getLoginFailureCount(username: string, ipAddress: string): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { loginAttempts } = await import("../drizzle/schema");
  const { eq, and, gt, desc } = await import("drizzle-orm");
  
  // 获取24小时内的失败尝试
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const attempts = await db
    .select()
    .from(loginAttempts)
    .where(
      and(
        eq(loginAttempts.username, username),
        eq(loginAttempts.ipAddress, ipAddress),
        eq(loginAttempts.success, false),
        gt(loginAttempts.createdAt, twentyFourHoursAgo)
      )
    );
  
  return attempts.length;
}

/**
 * 检查账户是否被锁定
 */
export async function isAccountLocked(username: string): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const user = await getUserByUsername(username);
  if (!user) return false;
  
  // 检查用户是否被标记为锁定
  return user.accountStatus === "frozen";
}

/**
 * 锁定账户
 */
export async function lockAccount(username: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const user = await getUserByUsername(username);
  if (!user) throw new Error("User not found");
  
  await db.update(users).set({ accountStatus: "frozen" }).where(eq(users.id, user.id));
}

/**
 * 解锁账户（仅管理员）
 */
export async function unlockAccount(username: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const user = await getUserByUsername(username);
  if (!user) throw new Error("User not found");
  
  await db.update(users).set({ accountStatus: "active" }).where(eq(users.id, user.id));
}

// ========== 验证码管理 ==========

/**
 * 生成验证码token和答案
 */
export function generateCaptchaAnswer(): { answer: string; answerHash: string } {
  // 生成4位随机数字
  const answer = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  const answerHash = hashPassword(answer);
  return { answer, answerHash };
}

/**
 * 创建验证码记录
 */
export async function createCaptcha(answerHash: string): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { captchas } = await import("../drizzle/schema");
  const token = crypto.randomBytes(32).toString("hex");
  
  // 15分钟后过期
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
  
  await db.insert(captchas).values({
    token,
    answerHash,
    type: "puzzle",
    verified: false,
    failureCount: 0,
    expiresAt,
  });
  
  return token;
}

/**
 * 验证验证码
 */
export async function verifyCaptcha(token: string, answer: string): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { captchas } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");
  
  const captcha = await db.select().from(captchas).where(eq(captchas.token, token)).limit(1);
  
  if (!captcha || captcha.length === 0) {
    return false;
  }
  
  const record = captcha[0];
  
  // 检查是否已过期
  if (new Date() > record.expiresAt) {
    return false;
  }
  
  // 检查是否已验证
  if (record.verified) {
    return false;
  }
  
  // 验证答案
  const answerHash = hashPassword(answer);
  if (answerHash !== record.answerHash) {
    // 增加失败次数
    await db.update(captchas).set({ failureCount: record.failureCount + 1 }).where(eq(captchas.token, token));
    return false;
  }
  
  // 标记为已验证
  await db.update(captchas).set({ verified: true }).where(eq(captchas.token, token));
  return true;
}

/**
 * 获取验证码信息（用于前端显示）
 */
export async function getCaptchaInfo(token: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { captchas } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");
  
  const captcha = await db.select().from(captchas).where(eq(captchas.token, token)).limit(1);
  
  if (!captcha || captcha.length === 0) {
    return null;
  }
  
  const record = captcha[0];
  
  // 检查是否已过期
  if (new Date() > record.expiresAt) {
    return null;
  }
  
  return {
    token: record.token,
    verified: record.verified,
    failureCount: record.failureCount,
    expiresAt: record.expiresAt,
  };
}

/**
 * 清理过期的验证码
 */
export async function cleanupExpiredCaptchas() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { captchas } = await import("../drizzle/schema");
  const { lt } = await import("drizzle-orm");
  
  await db.delete(captchas).where(lt(captchas.expiresAt, new Date()));
}


// ========== 密码重置管理 ==========

/**
 * 生成密码重置验证码
 */
export function generatePasswordResetCode(): { code: string; codeHash: string } {
  // 生成4位随机数字
  const code = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  const codeHash = hashPassword(code);
  return { code, codeHash };
}

/**
 * 创建密码重置请求
 */
export async function createPasswordReset(userId: number, email: string, codeHash: string): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { passwordResets } = await import("../drizzle/schema");
  const token = crypto.randomBytes(32).toString("hex");
  
  // 15分钟后过期
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
  
  await db.insert(passwordResets).values({
    userId,
    email,
    token,
    codeHash,
    used: false,
    failureCount: 0,
    expiresAt,
  });
  
  return token;
}

/**
 * 验证密码重置码
 */
export async function verifyPasswordResetCode(token: string, code: string): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { passwordResets } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");
  
  const resetRecord = await db.select().from(passwordResets).where(eq(passwordResets.token, token)).limit(1);
  
  if (!resetRecord || resetRecord.length === 0) {
    return false;
  }
  
  const record = resetRecord[0];
  
  // 检查是否已过期
  if (new Date() > record.expiresAt) {
    return false;
  }
  
  // 检查是否已使用
  if (record.used) {
    return false;
  }
  
  // 验证码
  const codeHash = hashPassword(code);
  if (codeHash !== record.codeHash) {
    // 增加失败次数
    await db.update(passwordResets).set({ failureCount: record.failureCount + 1 }).where(eq(passwordResets.token, token));
    return false;
  }
  
  // 标记为已使用
  await db.update(passwordResets).set({ used: true }).where(eq(passwordResets.token, token));
  return true;
}

/**
 * 获取密码重置请求信息
 */
export async function getPasswordResetInfo(token: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { passwordResets } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");
  
  const resetRecord = await db.select().from(passwordResets).where(eq(passwordResets.token, token)).limit(1);
  
  if (!resetRecord || resetRecord.length === 0) {
    return null;
  }
  
  const record = resetRecord[0];
  
  // 检查是否已过期
  if (new Date() > record.expiresAt) {
    return null;
  }
  
  return {
    token: record.token,
    userId: record.userId,
    email: record.email,
    used: record.used,
    failureCount: record.failureCount,
    expiresAt: record.expiresAt,
  };
}

/**
 * 重置用户密码
 */
export async function resetUserPassword(userId: number, newPasswordHash: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(users).set({ passwordHash: newPasswordHash }).where(eq(users.id, userId));
}

/**
 * 清理过期的密码重置请求
 */
export async function cleanupExpiredPasswordResets() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { passwordResets } = await import("../drizzle/schema");
  const { lt } = await import("drizzle-orm");
  
  await db.delete(passwordResets).where(lt(passwordResets.expiresAt, new Date()));
}

/**
 * 检查邮箱是否已注册
 */
export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { eq } = await import("drizzle-orm");
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  
  return result.length > 0 ? result[0] : null;
}
