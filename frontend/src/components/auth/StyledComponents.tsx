import styled, { css } from 'styled-components';
import { Input, Button, Form } from 'antd';

// 强制样式覆盖的基础样式
const inputBaseStyles = css`
  && {
    background: rgba(15, 23, 42, 0.6) !important;
    border: 1px solid rgba(59, 130, 246, 0.3) !important;
    border-radius: 8px !important;
    color: #ffffff !important;
    height: 48px !important;
    padding: 12px 16px !important;
    font-size: 16px !important;
    transition: all 0.2s ease !important;
    box-shadow: none !important;
  }

  &&:hover {
    border-color: rgba(59, 130, 246, 0.5) !important;
    background: rgba(15, 23, 42, 0.8) !important;
  }

  &&:focus,
  &&.ant-input-focused,
  &&.ant-input-affix-wrapper-focused {
    border-color: #3b82f6 !important;
    background: rgba(15, 23, 42, 0.9) !important;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2) !important;
    outline: none !important;
  }

  &&::placeholder {
    color: rgba(255, 255, 255, 0.5) !important;
  }

  && input {
    background: transparent !important;
    border: none !important;
    color: #ffffff !important;
    padding: 0 !important;
  }

  && input::placeholder {
    color: rgba(255, 255, 255, 0.5) !important;
  }

  && .ant-input {
    background: transparent !important;
    border: none !important;
    color: #ffffff !important;
    padding: 0 !important;
  }

  && .ant-input::placeholder {
    color: rgba(255, 255, 255, 0.5) !important;
  }

  && .anticon {
    color: rgba(59, 130, 246, 0.7) !important;
  }

  && .ant-input-suffix .anticon {
    color: rgba(59, 130, 246, 0.7) !important;
  }
`;

// 自定义输入框样式
export const StyledInput = styled(Input)`
  ${inputBaseStyles}
`;

// 自定义密码输入框样式
export const StyledPasswordInput = styled(Input.Password)`
  ${inputBaseStyles}
`;

// 自定义表单项样式
export const StyledFormItem = styled(Form.Item)`
  && {
    margin-bottom: 24px !important;
  }

  && .ant-form-item-label > label {
    color: rgba(255, 255, 255, 0.9) !important;
    font-size: 15px !important;
    font-weight: 600 !important;
    margin-bottom: 12px !important;
    letter-spacing: 0.5px !important;
  }

  && .ant-form-item-explain-error {
    color: #ef4444 !important;
    font-size: 13px !important;
    margin-top: 8px !important;
  }

  && .ant-form-item-has-error .ant-input,
  && .ant-form-item-has-error .ant-input-affix-wrapper {
    border-color: #ef4444 !important;
    background: rgba(239, 68, 68, 0.1) !important;
  }

  && .ant-form-item-has-error .ant-input:focus,
  && .ant-form-item-has-error .ant-input-affix-wrapper:focus {
    border-color: #ef4444 !important;
    box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2) !important;
  }
`;

// 自定义按钮样式
export const StyledButton = styled(Button)`
  && {
    width: 100% !important;
    height: 48px !important;
    background: linear-gradient(135deg, #3b82f6, #2563eb) !important;
    color: white !important;
    border: none !important;
    border-radius: 8px !important;
    font-size: 16px !important;
    font-weight: 600 !important;
    cursor: pointer !important;
    transition: all 0.3s ease !important;
    position: relative !important;
    overflow: hidden !important;
  }

  &&:hover {
    transform: translateY(-2px) !important;
    box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4) !important;
    background: linear-gradient(135deg, #2563eb, #1d4ed8) !important;
  }

  &&:focus {
    background: linear-gradient(135deg, #3b82f6, #2563eb) !important;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3) !important;
  }

  &&:active {
    transform: translateY(0) !important;
  }

  &&.ant-btn-loading {
    background: linear-gradient(135deg, #6b7280, #4b5563) !important;
  }

  && .ant-btn-loading-icon {
    color: white !important;
  }
`;

// 图标样式容器
export const IconWrapper = styled.span`
  color: rgba(59, 130, 246, 0.7) !important;
  font-size: 16px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
`;