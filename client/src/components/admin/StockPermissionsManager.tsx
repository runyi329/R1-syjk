import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Loader2, UserPlus, X, Shield } from "lucide-react";
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
}

export default function StockPermissionsManager() {
  const [selectedStockUser, setSelectedStockUser] = useState<StockUser | null>(null);
  const [isAddPermissionOpen, setIsAddPermissionOpen] = useState(false);
  const [selectedWebsiteUserId, setSelectedWebsiteUserId] = useState<string>("");

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
    },
    onError: (error) => toast.error(`授权失败：${error.message}`),
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

    addPermissionMutation.mutate({
      stockUserId: selectedStockUser.id,
      userId: parseInt(selectedWebsiteUserId),
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
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                        <span className="text-[#D4AF37] font-semibold">
                          {(permission.username || permission.email || "U")[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {permission.username || permission.email || `用户${permission.userId}`}
                        </p>
                        {permission.email && permission.username && (
                          <p className="text-white/60 text-sm">{permission.email}</p>
                        )}
                      </div>
                    </div>
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
    </div>
  );
}
