import { useState, useEffect, useRef, memo } from 'react';

interface ScrollingProfitProps {
  totalInvestment: number;
  className?: string;
}

// 单个数字滚轮组件 - 老虎机式翻滚效果
const DigitRoller = memo(({ digit, delay = 0 }: { digit: string; delay?: number }) => {
  const [currentDigit, setCurrentDigit] = useState(digit);
  const [prevDigit, setPrevDigit] = useState(digit);
  const [isAnimating, setIsAnimating] = useState(false);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // 跳过首次渲染
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (digit !== currentDigit) {
      setPrevDigit(currentDigit);
      setIsAnimating(true);
      
      // 延迟更新当前数字，让动画有时间显示
      const timer = setTimeout(() => {
        setCurrentDigit(digit);
        // 动画结束后重置状态
        setTimeout(() => {
          setIsAnimating(false);
        }, 300);
      }, delay);
      
      return () => clearTimeout(timer);
    }
  }, [digit, currentDigit, delay]);

  // 非数字字符（小数点）不需要动画
  if (digit === '.' || digit === ',' || digit === ' ') {
    return (
      <span className="inline-block text-red-500" style={{ width: digit === '.' ? '0.3em' : '0.6em' }}>
        {digit}
      </span>
    );
  }

  return (
    <span 
      className="inline-block relative"
      style={{ 
        width: '0.6em',
        height: '1.2em',
        overflow: 'hidden'
      }}
    >
      {/* 旧数字 - 向上滚出 */}
      <span
        className="absolute inset-0 flex items-center justify-center text-red-500"
        style={{
          transform: isAnimating ? 'translateY(-100%)' : 'translateY(0)',
          transition: 'transform 0.3s ease-out',
          opacity: isAnimating ? 0 : 1
        }}
      >
        {isAnimating ? prevDigit : currentDigit}
      </span>
      
      {/* 新数字 - 从下方滚入 */}
      {isAnimating && (
        <span
          className="absolute inset-0 flex items-center justify-center text-red-500"
          style={{
            transform: 'translateY(0)',
            animation: 'rollUp 0.3s ease-out forwards'
          }}
        >
          {digit}
        </span>
      )}
    </span>
  );
});

DigitRoller.displayName = 'DigitRoller';

export default function ScrollingProfit({ totalInvestment, className = '' }: ScrollingProfitProps) {
  const [displayValue, setDisplayValue] = useState(8810000);
  const profitRef = useRef(8810000);
  const nextUpdateTimeRef = useRef(Date.now());
  const dailyIncreaseRef = useRef(0);

  // 生成随机间隔时间（0.5-3秒）
  const getRandomInterval = () => 500 + Math.random() * 2500;

  useEffect(() => {
    const dailyIncrease = (totalInvestment * 0.52) / 365;
    dailyIncreaseRef.current = dailyIncrease;
    nextUpdateTimeRef.current = Date.now() + getRandomInterval();

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

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [totalInvestment]);

  // 格式化数字为字符串
  const formattedValue = displayValue.toFixed(2);

  return (
    <div className={`${className}`}>
      <style>{`
        @keyframes rollUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
      <p className="text-sm text-muted-foreground mb-2">累计收益</p>
      <div 
        className="flex items-center"
        style={{ overflow: 'hidden' }}
      >
        <span 
          className="text-3xl sm:text-4xl font-bold font-mono tabular-nums inline-flex"
          style={{ overflow: 'hidden' }}
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
