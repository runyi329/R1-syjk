import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { Loader2, Plus, Edit, Trash2, ChevronLeft, ChevronRight, Calendar, TrendingUp, TrendingDown, User } from "lucide-react";
import { toast } from "sonner";

interface StockUser {
  id: number;
  name: string;
  initialBalance: string;
  notes: string | null;
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}

interface StockBalance {
  id: number;
  stockUserId: number;
  date: string;
  balance: string;
  notes: string | null;
}

interface DailyProfit {
  date: string;
  balance: number;
  dailyProfit: number;
  totalProfit: number;
  profitRate: number;
}

export default function StocksManagement() {
  const [activeTab, setActiveTab] = useState("users");
  const [selectedUser, setSelectedUser] = useState<StockUser | null>(null);
  
  // 用户表单状态
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [userForm, setUserForm] = useState({
    name: "",
    initialBalance: "",
    notes: "",
  });
  const [editingUser, setEditingUser] = useState<StockUser | null>(null);
  
  // 日历状态
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [balanceInput, setBalanceInput] = useState("");
  const [balanceNotes, setBalanceNotes] = useState("");
  
  // 视图模式：balance（余额）或 profit（盈亏）
  const [viewMode, setViewMode] = useState<"balance" | "profit">("balance");
  
  // 获取所有股票用户
  const { data: stockUsers, refetch: refetchUsers, isLoading: isLoadingUsers } = trpc.stocks.getAllStockUsers.useQuery();
  
  // 获取用户余额记录
  const { data: userBalances, refetch: refetchBalances } = trpc.stocks.getStockBalances.useQuery(
    { stockUserId: selectedUser?.id || 0 },
    { enabled: !!selectedUser }
  );
  
  // 获取用户统计数据
  const { data: userStats, refetch: refetchStats } = trpc.stocks.getStockUserStats.useQuery(
    { stockUserId: selectedUser?.id || 0 },
    { enabled: !!selectedUser }
  );
  
  // 创建用户
  const createUserMutation = trpc.stocks.createStockUser.useMutation({
    onSuccess: () => {
      toast.success("用户创建成功");
      refetchUsers();
      setIsAddUserOpen(false);
      setUserForm({ name: "", initialBalance: "", notes: "" });
    },
    onError: (error) => toast.error(`创建失败：${error.message}`),
  });
  
  // 更新用户
  const updateUserMutation = trpc.stocks.updateStockUser.useMutation({
    onSuccess: () => {
      toast.success("用户更新成功");
      refetchUsers();
      setIsEditUserOpen(false);
      setEditingUser(null);
    },
    onError: (error) => toast.error(`更新失败：${error.message}`),
  });
  
  // 删除用户
  const deleteUserMutation = trpc.stocks.deleteStockUser.useMutation({
    onSuccess: () => {
      toast.success("用户删除成功");
      refetchUsers();
      if (selectedUser?.id === editingUser?.id) {
        setSelectedUser(null);
      }
    },
    onError: (error) => toast.error(`删除失败：${error.message}`),
  });
  
  // 设置每日余额
  const setBalanceMutation = trpc.stocks.setDailyBalance.useMutation({
    onSuccess: () => {
      toast.success("余额已保存");
      refetchBalances();
      refetchStats();
      setSelectedDate(null);
      setBalanceInput("");
      setBalanceNotes("");
    },
    onError: (error) => toast.error(`保存失败：${error.message}`),
  });
  
  // 删除每日余额
  const deleteBalanceMutation = trpc.stocks.deleteDailyBalance.useMutation({
    onSuccess: () => {
      toast.success("记录已删除");
      refetchBalances();
      refetchStats();
      setSelectedDate(null);
      setBalanceInput("");
      setBalanceNotes("");
    },
    onError: (error) => toast.error(`删除失败：${error.message}`),
  });
  
  // 生成日历数据
  const generateCalendarDays = () => {
    const firstDay = new Date(currentYear, currentMonth - 1, 1);
    const lastDay = new Date(currentYear, currentMonth, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days: (number | null)[] = [];
    
    // 填充月初空白
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    
    // 填充日期
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  };
  
  // 获取某日的余额记录
  const getBalanceForDate = (day: number): StockBalance | undefined => {
    if (!userBalances) return undefined;
    const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return userBalances.find((b: StockBalance) => b.date === dateStr);
  };
  
  // 获取某日的盈亏数据
  const getProfitForDate = (day: number): DailyProfit | undefined => {
    if (!userStats?.dailyProfits) return undefined;
    const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return userStats.dailyProfits.find((p: DailyProfit) => p.date === dateStr);
  };
  
  // 处理日期点击
  const handleDateClick = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateStr);
    
    const existingBalance = getBalanceForDate(day);
    if (existingBalance) {
      setBalanceInput(existingBalance.balance);
      setBalanceNotes(existingBalance.notes || "");
    } else {
      setBalanceInput("");
      setBalanceNotes("");
    }
  };
  
  // 保存余额
  const handleSaveBalance = () => {
    if (!selectedUser || !selectedDate || !balanceInput) {
      toast.error("请填写余额");
      return;
    }
    
    setBalanceMutation.mutate({
      stockUserId: selectedUser.id,
      date: selectedDate,
      balance: balanceInput,
      notes: balanceNotes || undefined,
    });
  };
  
  // 删除余额记录
  const handleDeleteBalance = () => {
    if (!selectedUser || !selectedDate) return;
    
    deleteBalanceMutation.mutate({
      stockUserId: selectedUser.id,
      date: selectedDate,
    });
  };
  
  // 创建用户
  const handleCreateUser = () => {
    if (!userForm.name || !userForm.initialBalance) {
      toast.error("请填写用户名和起始金额");
      return;
    }
    
    createUserMutation.mutate({
      name: userForm.name,
      initialBalance: userForm.initialBalance,
      notes: userForm.notes || undefined,
    });
  };
  
  // 更新用户
  const handleUpdateUser = () => {
    if (!editingUser) return;
    
    updateUserMutation.mutate({
      id: editingUser.id,
      name: userForm.name || undefined,
      initialBalance: userForm.initialBalance || undefined,
      notes: userForm.notes || undefined,
    });
  };
  
  // 格式化金额
  const formatAmount = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  
  const calendarDays = generateCalendarDays();
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  
  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-black/50 border border-white/10">
          <TabsTrigger value="users" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black">
            用户管理
          </TabsTrigger>
          <TabsTrigger value="calendar" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black">
            余额管理
          </TabsTrigger>
        </TabsList>
        
        {/* 用户管理标签页 */}
        <TabsContent value="users" className="mt-4">
          <Card className="bg-black/50 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-white">股票用户列表</CardTitle>
                <CardDescription className="text-white/60">管理A股账户用户</CardDescription>
              </div>
              <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[#D4AF37] text-black hover:bg-[#E5C158]">
                    <Plus className="w-4 h-4 mr-2" />
                    添加用户
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#1a1a1a] border-white/10 text-white">
                  <DialogHeader>
                    <DialogTitle>添加股票用户</DialogTitle>
                    <DialogDescription className="text-white/60">
                      创建新的股票账户用户
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>用户名 *</Label>
                      <Input
                        value={userForm.name}
                        onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                        placeholder="请输入用户名"
                        className="bg-black/50 border-white/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>起始金额 *</Label>
                      <Input
                        type="number"
                        value={userForm.initialBalance}
                        onChange={(e) => setUserForm({ ...userForm, initialBalance: e.target.value })}
                        placeholder="请输入起始金额"
                        className="bg-black/50 border-white/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>备注</Label>
                      <Textarea
                        value={userForm.notes}
                        onChange={(e) => setUserForm({ ...userForm, notes: e.target.value })}
                        placeholder="可选备注信息"
                        className="bg-black/50 border-white/20"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
                      取消
                    </Button>
                    <Button 
                      onClick={handleCreateUser}
                      className="bg-[#D4AF37] text-black hover:bg-[#E5C158]"
                      disabled={createUserMutation.isPending}
                    >
                      {createUserMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "创建"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {isLoadingUsers ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
                </div>
              ) : !stockUsers || stockUsers.length === 0 ? (
                <div className="text-center py-8 text-white/60">
                  暂无股票用户，点击上方按钮添加
                </div>
              ) : (
                <div className="space-y-3">
                  {stockUsers.map((user: StockUser) => (
                    <div
                      key={user.id}
                      className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                        selectedUser?.id === user.id
                          ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                          : 'border-white/10 hover:border-white/30'
                      }`}
                      onClick={() => {
                        setSelectedUser(user);
                        setActiveTab("calendar");
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                            <User className="w-5 h-5 text-[#D4AF37]" />
                          </div>
                          <div>
                            <div className="font-medium text-white">{user.name}</div>
                            <div className="text-sm text-white/60">
                              起始金额: ¥{formatAmount(user.initialBalance)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={user.status === "active" ? "default" : "secondary"}>
                            {user.status === "active" ? "活跃" : "停用"}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingUser(user);
                              setUserForm({
                                name: user.name,
                                initialBalance: user.initialBalance,
                                notes: user.notes || "",
                              });
                              setIsEditUserOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-500 hover:text-red-400"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`确定要删除用户 ${user.name} 吗？这将同时删除所有余额记录。`)) {
                                deleteUserMutation.mutate({ id: user.id });
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      {user.notes && (
                        <div className="mt-2 text-sm text-white/40">{user.notes}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* 编辑用户对话框 */}
          <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
            <DialogContent className="bg-[#1a1a1a] border-white/10 text-white">
              <DialogHeader>
                <DialogTitle>编辑用户</DialogTitle>
                <DialogDescription className="text-white/60">
                  修改用户信息
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>用户名</Label>
                  <Input
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    className="bg-black/50 border-white/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label>起始金额</Label>
                  <Input
                    type="number"
                    value={userForm.initialBalance}
                    onChange={(e) => setUserForm({ ...userForm, initialBalance: e.target.value })}
                    className="bg-black/50 border-white/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label>备注</Label>
                  <Textarea
                    value={userForm.notes}
                    onChange={(e) => setUserForm({ ...userForm, notes: e.target.value })}
                    className="bg-black/50 border-white/20"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditUserOpen(false)}>
                  取消
                </Button>
                <Button 
                  onClick={handleUpdateUser}
                  className="bg-[#D4AF37] text-black hover:bg-[#E5C158]"
                  disabled={updateUserMutation.isPending}
                >
                  {updateUserMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "保存"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
        
        {/* 余额管理标签页 */}
        <TabsContent value="calendar" className="mt-4">
          {!selectedUser ? (
            <Card className="bg-black/50 border-white/10">
              <CardContent className="py-8">
                <div className="text-center text-white/60">
                  请先在"用户管理"中选择一个用户
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* 用户信息和统计 */}
              <Card className="bg-black/50 border-white/10">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                        <User className="w-6 h-6 text-[#D4AF37]" />
                      </div>
                      <div>
                        <CardTitle className="text-white">{selectedUser.name}</CardTitle>
                        <CardDescription className="text-white/60">
                          起始金额: ¥{formatAmount(selectedUser.initialBalance)}
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedUser(null);
                        setActiveTab("users");
                      }}
                    >
                      返回列表
                    </Button>
                  </div>
                </CardHeader>
                {userStats && (
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-3 rounded-lg bg-black/30 border border-white/10">
                        <div className="text-sm text-white/60">最新余额</div>
                        <div className="text-xl font-bold text-white">
                          ¥{formatAmount(userStats.latestBalance)}
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-black/30 border border-white/10">
                        <div className="text-sm text-white/60">累计盈亏</div>
                        <div className={`text-xl font-bold ${userStats.totalProfit >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                          {userStats.totalProfit >= 0 ? '+' : ''}¥{formatAmount(userStats.totalProfit)}
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-black/30 border border-white/10">
                        <div className="text-sm text-white/60">收益率</div>
                        <div className={`text-xl font-bold ${userStats.totalProfitRate >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                          {userStats.totalProfitRate >= 0 ? '+' : ''}{userStats.totalProfitRate}%
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-black/30 border border-white/10">
                        <div className="text-sm text-white/60">记录天数</div>
                        <div className="text-xl font-bold text-white">
                          {userStats.recordCount} 天
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
              
              {/* 日历视图 */}
              <Card className="bg-black/50 border-white/10">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (currentMonth === 1) {
                            setCurrentMonth(12);
                            setCurrentYear(currentYear - 1);
                          } else {
                            setCurrentMonth(currentMonth - 1);
                          }
                        }}
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </Button>
                      <div className="text-lg font-medium text-white">
                        {currentYear}年{currentMonth}月
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (currentMonth === 12) {
                            setCurrentMonth(1);
                            setCurrentYear(currentYear + 1);
                          } else {
                            setCurrentMonth(currentMonth + 1);
                          }
                        }}
                      >
                        <ChevronRight className="w-5 h-5" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={viewMode === "balance" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode("balance")}
                        className={viewMode === "balance" ? "bg-[#D4AF37] text-black" : ""}
                      >
                        余额
                      </Button>
                      <Button
                        variant={viewMode === "profit" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode("profit")}
                        className={viewMode === "profit" ? "bg-[#D4AF37] text-black" : ""}
                      >
                        盈亏
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* 星期标题 */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {weekDays.map((day) => (
                      <div key={day} className="text-center text-sm text-white/60 py-2">
                        {day}
                      </div>
                    ))}
                  </div>
                  
                  {/* 日历格子 */}
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day, index) => {
                      if (day === null) {
                        return <div key={`empty-${index}`} className="aspect-square" />;
                      }
                      
                      const balance = getBalanceForDate(day);
                      const profit = getProfitForDate(day);
                      const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      const isSelected = selectedDate === dateStr;
                      const isToday = new Date().toISOString().split('T')[0] === dateStr;
                      
                      return (
                        <div
                          key={day}
                          onClick={() => handleDateClick(day)}
                          className={`aspect-square p-1 rounded-lg border cursor-pointer transition-colors ${
                            isSelected
                              ? 'border-[#D4AF37] bg-[#D4AF37]/20'
                              : isToday
                              ? 'border-[#D4AF37]/50 bg-[#D4AF37]/10'
                              : balance
                              ? 'border-white/20 bg-white/5'
                              : 'border-white/10 hover:border-white/30'
                          }`}
                        >
                          <div className="text-xs text-white/60">{day}</div>
                          {viewMode === "balance" && balance && (
                            <div className="text-xs font-medium text-white truncate mt-1">
                              ¥{formatAmount(balance.balance)}
                            </div>
                          )}
                          {viewMode === "profit" && profit && (
                            <div className={`text-xs font-medium truncate mt-1 flex items-center gap-0.5 ${
                              profit.dailyProfit >= 0 ? 'text-red-500' : 'text-green-500'
                            }`}>
                              {profit.dailyProfit >= 0 ? (
                                <TrendingUp className="w-3 h-3" />
                              ) : (
                                <TrendingDown className="w-3 h-3" />
                              )}
                              {profit.dailyProfit >= 0 ? '+' : ''}{formatAmount(profit.dailyProfit)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
              
              {/* 余额编辑面板 */}
              {selectedDate && (
                <Card className="bg-black/50 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white">
                      <Calendar className="w-5 h-5 inline-block mr-2" />
                      {selectedDate} 余额记录
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>账户余额 (¥)</Label>
                        <Input
                          type="number"
                          value={balanceInput}
                          onChange={(e) => setBalanceInput(e.target.value)}
                          placeholder="请输入当日账户余额"
                          className="bg-black/50 border-white/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>备注（可选）</Label>
                        <Textarea
                          value={balanceNotes}
                          onChange={(e) => setBalanceNotes(e.target.value)}
                          placeholder="可选备注信息"
                          className="bg-black/50 border-white/20"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleSaveBalance}
                          className="bg-[#D4AF37] text-black hover:bg-[#E5C158]"
                          disabled={setBalanceMutation.isPending}
                        >
                          {setBalanceMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            "保存"
                          )}
                        </Button>
                        {getBalanceForDate(parseInt(selectedDate.split('-')[2])) && (
                          <Button
                            variant="destructive"
                            onClick={handleDeleteBalance}
                            disabled={deleteBalanceMutation.isPending}
                          >
                            {deleteBalanceMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              "删除记录"
                            )}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedDate(null);
                            setBalanceInput("");
                            setBalanceNotes("");
                          }}
                        >
                          取消
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
