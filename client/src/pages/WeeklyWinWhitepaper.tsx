import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, TrendingUp, Users, AlertCircle, CheckCircle, FileText, Lock, BarChart3 } from "lucide-react";
import { Link } from "wouter";

export default function WeeklyWinWhitepaper() {
  return (
    <div className="min-h-screen bg-background">
      {/* 返回按钮 */}
      <div className="container mx-auto py-6">
        <Link href="/weekly-win">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            返回周周赢
          </Button>
        </Link>
      </div>

      {/* 标题区域 */}
      <section className="container mx-auto px-4 py-12">
        <div className="text-center space-y-4 mb-12">
          <Badge className="bg-red-500/20 text-red-600 border-red-500/30 text-lg px-4 py-1">必看</Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">周周赢产品白皮书</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            深入了解周周赢的运作机制、风险控制和收益模式
          </p>
          <div className="flex justify-center gap-3 flex-wrap">
            <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30">官方文档</Badge>
            <Badge className="bg-green-500/20 text-green-600 border-green-500/30">2026年2月版</Badge>
          </div>
        </div>

        {/* 目录 */}
        <Card className="mb-12 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              目录
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a href="#section-1" className="text-primary hover:underline">1. 产品概述</a>
              <a href="#section-2" className="text-primary hover:underline">2. 核心机制</a>
              <a href="#section-3" className="text-primary hover:underline">3. 资金安全保障</a>
              <a href="#section-4" className="text-primary hover:underline">4. 收益分配模式</a>
              <a href="#section-5" className="text-primary hover:underline">5. 风险管理体系</a>
              <a href="#section-6" className="text-primary hover:underline">6. 交易策略说明</a>
              <a href="#section-7" className="text-primary hover:underline">7. 提现流程</a>
              <a href="#section-8" className="text-primary hover:underline">8. 常见问题解答</a>
            </div>
          </CardContent>
        </Card>

        {/* 第1部分：产品概述 */}
        <section id="section-1" className="mb-12 scroll-mt-20">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
            <span className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">1</span>
            产品概述
          </h2>
          <Card>
            <CardContent className="pt-6 space-y-4">
              <p className="text-lg leading-relaxed">
                周周赢是数金研投推出的数字货币托管交易产品，专为追求稳健收益的投资者设计。通过专业团队的全权委托交易，
                投资者可以在保持资金安全的前提下，获得稳定的周收益。
              </p>
              <div className="bg-blue-500/10 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-700 mb-2">产品特色</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>80%资金在您的交易账户，完全由您控制</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>20%公司保证金作为风险缓冲</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>每周平均1%收益，年化收益12-18%</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>专业团队托管，无需盯盘</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 第2部分：核心机制 */}
        <section id="section-2" className="mb-12 scroll-mt-20">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
            <span className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">2</span>
            核心机制
          </h2>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  资金配置结构
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-yellow-500/10 border border-yellow-200 rounded-lg p-4">
                    <h3 className="font-semibold text-yellow-700 mb-2">80% 客户交易账户</h3>
                    <p className="text-sm text-muted-foreground">
                      您投入资金的80%存放在您自己的交易账户中，完全由您控制，安全可靠。
                      账户密码和资金控制权始终在您手中。
                    </p>
                    <p className="text-xs text-yellow-600 mt-2">
                      示例：投入10,000 USDT → 8,000 USDT在您的账户
                    </p>
                  </div>
                  <div className="bg-blue-500/10 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-700 mb-2">20% 公司保证金</h3>
                    <p className="text-sm text-muted-foreground">
                      投入资金的20%作为保证金存放在公司账户，用于风险管理和账户保护。
                      这部分资金作为风险缓冲，保护您的投资安全。
                    </p>
                    <p className="text-xs text-blue-600 mt-2">
                      示例：投入10,000 USDT → 2,000 USDT在公司账户
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  托管交易流程
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold flex-shrink-0">1</div>
                    <div>
                      <h3 className="font-semibold mb-1">账户授权</h3>
                      <p className="text-sm text-muted-foreground">
                        您将交易账户的API权限授权给数金研投团队（仅交易权限，不包括提现权限）
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold flex-shrink-0">2</div>
                    <div>
                      <h3 className="font-semibold mb-1">专业交易</h3>
                      <p className="text-sm text-muted-foreground">
                        专业团队使用成熟的交易策略进行数字货币交易，追求稳健收益
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold flex-shrink-0">3</div>
                    <div>
                      <h3 className="font-semibold mb-1">利润归属</h3>
                      <p className="text-sm text-muted-foreground">
                        所有交易产生的利润完全属于您，公司不收取任何交易手续费
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold flex-shrink-0">4</div>
                    <div>
                      <h3 className="font-semibold mb-1">周收益提现</h3>
                      <p className="text-sm text-muted-foreground">
                        每周您可以从利润中提现，剩余利润继续在账户中增长
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 第3部分：资金安全保障 */}
        <section id="section-3" className="mb-12 scroll-mt-20">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
            <span className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">3</span>
            资金安全保障
          </h2>
          <Card className="border-green-500/20">
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold">账户独立性</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    您的交易账户完全独立，与公司资金完全隔离。即使公司出现任何问题，
                    您的资金也不会受到影响。
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Lock className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold">提现权限控制</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    公司只获得交易权限，不包括提现权限。您的资金提现完全由您自己控制，
                    任何时候都可以提现。
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold">保证金保护</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    20%的保证金作为风险缓冲，在极端市场情况下保护您的本金安全。
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold">定期审计</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    所有账户定期接受第三方审计，确保资金管理的透明性和合规性。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 第4部分：收益分配模式 */}
        <section id="section-4" className="mb-12 scroll-mt-20">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
            <span className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">4</span>
            收益分配模式
          </h2>
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="bg-yellow-500/10 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-700 mb-2">每周平均1%收益</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  根据历史数据统计，周周赢产品每周平均可以产生约1%的利润（相对于本金）。
                  这个收益率是基于过去的交易表现计算得出的平均值。
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>投资本金：</span>
                    <span className="font-semibold">10,000 USDT</span>
                  </div>
                  <div className="flex justify-between">
                    <span>周均利润：</span>
                    <span className="font-semibold text-green-600">~100 USDT (1%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>可提现金额：</span>
                    <span className="font-semibold text-blue-600">~1 USDT (利润的1%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>继续增长：</span>
                    <span className="font-semibold">~99 USDT (利润的99%)</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-700 mb-2">复利增长效应</h3>
                <p className="text-sm text-muted-foreground">
                  保留在账户中的99%利润会与本金一起继续交易，实现复利增长。
                  随着时间推移，您的账户资金会不断增长，收益也会相应增加。
                </p>
              </div>

              <div className="bg-red-500/10 border border-red-200 rounded-lg p-4">
                <div className="flex gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-muted-foreground">
                    <p className="font-semibold text-red-600 mb-1">重要说明：</p>
                    <p>
                      "每周平均1%收益"是基于历史平均表现的统计数据，不代表每周都能达到1%。
                      实际收益会受市场行情影响，可能高于或低于这个平均值。
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 第5部分：风险管理体系 */}
        <section id="section-5" className="mb-12 scroll-mt-20">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
            <span className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">5</span>
            风险管理体系
          </h2>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>多层次风险控制</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-red-500/10 rounded-full flex items-center justify-center text-red-600 font-bold flex-shrink-0 mt-0.5">1</div>
                    <div>
                      <h3 className="font-semibold mb-1">严格止损机制</h3>
                      <p className="text-sm text-muted-foreground">
                        每笔交易都设置严格的止损点，限制单笔损失不超过总资金的2%
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-red-500/10 rounded-full flex items-center justify-center text-red-600 font-bold flex-shrink-0 mt-0.5">2</div>
                    <div>
                      <h3 className="font-semibold mb-1">多策略组合</h3>
                      <p className="text-sm text-muted-foreground">
                        采用多种交易策略组合，分散交易风险，避免单一策略失效
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-red-500/10 rounded-full flex items-center justify-center text-red-600 font-bold flex-shrink-0 mt-0.5">3</div>
                    <div>
                      <h3 className="font-semibold mb-1">实时监控</h3>
                      <p className="text-sm text-muted-foreground">
                        24小时实时监控市场变化和账户状态，及时应对异常情况
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-red-500/10 rounded-full flex items-center justify-center text-red-600 font-bold flex-shrink-0 mt-0.5">4</div>
                    <div>
                      <h3 className="font-semibold mb-1">保证金保护</h3>
                      <p className="text-sm text-muted-foreground">
                        20%保证金作为最后一道防线，在极端情况下保护客户本金
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-5 h-5" />
                  风险提示
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>• 数字货币市场波动性大，投资存在风险，过往收益不代表未来表现</p>
                <p>• 周周赢产品属于中等风险投资，请根据自身风险承受能力谨慎投资</p>
                <p>• 虽然有20%保证金保护，但在极端市场情况下仍可能面临亏损</p>
                <p>• 投资前请充分了解产品细节，如有疑问请咨询我们的投资顾问</p>
                <p>• 本产品不保证本金安全，投资需谨慎</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 第6部分：交易策略说明 */}
        <section id="section-6" className="mb-12 scroll-mt-20">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
            <span className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">6</span>
            交易策略说明
          </h2>
          <Card>
            <CardContent className="pt-6 space-y-4">
              <p className="text-lg leading-relaxed">
                数金研投团队采用多种成熟的交易策略，包括但不限于：
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">网格交易策略</h3>
                  <p className="text-sm text-muted-foreground">
                    在价格波动区间内设置多个买卖网格，通过高抛低吸获取价差收益
                  </p>
                </div>
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">趋势跟踪策略</h3>
                  <p className="text-sm text-muted-foreground">
                    识别市场趋势，顺势而为，在上涨趋势中持有，在下跌趋势中规避
                  </p>
                </div>
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">套利策略</h3>
                  <p className="text-sm text-muted-foreground">
                    利用不同交易所或不同交易对之间的价差进行套利交易
                  </p>
                </div>
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">量化策略</h3>
                  <p className="text-sm text-muted-foreground">
                    基于大数据分析和算法模型，自动执行交易决策
                  </p>
                </div>
              </div>
              <div className="bg-yellow-500/10 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-yellow-700">策略保密：</strong>
                  具体的交易策略参数和算法属于公司核心机密，不对外公开。
                  但我们保证所有策略都经过长期回测和实盘验证，具有稳定的盈利能力。
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 第7部分：提现流程 */}
        <section id="section-7" className="mb-12 scroll-mt-20">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
            <span className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">7</span>
            提现流程
          </h2>
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-green-500/10 rounded-full flex items-center justify-center text-green-600 font-bold flex-shrink-0">1</div>
                  <div>
                    <h3 className="font-semibold mb-1">查看可提现金额</h3>
                    <p className="text-sm text-muted-foreground">
                      每周结算后，系统会自动计算您可以提现的金额（约为利润的1%）
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-green-500/10 rounded-full flex items-center justify-center text-green-600 font-bold flex-shrink-0">2</div>
                  <div>
                    <h3 className="font-semibold mb-1">提交提现申请</h3>
                    <p className="text-sm text-muted-foreground">
                      登录您的交易账户，提交提现申请（由于您拥有完全的提现权限，可以随时提现）
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-green-500/10 rounded-full flex items-center justify-center text-green-600 font-bold flex-shrink-0">3</div>
                  <div>
                    <h3 className="font-semibold mb-1">资金到账</h3>
                    <p className="text-sm text-muted-foreground">
                      提现申请提交后，通常在1-24小时内到账（具体时间取决于交易所处理速度）
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-blue-500/10 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-blue-700">提现自由：</strong>
                  虽然我们建议每周提现约1%的利润以实现复利增长，但您拥有完全的提现权限，
                  可以根据自己的需要随时提现任意金额（包括本金）。
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 第8部分：常见问题解答 */}
        <section id="section-8" className="mb-12 scroll-mt-20">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
            <span className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">8</span>
            常见问题解答
          </h2>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Q1: 我的资金真的安全吗？</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  A: 是的。80%的资金在您自己的交易账户中，完全由您控制。公司只有交易权限，
                  没有提现权限。即使公司出现任何问题，您的资金也不会受到影响。
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Q2: 每周真的能达到1%的收益吗？</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  A: "每周平均1%收益"是基于历史数据的统计平均值。实际收益会受市场行情影响，
                  有些周可能高于1%，有些周可能低于1%，甚至可能出现亏损。但从长期来看，
                  平均收益率在这个水平。
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Q3: 我可以随时提现吗？</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  A: 可以。您拥有完全的提现权限，可以随时提现任意金额（包括本金）。
                  虽然我们建议每周提现约1%的利润以实现复利增长，但最终决定权在您手中。
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Q4: 如果市场大跌怎么办？</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  A: 我们有严格的风险管理体系，包括止损机制、多策略组合和实时监控。
                  20%的保证金也会作为风险缓冲。但在极端市场情况下，仍可能面临亏损。
                  这是所有投资都需要面对的风险。
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Q5: 最低投资金额是多少？</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  A: 最低投资金额为1,000 USDT。我们建议投资者根据自身风险承受能力选择合适的投资金额。
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Q6: 公司如何盈利？</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  A: 公司通过20%保证金账户的交易收益来盈利。我们不收取任何交易手续费或管理费，
                  您账户中的所有利润完全属于您。
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 底部行动召唤 */}
        <section className="text-center py-12 space-y-6">
          <h2 className="text-3xl font-bold">准备开始投资？</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            如果您已经充分了解周周赢产品，欢迎加入我们，开始您的稳健投资之旅
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/weekly-win">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                返回产品页面
              </Button>
            </Link>
            <Button size="lg" variant="outline">
              联系投资顾问
            </Button>
          </div>
        </section>
      </section>
    </div>
  );
}
