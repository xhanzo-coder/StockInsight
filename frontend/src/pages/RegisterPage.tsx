/**
 * 注册页面
 * 使用AuthLayout布局
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import Toast from '../components/Toast';
import '../styles/AuthLayout.css';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [agreeTerms, setAgreeTerms] = useState<boolean>(false);

  // Toast状态
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setToastMessage('请输入用户名');
      setToastType('error');
      setShowToast(true);
      return;
    }
    
    if (!email.trim()) {
      setToastMessage('请输入邮箱');
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
    
    if (password !== confirmPassword) {
      setToastMessage('两次输入的密码不一致');
      setToastType('error');
      setShowToast(true);
      return;
    }
    
    if (!agreeTerms) {
      setToastMessage('请阅读并同意用户协议');
      setToastType('error');
      setShowToast(true);
      return;
    }

    setLoading(true);
    
    try {
      const response = await authService.register({ username, email, password });
      
      if (response.success) {
        setToastMessage('注册成功！正在跳转到登录页面...');
        setToastType('success');
        setShowToast(true);
        
        // 延迟跳转到登录页面
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 1500);
      } else {
        setToastMessage(response.message || '注册失败，请重试');
        setToastType('error');
        setShowToast(true);
      }
    } catch (error: any) {
      setToastMessage(error.message || '注册失败，请重试');
      setToastType('error');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  // 处理同意条款复选框点击
  const handleAgreeTermsClick = () => {
    setAgreeTerms(!agreeTerms);
  };

  // 处理社交登录按钮点击
  const handleSocialLoginClick = (e: React.MouseEvent, platform: string) => {
    e.preventDefault();
    setToastMessage(`${platform}功能开发中，敬请期待！`);
    setToastType('info');
    setShowToast(true);
  };

  // 处理登录链接点击
  const handleLoginClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate('/login');
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
        <div className="register-header">
          <div className="register-title">创建账户</div>
          <div className="register-subtitle">加入我们，开始您的投资之旅</div>
        </div>

        <form id="registerForm" onSubmit={handleSubmit}>
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
            <label className="form-label">邮箱</label>
            <div className="input-wrapper">
              <input 
                type="email" 
                className="form-input" 
                placeholder="请输入邮箱" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="new-password"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)' }}
              />
              <div className="input-icon">📧</div>
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

          <div className="form-group">
            <label className="form-label">确认密码</label>
            <div className="input-wrapper">
              <input 
                type={showConfirmPassword ? "text" : "password"} 
                className="form-input" 
                placeholder="请再次输入密码" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)' }}
              />
              <div 
                className="input-icon password-toggle" 
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? '👁️' : '🔒'}
              </div>
            </div>
          </div>

          <div className="form-options">
            <label className="agree-terms" onClick={handleAgreeTermsClick}>
              <div className={`custom-checkbox ${agreeTerms ? 'checked' : ''}`}></div>
              我已阅读并同意<button type="button" className="terms-link">用户协议</button>和<button type="button" className="privacy-link">隐私政策</button>
            </label>
          </div>

          <button type="submit" className="register-button" disabled={loading}>
            {loading ? (
              <>
                <div className="loading"></div>
                <span>注册中...</span>
              </>
            ) : (
              <span className="button-text">注册</span>
            )}
          </button>
        </form>

        <div className="social-login">
          <div className="divider">
            <span>或使用以下方式注册</span>
          </div>
          <div className="social-buttons">
            <button 
              type="button" 
              className="social-button"
              onClick={(e) => handleSocialLoginClick(e, '微信注册')}
            >
              <span>💬</span>
              微信注册
            </button>
            <button 
              type="button" 
              className="social-button"
              onClick={(e) => handleSocialLoginClick(e, '支付宝注册')}
            >
              <span>📱</span>
              支付宝注册
            </button>
          </div>
        </div>

        <div className="login-link">
          已有账号？<button type="button" className="login-button-link" onClick={handleLoginClick}>立即登录</button>
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

export default RegisterPage;