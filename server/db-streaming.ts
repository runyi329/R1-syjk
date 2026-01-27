/**
 * 数据库流式查询工具
 * 按天分批加载K线数据，避免内存溢出
 */

import { getDb } from "./db";
import { sql } from "drizzle-orm";

/**
 * 按天分批查询K线数据
 * @param symbol 交易对符号
 * @param interval 时间间隔
 * @param timeRange 时间范围（年份数组或日期范围对象）
 * @param onBatch 每批数据的回调函数
 * @returns 总记录数和总天数
 */
export async function streamKlineDataByDays(
  symbol: string,
  interval: string,
  timeRange: number[] | { startDate: string; endDate: string },
  onBatch: (batch: any[], dayIndex: number, totalDays: number, currentDate: Date) => Promise<void>
): Promise<{ totalRecords: number; totalDays: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { klineData } = await import("../drizzle/schema");
  const { and: andOp, eq: eqOp, gte, lte } = await import("drizzle-orm");
  
  // 解析时间范围
  let startDate: Date;
  let endDate: Date;
  
  if (Array.isArray(timeRange)) {
    // 年份数组模式
    const minYear = Math.min(...timeRange);
    const maxYear = Math.max(...timeRange);
    startDate = new Date(`${minYear}-01-01T00:00:00Z`);
    endDate = new Date(`${maxYear + 1}-01-01T00:00:00Z`);
  } else {
    // 日期范围模式
    startDate = new Date(`${timeRange.startDate}T00:00:00Z`);
    endDate = new Date(`${timeRange.endDate}T23:59:59Z`);
  }
  
  // 计算总天数
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  let totalRecords = 0;
  let dayIndex = 0;
  
  // 遍历每一天
  let currentDate = new Date(startDate);
  while (currentDate < endDate) {
    const dayStart = new Date(currentDate);
    const dayEnd = new Date(currentDate);
    dayEnd.setDate(dayEnd.getDate() + 1);
    
    // 查询这一天的数据
    const batch = await db
      .select()
      .from(klineData)
      .where(
        andOp(
          eqOp(klineData.symbol, symbol),
          eqOp(klineData.interval, interval),
          sql`${klineData.openTime} >= ${dayStart.getTime()}`,
          sql`${klineData.openTime} <= ${dayEnd.getTime()}`
        )
      )
      .orderBy(klineData.openTime);
    
    // 调用回调函数处理这批数据
    await onBatch(batch, dayIndex, totalDays, currentDate);
    
    totalRecords += batch.length;
    dayIndex++;
    
    // 显式清空批次数据，帮助垃圾回收
    batch.length = 0;
    
    // 移动到下一天
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return { totalRecords, totalDays };
}
