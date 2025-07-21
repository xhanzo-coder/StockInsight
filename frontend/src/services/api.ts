import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { stockCache, CACHE_KEYS } from '../utils/stockCache';
import { message } from 'antd';

// 令牌管理
const TOKEN_KEY = 'auth_token';
const USER_INFO_KEY = 'userInfo';
const AUTH_LAST_VERIFIED_KEY = 'auth_last_verified';

// 配置常量
const REQUEST_TIMEOUT = 15000; // 请求超时时间（毫秒）
const MAX_RETRY_COUNT = 2; // 最大重试次数
const RETRY_DELAY = 1000; // 重试延迟（毫秒）

export const tokenManager = {
  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },
  
  setToken: (token: string): void => {
    if (!token) {
      console.warn('尝试设置空token，操作被忽略');
      return;
    }
    localStorage.setItem(TOKEN_KEY, token);
    // 记录token设置时间
    localStorage.setItem('token_timestamp', Date.now().toString());
    console.log('Token已设置，时间戳:', Date.now());
  },
  
  removeToken: (): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('token_timestamp');
    localStorage.removeItem(USER_INFO_KEY);
    localStorage.removeItem(AUTH_LAST_VERIFIED_KEY);
    console.log('Token和相关认证信息已清除');
  },
  
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      console.log('没有找到token，未认证');
      return false;
    }
    
    // 检查token格式是否有效（简单验证）
    try {
      // JWT格式验证：确保token是由三部分组成的点分隔字符串
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.warn('无效的token格式，清除token');
        tokenManager.removeToken();
        return false;
      }
      
      // 检查token是否过期（通过解析JWT的payload）
      try {
        const payload = JSON.parse(atob(parts[1]));
        console.log('解析JWT payload成功:', { 
          exp: payload.exp ? new Date(payload.exp * 1000).toISOString() : '无过期时间',
          iat: payload.iat ? new Date(payload.iat * 1000).toISOString() : '无创建时间',
          sub: payload.sub || '无主题',
          currentTime: new Date().toISOString()
        });
        
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          console.warn('token已过期，清除token');
          tokenManager.removeToken();
          return false;
        }
      } catch (e) {
        console.warn('无法解析token payload:', e);
        // 继续使用token，让服务器决定是否有效
      }
      
      // 检查是否有用户信息
      const userInfo = localStorage.getItem(USER_INFO_KEY);
      if (!userInfo) {
        console.warn('找到有效token但没有用户信息');
        // 仍然返回true，让应用尝试验证token
      }
      
      console.log('Token验证通过，用户已认证');
      return true;
    } catch (e) {
      console.error('token验证出错:', e);
      return false;
    }
  },
  
  // 获取token过期时间
  getTokenExpiration: (): number | null => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      const payload = JSON.parse(atob(parts[1]));
      return payload.exp ? payload.exp * 1000 : null;
    } catch (e) {
      console.error('获取token过期时间失败:', e);
      return null;
    }
  },
  
  // 检查token是否即将过期（5分钟内）
  isTokenExpiringSoon: (): boolean => {
    const expiration = tokenManager.getTokenExpiration();
    if (!expiration) return false;
    
    const fiveMinutes = 5 * 60 * 1000;
    return expiration - Date.now() < fiveMinutes;
  }
};

