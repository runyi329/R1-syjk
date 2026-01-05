import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Calculator, TrendingUp, BarChart3, History } from "lucide-react";
import { Link } from "wouter";

// 彩票类型定义
const lotteryTypes = [
  { id: "ssq", name: "双色球", red: 33, blue: 16, redPick: 6, bluePick: 1 },
  { id: "dlt", name: "大乐透", red: 35, blue: 12, redPick: 5, bluePick: 2 },
  { id: "fc3d", name: "福彩3D", red: 10, blue: 0, redPick: 3, bluePick: 0 },
  { id: "pl5", name: "排列5", red: 10, blue: 0, redPick: 5, bluePick: 0 },
];

// 奖项配置
const prizeConfig: Record<string, Array<{ name: string; prize: number; description: string }>> = {
  ssq: [
    { name: "一等奖", prize: 5000000, description: "6+1" },
    { name: "二等奖", prize: 200000, description: "6+0" },
    { name: "三等奖", prize: 3000, description: "5+1" },
    { name: "四等奖", prize: 200, description: "5+0 或 4+1" },
    { name: "五等奖", prize: 10, description: "4+0 或 3+1" },
    { name: "六等奖", prize: 5, description: "2+1 或 1+1 或 0+1" },
  ],
  dlt: [
    { name: "一等奖", prize: 10000000, description: "5+2" },
    { name: "二等奖", prize: 500000, description: "5+1" },
    { name: "三等奖", prize: 10000, description: "5+0" },
    { name: "四等奖", prize: 3000, description: "4+2" },
    { name: "五等奖", prize: 300, description: "4+1" },
    { name: "六等奖", prize: 200, description: "3+2" },
    { name: "七等奖", prize: 15, description: "4+0 或 3+1" },
    { name: "八等奖", prize: 5, description: "3+0 或 2+2" },
  ],
  fc3d: [
    { name: "直选", prize: 1040, description: "三位数字全对且顺序一致" },
    { name: "组选三", prize: 346, description: "三位数字中有两位相同" },
    { name: "组选六", prize: 173, description: "三位数字各不相同" },
  ],
  pl5: [
    { name: "一等奖", prize: 100000, description: "五位数字全对且顺序一致" },
  ],
};

