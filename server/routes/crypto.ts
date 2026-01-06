import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";

export const cryptoRouter = router({
  // 获取Fear & Greed指数
  getFearGreedIndex: publicProcedure.query(async () => {
    try {
      const response = await fetch('https://api.alternative.me/fng/?limit=1');
      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to fetch Fear & Greed Index:', error);
      // 返回默认数据
      return {
        name: "Fear and Greed Index",
        data: [
          {
            value: "50",
            value_classification: "Neutral",
            timestamp: new Date().getTime().toString(),
          }
        ],
        metadata: {
          error: "Failed to fetch real-time data"
        }
      };
    }
  }),

  // 获取市场排名
  getMarketRankings: publicProcedure.query(async () => {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false'
      );
      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }
      const data = await response.json();
      
      // 创建排名映射
      const rankings: { [key: string]: number } = {};
      data.forEach((coin: any, index: number) => {
        const symbol = coin.symbol.toUpperCase();
        if (symbol === 'BTC' || symbol === 'ETH') {
          rankings[symbol] = index + 1;
        }
      });
      
      return {
        success: true,
        rankings: rankings,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to fetch market rankings:', error);
      // 返回默认数据
      return {
        success: false,
        rankings: {
          BTC: 1,
          ETH: 2
        },
        error: "Failed to fetch real-time data"
      };
    }
  }),

  // 获取币种详细信息
  getCoinDetails: publicProcedure
    .input(z.object({
      ids: z.string().describe("逗号分隔的币种ID，如 'bitcoin,ethereum'"),
    }))
    .query(async ({ input }) => {
      try {
        const response = await fetch(
          `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${input.ids}&order=market_cap_desc&per_page=250&page=1&sparkline=true`
        );
        if (!response.ok) {
          throw new Error(`API returned status ${response.status}`);
        }
        const data = await response.json();
        return {
          success: true,
          data: data,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        console.error('Failed to fetch coin details:', error);
        return {
          success: false,
          data: [],
          error: "Failed to fetch real-time data"
        };
      }
    }),
});
