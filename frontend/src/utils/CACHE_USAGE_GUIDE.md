# 股票缓存系统使用指南

## 概述

新的股票缓存系统 (`stockCache.ts`) 提供了智能的数据缓存机制，能够根据交易时间自动调整缓存策略，显著提升应用性能和用户体验。

## 核心特性

### 1. 智能缓存策略
- **交易时间**（周一至周五 9:30-11:30, 13:00-15:00）：缓存 2 分钟
- **非交易时间**：缓存 30 分钟
- 自动判断当前时间并应用相应策略

### 2. 缓存优先加载
- 页面加载时优先显示缓存数据
- 后台静默更新最新数据
- 提供视觉反馈区分缓存数据和最新数据

### 3. 完整的缓存管理
- 支持手动刷新
- 支持清空所有缓存
- 提供缓存统计信息
- 自动过期清理

## 使用方法

### 1. 导入缓存工具

```typescript
import { stockCache, CACHE_KEYS } from '../utils/stockCache';
```

### 2. 基本缓存操作

#### 设置缓存
```typescript
// 使用默认缓存策略
stockCache.set(CACHE_KEYS.WATCHLIST, data);

// 自定义缓存时长
stockCache.set(CACHE_KEYS.SEARCH_RESULTS('keyword'), data, {
  tradingCacheDuration: 5,     // 交易时间缓存5分钟
  nonTradingCacheDuration: 15  // 非交易时间缓存15分钟
});
```

#### 获取缓存
```typescript
// 获取缓存数据
const cachedData = stockCache.get<StockInfo[]>(CACHE_KEYS.WATCHLIST);

// 获取缓存信息（包含时间戳）
const cacheInfo = stockCache.getCacheInfo<StockInfo[]>(CACHE_KEYS.WATCHLIST);
if (cacheInfo) {
  console.log('数据:', cacheInfo.data);
  console.log('缓存时间:', cacheInfo.timestamp);
}
```

#### 检查和删除缓存
```typescript
// 检查缓存是否存在
if (stockCache.has(CACHE_KEYS.WATCHLIST)) {
  // 缓存存在
}

// 删除特定缓存
stockCache.remove(CACHE_KEYS.WATCHLIST);

// 清空所有缓存
stockCache.clear();
```

### 3. 在组件中实现缓存优先加载

```typescript
const fetchData = async (showLoading = true, forceRefresh = false) => {
  if (showLoading) setLoading(true);
  
  try {
    // 如果不是强制刷新，先尝试从缓存获取数据
    if (!forceRefresh) {
      const cacheInfo = stockCache.getCacheInfo<DataType>(CACHE_KEYS.YOUR_KEY);
      if (cacheInfo) {
        console.log('使用缓存数据');
        setData(cacheInfo.data);
        setLastUpdateTime(cacheInfo.timestamp);
        setIsFromCache(true);
        if (showLoading) setLoading(false);
        
        // 后台静默更新
        setTimeout(() => {
          fetchDataFromApi(false);
        }, 100);
        return;
      }
    }
    
    // 从API获取数据
    await fetchDataFromApi(showLoading);
  } catch (error) {
    console.error('获取数据失败:', error);
    if (showLoading) setLoading(false);
  }
};

const fetchDataFromApi = async (showLoading = true) => {
  try {
    const response = await apiService.getData();
    if (response.success && response.data) {
      setData(response.data);
      const now = Date.now();
      setLastUpdateTime(now);
      setIsFromCache(false);
      
      // 缓存数据
      stockCache.set(CACHE_KEYS.YOUR_KEY, response.data);
    }
  } catch (error) {
    throw error;
  } finally {
    if (showLoading) setLoading(false);
  }
};
```

### 4. 显示缓存状态

