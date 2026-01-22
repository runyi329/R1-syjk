/**
 * 因子选择器组件
 * 允许用户选择和配置量化因子
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { FACTOR_REGISTRY, FactorType, FactorConfig, FactorMetadata } from '../../../shared/factors';

interface FactorSelectorProps {
  selectedFactors: FactorConfig[];
  onChange: (factors: FactorConfig[]) => void;
}

export function FactorSelector({ selectedFactors, onChange }: FactorSelectorProps) {
  // 获取所有可用因子
  const availableFactors = Object.values(FACTOR_REGISTRY);
  
  // 管理折叠状态
  const [expandedFactors, setExpandedFactors] = useState<Set<FactorType>>(new Set());
  
  const toggleExpand = (factorType: FactorType) => {
    const newExpanded = new Set(expandedFactors);
    if (newExpanded.has(factorType)) {
      newExpanded.delete(factorType);
    } else {
      newExpanded.add(factorType);
    }
    setExpandedFactors(newExpanded);
  };

  // 切换因子启用状态
  const toggleFactor = (factorType: FactorType) => {
    const existing = selectedFactors.find(f => f.type === factorType);
    
    if (existing) {
      // 如果已存在，切换启用状态
      onChange(
        selectedFactors.map(f =>
          f.type === factorType ? { ...f, enabled: !f.enabled } : f
        )
      );
    } else {
      // 如果不存在，添加新因子（使用默认参数）
      const metadata = FACTOR_REGISTRY[factorType];
      const defaultParams: Record<string, number | string> = {};
      metadata.parameters.forEach(param => {
        defaultParams[param.key] = param.defaultValue;
      });

      onChange([
        ...selectedFactors,
        {
          type: factorType,
          enabled: true,
          parameters: defaultParams,
        },
      ]);
    }
  };

  // 更新因子参数
  const updateParameter = (factorType: FactorType, paramKey: string, value: number | string) => {
    onChange(
      selectedFactors.map(f =>
        f.type === factorType
          ? {
              ...f,
              parameters: {
                ...f.parameters,
                [paramKey]: value,
              },
            }
          : f
      )
    );
  };

  // 获取因子配置
  const getFactorConfig = (factorType: FactorType): FactorConfig | undefined => {
    return selectedFactors.find(f => f.type === factorType);
  };

  return (
    <div className="space-y-2">
      <div>
        <h3 className="text-sm font-semibold mb-1">因子库</h3>
        <p className="text-xs text-muted-foreground mb-2">
          选择一个或多个因子构建您的量化策略
        </p>
      </div>

      {availableFactors.map((metadata) => {
        const config = getFactorConfig(metadata.type);
        const isEnabled = config?.enabled ?? false;

        const isExpanded = expandedFactors.has(metadata.type);

        return (
          <Card key={metadata.type} className={isEnabled ? 'border-primary bg-primary/5' : 'border-border'}>
            <CardHeader className="py-1.5 px-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Checkbox
                    id={`factor-${metadata.type}`}
                    checked={isEnabled}
                    onCheckedChange={() => toggleFactor(metadata.type)}
                    className="shrink-0"
                  />
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <label htmlFor={`factor-${metadata.type}`} className="cursor-pointer font-medium text-xs truncate">
                      {metadata.name}
                    </label>
                    <span className="inline-block px-1 py-0 text-[10px] leading-tight rounded bg-primary/10 text-primary shrink-0">
                      {metadata.category}
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate">
                      {metadata.description}
                    </span>
                  </div>
                </div>
                {isEnabled && (
                  <button
                    type="button"
                    onClick={() => toggleExpand(metadata.type)}
                    className="shrink-0 p-0.5 hover:bg-accent rounded transition-colors"
                    aria-label={isExpanded ? '收起参数' : '展开参数'}
                  >
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                )}
              </div>
            </CardHeader>

            {isEnabled && config && isExpanded && (
              <CardContent className="py-2 px-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {metadata.parameters.map((param) => (
                    <div key={param.key} className="space-y-2">
                      <Label htmlFor={`${metadata.type}-${param.key}`}>
                        {param.label}
                      </Label>
                      {param.type === 'number' ? (
                        <Input
                          id={`${metadata.type}-${param.key}`}
                          type="number"
                          min={param.min}
                          max={param.max}
                          step={param.step}
                          value={config.parameters[param.key]}
                          onChange={(e) =>
                            updateParameter(
                              metadata.type,
                              param.key,
                              parseFloat(e.target.value)
                            )
                          }
                        />
                      ) : (
                        <select
                          id={`${metadata.type}-${param.key}`}
                          value={config.parameters[param.key]}
                          onChange={(e) =>
                            updateParameter(metadata.type, param.key, e.target.value)
                          }
                          className="w-full px-3 py-2 border rounded-md"
                        >
                          {param.options?.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      )}
                      {param.description && (
                        <p className="text-xs text-muted-foreground">
                          {param.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
