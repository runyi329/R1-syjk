import { useState, useEffect, useRef, memo } from 'react';

interface ScrollingProfitProps {
  totalInvestment: number;
  className?: string;
}

// 单个数字滚轮组件 - 老虎机式翻滚效果（统一从下往上滚动）
const DigitRoller = memo(({ digit, delay = 0 }: { digit: string; delay?: number }) => {
  const [displayDigit, setDisplayDigit] = useState(digit);
  const [previousDigit, setPreviousDigit] = useState(digit);
  const [animationPhase, setAnimationPhase] = useState<'idle' | 'animating'>('idle');
  const isFirstRender = useRef(true);

  useEffect(() => {
    // 跳过首次渲染
    if (isFirstRender.current) {
      isFirstRender.current = false;
      setDisplayDigit(digit);
      setPreviousDigit(digit);
      return;
    }

    // 只有当数字真正变化时才触发动画
    if (digit !== displayDigit) {
      // 保存当前显示的数字作为"旧数字"
      setPreviousDigit(displayDigit);
      // 开始动画
      setAnimationPhase('animating');
      
      // 延迟后更新显示数字
      const timer = setTimeout(() => {
        setDisplayDigit(digit);
        // 动画结束后重置状态
        setTimeout(() => {
          setAnimationPhase('idle');
        }, 300);
      }, delay);
      
      return () => clearTimeout(timer);
    }
  }, [digit, displayDigit, delay]);

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
          transform: animationPhase === 'animating' ? 'translateY(-100%)' : 'translateY(0)',
          transition: animationPhase === 'animating' ? 'transform 0.3s ease-out' : 'none',
          opacity: animationPhase === 'animating' ? 0 : 1
        }}
      >
        {animationPhase === 'animating' ? previousDigit : displayDigit}
      </span>
      
      {/* 新数字 - 从下方滚入（只在动画时显示） */}
      {animationPhase === 'animating' && (
        <span
          className="absolute inset-0 flex items-center justify-center text-red-500"
          style={{
            transform: 'translateY(0)',
            animation: 'slideUpFromBottom 0.3s ease-out forwards'
          }}
        >
          {digit}
        </span>
      )}
    </span>
  );
});

DigitRoller.displayName = 'DigitRoller';

// 持久化存储的键名
const STORAGE_KEY = 'scrolling_profit_data';

interface ProfitData {
  baseProfit: number; // 基础累计收益
  lastTimestamp: number; // 上次保存的时间戳
  totalInvestment: number; // 总投资额
}

// 从 localStorage 获取或初始化累计收益数据
const getProfitData = (totalInvestment: number): ProfitData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored) as ProfitData;
      // 如果总投资额改变，重置数据
      if (data.totalInvestment !== totalInvestment) {
        const newData: ProfitData = {
          baseProfit: 8810000,
          lastTimestamp: Date.now(),
          totalInvestment
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
        return newData;
      }
      return data;
    }
  } catch (error) {
    console.error('Failed to parse profit data from localStorage:', error);
  }

  // 首次初始化
  const initialData: ProfitData = {
    baseProfit: 8810000,
    lastTimestamp: Date.now(),
    totalInvestment
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
  return initialData;
};

// 保存累计收益数据到 localStorage
const saveProfitData = (data: ProfitData) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save profit data to localStorage:', error);
  }
};

export default function ScrollingProfit({ totalInvestment, className = '' }: ScrollingProfitProps) {
  const [displayValue, setDisplayValue] = useState(8810000);
  const profitRef = useRef(8810000);
  const nextUpdateTimeRef = useRef(Date.now());
  const dailyIncreaseRef = useRef(0);
  const profitDataRef = useRef<ProfitData | null>(null);
  const lastSaveTimeRef = useRef(Date.now());

  // 生成随机间隔时间（0.5-3秒）
  const getRandomInterval = () => 500 + Math.random() * 2500;

  useEffect(() => {
    // 初始化：从 localStorage 恢复数据
    const profitData = getProfitData(totalInvestment);
    profitDataRef.current = profitData;

    // 计算从上次保存到现在应该增长的金额
    const timeSinceLastSave = Date.now() - profitData.lastTimestamp;
    const dailyIncrease = (totalInvestment * 0.52) / 365;
    const dailySeconds = 365 * 24 * 60 * 60;
    const increasePerMs = dailyIncrease / dailySeconds;
    const accumulatedIncrease = increasePerMs * timeSinceLastSave;

    // 设置初始值为基础值 + 累积增长
    const initialProfit = profitData.baseProfit + accumulatedIncrease;
    profitRef.current = initialProfit;
    setDisplayValue(initialProfit);

    dailyIncreaseRef.current = dailyIncrease;
    nextUpdateTimeRef.current = Date.now() + getRandomInterval();
    lastSaveTimeRef.current = Date.now();

    let animationFrameId: number;

    const animate = () => {
      const now = Date.now();

      if (now >= nextUpdateTimeRef.current) {
        const randomInterval = getRandomInterval();
        const dailySeconds = 365 * 24 * 60 * 60;
        const baseIncrease = (dailyIncreaseRef.current / dailySeconds) * randomInterval;
        const adjustmentFactor = 0.8 + Math.random() * 0.7;
        const randomIncrease = baseIncrease * adjustmentFactor;

        profitRef.current += randomIncrease;
        setDisplayValue(profitRef.current);

        nextUpdateTimeRef.current = now + getRandomInterval();
      }

      // 每10秒保存一次数据到 localStorage
      if (now - lastSaveTimeRef.current >= 10000) {
        if (profitDataRef.current) {
          profitDataRef.current.baseProfit = profitRef.current;
          profitDataRef.current.lastTimestamp = now;
          saveProfitData(profitDataRef.current);
          lastSaveTimeRef.current = now;
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    // 页面卸载时保存最后的数据
    const handleBeforeUnload = () => {
      if (profitDataRef.current) {
        profitDataRef.current.baseProfit = profitRef.current;
        profitDataRef.current.lastTimestamp = Date.now();
        saveProfitData(profitDataRef.current);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // 卸载时保存最后的数据
      if (profitDataRef.current) {
        profitDataRef.current.baseProfit = profitRef.current;
        profitDataRef.current.lastTimestamp = Date.now();
        saveProfitData(profitDataRef.current);
      }
    };
  }, [totalInvestment]);

  // 格式化数字为字符串
  const formattedValue = displayValue.toFixed(2);

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
          {formattedValue.split('').map((char, index) => (
            <DigitRoller 
              key={index} 
              digit={char}
              delay={index * 20} // 每个数字稍微延迟，产生波浪效果
            />
          ))}
        </span>
        <span className="text-sm text-muted-foreground ml-2">USDT</span>
      </div>
    </div>
  );
}