```typescript
// 在组件中添加状态
const [lastUpdateTime, setLastUpdateTime] = useState<number | null>(null);
const [isFromCache, setIsFromCache] = useState(false);

// 在UI中显示缓存状态
{lastUpdateTime && (
  <div style={{ 
    display: 'flex', 
    alignItems: 'center', 
    gap: 8,
    padding: '4px 12px',
    background: isFromCache ? '#3a2d1a' : '#1a2d3a',
    borderRadius: '6px',
    border: `1px solid ${isFromCache ? '#4a3d2a' : '#2a3d4a'}`
  }}>
    <ClockCircleOutlined style={{ 
      color: isFromCache ? '#f59e0b' : '#10b981',
      fontSize: '12px'
    }} />
    <Text style={{ 
      color: isFromCache ? '#f59e0b' : '#10b981',
      fontSize: '12px',
      fontWeight: 500
    }}>
      {isFromCache ? '缓存数据' : '最新数据'}
    </Text>
    <Text style={{ 
      color: '#8b8d97',
      fontSize: '11px'
    }}>
      {stockCache.formatTimestamp(lastUpdateTime)}
    </Text>
  </div>
)}
```

## 预定义缓存键

```typescript
export const CACHE_KEYS = {
  WATCHLIST: 'watchlist',                                    // 关注列表
  MARKET_OVERVIEW: 'market_overview',                       // 市场概览
  STOCK_DETAIL: (code: string) => `stock_detail_${code}`,   // 股票详情
  STOCK_HISTORY: (code: string, period: string) => 
    `stock_history_${code}_${period}`,                      // 股票历史数据
  SEARCH_RESULTS: (query: string) => `search_${query}`,     // 搜索结果
} as const;
```

## 最佳实践

### 1. 缓存策略选择
- **实时数据**（股价、涨跌幅）：使用默认策略（交易时间2分钟，非交易时间30分钟）
- **搜索结果**：可以缓存更长时间（5-15分钟）
- **历史数据**：可以缓存很长时间（10-60分钟）
- **静态数据**（公司信息）：可以缓存数小时

### 2. 数据更新策略
- 用户操作后立即清除相关缓存
- 提供手动刷新功能
- 在关键操作后强制刷新数据

### 3. 用户体验优化
- 优先显示缓存数据，减少等待时间
- 提供视觉反馈区分缓存数据和最新数据
- 显示最后更新时间
- 提供手动刷新按钮

### 4. 错误处理
- 缓存读取失败时自动清除损坏的缓存
- 提供降级方案（缓存失效时直接从API获取）
- 记录缓存相关的错误日志

## 性能监控

### 获取缓存统计
```typescript
const stats = stockCache.getStats();
console.log(`缓存项数量: ${stats.count}`);
console.log(`缓存总大小: ${stats.totalSize} 字符`);
```

### 缓存命中率监控
在开发者工具中查看控制台日志，观察缓存命中情况：
- `使用缓存的关注列表数据` - 缓存命中
- `从API获取关注列表数据并已缓存` - 缓存未命中

## 注意事项

1. **localStorage 限制**：注意浏览器 localStorage 的大小限制（通常5-10MB）
2. **数据一致性**：在用户操作后及时清除相关缓存，确保数据一致性
3. **交易时间判断**：系统自动判断交易时间，无需手动干预
4. **缓存清理**：系统会自动清理过期缓存，无需手动管理
5. **错误恢复**：缓存操作失败不会影响正常功能，会自动降级到直接API调用

## 故障排除

### 常见问题

1. **缓存不生效**
   - 检查缓存键是否正确
   - 确认数据是否已过期
   - 查看控制台是否有错误日志

2. **数据不更新**
   - 检查是否正确清除了相关缓存
   - 确认后台静默更新是否正常工作
   - 尝试手动刷新

3. **性能问题**
   - 检查缓存大小是否过大
   - 考虑调整缓存策略
   - 清理不必要的缓存项

### 调试技巧

```typescript
// 查看所有缓存键
const keys = Object.keys(localStorage).filter(key => 
  key.startsWith('stock_cache_')
);
console.log('缓存键列表:', keys);

// 查看特定缓存内容
const cacheContent = localStorage.getItem('stock_cache_watchlist');
console.log('关注列表缓存:', JSON.parse(cacheContent || '{}'));

// 手动清除特定缓存进行测试
stockCache.remove(CACHE_KEYS.WATCHLIST);
```

通过遵循这些指南，您可以充分利用新的缓存系统，为用户提供更快速、更流畅的股票数据浏览体验。