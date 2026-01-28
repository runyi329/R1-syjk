import { boolean, decimal, int, json, mysqlEnum, mysqlTable, text, timestamp, varchar, unique, index } from "drizzle-orm/mysql-core";

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
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. 可选，仅在 OAuth 登录时使用 */
  openId: varchar("openId", { length: 64 }).unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  /** 用户名 - 用于用户名+密码注册登录 */
  username: varchar("username", { length: 64 }).unique(),
  /** 密码哈希 - 用于用户名+密码注册登录 */
  passwordHash: text("passwordHash"),
  /** 用户角色：user-普通用户，admin-旧版管理员，super_admin-超级管理员，staff_admin-普通管理员 */
  role: mysqlEnum("role", ["user", "admin", "super_admin", "staff_admin"]).default("user").notNull(),
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
  /** 备注信息 - 管理员可以为用户添加备注 */
  notes: text("notes"),
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
 * 市场数据缓存表 - 存储股票、指数等市场数据的缓存
 */
export const marketDataCache = mysqlTable("marketDataCache", {
  id: int("id").autoincrement().primaryKey(),
  /** 股票符号（如：000001.SS、0700.HK、^IXIC 等） */
  symbol: varchar("symbol", { length: 50 }).notNull(),
  /** 股票名称 */
  name: varchar("name", { length: 255 }).notNull(),
  /** 当前价格 */
  price: decimal("price", { precision: 20, scale: 8 }).notNull(),
  /** 价格变动值 */
  change: decimal("change", { precision: 20, scale: 8 }).notNull(),
  /** 价格变动百分比 */
  changePercent: decimal("changePercent", { precision: 10, scale: 4 }).notNull(),
  /** 市场区域：US、HK、CN */
  region: varchar("region", { length: 10 }).notNull(),
  /** 缓存过期时间 */
  expiresAt: timestamp("expiresAt").notNull(),
  /** 创建时间 */
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  /** 更新时间 */
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MarketDataCache = typeof marketDataCache.$inferSelect;
export type InsertMarketDataCache = typeof marketDataCache.$inferInsert;


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
 * 网站配置表 - 存储网站全局配置，如logo URL等
 */
export const siteConfigs = mysqlTable("siteConfigs", {
  id: int("id").autoincrement().primaryKey(),
  /** Logo图片URL - 首页和管理员后台使用 */
  logoUrl: text("logoUrl"),
  /** 网站标题 */
  siteTitle: varchar("siteTitle", { length: 255 }),
  /** 网站描述 */
  siteDescription: text("siteDescription"),
  /** 最后修改人ID */
  updatedBy: int("updatedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SiteConfig = typeof siteConfigs.$inferSelect;
export type InsertSiteConfig = typeof siteConfigs.$inferInsert;


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
  /** 是否为测试数据：用于区分测试数据和生产数据，防止测试污染生产数据库 */
  isTestData: boolean("isTestData").default(false).notNull(),
  /** 软删除标志：true表示已删除，false表示未删除 */
  isDeleted: boolean("isDeleted").default(false).notNull(),
  /** 删除时间戳：记录何时被删除 */
  deletedAt: timestamp("deletedAt"),
  /** 删除者ID：记录谁删除了这条记录 */
  deletedBy: int("deletedBy"),
  /** 删除原因：记录为什么删除这条记录 */
  deleteReason: text("deleteReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * 数据操作审计日志表 - 记录所有重要操作（创建、修改、删除）
 */
export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  /** 操作者用户ID */
  userId: int("userId").notNull(),
  /** 操作类型：create-创建，update-修改，delete-删除，restore-恢复 */
  operationType: mysqlEnum("operationType", ["create", "update", "delete", "restore"]).notNull(),
  /** 操作对象类型：stockUser-股票客户，stockBalance-余额记录等 */
  entityType: varchar("entityType", { length: 64 }).notNull(),
  /** 操作对象ID */
  entityId: int("entityId").notNull(),
  /** 操作前的数据（JSON格式） */
  beforeData: json("beforeData"),
  /** 操作后的数据（JSON格式） */
  afterData: json("afterData"),
  /** 操作原因/备注 */
  reason: text("reason"),
  /** 操作IP地址 */
  ipAddress: varchar("ipAddress", { length: 45 }),
  /** 操作时间戳 */
  createdAt: timestamp("createdAt").defaultNow().notNull(),
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
  /** 开始金额（用户关注的起始金额节点） */
  startAmount: decimal("startAmount", { precision: 15, scale: 2 }).notNull().default("0"),
  /** 分成百分比（1-100） */
  profitPercentage: int("profitPercentage").notNull().default(1),
  /** 授权日期（管理员设置的授权生效日期） */
  authorizationDate: timestamp("authorizationDate"),
  /** 保证金金额 */
  deposit: decimal("deposit", { precision: 15, scale: 2 }).notNull().default("0"),
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

/**
 * 管理员权限表 - 存储普通管理员的权限配置
 */
export const adminPermissions = mysqlTable("adminPermissions", {
  id: int("id").autoincrement().primaryKey(),
  /** 关联用户ID（管理员） */
  userId: int("userId").notNull().unique(),
  /** 余额管理权限 */
  balanceManagement: boolean("balanceManagement").default(false).notNull(),
  /** 用户管理权限 */
  userManagement: boolean("userManagement").default(false).notNull(),
  /** 权限管理权限 */
  permissionManagement: boolean("permissionManagement").default(false).notNull(),
  /** 会员管理权限 */
  memberManagement: boolean("memberManagement").default(false).notNull(),
  /** 员工管理权限（仅超级管理员可用） */
  staffManagement: boolean("staffManagement").default(false).notNull(),
  /** 账户状态：active-正常，disabled-禁用 */
  status: mysqlEnum("status", ["active", "disabled"]).default("active").notNull(),
  /** 创建人ID（超级管理员） */
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AdminPermission = typeof adminPermissions.$inferSelect;
export type InsertAdminPermission = typeof adminPermissions.$inferInsert;

/**
 * 员工股票权限表 - 存储员工对股票用户的访问权限
 */
export const staffStockPermissions = mysqlTable("staffStockPermissions", {
  id: int("id").autoincrement().primaryKey(),
  /** 员工用户ID（关联users表） */
  staffUserId: int("staffUserId").notNull(),
  /** 股票用户ID（关联stockUsers表） */
  stockUserId: int("stockUserId").notNull(),
  /** 创建时间 */
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  /** 创建者ID */
  createdBy: int("createdBy").notNull(),
});

export type StaffStockPermission = typeof staffStockPermissions.$inferSelect;
export type InsertStaffStockPermission = typeof staffStockPermissions.$inferInsert;


/**
 * K线数据表 - 存储加密货币历史K线数据
 */
export const klineData = mysqlTable("kline_data", {
  id: int("id").autoincrement().primaryKey(),
  /** 交易对符号，如 BTCUSDT */
  symbol: varchar("symbol", { length: 20 }).notNull(),
  /** K线时间间隔：1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 8h, 12h, 1d, 3d, 1w, 1M */
  interval: varchar("interval", { length: 5 }).notNull(),
  /** K线开盘时间（Unix时间戳，毫秒） */
  openTime: timestamp("open_time").notNull(),
  /** 开盘价 */
  open: decimal("open", { precision: 20, scale: 8 }).notNull(),
  /** 最高价 */
  high: decimal("high", { precision: 20, scale: 8 }).notNull(),
  /** 最低价 */
  low: decimal("low", { precision: 20, scale: 8 }).notNull(),
  /** 收盘价 */
  close: decimal("close", { precision: 20, scale: 8 }).notNull(),
  /** 成交量 */
  volume: decimal("volume", { precision: 20, scale: 8 }).notNull(),
  /** K线收盘时间（Unix时间戳，毫秒） */
  closeTime: timestamp("close_time").notNull(),
  /** 成交额 */
  quoteVolume: decimal("quote_volume", { precision: 20, scale: 8 }).notNull(),
  /** 成交笔数 */
  trades: int("trades").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  // 复合唯一索引：确保同一交易对、同一时间间隔、同一开盘时间的数据唯一
  symbolIntervalTimeIdx: unique("symbol_interval_time_idx").on(table.symbol, table.interval, table.openTime),
  // 查询索引：优化按交易对和时间间隔查询
  symbolIntervalIdx: index("symbol_interval_idx").on(table.symbol, table.interval),
  // 时间索引：优化按时间范围查询
  openTimeIdx: index("open_time_idx").on(table.openTime),
}));

export type KlineData = typeof klineData.$inferSelect;
export type InsertKlineData = typeof klineData.$inferInsert;

/**
 * 数据抓取任务表 - 记录数据抓取进度和状态
 */
export const fetchTasks = mysqlTable("fetchTasks", {
  id: int("id").autoincrement().primaryKey(),
  /** 交易对符号 */
  symbol: varchar("symbol", { length: 20 }).notNull(),
  /** K线时间间隔 */
  interval: varchar("interval", { length: 5 }).notNull(),
  /** 开始时间（Unix时间戳，毫秒） */
  startTime: timestamp("startTime").notNull(),
  /** 结束时间（Unix时间戳，毫秒） */
  endTime: timestamp("endTime").notNull(),
  /** 任务状态：pending-待处理，running-进行中，completed-已完成，failed-失败 */
  status: mysqlEnum("status", ["pending", "running", "completed", "failed"]).default("pending").notNull(),
  /** 已抓取的数据条数 */
  fetchedCount: int("fetchedCount").default(0).notNull(),
  /** 预计总条数 */
  totalCount: int("totalCount").default(0).notNull(),
  /** 当前抓取到的时间点（Unix时间戳，毫秒） */
  currentTime: timestamp("currentTime"),
  /** 错误信息（如果失败） */
  errorMessage: text("errorMessage"),
  /** 创建人ID */
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FetchTask = typeof fetchTasks.$inferSelect;
export type InsertFetchTask = typeof fetchTasks.$inferInsert;
