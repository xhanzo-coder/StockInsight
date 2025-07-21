import React from 'react';
import { Input, Button, Form } from 'antd';

// 强制内联样式对象
const inputStyle: React.CSSProperties = {
  background: 'rgba(15, 23, 42, 0.6)',
  border: '1px solid rgba(59, 130, 246, 0.3)',
  borderRadius: '8px',
  color: '#ffffff',
  height: '48px',
  padding: '12px 16px',
  fontSize: '16px',
  transition: 'all 0.2s ease',
  boxShadow: 'none',
};

const inputFocusStyle: React.CSSProperties = {
  ...inputStyle,
  borderColor: '#3b82f6',
  background: 'rgba(15, 23, 42, 0.9)',
  boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.2)',
  outline: 'none',
};

const buttonStyle: React.CSSProperties = {
  width: '100%',
  height: '48px',
  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  fontSize: '16px',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
};

// 强制样式输入框组件
export const ForceStyledInput: React.FC<any> = (props) => {
  return (
    <Input
      {...props}
      style={inputStyle}
      onFocus={(e) => {
        Object.assign(e.target.style, inputFocusStyle);
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        Object.assign(e.target.style, inputStyle);
        props.onBlur?.(e);
      }}
    />
  );
};

// 强制样式密码输入框组件
export const ForceStyledPasswordInput: React.FC<any> = (props) => {
  return (
    <Input.Password
      {...props}
      style={inputStyle}
      onFocus={(e) => {
        Object.assign(e.target.style, inputFocusStyle);
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        Object.assign(e.target.style, inputStyle);
        props.onBlur?.(e);
      }}
    />
  );
};

// 强制样式按钮组件
export const ForceStyledButton: React.FC<any> = (props) => {
  return (
    <Button
      {...props}
      style={buttonStyle}
      onMouseEnter={(e) => {
        Object.assign(e.currentTarget.style, {
          ...buttonStyle,
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 25px rgba(59, 130, 246, 0.4)',
          background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
        });
        props.onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        Object.assign(e.currentTarget.style, buttonStyle);
        props.onMouseLeave?.(e);
      }}
    />
  );
};

// 图标包装器
export const ForceIconWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <span style={{ color: 'rgba(59, 130, 246, 0.7)', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {children}
    </span>
  );
};

// 表单项组件
export const ForceStyledFormItem: React.FC<any> = (props) => {
  return (
    <Form.Item
      {...props}
      style={{ marginBottom: '24px' }}
    />
  );
};