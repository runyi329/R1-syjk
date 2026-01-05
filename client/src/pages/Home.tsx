import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { Globe, ArrowRight, TrendingUp, ShieldCheck, Users } from "lucide-react";
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
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-xl shadow-lg">
              R
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold tracking-tight leading-none">{content.name}</h1>
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
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* 英雄区域 */}
        <section className="relative py-16 md:py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent -z-10" />
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
                {content.tagline}
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                {content.description}
              </p>
              <div className="flex flex-wrap justify-center gap-4 pt-4">
                <Button size="lg" className="rounded-full px-8 shadow-lg hover:shadow-xl transition-all">
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

        {/* 核心优势 */}
        <section className="py-12 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center space-y-3 p-6 bg-card rounded-xl shadow-sm border border-border/50">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-2">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg">{language === 'en' ? 'Market Analysis' : '市場分析'}</h3>
                <p className="text-sm text-muted-foreground">
                  {content.advantages[1].split('：')[1] || content.advantages[1].split(':')[1]}
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-3 p-6 bg-card rounded-xl shadow-sm border border-border/50">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-2">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg">{language === 'en' ? 'Risk Control' : '風控建議'}</h3>
                <p className="text-sm text-muted-foreground">
                  {content.advantages[2].split('：')[1] || content.advantages[2].split(':')[1]}
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-3 p-6 bg-card rounded-xl shadow-sm border border-border/50">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-2">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg">{language === 'en' ? 'Client Focus' : '客戶至上'}</h3>
                <p className="text-sm text-muted-foreground">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => {
              const catData = category[language as keyof typeof category] as any;
              return (
                <Card key={category.id} className="group hover:shadow-lg transition-all duration-300 border-border/60 hover:border-primary/30 overflow-hidden">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-4xl mb-2">{catData.icon}</div>
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">
                      {catData.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 min-h-[40px]">
                      {catData.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {category.projects.map((project: { id: string; name_key: string; url?: string }) => (
                        <div key={project.id} className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors py-1 border-b border-border/30 last:border-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/50 mr-2" />
                          {project.url ? (
                            <Link href={project.url} className="flex-1 flex items-center justify-between hover:text-primary cursor-pointer">
                              {project.name_key}
                              <ArrowRight className="w-3 h-3 opacity-50" />
                            </Link>
                          ) : (
                            <span className="flex-1">{project.name_key}</span>
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
