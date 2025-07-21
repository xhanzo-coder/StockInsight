/**
 * 认证服务
 * 处理用户登录、注册、令牌管理等功能
 * 增强的错误处理和重试机制
 */

import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { message } from 'antd';
import { tokenManager } from './api';

// 认证API基础URL
// const AUTH_API_URL = 'http://localhost:5000/api/auth';
 
// 将硬编码URL改为使用环境变量
const AUTH_API_URL = process.env.REACT_APP_API_BASE_URL?.replace('/api', '/api/auth') || 'http://localhost:5000/api/auth';


// 本地存储键
const USER_INFO_KEY = 'userInfo';
const AUTH_LAST_VERIFIED_KEY = 'auth_last_verified';

// 配置常量
const REQUEST_TIMEOUT = 15000; // 请求超时时间（毫秒）
const MAX_RETRY_COUNT = 2; // 最大重试次数
const RETRY_DELAY = 1000; // 重试延迟（毫秒）

// 创建认证专用的 axios 实例
const authApi = axios.create({
  baseURL: AUTH_API_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求重试函数
const retryAuthRequest = async (config: AxiosRequestConfig, retryCount: number = 0): Promise<AxiosResponse> => {
  try {
    return await axios(config);
  } catch (error: any) {
    // 只有在网络错误或5xx服务器错误时重试
    const isNetworkError = !error.response;
    const isServerError = error.response && error.response.status >= 500;
    
    if ((isNetworkError || isServerError) && retryCount < MAX_RETRY_COUNT) {
      console.log(`认证请求失败，${RETRY_DELAY/1000}秒后重试 (${retryCount + 1}/${MAX_RETRY_COUNT})`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return retryAuthRequest(config, retryCount + 1);
    }
    
    throw error;
  }
};

// 添加请求拦截器 - 自动添加token到请求头
authApi.interceptors.request.use(
  (config) => {
    const token = tokenManager.getToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // 添加请求时间戳，用于调试
    config.headers = config.headers || {};
    config.headers['X-Request-Time'] = new Date().toISOString();
    
    // 记录请求信息（调试模式）
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔐 认证请求: ${config.method?.toUpperCase()} ${config.url}`, {
        headers: { ...config.headers, Authorization: token ? '已设置' : '未设置' },
        data: config.data,
        params: config.params
      });
    }
    
    return config;
  },
  (error) => {
    console.error('认证请求拦截器错误:', error);
    return Promise.reject(error);
  }
);

// 添加响应拦截器 - 处理token过期
authApi.interceptors.response.use(
  (response) => {
    // 记录响应信息（调试模式）
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ 认证响应成功: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data
      });
    }
    
    return response;
  },
  (error: AxiosError) => {
    // 获取请求配置和响应
    const { config, response } = error;
    
    // 记录错误信息（调试模式）
    if (process.env.NODE_ENV === 'development') {
      console.error(`❌ 认证请求失败: ${config?.method?.toUpperCase()} ${config?.url}`, {
        status: response?.status,
        data: response?.data,
        error: error.message
      });
    }
    
    // 处理401错误（未授权，通常是token过期或无效）
    if (response?.status === 401) {
      console.warn('认证请求收到401未授权响应');
      
      // 清除认证相关数据
      tokenManager.removeToken();
      localStorage.removeItem(USER_INFO_KEY);
      localStorage.removeItem(AUTH_LAST_VERIFIED_KEY);
      
      // 如果不是验证接口的请求，显示提示并重定向
      if (config?.url !== '/verify') {
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
    
    return Promise.reject(error);
  }
);

// 用户数据类型
export interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
  last_login?: string;
}

// 登录请求数据
export interface LoginRequest {
  username: string;
  password: string;
}

// 注册请求数据
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

// 认证响应数据
export interface AuthResponse {
  user: User;
  token: string; // 后端返回的是token字段，而不是access_token
}

// API 响应格式
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  networkError?: boolean;
}

// 认证服务类
export class AuthService {

  /**
   * 用户注册
   */
  async register(userData: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    try {
      // 使用重试机制发送请求
      const response = await retryAuthRequest({
        method: 'post',
        url: `${AUTH_API_URL}/register`,
        data: userData,
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = response.data;

      if (data.success && data.data) {
        // 保存令牌 - 后端返回的是token字段
        tokenManager.setToken(data.data.token);
        
        // 保存用户信息和验证时间
        localStorage.setItem(USER_INFO_KEY, JSON.stringify(data.data.user));
        localStorage.setItem(AUTH_LAST_VERIFIED_KEY, Date.now().toString());
        
        message.success('注册成功！');
        return data;
      } else {
        message.error(data.message || '注册失败');
        return data;
      }
    } catch (error: any) {
      console.error('注册失败:', error.response?.data || error.message);
      
      // 检查是否为网络错误
      const isNetworkError = !error.response;
      if (isNetworkError) {
        const errorMessage = '网络连接错误，请检查网络连接';
        message.error(errorMessage);
        return {
          success: false,
          message: errorMessage,
          networkError: true
        };
      }
      
      const errorMessage = error.response?.data?.message || '注册失败，请重试';
      message.error(errorMessage);
      return {
        success: false,
        message: errorMessage,
        error: error.message
      };
    }
  }

  /**
   * 用户登录
   */
  async login(credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    try {
      console.log('开始登录请求:', credentials);
      console.log('API URL:', AUTH_API_URL);
      
      // 使用重试机制发送请求
      const response = await retryAuthRequest({
        method: 'post',
        url: `${AUTH_API_URL}/login`,
        data: credentials,
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log('登录响应:', response.data);
      
      const data = response.data;

      if (data.success && data.data) {
        // 保存令牌到localStorage - 后端返回的是token字段
        tokenManager.setToken(data.data.token);
        
        // 保存用户信息和验证时间
        localStorage.setItem(USER_INFO_KEY, JSON.stringify(data.data.user));
        localStorage.setItem(AUTH_LAST_VERIFIED_KEY, Date.now().toString());
        
        // 检查是否有登录后重定向路径
        const redirectPath = sessionStorage.getItem('redirectAfterLogin');
        if (redirectPath) {
          console.log(`登录成功，将重定向到: ${redirectPath}`);
          sessionStorage.removeItem('redirectAfterLogin');
        }
        
        message.success('登录成功！');
        return data;
      } else {
        console.error('登录失败:', data.message);
        message.error(data.message || '登录失败');
        return data;
      }
    } catch (error: any) {
      console.error('登录请求异常:', error);
      console.error('错误响应:', error.response?.data);
      
      // 检查是否为网络错误
      const isNetworkError = !error.response;
      if (isNetworkError) {
        const errorMessage = '网络连接错误，请检查网络连接';
        message.error(errorMessage);
        return {
          success: false,
          message: errorMessage,
          networkError: true
        };
      }
      
      // 处理特定错误
      if (error.response?.status === 401) {
        const errorMessage = '用户名或密码错误';
        message.error(errorMessage);
        return {
          success: false,
          message: errorMessage,
          error: error.message
        };
      }
      
      const errorMessage = error.response?.data?.message || '登录失败，请重试';
      message.error(errorMessage);
      return {
        success: false,
        message: errorMessage,
        error: error.message
      };
    }
  }

  /**
   * 验证令牌
   */
  async verifyToken(): Promise<{ success: boolean; user?: User; networkError?: boolean }> {
    try {
      const token = tokenManager.getToken();
      if (!token) {
        console.log('没有找到token，无法验证');
        return { success: false };
      }

      console.log('开始验证token...', token.substring(0, 15) + '...');
      console.log('Token格式检查:', token.split('.').length === 3 ? '有效' : '无效');
      
      // 直接检查token是否有效
      if (!tokenManager.isAuthenticated()) {
        console.warn('本地token验证失败，可能已过期');
        tokenManager.removeToken();
        localStorage.removeItem(USER_INFO_KEY);
        localStorage.removeItem(AUTH_LAST_VERIFIED_KEY);
        return { success: false };
      }
      
      // 检查是否有本地存储的用户信息
      const storedUserInfo = localStorage.getItem(USER_INFO_KEY);
      let localUser: User | null = null;
      
      if (storedUserInfo) {
        try {
          localUser = JSON.parse(storedUserInfo);
          console.log('从本地存储恢复用户信息:', localUser);
        } catch (e) {
          console.error('解析本地用户信息失败:', e);
        }
      }
      
      // 使用重试机制发送请求
      console.log(`发送验证请求到: ${AUTH_API_URL}/verify`);
      const response = await retryAuthRequest({
        method: 'get',
        url: `${AUTH_API_URL}/verify`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000 // 降低超时时间，加快验证速度
      });
      
      // 请求拦截器会自动添加Authorization头
      const data = response.data;
      console.log('验证响应:', data);
      
      if (data.success && data.data && data.data.user) {
        console.log('Token验证成功，用户信息:', data.data.user);
        
        // 更新验证时间和用户信息
        localStorage.setItem(AUTH_LAST_VERIFIED_KEY, Date.now().toString());
        localStorage.setItem(USER_INFO_KEY, JSON.stringify(data.data.user));
        
        return { success: true, user: data.data.user };
      } else {
        console.log('Token验证失败，服务器返回:', data);
        tokenManager.removeToken();
        localStorage.removeItem(USER_INFO_KEY);
        localStorage.removeItem(AUTH_LAST_VERIFIED_KEY);
        return { success: false };
      }
    } catch (error: any) {
      console.error('令牌验证失败:', error);
      console.error('错误状态码:', error.response?.status);
      console.error('错误详情:', error.response?.data);
      
      // 检查是否为网络错误
      const isNetworkError = !error.response;
      if (isNetworkError) {
        console.warn('验证token: 网络错误，检查本地用户信息');
        
        // 网络错误时，如果有本地用户信息，尝试使用本地信息
        const storedUserInfo = localStorage.getItem(USER_INFO_KEY);
        if (storedUserInfo && tokenManager.isAuthenticated()) {
          try {
            const user = JSON.parse(storedUserInfo);
            console.log('网络错误，使用本地用户信息:', user);
            return {
              success: true,
              user: user,
              networkError: true
            };
          } catch (e) {
            console.error('解析本地用户信息失败:', e);
          }
        }
        
        return {
          success: false,
          networkError: true
        };
      }
      
      // 清除无效的token（除非是网络错误）
      if (!isNetworkError) {
        tokenManager.removeToken();
        localStorage.removeItem(USER_INFO_KEY);
        localStorage.removeItem(AUTH_LAST_VERIFIED_KEY);
      }
      
      return { success: false };
    }
  }

  /**
   * 获取用户资料
   */
  async getProfile(): Promise<{ success: boolean; user?: User; networkError?: boolean }> {
    try {
      const token = tokenManager.getToken();
      if (!token) {
        return { success: false };
      }

      // 使用重试机制发送请求
      const response = await retryAuthRequest({
        method: 'get',
        url: `${AUTH_API_URL}/profile`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // 请求拦截器会自动添加Authorization头
      const data = response.data;
      
      if (data.success && data.data && data.data.user) {
        // 更新用户信息和验证时间
        localStorage.setItem(USER_INFO_KEY, JSON.stringify(data.data.user));
        localStorage.setItem(AUTH_LAST_VERIFIED_KEY, Date.now().toString());
        
        return { success: true, user: data.data.user };
      } else {
        return { success: false };
      }
    } catch (error: any) {
      console.error('获取用户资料失败:', error);
      
      // 检查是否为网络错误
      const isNetworkError = !error.response;
      if (isNetworkError) {
        return {
          success: false,
          networkError: true
        };
      }
      
      // 如果是401错误，清除认证状态
      if (error.response?.status === 401) {
        tokenManager.removeToken();
        localStorage.removeItem(USER_INFO_KEY);
        localStorage.removeItem(AUTH_LAST_VERIFIED_KEY);
      }
      
      return { success: false };
    }
  }

  /**
   * 用户登出
   */
  async logout(): Promise<{ success: boolean; message?: string }> {
    try {
      const token = tokenManager.getToken();
      if (token) {
        try {
          // 可选：调用后端登出接口
          await authApi.post('/logout');
          // 注意：由于添加了请求拦截器，这里不需要手动添加Authorization头
          console.log('成功调用登出API');
        } catch (error) {
          console.warn('登出API调用失败，但会继续清除本地状态:', error);
        }
      }
      
      // 无论如何都要清除本地令牌和用户信息
      tokenManager.removeToken();
      localStorage.removeItem(USER_INFO_KEY);
      localStorage.removeItem(AUTH_LAST_VERIFIED_KEY);
      
      return { success: true, message: '已安全退出登录' };
    } catch (error: any) {
      console.error('登出过程出错:', error);
      
      // 即使出错，也要尝试清除本地状态
      try {
        tokenManager.removeToken();
        localStorage.removeItem(USER_INFO_KEY);
        localStorage.removeItem(AUTH_LAST_VERIFIED_KEY);
      } catch (e) {
        console.error('清除本地状态失败:', e);
      }
      
      return {
        success: false,
        message: '登出过程出错，但已清除本地登录状态'
      };
    }
  }

  /**
   * 检查是否已认证
   */
  isAuthenticated(): boolean {
    return tokenManager.isAuthenticated();
  }
  
  /**
   * 检查认证状态（本地检查，不发送网络请求）
   */
  checkAuthStatus(): { isAuthenticated: boolean; user: User | null } {
    const isAuthenticated = this.isAuthenticated();
    let user: User | null = null;
    
    // 如果有token，尝试从localStorage获取用户信息
    if (isAuthenticated) {
      try {
        const userInfo = localStorage.getItem(USER_INFO_KEY);
        if (userInfo) {
          user = JSON.parse(userInfo);
        }
      } catch (e) {
        console.error('解析用户信息失败:', e);
      }
    }
    
    return { isAuthenticated, user };
  }
}

export const authService = new AuthService();