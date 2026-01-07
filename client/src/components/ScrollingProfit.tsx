import { useEffect, useRef, useState } from 'react';

interface ScrollingProfitProps {
  totalInvestment: number; // 累计投入本金（例如2330）
  className?: string;
}

export default function ScrollingProfit({ totalInvestment, className = '' }: ScrollingProfitProps) {
  const [displayValue, setDisplayValue] = useState(8810000); // 起始累计收益：881万
  const profitRef = useRef(8810000);
  const animationFrameRef = useRef<number | null>(null);
  const nextUpdateTimeRef = useRef(Date.now());
  const dailyIncreaseRef = useRef(0);
  const lastDisplayValueRef = useRef(8810000);
  const digitTransformsRef = useRef<number[]>([]);

  useEffect(() => {
    // 计算每天应该增加的金额 = 投入本金 * 0.52 / 365
    const dailyIncrease = (totalInvestment * 0.52) / 365;
    dailyIncreaseRef.current = dailyIncrease;
    
    // 初始化下一个更新时间
    nextUpdateTimeRef.current = Date.now() + getRandomInterval();
    
    const animate = (): void => {
      const now = Date.now();
      
      // 检查是否到达下一个更新时间
      if (now >= nextUpdateTimeRef.current) {
        // 生成随机间隔时间（0.5-3秒）
        const randomInterval = getRandomInterval();
        const dailySeconds = 365 * 24 * 60 * 60;
        const baseIncrease = (dailyIncreaseRef.current / dailySeconds) * randomInterval;
        
        // 随机调整增加幅度（模拟真实投注的波动，80%-150%之间）
        const adjustmentFactor = 0.8 + Math.random() * 0.7;
        const randomIncrease = baseIncrease * adjustmentFactor;
        
        profitRef.current += randomIncrease;
        
        // 只在数值有明显变化时更新显示
        if (Math.abs(profitRef.current - lastDisplayValueRef.current) >= 0.01) {
          setDisplayValue(profitRef.current);
          triggerRollingAnimation(lastDisplayValueRef.current, profitRef.current);
          lastDisplayValueRef.current = profitRef.current;
        }
        
        // 设置下一个更新时间
        nextUpdateTimeRef.current = now + getRandomInterval();
      }
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [totalInvestment]);

  // 生成随机间隔时间（500ms - 3000ms）
  const getRandomInterval = (): number => {
    return 500 + Math.random() * 2500;
  };

  // 格式化数字为精确到小数点后2位
  const formatNumber = (num: number) => {
    return num.toFixed(2);
  };

  // 触发翻滚动画
  const triggerRollingAnimation = (oldValue: number, newValue: number) => {
    const oldStr = formatNumber(oldValue);
    const newStr = formatNumber(newValue);
    
    // 初始化或重置动画状态
    if (digitTransformsRef.current.length === 0) {
      digitTransformsRef.current = newStr.split('').map(() => 0);
    }
    
    // 更新需要翻滚的数字
    for (let i = 0; i < newStr.length; i++) {
      if (oldStr[i] !== newStr[i]) {
        const oldDigit = parseInt(oldStr[i]) || 0;
        const newDigit = parseInt(newStr[i]) || 0;
        
        // 计算翻滚距离
        let distance = newDigit - oldDigit;
        if (distance < 0) {
          distance += 10;
        }
        
        // 触发翻滚动画
        animateDigitRoll(i, distance);
      }
    }
  };

  // 执行单个数字的翻滚动画
  const animateDigitRoll = (digitIndex: number, distance: number) => {
    const duration = 600; // 动画持续时间
    const startTime = Date.now();
    const startTransform = digitTransformsRef.current[digitIndex] || 0;
    const endTransform = startTransform + distance;
    
    const roll = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // 使用缓动函数
      const easeProgress = easeOutCubic(progress);
      
      // 计算当前的翻滚偏移量
      const currentTransform = startTransform + distance * easeProgress;
      digitTransformsRef.current[digitIndex] = currentTransform;
      
      // 触发重新渲染
      setDisplayValue((prev) => prev);
      
      if (progress < 1) {
        requestAnimationFrame(roll);
      }
    };
    
    roll();
  };

  // 缓动函数
  const easeOutCubic = (t: number) => {
    return 1 - Math.pow(1 - t, 3);
  };

  const displayText = formatNumber(displayValue);
  
  return (
    <div className={className}>
      <p className="text-sm text-muted-foreground mb-2">累计收益</p>
      <div className="relative overflow-hidden py-2">
        <div className="flex items-center justify-start gap-0.5">
          <div className="flex gap-0 font-mono" style={{ perspective: '1000px' }}>
            {displayText.split('').map((char, index) => {
              const transform = digitTransformsRef.current[index] || 0;
              const digitHeight = 2.25; // rem
              const offsetY = -transform * digitHeight;
              
              return (
                <div
                  key={index}
                  className="relative w-6 h-9 overflow-hidden"
                  style={{
                    transformStyle: 'preserve-3d',
                  }}
                >
                  <div
                    className="text-4xl font-bold text-red-500 font-mono tracking-wider tabular-nums leading-none transition-transform"
                    style={{
                      transform: `translateY(${offsetY}rem)`,
                      transitionDuration: '600ms',
                      transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                    }}
                  >
                    {char}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-sm text-muted-foreground ml-2">USDT</p>
        </div>
      </div>
    </div>
  );
}
