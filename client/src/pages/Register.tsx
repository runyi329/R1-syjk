import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";

export default function Register() {
  const [location, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const registerMutation = trpc.users.register.useMutation({
    onSuccess: () => {
      toast.success("注册成功！请登录");
      setLocation("/");
    },
    onError: (error) => {
      toast.error(error.message || "注册失败");
    },
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password || !name) {
      toast.error("请填写所有字段");
      return;
    }

    if (password.length < 6) {
      toast.error("密码至少6个字符");
      return;
    }

    setIsLoading(true);
    try {
      await registerMutation.mutateAsync({
        username,
        password,
        name,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-20 md:pb-0 bg-background font-sans text-foreground flex flex-col">
      {/* 头部 */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md z-50">
        <div className="container mx-auto py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="数金研投 Logo" className="w-10 h-10 rounded-lg shadow-[0_0_15px_rgba(var(--primary),0.3)]" />
            <div className="flex flex-col">
              <h1 className="text-lg font-bold tracking-tight leading-none text-primary">
                数金研投
              </h1>
              <span className="text-[10px] text-muted-foreground tracking-wider uppercase mt-1">Runyi Investment</span>
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setLocation("/")}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">返回</span>
          </Button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center py-8 px-4">
        <Card className="w-full max-w-md border-primary/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">创建账户</CardTitle>
            <CardDescription>使用用户名和密码注册新账户</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              {/* 用户名 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  用户名
                </label>
                <Input
                  type="text"
                  placeholder="2-20个字符"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  className="border-primary/20 focus:border-primary"
                />
                <p className="text-xs text-muted-foreground">
                  用户名长度2-20个字符
                </p>
              </div>

              {/* 昵称 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  昵称
                </label>
                <Input
                  type="text"
                  placeholder="2-20个字符"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  className="border-primary/20 focus:border-primary"
                />
                <p className="text-xs text-muted-foreground">
                  昵称长度2-20个字符
                </p>
              </div>

              {/* 密码 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  密码
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="至少6个字符"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="border-primary/20 focus:border-primary pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  密码长度至少6个字符
                </p>
              </div>

              {/* 注册按钮 */}
              <Button
                type="submit"
                disabled={isLoading || !username || !password || !name}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isLoading ? "注册中..." : "注册"}
              </Button>

              {/* 登录链接 */}
              <div className="text-center text-sm text-muted-foreground">
                已有账户？{" "}
                <button
                  type="button"
                  onClick={() => setLocation("/")}
                  className="text-primary hover:underline font-medium"
                >
                  返回登录
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
