import { useState, useEffect, useRef, memo, useCallback } from 'react';
import { trpc } from '@/lib/trpc';

interface ScrollingProfitProps {
  totalInvestment: number;
  className?: string;
}

// 单个数字滚轮组件 - 独立跳动，每位数字有自己的节奏
const DigitRoller = memo(({ 
  digit, 
  position,
  onAnimationComplete 
}: { 
  digit: string; 
  position: number; // 0=最右边（分的个位），1=分的十位，2=角，3=元个位...
  onAnimationComplete?: () => void;
}) => {
  const [displayDigit, setDisplayDigit] = useState(digit);
  const [previousDigit, setPreviousDigit] = useState(digit);
  const [isAnimating, setIsAnimating] = useState(false);
  const isFirstRender = useRef(true);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 跳过首次渲染
    if (isFirstRender.current) {
      isFirstRender.current = false;
      setDisplayDigit(digit);
      setPreviousDigit(digit);
      return;
    }

    // 只有当数字真正变化时才触发动画
    if (digit !== displayDigit && !isAnimating) {
      setPreviousDigit(displayDigit);
      setIsAnimating(true);
      
      // 动画持续时间根据位置不同而不同
      // 低位（分）动画快，高位（元）动画慢
      const animationDuration = position <= 1 ? 150 : position <= 3 ? 200 : 250;
      
      animationTimeoutRef.current = setTimeout(() => {
        setDisplayDigit(digit);
        setTimeout(() => {
          setIsAnimating(false);
          onAnimationComplete?.();
        }, animationDuration);
      }, 0);
    }

    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, [digit, displayDigit, isAnimating, position, onAnimationComplete]);

  // 非数字字符（小数点、逗号）不需要动画
  if (digit === '.' || digit === ',' || digit === ' ') {
    return (
      <span 
        className="inline-block text-red-500" 
        style={{ 
          width: digit === '.' ? '8px' : '12px',
          textAlign: 'center',
          marginRight: digit === '.' ? '6px' : '0'
        }}
      >
        {digit}
      </span>
    );
  }

  // 动画速度根据位置调整
  const transitionDuration = position <= 1 ? '0.15s' : position <= 3 ? '0.2s' : '0.25s';

  return (
    <span 
      className="inline-block relative"
      style={{ 
        width: '22px',
        height: '1.2em',
        overflow: 'hidden'
      }}
    >
      {/* 当前/旧数字 - 动画时向上滚出 */}
      <span
        className="absolute inset-0 flex items-center justify-center text-red-500"
        style={{
          transform: isAnimating ? 'translateY(-100%)' : 'translateY(0)',
          transition: isAnimating ? `transform ${transitionDuration} ease-out, opacity ${transitionDuration} ease-out` : 'none',
          opacity: isAnimating ? 0 : 1
        }}
      >
        {isAnimating ? previousDigit : displayDigit}
      </span>
      
      {/* 新数字 - 从下方滚入 */}
      {isAnimating && (
        <span
          className="absolute inset-0 flex items-center justify-center text-red-500"
          style={{
            animation: `slideUpFromBottom ${transitionDuration} ease-out forwards`
          }}
        >
          {digit}
        </span>
      )}
    </span>
  );
});

DigitRoller.displayName = 'DigitRoller';

// 每秒增长金额（约每秒2元平均）
const PROFIT_PER_SECOND = 2;

