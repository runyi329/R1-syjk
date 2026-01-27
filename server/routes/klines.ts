import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { klineData, fetchTasks } from "../../drizzle/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import {
  fetchHistoricalKlines,
  calculateTotalCount,
} from "../binanceService";

/**
 * K线数据路由
 */
export const klinesRouter = router({
  /**
   * 开始抓取K线数据
   */
  startFetch: protectedProcedure
    .input(
      z.object({
        symbol: z.string().default("BTCUSDT"),
        interval: z.string().default("1m"),
        startTime: z.number(), // Unix时间戳（毫秒）
        endTime: z.number(), // Unix时间戳（毫秒）
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const { symbol, interval, startTime, endTime } = input;

      // 计算预计数据条数
      const totalCount = calculateTotalCount(interval, startTime, endTime);

      // 创建抓取任务
      const [task] = await db.insert(fetchTasks).values({
        symbol,
        interval,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        status: "pending",
        totalCount,
        createdBy: ctx.user.id,
      });

      // 异步开始抓取（不阻塞响应）
      fetchHistoricalKlines(
        symbol,
        interval,
        startTime,
        endTime,
        task.insertId,
        ctx.user.id
      ).catch((error) => {
        console.error("Failed to fetch historical klines:", error);
      });

      return {
        success: true,
        taskId: task.insertId,
        totalCount,
      };
    }),

  /**
   * 查询抓取任务进度
   */
  getTaskProgress: protectedProcedure
    .input(
      z.object({
        taskId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const [task] = await db
        .select()
        .from(fetchTasks)
        .where(eq(fetchTasks.id, input.taskId))
        .limit(1);

      if (!task) {
        throw new Error("Task not found");
      }

      return {
        taskId: task.id,
        symbol: task.symbol,
        interval: task.interval,
        status: task.status,
        fetchedCount: task.fetchedCount,
        totalCount: task.totalCount,
        progress: task.totalCount > 0 ? (task.fetchedCount / task.totalCount) * 100 : 0,
        currentTime: task.currentTime,
        errorMessage: task.errorMessage,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
      };
    }),

  /**
   * 查询所有抓取任务
   */
  getAllTasks: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    const tasks = await db
      .select()
      .from(fetchTasks)
      .where(eq(fetchTasks.createdBy, ctx.user.id))
      .orderBy(desc(fetchTasks.createdAt))
      .limit(50);

    return tasks.map((task) => ({
      taskId: task.id,
      symbol: task.symbol,
      interval: task.interval,
      status: task.status,
      fetchedCount: task.fetchedCount,
      totalCount: task.totalCount,
      progress: task.totalCount > 0 ? (task.fetchedCount / task.totalCount) * 100 : 0,
      currentTime: task.currentTime,
      errorMessage: task.errorMessage,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    }));
  }),

  /**
   * 查询K线数据
   */
  getKlineData: protectedProcedure
    .input(
      z.object({
        symbol: z.string().default("BTCUSDT"),
        interval: z.string().default("1m"),
        startTime: z.number().optional(), // Unix时间戳（毫秒）
        endTime: z.number().optional(), // Unix时间戳（毫秒）
        limit: z.number().min(1).max(5000).default(1000),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const { symbol, interval, startTime, endTime, limit } = input;

      let query = db
        .select()
        .from(klineData)
        .where(
          and(
            eq(klineData.symbol, symbol),
            eq(klineData.interval, interval),
            startTime ? gte(klineData.openTime, new Date(startTime)) : undefined,
            endTime ? lte(klineData.openTime, new Date(endTime)) : undefined
          )
        )
        .orderBy(klineData.openTime)
        .limit(limit);

      const data = await query;

      return data.map((row) => ({
        openTime: row.openTime.getTime(),
        open: parseFloat(row.open),
        high: parseFloat(row.high),
        low: parseFloat(row.low),
        close: parseFloat(row.close),
        volume: parseFloat(row.volume),
        closeTime: row.closeTime.getTime(),
        quoteVolume: parseFloat(row.quoteVolume),
        trades: row.trades,
      }));
    }),

  /**
   * 获取K线数据统计信息
   */
  getKlineStats: protectedProcedure
    .input(
      z.object({
        symbol: z.string().default("BTCUSDT"),
        interval: z.string().default("1m"),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const { symbol, interval } = input;

      const data = await db
        .select()
        .from(klineData)
        .where(and(eq(klineData.symbol, symbol), eq(klineData.interval, interval)))
        .orderBy(klineData.openTime)
        .limit(1);

      const latestData = await db
        .select()
        .from(klineData)
        .where(and(eq(klineData.symbol, symbol), eq(klineData.interval, interval)))
        .orderBy(desc(klineData.openTime))
        .limit(1);

      const countResult = await db
        .select()
        .from(klineData)
        .where(and(eq(klineData.symbol, symbol), eq(klineData.interval, interval)));

      return {
        symbol,
        interval,
        totalCount: countResult.length,
        earliestTime: data[0]?.openTime.getTime() || null,
        latestTime: latestData[0]?.openTime.getTime() || null,
      };
    }),
});
