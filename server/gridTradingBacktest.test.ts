import { describe, it, expect } from 'vitest';
import { backtestSpotGrid } from './gridTradingBacktest';

describe('Grid Trading Backtest Algorithm', () => {
  // 模拟K线数据：价格从1500上涨到1600，再下跌到1550
  const mockKlineData = [
    { openTime: new Date('2024-01-01T00:00:00Z'), open: '1500', high: '1520', low: '1480', close: '1510', volume: '100' },
    { openTime: new Date('2024-01-01T00:01:00Z'), open: '1510', high: '1530', low: '1500', close: '1520', volume: '100' },
    { openTime: new Date('2024-01-01T00:02:00Z'), open: '1520', high: '1540', low: '1510', close: '1530', volume: '100' },
    { openTime: new Date('2024-01-01T00:03:00Z'), open: '1530', high: '1550', low: '1520', close: '1540', volume: '100' },
    { openTime: new Date('2024-01-01T00:04:00Z'), open: '1540', high: '1560', low: '1530', close: '1550', volume: '100' },
    { openTime: new Date('2024-01-01T00:05:00Z'), open: '1550', high: '1570', low: '1540', close: '1560', volume: '100' },
    { openTime: new Date('2024-01-01T00:06:00Z'), open: '1560', high: '1580', low: '1550', close: '1570', volume: '100' },
    { openTime: new Date('2024-01-01T00:07:00Z'), open: '1570', high: '1590', low: '1560', close: '1580', volume: '100' },
    { openTime: new Date('2024-01-01T00:08:00Z'), open: '1580', high: '1600', low: '1570', close: '1590', volume: '100' },
    { openTime: new Date('2024-01-01T00:09:00Z'), open: '1590', high: '1610', low: '1580', close: '1600', volume: '100' },
    // 价格下跌
    { openTime: new Date('2024-01-01T00:10:00Z'), open: '1600', high: '1610', low: '1580', close: '1590', volume: '100' },
    { openTime: new Date('2024-01-01T00:11:00Z'), open: '1590', high: '1600', low: '1570', close: '1580', volume: '100' },
    { openTime: new Date('2024-01-01T00:12:00Z'), open: '1580', high: '1590', low: '1560', close: '1570', volume: '100' },
    { openTime: new Date('2024-01-01T00:13:00Z'), open: '1570', high: '1580', low: '1550', close: '1560', volume: '100' },
    { openTime: new Date('2024-01-01T00:14:00Z'), open: '1560', high: '1570', low: '1540', close: '1550', volume: '100' },
  ];

  it('should return valid result structure', () => {
    const result = backtestSpotGrid({
      minPrice: 1000,
      maxPrice: 2000,
      gridCount: 10,
      investment: 10000,
      type: 'spot',
    }, mockKlineData);

    // 验证返回结果的结构
    expect(result).toHaveProperty('totalProfit');
    expect(result).toHaveProperty('gridProfit');
    expect(result).toHaveProperty('unpairedProfit');
    expect(result).toHaveProperty('profitRate');
    expect(result).toHaveProperty('annualizedReturn');
    expect(result).toHaveProperty('arbitrageTimes');
    expect(result).toHaveProperty('dailyArbitrageTimes');
    expect(result).toHaveProperty('maxDrawdown');
    expect(result).toHaveProperty('maxDrawdownRate');
    expect(result).toHaveProperty('minAsset');
    expect(result).toHaveProperty('maxAsset');
    expect(result).toHaveProperty('currentPrice');
    expect(result).toHaveProperty('startPrice');
    expect(result).toHaveProperty('profitCurve');
    expect(result).toHaveProperty('trades');
  });

  it('should execute trades correctly', () => {
    const result = backtestSpotGrid({
      minPrice: 1000,
      maxPrice: 2000,
      gridCount: 10,
      investment: 10000,
      type: 'spot',
    }, mockKlineData);

    // 验证交易记录
    expect(result.trades.length).toBeGreaterThan(0);
    expect(result.arbitrageTimes).toBeGreaterThanOrEqual(0);
    
    // 验证收益曲线
    expect(result.profitCurve.length).toBe(mockKlineData.length);
  });

  it('should calculate profit correctly', () => {
    const result = backtestSpotGrid({
      minPrice: 1000,
      maxPrice: 2000,
      gridCount: 10,
      investment: 10000,
      type: 'spot',
    }, mockKlineData);

    // 验证收益计算
    expect(result.totalProfit).toBeDefined();
    expect(result.gridProfit).toBeDefined();
    expect(result.unpairedProfit).toBeDefined();
    
    // 验证收益率
    expect(result.profitRate).toBeDefined();
    expect(result.annualizedReturn).toBeDefined();
  });

  it('should track min and max asset correctly', () => {
    const result = backtestSpotGrid({
      minPrice: 1000,
      maxPrice: 2000,
      gridCount: 10,
      investment: 10000,
      type: 'spot',
    }, mockKlineData);

    // 验证资产追踪
    expect(result.minAsset).toBeLessThanOrEqual(10000);
    expect(result.maxAsset).toBeGreaterThanOrEqual(10000);
    expect(result.maxDrawdown).toBeGreaterThanOrEqual(0);
    expect(result.maxDrawdownRate).toBeGreaterThanOrEqual(0);
  });

  it('should record start and current price', () => {
    const result = backtestSpotGrid({
      minPrice: 1000,
      maxPrice: 2000,
      gridCount: 10,
      investment: 10000,
      type: 'spot',
    }, mockKlineData);

    // 验证价格记录
    expect(result.startPrice).toBe(1500);
    expect(result.currentPrice).toBe(1550);
  });

  it('should handle empty kline data', () => {
    const result = backtestSpotGrid({
      minPrice: 1000,
      maxPrice: 2000,
      gridCount: 10,
      investment: 10000,
      type: 'spot',
    }, []);

    // 验证空数据的处理
    expect(result.totalProfit).toBe(0);
    expect(result.arbitrageTimes).toBe(0);
    expect(result.profitCurve.length).toBe(0);
    expect(result.trades.length).toBe(0);
  });

  it('should handle single kline data', () => {
    const singleKline = [mockKlineData[0]];
    
    const result = backtestSpotGrid({
      minPrice: 1000,
      maxPrice: 2000,
      gridCount: 10,
      investment: 10000,
      type: 'spot',
    }, singleKline);

    // 验证单条数据的处理
    expect(result.profitCurve.length).toBe(1);
    expect(result.startPrice).toBe(1500);
    expect(result.currentPrice).toBe(1510);
  });

  it('should calculate daily arbitrage times correctly', () => {
    const result = backtestSpotGrid({
      minPrice: 1000,
      maxPrice: 2000,
      gridCount: 10,
      investment: 10000,
      type: 'spot',
    }, mockKlineData);

    // 验证日均套利次数
    expect(result.dailyArbitrageTimes).toBeGreaterThanOrEqual(0);
    
    // 验证日均套利次数的计算逻辑
    if (result.arbitrageTimes > 0) {
      expect(result.dailyArbitrageTimes).toBeGreaterThan(0);
    }
  });

  it('should record all trades with correct structure', () => {
    const result = backtestSpotGrid({
      minPrice: 1000,
      maxPrice: 2000,
      gridCount: 10,
      investment: 10000,
      type: 'spot',
    }, mockKlineData);

    // 验证交易记录的结构
    result.trades.forEach(trade => {
      expect(trade).toHaveProperty('time');
      expect(trade).toHaveProperty('type');
      expect(trade).toHaveProperty('price');
      expect(trade).toHaveProperty('amount');
      
      // 验证交易类型
      expect(['buy', 'sell']).toContain(trade.type);
      
      // 卖出交易应该有profit字段
      if (trade.type === 'sell') {
        expect(trade).toHaveProperty('profit');
      }
    });
  });

  it('should record profit curve with correct structure', () => {
    const result = backtestSpotGrid({
      minPrice: 1000,
      maxPrice: 2000,
      gridCount: 10,
      investment: 10000,
      type: 'spot',
    }, mockKlineData);

    // 验证收益曲线的结构
    result.profitCurve.forEach(point => {
      expect(point).toHaveProperty('time');
      expect(point).toHaveProperty('profit');
      expect(point).toHaveProperty('asset');
      
      // 验证资产值
      expect(point.asset).toBeGreaterThan(0);
    });
  });
});
