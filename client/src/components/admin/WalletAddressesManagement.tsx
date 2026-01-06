import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock } from "lucide-react";

export default function WalletAddressesManagement() {
  const { data: walletAddresses, refetch } = trpc.walletAddresses.getAllWalletAddresses.useQuery();
  const approveMutation = trpc.walletAddresses.approveWalletAddress.useMutation();
  const rejectMutation = trpc.walletAddresses.rejectWalletAddress.useMutation();

  const [approveNotes, setApproveNotes] = useState("");
  const [rejectNotes, setRejectNotes] = useState("");

  const handleApprove = async (id: number) => {
    try {
      await approveMutation.mutateAsync({ id, adminNotes: approveNotes });
      toast.success("钱包地址已批准");
      setApproveNotes("");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "操作失败");
    }
  };

  const handleReject = async (id: number) => {
    try {
      await rejectMutation.mutateAsync({ id, adminNotes: rejectNotes });
      toast.success("钱包地址已拒绝");
      setRejectNotes("");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "操作失败");
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
    <Card className="bg-black/50 border-white/10">
      <CardHeader>
        <CardTitle className="text-white">钱包地址审核</CardTitle>
        <CardDescription className="text-white/60">审核用户绑定的提现地址</CardDescription>
      </CardHeader>
      <CardContent>
        {!walletAddresses || walletAddresses.length === 0 ? (
          <div className="text-center py-8 text-white/60">暂无钱包地址</div>
        ) : (
          <div className="space-y-4">
            {walletAddresses.map((item) => (
              <div key={item.walletAddress.id} className="p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-white font-medium">
                      {item.walletAddress.label || "钱包地址"}
                    </div>
                    <div className="text-sm text-white/60 mt-1">
                      用户：{item.user?.name || "未知"} (ID: {item.walletAddress.userId})
                    </div>
                    <div className="text-xs text-white/40 mt-1">
                      网络：{getNetworkName(item.walletAddress.network)}
                    </div>
                  </div>
                  {getStatusBadge(item.walletAddress.status)}
                </div>

                <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-800 mb-3">
                  <p className="text-xs sm:text-sm text-white/80 break-all font-mono">
                    {item.walletAddress.address}
                  </p>
                </div>

                <div className="space-y-2 text-sm mb-3">
                  <div className="flex justify-between">
                    <span className="text-white/60">创建时间：</span>
                    <span className="text-white">{new Date(item.walletAddress.createdAt).toLocaleString("zh-CN")}</span>
                  </div>
                  {item.walletAddress.reviewedAt && (
                    <div className="flex justify-between">
                      <span className="text-white/60">审核时间：</span>
                      <span className="text-white">{new Date(item.walletAddress.reviewedAt).toLocaleString("zh-CN")}</span>
                    </div>
                  )}
                  {item.walletAddress.adminNotes && (
                    <div className="mt-2 p-2 bg-gray-900/50 rounded text-xs">
                      <p className="text-white/60 mb-1">管理员备注：</p>
                      <p className="text-white/80">{item.walletAddress.adminNotes}</p>
                    </div>
                  )}
                </div>

                {item.walletAddress.status === "pending" && (
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          className="bg-green-500/20 text-green-400 hover:bg-green-500/30 border-green-500/30"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          批准
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-gray-900 border-gray-800 text-white">
                        <DialogHeader>
                          <DialogTitle>批准钱包地址</DialogTitle>
                          <DialogDescription className="text-white/60">
                            批准后用户可以使用此地址进行提现
                          </DialogDescription>
                        </DialogHeader>
                        <div>
                          <Label>备注（可选）</Label>
                          <Textarea
                            value={approveNotes}
                            onChange={(e) => setApproveNotes(e.target.value)}
                            placeholder="输入备注信息"
                            className="bg-gray-800 border-gray-700 text-white"
                          />
                        </div>
                        <DialogFooter>
                          <Button
                            onClick={() => handleApprove(item.walletAddress.id)}
                            className="bg-green-500 hover:bg-green-600 text-white"
                            disabled={approveMutation.isPending}
                          >
                            {approveMutation.isPending ? "处理中..." : "确认批准"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          拒绝
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-gray-900 border-gray-800 text-white">
                        <DialogHeader>
                          <DialogTitle>拒绝钱包地址</DialogTitle>
                          <DialogDescription className="text-white/60">
                            拒绝后用户无法使用此地址提现
                          </DialogDescription>
                        </DialogHeader>
                        <div>
                          <Label>备注（可选）</Label>
                          <Textarea
                            value={rejectNotes}
                            onChange={(e) => setRejectNotes(e.target.value)}
                            placeholder="输入拒绝原因"
                            className="bg-gray-800 border-gray-700 text-white"
                          />
                        </div>
                        <DialogFooter>
                          <Button
                            onClick={() => handleReject(item.walletAddress.id)}
                            variant="destructive"
                            disabled={rejectMutation.isPending}
                          >
                            {rejectMutation.isPending ? "处理中..." : "确认拒绝"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
