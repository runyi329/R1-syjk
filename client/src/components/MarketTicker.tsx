import { useEffect, useState } from 'react';
import { ArrowUp, ArrowDown, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MarketData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  isOpen: boolean;
}

// 初始基准数据
const INITIAL_DATA: MarketData[] = [
  { symbol: 'SSEC', name: '上证指数', price: 3058.25, change: 12.45, changePercent: 0.41, isOpen: true },
  { symbol: 'HSI', name: '恒生指数', price: 16725.10, change: -158.30, changePercent: -0.94, isOpen: true },
  { symbol: 'IXIC', name: '纳斯达克', price: 16274.94, change: 82.15, changePercent: 0.51, isOpen: false }, // 假设美股休市
  { symbol: 'XAU', name: '现货黄金', price: 2325.60, change: 15.20, changePercent: 0.66, isOpen: true },
  { symbol: 'BTC', name: '比特币', price: 69420.50, change: 1250.00, changePercent: 1.83, isOpen: true },
];

export function MarketTicker() {
  const [markets, setMarkets] = useState<MarketData[]>(INITIAL_DATA);

  useEffect(() => {
    // 模拟实时价格波动
    const interval = setInterval(() => {
      setMarkets(prevMarkets => 
        prevMarkets.map(market => {
          if (!market.isOpen) return market; // 休市不波动

          // 随机波动逻辑
          const volatility = market.price * 0.0005; // 0.05% 波动幅度
          const change = (Math.random() - 0.5) * volatility;
          const newPrice = market.price + change;
          const newChange = market.change + change;
          const newChangePercent = (newChange / (market.price - market.change)) * 100;

          return {
            ...market,
            price: newPrice,
            change: newChange,
            changePercent: newChangePercent
          };
        })
      );
    }, 2000); // 每2秒更新一次

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full overflow-x-auto pb-4 md:pb-0">
      <div className="flex gap-4 min-w-max px-1">
        {markets.map((market) => (
          <div 
            key={market.symbol} 
            className="flex flex-col p-3 bg-card rounded-lg border border-border/50 shadow-sm min-w-[140px] hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-1">
              <span className="text-xs font-medium text-muted-foreground">{market.name}</span>
              <div className="flex items-center gap-1">
                {!market.isOpen && (
                  <Clock className="w-3 h-3 text-muted-foreground" />
                )}
                <span className={cn(
                  "text-xs font-medium",
                  market.change >= 0 ? "text-[var(--danger)]" : "text-[var(--success)]"
                )}>
                  ({Math.abs(market.changePercent).toFixed(2)}%)
                </span>
              </div>
            </div>
            <div className="text-lg font-bold font-mono tracking-tight text-right">
              {market.price.toFixed(2)}
            </div>
            <div className={cn(
              "flex items-center justify-end text-xs font-medium",
              market.change >= 0 ? "text-[var(--danger)]" : "text-[var(--success)]" // 中国大陆：红涨绿跌
            )}>
              {market.change >= 0 ? <ArrowUp className="w-3 h-3 mr-0.5" /> : <ArrowDown className="w-3 h-3 mr-0.5" />}
              <span>{Math.abs(market.change).toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
