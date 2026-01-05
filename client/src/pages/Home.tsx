import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { Globe, ArrowRight, TrendingUp, ShieldCheck, Users, BarChart3, Coins, Gem, Layers, PieChart, Dices, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import contentData from "../data/investment-portal-content.json";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MarketTicker } from "@/components/MarketTicker";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function Home() {
  const { data: authData } = trpc.auth.me.useQuery();

  const { language, setLanguage } = useLanguage();
  const content = contentData.company[language];
  const categories = contentData.categories;

  return (
    <div className="min-h-screen bg-background font-sans text-foreground flex flex-col">
      {/* 头部导航 */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border-2 border-primary rounded-lg flex items-center justify-center text-primary font-serif font-bold text-xl shadow-[0_0_15px_rgba(var(--primary),0.3)] bg-black/50 backdrop-blur-sm">
              <span className="italic tracking-tighter">R1</span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold tracking-tight leading-none text-primary">
                {language === 'en' ? 'Runyi Investment' : '澳門潤儀投資'}
              </h1>
              <span className="text-[10px] text-muted-foreground tracking-wider uppercase mt-1">Runyi Investment</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {language === 'zh_TW' ? '繁體中文' : language === 'zh_CN' ? '简体中文' : 'English'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setLanguage('zh_TW')}>繁體中文</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage('zh_CN')}>简体中文</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage('en')}>English</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {authData && authData.role === 'admin' && (
              <Link href="/admin">
                <Button variant="outline" size="sm" className="border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground transition-colors text-xs px-2">
                  {language === 'en' ? 'Admin' : '后台'}
                </Button>
              </Link>
            )}
            {authData ? (
              <Link href="/user-center">
                <Button variant="outline" size="sm" className="border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground transition-colors text-xs px-2">
                  {language === 'en' ? 'User' : '个人'}
                </Button>
              </Link>
            ) : (
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground transition-colors text-xs px-2"
                  >
                    {language === 'en' ? 'Login' : '登录'}
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-foreground">
                      <AlertCircle className="h-5 w-5 text-yellow-500" />
                      {language === 'en' ? 'Login Notice' : '登录说明'}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground space-y-3 pt-2">
                      <p>
                        {language === 'en' 
                          ? 'OAuth login is currently unavailable in the development environment.' 
                          : '开发环境中暂时无法使用OAuth登录。'}
                      </p>
                      <p>
                        {language === 'en'
                          ? 'After publishing the website, OAuth login will work automatically with the official domain.'
                          : '发布网站后，OAuth登录将自动在正式域名上生效。'}
                      </p>
                      <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mt-3">
                        <p className="text-sm font-medium text-foreground">
                          {language === 'en' ? 'How to publish:' : '如何发布：'}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {language === 'en'
                            ? 'Click the "Publish" button in the top right corner of the management interface to publish your website.'
                            : '点击管理界面右上角的“发布”按钮即可发布网站。'}
                        </p>
                      </div>
                    </DialogDescription>
                  </DialogHeader>
                  <Button 
                    onClick={() => {
                      toast.info(language === 'en' ? 'Please publish the website first' : '请先发布网站');
                    }}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {language === 'en' ? 'I Understand' : '我知道了'}
                  </Button>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* 英雄区域 */}
        <section className="relative py-16 md:py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background -z-10" />
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1639322537228-f710d846310a?q=80&w=2832&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay -z-20" />
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-yellow-200 to-primary whitespace-nowrap">
                {language === 'en' ? 'Strategic Research for Personal Investment' : '個人投資的戰略研究'}
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-4xl mx-auto">
                {language === 'en' 
                  ? 'Macau Runyi Investment Co., Ltd. covers the Asia-Pacific region, specializing in providing commercial big data analysis and investment risk management services for individual investors.'
                  : '澳門潤儀投資有限公司業務覆蓋亞太地區，專為個人投資者提供商業大數據分析與投資風險管理服務。'}
              </p>

            </div>
          </div>
          
          {/* 实时行情栏 */}
          <div className="container mx-auto px-4 mt-8 md:mt-12">
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-2 shadow-sm">
              <MarketTicker />
            </div>
          </div>
        </section>

        {/* 核心优势 - 移动端横向滑动，桌面端三列布局 */}
        <section className="py-12 bg-secondary/10 border-y border-border/30 overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="flex md:grid md:grid-cols-3 gap-6 overflow-x-auto pb-4 md:pb-0 snap-x snap-mandatory scrollbar-hide">
              <div className="flex-shrink-0 w-[85vw] md:w-auto snap-center flex flex-col items-center text-center p-6 bg-card/50 backdrop-blur-sm rounded-xl border border-primary/20 hover:border-primary/50 transition-colors group">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform duration-300 border border-primary/20 shadow-[0_0_10px_rgba(var(--primary),0.2)]">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-primary mb-2">{language === 'en' ? 'Market Analysis' : '市場分析'}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {content.advantages[1].split('：')[1] || content.advantages[1].split(':')[1]}
                </p>
              </div>
              
              <div className="flex-shrink-0 w-[85vw] md:w-auto snap-center flex flex-col items-center text-center p-6 bg-card/50 backdrop-blur-sm rounded-xl border border-primary/20 hover:border-primary/50 transition-colors group">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform duration-300 border border-primary/20 shadow-[0_0_10px_rgba(var(--primary),0.2)]">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-primary mb-2">{language === 'en' ? 'Risk Control' : '風控建議'}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {content.advantages[2].split('：')[1] || content.advantages[2].split(':')[1]}
                </p>
              </div>
              
              <div className="flex-shrink-0 w-[85vw] md:w-auto snap-center flex flex-col items-center text-center p-6 bg-card/50 backdrop-blur-sm rounded-xl border border-primary/20 hover:border-primary/50 transition-colors group">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform duration-300 border border-primary/20 shadow-[0_0_10px_rgba(var(--primary),0.2)]">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-primary mb-2">{language === 'en' ? 'Client Focus' : '客戶至上'}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {content.advantages[3].split('：')[1] || content.advantages[3].split(':')[1]}
                </p>
              </div>
            </div>
            {/* 移动端滑动提示 */}
            <div className="flex justify-center gap-1 mt-2 md:hidden">
              <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-primary/30"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-primary/30"></div>
            </div>
          </div>
        </section>

        {/* 投资类别导航 */}
        <section className="py-8 md:py-16 container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              {language === 'en' ? 'Investment Sectors' : '投資領域'}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {content.cta}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category, index) => {
              const catData = category[language as keyof typeof category] as any;
              // 动态分配图标
              const icons = [BarChart3, Coins, Gem, Layers, PieChart, Dices];
              const IconComponent = icons[index % icons.length];
              
              return (
                <Card key={category.id} className="group hover:shadow-lg transition-all duration-300 border-border/60 hover:border-primary/50 overflow-hidden bg-card/80 backdrop-blur-sm">
                  <CardHeader className="pb-2 pt-4 px-5 flex flex-row items-center justify-between space-y-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary border border-primary/20 shadow-[0_0_10px_rgba(var(--primary),0.2)] group-hover:scale-110 transition-transform duration-300">
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors">
                        {catData.name}
                      </CardTitle>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </CardHeader>
                  <CardContent className="px-5 pb-4 pt-2">
                    <CardDescription className="line-clamp-1 text-xs mb-3 text-muted-foreground/80">
                      {catData.description}
                    </CardDescription>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                      {category.projects.map((project: { id: string; name_key: string; url?: string }) => (
                        <div key={project.id} className="flex items-center text-xs text-muted-foreground hover:text-primary transition-colors py-0.5">
                          <span className="w-1 h-1 rounded-full bg-primary mr-1.5 shadow-[0_0_5px_var(--primary)]" />
                          {project.url ? (
                            <Link href={project.url} className="truncate hover:underline cursor-pointer">
                              {project.name_key}
                            </Link>
                          ) : (
                            <span className="truncate">{project.name_key}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      </main>

      {/* 底部行动召唤 */}
      <section className="py-12 container mx-auto px-4 text-center">
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/shop">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 shadow-[0_0_20px_rgba(var(--primary),0.3)] border border-primary/50 w-full sm:w-auto">
              {language === 'en' ? 'Redeem Products' : '兑换商城'}
            </Button>
          </Link>
          <Button size="lg" variant="outline" className="border-primary/50 text-primary hover:bg-primary/10 text-lg px-8 w-full sm:w-auto">
            {language === 'en' ? 'Contact Us' : '聯繫我們'}
          </Button>
        </div>
      </section>

      <footer className="bg-card border-t border-border py-12 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <div className="w-12 h-12 border-2 border-primary rounded-lg flex items-center justify-center text-primary font-serif font-bold text-xl shadow-[0_0_15px_rgba(var(--primary),0.3)] bg-black/50 backdrop-blur-sm mx-auto mb-6">
            <span className="italic tracking-tighter">R1</span>
          </div>
          <h3 className="font-bold text-lg mb-2">{content.name}</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-8">
            {content.tagline}
          </p>
          <div className="border-t border-border/50 pt-8 text-xs text-muted-foreground">
            <p>© 2026 {content.name} | {language === 'en' ? 'All Rights Reserved' : '版權所有'}</p>
            <p className="mt-2 opacity-70">
              {language === 'en' ? 'Investment involves risk, please be cautious.' : '投資有風險，入市需謹慎。'}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
