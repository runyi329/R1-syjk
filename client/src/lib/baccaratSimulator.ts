// 百家乐模拟投注算法

export interface SimulationConfig {
  rounds: number; // 模拟局数
  initialCapital: number; // 初始资金
  basebet: number; // 基础投注额（500元）
  maxBet: number; // 最大单注限制（2,000,000元）
}

export interface RoundResult {
  round: number; // 局数
  outcome: 'banker' | 'player' | 'tie'; // 开奖结果
  betOn: 'banker' | 'player'; // 下注方向
  betAmount: number; // 投注金额
  winAmount: number; // 赢得金额（已扣除抽水）
  balance: number; // 当前余额
}

export interface SimulationStats {
  initialCapital: number; // 初始资金
  finalBalance: number; // 最终余额
  profitLoss: number; // 盈亏金额
  profitLossRate: number; // 盈亏率
  maxBet: number; // 限红
  totalRounds: number; // 实际投注局数
  bankerCount: number; // 开庄局数
  playerCount: number; // 开闲局数
  tieCount: number; // 开和局数
  bankerRate: number; // 开庄比例
  playerRate: number; // 开闲比例
  tieRate: number; // 开和比例
  bankerMaxWinStreak: number; // 庄最长连赢
  bankerMaxLoseStreak: number; // 庄最长连输
  playerMaxWinStreak: number; // 闲最长连赢
  playerMaxLoseStreak: number; // 闲最长连输
  history: RoundResult[]; // 投注历史（前100局）
  balanceHistory: number[]; // 资金曲线
}

// 生成随机开奖结果（基于真实概率）
function generateOutcome(): 'banker' | 'player' | 'tie' {
  const random = Math.random();
  // 庄赢概率: 45.86%, 闲赢概率: 44.62%, 和局概率: 9.52%
  if (random < 0.4586) return 'banker';
  if (random < 0.4586 + 0.4462) return 'player';
  return 'tie';
}

// 随机选择下注方向
function randomBetChoice(): 'banker' | 'player' {
  return Math.random() < 0.5 ? 'banker' : 'player';
}

// 计算赢得金额
function calculateWinAmount(betAmount: number, betOn: 'banker' | 'player', outcome: 'banker' | 'player' | 'tie'): number {
  if (outcome === 'tie') {
    // 和局退回本金
    return betAmount;
  }

  if (betOn === outcome) {
    // 赢了
    if (betOn === 'banker') {
      // 庄赢抽5%
      return betAmount + betAmount * 0.95;
    } else {
      // 闲赢不抽
      return betAmount * 2;
    }
  } else {
    // 输了
    return 0;
  }
}

// 计算连胜连输统计
function calculateStreaks(history: RoundResult[]): {
  bankerMaxWinStreak: number;
  bankerMaxLoseStreak: number;
  playerMaxWinStreak: number;
  playerMaxLoseStreak: number;
} {
  let bankerWinStreak = 0;
  let bankerLoseStreak = 0;
  let playerWinStreak = 0;
  let playerLoseStreak = 0;

  let bankerMaxWinStreak = 0;
  let bankerMaxLoseStreak = 0;
  let playerMaxWinStreak = 0;
  let playerMaxLoseStreak = 0;

  for (const round of history) {
    if (round.outcome === 'tie') {
      // 和局不算断
      continue;
    }

    if (round.outcome === 'banker') {
      // 庄赢
      bankerWinStreak++;
      bankerMaxWinStreak = Math.max(bankerMaxWinStreak, bankerWinStreak);
      bankerLoseStreak = 0;

      playerLoseStreak++;
      playerMaxLoseStreak = Math.max(playerMaxLoseStreak, playerLoseStreak);
      playerWinStreak = 0;
    } else if (round.outcome === 'player') {
      // 闲赢
      playerWinStreak++;
      playerMaxWinStreak = Math.max(playerMaxWinStreak, playerWinStreak);
      playerLoseStreak = 0;

      bankerLoseStreak++;
      bankerMaxLoseStreak = Math.max(bankerMaxLoseStreak, bankerLoseStreak);
      bankerWinStreak = 0;
    }
  }

  return {
    bankerMaxWinStreak,
    bankerMaxLoseStreak,
    playerMaxWinStreak,
    playerMaxLoseStreak,
  };
}

// 执行模拟投注
export function runSimulation(config: SimulationConfig): SimulationStats {
  const { rounds, initialCapital, basebet, maxBet } = config;

  let balance = initialCapital;
  let currentBet = basebet;
  const history: RoundResult[] = [];
  const balanceHistory: number[] = [initialCapital];

  let bankerCount = 0;
  let playerCount = 0;
  let tieCount = 0;

  for (let round = 1; round <= rounds; round++) {
    // 检查资金是否足够
    if (balance < basebet) {
      // 资金不足，提前终止
      break;
    }

    // 确定本局投注金额
    const betAmount = Math.min(currentBet, maxBet, balance);

    // 随机选择下注方向
    const betOn = randomBetChoice();

    // 生成开奖结果
    const outcome = generateOutcome();

    // 统计开奖结果
    if (outcome === 'banker') bankerCount++;
    else if (outcome === 'player') playerCount++;
    else tieCount++;

    // 扣除投注金额
    balance -= betAmount;

    // 计算赢得金额
    const winAmount = calculateWinAmount(betAmount, betOn, outcome);

    // 更新余额
    balance += winAmount;

    // 记录历史（只保留前100局）
    if (history.length < 100) {
      history.push({
        round,
        outcome,
        betOn,
        betAmount,
        winAmount,
        balance,
      });
    }

    // 记录资金曲线
    balanceHistory.push(balance);

    // 更新下注策略（马丁格尔）
    if (outcome === 'tie') {
      // 和局，下注金额不变
      // currentBet 保持不变
    } else if (betOn === outcome) {
      // 赢了，重置为基础投注
      currentBet = basebet;
    } else {
      // 输了，翻倍
      currentBet = Math.min(currentBet * 2, maxBet);
    }
  }

  // 计算连胜连输
  const streaks = calculateStreaks(history);

  // 计算统计数据
  const totalRounds = bankerCount + playerCount + tieCount;
  const profitLoss = balance - initialCapital;
  const profitLossRate = (profitLoss / initialCapital) * 100;

  return {
    initialCapital,
    finalBalance: balance,
    profitLoss,
    profitLossRate,
    maxBet,
    totalRounds,
    bankerCount,
    playerCount,
    tieCount,
    bankerRate: totalRounds > 0 ? (bankerCount / totalRounds) * 100 : 0,
    playerRate: totalRounds > 0 ? (playerCount / totalRounds) * 100 : 0,
    tieRate: totalRounds > 0 ? (tieCount / totalRounds) * 100 : 0,
    ...streaks,
    history,
    balanceHistory,
  };
}
