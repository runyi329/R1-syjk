import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Home } from "lucide-react";
import { Link } from "wouter";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function AStockPresentation() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 10;

  // 键盘导航
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        nextSlide();
      } else if (e.key === "ArrowLeft") {
        prevSlide();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentSlide]);

  const nextSlide = () => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  // 市场数据
  const marketPerformance = [
    { month: "1月", index: 3200, volume: 4500 },
    { month: "2月", index: 3350, volume: 4800 },
    { month: "3月", index: 3280, volume: 4600 },
    { month: "4月", index: 3450, volume: 5200 },
    { month: "5月", index: 3520, volume: 5400 },
    { month: "6月", index: 3680, volume: 5800 },
    { month: "7月", index: 3750, volume: 6000 },
    { month: "8月", index: 3820, volume: 6200 },
    { month: "9月", index: 3900, volume: 6500 },
    { month: "10月", index: 4050, volume: 6800 },
    { month: "11月", index: 4180, volume: 7000 },
    { month: "12月", index: 4250, volume: 7200 }
  ];

  const sectorPerformance = [
    { name: "科技", value: 28, color: "#f59e0b" },
    { name: "消费", value: 22, color: "#3b82f6" },
    { name: "金融", value: 18, color: "#10b981" },
    { name: "医药", value: 15, color: "#8b5cf6" },
    { name: "新能源", value: 17, color: "#ef4444" }
  ];

  const industryGrowth = [
    { industry: "人工智能", growth: 45 },
    { industry: "芯片半导体", growth: 38 },
    { industry: "新能源汽车", growth: 32 },
    { industry: "消费电子", growth: 28 },
    { industry: "生物医药", growth: 25 }
  ];

  const slides = [
    // 第1页：封面
    <div key={0} className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white p-8">
      <h1 className="text-5xl md:text-7xl font-bold mb-6 text-center">2026年A股市场分析报告</h1>
      <p className="text-xl md:text-2xl text-blue-200 mb-8">数金研投 · 投资研究部</p>
      <p className="text-lg text-blue-300">2026年2月17日</p>
    </div>,

    // 第2页：市场概览
    <div key={1} className="p-8 md:p-12 h-full overflow-auto">
      <h2 className="text-4xl font-bold mb-8 text-blue-600">市场概览</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg">
          <p className="text-sm opacity-90 mb-2">上证指数</p>
          <p className="text-4xl font-bold">4,250</p>
          <p className="text-sm mt-2 text-green-200">+32.8% YoY</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg shadow-lg">
          <p className="text-sm opacity-90 mb-2">日均成交额</p>
          <p className="text-4xl font-bold">7,200亿</p>
          <p className="text-sm mt-2 text-green-200">+28.5% YoY</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow-lg">
          <p className="text-sm opacity-90 mb-2">新增开户数</p>
          <p className="text-4xl font-bold">1,850万</p>
          <p className="text-sm mt-2 text-green-200">+42.3% YoY</p>
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-2xl font-bold mb-4 text-gray-800">2026年上证指数走势</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={marketPerformance}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="index" stroke="#3b82f6" strokeWidth={3} name="上证指数" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>,

    // 第3页：宏观经济环境
    <div key={2} className="p-8 md:p-12 h-full overflow-auto">
      <h2 className="text-4xl font-bold mb-8 text-blue-600">宏观经济环境</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-2xl font-bold mb-4 text-gray-800">经济增长</h3>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>GDP增速预计5.2%，超市场预期</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>制造业PMI连续8个月位于扩张区间</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>消费复苏强劲，社零总额增长8.5%</span>
            </li>
          </ul>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-2xl font-bold mb-4 text-gray-800">政策支持</h3>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>降准降息政策持续宽松</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>科技创新专项扶持资金增加</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>资本市场改革深化，注册制全面推行</span>
            </li>
          </ul>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg md:col-span-2">
          <h3 className="text-2xl font-bold mb-4 text-gray-800">关键数据</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">5.2%</p>
              <p className="text-sm text-gray-600 mt-1">GDP增速</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">2.1%</p>
              <p className="text-sm text-gray-600 mt-1">CPI涨幅</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">51.8</p>
              <p className="text-sm text-gray-600 mt-1">制造业PMI</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-600">8.5%</p>
              <p className="text-sm text-gray-600 mt-1">社零增速</p>
            </div>
          </div>
        </div>
      </div>
    </div>,

    // 第4页：行业板块分析
    <div key={3} className="p-8 md:p-12 h-full overflow-auto">
      <h2 className="text-4xl font-bold mb-8 text-blue-600">行业板块分析</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-2xl font-bold mb-4 text-gray-800">板块市值占比</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={sectorPerformance}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name} ${value}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {sectorPerformance.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-2xl font-bold mb-4 text-gray-800">重点行业增速</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={industryGrowth} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" stroke="#6b7280" />
              <YAxis dataKey="industry" type="category" stroke="#6b7280" width={100} />
              <Tooltip />
              <Bar dataKey="growth" fill="#3b82f6" name="增速 (%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>,

    // 第5页：科技板块
    <div key={4} className="p-8 md:p-12 h-full overflow-auto">
      <h2 className="text-4xl font-bold mb-8 text-orange-600">科技板块：AI引领新浪潮</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-lg shadow-lg">
          <p className="text-sm opacity-90 mb-2">板块涨幅</p>
          <p className="text-4xl font-bold">+45%</p>
        </div>
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white p-6 rounded-lg shadow-lg">
          <p className="text-sm opacity-90 mb-2">AI芯片</p>
          <p className="text-4xl font-bold">+52%</p>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-6 rounded-lg shadow-lg">
          <p className="text-sm opacity-90 mb-2">云计算</p>
          <p className="text-4xl font-bold">+38%</p>
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-2xl font-bold mb-4 text-gray-800">核心驱动因素</h3>
        <div className="space-y-4">
          <div className="border-l-4 border-orange-500 pl-4">
            <h4 className="font-bold text-lg text-gray-800 mb-2">人工智能大模型爆发</h4>
            <p className="text-gray-600">国产大模型技术突破，应用场景快速落地，相关上市公司业绩大幅增长</p>
          </div>
          <div className="border-l-4 border-yellow-500 pl-4">
            <h4 className="font-bold text-lg text-gray-800 mb-2">芯片国产化加速</h4>
            <p className="text-gray-600">政策扶持力度加大，芯片自主可控进程提速，半导体设备和材料需求旺盛</p>
          </div>
          <div className="border-l-4 border-red-500 pl-4">
            <h4 className="font-bold text-lg text-gray-800 mb-2">新能源技术创新</h4>
            <p className="text-gray-600">储能技术、固态电池等领域取得重大突破，产业链投资机会涌现</p>
          </div>
        </div>
      </div>
    </div>,

    // 第6页：消费板块
    <div key={5} className="p-8 md:p-12 h-full overflow-auto">
      <h2 className="text-4xl font-bold mb-8 text-blue-600">消费板块：内需复苏强劲</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-2xl font-bold mb-4 text-gray-800">消费升级趋势</h3>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start">
              <span className="text-green-500 mr-2 text-xl">✓</span>
              <div>
                <p className="font-bold">高端消费增长</p>
                <p className="text-sm text-gray-600">奢侈品、高端餐饮增速超30%</p>
              </div>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2 text-xl">✓</span>
              <div>
                <p className="font-bold">健康消费爆发</p>
                <p className="text-sm text-gray-600">保健品、运动健身市场规模翻倍</p>
              </div>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2 text-xl">✓</span>
              <div>
                <p className="font-bold">智能家居普及</p>
                <p className="text-sm text-gray-600">智能家电渗透率突破50%</p>
              </div>
            </li>
          </ul>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-2xl font-bold mb-4 text-gray-800">重点细分领域</h3>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="font-bold text-blue-800">新零售</p>
              <p className="text-sm text-gray-600 mt-1">线上线下融合加速，直播电商持续高增长</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="font-bold text-green-800">餐饮连锁</p>
              <p className="text-sm text-gray-600 mt-1">标准化、品牌化趋势明显，龙头企业扩张提速</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="font-bold text-purple-800">美妆个护</p>
              <p className="text-sm text-gray-600 mt-1">国货品牌崛起，市场份额持续提升</p>
            </div>
          </div>
        </div>
      </div>
    </div>,

    // 第7页：金融板块
    <div key={6} className="p-8 md:p-12 h-full overflow-auto">
      <h2 className="text-4xl font-bold mb-8 text-green-600">金融板块：稳健增长</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg shadow-lg">
          <p className="text-sm opacity-90 mb-2">银行板块</p>
          <p className="text-4xl font-bold">+18%</p>
          <p className="text-sm mt-2">资产质量改善</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg">
          <p className="text-sm opacity-90 mb-2">保险板块</p>
          <p className="text-4xl font-bold">+22%</p>
          <p className="text-sm mt-2">保费收入增长</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow-lg">
          <p className="text-sm opacity-90 mb-2">证券板块</p>
          <p className="text-4xl font-bold">+35%</p>
          <p className="text-sm mt-2">交易量大增</p>
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-2xl font-bold mb-4 text-gray-800">投资亮点</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border-l-4 border-green-500 pl-4">
            <h4 className="font-bold text-lg text-gray-800 mb-2">银行：息差企稳回升</h4>
            <p className="text-gray-600">净息差见底回升，不良率持续下降，大行估值修复空间大</p>
          </div>
          <div className="border-l-4 border-blue-500 pl-4">
            <h4 className="font-bold text-lg text-gray-800 mb-2">保险：新业务价值增长</h4>
            <p className="text-gray-600">代理人队伍优化，产品结构改善，投资收益率提升</p>
          </div>
          <div className="border-l-4 border-purple-500 pl-4">
            <h4 className="font-bold text-lg text-gray-800 mb-2">证券：业绩弹性大</h4>
            <p className="text-gray-600">市场活跃度提升，经纪、投行业务收入大幅增长</p>
          </div>
          <div className="border-l-4 border-orange-500 pl-4">
            <h4 className="font-bold text-lg text-gray-800 mb-2">金融科技：数字化转型</h4>
            <p className="text-gray-600">AI赋能金融服务，提升运营效率和客户体验</p>
          </div>
        </div>
      </div>
    </div>,

    // 第8页：风险与机遇
    <div key={7} className="p-8 md:p-12 h-full overflow-auto">
      <h2 className="text-4xl font-bold mb-8 text-red-600">风险与机遇</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-lg border-t-4 border-red-500">
          <h3 className="text-2xl font-bold mb-4 text-red-600">主要风险点</h3>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start">
              <span className="text-red-500 mr-2 text-xl">⚠</span>
              <div>
                <p className="font-bold">地缘政治风险</p>
                <p className="text-sm text-gray-600">国际关系不确定性可能影响出口和供应链</p>
              </div>
            </li>
            <li className="flex items-start">
              <span className="text-red-500 mr-2 text-xl">⚠</span>
              <div>
                <p className="font-bold">房地产调整</p>
                <p className="text-sm text-gray-600">部分城市房价下行压力仍存，关注政策调控</p>
              </div>
            </li>
            <li className="flex items-start">
              <span className="text-red-500 mr-2 text-xl">⚠</span>
              <div>
                <p className="font-bold">估值波动风险</p>
                <p className="text-sm text-gray-600">部分热门板块估值偏高，需警惕回调风险</p>
              </div>
            </li>
          </ul>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg border-t-4 border-green-500">
          <h3 className="text-2xl font-bold mb-4 text-green-600">投资机遇</h3>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start">
              <span className="text-green-500 mr-2 text-xl">✓</span>
              <div>
                <p className="font-bold">政策红利释放</p>
                <p className="text-sm text-gray-600">科技创新、消费升级等领域政策支持力度大</p>
              </div>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2 text-xl">✓</span>
              <div>
                <p className="font-bold">估值洼地修复</p>
                <p className="text-sm text-gray-600">金融、地产等低估值板块存在修复机会</p>
              </div>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2 text-xl">✓</span>
              <div>
                <p className="font-bold">外资持续流入</p>
                <p className="text-sm text-gray-600">A股纳入国际指数比例提升，外资配置需求增加</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>,

    // 第9页：投资策略建议
    <div key={8} className="p-8 md:p-12 h-full overflow-auto">
      <h2 className="text-4xl font-bold mb-8 text-purple-600">2026年投资策略建议</h2>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow-lg">
          <h3 className="text-2xl font-bold mb-3">核心配置思路</h3>
          <p className="text-lg">均衡配置 + 结构优化 + 把握主题机会</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h4 className="text-xl font-bold mb-3 text-orange-600">进攻型（40%）</h4>
            <ul className="space-y-2 text-gray-700">
              <li>• 人工智能 15%</li>
              <li>• 芯片半导体 12%</li>
              <li>• 新能源 13%</li>
            </ul>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h4 className="text-xl font-bold mb-3 text-blue-600">均衡型（35%）</h4>
            <ul className="space-y-2 text-gray-700">
              <li>• 消费升级 15%</li>
              <li>• 医药健康 10%</li>
              <li>• 高端制造 10%</li>
            </ul>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h4 className="text-xl font-bold mb-3 text-green-600">防守型（25%）</h4>
            <ul className="space-y-2 text-gray-700">
              <li>• 银行保险 12%</li>
              <li>• 公用事业 8%</li>
              <li>• 现金储备 5%</li>
            </ul>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-bold mb-3 text-gray-800">操作建议</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start">
              <span className="text-blue-500 mr-2 text-xl">1</span>
              <p className="text-gray-700">逢低布局优质成长股，关注业绩确定性强的龙头企业</p>
            </div>
            <div className="flex items-start">
              <span className="text-blue-500 mr-2 text-xl">2</span>
              <p className="text-gray-700">适度参与主题投资，把握政策催化和技术突破机会</p>
            </div>
            <div className="flex items-start">
              <span className="text-blue-500 mr-2 text-xl">3</span>
              <p className="text-gray-700">控制仓位，保持适度现金储备应对市场波动</p>
            </div>
            <div className="flex items-start">
              <span className="text-blue-500 mr-2 text-xl">4</span>
              <p className="text-gray-700">定期调仓，动态优化组合结构，锁定阶段性收益</p>
            </div>
          </div>
        </div>
      </div>
    </div>,

    // 第10页：总结与展望
    <div key={9} className="p-8 md:p-12 h-full overflow-auto">
      <h2 className="text-4xl font-bold mb-8 text-blue-600">总结与展望</h2>
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-8 rounded-lg shadow-lg">
          <h3 className="text-3xl font-bold mb-4">核心观点</h3>
          <p className="text-xl leading-relaxed">
            2026年A股市场呈现结构性牛市特征，科技创新和消费升级是两大主线。
            在政策支持和经济复苏的双重驱动下，市场整体向好，但需警惕结构性风险。
            建议投资者采取均衡配置策略，把握优质成长股和低估值修复机会。
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h4 className="text-2xl font-bold mb-4 text-green-600">看好方向</h4>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                <span>人工智能产业链</span>
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                <span>芯片国产化</span>
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                <span>高端消费升级</span>
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                <span>创新药和医疗器械</span>
              </li>
              <li className="flex items-center">
                <span className="text-green-500 mr-2">✓</span>
                <span>金融科技</span>
              </li>
            </ul>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h4 className="text-2xl font-bold mb-4 text-orange-600">关注风险</h4>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-center">
                <span className="text-orange-500 mr-2">⚠</span>
                <span>地缘政治不确定性</span>
              </li>
              <li className="flex items-center">
                <span className="text-orange-500 mr-2">⚠</span>
                <span>部分板块估值过高</span>
              </li>
              <li className="flex items-center">
                <span className="text-orange-500 mr-2">⚠</span>
                <span>房地产市场调整</span>
              </li>
              <li className="flex items-center">
                <span className="text-orange-500 mr-2">⚠</span>
                <span>流动性边际收紧</span>
              </li>
              <li className="flex items-center">
                <span className="text-orange-500 mr-2">⚠</span>
                <span>中小企业经营压力</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <p className="text-2xl font-bold text-gray-800 mb-4">谢谢！</p>
          <p className="text-gray-600">数金研投 · 投资研究部</p>
          <p className="text-gray-500 text-sm mt-2">联系邮箱：research@sjyt.com</p>
        </div>
      </div>
    </div>
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* 顶部导航栏 */}
      <div className="bg-white shadow-md p-4 flex items-center justify-between">
        <Link href="/">
          <Button variant="outline" size="sm" className="gap-2">
            <Home className="w-4 h-4" />
            返回首页
          </Button>
        </Link>
        <div className="text-sm text-gray-600">
          第 {currentSlide + 1} / {totalSlides} 页
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={prevSlide}
            disabled={currentSlide === 0}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={nextSlide}
            disabled={currentSlide === totalSlides - 1}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 幻灯片内容 */}
      <div className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0">
          {slides[currentSlide]}
        </div>
      </div>

      {/* 底部进度条 */}
      <div className="bg-white p-2">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${((currentSlide + 1) / totalSlides) * 100}%` }}
          />
        </div>
      </div>

      {/* 提示信息 */}
      <div className="bg-gray-800 text-white text-center py-2 text-sm">
        使用键盘 ← → 或空格键翻页 | 点击左右箭头按钮翻页
      </div>
    </div>
  );
}
