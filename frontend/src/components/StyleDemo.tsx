import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Input, Spin, message } from 'antd';
import { 
  SearchOutlined, 
  RiseOutlined, 
  FallOutlined,
  DollarOutlined,
  BarChartOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
  InboxOutlined
} from '@ant-design/icons';
import '../styles/DashboardPage.css';

const StyleDemo: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [priceAnimation, setPriceAnimation] = useState('');
  const [valueUpdated, setValueUpdated] = useState(false);

  // 模拟价格变化动画
  const triggerPriceAnimation = (type: 'up' | 'down') => {
    setPriceAnimation(`animate-${type}`);
    setTimeout(() => setPriceAnimation(''), 600);
  };

  // 模拟数值更新动画
  const triggerValueUpdate = () => {
    setValueUpdated(true);
    setTimeout(() => setValueUpdated(false), 800);
  };

  // 模拟加载状态
  const triggerLoading = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      message.success('数据加载完成！');
    }, 2000);
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>样式演示页面</h1>
        <p>展示仪表盘页面的现代化样式设计和动画效果</p>
      </div>

      <div className="dashboard-search">
        <div className="search-box">
          <Input
            size="large"
            placeholder="搜索股票代码或名称..."
            prefix={<SearchOutlined />}
            suffix={
              <Button type="primary" icon={<SearchOutlined />}>
                搜索
              </Button>
            }
          />
        </div>
      </div>

      <div className="dashboard-content">
        <Row gutter={[24, 24]}>
          {/* 统计卡片演示 */}
          <Col xs={24} sm={12} md={6}>
            <div className="stats-card">
              <div className="stats-card-title">
                <DollarOutlined />
                关注股票
              </div>
              <div className={`stats-card-value ${valueUpdated ? 'updated' : ''}`}>
                128
              </div>
              <div className="stats-card-subtitle">
                <RiseOutlined style={{ color: '#2ecc71' }} />
                较昨日 +12
              </div>
            </div>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <div className="stats-card">
              <div className="stats-card-title">
                <BarChartOutlined />
                平均涨跌幅
              </div>
              <div className="stats-card-value">
                +2.34%
              </div>
              <div className="stats-card-subtitle">
                <RiseOutlined style={{ color: '#2ecc71' }} />
                市场表现良好
              </div>
            </div>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <div className="stats-card">
              <div className="stats-card-title">
                <RiseOutlined />
                强势股
              </div>
              <div className="stats-card-value">
                23
              </div>
              <div className="stats-card-subtitle">
                涨幅超过5%
              </div>
            </div>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <div className="stats-card">
              <div className="stats-card-title">
                <ReloadOutlined />
                最后更新
              </div>
              <div className="stats-card-value" style={{ fontSize: '18px' }}>
                刚刚
              </div>
              <div className="stats-card-subtitle">
                实时数据
              </div>
            </div>
          </Col>
        </Row>

        {/* 价格展示演示 */}
        <Row gutter={[24, 24]} style={{ marginTop: '32px' }}>
          <Col xs={24} md={12}>
            <Card title="价格动画演示" className="stats-card">
              <div className="stock-price">
                <div className={`price positive ${priceAnimation}`}>
                  ¥156.78
                </div>
                <div className="change positive">
                  +5.67 (+3.75%)
                </div>
              </div>
              <div style={{ marginTop: '16px' }}>
                <Button 
                  type="primary" 
                  onClick={() => triggerPriceAnimation('up')}
                  style={{ marginRight: '8px' }}
                >
                  上涨动画
                </Button>
                <Button 
                  onClick={() => triggerPriceAnimation('down')}
                >
                  下跌动画
                </Button>
              </div>
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Card title="数据卡片演示" className="stats-card">
              <div className="stock-details">
                <div className="detail-item">
                  <div className="detail-label">市盈率</div>
                  <div className="detail-value">15.67</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">市净率</div>
                  <div className="detail-value">2.34</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">ROE</div>
                  <div className="detail-value">18.9%</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">股息率</div>
                  <div className="detail-value">3.2%</div>
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* 状态演示 */}
        <Row gutter={[24, 24]} style={{ marginTop: '32px' }}>
          <Col xs={24} md={8}>
            <Card title="加载状态" className="stats-card">
              {loading ? (
                <div className="loading-container">
                  <div className="loading-spinner">
                    <Spin size="large" />
                  </div>
                  <div className="loading-text">正在加载数据...</div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <Button type="primary" onClick={triggerLoading}>
                    触发加载
                  </Button>
                </div>
              )}
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card title="错误状态" className="stats-card">
              <div className="error-container">
                <div className="error-icon">
                  <ExclamationCircleOutlined />
                </div>
                <div className="error-message">数据加载失败</div>
                <div className="error-description">
                  网络连接异常，请检查网络设置后重试
                </div>
                <div className="error-retry">
                  <Button type="primary">重新加载</Button>
                </div>
              </div>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card title="空状态" className="stats-card">
              <div className="empty-state">
                <div className="empty-icon">
                  <InboxOutlined />
                </div>
                <p>暂无数据</p>
                <div className="empty-action">
                  <Button type="primary">添加数据</Button>
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* 骨架屏演示 */}
        <Row gutter={[24, 24]} style={{ marginTop: '32px' }}>
          <Col xs={24} md={12}>
            <Card title="骨架屏效果" className="stats-card">
              <div className="skeleton-card">
                <div className="skeleton-line short"></div>
                <div className="skeleton-line medium"></div>
                <div className="skeleton-line long"></div>
                <div className="skeleton-line short"></div>
              </div>
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Card title="交互演示" className="stats-card">
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <Button 
                  type="primary" 
                  onClick={triggerValueUpdate}
                  style={{ marginBottom: '16px', display: 'block', width: '100%' }}
                >
                  触发数值更新动画
                </Button>
                <div className="popular-stocks">
                  <h3>热门股票</h3>
                  <div className="stock-tags">
                    <button>贵州茅台</button>
                    <button>腾讯控股</button>
                    <button>阿里巴巴</button>
                    <button>比亚迪</button>
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default StyleDemo;