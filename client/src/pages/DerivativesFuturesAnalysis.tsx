import MarketAnalysis from "./MarketAnalysis";

const config = {
  title: "期货分析",
  description: "期货市场专业分析，为您提供投资策略",
  icon: "📈",
  markets: [
    {
      name: "沪深300期货",
      symbol: "IF",
      price: 3950.50,
      change24h: 1.25,
      high52w: 4200.00,
      low52w: 3400.00,
      volume: "500万手/日",
      description: "中国沪深300股指期货"
    },
    {
      name: "中证500期货",
      symbol: "IC",
      price: 5850.75,
      change24h: 2.15,
      high52w: 6500.00,
      low52w: 5000.00,
      volume: "300万手/日",
      description: "中国中证500股指期货"
    },
    {
      name: "上证50期货",
      symbol: "IH",
      price: 4250.25,
      change24h: 0.95,
      high52w: 4600.00,
      low52w: 3800.00,
      volume: "200万手/日",
      description: "中国上证50股指期货"
    },
    {
      name: "国债期货",
      symbol: "T",
      price: 98.50,
      change24h: -0.35,
      high52w: 102.00,
      low52w: 95.00,
      volume: "400万手/日",
      description: "中国10年期国债期货"
    }
  ],
  technicalAnalysis: "期货市场近期受股票市场和宏观经济预期影响。沪深300期货在3900-4000点区间反复争夺，成交量温和。中证500期货表现强势，创新高。国债期货受利率预期影响，价格波动较大。建议投资者关注政策面变化和经济数据发布。",
  riskLevel: "高" as const,
  investmentAdvice: "期货市场具有杠杆特性，风险较高。建议有一定交易经验的投资者参与。采用严格的风险管理策略，设置止损点。关注基差变化和交割日期。建议使用技术分析和基本面分析相结合的策略。初期建议从小额开始，逐步积累经验。"
};

export default function DerivativesFuturesAnalysis() {
  return <MarketAnalysis config={config} />;
}
