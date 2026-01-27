import { useEffect, useState } from 'react';
import { ArrowUp, ArrowDown, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { trpc } from '@/lib/trpc';

interface MarketData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  isOpen: boolean;
}

interface StockSymbol {
  display: string;
  symbol: string;
  name: string;
  region: 'US' | 'HK' | 'CN';
}

// 初始基准数据（备用）
const INITIAL_DATA: MarketData[] = [
  { symbol: 'SSEC', name: '上证指数', price: 3058.25, change: 12.45, changePercent: 0.41, isOpen: true },
  { symbol: 'HSI', name: '恒生指数', price: 16725.10, change: -158.30, changePercent: -0.94, isOpen: true },
  { symbol: 'IXIC', name: '纳斯达克', price: 16274.94, change: 82.15, changePercent: 0.51, isOpen: false },
  { symbol: 'XAU', name: '现货黄金', price: 2325.60, change: 15.20, changePercent: 0.66, isOpen: true },
  { symbol: 'BTC', name: '比特币', price: 69420.50, change: 1250.00, changePercent: 1.83, isOpen: true },
];

// 股票符号映射（Yahoo Finance 符号）
const STOCK_SYMBOLS = [
  { display: '上证指数', symbol: '000001.SS', name: '上证指数', region: 'CN', marketHours: { start: 9.5, end: 15 } }, // 9:30-15:00
  { display: '恒生指数', symbol: '0700.HK', name: '恒生指数', region: 'HK', marketHours: { start: 9.5, end: 16 } }, // 9:30-16:00
  { display: '纳斯达克', symbol: '^IXIC', name: '纳斯达克', region: 'US', marketHours: { start: 13.5, end: 20 } }, // 13:30-20:00 中国时间
  { display: '黄金', symbol: 'GC=F', name: '现货黄金', region: 'US', marketHours: { start: 0, end: 24 } }, // 24/7
  { display: '比特币', symbol: 'BTC-USD', name: '比特币', region: 'US', marketHours: { start: 0, end: 24 } }, // 24/7
];

// 检查一个指数是否休市
function isMarketClosed(symbol: string): boolean {
  const stockInfo = STOCK_SYMBOLS.find(s => s.symbol === symbol);
  if (!stockInfo || !stockInfo.marketHours) return false;

  // 中国时区 (UTC+8)
  const now = new Date();
  const chinaTime = new Date(now.getTime() + (8 - now.getTimezoneOffset() / 60) * 60 * 60 * 1000);
  const hours = chinaTime.getHours() + chinaTime.getMinutes() / 60;
  const dayOfWeek = chinaTime.getDay();

  // 检查是否是需日一至需日五 (0 = 星期日, 6 = 星期六)
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  
  // 检查是否在交易时间内
  const isInMarketHours = hours >= stockInfo.marketHours.start && hours < stockInfo.marketHours.end;
  
  // 中国上证指数仅在工作日交易
  if (symbol === '000001.SS') {
    return isWeekend || !isInMarketHours;
  }
  
  // 恒生指数仅在工作日交易
  if (symbol === '0700.HK') {
    return isWeekend || !isInMarketHours;
  }
  
  // 美股仅在工作日交易
  if (symbol === '^IXIC') {
    return isWeekend || !isInMarketHours;
  }
  
  // 黄金和比特币 24/7 交易
  return false;
}

