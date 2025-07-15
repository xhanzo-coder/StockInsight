import React, { useState, useEffect } from 'react';
import { Layout, Card, Button, message, Space, Typography, Divider } from 'antd';
import { ReloadOutlined, ClearOutlined, BarChartOutlined } from '@ant-design/icons';
import StatsCards from './components/StatsCards';
import SearchBox from './components/SearchBox';
import StockTable from './components/StockTable';
import { apiService, StockInfo, SearchResult } from './services/api';
import { handleApiError } from './utils/helpers';
import { frontendCache } from './utils/cache';
import './styles/global.css';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const App: React.FC = () => {
  const [stocks, setStocks] = useState<StockInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [apiStats, setApiStats] = useState<any>(null);

  // 获取关注列表
  const fetchWatchlist = async (showLoading = true, forceRefresh = false) => {
    if (showLoading) setLoading(true);
    try {
      const response = await apiService.getWatchlist(forceRefresh);
      if (response.success && response.data) {
        setStocks(response.data);
      } else {
        message.error('获取关注列表失败');
      }
    } catch (error) {
      console.error('获取关注列表失败:', error);
      message.error(handleApiError(error));
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // 获取API统计信息
  const fetchApiStats = async () => {
    try {
      const response = await apiService.getApiStats();
      if (response.success && response.data) {
        setApiStats(response.data);
      }
    } catch (error) {
      console.error('获取API统计失败:', error);
    }
  };

  // 添加股票到关注列表
  const handleAddStock = async (stock: SearchResult) => {
    try {
      const response = await apiService.addToWatchlist(stock.code);
      if (response.success) {
        message.success(`已添加 ${stock.name} 到关注列表`);
        // 强制刷新关注列表，确保获取最新数据
        await fetchWatchlist(false, true);
        await fetchApiStats(); // 同时更新统计信息
      } else {
        message.error(response.message || '添加失败');
      }
    } catch (error) {
      console.error('添加股票失败:', error);
      message.error(handleApiError(error));
    }
  };

  // 从关注列表移除股票
  const handleRemoveStock = async (code: string) => {
    try {
      const response = await apiService.removeFromWatchlist(code);
      if (response.success) {
        // 强制刷新关注列表，确保获取最新数据
        await fetchWatchlist(false, true);
        await fetchApiStats(); // 同时更新统计信息
        message.success('股票已从关注列表移除');
      } else {
        message.error(response.message || '移除失败');
      }
    } catch (error) {
      console.error('移除股票失败:', error);
      message.error(handleApiError(error));
    }
  };

  // 刷新数据
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // 强制刷新所有数据
      await Promise.all([
        fetchWatchlist(false, true),
        fetchApiStats()
      ]);
      message.success('数据已刷新');
    } catch (error) {
      message.error('刷新失败');
    } finally {
      setRefreshing(false);
    }
  };

  // 清空缓存
  const handleClearCache = async () => {
    try {
      // 清空前端缓存
      frontendCache.clear();
      
      // 清空后端缓存
      const response = await apiService.clearCache();
      if (response.success) {
        message.success('前端和后端缓存已清空');
        await fetchWatchlist(false);
        await fetchApiStats();
      } else {
        message.warning('后端缓存清空失败，但前端缓存已清空');
        await fetchWatchlist(false);
        await fetchApiStats();
      }
    } catch (error) {
      console.error('清空缓存失败:', error);
      // 即使后端清空失败，前端缓存也已清空
      message.warning('前端缓存已清空，后端缓存清空失败');
      await fetchWatchlist(false);
      await fetchApiStats();
    }
  };

  // 组件挂载时获取数据 - 优化加载策略
  useEffect(() => {
    const initData = async () => {
      // 先加载关键数据（关注列表）
      await fetchWatchlist();
      // 然后异步加载统计信息（非关键数据）
      setTimeout(() => {
        fetchApiStats();
      }, 100);
    };
    initData();
  }, []);

  // 定时刷新数据（每5分钟）
  useEffect(() => {
    const interval = setInterval(() => {
      fetchWatchlist(false);
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Layout style={{ minHeight: '100vh', background: '#1a1d29' }}>
      <Header style={{ 
        background: '#2a2d3a', 
        borderBottom: '1px solid #3a3d4a',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <BarChartOutlined style={{ fontSize: '1.5rem', color: '#667eea', marginRight: 12 }} />
          <Title level={3} style={{ margin: 0, color: '#ffffff' }}>
            股票数据看板
          </Title>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <SearchBox onSelectStock={handleAddStock} onAddStock={handleAddStock} />
          
          <Space>
            <Button 
              type="default" 
              icon={<ReloadOutlined />} 
              onClick={handleRefresh}
              loading={refreshing}
              style={{
                background: '#2a2d3a',
                borderColor: '#3a3d4a',
                color: '#ffffff'
              }}
            >
              刷新
            </Button>
            
            <Button 
              type="default" 
              icon={<ClearOutlined />} 
              onClick={handleClearCache}
              style={{
                background: '#2a2d3a',
                borderColor: '#3a3d4a',
                color: '#ffffff'
              }}
            >
              清空缓存
            </Button>
          </Space>
        </div>
      </Header>

      <Content style={{ padding: '24px', background: '#1a1d29' }}>
        <div className="main-container">
          {/* 统计卡片 */}
          <StatsCards stocks={stocks} loading={loading} />

          {/* 主要内容区域 */}
          <Card 
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>我的关注列表</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  {apiStats && (
                    <Text style={{ color: '#8b8d97', fontSize: '0.85rem' }}>
                      API调用: {apiStats.total_requests} | 缓存命中: {apiStats.cache_hits}
                    </Text>
                  )}
                  <Text style={{ color: '#8b8d97', fontSize: '0.85rem' }}>
                    共 {stocks.length} 只股票
                  </Text>
                </div>
              </div>
            }
            style={{
              background: '#2a2d3a',
              border: '1px solid #3a3d4a',
              borderRadius: '12px'
            }}
            bodyStyle={{ padding: 0 }}
          >
            <StockTable 
              stocks={stocks} 
              loading={loading} 
              onRemoveStock={handleRemoveStock}
            />
          </Card>

          {/* 页脚信息 */}
          <div className="footer-info" style={{ 
            textAlign: 'center', 
            marginTop: 32, 
            padding: 24,
            color: '#8b8d97',
            fontSize: '0.85rem'
          }}>
            <Divider style={{ borderColor: '#3a3d4a', margin: '16px 0' }} />
            <Space split={<span style={{ color: '#3a3d4a' }}>|</span>}>
              <span>数据来源: 东方财富 & 新浪财经</span>
              <span>更新频率: 实时数据</span>
              <span>缓存时间: 5分钟</span>
              <span>最后更新: {new Date().toLocaleString('zh-CN')}</span>
            </Space>
            <div style={{ marginTop: 16, fontSize: '0.8rem', color: '#6b7280' }}>
              <Space split={<span style={{ color: '#3a3d4a' }}>•</span>}>
                <span>支持A股主板、创业板、科创板</span>
                <span>提供实时价格、财务指标、估值分析</span>
                <span>智能股票筛选与关注列表管理</span>
              </Space>
            </div>
            <div style={{ marginTop: 12, fontSize: '0.75rem', color: '#6b7280' }}>
              <Text style={{ color: '#ef4444' }}>风险提示：</Text>
              <span> 股市有风险，投资需谨慎。本系统仅供参考，不构成投资建议。</span>
            </div>
          </div>
        </div>
      </Content>
    </Layout>
  );
};

export default App;