/**
 * 量化因子系统 - 类型定义和接口
 * 
 * 因子（Factor）：用于生成交易信号的技术指标或量化模型
 * 每个因子可以独立计算并产生买入/卖出信号
 */

/**
 * 因子类型枚举
 */
export enum FactorType {
  MA = 'ma',           // 移动平均线
  MACD = 'macd',       // MACD指标
  RSI = 'rsi',         // 相对强弱指标
  BOLL = 'boll',       // 布林带
  KDJ = 'kdj',         // 随机指标
}

/**
 * 因子元数据 - 用于前端展示
 */
export interface FactorMetadata {
  type: FactorType;
  name: string;
  description: string;
  category: '趋势' | '动量' | '波动' | '成交量';
  // 参数定义
  parameters: FactorParameter[];
}

/**
 * 因子参数定义
 */
export interface FactorParameter {
  key: string;
  label: string;
  type: 'number' | 'select';
  defaultValue: number | string;
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: string | number }[];
  description?: string;
}

/**
 * 因子配置 - 用户选择的因子及其参数
 */
export interface FactorConfig {
  type: FactorType;
  enabled: boolean;
  parameters: Record<string, number | string>;
}

/**
 * 交易信号
 */
export enum Signal {
  NONE = 0,    // 无信号
  BUY = 1,     // 买入信号
  SELL = -1,   // 卖出信号
}

/**
 * 因子计算结果
 */
export interface FactorResult {
  signal: Signal;
  // 因子计算的中间值（用于调试和可视化）
  values?: Record<string, number>;
  // 信号强度（0-1，可选）
  strength?: number;
}

/**
 * K线数据（用于因子计算）
 */
export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * 因子库注册表
 */
export const FACTOR_REGISTRY: Record<FactorType, FactorMetadata> = {
  [FactorType.MA]: {
    type: FactorType.MA,
    name: '移动平均线',
    description: '通过短期和长期均线的交叉判断买卖时机',
    category: '趋势',
    parameters: [
      {
        key: 'shortPeriod',
        label: '短期均线周期',
        type: 'number',
        defaultValue: 10,
        min: 2,
        max: 100,
        step: 1,
        description: '计算短期移动平均线的K线数量',
      },
      {
        key: 'longPeriod',
        label: '长期均线周期',
        type: 'number',
        defaultValue: 30,
        min: 5,
        max: 200,
        step: 1,
        description: '计算长期移动平均线的K线数量',
      },
    ],
  },
  [FactorType.MACD]: {
    type: FactorType.MACD,
    name: 'MACD',
    description: '通过快慢均线差值判断趋势和动量',
    category: '趋势',
    parameters: [
      {
        key: 'fastPeriod',
        label: '快线周期',
        type: 'number',
        defaultValue: 12,
        min: 2,
        max: 50,
        step: 1,
      },
      {
        key: 'slowPeriod',
        label: '慢线周期',
        type: 'number',
        defaultValue: 26,
        min: 5,
        max: 100,
        step: 1,
      },
      {
        key: 'signalPeriod',
        label: '信号线周期',
        type: 'number',
        defaultValue: 9,
        min: 2,
        max: 50,
        step: 1,
      },
    ],
  },
  [FactorType.RSI]: {
    type: FactorType.RSI,
    name: 'RSI相对强弱指标',
    description: '判断超买超卖状态',
    category: '动量',
    parameters: [
      {
        key: 'period',
        label: 'RSI周期',
        type: 'number',
        defaultValue: 14,
        min: 2,
        max: 50,
        step: 1,
      },
      {
        key: 'overbought',
        label: '超买阈值',
        type: 'number',
        defaultValue: 70,
        min: 50,
        max: 90,
        step: 1,
      },
      {
        key: 'oversold',
        label: '超卖阈值',
        type: 'number',
        defaultValue: 30,
        min: 10,
        max: 50,
        step: 1,
      },
    ],
  },
  [FactorType.BOLL]: {
    type: FactorType.BOLL,
    name: '布林带',
    description: '通过价格与波动带的关系判断买卖时机',
    category: '波动',
    parameters: [
      {
        key: 'period',
        label: '周期',
        type: 'number',
        defaultValue: 20,
        min: 5,
        max: 100,
        step: 1,
      },
      {
        key: 'stdDev',
        label: '标准差倍数',
        type: 'number',
        defaultValue: 2,
        min: 1,
        max: 3,
        step: 0.1,
      },
    ],
  },
  [FactorType.KDJ]: {
    type: FactorType.KDJ,
    name: 'KDJ随机指标',
    description: '通过K、D、J三条线的交叉判断买卖时机',
    category: '动量',
    parameters: [
      {
        key: 'period',
        label: 'K值周期',
        type: 'number',
        defaultValue: 9,
        min: 2,
        max: 50,
        step: 1,
      },
      {
        key: 'kPeriod',
        label: 'K平滑周期',
        type: 'number',
        defaultValue: 3,
        min: 1,
        max: 10,
        step: 1,
      },
      {
        key: 'dPeriod',
        label: 'D平滑周期',
        type: 'number',
        defaultValue: 3,
        min: 1,
        max: 10,
        step: 1,
      },
    ],
  },
};
