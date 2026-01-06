import MarketAnalysis from "./MarketAnalysis";

const config = {
  title: "原油分析",
  description: "能源市场供需分析，把握能源投资机会",
  icon: "⛽",
  markets: [
    {
      name: "WTI原油",
      symbol: "CL",
      price: 78.50,
      change24h: -1.25,
      high52w: 95.00,
      low52w: 65.00,
      volume: "2000万桶/日",
      description: "美国WTI轻质原油"
    },
    {
      name: "布伦特原油",
      symbol: "BRENT",
      price: 82.75,
      change24h: -0.85,
      high52w: 100.00,
      low52w: 70.00,
      volume: "2500万桶/日",
      description: "北海布伦特原油"
    },
    {
      name: "天然气",
      symbol: "NG",
      price: 3.25,
      change24h: 2.35,
      high52w: 5.50,
      low52w: 2.50,
      volume: "1500亿立方英尺/日",
      description: "美国天然气期货"
    },
    {
      name: "汽油期货",
      symbol: "RB",
      price: 2.45,
      change24h: -0.95,
      high52w: 3.50,
      low52w: 1.80,
      volume: "1000万桶/日",
      description: "NYMEX汽油期货"
    }
  ],
  technicalAnalysis: "原油市场近期受全球经济增长预期和地缘政治因素影响。WTI原油在75-85美元/桶区间反复争夺，技术面形成三角形态。布伦特原油相对强势，与WTI价差扩大。天然气受季节性因素影响，价格波动较大。建议投资者关注OPEC+减产决议和全球经济数据。",
  riskLevel: "高" as const,
  investmentAdvice: "原油市场波动性大，适合有风险承受能力的投资者。建议采用技术分析和基本面分析相结合的策略。关注全球经济形势、地缘政治风险和库存数据。可通过原油期货、ETF或基金参与。建议设置严格的止损点，控制风险。"
};

export default function CommoditiesOilAnalysis() {
  return <MarketAnalysis config={config} />;
}
