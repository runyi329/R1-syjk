import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { callDataApi } from "../_core/dataApi";

export const marketRouter = router({
  // 获取股票数据
  getStockData: publicProcedure
    .input(z.object({
      symbol: z.string(),
      region: z.string().default("US"),
      interval: z.string().default("1d"),
      range: z.string().default("1d"),
    }))
    .query(async ({ input }) => {
      try {
        const result = await callDataApi("YahooFinance/get_stock_chart", {
          query: {
            symbol: input.symbol,
            region: input.region,
            interval: input.interval,
            range: input.range,
            includeAdjustedClose: "true",
          },
        });

        if (!result || !(result as any).chart || !(result as any).chart.result || (result as any).chart.result.length === 0) {
          throw new Error("No data found");
        }

        const chartResult = (result as any).chart.result[0];
        const meta = chartResult.meta;
        const timestamps = chartResult.timestamp;
        const quotes = chartResult.indicators.quote[0];

        // 获取最新的价格数据
        const latestIndex = timestamps.length - 1;
        const latestPrice = quotes.close[latestIndex] || meta.regularMarketPrice;
        const previousClose = meta.previousClose || quotes.close[Math.max(0, latestIndex - 1)];
        const change = latestPrice - previousClose;
        const changePercent = ((change / previousClose) * 100).toFixed(2);

        return {
          symbol: meta.symbol,
          name: meta.longName || meta.symbol,
          price: latestPrice,
          change: parseFloat(change.toFixed(2)),
          changePercent: parseFloat(changePercent),
          currency: meta.currency,
          exchange: meta.exchangeName,
          regularMarketPrice: meta.regularMarketPrice,
          fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
          fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
          marketCap: meta.marketCap,
          volume: meta.regularMarketVolume,
        };
      } catch (error) {
        console.error("Error fetching stock data:", error);
        throw new Error(`Failed to fetch stock data for ${input.symbol}`);
      }
    }),

  // 获取多个股票数据
  getMultipleStocks: publicProcedure
    .input(z.object({
      symbols: z.array(z.string()),
      region: z.string().default("US"),
      interval: z.string().default("1d"),
      range: z.string().default("1d"),
    }))
    .query(async ({ input }) => {
      try {
        const results = await Promise.all(
          input.symbols.map(symbol =>
            callDataApi("YahooFinance/get_stock_chart", {
              query: {
                symbol,
                region: input.region,
                interval: input.interval,
                range: input.range,
                includeAdjustedClose: "true",
              },
            }).catch(err => {
              console.error(`Error fetching ${symbol}:`, err);
              return null;
            })
          )
        );

        return results
          .filter((r): r is NonNullable<typeof r> => r && (r as any).chart && (r as any).chart.result && (r as any).chart.result.length > 0)
          .map(result => {
            const chartResult = (result as any).chart.result[0];
            const meta = chartResult.meta;
            const timestamps = chartResult.timestamp;
            const quotes = chartResult.indicators.quote[0];

            const latestIndex = timestamps.length - 1;
            const latestPrice = quotes.close[latestIndex] || meta.regularMarketPrice;
            const previousClose = meta.previousClose || quotes.close[Math.max(0, latestIndex - 1)];
            const change = latestPrice - previousClose;
            const changePercent = ((change / previousClose) * 100).toFixed(2);

            return {
              symbol: meta.symbol,
              name: meta.longName || meta.symbol,
              price: latestPrice,
              change: parseFloat(change.toFixed(2)),
              changePercent: parseFloat(changePercent),
              currency: meta.currency,
              exchange: meta.exchangeName,
            };
          });
      } catch (error) {
        console.error("Error fetching multiple stocks:", error);
        throw new Error("Failed to fetch stock data");
      }
    }),
});
