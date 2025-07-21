import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Login.css';

interface LoginProps {
  onSwitchToRegister?: () => void;
  onLoginSuccess?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onSwitchToRegister, onLoginSuccess }) => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  
  // 组件加载时检查localStorage中是否有保存的用户名
  useEffect(() => {
    const rememberedUsername = localStorage.getItem('rememberedUsername');
    if (rememberedUsername) {
      setUsername(rememberedUsername);
      setRememberMe(true);
    }
  }, []);
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (!username.trim()) {
      setErrorMessage('请输入用户名');
      return;
    }
    
    if (!password.trim()) {
      setErrorMessage('请输入密码');
      return;
    }

    setLoading(true);
    
    try {
      // 实际登录逻辑
      const success = await login(username, password);
      if (success) {
        console.log('登录成功，准备跳转...');
        
        // 如果勾选了"记住我"，保存用户名到localStorage
        if (rememberMe) {
          localStorage.setItem('rememberedUsername', username);
        } else {
          localStorage.removeItem('rememberedUsername');
        }
        
        // 如果有回调函数，执行回调
        if (onLoginSuccess) {
          onLoginSuccess();
        } else {
          // 否则直接跳转到仪表盘
          navigate('/dashboard');
        }
      } else {
        setErrorMessage('登录失败，请检查用户名和密码');
        setLoading(false);
      }
    } catch (error: any) {
      setLoading(false);
      setErrorMessage(error.message || '登录失败，请重试');
    }
  };

  // 处理记住我复选框点击
  const handleRememberMeClick = () => {
    setRememberMe(!rememberMe);
  };

  // 处理忘记密码点击
  const handleForgotPasswordClick = (e: React.MouseEvent) => {
    e.preventDefault();
    alert('忘记密码功能开发中，请联系管理员！');
  };

  // 处理社交登录按钮点击
  const handleSocialLoginClick = (e: React.MouseEvent, platform: string) => {
    e.preventDefault();
    alert(`${platform}功能开发中，敬请期待！`);
  };

  // 处理注册链接点击
  const handleRegisterClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onSwitchToRegister) {
      onSwitchToRegister();
    } else {
      alert('注册功能开发中，敬请期待！');
    }
  };

  return (
    <>
      <div className="login-header">
        <div className="login-title">欢迎回来</div>
        <div className="login-subtitle">登录您的账户以继续使用</div>
      </div>

      {errorMessage && (
        <div className="error-message">
          {errorMessage}
        </div>
      )}

      <form id="loginForm" onSubmit={handleSubmit}>
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
        还没有账号？<button type="button" className="register-button" onClick={handleRegisterClick}>立即注册</button>
      </div>
    </>
  );
};

export default Login;