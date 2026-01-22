import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { ArrowLeft, BarChart3, Sparkles, TrendingUp, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { FactorSelector } from "@/components/FactorSelector";
import { FactorType, FactorConfig } from "@shared/factors";

export default function CryptoAnalysis() {
  const { isAuthenticated } = useAuth();
  const [tradingPair, setTradingPair] = useState("BTC-USDT");
  const [timeframe, setTimeframe] = useState("1H");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [initialCapital, setInitialCapital] = useState(10000);
  
  // 因子配置（默认选中MA因子）
  const [selectedFactors, setSelectedFactors] = useState<FactorConfig[]>([
    {
      type: FactorType.MA,
      enabled: true,
      parameters: {
        shortPeriod: 10,
        longPeriod: 30,
      },
    },
  ]);

  // Fetch current price
  const { data: ticker } = trpc.market.ticker.useQuery(
    { instId: tradingPair },
    { refetchInterval: 5000 }
  );

  // Run backtest mutation
  const runBacktest = trpc.backtest.run.useMutation({
    onSuccess: () => {
      toast.success("回测完成！查看结果页面了解详情。");
    },
    onError: (error: any) => {
      toast.error(`回测失败: ${error?.message || '未知错误'}`);
    },
  });

  // Set default dates (last 30 days)
  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(end.toISOString().split("T")[0]);
  }, []);

  const handleRunBacktest = () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }

    // 验证是否选择了因子
    const enabledFactors = selectedFactors.filter(f => f.enabled);
    if (enabledFactors.length === 0) {
      toast.error("请至少选择一个因子");
      return;
    }

    const startTimestamp = new Date(startDate).getTime();
    const endTimestamp = new Date(endDate).getTime();

    runBacktest.mutate({
      tradingPair,
      timeframe,
      startDate: startTimestamp,
      endDate: endTimestamp,
      initialCapital,
      parameters: JSON.stringify({
        factors: selectedFactors,
      }),
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 导航栏 - 紧凑设计 */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="icon" className="hover:bg-accent/20 h-9 w-9">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-lg font-bold text-center flex-1 flex items-center justify-center gap-2">
            <BarChart3 className="w-5 h-5 text-accent" />
            <span className="hidden sm:inline">量化交易计算机</span>
            <span className="sm:hidden">量化交易</span>
          </h1>
          <div className="w-9" />
        </div>
      </header>

      {/* 主内容 */}
      <main className="container mx-auto px-4 py-6 max-w-6xl">
        {/* 页面标题 - 移动端优化 */}
        <section className="space-y-2 text-center mb-6">
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight flex items-center justify-center gap-2">
            <Sparkles className="w-6 h-6 sm:w-8 h-8 text-accent" />
            <span>量化交易计算机</span>
          </h2>
          <p className="text-sm sm:text-lg text-muted-foreground">
            专业的加密货币交易策略回测与模拟交易系统
          </p>
        </section>

        {/* 主要内容区域 - 移动端单列布局 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* 左侧：配置面板 */}
          <div className="lg:col-span-2 space-y-4">
            {/* 基础配置卡片 */}
            <Card className="border-accent/20 bg-card/50 backdrop-blur shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 sm:w-5 h-5 text-accent" />
                  回测配置
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  选择交易对、时间周期和初始资金
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* 交易对选择 */}
                <div className="space-y-1.5">
                  <Label htmlFor="trading-pair" className="text-xs sm:text-sm">交易对</Label>
                  <Select value={tradingPair} onValueChange={setTradingPair}>
                    <SelectTrigger id="trading-pair" className="bg-background/50 h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BTC-USDT">BTC-USDT (比特币)</SelectItem>
                      <SelectItem value="ETH-USDT">ETH-USDT (以太坊)</SelectItem>
                      <SelectItem value="SOL-USDT">SOL-USDT (Solana)</SelectItem>
                      <SelectItem value="XRP-USDT">XRP-USDT (瑞波)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 时间周期 */}
                <div className="space-y-1.5">
                  <Label htmlFor="timeframe" className="text-xs sm:text-sm">时间周期</Label>
                  <Select value={timeframe} onValueChange={setTimeframe}>
                    <SelectTrigger id="timeframe" className="bg-background/50 h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15M">15分钟</SelectItem>
                      <SelectItem value="1H">1小时</SelectItem>
                      <SelectItem value="4H">4小时</SelectItem>
                      <SelectItem value="1D">1天</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 日期范围 - 移动端单列 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="start-date" className="text-xs sm:text-sm">开始日期</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-background/50 h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="end-date" className="text-xs sm:text-sm">结束日期</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="bg-background/50 h-9 text-sm"
                    />
                  </div>
                </div>

                {/* 初始资金 */}
                <div className="space-y-1.5">
                  <Label htmlFor="initial-capital" className="text-xs sm:text-sm">初始资金 (USDT)</Label>
                  <Input
                    id="initial-capital"
                    type="number"
                    value={initialCapital}
                    onChange={(e) => setInitialCapital(Number(e.target.value))}
                    min={100}
                    step={1000}
                    className="bg-background/50 h-9 text-sm"
                  />
                </div>

                {/* 当前价格显示 - 紧凑 */}
                {ticker && (
                  <div className="p-3 bg-accent/10 rounded-lg border border-accent/20">
                    <p className="text-xs text-muted-foreground mb-1">当前价格</p>
                    <p className="text-xl sm:text-2xl font-bold text-accent">
                      ${parseFloat(ticker.last).toFixed(2)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 因子选择卡片 */}
            <Card className="border-primary/20 bg-card/50 backdrop-blur shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <Sparkles className="w-4 h-4 sm:w-5 h-5 text-primary" />
                  因子库
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  选择一个或多个因子构建您的量化策略
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FactorSelector
                  selectedFactors={selectedFactors}
                  onChange={setSelectedFactors}
                />
              </CardContent>
            </Card>
          </div>

          {/* 右侧：操作面板 - 移动端置顶 */}
          <div className="space-y-4 lg:order-last order-first">
            {/* 回测按钮 */}
            <Card className="border-accent/30 bg-gradient-to-br from-accent/20 to-accent/5 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg">开始回测</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  点击下方按钮开始历史回测
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={handleRunBacktest}
                  disabled={runBacktest.isPending || !isAuthenticated}
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold py-5 sm:py-6 text-sm sm:text-base"
                >
                  {runBacktest.isPending ? (
                    <>
                      <Sparkles className="w-4 h-4 sm:w-5 h-5 mr-2 animate-spin" />
                      回测中...
                    </>
                  ) : (
                    <>
                      <BarChart3 className="w-4 h-4 sm:w-5 h-5 mr-2" />
                      开始回测
                    </>
                  )}
                </Button>
                {!isAuthenticated && (
                  <Button
                    asChild
                    variant="outline"
                    className="w-full h-9 text-sm"
                  >
                    <a href={getLoginUrl()}>登录后回测</a>
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* 功能说明 - 移动端简化 */}
            <Card className="border-secondary/20 bg-card/30 backdrop-blur hidden sm:block">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">功能特性</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-xs">专业回测</p>
                    <p className="text-xs text-muted-foreground">
                      基于历史数据的策略表现评估
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-3.5 h-3.5 text-accent" />
                  </div>
                  <div>
                    <p className="font-semibold text-xs">多因子支持</p>
                    <p className="text-xs text-muted-foreground">
                      MA、MACD、RSI、BOLL、KDJ
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="w-3.5 h-3.5 text-secondary" />
                  </div>
                  <div>
                    <p className="font-semibold text-xs">详细分析</p>
                    <p className="text-xs text-muted-foreground">
                      收益率、最大回撤、夏普比率
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 周周赢产品卡片 */}
            <Card className="border-l-4 border-l-primary shadow-md overflow-hidden bg-gradient-to-br from-card to-secondary/30">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Zap className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-sm sm:text-base">周周赢</CardTitle>
                    <CardDescription className="text-xs">数字货币定期收益</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-muted rounded">
                    <p className="text-xs text-muted-foreground">年化</p>
                    <p className="font-bold text-primary text-sm">52%+</p>
                  </div>
                  <div className="p-2 bg-muted rounded">
                    <p className="text-xs text-muted-foreground">周期</p>
                    <p className="font-bold text-sm">1年</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full h-8 text-xs">
                  了解详情
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 底部说明 - 移动端简化 */}
        <Card className="border-border/50 bg-card/30 backdrop-blur mt-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">使用说明</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs sm:text-sm text-muted-foreground">
            <p>
              1. <strong>选择交易对</strong>：从下拉菜单中选择您想要回测的加密货币交易对
            </p>
            <p>
              2. <strong>配置参数</strong>：设置时间周期、日期范围和初始资金
            </p>
            <p>
              3. <strong>选择因子</strong>：勾选您想使用的技术指标因子，并调整其参数
            </p>
            <p>
              4. <strong>开始回测</strong>：点击"开始回测"按钮，系统将基于历史数据进行策略回测
            </p>
            <p>
              5. <strong>查看结果</strong>：回测完成后，您可以查看详细的收益分析和策略表现
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
