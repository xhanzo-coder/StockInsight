// 格式化价格显示
export const formatPrice = (price: number | null | undefined): string => {
  if (price === null || price === undefined) return '--';
  return `¥${price.toFixed(2)}`;
};

// 格式化百分比显示
export const formatPercent = (percent: number | null | undefined): string => {
  if (percent === null || percent === undefined) return '--';
  const sign = percent > 0 ? '+' : '';
  return `${sign}${percent.toFixed(2)}%`;
};

// 格式化数值显示
export const formatNumber = (num: number | null | undefined, decimals: number = 2): string => {
  if (num === null || num === undefined) return '--';
  return num.toFixed(decimals);
};

// 格式化市值显示
export const formatMarketCap = (marketCap: string | null | undefined): string => {
  if (!marketCap) return '--';
  return marketCap;
};

// 格式化时间显示
export const formatTime = (timeStr: string | null | undefined): string => {
  if (!timeStr) return '--';
  try {
    const date = new Date(timeStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return timeStr;
  }
};

// 获取涨跌颜色类名
export const getPriceColorClass = (value: number | null | undefined): string => {
  if (value === null || value === undefined || value === 0) return '';
  return value > 0 ? 'positive' : 'negative';
};

// 获取涨跌颜色
export const getPriceColor = (value: number | null | undefined): string => {
  if (value === null || value === undefined || value === 0) return '#ffffff';
  return value > 0 ? '#22c55e' : '#ef4444';
};

// 防抖函数
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// 节流函数
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// 计算价格差异
export const calculatePriceDiff = (
  theoretical: number | null | undefined,
  current: number | null | undefined
): number | null => {
  if (theoretical === null || theoretical === undefined || 
      current === null || current === undefined) {
    return null;
  }
  return theoretical - current;
};

// 格式化价格差异显示
export const formatPriceDiff = (
  theoretical: number | null | undefined,
  current: number | null | undefined
): string => {
  const diff = calculatePriceDiff(theoretical, current);
  if (diff === null) return '--';
  const sign = diff > 0 ? '+' : '';
  return `${sign}${diff.toFixed(2)}`;
};

// 验证股票代码格式
export const isValidStockCode = (code: string): boolean => {
  return /^\d{6}$/.test(code);
};

// 生成随机ID
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

// 深拷贝对象
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

// 获取表格排序图标
export const getSortIcon = (sortOrder: 'ascend' | 'descend' | null): string => {
  if (sortOrder === 'ascend') return '↑';
  if (sortOrder === 'descend') return '↓';
  return '';
};

// 处理API错误
export const handleApiError = (error: any): string => {
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return '请求失败，请稍后重试';
};

// 格式化股利支付率
export const formatDividendRatio = (ratio: number | string | null | undefined): string => {
  if (ratio === null || ratio === undefined) return '--';
  
  // 如果是字符串且已经包含%，直接返回
  if (typeof ratio === 'string') {
    if (ratio.includes('%')) {
      return ratio;
    }
    // 如果是字符串数字，转换为数字处理
    const numRatio = parseFloat(ratio);
    if (isNaN(numRatio)) return '--';
    return `${numRatio.toFixed(1)}%`;
  }
  
  // 如果是数字，直接显示（后端已经是百分比格式）
  return `${ratio.toFixed(1)}%`;
};

// 格式化ROE显示
export const formatROE = (roe: number | string | null | undefined): string => {
  if (roe === null || roe === undefined) return '--';
  
  // 如果是字符串且已经包含%，直接返回
  if (typeof roe === 'string') {
    if (roe.includes('%')) {
      return roe;
    }
    // 如果是字符串数字，转换为数字处理
    const numROE = parseFloat(roe);
    if (isNaN(numROE)) return '--';
    return `${numROE.toFixed(2)}%`;
  }
  
  // 如果是数字，直接显示（后端已经是百分比格式）
  return `${roe.toFixed(2)}%`;
};

// 获取优质股票标准
export const isQualityStock = (pe: number | null | undefined, roe: number | null | undefined): boolean => {
  return (pe !== null && pe !== undefined && pe < 15) && 
         (roe !== null && roe !== undefined && roe > 15);
};

// 计算统计数据
export const calculateStats = (stocks: any[]) => {
  if (!stocks || stocks.length === 0) {
    return {
      totalCount: 0,
      avgPE: 0,
      qualityCount: 0,
      risingCount: 0,
      fallingCount: 0,
      flatCount: 0,
      avgChangePercent: 0,
      strongStocks: 0,
      strongStocksList: [],
      maxChangePercent: 0,
      minChangePercent: 0,
      avgROE: 0,
      lastUpdate: new Date().toLocaleTimeString('zh-CN', { hour12: false })
    };
  }

  // 涨跌分布统计
  const risingCount = stocks.filter(stock => 
    stock.change_percent && stock.change_percent > 0
  ).length;

  const fallingCount = stocks.filter(stock => 
    stock.change_percent && stock.change_percent < 0
  ).length;

  const flatCount = stocks.filter(stock => 
    stock.change_percent === 0
  ).length;

  // 平均涨跌幅计算
  const validChangePercents = stocks
    .map(s => s.change_percent)
    .filter(cp => cp !== null && cp !== undefined && !isNaN(cp));
  
  const avgChangePercent = validChangePercents.length > 0 
    ? validChangePercents.reduce((sum, cp) => sum + cp, 0) / validChangePercents.length 
    : 0;

  // 最高和最低涨跌幅
  const maxChangePercent = validChangePercents.length > 0 
    ? Math.max(...validChangePercents) 
    : 0;
  
  const minChangePercent = validChangePercents.length > 0 
    ? Math.min(...validChangePercents) 
    : 0;

  // 强势股统计（涨幅超过5%）
  const strongStocksList = stocks.filter(stock => 
    stock.change_percent && stock.change_percent > 5
  );
  const strongStocks = strongStocksList.length;

  // 保留原有统计
  const validPEs = stocks
    .map(s => s.pe_ratio_ttm)
    .filter(pe => pe !== null && pe !== undefined && !isNaN(pe));
  
  const avgPE = validPEs.length > 0 
    ? validPEs.reduce((sum, pe) => sum + pe, 0) / validPEs.length 
    : 0;

  const validROEs = stocks
    .map(s => s.roe)
    .filter(roe => roe !== null && roe !== undefined && !isNaN(roe));
  
  const avgROE = validROEs.length > 0 
    ? validROEs.reduce((sum, roe) => sum + roe, 0) / validROEs.length 
    : 0;

  const qualityCount = stocks.filter(stock => 
    isQualityStock(stock.pe_ratio_ttm, stock.roe)
  ).length;

  return {
    totalCount: stocks.length,
    avgPE: Number(avgPE.toFixed(1)),
    avgROE: Number(avgROE.toFixed(1)),
    qualityCount,
    risingCount,
    fallingCount,
    flatCount,
    avgChangePercent: Number(avgChangePercent.toFixed(2)),
    strongStocks,
    strongStocksList: strongStocksList.map(s => ({ name: s.name, code: s.code, change_percent: s.change_percent })),
    maxChangePercent: Number(maxChangePercent.toFixed(2)),
    minChangePercent: Number(minChangePercent.toFixed(2)),
    lastUpdate: new Date().toLocaleTimeString('zh-CN', { hour12: false })
  };
};