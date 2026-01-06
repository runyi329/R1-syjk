import MarketAnalysis from "./MarketAnalysis";

const config = {
  title: "期权分析",
  description: "期权市场深度分析，把握下行投资机会",
  icon: "📊",
  markets: [
    {
      name: "50ETF看涨期权",
      symbol: "510050C",
      price: 0.85,
      change24h: 2.35,
      high52w: 1.50,
      low52w: 0.20,
      volume: "1000万手/日",
      description: "上证50ETF看涨期权"
    },
    {
      name: "50ETF看跌期权",
      symbol: "510050P",
      price: 0.45,
      change24h: -1.85,
      high52w: 1.20,
      low52w: 0.05,
      volume: "800万手/日",
      description: "上证50ETF看跌期权"
    },
    {
      name: "300ETF看涨期权",
      symbol: "510300C",
      price: 1.25,
      change24h: 1.95,
      high52w: 2.50,
      low52w: 0.30,
      volume: "600万手/日",
      description: "沪深300ETF看涨期权"
    },
    {
      name: "300ETF看跌期权",
      symbol: "510300P",
      price: 0.65,
      change24h: -0.95,
      high52w: 1.80,
      low52w: 0.10,
      volume: "500万手/日",
      description: "沪深300ETF看跌期权"
    }
  ],
  technicalAnalysis: "期权市场近期波动率处于中等水平。看涨期权表现强势，反映市场看多情绪。看跌期权价格下跌，风险对冲需求下降。隐含波动率在15-25%区间，处于历史中等水平。建议投资者关注期权的时间价值衰减和波动率变化。",
  riskLevel: "高" as const,
  investmentAdvice: "期权是高级投资工具，风险较高。建议有丰富交易经验的投资者参与。可用于对冲风险或增强收益。建议学习期权定价模型和风险管理。初期建议从简单策略开始，如买入看涨期权。关注时间价值衰减和隐含波动率变化。"
};

export default function DerivativesOptionsAnalysis() {
  return <MarketAnalysis config={config} />;
}
