import MarketAnalysis from "./MarketAnalysis";

const config = {
  title: "外汇交易分析",
  description: "全球主要货币对比，提供实时汇率数据和交易信号",
  icon: "💱",
  markets: [
    {
      name: "欧美",
      symbol: "EURUSD",
      price: 1.0850,
      change24h: 0.35,
      high52w: 1.1200,
      low52w: 0.9800,
      volume: "3.5万亿美元/日",
      description: "欧元兑美元"
    },
    {
      name: "英美",
      symbol: "GBPUSD",
      price: 1.2750,
      change24h: 0.45,
      high52w: 1.3200,
      low52w: 1.1800,
      volume: "2.8万亿美元/日",
      description: "英镑兑美元"
    },
    {
      name: "美日",
      symbol: "USDJPY",
      price: 148.50,
      change24h: -0.25,
      high52w: 152.00,
      low52w: 140.00,
      volume: "2.2万亿美元/日",
      description: "美元兑日元"
    },
    {
      name: "美加",
      symbol: "USDCAD",
      price: 1.3250,
      change24h: 0.15,
      high52w: 1.3800,
      low52w: 1.2200,
      volume: "1.8万亿美元/日",
      description: "美元兑加元"
    }
  ],
  technicalAnalysis: "外汇市场近期受全球经济数据和央行政策影响。欧美在1.08-1.10区间反复争夺，英美突破1.27关键阻力位。美日受日本央行政策影响，在148-150区间震荡。技术面上，多个货币对形成上升趋势。建议投资者关注各国经济数据发布和央行会议。",
  riskLevel: "高" as const,
  investmentAdvice: "外汇市场具有高杠杆特性，风险较高。建议有一定交易经验的投资者参与。采用严格的风险管理策略，设置止损点。关注主要经济数据发布（非农数据、CPI等）带来的波动。建议使用技术分析和基本面分析相结合的策略。"
};

export default function ForexAnalysis() {
  return <MarketAnalysis config={config} />;
}
