/**
 * 网格交易回测算法
 * 等差网格 + 固定币量策略
 */

export interface GridTradingParams {
  /** 最低价 */
  minPrice: number;
  /** 最高价 */
  maxPrice: number;
  /** 网格数量 */
  gridCount: number;
  /** 总投资金额（USDT） */
  investment: number;
  /** 交易类型 */
  type: "spot" | "contract";
  /** 杠杆倍数（仅合约） */
  leverage?: number;
}

export interface KlineData {
  openTime: Date;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

export interface GridTradingResult {
  /** 总收益（USDT） */
  totalProfit: number;
  /** 网格收益（USDT） */
  gridProfit: number;
  /** 未配对收益（USDT） */
  unpairedProfit: number;
  /** 收益率（%） */
  profitRate: number;
  /** 年化收益率（%） */
  annualizedReturn: number;
  /** 套利次数 */
  arbitrageTimes: number;
  /** 日均套利次数 */
  dailyArbitrageTimes: number;
  /** 最大回撤（USDT） */
  maxDrawdown: number;
  /** 最大回撤率（%） */
  maxDrawdownRate: number;
  /** 最低资产（USDT） */
  minAsset: number;
  /** 最高资产（USDT） */
  maxAsset: number;
  /** 当前价格（USDT） */
  currentPrice: number;
  /** 策略开启时价格（USDT） */
  startPrice: number;
  /** 收益曲线数据 */
  profitCurve: Array<{ time: Date; profit: number; asset: number }>;
  /** 交易记录 */
  trades: Array<{
    time: Date;
    type: "buy" | "sell";
    price: number;
    amount: number;
    profit?: number;
  }>;
}

/**
 * 现货网格交易回测
 */
export function backtestSpotGrid(
  params: GridTradingParams,
  klines: KlineData[]
): GridTradingResult {
  const { minPrice, maxPrice, gridCount, investment } = params;

  // 1. 计算网格价格点
  const gridPrices: number[] = [];
  const gridGap = (maxPrice - minPrice) / gridCount;
  for (let i = 0; i <= gridCount; i++) {
    gridPrices.push(minPrice + i * gridGap);
  }

  // 2. 计算每个网格的固定币量
  // 总投资需要覆盖所有网格的买入成本
  // 每格币量 = 总投资 / (所有网格价格之和)
  const totalGridPrice = gridPrices.reduce((sum, price) => sum + price, 0);
  const fixedAmount = investment / totalGridPrice;

  // 边界检查：如果没有K线数据，返回空结果
  if (klines.length === 0) {
    return {
      totalProfit: 0,
      gridProfit: 0,
      unpairedProfit: 0,
      profitRate: 0,
      annualizedReturn: 0,
      arbitrageTimes: 0,
      dailyArbitrageTimes: 0,
      maxDrawdown: 0,
      maxDrawdownRate: 0,
      minAsset: investment,
      maxAsset: investment,
      currentPrice: 0,
      startPrice: 0,
      profitCurve: [],
      trades: [],
    };
  }

  // 3. 初始化状态
  const startPrice = parseFloat(klines[0].open);
  let usdtBalance = investment; // USDT余额
  let btcBalance = 0; // BTC余额
  let gridProfit = 0; // 网格套利收益
  const trades: Array<{
    time: Date;
    type: "buy" | "sell";
    price: number;
    amount: number;
    profit?: number;
  }> = [];
  const profitCurve: Array<{ time: Date; profit: number; asset: number }> = [];

  // 记录每个网格的持仓状态
  // gridPositions[i] = true 表示第i个网格已经买入
  const gridPositions: boolean[] = new Array(gridCount + 1).fill(false);

  // 4. 初始建仓：建仓价以上的网格立即买入
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
          time: klines[0].openTime,
          type: "buy",
          price: buyPrice,
          amount: buyAmount,
        });
      }
    }
  }

  // 5. 遍历K线数据，模拟交易
  let minAsset = investment;
  let maxAsset = investment;
  let maxAssetValue = investment;

  for (let i = 0; i < klines.length; i++) {
    const kline = klines[i];
    const high = parseFloat(kline.high);
    const low = parseFloat(kline.low);

    // 检查每个网格是否触发交易
    for (let j = 0; j < gridPrices.length; j++) {
      const gridPrice = gridPrices[j];

      // 价格下跌触及网格线：买入
      if (low <= gridPrice && !gridPositions[j]) {
        const buyAmount = fixedAmount;
        const cost = gridPrice * buyAmount;

        if (usdtBalance >= cost) {
          usdtBalance -= cost;
          btcBalance += buyAmount;
          gridPositions[j] = true;

          trades.push({
            time: kline.openTime,
            type: "buy",
            price: gridPrice,
            amount: buyAmount,
          });
        }
      }

      // 价格上涨触及网格线：卖出
      if (high >= gridPrice && gridPositions[j] && j > 0) {
        // 卖出上一个网格买入的仓位
        const sellAmount = fixedAmount;
        const sellPrice = gridPrice;
        const revenue = sellPrice * sellAmount;

        if (btcBalance >= sellAmount) {
          usdtBalance += revenue;
          btcBalance -= sellAmount;
          gridPositions[j] = false;

          // 计算套利收益
          const buyPrice = gridPrices[j - 1];
          const profit = (sellPrice - buyPrice) * sellAmount;
          gridProfit += profit;

          trades.push({
            time: kline.openTime,
            type: "sell",
            price: sellPrice,
            amount: sellAmount,
            profit,
          });
        }
      }
    }

    // 记录收益曲线
    const currentPrice = parseFloat(kline.close);
    const currentAsset = usdtBalance + btcBalance * currentPrice;
    const currentProfit = currentAsset - investment;

    profitCurve.push({
      time: kline.openTime,
      profit: currentProfit,
      asset: currentAsset,
    });

    // 更新最大最小资产
    minAsset = Math.min(minAsset, currentAsset);
    maxAsset = Math.max(maxAsset, currentAsset);
    if (currentAsset > maxAssetValue) {
      maxAssetValue = currentAsset;
    }
  }

  // 6. 计算最终结果
  const currentPrice = parseFloat(klines[klines.length - 1].close);
  const finalAsset = usdtBalance + btcBalance * currentPrice;
  const totalProfit = finalAsset - investment;
  const unpairedProfit = btcBalance * currentPrice - btcBalance * startPrice;
  const profitRate = (totalProfit / investment) * 100;

  // 计算年化收益率
  const startTime = klines[0].openTime.getTime();
  const endTime = klines[klines.length - 1].openTime.getTime();
  const days = (endTime - startTime) / (1000 * 60 * 60 * 24);
  const annualizedReturn = (totalProfit / investment) * (365 / days) * 100;

  // 计算套利次数
  const arbitrageTimes = trades.filter((t) => t.type === "sell").length;
  const dailyArbitrageTimes = arbitrageTimes / days;

  // 计算最大回撤
  const maxDrawdown = maxAssetValue - minAsset;
  const maxDrawdownRate = (maxDrawdown / maxAssetValue) * 100;

  return {
    totalProfit,
    gridProfit,
    unpairedProfit,
    profitRate,
    annualizedReturn,
    arbitrageTimes,
    dailyArbitrageTimes,
    maxDrawdown,
    maxDrawdownRate,
    minAsset,
    maxAsset,
    currentPrice,
    startPrice,
    profitCurve,
    trades,
  };
}
