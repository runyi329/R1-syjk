import ScrollToTop from "@/components/ScrollToTop";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, TrendingDown, Zap } from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from "recharts";

interface CryptoData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  marketCap: number;
  volume24h: number;
  priceHistory: Array<{ time: string; price: number }>;
}

export default function CryptoAnalysis() {
  const [cryptoData, setCryptoData] = useState<{ [key: string]: CryptoData }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUsingMockData, setIsUsingMockData] = useState(false);

  useEffect(() => {
    fetchCryptoData();
    // 每30秒更新一次数据
    const interval = setInterval(fetchCryptoData, 30000);
    return () => clearInterval(interval);
  }, []);

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
        priceHistory: generateMockHistory(93669, 5000)
      },
      ETH: {
        symbol: 'ETH',
        name: 'Ethereum',
        price: 3274.98,
        change24h: 2.56,
        marketCap: 395.27e9,
        volume24h: 27.37e9,
        priceHistory: generateMockHistory(3274.98, 200)
      }
    };
  };

  const fetchCryptoData = async () => {
    try {
      setLoading(true);
      setError(null);
      setIsUsingMockData(false);

      // 使用 CoinGecko API（免费，无需认证）
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true'
      );

      if (!response.ok) throw new Error('Failed to fetch crypto data');

      const data = await response.json();

      // 获取历史数据用于图表
      const historyResponse = await fetch(
        'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=7'
      );

      if (!historyResponse.ok) throw new Error('Failed to fetch history data');

      const historyData = await historyResponse.json();

      // 处理 BTC 数据
      const btcHistory = historyData.prices.map((item: [number, number]) => ({
        time: new Date(item[0]).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
        price: Math.round(item[1])
      }));

      // 获取 ETH 历史数据
      const ethHistoryResponse = await fetch(
        'https://api.coingecko.com/api/v3/coins/ethereum/market_chart?vs_currency=usd&days=7'
      );

      if (!ethHistoryResponse.ok) throw new Error('Failed to fetch ETH history');

      const ethHistoryData = await ethHistoryResponse.json();

      const ethHistory = ethHistoryData.prices.map((item: [number, number]) => ({
        time: new Date(item[0]).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
        price: Math.round(item[1])
      }));

      setCryptoData({
        BTC: {
          symbol: 'BTC',
          name: 'Bitcoin',
          price: data.bitcoin.usd,
          change24h: data.bitcoin.usd_24h_change,
          marketCap: data.bitcoin.usd_market_cap,
          volume24h: data.bitcoin.usd_24h_vol,
          priceHistory: btcHistory
        },
        ETH: {
          symbol: 'ETH',
          name: 'Ethereum',
          price: data.ethereum.usd,
          change24h: data.ethereum.usd_24h_change,
          marketCap: data.ethereum.usd_market_cap,
          volume24h: data.ethereum.usd_24h_vol,
          priceHistory: ethHistory
        }
      });
    } catch (err) {
      console.error('Crypto data fetch error:', err);
      // 使用模拟数据作为备用
      setCryptoData(getMockData());
      setIsUsingMockData(true);
      setError('无法连接到实时数据源，显示示例数据');
    } finally {
      setLoading(false);
    }
  };

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

        {/* 错误提示 */}
        {error && (
          <Card className="border-l-4 border-l-yellow-500 bg-yellow-500/5">
            <CardHeader>
              <CardTitle className="text-yellow-600">⚠️ 数据提示</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button onClick={fetchCryptoData} variant="outline" size="sm">
                重新加载实时数据
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 总览区域 */}
        {!loading && (
          <>
            <section id="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(cryptoData).map(([key, crypto]) => (
                  <Card key={key} className="border-none shadow-md overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-2xl font-bold">{crypto.name}</CardTitle>
                          <CardDescription className="text-xs mt-1">{crypto.symbol}</CardDescription>
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
                {Object.entries(cryptoData).map(([key, crypto]) => (
                  <Card key={`chart-${key}`} className="border-none shadow-md">
                    <CardHeader>
                      <CardTitle className="text-lg">{crypto.name} ({crypto.symbol})</CardTitle>
                    </CardHeader>
                    <CardContent>
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
                ))}
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
                  <Button className="w-full mt-4 bg-primary hover:bg-primary/90">
                    了解详情
                  </Button>
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
