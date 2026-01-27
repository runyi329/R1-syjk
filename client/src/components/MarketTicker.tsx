import { useEffect, useState, useRef } from 'react';
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

const CRYPTO_DATA: MarketData[] = [
  { symbol: 'BTC-USD', name: '比特币', price: 69420.50, change: 1250.00, changePercent: 1.83, isOpen: true },
  { symbol: 'ETH-USD', name: '以太坊', price: 3850.25, change: 125.50, changePercent: 3.37, isOpen: true },
  { symbol: 'BNB-USD', name: '币安币', price: 625.80, change: 18.90, changePercent: 3.11, isOpen: true },
  { symbol: 'SOL-USD', name: '索拉纳', price: 185.50, change: 8.75, changePercent: 4.94, isOpen: true },
  { symbol: 'XRP-USD', name: '瑞波币', price: 2.45, change: 0.15, changePercent: 6.52, isOpen: true },
];

// 股票符号映射（Yahoo Finance 符号）
const STOCK_SYMBOLS = [
  { display: '上证指数', symbol: '000001.SS', name: '上证指数', region: 'CN', marketHours: { start: 9.5, end: 15 } }, // 9:30-15:00
  { display: '恒生指数', symbol: '0700.HK', name: '恒生指数', region: 'HK', marketHours: { start: 9.5, end: 16 } }, // 9:30-16:00
  { display: '纳斯达克', symbol: '^IXIC', name: '纳斯达克', region: 'US', marketHours: { start: 13.5, end: 20 } }, // 13:30-20:00 中国时间
  { display: '黄金', symbol: 'GC=F', name: '现货黄金', region: 'US', marketHours: { start: 0, end: 24 } }, // 24/7
  { display: '比特币', symbol: 'BTC-USD', name: '比特币', region: 'US', marketHours: { start: 0, end: 24 } }, // 24/7
];

// 加密货币符号
const CRYPTO_SYMBOLS = [
  { display: '比特币', symbol: 'BTC-USD', name: '比特币', region: 'US', marketHours: { start: 0, end: 24 } },
  { display: '以太坊', symbol: 'ETH-USD', name: '以太坊', region: 'US', marketHours: { start: 0, end: 24 } },
  { display: '币安币', symbol: 'BNB-USD', name: '币安币', region: 'US', marketHours: { start: 0, end: 24 } },
  { display: '索拉纳', symbol: 'SOL-USD', name: '索拉纳', region: 'US', marketHours: { start: 0, end: 24 } },
  { display: '瑞波币', symbol: 'XRP-USD', name: '瑞波币', region: 'US', marketHours: { start: 0, end: 24 } },
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

function MarketTickerRow({ markets, direction = 'left' }: { markets: MarketData[], direction?: 'left' | 'right' }) {
  const [isScrolling, setIsScrolling] = useState(true);
  const [scrollOffset, setScrollOffset] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchStartOffset = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsScrolling(false);
    touchStartX.current = e.touches[0].clientX;
    touchStartOffset.current = scrollOffset;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touchCurrentX = e.touches[0].clientX;
    const diff = touchCurrentX - touchStartX.current;
    setScrollOffset(touchStartOffset.current + diff);
  };

  const handleTouchEnd = () => {
    setIsScrolling(true);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsScrolling(false);
    touchStartX.current = e.clientX;
    touchStartOffset.current = scrollOffset;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (e.buttons === 1) {
      const diff = e.clientX - touchStartX.current;
      setScrollOffset(touchStartOffset.current + diff);
    }
  };

  const handleMouseUp = () => {
    setIsScrolling(true);
  };

  return (
    <div className="w-full overflow-hidden">
      <style>{`
        @keyframes scroll-left {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        @keyframes scroll-right {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .market-ticker-scroll-left {
          animation: ${isScrolling ? 'scroll-left' : 'none'} 40s linear infinite;
          display: flex;
          gap: 1rem;
          ${!isScrolling ? `transform: translateX(${scrollOffset}px);` : ''}
        }
        .market-ticker-scroll-right {
          animation: ${isScrolling ? 'scroll-right' : 'none'} 40s linear infinite;
          display: flex;
          gap: 1rem;
          ${!isScrolling ? `transform: translateX(${scrollOffset}px);` : ''}
        }
      `}</style>
      <div 
        ref={containerRef}
        className="w-full overflow-hidden cursor-grab active:cursor-grabbing"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className={cn(
          'flex gap-4 px-1',
          direction === 'left' ? 'market-ticker-scroll-left' : 'market-ticker-scroll-right'
        )}>
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

export function MarketTicker() {
  const [markets, setMarkets] = useState<MarketData[]>(INITIAL_DATA);
  const [cryptoMarkets, setCryptoMarkets] = useState<MarketData[]>(CRYPTO_DATA);
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

  // 获取加密货币数据
  const cryptoSymbols = CRYPTO_SYMBOLS.map(s => s.symbol);
  const cryptoQuery = trpc.market.getMultipleStocks.useQuery(
    {
      symbols: cryptoSymbols,
      region: 'US',
      interval: '1d',
      range: '1d',
    },
    {
      refetchInterval: 30000,
      retry: 2,
      enabled: cryptoSymbols.length > 0,
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

  // 当获取到加密货币数据时，更新加密货币数据
  useEffect(() => {
    if (cryptoQuery.data && cryptoQuery.data.length > 0) {
      const updatedCrypto = cryptoQuery.data.map((crypto: any) => {
        const symbolInfo = CRYPTO_SYMBOLS.find(s => s.symbol === crypto.symbol);
        return {
          symbol: crypto.symbol,
          name: symbolInfo?.name || crypto.name,
          price: crypto.price,
          change: crypto.change,
          changePercent: crypto.changePercent,
          isOpen: true,
        };
      });
      setCryptoMarkets(updatedCrypto);
    }
  }, [cryptoQuery.data]);

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

  // 模拟加密货币价格波动
  useEffect(() => {
    if (cryptoQuery.data && cryptoQuery.data.length > 0) return;

    const interval = setInterval(() => {
      setCryptoMarkets(prevMarkets =>
        prevMarkets.map(market => {
          const volatility = market.price * 0.001; // 加密货币波动更大
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
  }, [cryptoQuery.data]);

  return (
    <div className="w-full space-y-3 pb-4 md:pb-0">
      {error && (
        <div className="flex items-center gap-2 px-1 mb-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-500">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
      {/* 第一行：从右向左滚动 */}
      <MarketTickerRow markets={markets} direction="left" />
      
      {/* 第二行：从左向右滚动 */}
      <MarketTickerRow markets={cryptoMarkets} direction="right" />
    </div>
  );
}