export function MarketTicker() {
  const [markets, setMarkets] = useState<MarketData[]>(INITIAL_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 获取多个股票数据（分别按 region 获取）
  const stocksByRegion = {
    US: STOCK_SYMBOLS.filter(s => s.region === 'US').map(s => s.symbol),
    HK: STOCK_SYMBOLS.filter(s => s.region === 'HK').map(s => s.symbol),
    CN: STOCK_SYMBOLS.filter(s => s.region === 'CN').map(s => s.symbol),
  };

  // 分别获取不同地区的股票数据
  const usStocksQuery = trpc.market.getMultipleStocks.useQuery(
    {
      symbols: stocksByRegion.US,
      region: 'US',
      interval: '1d',
      range: '1d',
    },
    {
      refetchInterval: 30000,
      retry: 2,
      enabled: stocksByRegion.US.length > 0,
    }
  );

  const hkStocksQuery = trpc.market.getMultipleStocks.useQuery(
    {
      symbols: stocksByRegion.HK,
      region: 'HK',
      interval: '1d',
      range: '1d',
    },
    {
      refetchInterval: 30000,
      retry: 2,
      enabled: stocksByRegion.HK.length > 0,
    }
  );

  const cnStocksQuery = trpc.market.getMultipleStocks.useQuery(
    {
      symbols: stocksByRegion.CN,
      region: 'CN',
      interval: '1d',
      range: '1d',
    },
    {
      refetchInterval: 30000,
      retry: 2,
      enabled: stocksByRegion.CN.length > 0,
    }
  );

  // 当获取到真实数据时，更新市场数据
  useEffect(() => {
    const allData = [
      ...(usStocksQuery.data || []),
      ...(hkStocksQuery.data || []),
      ...(cnStocksQuery.data || []),
    ];

    if (allData.length > 0) {
      const updatedMarkets = allData.map((stock: any) => {
        const symbolInfo = STOCK_SYMBOLS.find(s => s.symbol === stock.symbol);
        return {
          symbol: stock.symbol,
          name: symbolInfo?.name || stock.name,
          price: stock.price,
          change: stock.change,
          changePercent: stock.changePercent,
          isOpen: true,
        };
      });
      setMarkets(updatedMarkets);
      setIsLoading(false);
      setError(null);
    }
  }, [usStocksQuery.data, hkStocksQuery.data, cnStocksQuery.data]);

  // 处理错误
  useEffect(() => {
    if (usStocksQuery.error || hkStocksQuery.error || cnStocksQuery.error) {
      console.error('Failed to fetch stock data:', usStocksQuery.error || hkStocksQuery.error || cnStocksQuery.error);
      setError('无法获取实时数据');
      setIsLoading(false);
    }
  }, [usStocksQuery.error, hkStocksQuery.error, cnStocksQuery.error]);

  // 模拟实时价格波动（仅当没有实时数据时）
  useEffect(() => {
    const isLoading = usStocksQuery.isLoading || hkStocksQuery.isLoading || cnStocksQuery.isLoading;
    const hasData = usStocksQuery.data || hkStocksQuery.data || cnStocksQuery.data;
    if (isLoading || hasData) return;

    const interval = setInterval(() => {
      setMarkets(prevMarkets =>
        prevMarkets.map(market => {
          if (!market.isOpen) return market;

          const volatility = market.price * 0.0005;
          const change = (Math.random() - 0.5) * volatility;
          const newPrice = market.price + change;
          const newChange = market.change + change;
          const newChangePercent = (newChange / (market.price - market.change)) * 100;

          return {
            ...market,
            price: newPrice,
            change: newChange,
            changePercent: newChangePercent,
          };
        })
      );
    }, 2000);

    return () => clearInterval(interval);
  }, [usStocksQuery.isLoading, usStocksQuery.data, hkStocksQuery.isLoading, hkStocksQuery.data, cnStocksQuery.isLoading, cnStocksQuery.data]);

  return (
    <div className="w-full pb-4 md:pb-0">
      {error && (
        <div className="flex items-center gap-2 px-1 mb-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-500">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
      <style>{`
        @keyframes scroll-left {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        .market-ticker-scroll {
          animation: scroll-left 40s linear infinite;
          display: flex;
          gap: 1rem;
        }
        .market-ticker-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
      <div className="w-full overflow-hidden">
        <div className="flex gap-4 px-1 market-ticker-scroll">
          {markets.map((market) => (
            <div
              key={market.symbol}
              className="flex flex-col p-3 bg-card rounded-lg border border-border/50 shadow-sm min-w-[140px] hover:shadow-md transition-shadow flex-shrink-0"
            >
              <div className="flex justify-between items-start mb-1">
                <span className="text-xs font-medium text-muted-foreground">{market.name}</span>
                <div className="flex items-center gap-1">
                  {!market.isOpen && (
                    <Clock className="w-3 h-3 text-muted-foreground" />
                  )}
                  <span
                    className={cn(
                      'text-xs font-medium',
                      market.change >= 0 ? 'text-[var(--danger)]' : 'text-[var(--success)]'
                    )}
                  >
                    ({Math.abs(market.changePercent).toFixed(2)}%)
                  </span>
                </div>
              </div>
              <div className="text-lg font-bold font-mono tracking-tight text-right">
                {market.price.toFixed(2)}
              </div>
              {isMarketClosed(market.symbol) ? (
                <div className="flex items-center justify-end text-xs font-medium text-muted-foreground gap-1">
                  <Clock className="w-3 h-3" />
                  <span>休市</span>
                </div>
              ) : (
                <div
                  className={cn(
                    'flex items-center justify-end text-xs font-medium',
                    market.change >= 0 ? 'text-[var(--danger)]' : 'text-[var(--success)]'
                  )}
                >
                  {market.change >= 0 ? (
                    <ArrowUp className="w-3 h-3 mr-0.5" />
                  ) : (
                    <ArrowDown className="w-3 h-3 mr-0.5" />
                  )}
                  <span>{Math.abs(market.change).toFixed(2)}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
