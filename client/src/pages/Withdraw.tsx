import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { ArrowLeft, Info, AlertCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function Withdraw() {
  const [, setLocation] = useLocation();
  const [selectedNetwork, setSelectedNetwork] = useState("Aptos");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  
  const { data: userData } = trpc.users.getMe.useQuery();
  const balance = userData ? parseFloat(userData.usdtBalance) : 0;

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

  const handleWithdraw = () => {
    if (!withdrawAddress) {
      toast.error("请输入提现地址");
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

    // 这里应该调用后端API进行提现
    toast.success("提现申请已提交，请等待审核");
    setWithdrawAddress("");
    setWithdrawAmount("");
  };

  const setMaxAmount = () => {
    setWithdrawAmount(balance.toFixed(2));
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
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
            <CardTitle className="text-white text-base sm:text-lg">提现地址</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="请输入提现地址"
              value={withdrawAddress}
              onChange={(e) => setWithdrawAddress(e.target.value)}
              className="bg-gray-900/50 border-gray-800 text-white placeholder:text-white/40"
            />
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
          disabled={!withdrawAddress || !withdrawAmount || withdrawAmountNum <= 0}
        >
          确认提现
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
      </div>
    </div>
  );
}
