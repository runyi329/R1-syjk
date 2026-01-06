import MarketAnalysis from "./MarketAnalysis";

const config = {
  title: "A股分析",
  description: "流动性最强的中国股票市场，提供实时数据分析和投资建议",
  icon: "📊",
  markets: [
    {
      name: "上证指数",
      symbol: "SSE",
      price: 3250.45,
      change24h: 1.25,
      high52w: 3500,
      low52w: 2800,
      volume: "2.5万亿",
      description: "上海证券交易所主要指数"
    },
    {
      name: "深证成指",
      symbol: "SZSE",
      price: 10850.30,
      change24h: 2.15,
      high52w: 11500,
      low52w: 9200,
      volume: "1.8万亿",
      description: "深圳证券交易所主要指数"
    },
    {
      name: "创业板指",
      symbol: "CYB",
      price: 2150.75,
      change24h: 3.45,
      high52w: 2500,
      low52w: 1800,
      volume: "8000亿",
      description: "创业板综合指数"
    },
    {
      name: "沪深300",
      symbol: "HS300",
      price: 3950.20,
      change24h: 0.85,
      high52w: 4200,
      low52w: 3400,
      volume: "1.2万亿",
      description: "沪深300指数"
    }
  ],
  technicalAnalysis: "A股市场近期呈现震荡上升态势。上证指数在3200-3300区间反复争夺，成交量温和放大。技术面上，日线形成双底形态，有望突破前期高点。创业板表现强势，新能源、半导体等板块领涨。建议投资者关注政策面变化，逢低布局优质成长股。",
  riskLevel: "中" as const,
  investmentAdvice: "A股市场流动性充足，适合中长期投资。建议采用定投策略，分批布局优质蓝筹股和成长股。关注政策支持力度，把握结构性机会。风险承受能力较强的投资者可适当配置创业板和科技股。"
};

export default function StocksAAnalysis() {
  return <MarketAnalysis config={config} />;
}
