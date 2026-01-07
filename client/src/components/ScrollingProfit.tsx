import { useEffect, useRef, useState } from 'react';

interface ScrollingProfitProps {
  totalInvestment: number; // 累计投入本金
  className?: string;
}

export default function ScrollingProfit({ totalInvestment, className = '' }: ScrollingProfitProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [displayDigits, setDisplayDigits] = useState<string[]>([]);
  const profitRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const lastUpdateRef = useRef(0);

  useEffect(() => {
    // 每秒增加的金额 = 累计投入本金 * 0.52 / 365 / 24 / 60 / 60
    const secondlyIncrease = (totalInvestment * 0.52) / (365 * 24 * 60 * 60);
    
    const startTime = Date.now();
    
    const animate = (): void => {
      const elapsed = (Date.now() - startTime) / 1000; // 转换为秒
      const newProfit = elapsed * secondlyIncrease;
      
      profitRef.current = newProfit;
      
      // 每100ms更新一次显示，创建滚动效果
      if (Date.now() - lastUpdateRef.current > 50) {
        setDisplayValue(newProfit);
        lastUpdateRef.current = Date.now();
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

  // 格式化数字为精确到小数点后3位
  const formatNumber = (num: number) => {
    return num.toFixed(3);
  };

  // 创建滚动效果的数字显示
  const displayText = formatNumber(displayValue);
  
  return (
    <div className={className}>
      <p className="text-sm text-muted-foreground mb-2">累计收益</p>
      <div className="relative overflow-hidden py-2">
        <div className="flex items-center justify-end gap-1">
          <p className="text-4xl font-bold text-red-500 font-mono tracking-wider tabular-nums transition-all duration-75">
            {displayText}
          </p>
          <p className="text-sm text-muted-foreground ml-2">USDT</p>
        </div>
      </div>
    </div>
  );
}
