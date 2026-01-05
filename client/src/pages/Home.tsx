import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { Globe, ArrowRight, TrendingUp, ShieldCheck, Users, BarChart3, Coins, Gem, Layers, PieChart, Dices } from "lucide-react";
import { Link } from "wouter";
import contentData from "../data/investment-portal-content.json";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MarketTicker } from "@/components/MarketTicker";

export default function Home() {
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
            
            <Button variant="outline" size="sm" className="hidden sm:flex border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground transition-colors">
              {language === 'en' ? 'Login / Register' : '登錄 / 註冊'}
            </Button>
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
              <div className="flex flex-wrap justify-center gap-4 pt-4">
                <Button size="lg" className="rounded-full px-8 shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-primary to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-primary-foreground border-0">
                  {language === 'en' ? 'Start Investing' : '開始投資'}
                </Button>
                <Button size="lg" variant="outline" className="rounded-full px-8">
                  {language === 'en' ? 'Contact Us' : '聯繫我們'}
                </Button>
              </div>
            </div>
          </div>
          
          {/* 实时行情栏 */}
          <div className="container mx-auto px-4 mt-8 md:mt-12">
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-2 shadow-sm">
              <MarketTicker />
            </div>
          </div>
        </section>

        {/* 核心优势 - 横向三列带详情布局 */}
        <section className="py-12 bg-secondary/10 border-y border-border/30">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col items-center text-center p-6 bg-card/50 backdrop-blur-sm rounded-xl border border-primary/20 hover:border-primary/50 transition-colors group">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform duration-300 border border-primary/20">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-primary mb-2">{language === 'en' ? 'Market Analysis' : '市場分析'}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {content.advantages[1].split('：')[1] || content.advantages[1].split(':')[1]}
                </p>
              </div>
              
              <div className="flex flex-col items-center text-center p-6 bg-card/50 backdrop-blur-sm rounded-xl border border-primary/20 hover:border-primary/50 transition-colors group">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform duration-300 border border-primary/20">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-primary mb-2">{language === 'en' ? 'Risk Control' : '風控建議'}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {content.advantages[2].split('：')[1] || content.advantages[2].split(':')[1]}
                </p>
              </div>
              
              <div className="flex flex-col items-center text-center p-6 bg-card/50 backdrop-blur-sm rounded-xl border border-primary/20 hover:border-primary/50 transition-colors group">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform duration-300 border border-primary/20">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-primary mb-2">{language === 'en' ? 'Client Focus' : '客戶至上'}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {content.advantages[3].split('：')[1] || content.advantages[3].split(':')[1]}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 投资类别导航 */}
        <section className="py-16 container mx-auto px-4">
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
                      <div className="text-primary filter drop-shadow-[0_0_5px_rgba(var(--primary),0.5)]">
                        <IconComponent className="w-6 h-6" />
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

      <footer className="bg-card border-t border-border py-12 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-xl shadow-lg mx-auto mb-6">
            R
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
