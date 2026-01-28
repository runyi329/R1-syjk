import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, ArrowRight, ArrowLeft, X, Loader2, Calendar, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
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
  const [startDate, setStartDate] = useState<string>("2025-12-01");
  const [endDate, setEndDate] = useState<string>("2025-12-15");
  const [backtestResult, setBacktestResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progressData, setProgressData] = useState<any>(null);
  const [showDosResult, setShowDosResult] = useState<boolean>(false);

  // tRPC mutation and query
  const backtestMutation = trpc.gridTrading.backtest.useMutation();
  const progressQuery = trpc.gridTrading.getProgress.useQuery(
    { symbol },
    { 
      enabled: isLoading,
      refetchInterval: isLoading ? 1000 : false, // 每秒轮询一次
    }
  );

  // 监听进度更新
  useEffect(() => {
    if (progressQuery.data?.data) {
      setProgressData(progressQuery.data.data);
      
      // 如果回测失败，显示错误（但不使用toast）
      if (progressQuery.data.data.status === 'failed') {
        setIsLoading(false);
        setProgressData({
          ...progressQuery.data.data,
          errorMessage: progressQuery.data.data.error || '回测失败'
        });
      }
    }
  }, [progressQuery.data]);

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
    setStartDate("2025-12-01");
    setEndDate("2025-12-15");
    setStep(0);
    setProgressData(null);
    setBacktestResult(null);
    setShowDosResult(false);
  };

  // 验证参数
  const validateParams = () => {
    if (!priceMin || !priceMax || !gridCount || !investment) {
      return "请填写所有必填参数";
    }
    if (!startDate || !endDate) {
      return "请选择回测时间范围";
    }
    const min = parseFloat(priceMin);
    const max = parseFloat(priceMax);
    const count = parseInt(gridCount);
    const invest = parseFloat(investment);

    if (isNaN(min) || isNaN(max) || isNaN(count) || isNaN(invest)) {
      return "请输入有效的数字";
    }
    if (min >= max) {
      return "最低价必须小于最高价";
    }
    if (count < 2 || count > 200) {
      return "网格数量必须在2-200之间";
    }
    if (invest < 100) {
      return "投资金额至少为100 USDT";
    }
    if (new Date(startDate) >= new Date(endDate)) {
      return "开始日期必须早于结束日期";
    }
    return null;
  };

  // 生成DOS命令行风格的结果文本
  const generateDosResultLines = () => {
    if (!backtestResult) return [];
    
    const {
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
      dataCount,
    } = backtestResult;

    const lines = [
      "========================================",
      "  网格交易回测系统 v1.0",
      "========================================",
      "",
      `> 回测日期范围: ${startDate} 至 ${endDate}`,
      `> 回测数据量: ${dataCount || 0} 条K线数据`,
      `> 初始投资: ${investment} USDT`,
      `> 价格区间: ${priceMin} - ${priceMax} USDT`,
      `> 网格数量: ${gridCount} 个`,
      "",
      "----------------------------------------",
      "  回测结果统计",
      "----------------------------------------",
      "",
      `最终余额: ${(parseFloat(investment) + totalProfit).toFixed(2)} USDT`,
      `总收益: ${totalProfit >= 0 ? '+' : ''}${totalProfit.toFixed(2)} USDT`,
      `收益率: ${profitRate >= 0 ? '+' : ''}${profitRate.toFixed(2)}%`,
      `年化收益率: ${annualizedReturn.toFixed(2)}%`,
      "",
      `网格利润: ${gridProfit.toFixed(2)} USDT`,
      `浮动盈亏: ${unpairedProfit.toFixed(2)} USDT`,
      "",
      `套利次数: ${arbitrageTimes} 次`,
      `日均套利: ${dailyArbitrageTimes.toFixed(2)} 次/天`,
      "",
      `最大回撤: ${maxDrawdown.toFixed(2)} USDT (${maxDrawdownRate.toFixed(2)}%)`,
      `资产最低值: ${minAsset.toFixed(2)} USDT`,
      `资产最高值: ${maxAsset.toFixed(2)} USDT`,
      "",
      "========================================",
      `  回测完成 - ${new Date().toLocaleString()}`,
      "========================================",
    ];

    return lines;
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

            {/* 自定义日期输入 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">开始日期</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min="2017-01-01"
                  max={endDate || "2026-12-31"}
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">结束日期</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || "2017-01-01"}
                  max="2026-12-31"
                  className="bg-background/50"
                />
              </div>
            </div>

            {/* 显示选择的天数 */}
            {daysDiff > 0 && (
              <p className="text-sm text-muted-foreground">
                已选择：{startDate} 至 {endDate}（共 {daysDiff} 天）
              </p>
            )}
          </div>

          {/* 杠杆倍数（仅合约网格） */}
          {tradeType === "contract" && (
            <div className="space-y-3">
              <Label className="text-base">杠杆倍数：{leverage}x</Label>
              <Slider
                value={[leverage]}
                onValueChange={(v) => setLeverage(v[0])}
                min={1}
                max={100}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1x</span>
                <span>50x</span>
                <span>100x</span>
              </div>
            </div>
          )}

          {/* 说明文字 */}
          <div className="text-sm text-muted-foreground space-y-2 bg-muted/50 p-4 rounded-lg">
            <p className="font-semibold">仅需设置 2 个参数，即可快速创建策略。</p>
            <div className="space-y-1">
              <p>• <span className="font-semibold">价格区间：</span>区间内自动帮您低买高卖，超出区间则策略暂停。</p>
              <p>• <span className="font-semibold">网格数量：</span>策略的挂单数量。数量越多，策略的买卖次数越多。</p>
            </div>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="text-sm text-red-500 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
              {error}
            </div>
          )}

          {/* 下一步按钮 */}
          <Button
            onClick={() => setStep(2)}
            disabled={!!error}
            className="w-full bg-[#c3ff00] hover:bg-[#b0e600] text-black font-semibold"
            size="lg"
          >
            下一步
          </Button>
        </CardContent>
      </Card>
    );
  }

  // 第2步：策略说明和回测执行
  if (step === 2) {
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
          <CardTitle>运行策略</CardTitle>
          <CardDescription>了解网格交易的运作原理</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 策略图表 / 实时进度 / DOS结果显示区域 */}
          <div className="bg-black/90 p-6 rounded-lg border border-primary/30">
            {!isLoading && !showDosResult ? (
              // 未开始回测：显示策略图表
              <div className="relative h-48 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <TrendingUp className="w-16 h-16 mx-auto mb-2 opacity-50" />
                  <p>策略图表展示</p>
                  <p className="text-xs mt-1">低买高卖，循环套利，赚取网格利润</p>
                </div>
              </div>
            ) : showDosResult ? (
              // 回测完成：显示回测结果报告
              <div className="relative min-h-[300px] text-foreground space-y-4 py-4">
                <div className="text-center mb-6">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-500" />
                  <h3 className="text-xl font-bold">回测完成</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {startDate} 至 {endDate}
                  </p>
                </div>

                {backtestResult && (
                  <div className="space-y-3 text-sm">
                    {/* 回测数据量 */}
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-muted-foreground">回测数据量</span>
                      <span className="font-medium">{backtestResult.dataCount || 0} 条K线</span>
                    </div>

                    {/* 最终余额 */}
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-muted-foreground">最终余额</span>
                      <span className="font-medium text-lg">
                        {(parseFloat(investment) + backtestResult.totalProfit).toFixed(2)} USDT
                      </span>
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
            ) : (
              // 回测中：显示实时进度
              <div className="relative min-h-[380px] flex flex-col items-center justify-center space-y-5 py-6">
                {progressData ? (
                  <>
                    {/* 进度标题 */}
                    <div className="text-center">
                      <Loader2 className="w-12 h-12 mx-auto mb-3 animate-spin text-primary" />
                      <h3 className="text-xl font-bold mb-2">正在回测...</h3>
                    </div>

                    {/* 当前回测日期 */}
                    <div className="text-center bg-primary/10 px-6 py-3 rounded-lg border border-primary/30 w-full">
                      <p className="text-xs text-muted-foreground mb-1">回测进程</p>
                      <div className="flex items-center gap-2 justify-center">
                        <Calendar className="w-4 h-4 text-primary" />
                        <p className="text-lg font-bold text-primary">
                          {progressData.currentDate || '初始化中...'}
                        </p>
                      </div>
                    </div>

                    {/* 天数统计 */}
                    <div className="w-full grid grid-cols-3 gap-3 text-center">
                      <div className="bg-muted/30 p-3 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">已回测</p>
                        <p className="text-xl font-bold text-primary">{progressData.processedDays}</p>
                        <p className="text-xs text-muted-foreground">天</p>
                      </div>
                      <div className="bg-muted/30 p-3 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">总天数</p>
                        <p className="text-xl font-bold">{progressData.totalDays}</p>
                        <p className="text-xs text-muted-foreground">天</p>
                      </div>
                      <div className="bg-muted/30 p-3 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">剩余</p>
                        <p className="text-xl font-bold text-orange-500">{progressData.totalDays - progressData.processedDays}</p>
                        <p className="text-xs text-muted-foreground">天</p>
                      </div>
                    </div>

                    {/* 进度条 */}
                    <div className="w-full space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          进度
                        </span>
                        <span className="text-primary font-medium">
                          {Math.round(progressData.progress)}%
                        </span>
                      </div>
                      <Progress value={progressData.progress} className="h-3" />
                    </div>

                    {/* 当前盈亏 */}
                    {progressData.currentProfit !== undefined && (
                      <div className="text-center bg-muted/20 px-6 py-3 rounded-lg border border-border/50 w-full">
                        <p className="text-xs text-muted-foreground mb-1">当前盈亏</p>
                        <p className={`text-2xl font-bold ${progressData.currentProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {progressData.currentProfit >= 0 ? '+' : ''}{progressData.currentProfit.toFixed(2)} USDT
                        </p>
                      </div>
                    )}

                    {/* 错误信息 */}
                    {progressData.errorMessage && (
                      <div className="text-center text-red-500 bg-red-500/10 px-4 py-3 rounded-lg border border-red-500/30 w-full">
                        <p className="text-sm font-medium">{progressData.errorMessage}</p>
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
            )}
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
              disabled={isLoading}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回修改
            </Button>
            <Button
              onClick={() => {
                // 启动回测，不等待结果，让进度轮询工作
                setIsLoading(true);
                setShowDosResult(false);
                setBacktestResult(null);
                setProgressData(null);
                
                // 在后台执行回测，不阻塞界面
                backtestMutation.mutate({
                  symbol,
                  minPrice: parseFloat(priceMin),
                  maxPrice: parseFloat(priceMax),
                  gridCount: parseInt(gridCount),
                  investment: parseFloat(investment),
                  type: tradeType,
                  leverage,
                  startDate,
                  endDate,
                }, {
                  onSuccess: (result) => {
                    setBacktestResult(result.data);
                    setIsLoading(false);
                    setShowDosResult(true);
                  },
                  onError: (error: any) => {
                    setIsLoading(false);
                    setProgressData({
                      status: 'failed',
                      errorMessage: error.message || "回测失败，请重试"
                    });
                  }
                });
              }}
              disabled={isLoading || showDosResult}
              className="flex-1 bg-[#c3ff00] hover:bg-[#b0e600] text-black font-semibold"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  回测中...
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
              onClick={resetParams}
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
