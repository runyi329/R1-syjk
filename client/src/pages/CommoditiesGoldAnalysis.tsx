import MarketAnalysis from "./MarketAnalysis";

const config = {
  title: "黄金白银分析",
  description: "贵金属供给分析，提供保值投资建议",
  icon: "🥇",
  markets: [
    {
      name: "现货黄金",
      symbol: "XAUUSD",
      price: 2150.50,
      change24h: 1.25,
      high52w: 2450,
      low52w: 1850,
      volume: "2000万盎司/日",
      description: "国际现货黄金价格"
    },
    {
      name: "现货白银",
      symbol: "XAGUSD",
      price: 28.75,
      change24h: 2.15,
      high52w: 35.00,
      low52w: 22.50,
      volume: "1.5亿盎司/日",
      description: "国际现货白银价格"
    },
    {
      name: "黄金期货",
      symbol: "GC",
      price: 2155.00,
      change24h: 1.35,
      high52w: 2460,
      low52w: 1860,
      volume: "500万手/日",
      description: "COMEX黄金期货"
    },
    {
      name: "白银期货",
      symbol: "SI",
      price: 29.50,
      change24h: 2.25,
      high52w: 35.50,
      low52w: 23.00,
      volume: "300万手/日",
      description: "COMEX白银期货"
    }
  ],
  technicalAnalysis: "贵金属市场近期受美元走弱和地缘政治风险影响，黄金突破2100美元/盎司。技术面上，黄金形成上升趋势，有望继续上涨。白银表现更加强势，与黄金的比价处于历史低位。美元指数走弱为贵金属提供支撑。建议投资者关注美联储政策和全球经济形势。",
  riskLevel: "低" as const,
  investmentAdvice: "贵金属具有保值增值功能，适合长期投资。黄金是传统避险资产，在经济不确定时期表现较好。建议采用定投策略，分批布局黄金和白银。可通过黄金ETF、期货或现货等多种方式参与。建议黄金配置占总资产的5-10%。"
};

export default function CommoditiesGoldAnalysis() {
  return <MarketAnalysis config={config} />;
}
