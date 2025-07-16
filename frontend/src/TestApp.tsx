import React from 'react';
import { Layout, Card, Typography } from 'antd';

const { Header, Content } = Layout;
const { Title } = Typography;

const TestApp: React.FC = () => {
  console.log('TestApp 组件正在渲染...');
  
  return (
    <Layout style={{ minHeight: '100vh', background: '#1a1d29' }}>
      <Header style={{ 
        background: '#2a2d3a', 
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center'
      }}>
        <Title level={3} style={{ margin: 0, color: '#ffffff' }}>
          测试页面
        </Title>
      </Header>
      
      <Content style={{ padding: '24px', background: '#1a1d29' }}>
        <Card 
          title="测试组件"
          style={{
            background: '#2a2d3a',
            border: '1px solid #3a3d4a',
            borderRadius: '12px'
          }}
        >
          <p style={{ color: '#ffffff' }}>如果您能看到这个页面，说明React应用正常工作。</p>
          <p style={{ color: '#8b8d97' }}>当前时间: {new Date().toLocaleString('zh-CN')}</p>
        </Card>
      </Content>
    </Layout>
  );
};

export default TestApp;