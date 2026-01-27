import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, BarChart3, TrendingUp } from "lucide-react";
import { Link } from "wouter";

export default function CryptoAnalysis() {
  return (
    <div className="min-h-screen bg-background">
      {/* 导航栏 */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="icon" className="hover:bg-accent/20 h-9 w-9">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-lg font-bold text-center flex-1 flex items-center justify-center gap-2">
            <BarChart3 className="w-5 h-5 text-accent" />
            数字货币分析
          </h1>
          <div className="w-9" />
        </div>
      </header>

      {/* 主内容区 */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* 标题 */}
          <div className="mb-8 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">数字货币投资产品</h2>
            <p className="text-muted-foreground">选择适合你的投资策略</p>
          </div>

          {/* 产品卡片网格 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 周周赢产品卡片 */}
            <Card className="group hover:shadow-lg transition-all duration-300 border-border/60 hover:border-primary/50 overflow-hidden bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary border border-primary/20 shadow-[0_0_10px_rgba(var(--primary),0.2)]">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <CardTitle className="text-lg">周周赢</CardTitle>
                </div>
                <CardDescription>稳健收益理财产品</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">年化收益</span>
                    <span className="font-semibold text-primary">52%+</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">投资周期</span>
                    <span className="font-semibold">1年</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">最低投入</span>
                    <span className="font-semibold">10万 USDT</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">风险等级</span>
                    <span className="font-semibold text-yellow-500">R3</span>
                  </div>
                </div>
                <Link href="/weekly-win">
                  <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                    了解详情
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* 量化交易产品卡片 */}
            <Card className="group hover:shadow-lg transition-all duration-300 border-border/60 hover:border-primary/50 overflow-hidden bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary border border-primary/20 shadow-[0_0_10px_rgba(var(--primary),0.2)]">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <CardTitle className="text-lg">量化交易</CardTitle>
                </div>
                <CardDescription>AI驱动的自动交易系统</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">策略类型</span>
                    <span className="font-semibold">多因子组合</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">技术指标</span>
                    <span className="font-semibold">5个</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">回测周期</span>
                    <span className="font-semibold">自定义</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">风险等级</span>
                    <span className="font-semibold text-orange-500">R4</span>
                  </div>
                </div>
                <Link href="/quantitative-trading">
                  <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                    了解详情
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* 产品对比 */}
          <div className="mt-12 p-6 bg-card/50 border border-border/50 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">产品对比</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-2 px-2 font-semibold">特性</th>
                    <th className="text-center py-2 px-2 font-semibold">周周赢</th>
                    <th className="text-center py-2 px-2 font-semibold">量化交易</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/30">
                    <td className="py-2 px-2">投资方式</td>
                    <td className="text-center">委托管理</td>
                    <td className="text-center">自主交易</td>
                  </tr>
                  <tr className="border-b border-border/30">
                    <td className="py-2 px-2">风险程度</td>
                    <td className="text-center">中等</td>
                    <td className="text-center">较高</td>
                  </tr>
                  <tr className="border-b border-border/30">
                    <td className="py-2 px-2">收益潜力</td>
                    <td className="text-center">稳定</td>
                    <td className="text-center">高</td>
                  </tr>
                  <tr className="border-b border-border/30">
                    <td className="py-2 px-2">操作难度</td>
                    <td className="text-center">简单</td>
                    <td className="text-center">中等</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2">适合人群</td>
                    <td className="text-center">保守投资者</td>
                    <td className="text-center">专业交易者</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
