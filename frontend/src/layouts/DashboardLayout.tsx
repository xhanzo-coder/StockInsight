/**
 * 主面板布局组件
 * 用于登录后的页面，包含导航栏
 */

import React from 'react';
import { Layout, Button, Typography, Dropdown, Avatar } from 'antd';
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/DashboardLayout.css';

const { Header, Content } = Layout;
const { Text } = Typography;

const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'profile',
      label: (
        <div style={{ padding: '8px 16px' }}>
          <div style={{ fontWeight: 'bold' }}>{user?.username}</div>
          <div style={{ fontSize: '12px', color: '#8b8d97' }}>{user?.email}</div>
        </div>
      ),
    },
    {
      key: 'logout',
      label: (
        <Button 
          type="text" 
          icon={<LogoutOutlined />} 
          onClick={handleLogout}
          style={{ width: '100%', textAlign: 'left' }}
        >
          退出登录
        </Button>
      ),
    },
  ];

  return (
    <Layout className="dashboard-layout">
      <Header className="dashboard-header">
        <div className="logo-container">
          <div className="logo-icon">📊</div>
          <div className="logo-text">StockInsight</div>
        </div>
        
        <div className="header-right">
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div className="user-info">
              <Avatar icon={<UserOutlined />} />
              <span className="username">{user?.username}</span>
            </div>
          </Dropdown>
        </div>
      </Header>
      
      <Content className="dashboard-content">
        <Outlet />
      </Content>
      
      <div className="dashboard-footer">
        <Text style={{ color: '#6b7280' }}>
          <span style={{ color: '#ef4444' }}>风险提示：</span>
          <span> 股市有风险，投资需谨慎。本系统仅供参考，不构成投资建议。</span>
        </Text>
      </div>
    </Layout>
  );
};

export default DashboardLayout;