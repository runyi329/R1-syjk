// 股票模拟投注算法

export interface StockSimulationConfig {
  rounds: number; // 模拟局数
  initialCapital: number; // 初始资金
  baseBet: number; // 基础投注额（500元）
  maxBet: number; // 最大单注限制（2,000,000元）
  marketType: 'A' | 'HK' | 'US'; // 市场类型
}

export interface StockRoundResult {
  round: number; // 局数
  outcome: 'up' | 'down' | 'flat'; // 开奖结果：涨/跌/平
  betOn: 'up' | 'down'; // 下注方向
  betAmount: number; // 投注金额
  winAmount: number; // 赢得金额
  balance: number; // 当前余额
  changePercent: number; // 涨跌幅
}

export interface StockSimulationStats {
  initialCapital: number; // 初始资金
  finalBalance: number; // 最终余额
  profitLoss: number; // 盈亏金额
  profitLossRate: number; // 盈亏率
  maxBet: number; // 限红
  totalRounds: number; // 实际投注局数
  minBet: number; // 最小投注金额
  maxBetAmount: number; // 最大投注金额
  avgBet: number; // 平均投注金额
  totalBetAmount: number; // 总投注金额
  turnoverMultiple: number; // 流水倍数（总投注/本金）
  avgProfitPerRound: number; // 平均每局盈亏
  minBalance: number; // 资金最低值
  maxBalance: number; // 资金最高值
  upCount: number; // 涨的局数
  downCount: number; // 跌的局数
  flatCount: number; // 平的局数
  upRate: number; // 涨的比例
  downRate: number; // 跌的比例
  flatRate: number; // 平的比例
  upMaxWinStreak: number; // 最长连涨
  upMaxLoseStreak: number; // 最长连跌
  downMaxWinStreak: number; // 跌方最长连赢
  downMaxLoseStreak: number; // 跌方最长连输
  betMaxWinStreak: number; // 玩家最长连赢局数
  betMaxLoseStreak: number; // 玩家最长连输局数
  history: StockRoundResult[]; // 投注历史
  balanceHistory: number[]; // 资金曲线
  marketType: 'A' | 'HK' | 'US'; // 市场类型
}

// 市场概率配置（基于历史数据）
const MARKET_PROBABILITIES = {
  A: {
    up: 0.48, // A股涨的概率
    down: 0.47, // A股跌的概率
    flat: 0.05, // A股平的概率
    commission: 0.001, // 印花税+佣金 0.1%
    avgChange: 1.5, // 平均涨跌幅
  },
  HK: {
    up: 0.46, // 港股涨的概率
    down: 0.49, // 港股跌的概率
    flat: 0.05, // 港股平的概率
    commission: 0.001, // 佣金
    avgChange: 1.8, // 平均涨跌幅
  },
  US: {
    up: 0.52, // 美股涨的概率（长期牛市）
    down: 0.44, // 美股跌的概率
    flat: 0.04, // 美股平的概率
    commission: 0.0005, // 佣金较低
    avgChange: 1.2, // 平均涨跌幅
  },
};

// 生成随机开奖结果（基于市场概率）
function generateOutcome(marketType: 'A' | 'HK' | 'US'): { outcome: 'up' | 'down' | 'flat'; changePercent: number } {
  const probs = MARKET_PROBABILITIES[marketType];
  const random = Math.random();
  
  let outcome: 'up' | 'down' | 'flat';
  let changePercent: number;
  
  if (random < probs.up) {
    outcome = 'up';
    // 涨幅在0.1%到5%之间，正态分布
    changePercent = Math.abs(gaussianRandom() * probs.avgChange) + 0.1;
  } else if (random < probs.up + probs.down) {
    outcome = 'down';
    // 跌幅在-0.1%到-5%之间
    changePercent = -(Math.abs(gaussianRandom() * probs.avgChange) + 0.1);
  } else {
    outcome = 'flat';
    changePercent = 0;
  }
  
  return { outcome, changePercent: Math.round(changePercent * 100) / 100 };
}

