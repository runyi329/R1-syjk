import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

interface DailyProfit {
  date: string;
  balance: number;
  dailyProfit: number;
  totalProfit: number;
  profitRate: number;
}

interface FundsCurveChartProps {
  data: DailyProfit[];
  viewMode: 'balance' | 'profit';
  profitPeriod?: 'day' | 'month' | 'year';
  currentYear?: number;
  currentMonth?: number;
}

export default function FundsCurveChart({ 
  data, 
  viewMode, 
  profitPeriod = 'day',
  currentYear,
  currentMonth 
}: FundsCurveChartProps) {
  // 根据视角过滤和处理数据
  const getChartData = () => {
    if (!data || data.length === 0) return [];
    
    // 余额视角：显示每日余额
    if (viewMode === 'balance') {
      // 如果有currentYear和currentMonth，过滤当月数据
      if (currentYear && currentMonth) {
        const filteredData = data.filter(d => {
          const [year, month] = d.date.split('-');
          return parseInt(year) === currentYear && parseInt(month) === currentMonth;
        });
        return filteredData.map(d => ({
          date: d.date.split('-')[2], // 只显示日期
          value: d.balance,
          fullDate: d.date
        }));
      }
      // 否则显示所有数据
      return data.map(d => ({
        date: d.date,
        value: d.balance,
        fullDate: d.date
      }));
    }
    
    // 日盈亏视角：显示每日盈亏
    if (viewMode === 'profit' && profitPeriod === 'day') {
      if (currentYear && currentMonth) {
        const filteredData = data.filter(d => {
          const [year, month] = d.date.split('-');
          return parseInt(year) === currentYear && parseInt(month) === currentMonth;
        });
        return filteredData.map(d => ({
          date: d.date.split('-')[2],
          value: d.dailyProfit,
          fullDate: d.date
        }));
      }
      return data.map(d => ({
        date: d.date,
        value: d.dailyProfit,
        fullDate: d.date
      }));
    }
    
    // 月盈亏视角：按月汇总
    if (viewMode === 'profit' && profitPeriod === 'month') {
      const monthlyData: { [key: string]: number } = {};
      data.forEach(d => {
        const monthKey = d.date.substring(0, 7); // YYYY-MM
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = 0;
        }
        monthlyData[monthKey] += d.dailyProfit;
      });
      
      return Object.keys(monthlyData).sort().map(month => ({
        date: month,
        value: monthlyData[month],
        fullDate: month
      }));
    }
    
    // 年盈亏视角：按年汇总
    if (viewMode === 'profit' && profitPeriod === 'year') {
      const yearlyData: { [key: string]: number } = {};
      data.forEach(d => {
        const yearKey = d.date.substring(0, 4); // YYYY
        if (!yearlyData[yearKey]) {
          yearlyData[yearKey] = 0;
        }
        yearlyData[yearKey] += d.dailyProfit;
      });
      
      return Object.keys(yearlyData).sort().map(year => ({
        date: year,
        value: yearlyData[year],
        fullDate: year
      }));
    }
    
    return [];
  };

  const chartData = getChartData();
  
  if (chartData.length === 0) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center text-white/60">
        暂无数据
      </div>
    );
  }

  // 自定义Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-black/90 border border-white/20 rounded-lg p-3 shadow-lg">
          <p className="text-white/80 text-sm mb-1">{data.fullDate}</p>
          <p className={`font-bold ${
            viewMode === 'balance' 
              ? 'text-[#D4AF37]' 
              : data.value >= 0 
                ? 'text-red-500' 
                : 'text-green-500'
          }`}>
            {viewMode === 'balance' ? '余额: ' : '盈亏: '}
            {data.value >= 0 && viewMode === 'profit' ? '+' : ''}
            ¥{data.value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      );
    }
    return null;
  };

  // 根据视角决定颜色
  const getStrokeColor = () => {
    if (viewMode === 'balance') return '#D4AF37'; // 金色
    return '#3b82f6'; // 蓝色（盈亏）
  };

  const getFillColor = () => {
    if (viewMode === 'balance') return 'url(#colorBalance)';
    return 'url(#colorProfit)';
  };

  return (
    <div className="w-full h-[300px] md:h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
          <XAxis 
            dataKey="date" 
            stroke="#94a3b8"
            style={{ fontSize: '12px' }}
            tick={{ fill: '#94a3b8' }}
          />
          <YAxis 
            stroke="#94a3b8"
            style={{ fontSize: '12px' }}
            tick={{ fill: '#94a3b8' }}
            tickFormatter={(value) => `¥${value.toLocaleString()}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={getStrokeColor()}
            strokeWidth={2}
            fill={getFillColor()}
            dot={{ fill: getStrokeColor(), strokeWidth: 2, r: 3 }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
