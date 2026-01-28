import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, ArrowRight, ArrowLeft, X, Loader2, Calendar, CheckCircle2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { TypewriterLines } from "./TypewriterText";

interface GridTradingBacktestProps {
  symbol: string;
}

export function GridTradingBacktest({ symbol }: GridTradingBacktestProps) {
  const [step, setStep] = useState<number>(0); // 0: 未开始, 1: 参数设置, 2: 策略说明, 3: 回测结果
  const [priceMin, setPriceMin] = useState<string>("10000");
  const [priceMax, setPriceMax] = useState<string>("100000");
  const [gridCount, setGridCount] = useState<string>("200");
  const [investment, setInvestment] = useState<string>("100000");
  const [tradeType, setTradeType] = useState<"spot" | "contract">("spot");
  const [leverage, setLeverage] = useState<number>(1);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [backtestResult, setBacktestResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progressData, setProgressData] = useState<any>(null);
  const [showDosResult, setShowDosResult] = useState<boolean>(false);
  
  // 动态显示相关状态
  const [displayedDayIndex, setDisplayedDayIndex] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // tRPC mutation and query
  const backtestMutation = trpc.gridTrading.backtest.useMutation();
  const clearProgressMutation = trpc.gridTrading.clearProgress.useMutation();
  const progressQuery = trpc.gridTrading.getProgress.useQuery(
    { symbol },
    { 
      enabled: isLoading,
      refetchInterval: isLoading ? 1000 : false, // 每1秒轮询一次，避免过于频繁
    }
  );

  // 监听进度更新
  useEffect(() => {
    if (progressQuery.data?.data) {
      setProgressData(progressQuery.data.data);
      
      // 如果回测失败，显示错误
      if (progressQuery.data.data.status === 'failed') {
        setIsLoading(false);
        setIsAnimating(false);
        setProgressData({
          ...progressQuery.data.data,
          errorMessage: progressQuery.data.data.error || '回测失败'
        });
      }
      
      // 如果回测完成，开始动画显示
      if (progressQuery.data.data.status === 'completed' && !isAnimating && !showDosResult) {
        setIsLoading(false);
        // 稍微延迟一下再开始动画，确保所有数据都已经准备好
        setTimeout(() => {
          startDailyAnimation(progressQuery.data.data);
        }, 300);
      }
    }
  }, [progressQuery.data]);

  // 开始逐天动画显示
  const startDailyAnimation = (progress: any) => {
    if (!progress.dailyData || progress.dailyData.length === 0) {
      // 没有每日数据，直接显示最终结果
      setBacktestResult(progress.finalResult);
      setShowDosResult(true);
      return;
    }

    setIsAnimating(true);
    setDisplayedDayIndex(0);
    
    // 每0.5秒显示一天的数据
    let currentIndex = 0;
    animationTimerRef.current = setInterval(() => {
      currentIndex++;
      setDisplayedDayIndex(currentIndex);
      
      // 显示完所有天数后，停止动画并显示最终结果
      if (currentIndex >= progress.dailyData.length) {
        if (animationTimerRef.current) {
          clearInterval(animationTimerRef.current);
        }
        setIsAnimating(false);
        setBacktestResult(progress.finalResult);
        setShowDosResult(true);
      }
    }, 500); // 每0.5秒更新一次
  };

  // 清理动画定时器
  useEffect(() => {
    return () => {
      if (animationTimerRef.current) {
        clearInterval(animationTimerRef.current);
      }
    };
  }, []);

  // 获取当前显示的数据（动画过程中）
  const getCurrentDisplayData = () => {
    if (!progressData?.dailyData || displayedDayIndex === 0) {
      return null;
    }
    
    const currentDay = progressData.dailyData[Math.min(displayedDayIndex - 1, progressData.dailyData.length - 1)];
    return currentDay;
  };

  // 快捷日期选择
  const setQuickDateRange = (range: string) => {
    const today = new Date();
    const end = today.toISOString().split('T')[0];
    let start = '';
    
    switch(range) {
      case '1month':
        start = new Date(today.setMonth(today.getMonth() - 1)).toISOString().split('T')[0];
        break;
      case '3months':
        start = new Date(today.setMonth(today.getMonth() - 3)).toISOString().split('T')[0];
        break;
      case '6months':
        start = new Date(today.setMonth(today.getMonth() - 6)).toISOString().split('T')[0];
        break;
      case '1year':
        start = new Date(today.setFullYear(today.getFullYear() - 1)).toISOString().split('T')[0];
        break;
      case '2024':
        start = '2024-01-01';
        setEndDate('2024-12-31');
        setStartDate(start);
        return;
    }
    
    setStartDate(start);
    setEndDate(end);
  };

  // 计算选择的天数
  const getDaysDiff = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  // 重置所有参数
  const resetParams = () => {
    setPriceMin("10000");
    setPriceMax("100000");
    setGridCount("200");
    setInvestment("100000");
    setTradeType("spot");
    setLeverage(1);
    setStartDate("");
    setEndDate("");
    setBacktestResult(null);
    setProgressData(null);
    setShowDosResult(false);
    setDisplayedDayIndex(0);
    setIsAnimating(false);
    if (animationTimerRef.current) {
      clearInterval(animationTimerRef.current);
    }
    setStep(1); // 改为返回参数设置页面，而不是初始页面
  };

  // 验证参数
  const validateParams = () => {
    const min = parseFloat(priceMin);
    const max = parseFloat(priceMax);
    const grid = parseInt(gridCount);
    const invest = parseFloat(investment);

    if (isNaN(min) || min <= 0) return "最低价必须大于0";
    if (isNaN(max) || max <= 0) return "最高价必须大于0";
    if (min >= max) return "最低价必须小于最高价";
    if (isNaN(grid) || grid < 2 || grid > 200) return "网格数量必须在2-200之间";
    if (isNaN(invest) || invest < 100) return "投资金额至少100 USDT";
    if (!startDate || !endDate) return "请选择回测时间范围";
    if (new Date(startDate) >= new Date(endDate)) return "开始日期必须早于结束日期";

    return null;
  };

  // 如果未开始，显示启动按钮
  if (step === 0) {
    return (
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            网格交易回测
          </CardTitle>
          <CardDescription>
            基于历史数据模拟网格交易策略，分析收益表现
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => setStep(1)}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            size="lg"
          >
            开始回测
          </Button>
        </CardContent>
      </Card>
    );
  }

  // 第1步：参数设置
  if (step === 1) {
    const error = validateParams();
    const daysDiff = getDaysDiff();
    
    return (
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            onClick={resetParams}
          >
            <X className="w-4 h-4" />
          </Button>
          <CardTitle>设置参数</CardTitle>
          <CardDescription>配置网格交易策略的关键参数</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 价格区间 */}
          <div className="space-y-3">
            <Label className="text-base">价格区间</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Input
                  type="number"
                  placeholder="最低价"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Input
                  type="number"
                  placeholder="最高价"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  className="bg-background/50"
                />
              </div>
            </div>
          </div>

          {/* 网格数量 */}
          <div className="space-y-3">
            <Label className="text-base">网格数量</Label>
            <Input
              type="number"
              placeholder="2-200"
              value={gridCount}
              onChange={(e) => setGridCount(e.target.value)}
              className="bg-background/50"
            />
          </div>

          {/* 投资金额 */}
          <div className="space-y-3">
            <Label className="text-base">投资金额 (USDT)</Label>
            <Input
              type="number"
              placeholder="至少 100 USDT"
              value={investment}
              onChange={(e) => setInvestment(e.target.value)}
              className="bg-background/50"
            />
          </div>

          {/* 交易类型 */}
          <div className="space-y-3">
            <Label className="text-base">交易类型</Label>
            <RadioGroup value={tradeType} onValueChange={(v) => setTradeType(v as "spot" | "contract")}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="spot" id="spot" />
                <Label htmlFor="spot" className="cursor-pointer">现货网格</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="contract" id="contract" />
                <Label htmlFor="contract" className="cursor-pointer">合约网格</Label>
              </div>
            </RadioGroup>
          </div>

          {/* 回测时间范围 */}
          <div className="space-y-3">
            <Label className="text-base">回测时间范围</Label>
            
            {/* 快捷选择按钮 */}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQuickDateRange('1month')}
                className="text-xs"
              >
                近1个月
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQuickDateRange('3months')}
                className="text-xs"
              >
                近3个月
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQuickDateRange('6months')}
                className="text-xs"
              >
                近6个月
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQuickDateRange('1year')}
                className="text-xs"
              >
                近1年
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQuickDateRange('2024')}
                className="text-xs"
              >
                2024全年
              </Button>
            </div>
            
            {/* 日期选择器 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm">开始日期</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">结束日期</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-background/50"
                />
              </div>
            </div>
            
            {/* 显示选择的天数 */}
            {daysDiff > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>已选择 {daysDiff} 天</span>
              </div>
            )}
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
              {error}
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-3">
            <Button
              onClick={resetParams}
              variant="outline"
              className="flex-1"
              size="lg"
            >
              重置
            </Button>
            <Button
              onClick={() => setStep(2)}
              disabled={!!error}
              className="flex-1 bg-primary hover:bg-primary/90"
              size="lg"
            >
              下一步
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 第2步：策略说明和回测执行
  if (step === 2) {
    const currentDisplayData = getCurrentDisplayData();
    
    return (
      <Card className="border-primary/20 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle>网格交易回测</CardTitle>
          <CardDescription>
            {symbol} 现货网格 · {startDate} 至 {endDate}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 回测结果或进度 */}
          <div className="space-y-4">
            {showDosResult && backtestResult ? (
              // 显示最终结果
              <div className="space-y-4">
                <TypewriterLines
                  lines={[
                    `回测完成！共分析 ${backtestResult.dataCount || 0} 条K线数据`,
                    `回测时长：${getDaysDiff()} 天`,
                  ]}
                  delay={50}
                />

                {backtestResult && (
                  <div className="space-y-2 bg-background/30 rounded-lg p-4 border border-border/50">
                    {/* 初始资金 */}
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-muted-foreground">初始资金</span>
                      <span className="font-medium">{parseFloat(investment).toFixed(2)} USDT</span>
                    </div>

                    {/* 最终余额 */}
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-muted-foreground">最终余额</span>
                      <span className="font-medium">{backtestResult.finalBalance.toFixed(2)} USDT</span>
                    </div>

                    {/* 总收益 */}
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-muted-foreground">总收益</span>
                      <span className={`font-bold text-lg ${
                        backtestResult.totalProfit >= 0 ? 'text-red-500' : 'text-green-500'
                      }`}>
                        {backtestResult.totalProfit >= 0 ? '+' : ''}{backtestResult.totalProfit.toFixed(2)} USDT
                      </span>
                    </div>

                    {/* 收益率 */}
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-muted-foreground">收益率</span>
                      <span className={`font-bold text-lg ${
                        backtestResult.profitRate >= 0 ? 'text-red-500' : 'text-green-500'
                      }`}>
                        {backtestResult.profitRate >= 0 ? '+' : ''}{backtestResult.profitRate.toFixed(2)}%
                      </span>
                    </div>

                    {/* 年化收益率 */}
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-muted-foreground">年化收益率</span>
                      <span className="font-medium">{backtestResult.annualizedReturn.toFixed(2)}%</span>
                    </div>

                    {/* 网格触发次数（套利次数） */}
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-muted-foreground">网格触发次数</span>
                      <span className="font-medium">{backtestResult.arbitrageTimes} 次</span>
                    </div>

                    {/* 日均套利 */}
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-muted-foreground">日均套利</span>
                      <span className="font-medium">{backtestResult.dailyArbitrageTimes.toFixed(2)} 次/天</span>
                    </div>

                    {/* 网格利润 */}
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-muted-foreground">网格利润</span>
                      <span className="font-medium">{backtestResult.gridProfit.toFixed(2)} USDT</span>
                    </div>

                    {/* 浮动盈亏 */}
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-muted-foreground">浮动盈亏</span>
                      <span className="font-medium">{backtestResult.unpairedProfit.toFixed(2)} USDT</span>
                    </div>

                    {/* 最大回撤 */}
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-muted-foreground">最大回撤</span>
                      <span className="font-medium text-red-500">
                        {backtestResult.maxDrawdown.toFixed(2)} USDT ({backtestResult.maxDrawdownRate.toFixed(2)}%)
                      </span>
                    </div>

                    {/* 资产范围 */}
                    <div className="flex justify-between items-center py-2">
                      <span className="text-muted-foreground">资产范围</span>
                      <span className="font-medium text-sm">
                        {backtestResult.minAsset.toFixed(2)} - {backtestResult.maxAsset.toFixed(2)} USDT
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : isAnimating && currentDisplayData ? (
              // 动画显示中：逐天显示累计数据
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">正在回测</p>
                  <p className="text-2xl font-bold text-primary">
                    {currentDisplayData.date}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    第 {displayedDayIndex} / {progressData.dailyData.length} 天
                  </p>
                </div>

                <div className="space-y-2 bg-background/30 rounded-lg p-4 border border-border/50">
                  {/* 当前余额 */}
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-muted-foreground">当前余额</span>
                    <span className="font-bold text-lg">{currentDisplayData.balance.toFixed(2)} USDT</span>
                  </div>

                  {/* 累计收益 */}
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-muted-foreground">累计收益</span>
                    <span className={`font-bold text-lg ${
                      currentDisplayData.totalProfit >= 0 ? 'text-red-500' : 'text-green-500'
                    }`}>
                      {currentDisplayData.totalProfit >= 0 ? '+' : ''}{currentDisplayData.totalProfit.toFixed(2)} USDT
                    </span>
                  </div>

                  {/* 套利次数 */}
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-muted-foreground">套利次数</span>
                    <span className="font-medium">{currentDisplayData.gridTriggers} 次</span>
                  </div>

                  {/* 浮动盈亏 */}
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-muted-foreground">浮动盈亏</span>
                    <span className="font-medium">{currentDisplayData.floatingProfit.toFixed(2)} USDT</span>
                  </div>

                  {/* 最大回撤 */}
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">最大回撤</span>
                    <span className="font-medium text-red-500">
                      {currentDisplayData.maxDrawdown.toFixed(2)} USDT
                    </span>
                  </div>
                </div>

                <Progress value={(displayedDayIndex / progressData.dailyData.length) * 100} className="h-2" />
              </div>
            ) : (isLoading || progressData?.status === 'running') ? (
              // 回测中：显示实时进度
              <div className="relative h-48 flex flex-col items-center justify-center space-y-4">
                {progressData ? (
                  <>
                    {/* 当前回测日期 */}
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-2">正在计算回测数据</p>
                      <p className="text-2xl font-bold text-primary">
                        {progressData.currentDate || '准备中...'}
                      </p>
                    </div>

                    {/* 进度条 */}
                    <div className="w-full space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {progressData.processedDays} / {progressData.totalDays} 天
                        </span>
                        <span className="text-primary font-medium">
                          {Math.round(progressData.progress)}%
                        </span>
                      </div>
                      <Progress value={progressData.progress} className="h-2" />
                    </div>

                    {/* 当前盈亏 */}
                    {progressData.currentProfit !== undefined && (
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">当前盈亏</p>
                        <p className={`text-lg font-bold ${progressData.currentProfit >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                          {progressData.currentProfit >= 0 ? '+' : ''}{progressData.currentProfit.toFixed(2)} USDT
                        </p>
                      </div>
                    )}

                    {/* 错误信息 */}
                    {progressData.errorMessage && (
                      <div className="text-center text-red-500">
                        <p className="text-sm">{progressData.errorMessage}</p>
                      </div>
                    )}
                  </>
                ) : (
                  // 等待进度数据
                  <div className="text-center">
                    <Loader2 className="w-12 h-12 mx-auto mb-2 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">正在初始化回测...</p>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* 策略说明 */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base">低买高卖，循环套利，赚取网格利润。</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• 当价格下跌至一个网格买单价格时，策略执行买入。</p>
              <p>• 当价格上涨至一个网格卖单价格时，策略执行卖出。</p>
              <p>• 在震荡行情中，策略会持续低买高卖，赚取价差收益。</p>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3">
            <Button
              onClick={() => setStep(1)}
              variant="outline"
              className="flex-1 border-primary/50"
              size="lg"
              disabled={isLoading || isAnimating}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回修改
            </Button>
            <Button
              onClick={async () => {
                // 清理之前的状态
                setIsLoading(true);
                setShowDosResult(false);
                setBacktestResult(null);
                setProgressData(null);
                setDisplayedDayIndex(0);
                setIsAnimating(false);
                if (animationTimerRef.current) {
                  clearInterval(animationTimerRef.current);
                }
                
                try {
                  // 先清除之前的进度数据
                  await clearProgressMutation.mutateAsync({ symbol });
                  
                  // 等待一下确保清除完成
                  await new Promise(resolve => setTimeout(resolve, 100));
                  
                  // 然后开始新的回测
                  const result = await backtestMutation.mutateAsync({
                    symbol,
                    minPrice: parseFloat(priceMin),
                    maxPrice: parseFloat(priceMax),
                    gridCount: parseInt(gridCount),
                    investment: parseFloat(investment),
                    type: tradeType,
                    leverage,
                    startDate,
                    endDate,
                  });
                  // 不在这里设置结果，等待动画完成后再设置
                } catch (error: any) {
                  setIsLoading(false);
                  setProgressData({
                    status: 'failed',
                    errorMessage: error.message || "回测失败，请重试"
                  });
                }
              }}
              disabled={isLoading || isAnimating || showDosResult}
              className="flex-1 bg-[#c3ff00] hover:bg-[#b0e600] text-black font-semibold"
              size="lg"
            >
              {isLoading || isAnimating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isAnimating ? '动画显示中...' : '回测中...'}
                </>
              ) : showDosResult ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  回测完成
                </>
              ) : (
                <>
                  开始回测
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>

          {/* 重新回测按钮（仅在显示DOS结果时显示） */}
          {showDosResult && (
            <Button
              onClick={() => {
                setShowDosResult(false);
                setBacktestResult(null);
                setProgressData(null);
                setDisplayedDayIndex(0);
                setIsAnimating(false);
                if (animationTimerRef.current) {
                  clearInterval(animationTimerRef.current);
                }
              }}
              variant="outline"
              className="w-full border-primary/50"
              size="lg"
            >
              重新回测
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return null;
}
