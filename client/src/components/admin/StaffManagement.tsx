import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { Loader2, UserPlus, Edit, Trash2, Lock, Unlock } from "lucide-react";
import { toast } from "sonner";

export default function StaffManagement() {
  const { data: staffList, refetch: refetchStaff } = trpc.adminPermissions.listStaffAdmins.useQuery();
  const createStaffMutation = trpc.adminPermissions.createStaffAdmin.useMutation();
  const updatePermissionsMutation = trpc.adminPermissions.updateStaffPermissions.useMutation();
  const toggleStatusMutation = trpc.adminPermissions.toggleStaffStatus.useMutation();
  const deleteStaffMutation = trpc.adminPermissions.deleteStaffAdmin.useMutation();

  // 创建员工状态
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPermissions, setNewPermissions] = useState({
    balanceManagement: false,
    userManagement: false,
    permissionManagement: false,
    memberManagement: false,
  });
  const [isCreating, setIsCreating] = useState(false);

  // 编辑员工状态
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<number | null>(null);
  const [editingPermissions, setEditingPermissions] = useState({
    balanceManagement: false,
    userManagement: false,
    permissionManagement: false,
    memberManagement: false,
  });
  const [isEditing, setIsEditing] = useState(false);

  // 删除员工状态
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingStaffId, setDeletingStaffId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 创建员工
  const handleCreateStaff = async () => {
    if (!newUsername || !newPassword) {
      toast.error("请填写用户名和密码");
      return;
    }

    setIsCreating(true);
    try {
      await createStaffMutation.mutateAsync({
        username: newUsername,
        password: newPassword,
        email: newEmail || undefined,
        permissions: newPermissions,
      });
      toast.success("员工账户创建成功");
      setIsCreateDialogOpen(false);
      setNewUsername("");
      setNewPassword("");
      setNewEmail("");
      setNewPermissions({
        balanceManagement: false,
        userManagement: false,
        permissionManagement: false,
        memberManagement: false,
      });
      refetchStaff();
    } catch (error: any) {
      toast.error(error.message || "创建失败");
    } finally {
      setIsCreating(false);
    }
  };

  // 编辑员工权限
  const handleEditPermissions = async () => {
    if (!editingStaffId) return;

    setIsEditing(true);
    try {
      await updatePermissionsMutation.mutateAsync({
        userId: editingStaffId,
        permissions: editingPermissions,
      });
      toast.success("权限更新成功");
      setIsEditDialogOpen(false);
      setEditingStaffId(null);
      refetchStaff();
    } catch (error: any) {
      toast.error(error.message || "更新失败");
    } finally {
      setIsEditing(false);
    }
  };

  // 禁用/启用员工
  const handleToggleStatus = async (userId: number, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "disabled" : "active";
    try {
      await toggleStatusMutation.mutateAsync({
        userId,
        status: newStatus,
      });
      toast.success(newStatus === "active" ? "账户已启用" : "账户已禁用");
      refetchStaff();
    } catch (error: any) {
      toast.error(error.message || "操作失败");
    }
  };

  // 删除员工
  const handleDeleteStaff = async () => {
    if (!deletingStaffId) return;

    setIsDeleting(true);
    try {
      await deleteStaffMutation.mutateAsync({ userId: deletingStaffId });
      toast.success("员工账户已删除");
      setIsDeleteDialogOpen(false);
      setDeletingStaffId(null);
      refetchStaff();
    } catch (error: any) {
      toast.error(error.message || "删除失败");
    } finally {
      setIsDeleting(false);
    }
  };

  const getPermissionLabel = (key: string) => {
    const labels: Record<string, string> = {
      balanceManagement: "余额管理",
      userManagement: "用户管理",
      permissionManagement: "权限管理",
      memberManagement: "会员管理",
    };
    return labels[key] || key;
  };

  return (
    <div className="space-y-6">
      {/* 创建员工按钮 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">员工管理</h2>
          <p className="text-sm text-gray-400 mt-1">管理普通管理员账户和权限</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#D4AF37] text-black hover:bg-[#E5C158]">
              <UserPlus className="w-4 h-4 mr-2" />
              添加员工
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1a1a1a] border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">创建员工账户</DialogTitle>
              <DialogDescription className="text-gray-400">
                创建一个新的普通管理员账户,并分配相应权限
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-white">用户名 *</Label>
                <Input
                  id="username"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="请输入用户名"
                  className="bg-[#2a2a2a] border-gray-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">密码 *</Label>
                <Input
                  id="password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="请输入密码(至少6位)"
                  className="bg-[#2a2a2a] border-gray-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">邮箱(可选)</Label>
                <Input
                  id="email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="请输入邮箱"
                  className="bg-[#2a2a2a] border-gray-700 text-white"
                />
              </div>
              <div className="space-y-3">
                <Label className="text-white">权限配置</Label>
                {Object.entries(newPermissions).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">{getPermissionLabel(key)}</span>
                    <Switch
                      checked={value}
                      onCheckedChange={(checked) =>
                        setNewPermissions((prev) => ({ ...prev, [key]: checked }))
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                className="border-gray-700 text-white hover:bg-gray-800"
              >
                取消
              </Button>
              <Button
                onClick={handleCreateStaff}
                disabled={isCreating}
                className="bg-[#D4AF37] text-black hover:bg-[#E5C158]"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    创建中...
                  </>
                ) : (
                  "创建"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 员工列表 */}
      <div className="grid gap-4">
        {!staffList || staffList.length === 0 ? (
          <Card className="bg-[#1a1a1a] border-gray-700">
            <CardContent className="py-8 text-center text-gray-400">
              暂无员工账户
            </CardContent>
          </Card>
        ) : (
          staffList.map((staff) => (
            <Card key={staff.id} className="bg-[#1a1a1a] border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      {staff.username}
                      {staff.permissions?.status === "disabled" && (
                        <Badge variant="destructive">已禁用</Badge>
                      )}
                      {staff.permissions?.status === "active" && (
                        <Badge className="bg-green-600">正常</Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      {staff.email || "未设置邮箱"}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {/* 编辑权限按钮 */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingStaffId(staff.id);
                        setEditingPermissions({
                          balanceManagement: staff.permissions?.balanceManagement || false,
                          userManagement: staff.permissions?.userManagement || false,
                          permissionManagement: staff.permissions?.permissionManagement || false,
                          memberManagement: staff.permissions?.memberManagement || false,
                        });
                        setIsEditDialogOpen(true);
                      }}
                      className="border-gray-700 text-white hover:bg-gray-800"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>

                    {/* 禁用/启用按钮 */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleStatus(staff.id, staff.permissions?.status || "active")}
                      className="border-gray-700 text-white hover:bg-gray-800"
                    >
                      {staff.permissions?.status === "active" ? (
                        <Lock className="w-4 h-4" />
                      ) : (
                        <Unlock className="w-4 h-4" />
                      )}
                    </Button>

                    {/* 删除按钮 */}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setDeletingStaffId(staff.id);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-gray-400">权限列表：</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(staff.permissions || {})
                      .filter(([key]) => !["id", "userId", "status", "createdBy", "createdAt", "updatedAt", "staffManagement"].includes(key))
                      .map(([key, value]) => (
                        value ? (
                          <Badge key={key} className="bg-[#D4AF37] text-black">
                            {getPermissionLabel(key)}
                          </Badge>
                        ) : null
                      ))}
                  </div>
                  {!Object.values(staff.permissions || {}).some((v) => v === true) && (
                    <p className="text-sm text-gray-500">暂无权限</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* 编辑权限对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-[#1a1a1a] border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">编辑员工权限</DialogTitle>
            <DialogDescription className="text-gray-400">
              调整员工的权限配置
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {Object.entries(editingPermissions).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-gray-300">{getPermissionLabel(key)}</span>
                <Switch
                  checked={value}
                  onCheckedChange={(checked) =>
                    setEditingPermissions((prev) => ({ ...prev, [key]: checked }))
                  }
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="border-gray-700 text-white hover:bg-gray-800"
            >
              取消
            </Button>
            <Button
              onClick={handleEditPermissions}
              disabled={isEditing}
              className="bg-[#D4AF37] text-black hover:bg-[#E5C158]"
            >
              {isEditing ? (
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

      {/* 删除确认对话框 */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-[#1a1a1a] border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">确认删除</DialogTitle>
            <DialogDescription className="text-gray-400">
              确定要删除这个员工账户吗?此操作不可恢复。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="border-gray-700 text-white hover:bg-gray-800"
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteStaff}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  删除中...
                </>
              ) : (
                "确认删除"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
