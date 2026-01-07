import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";

// 资产配置数据
const assetData = {
  bull: [ // 牛市 70%仓位
    { symbol: "BTC", name: "比特币", allocation: 30, color: "#f7931a" },
    { symbol: "ETH", name: "以太坊", allocation: 22, color: "#00d4ff" },
    { symbol: "SOL", name: "Solana", allocation: 8, color: "#14f195" },
    { symbol: "XRP", name: "瑞波币", allocation: 6, color: "#00bfff" },
    { symbol: "BNB", name: "币安币", allocation: 5, color: "#f3ba2f" },
    { symbol: "AAVE", name: "Aave", allocation: 4, color: "#dda0dd" },
    { symbol: "LINK", name: "Chainlink", allocation: 4, color: "#87ceeb" },
    { symbol: "OKB", name: "OKB", allocation: 3, color: "#9370db" },
    { symbol: "SUI", name: "Sui", allocation: 3, color: "#87cefa" },
    { symbol: "HBAE", name: "HBAE", allocation: 2, color: "#ff6b6b" },
    { symbol: "ENA", name: "Ethena", allocation: 2, color: "#20b2aa" },
    { symbol: "APT", name: "Aptos", allocation: 2, color: "#ffd700" },
    { symbol: "ONDO", name: "Ondo", allocation: 1, color: "#9370db" },
    { symbol: "ASTER", name: "Aster", allocation: 1, color: "#ff69b4" }
  ],
  bear: [ // 熊市 30%仓位
    { symbol: "BTC", name: "比特币", allocation: 20, color: "#f7931a" },
    { symbol: "ETH", name: "以太坊", allocation: 15, color: "#00d4ff" },
    { symbol: "SOL", name: "Solana", allocation: 3, color: "#14f195" },
    { symbol: "XRP", name: "瑞波币", allocation: 2, color: "#00bfff" },
    { symbol: "BNB", name: "币安币", allocation: 2, color: "#f3ba2f" },
    { symbol: "AAVE", name: "Aave", allocation: 1, color: "#dda0dd" },
    { symbol: "LINK", name: "Chainlink", allocation: 1, color: "#87ceeb" },
    { symbol: "OKB", name: "OKB", allocation: 1, color: "#9370db" },
    { symbol: "SUI", name: "Sui", allocation: 1, color: "#87cefa" },
    { symbol: "HBAE", name: "HBAE", allocation: 0.5, color: "#ff6b6b" },
    { symbol: "ENA", name: "Ethena", allocation: 0.5, color: "#20b2aa" },
    { symbol: "APT", name: "Aptos", allocation: 0.5, color: "#ffd700" },
    { symbol: "ONDO", name: "Ondo", allocation: 0.5, color: "#9370db" },
    { symbol: "ASTER", name: "Aster", allocation: 0.5, color: "#ff69b4" }
  ],
  range: [ // 震荡 50%仓位
    { symbol: "BTC", name: "比特币", allocation: 25, color: "#f7931a" },
    { symbol: "ETH", name: "以太坊", allocation: 18, color: "#00d4ff" },
    { symbol: "SOL", name: "Solana", allocation: 5, color: "#14f195" },
    { symbol: "XRP", name: "瑞波币", allocation: 4, color: "#00bfff" },
    { symbol: "BNB", name: "币安币", allocation: 3, color: "#f3ba2f" },
    { symbol: "AAVE", name: "Aave", allocation: 2, color: "#dda0dd" },
    { symbol: "LINK", name: "Chainlink", allocation: 2, color: "#87ceeb" },
    { symbol: "OKB", name: "OKB", allocation: 2, color: "#9370db" },
    { symbol: "SUI", name: "Sui", allocation: 2, color: "#87cefa" },
    { symbol: "HBAE", name: "HBAE", allocation: 1, color: "#ff6b6b" },
    { symbol: "ENA", name: "Ethena", allocation: 1, color: "#20b2aa" },
    { symbol: "APT", name: "Aptos", allocation: 1, color: "#ffd700" },
    { symbol: "ONDO", name: "Ondo", allocation: 0.5, color: "#9370db" },
    { symbol: "ASTER", name: "Aster", allocation: 0.5, color: "#ff69b4" }
  ]
};

