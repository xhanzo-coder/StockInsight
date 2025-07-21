import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AuthPage } from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import HomePage from './pages/HomePage';
import { Spin } from 'antd';
import './App.css';

/**
 * App组件 - 应用入口点
 * 使用AuthContext进行认证管理
 */
const App: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <Spin size="large" />
        <div style={{ fontSize: '16px', color: '#8b8d97' }}>正在检查登录状态...</div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* 首页路由 */}
          <Route
            path="/"
            element={<HomePage isLoggedIn={isAuthenticated} userInfo={user || undefined} />}
          />
          
          {/* 认证页面路由 */}
          <Route
            path="/auth"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <AuthPage />
              )
            }
          />
          
          {/* 兼容旧的登录路由 */}
          <Route
            path="/login"
            element={<Navigate to="/auth" replace />}
          />
          
          {/* 兼容旧的注册路由 */}
          <Route
            path="/register"
            element={<Navigate to="/auth" replace />}
          />
          
          {/* 受保护的仪表盘路由 */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          
          {/* 默认重定向 */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;