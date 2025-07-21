/**
 * 登录页面
 * 使用最简单的登录逻辑
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import Toast from '../components/Toast';
import '../styles/AuthLayout.css';

interface LoginPageProps {
  onLogin: (isLoggedIn: boolean) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  
  // Toast状态
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  // 处理登录
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setToastMessage('请输入用户名');
      setToastType('error');
      setShowToast(true);
      return;
    }
    
    if (!password.trim()) {
      setToastMessage('请输入密码');
      setToastType('error');
      setShowToast(true);
      return;
    }

    setLoading(true);
    
    try {
      const response = await authService.login({ username, password });
      
      if (response.success && response.data?.token) {
        // 保存token（使用与api.ts中tokenManager一致的键名）
        localStorage.setItem('auth_token', response.data.token);
        
        // 保存用户信息
        const userInfo = {
          username: username,
          email: response.data?.user?.email || undefined
        };
        localStorage.setItem('userInfo', JSON.stringify(userInfo));
        
        // 更新登录状态
        onLogin(true);
        
        // 显示成功提示
        setToastMessage('登录成功！正在跳转...');
        setToastType('success');
        setShowToast(true);
        
        // 延迟跳转，让用户看到成功提示
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 1500);
      } else {
        setToastMessage(response.message || '登录失败，请重试');
        setToastType('error');
        setShowToast(true);
      }
    } catch (error: any) {
      setToastMessage(error.message || '登录失败，请重试');
      setToastType('error');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  // 处理记住我复选框点击
  const handleRememberMeClick = () => {
    setRememberMe(!rememberMe);
  };

  // 处理忘记密码点击
  const handleForgotPasswordClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setToastMessage('忘记密码功能开发中，请联系管理员！');
    setToastType('info');
    setShowToast(true);
  };

  // 处理社交登录按钮点击
  const handleSocialLoginClick = (e: React.MouseEvent, platform: string) => {
    e.preventDefault();
    setToastMessage(`${platform}功能开发中，敬请期待！`);
    setToastType('info');
    setShowToast(true);
  };

  return (
    <div className="auth-layout">
      {/* 动态背景 */}
      <div className="grid-background"></div>
      <div className="gradient-overlay"></div>
      <div className="floating-shapes">
        <div className="shape"></div>
        <div className="shape"></div>
        <div className="shape"></div>
        <div className="shape"></div>
      </div>

      {/* 左侧内容 */}
      <div className="left-content">
        <div className="brand-section">
          <div className="brand-logo">
            <div className="logo-icon">📊</div>
            <div className="brand-title">StockInsight</div>
          </div>
          <div className="brand-subtitle">
            智能股票分析平台，为您的投资决策提供专业的数据支持和深度洞察
          </div>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📈</div>
            <div className="feature-title">精准分析</div>
            <div className="feature-desc">基于大数据的股票实时分析和预测</div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <div className="feature-title">实时数据</div>
            <div className="feature-desc">全球股市实时行情数据专业技术</div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <div className="feature-title">安全可靠</div>
            <div className="feature-desc">银行级数据安全，保护您的投资隐私</div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <div className="feature-title">快速响应</div>
            <div className="feature-desc">毫秒级数据更新，把握每一个投资机会</div>
          </div>
        </div>

        <div className="stats-section">
          <div className="stat-item">
            <span className="stat-number">10K+</span>
            <span className="stat-label">活跃用户</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">500+</span>
            <span className="stat-label">股票覆盖</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">99.9%</span>
            <span className="stat-label">系统稳定性</span>
          </div>
        </div>
      </div>

      {/* 右侧表单内容 */}
      <div className="auth-form-container">
        <div className="login-header">
          <div className="login-title">欢迎回来</div>
          <div className="login-subtitle">登录您的账户以继续使用</div>
        </div>

        <form id="loginForm" onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">用户名</label>
            <div className="input-wrapper">
              <input 
                type="text" 
                className="form-input" 
                placeholder="请输入用户名" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="new-password"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)' }}
              />
              <div className="input-icon">👤</div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">密码</label>
            <div className="input-wrapper">
              <input 
                type={showPassword ? "text" : "password"} 
                className="form-input" 
                placeholder="请输入密码" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)' }}
              />
              <div 
                className="input-icon password-toggle" 
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '👁️' : '🔒'}
              </div>
            </div>
          </div>

          <div className="form-options">
            <label className="remember-me" onClick={handleRememberMeClick}>
              <div className={`custom-checkbox ${rememberMe ? 'checked' : ''}`}></div>
              记住我
            </label>
            <button type="button" className="forgot-password" onClick={handleForgotPasswordClick}>忘记密码？</button>
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? (
              <>
                <div className="loading"></div>
                <span>登录中...</span>
              </>
            ) : (
              <span className="button-text">登录</span>
            )}
          </button>
        </form>

        <div className="social-login">
          <div className="divider">
            <span>或使用以下方式登录</span>
          </div>
          <div className="social-buttons">
            <button 
              type="button" 
              className="social-button"
              onClick={(e) => handleSocialLoginClick(e, '微信登录')}
            >
              <span>💬</span>
              微信登录
            </button>
            <button 
              type="button" 
              className="social-button"
              onClick={(e) => handleSocialLoginClick(e, '支付宝登录')}
            >
              <span>📱</span>
              支付宝登录
            </button>
          </div>
        </div>

        <div className="register-link">
          还没有账号？<button type="button" className="register-button">立即注册</button>
        </div>
      </div>

      {/* Toast 提示 */}
      <Toast
        isVisible={showToast}
        message={toastMessage}
        type={toastType}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
};

export default LoginPage;