import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { ArrowLeft, Plus, Trash2, CheckCircle, Clock, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function WalletAddresses() {
  const [, setLocation] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newAddress, setNewAddress] = useState("");
  const [newNetwork, setNewNetwork] = useState("aptos");
  const [newLabel, setNewLabel] = useState("");

  const { data: walletAddresses, refetch } = trpc.walletAddresses.getMyWalletAddresses.useQuery();
  const createMutation = trpc.walletAddresses.create.useMutation();
  const deleteMutation = trpc.walletAddresses.delete.useMutation();

  const handleCreate = async () => {
    if (!newAddress) {
      toast.error("请输入钱包地址");
      return;
    }

    try {
      await createMutation.mutateAsync({
        address: newAddress,
        network: newNetwork,
        label: newLabel || undefined,
      });
      toast.success("钱包地址已提交，等待管理员审核");
      setIsDialogOpen(false);
      setNewAddress("");
      setNewLabel("");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "添加失败");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定要删除这个钱包地址吗？")) return;

    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("删除成功");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "删除失败");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            已批准
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            <Clock className="h-3 w-3 mr-1" />
            待审核
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
  };

  const getNetworkName = (network: string) => {
    const names: Record<string, string> = {
      aptos: "Aptos",
      ethereum: "Ethereum",
      bsc: "BSC",
      polygon: "Polygon",
    };
    return names[network] || network;
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
          <h1 className="text-lg sm:text-xl font-bold">钱包地址管理</h1>
          <div className="w-16"></div>
        </div>
      </header>

      <div className="container mx-auto py-4 px-2 sm:py-8 sm:px-4 max-w-4xl">
        {/* Add Button */}
        <div className="mb-4">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-black font-semibold">
                <Plus className="h-4 w-4 mr-2" />
                添加钱包地址
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-gray-800 text-white">
              <DialogHeader>
                <DialogTitle>添加钱包地址</DialogTitle>
                <DialogDescription className="text-white/60">
                  添加后需要管理员审核才能用于提现
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>网络</Label>
                  <Select value={newNetwork} onValueChange={setNewNetwork}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700 text-white">
                      <SelectItem value="aptos">Aptos</SelectItem>
                      <SelectItem value="ethereum">Ethereum</SelectItem>
                      <SelectItem value="bsc">BSC</SelectItem>
                      <SelectItem value="polygon">Polygon</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>钱包地址</Label>
                  <Input
                    placeholder="请输入钱包地址"
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-white/40"
                  />
                </div>
                <div>
                  <Label>地址标签（可选）</Label>
                  <Input
                    placeholder="例如：我的主钱包"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-white/40"
                  />
                </div>
                <Button
                  onClick={handleCreate}
                  className="w-full bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-black font-semibold"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? "提交中..." : "提交审核"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Wallet Addresses List */}
        <div className="space-y-3">
          {!walletAddresses || walletAddresses.length === 0 ? (
            <Card className="bg-black/50 border-white/10">
              <CardContent className="py-12 text-center text-white/60">
                <p>暂无钱包地址</p>
                <p className="text-sm mt-2">点击上方按钮添加钱包地址</p>
              </CardContent>
            </Card>
          ) : (
            walletAddresses.map((wallet) => (
              <Card key={wallet.id} className="bg-black/50 border-white/10">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-white text-base">
                          {wallet.label || "钱包地址"}
                        </CardTitle>
                        {getStatusBadge(wallet.status)}
                      </div>
                      <CardDescription className="text-white/60 text-xs">
                        {getNetworkName(wallet.network)} 网络
                      </CardDescription>
                    </div>
                    {wallet.status !== "approved" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(wallet.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-800">
                    <p className="text-xs sm:text-sm text-white/80 break-all font-mono">
                      {wallet.address}
                    </p>
                  </div>
                  {wallet.adminNotes && (
                    <div className="mt-3 text-xs text-white/60">
                      <p className="font-semibold mb-1">管理员备注：</p>
                      <p>{wallet.adminNotes}</p>
                    </div>
                  )}
                  <div className="mt-3 text-xs text-white/40">
                    创建时间：{new Date(wallet.createdAt).toLocaleString("zh-CN")}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
