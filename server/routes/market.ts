import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { callDataApi } from "../_core/dataApi";
import { getDb } from "../db";
import { marketDataCache } from "../../drizzle/schema";
import { eq, and, gt } from "drizzle-orm";

// 缓存过期时间（分钟）
const CACHE_DURATION_MINUTES = 30;

/**
 * 从缓存中获取市场数据
 */
async function getCachedMarketData(symbol: string) {
  try {
    const db = await getDb();
    if (!db) return null;

    const cached = await db
      .select()
      .from(marketDataCache)
      .where(
        and(
          eq(marketDataCache.symbol, symbol),
          gt(marketDataCache.expiresAt, new Date())
        )
      )
      .limit(1);

    if (cached.length > 0) {
      const data = cached[0];
      return {
        symbol: data.symbol,
        name: data.name,
        price: parseFloat(data.price.toString()),
        change: parseFloat(data.change.toString()),
        changePercent: parseFloat(data.changePercent.toString()),
        fromCache: true,
      };
    }
  } catch (error) {
    console.error("Error reading from cache:", error);
  }
  return null;
}

/**
 * 保存市场数据到缓存
 */
async function cacheMarketData(
  symbol: string,
  name: string,
  price: number,
  change: number,
  changePercent: number,
  region: string
) {
  try {
    const db = await getDb();
    if (!db) return;

    const expiresAt = new Date(Date.now() + CACHE_DURATION_MINUTES * 60 * 1000);

    // 先删除旧的缓存
    await db
      .delete(marketDataCache)
      .where(eq(marketDataCache.symbol, symbol));

    // 插入新的缓存
    await db.insert(marketDataCache).values({
      symbol,
      name,
      price: price.toString(),
      change: change.toString(),
      changePercent: changePercent.toString(),
      region,
      expiresAt,
    });
  } catch (error) {
    console.error("Error writing to cache:", error);
  }
}

export const marketRouter = router({
  // 获取股票数据（优先使用缓存）
  getStockData: publicProcedure
    .input(z.object({
      symbol: z.string(),
      region: z.string().default("US"),
      interval: z.string().default("1d"),
      range: z.string().default("1d"),
    }))
    .query(async ({ input }) => {
      // 先尝试从缓存获取
      const cachedData = await getCachedMarketData(input.symbol);
      if (cachedData) {
        return cachedData;
      }

      // 缓存不存在或已过期，从 API 获取
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
        const changePercent = ((change / previousClose) * 100);

        const responseData = {
          symbol: meta.symbol,
          name: meta.longName || meta.symbol,
          price: latestPrice,
          change: parseFloat(change.toFixed(2)),
          changePercent: parseFloat(changePercent.toFixed(2)),
          currency: meta.currency,
          exchange: meta.exchangeName,
          regularMarketPrice: meta.regularMarketPrice,
          fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
          fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
          marketCap: meta.marketCap,
          volume: meta.regularMarketVolume,
          fromCache: false,
        };

        // 保存到缓存
        await cacheMarketData(
          meta.symbol,
          meta.longName || meta.symbol,
          latestPrice,
          parseFloat(change.toFixed(2)),
          parseFloat(changePercent.toFixed(2)),
          input.region
        );

        return responseData;
      } catch (error) {
        console.error("Error fetching stock data:", error);
        throw new Error(`Failed to fetch stock data for ${input.symbol}`);
      }
    }),

  // 获取多个股票数据（优先使用缓存）
  getMultipleStocks: publicProcedure
    .input(z.object({
      symbols: z.array(z.string()),
      region: z.string().default("US"),
      interval: z.string().default("1d"),
      range: z.string().default("1d"),
    }))
    .query(async ({ input }) => {
      try {
        // 先从缓存获取所有可用的数据
        const cachedResults: any[] = [];
        const symbolsToFetch: string[] = [];

        for (const symbol of input.symbols) {
          const cached = await getCachedMarketData(symbol);
          if (cached) {
            cachedResults.push(cached);
          } else {
            symbolsToFetch.push(symbol);
          }
        }

        // 如果所有数据都在缓存中，直接返回
        if (symbolsToFetch.length === 0) {
          return cachedResults;
        }

        // 从 API 获取缺失的数据
        const apiResults = await Promise.all(
          symbolsToFetch.map(symbol =>
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

        const newResults = apiResults
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
            const changePercent = ((change / previousClose) * 100);

            // 保存到缓存
            cacheMarketData(
              meta.symbol,
              meta.longName || meta.symbol,
              latestPrice,
              parseFloat(change.toFixed(2)),
              parseFloat(changePercent.toFixed(2)),
              input.region
            ).catch(err => console.error("Error caching data:", err));

            return {
              symbol: meta.symbol,
              name: meta.longName || meta.symbol,
              price: latestPrice,
              change: parseFloat(change.toFixed(2)),
              changePercent: parseFloat(changePercent.toFixed(2)),
              currency: meta.currency,
              exchange: meta.exchangeName,
              fromCache: false,
            };
          });

        // 合并缓存结果和 API 结果
        return [...cachedResults, ...newResults];
      } catch (error) {
        console.error("Error fetching multiple stocks:", error);
        throw new Error("Failed to fetch stock data");
      }
    }),

  // 清除过期的缓存数据
  clearExpiredCache: publicProcedure
    .query(async () => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const result = await db
          .delete(marketDataCache)
          .where(
            gt(marketDataCache.expiresAt, new Date())
          );
        return { success: true, message: "Expired cache cleared" };
      } catch (error) {
        console.error("Error clearing cache:", error);
        throw new Error("Failed to clear cache");
      }
    }),
});
