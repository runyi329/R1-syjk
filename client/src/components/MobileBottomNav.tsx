import { Home, BarChart3, User, LogOut } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function MobileBottomNav() {
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: authData } = trpc.auth.me.useQuery();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      // 清除auth.me查询的缓存
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      toast.success("已登出");
      setLocation("/");
    },
    onError: (error) => {
      toast.error(`登出失败：${error.message}`);
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const isActive = (path: string) => {
    return location === path || location.startsWith(path + "/");
  };

  // 只在移动端显示（md以下）
  return (
    <div className="fixed bottom-0 left-0 right-0 md:hidden bg-black/95 border-t border-white/10 backdrop-blur-sm z-40">
      <div className="flex items-center justify-around py-3">
        {/* 首页 */}
        <button
          onClick={() => setLocation("/")}
          className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${
            isActive("/")
              ? "text-[#D4AF37]"
              : "text-white/60 hover:text-white"
          }`}
        >
          <Home className="h-5 w-5" />
          <span className="text-xs">首页</span>
        </button>

        {/* 分析 */}
        <div className="relative group">
          <button
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${
              isActive("/baccarat") ||
              isActive("/roulette") ||
              isActive("/football") ||
              isActive("/poker") ||
              isActive("/crypto")
                ? "text-[#D4AF37]"
                : "text-white/60 hover:text-white"
            }`}
          >
            <BarChart3 className="h-5 w-5" />
            <span className="text-xs">分析</span>
          </button>

          {/* 分析子菜单 */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col gap-1 bg-black/95 border border-white/10 rounded-lg p-2 w-32">
            <button
              onClick={() => setLocation("/baccarat")}
              className="text-xs text-white/60 hover:text-[#D4AF37] px-3 py-2 rounded hover:bg-white/5 transition-all text-left"
            >
              百家乐
            </button>
            <button
              onClick={() => setLocation("/roulette")}
              className="text-xs text-white/60 hover:text-[#D4AF37] px-3 py-2 rounded hover:bg-white/5 transition-all text-left"
            >
              轮盘
            </button>
            <button
              onClick={() => setLocation("/football")}
              className="text-xs text-white/60 hover:text-[#D4AF37] px-3 py-2 rounded hover:bg-white/5 transition-all text-left"
            >
              足球
            </button>
            <button
              onClick={() => setLocation("/poker")}
              className="text-xs text-white/60 hover:text-[#D4AF37] px-3 py-2 rounded hover:bg-white/5 transition-all text-left"
            >
              扑克
            </button>
            <button
              onClick={() => setLocation("/crypto")}
              className="text-xs text-white/60 hover:text-[#D4AF37] px-3 py-2 rounded hover:bg-white/5 transition-all text-left"
            >
              数字货币
            </button>
          </div>
        </div>

        {/* 用户中心 */}
        {authData ? (
          <>
            <button
              onClick={() => setLocation("/user-center")}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${
                isActive("/user-center")
                  ? "text-[#D4AF37]"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <User className="h-5 w-5" />
              <span className="text-xs">我的</span>
            </button>

            {/* 登出 */}
            <button
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
              className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all text-white/60 hover:text-red-400"
            >
              <LogOut className="h-5 w-5" />
              <span className="text-xs">登出</span>
            </button>
          </>
        ) : (
          <button
            onClick={() => (window.location.href = "/api/oauth/login")}
            className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all text-[#D4AF37] hover:text-[#B8941F]"
          >
            <User className="h-5 w-5" />
            <span className="text-xs">登录</span>
          </button>
        )}
      </div>
    </div>
  );
}
