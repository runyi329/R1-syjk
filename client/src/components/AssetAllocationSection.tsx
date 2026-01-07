import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

// 资产配置数据
const assetData = {
  bull: [ // 牛市 70%仓位
    { symbol: "BTC", name: "比特币", allocation: 30, color: "#f7931a" },
    { symbol: "ETH", name: "以太坊", allocation: 22, color: "#627eea" },
    { symbol: "SOL", name: "Solana", allocation: 8, color: "#14f195" },
    { symbol: "XRP", name: "瑞波币", allocation: 6, color: "#23292f" },
    { symbol: "BNB", name: "币安币", allocation: 5, color: "#f3ba2f" },
    { symbol: "AAVE", name: "Aave", allocation: 4, color: "#b6509e" },
    { symbol: "LINK", name: "Chainlink", allocation: 4, color: "#2a5ade" },
    { symbol: "OKB", name: "OKB", allocation: 3, color: "#3d5afe" },
    { symbol: "SUI", name: "Sui", allocation: 3, color: "#6fbcee" },
    { symbol: "HBAE", name: "HBAE", allocation: 2, color: "#ff6b6b" },
    { symbol: "ENA", name: "Ethena", allocation: 2, color: "#4ecdc4" },
    { symbol: "APT", name: "Aptos", allocation: 2, color: "#000000" },
    { symbol: "ONDO", name: "Ondo", allocation: 1, color: "#6366f1" },
    { symbol: "ASTER", name: "Aster", allocation: 1, color: "#ec4899" }
  ],
  bear: [ // 熊市 30%仓位
    { symbol: "BTC", name: "比特币", allocation: 20, color: "#f7931a" },
    { symbol: "ETH", name: "以太坊", allocation: 15, color: "#627eea" },
    { symbol: "SOL", name: "Solana", allocation: 3, color: "#14f195" },
    { symbol: "XRP", name: "瑞波币", allocation: 2, color: "#23292f" },
    { symbol: "BNB", name: "币安币", allocation: 2, color: "#f3ba2f" },
    { symbol: "AAVE", name: "Aave", allocation: 1, color: "#b6509e" },
    { symbol: "LINK", name: "Chainlink", allocation: 1, color: "#2a5ade" },
    { symbol: "OKB", name: "OKB", allocation: 1, color: "#3d5afe" },
    { symbol: "SUI", name: "Sui", allocation: 1, color: "#6fbcee" },
    { symbol: "HBAE", name: "HBAE", allocation: 0.5, color: "#ff6b6b" },
    { symbol: "ENA", name: "Ethena", allocation: 0.5, color: "#4ecdc4" },
    { symbol: "APT", name: "Aptos", allocation: 0.5, color: "#000000" },
    { symbol: "ONDO", name: "Ondo", allocation: 0.5, color: "#6366f1" },
    { symbol: "ASTER", name: "Aster", allocation: 0.5, color: "#ec4899" }
  ],
  range: [ // 震荡 50%仓位
    { symbol: "BTC", name: "比特币", allocation: 25, color: "#f7931a" },
    { symbol: "ETH", name: "以太坊", allocation: 18, color: "#627eea" },
    { symbol: "SOL", name: "Solana", allocation: 5, color: "#14f195" },
    { symbol: "XRP", name: "瑞波币", allocation: 4, color: "#23292f" },
    { symbol: "BNB", name: "币安币", allocation: 3, color: "#f3ba2f" },
    { symbol: "AAVE", name: "Aave", allocation: 2, color: "#b6509e" },
    { symbol: "LINK", name: "Chainlink", allocation: 2, color: "#2a5ade" },
    { symbol: "OKB", name: "OKB", allocation: 2, color: "#3d5afe" },
    { symbol: "SUI", name: "Sui", allocation: 2, color: "#6fbcee" },
    { symbol: "HBAE", name: "HBAE", allocation: 1, color: "#ff6b6b" },
    { symbol: "ENA", name: "Ethena", allocation: 1, color: "#4ecdc4" },
    { symbol: "APT", name: "Aptos", allocation: 1, color: "#000000" },
    { symbol: "ONDO", name: "Ondo", allocation: 0.5, color: "#6366f1" },
    { symbol: "ASTER", name: "Aster", allocation: 0.5, color: "#ec4899" }
  ]
};

