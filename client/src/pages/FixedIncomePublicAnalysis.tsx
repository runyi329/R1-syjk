import MarketAnalysis from "./MarketAnalysis";

const config = {
  title: "公募基金分析",
  description: "公募基金投资分析，把握基金选择机会",
  icon: "📑",
  markets: [
    {
      name: "股票型基金",
      symbol: "EQUITYFUND",
      price: 1.85,
      change24h: 1.35,
      high52w: 2.10,
      low52w: 1.50,
      volume: "1000亿元/日",
      description: "股票型基金平均净值"
    },
    {
      name: "混合型基金",
      symbol: "MIXFUND",
      price: 1.65,
      change24h: 0.95,
      high52w: 1.85,
      low52w: 1.40,
      volume: "800亿元/日",
      description: "混合型基金平均净值"
    },
    {
      name: "债券型基金",
      symbol: "BONDFUND",
      price: 1.25,
      change24h: 0.15,
      high52w: 1.35,
      low52w: 1.15,
      volume: "600亿元/日",
      description: "债券型基金平均净值"
    },
    {
      name: "货币型基金",
      symbol: "MONEYFUND",
      price: 1.05,
      change24h: 0.05,
      high52w: 1.08,
      low52w: 1.02,
      volume: "500亿元/日",
      description: "货币型基金平均净值"
    }
  ],
  technicalAnalysis: "公募基金市场近期呈现分化态势。股票型基金受益于市场上升，表现强势。混合型基金表现稳定，风险收益平衡。债券型基金受利率下降影响，收益上升。货币型基金收益稳定，风险最低。建议投资者关注基金经理能力和基金规模。",
  riskLevel: "低" as const,
  investmentAdvice: "公募基金是大众投资者的首选。股票型基金适合长期投资，混合型基金适合平衡投资。债券型基金适合保守投资者，货币型基金适合短期闲置资金。建议采用基金定投策略，分批布局。选择知名基金公司和优秀基金经理的产品。关注基金费率和历史表现。"
};

export default function FixedIncomePublicAnalysis() {
  return <MarketAnalysis config={config} />;
}
