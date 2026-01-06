import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Loader2, TrendingUp, TrendingDown, Snowflake, Unlock, Eye, EyeOff } from "lucide-react";

export default function UserCenter() {
  const [, setLocation] = useLocation();
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const { data: authData, isLoading: authLoading } = trpc.auth.me.useQuery();
  const user = authData;
  const { data: userData, isLoading: userLoading } = trpc.users.getMe.useQuery(undefined, {
    enabled: !!user,
  });
  const { data: transactions, isLoading: transactionsLoading } = trpc.points.getMyTransactions.useQuery(undefined, {
    enabled: !!user,
  });
  const { data: orders, isLoading: ordersLoading } = trpc.orders.getMyOrders.useQuery(undefined, {
    enabled: !!user,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/");
    }
    // 如果用户已登录但未设置用户名，跳转到注册页面
    if (userData && !userData.name) {
      setLocation("/register");
    }
  }, [user, authLoading, userData, setLocation]);

  if (authLoading || userLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  if (!userData) {
    return null;
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "credit":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "debit":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case "freeze":
        return <Snowflake className="h-4 w-4 text-orange-500" />;
      case "unfreeze":
        return <Unlock className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case "credit":
        return "充值";
      case "debit":
        return "扣除";
      case "freeze":
        return "冻结";
      case "unfreeze":
        return "解冻";
      default:
        return type;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-sm md:sticky md:top-0 z-50">
        <div className="container mx-auto flex items-center justify-between py-4">
          <button onClick={() => setLocation("/")} className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#D4AF37] rounded flex items-center justify-center font-bold text-black">
              R1
            </div>
            <div>
              <div className="text-[#D4AF37] font-bold text-lg">数金研投</div>
              <div className="text-xs text-white/60">SHUJIN RESEARCH</div>
            </div>
          </button>
        </div>
      </header>

      <div className="container mx-auto py-4 px-2 sm:py-8 sm:px-4">
        {/* Account Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6 mb-4 sm:mb-8">
          <Card className="bg-gradient-to-br from-[#D4AF37]/20 to-black border-[#D4AF37]/30">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">总资产</CardTitle>
                <button
                  onClick={() => setIsBalanceVisible(!isBalanceVisible)}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  {isBalanceVisible ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl sm:text-4xl font-bold text-[#D4AF37] mb-4">
                {isBalanceVisible ? (
                  <>
                    {parseFloat(userData.usdtBalance).toFixed(2)}{" "}
                    <span className="text-xs sm:text-sm text-white/60">USDT</span>
                  </>
                ) : (
                  <>
                    ****{" "}
                    <span className="text-xs sm:text-sm text-white/60">USDT</span>
                  </>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => setLocation("/deposit")}
                  className="bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-black font-semibold"
                  size="sm"
                >
                  充值
                </Button>
                <Button
                  onClick={() => setLocation("/withdraw")}
                  variant="outline"
                  className="border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37]/10"
                  size="sm"
                >
                  提现
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/50 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">账户状态</CardTitle>
              <CardDescription className="text-white/60">当前账户状态</CardDescription>
            </CardHeader>
            <CardContent>
              <Badge
                variant={userData.accountStatus === "active" ? "default" : "destructive"}
                className={
                  userData.accountStatus === "active"
                    ? "bg-green-500/20 text-green-400 border-green-500/50"
                    : "bg-red-500/20 text-red-400 border-red-500/50"
                }
              >
                {userData.accountStatus === "active" ? "正常" : "已冻结"}
              </Badge>
            </CardContent>
          </Card>

          <Card className="bg-black/50 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">账户信息</CardTitle>
              <CardDescription className="text-white/60">基本信息</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span className="text-white/60">用户名：</span>
                  <span className="text-white">{userData.name || "未设置"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">角色：</span>
                  <Badge variant="outline" className="text-[#D4AF37] border-[#D4AF37]/50 text-xs">
                    {userData.role === "admin" ? "管理员" : "普通用户"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="transactions" className="w-full">
          <TabsList className="bg-black/50 border border-white/10 grid grid-cols-2 w-full">
            <TabsTrigger value="transactions" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black text-xs sm:text-sm">
              资金流水
            </TabsTrigger>
            <TabsTrigger value="orders" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black text-xs sm:text-sm">
              我的订单
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="mt-6">
            <Card className="bg-black/50 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">资金流水记录</CardTitle>
                <CardDescription className="text-white/60">所有资金变动记录</CardDescription>
              </CardHeader>
              <CardContent>
                {transactionsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-[#D4AF37]" />
                  </div>
                ) : !transactions || transactions.length === 0 ? (
                  <div className="text-center py-8 text-white/60">暂无流水记录</div>
                ) : (
                  <div className="space-y-4">
                    {transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 rounded-lg bg-white/5 border border-white/10 gap-2"
                      >
                        <div className="flex items-center gap-2 sm:gap-3">
                          {getTransactionIcon(tx.type)}
                          <div className="flex-1">
                            <div className="text-white font-medium text-sm sm:text-base">{getTransactionLabel(tx.type)}</div>
                            <div className="text-xs sm:text-sm text-white/60 line-clamp-1">{tx.notes || "无备注"}</div>
                            <div className="text-xs text-white/40">
                              {new Date(tx.createdAt).toLocaleString("zh-CN")}
                            </div>
                          </div>
                        </div>
                        <div className="text-right sm:text-right ml-auto">
                          <div
                            className={`text-base sm:text-lg font-bold ${
                              parseFloat(tx.amount) >= 0 ? "text-green-400" : "text-red-400"
                            }`}
                          >
                            {parseFloat(tx.amount) >= 0 ? "+" : ""}
                            {parseFloat(tx.amount).toFixed(2)} USDT
                          </div>
                          <div className="text-xs sm:text-sm text-white/60">
                            余额：{parseFloat(tx.balanceAfter).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="mt-6">
            <Card className="bg-black/50 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">我的订单</CardTitle>
                <CardDescription className="text-white/60">查看兑换记录</CardDescription>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-[#D4AF37]" />
                  </div>
                ) : !orders || orders.length === 0 ? (
                  <div className="text-center py-8 text-white/60">暂无订单记录</div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10"
                      >
                        <div>
                          <div className="text-white font-medium">订单 #{order.id}</div>
                          <div className="text-sm text-white/60">商品ID: {order.productId}</div>
                          <div className="text-sm text-white/60">数量: {order.quantity}</div>
                          <div className="text-xs text-white/40">
                            {new Date(order.createdAt).toLocaleString("zh-CN")}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-[#D4AF37]">
                            {parseFloat(order.totalPrice).toFixed(2)} USDT
                          </div>
                          <Badge
                            variant={order.status === "completed" ? "default" : "secondary"}
                            className={
                              order.status === "completed"
                                ? "bg-green-500/20 text-green-400 border-green-500/50"
                                : order.status === "pending"
                                ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
                                : "bg-red-500/20 text-red-400 border-red-500/50"
                            }
                          >
                            {order.status === "completed"
                              ? "已完成"
                              : order.status === "pending"
                              ? "处理中"
                              : "已取消"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
