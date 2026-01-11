import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AssignStockPermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffId: number;
  staffName: string;
}

export default function AssignStockPermissionsDialog({
  open,
  onOpenChange,
  staffId,
  staffName,
}: AssignStockPermissionsDialogProps) {
  const [selectedStockUserIds, setSelectedStockUserIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 获取所有股票用户列表
  const { data: stockUsers, isLoading: isLoadingStockUsers } = trpc.stocks.getAllStockUsers.useQuery();

  // 获取该员工已分配的股票权限
  const { data: staffPermissions, refetch: refetchPermissions } = trpc.adminPermissions.getStaffStockPermissions.useQuery(
    { staffUserId: staffId },
    { enabled: open }
  );

  // 分配股票权限的mutation
  const assignStockMutation = trpc.adminPermissions.assignStockToStaff.useMutation();

  // 当对话框打开时，加载已分配的股票权限
  useEffect(() => {
    if (open && staffPermissions) {
      const assignedIds = staffPermissions.map((p) => p.stockUserId);
      setSelectedStockUserIds(assignedIds);
    }
  }, [open, staffPermissions]);

  // 切换股票用户选择
  const toggleStockUser = (stockUserId: number) => {
    setSelectedStockUserIds((prev) =>
      prev.includes(stockUserId)
        ? prev.filter((id) => id !== stockUserId)
        : [...prev, stockUserId]
    );
  };

  // 提交分配
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await assignStockMutation.mutateAsync({
        staffUserId: staffId,
        stockUserIds: selectedStockUserIds,
      });
      toast.success("股票权限分配成功");
      refetchPermissions();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "分配失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1a1a1a] border-gray-700 max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">为 {staffName} 分配股票权限</DialogTitle>
          <DialogDescription className="text-gray-400">
            选择该员工可以查看和管理的股票用户
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isLoadingStockUsers ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[#D4AF37]" />
            </div>
          ) : !stockUsers || stockUsers.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              暂无股票用户
            </div>
          ) : (
            <div className="space-y-3">
              {stockUsers.map((stockUser: any) => (
                <div
                  key={stockUser.id}
                  className="flex items-center space-x-3 p-3 rounded-lg border border-gray-700 hover:bg-gray-800/50 transition-colors"
                >
                  <Checkbox
                    id={`stock-${stockUser.id}`}
                    checked={selectedStockUserIds.includes(stockUser.id)}
                    onCheckedChange={() => toggleStockUser(stockUser.id)}
                    className="border-gray-600"
                  />
                  <Label
                    htmlFor={`stock-${stockUser.id}`}
                    className="flex-1 cursor-pointer text-white"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{stockUser.name}</span>
                      <span className="text-sm text-gray-400">
                        初始资金: ¥{parseFloat(stockUser.initialBalance).toLocaleString()}
                      </span>
                    </div>
                    {stockUser.notes && (
                      <p className="text-sm text-gray-500 mt-1">{stockUser.notes}</p>
                    )}
                  </Label>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-gray-700 text-white hover:bg-gray-800"
          >
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-[#D4AF37] text-black hover:bg-[#E5C158]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                保存中...
              </>
            ) : (
              "保存"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