// 动画数字组件
function AnimatedNumber({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const [displayValue, setDisplayValue] = useState(value);
  
  useEffect(() => {
    let animationFrame: number;
    let currentValue = displayValue;
    const targetValue = value;
    const duration = 600;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOutQuad = 1 - Math.pow(1 - progress, 2);
      currentValue = displayValue + (targetValue - displayValue) * easeOutQuad;
      
      setDisplayValue(parseFloat(currentValue.toFixed(decimals)));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, displayValue, decimals]);
  
  return <>{decimals > 0 ? displayValue.toFixed(decimals) : Math.round(displayValue)}</>;
}

export default function AssetAllocationSection() {
  const [marketMode, setMarketMode] = useState<"bull" | "bear" | "range">("bull");
  
  const currentData = assetData[marketMode];
  const totalAllocation = currentData.reduce((sum, item) => sum + item.allocation, 0);
  const btcEthTotal = currentData.filter(item => item.symbol === "BTC" || item.symbol === "ETH")
    .reduce((sum, item) => sum + item.allocation, 0);
  
  // 根据行情模式设置预期仓位
  const expectedAllocation = {
    bull: 70,
    bear: 30,
    range: 50
  }[marketMode];
  
  // 准备饼图数据
  const pieData = currentData.map(item => ({
    name: item.name,
    symbol: item.symbol,
    value: item.allocation,
    color: item.color
  }));

  // 获取除BTC和ETH外的其他币种
  const otherCoins = pieData.filter(item => item.symbol !== "BTC" && item.symbol !== "ETH");

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">资产配置比例</h2>
        <p className="text-muted-foreground mb-4">根据市场行情灵活调整投资组合配置</p>
      </div>

      {/* 市场模式切换 - 手机版本3列布局 */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
        <Button
          onClick={() => setMarketMode("bull")}
          variant={marketMode === "bull" ? "default" : "outline"}
          className="px-2 sm:px-4 text-xs sm:text-sm whitespace-nowrap"
        >
          🐂 牛市行情
        </Button>
        <Button
          onClick={() => setMarketMode("bear")}
          variant={marketMode === "bear" ? "default" : "outline"}
          className="px-2 sm:px-4 text-xs sm:text-sm whitespace-nowrap"
        >
          🐻 熊市行情
        </Button>
        <Button
          onClick={() => setMarketMode("range")}
          variant={marketMode === "range" ? "default" : "outline"}
          className="px-2 sm:px-4 text-xs sm:text-sm whitespace-nowrap"
        >
          📊 震荡行情
        </Button>
      </div>

      {/* 配置详情卡片 - 紧凑布局 */}
      <Card className="border-none shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">配置详情</CardTitle>
          {/* 统计信息 - 紧凑3列 */}
          <div className="grid grid-cols-3 gap-2 mt-2">
            <div className="bg-primary/5 rounded p-2 transition-all duration-300">
              <p className="text-xs text-muted-foreground">总仓位</p>
              <p className="text-base font-bold text-primary transition-all duration-300"><AnimatedNumber value={expectedAllocation} decimals={0} />%</p>
            </div>
            <div className="bg-amber-500/5 rounded p-2">
              <p className="text-xs text-muted-foreground">主流币占比</p>
              <p className="text-base font-bold text-amber-600"><AnimatedNumber value={btcEthTotal} decimals={1} />%</p>
            </div>
            <div className="bg-emerald-500/5 rounded p-2">
              <p className="text-xs text-muted-foreground">币种范围</p>
              <p className="text-base font-bold text-emerald-600"><AnimatedNumber value={currentData.length} decimals={0} /></p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 配置分布饼图 - 左右并排布局 */}
      <Card className="border-none shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">配置分布</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full flex flex-col lg:flex-row gap-4">
            {/* 饼图部分 - 靠左 */}
            <div className="w-full lg:w-2/5 flex-shrink-0 h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ symbol, value }) => {
                      // 仅显示BTC和ETH的标签在饼图内部
                      if (symbol === "BTC" || symbol === "ETH") {
                        return symbol;
                      }
                      return '';
                    }}
                    outerRadius={70}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value) => `${value}%`}
                    contentStyle={{
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      border: 'none',
                      borderRadius: '4px',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            
            {/* 小币种列表 - 靠右，每行2个，7-8行 */}
            <div className="w-full lg:w-3/5 bg-blue-500/10 rounded-lg p-3 border border-blue-500/20 max-h-[240px] overflow-y-auto">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {otherCoins.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm font-medium text-foreground">{item.symbol}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
