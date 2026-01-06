import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ArrowLeft, Copy, Info } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { CheckCircle, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";
import ScrollToTop from "@/components/ScrollToTop";

export default function Deposit() {
  const [, setLocation] = useLocation();
  const [selectedNetwork, setSelectedNetwork] = useState("Aptos");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  
  // 模拟收款地址（实际应该从后端获取）
  const depositAddress = "0x993520ae34691c266f8f3e85d0f1fdb9585de6b532356685296c21aa7799584";
  
  const networks = [
    { name: "Aptos", minAmount: "0.01 USDT", arrivalTime: "约 1 分钟" },
    { name: "Ethereum", minAmount: "10 USDT", arrivalTime: "约 5-10 分钟" },
    { name: "BSC", minAmount: "1 USDT", arrivalTime: "约 3 分钟" },
    { name: "Polygon", minAmount: "1 USDT", arrivalTime: "约 2 分钟" },
  ];

  const currentNetwork = networks.find(n => n.name === selectedNetwork) || networks[0];

  const { data: deposits, refetch } = trpc.deposits.getMyDeposits.useQuery();
  const createDepositMutation = trpc.deposits.create.useMutation();

  const filteredDeposits = deposits?.filter(deposit => {
    if (!statusFilter) return true;
    return deposit.status === statusFilter;
  }) || [];

  const copyAddress = () => {
    navigator.clipboard.writeText(depositAddress);
    toast.success("地址已复制到剪贴板");
  };

  const handleSubmitDeposit = async () => {
    try {
      await createDepositMutation.mutateAsync({
        amount: "0", // 用户不需要输入金额，由管理员确认
        network: selectedNetwork,
        depositAddress: depositAddress,
      });
      toast.success("充值申请已提交，请等待确认");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "提交失败");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            已到账
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            <Clock className="h-3 w-3 mr-1" />
            待确认
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            <XCircle className="h-3 w-3 mr-1" />
            失败
          </Badge>
        );
      default:
        return null;
    }
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
          <h1 className="text-lg sm:text-xl font-bold">充值 USDT</h1>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setLocation("/user-center")}
            className="text-white/80 hover:text-white"
          >
            返回
          </Button>
        </div>
      </header>

      <div className="container mx-auto py-4 px-2 sm:py-8 sm:px-4 max-w-2xl">
        <Tabs defaultValue="deposit" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/5 mb-4">
            <TabsTrigger value="deposit">充值</TabsTrigger>
            <TabsTrigger value="history">充值记录</TabsTrigger>
          </TabsList>

          <TabsContent value="deposit" className="space-y-4">
        {/* QR Code Card */}
        <Card className="bg-gradient-to-br from-[#D4AF37]/10 to-black border-[#D4AF37]/30 mb-4">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <div className="bg-white p-4 rounded-lg mb-4">
                <QRCodeSVG 
                  value={depositAddress} 
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <p className="text-xs sm:text-sm text-white/60 text-center">
                扫描二维码或复制地址进行充值
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Address Card */}
        <Card className="bg-black/50 border-white/10 mb-4">
          <CardHeader>
            <CardTitle className="text-white text-base sm:text-lg">地址</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900/50 rounded-lg p-3 sm:p-4 border border-gray-800">
              <div className="flex items-start gap-2">
                <p className="text-xs sm:text-sm text-white/80 break-all flex-1 font-mono">
                  {depositAddress}
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={copyAddress}
                  className="flex-shrink-0 h-8 w-8 p-0"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Network Selection */}
        <Card className="bg-black/50 border-white/10 mb-4">
          <CardHeader>
            <CardTitle className="text-white text-base sm:text-lg">网络</CardTitle>
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

        {/* Info Cards */}
        <div className="space-y-3">
          <Card className="bg-black/50 border-white/10">
            <CardContent className="py-3 sm:py-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-white/60">
                  <Info className="h-4 w-4" />
                  <span>最小充值额</span>
                </div>
                <span className="text-white font-medium">{currentNetwork.minAmount}</span>
              </div>
            </CardContent>
          </Card>

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

          <Card className="bg-black/50 border-white/10">
            <CardContent className="py-3 sm:py-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-white/60">
                  <Info className="h-4 w-4" />
                  <span>可提币时间</span>
                </div>
                <span className="text-white font-medium">{currentNetwork.arrivalTime}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Warning */}
        <Card className="bg-yellow-900/20 border-yellow-800 mt-4">
          <CardContent className="py-3 sm:py-4">
            <div className="flex gap-2">
              <Info className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-yellow-300">
                <p className="font-semibold mb-1">重要提示：</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>请确保仅使用此地址于 {selectedNetwork} 网络进行充币</li>
                  <li>通过 Sui 网络发送资产至此地址将无法找回资产</li>
                  <li>充值金额低于最小充值额将不会到账</li>
                  <li>充值到账后可在账户流水中查看</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
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
                待确认
              </Button>
              <Button
                variant={statusFilter === "confirmed" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("confirmed")}
                className={statusFilter === "confirmed" ? "bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30" : "border-white/20 text-white/60 hover:text-white"}
              >
                已到账
              </Button>
              <Button
                variant={statusFilter === "failed" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("failed")}
                className={statusFilter === "failed" ? "bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30" : "border-white/20 text-white/60 hover:text-white"}
              >
                失败
              </Button>
            </div>

            {!filteredDeposits || filteredDeposits.length === 0 ? (
              <Card className="bg-black/50 border-white/10">
                <CardContent className="pt-6">
                  <p>暂无充值记录</p>
                </CardContent>
              </Card>
            ) : (
              filteredDeposits.map((deposit) => (
                <Card key={deposit.id} className="bg-black/50 border-white/10">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-white text-base">
                          充值 {parseFloat(deposit.amount).toFixed(2)} USDT
                        </CardTitle>
                        {deposit.adminNotes && (
                          <CardDescription className="text-white/60 text-xs mt-1">
                            {deposit.adminNotes}
                          </CardDescription>
                        )}
                      </div>
                      {getStatusBadge(deposit.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/60">订单号：</span>
                      <span className="text-white">#{deposit.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">创建时间：</span>
                      <span className="text-white">
                        {new Date(deposit.createdAt).toLocaleString("zh-CN")}
                      </span>
                    </div>
                    {deposit.reviewedAt && (
                      <div className="flex justify-between">
                        <span className="text-white/60">审核时间：</span>
                        <span className="text-white">
                          {new Date(deposit.reviewedAt).toLocaleString("zh-CN")}
                        </span>
                      </div>
                    )}
                    {deposit.adminNotes && (
                      <div className="mt-2 p-2 bg-gray-900/50 rounded text-xs">
                        <p className="text-white/60 mb-1">备注：</p>
                        <p className="text-white/80">{deposit.adminNotes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
      <ScrollToTop />
    </div>
  );
}
