import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Database, Sparkles, Calendar, Plus, Download, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

export default function CryptoHistory() {
  const [selectedCrypto, setSelectedCrypto] = useState<string>("BTC");
  const [fetchingTaskId, setFetchingTaskId] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }));
  
  // 计算理论数据量（基于1秒K线）
  const calculateDataCount = () => {
    const startTime = new Date("2017-08-17T12:00:00+08:00").getTime();
    const currentTimeMs = Date.now();
    const diffSeconds = Math.floor((currentTimeMs - startTime) / 1000);
    return diffSeconds; // 1秒K线 = 1条数据/秒
  };
  
  const [estimatedDataCount, setEstimatedDataCount] = useState<number>(calculateDataCount());
  
  // 计算数据包大小（基于秒线理论数据量）
  const calculateDataSize = (dataCount: number) => {
    const sizeInBytes = dataCount * 87; // 每条记录87字节
    const sizeInMB = sizeInBytes / (1024 * 1024);
    const sizeInGB = sizeInMB / 1024;
    if (sizeInGB >= 1) {
      return `${sizeInGB.toFixed(2)} GB`;
    } else {
      return `${sizeInMB.toFixed(2)} MB`;
    }
  };
  
  const [dataSize, setDataSize] = useState<string>(calculateDataSize(calculateDataCount()));

  // 实时更新时间和数据量（每秒）
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }));
      setEstimatedDataCount(calculateDataCount()); // 每秒更新数据量
    }, 1000); // 每秒更新

    return () => clearInterval(timer);
  }, []);
  
  // 更新数据包大小（每分钟）
  useEffect(() => {
    const timer = setInterval(() => {
      setDataSize(calculateDataSize(calculateDataCount()));
    }, 60000); // 每分钟更新

    return () => clearInterval(timer);
  }, []);

  // 查询抓取任务进度
  const { data: taskProgress, isLoading: isLoadingProgress } = trpc.klines.getTaskProgress.useQuery(
    { taskId: fetchingTaskId! },
    {
      enabled: fetchingTaskId !== null,
      refetchInterval: 2000, // 每2秒刷新一次
    }
  );

  // 查询所有抓取任务
  const { data: allTasks, refetch: refetchTasks } = trpc.klines.getAllTasks.useQuery();

  // 查询K线数据统计
  const { data: klineStats } = trpc.klines.getKlineStats.useQuery({
    symbol: `${selectedCrypto}USDT`,
    interval: "1m",
  });

  // 开始抓取数据
  const startFetchMutation = trpc.klines.startFetch.useMutation({
    onSuccess: (data) => {
      setFetchingTaskId(data.taskId);
      toast.success("数据抓取已开始", {
        description: `预计抓取 ${data.totalCount.toLocaleString()} 条数据`,
      });
      refetchTasks();
    },
    onError: (error) => {
      toast.error("启动数据抓取失败", {
        description: error.message,
      });
    },
  });

  const handleStartFetch = () => {
    // BTC/USDT 开始时间：2017年8月17日 12:00 (UTC+8)
    const startTime = new Date("2017-08-17T12:00:00+08:00").getTime();
    const endTime = Date.now();

    startFetchMutation.mutate({
      symbol: `${selectedCrypto}USDT`,
      interval: "1m",
      startTime,
      endTime,
    });
  };

  // 当任务完成时，停止轮询
  useEffect(() => {
    if (taskProgress && (taskProgress.status === "completed" || taskProgress.status === "failed")) {
      setTimeout(() => {
        setFetchingTaskId(null);
        refetchTasks();
      }, 3000);
    }
  }, [taskProgress, refetchTasks]);

  const cryptoInfo = {
    BTC: {
      name: "比特币",
      symbol: "BTC",
      description: "全球市值最大的加密货币，数字黄金",
    },
    ETH: {
      name: "以太坊",
      symbol: "ETH",
      description: "智能合约平台，Web3基础设施",
    },
    SOL: {
      name: "索拉纳",
      symbol: "SOL",
      description: "高性能区块链，低延迟高吞吐",
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background">
      {/* 导航栏 */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/quantitative-trading">
            <Button variant="ghost" size="icon" className="hover:bg-primary/10">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl md:text-2xl font-bold text-center flex-1">加密货币数据分析</h1>
          <div className="w-10" />
        </div>
      </header>

      {/* 主内容 */}
      <div className="relative overflow-hidden">
        {/* 装饰背景 */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-64 h-64 bg-primary rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary rounded-full blur-3xl"></div>
        </div>

        <div className="container relative z-10 py-8 md:py-16">
          {/* 标签页 */}
          <Tabs defaultValue="historical" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-auto p-1 mb-8">
              <TabsTrigger 
                value="historical" 
                className="flex flex-col items-center gap-2 py-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Database className="w-6 h-6" />
                <div className="text-center">
                  <div className="font-bold text-base">历史数据分析</div>
                  <div className="text-xs opacity-80 mt-1">Historical Data Analysis</div>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="prediction" 
                className="flex flex-col items-center gap-2 py-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Sparkles className="w-6 h-6" />
                <div className="text-center">
                  <div className="font-bold text-base">未来数据预测</div>
                  <div className="text-xs opacity-80 mt-1">Future Data Prediction</div>
                </div>
              </TabsTrigger>
            </TabsList>

            {/* 历史数据分析内容 */}
            <TabsContent value="historical" className="space-y-8">
              {/* 加密货币按钮选择 */}
              <Card className="border-primary/20 bg-card/50 backdrop-blur">
                <CardContent className="pt-6">
                  <div className="flex flex-wrap gap-3">
                    {/* 比特币按钮 */}
                    <Button
                      variant={selectedCrypto === "BTC" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCrypto("BTC")}
                      className={`flex items-center gap-1.5 h-auto py-1.5 px-2.5 text-xs ${
                        selectedCrypto === "BTC" 
                          ? "bg-orange-500 hover:bg-orange-600 text-white border-orange-500" 
                          : "border-orange-500/30 hover:bg-orange-500/10"
                      }`}
                    >
                      <img src="/crypto-logos/btc.png" alt="Bitcoin" className="w-4 h-4 rounded-full" />
                      <span className="font-medium">比特币</span>
                    </Button>

                    {/* 以太坊按钮 */}
                    <Button
                      variant={selectedCrypto === "ETH" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCrypto("ETH")}
                      className={`flex items-center gap-1.5 h-auto py-1.5 px-2.5 text-xs ${
                        selectedCrypto === "ETH" 
                          ? "bg-blue-500 hover:bg-blue-600 text-white border-blue-500" 
                          : "border-blue-500/30 hover:bg-blue-500/10"
                      }`}
                    >
                      <img src="/crypto-logos/eth.png" alt="Ethereum" className="w-4 h-4 rounded-full" />
                      <span className="font-medium">以太坊</span>
                    </Button>

                    {/* 索拉纳按钮 */}
                    <Button
                      variant={selectedCrypto === "SOL" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCrypto("SOL")}
                      className={`flex items-center gap-1.5 h-auto py-1.5 px-2.5 text-xs ${
                        selectedCrypto === "SOL" 
                          ? "bg-purple-500 hover:bg-purple-600 text-white border-purple-500" 
                          : "border-purple-500/30 hover:bg-purple-500/10"
                      }`}
                    >
                      <img src="/crypto-logos/sol.png" alt="Solana" className="w-4 h-4 rounded-full" />
                      <span className="font-medium">索拉纳</span>
                    </Button>

                    {/* 添加币种按钮 */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1.5 h-auto py-1.5 px-2.5 text-xs border-dashed border-muted-foreground/30 hover:bg-muted/50"
                      onClick={() => toast.info("添加币种功能开发中")}
                    >
                      <Plus className="w-4 h-4" />
                      <span className="font-medium">添加币种</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* 币种信息卡片 */}
              <Card className="border-primary/20 bg-card/50 backdrop-blur">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <img 
                      src={`/crypto-logos/${selectedCrypto.toLowerCase()}.png`} 
                      alt={cryptoInfo[selectedCrypto as keyof typeof cryptoInfo].name}
                      className="w-12 h-12 rounded-full"
                    />
                    <div>
                      <CardTitle className="text-2xl">
                        {cryptoInfo[selectedCrypto as keyof typeof cryptoInfo].name} ({cryptoInfo[selectedCrypto as keyof typeof cryptoInfo].symbol})
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {cryptoInfo[selectedCrypto as keyof typeof cryptoInfo].description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* 数据统计 */}
                  {klineStats && klineStats.totalCount > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                        <div className="text-sm text-muted-foreground mb-1">数据条数</div>
                        <div className="text-2xl font-bold text-primary">
                          {klineStats.totalCount.toLocaleString()}
                        </div>
                      </div>
                      <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                        <div className="text-sm text-muted-foreground mb-1">最早数据</div>
                        <div className="text-lg font-semibold">
                          {klineStats.earliestTime ? new Date(klineStats.earliestTime).toLocaleDateString("zh-CN") : "-"}
                        </div>
                      </div>
                      <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                        <div className="text-sm text-muted-foreground mb-1">最新数据</div>
                        <div className="text-lg font-semibold">
                          {klineStats.latestTime ? new Date(klineStats.latestTime).toLocaleDateString("zh-CN") : "-"}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 抓取进度卡片 */}
                  {taskProgress && (
                    <Card className="border-primary/30 bg-primary/5">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {taskProgress.status === "running" && <Loader2 className="w-5 h-5 animate-spin" />}
                          {taskProgress.status === "completed" && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                          {taskProgress.status === "failed" && <AlertCircle className="w-5 h-5 text-red-500" />}
                          数据抓取进度
                        </CardTitle>
                        <CardDescription>
                          {taskProgress.status === "running" && "正在从币安API抓取历史数据..."}
                          {taskProgress.status === "completed" && "数据抓取已完成！"}
                          {taskProgress.status === "failed" && "数据抓取失败"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">进度</span>
                            <span className="font-semibold">{taskProgress.progress.toFixed(2)}%</span>
                          </div>
                          <Progress value={taskProgress.progress} className="h-2" />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>已抓取: {taskProgress.fetchedCount.toLocaleString()} 条</span>
                            <span>总计: {taskProgress.totalCount.toLocaleString()} 条</span>
                          </div>
                        </div>

                        {taskProgress.status === "failed" && taskProgress.errorMessage && (
                          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                            错误信息: {taskProgress.errorMessage}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* 抓取按钮 */}
                  <div className="flex gap-3">
                    <Button
                      onClick={handleStartFetch}
                      disabled={startFetchMutation.isPending || (taskProgress?.status === "running")}
                      className="flex-1"
                    >
                      {startFetchMutation.isPending || taskProgress?.status === "running" ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          抓取中...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          获取完整历史数据 ({dataSize})
                        </>
                      )}
                    </Button>
                  </div>

                  {/* 说明文字 */}
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>• 数据时间范围：2017年8月17日 12:00:00 至 {currentTime}</p>
                    <p>• 数据粒度：1分钟K线</p>
                    <p>• 数据来源：币安（Binance）交易所</p>
                    <p>• 数据库K线数据更新：{estimatedDataCount.toLocaleString()} 条</p>
                    <p>• 数据包大小：{dataSize}</p>
                    <p className="text-yellow-600 dark:text-yellow-500">⚠️ 高频数据抓取API响应约100-300ms，可能会存在网络延迟</p>
                  </div>
                </CardContent>
              </Card>

              {/* 历史任务列表 */}
              {allTasks && allTasks.length > 0 && (
                <Card className="border-primary/20 bg-card/50 backdrop-blur">
                  <CardHeader>
                    <CardTitle>历史抓取任务</CardTitle>
                    <CardDescription>查看所有数据抓取任务的历史记录</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {allTasks.slice(0, 5).map((task) => (
                        <div 
                          key={task.taskId}
                          className="p-4 rounded-lg border border-border bg-card/50 hover:bg-card/80 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{task.symbol}</span>
                              <span className="text-xs text-muted-foreground">({task.interval})</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {task.status === "completed" && (
                                <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
                                  已完成
                                </span>
                              )}
                              {task.status === "running" && (
                                <span className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center gap-1">
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  进行中
                                </span>
                              )}
                              {task.status === "failed" && (
                                <span className="text-xs px-2 py-1 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
                                  失败
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {task.fetchedCount.toLocaleString()} / {task.totalCount.toLocaleString()} 条 ({task.progress.toFixed(1)}%)
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {new Date(task.createdAt).toLocaleString("zh-CN")}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 数据来源标识 */}
              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors">
                <span>数据来源：</span>
                <div className="flex items-center gap-2">
                  <img src="https://bin.bnbstatic.com/static/images/common/favicon.ico" alt="Binance" className="w-3 h-3 opacity-60" />
                  <span>Binance</span>
                </div>
                <span>·</span>
                <div className="flex items-center gap-2">
                  <img src="https://static.okx.com/cdn/assets/imgs/MjAyMQ/okx-favicon.ico" alt="OKX" className="w-3 h-3 opacity-60" />
                  <span>OKX</span>
                </div>
              </div>
            </TabsContent>

            {/* 未来数据预测内容 */}
            <TabsContent value="prediction" className="space-y-8">
              <Card className="border-primary/20 bg-card/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-2xl">AI 数据预测</CardTitle>
                  <CardDescription>
                    使用先进的AI模型预测加密货币未来价格走势
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">
                    <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">AI预测功能开发中...</p>
                    <p className="text-sm mt-2">敬请期待</p>
                  </div>
                </CardContent>
              </Card>

              {/* 数据来源标识 */}
              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors">
                <span>AI模型：</span>
                <span>GPT-4</span>
                <span>·</span>
                <span>Gemini</span>
                <span>·</span>
                <span>DeepSeek</span>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
