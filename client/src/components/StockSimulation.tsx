import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { runStockSimulation, StockSimulationStats, getMarketExpectation } from "@/lib/stockSimulator";

interface StockSimulationProps {
  marketType: 'A' | 'HK' | 'US';
  marketName: string;
}

export default function StockSimulation({ marketType, marketName }: StockSimulationProps) {
  const [selectedRounds, setSelectedRounds] = useState<number>(1000);
  const [initialCapital, setInitialCapital] = useState<string>("10000");
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [simulationResult, setSimulationResult] = useState<StockSimulationStats | null>(null);
  const [showAllHistory, setShowAllHistory] = useState(false);

  const roundOptions = [100, 500, 1000, 5000, 10000];
  const capitalOptions = [10000, 50000, 100000, 200000, 500000, 1000000];
  const expectations = getMarketExpectation(marketType);

  const handleSimulation = async () => {
    const capital = parseFloat(initialCapital);
    if (isNaN(capital) || capital < 1000 || capital > 10000000) {
      alert("请输入有效的资金金额（1000 - 10,000,000）");
      return;
    }

    setIsSimulating(true);
    setSimulationProgress(0);
    setSimulationResult(null);
    setShowAllHistory(false);

    // 模拟进度动画
    const progressInterval = setInterval(() => {
      setSimulationProgress(prev => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + Math.random() * 15;
      });
    }, 100);

    // 延迟执行模拟以显示进度
    await new Promise(resolve => setTimeout(resolve, 1500));

    const result = runStockSimulation({
      rounds: selectedRounds,
      initialCapital: capital,
      baseBet: 500,
      maxBet: 2000000,
      marketType,
    });

    clearInterval(progressInterval);
    setSimulationProgress(100);

    await new Promise(resolve => setTimeout(resolve, 300));

    setSimulationResult(result);
    setIsSimulating(false);
  };

  const handleContinueSimulation = async () => {
    if (!simulationResult || simulationResult.finalBalance < 500) return;

    setIsSimulating(true);
    setSimulationProgress(0);

    const progressInterval = setInterval(() => {
      setSimulationProgress(prev => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + Math.random() * 15;
      });
    }, 100);

    await new Promise(resolve => setTimeout(resolve, 1500));

    const newResult = runStockSimulation({
      rounds: selectedRounds,
      initialCapital: simulationResult.finalBalance,
      baseBet: 500,
      maxBet: 2000000,
      marketType,
    });

    clearInterval(progressInterval);
    setSimulationProgress(100);

    await new Promise(resolve => setTimeout(resolve, 300));

    // 合并结果
    const mergedResult: StockSimulationStats = {
      ...newResult,
      initialCapital: simulationResult.initialCapital,
      totalRounds: simulationResult.totalRounds + newResult.totalRounds,
      upCount: simulationResult.upCount + newResult.upCount,
      downCount: simulationResult.downCount + newResult.downCount,
      flatCount: simulationResult.flatCount + newResult.flatCount,
      totalBetAmount: simulationResult.totalBetAmount + newResult.totalBetAmount,
      history: [...simulationResult.history, ...newResult.history.map(h => ({
        ...h,
        round: h.round + simulationResult.totalRounds
      }))],
      balanceHistory: [...simulationResult.balanceHistory, ...newResult.balanceHistory.slice(1)],
      minBalance: Math.min(simulationResult.minBalance, newResult.minBalance),
      maxBalance: Math.max(simulationResult.maxBalance, newResult.maxBalance),
      minBet: Math.min(simulationResult.minBet, newResult.minBet),
      maxBetAmount: Math.max(simulationResult.maxBetAmount, newResult.maxBetAmount),
      upMaxWinStreak: Math.max(simulationResult.upMaxWinStreak, newResult.upMaxWinStreak),
      upMaxLoseStreak: Math.max(simulationResult.upMaxLoseStreak, newResult.upMaxLoseStreak),
      downMaxWinStreak: Math.max(simulationResult.downMaxWinStreak, newResult.downMaxWinStreak),
      downMaxLoseStreak: Math.max(simulationResult.downMaxLoseStreak, newResult.downMaxLoseStreak),
      betMaxWinStreak: Math.max(simulationResult.betMaxWinStreak, newResult.betMaxWinStreak),
      betMaxLoseStreak: Math.max(simulationResult.betMaxLoseStreak, newResult.betMaxLoseStreak),
    };

    // 重新计算比例
    const totalRounds = mergedResult.upCount + mergedResult.downCount + mergedResult.flatCount;
    mergedResult.upRate = totalRounds > 0 ? (mergedResult.upCount / totalRounds) * 100 : 0;
    mergedResult.downRate = totalRounds > 0 ? (mergedResult.downCount / totalRounds) * 100 : 0;
    mergedResult.flatRate = totalRounds > 0 ? (mergedResult.flatCount / totalRounds) * 100 : 0;
    mergedResult.avgBet = totalRounds > 0 ? mergedResult.totalBetAmount / totalRounds : 500;
    mergedResult.turnoverMultiple = mergedResult.initialCapital > 0 ? mergedResult.totalBetAmount / mergedResult.initialCapital : 0;
    mergedResult.avgProfitPerRound = totalRounds > 0 ? mergedResult.profitLoss / totalRounds : 0;

    setSimulationResult(mergedResult);
    setIsSimulating(false);
  };

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">{marketName}模拟投注</h2>
        <p className="text-muted-foreground mb-4">使用马丁格尔策略模拟股票涨跌投注</p>
      </div>

      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle>模拟设置</CardTitle>
          <CardDescription>选择模拟局数和初始资金</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 局数选择 */}
          <div className="space-y-2">
            <Label>模拟局数</Label>
            <div className="flex flex-wrap gap-2">
              {roundOptions.map(rounds => (
                <Button
                  key={rounds}
                  variant={selectedRounds === rounds ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedRounds(rounds)}
                  disabled={isSimulating}
                >
                  {rounds.toLocaleString()}局
                </Button>
              ))}
            </div>
          </div>

          {/* 资金输入 */}
          <div className="space-y-2">
            <Label>初始资金（元）</Label>
            <Input
              type="number"
              value={initialCapital}
              onChange={(e) => setInitialCapital(e.target.value)}
              placeholder="请输入初始资金"
              min={1000}
              max={10000000}
              disabled={isSimulating}
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {capitalOptions.map(capital => (
                <Button
                  key={capital}
                  variant="outline"
                  size="sm"
                  onClick={() => setInitialCapital(capital.toString())}
                  disabled={isSimulating}
                >
                  {(capital / 10000).toFixed(0)}万
                </Button>
              ))}
            </div>
          </div>

          {/* 开始模拟按钮 */}
          <div className="flex gap-4">
            <Button
              onClick={handleSimulation}
              disabled={isSimulating}
              className="flex-1"
            >
              {isSimulating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  模拟中 {Math.round(simulationProgress)}%
                </>
              ) : (
                "开始模拟"
              )}
            </Button>
            {simulationResult && simulationResult.finalBalance >= 500 && (
              <Button
                onClick={handleContinueSimulation}
                disabled={isSimulating}
                variant="outline"
              >
                继续投注
              </Button>
            )}
          </div>

          {/* 进度条 */}
          {isSimulating && (
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${simulationProgress}%` }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 模拟结果 */}
      {simulationResult && (
        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle>模拟结果</CardTitle>
            <CardDescription>此次共投注 {simulationResult.totalRounds.toLocaleString()} 局</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 盈亏统计 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <div className="text-xs text-muted-foreground mb-1">初始资金</div>
                <div className="text-lg font-bold text-card-foreground">
                  ¥{simulationResult.initialCapital.toLocaleString('zh-CN')}
                </div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <div className="text-xs text-muted-foreground mb-1">最终余额</div>
                <div className="text-lg font-bold text-card-foreground">
                  ¥{simulationResult.finalBalance.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <div className="text-xs text-muted-foreground mb-1">盈亏金额</div>
                <div className={`text-lg font-bold ${simulationResult.profitLoss >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {simulationResult.profitLoss >= 0 ? '+' : ''}¥{simulationResult.profitLoss.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <div className="text-xs text-muted-foreground mb-1">盈亏率</div>
                <div className={`text-lg font-bold ${simulationResult.profitLossRate >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {simulationResult.profitLossRate >= 0 ? '+' : ''}{simulationResult.profitLossRate.toFixed(2)}%
                </div>
              </div>
            </div>

            {/* 投注统计 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <div className="text-xs text-muted-foreground mb-1">总投注金额</div>
                <div className="text-lg font-bold text-card-foreground">
                  ¥{simulationResult.totalBetAmount.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-primary mt-1">流水 {simulationResult.turnoverMultiple.toFixed(2)} 倍</div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <div className="text-xs text-muted-foreground mb-1">平均投注金额</div>
                <div className="text-lg font-bold text-card-foreground">
                  ¥{simulationResult.avgBet.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <div className="text-xs text-muted-foreground mb-1">最小投注金额</div>
                <div className="text-lg font-bold text-card-foreground">
                  ¥{simulationResult.minBet.toLocaleString('zh-CN')}
                </div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <div className="text-xs text-muted-foreground mb-1">最大投注金额</div>
                <div className="text-lg font-bold text-card-foreground">
                  ¥{simulationResult.maxBetAmount.toLocaleString('zh-CN')}
                </div>
              </div>
            </div>

            {/* 平均每局盈亏 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <div className="text-xs text-muted-foreground mb-1">平均每局盈亏</div>
                <div className={`text-lg font-bold ${simulationResult.avgProfitPerRound >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {simulationResult.avgProfitPerRound >= 0 ? '+' : ''}¥{simulationResult.avgProfitPerRound.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <div className="text-xs text-muted-foreground mb-1">手续费率</div>
                <div className="text-lg font-bold text-card-foreground">
                  {expectations.commission.toFixed(2)}%
                </div>
              </div>
            </div>

            {/* 资金波动统计 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <div className="text-xs text-muted-foreground mb-1">资金最低值</div>
                <div className="text-lg font-bold text-green-500">¥{simulationResult.minBalance.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}</div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <div className="text-xs text-muted-foreground mb-1">资金最高值</div>
                <div className="text-lg font-bold text-red-500">¥{simulationResult.maxBalance.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}</div>
                <div className="text-xs text-red-500 mt-1">
                  盈利 +¥{(simulationResult.maxBalance - simulationResult.initialCapital).toLocaleString('zh-CN', { maximumFractionDigits: 2 })} 
                  ({((simulationResult.maxBalance - simulationResult.initialCapital) / simulationResult.initialCapital * 100).toFixed(2)}%)
                </div>
              </div>
            </div>

            {/* 涨跌统计 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <div className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-red-500" />
                  涨统计
                </div>
                <div className="text-2xl font-bold text-card-foreground mb-1">{simulationResult.upCount}局</div>
                <div className="text-xs text-muted-foreground mb-1">实际占比 {simulationResult.upRate.toFixed(2)}%</div>
                <div className="text-xs text-primary">期望值 {expectations.upExpected.toFixed(2)}% (偏差 {(simulationResult.upRate - expectations.upExpected).toFixed(2)}%)</div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <div className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-green-500" />
                  跌统计
                </div>
                <div className="text-2xl font-bold text-card-foreground mb-1">{simulationResult.downCount}局</div>
                <div className="text-xs text-muted-foreground mb-1">实际占比 {simulationResult.downRate.toFixed(2)}%</div>
                <div className="text-xs text-primary">期望值 {expectations.downExpected.toFixed(2)}% (偏差 {(simulationResult.downRate - expectations.downExpected).toFixed(2)}%)</div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <div className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                  <Minus className="w-4 h-4 text-gray-500" />
                  平统计
                </div>
                <div className="text-2xl font-bold text-card-foreground mb-1">{simulationResult.flatCount}局</div>
                <div className="text-xs text-muted-foreground mb-1">实际占比 {simulationResult.flatRate.toFixed(2)}%</div>
                <div className="text-xs text-primary">期望值 {expectations.flatExpected.toFixed(2)}% (偏差 {(simulationResult.flatRate - expectations.flatExpected).toFixed(2)}%)</div>
              </div>
            </div>

            {/* 连涨连跌统计 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <div className="text-xs text-muted-foreground mb-1">最长连涨</div>
                <div className="text-xl font-bold text-red-500">{simulationResult.upMaxWinStreak}局</div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <div className="text-xs text-muted-foreground mb-1">涨后最长连跌</div>
                <div className="text-xl font-bold text-green-500">{simulationResult.upMaxLoseStreak}局</div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <div className="text-xs text-muted-foreground mb-1">最长连跌</div>
                <div className="text-xl font-bold text-green-500">{simulationResult.downMaxWinStreak}局</div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <div className="text-xs text-muted-foreground mb-1">跌后最长连涨</div>
                <div className="text-xl font-bold text-red-500">{simulationResult.downMaxLoseStreak}局</div>
              </div>
            </div>

            {/* 玩家连赢连输统计 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <div className="text-xs text-muted-foreground mb-1">玩家最长连赢</div>
                <div className="text-xl font-bold text-red-500">{simulationResult.betMaxWinStreak}局</div>
                <div className="text-xs text-muted-foreground mt-1">（涨跌都算赢，平局不算断）</div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <div className="text-xs text-muted-foreground mb-1">玩家最长连输</div>
                <div className="text-xl font-bold text-green-500">{simulationResult.betMaxLoseStreak}局</div>
                <div className="text-xs text-muted-foreground mt-1">（平局不算断）</div>
              </div>
            </div>

            {/* 资金曲线图 */}
            <div className="p-4 bg-muted/50 rounded-lg border border-border">
              <h4 className="font-semibold text-card-foreground mb-4">资金变化趋势</h4>
              {(() => {
                const balanceData = simulationResult.balanceHistory.map((balance, index) => ({ round: index, balance }));
                const maxBalance = Math.max(...balanceData.map(d => d.balance));
                return (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center px-2">
                      <span className="text-sm text-muted-foreground">最高资金</span>
                      <span className="text-lg font-bold text-[var(--success)]">¥{maxBalance.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={balanceData}>
                          <defs>
                            <linearGradient id="gradient-stock-balance" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                          <XAxis 
                            dataKey="round" 
                            stroke="var(--muted-foreground)" 
                            tick={{ fill: 'var(--muted-foreground)' }}
                          />
                          <YAxis 
                            stroke="var(--muted-foreground)" 
                            tick={{ fill: 'var(--muted-foreground)' }}
                          />
                          <RechartsTooltip 
                            contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                            labelStyle={{ color: 'var(--foreground)' }}
                            itemStyle={{ color: 'var(--foreground)' }}
                            formatter={(value: any) => `¥${value.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}`}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="balance" 
                            stroke="var(--primary)" 
                            strokeWidth={2}
                            fill="url(#gradient-stock-balance)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* 投注历史 */}
            {simulationResult.history.length > 0 && (
              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-semibold text-card-foreground">
                    投注历史（{showAllHistory ? `全部${simulationResult.history.length}局` : '最后100局'}）
                  </h4>
                  {simulationResult.history.length > 100 && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowAllHistory(!showAllHistory)}
                    >
                      {showAllHistory ? '收起' : `查看全部 (${simulationResult.history.length}局)`}
                    </Button>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-2 text-muted-foreground">局数</th>
                        <th className="text-left py-2 px-2 text-muted-foreground">结果</th>
                        <th className="text-left py-2 px-2 text-muted-foreground">涨跌幅</th>
                        <th className="text-left py-2 px-2 text-muted-foreground">下注</th>
                        <th className="text-right py-2 px-2 text-muted-foreground">投注金额</th>
                        <th className="text-right py-2 px-2 text-muted-foreground">赢得金额</th>
                        <th className="text-right py-2 px-2 text-muted-foreground">余额</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(showAllHistory ? simulationResult.history : simulationResult.history.slice(-100)).map((round) => (
                        <tr key={round.round} className="border-b border-border/50">
                          <td className="py-2 px-2 text-card-foreground">#{round.round}</td>
                          <td className="py-2 px-2">
                            <Badge variant={round.outcome === 'up' ? 'default' : round.outcome === 'down' ? 'secondary' : 'outline'}>
                              {round.outcome === 'up' ? '涨' : round.outcome === 'down' ? '跌' : '平'}
                            </Badge>
                          </td>
                          <td className={`py-2 px-2 ${round.changePercent >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                            {round.changePercent >= 0 ? '+' : ''}{round.changePercent.toFixed(2)}%
                          </td>
                          <td className="py-2 px-2">
                            <Badge variant="outline">
                              {round.betOn === 'up' ? '买涨' : '买跌'}
                            </Badge>
                          </td>
                          <td className="py-2 px-2 text-right text-card-foreground">
                            ¥{round.betAmount.toLocaleString('zh-CN')}
                          </td>
                          <td className={`py-2 px-2 text-right ${round.winAmount > round.betAmount ? 'text-red-500' : round.winAmount < round.betAmount ? 'text-green-500' : 'text-muted-foreground'}`}>
                            ¥{round.winAmount.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-2 px-2 text-right text-card-foreground">
                            ¥{round.balance.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </section>
  );
}
