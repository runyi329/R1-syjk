import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getLoginUrl } from "@/const";
import { Activity, BarChart3, Sparkles, TrendingUp, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

// 因子类型定义
enum FactorType {
  MA = 'ma',           // 移动平均线
  MACD = 'macd',       // MACD指标
  RSI = 'rsi',         // 相对强弱指标
  BOLL = 'boll',       // 布林带
  KDJ = 'kdj',         // 随机指标
}

interface FactorConfig {
  type: FactorType;
  enabled: boolean;
  parameters: Record<string, number | string>;
}

interface FactorMetadata {
  type: FactorType;
  name: string;
  description: string;
  category: '趋势' | '动量' | '波动' | '成交量';
  parameters: FactorParameter[];
}

interface FactorParameter {
  key: string;
  label: string;
  type: 'number' | 'select';
  defaultValue: number | string;
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: string | number }[];
  description?: string;
}

// 因子库注册表
const FACTOR_REGISTRY: Record<FactorType, FactorMetadata> = {
  [FactorType.MA]: {
    type: FactorType.MA,
    name: '移动平均线',
    description: '通过短期和长期均线的交叉判断买卖时机',
    category: '趋势',
    parameters: [
      {
        key: 'shortPeriod',
        label: '短期均线周期',
        type: 'number',
        defaultValue: 10,
        min: 2,
        max: 100,
        step: 1,
        description: '计算短期移动平均线的K线数量',
      },
      {
        key: 'longPeriod',
        label: '长期均线周期',
        type: 'number',
        defaultValue: 30,
        min: 5,
        max: 200,
        step: 1,
        description: '计算长期移动平均线的K线数量',
      },
    ],
  },
  [FactorType.MACD]: {
    type: FactorType.MACD,
    name: 'MACD',
    description: '通过快慢均线差值判断趋势和动量',
    category: '趋势',
    parameters: [
      {
        key: 'fastPeriod',
        label: '快线周期',
        type: 'number',
        defaultValue: 12,
        min: 2,
        max: 50,
        step: 1,
      },
      {
        key: 'slowPeriod',
        label: '慢线周期',
        type: 'number',
        defaultValue: 26,
        min: 5,
        max: 100,
        step: 1,
      },
      {
        key: 'signalPeriod',
        label: '信号线周期',
        type: 'number',
        defaultValue: 9,
        min: 2,
        max: 50,
        step: 1,
      },
    ],
  },
  [FactorType.RSI]: {
    type: FactorType.RSI,
    name: 'RSI相对强弱指标',
    description: '判断超买超卖状态',
    category: '动量',
    parameters: [
      {
        key: 'period',
        label: 'RSI周期',
        type: 'number',
        defaultValue: 14,
        min: 2,
        max: 50,
        step: 1,
      },
      {
        key: 'overbought',
        label: '超买阈值',
        type: 'number',
        defaultValue: 70,
        min: 50,
        max: 90,
        step: 1,
      },
      {
        key: 'oversold',
        label: '超卖阈值',
        type: 'number',
        defaultValue: 30,
        min: 10,
        max: 50,
        step: 1,
      },
    ],
  },
  [FactorType.BOLL]: {
    type: FactorType.BOLL,
    name: '布林带',
    description: '通过价格与波动带的关系判断买卖时机',
    category: '波动',
    parameters: [
      {
        key: 'period',
        label: '周期',
        type: 'number',
        defaultValue: 20,
        min: 5,
        max: 100,
        step: 1,
      },
      {
        key: 'stdDev',
        label: '标准差倍数',
        type: 'number',
        defaultValue: 2,
        min: 1,
        max: 3,
        step: 0.1,
      },
    ],
  },
  [FactorType.KDJ]: {
    type: FactorType.KDJ,
    name: 'KDJ随机指标',
    description: '通过K、D、J三条线的交叉判断买卖时机',
    category: '动量',
    parameters: [
      {
        key: 'period',
        label: 'K值周期',
        type: 'number',
        defaultValue: 9,
        min: 2,
        max: 50,
        step: 1,
      },
      {
        key: 'kPeriod',
        label: 'K平滑周期',
        type: 'number',
        defaultValue: 3,
        min: 1,
        max: 10,
        step: 1,
      },
      {
        key: 'dPeriod',
        label: 'D平滑周期',
        type: 'number',
        defaultValue: 3,
        min: 1,
        max: 10,
        step: 1,
      },
    ],
  },
};