// 创建axios实例
const api = axios.create({
  baseURL: 'http://localhost:5000/api', // 直接硬编码，确保稳定
  timeout: REQUEST_TIMEOUT, // 15秒超时
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// 请求重试函数
const retryRequest = async (config: AxiosRequestConfig, retryCount: number = 0): Promise<AxiosResponse> => {
  try {
    return await axios(config);
  } catch (error: any) {
    // 只有在网络错误或5xx服务器错误时重试
    const isNetworkError = !error.response;
    const isServerError = error.response && error.response.status >= 500;
    const isTimeoutError = error.code === 'TIMEOUT' || error.code === 'ECONNABORTED';
    
    if ((isNetworkError || isServerError || isTimeoutError) && retryCount < MAX_RETRY_COUNT) {
      const delay = RETRY_DELAY * Math.pow(2, retryCount); // 指数退避
      console.log(`请求失败，${delay/1000}秒后重试 (${retryCount + 1}/${MAX_RETRY_COUNT})`);
      console.log('错误详情:', {
        isNetworkError,
        isServerError,
        isTimeoutError,
        errorCode: error.code,
        errorMessage: error.message,
        status: error.response?.status
      });
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryRequest(config, retryCount + 1);
    }
    
    throw error;
  }
};

// 请求拦截器 - 添加认证令牌
api.interceptors.request.use(
  (config) => {
    // 添加请求时间戳，用于调试
    config.headers = config.headers || {};
    config.headers['X-Request-Time'] = new Date().toISOString();
    
    console.log('=== API请求拦截器 ===');
    console.log('请求:', config.method?.toUpperCase(), config.url);
    
    // 添加认证令牌
    const token = tokenManager.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('添加Authorization头:', `Bearer ${token.substring(0, 20)}...`);
    } else {
      console.log('没有token，跳过Authorization头');
    }
    
    console.log('最终请求头:', config.headers);
    
    return config;
  },
  (error) => {
    console.error('请求拦截器错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理认证错误
api.interceptors.response.use(
  (response) => {
    console.log('API响应:', response.status, response.config.url);
    return response;
  },
  (error: AxiosError) => {
    console.error('API错误:', error.response?.status, error.config?.url, error.message);
    
    // 处理认证错误
    if (error.response?.status === 401) {
      console.warn('收到401未授权响应，清除认证状态');
      
      // 令牌过期或无效，清除本地令牌和用户信息
      tokenManager.removeToken();
      localStorage.removeItem(USER_INFO_KEY);
      localStorage.removeItem(AUTH_LAST_VERIFIED_KEY);
      
      // 如果不是验证接口的请求，显示提示并重定向
      if (error.config?.url !== '/auth/verify') {
        message.error('登录已过期，请重新登录');
        
        // 使用延迟重定向，确保消息能够显示
        setTimeout(() => {
          // 保存当前URL，以便登录后返回
          const currentPath = window.location.pathname;
          if (currentPath !== '/login') {
            sessionStorage.setItem('redirectAfterLogin', currentPath);
          }
          
          window.location.href = '/login';
        }, 1500);
      }
    }
    // 处理网络错误
    else if (!error.response) {
      console.error('网络错误:', error.message);
      // 网络错误不自动清除认证状态
    }
    // 处理服务器错误
    else if (error.response.status >= 500) {
      console.error('服务器错误:', error.response.status, error.response.data);
      message.error('服务器暂时不可用，请稍后重试');
    }
    
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
    console.log('=== 前端关注列表API调试 ===');
    console.log('当前token:', tokenManager.getToken());
    console.log('认证状态:', tokenManager.isAuthenticated());
    
    try {
      // 使用统一的api实例，确保认证头正确添加
      const response = await api.get('/watchlist');
      
      console.log('关注列表API响应:', response.status, response.data);
      return response.data;
    } catch (error: any) {
      console.error('关注列表API错误:', error.response?.status, error.response?.data, error.message);
      throw error;
    }
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

/**
 * 安全的API调用封装
 * 提供统一的错误处理和返回结构
 */
export const safeApiCall = async <T>(apiCall: () => Promise<T>): Promise<{ success: boolean; data?: T; error?: string; networkError?: boolean }> => {
  try {
    const result = await apiCall();
    return { success: true, data: result };
  } catch (error: any) {
    console.error('API调用失败:', error);
    
    // 检查是否为网络错误
    const isNetworkError = !error.response;
    
    if (isNetworkError) {
      let errorMessage = '请求失败';
      
      // 更精确地识别错误类型
      if (error.code === 'ECONNREFUSED') {
        errorMessage = '无法连接到服务器，请确认后端服务已启动（端口5000）';
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = '网络连接错误，请检查您的网络连接';
      } else if (error.code === 'TIMEOUT' || error.code === 'ECONNABORTED') {
        errorMessage = '请求超时，请稍后重试';
      } else if (error.message?.includes('CORS')) {
        errorMessage = 'CORS跨域错误，请检查后端CORS配置';
      } else if (error.message?.includes('ERR_INTERNET_DISCONNECTED')) {
        errorMessage = '网络连接已断开，请检查网络连接';
      } else if (error.message?.includes('ERR_NAME_NOT_RESOLVED')) {
        errorMessage = 'DNS解析失败，请检查网络配置';
      } else if (error.message?.includes('fetch')) {
        errorMessage = 'API请求失败，可能是服务器未启动或配置错误';
      } else {
        errorMessage = `请求失败: ${error.message || '未知错误'}`;
      }
      
      // 只有真正的网络错误才标记为networkError
      const isRealNetworkError = error.code === 'NETWORK_ERROR' || 
                                error.message?.includes('ERR_INTERNET_DISCONNECTED') ||
                                error.message?.includes('ERR_NAME_NOT_RESOLVED');
      
      return {
        success: false,
        error: errorMessage,
        networkError: isRealNetworkError
      };
    }
    
    // 处理服务器返回的错误
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error || 
                        error.message || 
                        '服务器错误';
    return {
      success: false,
      error: errorMessage
    };
  }
};

// 导出API服务实例
export const apiService = new ApiService();
export default api;