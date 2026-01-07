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
        const randomSeconds = randomInterval / 1000; // 转换为秒
        
        // 计算这个随机间隔内应该增加的金额
        // 基础增加 = 每天增加 / (24*60*60秒) * 随机间隔毫秒数
        const dailySeconds = 365 * 24 * 60 * 60;
        const baseIncrease = (dailyIncreaseRef.current / dailySeconds) * randomInterval;
        
        // 随机调整增加幅度（模拟真实投注的波动，80%-150%之间）
        const adjustmentFactor = 0.8 + Math.random() * 0.7;
        const randomIncrease = baseIncrease * adjustmentFactor;
        
        profitRef.current += randomIncrease;
        setDisplayValue(profitRef.current);
        
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

  // 格式化数字为精确到小数点后2位，左对齐
  const formatNumber = (num: number) => {
    return num.toFixed(2);
  };

  const displayText = formatNumber(displayValue);
  
  return (
    <div className={className}>
      <p className="text-sm text-muted-foreground mb-2">累计收益</p>
      <div className="relative overflow-hidden py-2">
        <div className="flex items-center justify-start gap-1">
          <p className="text-4xl font-bold text-red-500 font-mono tracking-wider tabular-nums transition-all duration-75">
            {displayText}
          </p>
          <p className="text-sm text-muted-foreground ml-2">USDT</p>
        </div>
      </div>
    </div>
  );
}
