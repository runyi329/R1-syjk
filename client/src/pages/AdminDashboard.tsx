import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Loader2, Plus, Edit, Trash2, UserPlus, UserMinus, Lock, Unlock, Key, LogIn } from "lucide-react";
import { toast } from "sonner";
import DepositsManagement from "@/components/admin/DepositsManagement";
import WithdrawalsManagement from "@/components/admin/WithdrawalsManagement";
import ScrollToTop from "@/components/ScrollToTop";
import WalletAddressesManagement from "@/components/admin/WalletAddressesManagement";
import StocksManagement from "@/components/admin/StocksManagement";
import StaffManagement from "@/components/admin/StaffManagement";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { data: authData, isLoading: authLoading } = trpc.auth.me.useQuery();
  const { data: userData } = trpc.users.getMe.useQuery(undefined, {
    enabled: !!authData,
  });
  const { data: permissions } = trpc.adminPermissions.getMyPermissions.useQuery(undefined, {
    enabled: !!authData,
  });
  const { data: users, refetch: refetchUsers } = trpc.users.getAllUsers.useQuery(undefined, {
    enabled: authData?.role === "super_admin" || authData?.role === "staff_admin",
  });
  const { data: products, refetch: refetchProducts } = trpc.products.getAllProducts.useQuery(undefined, {
    enabled: authData?.role === "super_admin" || authData?.role === "staff_admin",
  });
  const { data: orders, refetch: refetchOrders } = trpc.orders.getAllOrders.useQuery(undefined, {
    enabled: authData?.role === "super_admin" || authData?.role === "staff_admin",
  });

  // Points management state
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [pointsAmount, setPointsAmount] = useState("");
  const [pointsNotes, setPointsNotes] = useState("");

  // Password management state
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // User edit state
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editingUserName, setEditingUserName] = useState("");
  const [editingUserVipLevel, setEditingUserVipLevel] = useState("0");
  const [editingUserStatus, setEditingUserStatus] = useState<"active" | "frozen">("active");
  const [editingUserRole, setEditingUserRole] = useState<"user" | "admin" | "super_admin" | "staff_admin">("user");
  const [editingUserNotes, setEditingUserNotes] = useState("");
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  // Product management state
  const [productForm, setProductForm] = useState({
    id: null as number | null,
    name: "",
    description: "",
    price: "",
    stock: "",
    imageUrl: "",
    status: "active" as "active" | "inactive",
  });

  const adminDepositMutation = trpc.deposits.adminDeposit.useMutation({
    onSuccess: () => {
      toast.success("充值成功");
      refetchUsers();
      setPointsAmount("");
      setPointsNotes("");
    },
    onError: (error: any) => toast.error(`操作失败：${error.message}`),
  });

  const addPointsMutation = trpc.points.creditPoints.useMutation({
    onSuccess: () => {
      toast.success("积分添加成功");
      refetchUsers();
      setPointsAmount("");
      setPointsNotes("");
    },
    onError: (error: any) => toast.error(`操作失败：${error.message}`),
  });

  const deductPointsMutation = trpc.points.debitPoints.useMutation({
    onSuccess: () => {
      toast.success("积分扣除成功");
      refetchUsers();
      setPointsAmount("");
      setPointsNotes("");
    },
    onError: (error: any) => toast.error(`操作失败：${error.message}`),
  });

  const freezeAccountMutation = trpc.points.freezeAccount.useMutation({
    onSuccess: () => {
      toast.success("账户已冻结");
      refetchUsers();
    },
    onError: (error: any) => toast.error(`操作失败：${error.message}`),
  });

  const unfreezeAccountMutation = trpc.points.unfreezeAccount.useMutation({
    onSuccess: () => {
      toast.success("账户已解冻");
      refetchUsers();
    },
    onError: (error: any) => toast.error(`操作失败：${error.message}`),
  });

  const updateUserVipLevelMutation = trpc.users.updateUserVipLevel.useMutation({
    onSuccess: () => {
      toast.success("VIP等级已更新");
      refetchUsers();
      setIsEditUserOpen(false);
      setEditingUserId(null);
    },
    onError: (error: any) => toast.error(`操作失败：${error.message}`),
  });

  const updateUserStatusMutation = trpc.users.updateUserStatus.useMutation({
    onSuccess: () => {
      toast.success("账户状态已更新");
      refetchUsers();
      setIsEditUserOpen(false);
      setEditingUserId(null);
    },
    onError: (error: any) => toast.error(`操作失败：${error.message}`),
  });

  const updateUserNameMutation = trpc.users.updateUserName.useMutation({
    onSuccess: () => {
      toast.success("用户名已更新");
      refetchUsers();
      setIsEditUserOpen(false);
      setEditingUserId(null);
    },
    onError: (error: any) => toast.error(`操作失败：${error.message}`),
  });

  const updateUserNotesMutation = trpc.users.updateUserNotes.useMutation({
    onSuccess: () => {
      toast.success("备注已更新");
      refetchUsers();
      setIsEditUserOpen(false);
      setEditingUserId(null);
    },
    onError: (error: any) => toast.error(`操作失败：${error.message}`),
  });

  const updateUserRoleMutation = trpc.users.updateUserRole.useMutation({
    onSuccess: () => {
      toast.success("用户角色已更新");
      refetchUsers();
      setIsEditUserOpen(false);
      setEditingUserId(null);
    },
    onError: (error: any) => toast.error(`操作失败：${error.message}`),
  });

  const deleteUserMutation = trpc.users.deleteUser.useMutation({
    onSuccess: () => {
      toast.success("用户已删除");
      refetchUsers();
      setIsEditUserOpen(false);
      setIsDeleteDialogOpen(false);
      setEditingUserId(null);
    },
    onError: (error: any) => toast.error(`删除失败：${error.message}`),
  });

  const loginAsUserMutation = trpc.users.loginAsUser.useMutation({
    onSuccess: (data) => {
      toast.success(`已以 "${data.user.name || data.user.id}" 的身份登录`);
      // 延迟1秒后跳转到首页，让用户看到提示
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    },
    onError: (error: any) => toast.error(`登录失败：${error.message}`),
  });

  const changePasswordMutation = trpc.users.changePassword.useMutation({
    onSuccess: () => {
      toast.success("密码修改成功");
      setIsChangePasswordOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error: any) => toast.error(`修改失败：${error.message}`),
  });

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("请填写所有字段");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("新密码和确认密码不一致");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("新密码至少需要6个字符");
      return;
    }
    setIsChangingPassword(true);
    try {
      await changePasswordMutation.mutateAsync({
        currentPassword,
        newPassword,
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const createProductMutation = trpc.products.createProduct.useMutation({
    onSuccess: () => {
      toast.success("商品创建成功");
      refetchProducts();
      resetProductForm();
    },
    onError: (error: any) => toast.error(`操作失败：${error.message}`),
  });

  const updateProductMutation = trpc.products.updateProduct.useMutation({
    onSuccess: () => {
      toast.success("商品更新成功");
      refetchProducts();
      resetProductForm();
    },
    onError: (error: any) => toast.error(`操作失败：${error.message}`),
  });

  const deleteProductMutation = trpc.products.deleteProduct.useMutation({
    onSuccess: () => {
      toast.success("商品删除成功");
      refetchProducts();
    },
    onError: (error: any) => toast.error(`操作失败：${error.message}`),
  });

  useEffect(() => {
    if (!authLoading && (!authData || (authData.role !== "super_admin" && authData.role !== "staff_admin"))) {
      toast.error("您没有权限访问此页面");
      setLocation("/");
    }
    // 如果用户已登录但未设置用户名，跳转到注册页面
    if (userData && !userData.name) {
      setLocation("/register");
    }
  }, [authData, authLoading, userData, setLocation]);

  const resetProductForm = () => {
    setProductForm({
      id: null,
      name: "",
      description: "",
      price: "",
      stock: "",
      imageUrl: "",
      status: "active",
    });
  };

  const handleProductSubmit = () => {
    if (!productForm.name || !productForm.price) {
      toast.error("请填写商品名称和价格");
      return;
    }

    const data = {
      name: productForm.name,
      description: productForm.description || undefined,
      price: productForm.price,
      stock: productForm.stock ? parseInt(productForm.stock) : -1,
      imageUrl: productForm.imageUrl || undefined,
      status: productForm.status,
    };

    if (productForm.id) {
      updateProductMutation.mutate({ productId: productForm.id, ...data });
    } else {
      createProductMutation.mutate(data);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen pb-20 md:pb-0 bg-black text-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  if (!authData || (authData.role !== "super_admin" && authData.role !== "staff_admin")) {
    return null;
  }

  return (
    <div className="min-h-screen pb-20 md:pb-0 bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-sm z-50">
        <div className="container mx-auto flex items-center justify-between py-4">
          <button onClick={() => setLocation("/")} className="flex items-center gap-2">
            <img src="/logo.png" alt="数金研投 Logo" className="w-10 h-10 rounded" />
            <div>
              <div className="text-[#D4AF37] font-bold text-lg">管理员后台</div>
              <div className="text-xs text-white/60">ADMIN DASHBOARD</div>
            </div>
          </button>
          <Button onClick={() => setLocation("/")} variant="outline" className="border-[#D4AF37] text-[#D4AF37]">
            返回首页
          </Button>
        </div>
      </header>

      <div className="container mx-auto py-4 px-2 sm:py-8 sm:px-4">
        <Tabs defaultValue={authData?.role === "super_admin" ? "deposits" : permissions?.permissions?.memberManagement ? "stocks" : "products"} className="w-full">
          <TabsList className="bg-black/50 border border-white/10 grid w-full overflow-x-auto" style={{ gridTemplateColumns: `repeat(${[
            authData?.role === "super_admin" ? 3 : 0, // deposits, withdrawals, wallets
            authData?.role === "super_admin" ? 1 : 0, // users
            permissions?.permissions?.permissionManagement ? 2 : 0, // products, orders
            permissions?.permissions?.memberManagement ? 1 : 0, // stocks
            permissions?.permissions?.staffManagement ? 1 : 0, // staff
            authData?.role === "super_admin" ? 1 : 0 // settings
          ].reduce((a, b) => a + b, 0)}, minmax(0, 1fr))` }}>
            {authData?.role === "super_admin" && (
              <>
                <TabsTrigger value="deposits" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black text-xs sm:text-sm">
                  充值
                </TabsTrigger>
                <TabsTrigger value="withdrawals" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black text-xs sm:text-sm">
                  提现
                </TabsTrigger>
                <TabsTrigger value="wallets" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black text-xs sm:text-sm">
                  地址
                </TabsTrigger>
              </>
            )}
            {authData?.role === "super_admin" && (
              <TabsTrigger value="users" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black text-xs sm:text-sm">
                用户
              </TabsTrigger>
            )}
            {permissions?.permissions?.permissionManagement && (
              <>
                <TabsTrigger value="products" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black text-xs sm:text-sm">
                  商品
                </TabsTrigger>
                <TabsTrigger value="orders" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black text-xs sm:text-sm">
                  订单
                </TabsTrigger>
              </>
            )}
            {permissions?.permissions?.memberManagement && (
              <TabsTrigger value="stocks" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black text-xs sm:text-sm">
                A股
              </TabsTrigger>
            )}
            {permissions?.permissions?.staffManagement && (
              <TabsTrigger value="staff" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black text-xs sm:text-sm">
                员工
              </TabsTrigger>
            )}
            {authData?.role === "super_admin" && (
              <TabsTrigger value="settings" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black text-xs sm:text-sm">
                设置
              </TabsTrigger>
            )}
          </TabsList>

          {/* Deposits Management */}
          {permissions?.permissions?.balanceManagement && (
            <TabsContent value="deposits" className="mt-6">
              <DepositsManagement />
            </TabsContent>
          )}

          {/* Withdrawals Management */}
          {permissions?.permissions?.balanceManagement && (
            <TabsContent value="withdrawals" className="mt-6">
              <WithdrawalsManagement />
            </TabsContent>
          )}

          {/* Wallet Addresses Management */}
          {permissions?.permissions?.balanceManagement && (
            <TabsContent value="wallets" className="mt-6">
              <WalletAddressesManagement />
            </TabsContent>
          )}

          {/* Users Management */}
          {permissions?.permissions?.userManagement && (
            <TabsContent value="users" className="mt-6">
            <Card className="bg-black/50 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">用户列表</CardTitle>
                <CardDescription className="text-white/60">管理用户积分和账户状态</CardDescription>
              </CardHeader>
              <CardContent>
                {!users || users.length === 0 ? (
                  <div className="text-center py-8 text-white/60">暂无用户</div>
                ) : (
                  <div className="space-y-4">
                    {users.map((user) => (
                      <div key={user.id} className="p-3 sm:p-4 rounded-lg bg-white/5 border border-white/10">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 gap-2">
                          <div>
                            <div className="text-white font-medium text-sm sm:text-base">{user.name || "未设置昵称"}</div>
                            <div className="text-xs sm:text-sm text-white/60">ID: {user.id}</div>
                            <div className="text-xs sm:text-sm mt-1">
                              <Badge
                                variant="outline"
                                className={
                                  user.role === "super_admin"
                                    ? "bg-purple-500/20 text-purple-400 border-purple-500/50 text-xs"
                                    : user.role === "staff_admin"
                                    ? "bg-orange-500/20 text-orange-400 border-orange-500/50 text-xs"
                                    : "bg-blue-500/20 text-blue-400 border-blue-500/50 text-xs"
                                }
                              >
                                {user.role === "super_admin" ? "超级管理员" : user.role === "staff_admin" ? "普通管理员" : "普通用户"}
                              </Badge>
                            </div>
                            {(user as any).notes && (
                              <div className="text-xs text-white/50 mt-1">{(user as any).notes}</div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 sm:gap-4">
                            <div className="text-right">
                              <div className="text-[#D4AF37] font-bold text-base sm:text-lg">
                                {parseFloat(user.usdtBalance).toFixed(2)} USDT
                              </div>
                              <Badge
                                variant={user.accountStatus === "active" ? "default" : "destructive"}
                                className={
                                  user.accountStatus === "active"
                                    ? "bg-green-500/20 text-green-400 border-green-500/50 text-xs"
                                    : "bg-red-500/20 text-red-400 border-red-500/50 text-xs"
                                }
                              >
                                {user.accountStatus === "active" ? "正常" : "已冻结"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 sm:flex gap-2">
                          <Dialog open={isEditUserOpen && editingUserId === user.id} onOpenChange={(open) => {
                            if (open) {
                              setEditingUserId(user.id);
                              setEditingUserName(user.name || "");
                              setEditingUserVipLevel((user as any).vipLevel?.toString() || "0");
                              setEditingUserStatus(user.accountStatus);
                              setEditingUserRole(user.role);
                              setEditingUserNotes((user as any).notes || "");
                            } else {
                              setIsEditUserOpen(false);
                              setEditingUserId(null);
                            }
                            setIsEditUserOpen(open);
                          }}>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-blue-500/50 text-blue-400 text-xs"
                              >
                                <Edit className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                                <span className="hidden sm:inline">编辑</span>
                                <span className="sm:hidden">编</span>
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-black border-white/10">
                              <DialogHeader>
                                <DialogTitle className="text-white">编辑用户</DialogTitle>
                                <DialogDescription className="text-white/60">
                                  修改用户 {user.name || user.id} 的信息
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label className="text-white">用户名</Label>
                                  <Input
                                    value={editingUserName}
                                    onChange={(e) => setEditingUserName(e.target.value)}
                                    placeholder="请输入用户名"
                                    className="bg-white/5 border-white/10 text-white"
                                  />
                                </div>
                                <div>
                                  <Label className="text-white">VIP等级</Label>
                                  <Select value={editingUserVipLevel} onValueChange={setEditingUserVipLevel}>
                                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-black border-white/10">
                                      <SelectItem value="0">普通用户</SelectItem>
                                      <SelectItem value="1">VIP 1</SelectItem>
                                      <SelectItem value="2">VIP 2</SelectItem>
                                      <SelectItem value="3">VIP 3</SelectItem>
                                      <SelectItem value="4">VIP 4</SelectItem>
                                      <SelectItem value="5">VIP 5</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label className="text-white">账户状态</Label>
                                  <Select value={editingUserStatus} onValueChange={(value) => setEditingUserStatus(value as "active" | "frozen")}>
                                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-black border-white/10">
                                      <SelectItem value="active">正常</SelectItem>
                                      <SelectItem value="frozen">冻结</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label className="text-white">用户角色</Label>
                                  <Select value={editingUserRole} onValueChange={(value) => setEditingUserRole(value as "user" | "staff_admin" | "super_admin")}>
                                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-black border-white/10">
                                      <SelectItem value="user">普通用户</SelectItem>
                                      <SelectItem value="staff_admin">普通管理员</SelectItem>
                                      <SelectItem value="super_admin">超级管理员</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label className="text-white">备注</Label>
                                  <Textarea
                                    value={editingUserNotes}
                                    onChange={(e) => setEditingUserNotes(e.target.value)}
                                    placeholder="请输入备注信息（可选）"
                                    className="bg-white/5 border-white/10 text-white min-h-[80px]"
                                  />
                                </div>
                              </div>
                              <DialogFooter className="flex-col sm:flex-row gap-2">
                                <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                                      disabled={isEditingUser}
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      删除用户
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="bg-black border-white/10">
                                    <DialogHeader>
                                      <DialogTitle className="text-white">确认删除用户</DialogTitle>
                                      <DialogDescription className="text-white/60">
                                        您确定要删除用户 {user.name || user.id} 吗？此操作将永久删除用户及其所有相关数据，不可恢复！
                                      </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter>
                                      <Button
                                        variant="outline"
                                        onClick={() => setIsDeleteDialogOpen(false)}
                                        className="border-white/20 text-white hover:bg-white/10"
                                        disabled={isDeletingUser}
                                      >
                                        取消
                                      </Button>
                                      <Button
                                        onClick={() => {
                                          setIsDeletingUser(true);
                                          deleteUserMutation.mutateAsync({ userId: user.id }).finally(() => setIsDeletingUser(false));
                                        }}
                                        className="bg-red-500 text-white hover:bg-red-600"
                                        disabled={isDeletingUser}
                                      >
                                        {isDeletingUser ? (
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
                                <div className="flex gap-2 flex-1 justify-end">
                                  <Button
                                    variant="outline"
                                    onClick={() => setIsEditUserOpen(false)}
                                    className="border-white/20 text-white hover:bg-white/10"
                                    disabled={isEditingUser}
                                  >
                                    取消
                                  </Button>
                                  <Button
                                    onClick={() => {
                                      if (!editingUserName || editingUserName.length < 2) {
                                        toast.error("用户名至少需要2个字符");
                                        return;
                                      }
                                      setIsEditingUser(true);
                                      Promise.all([
                                        updateUserNameMutation.mutateAsync({
                                          userId: user.id,
                                          name: editingUserName,
                                        }),
                                        updateUserVipLevelMutation.mutateAsync({
                                          userId: user.id,
                                          vipLevel: parseInt(editingUserVipLevel),
                                        }),
                                        updateUserStatusMutation.mutateAsync({
                                          userId: user.id,
                                          status: editingUserStatus,
                                        }),
                                        updateUserNotesMutation.mutateAsync({
                                          userId: user.id,
                                          notes: editingUserNotes || undefined,
                                        }),
                                        updateUserRoleMutation.mutateAsync({
                                          userId: user.id,
                                          role: editingUserRole,
                                        }),
                                      ]).finally(() => setIsEditingUser(false));
                                    }}
                                    className="bg-[#D4AF37] text-black hover:bg-[#E5C158]"
                                    disabled={isEditingUser}
                                  >
                                    {isEditingUser ? (
                                      <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        保存中...
                                      </>
                                    ) : (
                                      "确认保存"
                                    )}
                                  </Button>
                                </div>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-green-500/50 text-green-400 text-xs"
                                onClick={() => setSelectedUserId(user.id)}
                              >
                                <UserPlus className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                                <span className="hidden sm:inline">添加积分</span>
                                <span className="sm:hidden">添加</span>
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-black border-white/10">
                              <DialogHeader>
                                <DialogTitle className="text-white">添加积分</DialogTitle>
                                <DialogDescription className="text-white/60">
                                  为用户 {user.name || user.id} 添加 USDT 积分
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label className="text-white">积分数量</Label>
                                  <Input
                                    type="number"
                                    value={pointsAmount}
                                    onChange={(e) => setPointsAmount(e.target.value)}
                                    className="bg-white/5 border-white/10 text-white"
                                    placeholder="请输入积分数量"
                                  />
                                </div>
                                <div>
                                  <Label className="text-white">备注</Label>
                                  <Textarea
                                    value={pointsNotes}
                                    onChange={(e) => setPointsNotes(e.target.value)}
                                    className="bg-white/5 border-white/10 text-white"
                                    placeholder="请输入备注信息"
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  onClick={() => {
                                    if (selectedUserId && pointsAmount) {
                                      adminDepositMutation.mutate({
                                        userId: selectedUserId,
                                        amount: pointsAmount,
                                        adminNotes: pointsNotes || undefined,
                                      });
                                    }
                                  }}
                                  className="bg-[#D4AF37] text-black hover:bg-[#B8941F]"
                                >
                                  确认添加
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-500/50 text-red-400 text-xs"
                                onClick={() => setSelectedUserId(user.id)}
                              >
                                <UserMinus className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                                <span className="hidden sm:inline">扣除积分</span>
                                <span className="sm:hidden">扣除</span>
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-black border-white/10">
                              <DialogHeader>
                                <DialogTitle className="text-white">扣除积分</DialogTitle>
                                <DialogDescription className="text-white/60">
                                  从用户 {user.name || user.id} 扣除 USDT 积分
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label className="text-white">积分数量</Label>
                                  <Input
                                    type="number"
                                    value={pointsAmount}
                                    onChange={(e) => setPointsAmount(e.target.value)}
                                    className="bg-white/5 border-white/10 text-white"
                                    placeholder="请输入积分数量"
                                  />
                                </div>
                                <div>
                                  <Label className="text-white">备注</Label>
                                  <Textarea
                                    value={pointsNotes}
                                    onChange={(e) => setPointsNotes(e.target.value)}
                                    className="bg-white/5 border-white/10 text-white"
                                    placeholder="请输入备注信息"
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  onClick={() => {
                                    if (selectedUserId && pointsAmount) {
                                      deductPointsMutation.mutate({
                                        userId: selectedUserId,
                                        amount: pointsAmount,
                                        notes: pointsNotes || undefined,
                                      });
                                    }
                                  }}
                                  className="bg-[#D4AF37] text-black hover:bg-[#B8941F]"
                                >
                                  确认扣除
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                          {user.accountStatus === "active" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-orange-500/50 text-orange-400 text-xs"
                              onClick={() => freezeAccountMutation.mutate({ userId: user.id })}
                            >
                              <Lock className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                              <span className="hidden sm:inline">冻结账户</span>
                              <span className="sm:hidden">冻结</span>
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-blue-500/50 text-blue-400 text-xs"
                              onClick={() => unfreezeAccountMutation.mutate({ userId: user.id })}
                            >
                              <Unlock className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                              <span className="hidden sm:inline">解冻账户</span>
                              <span className="sm:hidden">解冻</span>
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="outline"
                            className="border-purple-500/50 text-purple-400 text-xs"
                            onClick={() => {
                              if (window.confirm(`确定要以 "${user.name || user.id}" 的身份登录吗？`)) {
                                loginAsUserMutation.mutate({ userId: user.id });
                              }
                            }}
                            disabled={loginAsUserMutation.isPending}
                          >
                            <LogIn className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                            <span className="hidden sm:inline">登录</span>
                            <span className="sm:hidden">登</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            </TabsContent>
          )}

          {/* Products Management */}
          {permissions?.permissions?.permissionManagement && (
            <TabsContent value="products" className="mt-6">
            <Card className="bg-black/50 border-white/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">商品列表</CardTitle>
                    <CardDescription className="text-white/60">管理兑换商品</CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="bg-[#D4AF37] text-black hover:bg-[#B8941F] text-xs sm:text-sm px-2 sm:px-4">
                        <Plus className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                        <span className="hidden sm:inline">添加商品</span>
                        <span className="sm:hidden">添加</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-black border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-white">
                          {productForm.id ? "编辑商品" : "添加商品"}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label className="text-white">商品名称 *</Label>
                          <Input
                            value={productForm.name}
                            onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                            className="bg-white/5 border-white/10 text-white"
                          />
                        </div>
                        <div>
                          <Label className="text-white">商品描述</Label>
                          <Textarea
                            value={productForm.description}
                            onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                            className="bg-white/5 border-white/10 text-white"
                          />
                        </div>
                        <div>
                          <Label className="text-white">价格 (USDT) *</Label>
                          <Input
                            type="number"
                            value={productForm.price}
                            onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                            className="bg-white/5 border-white/10 text-white"
                          />
                        </div>
                        <div>
                          <Label className="text-white">库存 (留空表示无限)</Label>
                          <Input
                            type="number"
                            value={productForm.stock}
                            onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                            className="bg-white/5 border-white/10 text-white"
                          />
                        </div>
                        <div>
                          <Label className="text-white">图片URL</Label>
                          <Input
                            value={productForm.imageUrl}
                            onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                            className="bg-white/5 border-white/10 text-white"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={resetProductForm}
                          className="border-white/10 text-white"
                        >
                          取消
                        </Button>
                        <Button
                          onClick={handleProductSubmit}
                          className="bg-[#D4AF37] text-black hover:bg-[#B8941F]"
                        >
                          {productForm.id ? "更新" : "创建"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {!products || products.length === 0 ? (
                  <div className="text-center py-8 text-white/60">暂无商品</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.map((product) => (
                      <div key={product.id} className="p-3 sm:p-4 rounded-lg bg-white/5 border border-white/10">
                        {product.imageUrl && (
                          <div className="w-full h-32 rounded-lg overflow-hidden mb-3">
                            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="mb-3">
                          <div className="text-white font-medium mb-1 text-sm sm:text-base">{product.name}</div>
                          <div className="text-xs sm:text-sm text-white/60 mb-2 line-clamp-2">{product.description || "暂无描述"}</div>
                          <div className="flex items-center justify-between">
                            <div className="text-[#D4AF37] font-bold text-sm sm:text-base">
                              {parseFloat(product.price).toFixed(2)} USDT
                            </div>
                            <Badge
                              variant={product.status === "active" ? "default" : "secondary"}
                              className={
                                product.status === "active"
                                  ? "bg-green-500/20 text-green-400 border-green-500/50 text-xs"
                                  : "bg-gray-500/20 text-gray-400 border-gray-500/50 text-xs"
                              }
                            >
                              {product.status === "active" ? "上架" : "下架"}
                            </Badge>
                          </div>
                          {product.stock !== -1 && (
                            <div className="text-xs sm:text-sm text-white/60 mt-1">库存：{product.stock}</div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 border-[#D4AF37]/50 text-[#D4AF37] text-xs"
                                onClick={() =>
                                  setProductForm({
                                    id: product.id,
                                    name: product.name,
                                    description: product.description || "",
                                    price: product.price,
                                    stock: product.stock === -1 ? "" : product.stock.toString(),
                                    imageUrl: product.imageUrl || "",
                                    status: product.status,
                                  })
                                }
                              >
                                <Edit className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                                <span className="hidden sm:inline">编辑</span>
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-black border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle className="text-white">编辑商品</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label className="text-white">商品名称 *</Label>
                                  <Input
                                    value={productForm.name}
                                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                                    className="bg-white/5 border-white/10 text-white"
                                  />
                                </div>
                                <div>
                                  <Label className="text-white">商品描述</Label>
                                  <Textarea
                                    value={productForm.description}
                                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                                    className="bg-white/5 border-white/10 text-white"
                                  />
                                </div>
                                <div>
                                  <Label className="text-white">价格 (USDT) *</Label>
                                  <Input
                                    type="number"
                                    value={productForm.price}
                                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                                    className="bg-white/5 border-white/10 text-white"
                                  />
                                </div>
                                <div>
                                  <Label className="text-white">库存 (留空表示无限)</Label>
                                  <Input
                                    type="number"
                                    value={productForm.stock}
                                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                                    className="bg-white/5 border-white/10 text-white"
                                  />
                                </div>
                                <div>
                                  <Label className="text-white">图片URL</Label>
                                  <Input
                                    value={productForm.imageUrl}
                                    onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                                    className="bg-white/5 border-white/10 text-white"
                                  />
                                </div>
                                <div>
                                  <Label className="text-white">状态</Label>
                                  <select
                                    value={productForm.status}
                                    onChange={(e) =>
                                      setProductForm({ ...productForm, status: e.target.value as "active" | "inactive" })
                                    }
                                    className="w-full bg-white/5 border border-white/10 text-white rounded-md px-3 py-2"
                                  >
                                    <option value="active">上架</option>
                                    <option value="inactive">下架</option>
                                  </select>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  variant="outline"
                                  onClick={resetProductForm}
                                  className="border-white/10 text-white"
                                >
                                  取消
                                </Button>
                                <Button
                                  onClick={handleProductSubmit}
                                  className="bg-[#D4AF37] text-black hover:bg-[#B8941F]"
                                >
                                  更新
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-500/50 text-red-400 px-2 sm:px-3"
                            onClick={() => {
              if (confirm("确定要删除这个商品吗？")) {
                                deleteProductMutation.mutate({ productId: product.id });
                              }
                            }}
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            </TabsContent>
          )}

          {/* Orders Management */}
          {permissions?.permissions?.permissionManagement && (
            <TabsContent value="orders" className="mt-6">
            <Card className="bg-black/50 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">订单列表</CardTitle>
                <CardDescription className="text-white/60">查看所有兑换订单</CardDescription>
              </CardHeader>
              <CardContent>
                {!orders || orders.length === 0 ? (
                  <div className="text-center py-8 text-white/60">暂无订单</div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="p-3 sm:p-4 rounded-lg bg-white/5 border border-white/10">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-2">
                          <div>
                            <div className="text-white font-medium text-sm sm:text-base">订单 #{order.id}</div>
                            <div className="text-xs sm:text-sm text-white/60">
                              用户ID: {order.userId} | 商品ID: {order.productId}
                            </div>
                          </div>
                          <Badge
                            variant={order.status === "completed" ? "default" : "secondary"}
                            className={
                              order.status === "completed"
                                ? "bg-green-500/20 text-green-400 border-green-500/50 text-xs w-fit"
                                : order.status === "pending"
                                ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/50 text-xs w-fit"
                                : "bg-red-500/20 text-red-400 border-red-500/50 text-xs w-fit"
                            }
                          >
                            {order.status === "completed"
                              ? "已完成"
                              : order.status === "pending"
                              ? "处理中"
                              : "已取消"}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                          <div>
                            <span className="text-white/60">数量：</span>
                            <span className="text-white">{order.quantity}</span>
                          </div>
                          <div>
                            <span className="text-white/60">总价：</span>
                            <span className="text-[#D4AF37] font-bold">
                              {parseFloat(order.totalPrice).toFixed(2)} USDT
                            </span>
                          </div>
                          <div className="col-span-1 sm:col-span-2">
                            <span className="text-white/60">创建时间：</span>
                            <span className="text-white">{new Date(order.createdAt).toLocaleString("zh-CN")}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            </TabsContent>
          )}

          {/* Stocks Management */}
          {permissions?.permissions?.memberManagement && (
            <TabsContent value="stocks" className="mt-6">
              <StocksManagement />
            </TabsContent>
          )}

          {/* Staff Management */}
          {permissions?.permissions?.staffManagement && (
            <TabsContent value="staff" className="mt-6">
              <StaffManagement />
            </TabsContent>
          )}

          <TabsContent value="settings" className="mt-6">
            <Card className="bg-black/50 border-white/10 max-w-md">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  修改密码
                </CardTitle>
                <CardDescription className="text-white/60">修改您的管理员账户密码</CardDescription>
              </CardHeader>
              <CardContent>
                <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-[#D4AF37] text-black hover:bg-[#E5C158]">
                      修改密码
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-black/90 border-white/10">
                    <DialogHeader>
                      <DialogTitle className="text-white">修改密码</DialogTitle>
                      <DialogDescription className="text-white/60">
                        请输入当前密码和新密码
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label className="text-white">当前密码</Label>
                        <Input
                          type="password"
                          placeholder="输入当前密码"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                          disabled={isChangingPassword}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white">新密码</Label>
                        <Input
                          type="password"
                          placeholder="输入新密码（至少6个字符）"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                          disabled={isChangingPassword}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white">确认新密码</Label>
                        <Input
                          type="password"
                          placeholder="再次输入新密码"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                          disabled={isChangingPassword}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsChangePasswordOpen(false)}
                        className="border-white/20 text-white hover:bg-white/10"
                        disabled={isChangingPassword}
                      >
                        取消
                      </Button>
                      <Button
                        onClick={handleChangePassword}
                        className="bg-[#D4AF37] text-black hover:bg-[#E5C158]"
                        disabled={isChangingPassword}
                      >
                        {isChangingPassword ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            修改中...
                          </>
                        ) : (
                          "确认修改"
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <ScrollToTop />
    </div>
  );
}
