import axios from 'axios';
import { stockCache, CACHE_KEYS } from '../utils/stockCache';

// 创建axios实例
const api = axios.create({
  baseURL: 'http://localhost:5000/api', // 直接连接后端，绕过代理问题
  timeout: 10000, // 10秒超时
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    console.log('API请求:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    console.log('API响应:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('API错误:', error.response?.status, error.config?.url, error.message);
    return Promise.reject(error);
  }
);

// 数据类型定义
export interface StockInfo {
  code: string;
  name: string;
  industry: string;
  current_price: number;
  change_percent: number;
  change_amount: number;
  market_cap: string;
  pe_ratio_ttm: number;
  roe: number | string;
  market_earning_ratio: number;
  pb_ratio: number;
  dividend_payout_ratio: number | string;
  correction_factor: number;
  corrected_market_earning_ratio: number;
  theoretical_price: number;
  added_time: string;
  updated_time: string;
  is_pinned?: boolean;
}

export interface StockDetail {
  code: string;
  name: string;
  current_price: number;
  change_percent: number;
  change_amount: number;
  market_cap: string;
  pe_ratio_ttm: number;
  roe: number;
  pb_ratio: number;
  dividend_payout_ratio: number;
  correction_factor: number;
  corrected_pe: number;
  theoretical_price: number;
  timestamp: string;
}

export interface HistoryData {
  date: string;
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
  turnover: number;
  change_percent: number;
  change_amount: number;
}

export interface SearchResult {
  code: string;
  name: string;
  current_price: number;
  change_percent: number;
  market_cap: string;
  pe_ratio_ttm: number;
  roe: number | string;
  market_earning_ratio: number;
  pb_ratio: number;
  dividend_payout_ratio: number | string;
  correction_factor: number;
  corrected_market_earning_ratio: number;
  theoretical_price: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
  error_code?: string;
  error?: string;
}

// API服务类
class ApiService {
  // 健康检查
  async healthCheck(): Promise<ApiResponse<any>> {
    const response = await api.get('/health');
    return response.data;
  }

  // 获取关注列表
  async getWatchlist(forceRefresh: boolean = false): Promise<ApiResponse<StockInfo[]>> {
    const response = await api.get('/watchlist');
    return response.data;
  }

  // 搜索股票
  async searchStocks(keyword: string, limit: number = 10): Promise<ApiResponse<SearchResult[]>> {
    const cacheKey = CACHE_KEYS.SEARCH_RESULTS(keyword);
    
    // 检查缓存
    const cached = stockCache.get<ApiResponse<SearchResult[]>>(cacheKey);
    if (cached) {
      console.log(`使用缓存的搜索结果: ${keyword}`);
      return cached;
    }
    
    const response = await api.get('/stocks/search', {
      params: { keyword, limit }
    });
    const data = response.data;
    
    // 缓存搜索结果 - 统一使用5分钟缓存时间
    stockCache.set(cacheKey, data, {
      tradingCacheDuration: 5,
      nonTradingCacheDuration: 5
    });
    
    return data;
  }

  // 获取股票详情
  async getStockDetail(code: string): Promise<ApiResponse<StockDetail>> {
    const cacheKey = CACHE_KEYS.STOCK_DETAIL(code);
    
    // 检查缓存
    const cached = stockCache.get<ApiResponse<StockDetail>>(cacheKey);
    if (cached) {
      console.log(`使用缓存的股票详情: ${code}`);
      return cached;
    }
    
    const response = await api.get(`/stocks/${code}`);
    const data = response.data;
    
    // 缓存股票详情
    stockCache.set(cacheKey, data);
    
    return data;
  }

  // 获取股票历史数据
  async getStockHistory(code: string, period: string = '1y'): Promise<ApiResponse<HistoryData[]>> {
    const cacheKey = CACHE_KEYS.STOCK_HISTORY(code, period);
    
    // 检查缓存
    const cached = stockCache.get<ApiResponse<HistoryData[]>>(cacheKey);
    if (cached) {
      console.log(`使用缓存的历史数据: ${code} - ${period}`);
      return cached;
    }
    
    const response = await api.get(`/stocks/${code}/history`, {
      params: { period }
    });
    const data = response.data;
    
    // 缓存历史数据（历史数据相对稳定，可以缓存更长时间）
    stockCache.set(cacheKey, data, {
      tradingCacheDuration: 10,
      nonTradingCacheDuration: 60
    });
    
    return data;
  }

  // 批量获取股票数据
  async getBatchStocks(codes: string[]): Promise<ApiResponse<any>> {
    const response = await api.post('/stocks/batch', { codes });
    return response.data;
  }

  // 添加股票到关注列表
  async addToWatchlist(code: string, industry: string = ''): Promise<ApiResponse<any>> {
    const response = await api.post('/watchlist', { code, industry });
    return response.data;
  }

  // 从关注列表删除股票
  async removeFromWatchlist(code: string): Promise<ApiResponse<any>> {
    const response = await api.delete(`/watchlist/${code}`);
    return response.data;
  }

  // 切换股票置顶状态
  async togglePinStock(code: string): Promise<ApiResponse<{ code: string; is_pinned: boolean }>> {
    const response = await api.post(`/watchlist/${code}/pin`);
    return response.data;
  }

  // 获取市场概览
  async getMarketOverview(): Promise<ApiResponse<any>> {
    const cacheKey = CACHE_KEYS.MARKET_OVERVIEW;
    
    // 检查缓存
    const cached = stockCache.get<ApiResponse<any>>(cacheKey);
    if (cached) {
      console.log('使用缓存的市场概览数据');
      return cached;
    }
    
    const response = await api.get('/market/overview');
    const data = response.data;
    
    // 缓存市场概览
    stockCache.set(cacheKey, data);
    
    return data;
  }

  // 清空缓存
  async clearCache(): Promise<ApiResponse<any>> {
    const response = await api.post('/cache/clear');
    return response.data;
  }

  // 获取API统计
  async getApiStats(hours: number = 24): Promise<ApiResponse<any>> {
    const response = await api.get('/stats', {
      params: { hours }
    });
    return response.data;
  }
}

// 导出API服务实例
export const apiService = new ApiService();
export default api;