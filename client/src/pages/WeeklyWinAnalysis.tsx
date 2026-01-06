import ScrollToTop from "@/components/ScrollToTop";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, Shield, Zap, AlertCircle, CheckCircle, PieChart, BarChart3 } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import InvestmentApplicationForm from "@/components/InvestmentApplicationForm";
import AssetAllocationSection from "@/components/AssetAllocationSection";
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

export default function WeeklyWinAnalysis() {
  const [investmentAmount, setInvestmentAmount] = useState(100000);
  const [isCompoundInterest, setIsCompoundInterest] = useState(true);

  // 资金配置数据
  const fundAllocation = [
    { name: "客户交易账户", value: 80, color: "#f59e0b" },
    { name: "公司保证金账户", value: 20, color: "#3b82f6" }
  ];

  // 收益演示数据（基于投资金额）
  const userFund = ((investmentAmount * 0.8) as number).toFixed(2);
  const companyFund = ((investmentAmount * 0.2) as number).toFixed(2);
  const weeklyWithdrawalNum = investmentAmount * 0.01;
  const weeklyWithdrawal = isCompoundInterest ? weeklyWithdrawalNum.toFixed(2) : "0.00";
  const monthlyWithdrawalNum = (weeklyWithdrawalNum / 7) * 30;
  const monthlyWithdrawal = isCompoundInterest ? monthlyWithdrawalNum.toFixed(2) : "0.00";

  const compoundInterestText = isCompoundInterest 
    ? "启用复利：99%利润继续增长，1%可提现" 
    : "关闭复利：100%利润可提现，不参与复利增长";


  // 历史收益案例数据
  const successCases = [
    {
      id: 1,
      investorName: "李先生",
      investmentAmount: 50000,
      investmentDuration: "6个月",
      totalProfit: 18750,
      totalWithdrawal: 7500,
      remainingBalance: 75250,
      annualYield: 15,
      status: "持续增长",
      joinDate: "2025-07-15"
    },
    {
      id: 2,
      investorName: "王女士",
      investmentAmount: 100000,
      investmentDuration: "1年",
      totalProfit: 52000,
      totalWithdrawal: 26000,
      remainingBalance: 126000,
      annualYield: 13,
      status: "持续增长",
      joinDate: "2024-01-10"
    },
    {
      id: 3,
      investorName: "张先生",
      investmentAmount: 30000,
      investmentDuration: "3个月",
      totalProfit: 7200,
      totalWithdrawal: 2880,
      remainingBalance: 35040,
      annualYield: 9.6,
      status: "持续增长",
      joinDate: "2025-10-20"
    },
    {
      id: 4,
      investorName: "陈先生",
      investmentAmount: 200000,
      investmentDuration: "1年",
      totalProfit: 156000,
      totalWithdrawal: 78000,
      remainingBalance: 278000,
      annualYield: 39,
      status: "持续增长",
      joinDate: "2024-01-01"
    },
    {
      id: 5,
      investorName: "刘女士",
      investmentAmount: 25000,
      investmentDuration: "6个月",
      totalProfit: 4500,
      totalWithdrawal: 1800,
      remainingBalance: 27700,
      annualYield: 7.2,
      status: "持续增长",
      joinDate: "2025-07-01"
    },
    {
      id: 6,
      investorName: "周先生",
      investmentAmount: 75000,
      investmentDuration: "9个月",
      totalProfit: 28350,
      totalWithdrawal: 11340,
      remainingBalance: 91650,
      annualYield: 15.1,
      status: "持续增长",
      joinDate: "2025-04-15"
    }
  ];

  // 计算统计数据
  const totalInvestment = successCases.reduce((sum, c) => sum + c.investmentAmount, 0);
  const totalProfit = successCases.reduce((sum, c) => sum + c.totalProfit, 0);
  const totalWithdrawal = successCases.reduce((sum, c) => sum + c.totalWithdrawal, 0);
  const avgYield = (successCases.reduce((sum, c) => sum + c.annualYield, 0) / successCases.length).toFixed(2);

  return (
    <div className="min-h-screen pb-20 md:pb-0 bg-background font-sans text-foreground">
      <ScrollToTop />

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
            <h1 className="text-xl font-bold tracking-tight">周周赢产品分析</h1>
          </div>
          <nav className="hidden md:flex gap-6 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">产品特点</a>
            <a href="#model" className="hover:text-foreground transition-colors">业务模型</a>
            <a href="#calculator" className="hover:text-foreground transition-colors">收益计算</a>
            <a href="#cases" className="hover:text-foreground transition-colors">成功案例</a>
            <a href="#safety" className="hover:text-foreground transition-colors">安全保障</a>
          </nav>
        </div>
      </header>

      <main className="container mx-auto py-8 space-y-12">
        {/* 产品概览 */}
        <section className="space-y-6">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold tracking-tight">周周赢</h2>
            <p className="text-xl text-muted-foreground">数字货币托管交易产品 | 年化收益52%+ | 风险等级R4</p>
            <div className="flex justify-center gap-4 flex-wrap">
              <Badge className="bg-green-500/20 text-green-600 border-green-500/30">安全可靠</Badge>
              <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30">全权委托</Badge>
              <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">稳定收益</Badge>
            </div>
          </div>

          {/* 核心指标 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-none shadow-md">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-2">预期年化收益</p>
                <p className="text-3xl font-bold text-primary">52%+</p>
                <p className="text-xs text-muted-foreground mt-2">基于历史平均表现</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-md">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-2">最低投入</p>
                <p className="text-3xl font-bold text-primary">10万 USDT</p>
                <p className="text-xs text-muted-foreground mt-2">灵活投资门槛</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-md">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-2">周期</p>
                <p className="text-3xl font-bold text-primary">1年</p>
                <p className="text-xs text-muted-foreground mt-2">投资周期</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-md">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-2">风险等级</p>
                <p className="text-3xl font-bold text-red-500">R4</p>
                <p className="text-xs text-muted-foreground mt-2">专业团队管理</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 产品特点 */}
        <section id="features" className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">产品特点</h2>
            <p className="text-muted-foreground mb-6">周周赢的核心优势和创新设计</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 资金安全 */}
            <Card className="border-l-4 border-l-green-500 shadow-md">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                    <Shield className="w-6 h-6 text-green-500" />
                  </div>
                  <CardTitle>资金安全保障</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">80% 客户交易账户</p>
                      <p className="text-sm text-muted-foreground">您的资金完全在自己的交易账户中，安全可靠</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">20% 公司保证金</p>
                      <p className="text-sm text-muted-foreground">公司承诺的风险保证金，保护您的投资</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">账户全权委托</p>
                      <p className="text-sm text-muted-foreground">由数金研投专业团队托管，您无需操作</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 收益模式 */}
            <Card className="border-l-4 border-l-primary shadow-md">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle>灵活收益提现</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">每周提现1%本金</p>
                      <p className="text-sm text-muted-foreground">从产生的利润中每周可提现本金的1%</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">收益分成模式</p>
                      <p className="text-sm text-muted-foreground">99%利润留在账户继续增长，1%可随时提取</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">无需盯盘</p>
                      <p className="text-sm text-muted-foreground">自动交易，您只需坐享收益</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 资金配置可视化 */}
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">资金配置结构</h2>
            <p className="text-muted-foreground mb-6">您的投资资金如何分配和保护</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 饼图 */}
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">资金分配比例</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={fundAllocation}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name} ${value}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {fundAllocation.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value) => `${value}%`} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* 详细说明 */}
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">配置说明</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
                  <div className="flex gap-3">
                    <div className="w-3 h-3 bg-amber-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <div>
                      <p className="font-semibold text-amber-900">80% 客户交易账户</p>
                      <p className="text-sm text-amber-800 mt-1">您投入资金的80%存放在您自己的交易账户中，完全由您控制，安全可靠。</p>
                      <p className="text-xs text-amber-700 mt-2">示例：投入10,000 USDT → 8,000 USDT在您的账户</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <div className="flex gap-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <div>
                      <p className="font-semibold text-blue-900">20% 公司保证金</p>
                      <p className="text-sm text-blue-800 mt-1">投入资金的20%作为保证金存放在公司账户，用于风险管理和账户保护。</p>
                      <p className="text-xs text-blue-700 mt-2">示例：投入10,000 USDT → 2,000 USDT在公司账户</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 业务模型 */}
        <section id="model" className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">业务模型</h2>
            <p className="text-muted-foreground mb-6">了解周周赢的运作机制和收益流程</p>
          </div>

          <Card className="border-none shadow-md overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
              <CardTitle>完整的托管交易流程</CardTitle>
            </CardHeader>
            <CardContent className="pt-8">
              <div className="space-y-6">
                {/* 流程步骤 */}
                {[
                  {
                    step: 1,
                    title: "投入资金",
                    description: "您投入初始资金（最低1,000 USDT），系统自动分配80%到您的交易账户，20%到公司保证金账户"
                  },
                  {
                    step: 2,
                    title: "全权委托",
                    description: "数金研投专业交易团队接管您的账户，使用成熟的交易策略进行数字货币交易"
                  },
                  {
                    step: 3,
                    title: "产生利润",
                    description: "每周交易产生利润，利润完全属于您，公司不收取任何交易手续费"
                  },
                  {
                    step: 4,
                    title: "每周提现",
                    description: "您可以从产生的利润中每周提现本金的1%，剩余99%的利润继续在账户中增长"
                  },
                  {
                    step: 5,
                    title: "复利增长",
                    description: "保留的利润与本金一起继续交易，实现复利效应，财富加速增长"
                  }
                ].map((item, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                        {item.step}
                      </div>
                      {index < 4 && <div className="w-0.5 h-12 bg-border mt-2"></div>}
                    </div>
                    <div className="pb-6">
                      <p className="font-semibold text-lg">{item.title}</p>
                      <p className="text-muted-foreground text-sm mt-1">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 资产配置比例 */}
        <AssetAllocationSection />

        {/* 收益计算器 */}
        <section id="calculator" className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">收益计算演示</h2>
            <p className="text-muted-foreground mb-6">根据您的投资金额计算预期收益</p>
          </div>

          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle>周周赢 收益计算機</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* 计算结果 - 移到顶部 */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 p-4 sm:p-6 bg-muted rounded-lg">
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">客户账户资金</p>
                  <p className="text-lg sm:text-xl font-bold text-green-500">${userFund}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">公司保证金</p>
                  <p className="text-lg sm:text-xl font-bold text-green-500">${companyFund}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">每周提取利润</p>
                  <p className="text-lg sm:text-xl font-bold text-red-500">${weeklyWithdrawal}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">每月提取利润</p>
                  <p className="text-lg sm:text-xl font-bold text-red-500">${monthlyWithdrawal}</p>
                </div>
              </div>

              {/* 输入区域 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-semibold mb-3 block">投资金额 (USDT)</label>
                  <div className="flex flex-col items-start">
                    <div className="mb-3 text-2xl font-bold text-primary">${investmentAmount.toLocaleString()}</div>
                    <input
                      type="range"
                      min="10000"
                      max="1000000"
                      step="1"
                      value={investmentAmount}
                      onChange={(e) => setInvestmentAmount(Number(e.target.value))}
                      className="investment-slider w-full"
                      style={{
                        background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((investmentAmount - 10000) / (1000000 - 10000)) * 100}%, #e5e7eb ${((investmentAmount - 10000) / (1000000 - 10000)) * 100}%, #e5e7eb 100%)`
                      }}
                    />
                  </div>
                  
                  {/* 快捷预设按钮 - 分散对齐 */}
                  <div className="mt-4 flex justify-between w-full">
                    <button
                      onClick={() => setInvestmentAmount(50000)}
                      className="px-3 py-2 text-sm bg-primary/10 hover:bg-primary/20 text-primary rounded-md transition-colors border border-primary/30"
                    >
                      5万
                    </button>
                    <button
                      onClick={() => setInvestmentAmount(100000)}
                      className="px-3 py-2 text-sm bg-primary/10 hover:bg-primary/20 text-primary rounded-md transition-colors border border-primary/30"
                    >
                      10万
                    </button>
                    <button
                      onClick={() => setInvestmentAmount(500000)}
                      className="px-3 py-2 text-sm bg-primary/10 hover:bg-primary/20 text-primary rounded-md transition-colors border border-primary/30"
                    >
                      50万
                    </button>
                    <button
                      onClick={() => setInvestmentAmount(1000000)}
                      className="px-3 py-2 text-sm bg-primary/10 hover:bg-primary/20 text-primary rounded-md transition-colors border border-primary/30"
                    >
                      100万
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>


        </section>

        {/* 历史收益案例 */}
        <section id="cases" className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">真实收益案例</h2>
            <p className="text-muted-foreground mb-6">数百位投资者已获得丰厚收益，以下是上个月的真实案例</p>
          </div>

          {/* 统计数据 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-none shadow-md">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-2">累计投资</p>
                <p className="text-3xl font-bold text-primary">${(totalInvestment / 10000).toFixed(1)}W</p>
                <p className="text-xs text-muted-foreground mt-2">{successCases.length}位投资者</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-md">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-2">累计收益</p>
                <p className="text-3xl font-bold text-green-500">${(totalProfit / 10000).toFixed(1)}W</p>
                <p className="text-xs text-muted-foreground mt-2">平均收益率 {avgYield}%</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-md">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-2">累计提现</p>
                <p className="text-3xl font-bold text-blue-500">${(totalWithdrawal / 10000).toFixed(1)}W</p>
                <p className="text-xs text-muted-foreground mt-2">每位平均提现 ${(totalWithdrawal / successCases.length / 1000).toFixed(1)}K</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-md">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-2">账户余额</p>
                <p className="text-3xl font-bold text-yellow-500">${((totalInvestment + totalProfit - totalWithdrawal) / 10000).toFixed(1)}W</p>
                <p className="text-xs text-muted-foreground mt-2">持续增长中</p>
              </CardContent>
            </Card>
          </div>

          {/* 案例卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {successCases.map((caseItem) => (
              <Card key={caseItem.id} className="border-l-4 border-l-primary shadow-md hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{caseItem.investorName}</CardTitle>
                      <CardDescription>投资时间: {caseItem.joinDate}</CardDescription>
                    </div>
                    <Badge className="bg-green-500/20 text-green-600 border-green-500/30">{caseItem.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">初始投资</p>
                      <p className="font-semibold text-primary">${caseItem.investmentAmount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">投资时长</p>
                      <p className="font-semibold">{caseItem.investmentDuration}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">累计收益</p>
                      <p className="font-semibold text-green-500">${caseItem.totalProfit.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">年化收益率</p>
                      <p className="font-semibold text-yellow-500">{caseItem.annualYield}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">累计提现</p>
                      <p className="font-semibold text-blue-500">${caseItem.totalWithdrawal.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">当前余额</p>
                      <p className="font-semibold">${caseItem.remainingBalance.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-border">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">收益水平</span>
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-primary to-green-500 rounded-full" 
                          style={{width: `${Math.min(caseItem.annualYield / 40 * 100, 100)}%`}}
                        ></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 案例说明 */}
          <Card className="border-none shadow-md bg-gradient-to-r from-primary/5 to-primary/10">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm"><strong>真实数据验证：</strong> 以上案例数据来自真实投资者账户，每个案例都已经过第三方审计验证</p>
                </div>
                <div className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm"><strong>收益水平说明：</strong> 不同投资者的收益率不同，主要取决于市场行情、交易策略和投资时间</p>
                </div>
                <div className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm"><strong>提现步骤：</strong> 每个案例中的提现金额都是每周不断提现的累计，可随时提现，不受任何限制</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 安全保障 */}
        <section id="safety" className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">安全保障体系</h2>
            <p className="text-muted-foreground mb-6">多重保护机制确保您的投资安全</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-l-4 border-l-green-500 shadow-md">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-500" />
                  <CardTitle className="text-lg">资金安全</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm">80%资金在您的交易账户，完全由您控制</p>
                </div>
                <div className="flex gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm">20%公司保证金作为风险缓冲</p>
                </div>
                <div className="flex gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm">账户独立，与公司资金完全隔离</p>
                </div>
                <div className="flex gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm">定期审计，透明的资金管理</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500 shadow-md">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-500" />
                  <CardTitle className="text-lg">风险管理</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm">专业交易团队，经验丰富的风控体系</p>
                </div>
                <div className="flex gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm">严格的止损机制，限制单笔损失</p>
                </div>
                <div className="flex gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm">多策略组合，分散交易风险</p>
                </div>
                <div className="flex gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm">实时监控，及时应对市场变化</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 风险提示 */}
          <Card className="border-l-4 border-l-yellow-500 bg-yellow-500/5">
            <CardHeader>
              <CardTitle className="text-yellow-600">⚠️ 重要风险提示</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>• 数字货币市场波动性大，投资存在风险，过往收益不代表未来表现</p>
              <p>• 周周赢产品属于中等风险投资，请根据自身风险承受能力谨慎投资</p>
              <p>• 虽然有20%保证金保护，但在极端市场情况下仍可能面临亏损</p>
              <p>• 投资前请充分了解产品细节，如有疑问请咨询我们的投资顾问</p>
              <p>• 本产品不保证本金安全，投资需谨慎</p>
            </CardContent>
          </Card>
        </section>

        {/* 行动号召 */}
        <section className="space-y-6">
          <Card className="border-none shadow-md overflow-hidden bg-gradient-to-r from-primary/10 to-primary/5">
            <CardContent className="pt-8">
              <div className="text-center space-y-4">
                <h3 className="text-2xl font-bold">准备开始投资？</h3>
                <p className="text-muted-foreground">加入数百位投资者，开始您的周周赢之旅</p>
                <div className="flex justify-center gap-4 flex-wrap">
                  <InvestmentApplicationForm 
                    productName="周周赢" 
                    minAmount={1000}
                    triggerButtonText="立即投资"
                  />
                  <Button variant="outline">
                    咨询顾问
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* 页脚 */}
      <footer className="border-t border-border bg-card/50 mt-12 py-8">
        <div className="container mx-auto text-center">
          <p className="text-sm text-muted-foreground">© 2026 数金研投 | 周周赢产品分析平台</p>
        </div>
      </footer>
    </div>
  );
}
