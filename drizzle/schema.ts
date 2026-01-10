import { boolean, decimal, int, mysqlEnum, mysqlTable, text, timestamp, varchar, unique, index } from "drizzle-orm/mysql-core";

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
  /** 用户名 - 用于用户名+密码注册登录 */
  username: varchar("username", { length: 64 }).unique(),
  /** 密码哈希 - 用于用户名+密码注册登录 */
  passwordHash: text("passwordHash"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  /** 注册方式：oauth-OAuth登录，password-用户名密码注册 */
  registerMethod: mysqlEnum("registerMethod", ["oauth", "password"]).default("oauth").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  /** USDT积分余额，使用decimal(20,8)存储，支持8位小数精度 */
  usdtBalance: decimal("usdtBalance", { precision: 20, scale: 8 }).default("0.00000000").notNull(),
  /** 账户状态：active-正常，frozen-冻结 */
  accountStatus: mysqlEnum("accountStatus", ["active", "frozen"]).default("active").notNull(),
  /** VIP等级：0-普通用户，1-VIP1，2-VIP2，3-VIP3，4-VIP4，5-VIP5 */
  vipLevel: int("vipLevel").default(0).notNull(),
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
/**
 * 充值订单表 - 记录用户充值申请
 */
export const deposits = mysqlTable("deposits", {
  id: int("id").autoincrement().primaryKey(),
  /** 关联用户ID */
  userId: int("userId").notNull(),
  /** 充值金额（USDT） */
  amount: decimal("amount", { precision: 20, scale: 8 }).notNull(),
  /** 充值网络：aptos, ethereum, bsc, polygon */
  network: varchar("network", { length: 50 }).notNull(),
  /** 充值地址（收款地址） */
  depositAddress: varchar("depositAddress", { length: 255 }).notNull(),
  /** 交易哈希（用户提交的链上交易ID） */
  txHash: varchar("txHash", { length: 255 }),
  /** 订单状态：pending-待确认，confirmed-已到账，failed-失败 */
  status: mysqlEnum("status", ["pending", "confirmed", "failed"]).default("pending").notNull(),
  /** 管理员备注 */
  adminNotes: text("adminNotes"),
  /** 审核人ID */
  reviewerId: int("reviewerId"),
  /** 审核时间 */
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Deposit = typeof deposits.$inferSelect;
export type InsertDeposit = typeof deposits.$inferInsert;

/**
 * 钱包地址表 - 用户绑定的提现地址
 */
export const walletAddresses = mysqlTable("walletAddresses", {
  id: int("id").autoincrement().primaryKey(),
  /** 关联用户ID */
  userId: int("userId").notNull(),
  /** 钱包地址 */
  address: varchar("address", { length: 255 }).notNull(),
  /** 网络类型：aptos, ethereum, bsc, polygon */
  network: varchar("network", { length: 50 }).notNull(),
  /** 地址标签（用户自定义） */
  label: varchar("label", { length: 100 }),
  /** 二维码图片URL */
  qrCodeUrl: text("qrCodeUrl"),
  /** 审核状态：pending-待审核，approved-已批准，rejected-已拒绝 */
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  /** 管理员备注 */
  adminNotes: text("adminNotes"),
  /** 审核人ID */
  reviewerId: int("reviewerId"),
  /** 审核时间 */
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WalletAddress = typeof walletAddresses.$inferSelect;
export type InsertWalletAddress = typeof walletAddresses.$inferInsert;

/**
 * 提现订单表 - 记录用户提现申请
 */
export const withdrawals = mysqlTable("withdrawals", {
  id: int("id").autoincrement().primaryKey(),
  /** 关联用户ID */
  userId: int("userId").notNull(),
  /** 关联钱包地址ID */
  walletAddressId: int("walletAddressId").notNull(),
  /** 提现金额（USDT） */
  amount: decimal("amount", { precision: 20, scale: 8 }).notNull(),
  /** 手续费 */
  fee: decimal("fee", { precision: 20, scale: 8 }).notNull(),
  /** 实际到账金额 */
  actualAmount: decimal("actualAmount", { precision: 20, scale: 8 }).notNull(),
  /** 提现网络 */
  network: varchar("network", { length: 50 }).notNull(),
  /** 提现地址 */
  withdrawAddress: varchar("withdrawAddress", { length: 255 }).notNull(),
  /** 交易哈希（管理员处理后填写） */
  txHash: varchar("txHash", { length: 255 }),
  /** 订单状态：pending-待审核，approved-已批准，processing-处理中，completed-已完成，rejected-已拒绝 */
  status: mysqlEnum("status", ["pending", "approved", "processing", "completed", "rejected"]).default("pending").notNull(),
  /** 拒绝原因 */
  rejectReason: text("rejectReason"),
  /** 管理员备注 */
  adminNotes: text("adminNotes"),
  /** 审核人ID */
  reviewerId: int("reviewerId"),
  /** 审核时间 */
  reviewedAt: timestamp("reviewedAt"),
  /** 完成时间 */
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Withdrawal = typeof withdrawals.$inferSelect;
export type InsertWithdrawal = typeof withdrawals.$inferInsert;


/**
 * 登录尝试表 - 记录登录失败尝试，用于防暴力破解
 */
export const loginAttempts = mysqlTable("loginAttempts", {
  id: int("id").autoincrement().primaryKey(),
  /** 用户名 */
  username: varchar("username", { length: 64 }).notNull(),
  /** 登录IP地址 */
  ipAddress: varchar("ipAddress", { length: 45 }).notNull(),
  /** 是否成功：true-成功，false-失败 */
  success: boolean("success").notNull().default(false),
  /** 失败原因（如果失败） */
  failureReason: varchar("failureReason", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LoginAttempt = typeof loginAttempts.$inferSelect;
export type InsertLoginAttempt = typeof loginAttempts.$inferInsert;

/**
 * 验证码表 - 存储滑动拼图验证码信息
 */
export const captchas = mysqlTable("captchas", {
  id: int("id").autoincrement().primaryKey(),
  /** 验证码token，用于标识一个验证码实例 */
  token: varchar("token", { length: 128 }).notNull().unique(),
  /** 验证码答案（4位数字，加密存储） */
  answerHash: varchar("answerHash", { length: 255 }).notNull(),
  /** 验证码类型：puzzle-滑动拼图 */
  type: mysqlEnum("type", ["puzzle"]).default("puzzle").notNull(),
  /** 是否已验证 */
  verified: boolean("verified").notNull().default(false),
  /** 验证失败次数 */
  failureCount: int("failureCount").default(0).notNull(),
  /** 过期时间（15分钟后过期） */
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Captcha = typeof captchas.$inferSelect;
export type InsertCaptcha = typeof captchas.$inferInsert;


/**
 * 密码重置表 - 存储密码重置请求和验证码
 */
export const passwordResets = mysqlTable("passwordResets", {
  id: int("id").autoincrement().primaryKey(),
  /** 用户ID */
  userId: int("userId").notNull(),
  /** 用户邮箱 */
  email: varchar("email", { length: 320 }).notNull(),
  /** 重置码token，用于标识一个密码重置请求 */
  token: varchar("token", { length: 128 }).notNull().unique(),
  /** 验证码（4位数字，加密存储） */
  codeHash: varchar("codeHash", { length: 255 }).notNull(),
  /** 是否已使用 */
  used: boolean("used").notNull().default(false),
  /** 验证失败次数 */
  failureCount: int("failureCount").default(0).notNull(),
  /** 过期时间（15分钟后过期） */
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PasswordReset = typeof passwordResets.$inferSelect;
export type InsertPasswordReset = typeof passwordResets.$inferInsert;


/**
 * 累计收益表 - 存储全局累计收益数据，所有用户共享
 */
export const cumulativeProfit = mysqlTable("cumulativeProfit", {
  id: int("id").autoincrement().primaryKey(),
  /** 累计收益金额 */
  amount: decimal("amount", { precision: 20, scale: 2 }).notNull(),
  /** 最后更新时间 */
  lastUpdatedAt: timestamp("lastUpdatedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CumulativeProfit = typeof cumulativeProfit.$inferSelect;
export type InsertCumulativeProfit = typeof cumulativeProfit.$inferInsert;


/**
 * 股票用户表 - A股管理功能，存储股票账户用户
 */
export const stockUsers = mysqlTable("stockUsers", {
  id: int("id").autoincrement().primaryKey(),
  /** 用户名/客户名称 */
  name: varchar("name", { length: 255 }).notNull(),
  /** 起始金额（初始资金） */
  initialBalance: decimal("initialBalance", { precision: 20, scale: 2 }).notNull(),
  /** 备注 */
  notes: text("notes"),
  /** 状态：active-活跃，inactive-停用 */
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StockUser = typeof stockUsers.$inferSelect;
export type InsertStockUser = typeof stockUsers.$inferInsert;

/**
 * 股票余额记录表 - 记录每日账户余额
 */
export const stockBalances = mysqlTable("stockBalances", {
  id: int("id").autoincrement().primaryKey(),
  /** 关联股票用户ID */
  stockUserId: int("stockUserId").notNull(),
  /** 日期（格式：YYYY-MM-DD） */
  date: varchar("date", { length: 10 }).notNull(),
  /** 当日余额 */
  balance: decimal("balance", { precision: 20, scale: 2 }).notNull(),
  /** 备注 */
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StockBalance = typeof stockBalances.$inferSelect;
export type InsertStockBalance = typeof stockBalances.$inferInsert;

/**
 * 股票用户权限表 - 控制哪些网站用户可以查看哪些股票客户的数据
 */
export const stockUserPermissions = mysqlTable("stockUserPermissions", {
  id: int("id").autoincrement().primaryKey(),
  /** 关联股票用户ID（股票客户） */
  stockUserId: int("stockUserId").notNull(),
  /** 关联网站用户ID（可以查看该股票客户数据的网站注册用户） */
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  // 唯一约束：一个股票用户和一个网站用户的组合只能有一条记录
  uniquePermission: unique("unique_permission").on(table.stockUserId, table.userId),
  // 索引优化查询性能
  stockUserIdIdx: index("stockUserId_idx").on(table.stockUserId),
  userIdIdx: index("userId_idx").on(table.userId),
}));

export type StockUserPermission = typeof stockUserPermissions.$inferSelect;
export type InsertStockUserPermission = typeof stockUserPermissions.$inferInsert;
