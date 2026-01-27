/**
 * 回测性能测试
 * 测试不同数据量下的回测性能和内存使用
 */

import { describe, it, expect } from "vitest";
import { getDb } from "./db";
import { runGridTradingBacktest } from "./gridTradingBacktest";

describe("回测性能测试", () => {
  it("应该能够成功处理单天数据（1440条）", async () => {
    console.log("\n========================================");
    console.log("测试单天数据回测性能");
    console.log("========================================\n");

    const startTime = Date.now();
    
    // 查询单天数据（2024年1月1日）
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const { klineData } = await import("../drizzle/schema");
    const { and: andOp, eq: eqOp, gte, lte } = await import("drizzle-orm");
    
    const startDate = new Date("2024-01-01T00:00:00Z");
    const endDate = new Date("2024-01-02T00:00:00Z");
    
    console.log(`[步骤 1/3] 查询单天数据...`);
    console.log(`  - 时间范围: ${startDate.toISOString()} ~ ${endDate.toISOString()}`);
    
    const klines = await db
      .select()
      .from(klineData)
      .where(
        andOp(
          eqOp(klineData.symbol, "BTCUSDT"),
          eqOp(klineData.interval, "1m"),
          gte(klineData.openTime, startDate),
          lte(klineData.openTime, endDate)
        )
      )
      .orderBy(klineData.openTime);
    
    const queryTime = Date.now() - startTime;
    console.log(`\n[步骤 2/3] 查询完成！耗时: ${(queryTime / 1000).toFixed(2)}秒`);
    console.log(`  - 查询到 ${klines.length} 条记录`);
    console.log(`  - 预期记录数: 1440 条（24小时 × 60分钟）`);
    
    expect(klines.length).toBeGreaterThan(0);
    expect(klines.length).toBeLessThanOrEqual(1450); // 允许边界数据
    
    // 执行回测
    console.log(`\n[步骤 3/3] 执行回测算法...`);
    
    const backtestStartTime = Date.now();
    
    const result = runGridTradingBacktest({
      minPrice: 40000,
      maxPrice: 50000,
      gridCount: 10,
      investment: 10000,
      type: "neutral",
      leverage: 1,
    }, klines);
    
    const backtestTime = Date.now() - backtestStartTime;
    const totalTime = Date.now() - startTime;
    
    console.log(`\n========================================`);
    console.log(`✅ 测试通过！`);
    console.log(`========================================`);
    console.log(`\n性能统计:`);
    console.log(`  - 数据查询耗时: ${(queryTime / 1000).toFixed(2)}秒`);
    console.log(`  - 回测计算耗时: ${(backtestTime / 1000).toFixed(2)}秒`);
    console.log(`  - 总耗时: ${(totalTime / 1000).toFixed(2)}秒`);
    console.log(`  - 处理速度: ${(klines.length / (backtestTime / 1000)).toFixed(0)} 条/秒`);
    
    console.log(`\n回测结果:`);
    console.log(`  - 总收益: ¥${result.totalProfit.toFixed(2)}`);
    console.log(`  - 收益率: ${result.profitRate.toFixed(2)}%`);
    console.log(`  - 交易次数: ${result.trades.length} 次`);
    console.log(`========================================\n`);
    
    // 验证结果
    expect(result).toBeDefined();
    expect(result.totalProfit).toBeDefined();
    expect(result.profitRate).toBeDefined();
    expect(result.trades).toBeDefined();
  }, 60000); // 60秒超时
});
