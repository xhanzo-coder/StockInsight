/**
 * 注册组件
 * 使用与登录页面一致的样式，确保良好的用户体验
 */

import React, { useState } from 'react';
import { message } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, WechatOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import './Login.css';

interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreement?: boolean;
}

interface RegisterProps {
  onSwitchToLogin: () => void;
  onRegisterSuccess?: () => void;
}

export const Register: React.FC<RegisterProps> = ({ onSwitchToLogin, onRegisterSuccess }) => {
  const [formData, setFormData] = useState<RegisterFormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreement: false,
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<RegisterFormData>>({});
  const { register } = useAuth();

  const validateForm = (): boolean => {
    const newErrors: Partial<RegisterFormData> = {};
    
    if (!formData.username.trim()) {
      newErrors.username = '请输入用户名';
    } else if (formData.username.length < 3) {
      newErrors.username = '用户名至少需要3个字符';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = '用户名只能包含字母、数字和下划线';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = '请输入邮箱地址';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '请输入有效的邮箱地址';
    }
    
    if (!formData.password) {
      newErrors.password = '请输入密码';
    } else if (formData.password.length < 6) {
      newErrors.password = '密码至少需要6个字符';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = '密码必须包含大小写字母和数字';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '请确认密码';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致';
    }
    
    if (!formData.agreement) {
      message.error('请同意用户协议和隐私政策');
      return false;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const success = await register(formData.username, formData.email, formData.password);
      if (success) {
        onRegisterSuccess?.();
      }
    } catch (error) {
      message.error('注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof RegisterFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleWechatRegister = () => {
    message.info('微信注册功能开发中，敬请期待！');
  };

  const handleUserAgreement = () => {
    message.info('用户协议页面开发中，敬请期待！');
  };

  const handlePrivacyPolicy = () => {
    message.info('隐私政策页面开发中，敬请期待！');
  };

  return (
    <>
      <div className="login-header">
        <div className="login-title">创建账户</div>
        <div className="login-subtitle">开始您的投资之旅</div>
      </div>

      <form id="registerForm" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">用户名</label>
          <div className="input-wrapper">
            <input 
              type="text" 
              className="form-input" 
              placeholder="请输入用户名" 
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              required
              autoComplete="off"
            />
            <div className="input-icon">👤</div>
          </div>
          {errors.username && <div className="error-message">{errors.username}</div>}
        </div>

        <div className="form-group">
          <label className="form-label">邮箱地址</label>
          <div className="input-wrapper">
            <input 
              type="email" 
              className="form-input" 
              placeholder="请输入邮箱地址" 
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              required
              autoComplete="off"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)' }}
            />
            <div className="input-icon">📧</div>
          </div>
          {errors.email && <div className="error-message">{errors.email}</div>}
        </div>

        <div className="form-group">
          <label className="form-label">密码</label>
          <div className="input-wrapper">
            <input 
              type={showPassword ? "text" : "password"} 
              className="form-input" 
              placeholder="请输入密码" 
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
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
          {errors.password && <div className="error-message">{errors.password}</div>}
        </div>

        <div className="form-group">
          <label className="form-label">确认密码</label>
          <div className="input-wrapper">
            <input 
              type={showConfirmPassword ? "text" : "password"} 
              className="form-input" 
              placeholder="请再次输入密码" 
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
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
          {errors.confirmPassword && <div className="error-message">{errors.confirmPassword}</div>}
        </div>

        <div className="form-options" style={{ justifyContent: 'flex-start', marginBottom: '30px' }}>
          <div className="remember-me">
            <div 
              className={`custom-checkbox ${formData.agreement ? 'checked' : ''}`}
              onClick={() => handleInputChange('agreement', !formData.agreement)}
              style={{ cursor: 'pointer' }}
            ></div>
            <span 
              style={{ color: 'rgba(255, 255, 255, 0.7)' }}
              onClick={() => handleInputChange('agreement', !formData.agreement)}
            >
              我同意并接受
              <button type="button" className="forgot-password" style={{ marginLeft: '5px' }} onClick={handleUserAgreement}>用户协议</button>
              和
              <button type="button" className="forgot-password" style={{ marginLeft: '5px' }} onClick={handlePrivacyPolicy}>隐私政策</button>
            </span>
          </div>
        </div>

        <button type="submit" className="login-button" disabled={loading}>
          {loading ? (
            <>
              <div className="loading"></div>
              <span>注册中...</span>
            </>
          ) : (
            <span className="button-text">创建账户</span>
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
            onClick={handleWechatRegister}
          >
            <span>💬</span>
            微信注册
          </button>
        </div>
      </div>

      <div className="register-link">
        已有账户？<button type="button" className="register-button" onClick={onSwitchToLogin}>立即登录</button>
      </div>
    </>
  );
};