import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ArrowLeft, Eye, EyeOff, Mail, Lock, CheckCircle } from "lucide-react";

type Step = "email" | "code" | "password" | "success";

export default function ForgotPassword() {
  const [location, setLocation] = useLocation();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  // 发送验证码
  const sendCodeMutation = trpc.users.sendPasswordResetCode.useMutation({
    onSuccess: () => {
      toast.success("验证码已发送到您的邮箱");
      setStep("code");
      startResendCountdown();
    },
    onError: (error) => {
      toast.error(error.message || "发送验证码失败");
    },
  });

  // 验证验证码
  const verifyCodeMutation = trpc.users.verifyPasswordResetCode.useMutation({
    onSuccess: () => {
      toast.success("验证码正确");
      setStep("password");
    },
    onError: (error) => {
      toast.error(error.message || "验证码错误");
    },
  });

  // 重置密码
  const resetPasswordMutation = trpc.users.resetPassword.useMutation({
    onSuccess: () => {
      toast.success("密码重置成功！请使用新密码登录");
      setStep("success");
      setTimeout(() => {
        setLocation("/");
      }, 2000);
    },
    onError: (error) => {
      toast.error(error.message || "密码重置失败");
    },
  });

  const startResendCountdown = () => {
    setResendCountdown(60);
    const interval = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("请输入邮箱地址");
      return;
    }

    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      toast.error("邮箱格式不正确");
      return;
    }

    setIsLoading(true);
    try {
      await sendCodeMutation.mutateAsync({ email });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code) {
      toast.error("请输入验证码");
      return;
    }

    if (code.length !== 4) {
      toast.error("验证码必须是4位数字");
      return;
    }

    setIsLoading(true);
    try {
      await verifyCodeMutation.mutateAsync({ token, code });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) {
      toast.error("请填写所有字段");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("密码至少需要8个字符");
      return;
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      toast.error("密码必须包含大写字母、小写字母和数字");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("两次输入的密码不一致");
      return;
    }

    setIsLoading(true);
    try {
      await resetPasswordMutation.mutateAsync({ token, newPassword });
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
        <div className="w-full max-w-md">
          <Card className="border-primary/20 shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-primary">
                重置密码
              </CardTitle>
              <CardDescription>
                {step === "email" && "输入您的邮箱地址"}
                {step === "code" && "输入发送到邮箱的验证码"}
                {step === "password" && "设置新密码"}
                {step === "success" && "密码重置成功"}
              </CardDescription>
            </CardHeader>

            <CardContent>
              {/* 第一步：输入邮箱 */}
              {step === "email" && (
                <form onSubmit={handleSendCode} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">邮箱地址</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="输入您的邮箱地址"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                        className="pl-10 border-primary/20 focus:border-primary"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      我们将向此邮箱发送密码重置验证码
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading || !email}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {isLoading ? "发送中..." : "发送验证码"}
                  </Button>

                  <div className="text-center text-sm text-muted-foreground">
                    <button
                      type="button"
                      onClick={() => setLocation("/")}
                      className="text-primary hover:underline font-medium"
                    >
                      返回登录
                    </button>
                  </div>
                </form>
              )}

              {/* 第二步：输入验证码 */}
              {step === "code" && (
                <form onSubmit={handleVerifyCode} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">验证码</label>
                    <Input
                      type="text"
                      placeholder="输入4位验证码"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      disabled={isLoading}
                      maxLength={4}
                      className="text-center text-2xl tracking-widest border-primary/20 focus:border-primary"
                    />
                    <p className="text-xs text-muted-foreground">
                      验证码已发送到 {email}
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading || code.length !== 4}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {isLoading ? "验证中..." : "验证"}
                  </Button>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={resendCountdown > 0 || isLoading}
                      onClick={handleSendCode}
                      className="flex-1"
                    >
                      {resendCountdown > 0 ? `重新发送 (${resendCountdown}s)` : "重新发送"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setStep("email");
                        setCode("");
                        setToken("");
                      }}
                      className="flex-1"
                    >
                      修改邮箱
                    </Button>
                  </div>
                </form>
              )}

              {/* 第三步：设置新密码 */}
              {step === "password" && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">新密码</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="至少8个字符，包含大小写字母和数字"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        disabled={isLoading}
                        className="pl-10 pr-10 border-primary/20 focus:border-primary"
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
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">确认密码</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="再次输入新密码"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={isLoading}
                        className="pl-10 pr-10 border-primary/20 focus:border-primary"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      密码需要至少8个字符，包含大写字母、小写字母和数字
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading || !newPassword || !confirmPassword}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {isLoading ? "重置中..." : "重置密码"}
                  </Button>
                </form>
              )}

              {/* 成功提示 */}
              {step === "success" && (
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <CheckCircle className="w-16 h-16 text-green-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      密码重置成功！
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      您的密码已成功重置，请使用新密码登录
                    </p>
                  </div>
                  <Button
                    onClick={() => setLocation("/")}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    返回登录
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
