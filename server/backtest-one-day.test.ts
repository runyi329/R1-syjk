/**
 * 单天回测测试（简化版）
 * 直接测试2024年1月1日的数据
 */

import { describe, it, expect } from "vitest";
import { getDb } from "./db";
import { initBacktestState, processBatch, finalizeBacktest } from "./gridTradingBacktestStreaming";

describe("单天回测测试", () => {
  it("应该能够成功处理2024年1月1日的数据", async () => {
    console.log("\n========================================");
    console.log("测试单天数据回测");
    console.log("========================================\n");

    const startTime = Date.now();
    
    // 查询2024年1月1日的数据
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const { klineData } = await import("../drizzle/schema");
    const { and: andOp, eq: eqOp, gte, lte } = await import("drizzle-orm");
    
    const dayStart = new Date("2024-01-01T00:00:00Z");
    const dayEnd = new Date("2024-01-02T00:00:00Z");
    
    console.log(`[步骤 1/4] 查询单天数据...`);
    console.log(`  - 时间范围: ${dayStart.toISOString()} ~ ${dayEnd.toISOString()}`);
    
    const klines = await db
      .select()
      .from(klineData)
      .where(
        andOp(
          eqOp(klineData.symbol, "BTCUSDT"),
          eqOp(klineData.interval, "1m"),
          gte(klineData.openTime, dayStart),
          lte(klineData.openTime, dayEnd)
        )
      )
      .orderBy(klineData.openTime);
    
    const queryTime = Date.now() - startTime;
    console.log(`\n[步骤 2/4] 查询完成！耗时: ${(queryTime / 1000).toFixed(2)}秒`);
    console.log(`  - 查询到 ${klines.length} 条记录\n`);
    
    expect(klines.length).toBeGreaterThan(0);
    
    // 初始化回测状态
    console.log(`[步骤 3/4] 执行回测...`);
    const params = {
      minPrice: 40000,
      maxPrice: 50000,
      gridCount: 10,
      investment: 10000,
      type: "spot" as const,
      leverage: 1,
    };
    
    const state = initBacktestState(params, klines[0]);
    console.log(`  - 起始价格: $${state.startPrice.toFixed(2)}`);
    console.log(`  - 初始建仓: ${state.trades.length} 笔`);
    
    // 处理数据
    const backtestStartTime = Date.now();
    processBatch(state, klines);
    const backtestTime = Date.now() - backtestStartTime;
    
    console.log(`  - 处理耗时: ${(backtestTime / 1000).toFixed(2)}秒`);
    console.log(`  - 处理速度: ${(klines.length / (backtestTime / 1000)).toFixed(0)} 条/秒\n`);
    
    // 计算最终结果
    console.log(`[步骤 4/4] 计算最终结果...\n`);
    const result = finalizeBacktest(state, params, 1);
    
    const totalTime = Date.now() - startTime;
    
    console.log(`========================================`);
    console.log(`✅ 测试通过！`);
    console.log(`========================================`);
    console.log(`\n性能统计:`);
    console.log(`  - 总耗时: ${(totalTime / 1000).toFixed(2)}秒`);
    console.log(`  - 数据查询: ${(queryTime / 1000).toFixed(2)}秒`);
    console.log(`  - 回测计算: ${(backtestTime / 1000).toFixed(2)}秒`);
    
    console.log(`\n回测结果:`);
    console.log(`  - 起始价格: $${result.startPrice.toFixed(2)}`);
    console.log(`  - 结束价格: $${result.currentPrice.toFixed(2)}`);
    console.log(`  - 网格收益: ¥${result.gridProfit.toFixed(2)}`);
    console.log(`  - 未配对收益: ¥${result.unpairedProfit.toFixed(2)}`);
    console.log(`  - 总收益: ¥${result.totalProfit.toFixed(2)}`);
    console.log(`  - 收益率: ${result.profitRate.toFixed(2)}%`);
    console.log(`  - 交易次数: ${result.trades.length} 次`);
    console.log(`  - 套利次数: ${result.arbitrageTimes} 次`);
    console.log(`========================================\n`);
    
    // 验证结果
    expect(result).toBeDefined();
    expect(result.startPrice).toBeGreaterThan(0);
    expect(result.currentPrice).toBeGreaterThan(0);
  }, 60000);
});
