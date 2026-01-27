/**
 * 数据抓取进度监控脚本
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const SYMBOL = 'BTCUSDT';
const INTERVAL = '1m';
const START_TIME = new Date('2017-08-17T12:00:00+08:00').getTime();
const END_TIME = new Date('2026-01-27T10:18:33+08:00').getTime();
const TOTAL_EXPECTED = Math.floor((END_TIME - START_TIME) / (1000 * 60));

async function checkProgress() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    // 查询总数
    const [countResult] = await connection.query(
      'SELECT COUNT(*) as count FROM kline_data WHERE symbol = ? AND `interval` = ?',
      [SYMBOL, INTERVAL]
    );
    const totalCount = countResult[0].count;
    
    // 查询最早和最新的数据
    const [earliestResult] = await connection.query(
      'SELECT open_time FROM kline_data WHERE symbol = ? AND `interval` = ? ORDER BY open_time ASC LIMIT 1',
      [SYMBOL, INTERVAL]
    );
    
    const [latestResult] = await connection.query(
      'SELECT open_time FROM kline_data WHERE symbol = ? AND `interval` = ? ORDER BY open_time DESC LIMIT 1',
      [SYMBOL, INTERVAL]
    );
    
    const progress = (totalCount / TOTAL_EXPECTED * 100).toFixed(2);
    
    console.log('='.repeat(80));
    console.log('数据抓取进度监控');
    console.log('='.repeat(80));
    console.log(`当前数据量: ${totalCount.toLocaleString()} 条`);
    console.log(`预计总量: ${TOTAL_EXPECTED.toLocaleString()} 条`);
    console.log(`完成进度: ${progress}%`);
    
    if (earliestResult.length > 0) {
      console.log(`最早数据: ${new Date(earliestResult[0].open_time).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`);
    }
    
    if (latestResult.length > 0) {
      console.log(`最新数据: ${new Date(latestResult[0].open_time).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`);
    }
    
    console.log('='.repeat(80));
    
  } finally {
    await connection.end();
  }
}

checkProgress().catch(console.error);
