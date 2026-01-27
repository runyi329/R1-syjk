import { useState, useRef, useEffect } from 'react';
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
  source?: string;
}

function MarketCard({ market, source = '' }: { market: MarketData; source?: string }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const prevPriceRef = useRef(market.price);

  useEffect(() => {
    if (prevPriceRef.current !== market.price) {
      setIsUpdating(true);
      prevPriceRef.current = market.price;
      const timer = setTimeout(() => setIsUpdating(false), 600);
      return () => clearTimeout(timer);
    }
  }, [market.price]);

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
              'text-xs font-medium transition-all',
              isUpdating && 'animate-pulse',
              market.change >= 0 ? 'text-[var(--danger)]' : 'text-[var(--success)]'
            )}
          >
            ({Math.abs(market.changePercent).toFixed(2)}%)
          </span>
        </div>
      </div>
      <div className={cn(
        'text-lg font-bold font-mono tracking-tight text-right transition-all',
        isUpdating && 'animate-pulse'
      )}>
        {market.price.toFixed(2)}
      </div>
      <div className="flex items-center justify-between mt-1">
        {isMarketClosed(market.symbol) ? (
          <div className="flex items-center text-xs font-medium text-muted-foreground gap-1">
            <Clock className="w-3 h-3" />
            <span>休市</span>
          </div>
        ) : (
          <div
            className={cn(
              'flex items-center text-xs font-medium',
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
        {source && (
          <span className="text-[10px] text-muted-foreground/60">{source}</span>
        )}
      </div>
    </div>
  );
}

function MarketTickerRow({ markets, direction = 'left', rowId, source = '' }: MarketTickerRowProps) {
  const [isScrolling, setIsScrolling] = useState(true);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchStartOffset = useRef(0);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

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
    const diff = e.touches[0].clientX - touchStartX.current;
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
    if (!isDragging) return;
    const diff = e.clientX - touchStartX.current;
    setScrollOffset(touchStartOffset.current + diff);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsScrolling(true);
  };

  // 滚动动画
  useEffect(() => {
    if (!trackRef.current || !isScrolling || isDragging) return;

    const track = trackRef.current;
    const singleCycleWidth = track.scrollWidth / 2; // 单个周期的宽度
    const scrollDuration = 40000; // 40 秒完成一个周期

    const animate = (currentTime: number) => {
      if (startTimeRef.current === 0) {
        startTimeRef.current = currentTime;
      }

      const elapsed = currentTime - startTimeRef.current;
      const progress = (elapsed % scrollDuration) / scrollDuration; // 0 到 1 的循环进度
      
      let newOffset: number;
      if (direction === 'left') {
        // 从右向左滚动（内容向左移动，所以是负值）
        newOffset = -progress * singleCycleWidth;
      } else {
        // 从左向右滚动（内容向右移动，所以是正值）
        newOffset = progress * singleCycleWidth;
      }

      setScrollOffset(newOffset);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isScrolling, isDragging, direction]);

  const displayMarkets = [...markets, ...markets];

  return (
    <div
      ref={containerRef}
      className="w-full overflow-hidden"
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
        className={cn(
          'flex gap-4',
          isDragging ? '' : 'transition-transform duration-[50ms]'
        )}
        style={{
          transform: `translateX(${scrollOffset}px)`,
        }}
      >
        {displayMarkets.map((market, index) => (
          <MarketCard key={`${market.symbol}-${index}`} market={market} source={source} />
        ))}
      </div>
    </div>
  );
}

export function MarketTickerStocks() {
  const [stocks, setStocks] = useState<MarketData[]>(INITIAL_DATA);

  return (
    <MarketTickerRow
      markets={stocks}
      direction="left"
      rowId="stocks"
      source="Mock"
    />
  );
}

export function MarketTickerCrypto() {
  const [cryptos, setCryptos] = useState<MarketData[]>(CRYPTO_DATA);

  // 获取欧易加密货币数据
  useEffect(() => {
    const fetchCryptoData = async () => {
      try {
        const response = await fetch('https://www.okx.com/api/v5/market/tickers?instType=SPOT');
        if (!response.ok) throw new Error('OKX API error');

        const result = await response.json();
        const allData = result.data || [];

        const symbols = ['BTC-USDT', 'ETH-USDT', 'BNB-USDT', 'SOL-USDT', 'XRP-USDT', 'ADA-USDT', 'DOGE-USDT'];
        const nameMap: Record<string, string> = {
          'BTC-USDT': '比特币',
          'ETH-USDT': '以太坊',
          'BNB-USDT': '币安币',
          'SOL-USDT': '索拉纳',
          'XRP-USDT': '瑞波币',
          'ADA-USDT': 'Cardano',
          'DOGE-USDT': 'Dogecoin',
        };

        const updatedCryptos = symbols.map((instId) => {
          const tickerData = allData.find((t: any) => t.instId === instId);

          if (!tickerData) {
            return CRYPTO_DATA.find(c => c.name === nameMap[instId]) || CRYPTO_DATA[0];
          }

          const price = parseFloat(tickerData.last) || 0;
          const open24h = parseFloat(tickerData.open24h) || price;
          const changePercent = ((price - open24h) / open24h) * 100;
          const change = price - open24h;

          return {
            symbol: instId,
            name: nameMap[instId],
            price: parseFloat(price.toFixed(2)),
            change: parseFloat(change.toFixed(2)),
            changePercent: parseFloat(changePercent.toFixed(2)),
            isOpen: true,
          };
        });

        setCryptos(updatedCryptos);
      } catch (error) {
        console.error('Error fetching OKX data:', error);
      }
    };

    fetchCryptoData();
    const interval = setInterval(fetchCryptoData, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <MarketTickerRow
      markets={cryptos}
      direction="right"
      rowId="crypto"
      source="OKX"
    />
  );
}

export function MarketTicker() {
  return (
    <div className="w-full space-y-4">
      <MarketTickerStocks />
      <MarketTickerCrypto />
    </div>
  );
}
