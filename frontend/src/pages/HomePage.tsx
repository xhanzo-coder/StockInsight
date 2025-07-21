/**
 * 主页组件
 * 全屏网页样式，不使用容器限制
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/HomePage.css';

interface HomePageProps {
  isLoggedIn: boolean;
  userInfo?: {
    username: string;
    email?: string;
  };
}

const HomePage: React.FC<HomePageProps> = ({ isLoggedIn, userInfo }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLoginClick = () => {
    navigate('/auth');
  };

  const handleDashboardClick = () => {
    navigate('/dashboard');
  };

  const handleLogout = async () => {
    try {
      await logout();
      // 登出成功后会自动重定向到首页
    } catch (error) {
      console.error('登出失败:', error);
    }
  };

  return (
    <div className="homepage">
      {/* 动态背景 */}
      <div className="homepage-background">
        <div className="grid-pattern"></div>
        <div className="gradient-overlay"></div>
        <div className="floating-particles">
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
        </div>
      </div>

      {/* 顶部导航 */}
      <header className="homepage-header">
        <div className="header-content">
          <div className="brand-logo">
            <span className="logo-icon">📊</span>
            <span className="brand-name">StockInsight</span>
          </div>
          <nav className="header-nav">
            <div className="user-section">
              {isLoggedIn && userInfo && (
                <span className="user-info">
                  欢迎，{userInfo.username}
                </span>
              )}
              <button className="nav-button primary" onClick={isLoggedIn ? handleDashboardClick : handleLoginClick}>
                进入仪表盘
              </button>
              {isLoggedIn && (
                <button className="nav-button secondary" onClick={handleLogout}>
                  退出登录
                </button>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* 主要内容区域 */}
      <main className="homepage-main">
        <div className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">
              智能股票分析平台
              <span className="title-highlight">StockInsight</span>
            </h1>
            <p className="hero-subtitle">
              为您的投资决策提供专业的数据支持和深度洞察
              <br />
              实时行情 · 智能分析 · 精准预测
            </p>
            <div className="hero-actions">
              <button className="cta-button primary" onClick={isLoggedIn ? handleDashboardClick : handleLoginClick}>
                进入仪表盘
              </button>
            </div>
          </div>
        </div>

        {/* 特性展示区域 */}
        <section className="features-section">
          <div className="features-container">
            <h2 className="section-title">核心功能</h2>
            <div className="features-grid">
              <div className="feature-item">
                <div className="feature-icon">📈</div>
                <h3 className="feature-title">实时行情</h3>
                <p className="feature-description">
                  全球股市实时数据，毫秒级更新，把握每一个投资机会
                </p>
              </div>
              <div className="feature-item">
                <div className="feature-icon">🤖</div>
                <h3 className="feature-title">智能分析</h3>
                <p className="feature-description">
                  基于AI的股票分析和预测，为您的投资决策提供科学依据
                </p>
              </div>
              <div className="feature-item">
                <div className="feature-icon">📊</div>
                <h3 className="feature-title">数据可视化</h3>
                <p className="feature-description">
                  直观的图表展示，让复杂的数据变得简单易懂
                </p>
              </div>
              <div className="feature-item">
                <div className="feature-icon">🔒</div>
                <h3 className="feature-title">安全可靠</h3>
                <p className="feature-description">
                  银行级数据安全保护，确保您的投资信息安全无忧
                </p>
              </div>
              <div className="feature-item">
                <div className="feature-icon">⚡</div>
                <h3 className="feature-title">快速响应</h3>
                <p className="feature-description">
                  高性能系统架构，确保在高并发情况下依然稳定运行
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 统计数据区域 */}
        <section className="stats-section">
          <div className="stats-container">
            <div className="stat-card">
              <div className="stat-number">10,000+</div>
              <div className="stat-label">活跃用户</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">500+</div>
              <div className="stat-label">股票覆盖</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">99.9%</div>
              <div className="stat-label">系统稳定性</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">24/7</div>
              <div className="stat-label">全天候服务</div>
            </div>
          </div>
        </section>
      </main>

      {/* 底部 */}
      <footer className="homepage-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <span className="logo-icon">📊</span>
            <span className="brand-name">StockInsight</span>
          </div>
          <div className="footer-text">
            © 2024 StockInsight. 专业的股票数据分析平台
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;