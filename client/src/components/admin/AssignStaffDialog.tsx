import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Loader2, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";

interface AssignStaffDialogProps {
  stockUserId: number;
  onClose: () => void;
}

interface StaffMember {
  id: number;
  username: string | null;
  email: string | null;
  permissions: {
    status: "active" | "disabled";
  } | null;
}

export default function AssignStaffDialog({ stockUserId, onClose }: AssignStaffDialogProps) {
  const [selectedStaffIds, setSelectedStaffIds] = useState<number[]>([]);

  // 获取所有员工列表
  const { data: staffList, isLoading: isLoadingStaff } = trpc.adminPermissions.listStaffAdmins.useQuery();

  // 获取已分配的员工列表
  const { data: assignedStaff, isLoading: isLoadingAssigned } = trpc.stocks.getAssignedStaff.useQuery(
    { stockUserId },
    { enabled: stockUserId > 0 }
  );

  // 分配员工mutation
  const assignStaffMutation = trpc.stocks.assignStaffToUser.useMutation({
    onSuccess: () => {
      toast.success("员工分配成功");
      onClose();
    },
    onError: (error) => {
      toast.error(`分配失败：${error.message}`);
    },
  });

  // 移除员工mutation
  const removeStaffMutation = trpc.stocks.removeStaffFromUser.useMutation({
    onSuccess: () => {
      toast.success("员工移除成功");
    },
    onError: (error) => {
      toast.error(`移除失败：${error.message}`);
    },
  });

  // 初始化已选择的员工ID
  useEffect(() => {
    if (assignedStaff) {
      setSelectedStaffIds(assignedStaff.map((staff: any) => staff.id));
    }
  }, [assignedStaff]);

  const handleToggleStaff = (staffId: number) => {
    setSelectedStaffIds((prev) =>
      prev.includes(staffId)
        ? prev.filter((id) => id !== staffId)
        : [...prev, staffId]
    );
  };

  const handleSave = async () => {
    if (!assignedStaff) return;

    const currentStaffIds = assignedStaff.map((staff: any) => staff.id);
    const toAdd = selectedStaffIds.filter((id) => !currentStaffIds.includes(id));
    const toRemove = currentStaffIds.filter((id: number) => !selectedStaffIds.includes(id));

    try {
      // 添加新员工
      for (const staffId of toAdd) {
        await assignStaffMutation.mutateAsync({ stockUserId, staffId });
      }

      // 移除员工
      for (const staffId of toRemove) {
        await removeStaffMutation.mutateAsync({ stockUserId, staffId });
      }

      onClose();
    } catch (error) {
      // 错误已在mutation中处理
    }
  };

  if (isLoadingStaff || isLoadingAssigned) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="max-h-[400px] overflow-y-auto space-y-2">
        {staffList && staffList.length > 0 ? (
          staffList.map((staff: StaffMember) => (
            <Card
              key={staff.id}
              className={`bg-black/50 border transition-colors cursor-pointer ${
                selectedStaffIds.includes(staff.id)
                  ? "border-[#D4AF37] bg-[#D4AF37]/10"
                  : "border-white/10 hover:border-white/30"
              }`}
              onClick={() => handleToggleStaff(staff.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedStaffIds.includes(staff.id)}
                      onCheckedChange={() => handleToggleStaff(staff.id)}
                      className="border-white/30"
                    />
                    <div>
                      <div className="font-medium text-white">{staff.username}</div>
                      {staff.email && (
                        <div className="text-sm text-white/60">{staff.email}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={staff.permissions?.status === "active" ? "default" : "secondary"}>
                      {staff.permissions?.status === "active" ? "活跃" : "停用"}
                    </Badge>
                    {selectedStaffIds.includes(staff.id) ? (
                      <UserCheck className="w-5 h-5 text-[#D4AF37]" />
                    ) : (
                      <UserX className="w-5 h-5 text-white/30" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-8 text-white/60">
            暂无员工，请先在员工管理中创建员工
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
        <Button variant="outline" onClick={onClose}>
          取消
        </Button>
        <Button
          onClick={handleSave}
          className="bg-[#D4AF37] text-black hover:bg-[#E5C158]"
          disabled={assignStaffMutation.isPending || removeStaffMutation.isPending}
        >
          {assignStaffMutation.isPending || removeStaffMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              保存中...
            </>
          ) : (
            "保存"
          )}
        </Button>
      </div>
    </div>
  );
}
