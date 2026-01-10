import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import ScrollToTop from "@/components/ScrollToTop";
import InvestmentApplicationForm from "@/components/InvestmentApplicationForm";
import StockSimulation from "@/components/StockSimulation";

interface MarketData {
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  high52w: number;
  low52w: number;
  volume: string;
  description: string;
}

interface PriceHistory {
  time: string;
  price: number;
}

const markets: MarketData[] = [
  {
    name: "标普500",
    symbol: "SPX",
    price: 5950.75,
    change24h: 1.35,
    high52w: 6100,
    low52w: 5200,
    volume: "2.8万亿美元",
    description: "美国500家大型企业指数"
  },
  {
    name: "纳斯达克",
    symbol: "IXIC",
    price: 19850.50,
    change24h: 2.45,
    high52w: 20500,
    low52w: 16800,
    volume: "3.2万亿美元",
    description: "美国科技股指数"
  },
  {
    name: "道琼斯",
    symbol: "DJIA",
    price: 42500.30,
    change24h: 0.95,
    high52w: 43500,
    low52w: 38000,
    volume: "2.5万亿美元",
    description: "美国30家蓝筹股指数"
  },
  {
    name: "罗素2000",
    symbol: "RUT",
    price: 2250.75,
    change24h: 1.85,
    high52w: 2400,
    low52w: 1950,
    volume: "1.5万亿美元",
    description: "美国小盘股指数"
  }
];

const generateMockHistory = (basePrice: number, variance: number): PriceHistory[] => {
  const history = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const randomChange = (Math.random() - 0.5) * variance;
    history.push({
      time: date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
      price: Math.round((basePrice + randomChange) * 100) / 100
    });
  }
  return history;
};

export default function StocksUSAnalysis() {
  const [, setLocation] = useLocation();
  const [selectedMarket, setSelectedMarket] = useState<MarketData>(markets[0]);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);

  useEffect(() => {
    setPriceHistory(generateMockHistory(selectedMarket.price, selectedMarket.price * 0.05));
  }, [selectedMarket]);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "低":
        return "bg-green-500/10 text-green-700 border-green-200";
      case "中":
        return "bg-yellow-500/10 text-yellow-700 border-yellow-200";
      case "高":
        return "bg-red-500/10 text-red-700 border-red-200";
      default:
        return "";
    }
  };

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `$${(price / 1000000).toFixed(2)}M`;
    } else if (price >= 1000) {
      return `$${(price / 1000).toFixed(2)}K`;
    }
    return `$${price.toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex flex-col pb-20 md:pb-0">
      {/* 返回按钮 */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </Button>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 space-y-8">
        {/* 页面标题 */}
        <section className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="text-5xl">🇺🇸</div>
            <div>
              <h1 className="text-4xl font-bold">美股分析</h1>
              <p className="text-muted-foreground mt-2">全球最大的股票市场，提供实时数据分析和投资建议</p>
            </div>
          </div>
        </section>

        {/* 市场概览 */}
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">市场概览</h2>
            <p className="text-muted-foreground mb-4">主要市场指标实时数据</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {markets.map((market) => (
              <Card
                key={market.symbol}
                className={`cursor-pointer transition-all ${
                  selectedMarket.symbol === market.symbol
                    ? "border-primary shadow-lg"
                    : "hover:border-primary/50"
                }`}
                onClick={() => setSelectedMarket(market)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{market.name}</CardTitle>
                      <CardDescription>{market.symbol}</CardDescription>
                    </div>
                    <Badge variant={market.change24h >= 0 ? "default" : "secondary"}>
                      {market.change24h >= 0 ? "↑" : "↓"} {Math.abs(market.change24h)}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">当前价格</span>
                    <span className="text-xl font-bold">{formatPrice(market.price)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">52周高</span>
                    <span>{formatPrice(market.high52w)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">52周低</span>
                    <span>{formatPrice(market.low52w)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">交易量</span>
                    <span>{market.volume}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* 价格走势 */}
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">30天价格走势</h2>
            <p className="text-muted-foreground mb-4">查看{selectedMarket.name}的价格变化趋势</p>
          </div>

          <Card className="border-none shadow-md">
            <CardContent className="pt-6">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={priceHistory}>
                    <defs>
                      <linearGradient id="colorPriceUS" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="time" stroke="var(--muted-foreground)" />
                    <YAxis stroke="var(--muted-foreground)" />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px"
                      }}
                      formatter={(value: any) => formatPrice(value)}
                    />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke="var(--primary)"
                      fillOpacity={1}
                      fill="url(#colorPriceUS)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 模拟投注 */}
        <StockSimulation marketType="US" marketName="美股" />

        {/* 技术面分析 */}
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">技术面分析</h2>
            <p className="text-muted-foreground mb-4">专业分析师观点</p>
          </div>

          <Card className="border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                {selectedMarket.name}技术分析
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                美股市场近期受美联储政策预期影响，科技股表现强势。纳斯达克创新高，大型科技公司（FAANG）继续领涨。标普500指数在5900-6000点区间反复争夺，成交量温和。小盘股表现相对滞后，但估值吸引力较大。建议投资者关注美联储利率决策和企业盈利预期。
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">52周高</p>
                  <p className="font-bold">{formatPrice(selectedMarket.high52w)}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">52周低</p>
                  <p className="font-bold">{formatPrice(selectedMarket.low52w)}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">波动率</p>
                  <p className="font-bold text-primary">
                    {(((selectedMarket.high52w - selectedMarket.low52w) / selectedMarket.low52w) * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">24h涨跌</p>
                  <p className={`font-bold ${selectedMarket.change24h >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {selectedMarket.change24h >= 0 ? "+" : ""}{selectedMarket.change24h}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 投资建议 */}
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">投资建议</h2>
            <p className="text-muted-foreground mb-4">基于市场分析的专业建议</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="text-lg">风险等级</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge className={`text-base py-1 px-3 ${getRiskColor("中")}`}>
                  中风险
                </Badge>
                <p className="text-sm text-muted-foreground mt-4">
                  该投资品种属于中风险等级，请根据自身风险承受能力谨慎投资。
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader>
                <CardTitle className="text-lg">投资建议</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  美股市场流动性充足，适合全球投资者参与。建议关注科技、医疗、消费等优质行业。通过美股ETF可以实现低成本的指数投资。建议采用长期投资策略，定期定额投资美股指数基金。关注美元汇率变化对收益的影响。
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 风险提示 */}
        <section>
          <Card className="border-l-4 border-l-yellow-500 bg-yellow-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-600">
                <AlertCircle className="w-5 h-5" />
                ⚠️ 风险提示
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• 投资存在风险，过往收益不代表未来表现</li>
                <li>• 请根据自身风险承受能力谨慎投资</li>
                <li>• 美股市场受美联储政策影响较大</li>
                <li>• 投资前请充分了解产品细节，如有疑问请咨询投资顾问</li>
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* 咨询按钮 */}
        <section className="flex gap-4 justify-center">
          <InvestmentApplicationForm 
            productName="美股分析" 
            minAmount={1000}
            triggerButtonText="立即投资"
          />
          <Button variant="outline" className="px-8">
            咨询顾问
          </Button>
        </section>
      </main>

      {/* 页脚 */}
      <footer className="border-t border-border bg-card/50 mt-12 py-8">
        <div className="container mx-auto text-center">
          <p className="text-sm text-muted-foreground">© 2026 数金研投 | 投资分析平台</p>
        </div>
      </footer>

      <ScrollToTop />
    </div>
  );
}
