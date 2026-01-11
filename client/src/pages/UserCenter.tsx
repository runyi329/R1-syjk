import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Loader2, TrendingUp, TrendingDown, Snowflake, Unlock, Eye, EyeOff, ArrowLeft, Crown } from "lucide-react";
import ScrollToTop from "@/components/ScrollToTop";

export default function UserCenter() {
  const [, setLocation] = useLocation();
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const [depositStatusFilter, setDepositStatusFilter] = useState<string | null>(null);
  const [withdrawStatusFilter, setWithdrawStatusFilter] = useState<string | null>(null);
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
  const { data: deposits, isLoading: depositsLoading } = trpc.deposits.getMyDeposits.useQuery(undefined, {
    enabled: !!user,
  });
  const { data: withdrawals, isLoading: withdrawalsLoading } = trpc.withdrawals.getMyWithdrawals.useQuery(undefined, {
    enabled: !!user,
  });

  const filteredDeposits = deposits?.filter(deposit => {
    if (!depositStatusFilter) return true;
    return deposit.status === depositStatusFilter;
  }) || [];

  const filteredWithdrawals = withdrawals?.filter(withdrawal => {
    if (!withdrawStatusFilter) return true;
    return withdrawal.withdrawal.status === withdrawStatusFilter;
  }) || [];

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
      <div className="min-h-screen pb-20 md:pb-0 bg-black text-white flex items-center justify-center">
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

  // 计算VIP等级
  const calculateVIPLevel = (balance: number): { level: number; label: string } => {
    if (balance >= 5000000) return { level: 5, label: "VIP 5" }; // 50万USDT
    if (balance >= 2000000) return { level: 4, label: "VIP 4" }; // 20万USDT
    if (balance >= 1000000) return { level: 3, label: "VIP 3" }; // 10万USDT
    if (balance >= 500000) return { level: 2, label: "VIP 2" };  // 5万USDT
    if (balance >= 100000) return { level: 1, label: "VIP 1" };  // 1万USDT
    return { level: 0, label: "普通用户" };
  };

  const vipInfo = calculateVIPLevel(parseFloat(userData.usdtBalance));

  // 计算VIP升级进度
  const calculateVIPProgress = (balance: number) => {
    const vipThresholds = [
      { level: 0, min: 0, max: 100000, label: "普通用户" },
      { level: 1, min: 100000, max: 500000, label: "VIP 1" },
      { level: 2, min: 500000, max: 1000000, label: "VIP 2" },
      { level: 3, min: 1000000, max: 2000000, label: "VIP 3" },
      { level: 4, min: 2000000, max: 5000000, label: "VIP 4" },
      { level: 5, min: 5000000, max: Infinity, label: "VIP 5" },
    ];

    const current = vipThresholds.find(t => balance >= t.min && balance < t.max);
    if (!current) return { current: "VIP 5", next: null, needed: 0, progress: 100 };

    const nextThreshold = vipThresholds.find(t => t.level === current.level + 1);
    if (!nextThreshold) return { current: current.label, next: null, needed: 0, progress: 100 };

    const needed = nextThreshold.min - balance;
    const progress = ((balance - current.min) / (nextThreshold.min - current.min)) * 100;

    return {
      current: current.label,
      next: nextThreshold.label,
      needed: Math.max(0, needed),
      progress: Math.min(100, Math.max(0, progress)),
    };
  };

  const vipProgress = calculateVIPProgress(parseFloat(userData.usdtBalance));



  return (
    <div className="min-h-screen pb-20 md:pb-0 bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-sm  z-50">
        <div className="container mx-auto flex items-center justify-between py-4">
          <button onClick={() => setLocation("/")} className="flex items-center gap-2">
            <img src="/logo.png" alt="数金研投 Logo" className="w-10 h-10 rounded" />
            <div>
              <div className="text-[#D4AF37] font-bold text-lg">数金研投</div>
              <div className="text-xs text-white/60">SHUJIN RESEARCH</div>
            </div>
          </button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/")}
            className="flex items-center gap-2 text-white/60 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">返回首页</span>
          </Button>
        </div>
      </header>

      <div className="container mx-auto py-4 px-2 sm:py-8 sm:px-4">
        {/* Account Overview - Combined Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6 mb-4 sm:mb-8">
          {/* Total Assets and Actions */}
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

          {/* Account Info - Combined Card */}
          <Card className="bg-black/50 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">账户信息</CardTitle>
              <CardDescription className="text-white/60">基本信息</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-xs sm:text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-white/60">用户名：</span>
                  <span className="text-white font-medium">{userData.name || "未设置"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60">VIP等级：</span>
                  <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-400/20 to-yellow-600/20 border border-amber-500/50 rounded-full px-3 py-1">
                    <img src="/vip-badge.png" alt="VIP" className="h-4 w-4" />
                    <span className="text-xs font-bold text-amber-400 whitespace-nowrap">
                      {vipInfo.label}
                    </span>
                  </div>
                </div>
                
                {/* VIP升级进度条 */}
                {vipProgress.next && (
                  <div className="space-y-2 pt-2 border-t border-white/10">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-white/60">升级进度：</span>
                      <span className="text-[#D4AF37] font-semibold">
                        {vipProgress.next} 还需 {vipProgress.needed.toFixed(0)} USDT
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden border border-white/20">
                      <div
                        className="h-full bg-gradient-to-r from-[#D4AF37] to-[#F0E68C] transition-all duration-300"
                        style={{ width: `${vipProgress.progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-white/40">
                      <span>{vipProgress.current}</span>
                      <span>{vipProgress.next}</span>
                    </div>
                  </div>
                )}
                {vipInfo.level === 5 && (
                  <div className="text-center text-xs text-[#D4AF37] pt-2 border-t border-white/10">
                    🎉 已达到最高VIP等级
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Account Status Badge */}
        <div className="mb-4 sm:mb-8">
          <Badge
            variant={userData.accountStatus === "active" ? "default" : "destructive"}
            className={`text-sm font-semibold ${
              userData.accountStatus === "active"
                ? "bg-green-500/20 text-green-400 border border-green-500/50"
                : "bg-red-500/20 text-red-400 border border-red-500/50"
            }`}
          >
            账户状态：{userData.accountStatus === "active" ? "正常" : "已冻结"}
          </Badge>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="transactions" className="w-full">
          <TabsList className="bg-black/50 border border-white/10 grid grid-cols-4 w-full">
            <TabsTrigger value="transactions" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black text-xs sm:text-sm">
              资金流水
            </TabsTrigger>
            <TabsTrigger value="deposits" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black text-xs sm:text-sm">
              充值历史
            </TabsTrigger>
            <TabsTrigger value="withdrawals" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black text-xs sm:text-sm">
              提现历史
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
                            {tx.notes && <div className="text-xs sm:text-sm text-white/60 line-clamp-1">{tx.notes}</div>}
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

          <TabsContent value="deposits" className="mt-6">
            <Card className="bg-black/50 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">充值历史</CardTitle>
                <CardDescription className="text-white/60">查看充值记录</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Status Filter */}
                <div className="flex gap-2 flex-wrap mb-4">
                  <Button
                    variant={depositStatusFilter === null ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDepositStatusFilter(null)}
                    className={depositStatusFilter === null ? "bg-[#D4AF37] text-black hover:bg-[#D4AF37]/80" : "border-white/20 text-white/60 hover:text-white"}
                  >
                    全部
                  </Button>
                  <Button
                    variant={depositStatusFilter === "pending" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDepositStatusFilter("pending")}
                    className={depositStatusFilter === "pending" ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30" : "border-white/20 text-white/60 hover:text-white"}
                  >
                    待确认
                  </Button>
                  <Button
                    variant={depositStatusFilter === "confirmed" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDepositStatusFilter("confirmed")}
                    className={depositStatusFilter === "confirmed" ? "bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30" : "border-white/20 text-white/60 hover:text-white"}
                  >
                    已到账
                  </Button>
                  <Button
                    variant={depositStatusFilter === "failed" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDepositStatusFilter("failed")}
                    className={depositStatusFilter === "failed" ? "bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30" : "border-white/20 text-white/60 hover:text-white"}
                  >
                    失败
                  </Button>
                </div>

                {depositsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-[#D4AF37]" />
                  </div>
                ) : !filteredDeposits || filteredDeposits.length === 0 ? (
                  <div className="text-center py-8 text-white/60">暂无充值记录</div>
                ) : (
                  <div className="space-y-4">
                    {filteredDeposits.map((deposit) => (
                      <div
                        key={deposit.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10"
                      >
                        <div className="flex-1">
                          <div className="text-white font-medium">充值 {parseFloat(deposit.amount).toFixed(2)} USDT</div>
                          <div className="text-xs text-white/40">
                            {new Date(deposit.createdAt).toLocaleString("zh-CN")}
                          </div>
                          {deposit.adminNotes && (
                            <div className="text-xs text-white/60 mt-2">{deposit.adminNotes}</div>
                          )}
                        </div>
                        <div className="text-right">
                          <Badge
                            className={`${
                              deposit.status === "confirmed"
                                ? "bg-green-500/20 text-green-400 border-green-500/30"
                                : deposit.status === "pending"
                                ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                                : "bg-red-500/20 text-red-400 border-red-500/30"
                            }`}
                          >
                            {deposit.status === "confirmed" ? "已到账" : deposit.status === "pending" ? "待确认" : "失败"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="withdrawals" className="mt-6">
            <Card className="bg-black/50 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">提现历史</CardTitle>
                <CardDescription className="text-white/60">查看提现记录</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Status Filter */}
                <div className="flex gap-2 flex-wrap mb-4">
                  <Button
                    variant={withdrawStatusFilter === null ? "default" : "outline"}
                    size="sm"
                    onClick={() => setWithdrawStatusFilter(null)}
                    className={withdrawStatusFilter === null ? "bg-[#D4AF37] text-black hover:bg-[#D4AF37]/80" : "border-white/20 text-white/60 hover:text-white"}
                  >
                    全部
                  </Button>
                  <Button
                    variant={withdrawStatusFilter === "pending" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setWithdrawStatusFilter("pending")}
                    className={withdrawStatusFilter === "pending" ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30" : "border-white/20 text-white/60 hover:text-white"}
                  >
                    待审核
                  </Button>
                  <Button
                    variant={withdrawStatusFilter === "approved" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setWithdrawStatusFilter("approved")}
                    className={withdrawStatusFilter === "approved" ? "bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30" : "border-white/20 text-white/60 hover:text-white"}
                  >
                    已批准
                  </Button>
                  <Button
                    variant={withdrawStatusFilter === "completed" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setWithdrawStatusFilter("completed")}
                    className={withdrawStatusFilter === "completed" ? "bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30" : "border-white/20 text-white/60 hover:text-white"}
                  >
                    已完成
                  </Button>
                  <Button
                    variant={withdrawStatusFilter === "rejected" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setWithdrawStatusFilter("rejected")}
                    className={withdrawStatusFilter === "rejected" ? "bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30" : "border-white/20 text-white/60 hover:text-white"}
                  >
                    已拒绝
                  </Button>
                </div>

                {withdrawalsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-[#D4AF37]" />
                  </div>
                ) : !filteredWithdrawals || filteredWithdrawals.length === 0 ? (
                  <div className="text-center py-8 text-white/60">暂无提现记录</div>
                ) : (
                  <div className="space-y-4">
                    {filteredWithdrawals.map(({ withdrawal, walletAddress }) => (
                      <div
                        key={withdrawal.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10"
                      >
                        <div className="flex-1">
                          <div className="text-white font-medium">提现 {parseFloat(withdrawal.amount).toFixed(2)} USDT</div>
                          <div className="text-sm text-white/60">{withdrawal.network} 网络</div>
                          <div className="text-xs text-white/40">
                            {new Date(withdrawal.createdAt).toLocaleString("zh-CN")}
                          </div>
                          {withdrawal.adminNotes && (
                            <div className="text-xs text-white/60 mt-2">{withdrawal.adminNotes}</div>
                          )}
                        </div>
                        <div className="text-right">
                          <Badge
                            className={`${
                              withdrawal.status === "completed"
                                ? "bg-green-500/20 text-green-400 border-green-500/30"
                                : withdrawal.status === "approved"
                                ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                                : withdrawal.status === "pending"
                                ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                                : "bg-red-500/20 text-red-400 border-red-500/30"
                            }`}
                          >
                            {withdrawal.status === "completed" ? "已完成" : withdrawal.status === "approved" ? "已批准" : withdrawal.status === "pending" ? "待审核" : "已拒绝"}
                          </Badge>
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
      <ScrollToTop />
    </div>
  );
}

// 导出VIP等级计算函数供其他组件使用
export function getVIPLevel(balance: number): { level: number; label: string } {
  if (balance >= 5000000) return { level: 5, label: "VIP 5" };
  if (balance >= 2000000) return { level: 4, label: "VIP 4" };
  if (balance >= 1000000) return { level: 3, label: "VIP 3" };
  if (balance >= 500000) return { level: 2, label: "VIP 2" };
  if (balance >= 100000) return { level: 1, label: "VIP 1" };
  return { level: 0, label: "普通用户" };
}
