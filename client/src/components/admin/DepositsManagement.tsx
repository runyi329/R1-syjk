import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock, Edit } from "lucide-react";

export default function DepositsManagement() {
  const { data: deposits, refetch } = trpc.deposits.getAllDeposits.useQuery();
  const confirmMutation = trpc.deposits.confirmDeposit.useMutation();
  const failMutation = trpc.deposits.failDeposit.useMutation();
  const updateMutation = trpc.deposits.updateDeposit.useMutation();

  const [editingDeposit, setEditingDeposit] = useState<any>(null);
  const [editForm, setEditForm] = useState({ amount: "", txHash: "", adminNotes: "" });
  const [confirmNotes, setConfirmNotes] = useState("");
  const [failNotes, setFailNotes] = useState("");
  const [selectedDepositId, setSelectedDepositId] = useState<number | null>(null);

  const handleConfirm = async (depositId: number) => {
    try {
      await confirmMutation.mutateAsync({ id: depositId, adminNotes: confirmNotes });
      toast.success("充值已确认到账");
      setConfirmNotes("");
      setSelectedDepositId(null);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "操作失败");
    }
  };

  const handleFail = async (depositId: number) => {
    try {
      await failMutation.mutateAsync({ id: depositId, adminNotes: failNotes });
      toast.success("已标记为失败");
      setFailNotes("");
      setSelectedDepositId(null);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "操作失败");
    }
  };

  const handleUpdate = async () => {
    if (!editingDeposit) return;

    try {
      await updateMutation.mutateAsync({
        id: editingDeposit.deposit.id,
        ...editForm,
      });
      toast.success("充值信息已更新");
      setEditingDeposit(null);
      setEditForm({ amount: "", txHash: "", adminNotes: "" });
      refetch();
    } catch (error: any) {
      toast.error(error.message || "更新失败");
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
    <Card className="bg-black/50 border-white/10">
      <CardHeader>
        <CardTitle className="text-white">充值订单管理</CardTitle>
        <CardDescription className="text-white/60">审核和管理用户充值订单</CardDescription>
      </CardHeader>
      <CardContent>
        {!deposits || deposits.length === 0 ? (
          <div className="text-center py-8 text-white/60">暂无充值订单</div>
        ) : (
          <div className="space-y-4">
            {deposits.map((item) => (
              <div key={item.deposit.id} className="p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-white font-medium">
                      充值 {parseFloat(item.deposit.amount).toFixed(2)} USDT
                    </div>
                    <div className="text-sm text-white/60 mt-1">
                      用户：{item.user?.name || "未知"} (ID: {item.deposit.userId})
                    </div>
                    <div className="text-xs text-white/40 mt-1">
                      订单号：#{item.deposit.id} | 网络：{item.deposit.network}
                    </div>
                  </div>
                  {getStatusBadge(item.deposit.status)}
                </div>

                <div className="space-y-2 text-sm mb-3">
                  <div className="flex justify-between">
                    <span className="text-white/60">收款地址：</span>
                    <span className="text-white text-xs">{item.deposit.depositAddress}</span>
                  </div>
                  {item.deposit.txHash && (
                    <div className="flex justify-between">
                      <span className="text-white/60">交易哈希：</span>
                      <span className="text-white text-xs">{item.deposit.txHash}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-white/60">创建时间：</span>
                    <span className="text-white">{new Date(item.deposit.createdAt).toLocaleString("zh-CN")}</span>
                  </div>
                  {item.deposit.reviewedAt && (
                    <div className="flex justify-between">
                      <span className="text-white/60">审核时间：</span>
                      <span className="text-white">{new Date(item.deposit.reviewedAt).toLocaleString("zh-CN")}</span>
                    </div>
                  )}
                  {item.deposit.adminNotes && (
                    <div className="mt-2 p-2 bg-gray-900/50 rounded text-xs">
                      <p className="text-white/60 mb-1">管理员备注：</p>
                      <p className="text-white/80">{item.deposit.adminNotes}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {item.deposit.status === "pending" && (
                    <>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            className="bg-green-500/20 text-green-400 hover:bg-green-500/30 border-green-500/30"
                            onClick={() => setSelectedDepositId(item.deposit.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            确认到账
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-gray-900 border-gray-800 text-white">
                          <DialogHeader>
                            <DialogTitle>确认充值到账</DialogTitle>
                            <DialogDescription className="text-white/60">
                              确认后将自动为用户增加余额
                            </DialogDescription>
                          </DialogHeader>
                          <div>
                            <Label>备注（可选）</Label>
                            <Textarea
                              value={confirmNotes}
                              onChange={(e) => setConfirmNotes(e.target.value)}
                              placeholder="输入备注信息"
                              className="bg-gray-800 border-gray-700 text-white"
                            />
                          </div>
                          <DialogFooter>
                            <Button
                              onClick={() => handleConfirm(item.deposit.id)}
                              className="bg-green-500 hover:bg-green-600 text-white"
                              disabled={confirmMutation.isPending}
                            >
                              {confirmMutation.isPending ? "处理中..." : "确认"}
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
                            onClick={() => setSelectedDepositId(item.deposit.id)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            标记失败
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-gray-900 border-gray-800 text-white">
                          <DialogHeader>
                            <DialogTitle>标记充值失败</DialogTitle>
                            <DialogDescription className="text-white/60">
                              标记为失败后不会增加用户余额
                            </DialogDescription>
                          </DialogHeader>
                          <div>
                            <Label>备注（可选）</Label>
                            <Textarea
                              value={failNotes}
                              onChange={(e) => setFailNotes(e.target.value)}
                              placeholder="输入失败原因"
                              className="bg-gray-800 border-gray-700 text-white"
                            />
                          </div>
                          <DialogFooter>
                            <Button
                              onClick={() => handleFail(item.deposit.id)}
                              variant="destructive"
                              disabled={failMutation.isPending}
                            >
                              {failMutation.isPending ? "处理中..." : "确认"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </>
                  )}

                  <Dialog open={editingDeposit?.deposit.id === item.deposit.id} onOpenChange={(open) => !open && setEditingDeposit(null)}>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37]/10"
                        onClick={() => {
                          setEditingDeposit(item);
                          setEditForm({
                            amount: item.deposit.amount,
                            txHash: item.deposit.txHash || "",
                            adminNotes: item.deposit.adminNotes || "",
                          });
                        }}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        编辑
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-gray-900 border-gray-800 text-white">
                      <DialogHeader>
                        <DialogTitle>编辑充值订单</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>充值金额</Label>
                          <Input
                            type="number"
                            value={editForm.amount}
                            onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                            className="bg-gray-800 border-gray-700 text-white"
                          />
                        </div>
                        <div>
                          <Label>交易哈希</Label>
                          <Input
                            value={editForm.txHash}
                            onChange={(e) => setEditForm({ ...editForm, txHash: e.target.value })}
                            placeholder="输入交易哈希"
                            className="bg-gray-800 border-gray-700 text-white"
                          />
                        </div>
                        <div>
                          <Label>管理员备注</Label>
                          <Textarea
                            value={editForm.adminNotes}
                            onChange={(e) => setEditForm({ ...editForm, adminNotes: e.target.value })}
                            placeholder="输入备注"
                            className="bg-gray-800 border-gray-700 text-white"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={handleUpdate}
                          className="bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-black"
                          disabled={updateMutation.isPending}
                        >
                          {updateMutation.isPending ? "保存中..." : "保存"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
