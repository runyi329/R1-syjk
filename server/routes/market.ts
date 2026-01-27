import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { callDataApi } from "../_core/dataApi";
import { getDb } from "../db";
import { marketDataCache } from "../../drizzle/schema";
import { eq, and, gt } from "drizzle-orm";

// 缓存过期时间（分钟）
const CACHE_DURATION_MINUTES = 30;

/**
 * 从欧易 API 获取加密货币数据
 */
async function getBinanceCryptoData(symbols: string[]): Promise<any[]> {
  try {
    // 映射符号到欧易交易对
    const instIdMap: Record<string, string> = {
      btc: 'BTC-USDT',
      eth: 'ETH-USDT',
      bnb: 'BNB-USDT',
      sol: 'SOL-USDT',
      xrp: 'XRP-USDT',
      ada: 'ADA-USDT',
      doge: 'DOGE-USDT',
    };

    // 获取所有交易对的数据
    const response = await fetch(
      'https://www.okx.com/api/v5/market/tickers?instType=SPOT'
    );
    
    if (!response.ok) throw new Error('OKX API error');
    
    const result = await response.json();
    const allData = result.data || [];
    
    return symbols.map((symbol) => {
      const base = symbol.split('-')[0].toLowerCase();
      const instId = instIdMap[base] || `${base.toUpperCase()}-USDT`;
      const tickerData = allData.find((t: any) => t.instId === instId);
      
      if (!tickerData) return null;
      
      const price = parseFloat(tickerData.last) || 0;
      const open24h = parseFloat(tickerData.open24h) || price;
      const changePercent = ((price - open24h) / open24h) * 100;
      const change = price - open24h;

      return {
        symbol: symbol,
        name: base.toUpperCase(),
        price: parseFloat(price.toFixed(2)),
        change: parseFloat(change.toFixed(2)),
        changePercent: parseFloat(changePercent.toFixed(2)),
        isOpen: true,
      };
    }).filter(r => r !== null);
  } catch (error) {
    console.error("Error fetching OKX data:", error);
    return [];
  }
}

export const marketRouter = router({
  getMultipleStocks: publicProcedure
    .input(z.object({ symbols: z.array(z.string()) }))
    .query(async ({ input }) => {
      const { symbols } = input;
      
      const results = await Promise.all(
        symbols.map(async (symbol) => {
          try {
            const data = await callDataApi(`market/quote/${symbol}`);
            return data;
          } catch (error) {
            console.error(`Error fetching ${symbol}:`, error);
            return null;
          }
        })
      );
      
      return results.filter(r => r !== null);
    }),

  getBinanceCrypto: publicProcedure
    .input(z.object({ symbols: z.array(z.string()) }))
    .query(async ({ input }) => {
      const { symbols } = input;
      return await getBinanceCryptoData(symbols);
    }),
});
