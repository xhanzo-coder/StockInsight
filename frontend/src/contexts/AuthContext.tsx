/**
 * 认证上下文
 * 提供全局的用户状态管理
 * 使用 useReducer 管理复杂状态，提供更健壮的认证机制
 */

import React, { createContext, useContext, useEffect, useReducer, ReactNode } from 'react';
import { message } from 'antd';
import { authService, User } from '../services/authService';
import { tokenManager } from '../services/api';

// 认证状态类型
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  lastVerified: number | null; // 上次验证时间戳
  tokenRefreshInProgress: boolean; // 是否正在刷新token
  networkError: boolean; // 是否存在网络错误
}

// 认证操作类型
type AuthAction =
  | { type: 'AUTH_INIT' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User } }
  | { type: 'AUTH_FAILURE'; payload: { error: string } }
  | { type: 'AUTH_RESET' }
  | { type: 'SET_LOADING'; payload: { isLoading: boolean } }
  | { type: 'SET_NETWORK_ERROR'; payload: { networkError: boolean } }
  | { type: 'TOKEN_REFRESH_START' }
  | { type: 'TOKEN_REFRESH_END' };

// 认证上下文类型
interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  verifySession: () => Promise<boolean>; // 新增：验证会话有效性
}

// 创建认证上下文
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 初始状态
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  lastVerified: null,
  tokenRefreshInProgress: false,
  networkError: false
};

// 认证状态reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_INIT':
      return {
        ...state,
        isLoading: true,
        error: null,
        networkError: false
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        lastVerified: Date.now(),
        networkError: false
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload.error,
        lastVerified: Date.now()
      };
    case 'AUTH_RESET':
      return {
        ...initialState,
        isLoading: false
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload.isLoading
      };
    case 'SET_NETWORK_ERROR':
      return {
        ...state,
        networkError: action.payload.networkError
      };
    case 'TOKEN_REFRESH_START':
      return {
        ...state,
        tokenRefreshInProgress: true
      };
    case 'TOKEN_REFRESH_END':
      return {
        ...state,
        tokenRefreshInProgress: false
      };
    default:
      return state;
  }
};

// 本地存储键
const USER_INFO_KEY = 'userInfo';
const AUTH_LAST_VERIFIED_KEY = 'auth_last_verified';