export default function AssetAllocationSection() {
  const [marketMode, setMarketMode] = useState<"bull" | "bear" | "range">("bull");
  
  const currentData = assetData[marketMode];
  const totalAllocation = currentData.reduce((sum, item) => sum + item.allocation, 0);
  const btcEthTotal = currentData.filter(item => item.symbol === "BTC" || item.symbol === "ETH")
    .reduce((sum, item) => sum + item.allocation, 0);
  
  // 准备饼图数据
  const pieData = currentData.map(item => ({
    name: `${item.symbol} ${item.allocation}%`,
    value: item.allocation,
    color: item.color
  }));

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">资产配置比例</h2>
        <p className="text-muted-foreground mb-6">根据市场行情灵活调整投资组合配置</p>
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



      {/* 配置表格和饼图 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 配置表格 */}
        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">配置详情</CardTitle>
            {/* 统计信息 - 表格上方横排3列 */}
            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="bg-primary/5 rounded p-2">
                <p className="text-xs text-muted-foreground">总仓位</p>
                <p className="text-lg font-bold text-primary">{totalAllocation.toFixed(1)}%</p>
              </div>
              <div className="bg-amber-500/5 rounded p-2">
                <p className="text-xs text-muted-foreground">BTC+ETH占比</p>
                <p className="text-lg font-bold text-amber-600">{btcEthTotal.toFixed(1)}%</p>
              </div>
              <div className="bg-emerald-500/5 rounded p-2">
                <p className="text-xs text-muted-foreground">币种范围</p>
                <p className="text-lg font-bold text-emerald-600">{currentData.length}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 font-semibold">币种</th>
                    <th className="text-left py-3 px-2 font-semibold">名称</th>
                    <th className="text-right py-3 px-2 font-semibold">配置比例</th>
                  </tr>
                </thead>
                <tbody>
                  {currentData.map((item, index) => (
                    <tr key={index} className="border-b border-border/50 hover:bg-muted/50">
                      <td className="py-3 px-2">
                        <span className="font-semibold text-foreground">{item.symbol}</span>
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">{item.name}</td>
                      <td className="py-3 px-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-20 bg-muted rounded-full h-2">
                            <div
                              className="h-2 rounded-full transition-all"
                              style={{
                                width: `${(item.allocation / Math.max(...currentData.map(d => d.allocation))) * 100}%`,
                                backgroundColor: item.color
                              }}
                            ></div>
                          </div>
                          <span className="font-semibold w-10 text-right">{item.allocation}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* 饼图 */}
        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">配置分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name }) => name}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value) => `${value}%`} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 配置说明 */}
      <Card className="border-none shadow-md border-l-4 border-l-primary">
        <CardHeader>
          <CardTitle className="text-lg">配置说明</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="font-semibold mb-2">🐂 牛市模式 (70%仓位)</p>
            <p className="text-sm text-muted-foreground">
              在市场看好时，采用较高的仓位配置，重点配置BTC和ETH（合计52%），同时增加SOL等高成长性币种的配置。
            </p>
          </div>
          <div>
            <p className="font-semibold mb-2">🐻 熊市模式 (30%仓位)</p>
            <p className="text-sm text-muted-foreground">
              在市场不确定时，降低整体仓位，保持BTC和ETH的配置（合计35%），减少高风险币种的配置，保护本金。
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <img src="/consolidation-icon.png" alt="震荡行情" className="w-6 h-6" />
              <p className="font-semibold">震荡模式 (50%仓位)</p>
            </div>
            <p className="text-sm text-muted-foreground">
              在市场波动较大时，采用中等仓位配置，平衡BTC和ETH的配置（合计43%），适度配置其他币种，实现风险与收益的平衡。
            </p>
          </div>
          <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <p className="text-sm font-semibold text-blue-900">💡 风险提示</p>
            <p className="text-sm text-blue-800 mt-2">
              BTC和ETH的持仓合计始终不低于40%，确保投资组合的稳定性和风险可控。所有配置比例仅供参考，实际配置会根据市场情况动态调整。
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
