import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { cumulativeProfit } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

// 初始累计收益金额（881万）
const INITIAL_PROFIT = 8810000;
// 每秒增长金额（约每秒1.5-2.5元随机）
const PROFIT_PER_SECOND_MIN = 1.5;
const PROFIT_PER_SECOND_MAX = 2.5;

/**
 * 获取或初始化累计收益记录
 */
async function getOrCreateProfitRecord() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const records = await db.select().from(cumulativeProfit).limit(1);
  
  if (records.length === 0) {
    // 创建初始记录
    await db.insert(cumulativeProfit).values({
      amount: INITIAL_PROFIT.toFixed(2),
      lastUpdatedAt: new Date(),
    });
    return {
      id: 1,
      amount: INITIAL_PROFIT.toFixed(2),
      lastUpdatedAt: new Date(),
      createdAt: new Date(),
    };
  }
  
  return records[0];
}

/**
 * 计算基于时间的收益增量
 */
function calculateProfitIncrement(lastUpdatedAt: Date): number {
  const now = new Date();
  const secondsElapsed = Math.floor((now.getTime() - lastUpdatedAt.getTime()) / 1000);
  
  if (secondsElapsed <= 0) return 0;
  
  // 使用固定的平均增长率计算增量（避免随机性导致的不一致）
  const avgProfitPerSecond = (PROFIT_PER_SECOND_MIN + PROFIT_PER_SECOND_MAX) / 2;
  return secondsElapsed * avgProfitPerSecond;
}

export const cumulativeProfitRouter = router({
  /**
   * 获取当前累计收益
   * 返回基于时间计算的最新收益值
   */
  getCurrent: publicProcedure.query(async () => {
    const record = await getOrCreateProfitRecord();
    const baseAmount = parseFloat(record.amount);
    const increment = calculateProfitIncrement(record.lastUpdatedAt);
    const currentAmount = baseAmount + increment;
    
    return {
      amount: currentAmount,
      lastUpdatedAt: record.lastUpdatedAt,
      baseAmount: baseAmount,
      increment: increment,
    };
  }),

  /**
   * 同步更新累计收益到数据库
   * 前端定期调用此接口，将计算的增量持久化到数据库
   */
  sync: publicProcedure.mutation(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const record = await getOrCreateProfitRecord();
    const baseAmount = parseFloat(record.amount);
    const increment = calculateProfitIncrement(record.lastUpdatedAt);
    const newAmount = baseAmount + increment;
    
    // 更新数据库
    await db.update(cumulativeProfit)
      .set({
        amount: newAmount.toFixed(2),
        lastUpdatedAt: new Date(),
      })
      .where(eq(cumulativeProfit.id, record.id));
    
    return {
      success: true,
      amount: newAmount,
      lastUpdatedAt: new Date(),
    };
  }),

  /**
   * 管理员手动设置累计收益（仅供管理员使用）
   */
  setAmount: publicProcedure
    .input(z.object({
      amount: z.number().min(0),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const record = await getOrCreateProfitRecord();
      
      await db.update(cumulativeProfit)
        .set({
          amount: input.amount.toFixed(2),
          lastUpdatedAt: new Date(),
        })
        .where(eq(cumulativeProfit.id, record.id));
      
      return {
        success: true,
        amount: input.amount,
      };
    }),
});
