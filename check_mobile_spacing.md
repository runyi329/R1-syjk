# 手机视角四个容器间距修复验证

## 问题描述
用户反馈:第四个容器(累计盈亏)与前三个容器的行间距不一致,在手机上看起来压缩在一起。

## 根本原因
第四个容器使用了不同的内部结构:
- 前三个容器: 标题 `mb-1` + 数字 `text-lg`
- 第四个容器: `flex justify-between` + `text-right`,导致垂直间距被压缩

## 修复方案
将第四个容器的内部结构改为与前三个完全一致:
```tsx
<div className="p-4 bg-muted/50 rounded-lg border border-border">
  <div className="text-xs text-muted-foreground mb-1">累计盈亏</div>
  <div className={`text-lg font-bold ${...}`}>
    金额显示
  </div>
</div>
```

## 修复位置
文件: `/home/ubuntu/baccarat-house-edge/client/src/pages/BaccaratAnalysis.tsx`
行号: 461-466

## 验证方法
1. 打开百家乐分析页面
2. 点击"模拟投注"标签
3. 运行一次模拟
4. 在手机视角下查看四个容器的间距是否一致
