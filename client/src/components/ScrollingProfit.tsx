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
          marginLeft: digit === '.' ? '6px' : '0',
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

// 每秒增长金额（约每分钟23 USDT）
const PROFIT_PER_SECOND = 0.38;

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
  // 是否已启动更新循环
  const isRunningRef = useRef(false);
  
  // 每一位数字的下次更新时间
  const nextUpdateTimeRef = useRef<Map<number, number>>(new Map());
  // 每一位数字的连续跳动计数（用于实现快速连跳）
  const burstCountRef = useRef<Map<number, number>>(new Map());
  // 每一位数字是否处于"休息"状态
  const restingRef = useRef<Map<number, boolean>>(new Map());

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

  // 获取随机更新间隔 - 增强随机性和顿挫感
  const getRandomInterval = useCallback((position: number, isBurst: boolean, isResting: boolean): number => {
    // 如果正在休息，返回较长的间隔
    if (isResting) {
      return 500 + Math.random() * 1500; // 500-2000ms 的休息时间
    }
    
    // 如果是连续跳动模式，返回很短的间隔
    if (isBurst) {
      if (position <= 1) {
        return 30 + Math.random() * 50; // 30-80ms 快速连跳
      } else if (position <= 3) {
        return 50 + Math.random() * 80; // 50-130ms
      } else {
        return 80 + Math.random() * 120; // 80-200ms
      }
    }
    
    // 正常模式：大范围随机间隔，制造不确定性
    const baseIntervals: { [key: number]: [number, number] } = {
      0: [50, 800],    // 分的个位：50-800ms 大范围波动
      1: [80, 1000],   // 分的十位：80-1000ms
      3: [150, 1200],  // 角：150-1200ms
      4: [300, 1500],  // 十位：300-1500ms
      5: [500, 2000],  // 百位：500-2000ms
      6: [800, 3000],  // 千位：800-3000ms
    };
    
    const [min, max] = baseIntervals[position] || [1000, 4000];
    
    // 添加额外的随机性：有时候特别快，有时候特别慢
    const randomType = Math.random();
    if (randomType < 0.15) {
      // 15% 概率：特别快
      return min + Math.random() * (max - min) * 0.2;
    } else if (randomType > 0.85) {
      // 15% 概率：特别慢
      return min + (max - min) * 0.8 + Math.random() * (max - min) * 0.2;
    } else {
      // 70% 概率：正常随机
      return min + Math.random() * (max - min);
    }
  }, []);

  // 决定是否进入连续跳动模式或休息模式
  const decideNextMode = useCallback((position: number): { isBurst: boolean; isResting: boolean; count: number } => {
    const random = Math.random();
    
    // 低位数字更容易进入连续跳动模式
    const burstProbability = position <= 1 ? 0.25 : position <= 3 ? 0.15 : 0.08;
    const restProbability = position <= 1 ? 0.12 : position <= 3 ? 0.18 : 0.25;
    
    if (random < burstProbability) {
      // 进入连续跳动模式：连续快速跳动2-5次
      return { isBurst: true, isResting: false, count: 2 + Math.floor(Math.random() * 4) };
    } else if (random < burstProbability + restProbability) {
      // 进入休息模式
      return { isBurst: false, isResting: true, count: 1 };
    } else {
      // 正常模式
      return { isBurst: false, isResting: false, count: 1 };
    }
  }, []);

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
      
      // 初始化每位数字的下次更新时间
      const now = Date.now();
      initialDigits.forEach((_, index) => {
        const position = initialDigits.length - 1 - index;
        nextUpdateTimeRef.current.set(position, now + getRandomInterval(position, false, false));
        burstCountRef.current.set(position, 0);
        restingRef.current.set(position, false);
      });
    } else if (serverData && serverBaseRef.current) {
      // 后续同步：更新基准值
      serverBaseRef.current = {
        amount: serverData.amount,
        timestamp: Date.now()
      };
    }
  }, [serverData, formatNumber, stringToDigits, getRandomInterval]);

  // 主循环：更新实际收益值并驱动数字更新
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
      const newTargetDigits = stringToDigits(formatNumber(profitRef.current));
      targetDigitsRef.current = newTargetDigits;

      // 检查每一位数字是否需要更新
      let hasChanges = false;
      const newCurrentDigits = [...currentDigitsRef.current];
      
      for (let i = 0; i < newTargetDigits.length; i++) {
        const targetDigit = newTargetDigits[i];
        const currentDigit = newCurrentDigits[i];
        
        // 跳过小数点
        if (targetDigit === '.') continue;
        
        // 计算位置（从右到左）
        const position = newTargetDigits.length - 1 - i;
        
        // 检查是否到了该位置的更新时间
        const nextUpdateTime = nextUpdateTimeRef.current.get(position) || 0;
        
        if (now >= nextUpdateTime && targetDigit !== currentDigit) {
          // 更新这一位数字
          newCurrentDigits[i] = targetDigit;
          hasChanges = true;
          
          // 获取当前的连续跳动计数
          let burstCount = burstCountRef.current.get(position) || 0;
          const isResting = restingRef.current.get(position) || false;
          
          if (burstCount > 0) {
            // 还在连续跳动模式中
            burstCount--;
            burstCountRef.current.set(position, burstCount);
            nextUpdateTimeRef.current.set(position, now + getRandomInterval(position, true, false));
          } else if (isResting) {
            // 休息结束
            restingRef.current.set(position, false);
            const nextMode = decideNextMode(position);
            burstCountRef.current.set(position, nextMode.count - 1);
            restingRef.current.set(position, nextMode.isResting);
            nextUpdateTimeRef.current.set(position, now + getRandomInterval(position, nextMode.isBurst, nextMode.isResting));
          } else {
            // 决定下一次的模式
            const nextMode = decideNextMode(position);
            burstCountRef.current.set(position, nextMode.count - 1);
            restingRef.current.set(position, nextMode.isResting);
            nextUpdateTimeRef.current.set(position, now + getRandomInterval(position, nextMode.isBurst, nextMode.isResting));
          }
        } else if (now >= nextUpdateTime && targetDigit === currentDigit) {
          // 即使目标值没变，也要更新下次检查时间，保持节奏
          const nextMode = decideNextMode(position);
          burstCountRef.current.set(position, 0);
          restingRef.current.set(position, false);
          nextUpdateTimeRef.current.set(position, now + getRandomInterval(position, false, false) * 0.5);
        }
      }
      
      if (hasChanges) {
        currentDigitsRef.current = newCurrentDigits;
        setDigits([...newCurrentDigits]);
      }

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
  }, [isLoading, formatNumber, stringToDigits, syncMutation, getRandomInterval, decideNextMode]);

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
