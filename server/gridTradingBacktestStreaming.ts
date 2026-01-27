/**
 * 网格交易回测算法 - 流式处理版本
 * 支持分批处理大量K线数据，避免内存溢出
 */

import type { GridTradingParams, GridTradingResult, KlineData } from "./gridTradingBacktest";

/**
 * 回测状态（用于在多个批次之间保持状态）
 */
interface BacktestState {
  // 网格配置
  gridPrices: number[];
  fixedAmount: number;
  gridPositions: boolean[];
  
  // 账户状态
  usdtBalance: number;
  btcBalance: number;
  gridProfit: number;
  
  // 统计数据
  trades: Array<{
    time: Date;
    type: "buy" | "sell";
    price: number;
    amount: number;
    profit?: number;
  }>;
  profitCurve: Array<{ time: Date; profit: number; asset: number }>;
  
  // 价格记录
  startPrice: number;
  currentPrice: number;
  
  // 回撤追踪
  maxAsset: number;
  minAsset: number;
  
  // 是否已初始化
  initialized: boolean;
}

/**
 * 初始化回测状态
 */
export function initBacktestState(
  params: GridTradingParams,
  firstKline: KlineData
): BacktestState {
  const { minPrice, maxPrice, gridCount, investment } = params;
  
  // 计算网格价格点
  const gridPrices: number[] = [];
  const gridGap = (maxPrice - minPrice) / gridCount;
  for (let i = 0; i <= gridCount; i++) {
    gridPrices.push(minPrice + i * gridGap);
  }
  
  // 计算每个网格的固定币量
  const totalGridPrice = gridPrices.reduce((sum, price) => sum + price, 0);
  const fixedAmount = investment / totalGridPrice;
  
  const startPrice = parseFloat(firstKline.open);
  let usdtBalance = investment;
  let btcBalance = 0;
  const gridPositions: boolean[] = new Array(gridCount + 1).fill(false);
  const trades: BacktestState["trades"] = [];
  
  // 初始建仓：建仓价以上的网格立即买入
  for (let i = 0; i < gridPrices.length; i++) {
    if (gridPrices[i] > startPrice) {
      const buyPrice = gridPrices[i];
      const buyAmount = fixedAmount;
      const cost = buyPrice * buyAmount;
      
      if (usdtBalance >= cost) {
        usdtBalance -= cost;
        btcBalance += buyAmount;
        gridPositions[i] = true;
        
        trades.push({
          time: firstKline.openTime,
          type: "buy",
          price: buyPrice,
          amount: buyAmount,
        });
      }
    }
  }
  
  const currentAsset = usdtBalance + btcBalance * startPrice;
  
  return {
    gridPrices,
    fixedAmount,
    gridPositions,
    usdtBalance,
    btcBalance,
    gridProfit: 0,
    trades,
    profitCurve: [{ time: firstKline.openTime, profit: 0, asset: currentAsset }],
    startPrice,
    currentPrice: startPrice,
    maxAsset: currentAsset,
    minAsset: currentAsset,
    initialized: true,
  };
}

/**
 * 处理一批K线数据
 */
export function processBatch(
  state: BacktestState,
  klines: KlineData[]
): void {
  const { gridPrices, fixedAmount, gridPositions } = state;
  
  // 遍历每根K线
  for (const kline of klines) {
    const high = parseFloat(kline.high);
    const low = parseFloat(kline.low);
    state.currentPrice = parseFloat(kline.close);
    
    // 检查每个网格是否触发交易
    for (let i = 0; i < gridPrices.length; i++) {
      const gridPrice = gridPrices[i];
      
      // 价格下穿网格线 -> 买入
      if (low <= gridPrice && !gridPositions[i]) {
        const buyAmount = fixedAmount;
        const cost = gridPrice * buyAmount;
        
        if (state.usdtBalance >= cost) {
          state.usdtBalance -= cost;
          state.btcBalance += buyAmount;
          gridPositions[i] = true;
          
          state.trades.push({
            time: kline.openTime,
            type: "buy",
            price: gridPrice,
            amount: buyAmount,
          });
          
          // 限制交易记录数量，只保留最近的 1000 条
          if (state.trades.length > 1000) {
            state.trades.shift();
          }
        }
      }
      
      // 价格上穿网格线 -> 卖出
      if (high >= gridPrice && gridPositions[i]) {
        const sellAmount = fixedAmount;
        const revenue = gridPrice * sellAmount;
        
        if (state.btcBalance >= sellAmount) {
          state.usdtBalance += revenue;
          state.btcBalance -= sellAmount;
          gridPositions[i] = false;
          
          // 计算这次套利的收益（扣除手续费）
          const gridGap = gridPrices[1] - gridPrices[0];
          const profit = gridGap * sellAmount * 0.998; // 扣除0.2%手续费
          state.gridProfit += profit;
          
          state.trades.push({
            time: kline.openTime,
            type: "sell",
            price: gridPrice,
            amount: sellAmount,
            profit,
          });
          
          // 限制交易记录数量，只保留最近的 1000 条
          if (state.trades.length > 1000) {
            state.trades.shift();
          }
        }
      }
    }
    
      // 每隔一小时记录一次盈亏曲线（避免数据点过多）
      if (state.profitCurve.length === 0 || 
          kline.openTime.getTime() - state.profitCurve[state.profitCurve.length - 1].time.getTime() > 3600000) {
        const currentAsset = state.usdtBalance + state.btcBalance * state.currentPrice;
        state.profitCurve.push({
          time: kline.openTime,
          profit: state.gridProfit,
          asset: currentAsset,
        });
        
        // 限制盈亏曲线数据点数量，只保留最近的 1000 个点
        if (state.profitCurve.length > 1000) {
          state.profitCurve.shift();
        }
      
      // 更新最大/最小资产
      if (currentAsset > state.maxAsset) {
        state.maxAsset = currentAsset;
      }
      if (currentAsset < state.minAsset) {
        state.minAsset = currentAsset;
      }
    }
  }
}

/**
 * 完成回测并计算最终结果
 */
export function finalizeBacktest(
  state: BacktestState,
  params: GridTradingParams,
  totalDays: number
): GridTradingResult {
  const { investment } = params;
  
  // 计算未配对收益（当前持仓的浮盈浮亏）
  const unpairedProfit = state.btcBalance * state.currentPrice - state.btcBalance * state.startPrice;
  
  // 总收益 = 网格收益 + 未配对收益
  const totalProfit = state.gridProfit + unpairedProfit;
  
  // 收益率
  const profitRate = (totalProfit / investment) * 100;
  
  // 年化收益率
  const annualizedReturn = totalDays > 0 ? (profitRate / totalDays) * 365 : 0;
  
  // 套利次数（只计算卖出交易）
  const arbitrageTimes = state.trades.filter(t => t.type === "sell").length;
  
  // 日均套利次数
  const dailyArbitrageTimes = totalDays > 0 ? arbitrageTimes / totalDays : 0;
  
  // 最大回撤
  const maxDrawdown = state.maxAsset - state.minAsset;
  const maxDrawdownRate = state.maxAsset > 0 ? (maxDrawdown / state.maxAsset) * 100 : 0;
  
  return {
    totalProfit,
    gridProfit: state.gridProfit,
    unpairedProfit,
    profitRate,
    annualizedReturn,
    arbitrageTimes,
    dailyArbitrageTimes,
    maxDrawdown,
    maxDrawdownRate,
    minAsset: state.minAsset,
    maxAsset: state.maxAsset,
    currentPrice: state.currentPrice,
    startPrice: state.startPrice,
    profitCurve: state.profitCurve,
    trades: state.trades,
  };
}
