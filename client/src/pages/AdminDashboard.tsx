import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Loader2, Plus, Edit, Trash2, UserPlus, UserMinus, Lock, Unlock } from "lucide-react";
import { toast } from "sonner";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { data: authData, isLoading: authLoading } = trpc.auth.me.useQuery();
  const { data: users, refetch: refetchUsers } = trpc.users.getAllUsers.useQuery(undefined, {
    enabled: authData?.role === "admin",
  });
  const { data: products, refetch: refetchProducts } = trpc.products.getAllProducts.useQuery(undefined, {
    enabled: authData?.role === "admin",
  });
  const { data: orders, refetch: refetchOrders } = trpc.orders.getAllOrders.useQuery(undefined, {
    enabled: authData?.role === "admin",
  });

  // Points management state
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [pointsAmount, setPointsAmount] = useState("");
  const [pointsNotes, setPointsNotes] = useState("");

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
    if (!authLoading && (!authData || authData.role !== "admin")) {
      toast.error("您没有权限访问此页面");
      setLocation("/");
    }
  }, [authData, authLoading, setLocation]);

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
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  if (!authData || authData.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between py-4">
          <button onClick={() => setLocation("/")} className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#D4AF37] rounded flex items-center justify-center font-bold text-black">
              R1
            </div>
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

      <div className="container mx-auto py-8 px-4">
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="bg-black/50 border border-white/10">
            <TabsTrigger value="users" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black">
              用户管理
            </TabsTrigger>
            <TabsTrigger value="products" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black">
              商品管理
            </TabsTrigger>
            <TabsTrigger value="orders" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black">
              订单管理
            </TabsTrigger>
          </TabsList>

          {/* Users Management */}
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
                      <div key={user.id} className="p-4 rounded-lg bg-white/5 border border-white/10">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <div className="text-white font-medium">{user.name || "未设置昵称"}</div>
                            <div className="text-sm text-white/60">ID: {user.id}</div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-[#D4AF37] font-bold text-lg">
                                {parseFloat(user.usdtBalance).toFixed(2)} USDT
                              </div>
                              <Badge
                                variant={user.accountStatus === "active" ? "default" : "destructive"}
                                className={
                                  user.accountStatus === "active"
                                    ? "bg-green-500/20 text-green-400 border-green-500/50"
                                    : "bg-red-500/20 text-red-400 border-red-500/50"
                                }
                              >
                                {user.accountStatus === "active" ? "正常" : "已冻结"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-green-500/50 text-green-400"
                                onClick={() => setSelectedUserId(user.id)}
                              >
                                <UserPlus className="h-4 w-4 mr-1" />
                                添加积分
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
                                      addPointsMutation.mutate({
                                        userId: selectedUserId,
                                        amount: pointsAmount,
                                        notes: pointsNotes || undefined,
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
                                className="border-red-500/50 text-red-400"
                                onClick={() => setSelectedUserId(user.id)}
                              >
                                <UserMinus className="h-4 w-4 mr-1" />
                                扣除积分
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
                              className="border-orange-500/50 text-orange-400"
                              onClick={() => freezeAccountMutation.mutate({ userId: user.id })}
                            >
                              <Lock className="h-4 w-4 mr-1" />
                              冻结账户
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-blue-500/50 text-blue-400"
                              onClick={() => unfreezeAccountMutation.mutate({ userId: user.id })}
                            >
                              <Unlock className="h-4 w-4 mr-1" />
                              解冻账户
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products Management */}
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
                      <Button className="bg-[#D4AF37] text-black hover:bg-[#B8941F]">
                        <Plus className="h-4 w-4 mr-1" />
                        添加商品
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-black border-white/10 max-w-2xl">
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
                      <div key={product.id} className="p-4 rounded-lg bg-white/5 border border-white/10">
                        {product.imageUrl && (
                          <div className="w-full h-32 rounded-lg overflow-hidden mb-3">
                            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="mb-3">
                          <div className="text-white font-medium mb-1">{product.name}</div>
                          <div className="text-sm text-white/60 mb-2">{product.description || "暂无描述"}</div>
                          <div className="flex items-center justify-between">
                            <div className="text-[#D4AF37] font-bold">
                              {parseFloat(product.price).toFixed(2)} USDT
                            </div>
                            <Badge
                              variant={product.status === "active" ? "default" : "secondary"}
                              className={
                                product.status === "active"
                                  ? "bg-green-500/20 text-green-400 border-green-500/50"
                                  : "bg-gray-500/20 text-gray-400 border-gray-500/50"
                              }
                            >
                              {product.status === "active" ? "上架" : "下架"}
                            </Badge>
                          </div>
                          {product.stock !== -1 && (
                            <div className="text-sm text-white/60 mt-1">库存：{product.stock}</div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 border-[#D4AF37]/50 text-[#D4AF37]"
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
                                <Edit className="h-4 w-4 mr-1" />
                                编辑
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-black border-white/10 max-w-2xl">
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
                            className="border-red-500/50 text-red-400"
                            onClick={() => {
              if (confirm("确定要删除这个商品吗？")) {
                                deleteProductMutation.mutate({ productId: product.id });
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Management */}
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
                      <div key={order.id} className="p-4 rounded-lg bg-white/5 border border-white/10">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="text-white font-medium">订单 #{order.id}</div>
                            <div className="text-sm text-white/60">
                              用户ID: {order.userId} | 商品ID: {order.productId}
                            </div>
                          </div>
                          <Badge
                            variant={order.status === "completed" ? "default" : "secondary"}
                            className={
                              order.status === "completed"
                                ? "bg-green-500/20 text-green-400 border-green-500/50"
                                : order.status === "pending"
                                ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
                                : "bg-red-500/20 text-red-400 border-red-500/50"
                            }
                          >
                            {order.status === "completed"
                              ? "已完成"
                              : order.status === "pending"
                              ? "处理中"
                              : "已取消"}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
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
                          <div>
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
        </Tabs>
      </div>
    </div>
  );
}