export default function ScrollingProfit({ totalInvestment, className = '' }: ScrollingProfitProps) {
  // 每一位数字的当前值
  const [digits, setDigits] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const profitRef = useRef(8810000);
  const serverBaseRef = useRef<{ amount: number; timestamp: number } | null>(null);
  
  // 每一位数字独立的更新计时器
  const digitTimersRef = useRef<Map<number, NodeJS.Timeout>>(new Map());
  // 每一位数字的目标值
  const targetDigitsRef = useRef<string[]>([]);
  // 每一位数字的当前显示值
  const currentDigitsRef = useRef<string[]>([]);

  // 获取服务端累计收益数据
  const { data: serverData, refetch } = trpc.cumulativeProfit.getCurrent.useQuery(undefined, {
    refetchInterval: 60000, // 每60秒从服务端同步一次
    staleTime: 30000,
  });

  // 同步数据到服务端
  const syncMutation = trpc.cumulativeProfit.sync.useMutation();

  // 格式化数字为固定格式的字符串
  const formatNumber = useCallback((value: number): string => {
    return value.toFixed(2);
  }, []);

  // 将数字字符串转换为数字数组（从右到左）
  const stringToDigits = useCallback((str: string): string[] => {
    return str.split('');
  }, []);

  // 获取每一位数字的更新间隔（毫秒）
  // position: 0=最右边（分的个位），越大越靠左
  const getUpdateInterval = useCallback((position: number): number => {
    // 基础间隔 + 随机波动，让跳动更自然
    const randomFactor = 0.5 + Math.random() * 1.0; // 0.5 - 1.5 的随机因子
    
    if (position === 0) {
      // 分的个位：最快，50-150ms
      return (50 + Math.random() * 100) * randomFactor;
    } else if (position === 1) {
      // 分的十位：次快，100-300ms
      return (100 + Math.random() * 200) * randomFactor;
    } else if (position === 2) {
      // 小数点：不更新
      return Infinity;
    } else if (position === 3) {
      // 角（元的个位）：较快，200-500ms
      return (200 + Math.random() * 300) * randomFactor;
    } else if (position === 4) {
      // 十位：中等，400-800ms
      return (400 + Math.random() * 400) * randomFactor;
    } else if (position === 5) {
      // 百位：较慢，800-1500ms
      return (800 + Math.random() * 700) * randomFactor;
    } else if (position === 6) {
      // 千位：慢，1500-3000ms
      return (1500 + Math.random() * 1500) * randomFactor;
    } else {
      // 万位及以上：很慢，3000-6000ms
      return (3000 + Math.random() * 3000) * randomFactor;
    }
  }, []);

  // 更新单个数字位
  const updateDigitAtPosition = useCallback((position: number) => {
    const targetDigit = targetDigitsRef.current[position];
    const currentDigit = currentDigitsRef.current[position];
    
    // 如果是小数点，不更新
    if (targetDigit === '.' || currentDigit === '.') {
      return;
    }
    
    // 如果目标值和当前值不同，更新显示
    if (targetDigit !== currentDigit) {
      currentDigitsRef.current[position] = targetDigit;
      setDigits([...currentDigitsRef.current]);
    }
    
    // 设置下一次更新
    const nextInterval = getUpdateInterval(position);
    if (nextInterval !== Infinity) {
      const timer = setTimeout(() => {
        updateDigitAtPosition(position);
      }, nextInterval);
      digitTimersRef.current.set(position, timer);
    }
  }, [getUpdateInterval]);

  // 启动所有数字位的独立更新循环
  const startDigitUpdates = useCallback(() => {
    // 清除所有现有计时器
    digitTimersRef.current.forEach((timer) => clearTimeout(timer));
    digitTimersRef.current.clear();
    
    // 为每一位数字启动独立的更新循环
    const numDigits = currentDigitsRef.current.length;
    for (let i = 0; i < numDigits; i++) {
      // 跳过小数点
      if (currentDigitsRef.current[i] === '.') continue;
      
      // 每一位数字有不同的初始延迟，让启动更自然
      const initialDelay = Math.random() * getUpdateInterval(i);
      const timer = setTimeout(() => {
        updateDigitAtPosition(i);
      }, initialDelay);
      digitTimersRef.current.set(i, timer);
    }
  }, [getUpdateInterval, updateDigitAtPosition]);

  // 当服务端数据加载完成后初始化
  useEffect(() => {
    if (serverData && !serverBaseRef.current) {
      // 首次加载服务端数据
      serverBaseRef.current = {
        amount: serverData.amount,
        timestamp: Date.now()
      };
      profitRef.current = serverData.amount;
      
      const initialDigits = stringToDigits(formatNumber(serverData.amount));
      currentDigitsRef.current = [...initialDigits];
      targetDigitsRef.current = [...initialDigits];
      setDigits(initialDigits);
      setIsLoading(false);
      
      // 启动数字更新循环
      startDigitUpdates();
    } else if (serverData && serverBaseRef.current) {
      // 后续同步：更新基准值
      serverBaseRef.current = {
        amount: serverData.amount,
        timestamp: Date.now()
      };
    }
  }, [serverData, formatNumber, stringToDigits, startDigitUpdates]);

  // 主循环：更新实际收益值
  useEffect(() => {
    if (isLoading) return;

    let animationFrameId: number;
    let lastSyncTime = Date.now();

    const animate = () => {
      const now = Date.now();
      
      // 基于服务端基准值 + 本地时间差计算当前值
      if (serverBaseRef.current) {
        const timeSinceBase = (now - serverBaseRef.current.timestamp) / 1000;
        profitRef.current = serverBaseRef.current.amount + (timeSinceBase * PROFIT_PER_SECOND);
      }
      
      // 更新目标数字
      targetDigitsRef.current = stringToDigits(formatNumber(profitRef.current));

      // 每30秒同步一次数据到服务端
      if (now - lastSyncTime >= 30000) {
        syncMutation.mutate();
        lastSyncTime = now;
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    // 页面卸载时同步数据到服务端
    const handleBeforeUnload = () => {
      syncMutation.mutate();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      // 清除所有数字更新计时器
      digitTimersRef.current.forEach((timer) => clearTimeout(timer));
      digitTimersRef.current.clear();
      
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isLoading, formatNumber, stringToDigits, syncMutation]);

  // 计算每个字符的位置（从右到左，用于确定更新速度）
  const getPosition = (index: number, totalLength: number): number => {
    return totalLength - 1 - index;
  };

  // 加载中显示
  if (isLoading) {
    return (
      <div className={`${className}`}>
        <p className="text-sm text-muted-foreground mb-2">累计收益</p>
        <div className="flex items-end">
          <span className="text-3xl sm:text-4xl font-bold font-mono tabular-nums text-red-500">
            加载中...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <style>{`
        @keyframes slideUpFromBottom {
          0% {
            transform: translateY(100%);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
      <p className="text-sm text-muted-foreground mb-2">累计收益</p>
      <div 
        className="flex items-end"
        style={{ justifyContent: 'flex-start' }}
      >
        <span 
          className="text-3xl sm:text-4xl font-bold font-mono tabular-nums flex"
          style={{ textAlign: 'left' }}
        >
          {digits.map((char, index) => (
            <DigitRoller 
              key={index} 
              digit={char}
              position={getPosition(index, digits.length)}
            />
          ))}
        </span>
        <span className="text-sm text-muted-foreground ml-2">USDT</span>
      </div>
    </div>
  );
}
