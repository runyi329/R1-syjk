import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, TrendingUp, TrendingDown, Calendar, Shield, Lock, Wallet, Percent, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

import ScrollToTop from "@/components/ScrollToTop";
import FundsCurveChart from "@/components/admin/FundsCurveChart";

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
  const [profitPeriod, setProfitPeriod] = useState<"day" | "month" | "year">("day");
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);

  // 设置页面标题
  useEffect(() => {
    document.title = "A股客户数据查看 - 数金研投";
  }, []);

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

  // 生成日历数据
  const generateCalendarDays = () => {
    const firstDay = new Date(currentYear, currentMonth - 1, 1);
    const lastDay = new Date(currentYear, currentMonth, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days: (number | null)[] = [];
    
    // 填充月初空白
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    
    // 填充日期
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  };

  // 获取某日的盈亏数据
  const getProfitForDate = (day: number): DailyProfit | undefined => {
    if (!stockUserStats?.dailyProfits) return undefined;
    const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return stockUserStats.dailyProfits.find((p: DailyProfit) => p.date === dateStr);
  };

  // 计算月收益数据
  const getMonthlyProfits = () => {
    if (!stockUserStats?.dailyProfits || stockUserStats.dailyProfits.length === 0) return [];
    
    const monthlyData: { month: string; year: number; monthNum: number; profit: number; profitRate: number }[] = [];
    const groupedByMonth: { [key: string]: DailyProfit[] } = {};
    
    // 按月份分组
    stockUserStats.dailyProfits.forEach((p: DailyProfit) => {
      const [year, month] = p.date.split('-');
      const key = `${year}-${month}`;
      if (!groupedByMonth[key]) {
        groupedByMonth[key] = [];
      }
      groupedByMonth[key].push(p);
    });
    
    // 计算每月的总收益
    Object.keys(groupedByMonth).sort().forEach(key => {
      const profits = groupedByMonth[key];
      const totalProfit = profits.reduce((sum, p) => sum + p.dailyProfit, 0);
      const [year, month] = key.split('-');
      const initialBalance = stockUserStats.initialBalance;
      const profitRate = initialBalance > 0 ? (totalProfit / initialBalance) * 100 : 0;
      
      monthlyData.push({
        month: key,
        year: parseInt(year),
        monthNum: parseInt(month),
        profit: totalProfit,
        profitRate: parseFloat(profitRate.toFixed(2))
      });
    });
    
    return monthlyData;
  };

  // 计算年收益数据
  const getYearlyProfits = () => {
    if (!stockUserStats?.dailyProfits || stockUserStats.dailyProfits.length === 0) return [];
    
    const yearlyData: { year: number; profit: number; profitRate: number }[] = [];
    const groupedByYear: { [key: string]: DailyProfit[] } = {};
    
    // 按年份分组
    stockUserStats.dailyProfits.forEach((p: DailyProfit) => {
      const year = p.date.split('-')[0];
      if (!groupedByYear[year]) {
        groupedByYear[year] = [];
      }
      groupedByYear[year].push(p);
    });
    
    // 计算每年的总收益
    Object.keys(groupedByYear).sort().forEach(year => {
      const profits = groupedByYear[year];
      const totalProfit = profits.reduce((sum, p) => sum + p.dailyProfit, 0);
      const initialBalance = stockUserStats.initialBalance;
      const profitRate = initialBalance > 0 ? (totalProfit / initialBalance) * 100 : 0;
      
      yearlyData.push({
        year: parseInt(year),
        profit: totalProfit,
        profitRate: parseFloat(profitRate.toFixed(2))
      });
    });
    
    return yearlyData;
  };

  // 获取当前月的收益
  const getCurrentMonthProfit = () => {
    const monthlyProfits = getMonthlyProfits();
    const key = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
    return monthlyProfits.find(m => m.month === key);
  };

  // 获取当前年的收益
  const getCurrentYearProfit = () => {
    const yearlyProfits = getYearlyProfits();
    return yearlyProfits.find(y => y.year === currentYear);
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
              <CardContent className="py-3 h-[90px] flex items-center">
                <div className="flex items-center justify-between gap-2 w-full">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                      <Percent className="w-4 h-4 text-[#D4AF37]" />
                    </div>
                    <p className="text-2xl font-bold text-[#D4AF37]">
                      {stockUserStats.profitPercentage}%
                    </p>
                  </div>
                  
                  {stockUserStats.deposit && parseFloat(stockUserStats.deposit) > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                        <Wallet className="w-4 h-4 text-green-400" />
                      </div>
                      <p className="text-lg font-semibold text-green-400">
                        ¥{parseFloat(stockUserStats.deposit).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  )}
                  
                  {stockUserStats.authorizationDate && (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-blue-400" />
                      </div>
                      <p className="text-base font-semibold text-white">
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

            {/* 第一行: 初始资金 + 开始金额 */}
            <div className="grid grid-cols-2 gap-1">
                {/* 初始资金 */}
                <Card className="bg-black/50 border-white/10">
                  <CardContent className="p-4 h-[35px] flex flex-col justify-center text-left">
                    <p className="text-sm text-white/60 mb-2">初始资金</p>
                    <p className="text-xl font-bold text-white">
                      {formatCurrency(stockUserStats.initialBalance)}
                    </p>
                  </CardContent>
                </Card>
                
                {/* 开始金额 */}
                <Card className="bg-black/50 border-white/10">
                  <CardContent className="p-4 h-[35px] flex flex-col justify-center text-left">
                    <p className="text-sm text-white/60 mb-2">开始金额</p>
                    <p className="text-xl font-bold text-[#D4AF37]">
                      {formatCurrency(stockUserStats.startAmount)}
                    </p>
                  </CardContent>
                </Card>
            </div>

            {/* 第二行: 最新余额 + 累计盈亏 */}
            <div className="grid grid-cols-2 gap-1">
                {/* 最新余额 */}
                <Card className="bg-black/50 border-white/10">
                  <CardContent className="p-4 h-[35px] flex flex-col justify-center text-left">
                    <p className="text-sm text-white/60 mb-2">最新余额</p>
                    <p className="text-xl font-bold text-white">
                      {formatCurrency(stockUserStats.latestBalance)}
                    </p>
                  </CardContent>
                </Card>

                {/* 累计盈亏+收益率 */}
                <Card className="bg-black/50 border-white/10">
                  <CardContent className="p-4 h-[35px] flex flex-col justify-center text-left">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-white/60 mb-2">累计盈亏</p>
                      <p className={`text-sm font-semibold mb-2 ${stockUserStats.totalProfitRate >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                        {stockUserStats.totalProfitRate >= 0 ? '+' : ''}{stockUserStats.totalProfitRate.toFixed(2)}%
                      </p>
                    </div>
                    <p className={`text-xl font-bold ${stockUserStats.totalProfit >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                      {formatCurrency(Math.abs(stockUserStats.totalProfit))}
                    </p>
                  </CardContent>
                </Card>
            </div>

            {/* 日历视图 */}
            <Card className="bg-black/50 border-white/10">
              <CardHeader>
                <div className="flex flex-col gap-3 mb-4">
                  {/* 日期显示行 */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => {
                        if (currentMonth === 1) {
                          setCurrentMonth(12);
                          setCurrentYear(currentYear - 1);
                        } else {
                          setCurrentMonth(currentMonth - 1);
                        }
                      }}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <div className="text-sm font-medium text-white whitespace-nowrap">
                      {currentYear}年{currentMonth}月
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => {
                        if (currentMonth === 12) {
                          setCurrentMonth(1);
                          setCurrentYear(currentYear + 1);
                        } else {
                          setCurrentMonth(currentMonth + 1);
                        }
                      }}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                  {/* 按钮行 */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant={viewMode === "balance" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("balance")}
                      className={`text-[10px] md:text-xs px-1.5 md:px-2 h-7 ${viewMode === "balance" ? "bg-[#D4AF37] text-black" : ""}`}
                    >
                      余额
                    </Button>
                    <Button
                      variant={viewMode === "profit" && profitPeriod === "day" ? "default" : "outline"}
                      size="sm"
                      onClick={() => { setViewMode("profit"); setProfitPeriod("day"); }}
                      className={`text-[10px] md:text-xs px-1.5 md:px-2 h-7 ${viewMode === "profit" && profitPeriod === "day" ? "bg-[#D4AF37] text-black" : ""}`}
                    >
                      日盈亏
                    </Button>
                    <Button
                      variant={viewMode === "profit" && profitPeriod === "month" ? "default" : "outline"}
                      size="sm"
                      onClick={() => { setViewMode("profit"); setProfitPeriod("month"); }}
                      className={`text-[10px] md:text-xs px-1.5 md:px-2 h-7 ${viewMode === "profit" && profitPeriod === "month" ? "bg-[#D4AF37] text-black" : ""}`}
                    >
                      月盈亏
                    </Button>
                    <Button
                      variant={viewMode === "profit" && profitPeriod === "year" ? "default" : "outline"}
                      size="sm"
                      onClick={() => { setViewMode("profit"); setProfitPeriod("year"); }}
                      className={`text-[10px] md:text-xs px-1.5 md:px-2 h-7 ${viewMode === "profit" && profitPeriod === "year" ? "bg-[#D4AF37] text-black" : ""}`}
                    >
                      年盈亏
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* 日盈亏视角：显示日历格子 */}
                {(viewMode === "balance" || (viewMode === "profit" && profitPeriod === "day")) && (
                  <>
                    {/* 星期标题 */}
                    <div className="grid grid-cols-7 gap-[2px] mb-1">
                      {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
                        <div key={day} className="text-center text-[10px] text-white/60 py-1">
                          {day}
                        </div>
                      ))}
                    </div>
                    
                    {/* 日历格子 */}
                    <div className="grid grid-cols-7 gap-[2px]">
                      {generateCalendarDays().map((day, index) => {
                        if (day === null) {
                          return <div key={`empty-${index}`} className="h-[32px]" />;
                        }
                        
                        const profit = getProfitForDate(day);
                        const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const isToday = new Date().toISOString().split('T')[0] === dateStr;
                        
                        // 根据盈亏状态决定背景色
                        const hasData = profit;
                        const isProfit = viewMode === "profit" && profit ? profit.dailyProfit >= 0 : false;
                        const isLoss = viewMode === "profit" && profit ? profit.dailyProfit < 0 : false;
                        
                        // 紧凑格式化金额（用于日历格子显示）
                        const formatCompactAmount = (amount: number | string) => {
                          const num = typeof amount === 'string' ? parseFloat(amount) : amount;
                          return Math.round(num).toLocaleString('zh-CN');
                        };
                        
                        return (
                          <div
                            key={day}
                            className={`h-[32px] px-[2px] py-1 rounded border transition-colors flex flex-col justify-between ${
                              isToday
                                ? 'border-[#D4AF37]/50 bg-[#D4AF37]/10'
                                : isProfit
                                ? 'border-red-500/30 bg-red-500/20'
                                : isLoss
                                ? 'border-green-500/30 bg-green-500/20'
                                : hasData
                                ? 'border-white/20 bg-white/5'
                                : 'border-white/10'
                            }`}
                          >
                            <div className="text-[8px] text-white/60 text-center leading-none">{day}</div>
                            {viewMode === "balance" && profit && (
                              <div className="text-[7px] md:text-[8px] font-medium text-white text-center leading-none whitespace-nowrap overflow-hidden">
                                {formatCompactAmount(profit.balance)}
                              </div>
                            )}
                            {viewMode === "profit" && profitPeriod === "day" && profit && (
                              <div className={`text-[7px] md:text-[8px] font-medium text-center leading-none whitespace-nowrap overflow-hidden ${
                                profit.dailyProfit >= 0 ? 'text-red-400' : 'text-green-400'
                              }`}>
                                {profit.dailyProfit >= 0 ? '+' : ''}{formatCompactAmount(profit.dailyProfit)}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
                
                {/* 资金曲线图 */}
                {stockUserStats && stockUserStats.dailyProfits && stockUserStats.dailyProfits.length > 0 && (
                  <div className="mt-6">
                    <div className="mb-3">
                      <h3 className="text-lg font-medium text-white mb-1">
                        {viewMode === "balance" 
                          ? "余额变化曲线" 
                          : profitPeriod === "day" 
                            ? "日盈亏曲线" 
                            : profitPeriod === "month" 
                              ? "月盈亏曲线" 
                              : "年盈亏曲线"
                        }
                      </h3>
                      <p className="text-sm text-white/60">
                        {viewMode === "balance" 
                          ? "展示账户余额随时间的变化趋势" 
                          : "展示盈亏金额随时间的变化趋势"
                        }
                      </p>
                    </div>
                    <FundsCurveChart 
                      data={stockUserStats.dailyProfits}
                      viewMode={viewMode}
                      profitPeriod={profitPeriod}
                      currentYear={currentYear}
                      currentMonth={currentMonth}
                    />
                  </div>
                )}
                
                {/* 月盈亏视角：显示12个月的收益 */}
                {viewMode === "profit" && profitPeriod === "month" && (
                  <div className="space-y-4">
                    {/* 当前月收益概览 */}
                    {(() => {
                      const currentMonthData = getCurrentMonthProfit();
                      const formatAmount = (amount: number) => {
                        return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                      };
                      const formatCompactAmount = (amount: number) => {
                        return Math.round(amount).toLocaleString('zh-CN');
                      };
                      return currentMonthData ? (
                        <div className="p-4 rounded-lg bg-black/30 border border-white/10">
                          <div className="text-sm text-white/60 mb-2">{currentYear}年{currentMonth}月 月收益</div>
                          <div className={`text-2xl font-bold ${
                            currentMonthData.profit >= 0 ? 'text-red-400' : 'text-green-400'
                          }`}>
                            {currentMonthData.profit >= 0 ? '+' : ''}¥{formatAmount(currentMonthData.profit)}
                          </div>
                          <div className={`text-sm ${
                            currentMonthData.profitRate >= 0 ? 'text-red-400' : 'text-green-400'
                          }`}>
                            收益率: {currentMonthData.profitRate >= 0 ? '+' : ''}{currentMonthData.profitRate}%
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 rounded-lg bg-black/30 border border-white/10 text-center text-white/60">
                          {currentYear}年{currentMonth}月 暂无数据
                        </div>
                      );
                    })()}
                    
                    {/* 12个月日历格子 */}
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
                        const monthKey = `${currentYear}-${String(month).padStart(2, '0')}`;
                        const monthData = getMonthlyProfits().find(m => m.month === monthKey);
                        const isCurrentMonth = month === currentMonth;
                        const formatCompactAmount = (amount: number) => {
                          return Math.round(amount).toLocaleString('zh-CN');
                        };
                        
                        return (
                          <div
                            key={month}
                            onClick={() => setCurrentMonth(month)}
                            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                              isCurrentMonth
                                ? 'border-[#D4AF37] bg-[#D4AF37]/20'
                                : monthData
                                ? monthData.profit >= 0
                                  ? 'border-red-500/30 bg-red-500/10 hover:bg-red-500/20'
                                  : 'border-green-500/30 bg-green-500/10 hover:bg-green-500/20'
                                : 'border-white/10 hover:border-white/30'
                            }`}
                          >
                            <div className="text-sm text-white/60 text-center mb-1">{month}月</div>
                            {monthData ? (
                              <div className={`text-sm font-medium text-center ${
                                monthData.profit >= 0 ? 'text-red-400' : 'text-green-400'
                              }`}>
                                {monthData.profit >= 0 ? '+' : ''}{formatCompactAmount(monthData.profit)}
                              </div>
                            ) : (
                              <div className="text-sm text-white/40 text-center">-</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* 年盈亏视角：显示所有年份的收益 */}
                {viewMode === "profit" && profitPeriod === "year" && (
                  <div className="space-y-4">
                    {/* 当前年收益概览 */}
                    {(() => {
                      const currentYearData = getCurrentYearProfit();
                      const formatAmount = (amount: number) => {
                        return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                      };
                      return currentYearData ? (
                        <div className="p-4 rounded-lg bg-black/30 border border-white/10">
                          <div className="text-sm text-white/60 mb-2">{currentYear}年 年收益</div>
                          <div className={`text-2xl font-bold ${
                            currentYearData.profit >= 0 ? 'text-red-400' : 'text-green-400'
                          }`}>
                            {currentYearData.profit >= 0 ? '+' : ''}¥{formatAmount(currentYearData.profit)}
                          </div>
                          <div className={`text-sm ${
                            currentYearData.profitRate >= 0 ? 'text-red-400' : 'text-green-400'
                          }`}>
                            收益率: {currentYearData.profitRate >= 0 ? '+' : ''}{currentYearData.profitRate}%
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 rounded-lg bg-black/30 border border-white/10 text-center text-white/60">
                          {currentYear}年 暂无数据
                        </div>
                      );
                    })()}
                    
                    {/* 年份列表 */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {getYearlyProfits().map((yearData) => {
                        const isCurrentYear = yearData.year === currentYear;
                        const formatCompactAmount = (amount: number) => {
                          return Math.round(amount).toLocaleString('zh-CN');
                        };
                        
                        return (
                          <div
                            key={yearData.year}
                            onClick={() => setCurrentYear(yearData.year)}
                            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                              isCurrentYear
                                ? 'border-[#D4AF37] bg-[#D4AF37]/20'
                                : yearData.profit >= 0
                                  ? 'border-red-500/30 bg-red-500/10 hover:bg-red-500/20'
                                  : 'border-green-500/30 bg-green-500/10 hover:bg-green-500/20'
                            }`}
                          >
                            <div className="text-sm text-white/60 text-center mb-1">{yearData.year}年</div>
                            <div className={`text-sm font-medium text-center ${
                              yearData.profit >= 0 ? 'text-red-400' : 'text-green-400'
                            }`}>
                              {yearData.profit >= 0 ? '+' : ''}{formatCompactAmount(yearData.profit)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <ScrollToTop />
    </div>
  );
}
