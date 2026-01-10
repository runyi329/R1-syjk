import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, TrendingUp, TrendingDown, Calendar, Shield, Lock, Wallet, Percent } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import ScrollToTop from "@/components/ScrollToTop";

interface StockUser {
  id: number;
  name: string;
  initialBalance: string;
  status: "active" | "inactive";
}

interface DailyProfit {
  date: string;
  balance: number;
  dailyProfit: number;
  totalProfit: number;
  profitRate: number;
}

export default function StockClientView() {
  const { user, loading: isAuthLoading } = useAuth();
  const [selectedStockUserId, setSelectedStockUserId] = useState<string>("");
  const [viewMode, setViewMode] = useState<"balance" | "profit">("balance");

  // 获取用户可查看的股票客户列表
  const { data: accessibleStockUsers, isLoading: isLoadingStockUsers } = trpc.stocks.getMyAccessibleStockUsers.useQuery(
    { userId: user?.id || 0 },
    { enabled: !!user?.id }
  );

  // 获取选中股票客户的统计数据
  const { data: stockUserStats, isLoading: isLoadingStats } = trpc.stocks.getMyStockUserStats.useQuery(
    { 
      userId: user?.id || 0,
      stockUserId: parseInt(selectedStockUserId) || 0 
    },
    { enabled: !!user?.id && !!selectedStockUserId }
  );

  // 自动选择第一个股票客户
  useEffect(() => {
    if (accessibleStockUsers && accessibleStockUsers.length > 0 && !selectedStockUserId) {
      setSelectedStockUserId(accessibleStockUsers[0].id.toString());
    }
  }, [accessibleStockUsers, selectedStockUserId]);

  // 准备图表数据
  const getChartData = () => {
    if (!stockUserStats?.dailyProfits) return [];
    
    if (viewMode === "balance") {
      return stockUserStats.dailyProfits.map((item: DailyProfit) => ({
        date: item.date,
        value: item.balance,
      }));
    } else {
      return stockUserStats.dailyProfits.map((item: DailyProfit) => ({
        date: item.date,
        value: item.dailyProfit,
      }));
    }
  };

  const formatCurrency = (value: number) => {
    return `¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-[#0a0a0a] to-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-[#0a0a0a] to-black">
        <div className="container mx-auto px-4 py-8">
          <Card className="bg-black/50 border-white/10 max-w-2xl mx-auto">
            <CardContent className="py-12">
              <div className="text-center">
                <Lock className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">需要登录</h2>
                <p className="text-white/60 mb-6">请先登录后查看股票客户数据</p>
                <Link href="/">
                  <Button className="bg-[#D4AF37] text-black hover:bg-[#E5C158]">
                    返回首页
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#0a0a0a] to-black pb-20 md:pb-0">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-white hover:text-[#D4AF37]">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  返回首页
                </Button>
              </Link>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-white">A股客户数据</h1>
                <p className="text-sm text-white/60">查看您有权限的股票客户数据</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-white border-white/20">
                {user.username || user.email}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-2 space-y-1.5">
        {/* 股票客户选择 */}
        <Card className="bg-black/50 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#D4AF37]" />
              选择股票ID
            </CardTitle>
            <CardDescription className="text-white/60">
              选择您有权限查看的股票客户
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingStockUsers ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-[#D4AF37]" />
              </div>
            ) : accessibleStockUsers && accessibleStockUsers.length > 0 ? (
              <Select value={selectedStockUserId} onValueChange={setSelectedStockUserId}>
                <SelectTrigger className="bg-black/50 border-white/20 text-white">
                  <SelectValue placeholder="请选择股票客户" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-white/20">
                  {accessibleStockUsers.map((stockUser) => (
                    <SelectItem key={stockUser.id} value={stockUser.id.toString()}>
                      <div className="flex items-center gap-2">
                        <span className="text-white">{stockUser.name}</span>
                        <span className="text-white/60 text-sm">
                          (初始: ¥{parseFloat(stockUser.initialBalance).toLocaleString()})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="text-center py-8">
                <Shield className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/60">您暂无权限查看任何股票客户数据</p>
                <p className="text-white/40 text-sm mt-2">
                  请联系管理员为您分配权限
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 统计数据 */}
        {selectedStockUserId && stockUserStats && (
          <>
            {/* 分成百分比和授权日期 */}
            <Card className="bg-black/50 border-white/10">
              <CardContent className="py-1">
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1">
                    <div className="w-6 h-6 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                      <Percent className="w-3 h-3 text-[#D4AF37]" />
                    </div>
                    <p className="text-sm font-bold text-[#D4AF37]">
                      {stockUserStats.profitPercentage}%
                    </p>
                  </div>
                  
                  {stockUserStats.deposit && parseFloat(stockUserStats.deposit) > 0 && (
                    <div className="flex items-center gap-1">
                      <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                        <Wallet className="w-3 h-3 text-green-400" />
                      </div>
                      <p className="text-xs font-semibold text-green-400">
                        ¥{parseFloat(stockUserStats.deposit).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  )}
                  
                  {stockUserStats.authorizationDate && (
                    <div className="flex items-center gap-1">
                      <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <Calendar className="w-3 h-3 text-blue-400" />
                      </div>
                      <p className="text-xs font-semibold text-white">
                        {new Date(stockUserStats.authorizationDate).toLocaleDateString('zh-CN', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit'
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-3 gap-1">
              {/* 第1格: 初始资金 */}
              <Card className="bg-black/50 border-white/10">
                <CardContent className="py-1.5 px-2">
                  <p className="text-[10px] text-white/60 leading-none mb-1">初始资金</p>
                  <p className="text-xs font-bold text-white leading-none">
                    {formatCurrency(stockUserStats.initialBalance)}
                  </p>
                </CardContent>
              </Card>
              
              {/* 第2格: 开始金额 */}
              <Card className="bg-black/50 border-white/10">
                <CardContent className="py-1.5 px-2">
                  <p className="text-[10px] text-white/60 leading-none mb-1">开始金额</p>
                  <p className="text-xs font-bold text-[#D4AF37] leading-none">
                    {formatCurrency(stockUserStats.startAmount)}
                  </p>
                </CardContent>
              </Card>

              {/* 第3格: 最新余额 */}
              <Card className="bg-black/50 border-white/10">
                <CardContent className="py-1.5 px-2">
                  <p className="text-[10px] text-white/60 leading-none mb-1">最新余额</p>
                  <p className="text-xs font-bold text-white leading-none">
                    {formatCurrency(stockUserStats.latestBalance)}
                  </p>
                </CardContent>
              </Card>

              {/* 第4格: 累计盈亏（整合收益率） */}
              <Card className="bg-black/50 border-white/10 col-span-3">
                <CardContent className="py-1.5 px-2">
                  <p className="text-[10px] text-white/60 leading-none mb-1">累计盈亏</p>
                  <div className="flex items-center gap-0.5 mb-1">
                    {stockUserStats.totalProfit >= 0 ? (
                      <TrendingUp className="w-3 h-3 text-red-500" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-green-500" />
                    )}
                    <p className={`text-xs font-bold leading-none ${stockUserStats.totalProfit >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                      {formatCurrency(Math.abs(stockUserStats.totalProfit))}
                    </p>
                  </div>
                  <p className={`text-[10px] leading-none ${stockUserStats.totalProfitRate >= 0 ? 'text-red-500/80' : 'text-green-500/80'}`}>
                    {stockUserStats.totalProfitRate >= 0 ? '+' : ''}{stockUserStats.totalProfitRate.toFixed(2)}%
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* 视图切换和图表 */}
            <Card className="bg-black/50 border-white/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">资金曲线</CardTitle>
                    <CardDescription className="text-white/60">
                      {viewMode === "balance" ? "每日余额变化" : "每日盈亏变化"}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={viewMode === "balance" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("balance")}
                      className={viewMode === "balance" ? "bg-[#D4AF37] text-black" : ""}
                    >
                      余额
                    </Button>
                    <Button
                      variant={viewMode === "profit" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("profit")}
                      className={viewMode === "profit" ? "bg-[#D4AF37] text-black" : ""}
                    >
                      盈亏
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingStats ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
                  </div>
                ) : (
                  <div className="h-[150px] md:h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={getChartData()}>
                        <defs>
                          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                        <XAxis 
                          dataKey="date" 
                          stroke="#94a3b8"
                          tick={{ fill: '#94a3b8' }}
                        />
                        <YAxis 
                          stroke="#94a3b8"
                          tick={{ fill: '#94a3b8' }}
                          tickFormatter={(value) => `¥${value.toLocaleString()}`}
                        />
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: '#1a1a1a',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            color: '#fff'
                          }}
                          formatter={(value: number) => [formatCurrency(value), viewMode === "balance" ? "余额" : "盈亏"]}
                        />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#D4AF37"
                          strokeWidth={2}
                          fill="url(#colorValue)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 每日数据表格 */}
            <Card className="bg-black/50 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#D4AF37]" />
                  每日数据
                </CardTitle>
                <CardDescription className="text-white/60">
                  共 {stockUserStats.recordCount} 条记录
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-3 px-4 text-white/80 font-semibold">日期</th>
                        <th className="text-right py-3 px-4 text-white/80 font-semibold">余额</th>
                        <th className="text-right py-3 px-4 text-white/80 font-semibold">当日盈亏</th>
                        <th className="text-right py-3 px-4 text-white/80 font-semibold">累计盈亏</th>
                        <th className="text-right py-3 px-4 text-white/80 font-semibold">收益率</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stockUserStats.dailyProfits.slice().reverse().map((item: DailyProfit, index: number) => (
                        <tr key={index} className="border-b border-white/5 hover:bg-white/5">
                          <td className="py-3 px-4 text-white">{item.date}</td>
                          <td className="py-3 px-4 text-right text-white">
                            {formatCurrency(item.balance)}
                          </td>
                          <td className={`py-3 px-4 text-right font-semibold ${item.dailyProfit >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                            {item.dailyProfit >= 0 ? '+' : ''}{formatCurrency(item.dailyProfit)}
                          </td>
                          <td className={`py-3 px-4 text-right font-semibold ${item.totalProfit >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                            {item.totalProfit >= 0 ? '+' : ''}{formatCurrency(item.totalProfit)}
                          </td>
                          <td className={`py-3 px-4 text-right font-semibold ${item.profitRate >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                            {item.profitRate >= 0 ? '+' : ''}{item.profitRate.toFixed(2)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <ScrollToTop />
    </div>
  );
}
