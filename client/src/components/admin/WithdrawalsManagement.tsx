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
import { CheckCircle, XCircle, Clock, Edit, AlertTriangle } from "lucide-react";

export default function WithdrawalsManagement() {
  const { data: withdrawals, refetch } = trpc.withdrawals.getAllWithdrawals.useQuery();
  const approveMutation = trpc.withdrawals.approveWithdrawal.useMutation();
  const rejectMutation = trpc.withdrawals.rejectWithdrawal.useMutation();
  const completeMutation = trpc.withdrawals.completeWithdrawal.useMutation();
  const updateMutation = trpc.withdrawals.updateWithdrawal.useMutation();

  const [selectedWithdrawalId, setSelectedWithdrawalId] = useState<number | null>(null);
  const [approveNotes, setApproveNotes] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [rejectNotes, setRejectNotes] = useState("");
  const [completeTxHash, setCompleteTxHash] = useState("");
  const [completeNotes, setCompleteNotes] = useState("");
  const [editingWithdrawal, setEditingWithdrawal] = useState<any>(null);
  const [editForm, setEditForm] = useState({ amount: "", fee: "", txHash: "", adminNotes: "" });

  const handleApprove = async (id: number) => {
    try {
      await approveMutation.mutateAsync({ id, adminNotes: approveNotes });
      toast.success("提现已批准");
      setApproveNotes("");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "操作失败");
    }
  };

  const handleReject = async (id: number) => {
    if (!rejectReason) {
      toast.error("请输入拒绝原因");
      return;
    }
    try {
      await rejectMutation.mutateAsync({ id, rejectReason, adminNotes: rejectNotes });
      toast.success("提现已拒绝，余额已退回");
      setRejectReason("");
      setRejectNotes("");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "操作失败");
    }
  };

  const handleComplete = async (id: number) => {
    try {
      await completeMutation.mutateAsync({ id, txHash: completeTxHash, adminNotes: completeNotes });
      toast.success("提现已完成");
      setCompleteTxHash("");
      setCompleteNotes("");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "操作失败");
    }
  };

  const handleUpdate = async () => {
    if (!editingWithdrawal) return;
    try {
      await updateMutation.mutateAsync({
        id: editingWithdrawal.withdrawal.id,
        ...editForm,
      });
      toast.success("提现信息已更新");
      setEditingWithdrawal(null);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "更新失败");
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, React.ReactNode> = {
      completed: <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><CheckCircle className="h-3 w-3 mr-1" />已完成</Badge>,
      pending: <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"><Clock className="h-3 w-3 mr-1" />待审核</Badge>,
      approved: <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30"><CheckCircle className="h-3 w-3 mr-1" />已批准</Badge>,
      processing: <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30"><Clock className="h-3 w-3 mr-1" />处理中</Badge>,
      rejected: <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><XCircle className="h-3 w-3 mr-1" />已拒绝</Badge>,
    };
    return badges[status] || null;
  };

  return (
    <Card className="bg-black/50 border-white/10">
      <CardHeader>
        <CardTitle className="text-white">提现订单管理</CardTitle>
        <CardDescription className="text-white/60">审核和处理用户提现申请</CardDescription>
      </CardHeader>
      <CardContent>
        {!withdrawals || withdrawals.length === 0 ? (
          <div className="text-center py-8 text-white/60">暂无提现订单</div>
        ) : (
          <div className="space-y-4">
            {withdrawals.map((item) => (
              <div key={item.withdrawal.id} className="p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-white font-medium">
                      提现 {parseFloat(item.withdrawal.amount).toFixed(2)} USDT
                    </div>
                    <div className="text-sm text-white/60 mt-1">
                      用户：{item.user?.name || "未知"} (ID: {item.withdrawal.userId})
                    </div>
                    <div className="text-xs text-white/40 mt-1">
                      订单号：#{item.withdrawal.id} | 网络：{item.withdrawal.network}
                    </div>
                  </div>
                  {getStatusBadge(item.withdrawal.status)}
                </div>

                <div className="space-y-2 text-sm mb-3">
                  <div className="flex justify-between">
                    <span className="text-white/60">提现地址：</span>
                    <span className="text-white text-xs">{item.walletAddress?.label || item.withdrawal.withdrawAddress.substring(0, 20) + "..."}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">手续费：</span>
                    <span className="text-white">{parseFloat(item.withdrawal.fee).toFixed(2)} USDT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">实际到账：</span>
                    <span className="text-[#D4AF37] font-semibold">{parseFloat(item.withdrawal.actualAmount).toFixed(2)} USDT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">创建时间：</span>
                    <span className="text-white">{new Date(item.withdrawal.createdAt).toLocaleString("zh-CN")}</span>
                  </div>
                  {item.withdrawal.rejectReason && (
                    <div className="mt-2 p-2 bg-red-900/20 rounded text-xs">
                      <p className="text-red-400 mb-1 flex items-center"><AlertTriangle className="h-3 w-3 mr-1" />拒绝原因：</p>
                      <p className="text-white/80">{item.withdrawal.rejectReason}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 flex-wrap">
                  {item.withdrawal.status === "pending" && (
                    <>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" className="bg-green-500/20 text-green-400 hover:bg-green-500/30 border-green-500/30">
                            <CheckCircle className="h-4 w-4 mr-1" />批准
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-gray-900 border-gray-800 text-white">
                          <DialogHeader>
                            <DialogTitle>批准提现</DialogTitle>
                          </DialogHeader>
                          <div>
                            <Label>备注（可选）</Label>
                            <Textarea value={approveNotes} onChange={(e) => setApproveNotes(e.target.value)} className="bg-gray-800 border-gray-700 text-white" />
                          </div>
                          <DialogFooter>
                            <Button onClick={() => handleApprove(item.withdrawal.id)} className="bg-green-500 hover:bg-green-600" disabled={approveMutation.isPending}>
                              {approveMutation.isPending ? "处理中..." : "确认"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10">
                            <XCircle className="h-4 w-4 mr-1" />拒绝
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-gray-900 border-gray-800 text-white">
                          <DialogHeader>
                            <DialogTitle>拒绝提现</DialogTitle>
                            <DialogDescription className="text-white/60">拒绝后将退回用户余额</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>拒绝原因（必填）</Label>
                              <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="请输入拒绝原因" className="bg-gray-800 border-gray-700 text-white" />
                            </div>
                            <div>
                              <Label>备注（可选）</Label>
                              <Textarea value={rejectNotes} onChange={(e) => setRejectNotes(e.target.value)} className="bg-gray-800 border-gray-700 text-white" />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button onClick={() => handleReject(item.withdrawal.id)} variant="destructive" disabled={rejectMutation.isPending}>
                              {rejectMutation.isPending ? "处理中..." : "确认拒绝"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </>
                  )}

                  {(item.withdrawal.status === "approved" || item.withdrawal.status === "processing") && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border-blue-500/30">
                          <CheckCircle className="h-4 w-4 mr-1" />标记完成
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-gray-900 border-gray-800 text-white">
                        <DialogHeader>
                          <DialogTitle>标记提现完成</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>交易哈希（可选）</Label>
                            <Input value={completeTxHash} onChange={(e) => setCompleteTxHash(e.target.value)} placeholder="输入链上交易哈希" className="bg-gray-800 border-gray-700 text-white" />
                          </div>
                          <div>
                            <Label>备注（可选）</Label>
                            <Textarea value={completeNotes} onChange={(e) => setCompleteNotes(e.target.value)} className="bg-gray-800 border-gray-700 text-white" />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={() => handleComplete(item.withdrawal.id)} className="bg-blue-500 hover:bg-blue-600" disabled={completeMutation.isPending}>
                            {completeMutation.isPending ? "处理中..." : "确认完成"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}

                  <Dialog open={editingWithdrawal?.withdrawal.id === item.withdrawal.id} onOpenChange={(open) => !open && setEditingWithdrawal(null)}>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37]/10"
                        onClick={() => {
                          setEditingWithdrawal(item);
                          setEditForm({
                            amount: item.withdrawal.amount,
                            fee: item.withdrawal.fee,
                            txHash: item.withdrawal.txHash || "",
                            adminNotes: item.withdrawal.adminNotes || "",
                          });
                        }}
                      >
                        <Edit className="h-4 w-4 mr-1" />编辑
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-gray-900 border-gray-800 text-white">
                      <DialogHeader>
                        <DialogTitle>编辑提现订单</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>提现金额</Label>
                          <Input type="number" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} className="bg-gray-800 border-gray-700 text-white" />
                        </div>
                        <div>
                          <Label>手续费</Label>
                          <Input type="number" value={editForm.fee} onChange={(e) => setEditForm({ ...editForm, fee: e.target.value })} className="bg-gray-800 border-gray-700 text-white" />
                        </div>
                        <div>
                          <Label>交易哈希</Label>
                          <Input value={editForm.txHash} onChange={(e) => setEditForm({ ...editForm, txHash: e.target.value })} className="bg-gray-800 border-gray-700 text-white" />
                        </div>
                        <div>
                          <Label>管理员备注</Label>
                          <Textarea value={editForm.adminNotes} onChange={(e) => setEditForm({ ...editForm, adminNotes: e.target.value })} className="bg-gray-800 border-gray-700 text-white" />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleUpdate} className="bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-black" disabled={updateMutation.isPending}>
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
