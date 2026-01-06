import MarketAnalysis from "./MarketAnalysis";

const config = {
  title: "债券分析",
  description: "固定收益产品分析，提供稳健收益方案",
  icon: "💰",
  markets: [
    {
      name: "10年期国债",
      symbol: "T10Y",
      price: 2.45,
      change24h: -0.15,
      high52w: 3.50,
      low52w: 1.80,
      volume: "5000亿元/日",
      description: "中国10年期国债收益率"
    },
    {
      name: "5年期国债",
      symbol: "T5Y",
      price: 2.15,
      change24h: -0.10,
      high52w: 3.20,
      low52w: 1.50,
      volume: "3000亿元/日",
      description: "中国5年期国债收益率"
    },
    {
      name: "企业债指数",
      symbol: "CNBOND",
      price: 105.50,
      change24h: 0.35,
      high52w: 110.00,
      low52w: 100.00,
      volume: "2000亿元/日",
      description: "中国企业债指数"
    },
    {
      name: "可转债指数",
      symbol: "CBOND",
      price: 125.75,
      change24h: 1.25,
      high52w: 135.00,
      low52w: 110.00,
      volume: "1500亿元/日",
      description: "中国可转债指数"
    }
  ],
  technicalAnalysis: "债券市场近期受流动性和利率预期影响。10年期国债收益率在2.3-2.5%区间反复争夺，呈现下降趋势。企业债收益率相对稳定，信用利差处于合理水平。可转债市场活跃，受股市影响较大。建议投资者关注央行政策和经济数据。",
  riskLevel: "低" as const,
  investmentAdvice: "债券是低风险投资品种，适合保守型投资者。国债具有最高的信用等级，收益稳定。企业债收益较高，但需要关注信用风险。可转债兼具债券和股票特性，适合中等风险投资者。建议采用阶梯式投资策略，分散投资期限。"
};

export default function FixedIncomeBondsAnalysis() {
  return <MarketAnalysis config={config} />;
}
