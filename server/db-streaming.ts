/**
 * 数据库流式查询工具
 * 按天分批加载K线数据，避免内存溢出
 */

import { getDb } from "./db";

/**
 * 按天分批查询K线数据
 * @param symbol 交易对符号
 * @param interval 时间间隔
 * @param years 年份数组
 * @param onBatch 每批数据的回调函数
 * @returns 总记录数和总天数
 */
export async function streamKlineDataByDays(
  symbol: string,
  interval: string,
  years: number[],
  onBatch: (batch: any[], dayIndex: number, totalDays: number, currentDate: Date) => Promise<void>
): Promise<{ totalRecords: number; totalDays: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { klineData } = await import("../drizzle/schema");
  const { and: andOp, eq: eqOp, gte, lte } = await import("drizzle-orm");
  
  // 计算时间范围
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);
  
  let totalRecords = 0;
  let dayIndex = 0;
  
  // 计算总天数（所有年份的总天数）- 提前计算避免重复
  const totalDays = years.reduce((sum, y) => {
    const start = new Date(`${y}-01-01T00:00:00Z`);
    const end = new Date(`${y + 1}-01-01T00:00:00Z`);
    return sum + Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }, 0);
  
  // 遍历每一年
  for (let year = minYear; year <= maxYear; year++) {
    const yearStart = new Date(`${year}-01-01T00:00:00Z`);
    const yearEnd = new Date(`${year + 1}-01-01T00:00:00Z`);
    
    // 计算这一年的天数
    const daysInYear = Math.ceil((yearEnd.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24));
    
    // 遍历每一天
    for (let day = 0; day < daysInYear; day++) {
      const dayStart = new Date(yearStart.getTime() + day * 24 * 60 * 60 * 1000);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      
      // 查询这一天的数据
      const batch = await db
        .select()
        .from(klineData)
        .where(
          andOp(
            eqOp(klineData.symbol, symbol),
            eqOp(klineData.interval, interval),
            gte(klineData.openTime, dayStart),
            lte(klineData.openTime, dayEnd)
          )
        )
        .orderBy(klineData.openTime);
      
      if (batch.length > 0) {
        totalRecords += batch.length;
        
        // 调用回调函数处理这批数据
        await onBatch(batch, dayIndex, totalDays, dayStart);
        dayIndex++;
        
        // 显式清空批次数据，帮助垃圾回收
        batch.length = 0;
      }
    }
  }
  
  return { totalRecords, totalDays };
}
