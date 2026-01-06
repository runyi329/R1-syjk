import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { Globe, ArrowRight, TrendingUp, ShieldCheck, Users, BarChart3, Coins, Gem, Layers, PieChart, Dices, LogOut, LogIn } from "lucide-react";
import { Link, useLocation } from "wouter";
import contentData from "../data/investment-portal-content.json";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MarketTicker } from "@/components/MarketTicker";
import { trpc } from "@/lib/trpc";
import ScrollToTop from "@/components/ScrollToTop";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { PuzzleCaptcha } from "@/components/PuzzleCaptcha";

export default function Home() {
  const { data: authData } = trpc.auth.me.useQuery();
  const [location, setLocation] = useLocation();
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [requiresCaptcha, setRequiresCaptcha] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState(10);

  const { language, setLanguage } = useLanguage();
  const content = contentData.company[language];
  const categories = contentData.categories;

  const loginMutation = trpc.users.loginWithPassword.useMutation({
    onSuccess: () => {
      toast.success(language === 'en' ? "Login successful!" : "登录成功！");
      setIsLoginDialogOpen(false);
      setLoginUsername("");
      setLoginPassword("");
      setRequiresCaptcha(false);
      setCaptchaToken(null);
      window.location.href = "/";
    },
    onError: (error: any) => {
      const cause = error.cause;
      if (cause?.requiresCaptcha) {
        setRemainingAttempts(cause.remainingAttempts || 0);
        if (!captchaToken) {
          // 生成新的验证码
          generateNewCaptcha();
        }
        setRequiresCaptcha(true);
      }
      toast.error(error.message || (language === 'en' ? "Login failed" : "登录失败"));
    },
  });

  const generateCaptchaMutation = trpc.users.generateCaptcha.useMutation({
    onSuccess: (data) => {
      setCaptchaToken(data.token);
      setRequiresCaptcha(true);
    },
    onError: () => {
      toast.error(language === 'en' ? "Failed to generate captcha" : "生成验证码失败");
    },
  });

  const generateNewCaptcha = () => {
    generateCaptchaMutation.mutate();
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername || !loginPassword) {
      toast.error(language === 'en' ? "Please enter username and password" : "请输入用户名和密码");
      return;
    }
    setIsLoggingIn(true);
    try {
      await loginMutation.mutateAsync({
        username: loginUsername,
        password: loginPassword,
        captchaToken: captchaToken || undefined,
        captchaAnswer: undefined,
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleCaptchaVerified = async (answer: string) => {
    setIsLoggingIn(true);
    try {
      await loginMutation.mutateAsync({
        username: loginUsername,
        password: loginPassword,
        captchaToken: captchaToken || "",
        captchaAnswer: answer,
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/';
    },
    onError: (error) => {
      toast.error(language === 'en' ? 'Logout failed' : '登出失败');
      console.error('Logout failed:', error);
    },
  });

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen pb-20 md:pb-0 bg-background font-sans text-foreground flex flex-col">
      {/* 头部导航 */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md z-50">
        <div className="container mx-auto py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="数金研投 Logo" className="w-10 h-10 rounded-lg shadow-[0_0_15px_rgba(var(--primary),0.3)]" />
            <div className="flex flex-col">
              <h1 className="text-lg font-bold tracking-tight leading-none text-primary">
                {language === 'en' ? 'Runyi Investment' : '数金研投'}
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
              <div className="flex gap-2 items-center">
                <Link href="/user-center">
                  <Button variant="outline" size="sm" className="border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground transition-colors text-xs px-2">
                    {language === 'en' ? 'User Center' : '个人中心'}
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white transition-colors text-xs px-2 flex items-center gap-1"
                  onClick={handleLogout}
                >
                  <LogOut className="w-3 h-3" />
                  {language === 'en' ? 'Logout' : '登出'}
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                {/* 注册按钮 */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground transition-colors text-xs px-2"
                  onClick={() => setLocation('/register')}
                >
                  {language === 'en' ? 'Register' : '注册'}
                </Button>

                {/* 用户名+密码登录对话框 */}
                <Dialog open={isLoginDialogOpen} onOpenChange={setIsLoginDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground transition-colors text-xs px-2 flex items-center gap-1"
                    >
                      <LogIn className="w-3 h-3" />
                      <span className="hidden sm:inline">{language === 'en' ? 'Login' : '登录'}</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>{language === 'en' ? 'Login' : '登录'}</DialogTitle>
                      <DialogDescription>
                        {language === 'en' ? 'Enter your username and password' : '输入用户名和密码登录'}
                      </DialogDescription>
                    </DialogHeader>

                    {requiresCaptcha && captchaToken ? (
                      <div className="space-y-4">
                        <PuzzleCaptcha
                          token={captchaToken}
                          onVerified={handleCaptchaVerified}
                          onClose={() => {
                            setRequiresCaptcha(false);
                            setCaptchaToken(null);
                          }}
                        />
                        <div className="text-center text-sm text-muted-foreground">
                          {language === 'en' ? `Remaining attempts: ${remainingAttempts}` : `剩余尝试次数: ${remainingAttempts}`}
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handlePasswordLogin} className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            {language === 'en' ? 'Username' : '用户名'}
                          </label>
                          <Input
                            type="text"
                            placeholder={language === 'en' ? 'Enter username' : '输入用户名'}
                            value={loginUsername}
                            onChange={(e) => setLoginUsername(e.target.value)}
                            disabled={isLoggingIn}
                            className="border-primary/20 focus:border-primary"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            {language === 'en' ? 'Password' : '密码'}
                          </label>
                          <Input
                            type="password"
                            placeholder={language === 'en' ? 'Enter password' : '输入密码'}
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            disabled={isLoggingIn}
                            className="border-primary/20 focus:border-primary"
                          />
                        </div>
                        {remainingAttempts < 10 && (
                          <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                            {language === 'en' 
                              ? `Remaining attempts: ${remainingAttempts}` 
                              : `剩余尝试次数: ${remainingAttempts}`}
                          </div>
                        )}
                        <Button
                          type="submit"
                          disabled={isLoggingIn || !loginUsername || !loginPassword}
                          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                          {isLoggingIn ? (language === 'en' ? 'Logging in...' : '登录中...') : (language === 'en' ? 'Login' : '登录')}
                        </Button>
                      </form>
                    )}
                  </DialogContent>
                </Dialog>

                {/* OAuth登录按钮 */}
                <Button 
                  variant="default" 
                  size="sm" 
                  className="bg-primary/80 hover:bg-primary text-primary-foreground transition-colors text-xs px-2"
                  onClick={() => window.location.href = '/api/oauth/login'}
                >
                  {language === 'en' ? 'OAuth' : 'OAuth登录'}
                </Button>
              </div>
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
                {language === 'en' ? 'Strategic Research for Personal Investment' : '个人投资的战略研究'}
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
          <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 shadow-[0_0_20px_rgba(var(--primary),0.3)] border border-primary/50 w-full sm:w-auto">
            {language === 'en' ? 'Start Investing' : '開始投資'}
          </Button>
          <Button size="lg" variant="outline" className="border-primary/50 text-primary hover:bg-primary/10 text-lg px-8 w-full sm:w-auto">
            {language === 'en' ? 'Contact Us' : '聯繫我們'}
          </Button>
        </div>
      </section>

      <footer className="bg-card border-t border-border py-12 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <div className="w-12 h-12 border-2 border-primary rounded-lg flex items-center justify-center text-primary font-serif font-bold text-xl shadow-[0_0_15px_rgba(var(--primary),0.3)] bg-black/50 backdrop-blur-sm mx-auto mb-6">
            <img src="/logo.png" alt="Logo" className="w-full h-full rounded-md" />
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

      <ScrollToTop />
    </div>
  );
}
