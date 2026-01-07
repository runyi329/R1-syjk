import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Zap } from "lucide-react";
import { Link } from "wouter";

export default function CryptoAnalysis() {
  return (
    <div className="min-h-screen bg-background">
      {/* 导航栏 */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-center flex-1">数字货币分析</h1>
          <div className="w-10" />
        </div>
      </header>

      {/* 主内容 */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* 页面标题 */}
        <section className="space-y-2 text-center mb-12">
          <h2 className="text-4xl font-bold tracking-tight">数字货币投资产品</h2>
          <p className="text-lg text-muted-foreground">探索我们的数字货币投资产品</p>
        </section>

        {/* 周周赢产品卡片 */}
        <section className="space-y-6">
          <Card className="border-l-4 border-l-primary shadow-md overflow-hidden bg-gradient-to-br from-card to-secondary/30">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Zap className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold">周周赢</CardTitle>
                    <CardDescription>数字货币定期收益产品</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                周周赢是我们推出的创新数字货币产品，结合BTC、ETH等主流币种的市场行情，为投资者提供稳定的周期性收益机制。
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">预期年化</p>
                  <p className="text-xl font-bold text-primary">52%+</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">周期</p>
                  <p className="text-xl font-bold">1年</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">最低投入</p>
                  <p className="text-xl font-bold">10万 USDT</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">风险等级</p>
                  <p className="text-xl font-bold text-red-500" style={{color: '#14e151'}}>R3</p>
                </div>
              </div>
              <Link href="/weekly-win">
                <Button className="w-full mt-4 bg-primary hover:bg-primary/90">
                  了解详情
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* 风险提示 */}
          <Card className="border-l-4 border-l-yellow-500 bg-yellow-500/5">
            <CardHeader>
              <CardTitle className="text-yellow-600">⚠️ 风险提示</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                数字货币市场波动性大，投资存在风险。请根据自身风险承受能力谨慎投资。过往收益不代表未来表现，投资需谨慎。
              </p>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* 页脚 */}
      <footer className="border-t border-border bg-card/50 mt-12 py-8">
        <div className="container mx-auto text-center">
          <p className="text-sm text-muted-foreground">© 2026 数金研投 | 数字货币分析平台</p>
        </div>
      </footer>
    </div>
  );
}
