import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { streamKlineDataByDays } from "../db-streaming";
import { initBacktestState, processBatch, finalizeBacktest } from "../gridTradingBacktestStreaming";

/**
 * 网格交易回测路由
 */
export const gridTradingRouter = router({
  /**
   * 执行网格交易回测（流式处理版本）
   */
  backtest: protectedProcedure
    .input(
      z.object({
        symbol: z.string(), // 交易对符号（如BTC）
        minPrice: z.number().positive(), // 最低价
        maxPrice: z.number().positive(), // 最高价
        gridCount: z.number().int().positive(), // 网格数量
        investment: z.number().positive(), // 投资金额
        type: z.enum(["spot", "contract"]), // 交易类型
        leverage: z.number().int().min(1).max(100).optional(), // 杠杆倍数
        years: z.array(z.number().int()).optional(), // 年份数组（可选）
        startDate: z.string().optional(), // 开始日期 YYYY-MM-DD
        endDate: z.string().optional(), // 结束日期 YYYY-MM-DD
      })
    )
    .mutation(async ({ input }) => {
      const {
        symbol,
        minPrice,
        maxPrice,
        gridCount,
        investment,
        type,
        leverage,
        years,
        startDate,
        endDate,
      } = input;

      // 验证时间范围参数
      if (!years && (!startDate || !endDate)) {
        throw new Error("请提供年份数组或日期范围");
      }

      // 验证价格区间
      if (minPrice >= maxPrice) {
        throw new Error("最低价必须小于最高价");
      }

      // 目前只支持现货网格
      if (type === "contract") {
        throw new Error("合约网格功能暂未开放，敬请期待");
      }

      // 转换交易对符号（BTC -> BTCUSDT）
      const binanceSymbol = `${symbol}USDT`;

      // 记录开始时间
      const startTime = Date.now();
      const timeRangeDesc = years 
        ? `年份: ${years.join(", ")}` 
        : `日期范围: ${startDate} 至 ${endDate}`;
      console.log(`[回测开始] 交易对: ${binanceSymbol}, ${timeRangeDesc}`);

      // 初始化回测状态
      let state: any = null;
      let totalKlines = 0;
      let processedDays = 0;

      // 按天流式处理K线数据
      const timeRange = years ? years : { startDate: startDate!, endDate: endDate! };
      const { totalRecords, totalDays } = await streamKlineDataByDays(
        binanceSymbol,
        "1m",
        timeRange,
        async (batch, dayIndex, totalDaysCount, currentDate) => {
          if (batch.length === 0) {
            return;
          }

          // 第一批数据：初始化状态
          if (state === null) {
            state = initBacktestState(
              {
                minPrice,
                maxPrice,
                gridCount,
                investment,
                type,
                leverage,
              },
              batch[0]
            );
            console.log(`[回测初始化] 起始价格: ${state.startPrice}, 网格数量: ${gridCount}`);
          }

          // 处理这批数据
          processBatch(state, batch);
          totalKlines += batch.length;
          processedDays++;

          // 计算进度百分比
          const progress = ((dayIndex + 1) / totalDaysCount * 100).toFixed(1);
          const dateStr = currentDate.toISOString().split('T')[0];
          console.log(`[回测进度] ${progress}% | ${dateStr} | 已处理 ${totalKlines} 条K线 (${processedDays}/${totalDaysCount} 天)`);
        }
      );

      // 检查是否有数据
      if (totalRecords === 0 || state === null) {
        const errorMsg = years 
          ? `未找到${years.join(", ")}年的K线数据，请先获取历史数据`
          : `未找到${startDate}至${endDate}的K线数据，请先获取历史数据`;
        throw new Error(errorMsg);
      }

      // 完成回测并计算最终结果
      const result = finalizeBacktest(state, {
        minPrice,
        maxPrice,
        gridCount,
        investment,
        type,
        leverage,
      }, totalDays);

      // 记录结束时间
      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      console.log(`[回测完成] 耗时: ${duration}秒, 处理了 ${totalKlines} 条K线, 分 ${processedDays} 天`);
      console.log(`[回测结果] 总收益: ¥${result.totalProfit.toFixed(2)}, 收益率: ${result.profitRate.toFixed(2)}%`);

      return {
        success: true,
        data: result,
        message: `回测完成，共分析${totalKlines}条K线数据（${processedDays}天），耗时${duration}秒`,
      };
    }),
});
