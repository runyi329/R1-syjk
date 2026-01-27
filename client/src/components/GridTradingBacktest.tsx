import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { TrendingUp, ArrowRight, ArrowLeft, X } from "lucide-react";
import { useState } from "react";

interface GridTradingBacktestProps {
  symbol: string;
}

export function GridTradingBacktest({ symbol }: GridTradingBacktestProps) {
  const [step, setStep] = useState<number>(0); // 0: 未开始, 1: 参数设置, 2: 策略说明, 3: 回测结果
  const [priceMin, setPriceMin] = useState<string>("");
  const [priceMax, setPriceMax] = useState<string>("");
  const [gridCount, setGridCount] = useState<string>("");
  const [investment, setInvestment] = useState<string>("");
  const [tradeType, setTradeType] = useState<"spot" | "contract">("spot");
  const [leverage, setLeverage] = useState<number>(1);
  const [selectedYears, setSelectedYears] = useState<number[]>([]);

  // 生成年份列表（2017-2026）
  const years = Array.from({ length: 10 }, (_, i) => 2017 + i);

  // 切换年份选择
  const toggleYear = (year: number) => {
    setSelectedYears(prev => {
      if (prev.includes(year)) {
        // 取消选中
        return prev.filter(y => y !== year);
      } else {
        // 选中，并按顺序排列
        return [...prev, year].sort((a, b) => a - b);
      }
    });
  };

  // 重置所有参数
  const resetParams = () => {
    setPriceMin("");
    setPriceMax("");
    setGridCount("");
    setInvestment("");
    setTradeType("spot");
    setLeverage(1);
    setSelectedYears([]);
    setStep(0);
  };

  // 验证参数
  const validateParams = () => {
    if (!priceMin || !priceMax || !gridCount || !investment) {
      return "请填写所有必填参数";
    }
    if (selectedYears.length === 0) {
      return "请至少选择一个年份";
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
              placeholder="例如：10"
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
              placeholder="例如：1000"
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

          {/* 时间维度选择 */}
          <div className="space-y-3">
            <Label className="text-base">回测时间范围</Label>
            <div className="flex flex-wrap gap-2">
              {years.map((year) => (
                <button
                  key={year}
                  type="button"
                  onClick={() => toggleYear(year)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedYears.includes(year)
                      ? "bg-primary text-primary-foreground shadow-[0_0_10px_rgba(var(--primary),0.3)]"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
            {selectedYears.length > 0 && (
              <p className="text-sm text-muted-foreground">
                已选择：{selectedYears.join("、")}年
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

  // 第2步：策略说明
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
          {/* 策略图表 */}
          <div className="bg-muted/50 p-6 rounded-lg">
            <div className="relative h-48 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <TrendingUp className="w-16 h-16 mx-auto mb-2 opacity-50" />
                <p>策略图表展示</p>
                <p className="text-xs mt-1">低买高卖，循环套利，赚取网格利润</p>
              </div>
            </div>
          </div>

          {/* 策略说明 */}
          <div className="text-sm text-muted-foreground space-y-3">
            <p className="font-semibold text-foreground">低买高卖，循环套利，赚取网格利润。</p>
            <div className="space-y-2">
              <p>• 当价格下跌至一个网格买单价格时，策略执行买入，并同时在该网格上方挂卖单。</p>
              <p>• 当价格上涨至一个网格卖单价格时，策略执行卖出，并同时在该网格下方挂买单。</p>
            </div>
          </div>

          {/* 按钮组 */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => setStep(1)}
              variant="outline"
              className="border-primary/50"
              size="lg"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              上一步
            </Button>
            <Button
              onClick={() => setStep(3)}
              className="bg-[#c3ff00] hover:bg-[#b0e600] text-black font-semibold"
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

  // 第3步：回测结果（占位符，后续实现）
  if (step === 3) {
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
          <CardTitle>回测结果</CardTitle>
          <CardDescription>
            {symbol}/USDT · {tradeType === "spot" ? "现货网格" : `合约网格 ${leverage}x`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center py-12 text-muted-foreground">
            <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">正在计算回测结果...</p>
            <p className="text-sm mt-2">请稍候</p>
          </div>

          {/* 按钮组 */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => setStep(1)}
              variant="outline"
              className="border-primary/50"
              size="lg"
            >
              修改参数
            </Button>
            <Button
              onClick={resetParams}
              className="bg-[#c3ff00] hover:bg-[#b0e600] text-black font-semibold"
              size="lg"
            >
              创建新策略
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
