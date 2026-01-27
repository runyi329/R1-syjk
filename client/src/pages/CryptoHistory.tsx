import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Database, Sparkles, TrendingUp, Calendar } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

export default function CryptoHistory() {
  const [selectedCrypto, setSelectedCrypto] = useState<string>("BTC");

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
              {/* 加密货币选择 */}
              <Card className="border-primary/20 bg-card/50 backdrop-blur">
                <CardContent className="space-y-6 pt-6">
                  <div className="space-y-2">
                    <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
                      <SelectTrigger id="crypto-select" className="h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BTC">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-orange-500/10 rounded-full flex items-center justify-center">
                              <span className="text-orange-500 font-bold text-sm">₿</span>
                            </div>
                            <div>
                              <div className="font-semibold">比特币 (Bitcoin)</div>
                              <div className="text-xs text-muted-foreground">BTC</div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="ETH">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center">
                              <span className="text-blue-500 font-bold text-sm">Ξ</span>
                            </div>
                            <div>
                              <div className="font-semibold">以太坊 (Ethereum)</div>
                              <div className="text-xs text-muted-foreground">ETH</div>
                            </div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 币种信息 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    {selectedCrypto === "BTC" && (
                      <>
                        <Card className="border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-orange-500/5">
                          <CardHeader className="pb-3">
                            <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center mb-2">
                              <span className="text-orange-500 font-bold text-xl">₿</span>
                            </div>
                            <CardTitle className="text-base">比特币 (BTC)</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">当前价格</span>
                              <span className="font-semibold">~$88,500</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">市值排名</span>
                              <span className="font-semibold">#1</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">数据可用性</span>
                              <span className="font-semibold text-green-500">2017 至今</span>
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="border-border/50">
                          <CardHeader className="pb-3">
                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-2">
                              <Calendar className="w-6 h-6 text-primary" />
                            </div>
                            <CardTitle className="text-base">数据说明</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2 text-sm text-muted-foreground">
                            <p>• 提供开盘、收盘、最高、最低价格</p>
                            <p>• 支持多种时间粒度（1分钟-1月）</p>
                            <p>• 包含交易量和市值数据</p>
                          </CardContent>
                        </Card>
                      </>
                    )}
                    {selectedCrypto === "ETH" && (
                      <>
                        <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-blue-500/5">
                          <CardHeader className="pb-3">
                            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-2">
                              <span className="text-blue-500 font-bold text-xl">Ξ</span>
                            </div>
                            <CardTitle className="text-base">以太坊 (ETH)</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">当前价格</span>
                              <span className="font-semibold">~$2,950</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">市值排名</span>
                              <span className="font-semibold">#2</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">数据可用性</span>
                              <span className="font-semibold text-green-500">2017 至今</span>
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="border-border/50">
                          <CardHeader className="pb-3">
                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-2">
                              <Calendar className="w-6 h-6 text-primary" />
                            </div>
                            <CardTitle className="text-base">数据说明</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2 text-sm text-muted-foreground">
                            <p>• 提供开盘、收盘、最高、最低价格</p>
                            <p>• 支持多种时间粒度（1分钟-1月）</p>
                            <p>• 包含交易量和市值数据</p>
                          </CardContent>
                        </Card>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* 功能预告 */}
              <Card className="border-yellow-500/20 bg-yellow-500/5">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-yellow-500" />
                    即将推出
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>• 自定义时间范围选择（开始日期 - 结束日期）</p>
                  <p>• 多种数据粒度（1分钟、5分钟、15分钟、1小时、1天、1周、1月）</p>
                  <p>• 数据可视化图表（K线图、折线图）</p>
                  <p>• 数据导出功能（CSV、Excel）</p>
                  <p>• 技术指标计算（MA、EMA、RSI、MACD等）</p>
                </CardContent>
              </Card>

              {/* 数据来源 - 底部简洁展示 */}
              <div className="flex items-center justify-center gap-6 py-4 border-t border-border/30">
                <span className="text-xs text-muted-foreground">数据来源：</span>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
                    <div className="w-6 h-6 bg-white rounded flex items-center justify-center p-0.5">
                      <img 
                        src="https://www.okx.com/cdn/assets/imgs/2211/7478C5D7B9D0EF7C.png" 
                        alt="OKX" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="text-xs font-medium">OKX</span>
                  </div>
                  <div className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
                    <div className="w-6 h-6 bg-white rounded flex items-center justify-center p-0.5">
                      <img 
                        src="https://public.bnbstatic.com/static/images/common/logo.png" 
                        alt="Binance" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="text-xs font-medium">Binance</span>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* 未来数据预测内容 */}
            <TabsContent value="prediction" className="space-y-8">
              {/* 预测功能说明 */}
              <Card className="border-primary/20 bg-card/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    AI预测功能
                  </CardTitle>
                  <CardDescription>
                    基于多个AI模型的综合预测，为您的投资决策提供参考
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="border-border/50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">短期价格预测</CardTitle>
                      </CardHeader>
                      <CardContent className="text-xs text-muted-foreground">
                        基于技术指标和市场情绪，预测未来1-7天的价格走势
                      </CardContent>
                    </Card>
                    <Card className="border-border/50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">趋势分析</CardTitle>
                      </CardHeader>
                      <CardContent className="text-xs text-muted-foreground">
                        识别当前市场趋势（上涨、下跌、震荡），提供支撑阻力位
                      </CardContent>
                    </Card>
                    <Card className="border-border/50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">市场情绪分析</CardTitle>
                      </CardHeader>
                      <CardContent className="text-xs text-muted-foreground">
                        分析社交媒体和新闻数据，评估市场整体情绪（乐观/悲观）
                      </CardContent>
                    </Card>
                    <Card className="border-border/50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">风险评估</CardTitle>
                      </CardHeader>
                      <CardContent className="text-xs text-muted-foreground">
                        评估当前投资风险等级，提供风险控制建议
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>

              {/* 功能开发中 */}
              <Card className="border-yellow-500/20 bg-yellow-500/5">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-yellow-500" />
                    功能开发中
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>• AI驱动的价格预测模型正在训练中</p>
                  <p>• 市场情绪分析系统开发中</p>
                  <p>• 多模型集成预测算法优化中</p>
                  <p>• 预计将在未来几周内上线</p>
                </CardContent>
              </Card>

              {/* AI模型来源 - 底部简洁展示 */}
              <div className="flex items-center justify-center gap-6 py-4 border-t border-border/30">
                <span className="text-xs text-muted-foreground">AI模型：</span>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
                    <div className="w-6 h-6 bg-white rounded flex items-center justify-center p-0.5">
                      <img 
                        src="https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg" 
                        alt="ChatGPT" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="text-xs font-medium">GPT-4</span>
                  </div>
                  <div className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
                    <div className="w-6 h-6 bg-white rounded flex items-center justify-center p-0.5">
                      <img 
                        src="https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg" 
                        alt="Gemini" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="text-xs font-medium">Gemini</span>
                  </div>
                  <div className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
                    <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-500 rounded flex items-center justify-center">
                      <span className="text-white font-bold text-[10px]">DS</span>
                    </div>
                    <span className="text-xs font-medium">DeepSeek</span>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
