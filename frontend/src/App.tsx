import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Layout, Card, Button, message, Space, Typography, Divider, Switch, Tooltip, Dropdown } from 'antd';
import { ReloadOutlined, ClearOutlined, BarChartOutlined, ClockCircleOutlined, CheckCircleOutlined, DownloadOutlined } from '@ant-design/icons';
import { exportToExcel, exportToCSV } from './utils/exportUtils';
import StatsCards from './components/StatsCards';
import SearchBox from './components/SearchBox';
import StockTable from './components/StockTable';
import { apiService, StockInfo, SearchResult } from './services/api';
import { handleApiError } from './utils/helpers';
import { frontendCache } from './utils/cache';
import { stockCache, CACHE_KEYS } from './utils/stockCache';
import './styles/global.css';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const App: React.FC = () => {
  console.log('=== App组件开始渲染 ===');
  const [stocks, setStocks] = useState<StockInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [apiStats, setApiStats] = useState<any>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<number | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const autoRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  console.log('=== App组件状态初始化完成 ===');

  // 获取关注列表 - 集成智能缓存
  const fetchWatchlist = useCallback(async (showLoading = true, forceRefresh = false) => {
    if (showLoading) setLoading(true);
    
    try {
      console.log('开始获取关注列表数据...', { showLoading, forceRefresh });
      
      // 如果不是强制刷新，先尝试从缓存获取数据
      if (!forceRefresh) {
        const cacheInfo = stockCache.getCacheInfo<StockInfo[]>(CACHE_KEYS.WATCHLIST);
        if (cacheInfo) {
          console.log('使用缓存的关注列表数据，数据条数:', cacheInfo.data.length);
          setStocks(cacheInfo.data);
          setLastUpdateTime(cacheInfo.timestamp);
          setIsFromCache(true);
          if (showLoading) setLoading(false);
          
          // 后台静默更新
          setTimeout(() => {
            console.log('开始后台静默更新...');
            fetchWatchlistFromApi(false).catch(error => {
              console.error('后台静默更新失败:', error);
            });
          }, 100);
          return;
        } else {
          console.log('缓存中无数据，从API获取...');
        }
      } else {
        console.log('强制刷新模式，直接从API获取数据...');
      }
      
      // 从API获取数据
      await fetchWatchlistFromApi(showLoading);
    } catch (error) {
      console.error('获取关注列表失败:', error);
      message.error(handleApiError(error));
      if (showLoading) setLoading(false);
      
      // 尝试从缓存获取备用数据
      try {
        const cacheInfo = stockCache.getCacheInfo<StockInfo[]>(CACHE_KEYS.WATCHLIST);
        if (cacheInfo) {
          console.log('API失败，使用缓存备用数据');
          setStocks(cacheInfo.data);
          setLastUpdateTime(cacheInfo.timestamp);
          setIsFromCache(true);
          message.warning('网络异常，显示缓存数据');
        }
      } catch (cacheError) {
        console.error('获取缓存备用数据也失败:', cacheError);
      }
    }
  }, []);
  
  // 从API获取关注列表数据
  const fetchWatchlistFromApi = async (showLoading = true) => {
    try {
      console.log('正在调用API获取关注列表...');
      console.log('API基础URL:', '/api (通过代理转发到 http://localhost:5000/api)');
      const response = await apiService.getWatchlist(true); // 强制从API获取
      console.log('API响应成功:', response);
      
      if (response.success && response.data) {
        console.log('API返回数据成功，数据条数:', response.data.length);
        console.log('第一条数据详情:', response.data[0]);
        console.log('第一条数据的name字段:', response.data[0]?.name);
        setStocks(response.data);
        const now = Date.now();
        setLastUpdateTime(now);
        setIsFromCache(false);
        
        // 缓存数据
        stockCache.set(CACHE_KEYS.WATCHLIST, response.data);
        
        console.log('从API获取关注列表数据并已缓存');
      } else {
        console.error('API响应失败:', response);
        message.error(response.message || '获取关注列表失败');
      }
    } catch (error) {
      console.error('从API获取关注列表失败:', error);
      console.error('错误详情:', {
        message: (error as any)?.message,
        code: (error as any)?.code,
        response: (error as any)?.response?.data,
        status: (error as any)?.response?.status
      });
      throw error;
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // 获取API统计信息
  const fetchApiStats = useCallback(async () => {
    try {
      const response = await apiService.getApiStats();
      if (response.success && response.data) {
        setApiStats(response.data);
      }
    } catch (error) {
      console.error('获取API统计失败:', error);
    }
  }, []);

  // 添加股票到关注列表
  const handleAddStock = async (stock: SearchResult) => {
    try {
      const response = await apiService.addToWatchlist(stock.code);
      if (response.success) {
        message.success(`已添加 ${stock.name} 到关注列表`);
        // 清除缓存并强制刷新关注列表
        stockCache.remove(CACHE_KEYS.WATCHLIST);
        await fetchWatchlistFromApi(false);
        await fetchApiStats(); // 同时更新统计信息
      } else {
        message.error(response.message || '添加失败');
      }
    } catch (error) {
      console.error('添加股票失败:', error);
      message.error(handleApiError(error));
    }
  };

  // 处理Drawer状态变化
  const handleDrawerStateChange = (isOpen: boolean) => {
    setIsDrawerOpen(isOpen);
  };

  // 从关注列表移除股票
  const handleRemoveStock = async (code: string) => {
    try {
      const response = await apiService.removeFromWatchlist(code);
      if (response.success) {
        // 清除缓存并强制刷新关注列表
        stockCache.remove(CACHE_KEYS.WATCHLIST);
        await fetchWatchlistFromApi(false);
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
        fetchWatchlistFromApi(false),
        fetchApiStats()
      ]);
      message.success('数据已更新');
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
      stockCache.clear();
      
      // 清空后端缓存
      const response = await apiService.clearCache();
      if (response.success) {
        message.success('前端和后端缓存已清空');
        await fetchWatchlistFromApi(false);
        await fetchApiStats();
      } else {
        message.warning('后端缓存清空失败，但前端缓存已清空');
        await fetchWatchlistFromApi(false);
        await fetchApiStats();
      }
    } catch (error) {
      console.error('清空缓存失败:', error);
      // 即使后端清空失败，前端缓存也已清空
      message.warning('前端缓存已清空，后端缓存清空失败');
      await fetchWatchlistFromApi(false);
      await fetchApiStats();
    }
  };

  // 组件挂载时获取数据 - 优先使用缓存
  useEffect(() => {
    const initData = async () => {
      try {
        console.log('开始初始化数据加载...');
        // 优先从缓存加载数据，提升用户体验
        await fetchWatchlist(true, false); // 不强制刷新，优先使用缓存
        console.log('关注列表加载完成');
        // 然后异步加载统计信息（非关键数据）
        setTimeout(() => {
          fetchApiStats();
        }, 100);
      } catch (error) {
        console.error('初始化数据加载失败:', error);
        message.error('初始化失败，请刷新页面重试');
      }
    };
    initData();
  }, [fetchWatchlist, fetchApiStats]);

  // 检查是否为交易时间
  const isTradingTime = useCallback((): boolean => {
    const now = new Date();
    const day = now.getDay(); // 0=周日, 1=周一, ..., 6=周六
    const hour = now.getHours();
    const minute = now.getMinutes();
    const timeInMinutes = hour * 60 + minute;

    // 非工作日
    if (day === 0 || day === 6) {
      return false;
    }

    // 上午交易时间：9:30-11:30
    const morningStart = 9 * 60 + 30; // 9:30
    const morningEnd = 11 * 60 + 30;   // 11:30
    
    // 下午交易时间：13:00-15:00
    const afternoonStart = 13 * 60;    // 13:00
    const afternoonEnd = 15 * 60;      // 15:00

    return (timeInMinutes >= morningStart && timeInMinutes <= morningEnd) ||
           (timeInMinutes >= afternoonStart && timeInMinutes <= afternoonEnd);
  }, []);

  // 自动刷新数据
  useEffect(() => {
    // 清除现有的定时器
    if (autoRefreshTimerRef.current) {
      clearInterval(autoRefreshTimerRef.current);
      autoRefreshTimerRef.current = null;
    }

    // 如果自动刷新开启，则设置定时器
    if (autoRefresh) {
      autoRefreshTimerRef.current = setInterval(() => {
        // 只在交易时间内自动刷新
        if (isTradingTime()) {
          console.log('交易时间内自动刷新数据');
          fetchWatchlist(false);
        } else {
          console.log('非交易时间，跳过自动刷新');
        }
      }, 2 * 60 * 1000); // 交易时间内每2分钟刷新一次
    }

    return () => {
      if (autoRefreshTimerRef.current) {
        clearInterval(autoRefreshTimerRef.current);
      }
    };
  }, [fetchWatchlist, autoRefresh, isTradingTime]);

  return (
    <Layout style={{ minHeight: '100vh', background: '#1a1d29' }}>
      <Header style={{ 
        background: 'rgba(26, 29, 41, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid #3a3d4a',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        padding: '12px 0',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: isDrawerOpen ? -1 : 1000,
        opacity: isDrawerOpen ? 0 : 1,
        visibility: isDrawerOpen ? 'hidden' : 'visible',
        transition: 'opacity 0.3s ease, visibility 0.3s ease',
        width: '100%',
        height: 'auto'
      }}>
        <div style={{ 
          maxWidth: '1600px',
          margin: '0 auto',
          padding: '0 20px',
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          gap: '24px',
          flexWrap: 'wrap'
        }}>
          {/* 左侧：标题和搜索 */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '24px',
            flex: '1',
            minWidth: '300px'
          }}>
            <Title level={3} style={{ 
              margin: 0, 
              color: '#ffffff',
              fontSize: '1.5rem',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              whiteSpace: 'nowrap'
            }}>
              <BarChartOutlined style={{ marginRight: 8, color: '#667eea' }} />
              股票数据看板
            </Title>
            
            <div style={{ flex: 1, maxWidth: '400px' }}>
              <SearchBox onSelectStock={handleAddStock} onAddStock={handleAddStock} />
            </div>
          </div>

          {/* 右侧：状态和操作按钮 */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '16px',
            flexWrap: 'wrap'
          }}>
            {/* 数据状态指示器 */}
            {lastUpdateTime && (
              <Tooltip title={`数据更新时间: ${stockCache.formatTimestamp(lastUpdateTime)}`}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 6,
                  padding: '6px 12px',
                  background: isFromCache ? '#3a2d1a' : '#1a2d3a',
                  borderRadius: '8px',
                  border: `1px solid ${isFromCache ? '#4a3d2a' : '#2a3d4a'}`,
                  cursor: 'pointer'
                }}>
                  {isFromCache ? (
                    <ClockCircleOutlined style={{ color: '#f59e0b', fontSize: '14px' }} />
                  ) : (
                    <CheckCircleOutlined style={{ color: '#10b981', fontSize: '14px' }} />
                  )}
                  <Text style={{ 
                    color: isFromCache ? '#f59e0b' : '#10b981',
                    fontSize: '12px',
                    fontWeight: 500
                  }}>
                    {isFromCache ? '缓存数据' : '最新数据'}
                  </Text>
                  <Text style={{ 
                    color: '#8b8d97',
                    fontSize: '11px'
                  }}>
                    {stockCache.formatTimestamp(lastUpdateTime)}
                  </Text>
                </div>
              </Tooltip>
            )}
            
            <Space size="small">
              <Button 
                type="default" 
                icon={<ReloadOutlined spin={refreshing} />} 
                onClick={handleRefresh}
                loading={refreshing}
                size="small"
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
                size="small"
                style={{
                  background: '#2a2d3a',
                  borderColor: '#3a3d4a',
                  color: '#ffffff'
                }}
              >
                清空缓存
              </Button>

              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8,
                padding: '4px 8px',
                background: '#2a2d3a',
                borderRadius: '6px',
                border: '1px solid #3a3d4a'
              }}>
                <Text style={{ color: '#ffffff', fontSize: '12px' }}>
                  自动刷新:
                </Text>
                <Switch 
                  size="small" 
                  checked={autoRefresh} 
                  onChange={setAutoRefresh}
                  checkedChildren="开" 
                  unCheckedChildren="关"
                />
                {autoRefresh && isTradingTime() && (
                  <Text style={{ color: '#10b981', fontSize: '11px' }}>
                    (2分钟)
                  </Text>
                )}
                {autoRefresh && !isTradingTime() && (
                  <Text style={{ color: '#f59e0b', fontSize: '11px' }}>
                    (暂停)
                  </Text>
                )}
              </div>
            </Space>
          </div>
        </div>
      </Header>

      <Content style={{ 
        marginTop: '80px',
        padding: '24px 0',
        background: '#1a1d29',
        minHeight: 'calc(100vh - 80px)'
      }}>
        <div className="main-container">
          {/* 统计卡片 */}
          <StatsCards stocks={stocks} loading={loading} />

          {/* 主要内容区域 */}
          <Card 
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>我的关注列表</span>
                  {lastUpdateTime && (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 6,
                      padding: '2px 8px',
                      background: isFromCache ? '#3a2d1a' : '#1a2d3a',
                      borderRadius: '4px',
                      border: `1px solid ${isFromCache ? '#4a3d2a' : '#2a3d4a'}`
                    }}>
                      {isFromCache ? (
                        <ClockCircleOutlined style={{ color: '#f59e0b', fontSize: '12px' }} />
                      ) : (
                        <CheckCircleOutlined style={{ color: '#10b981', fontSize: '12px' }} />
                      )}
                      <Text style={{ 
                        color: isFromCache ? '#f59e0b' : '#10b981',
                        fontSize: '12px',
                        fontWeight: 500
                      }}>
                        {isFromCache ? '缓存数据' : '最新数据'}
                      </Text>
                      <Text style={{ color: '#8b8d97', fontSize: '11px' }}>
                        {stockCache.formatTimestamp(lastUpdateTime)}
                      </Text>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <Dropdown menu={{ 
                    items: [
                      { key: 'excel', label: '导出为 Excel (.xlsx)', icon: <DownloadOutlined /> },
                      { key: 'csv', label: '导出为 CSV (.csv)', icon: <DownloadOutlined /> }
                    ],
                    onClick: ({ key }) => key === 'excel' ? exportToExcel(stocks, '股票关注列表') : exportToCSV(stocks, '股票关注列表')
                  }} placement="bottomRight">
                    <Button 
                      type="default" 
                      icon={<DownloadOutlined />} 
                      size="small"
                      style={{
                        background: '#2a2d3a',
                        borderColor: '#3a3d4a',
                        color: '#667eea'
                      }}
                    >
                      导出数据
                    </Button>
                  </Dropdown>
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
            {stocks.length === 0 && !loading ? (
              <div style={{ padding: '48px', textAlign: 'center', color: '#8b8d97' }}>
                <p style={{ fontSize: '1.1rem', marginBottom: '16px' }}>您的关注列表为空</p>
                <p>使用顶部的搜索框添加股票开始监控吧！</p>
              </div>
            ) : (
              <StockTable 
                stocks={stocks} 
                loading={loading} 
                onRemoveStock={handleRemoveStock}
                onDrawerStateChange={handleDrawerStateChange}
              />
            )}
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