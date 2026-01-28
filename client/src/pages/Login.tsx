import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [isLogin, setIsLogin] = useState(true); // true=登录，false=注册
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // 验证输入
    if (!username || !password) {
      setError("用户名和密码不能为空");
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }

    setLoading(true);

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const body = isLogin
        ? { username, password }
        : { username, password, name: name || username, email };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "操作失败，请稍后重试");
        return;
      }

      // 登录/注册成功，刷新认证状态并跳转到首页
      await utils.auth.me.invalidate();
      setLocation("/");
    } catch (err) {
      console.error("请求错误:", err);
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {isLogin ? "登录" : "注册"}
          </CardTitle>
          <CardDescription className="text-center">
            {isLogin ? "输入您的账号密码登录" : "创建一个新账号"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 用户名 */}
            <div className="space-y-2">
              <Label htmlFor="username">用户名</Label>
              <Input
                id="username"
                type="text"
                placeholder="请输入用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                autoComplete="username"
              />
            </div>

            {/* 密码 */}
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete={isLogin ? "current-password" : "new-password"}
              />
            </div>

            {/* 注册时的额外字段 */}
            {!isLogin && (
              <>
                {/* 确认密码 */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">确认密码</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="请再次输入密码"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    autoComplete="new-password"
                  />
                </div>

                {/* 姓名（可选） */}
                <div className="space-y-2">
                  <Label htmlFor="name">姓名（可选）</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="请输入姓名"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    autoComplete="name"
                  />
                </div>

                {/* 邮箱（可选） */}
                <div className="space-y-2">
                  <Label htmlFor="email">邮箱（可选）</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="请输入邮箱"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    autoComplete="email"
                  />
                </div>
              </>
            )}

            {/* 错误提示 */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* 提交按钮 */}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLogin ? "登录" : "注册"}
            </Button>

            {/* 切换登录/注册 */}
            <div className="text-center text-sm text-muted-foreground">
              {isLogin ? "还没有账号？" : "已有账号？"}
              <Button
                type="button"
                variant="link"
                className="p-0 ml-1 h-auto"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError("");
                }}
                disabled={loading}
              >
                {isLogin ? "立即注册" : "立即登录"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
