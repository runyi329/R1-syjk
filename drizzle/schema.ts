import { decimal, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  /** USDT积分余额，使用decimal(20,8)存储，支持8位小数精度 */
  usdtBalance: decimal("usdtBalance", { precision: 20, scale: 8 }).default("0.00000000").notNull(),
  /** 账户状态：active-正常，frozen-冻结 */
  accountStatus: mysqlEnum("accountStatus", ["active", "frozen"]).default("active").notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * 商品表 - 用于积分兑换
 */
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  /** 商品名称 */
  name: varchar("name", { length: 255 }).notNull(),
  /** 商品描述 */
  description: text("description"),
  /** 兑换所需USDT积分 */
  price: decimal("price", { precision: 20, scale: 8 }).notNull(),
  /** 库存数量，-1表示无限库存 */
  stock: int("stock").default(-1).notNull(),
  /** 商品图片URL */
  imageUrl: text("imageUrl"),
  /** 商品状态：active-上架，inactive-下架 */
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * 订单表 - 记录用户兑换历史
 */
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  /** 关联用户ID */
  userId: int("userId").notNull(),
  /** 关联商品ID */
  productId: int("productId").notNull(),
  /** 兑换数量 */
  quantity: int("quantity").notNull(),
  /** 消耗的USDT积分总额 */
  totalPrice: decimal("totalPrice", { precision: 20, scale: 8 }).notNull(),
  /** 订单状态：pending-待处理，completed-已完成，cancelled-已取消 */
  status: mysqlEnum("status", ["pending", "completed", "cancelled"]).default("pending").notNull(),
  /** 订单备注 */
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

/**
 * 积分流水表 - 记录所有积分变动，用于审计和对账
 */
export const pointTransactions = mysqlTable("pointTransactions", {
  id: int("id").autoincrement().primaryKey(),
  /** 关联用户ID */
  userId: int("userId").notNull(),
  /** 变动类型：credit-充值，debit-扣除，freeze-冻结，unfreeze-解冻 */
  type: mysqlEnum("type", ["credit", "debit", "freeze", "unfreeze"]).notNull(),
  /** 变动金额（USDT），正数表示增加，负数表示减少 */
  amount: decimal("amount", { precision: 20, scale: 8 }).notNull(),
  /** 变动后的余额 */
  balanceAfter: decimal("balanceAfter", { precision: 20, scale: 8 }).notNull(),
  /** 关联订单ID（如果是兑换扣除） */
  orderId: int("orderId"),
  /** 操作员ID（管理员操作时记录） */
  operatorId: int("operatorId"),
  /** 备注说明 */
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PointTransaction = typeof pointTransactions.$inferSelect;
export type InsertPointTransaction = typeof pointTransactions.$inferInsert;