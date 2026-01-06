import MarketAnalysis from "./MarketAnalysis";

const config = {
  title: "农产品分析",
  description: "农业商品供给分析，把握季节性投资机会",
  icon: "🌾",
  markets: [
    {
      name: "玉米期货",
      symbol: "ZC",
      price: 425.50,
      change24h: 1.35,
      high52w: 550.00,
      low52w: 350.00,
      volume: "500万手/日",
      description: "CBOT玉米期货"
    },
    {
      name: "大豆期货",
      symbol: "ZS",
      price: 1050.75,
      change24h: 0.95,
      high52w: 1350.00,
      low52w: 850.00,
      volume: "300万手/日",
      description: "CBOT大豆期货"
    },
    {
      name: "小麦期货",
      symbol: "ZWH",
      price: 580.25,
      change24h: -0.45,
      high52w: 750.00,
      low52w: 480.00,
      volume: "200万手/日",
      description: "CBOT小麦期货"
    },
    {
      name: "糖期货",
      symbol: "SB",
      price: 22.50,
      change24h: 2.15,
      high52w: 28.00,
      low52w: 18.00,
      volume: "400万手/日",
      description: "ICE原糖期货"
    }
  ],
  technicalAnalysis: "农产品市场近期受全球供给和需求预期影响。玉米在420-450美分/蒲式耳区间反复争夺，大豆突破1000美分关键位置。小麦受地缘政治影响，价格波动较大。糖价受巴西产量预期影响，呈现上升趋势。建议投资者关注全球天气预报和农业部产量预测。",
  riskLevel: "中" as const,
  investmentAdvice: "农产品具有季节性特征，适合把握季节性投资机会。建议关注全球供给形势和天气变化。采用技术分析和基本面分析相结合的策略。可通过农产品期货、ETF或基金参与。建议分散投资，不要过度集中在单一品种。"
};

export default function CommoditiesAgAnalysis() {
  return <MarketAnalysis config={config} />;
}
