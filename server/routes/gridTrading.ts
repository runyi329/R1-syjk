import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getKlineDataByYears } from "../db";
import { backtestSpotGrid } from "../gridTradingBacktest";

/**
 * 网格交易回测路由
 */
export const gridTradingRouter = router({
  /**
   * 执行网格交易回测
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
        years: z.array(z.number().int()).min(1), // 年份数组
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
      } = input;

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

      // 查询K线数据
      const klines = await getKlineDataByYears(binanceSymbol, "1m", years);

      if (klines.length === 0) {
        throw new Error(`未找到${years.join(", ")}年的K线数据，请先获取历史数据`);
      }

      // 执行回测
      const result = backtestSpotGrid(
        {
          minPrice,
          maxPrice,
          gridCount,
          investment,
          type,
          leverage,
        },
        klines
      );

      return {
        success: true,
        data: result,
        message: `回测完成，共分析${klines.length}条K线数据`,
      };
    }),
});