// 认证提供者组件
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // 验证会话有效性
  const verifySession = async (): Promise<boolean> => {
    // 如果没有token，直接返回false
    const token = tokenManager.getToken();
    if (!token) {
      console.log('没有找到token，会话无效');
      return false;
    }

    // 检查token格式是否有效
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      console.warn('token格式无效，清除认证状态');
      await handleLogout(false);
      return false;
    }

    // 如果正在刷新token，等待完成
    if (state.tokenRefreshInProgress) {
      console.log('token刷新进行中，使用当前认证状态');
      return state.isAuthenticated;
    }

    // 检查token是否过期（通过解析JWT的payload）
    try {
      const payload = JSON.parse(atob(tokenParts[1]));
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        console.warn('token已过期，清除认证状态');
        await handleLogout(false);
        return false;
      }
    } catch (e) {
      console.warn('无法解析token payload:', e);
      // 继续验证，让服务器决定token是否有效
    }

    // 检查上次验证时间，如果在5分钟内验证过，直接返回当前状态
    const lastVerified = state.lastVerified || Number(localStorage.getItem(AUTH_LAST_VERIFIED_KEY)) || 0;
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    
    if (now - lastVerified < fiveMinutes && state.user) {
      console.log('会话在5分钟内已验证，跳过验证，直接使用当前状态');
      // 确保状态是已认证的
      if (!state.isAuthenticated && state.user) {
        console.log('状态不一致，更新认证状态为已认证');
        dispatch({ type: 'AUTH_SUCCESS', payload: { user: state.user } });
      }
      return true;
    }

    // 开始验证token
    console.log('开始验证token...');
    dispatch({ type: 'TOKEN_REFRESH_START' });
    
    try {
      console.log('验证会话有效性...');
      const result = await authService.verifyToken();
      
      if (result.success && result.user) {
        // 更新用户信息和验证时间
        console.log('会话验证成功，更新用户信息');
        dispatch({ type: 'AUTH_SUCCESS', payload: { user: result.user } });
        localStorage.setItem(USER_INFO_KEY, JSON.stringify(result.user));
        localStorage.setItem(AUTH_LAST_VERIFIED_KEY, Date.now().toString());
        return true;
      } else if (result.networkError) {
        // 网络错误时，如果有用户信息，保持认证状态
        console.warn('网络错误，检查本地用户信息');
        const storedUserInfo = localStorage.getItem(USER_INFO_KEY);
        if (storedUserInfo) {
          try {
            const parsedUserInfo = JSON.parse(storedUserInfo);
            console.log('使用本地存储的用户信息:', parsedUserInfo);
            dispatch({ type: 'AUTH_SUCCESS', payload: { user: parsedUserInfo } });
            dispatch({ type: 'SET_NETWORK_ERROR', payload: { networkError: true } });
            return true;
          } catch (e) {
            console.error('解析本地用户信息失败:', e);
          }
        }
        // 没有可用的用户信息，标记网络错误
        dispatch({ type: 'SET_NETWORK_ERROR', payload: { networkError: true } });
        message.error('网络连接错误，请检查网络连接');
        return state.isAuthenticated; // 网络错误时保持当前状态
      } else {
        // 验证失败，清除状态
        console.warn('会话验证失败，清除认证状态');
        await handleLogout(false);
        return false;
      }
    } catch (error) {
      console.error('会话验证出错:', error);
      
      // 网络错误时不清除本地状态，但标记网络错误
      if (error instanceof Error && error.message.includes('Network Error')) {
        console.warn('网络错误，保持当前认证状态');
        dispatch({ type: 'SET_NETWORK_ERROR', payload: { networkError: true } });
        message.error('网络连接错误，请检查网络连接');
        return state.isAuthenticated; // 网络错误时保持当前状态
      }
      
      // 其他错误清除状态
      console.warn('会话验证出错，清除认证状态');
      await handleLogout(false);
      return false;
    } finally {
      dispatch({ type: 'TOKEN_REFRESH_END' });
    }
  };

  // 初始化认证状态
  useEffect(() => {
    const initAuth = async () => {
      dispatch({ type: 'AUTH_INIT' });
      
      try {
        // 检查localStorage中是否有token
        if (tokenManager.isAuthenticated()) {
          console.log('发现本地存储的token，正在初始化认证状态...');
          
          // 尝试从localStorage恢复用户信息
          const storedUserInfo = localStorage.getItem(USER_INFO_KEY);
          if (storedUserInfo) {
            try {
              const parsedUserInfo = JSON.parse(storedUserInfo);
              console.log('从localStorage恢复用户信息:', parsedUserInfo);
              
              // 先设置用户信息，以便快速显示UI
              dispatch({ 
                type: 'AUTH_SUCCESS', 
                payload: { user: parsedUserInfo } 
              });
              
              // 然后异步验证token有效性
              verifySession().catch(error => {
                console.error('会话验证失败:', error);
              });
            } catch (e) {
              console.error('解析localStorage中的用户信息失败:', e);
              dispatch({ 
                type: 'AUTH_FAILURE', 
                payload: { error: '用户信息解析失败' } 
              });
            }
          } else {
            // 有token但没有用户信息，验证token
            const verified = await verifySession();
            if (!verified) {
              dispatch({ 
                type: 'AUTH_FAILURE', 
                payload: { error: '会话已过期' } 
              });
            }
          }
        } else {
          console.log('未找到token，用户未登录');
          dispatch({ type: 'AUTH_RESET' });
        }
      } catch (error) {
        console.error('初始化认证时出错:', error);
        dispatch({ 
          type: 'AUTH_FAILURE', 
          payload: { error: '认证初始化失败' } 
        });
      }
    };

    initAuth();
    
    // 设置定期验证会话的定时器（每15分钟）
    const sessionCheckInterval = setInterval(() => {
      if (tokenManager.isAuthenticated() && state.user) {
        console.log('定期验证会话...');
        verifySession().catch(error => {
          console.error('定期会话验证失败:', error);
        });
      }
    }, 15 * 60 * 1000);
    
    // 监听存储事件，实现多标签页同步
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'auth_token' && !event.newValue) {
        // 其他标签页删除了token，同步登出
        console.log('检测到其他标签页登出，同步登出状态');
        dispatch({ type: 'AUTH_RESET' });
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      clearInterval(sessionCheckInterval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // 处理登出逻辑
  const handleLogout = async (callApi: boolean = true): Promise<void> => {
    try {
      if (callApi) {
        // 调用后端登出API
        await authService.logout().catch(error => {
          console.warn('登出API调用失败:', error);
        });
      }
    } finally {
      // 无论API调用成功与否，都清除本地状态
      tokenManager.removeToken();
      localStorage.removeItem(USER_INFO_KEY);
      localStorage.removeItem(AUTH_LAST_VERIFIED_KEY);
      dispatch({ type: 'AUTH_RESET' });
    }
  };

  // 登录方法
  const login = async (username: string, password: string): Promise<boolean> => {
    dispatch({ type: 'AUTH_INIT' });
    
    try {
      const result = await authService.login({ username, password });
      
      if (result.success && result.data) {
        // 登录成功，更新状态
        dispatch({ 
          type: 'AUTH_SUCCESS', 
          payload: { user: result.data.user } 
        });
        
        // 保存用户信息到localStorage
        localStorage.setItem(USER_INFO_KEY, JSON.stringify(result.data.user));
        localStorage.setItem(AUTH_LAST_VERIFIED_KEY, Date.now().toString());
        
        message.success('登录成功！');
        return true;
      } else {
        // 登录失败，显示错误
        dispatch({ 
          type: 'AUTH_FAILURE', 
          payload: { error: result.message || '登录失败' } 
        });
        return false;
      }
    } catch (error: any) {
      console.error('登录过程出错:', error);
      
      // 网络错误特殊处理
      if (error.message && error.message.includes('Network Error')) {
        dispatch({ 
          type: 'SET_NETWORK_ERROR', 
          payload: { networkError: true } 
        });
        message.error('网络连接错误，请检查网络连接');
      } else {
        dispatch({ 
          type: 'AUTH_FAILURE', 
          payload: { error: '登录失败，请重试' } 
        });
      }
      
      return false;
    }
  };

  // 注册方法
  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    dispatch({ type: 'AUTH_INIT' });
    
    try {
      const result = await authService.register({ username, email, password });
      
      if (result.success && result.data) {
        // 注册成功，更新状态
        dispatch({ 
          type: 'AUTH_SUCCESS', 
          payload: { user: result.data.user } 
        });
        
        // 保存用户信息到localStorage
        localStorage.setItem(USER_INFO_KEY, JSON.stringify(result.data.user));
        localStorage.setItem(AUTH_LAST_VERIFIED_KEY, Date.now().toString());
        
        message.success('注册成功！');
        return true;
      } else {
        // 注册失败，显示错误
        dispatch({ 
          type: 'AUTH_FAILURE', 
          payload: { error: result.message || '注册失败' } 
        });
        return false;
      }
    } catch (error: any) {
      console.error('注册过程出错:', error);
      
      // 网络错误特殊处理
      if (error.message && error.message.includes('Network Error')) {
        dispatch({ 
          type: 'SET_NETWORK_ERROR', 
          payload: { networkError: true } 
        });
        message.error('网络连接错误，请检查网络连接');
      } else {
        dispatch({ 
          type: 'AUTH_FAILURE', 
          payload: { error: '注册失败，请重试' } 
        });
      }
      
      return false;
    }
  };

  // 登出方法
  const logout = async (): Promise<void> => {
    await handleLogout(true);
    message.success('已安全退出登录');
  };

  // 刷新用户信息
  const refreshUser = async (): Promise<void> => {
    if (!tokenManager.isAuthenticated() || !state.user) {
      return;
    }
    
    try {
      const result = await authService.getProfile();
      
      if (result.success && result.user) {
        // 更新用户信息
        dispatch({ 
          type: 'AUTH_SUCCESS', 
          payload: { user: result.user } 
        });
        
        // 更新localStorage中的用户信息
        localStorage.setItem(USER_INFO_KEY, JSON.stringify(result.user));
        localStorage.setItem(AUTH_LAST_VERIFIED_KEY, Date.now().toString());
      }
    } catch (error) {
      console.error('刷新用户信息失败:', error);
      
      // 网络错误不清除状态
      if (error instanceof Error && error.message.includes('Network Error')) {
        dispatch({ 
          type: 'SET_NETWORK_ERROR', 
          payload: { networkError: true } 
        });
        message.error('网络连接错误，请检查网络连接');
      }
    }
  };

  // 提供上下文值
  const contextValue: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    refreshUser,
    verifySession
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// 使用认证上下文的Hook
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};