export default function Lottery() {
  const [selectedType, setSelectedType] = useState(lotteryTypes[0]);
  const [betAmount, setBetAmount] = useState(2);
  const [betCount, setBetCount] = useState(1);

  // 计算组合数 C(n, k)
  const combination = (n: number, k: number): number => {
    if (k === 0 || k === n) return 1;
    if (k > n) return 0;
    
    let result = 1;
    for (let i = 0; i < k; i++) {
      result *= (n - i);
      result /= (i + 1);
    }
    return Math.round(result);
  };

  // 计算中奖概率
  const calculateProbability = (type: typeof lotteryTypes[0]) => {
    if (type.id === "ssq") {
      const redComb = combination(type.red, type.redPick);
      const blueComb = type.blue;
      const total = redComb * blueComb;
      
      return [
        { level: "一等奖 (6+1)", prob: 1 / total, odds: total },
        { level: "二等奖 (6+0)", prob: (blueComb - 1) / total, odds: total / (blueComb - 1) },
        { level: "三等奖 (5+1)", prob: (combination(6, 5) * combination(27, 1) * 1) / total, odds: total / (combination(6, 5) * combination(27, 1)) },
      ];
    } else if (type.id === "dlt") {
      const redComb = combination(type.red, type.redPick);
      const blueComb = combination(type.blue, type.bluePick);
      const total = redComb * blueComb;
      
      return [
        { level: "一等奖 (5+2)", prob: 1 / total, odds: total },
        { level: "二等奖 (5+1)", prob: (combination(12, 1) * 2) / total, odds: total / (combination(12, 1) * 2) },
        { level: "三等奖 (5+0)", prob: combination(10, 0) / total, odds: total / combination(10, 0) },
      ];
    } else if (type.id === "fc3d") {
      return [
        { level: "直选", prob: 1 / 1000, odds: 1000 },
        { level: "组选三", prob: 3 / 1000, odds: 333.33 },
        { level: "组选六", prob: 6 / 1000, odds: 166.67 },
      ];
    } else if (type.id === "pl5") {
      return [
        { level: "一等奖", prob: 1 / 100000, odds: 100000 },
      ];
    }
    return [];
  };

  // 计算期望收益
  const calculateExpectedReturn = () => {
    const totalInvestment = betAmount * betCount;
    const prizes = prizeConfig[selectedType.id] || [];
    const probabilities = calculateProbability(selectedType);
    
    let expectedValue = 0;
    probabilities.forEach((prob, index) => {
      if (prizes[index]) {
        expectedValue += prob.prob * prizes[index].prize;
      }
    });
    
    const expectedReturn = expectedValue * betCount;
    const roi = ((expectedReturn - totalInvestment) / totalInvestment) * 100;
    
    return { totalInvestment, expectedReturn, roi };
  };

  const probabilities = calculateProbability(selectedType);
  const { totalInvestment, expectedReturn, roi } = calculateExpectedReturn();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white">
      {/* 头部导航 */}
      <header className="border-b border-gray-800 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <a className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center font-bold text-xl">
                RI
              </div>
              <div>
                <div className="font-bold text-lg">澳门润儀投资</div>
                <div className="text-xs text-gray-400">RUNYI INVESTMENT</div>
              </div>
            </a>
          </Link>
          
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="sm">首页</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* 主标题 */}
      <div className="container mx-auto px-4 py-8 md:py-12">
        <h1 className="text-3xl md:text-5xl font-bold text-center bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent mb-4">
          彩票数据分析系统
        </h1>
        <p className="text-center text-gray-400 text-sm md:text-base">
          专业的彩票中奖概率计算、期望收益分析与历史数据统计
        </p>
      </div>

      {/* 彩票类型选择 */}
      <div className="container mx-auto px-4 mb-8">
        <Card className="bg-gray-900/50 border-gray-800 p-4 md:p-6">
          <Label className="text-base font-semibold mb-3 block">选择彩票类型</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {lotteryTypes.map((type) => (
              <Button
                key={type.id}
                variant={selectedType.id === type.id ? "default" : "outline"}
                className={`h-auto py-4 ${
                  selectedType.id === type.id
                    ? "bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700"
                    : "border-gray-700 hover:bg-gray-800"
                }`}
                onClick={() => setSelectedType(type)}
              >
                <div className="text-center">
                  <div className="font-bold text-base md:text-lg">{type.name}</div>
                  <div className="text-xs mt-1 opacity-80">
                    {type.blue > 0 ? `${type.redPick}+${type.bluePick}` : `${type.redPick}位`}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </Card>
      </div>

      {/* 功能标签页 */}
      <div className="container mx-auto px-4 pb-12">
        <Tabs defaultValue="calculator" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-gray-900/50 border border-gray-800 mb-6">
            <TabsTrigger value="calculator" className="flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              <span className="hidden md:inline">概率计算</span>
              <span className="md:hidden">概率</span>
            </TabsTrigger>
            <TabsTrigger value="expected" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden md:inline">期望收益</span>
              <span className="md:hidden">收益</span>
            </TabsTrigger>
            <TabsTrigger value="statistics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden md:inline">历史统计</span>
              <span className="md:hidden">统计</span>
            </TabsTrigger>
            <TabsTrigger value="trend" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              <span className="hidden md:inline">号码走势</span>
              <span className="md:hidden">走势</span>
            </TabsTrigger>
          </TabsList>

          {/* 概率计算器 */}
          <TabsContent value="calculator">
            <Card className="bg-gray-900/50 border-gray-800 p-4 md:p-6">
              <h2 className="text-xl md:text-2xl font-bold mb-6">中奖概率计算器</h2>
              
              <div className="space-y-4">
                {probabilities.map((prob, index) => (
                  <div key={index} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div>
                        <div className="font-semibold text-base md:text-lg text-yellow-400">{prob.level}</div>
                        <div className="text-xs md:text-sm text-gray-400 mt-1">
                          {prizeConfig[selectedType.id]?.[index]?.description}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg md:text-2xl font-bold text-orange-400">
                          {(prob.prob * 100).toExponential(2)}%
                        </div>
                        <div className="text-xs md:text-sm text-gray-400 mt-1">
                          1 / {prob.odds.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-900/20 border border-blue-800 rounded-lg">
                <p className="text-xs md:text-sm text-blue-300">
                  <strong>说明：</strong>以上概率为理论计算值，实际中奖情况受多种因素影响。彩票具有高度不确定性，请理性投注。
                </p>
              </div>
            </Card>
          </TabsContent>

          {/* 期望收益分析 */}
          <TabsContent value="expected">
            <Card className="bg-gray-900/50 border-gray-800 p-4 md:p-6">
              <h2 className="text-xl md:text-2xl font-bold mb-6">期望收益分析</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <Label htmlFor="betAmount" className="text-sm mb-2 block">单注金额（元）</Label>
                  <Input
                    id="betAmount"
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(Number(e.target.value))}
                    min={2}
                    className="bg-gray-800 border-gray-700"
                  />
                </div>
                <div>
                  <Label htmlFor="betCount" className="text-sm mb-2 block">投注注数</Label>
                  <Input
                    id="betCount"
                    type="number"
                    value={betCount}
                    onChange={(e) => setBetCount(Number(e.target.value))}
                    min={1}
                    className="bg-gray-800 border-gray-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <div className="text-xs md:text-sm text-gray-400 mb-2">总投资</div>
                  <div className="text-xl md:text-3xl font-bold text-white">
                    ¥{totalInvestment.toLocaleString()}
                  </div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <div className="text-xs md:text-sm text-gray-400 mb-2">期望回报</div>
                  <div className="text-xl md:text-3xl font-bold text-green-400">
                    ¥{expectedReturn.toFixed(2)}
                  </div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <div className="text-xs md:text-sm text-gray-400 mb-2">投资回报率</div>
                  <div className={`text-xl md:text-3xl font-bold ${roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {roi.toFixed(2)}%
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <h3 className="font-semibold mb-4 text-base md:text-lg">各奖项期望收益明细</h3>
                <div className="space-y-3">
                  {probabilities.map((prob, index) => {
                    const prize = prizeConfig[selectedType.id]?.[index];
                    if (!prize) return null;
                    
                    const expectedPrize = prob.prob * prize.prize * betCount;
                    
                    return (
                      <div key={index} className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 pb-3 border-b border-gray-700 last:border-0">
                        <div className="flex-1">
                          <div className="font-medium text-sm md:text-base">{prize.name}</div>
                          <div className="text-xs text-gray-400">{prize.description}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm md:text-base text-yellow-400">
                            奖金: ¥{prize.prize.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-400">
                            期望: ¥{expectedPrize.toFixed(4)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 p-4 bg-red-900/20 border border-red-800 rounded-lg">
                <p className="text-xs md:text-sm text-red-300">
                  <strong>风险提示：</strong>期望收益为理论计算值，实际收益存在极大不确定性。{selectedType.name}的投资回报率为负值，长期投注必然亏损。请理性对待，切勿沉迷。
                </p>
              </div>
            </Card>
          </TabsContent>

          {/* 历史数据统计 */}
          <TabsContent value="statistics">
            <Card className="bg-gray-900/50 border-gray-800 p-4 md:p-6">
              <h2 className="text-xl md:text-2xl font-bold mb-6">历史数据统计</h2>
              
              {/* 号码频率分布 */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">号码出现频率分布（模拟数据）</h3>
                <div className="grid grid-cols-5 md:grid-cols-11 gap-2">
                  {Array.from({ length: selectedType.red }, (_, i) => {
                    const num = i + 1;
                    const frequency = Math.floor(Math.random() * 50) + 50;
                    const isHot = frequency > 80;
                    const isCold = frequency < 60;
                    
                    return (
                      <div
                        key={num}
                        className={`p-3 rounded-lg border text-center ${
                          isHot
                            ? 'bg-red-900/30 border-red-700'
                            : isCold
                            ? 'bg-blue-900/30 border-blue-700'
                            : 'bg-gray-800/50 border-gray-700'
                        }`}
                      >
                        <div className="text-lg font-bold">{num.toString().padStart(2, '0')}</div>
                        <div className="text-xs text-gray-400 mt-1">{frequency}次</div>
                        {isHot && <div className="text-xs text-red-400 mt-1">热</div>}
                        {isCold && <div className="text-xs text-blue-400 mt-1">冷</div>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 冷热号分析 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
                  <h4 className="font-semibold text-red-400 mb-3">热门号码 TOP 5</h4>
                  <div className="space-y-2">
                    {[7, 15, 23, 28, 31].map((num, index) => (
                      <div key={num} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">#{index + 1}</span>
                          <span className="font-bold text-lg">{num.toString().padStart(2, '0')}</span>
                        </div>
                        <div className="text-sm text-gray-400">{95 - index * 3}次</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-400 mb-3">冷门号码 TOP 5</h4>
                  <div className="space-y-2">
                    {[3, 11, 19, 25, 33].map((num, index) => (
                      <div key={num} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">#{index + 1}</span>
                          <span className="font-bold text-lg">{num.toString().padStart(2, '0')}</span>
                        </div>
                        <div className="text-sm text-gray-400">{52 + index * 2}次</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-yellow-900/20 border border-yellow-800 rounded-lg">
                <p className="text-xs md:text-sm text-yellow-300">
                  <strong>说明：</strong>以上数据为模拟数据，仅供参考。实际开奖结果完全随机，历史数据不影响未来开奖。
                </p>
              </div>
            </Card>
          </TabsContent>

          {/* 号码走势 */}
          <TabsContent value="trend">
            <Card className="bg-gray-900/50 border-gray-800 p-4 md:p-6">
              <h2 className="text-xl md:text-2xl font-bold mb-6">号码走势分析</h2>
              
              {/* 近期开奖记录 */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">近期开奖记录（模拟数据）</h3>
                <div className="space-y-3">
                  {[
                    { period: '2026001', red: [3, 7, 15, 23, 28, 31], blue: [5] },
                    { period: '2025156', red: [2, 11, 19, 25, 29, 33], blue: [12] },
                    { period: '2025155', red: [5, 8, 14, 22, 27, 30], blue: [8] },
                    { period: '2025154', red: [1, 9, 16, 21, 26, 32], blue: [3] },
                    { period: '2025153', red: [4, 10, 17, 20, 24, 28], blue: [15] },
                  ].map((record) => (
                    <div key={record.period} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                      <div className="flex flex-col md:flex-row md:items-center gap-3">
                        <div className="text-sm text-gray-400 min-w-[80px]">第 {record.period} 期</div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {record.red.map((num) => (
                            <div
                              key={num}
                              className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-red-600 flex items-center justify-center font-bold text-sm md:text-base"
                            >
                              {num.toString().padStart(2, '0')}
                            </div>
                          ))}
                          {selectedType.blue > 0 && (
                            <>
                              <span className="text-gray-500 mx-1">+</span>
                              {record.blue.map((num) => (
                                <div
                                  key={num}
                                  className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm md:text-base"
                                >
                                  {num.toString().padStart(2, '0')}
                                </div>
                              ))}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 遗漏值分析 */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">遗漏值分析（模拟数据）</h3>
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <div className="grid grid-cols-5 md:grid-cols-11 gap-2">
                    {Array.from({ length: selectedType.red }, (_, i) => {
                      const num = i + 1;
                      const omit = Math.floor(Math.random() * 20);
                      const isLongOmit = omit > 15;
                      
                      return (
                        <div
                          key={num}
                          className={`p-2 rounded text-center ${
                            isLongOmit ? 'bg-orange-900/30 border border-orange-700' : 'bg-gray-700/50'
                          }`}
                        >
                          <div className="text-sm font-bold">{num.toString().padStart(2, '0')}</div>
                          <div className="text-xs text-gray-400 mt-1">{omit}期</div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 text-xs text-gray-400">
                    <span className="text-orange-400">橙色</span> 表示长期未出现的号码（15期以上）
                  </div>
                </div>
              </div>

              <div className="p-4 bg-purple-900/20 border border-purple-800 rounded-lg">
                <p className="text-xs md:text-sm text-purple-300">
                  <strong>重要提示：</strong>以上数据为模拟数据，仅供参考。开奖结果完全随机，遗漏值不代表未来趋势。请理性对待，谨慎投注。
                </p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
