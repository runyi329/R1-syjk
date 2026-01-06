import MarketAnalysis from "./MarketAnalysis";

const config = {
  title: "美股分析",
  description: "美国股票市场全球投资机会，提供丰富的投资选择",
  icon: "📊",
  markets: [
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
  ],
  technicalAnalysis: "美股市场近期受美联储政策预期影响，科技股表现强势。纳斯达克创新高，大型科技公司（FAANG）继续领涨。标普500指数在5900-6000点区间反复争夺，成交量温和。小盘股表现相对滞后，但估值吸引力较大。建议投资者关注美联储利率决策和企业盈利预期。",
  riskLevel: "中" as const,
  investmentAdvice: "美股市场流动性充足，适合全球投资者参与。建议关注科技、医疗、消费等优质行业。通过美股ETF可以实现低成本的指数投资。建议采用长期投资策略，定期定额投资美股指数基金。关注美元汇率变化对收益的影响。"
};

export default function StocksUSAnalysis() {
  return <MarketAnalysis config={config} />;
}
