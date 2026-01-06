import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ArrowLeft, Copy, Info } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { toast } from "sonner";

export default function Deposit() {
  const [, setLocation] = useLocation();
  const [selectedNetwork, setSelectedNetwork] = useState("Aptos");
  
  // 模拟收款地址（实际应该从后端获取）
  const depositAddress = "0x993520ae34691c266f8f3e85d0f1fdb9585de6b532356685296c21aa7799584";
  
  const networks = [
    { name: "Aptos", minAmount: "0.01 USDT", arrivalTime: "约 1 分钟" },
    { name: "Ethereum", minAmount: "10 USDT", arrivalTime: "约 5-10 分钟" },
    { name: "BSC", minAmount: "1 USDT", arrivalTime: "约 3 分钟" },
    { name: "Polygon", minAmount: "1 USDT", arrivalTime: "约 2 分钟" },
  ];

  const currentNetwork = networks.find(n => n.name === selectedNetwork) || networks[0];

  const copyAddress = () => {
    navigator.clipboard.writeText(depositAddress);
    toast.success("地址已复制到剪贴板");
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
          <h1 className="text-lg sm:text-xl font-bold">充值 USDT</h1>
          <div className="w-16"></div>
        </div>
      </header>

      <div className="container mx-auto py-4 px-2 sm:py-8 sm:px-4 max-w-2xl">
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
      </div>
    </div>
  );
}
