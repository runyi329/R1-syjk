/**
 * 数据库流式查询工具
 * 批量查询数据后按天分批处理，避免内存溢出
 */

import { getDb } from "./db";
import { sql } from "drizzle-orm";

/**
 * 按天分批查询K线数据（优化版：批量查询+内存分组）
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
  
  console.log(`[数据查询] 开始批量查询: ${startDate.toISOString()} 至 ${endDate.toISOString()}, 预计 ${totalDays} 天`);
  const queryStartTime = Date.now();
  
  // 批量查询所有数据
  const allData = await db
    .select()
    .from(klineData)
    .where(
      andOp(
        eqOp(klineData.symbol, symbol),
        eqOp(klineData.interval, interval),
        sql`${klineData.openTime} >= ${startDate.getTime()}`,
        sql`${klineData.openTime} <= ${endDate.getTime()}`
      )
    )
    .orderBy(klineData.openTime);
  
  const queryEndTime = Date.now();
  const queryDuration = ((queryEndTime - queryStartTime) / 1000).toFixed(2);
  console.log(`[数据查询] 完成，共查询到 ${allData.length} 条记录，耗时 ${queryDuration} 秒`);
  
  if (allData.length === 0) {
    return { totalRecords: 0, totalDays };
  }
  
  // 按天分组数据
  console.log(`[数据分组] 开始按天分组...`);
  const dayBatches: Map<string, any[]> = new Map();
  
  for (const record of allData) {
    const recordDate = new Date(record.openTime);
    const dayKey = recordDate.toISOString().split('T')[0]; // YYYY-MM-DD
    
    if (!dayBatches.has(dayKey)) {
      dayBatches.set(dayKey, []);
    }
    dayBatches.get(dayKey)!.push(record);
  }
  
  console.log(`[数据分组] 完成，共分为 ${dayBatches.size} 天`);
  
  // 按天处理数据
  let totalRecords = 0;
  let dayIndex = 0;
  let currentDate = new Date(startDate);
  
  while (currentDate < endDate) {
    const dayKey = currentDate.toISOString().split('T')[0];
    const batch = dayBatches.get(dayKey) || [];
    
    // 调用回调函数处理这批数据
    await onBatch(batch, dayIndex, totalDays, currentDate);
    
    totalRecords += batch.length;
    dayIndex++;
    
    // 清空已处理的批次数据，帮助垃圾回收
    if (batch.length > 0) {
      dayBatches.delete(dayKey);
    }
    
    // 移动到下一天
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // 清空所有数据
  allData.length = 0;
  dayBatches.clear();
  
  return { totalRecords, totalDays };
}
