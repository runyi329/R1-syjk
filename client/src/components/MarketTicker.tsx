import { useEffect, useState, useRef } from 'react';
import { ArrowUp, ArrowDown, Clock } from 'lucide-react';
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
  region: 'US' | 'HK' | 'CN' | 'JP' | 'DE' | 'UK';
}

// 初始基准数据（备用）
const INITIAL_DATA: MarketData[] = [
  { symbol: 'SSEC', name: '上证指数', price: 3058.25, change: 12.45, changePercent: 0.41, isOpen: true },
  { symbol: 'HSI', name: '恒生指数', price: 16725.10, change: -158.30, changePercent: -0.94, isOpen: true },
  { symbol: 'IXIC', name: '纳斯达克', price: 16274.94, change: 82.15, changePercent: 0.51, isOpen: false },
  { symbol: 'N225', name: '日经225', price: 32850.50, change: 215.30, changePercent: 0.66, isOpen: true },
  { symbol: 'GDAXI', name: 'DAX', price: 18950.75, change: 125.40, changePercent: 0.67, isOpen: false },
  { symbol: 'XAU', name: '现货黄金', price: 2325.60, change: 15.20, changePercent: 0.66, isOpen: true },
];

const CRYPTO_DATA: MarketData[] = [
  { symbol: 'BTC-USD', name: '比特币', price: 69420.50, change: 1250.00, changePercent: 1.83, isOpen: true },
  { symbol: 'ETH-USD', name: '以太坊', price: 3850.25, change: 125.50, changePercent: 3.37, isOpen: true },
  { symbol: 'BNB-USD', name: '币安币', price: 625.80, change: 18.90, changePercent: 3.11, isOpen: true },
  { symbol: 'SOL-USD', name: '索拉纳', price: 185.50, change: 8.75, changePercent: 4.94, isOpen: true },
  { symbol: 'XRP-USD', name: '瑞波币', price: 2.45, change: 0.15, changePercent: 6.52, isOpen: true },
  { symbol: 'ADA-USD', name: 'Cardano', price: 1.08, change: 0.08, changePercent: 7.41, isOpen: true },
  { symbol: 'DOGE-USD', name: 'Dogecoin', price: 0.42, change: 0.05, changePercent: 13.51, isOpen: true },
];

// 股票符号映射（Yahoo Finance 符号）
const STOCK_SYMBOLS = [
  { display: '上证指数', symbol: '000001.SS', name: '上证指数', region: 'CN' as const, marketHours: { start: 9.5, end: 15 } },
  { display: '恒生指数', symbol: '0700.HK', name: '恒生指数', region: 'HK' as const, marketHours: { start: 9.5, end: 16 } },
  { display: '纳斯达克', symbol: '^IXIC', name: '纳斯达克', region: 'US' as const, marketHours: { start: 13.5, end: 20 } },
  { display: '日经225', symbol: '^N225', name: '日经225', region: 'JP' as const, marketHours: { start: 8, end: 15 } },
  { display: 'DAX', symbol: '^GDAXI', name: 'DAX', region: 'DE' as const, marketHours: { start: 15.5, end: 22 } },
  { display: '现货黄金', symbol: 'GC=F', name: '现货黄金', region: 'US' as const, marketHours: { start: 0, end: 24 } },
];

// 加密货币符号
const CRYPTO_SYMBOLS = [
  { display: '比特币', symbol: 'BTC-USD', name: '比特币', region: 'US' as const, marketHours: { start: 0, end: 24 } },
  { display: '以太坊', symbol: 'ETH-USD', name: '以太坊', region: 'US' as const, marketHours: { start: 0, end: 24 } },
  { display: '币安币', symbol: 'BNB-USD', name: '币安币', region: 'US' as const, marketHours: { start: 0, end: 24 } },
  { display: '索拉纳', symbol: 'SOL-USD', name: '索拉纳', region: 'US' as const, marketHours: { start: 0, end: 24 } },
  { display: '瑞波币', symbol: 'XRP-USD', name: '瑞波币', region: 'US' as const, marketHours: { start: 0, end: 24 } },
  { display: 'Cardano', symbol: 'ADA-USD', name: 'Cardano', region: 'US' as const, marketHours: { start: 0, end: 24 } },
  { display: 'Dogecoin', symbol: 'DOGE-USD', name: 'Dogecoin', region: 'US' as const, marketHours: { start: 0, end: 24 } },
];

