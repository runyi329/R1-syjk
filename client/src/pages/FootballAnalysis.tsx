import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ScrollToTop from "@/components/ScrollToTop";
import { Badge } from "@/components/ui/badge";
import { Info, AlertTriangle, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, Cell } from "recharts";
import footballData from "../data/footballData.json";
import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";

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

export default function FootballAnalysis() {
  const [selectedData, setSelectedData] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const handleBarClick = (data: any) => {
    if (!isDesktop) {
      setSelectedData(data);
      setIsDrawerOpen(true);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (isDesktop && active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border p-3 rounded-lg shadow-lg min-w-[200px] z-50 relative">
          <p className="font-bold text-popover-foreground mb-1">{data.name}</p>
          <p className="text-sm text-muted-foreground">庄家抽水 (Margin): <span className="font-mono font-bold text-foreground">{data.edge}%</span></p>
          <p className="text-sm text-muted-foreground">赔率范围: {data.payout}</p>
          <p className="text-xs mt-2 text-muted-foreground whitespace-normal break-words">{data.description}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen pb-20 md:pb-0 bg-background font-sans text-foreground">
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="text-xl font-bold">{selectedData?.name}</DrawerTitle>
            <DrawerDescription>
              <div className="mt-4 space-y-4">
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="text-muted-foreground">庄家抽水</span>
                  <span className="font-mono font-bold text-xl text-foreground">{selectedData?.edge}%</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="text-muted-foreground">赔率范围</span>
                  <span className="font-mono font-medium text-foreground">{selectedData?.payout}</span>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-foreground leading-relaxed">{selectedData?.description}</p>
                </div>
              </div>
            </DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">关闭</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
      {/* 头部区域 */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm z-10">
        <div className="container mx-auto py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" className="mr-2">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <img src="/logo.png" alt="数金研投 Logo" className="w-8 h-8 rounded-lg shadow-[0_0_10px_rgba(var(--primary),0.3)]" />
            <h1 className="text-xl font-bold tracking-tight">足球博彩数据透视</h1>
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
              <CardTitle className="text-2xl font-bold">庄家抽水 (Bookmaker Margin)</CardTitle>
              <CardDescription>
                不同足球盘口的庄家理论利润率。数值越低，赔率对玩家越公平。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={footballData.markets} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <XAxis type="number" domain={[0, 25]} hide />
                    <YAxis type="category" dataKey="name" width={100} tick={{fontSize: 11}} />
                    <RechartsTooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} wrapperStyle={{ zIndex: 100 }} />
                    <Bar 
                      dataKey="edge" 
                      radius={[0, 4, 4, 0]} 
                      barSize={40} 
                      label={{ position: 'insideLeft', fill: '#fff', fontSize: 11, formatter: (val: any) => `${val}%` }}
                      onClick={(data) => handleBarClick(data)}
                      style={{ cursor: 'pointer' }}
                    >
                      {footballData.markets.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.edge < 3 ? "var(--success)" : entry.edge < 8 ? "var(--warning)" : "var(--danger)"} />
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
                  最佳盘口
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-[var(--success)] mb-1">~2.5%</div>
                <p className="text-sm text-muted-foreground font-medium">亚盘 (Asian Handicap)</p>
                <p className="text-xs text-muted-foreground mt-2">只有两个选项，水位通常最低，长期回报率最高。</p>
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
                <div className="text-4xl font-bold text-[var(--danger)] mb-1">&gt;20%</div>
                <p className="text-sm text-muted-foreground font-medium">波胆 (Correct Score)</p>
                <p className="text-xs text-muted-foreground mt-2">预测比分难度极大，且庄家抽水极高。</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 详细分析区域 */}
        <section id="analysis" className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">全景数据分析</h2>
              <p className="text-muted-foreground">主流足球博彩玩法的风险与回报对比</p>
            </div>
          </div>

          <Card className="border-none shadow-md overflow-hidden">
            <CardContent className="p-6">
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={footballData.markets}
                    layout="vertical"
                    margin={{ top: 20, right: 10, left: 0, bottom: 20 }}
                  >
                    <XAxis type="number" domain={[0, 'auto']} tickFormatter={(val) => `${val}%`} />
                    <YAxis type="category" dataKey="name" width={110} tick={{fontSize: 11, fontWeight: 500}} />
                    <RechartsTooltip content={<CustomTooltip />} cursor={{fill: 'var(--muted)', opacity: 0.2}} wrapperStyle={{ zIndex: 100 }} />
                    <Bar 
                      dataKey="edge" 
                      radius={[0, 4, 4, 0]} 
                      barSize={30} 
                      animationDuration={1000} 
                      label={{ position: 'insideLeft', fill: '#fff', fontSize: 10, formatter: (val: any) => `${val}%` }}
                      onClick={(data) => handleBarClick(data)}
                      style={{ cursor: 'pointer' }}
                    >
                      {footballData.markets.map((entry, index) => {
                        let color = COLORS.not_recommended;
                        if (entry.edge < 3) color = COLORS.recommended;
                        else if (entry.edge < 8) color = COLORS.caution;
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
            {footballData.markets.map((item, index) => (
              <Card key={index} className="group hover:shadow-md transition-all duration-300 border-border/50 hover:border-primary/20">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-bold">{item.name}</CardTitle>
                    <Badge variant="outline" className={`
                      ${item.edge < 3 ? "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20" : 
                        item.edge < 8 ? "bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/20" : 
                        "bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/20"}
                    `}>
                      {item.edge}% 抽水
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">赔率 {item.payout}</span>
                    <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">概率 {item.probability}</span>
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
          <img src="/logo.png" alt="数金研投 Logo" className="w-10 h-10 rounded-lg shadow-[0_0_10px_rgba(var(--primary),0.3)] mx-auto mb-4" />
          <p className="font-medium">© 2026 数金研投 | 专业足球博彩数据分析</p>
          <p className="mt-2 text-xs">赌博有风险，请理性娱乐。本站仅供数据分析参考。</p>
        </footer>
      </main>
      <ScrollToTop />
    </div>
  );
}
