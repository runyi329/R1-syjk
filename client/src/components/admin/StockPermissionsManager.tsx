import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Loader2, UserPlus, X, Shield, Pencil } from "lucide-react";
import { toast } from "sonner";

interface StockUser {
  id: number;
  name: string;
  initialBalance: string;
  status: "active" | "inactive";
}

interface WebsiteUser {
  id: number;
  username: string | null;
  email: string | null;
  role: string;
}

interface Permission {
  id: number;
  stockUserId: number;
  userId: number;
  username: string | null;
  email: string | null;
  startAmount: string;
  profitPercentage: number;
  authorizationDate: Date | null;
}

export default function StockPermissionsManager() {
  const [selectedStockUser, setSelectedStockUser] = useState<StockUser | null>(null);
  const [isAddPermissionOpen, setIsAddPermissionOpen] = useState(false);
  const [selectedWebsiteUserId, setSelectedWebsiteUserId] = useState<string>("");
  const [startAmount, setStartAmount] = useState<string>("");
  const [profitPercentage, setProfitPercentage] = useState<string>("1");
  const [authorizationDate, setAuthorizationDate] = useState<string>("");
  
  // 编辑授权信息的状态
  const [isEditPermissionOpen, setIsEditPermissionOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  const [editStartAmount, setEditStartAmount] = useState<string>("");
  const [editProfitPercentage, setEditProfitPercentage] = useState<string>("1");
  const [editAuthorizationDate, setEditAuthorizationDate] = useState<string>("");

  // 获取所有股票用户
  const { data: stockUsers, isLoading: isLoadingStockUsers } = trpc.stocks.getAllStockUsers.useQuery();

  // 获取所有网站用户
  const { data: websiteUsers, isLoading: isLoadingWebsiteUsers } = trpc.stocks.getAllWebsiteUsers.useQuery();

  // 获取选中股票用户的权限列表
  const { data: permissions, refetch: refetchPermissions } = trpc.stocks.getStockUserPermissions.useQuery(
    { stockUserId: selectedStockUser?.id || 0 },
    { enabled: !!selectedStockUser }
  );

  // 添加权限
  const addPermissionMutation = trpc.stocks.addStockUserPermission.useMutation({
    onSuccess: () => {
      toast.success("授权成功");
      refetchPermissions();
      setIsAddPermissionOpen(false);
      setSelectedWebsiteUserId("");
      setStartAmount("");
      setProfitPercentage("1");
      setAuthorizationDate("");
    },
    onError: (error) => toast.error(`授权失败：${error.message}`),
  });

  // 更新权限
  const updatePermissionMutation = trpc.stocks.updateStockUserPermission.useMutation({
    onSuccess: () => {
      toast.success("更新授权信息成功");
      refetchPermissions();
      setIsEditPermissionOpen(false);
      setEditingPermission(null);
    },
    onError: (error) => toast.error(`更新授权信息失败：${error.message}`),
  });

  // 删除权限
  const removePermissionMutation = trpc.stocks.removeStockUserPermission.useMutation({
    onSuccess: () => {
      toast.success("取消授权成功");
      refetchPermissions();
    },
    onError: (error) => toast.error(`取消授权失败：${error.message}`),
  });

  const handleAddPermission = () => {
    if (!selectedStockUser || !selectedWebsiteUserId) {
      toast.error("请选择网站用户");
      return;
    }
    
    if (!startAmount || parseFloat(startAmount) < 0) {
      toast.error("请输入有效的开始金额");
      return;
    }
    
    const percentage = parseInt(profitPercentage);
    if (isNaN(percentage) || percentage < 1 || percentage > 100) {
      toast.error("请输入有效的分成百分比（1-100）");
      return;
    }

    addPermissionMutation.mutate({
      stockUserId: selectedStockUser.id,
      userId: parseInt(selectedWebsiteUserId),
      startAmount: startAmount,
      profitPercentage: percentage,
      authorizationDate: authorizationDate || undefined,
    });
  };

  const handleEditPermission = (permission: Permission) => {
    setEditingPermission(permission);
    setEditStartAmount(permission.startAmount);
    setEditProfitPercentage(permission.profitPercentage.toString());
    setEditAuthorizationDate(
      permission.authorizationDate 
        ? new Date(permission.authorizationDate).toISOString().split('T')[0] 
        : ""
    );
    setIsEditPermissionOpen(true);
  };

  const handleUpdatePermission = () => {
    if (!selectedStockUser || !editingPermission) return;
    
    if (!editStartAmount || parseFloat(editStartAmount) < 0) {
      toast.error("请输入有效的开始金额");
      return;
    }
    
    const percentage = parseInt(editProfitPercentage);
    if (isNaN(percentage) || percentage < 1 || percentage > 100) {
      toast.error("请输入有效的分成百分比（1-100）");
      return;
    }

    updatePermissionMutation.mutate({
      stockUserId: selectedStockUser.id,
      userId: editingPermission.userId,
      startAmount: editStartAmount,
      profitPercentage: percentage,
      authorizationDate: editAuthorizationDate || undefined,
    });
  };

  const handleRemovePermission = (userId: number) => {
    if (!selectedStockUser) return;

    removePermissionMutation.mutate({
      stockUserId: selectedStockUser.id,
      userId,
    });
  };

  // 过滤出未授权的网站用户
  const availableWebsiteUsers = websiteUsers?.filter(
    (user) => !permissions?.some((perm) => perm.userId === user.id)
  );

  if (isLoadingStockUsers) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 股票客户选择 */}
      <Card className="bg-black/50 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">选择股票客户</CardTitle>
          <CardDescription className="text-white/60">
            选择要管理权限的股票客户
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stockUsers?.filter((user) => user.status === "active").map((user) => (
              <Card
                key={user.id}
                className={`cursor-pointer transition-all ${
                  selectedStockUser?.id === user.id
                    ? "bg-[#D4AF37]/20 border-[#D4AF37]"
                    : "bg-black/30 border-white/10 hover:border-white/30"
                }`}
                onClick={() => setSelectedStockUser(user)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-semibold">{user.name}</h3>
                      <p className="text-white/60 text-sm">
                        初始资金: ¥{parseFloat(user.initialBalance).toLocaleString()}
                      </p>
                    </div>
                    {selectedStockUser?.id === user.id && (
                      <Shield className="w-5 h-5 text-[#D4AF37]" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 权限列表 */}
      {selectedStockUser && (
        <Card className="bg-black/50 border-white/10">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-white">
                {selectedStockUser.name} - 已授权用户
              </CardTitle>
              <CardDescription className="text-white/60">
                以下网站用户可以查看该股票客户的数据
              </CardDescription>
            </div>
            <Dialog open={isAddPermissionOpen} onOpenChange={setIsAddPermissionOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#D4AF37] text-black hover:bg-[#E5C158]">
                  <UserPlus className="w-4 h-4 mr-2" />
                  添加授权
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#1a1a1a] border-white/10 text-white">
                <DialogHeader>
                  <DialogTitle>添加授权用户</DialogTitle>
                  <DialogDescription className="text-white/60">
                    选择可以查看 {selectedStockUser.name} 数据的网站用户
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm text-white/80">选择网站用户</label>
                    <Select value={selectedWebsiteUserId} onValueChange={setSelectedWebsiteUserId}>
                      <SelectTrigger className="bg-black/50 border-white/20">
                        <SelectValue placeholder="请选择用户" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1a1a] border-white/20">
                        {isLoadingWebsiteUsers ? (
                          <div className="p-4 text-center">
                            <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                          </div>
                        ) : availableWebsiteUsers && availableWebsiteUsers.length > 0 ? (
                          availableWebsiteUsers.map((user) => (
                            <SelectItem key={user.id} value={user.id.toString()}>
                              <div className="flex items-center gap-2">
                                <span>{user.username || user.email || `用户${user.id}`}</span>
                                {user.role === "admin" && (
                                  <Badge variant="outline" className="text-xs">管理员</Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-4 text-center text-white/60">
                            所有用户已授权
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm text-white/80">开始金额（元）</label>
                    <input
                      type="number"
                      value={startAmount}
                      onChange={(e) => setStartAmount(e.target.value)}
                      placeholder="请输入开始金额"
                      className="w-full px-3 py-2 bg-black/50 border border-white/20 rounded-md text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                      step="0.01"
                      min="0"
                    />
                    <p className="text-xs text-white/50">该用户关注的起始金额节点</p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm text-white/80">分成百分比（%）</label>
                    <input
                      type="number"
                      value={profitPercentage}
                      onChange={(e) => setProfitPercentage(e.target.value)}
                      placeholder="请输入分成百分比"
                      className="w-full px-3 py-2 bg-black/50 border border-white/20 rounded-md text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                      min="1"
                      max="100"
                    />
                    <p className="text-xs text-white/50">范围：1%-100%</p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm text-white/80">授权日期（可选）</label>
                    <input
                      type="date"
                      value={authorizationDate}
                      onChange={(e) => setAuthorizationDate(e.target.value)}
                      className="w-full px-3 py-2 bg-black/50 border border-white/20 rounded-md text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                    />
                    <p className="text-xs text-white/50">授权生效的日期，用于记录和展示</p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddPermissionOpen(false)}>
                    取消
                  </Button>
                  <Button
                    onClick={handleAddPermission}
                    className="bg-[#D4AF37] text-black hover:bg-[#E5C158]"
                    disabled={addPermissionMutation.isPending || !selectedWebsiteUserId}
                  >
                    {addPermissionMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "确认授权"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {permissions && permissions.length > 0 ? (
              <div className="space-y-2">
                {permissions.map((permission) => (
                  <div
                    key={permission.id}
                    className="flex items-center justify-between p-4 bg-black/30 border border-white/10 rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                        <span className="text-[#D4AF37] font-semibold">
                          {(permission.username || permission.email || "U")[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">
                          {permission.username || permission.email || `用户${permission.userId}`}
                        </p>
                        <div className="flex flex-wrap gap-3 mt-1 text-sm text-white/60">
                          <span>开始金额: ¥{parseFloat(permission.startAmount).toLocaleString()}</span>
                          <span>分成: {permission.profitPercentage}%</span>
                          {permission.authorizationDate && (
                            <span>授权日期: {new Date(permission.authorizationDate).toLocaleDateString('zh-CN')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditPermission(permission)}
                        className="text-[#D4AF37] hover:text-[#E5C158] hover:bg-[#D4AF37]/10"
                      >
                        <Pencil className="w-4 h-4 mr-1" />
                        编辑
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemovePermission(permission.userId)}
                        disabled={removePermissionMutation.isPending}
                        className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                      >
                        {removePermissionMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <X className="w-4 h-4 mr-1" />
                            取消授权
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Shield className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/60">暂无授权用户</p>
                <p className="text-white/40 text-sm mt-2">
                  点击"添加授权"按钮为该股票客户添加可查看数据的网站用户
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!selectedStockUser && (
        <Card className="bg-black/50 border-white/10">
          <CardContent className="py-12">
            <div className="text-center">
              <Shield className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <p className="text-white/60">请先选择一个股票客户</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 编辑授权信息对话框 */}
      <Dialog open={isEditPermissionOpen} onOpenChange={setIsEditPermissionOpen}>
        <DialogContent className="bg-[#1a1a1a] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>编辑授权信息</DialogTitle>
            <DialogDescription className="text-white/60">
              修改 {editingPermission?.username || editingPermission?.email || `用户${editingPermission?.userId}`} 的授权信息
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm text-white/80">开始金额（元）</label>
              <input
                type="number"
                value={editStartAmount}
                onChange={(e) => setEditStartAmount(e.target.value)}
                placeholder="请输入开始金额"
                className="w-full px-3 py-2 bg-black/50 border border-white/20 rounded-md text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                step="0.01"
                min="0"
              />
              <p className="text-xs text-white/50">该用户关注的起始金额节点</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm text-white/80">分成百分比（%）</label>
              <input
                type="number"
                value={editProfitPercentage}
                onChange={(e) => setEditProfitPercentage(e.target.value)}
                placeholder="请输入分成百分比"
                className="w-full px-3 py-2 bg-black/50 border border-white/20 rounded-md text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                min="1"
                max="100"
              />
              <p className="text-xs text-white/50">范围：1%-100%</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm text-white/80">授权日期（可选）</label>
              <input
                type="date"
                value={editAuthorizationDate}
                onChange={(e) => setEditAuthorizationDate(e.target.value)}
                className="w-full px-3 py-2 bg-black/50 border border-white/20 rounded-md text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
              />
              <p className="text-xs text-white/50">授权生效的日期，用于记录和展示</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditPermissionOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleUpdatePermission}
              className="bg-[#D4AF37] text-black hover:bg-[#E5C158]"
              disabled={updatePermissionMutation.isPending}
            >
              {updatePermissionMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "保存修改"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
