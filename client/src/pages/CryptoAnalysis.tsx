import ScrollToTop from "@/components/ScrollToTop";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, TrendingDown, Zap, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { trpc } from "@/lib/trpc";

interface CryptoData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  marketCap: number;
  volume24h: number;
  priceHistory: Array<{ time: string; price: number }>;
  marketRank?: number;
}

interface FearGreedData {
  value: string;
  value_classification: string;
  timestamp: string;
}

export default function CryptoAnalysis() {
  const [cryptoData, setCryptoData] = useState<{ [key: string]: CryptoData }>({});
  const [fearGreedData, setFearGreedData] = useState<FearGreedData | null>(null);
  const [loading, setLoading] = useState(true);

  // 使用TRPC查询获取Fear & Greed指数
  const { data: fearGreedResponse, isLoading: fearGreedLoading } = trpc.crypto.getFearGreedIndex.useQuery();
  
  // 使用TRPC查询获取市场排名
  const { data: rankingsResponse, isLoading: rankingsLoading } = trpc.crypto.getMarketRankings.useQuery();

  // 生成模拟历史数据
  const generateMockHistory = (basePrice: number, variance: number) => {
    const history = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const randomChange = (Math.random() - 0.5) * variance;
      history.push({
        time: date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
        price: Math.round(basePrice + randomChange)
      });
    }
    return history;
  };

  // 获取模拟数据
  const getMockData = (): { [key: string]: CryptoData } => {
    return {
      BTC: {
        symbol: 'BTC',
        name: 'Bitcoin',
        price: 93669,
        change24h: -0.28,
        marketCap: 1.87e12,
        volume24h: 50.14e9,
        priceHistory: generateMockHistory(93669, 5000),
        marketRank: 1
      },
      ETH: {
        symbol: 'ETH',
        name: 'Ethereum',
        price: 3274.98,
        change24h: 2.56,
        marketCap: 395.27e9,
        volume24h: 27.37e9,
        priceHistory: generateMockHistory(3274.98, 200),
        marketRank: 2
      }
    };
  };

  // 处理Fear & Greed数据
  useEffect(() => {
    if (fearGreedResponse?.data && fearGreedResponse.data.length > 0) {
      setFearGreedData(fearGreedResponse.data[0]);
    }
  }, [fearGreedResponse]);

  // 处理排名数据
  useEffect(() => {
    if (rankingsResponse?.success && rankingsResponse.rankings) {
      setCryptoData(prev => ({
        ...prev,
        BTC: { ...prev.BTC, marketRank: rankingsResponse.rankings['BTC'] },
        ETH: { ...prev.ETH, marketRank: rankingsResponse.rankings['ETH'] }
      }));
    }
  }, [rankingsResponse]);

  // 初始化数据加载
  useEffect(() => {
    const loadData = async () => {
      // 先加载模拟数据
      setCryptoData(getMockData());
      
      // 检查是否所有数据都已加载
      if (!fearGreedLoading && !rankingsLoading) {
        setLoading(false);
      }
    };
    
    loadData();
  }, [fearGreedLoading, rankingsLoading]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  const formatMarketCap = (cap: number) => {
    if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
    if (cap >= 1e9) return `$${(cap / 1e9).toFixed(2)}B`;
    if (cap >= 1e6) return `$${(cap / 1e6).toFixed(2)}M`;
    return `$${cap.toFixed(0)}`;
  };

  // 获取恐惧贪婪指数的颜色
  const getFearGreedColor = (value: string) => {
    const numValue = parseInt(value);
    if (numValue <= 25) return 'text-red-600';
    if (numValue <= 45) return 'text-orange-500';
    if (numValue <= 55) return 'text-yellow-500';
    if (numValue <= 75) return 'text-lime-500';
    return 'text-green-600';
  };

  // 获取恐惧贪婪指数的背景色
  const getFearGreedBgColor = (value: string) => {
    const numValue = parseInt(value);
    if (numValue <= 25) return 'bg-red-500/10';
    if (numValue <= 45) return 'bg-orange-500/10';
    if (numValue <= 55) return 'bg-yellow-500/10';
    if (numValue <= 75) return 'bg-lime-500/10';
    return 'bg-green-500/10';
  };

  return (
    <div className="min-h-screen pb-20 md:pb-0 bg-background font-sans text-foreground">
      <ScrollToTop />

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
            <h1 className="text-xl font-bold tracking-tight">数字货币分析</h1>
          </div>
          <nav className="hidden md:flex gap-6 text-sm font-medium text-muted-foreground">
            <a href="#overview" className="hover:text-foreground transition-colors">总览</a>
            <a href="#sentiment" className="hover:text-foreground transition-colors">市场情绪</a>
            <a href="#analysis" className="hover:text-foreground transition-colors">详细分析</a>
            <a href="#products" className="hover:text-foreground transition-colors">产品</a>
          </nav>
        </div>
      </header>

      <main className="container mx-auto py-8 space-y-12">
        {/* 加载状态 */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">正在加载数据...</p>
            </div>
          </div>
        )}

        {/* 市场情绪区域 */}
        {!loading && fearGreedData && (
          <section id="sentiment" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight mb-2">市场情绪指数</h2>
              <p className="text-muted-foreground mb-6">实时市场恐惧贪婪指数分析</p>
            </div>

            <Card className={`border-l-4 border-l-primary shadow-md ${getFearGreedBgColor(fearGreedData.value)}`}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-lg">加密货币恐惧贪婪指数</CardTitle>
                    <CardDescription>基于多个市场指标的实时情绪分析</CardDescription>
                  </div>
                  <AlertCircle className="w-6 h-6 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">当前指数</p>
                    <p className={`text-4xl font-bold ${getFearGreedColor(fearGreedData.value)}`}>
                      {fearGreedData.value}
                    </p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">市场情绪</p>
                    <p className="text-2xl font-bold text-foreground">
                      {fearGreedData.value_classification}
                    </p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">指数范围</p>
                    <p className="text-sm text-foreground">
                      0 = 极度恐惧 | 50 = 中立 | 100 = 极度贪婪
                    </p>
                  </div>
                </div>

                {/* 指数说明 */}
                <div className="p-4 bg-secondary/30 rounded-lg border border-border">
                  <p className="text-sm text-foreground mb-2">
                    {parseInt(fearGreedData.value) <= 25 
                      ? '🔴 极度恐惧：市场情绪极度悲观，可能存在投资机会，但需谨慎。'
                      : parseInt(fearGreedData.value) <= 45
                      ? '🟠 恐惧：市场情绪悲观，投资者谨慎，可能是逢低布局的机会。'
                      : parseInt(fearGreedData.value) <= 55
                      ? '🟡 中立：市场情绪平衡，投资者保持观望，等待明确信号。'
                      : parseInt(fearGreedData.value) <= 75
                      ? '🟢 贪婪：市场情绪乐观，投资者积极，需注意风险。'
                      : '🟢 极度贪婪：市场情绪极度乐观，可能存在泡沫风险，需要谨慎。'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* 总览区域 */}
        {!loading && Object.keys(cryptoData).length > 0 && (
          <>
            <section id="overview" className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight mb-2">市场总览</h2>
                <p className="text-muted-foreground mb-6">主流币种实时行情</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(cryptoData).map(([key, crypto]) => (
                  <Card key={key} className="border-none shadow-md overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-2xl font-bold">{crypto.name}</CardTitle>
                          <CardDescription className="text-xs mt-1">
                            {crypto.symbol}
                            {crypto.marketRank && ` • 排名 #${crypto.marketRank}`}
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className="text-lg font-bold">
                          {crypto.symbol}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* 价格显示 */}
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">当前价格</p>
                        <p className="text-4xl font-bold text-primary">{formatPrice(crypto.price)}</p>
                      </div>

                      {/* 24小时涨跌 */}
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground mb-1">24小时涨跌</p>
                          <div className="flex items-center gap-2">
                            {crypto.change24h >= 0 ? (
                              <>
                                <TrendingUp className="w-5 h-5 text-green-500" />
                                <span className="text-2xl font-bold text-green-500">+{crypto.change24h.toFixed(2)}%</span>
                              </>
                            ) : (
                              <>
                                <TrendingDown className="w-5 h-5 text-red-500" />
                                <span className="text-2xl font-bold text-red-500">{crypto.change24h.toFixed(2)}%</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 市场数据 */}
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">市值</p>
                          <p className="font-bold text-sm">{formatMarketCap(crypto.marketCap)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">24h交易量</p>
                          <p className="font-bold text-sm">{formatMarketCap(crypto.volume24h)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* 详细分析区域 */}
            <section id="analysis" className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight mb-2">7天价格走势</h2>
                <p className="text-muted-foreground mb-6">查看过去7天的价格变化趋势</p>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {Object.entries(cryptoData).map(([key, crypto]) => {
                  // 计算价格统计
                  const prices = crypto.priceHistory.map(h => h.price);
                  const maxPrice = Math.max(...prices);
                  const minPrice = Math.min(...prices);
                  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
                  const priceRange = maxPrice - minPrice;
                  const priceRangePercent = ((priceRange / minPrice) * 100).toFixed(2);
                  const sevenDayChangePercent = (((crypto.price - prices[0]) / prices[0]) * 100).toFixed(2);
                  
                  return (
                    <Card key={`chart-${key}`} className="border-none shadow-md">
                      <CardHeader>
                        <CardTitle className="text-lg">{crypto.name} ({crypto.symbol})</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* 价格统计卡片 */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">最高价</p>
                            <p className="text-lg font-bold text-green-500">{formatPrice(maxPrice)}</p>
                          </div>
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">最低价</p>
                            <p className="text-lg font-bold text-red-500">{formatPrice(minPrice)}</p>
                          </div>
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">平均价</p>
                            <p className="text-lg font-bold">{formatPrice(avgPrice)}</p>
                          </div>
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">价格波幅</p>
                            <p className="text-lg font-bold text-primary">{priceRangePercent}%</p>
                          </div>
                        </div>

                        {/* 7天变化分析 */}
                        <div className="p-4 bg-secondary/30 rounded-lg border border-border">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">7天价格变化</p>
                              <p className="text-2xl font-bold">
                                {sevenDayChangePercent}%
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground mb-1">开盘价</p>
                              <p className="text-lg font-bold">{formatPrice(prices[0])}</p>
                            </div>
                          </div>
                        </div>

                        {/* 价格走势图 */}
                        <div className="h-[300px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={crypto.priceHistory}>
                              <defs>
                                <linearGradient id={`gradient-${key}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                              <XAxis dataKey="time" stroke="var(--muted-foreground)" />
                              <YAxis stroke="var(--muted-foreground)" />
                              <RechartsTooltip 
                                contentStyle={{
                                  backgroundColor: 'var(--card)',
                                  border: '1px solid var(--border)',
                                  borderRadius: '8px'
                                }}
                                formatter={(value: any) => formatPrice(value)}
                              />
                              <Area 
                                type="monotone" 
                                dataKey="price" 
                                stroke="var(--primary)" 
                                strokeWidth={2}
                                fill={`url(#gradient-${key})`}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>

            {/* 市场分析区域 */}
            <section id="market-analysis" className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight mb-2">市场分析</h2>
                <p className="text-muted-foreground mb-6">深入了解数字货币市场动态</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(cryptoData).map(([key, crypto]) => {
                  // 计算交易量相关指标
                  const volumeToMarketCapRatioNum = (crypto.volume24h / crypto.marketCap) * 100;
                  const volumeToMarketCapRatio = volumeToMarketCapRatioNum.toFixed(2);
                  const marketHeat = volumeToMarketCapRatioNum > 5 ? '火热' : volumeToMarketCapRatioNum > 2 ? '温暖' : '低迷';
                  const marketHeatColor = volumeToMarketCapRatioNum > 5 ? 'text-red-500' : volumeToMarketCapRatioNum > 2 ? 'text-yellow-500' : 'text-blue-500';
                  
                  return (
                    <Card key={`analysis-${key}`} className="border-l-4 border-l-primary shadow-md">
                      <CardHeader>
                        <CardTitle className="text-lg">{crypto.name} 市场分析</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">交易量</p>
                            <p className="text-lg font-bold">{formatMarketCap(crypto.volume24h)}</p>
                          </div>
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">市值</p>
                            <p className="text-lg font-bold">{formatMarketCap(crypto.marketCap)}</p>
                          </div>
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">成交量/市值</p>
                            <p className="text-lg font-bold text-primary">{volumeToMarketCapRatio}%</p>
                          </div>
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">市场热度</p>
                            <p className={`text-lg font-bold ${marketHeatColor}`}>{marketHeat}</p>
                          </div>
                        </div>
                        
                        <div className="p-3 bg-secondary/30 rounded-lg border border-border">
                          <p className="text-sm text-muted-foreground mb-2">市场评估</p>
                          <p className="text-sm text-foreground">
                            {volumeToMarketCapRatioNum > 5 
                              ? `${crypto.symbol}市场热度高，交易活跃，投资者兴趣高涨。`
                              : volumeToMarketCapRatioNum > 2
                              ? `${crypto.symbol}市场较为活跃，交易量适中，投资机会不错。`
                              : `${crypto.symbol}市场交易量较低，投资者兴趣有限。`
                            }
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>

            {/* 产品区域 */}
            <section id="products" className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight mb-2">数字货币产品</h2>
                <p className="text-muted-foreground mb-6">探索我们的数字货币投资产品</p>
              </div>

              <Card className="border-l-4 border-l-primary shadow-md overflow-hidden bg-gradient-to-br from-card to-secondary/30">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Zap className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl font-bold">周周赢</CardTitle>
                        <CardDescription>数字货币定期收益产品</CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    周周赢是我们推出的创新数字货币产品，结合BTC、ETH等主流币种的市场行情，为投资者提供稳定的周期性收益机制。
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4">
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">预期年化</p>
                      <p className="text-xl font-bold text-primary">12-18%</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">周期</p>
                      <p className="text-xl font-bold">7天</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">最低投入</p>
                      <p className="text-xl font-bold">1000 USDT</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">风险等级</p>
                      <p className="text-xl font-bold text-yellow-500">中等</p>
                    </div>
                  </div>
                  <Link href="/weekly-win">
                    <Button className="w-full mt-4 bg-primary hover:bg-primary/90">
                      了解详情
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* 风险提示 */}
              <Card className="border-l-4 border-l-yellow-500 bg-yellow-500/5">
                <CardHeader>
                  <CardTitle className="text-yellow-600">⚠️ 风险提示</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    数字货币市场波动性大，投资存在风险。请根据自身风险承受能力谨慎投资。过往收益不代表未来表现，投资需谨慎。
                  </p>
                </CardContent>
              </Card>
            </section>
          </>
        )}
      </main>

      {/* 页脚 */}
      <footer className="border-t border-border bg-card/50 mt-12 py-8">
        <div className="container mx-auto text-center">
          <p className="text-sm text-muted-foreground">© 2026 数金研投 | 数字货币分析平台</p>
        </div>
      </footer>
    </div>
  );
}
