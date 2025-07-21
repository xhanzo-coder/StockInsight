import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { AuthProvider } from './contexts/AuthContext';
import App from './App';
import './styles/global.css';

// Ant Design 深色主题配置
const darkTheme = {
  token: {
    colorPrimary: '#667eea',
    colorBgBase: '#1a1d29',
    colorBgContainer: '#2a2d3a',
    colorBgElevated: '#2a2d3a',
    colorBorder: '#3a3d4a',
    colorBorderSecondary: '#3a3d4a',
    colorText: '#ffffff',
    colorTextSecondary: '#8b8d97',
    colorTextTertiary: '#6b6d77',
    colorTextQuaternary: '#5b5d67',
    colorFill: '#3a3d4a',
    colorFillSecondary: '#2a2d3a',
    colorFillTertiary: '#222530',
    colorFillQuaternary: '#1a1d29',
    colorBgLayout: '#1a1d29',
    colorBgSpotlight: '#2a2d3a',
    colorBgMask: 'rgba(0, 0, 0, 0.45)',
    boxShadow: '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
    boxShadowSecondary: '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 6,
    borderRadiusXS: 4,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "SF Pro Display", Roboto, sans-serif',
    fontSize: 14,
    fontSizeLG: 16,
    fontSizeSM: 12,
    fontSizeXL: 20,
    lineHeight: 1.5,
    lineHeightLG: 1.5,
    lineHeightSM: 1.66,
    controlHeight: 32,
    controlHeightLG: 40,
    controlHeightSM: 24,
    controlHeightXS: 16,
    motion: true,
    motionDurationFast: '0.1s',
    motionDurationMid: '0.2s',
    motionDurationSlow: '0.3s',
    motionEaseInOut: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
    motionEaseInOutCirc: 'cubic-bezier(0.78, 0.14, 0.15, 0.86)',
    motionEaseOut: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
    motionEaseOutBack: 'cubic-bezier(0.12, 0.4, 0.29, 1.46)',
    motionEaseOutCirc: 'cubic-bezier(0.08, 0.82, 0.17, 1)',
    motionEaseOutQuint: 'cubic-bezier(0.23, 1, 0.32, 1)',
  },

  components: {
    Layout: {
      bodyBg: '#1a1d29',
      headerBg: '#2a2d3a',
      footerBg: '#2a2d3a',
      siderBg: '#2a2d3a',
      triggerBg: '#3a3d4a',
      triggerColor: '#ffffff',
      zeroTriggerBg: '#3a3d4a',
      zeroTriggerColor: '#ffffff',
    },
    Card: {
      colorBgContainer: '#2a2d3a',
      colorBorderSecondary: '#3a3d4a',
      colorTextHeading: '#ffffff',
      colorText: '#ffffff',
    },
    Table: {
      colorBgContainer: '#222530',
      colorText: '#ffffff',
      colorTextHeading: '#ffffff',
      colorBorderSecondary: '#3a3d4a',
      rowHoverBg: '#2a2d3a',
      headerBg: '#2a2d3a',
      headerColor: '#ffffff',
      headerSortActiveBg: '#333647',
      headerSortHoverBg: '#2e3140',
    },
    Input: {
      colorBgContainer: '#2a2d3a',
      colorBorder: '#3a3d4a',
      colorText: '#ffffff',
      colorTextPlaceholder: '#8b8d97',
      activeBorderColor: '#667eea',
      hoverBorderColor: '#4a4d5a',
    },
    Select: {
      colorBgContainer: '#2a2d3a',
      colorBgElevated: '#2a2d3a',
      colorBorder: '#3a3d4a',
      colorText: '#ffffff',
      colorTextPlaceholder: '#8b8d97',
      optionSelectedBg: '#667eea',
      optionActiveBg: '#333647',
    },
    Button: {
      colorPrimary: '#667eea',
      colorPrimaryHover: '#5a6fd8',
      colorPrimaryActive: '#4e63d2',
      colorBgContainer: '#2a2d3a',
      colorBorder: '#3a3d4a',
      colorText: '#ffffff',
      colorTextLightSolid: '#ffffff',
      defaultBg: '#2a2d3a',
      defaultBorderColor: '#3a3d4a',
      defaultColor: '#ffffff',
      defaultHoverBg: '#333647',
      defaultHoverBorderColor: '#4a4d5a',
      defaultHoverColor: '#ffffff',
    },
    Message: {
      colorBgElevated: '#2a2d3a',
      colorText: '#ffffff',
      colorBorder: '#3a3d4a',
    },
    Tooltip: {
      colorBgSpotlight: '#2a2d3a',
      colorTextLightSolid: '#ffffff',
    },
    Popconfirm: {
      colorBgElevated: '#2a2d3a',
      colorText: '#ffffff',
      colorBorder: '#3a3d4a',
    },
    Pagination: {
      colorBgContainer: '#2a2d3a',
      colorText: '#ffffff',
      colorBorder: '#3a3d4a',
      itemActiveBg: '#667eea',
      itemLinkBg: '#2a2d3a',
      itemInputBg: '#2a2d3a',
    },
  },
};

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <ConfigProvider 
      locale={zhCN}
      theme={darkTheme}
    >
      <AuthProvider>
        <App />
      </AuthProvider>
    </ConfigProvider>
  </React.StrictMode>
);