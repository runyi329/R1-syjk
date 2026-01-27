/**
 * 比特币历史数据抓取脚本
 * 
 * 时间范围：2017-08-17 12:00:00 (UTC+8) 至 2026-01-27 10:18:33 (UTC+8)
 * 数据粒度：1分钟K线
 * 数据来源：币安（Binance）API
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载环境变量
dotenv.config({ path: join(__dirname, '..', '.env') });

const BINANCE_API_BASE = 'https://api.binance.com';
const SYMBOL = 'BTCUSDT';
const INTERVAL = '1m';

// 精确的时间范围
const START_TIME = new Date('2017-08-17T12:00:00+08:00').getTime(); // 2017-08-17 12:00:00 北京时间
const END_TIME = new Date('2026-01-27T10:18:33+08:00').getTime();   // 2026-01-27 10:18:33 北京时间

console.log('='.repeat(80));
console.log('比特币历史数据抓取任务');
console.log('='.repeat(80));
console.log(`交易对: ${SYMBOL}`);
console.log(`时间粒度: ${INTERVAL}`);
console.log(`开始时间: ${new Date(START_TIME).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`);
console.log(`结束时间: ${new Date(END_TIME).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`);
console.log(`时间跨度: ${((END_TIME - START_TIME) / (1000 * 60 * 60 * 24)).toFixed(2)} 天`);
console.log(`预计数据量: ${Math.floor((END_TIME - START_TIME) / (1000 * 60))} 条`);
console.log('='.repeat(80));
console.log('');

// 创建数据库连接
let connection;

async function connectDatabase() {
  connection = await mysql.createConnection(process.env.DATABASE_URL);
  console.log('✓ 数据库连接成功');
}

// 从币安API获取K线数据
async function fetchKlines(startTime, endTime, limit = 1000) {
  const url = `${BINANCE_API_BASE}/api/v3/klines?symbol=${SYMBOL}&interval=${INTERVAL}&startTime=${startTime}&endTime=${endTime}&limit=${limit}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`API请求失败: ${error.message}`);
    throw error;
  }
}

// 批量插入数据到数据库
async function insertKlines(klines) {
  if (klines.length === 0) return 0;

  const values = klines.map(k => [
    SYMBOL,
    INTERVAL,
    new Date(k[0]),
    k[1],
    k[2],
    k[3],
    k[4],
    k[5],
    new Date(k[6]),
    k[7],
    k[8],
  ]);

  const sql = `
    INSERT INTO kline_data 
    (symbol, \`interval\`, open_time, \`open\`, high, low, \`close\`, volume, close_time, quote_volume, trades)
    VALUES ?
    ON DUPLICATE KEY UPDATE
      \`open\` = VALUES(\`open\`),
      high = VALUES(high),
      low = VALUES(low),
      \`close\` = VALUES(\`close\`),
      volume = VALUES(volume),
      close_time = VALUES(close_time),
      quote_volume = VALUES(quote_volume),
      trades = VALUES(trades)
  `;

  try {
    const [result] = await connection.query(sql, [values]);
    return result.affectedRows;
  } catch (error) {
    console.error(`数据插入失败: ${error.message}`);
    throw error;
  }
}

// 主抓取函数
async function fetchAllData() {
  let currentTime = START_TIME;
  let totalFetched = 0;
  let totalInserted = 0;
  let batchCount = 0;
  const startFetchTime = Date.now();

  console.log('开始抓取数据...\n');

  while (currentTime < END_TIME) {
    batchCount++;
    
    try {
      // 每次抓取1000条（币安API限制）
      const klines = await fetchKlines(currentTime, END_TIME, 1000);
      
      if (klines.length === 0) {
        console.log('没有更多数据，抓取完成');
        break;
      }

      totalFetched += klines.length;

      // 插入数据库
      const inserted = await insertKlines(klines);
      totalInserted += inserted;

      // 更新当前时间为最后一条数据的时间 + 1分钟
      const lastKline = klines[klines.length - 1];
      currentTime = lastKline[0] + 60000; // +1分钟

      // 计算进度
      const progress = ((currentTime - START_TIME) / (END_TIME - START_TIME) * 100).toFixed(2);
      const elapsedSeconds = Math.floor((Date.now() - startFetchTime) / 1000);
      const currentTimeStr = new Date(currentTime).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });

      console.log(`批次 ${batchCount}: 抓取 ${klines.length} 条 | 插入 ${inserted} 条 | 总计 ${totalFetched} 条 | 进度 ${progress}% | 当前时间 ${currentTimeStr} | 耗时 ${elapsedSeconds}s`);

      // 避免请求过快，休息一下
      await new Promise(resolve => setTimeout(resolve, 200));

    } catch (error) {
      console.error(`批次 ${batchCount} 失败: ${error.message}`);
      console.log('等待5秒后重试...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  const totalElapsedSeconds = Math.floor((Date.now() - startFetchTime) / 1000);
  const totalElapsedMinutes = (totalElapsedSeconds / 60).toFixed(2);

  console.log('\n' + '='.repeat(80));
  console.log('数据抓取完成！');
  console.log('='.repeat(80));
  console.log(`总批次数: ${batchCount}`);
  console.log(`总抓取条数: ${totalFetched}`);
  console.log(`总插入条数: ${totalInserted}`);
  console.log(`总耗时: ${totalElapsedMinutes} 分钟 (${totalElapsedSeconds} 秒)`);
  console.log(`平均速度: ${(totalFetched / totalElapsedSeconds).toFixed(2)} 条/秒`);
  console.log('='.repeat(80));
}

// 主函数
async function main() {
  try {
    await connectDatabase();
    await fetchAllData();
  } catch (error) {
    console.error('发生错误:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✓ 数据库连接已关闭');
    }
  }
}

// 执行
main();