// 高斯随机数生成（Box-Muller变换）
function gaussianRandom(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// 随机选择下注方向
function randomBetChoice(): 'up' | 'down' {
  return Math.random() < 0.5 ? 'up' : 'down';
}

// 计算赢得金额
function calculateWinAmount(
  betAmount: number, 
  betOn: 'up' | 'down', 
  outcome: 'up' | 'down' | 'flat',
  changePercent: number,
  marketType: 'A' | 'HK' | 'US'
): number {
  const commission = MARKET_PROBABILITIES[marketType].commission;
  
  if (outcome === 'flat') {
    // 平局退回本金（扣除手续费）
    return betAmount * (1 - commission);
  }

  if (betOn === outcome) {
    // 赢了，根据涨跌幅计算收益
    const winRate = Math.abs(changePercent) / 100;
    const grossWin = betAmount * (1 + winRate);
    // 扣除手续费
    return grossWin * (1 - commission);
  } else {
    // 输了，根据涨跌幅计算损失
    const loseRate = Math.abs(changePercent) / 100;
    const remaining = betAmount * (1 - loseRate);
    // 扣除手续费
    return remaining * (1 - commission);
  }
}

// 计算连胜连输统计
function calculateStreaks(history: StockRoundResult[]): {
  upMaxWinStreak: number;
  upMaxLoseStreak: number;
  downMaxWinStreak: number;
  downMaxLoseStreak: number;
  betMaxWinStreak: number;
  betMaxLoseStreak: number;
} {
  let upWinStreak = 0;
  let upLoseStreak = 0;
  let downWinStreak = 0;
  let downLoseStreak = 0;

  let upMaxWinStreak = 0;
  let upMaxLoseStreak = 0;
  let downMaxWinStreak = 0;
  let downMaxLoseStreak = 0;

  let betWinStreak = 0;
  let betLoseStreak = 0;
  let betMaxWinStreak = 0;
  let betMaxLoseStreak = 0;

  for (const round of history) {
    if (round.outcome === 'flat') {
      // 平局不算断
      continue;
    }

    if (round.outcome === 'up') {
      // 涨
      upWinStreak++;
      upMaxWinStreak = Math.max(upMaxWinStreak, upWinStreak);
      upLoseStreak = 0;

      downLoseStreak++;
      downMaxLoseStreak = Math.max(downMaxLoseStreak, downLoseStreak);
      downWinStreak = 0;
    } else if (round.outcome === 'down') {
      // 跌
      downWinStreak++;
      downMaxWinStreak = Math.max(downMaxWinStreak, downWinStreak);
      downLoseStreak = 0;

      upLoseStreak++;
      upMaxLoseStreak = Math.max(upMaxLoseStreak, upLoseStreak);
      upWinStreak = 0;
    }

    // 计算玩家连赢连输（基于投注结果）
    const isWin = round.betOn === round.outcome;
    if (isWin) {
      betWinStreak++;
      betMaxWinStreak = Math.max(betMaxWinStreak, betWinStreak);
      betLoseStreak = 0;
    } else {
      betLoseStreak++;
      betMaxLoseStreak = Math.max(betMaxLoseStreak, betLoseStreak);
      betWinStreak = 0;
    }
  }

  return {
    upMaxWinStreak,
    upMaxLoseStreak,
    downMaxWinStreak,
    downMaxLoseStreak,
    betMaxWinStreak,
    betMaxLoseStreak,
  };
}

// 执行模拟投注
export function runStockSimulation(config: StockSimulationConfig): StockSimulationStats {
  const { rounds, initialCapital, baseBet, maxBet, marketType } = config;

  let balance = initialCapital;
  let currentBet = baseBet;
  const history: StockRoundResult[] = [];
  const balanceHistory: number[] = [initialCapital];

  let upCount = 0;
  let downCount = 0;
  let flatCount = 0;

  for (let round = 1; round <= rounds; round++) {
    // 检查资金是否足够
    if (balance < baseBet) {
      // 资金不足，提前终止
      break;
    }

    // 确定本局投注金额
    const betAmount = Math.min(currentBet, maxBet, balance);

    // 随机选择下注方向
    const betOn = randomBetChoice();

    // 生成开奖结果
    const { outcome, changePercent } = generateOutcome(marketType);

    // 统计开奖结果
    if (outcome === 'up') upCount++;
    else if (outcome === 'down') downCount++;
    else flatCount++;

    // 扣除投注金额
    balance -= betAmount;

    // 计算赢得金额
    const winAmount = calculateWinAmount(betAmount, betOn, outcome, changePercent, marketType);

    // 更新余额
    balance += winAmount;

    // 记录历史
    history.push({
      round,
      outcome,
      betOn,
      betAmount,
      winAmount,
      balance,
      changePercent,
    });

    // 记录资金曲线
    balanceHistory.push(balance);

    // 更新下注策略（马丁格尔）
    if (outcome === 'flat') {
      // 平局，下注金额不变
    } else if (betOn === outcome) {
      // 赢了，重置为基础投注
      currentBet = baseBet;
    } else {
      // 输了，翻倍
      currentBet = Math.min(currentBet * 2, maxBet);
    }
  }

  // 计算连胜连输
  const streaks = calculateStreaks(history);

  // 计算统计数据
  const totalRounds = upCount + downCount + flatCount;
  const profitLoss = balance - initialCapital;
  const profitLossRate = (profitLoss / initialCapital) * 100;

  // 计算投注金额统计
  const betAmounts = history.map(h => h.betAmount);
  const minBet = betAmounts.length > 0 ? Math.min(...betAmounts) : baseBet;
  const maxBetAmount = betAmounts.length > 0 ? Math.max(...betAmounts) : baseBet;
  const totalBetAmount = betAmounts.reduce((sum, bet) => sum + bet, 0);
  const avgBet = betAmounts.length > 0 ? totalBetAmount / betAmounts.length : baseBet;
  const turnoverMultiple = initialCapital > 0 ? totalBetAmount / initialCapital : 0;
  const avgProfitPerRound = totalRounds > 0 ? profitLoss / totalRounds : 0;

  // 计算资金波动
  const minBalance = balanceHistory.length > 0 ? Math.min(...balanceHistory) : initialCapital;
  const maxBalance = balanceHistory.length > 0 ? Math.max(...balanceHistory) : initialCapital;

  return {
    initialCapital,
    finalBalance: balance,
    profitLoss,
    profitLossRate,
    maxBet,
    totalRounds,
    minBet,
    maxBetAmount,
    avgBet,
    totalBetAmount,
    turnoverMultiple,
    avgProfitPerRound,
    minBalance,
    maxBalance,
    upCount,
    downCount,
    flatCount,
    upRate: totalRounds > 0 ? (upCount / totalRounds) * 100 : 0,
    downRate: totalRounds > 0 ? (downCount / totalRounds) * 100 : 0,
    flatRate: totalRounds > 0 ? (flatCount / totalRounds) * 100 : 0,
    ...streaks,
    history,
    balanceHistory,
    marketType,
  };
}

// 获取市场期望值
export function getMarketExpectation(marketType: 'A' | 'HK' | 'US') {
  const probs = MARKET_PROBABILITIES[marketType];
  return {
    upExpected: probs.up * 100,
    downExpected: probs.down * 100,
    flatExpected: probs.flat * 100,
    commission: probs.commission * 100,
    avgChange: probs.avgChange,
  };
}