// 检查一个指数是否休市
function isMarketClosed(symbol: string): boolean {
  const stockInfo = STOCK_SYMBOLS.find(s => s.symbol === symbol);
  if (!stockInfo || !stockInfo.marketHours) return false;

  const now = new Date();
  const chinaTime = new Date(now.getTime() + (8 - now.getTimezoneOffset() / 60) * 60 * 60 * 1000);
  const hours = chinaTime.getHours() + chinaTime.getMinutes() / 60;
  const dayOfWeek = chinaTime.getDay();

  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const isInMarketHours = hours >= stockInfo.marketHours.start && hours < stockInfo.marketHours.end;
  
  if (symbol === '000001.SS') {
    return isWeekend || !isInMarketHours;
  }
  
  if (symbol === '0700.HK') {
    return isWeekend || !isInMarketHours;
  }
  
  if (symbol === '^IXIC') {
    return isWeekend || !isInMarketHours;
  }
  
  return false;
}

interface MarketTickerRowProps {
  markets: MarketData[];
  direction?: 'left' | 'right';
  rowId: string;
}

function MarketCard({ market }: { market: MarketData }) {
  return (
    <div className="flex flex-col p-3 bg-card rounded-lg border border-border/50 shadow-sm min-w-[140px] hover:shadow-md transition-shadow flex-shrink-0">
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
  );
}

