import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, Cell } from "recharts";
import baccaratData from "../data/baccaratData.json";
import { useState } from "react";

// 颜色常量
const COLORS = {
  recommended: "var(--success)", // 绿色
  caution: "var(--warning)",     // 黄色
  not_recommended: "var(--danger)" // 红色
};

const RECOMMENDATION_LABELS = {
  strongly_recommended: "强烈推荐",
  recommended: "推荐",
  caution: "谨慎",
  not_recommended: "不推荐"
};

const RECOMMENDATION_ICONS = {
  strongly_recommended: <CheckCircle className="w-4 h-4 text-[var(--success)]" />,
  recommended: <CheckCircle className="w-4 h-4 text-[var(--success)]" />,
  caution: <AlertTriangle className="w-4 h-4 text-[var(--warning)]" />,
  not_recommended: <XCircle className="w-4 h-4 text-[var(--danger)]" />
};

export default function Home() {
  const [activeTab, setActiveTab] = useState("main");

  // 合并所有数据用于综合图表
  const allData = [
    ...baccaratData.mainBets,
    ...baccaratData.pairBets,
    ...baccaratData.sideBets
  ].sort((a, b) => a.edge - b.edge);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border p-3 rounded-lg shadow-lg">
          <p className="font-bold text-popover-foreground mb-1">{data.name}</p>
          <p className="text-sm text-muted-foreground">庄家优势: <span className="font-mono font-bold text-foreground">{data.edge}%</span></p>
          <p className="text-sm text-muted-foreground">赔率: {data.payout}</p>
          <p className="text-xs mt-2 max-w-[200px] text-muted-foreground">{data.description}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      {/* 头部区域 */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-primary-foreground font-bold text-lg">B</div>
            <h1 className="text-xl font-bold tracking-tight">百家乐数据透视</h1>
          </div>
          <nav className="hidden md:flex gap-6 text-sm font-medium text-muted-foreground">
            <a href="#overview" className="hover:text-foreground transition-colors">总览</a>
            <a href="#analysis" className="hover:text-foreground transition-colors">详细分析</a>
            <a href="#strategy" className="hover:text-foreground transition-colors">策略建议</a>
          </nav>
        </div>
      </header>

      <main className="container mx-auto py-8 space-y-12">
        {/* 英雄区域：核心数据展示 */}
        <section id="overview" className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="col-span-1 md:col-span-2 border-none shadow-sm bg-gradient-to-br from-card to-secondary/50">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">庄家优势 (House Edge)</CardTitle>
              <CardDescription>
                赌场在长期游戏中相对于玩家的数学优势。数值越低，对玩家越有利。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={baccaratData.mainBets} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <XAxis type="number" domain={[0, 15]} hide />
                    <YAxis type="category" dataKey="name" width={100} tick={{fontSize: 12}} />
                    <RechartsTooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
                    <Bar dataKey="edge" radius={[0, 4, 4, 0]} barSize={40}>
                      {baccaratData.mainBets.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.edge < 2 ? "var(--success)" : "var(--danger)"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-l-4 border-l-[var(--success)] shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-[var(--success)]" />
                  最佳投注
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-[var(--success)] mb-1">1.06%</div>
                <p className="text-sm text-muted-foreground font-medium">庄家 (Banker)</p>
                <p className="text-xs text-muted-foreground mt-2">虽然需扣5%佣金，但仍是数学期望值最高的选择。</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-[var(--danger)] shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-[var(--danger)]" />
                  最差投注
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-[var(--danger)] mb-1">14.36%</div>
                <p className="text-sm text-muted-foreground font-medium">和局 (Tie)</p>
                <p className="text-xs text-muted-foreground mt-2">高赔率陷阱。平均每投注100元，预期损失14.36元。</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 详细分析区域 */}
        <section id="analysis" className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">全景数据分析</h2>
              <p className="text-muted-foreground">探索不同投注类型的风险与回报</p>
            </div>
            
            <Tabs defaultValue="main" className="w-full md:w-auto" onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4 md:w-[400px]">
                <TabsTrigger value="main">主要</TabsTrigger>
                <TabsTrigger value="pair">对子</TabsTrigger>
                <TabsTrigger value="side">边注</TabsTrigger>
                <TabsTrigger value="all">全部</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <Card className="border-none shadow-md overflow-hidden">
            <CardContent className="p-6">
              <div className="h-[500px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={activeTab === 'main' ? baccaratData.mainBets : 
                          activeTab === 'pair' ? baccaratData.pairBets : 
                          activeTab === 'side' ? baccaratData.sideBets : allData}
                    layout="vertical"
                    margin={{ top: 20, right: 50, left: 60, bottom: 20 }}
                  >
                    <XAxis type="number" domain={[0, 'auto']} tickFormatter={(val) => `${val}%`} />
                    <YAxis type="category" dataKey="name" width={140} tick={{fontSize: 12, fontWeight: 500}} />
                    <RechartsTooltip content={<CustomTooltip />} cursor={{fill: 'var(--muted)', opacity: 0.2}} />
                    <Bar dataKey="edge" radius={[0, 4, 4, 0]} barSize={30} animationDuration={1000}>
                      {(activeTab === 'main' ? baccaratData.mainBets : 
                        activeTab === 'pair' ? baccaratData.pairBets : 
                        activeTab === 'side' ? baccaratData.sideBets : allData).map((entry, index) => {
                          let color = COLORS.not_recommended;
                          if (entry.edge < 2) color = COLORS.recommended;
                          else if (entry.edge < 5) color = COLORS.caution;
                          return <Cell key={`cell-${index}`} fill={color} />;
                        })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 策略卡片网格 */}
        <section id="strategy" className="space-y-6">
          <h2 className="text-2xl font-bold tracking-tight">详细数据卡片</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allData.map((item, index) => (
              <Card key={index} className="group hover:shadow-md transition-all duration-300 border-border/50 hover:border-primary/20">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-bold">{item.name}</CardTitle>
                    <Badge variant="outline" className={`
                      ${item.edge < 2 ? "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20" : 
                        item.edge < 5 ? "bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/20" : 
                        "bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/20"}
                    `}>
                      {item.edge}% 优势
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">赔率 {item.payout}</span>
                    {item.probability !== "----" && (
                      <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">概率 {item.probability}</span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 min-h-[40px]">{item.description}</p>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    {RECOMMENDATION_ICONS[item.recommendation as keyof typeof RECOMMENDATION_ICONS]}
                    <span className={`
                      ${item.recommendation.includes('not') ? "text-[var(--danger)]" : 
                        item.recommendation === 'caution' ? "text-[var(--warning)]" : "text-[var(--success)]"}
                    `}>
                      {RECOMMENDATION_LABELS[item.recommendation as keyof typeof RECOMMENDATION_LABELS]}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <footer className="border-t border-border pt-8 pb-12 text-center text-sm text-muted-foreground">
          <p className="font-medium">© 2026 澳门潤儀投资有限公司 | 专业百家乐数据分析</p>
          <p className="mt-2 text-xs">赌博有风险，请理性娱乐。本站仅供数据分析参考。</p>
        </footer>
      </main>
    </div>
  );
}
