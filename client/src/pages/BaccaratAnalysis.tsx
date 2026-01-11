import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ScrollToTop from "@/components/ScrollToTop";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Info, AlertTriangle, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import { Bar, BarChart, Line, LineChart, Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, Cell, CartesianGrid, Legend } from "recharts";
import baccaratData from "../data/baccaratData.json";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { runSimulation, SimulationStats } from "@/lib/baccaratSimulator";
import { Loader2 } from "lucide-react";

// 颜色常量
const COLORS = {
  recommended: "var(--success)", // 绿色
  caution: "var(--warning)",     // 黄色
  not_recommended: "var(--danger)" // 红色
};

const RECOMMENDATION_LABELS = {
  strongly_recommended: "强烈推荐",
  recommended: "推荐",
  caution: "谨慎",
  not_recommended: "不推荐"
};

const RECOMMENDATION_ICONS = {
  strongly_recommended: <CheckCircle className="w-4 h-4 text-[var(--success)]" />,
  recommended: <CheckCircle className="w-4 h-4 text-[var(--success)]" />,
  caution: <AlertTriangle className="w-4 h-4 text-[var(--warning)]" />,
  not_recommended: <XCircle className="w-4 h-4 text-[var(--danger)]" />
};

export default function BaccaratAnalysis() {
  const [activeTab, setActiveTab] = useState("main");
  
  // 模拟投注状态
  const [selectedRounds, setSelectedRounds] = useState<number>(1000);
  const [initialCapital, setInitialCapital] = useState<string>("10000");
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [simulationResult, setSimulationResult] = useState<SimulationStats | null>(null);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [simulationRounds, setSimulationRounds] = useState<Array<{roundNumber: number, stats: SimulationStats}>>([]); // 存储多轮投注数据

  // 合并所有数据用于综合图表
  const allData = [
    ...baccaratData.mainBets,
    ...baccaratData.pairBets,
    ...baccaratData.sideBets
  ].sort((a, b) => a.edge - b.edge);

  const [selectedData, setSelectedData] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const handleBarClick = (data: any) => {
    if (!isDesktop) {
      setSelectedData(data);
      setIsDrawerOpen(true);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (isDesktop && active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border p-3 rounded-lg shadow-lg min-w-[200px] z-50 relative">
          <p className="font-bold text-popover-foreground mb-1">{data.name}</p>
          <p className="text-sm text-muted-foreground">庄家优势: <span className="font-mono font-bold text-foreground">{data.edge}%</span></p>
          <p className="text-sm text-muted-foreground">赔率: {data.payout}</p>
          <p className="text-xs mt-2 text-muted-foreground whitespace-normal break-words">{data.description}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen pb-20 md:pb-0 bg-background font-sans text-foreground">
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="text-xl font-bold">{selectedData?.name}</DrawerTitle>
            <DrawerDescription>
              <div className="mt-4 space-y-4">
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="text-muted-foreground">庄家优势</span>
                  <span className="font-mono font-bold text-xl text-foreground">{selectedData?.edge}%</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="text-muted-foreground">赔率</span>
                  <span className="font-mono font-medium text-foreground">{selectedData?.payout}</span>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-foreground leading-relaxed">{selectedData?.description}</p>
                </div>
              </div>
            </DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">关闭</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
      {/* 头部区域 */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm z-10">
        <div className="container mx-auto py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" className="mr-2">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <img src="/logo.png" alt="数金研投 Logo" className="w-8 h-8 rounded-lg shadow-[0_0_10px_rgba(var(--primary),0.3)]" />
            <h1 className="text-xl font-bold tracking-tight">百家乐数据透视</h1>
          </div>
          <nav className="hidden md:flex gap-6 text-sm font-medium text-muted-foreground">
            <a href="#overview" className="hover:text-foreground transition-colors">总览</a>
            <a href="#analysis" className="hover:text-foreground transition-colors">详细分析</a>
            <a href="#strategy" className="hover:text-foreground transition-colors">策略建议</a>
          </nav>
        </div>
      </header>

      <main className="container mx-auto py-8 space-y-12">
        {/* 英雄区域：核心数据展示 */}
        <section id="overview" className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="col-span-1 md:col-span-2 border-none shadow-sm bg-gradient-to-br from-card to-secondary/50">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">庄家优势 (House Edge)</CardTitle>
              <CardDescription>
                赌场在长期游戏中相对于玩家的数学优势。数值越低，对玩家越有利。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={baccaratData.mainBets} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <XAxis type="number" domain={[0, 15]} hide />
                    <YAxis type="category" dataKey="name" width={80} tick={{fontSize: 11}} />
                    <RechartsTooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} wrapperStyle={{ zIndex: 100 }} />
                    <Bar 
                      dataKey="edge" 
                      radius={[0, 4, 4, 0]} 
                      barSize={40} 
                      label={{ position: 'insideLeft', fill: '#fff', fontSize: 11, formatter: (val: any) => `${val}%` }}
                      onClick={(data) => handleBarClick(data)}
                      style={{ cursor: 'pointer' }}
                    >
                      {baccaratData.mainBets.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.edge < 2 ? "var(--success)" : entry.edge < 5 ? "var(--warning)" : "var(--danger)"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-l-4 border-l-[var(--success)] shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-[var(--success)]" />
                  最佳投注
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-[var(--success)] mb-1">1.06%</div>
                <p className="text-sm text-muted-foreground font-medium">庄家 (Banker)</p>
                <p className="text-xs text-muted-foreground mt-2">虽然需扣5%佣金，但仍是数学期望值最高的选择。</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-[var(--danger)] shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-[var(--danger)]" />
                  最差投注
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-[var(--danger)] mb-1">14.36%</div>
                <p className="text-sm text-muted-foreground font-medium">和局 (Tie)</p>
                <p className="text-xs text-muted-foreground mt-2">高赔率陷阱。平均每投注100元，预期损失14.36元。</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 详细分析区域 */}
        <section id="analysis" className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">全景数据分析</h2>
              <p className="text-muted-foreground">探索不同投注类型的风险与回报</p>
            </div>
            
            <Tabs defaultValue="main" className="w-full md:w-auto" onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4 md:w-[400px]">
                <TabsTrigger value="main">主要</TabsTrigger>
                <TabsTrigger value="pair">对子</TabsTrigger>
                <TabsTrigger value="side">边注</TabsTrigger>
                <TabsTrigger value="all">全部</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <Card className="border-none shadow-md overflow-hidden">
            <CardContent className="p-6">
              <div className="h-[500px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={activeTab === 'main' ? baccaratData.mainBets : 
                          activeTab === 'pair' ? baccaratData.pairBets : 
                          activeTab === 'side' ? baccaratData.sideBets : allData}
                    layout="vertical"
                    margin={{ top: 20, right: 10, left: 0, bottom: 20 }}
                  >
                    <XAxis type="number" domain={[0, 'auto']} tickFormatter={(val) => `${val}%`} />
                    <YAxis type="category" dataKey="name" width={90} tick={{fontSize: 11, fontWeight: 500}} />
                    <RechartsTooltip content={<CustomTooltip />} cursor={{fill: 'var(--muted)', opacity: 0.2}} wrapperStyle={{ zIndex: 100 }} />
                    <Bar 
                      dataKey="edge" 
                      radius={[0, 4, 4, 0]} 
                      barSize={30} 
                      animationDuration={1000} 
                      label={{ position: 'insideLeft', fill: '#fff', fontSize: 10, formatter: (val: any) => `${val}%` }}
                      onClick={(data) => handleBarClick(data)}
                      style={{ cursor: 'pointer' }}
                    >
                      {(activeTab === 'main' ? baccaratData.mainBets : 
                        activeTab === 'pair' ? baccaratData.pairBets : 
                        activeTab === 'side' ? baccaratData.sideBets : allData).map((entry, index) => {
                          let color = COLORS.not_recommended;
                          if (entry.edge < 2) color = COLORS.recommended;
                          else if (entry.edge < 5) color = COLORS.caution;
                          return <Cell key={`cell-${index}`} fill={color} />;
                        })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 策略卡片网格 */}
        <section id="strategy" className="space-y-6">
          <h2 className="text-2xl font-bold tracking-tight">详细数据卡片</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allData.map((item, index) => (
              <Card key={index} className="group hover:shadow-md transition-all duration-300 border-border/50 hover:border-primary/20">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-bold">{item.name}</CardTitle>
                    <Badge variant="outline" className={`
                      ${item.edge < 2 ? "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20" : 
                        item.edge < 5 ? "bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/20" : 
                        "bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/20"}
                    `}>
                      {item.edge}% 优势
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">赔率 {item.payout}</span>
                    {item.probability !== "----" && (
                      <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">概率 {item.probability}</span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 min-h-[40px]">{item.description}</p>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    {RECOMMENDATION_ICONS[item.recommendation as keyof typeof RECOMMENDATION_ICONS]}
                    <span className={`
                      ${item.recommendation.includes('not') ? "text-[var(--danger)]" : 
                        item.recommendation === 'caution' ? "text-[var(--warning)]" : "text-[var(--success)]"}
                    `}>
                      {RECOMMENDATION_LABELS[item.recommendation as keyof typeof RECOMMENDATION_LABELS]}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* 模拟投注区域 */}
        <section id="simulation" className="py-8">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-card-foreground">模拟投注</CardTitle>
            <CardDescription className="text-muted-foreground">
              基于马丁格尔倍投策略的百家乐模拟投注，了解长期盈亏情况
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 设置面板 */}
            <div className="space-y-4">
              <div>
                <Label className="text-card-foreground">选择模拟局数</Label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-2">
                  {[100, 500, 1000, 5000, 10000].map((rounds) => (
                    <Button
                      key={rounds}
                      variant={selectedRounds === rounds ? "default" : "outline"}
                      onClick={() => setSelectedRounds(rounds)}
                      className="text-xs sm:text-sm"
                    >
                      {rounds >= 1000000 ? `${rounds / 1000000}M` : rounds >= 1000 ? `${rounds / 1000}K` : rounds}局
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="capital" className="text-card-foreground">带入资金（元）</Label>
                <Input
                  id="capital"
                  type="number"
                  min="1000"
                  max="10000000"
                  value={initialCapital}
                  onChange={(e) => setInitialCapital(e.target.value)}
                  placeholder="输入1000-10000000"
                  className="mt-2 bg-background border-border text-foreground"
                />
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-2">
                  {[10000, 50000, 100000, 200000, 500000, 1000000].map((amount) => (
                    <Button
                      key={amount}
                      variant={parseInt(initialCapital) === amount ? "default" : "outline"}
                      onClick={() => setInitialCapital(amount.toString())}
                      className="text-xs sm:text-sm"
                      size="sm"
                    >
                      {amount >= 10000 ? `${amount / 10000}万` : amount}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  最小1000元，最大1000万元
                </p>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <h4 className="font-semibold text-card-foreground mb-2">投注策略说明</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 基础投注：500元/局</li>
                  <li>• 倍投策略：输了翻倍，赢了重置</li>
                  <li>• 最大单注：200万元</li>
                  <li>• 下注方向：随机选择庄或闲</li>
                  <li>• 庄赢抽5%，闲赢不抽，和局退回</li>
                </ul>
              </div>

              <Button
                onClick={() => handleSimulate(false)}
                disabled={isSimulating || !initialCapital || parseInt(initialCapital) < 1000 || parseInt(initialCapital) > 10000000}
                className="w-full"
                size="lg"
              >
                {isSimulating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    模拟中...
                  </>
                ) : (
                  "开始模拟"
                )}
              </Button>

              {/* 进度条 */}
              {isSimulating && (
                <div className="space-y-2">
                  <div className="relative w-full h-12 bg-muted rounded-full overflow-hidden border-2 border-primary/30">
                    {/* 进度条背景 */}
                    <div 
                      className="absolute inset-0 bg-gradient-to-r from-primary/50 to-primary transition-all duration-300 ease-out"
                      style={{ width: `${simulationProgress}%` }}
                    />
                    
                    {/* 筹码图标 */}
                    <div 
                      className="absolute top-1/2 -translate-y-1/2 transition-all duration-300 ease-out"
                      style={{ left: `calc(${simulationProgress}% - 20px)` }}
                    >
                      <div className="w-10 h-10 rounded-full bg-primary border-4 border-background shadow-lg flex items-center justify-center">
                        <span className="text-lg font-bold text-primary-foreground">¥</span>
                      </div>
                    </div>
                    
                    {/* 百分比文字 */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-bold text-foreground z-10">{Math.round(simulationProgress)}%</span>
                    </div>
                  </div>
                  <p className="text-center text-xs text-muted-foreground">正在模拟投注，请稍候...</p>
                </div>
              )}
            </div>

            {/* 统计结果 */}
            {simulationResult && (
              <div className="space-y-6 mt-8">
                <div className="border-t border-border pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-card-foreground">模拟结果</h3>
                    {simulationResult.finalBalance > 0 && (
                      <Button
                        onClick={() => handleSimulate(true)}
                        disabled={isSimulating}
                        variant="outline"
                        size="sm"
                      >
                        {isSimulating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            模拟中...
                          </>
                        ) : (
                          `继续投注 ${selectedRounds}局`
                        )}
                      </Button>
                    )}
                  </div>
                  
                  {/* 基本统计 */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    <div className="p-4 bg-muted/50 rounded-lg border border-border">
                      <div className="text-xs text-muted-foreground mb-1">初始资金</div>
                      <div className="text-lg font-bold text-card-foreground">¥{simulationResult.initialCapital.toLocaleString()}</div>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg border border-border">
                      <div className="text-xs text-muted-foreground mb-1">最终余额</div>
                      <div className="text-lg font-bold text-card-foreground">¥{simulationResult.finalBalance.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}</div>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg border border-border">
                      <div className="text-xs text-muted-foreground mb-1">盈亏金额</div>
                      <div className={`text-lg font-bold ${simulationResult.profitLoss >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                        {simulationResult.profitLoss >= 0 ? '+' : ''}¥{simulationResult.profitLoss.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg border border-border">
                      <div className="flex justify-between items-center mb-1">
                        <div className="text-xs text-muted-foreground">累计盈亏</div>
                        <div className={`text-xs font-bold ${simulationResult.profitLossRate >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                          {simulationResult.profitLossRate >= 0 ? '+' : ''}{simulationResult.profitLossRate.toFixed(2)}%
                        </div>
                      </div>
                      <div className={`text-lg font-bold text-right ${simulationResult.profitLoss >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                        {simulationResult.profitLoss >= 0 ? '+' : ''}¥{simulationResult.profitLoss.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>

                  {/* 总投注局数 */}
                  <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border-2 border-primary/30 mb-6">
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground mb-1">此次共投注</div>
                      <div className="text-4xl font-bold text-primary">{simulationResult.totalRounds}局</div>
                    </div>
                  </div>

                  {/* 投注金额统计 */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 bg-muted/50 rounded-lg border border-border">
                      <div className="text-xs text-muted-foreground mb-1">最小投注</div>
                      <div className="text-lg font-bold text-card-foreground">¥{simulationResult.minBet.toLocaleString('zh-CN')}</div>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg border border-border">
                      <div className="text-xs text-muted-foreground mb-1">最大投注</div>
                      <div className="text-lg font-bold text-card-foreground">¥{simulationResult.maxBetAmount.toLocaleString('zh-CN')}</div>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg border border-border">
                      <div className="text-xs text-muted-foreground mb-1">平均投注</div>
                      <div className="text-lg font-bold text-card-foreground">¥{simulationResult.avgBet.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}</div>
                    </div>
                  </div>

                  {/* 总投注统计 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div className="p-4 bg-muted/50 rounded-lg border border-border">
                      <div className="text-xs text-muted-foreground mb-1">总投注金额</div>
                      <div className="text-lg font-bold text-card-foreground">¥{simulationResult.totalBetAmount.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}</div>
                      <div className="text-xs text-primary mt-1">流水倍数 {simulationResult.turnoverMultiple.toFixed(2)}x</div>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg border border-border">
                      <div className="text-xs text-muted-foreground mb-1">平均每局盈亏</div>
                      <div className={`text-lg font-bold ${simulationResult.avgProfitPerRound >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                        {simulationResult.avgProfitPerRound >= 0 ? '+' : ''}¥{simulationResult.avgProfitPerRound.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-xs text-primary mt-1">期望亏损 ¥-1.17 (偏差 {(simulationResult.avgProfitPerRound + 1.17).toFixed(2)})</div>
                    </div>
                  </div>

                  {/* 资金波动统计 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
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

                  {/* 开奖统计 */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 bg-muted/50 rounded-lg border border-border">
                      <div className="text-sm text-muted-foreground mb-2">开庄统计</div>
                      <div className="text-2xl font-bold text-card-foreground mb-1">{simulationResult.bankerCount}局</div>
                      <div className="text-xs text-muted-foreground mb-1">实际占比 {simulationResult.bankerRate.toFixed(2)}%</div>
                      <div className="text-xs text-primary">期望值 45.86% (偏差 {(simulationResult.bankerRate - 45.86).toFixed(2)}%)</div>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg border border-border">
                      <div className="text-sm text-muted-foreground mb-2">开闲统计</div>
                      <div className="text-2xl font-bold text-card-foreground mb-1">{simulationResult.playerCount}局</div>
                      <div className="text-xs text-muted-foreground mb-1">实际占比 {simulationResult.playerRate.toFixed(2)}%</div>
                      <div className="text-xs text-primary">期望值 44.62% (偏差 {(simulationResult.playerRate - 44.62).toFixed(2)}%)</div>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg border border-border">
                      <div className="text-sm text-muted-foreground mb-2">开和统计</div>
                      <div className="text-2xl font-bold text-card-foreground mb-1">{simulationResult.tieCount}局</div>
                      <div className="text-xs text-muted-foreground mb-1">实际占比 {simulationResult.tieRate.toFixed(2)}%</div>
                      <div className="text-xs text-primary">期望值 9.52% (偏差 {(simulationResult.tieRate - 9.52).toFixed(2)}%)</div>
                    </div>
                  </div>

                  {/* 连赢连输统计 */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    <div className="p-4 bg-muted/50 rounded-lg border border-border">
                      <div className="text-xs text-muted-foreground mb-1">庄最长连赢</div>
                      <div className="text-xl font-bold text-red-500">{simulationResult.bankerMaxWinStreak}局</div>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg border border-border">
                      <div className="text-xs text-muted-foreground mb-1">庄最长连输</div>
                      <div className="text-xl font-bold text-green-500">{simulationResult.bankerMaxLoseStreak}局</div>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg border border-border">
                      <div className="text-xs text-muted-foreground mb-1">闲最长连赢</div>
                      <div className="text-xl font-bold text-red-500">{simulationResult.playerMaxWinStreak}局</div>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg border border-border">
                      <div className="text-xs text-muted-foreground mb-1">闲最长连输</div>
                      <div className="text-xl font-bold text-green-500">{simulationResult.playerMaxLoseStreak}局</div>
                    </div>
                  </div>

                  {/* 玩家连赢连输统计 */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 bg-muted/50 rounded-lg border border-border">
                      <div className="text-xs text-muted-foreground mb-1">玩家最长连赢</div>
                      <div className="text-xl font-bold text-red-500">{simulationResult.betMaxWinStreak}局</div>
                      <div className="text-xs text-muted-foreground mt-1">（庄闲都算赢，和局不算断）</div>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg border border-border">
                      <div className="text-xs text-muted-foreground mb-1">玩家最长连输</div>
                      <div className="text-xl font-bold text-green-500">{simulationResult.betMaxLoseStreak}局</div>
                      <div className="text-xs text-muted-foreground mt-1">（和局不算断）</div>
                    </div>
                  </div>

                  {/* 资金曲线图 */}
                  <div className="p-4 bg-muted/50 rounded-lg border border-border">
                    <h4 className="font-semibold text-card-foreground mb-4">资金变化趋势</h4>
                    {(() => {
                      const balanceData = simulationResult.balanceHistory.map((balance, index) => ({ round: index, balance }));
                      const maxBalance = Math.max(...balanceData.map(d => d.balance));
                      const maxIndex = balanceData.findIndex(d => d.balance === maxBalance);
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
                                  <linearGradient id="gradient-balance" x1="0" y1="0" x2="0" y2="1">
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
                                  fill="url(#gradient-balance)"
                                />
                                {/* 最高点标记 */}
                                {maxIndex >= 0 && (
                                  <line 
                                    x1={`${(maxIndex / (balanceData.length - 1)) * 100}%`} 
                                    y1="0" 
                                    x2={`${(maxIndex / (balanceData.length - 1)) * 100}%`} 
                                    y2="100%" 
                                    stroke="var(--success)" 
                                    strokeDasharray="5 5" 
                                    opacity={0.5}
                                  />
                                )}
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
                              <th className="text-left py-2 px-2 text-muted-foreground">开奖</th>
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
                                  <Badge variant={round.outcome === 'banker' ? 'default' : round.outcome === 'player' ? 'secondary' : 'outline'}>
                                    {round.outcome === 'banker' ? '庄' : round.outcome === 'player' ? '闲' : '和'}
                                  </Badge>
                                </td>
                                <td className="py-2 px-2">
                                  <Badge variant={round.betOn === 'banker' ? 'default' : 'secondary'}>
                                    {round.betOn === 'banker' ? '庄' : '闲'}
                                  </Badge>
                                </td>
                                <td className="py-2 px-2 text-right text-card-foreground">¥{round.betAmount.toLocaleString()}</td>
                                <td className={`py-2 px-2 text-right font-medium ${round.winAmount > round.betAmount ? 'text-green-500' : round.winAmount === round.betAmount ? 'text-yellow-500' : 'text-red-500'}`}>
                                  ¥{round.winAmount.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}
                                </td>
                                <td className="py-2 px-2 text-right text-card-foreground">¥{round.balance.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        </section>

        <footer className="border-t border-border pt-8 pb-12 text-center text-sm text-muted-foreground">
          <img src="/logo.png" alt="数金研投 Logo" className="w-10 h-10 rounded-lg shadow-[0_0_10px_rgba(var(--primary),0.3)] mx-auto mb-4" />
          <p className="font-medium">© 2026 数金研投 | 专业百家乐数据分析</p>
          <p className="mt-2 text-xs">赌博有风险，请理性娱乐。本站仅供数据分析参考。</p>
        </footer>
      </main>
      <ScrollToTop />
    </div>
  );

  function handleSimulate(isContinue: boolean = false) {
    const capital = parseInt(initialCapital);
    if (!isContinue && (capital < 1000 || capital > 10000000)) {
      return;
    }

    setIsSimulating(true);
    if (!isContinue) {
      setSimulationResult(null);
      setSimulationRounds([]);
    }
    setSimulationProgress(0);

    // 模拟进度条，平均等待2-3秒
    const totalDuration = 2000 + Math.random() * 1000; // 2-3秒
    const updateInterval = 50; // 每50ms更新一次
    const steps = totalDuration / updateInterval;
    let currentStep = 0;

    const progressInterval = setInterval(() => {
      currentStep++;
      const progress = Math.min((currentStep / steps) * 100, 99);
      setSimulationProgress(progress);

      if (currentStep >= steps) {
        clearInterval(progressInterval);
      }
    }, updateInterval);

    // 在进度条完成后执行模拟
    setTimeout(() => {
      const startingCapital = isContinue && simulationResult ? simulationResult.finalBalance : capital;
      const result = runSimulation({
        rounds: selectedRounds,
        initialCapital: startingCapital,
        basebet: 500,
        maxBet: 2000000,
      });
      
      setSimulationProgress(100);
      setTimeout(() => {
        if (isContinue && simulationResult) {
          // 继续投注：合并数据
          const roundNumber = simulationRounds.length + 1;
          setSimulationRounds(prev => [...prev, { roundNumber, stats: result }]);
          
          // 合并统计数据
          const mergedResult: SimulationStats = {
            ...result,
            initialCapital: parseInt(initialCapital),
            totalRounds: simulationResult.totalRounds + result.totalRounds,
            bankerCount: simulationResult.bankerCount + result.bankerCount,
            playerCount: simulationResult.playerCount + result.playerCount,
            tieCount: simulationResult.tieCount + result.tieCount,
            bankerRate: ((simulationResult.bankerCount + result.bankerCount) / (simulationResult.totalRounds + result.totalRounds)) * 100,
            playerRate: ((simulationResult.playerCount + result.playerCount) / (simulationResult.totalRounds + result.totalRounds)) * 100,
            tieRate: ((simulationResult.tieCount + result.tieCount) / (simulationResult.totalRounds + result.totalRounds)) * 100,
            balanceHistory: [...simulationResult.balanceHistory, ...result.balanceHistory],
            history: [...simulationResult.history, ...result.history].slice(-100),
            minBet: Math.min(simulationResult.minBet, result.minBet),
            maxBetAmount: Math.max(simulationResult.maxBetAmount, result.maxBetAmount),
            avgBet: ((simulationResult.avgBet * simulationResult.totalRounds + result.avgBet * result.totalRounds) / (simulationResult.totalRounds + result.totalRounds)),
            totalBetAmount: simulationResult.totalBetAmount + result.totalBetAmount,
            turnoverMultiple: (simulationResult.totalBetAmount + result.totalBetAmount) / parseInt(initialCapital),
            avgProfitPerRound: (result.finalBalance - parseInt(initialCapital)) / (simulationResult.totalRounds + result.totalRounds),
            minBalance: Math.min(simulationResult.minBalance, result.minBalance),
            maxBalance: Math.max(simulationResult.maxBalance, result.maxBalance),
            bankerMaxWinStreak: Math.max(simulationResult.bankerMaxWinStreak, result.bankerMaxWinStreak),
            bankerMaxLoseStreak: Math.max(simulationResult.bankerMaxLoseStreak, result.bankerMaxLoseStreak),
            playerMaxWinStreak: Math.max(simulationResult.playerMaxWinStreak, result.playerMaxWinStreak),
            playerMaxLoseStreak: Math.max(simulationResult.playerMaxLoseStreak, result.playerMaxLoseStreak),
          };
          setSimulationResult(mergedResult);
        } else {
          // 首次模拟
          setSimulationRounds([{ roundNumber: 1, stats: result }]);
          setSimulationResult(result);
        }
        setIsSimulating(false);
        setSimulationProgress(0);
      }, 200);
    }, totalDuration);
  }
}
