/**
 * 回测进度管理器
 * 用于在内存中存储和查询回测进度
 */

interface DailyBacktestData {
  date: string;
  balance: number;
  totalProfit: number;
  gridTriggers: number;
  floatingProfit: number;
  maxDrawdown: number;
}

interface BacktestProgress {
  userId: string;
  symbol: string;
  currentDate: string;
  processedDays: number;
  totalDays: number;
  progress: number;
  currentProfit: number;
  status: 'running' | 'completed' | 'failed';
  startTime: number;
  error?: string;
  dailyData?: DailyBacktestData[]; // 每天的累计数据
  finalResult?: any; // 最终结果
}

// 使用 Map 存储每个用户的回测进度
const progressMap = new Map<string, BacktestProgress>();

/**
 * 生成进度键
 */
function getProgressKey(userId: string, symbol: string): string {
  return `${userId}:${symbol}`;
}

/**
 * 更新回测进度
 */
export function updateBacktestProgress(
  userId: string,
  symbol: string,
  data: Partial<BacktestProgress> & { dailyData?: DailyBacktestData }
): void {
  const key = getProgressKey(userId, symbol);
  const existing = progressMap.get(key);
  
  // 处理 dailyData 的累积
  let dailyDataArray = existing?.dailyData || [];
  if (data.dailyData) {
    dailyDataArray = [...dailyDataArray, data.dailyData];
  }
  
  const progress: BacktestProgress = {
    userId,
    symbol,
    currentDate: data.currentDate || existing?.currentDate || '',
    processedDays: data.processedDays || existing?.processedDays || 0,
    totalDays: data.totalDays || existing?.totalDays || 0,
    progress: data.progress || existing?.progress || 0,
    currentProfit: data.currentProfit || existing?.currentProfit || 0,
    status: data.status || existing?.status || 'running',
    startTime: data.startTime || existing?.startTime || Date.now(),
    error: data.error,
    dailyData: dailyDataArray,
    finalResult: data.finalResult || existing?.finalResult,
  };
  
  progressMap.set(key, progress);
  
  // 自动清理：完成或失败的任务5分钟后删除
  if (progress.status === 'completed' || progress.status === 'failed') {
    setTimeout(() => {
      progressMap.delete(key);
    }, 5 * 60 * 1000);
  }
}

/**
 * 获取回测进度
 */
export function getBacktestProgress(
  userId: string,
  symbol: string
): BacktestProgress | null {
  const key = getProgressKey(userId, symbol);
  return progressMap.get(key) || null;
}

/**
 * 清除回测进度
 */
export function clearBacktestProgress(
  userId: string,
  symbol: string
): void {
  const key = getProgressKey(userId, symbol);
  progressMap.delete(key);
}

/**
 * 初始化回测进度
 */
export function initBacktestProgress(
  userId: string,
  symbol: string,
  totalDays: number
): void {
  updateBacktestProgress(userId, symbol, {
    totalDays,
    processedDays: 0,
    progress: 0,
    currentDate: '',
    currentProfit: 0,
    status: 'running',
    startTime: Date.now(),
  });
}
