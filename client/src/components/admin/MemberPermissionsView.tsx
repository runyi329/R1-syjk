import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Loader2, User, Calendar, DollarSign, Percent, Shield } from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

interface MemberPermission {
  userId: number;
  username: string | null;
  email: string | null;
  authorizedStockUsers: Array<{
    stockUserId: number;
    stockUserName: string | null;
    startAmount: string;
    profitPercentage: number;
    authorizationDate: Date | null;
    deposit: string;
    createdAt: Date;
  }>;
}

export default function MemberPermissionsView() {
  const utils = trpc.useUtils();
  const { data: memberPermissions, isLoading, refetch } = trpc.stocks.getMemberPermissions.useQuery(
    undefined,
    {
      // 禁用自动缓存,每次都重新获取数据
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      staleTime: 0,
    }
  );

  // 组件挂载时刷新数据
  useEffect(() => {
    refetch();
  }, [refetch]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  if (!memberPermissions || memberPermissions.length === 0) {
    return (
      <div className="text-center py-12 text-white/60">
        暂无会员授权记录
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {memberPermissions.map((member) => (
        <Card key={member.userId} className="bg-black/30 border-white/10">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-[#D4AF37]" />
                <div>
                  <CardTitle className="text-white text-lg">
                    {member.username || "未知用户"}
                  </CardTitle>
                  {member.email && (
                    <p className="text-sm text-white/60 mt-1">{member.email}</p>
                  )}
                </div>
              </div>
              <Badge variant="outline" className="border-[#D4AF37] text-[#D4AF37]">
                {member.authorizedStockUsers.length} 个授权
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {member.authorizedStockUsers.map((stockUser, index) => (
                <div
                  key={`${stockUser.stockUserId}-${index}`}
                  className="bg-black/30 rounded-lg p-4 border border-white/5"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="text-white font-medium">
                      {stockUser.stockUserName || "未知股票用户"}
                    </h4>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-[#D4AF37]" />
                      <div>
                        <p className="text-white/60">开始金额</p>
                        <p className="text-white font-medium">
                          ¥{parseFloat(stockUser.startAmount).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Percent className="h-4 w-4 text-[#D4AF37]" />
                      <div>
                        <p className="text-white/60">分成比例</p>
                        <p className="text-white font-medium">{stockUser.profitPercentage}%</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-[#D4AF37]" />
                      <div>
                        <p className="text-white/60">授权日期</p>
                        <p className="text-white font-medium">
                          {stockUser.authorizationDate
                            ? format(new Date(stockUser.authorizationDate), "yyyy-MM-dd", { locale: zhCN })
                            : "未设置"}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-[#D4AF37]" />
                      <div>
                        <p className="text-white/60">保证金</p>
                        <p className="text-white font-medium">
                          ¥{parseFloat(stockUser.deposit).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
