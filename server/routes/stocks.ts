import { z } from "zod";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { stockUsers, stockBalances, stockUserPermissions, users, type StockBalance, type StockUser } from "../../drizzle/schema";
import { eq, desc, and, asc, gte } from "drizzle-orm";

export const stocksRouter = router({
  // ==================== 股票用户管理 ====================
  
  // 获取所有股票用户
  getAllStockUsers: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const users = await db
      .select()
      .from(stockUsers)
      .orderBy(desc(stockUsers.createdAt));
    return users;
  }),

  // 获取单个股票用户
  getStockUser: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [user] = await db
        .select()
        .from(stockUsers)
        .where(eq(stockUsers.id, input.id));
      return user || null;
    }),

  // 创建股票用户
  createStockUser: adminProcedure
    .input(z.object({
      name: z.string().min(1).max(255),
      initialBalance: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [result] = await db
        .insert(stockUsers)
        .values({
          name: input.name,
          initialBalance: input.initialBalance,
          notes: input.notes || null,
          status: "active",
        });
      
      return { success: true, id: result.insertId };
    }),

  // 更新股票用户
  updateStockUser: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).max(255).optional(),
      initialBalance: z.string().optional(),
      notes: z.string().optional(),
      status: z.enum(["active", "inactive"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const { id, ...updateData } = input;
      const cleanData: Record<string, unknown> = {};
      
      if (updateData.name !== undefined) cleanData.name = updateData.name;
      if (updateData.initialBalance !== undefined) cleanData.initialBalance = updateData.initialBalance;
      if (updateData.notes !== undefined) cleanData.notes = updateData.notes;
      if (updateData.status !== undefined) cleanData.status = updateData.status;
      
      await db
        .update(stockUsers)
        .set(cleanData)
        .where(eq(stockUsers.id, id));
      
      return { success: true };
    }),

  // 删除股票用户
  deleteStockUser: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      // 先删除该用户的所有余额记录
      await db
        .delete(stockBalances)
        .where(eq(stockBalances.stockUserId, input.id));
      
      // 再删除用户
      await db
        .delete(stockUsers)
        .where(eq(stockUsers.id, input.id));
      
      return { success: true };
    }),

  // ==================== 股票余额管理 ====================

  // 获取用户的所有余额记录
  getStockBalances: adminProcedure
    .input(z.object({ stockUserId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const balances = await db
        .select()
        .from(stockBalances)
        .where(eq(stockBalances.stockUserId, input.stockUserId))
        .orderBy(asc(stockBalances.date));
      return balances;
    }),

  // 获取指定月份的余额记录
  getMonthlyBalances: adminProcedure
    .input(z.object({
      stockUserId: z.number(),
      year: z.number(),
      month: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const startDate = `${input.year}-${String(input.month).padStart(2, '0')}-01`;
      const endDate = `${input.year}-${String(input.month).padStart(2, '0')}-31`;
      
      const balances = await db
        .select()
        .from(stockBalances)
        .where(eq(stockBalances.stockUserId, input.stockUserId))
        .orderBy(asc(stockBalances.date));
      
      // 过滤指定月份的记录
      return balances.filter((b: StockBalance) => b.date >= startDate && b.date <= endDate);
    }),

  // 设置/更新某日余额
  setDailyBalance: adminProcedure
    .input(z.object({
      stockUserId: z.number(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      balance: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      // 检查是否已存在该日期的记录
      const [existing] = await db
        .select()
        .from(stockBalances)
        .where(
          and(
            eq(stockBalances.stockUserId, input.stockUserId),
            eq(stockBalances.date, input.date)
          )
        );
      
      if (existing) {
        // 更新现有记录
        await db
          .update(stockBalances)
          .set({
            balance: input.balance,
            notes: input.notes || null,
          })
          .where(eq(stockBalances.id, existing.id));
      } else {
        // 创建新记录
        await db
          .insert(stockBalances)
          .values({
            stockUserId: input.stockUserId,
            date: input.date,
            balance: input.balance,
            notes: input.notes || null,
          });
      }
      
      return { success: true };
    }),

  // 批量设置余额
  setBatchBalances: adminProcedure
    .input(z.object({
      stockUserId: z.number(),
      balances: z.array(z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        balance: z.string(),
        notes: z.string().optional(),
      })),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      for (const item of input.balances) {
        const [existing] = await db
          .select()
          .from(stockBalances)
          .where(
            and(
              eq(stockBalances.stockUserId, input.stockUserId),
              eq(stockBalances.date, item.date)
            )
          );
        
        if (existing) {
          await db
            .update(stockBalances)
            .set({
              balance: item.balance,
              notes: item.notes || null,
            })
            .where(eq(stockBalances.id, existing.id));
        } else {
          await db
            .insert(stockBalances)
            .values({
              stockUserId: input.stockUserId,
              date: item.date,
              balance: item.balance,
              notes: item.notes || null,
            });
        }
      }
      
      return { success: true };
    }),

  // 删除某日余额记录
  deleteDailyBalance: adminProcedure
    .input(z.object({
      stockUserId: z.number(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db
        .delete(stockBalances)
        .where(
          and(
            eq(stockBalances.stockUserId, input.stockUserId),
            eq(stockBalances.date, input.date)
          )
        );
      
      return { success: true };
    }),

  // ==================== 统计分析 ====================

  // 获取用户盈亏统计
  getStockUserStats: adminProcedure
    .input(z.object({ stockUserId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      // 获取用户信息
      const [user] = await db
        .select()
        .from(stockUsers)
        .where(eq(stockUsers.id, input.stockUserId));
      
      if (!user) {
        return null;
      }
      
      // 获取所有余额记录
      const balances = await db
        .select()
        .from(stockBalances)
        .where(eq(stockBalances.stockUserId, input.stockUserId))
        .orderBy(asc(stockBalances.date));
      
      const initialBalance = parseFloat(user.initialBalance);
      
      // 计算每日盈亏
      // 第一条记录：每日盈亏 = 当日余额 - 初始值
      // 后续记录：每日盈亏 = 当日余额 - 上一个登记交易日的余额
      const dailyProfits = balances.map((b: StockBalance, index: number) => {
        const currentBalance = parseFloat(b.balance);
        const previousBalance = index === 0 
          ? initialBalance  // 第一条记录：与初始值比较
          : parseFloat(balances[index - 1].balance);  // 后续记录：与上一个登记交易日比较
        const dailyProfit = currentBalance - previousBalance;
        const totalProfit = currentBalance - initialBalance;
        const profitRate = ((totalProfit / initialBalance) * 100).toFixed(2);
        
        return {
          date: b.date,
          balance: currentBalance,
          dailyProfit,
          totalProfit,
          profitRate: parseFloat(profitRate),
        };
      });
      
      // 计算总体统计
      const latestBalance = balances.length > 0 
        ? parseFloat(balances[balances.length - 1].balance) 
        : initialBalance;
      const totalProfit = latestBalance - initialBalance;
      const totalProfitRate = ((totalProfit / initialBalance) * 100).toFixed(2);
      
      return {
        user,
        initialBalance,
        latestBalance,
        totalProfit,
        totalProfitRate: parseFloat(totalProfitRate),
        dailyProfits,
        recordCount: balances.length,
      };
    }),

  // 获取所有用户的汇总统计
  getAllStockUsersStats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const users = await db
      .select()
      .from(stockUsers)
      .where(eq(stockUsers.status, "active"))
      .orderBy(desc(stockUsers.createdAt));
    
    const stats = await Promise.all(
      users.map(async (user: StockUser) => {
        const balances = await db
          .select()
          .from(stockBalances)
          .where(eq(stockBalances.stockUserId, user.id))
          .orderBy(desc(stockBalances.date));
        
        const initialBalance = parseFloat(user.initialBalance);
        const latestBalance = balances.length > 0 
          ? parseFloat(balances[0].balance) 
          : initialBalance;
        const totalProfit = latestBalance - initialBalance;
        const totalProfitRate = ((totalProfit / initialBalance) * 100).toFixed(2);
        
        return {
          user,
          initialBalance,
          latestBalance,
          totalProfit,
          totalProfitRate: parseFloat(totalProfitRate),
          lastUpdateDate: balances.length > 0 ? balances[0].date : null,
        };
      })
    );
    
    return stats;
  }),

  // ==================== 权限管理 ====================

  // 获取股票客户的已授权用户列表
  getStockUserPermissions: adminProcedure
    .input(z.object({ stockUserId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      // stockUserPermissions and users already imported at top
      
      // 查询该股票客户的所有授权记录
      const permissions = await db
        .select({
          id: stockUserPermissions.id,
          stockUserId: stockUserPermissions.stockUserId,
          userId: stockUserPermissions.userId,
          createdAt: stockUserPermissions.createdAt,
          username: users.username,
          email: users.email,
          startAmount: stockUserPermissions.startAmount,
          profitPercentage: stockUserPermissions.profitPercentage,
          authorizationDate: stockUserPermissions.authorizationDate,
          deposit: stockUserPermissions.deposit,
        })
        .from(stockUserPermissions)
        .leftJoin(users, eq(stockUserPermissions.userId, users.id))
        .where(eq(stockUserPermissions.stockUserId, input.stockUserId));
      
      return permissions;
    }),

  // 添加授权（允许某个网站用户查看某个股票客户的数据）
  addStockUserPermission: adminProcedure
    .input(z.object({
      stockUserId: z.number(),
      userId: z.number(),
      startAmount: z.string(),
      profitPercentage: z.number().min(1).max(100),
      authorizationDate: z.string().optional(),
      deposit: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      // stockUserPermissions already imported at top
      
      // 检查是否已存在该授权
      const [existing] = await db
        .select()
        .from(stockUserPermissions)
        .where(
          and(
            eq(stockUserPermissions.stockUserId, input.stockUserId),
            eq(stockUserPermissions.userId, input.userId)
          )
        );
      
      if (existing) {
        return { success: true, message: "授权已存在" };
      }
      
      // 创建授权记录
      await db
        .insert(stockUserPermissions)
        .values({
          stockUserId: input.stockUserId,
          userId: input.userId,
          startAmount: input.startAmount,
          profitPercentage: input.profitPercentage,
          authorizationDate: input.authorizationDate ? new Date(input.authorizationDate) : null,
          deposit: input.deposit || "0",
        });
      
      return { success: true, message: "授权成功" };
    }),

  // 更新授权信息
  updateStockUserPermission: adminProcedure
    .input(z.object({
      stockUserId: z.number(),
      userId: z.number(),
      startAmount: z.string(),
      profitPercentage: z.number().min(1).max(100),
      authorizationDate: z.string().optional(),
      deposit: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db
        .update(stockUserPermissions)
        .set({
          startAmount: input.startAmount,
          profitPercentage: input.profitPercentage,
          authorizationDate: input.authorizationDate ? new Date(input.authorizationDate) : null,
          deposit: input.deposit || "0",
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(stockUserPermissions.stockUserId, input.stockUserId),
            eq(stockUserPermissions.userId, input.userId)
          )
        );
      
      return { success: true, message: "更新授权信息成功" };
    }),

  // 删除授权
  removeStockUserPermission: adminProcedure
    .input(z.object({
      stockUserId: z.number(),
      userId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      // stockUserPermissions already imported at top
      
      await db
        .delete(stockUserPermissions)
        .where(
          and(
            eq(stockUserPermissions.stockUserId, input.stockUserId),
            eq(stockUserPermissions.userId, input.userId)
          )
        );
      
      return { success: true, message: "取消授权成功" };
    }),

  // 获取所有网站注册用户（用于权限设置时选择）
  getAllWebsiteUsers: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
      // users already imported at top
    
    const allUsers = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));
    
    return allUsers;
  }),

  // 获取用户可查看的股票客户列表（普通用户API）
  getMyAccessibleStockUsers: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input, ctx }) => {
      // 确保用户只能查询自己的权限
      if (ctx.user.id !== input.userId) {
        throw new Error("Unauthorized: You can only query your own permissions");
      }
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      // stockUserPermissions already imported at top
      
      // 查询该用户有权限查看的所有股票客户
      const accessibleUsers = await db
        .select({
          id: stockUsers.id,
          name: stockUsers.name,
          initialBalance: stockUsers.initialBalance,
          status: stockUsers.status,
          createdAt: stockUsers.createdAt,
        })
        .from(stockUserPermissions)
        .innerJoin(stockUsers, eq(stockUserPermissions.stockUserId, stockUsers.id))
        .where(
          and(
            eq(stockUserPermissions.userId, input.userId),
            eq(stockUsers.status, "active")
          )
        )
        .orderBy(desc(stockUsers.createdAt));
      
      return accessibleUsers;
    }),

  // 获取用户有权限查看的股票客户统计数据（普通用户API）
  getMyStockUserStats: protectedProcedure
    .input(z.object({ 
      userId: z.number(),
      stockUserId: z.number() 
    }))
    .query(async ({ input, ctx }) => {
      // 确保用户只能查询自己的数据
      if (ctx.user.id !== input.userId) {
        throw new Error("Unauthorized: You can only query your own data");
      }
      
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // 验证用户是否有权限查看该股票客户
      const [permission] = await db
        .select()
        .from(stockUserPermissions)
        .where(
          and(
            eq(stockUserPermissions.userId, input.userId),
            eq(stockUserPermissions.stockUserId, input.stockUserId)
          )
        );
      
      if (!permission) {
        throw new Error("Unauthorized: You don't have permission to view this stock user");
      }
      
      // 获取开始金额和分成百分比
      const startAmount = parseFloat(permission.startAmount);
      const profitPercentage = permission.profitPercentage;
      
      // 获取用户信息
      const [user] = await db
        .select()
        .from(stockUsers)
        .where(eq(stockUsers.id, input.stockUserId));
      
      if (!user) {
        return null;
      }
      
      // 获取所有余额记录（只获取授权日期当天及之后的记录）
      const authDate = permission.authorizationDate;
      // 将timestamp转换为YYYY-MM-DD格式的字符串
      const authDateStr = authDate ? authDate.toISOString().split('T')[0] : null;
      
      const balances = await db
        .select()
        .from(stockBalances)
        .where(
          and(
            eq(stockBalances.stockUserId, input.stockUserId),
            authDateStr ? gte(stockBalances.date, authDateStr) : undefined
          )
        )
        .orderBy(asc(stockBalances.date));
      
      const initialBalance = parseFloat(user.initialBalance);
      
      // 计算每日盈亏（基于开始金额）
      const dailyProfits = balances.map((b: StockBalance, index: number) => {
        const currentBalance = parseFloat(b.balance);
        const previousBalance = index === 0 
          ? initialBalance
          : parseFloat(balances[index - 1].balance);
        const dailyProfit = currentBalance - previousBalance;
        // 基于开始金额计算盈亏
        const totalProfit = currentBalance - startAmount;
        const profitRate = startAmount > 0 ? ((totalProfit / startAmount) * 100).toFixed(2) : "0.00";
        
        return {
          date: b.date,
          balance: currentBalance,
          dailyProfit,
          totalProfit,
          profitRate: parseFloat(profitRate),
        };
      });
      
      // 计算总体统计（基于开始金额）
      const latestBalance = balances.length > 0 
        ? parseFloat(balances[balances.length - 1].balance) 
        : initialBalance;
      const totalProfit = latestBalance - startAmount;
      const totalProfitRate = startAmount > 0 ? ((totalProfit / startAmount) * 100).toFixed(2) : "0.00";
      
      return {
        user,
        initialBalance,
        startAmount,
        profitPercentage,
        authorizationDate: permission.authorizationDate,
        deposit: permission.deposit,
        latestBalance,
        totalProfit,
        totalProfitRate: parseFloat(totalProfitRate),
        dailyProfits,
        recordCount: balances.length,
      };
    }),
});
