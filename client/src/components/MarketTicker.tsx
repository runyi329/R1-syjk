import { useState, useRef, useEffect } from 'react';
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
  { symbol: 'BTC-USD', name: '比特币', price: 88500.00, change: 700.00, changePercent: 0.80, isOpen: true },
  { symbol: 'ETH-USD', name: '以太坊', price: 2950.00, change: 75.00, changePercent: 2.61, isOpen: true },
  { symbol: 'BNB-USD', name: '币安币', price: 885.00, change: 14.00, changePercent: 1.61, isOpen: true },
  { symbol: 'SOL-USD', name: '索拉纳', price: 124.50, change: 2.30, changePercent: 1.88, isOpen: true },
  { symbol: 'XRP-USD', name: '瑞波币', price: 1.90, change: 0.02, changePercent: 1.07, isOpen: true },
  { symbol: 'ADA-USD', name: 'Cardano', price: 0.35, change: 0.01, changePercent: 2.94, isOpen: true },
  { symbol: 'DOGE-USD', name: 'Dogecoin', price: 0.12, change: 0.00, changePercent: 0.83, isOpen: true },
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

function MarketCard({ market, source = '' }: { market: MarketData; source?: string }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [priceDirection, setPriceDirection] = useState<'up' | 'down' | null>(null);
  const prevPriceRef = useRef(market.price);

  useEffect(() => {
    if (prevPriceRef.current !== market.price) {
      setIsUpdating(true);
      setPriceDirection(market.price > prevPriceRef.current ? 'up' : 'down');
      prevPriceRef.current = market.price;
      const timer = setTimeout(() => {
        setIsUpdating(false);
        setPriceDirection(null);
      }, 800);
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
              'text-xs font-medium',
              market.change >= 0 ? 'text-[var(--danger)]' : 'text-[var(--success)]'
            )}
          >
            ({Math.abs(market.changePercent).toFixed(2)}%)
          </span>
        </div>
      </div>
      <div className={cn(
        'text-lg font-bold font-mono tracking-tight text-right transition-all duration-300',
        isUpdating && 'scale-110',
        isUpdating && priceDirection === 'up' && 'text-red-500',
        isUpdating && priceDirection === 'down' && 'text-green-500'
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

// 第1行：股票指数（向左滚动）
function MarketTickerStocks() {
  const [stocks, setStocks] = useState<MarketData[]>(INITIAL_DATA);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isScrolling, setIsScrolling] = useState(true);
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

  // 向左滚动动画
  useEffect(() => {
    if (!trackRef.current || !isScrolling || isDragging) return;

    const track = trackRef.current;
    const singleCycleWidth = track.scrollWidth / 2;
    const scrollDuration = 40000; // 40 秒完成一个周期

    const animate = (currentTime: number) => {
      if (startTimeRef.current === 0) {
        startTimeRef.current = currentTime;
      }

      const elapsed = currentTime - startTimeRef.current;
      const progress = (elapsed % scrollDuration) / scrollDuration;
      const newOffset = -progress * singleCycleWidth;

      setScrollOffset(newOffset);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isScrolling, isDragging]);

  const displayMarkets = [...stocks, ...stocks];

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
          <MarketCard key={`${market.symbol}-${index}`} market={market} source="Mock" />
        ))}
      </div>
    </div>
  );
}

// 第2行：加密货币（向右滚动）
function MarketTickerCrypto() {
  const [cryptos, setCryptos] = useState<MarketData[]>(CRYPTO_DATA);
  const [displayCryptos, setDisplayCryptos] = useState<MarketData[]>(CRYPTO_DATA); // 用于显示的数据（带模拟波动）
  const [dataLoaded, setDataLoaded] = useState(false); // 标记真实数据是否已加载
  const [scrollOffset, setScrollOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isScrolling, setIsScrolling] = useState(true);
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

  // 向右滚动动画（从 -singleCycleWidth 开始，移动到 0）
  useEffect(() => {
    if (!trackRef.current || !isScrolling || isDragging) return;

    const track = trackRef.current;
    const singleCycleWidth = track.scrollWidth / 2;
    const scrollDuration = 40000; // 40 秒完成一个周期

    const animate = (currentTime: number) => {
      if (startTimeRef.current === 0) {
        startTimeRef.current = currentTime;
      }

      const elapsed = currentTime - startTimeRef.current;
      const progress = (elapsed % scrollDuration) / scrollDuration;
      // 从 -singleCycleWidth 开始，逐渐移动到 0
      const newOffset = -singleCycleWidth + progress * singleCycleWidth;

      setScrollOffset(newOffset);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isScrolling, isDragging]);

  // 获取欧易加密货币数据
  useEffect(() => {
    const fetchCryptoData = async () => {
      try {
        console.log('[MarketTicker] Fetching OKX data...');
        const response = await fetch('https://www.okx.com/api/v5/market/tickers?instType=SPOT');
        console.log('[MarketTicker] Response status:', response.status, response.statusText);
        
        if (!response.ok) {
          throw new Error(`OKX API error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        const allData = result.data || [];
        console.log('[MarketTicker] Received', allData.length, 'tickers from OKX');

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
            price: parseFloat(price.toFixed(4)), // 保留 4 位小数，让变化更明显
            change: parseFloat(change.toFixed(2)),
            changePercent: parseFloat(changePercent.toFixed(2)),
            isOpen: true,
          };
        });

        console.log('[MarketTicker] Updated crypto prices:', updatedCryptos.map(c => `${c.name}: $${c.price.toLocaleString()}`));
        setCryptos(updatedCryptos);
        setDisplayCryptos(updatedCryptos); // 同步更新显示数据
        setDataLoaded(true); // 标记数据已加载
      } catch (error) {
        console.error('[MarketTicker] Error fetching OKX data:', error);
        console.log('[MarketTicker] Using fallback CRYPTO_DATA');
      }
    };

    fetchCryptoData();
    const interval = setInterval(fetchCryptoData, 5000); // 5 秒更新一次

    return () => clearInterval(interval);
  }, []);

  // 模拟价格波动效果（每 0.5-1 秒随机更新一次）
  useEffect(() => {
    // 只在真实数据加载后才开始模拟波动
    if (!dataLoaded) return;
    const simulateFluctuation = () => {
      setDisplayCryptos(prevDisplay => 
        prevDisplay.map((crypto, index) => {
          const baseCrypto = cryptos[index];
          if (!baseCrypto) return crypto;

          // 在真实价格基础上增加 ±0.5% 的随机波动
          const fluctuation = (Math.random() - 0.5) * 0.01; // ±0.5%
          const newPrice = baseCrypto.price * (1 + fluctuation);
          const priceChange = newPrice - baseCrypto.price;

          return {
            ...baseCrypto,
            price: parseFloat(newPrice.toFixed(2)), // 保留2位小数，确保变化明显
            change: parseFloat((baseCrypto.change + priceChange).toFixed(2)),
          };
        })
      );
    };

    // 随机间隔 500-1000ms
    const scheduleNext = () => {
      const delay = 500 + Math.random() * 500;
      return setTimeout(() => {
        simulateFluctuation();
        timeoutRef.current = scheduleNext();
      }, delay);
    };

    const timeoutRef = { current: scheduleNext() };

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [cryptos, dataLoaded]);

  const displayMarkets = [...displayCryptos, ...displayCryptos];

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
          <MarketCard key={`${market.symbol}-${index}`} market={market} source="OKX" />
        ))}
      </div>
    </div>
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
