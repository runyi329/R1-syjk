import axios from "axios";
import { getDb } from "./db";
import { klineData, fetchTasks } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * 币安API基础URL
 */
const BINANCE_API_BASE = "https://api.binance.com";

/**
 * K线数据接口响应类型
 * 币安API返回的K线数据格式：
 * [
 *   开盘时间,
 *   开盘价,
 *   最高价,
 *   最低价,
 *   收盘价,
 *   成交量,
 *   收盘时间,
 *   成交额,
 *   成交笔数,
 *   主动买入成交量,
 *   主动买入成交额,
 *   请忽略
 * ]
 */
type BinanceKline = [
  number, // 开盘时间
  string, // 开盘价
  string, // 最高价
  string, // 最低价
  string, // 收盘价
  string, // 成交量
  number, // 收盘时间
  string, // 成交额
  number, // 成交笔数
  string, // 主动买入成交量
  string, // 主动买入成交额
  string  // 请忽略
];

/**
 * 从币安API获取K线数据
 * @param symbol 交易对符号，如 BTCUSDT
 * @param interval K线时间间隔，如 1m
 * @param startTime 开始时间（Unix时间戳，毫秒）
 * @param endTime 结束时间（Unix时间戳，毫秒）
 * @param limit 返回数据条数，最大1000
 */
export async function fetchKlinesFromBinance(
  symbol: string,
  interval: string,
  startTime: number,
  endTime: number,
  limit: number = 1000
): Promise<BinanceKline[]> {
  try {
    const response = await axios.get(`${BINANCE_API_BASE}/api/v3/klines`, {
      params: {
        symbol,
        interval,
        startTime,
        endTime,
        limit,
      },
      timeout: 30000, // 30秒超时
    });

    return response.data as BinanceKline[];
  } catch (error) {
    console.error("Failed to fetch klines from Binance:", error);
    throw new Error(`Failed to fetch klines: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * 将币安K线数据批量插入数据库
 * @param symbol 交易对符号
 * @param interval K线时间间隔
 * @param klines 币安K线数据数组
 */
export async function saveKlinesToDatabase(
  symbol: string,
  interval: string,
  klines: BinanceKline[]
): Promise<number> {
  if (klines.length === 0) {
    return 0;
  }

  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    const records = klines.map((kline) => ({
      symbol,
      interval,
      openTime: new Date(kline[0]),
      open: kline[1],
      high: kline[2],
      low: kline[3],
      close: kline[4],
      volume: kline[5],
      closeTime: new Date(kline[6]),
      quoteVolume: kline[7],
      trades: kline[8],
      takerBuyVolume: kline[9],
      takerBuyQuoteVolume: kline[10],
    }));

    // 使用INSERT IGNORE来避免重复数据
    await db.insert(klineData).values(records).onDuplicateKeyUpdate({
      set: {
        open: records[0].open, // 占位符，实际不更新
      },
    });

    return records.length;
  } catch (error) {
    console.error("Failed to save klines to database:", error);
    throw new Error(`Failed to save klines: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * 批量抓取历史K线数据
 * @param symbol 交易对符号
 * @param interval K线时间间隔
 * @param startTime 开始时间（Unix时间戳，毫秒）
 * @param endTime 结束时间（Unix时间戳，毫秒）
 * @param taskId 任务ID
 * @param userId 用户ID
 */
export async function fetchHistoricalKlines(
  symbol: string,
  interval: string,
  startTime: number,
  endTime: number,
  taskId: number,
  userId: number
): Promise<void> {
  let currentTime = startTime;
  let totalFetched = 0;
  const batchSize = 1000; // 每次获取1000条

  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    // 更新任务状态为运行中
    await db
      .update(fetchTasks)
      .set({ status: "running" })
      .where(eq(fetchTasks.id, taskId));

    while (currentTime < endTime) {
      // 计算本次请求的结束时间
      const batchEndTime = Math.min(currentTime + batchSize * 60 * 1000, endTime);

      // 从币安API获取数据
      const klines = await fetchKlinesFromBinance(
        symbol,
        interval,
        currentTime,
        batchEndTime,
        batchSize
      );

      if (klines.length === 0) {
        break; // 没有更多数据
      }

      // 保存到数据库
      const savedCount = await saveKlinesToDatabase(symbol, interval, klines);
      totalFetched += savedCount;

      // 更新任务进度
      const lastKline = klines[klines.length - 1];
      currentTime = lastKline[6] + 1; // 下一批从上一批的收盘时间+1开始

      const dbInstance = await getDb();
      if (dbInstance) {
        await dbInstance
          .update(fetchTasks)
          .set({
            fetchedCount: totalFetched,
            currentTime: new Date(currentTime),
          })
          .where(eq(fetchTasks.id, taskId));
      }

      // 避免触发API限流，每次请求后等待200ms
      await new Promise((resolve) => setTimeout(resolve, 200));

      console.log(`Fetched ${totalFetched} klines for ${symbol} ${interval}`);
    }

    // 更新任务状态为已完成
    const dbInstance = await getDb();
    if (dbInstance) {
      await dbInstance
        .update(fetchTasks)
        .set({
          status: "completed",
          fetchedCount: totalFetched,
        })
        .where(eq(fetchTasks.id, taskId));
    }

    console.log(`Successfully fetched ${totalFetched} klines for ${symbol} ${interval}`);
  } catch (error) {
    console.error("Failed to fetch historical klines:", error);

    // 更新任务状态为失败
    const dbInstance = await getDb();
    if (dbInstance) {
      await dbInstance
        .update(fetchTasks)
        .set({
          status: "failed",
          errorMessage: error instanceof Error ? error.message : "Unknown error",
        })
        .where(eq(fetchTasks.id, taskId));
    }

    throw error;
  }
}

/**
 * 计算预计数据条数
 * @param interval K线时间间隔
 * @param startTime 开始时间（Unix时间戳，毫秒）
 * @param endTime 结束时间（Unix时间戳，毫秒）
 */
export function calculateTotalCount(
  interval: string,
  startTime: number,
  endTime: number
): number {
  const duration = endTime - startTime;
  const intervalMinutes = getIntervalMinutes(interval);
  return Math.floor(duration / (intervalMinutes * 60 * 1000));
}

/**
 * 获取时间间隔对应的分钟数
 * @param interval K线时间间隔
 */
function getIntervalMinutes(interval: string): number {
  const map: Record<string, number> = {
    "1m": 1,
    "3m": 3,
    "5m": 5,
    "15m": 15,
    "30m": 30,
    "1h": 60,
    "2h": 120,
    "4h": 240,
    "6h": 360,
    "8h": 480,
    "12h": 720,
    "1d": 1440,
    "3d": 4320,
    "1w": 10080,
    "1M": 43200,
  };
  return map[interval] || 1;
}
