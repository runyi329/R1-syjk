import MarketAnalysis from "./MarketAnalysis";

const config = {
  title: "港股分析",
  description: "香港股票市场深度分析，贫富股票投资机会",
  icon: "📊",
  markets: [
    {
      name: "恒生指数",
      symbol: "HSI",
      price: 18500.25,
      change24h: 0.95,
      high52w: 20000,
      low52w: 16500,
      volume: "1.2万亿港元",
      description: "香港主要股票指数"
    },
    {
      name: "恒生科技指数",
      symbol: "HSTECH",
      price: 3850.50,
      change24h: 2.35,
      high52w: 4500,
      low52w: 3200,
      volume: "8000亿港元",
      description: "香港科技股指数"
    },
    {
      name: "国企指数",
      symbol: "HSCEI",
      price: 7200.75,
      change24h: 1.15,
      high52w: 8000,
      low52w: 6500,
      volume: "5000亿港元",
      description: "香港国企股指数"
    },
    {
      name: "恒生中国企业",
      symbol: "HSCEI",
      price: 5850.30,
      change24h: 1.45,
      high52w: 6500,
      low52w: 5000,
      volume: "4000亿港元",
      description: "中国企业在港上市指数"
    }
  ],
  technicalAnalysis: "港股市场近期受全球经济预期影响，呈现宽幅震荡。恒生指数在18000-19000点区间反复测试，成交量温和。科技股表现相对强势，互联网龙头企业吸引资金关注。国企股受政策支持，估值处于历史低位。建议投资者关注中资金融股和消费股的投资机会。",
  riskLevel: "中" as const,
  investmentAdvice: "港股市场国际化程度高，适合有一定投资经验的投资者。建议关注估值低估的蓝筹股和成长性较好的科技股。港股通为内地投资者提供便利，可通过港股通参与投资。建议采用分批布局策略，关注汇率变化。"
};

export default function StocksHKAnalysis() {
  return <MarketAnalysis config={config} />;
}
