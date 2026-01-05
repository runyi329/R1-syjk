import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useState } from "react";
import { Loader2, ShoppingCart, Coins } from "lucide-react";
import { toast } from "sonner";

export default function Shop() {
  const [, setLocation] = useLocation();
  const [quantities, setQuantities] = useState<Record<number, number>>({});

  const { data: authData } = trpc.auth.me.useQuery();
  const { data: products, isLoading: productsLoading } = trpc.products.getActiveProducts.useQuery();
  const { data: userData } = trpc.users.getMe.useQuery(undefined, {
    enabled: !!authData,
  });

  const redeemMutation = trpc.orders.redeemProduct.useMutation({
    onSuccess: (data) => {
      toast.success(`兑换成功！剩余余额：${parseFloat(data.newBalance).toFixed(2)} USDT`);
      setQuantities({});
    },
    onError: (error) => {
      toast.error(`兑换失败：${error.message}`);
    },
  });

  const handleRedeem = (productId: number, price: string) => {
    if (!authData) {
      toast.error("请先登录后再兑换商品");
      return;
    }

    if (userData?.accountStatus === "frozen") {
      toast.error("您的账户已被冻结，无法进行兑换");
      return;
    }

    const quantity = quantities[productId] || 1;
    const totalPrice = parseFloat(price) * quantity;
    const currentBalance = parseFloat(userData?.usdtBalance || "0");

    if (currentBalance < totalPrice) {
      toast.error(`余额不足！需要 ${totalPrice.toFixed(2)} USDT，当前余额 ${currentBalance.toFixed(2)} USDT`);
      return;
    }

    redeemMutation.mutate({ productId, quantity });
  };

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
              <div className="text-[#D4AF37] font-bold text-lg">澳门润仪投资</div>
              <div className="text-xs text-white/60">RUNYI INVESTMENT</div>
            </div>
          </button>

          <div className="flex items-center gap-4">
            {authData && userData && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37]/30">
                <Coins className="h-5 w-5 text-[#D4AF37]" />
                <span className="text-[#D4AF37] font-bold">{parseFloat(userData.usdtBalance).toFixed(2)} USDT</span>
              </div>
            )}
            {authData ? (
              <Button onClick={() => setLocation("/user-center")} variant="outline" className="border-[#D4AF37] text-[#D4AF37]">
                个人中心
              </Button>
            ) : (
              <Button onClick={() => window.location.href = "/api/oauth/login"} className="bg-[#D4AF37] text-black hover:bg-[#B8941F]">
                登录 / 注册
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto py-8 px-4">
        {/* Page Title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-[#D4AF37] mb-4">兑换商城</h1>
          <p className="text-white/60 text-lg">使用 USDT 积分兑换精选商品</p>
        </div>

        {/* Products Grid */}
        {productsLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
          </div>
        ) : !products || products.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="h-16 w-16 text-white/20 mx-auto mb-4" />
            <p className="text-white/60 text-lg">暂无可兑换商品</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Card key={product.id} className="bg-black/50 border-white/10 hover:border-[#D4AF37]/50 transition-all">
                <CardHeader>
                  {product.imageUrl && (
                    <div className="w-full h-48 rounded-lg overflow-hidden mb-4">
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <CardTitle className="text-white">{product.name}</CardTitle>
                  <CardDescription className="text-white/60">{product.description || "暂无描述"}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-2xl font-bold text-[#D4AF37]">
                      {parseFloat(product.price).toFixed(2)} USDT
                    </div>
                    {product.stock !== -1 && (
                      <Badge variant="outline" className="text-white/60 border-white/30">
                        库存：{product.stock}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="1"
                      max={product.stock === -1 ? undefined : product.stock}
                      value={quantities[product.id] || 1}
                      onChange={(e) => setQuantities({ ...quantities, [product.id]: parseInt(e.target.value) || 1 })}
                      className="bg-white/5 border-white/10 text-white"
                    />
                    <span className="text-white/60 text-sm">数量</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={() => handleRedeem(product.id, product.price)}
                    disabled={redeemMutation.isPending || (product.stock !== -1 && product.stock === 0)}
                    className="w-full bg-[#D4AF37] text-black hover:bg-[#B8941F]"
                  >
                    {redeemMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        兑换中...
                      </>
                    ) : product.stock !== -1 && product.stock === 0 ? (
                      "已售罄"
                    ) : (
                      "立即兑换"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
