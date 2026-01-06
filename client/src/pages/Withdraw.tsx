import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { ArrowLeft, Info, AlertCircle } from "lucide-react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, XCircle, AlertTriangle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function Withdraw() {
  const [, setLocation] = useLocation();
  const [selectedNetwork, setSelectedNetwork] = useState("Aptos");
  const [selectedWalletId, setSelectedWalletId] = useState<number | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  
  const { data: userData } = trpc.users.getMe.useQuery();
  const balance = userData ? parseFloat(userData.usdtBalance) : 0;
  const { data: walletAddresses } = trpc.walletAddresses.getMyApprovedWalletAddresses.useQuery();
  const { data: withdrawals, refetch } = trpc.withdrawals.getMyWithdrawals.useQuery();
  const createWithdrawalMutation = trpc.withdrawals.create.useMutation();

  const filteredWithdrawals = withdrawals?.filter(withdrawal => {
    if (!statusFilter) return true;
    return withdrawal.withdrawal.status === statusFilter;
  }) || [];

  const networks = [
    { name: "Aptos", minAmount: 0.01, fee: "0.5 USDT", arrivalTime: "约 1 分钟" },
    { name: "Ethereum", minAmount: 10, fee: "5 USDT", arrivalTime: "约 5-10 分钟" },
    { name: "BSC", minAmount: 1, fee: "1 USDT", arrivalTime: "约 3 分钟" },
    { name: "Polygon", minAmount: 1, fee: "0.8 USDT", arrivalTime: "约 2 分钟" },
  ];

  const currentNetwork = networks.find(n => n.name === selectedNetwork) || networks[0];
  const withdrawAmountNum = parseFloat(withdrawAmount) || 0;
  const feeNum = parseFloat(currentNetwork.fee);
  const actualAmount = withdrawAmountNum - feeNum;

  const handleWithdraw = async () => {
    if (!selectedWalletId) {
      toast.error("请选择提现地址");
      return;
    }
    if (!withdrawAmount || withdrawAmountNum <= 0) {
      toast.error("请输入提现金额");
      return;
    }
    if (withdrawAmountNum < currentNetwork.minAmount) {
      toast.error(`最小提现金额为 ${currentNetwork.minAmount} USDT`);
      return;
    }
    if (withdrawAmountNum > balance) {
      toast.error("余额不足");
      return;
    }

    try {
      await createWithdrawalMutation.mutateAsync({
        walletAddressId: selectedWalletId,
        amount: withdrawAmount,
        fee: currentNetwork.fee.split(" ")[0],
      });
      toast.success("提现申请已提交，请等待审核");
      setSelectedWalletId(null);
      setWithdrawAmount("");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "提现失败");
    }
  };

  const setMaxAmount = () => {
    setWithdrawAmount(balance.toFixed(2));
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-sm z-50">
        <div className="container mx-auto flex items-center justify-between py-4">
          <button onClick={() => setLocation("/user-center")} className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span className="hidden sm:inline">返回</span>
          </button>
          <h1 className="text-lg sm:text-xl font-bold">提现 USDT</h1>
          <div className="w-16"></div>
        </div>
      </header>

      <div className="container mx-auto py-4 px-2 sm:py-8 sm:px-4 max-w-2xl">
        <Tabs defaultValue="withdraw" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/5 mb-4">
            <TabsTrigger value="withdraw">提现</TabsTrigger>
            <TabsTrigger value="history">提现记录</TabsTrigger>
          </TabsList>

          <TabsContent value="withdraw" className="space-y-4">
        {/* Balance Card */}
        <Card className="bg-gradient-to-br from-[#D4AF37]/10 to-black border-[#D4AF37]/30 mb-4">
          <CardContent className="py-4">
            <div className="text-center">
              <p className="text-sm text-white/60 mb-1">可用余额</p>
              <p className="text-3xl font-bold text-[#D4AF37]">
                {balance.toFixed(2)} <span className="text-sm text-white/60">USDT</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Network Selection */}
        <Card className="bg-black/50 border-white/10 mb-4">
          <CardHeader>
            <CardTitle className="text-white text-base sm:text-lg">提币账户</CardTitle>
            <CardDescription className="text-white/60 text-xs sm:text-sm">选择提现网络</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {networks.map((network) => (
                <Button
                  key={network.name}
                  variant={selectedNetwork === network.name ? "default" : "outline"}
                  onClick={() => setSelectedNetwork(network.name)}
                  className={
                    selectedNetwork === network.name
                      ? "bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-black"
                      : "bg-transparent border-white/20 text-white hover:bg-white/10"
                  }
                >
                  {network.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Withdraw Address */}
        <Card className="bg-black/50 border-white/10 mb-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-base sm:text-lg">提现地址</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/wallet-addresses")}
                className="text-[#D4AF37] hover:text-[#D4AF37]/80"
              >
                管理地址
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!walletAddresses || walletAddresses.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-white/60 text-sm mb-3">暂无已批准的钱包地址</p>
                <Button
                  onClick={() => setLocation("/wallet-addresses")}
                  className="bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-black"
                  size="sm"
                >
                  添加钱包地址
                </Button>
              </div>
            ) : (
              <Select
                value={selectedWalletId?.toString()}
                onValueChange={(value) => setSelectedWalletId(parseInt(value))}
              >
                <SelectTrigger className="bg-gray-900/50 border-gray-800 text-white">
                  <SelectValue placeholder="选择提现地址" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-800 text-white">
                  {walletAddresses.map((wallet) => (
                    <SelectItem key={wallet.id} value={wallet.id.toString()}>
                      <div className="flex flex-col">
                        <span>{wallet.label || wallet.address.substring(0, 20) + "..."}</span>
                        <span className="text-xs text-white/60">{wallet.network}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>

        {/* Withdraw Amount */}
        <Card className="bg-black/50 border-white/10 mb-4">
          <CardHeader>
            <CardTitle className="text-white text-base sm:text-lg">提现金额</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Input
                type="number"
                placeholder="请输入提现金额"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="bg-gray-900/50 border-gray-800 text-white placeholder:text-white/40 pr-20"
              />
              <Button
                size="sm"
                onClick={setMaxAmount}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-black"
              >
                全部
              </Button>
            </div>
            <div className="text-xs text-white/60">
              最小提现金额：{currentNetwork.minAmount} USDT
            </div>
          </CardContent>
        </Card>

        {/* Fee Info */}
        {withdrawAmountNum > 0 && (
          <Card className="bg-black/50 border-white/10 mb-4">
            <CardContent className="py-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">提现金额</span>
                <span className="text-white font-medium">{withdrawAmountNum.toFixed(2)} USDT</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">手续费</span>
                <span className="text-white font-medium">{currentNetwork.fee}</span>
              </div>
              <div className="border-t border-white/10 pt-2 flex items-center justify-between">
                <span className="text-white/80">实际到账</span>
                <span className="text-[#D4AF37] font-bold text-lg">
                  {actualAmount > 0 ? actualAmount.toFixed(2) : "0.00"} USDT
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Cards */}
        <div className="space-y-3 mb-4">
          <Card className="bg-black/50 border-white/10">
            <CardContent className="py-3 sm:py-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-white/60">
                  <Info className="h-4 w-4" />
                  <span>到账时间</span>
                </div>
                <span className="text-white font-medium">{currentNetwork.arrivalTime}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleWithdraw}
          className="w-full bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-black font-bold py-6 text-base"
          disabled={!selectedWalletId || !withdrawAmount || withdrawAmountNum <= 0 || createWithdrawalMutation.isPending}
        >
          {createWithdrawalMutation.isPending ? "提交中..." : "确认提现"}
        </Button>

        {/* Warning */}
        <Card className="bg-red-900/20 border-red-800 mt-4">
          <CardContent className="py-3 sm:py-4">
            <div className="flex gap-2">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-red-300">
                <p className="font-semibold mb-1">重要提示：</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>请确保提现地址正确，错误地址将导致资产丢失</li>
                  <li>请确认提现地址支持 {selectedNetwork} 网络</li>
                  <li>提现申请提交后无法撤销</li>
                  <li>提现需要人工审核，请耐心等待</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-3">
            {/* Status Filter */}
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={statusFilter === null ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(null)}
                className={statusFilter === null ? "bg-[#D4AF37] text-black hover:bg-[#D4AF37]/80" : "border-white/20 text-white/60 hover:text-white"}
              >
                全部
              </Button>
              <Button
                variant={statusFilter === "pending" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("pending")}
                className={statusFilter === "pending" ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30" : "border-white/20 text-white/60 hover:text-white"}
              >
                待审核
              </Button>
              <Button
                variant={statusFilter === "approved" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("approved")}
                className={statusFilter === "approved" ? "bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30" : "border-white/20 text-white/60 hover:text-white"}
              >
                已批准
              </Button>
              <Button
                variant={statusFilter === "completed" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("completed")}
                className={statusFilter === "completed" ? "bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30" : "border-white/20 text-white/60 hover:text-white"}
              >
                已完成
              </Button>
              <Button
                variant={statusFilter === "rejected" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("rejected")}
                className={statusFilter === "rejected" ? "bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30" : "border-white/20 text-white/60 hover:text-white"}
              >
                已拒绝
              </Button>
            </div>

            {!filteredWithdrawals || filteredWithdrawals.length === 0 ? (
              <Card className="bg-black/50 border-white/10">
                <CardContent className="py-12 text-center text-white/60">
                  <p>暂无提现记录</p>
                </CardContent>
              </Card>
            ) : (
              filteredWithdrawals.map(({ withdrawal, walletAddress }) => (
                <Card key={withdrawal.id} className="bg-black/50 border-white/10">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-white text-base">
                          提现 {parseFloat(withdrawal.amount).toFixed(2)} USDT
                        </CardTitle>
                        <CardDescription className="text-white/60 text-xs mt-1">
                          {withdrawal.network} 网络
                        </CardDescription>
                      </div>
                      {(() => {
                        switch (withdrawal.status) {
                          case "completed":
                            return (
                              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                已完成
                              </Badge>
                            );
                          case "pending":
                            return (
                              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                                <Clock className="h-3 w-3 mr-1" />
                                待审核
                              </Badge>
                            );
                          case "approved":
                            return (
                              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                已批准
                              </Badge>
                            );
                          case "processing":
                            return (
                              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                                <Clock className="h-3 w-3 mr-1" />
                                处理中
                              </Badge>
                            );
                          case "rejected":
                            return (
                              <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                                <XCircle className="h-3 w-3 mr-1" />
                                已拒绝
                              </Badge>
                            );
                          default:
                            return null;
                        }
                      })()}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/60">订单号：</span>
                      <span className="text-white">#{withdrawal.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">提现地址：</span>
                      <span className="text-white text-xs">
                        {walletAddress?.label || withdrawal.withdrawAddress.substring(0, 15) + "..."}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">手续费：</span>
                      <span className="text-white">{parseFloat(withdrawal.fee).toFixed(2)} USDT</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">实际到账：</span>
                      <span className="text-[#D4AF37] font-semibold">
                        {parseFloat(withdrawal.actualAmount).toFixed(2)} USDT
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">创建时间：</span>
                      <span className="text-white">
                        {new Date(withdrawal.createdAt).toLocaleString("zh-CN")}
                      </span>
                    </div>
                    {withdrawal.completedAt && (
                      <div className="flex justify-between">
                        <span className="text-white/60">完成时间：</span>
                        <span className="text-white">
                          {new Date(withdrawal.completedAt).toLocaleString("zh-CN")}
                        </span>
                      </div>
                    )}
                    {withdrawal.rejectReason && (
                      <div className="mt-2 p-2 bg-red-900/20 rounded text-xs">
                        <p className="text-red-400 mb-1 flex items-center">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          拒绝原因：
                        </p>
                        <p className="text-white/80">{withdrawal.rejectReason}</p>
                      </div>
                    )}
                    {withdrawal.adminNotes && (
                      <div className="mt-2 p-2 bg-gray-900/50 rounded text-xs">
                        <p className="text-white/60 mb-1">备注：</p>
                        <p className="text-white/80">{withdrawal.adminNotes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
