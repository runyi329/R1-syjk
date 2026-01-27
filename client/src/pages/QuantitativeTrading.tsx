import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { getLoginUrl } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { Activity, BarChart3, Sparkles, TrendingUp, ArrowLeft, CheckCircle, Zap, Shield, AlertCircle, Code, Cpu, LineChart } from "lucide-react";
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
    name: 'RSI',
    description: '相对强弱指标，判断超买超卖情况',
    category: '动量',
    parameters: [
      {
        key: 'period',
        label: '周期',
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
        max: 100,
        step: 1,
      },
      {
        key: 'oversold',
        label: '超卖阈值',
        type: 'number',
        defaultValue: 30,
        min: 0,
        max: 50,
        step: 1,
      },
    ],
  },
  [FactorType.BOLL]: {
    type: FactorType.BOLL,
    name: '布林带',
    description: '利用波动率判断价格极值和趋势',
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
        max: 5,
        step: 0.5,
      },
    ],
  },
  [FactorType.KDJ]: {
    type: FactorType.KDJ,
    name: 'KDJ',
    description: '随机指标，结合动量和超买超卖',
    category: '动量',
    parameters: [
      {
        key: 'period',
        label: '周期',
        type: 'number',
        defaultValue: 9,
        min: 2,
        max: 50,
        step: 1,
      },
      {
        key: 'smoothK',
        label: 'K值平滑周期',
        type: 'number',
        defaultValue: 3,
        min: 1,
        max: 10,
        step: 1,
      },
      {
        key: 'smoothD',
        label: 'D值平滑周期',
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
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">因子库</h3>
        <p className="text-sm text-muted-foreground mb-4">
          选择一个或多个因子构建您的量化策略
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {availableFactors.map((metadata) => {
          const config = getFactorConfig(metadata.type);
          const isEnabled = config?.enabled ?? false;
          const isExpanded = expandedFactors.has(metadata.type);

          return (
            <Card key={metadata.type} className={isEnabled ? 'border-primary bg-primary/5' : 'border-border'}>
              <CardHeader className="py-3 px-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      id={`factor-${metadata.type}`}
                      checked={isEnabled}
                      onChange={() => toggleFactor(metadata.type)}
                      className="shrink-0 mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <label htmlFor={`factor-${metadata.type}`} className="cursor-pointer font-semibold text-sm block">
                        {metadata.name}
                      </label>
                      <p className="text-xs text-muted-foreground mt-1">
                        {metadata.description}
                      </p>
                      <Badge variant="outline" className="mt-2 text-xs">
                        {metadata.category}
                      </Badge>
                    </div>
                  </div>
                  {isEnabled && (
                    <button
                      onClick={() => toggleExpand(metadata.type)}
                      className="text-primary text-xs font-medium shrink-0"
                    >
                      {isExpanded ? '隐藏' : '展开'}
                    </button>
                  )}
                </div>
              </CardHeader>

              {isEnabled && isExpanded && (
                <CardContent className="pt-0 px-4 pb-4 space-y-3 border-t border-border/50">
                  {metadata.parameters.map(param => (
                    <div key={param.key} className="space-y-1.5">
                      <label htmlFor={`param-${metadata.type}-${param.key}`} className="text-xs font-medium block">
                        {param.label}
                      </label>
                      {param.type === 'number' ? (
                        <Input
                          id={`param-${metadata.type}-${param.key}`}
                          type="number"
                          min={param.min}
                          max={param.max}
                          step={param.step}
                          value={config?.parameters[param.key] ?? param.defaultValue}
                          onChange={(e) => updateParameter(metadata.type, param.key, Number(e.target.value))}
                          className="text-sm h-8"
                        />
                      ) : (
                        <Select
                          value={String(config?.parameters[param.key] ?? param.defaultValue)}
                          onValueChange={(value) => updateParameter(metadata.type, param.key, value)}
                        >
                          <SelectTrigger id={`param-${metadata.type}-${param.key}`} className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {param.options?.map(opt => (
                              <SelectItem key={opt.value} value={String(opt.value)}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      {param.description && (
                        <p className="text-xs text-muted-foreground">{param.description}</p>
                      )}
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default function QuantitativeTrading() {
  const { isAuthenticated } = useAuth();
  const [tradingPair, setTradingPair] = useState("BTC-USDT");
  const [timeframe, setTimeframe] = useState("1H");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [initialCapital, setInitialCapital] = useState(10000);
  const [selectedFactors, setSelectedFactors] = useState<FactorConfig[]>([]);

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
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/crypto">
            <Button variant="ghost" size="icon" className="hover:bg-primary/10">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl md:text-2xl font-bold text-center flex-1">量化交易</h1>
          <div className="w-10" />
        </div>
      </header>

      {/* 主内容 */}
      <div className="relative overflow-hidden">
        {/* 装饰背景 */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-64 h-64 bg-primary rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary rounded-full blur-3xl"></div>
        </div>

        <div className="container relative z-10 py-8 md:py-16">
          {/* 产品介绍部分 */}
          <section className="mb-12 md:mb-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                    专业量化交易平台
                  </h2>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    基于多因子模型的加密货币交易策略回测与模拟交易系统，帮助投资者验证交易策略、优化参数配置、降低投资风险。
                  </p>
                </div>

                {/* 核心特点 */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-sm">历史回测</h3>
                      <p className="text-xs text-muted-foreground">基于 5 年历史数据验证策略表现</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-sm">模拟交易</h3>
                      <p className="text-xs text-muted-foreground">实时行情虚拟交易，零风险验证策略</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-sm">多因子库</h3>
                      <p className="text-xs text-muted-foreground">MA、MACD、RSI、BOLL、KDJ 五大因子</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-sm">详细报告</h3>
                      <p className="text-xs text-muted-foreground">收益率、最大回撤、胜率等关键指标</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 功能卡片 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 hover:border-primary/40 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center mb-2">
                      <LineChart className="w-5 h-5 text-primary" />
                    </div>
                    <CardTitle className="text-sm">趋势分析</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      MA、MACD 等趋势因子帮助识别市场方向
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-secondary/20 bg-gradient-to-br from-secondary/10 to-secondary/5 hover:border-secondary/40 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center mb-2">
                      <Cpu className="w-5 h-5 text-secondary" />
                    </div>
                    <CardTitle className="text-sm">动量指标</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      RSI、KDJ 等动量因子判断超买超卖
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-accent/20 bg-gradient-to-br from-accent/10 to-accent/5 hover:border-accent/40 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center mb-2">
                      <Zap className="w-5 h-5 text-accent" />
                    </div>
                    <CardTitle className="text-sm">波动率</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      BOLL 布林带捕捉价格极值机会
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 hover:border-yellow-500/40 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center mb-2">
                      <Shield className="w-5 h-5 text-yellow-500" />
                    </div>
                    <CardTitle className="text-sm">风险控制</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      多因子组合降低单一策略风险
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* 回测配置卡片 */}
          <Card className="border-secondary/20 bg-card/50 backdrop-blur mb-12 md:mb-16">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                配置回测策略
              </CardTitle>
              <CardDescription>选择交易对、时间周期和策略参数进行历史回测</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 基础配置 */}
              <div>
                <h3 className="text-sm font-semibold mb-4">基础配置</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tradingPair" className="text-xs font-medium">交易对</Label>
                    <Select value={tradingPair} onValueChange={setTradingPair}>
                      <SelectTrigger id="tradingPair" className="h-9 text-sm">
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
                    <Label htmlFor="timeframe" className="text-xs font-medium">时间周期</Label>
                    <Select value={timeframe} onValueChange={setTimeframe}>
                      <SelectTrigger id="timeframe" className="h-9 text-sm">
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
                    <Label htmlFor="startDate" className="text-xs font-medium">开始日期</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate" className="text-xs font-medium">结束日期</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* 资金配置 */}
              <div>
                <h3 className="text-sm font-semibold mb-4">资金配置</h3>
                <div className="space-y-2">
                  <Label htmlFor="initialCapital" className="text-xs font-medium">初始资金 (USDT)</Label>
                  <Input
                    id="initialCapital"
                    type="number"
                    min="100"
                    step="100"
                    value={initialCapital}
                    onChange={(e) => setInitialCapital(Number(e.target.value))}
                    placeholder="10000"
                    className="h-9 text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    建议初始资金 10,000 - 100,000 USDT，用于验证策略表现
                  </p>
                </div>
              </div>

              {/* 因子库选择 */}
              <div className="border-t border-border pt-6">
                <FactorSelector
                  selectedFactors={selectedFactors}
                  onChange={setSelectedFactors}
                />
              </div>

              {/* 操作按钮 */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-border">
                {!isAuthenticated ? (
                  <Button
                    onClick={() => {
                      try {
                        window.location.href = getLoginUrl();
                      } catch (error) {
                        console.error('登录 URL 生成失败:', error);
                        toast.error('无法生成登录链接，请稍后重试');
                      }
                    }}
                    variant="default"
                    size="lg"
                    className="w-full sm:w-auto"
                  >
                    登录后开始回测
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full sm:w-auto"
                    >
                      重置参数
                    </Button>
                    <Button
                      onClick={handleRunBacktest}
                      size="lg"
                      className="w-full sm:w-auto bg-primary hover:bg-primary/90"
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      开始回测
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 功能介绍 */}
          <section className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">平台功能</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-primary/20 bg-card/30 backdrop-blur hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <BarChart3 className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">专业回测</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    基于 5 年历史数据验证策略表现，计算收益率、最大回撤、胜率、夏普比率等关键指标，帮助您全面评估策略质量。
                  </p>
                </CardContent>
              </Card>

              <Card className="border-secondary/20 bg-card/30 backdrop-blur hover:border-secondary/50 transition-colors">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-4">
                    <Activity className="w-6 h-6 text-secondary" />
                  </div>
                  <CardTitle className="text-lg">模拟交易</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    基于实时行情进行虚拟交易，跟踪模拟账户盈亏，零风险验证策略在实盘中的表现，支持随时停止和调整。
                  </p>
                </CardContent>
              </Card>

              <Card className="border-accent/20 bg-card/30 backdrop-blur hover:border-accent/50 transition-colors">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                    <Sparkles className="w-6 h-6 text-accent" />
                  </div>
                  <CardTitle className="text-lg">AI 辅助</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    用自然语言描述您的交易想法，AI 自动转换为可执行的策略参数，快速生成量化策略，降低技术门槛。
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* 因子说明 */}
          <section className="mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">因子库说明</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <LineChart className="w-5 h-5 text-primary" />
                    趋势因子
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-sm mb-1">移动平均线 (MA)</h4>
                    <p className="text-xs text-muted-foreground">
                      通过短期和长期均线的交叉判断买卖时机，识别趋势方向变化。
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">MACD</h4>
                    <p className="text-xs text-muted-foreground">
                      通过快慢均线差值判断趋势和动量，识别趋势强度和反转信号。
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-secondary" />
                    动量因子
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-sm mb-1">RSI</h4>
                    <p className="text-xs text-muted-foreground">
                      相对强弱指标，判断超买超卖情况，识别反转机会。
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">KDJ</h4>
                    <p className="text-xs text-muted-foreground">
                      随机指标，结合动量和超买超卖，提高信号准确度。
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="w-5 h-5 text-accent" />
                    波动率因子
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">布林带 (BOLL)</h4>
                    <p className="text-xs text-muted-foreground">
                      利用波动率判断价格极值和趋势，识别支撑阻力位置。
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="w-5 h-5 text-yellow-500" />
                    多因子组合
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">风险控制</h4>
                    <p className="text-xs text-muted-foreground">
                      组合多个因子降低单一策略风险，提高策略稳定性和收益率。
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* 使用建议 */}
          <Card className="border-yellow-500/20 bg-yellow-500/5 mb-12">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertCircle className="w-5 h-5 text-yellow-500" />
                使用建议
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• 建议先从单个因子开始测试，逐步增加因子组合的复杂度</p>
              <p>• 历史回测结果不代表未来表现，请谨慎参考</p>
              <p>• 在模拟交易中验证策略至少 2-4 周后再考虑实盘交易</p>
              <p>• 定期调整参数和因子组合，适应市场变化</p>
              <p>• 设置合理的止损和止盈水平，控制单笔风险</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