function MarketTickerRow({ markets, direction = 'left', rowId }: MarketTickerRowProps) {
  const [isScrolling, setIsScrolling] = useState(true);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchStartOffset = useRef(0);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsScrolling(false);
    setIsDragging(true);
    touchStartX.current = e.touches[0].clientX;
    touchStartOffset.current = scrollOffset;
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const touchCurrentX = e.touches[0].clientX;
    const diff = touchCurrentX - touchStartX.current;
    setScrollOffset(touchStartOffset.current + diff);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setIsScrolling(true);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsScrolling(false);
    setIsDragging(true);
    touchStartX.current = e.clientX;
    touchStartOffset.current = scrollOffset;
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || e.buttons !== 1) return;
    const diff = e.clientX - touchStartX.current;
    setScrollOffset(touchStartOffset.current + diff);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsScrolling(true);
  };

  // 无缝循环动画 - 使用动态计算的实际宽度
  useEffect(() => {
    if (!isScrolling || isDragging || !trackRef.current || markets.length === 0) return;

    const track = trackRef.current;
    // 根据实际DOM计算实际宽度
    const getActualWidth = () => {
      const children = track.querySelectorAll('[data-market-item]');
      if (children.length === 0) return 0;
      
      // 计算第一个周期的实际宽度（所有markets的宽度 + 所有gaps）
      let totalWidth = 0;
      for (let i = 0; i < markets.length; i++) {
        const rect = children[i]?.getBoundingClientRect();
        if (rect) {
          totalWidth += rect.width;
          // 每个元素后面都加gap（包括最后一个，因为它后面是第一个元素的复制）
          totalWidth += 16;
        }
      }
      return totalWidth;
    };
    
    const singleCycleWidth = getActualWidth();
    if (singleCycleWidth === 0) return;
    
    const ANIMATION_DURATION = 40000; // 40 秒

    const animate = (currentTime: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = currentTime;
      }

      const elapsed = currentTime - lastTimeRef.current;
      const progress = (elapsed % ANIMATION_DURATION) / ANIMATION_DURATION;

      if (direction === 'left') {
        // 从右向左滚动
        const offset = -(progress * singleCycleWidth);
        setScrollOffset(offset);
      } else {
        // 从左向右滚动（向左滚动，需要负值偏移）
        const offset = -(singleCycleWidth - (progress * singleCycleWidth));
        setScrollOffset(offset);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    lastTimeRef.current = 0;
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      lastTimeRef.current = 0;
    };
  }, [isScrolling, isDragging, markets, direction]);

  return (
    <div className="w-full overflow-hidden">
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
        <div 
          ref={trackRef}
          className="flex gap-4 px-1"
          style={{
            transform: `translateX(${scrollOffset}px)`,
            transition: isDragging ? 'none' : 'transform 0.05s linear',
          }}
        >
          {/* 原始数据 + 循环复制，形成无缝循环 */}
          {[...markets, ...markets].map((market, index) => (
            <div key={`${market.symbol}-${index}`} data-market-item>
              <MarketCard market={market} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MarketTickerStocks() {
  const [markets, setMarkets] = useState<MarketData[]>(INITIAL_DATA);
  const [cryptoMarkets, setCryptoMarkets] = useState<MarketData[]>(CRYPTO_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const stocksByRegion = {
    US: STOCK_SYMBOLS.filter(s => s.region === 'US').map(s => s.symbol),
    HK: STOCK_SYMBOLS.filter(s => s.region === 'HK').map(s => s.symbol),
    CN: STOCK_SYMBOLS.filter(s => s.region === 'CN').map(s => s.symbol),
    JP: STOCK_SYMBOLS.filter(s => s.region === 'JP').map(s => s.symbol),
    DE: STOCK_SYMBOLS.filter(s => s.region === 'DE').map(s => s.symbol),
  };

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

  const jpStocksQuery = trpc.market.getMultipleStocks.useQuery(
    {
      symbols: stocksByRegion.JP,
      region: 'JP',
      interval: '1d',
      range: '1d',
    },
    {
      refetchInterval: 30000,
      retry: 2,
      enabled: stocksByRegion.JP.length > 0,
    }
  );

  const deStocksQuery = trpc.market.getMultipleStocks.useQuery(
    {
      symbols: stocksByRegion.DE,
      region: 'DE',
      interval: '1d',
      range: '1d',
    },
    {
      refetchInterval: 30000,
      retry: 2,
      enabled: stocksByRegion.DE.length > 0,
    }
  );

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

  useEffect(() => {
    const allData = [
      ...(cnStocksQuery.data || []),
      ...(hkStocksQuery.data || []),
      ...(usStocksQuery.data || []),
      ...(jpStocksQuery.data || []),
      ...(deStocksQuery.data || []),
    ];

    if (allData.length > 0) {
      setMarkets(allData);
      setIsLoading(false);
    }
  }, [usStocksQuery.data, hkStocksQuery.data, cnStocksQuery.data, jpStocksQuery.data, deStocksQuery.data]);

  useEffect(() => {
    if (cryptoQuery.data && cryptoQuery.data.length > 0) {
      setCryptoMarkets(cryptoQuery.data);
    }
  }, [cryptoQuery.data]);

  return (
    <MarketTickerRow 
      markets={markets} 
      direction="left"
      rowId="row1"
    />
  );
}

function MarketTickerCrypto() {
  const [cryptoMarkets, setCryptoMarkets] = useState<MarketData[]>(CRYPTO_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    if (cryptoQuery.data && cryptoQuery.data.length > 0) {
      setCryptoMarkets(cryptoQuery.data);
    }
  }, [cryptoQuery.data]);

  return (
    <MarketTickerRow 
      markets={cryptoMarkets} 
      direction="right"
      rowId="row2"
    />
  );
}

export function MarketTicker() {
  return (
    <div className="space-y-3">
      <MarketTickerStocks />
      <MarketTickerCrypto />
    </div>
  );
}

export { MarketTickerStocks, MarketTickerCrypto };
