import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Loader2, ShoppingCart, Coins } from "lucide-react";
import { toast } from "sonner";
import ScrollToTop from "@/components/ScrollToTop";

export default function Shop() {
  const [, setLocation] = useLocation();
  const [quantities, setQuantities] = useState<Record<number, number>>({});

  const { data: authData } = trpc.auth.me.useQuery();
  const { data: products, isLoading: productsLoading } = trpc.products.getActiveProducts.useQuery();
  const { data: userData } = trpc.users.getMe.useQuery(undefined, {
    enabled: !!authData,
  });

  useEffect(() => {
    // 如果用户已登录但未设置用户名，跳转到注册页面
    if (authData && userData && !userData.name) {
      setLocation("/register");
    }
  }, [authData, userData, setLocation]);

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
    <div className="min-h-screen pb-20 md:pb-0 bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-sm z-50">
        <div className="container mx-auto flex items-center justify-between py-4">
          <button onClick={() => setLocation("/")} className="flex items-center gap-2">
            <Logo size={40} />
            <div>
              <div className="text-[#D4AF37] font-bold text-lg">数金研投</div>
              <div className="text-xs text-white/60">SHUJIN RESEARCH</div>
            </div>
          </button>

          <div className="flex items-center gap-2 sm:gap-4">
            {authData && userData && (
              <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1 sm:py-2 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37]/30">
                <Coins className="h-4 w-4 sm:h-5 sm:w-5 text-[#D4AF37]" />
                <span className="text-[#D4AF37] font-bold text-xs sm:text-base">{parseFloat(userData.usdtBalance).toFixed(2)} USDT</span>
              </div>
            )}
            {authData ? (
              <Button onClick={() => setLocation("/user-center")} variant="outline" className="border-[#D4AF37] text-[#D4AF37] text-xs sm:text-sm px-2 sm:px-4">
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
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#D4AF37] mb-3 sm:mb-4">兑换商城</h1>
          <p className="text-white/60 text-base sm:text-lg">使用 USDT 积分兑换精选商品</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {products.map((product) => (
              <Card key={product.id} className="bg-black/50 border-white/10 hover:border-[#D4AF37]/50 transition-all">
                <CardHeader className="p-3 sm:p-6">
                  {product.imageUrl && (
                    <div className="w-full h-40 sm:h-48 rounded-lg overflow-hidden mb-3 sm:mb-4">
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <CardTitle className="text-white text-base sm:text-lg">{product.name}</CardTitle>
                  <CardDescription className="text-white/60 text-xs sm:text-sm line-clamp-2">{product.description || "暂无描述"}</CardDescription>
                </CardHeader>
                <CardContent className="p-3 sm:p-6">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="text-xl sm:text-2xl font-bold text-[#D4AF37]">
                      {parseFloat(product.price).toFixed(2)} USDT
                    </div>
                    {product.stock !== -1 && (
                      <Badge variant="outline" className="text-white/60 border-white/30 text-xs">
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
                      className="bg-white/5 border-white/10 text-white text-sm"
                    />
                    <span className="text-white/60 text-xs sm:text-sm">数量</span>
                  </div>
                </CardContent>
                <CardFooter className="p-3 sm:p-6">
                  <Button
                    onClick={() => handleRedeem(product.id, product.price)}
                    disabled={redeemMutation.isPending || (product.stock !== -1 && product.stock === 0)}
                    className="w-full bg-[#D4AF37] text-black hover:bg-[#B8941F] text-sm sm:text-base"
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
      <ScrollToTop />
    </div>
  );
}
