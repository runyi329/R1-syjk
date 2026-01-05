import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info, AlertTriangle, CheckCircle, XCircle, ArrowLeft, ShieldAlert } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, Cell, LineChart, Line } from "recharts";
import pokerData from "../data/pokerData.json";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// 颜色常量
const COLORS = {
  high_win_rate: "var(--success)", // 高胜率
  medium_win_rate: "var(--warning)", // 中胜率
  low_win_rate: "var(--danger)", // 低胜率
  house_edge: "#ef4444", // 庄家优势
};

export default function PokerAnalysis() {
  const [selectedData, setSelectedData] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const handleItemClick = (data: any) => {
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
          <p className="font-bold text-popover-foreground mb-1">{data.hand || data.name || `补牌: ${data.outs}`}</p>
          {data.winRate && <p className="text-sm text-muted-foreground">胜率: <span className="font-mono font-bold text-foreground">{data.winRate}%</span></p>}
          {data.prob && <p className="text-sm text-muted-foreground">概率: <span className="font-mono font-bold text-foreground">{data.prob}%</span></p>}
          {data.odds && <p className="text-sm text-muted-foreground">赔率: <span className="font-mono font-bold text-foreground">{data.odds}</span></p>}
          {data.houseEdge && <p className="text-sm text-muted-foreground">庄家优势: <span className="font-mono font-bold text-destructive">{data.houseEdge}%</span></p>}
          <p className="text-xs mt-2 text-muted-foreground whitespace-normal break-words">{data.description}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="text-xl font-bold">{selectedData?.hand || selectedData?.name || (selectedData?.outs ? `补牌数: ${selectedData.outs}` : "")}</DrawerTitle>
            <DrawerDescription>
              <div className="mt-4 space-y-4">
                {selectedData?.winRate && (
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="text-muted-foreground">胜率</span>
                    <span className="font-mono font-bold text-xl text-foreground">{selectedData.winRate}%</span>
                  </div>
                )}
                {selectedData?.prob && (
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="text-muted-foreground">出现概率</span>
                    <span className="font-mono font-bold text-xl text-foreground">{selectedData.prob}%</span>
                  </div>
                )}
                {selectedData?.odds && (
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="text-muted-foreground">赔率</span>
                    <span className="font-mono font-medium text-foreground">{selectedData.odds}</span>
                  </div>
                )}
                {selectedData?.houseEdge && (
                  <div className="flex justify-between items-center p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                    <span className="text-destructive font-bold">庄家优势 (House Edge)</span>
                    <span className="font-mono font-bold text-xl text-destructive">{selectedData.houseEdge}%</span>
                  </div>
                )}
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
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">德州扑克分析</h1>
              <p className="text-xs text-muted-foreground">Texas Hold'em Strategy & Odds</p>
            </div>
          </div>
          <Badge variant="outline" className="hidden sm:flex gap-1 border-primary/20 text-primary">
            <Info className="w-3 h-3" />
            <span>GTO & Math</span>
          </Badge>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4 space-y-8">
        
        <Tabs defaultValue="starting-hands" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="starting-hands">起手牌胜率</TabsTrigger>
            <TabsTrigger value="probabilities">成牌概率</TabsTrigger>
            <TabsTrigger value="insurance">保险与优势</TabsTrigger>
          </TabsList>

          {/* 起手牌胜率分析 */}
          <TabsContent value="starting-hands" className="space-y-6">
            <Card className="border-border/50 shadow-lg bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  起手牌胜率 (Pre-flop Equity)
                </CardTitle>
                <CardDescription>
                  常见起手牌在单挑情况下的理论胜率。AA是绝对的王者，但即使是AKs也有输的时候。
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[500px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pokerData.startingHands} layout="vertical" margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                      <XAxis type="number" domain={[0, 100]} hide />
                      <YAxis type="category" dataKey="hand" width={50} tick={{fontSize: 12, fontWeight: 'bold'}} />
                      <RechartsTooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} wrapperStyle={{ zIndex: 100 }} />
                      <Bar 
                        dataKey="winRate" 
                        radius={[0, 4, 4, 0]} 
                        barSize={24} 
                        label={{ position: 'insideLeft', fill: '#fff', fontSize: 11, formatter: (val: any) => `${val}%` }}
                        onClick={(data) => handleItemClick(data)}
                        style={{ cursor: 'pointer' }}
                      >
                        {pokerData.startingHands.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.winRate > 80 ? COLORS.high_win_rate : entry.winRate > 65 ? COLORS.medium_win_rate : COLORS.low_win_rate} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 成牌概率分析 */}
          <TabsContent value="probabilities" className="space-y-6">
            <Card className="border-border/50 shadow-lg bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-500" />
                  成牌概率 (Hand Probabilities)
                </CardTitle>
                <CardDescription>
                  击中各种牌型的数学概率。了解这些数据能帮助你判断是否值得跟注。
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[500px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pokerData.probabilities} layout="vertical" margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                      <XAxis type="number" domain={[0, 50]} hide />
                      <YAxis type="category" dataKey="name" width={120} tick={{fontSize: 11}} />
                      <RechartsTooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} wrapperStyle={{ zIndex: 100 }} />
                      <Bar 
                        dataKey="prob" 
                        radius={[0, 4, 4, 0]} 
                        barSize={30} 
                        label={{ position: 'right', fill: 'var(--foreground)', fontSize: 11, formatter: (val: any) => `${val}%` }}
                        onClick={(data) => handleItemClick(data)}
                        style={{ cursor: 'pointer' }}
                      >
                        <Cell fill="var(--primary)" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 保险与庄家优势分析 */}
          <TabsContent value="insurance" className="space-y-6">
            <Card className="border-destructive/20 shadow-lg bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <ShieldAlert className="w-5 h-5" />
                  保险陷阱与庄家优势 (Insurance & House Edge)
                </CardTitle>
                <CardDescription>
                  买保险通常是“负期望值”(-EV)的行为。下表展示了不同补牌数下的庄家优势。
                  <br/>
                  <span className="text-xs text-muted-foreground mt-1 block">
                    * 庄家优势 = (实际赔率 - 支付赔率) / 实际赔率。数值越高，玩家越亏。
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[500px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pokerData.insurance} layout="vertical" margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                      <XAxis type="number" domain={[0, 35]} hide />
                      <YAxis type="category" dataKey="outs" width={80} tickFormatter={(val) => `补牌: ${val}`} tick={{fontSize: 11}} />
                      <RechartsTooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} wrapperStyle={{ zIndex: 100 }} />
                      <Bar 
                        dataKey="houseEdge" 
                        radius={[0, 4, 4, 0]} 
                        barSize={20} 
                        label={{ position: 'insideLeft', fill: '#fff', fontSize: 11, formatter: (val: any) => `优势: ${val}%` }}
                        onClick={(data) => handleItemClick(data)}
                        style={{ cursor: 'pointer' }}
                      >
                        {pokerData.insurance.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS.house_edge} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 p-4 bg-muted/30 rounded-lg border border-border/50">
                  <h4 className="font-bold text-sm mb-2">💡 专家建议</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    从数学角度看，<strong>买保险永远是亏损的</strong>（负EV）。长期来看，不买保险能让你获得最大收益。
                    保险唯一的价值在于降低短期波动（Variance），避免因一次“爆冷”而心态失衡。
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* 底部说明 */}
        <div className="text-center text-xs text-muted-foreground mt-8 pb-8">
          <p>数据基于标准52张扑克牌计算 • 仅供策略研究参考</p>
        </div>
      </main>
    </div>
  );
}