// 因子选择器组件
function FactorSelector({ selectedFactors, onChange }: { selectedFactors: FactorConfig[]; onChange: (factors: FactorConfig[]) => void }) {
  const availableFactors = Object.values(FACTOR_REGISTRY);
  const [expandedFactors, setExpandedFactors] = useState<Set<FactorType>>(new Set());

  const toggleExpand = (factorType: FactorType) => {
    const newExpanded = new Set(expandedFactors);
    if (newExpanded.has(factorType)) {
      newExpanded.delete(factorType);
    } else {
      newExpanded.add(factorType);
    }
    setExpandedFactors(newExpanded);
  };

  const toggleFactor = (factorType: FactorType) => {
    const existing = selectedFactors.find(f => f.type === factorType);

    if (existing) {
      onChange(
        selectedFactors.map(f =>
          f.type === factorType ? { ...f, enabled: !f.enabled } : f
        )
      );
    } else {
      const metadata = FACTOR_REGISTRY[factorType];
      const defaultParams: Record<string, number | string> = {};
      metadata.parameters.forEach(param => {
        defaultParams[param.key] = param.defaultValue;
      });

      onChange([
        ...selectedFactors,
        {
          type: factorType,
          enabled: true,
          parameters: defaultParams,
        },
      ]);
    }
  };

  const updateParameter = (factorType: FactorType, paramKey: string, value: number | string) => {
    onChange(
      selectedFactors.map(f =>
        f.type === factorType
          ? {
              ...f,
              parameters: {
                ...f.parameters,
                [paramKey]: value,
              },
            }
          : f
      )
    );
  };

  const getFactorConfig = (factorType: FactorType): FactorConfig | undefined => {
    return selectedFactors.find(f => f.type === factorType);
  };

  return (
    <div className="space-y-2">
      <div>
        <h3 className="text-sm font-semibold mb-1">因子库</h3>
        <p className="text-xs text-muted-foreground mb-2">
          选择一个或多个因子构建您的量化策略
        </p>
      </div>

      {availableFactors.map((metadata) => {
        const config = getFactorConfig(metadata.type);
        const isEnabled = config?.enabled ?? false;
        const isExpanded = expandedFactors.has(metadata.type);

        return (
          <Card key={metadata.type} className={isEnabled ? 'border-primary bg-primary/5' : 'border-border'}>
            <CardHeader className="py-1.5 px-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <input
                    type="checkbox"
                    id={`factor-${metadata.type}`}
                    checked={isEnabled}
                    onChange={() => toggleFactor(metadata.type)}
                    className="shrink-0"
                  />
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <label htmlFor={`factor-${metadata.type}`} className="cursor-pointer font-medium text-xs truncate">
                      {metadata.name}
                    </label>
                    <span className="inline-block px-1 py-0 text-[10px] leading-tight rounded bg-primary/10 text-primary shrink-0">
                      {metadata.category}
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate">
                      {metadata.description}
                    </span>
                  </div>
                </div>
                {isEnabled && (
                  <button
                    type="button"
                    onClick={() => toggleExpand(metadata.type)}
                    className="shrink-0 p-0.5 hover:bg-accent rounded transition-colors"
                  >
                    {isExpanded ? '▲' : '▼'}
                  </button>
                )}
              </div>
            </CardHeader>

            {isEnabled && config && isExpanded && (
              <CardContent className="py-2 px-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {metadata.parameters.map((param) => (
                    <div key={param.key} className="space-y-2">
                      <Label htmlFor={`${metadata.type}-${param.key}`}>
                        {param.label}
                      </Label>
                      {param.type === 'number' ? (
                        <Input
                          id={`${metadata.type}-${param.key}`}
                          type="number"
                          min={param.min}
                          max={param.max}
                          step={param.step}
                          value={config.parameters[param.key]}
                          onChange={(e) =>
                            updateParameter(
                              metadata.type,
                              param.key,
                              parseFloat(e.target.value)
                            )
                          }
                        />
                      ) : (
                        <select
                          id={`${metadata.type}-${param.key}`}
                          value={config.parameters[param.key]}
                          onChange={(e) =>
                            updateParameter(metadata.type, param.key, e.target.value)
                          }
                          className="w-full px-3 py-2 border rounded-md"
                        >
                          {param.options?.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      )}
                      {param.description && (
                        <p className="text-xs text-muted-foreground">
                          {param.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}

export default function QuantitativeTrading() {
  const { user, isAuthenticated } = useAuth();
  const [tradingPair, setTradingPair] = useState("BTC-USDT");
  const [timeframe, setTimeframe] = useState("1H");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [initialCapital, setInitialCapital] = useState(10000);

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

  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(end.toISOString().split("T")[0]);
  }, []);

  const handleRunBacktest = () => {
    if (!isAuthenticated) {
      toast.error("请先登录");
      return;
    }

    const enabledFactors = selectedFactors.filter(f => f.enabled);
    if (enabledFactors.length === 0) {
      toast.error("请至少选择一个因子");
      return;
    }

    toast.success("回测已提交，请稍候...");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background">
      {/* 导航栏 */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/crypto-analysis">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-center flex-1">量化交易计算机</h1>
          <div className="w-10" />
        </div>
      </header>

      {/* 主内容 */}
      <div className="relative overflow-hidden">
        {/* 装饰背景 */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-64 h-64 bg-primary rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary rounded-full blur-3xl"></div>
        </div>

        <div className="container relative z-10 py-20">
          {/* 页面标题 */}
          <div className="text-center space-y-6 mb-16">
            <h2 className="text-6xl font-bold text-foreground tracking-tight">
              量化计算平台
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              专业的加密货币交易策略回测与模拟交易系统
            </p>
            <div className="flex justify-center gap-4 pt-4">
              <div className="flex items-center gap-2 text-primary">
                <Activity className="w-5 h-5" />
                <span className="font-semibold">实时数据</span>
              </div>
              <div className="flex items-center gap-2 text-secondary">
                <BarChart3 className="w-5 h-5" />
                <span className="font-semibold">专业回测</span>
              </div>
              <div className="flex items-center gap-2 text-accent">
                <Sparkles className="w-5 h-5" />
                <span className="font-semibold">AI 辅助</span>
              </div>
            </div>
          </div>

          {/* 回测配置 */}
          <Card className="border-secondary/20 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle>配置回测策略</CardTitle>
              <CardDescription>选择交易对、时间周期和策略参数进行历史回测</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tradingPair">交易对</Label>
                  <Select value={tradingPair} onValueChange={setTradingPair}>
                    <SelectTrigger id="tradingPair">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BTC-USDT">BTC-USDT</SelectItem>
                      <SelectItem value="ETH-USDT">ETH-USDT</SelectItem>
                      <SelectItem value="SOL-USDT">SOL-USDT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeframe">时间周期</Label>
                  <Select value={timeframe} onValueChange={setTimeframe}>
                    <SelectTrigger id="timeframe">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1H">1 小时 (推荐)</SelectItem>
                      <SelectItem value="4H" disabled>4 小时 (暂无数据)</SelectItem>
                      <SelectItem value="1D" disabled>1 天 (暂无数据)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startDate">开始日期</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">结束日期</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="initialCapital">初始资金 (USDT)</Label>
                  <Input
                    id="initialCapital"
                    type="number"
                    min="100"
                    step="100"
                    value={initialCapital}
                    onChange={(e) => setInitialCapital(Number(e.target.value))}
                    placeholder="10000"
                  />
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <FactorSelector
                  selectedFactors={selectedFactors}
                  onChange={setSelectedFactors}
                />
              </div>

              <div className="flex justify-end gap-4 pt-4">
                {!isAuthenticated ? (
                  <Button asChild variant="default" size="lg">
                    <a href={getLoginUrl()}>登录后开始回测</a>
                  </Button>
                ) : (
                  <Button
                    onClick={handleRunBacktest}
                    size="lg"
                    className="bg-primary hover:bg-primary/90"
                  >
                    开始回测
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 功能卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <Card className="border-primary/20 bg-card/30 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  专业回测
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  基于历史数据验证策略表现，计算收益率、最大回撤、胜率等关键指标
                </p>
              </CardContent>
            </Card>

            <Card className="border-secondary/20 bg-card/30 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-secondary" />
                  模拟交易
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  基于实时价格进行虚拟交易，跟踪模拟账户盈亏，零风险验证策略
                </p>
              </CardContent>
            </Card>

            <Card className="border-accent/20 bg-card/30 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-accent" />
                  AI 辅助
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  用自然语言描述策略想法，AI 自动转换为可执行的策略参数
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
