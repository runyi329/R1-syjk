/**
 * 单天数据回测测试
 * 测试按天分批处理的性能和稳定性
 */

import { describe, it, expect } from "vitest";
import { streamKlineDataByDays } from "./db-streaming";
import { initBacktestState, processBatch, finalizeBacktest } from "./gridTradingBacktestStreaming";

describe("单天数据回测测试", () => {
  it("应该能够成功处理单天数据（约1440条）", async () => {
    console.log("\n========================================");
    console.log("测试单天数据回测（流式处理）");
    console.log("========================================\n");

    const startTime = Date.now();
    
    // 测试参数
    const params = {
      minPrice: 40000,
      maxPrice: 50000,
      gridCount: 10,
      investment: 10000,
      type: "spot" as const,
      leverage: 1,
    };
    
    let state: any = null;
    let totalKlines = 0;
    let processedDays = 0;
    
    console.log(`[步骤 1/3] 按天流式加载数据...`);
    console.log(`  - 交易对: BTCUSDT`);
    console.log(`  - 时间范围: 2024年1月1日`);
    console.log(`  - 批次大小: 1天（约1440条）\n`);
    
    // 只查询2024年1月1日的数据
    const { totalRecords, totalDays } = await streamKlineDataByDays(
      "BTCUSDT",
      "1m",
      [2024], // 只查询2024年
      async (batch, dayIndex, totalDaysCount, currentDate) => {
        // 只处理第一天的数据
        if (dayIndex > 0) {
          return;
        }
        
        if (batch.length === 0) {
          return;
        }
        
        const batchStartTime = Date.now();
        
        // 第一批数据：初始化状态
        if (state === null) {
          console.log(`[步骤 2/3] 初始化回测状态...`);
          state = initBacktestState(params, batch[0]);
          console.log(`  - 起始价格: $${state.startPrice.toFixed(2)}`);
          console.log(`  - 网格数量: ${params.gridCount}`);
          console.log(`  - 初始建仓: ${state.trades.length} 笔\n`);
        }
        
        // 处理这批数据
        console.log(`[步骤 3/3] 处理K线数据...`);
        processBatch(state, batch);
        totalKlines += batch.length;
        processedDays++;
        
        const batchTime = Date.now() - batchStartTime;
        const dateStr = currentDate.toISOString().split('T')[0];
        console.log(`  - 日期: ${dateStr}`);
        console.log(`  - 数据量: ${batch.length} 条`);
        console.log(`  - 处理耗时: ${(batchTime / 1000).toFixed(2)}秒`);
        console.log(`  - 处理速度: ${(batch.length / (batchTime / 1000)).toFixed(0)} 条/秒\n`);
      }
    );
    
    const queryTime = Date.now() - startTime;
    
    // 检查是否有数据
    expect(state).not.toBeNull();
    expect(totalKlines).toBeGreaterThan(0);
    expect(totalKlines).toBeLessThanOrEqual(1500); // 允许一些边界数据
    
    // 完成回测并计算最终结果
    console.log(`[步骤 4/4] 计算最终结果...\n`);
    const result = finalizeBacktest(state, params, 1);
    
    const totalTime = Date.now() - startTime;
    
    console.log(`========================================`);
    console.log(`✅ 测试通过！`);
    console.log(`========================================`);
    console.log(`\n性能统计:`);
    console.log(`  - 总耗时: ${(totalTime / 1000).toFixed(2)}秒`);
    console.log(`  - 处理数据量: ${totalKlines} 条`);
    console.log(`  - 平均速度: ${(totalKlines / (totalTime / 1000)).toFixed(0)} 条/秒`);
    
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
    expect(result.totalProfit).toBeDefined();
    expect(result.profitRate).toBeDefined();
    expect(result.trades).toBeDefined();
    expect(result.startPrice).toBeGreaterThan(0);
    expect(result.currentPrice).toBeGreaterThan(0);
  }, 60000); // 60秒超时
});
