/**
 * 路由保护组件
 * 用于保护需要认证的路由
 */

import React from 'react';
import { Spin } from 'antd';
import { useAuth } from '../../contexts/AuthContext';
import { AuthPage } from '../../pages/AuthPage';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  // 如果正在加载，显示加载状态
  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          backgroundColor: '#f5f5f5',
        }}
      >
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  // 如果未认证，显示登录页面
  if (!isAuthenticated) {
    return <AuthPage />;
  }

  // 如果已认证，显示受保护的内容
  return <>{children}</>;
};