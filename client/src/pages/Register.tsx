import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";

export default function Register() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: authData, isLoading: authLoading } = trpc.auth.me.useQuery();
  const { data: userData } = trpc.users.getMe.useQuery(undefined, {
    enabled: !!authData,
  });

  const utils = trpc.useUtils();

  useEffect(() => {
    // 如果未登录，跳转到首页
    if (!authLoading && !authData) {
      setLocation("/");
    }
    // 如果已经设置了用户名，跳转到用户中心
    if (userData && userData.name) {
      setLocation("/user-center");
    }
  }, [authData, authLoading, userData, setLocation]);

  const updateNameMutation = trpc.users.updateMyName.useMutation({
    onSuccess: () => {
      toast.success("注册成功！欢迎使用");
      utils.users.getMe.invalidate();
      setLocation("/user-center");
    },
    onError: (error: any) => {
      toast.error(`注册失败：${error.message}`);
      setIsSubmitting(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      toast.error("请输入用户名");
      return;
    }

    if (username.trim().length < 2) {
      toast.error("用户名至少需要2个字符");
      return;
    }

    if (username.trim().length > 20) {
      toast.error("用户名不能超过20个字符");
      return;
    }

    setIsSubmitting(true);
    updateNameMutation.mutate({ name: username.trim() });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen pb-20 md:pb-0 bg-black text-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 md:pb-0 bg-black text-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-black/50 border-white/10">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-[#D4AF37] rounded-full flex items-center justify-center mb-4">
            <UserPlus className="h-8 w-8 text-black" />
          </div>
          <CardTitle className="text-2xl text-white">欢迎注册</CardTitle>
          <CardDescription className="text-white/60">
            请设置您的用户名以完成注册
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-white">
                用户名
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="请输入用户名（2-20个字符）"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isSubmitting}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                maxLength={20}
              />
              <p className="text-xs text-white/40">
                用户名将用于显示您的身份，设置后可以在个人中心修改
              </p>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !username.trim()}
              className="w-full bg-[#D4AF37] text-black hover:bg-[#B8941F]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  注册中...
                </>
              ) : (
                "完成注册"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
