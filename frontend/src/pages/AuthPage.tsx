import React, { useState } from 'react';
import Login from '../components/auth/Login';
import { Register } from '../components/auth/Register';
import '../components/auth/Auth.css';

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);

  const handleSwitchToRegister = () => {
    setIsLogin(false);
  };

  const handleSwitchToLogin = () => {
    setIsLogin(true);
  };

  const handleRegisterSuccess = () => {
    setIsLogin(true);
  };

  return (
    <div className="modern-auth-container">
      {/* 动态背景 */}
      <div className="grid-background"></div>
      <div className="gradient-overlay"></div>
      <div className="floating-shapes">
        <div className="shape"></div>
        <div className="shape"></div>
        <div className="shape"></div>
        <div className="shape"></div>
      </div>

      {/* 主容器 */}
      <div className="main-container">
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

        {/* 右侧登录/注册表单 */}
        <div className={isLogin ? "login-panel" : "register-panel"}>
          {isLogin ? (
            <Login onSwitchToRegister={handleSwitchToRegister} />
          ) : (
            <Register onSwitchToLogin={handleSwitchToLogin} onRegisterSuccess={handleRegisterSuccess} />
          )}
        </div>
      </div>
    </div>
  );
};