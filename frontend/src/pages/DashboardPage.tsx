/**
 * 股票数据看板页面
 * 完整的股票数据展示和管理功能
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Layout, message, Spin, Button, Space, Typography, Drawer, Alert, Card, Modal } from 'antd';
import { ReloadOutlined, PlusOutlined, LogoutOutlined, ToolOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { StockInfo, apiService } from '../services/api';
import SearchBox from '../components/SearchBox';
import StatsCards from '../components/StatsCards';
import StockTable from '../components/StockTable';
import { NetworkDiagnostic, NetworkDiagnosticResult } from '../utils/networkDiagnostic';
import '../styles/DashboardPage.css';

const { Content } = Layout;
const { Title } = Typography;

const DashboardPage: React.FC = () => {
  const { logout } = useAuth();
  const [stocks, setStocks] = useState<StockInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [diagnosticVisible, setDiagnosticVisible] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState<NetworkDiagnosticResult[]>([]);
  const [diagnosticLoading, setDiagnosticLoading] = useState(false);

  // 获取关注列表
  const fetchWatchlist = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    
    console.log('=== DashboardPage 获取关注列表 ===');
    console.log('开始获取关注列表...');
    
    try {
      const response = await apiService.getWatchlist();
      console.log('关注列表响应:', response);
      
      if (response.success && response.data) {
        setStocks(response.data);
        console.log('关注列表更新成功，数量:', response.data.length);
      } else {
        const errorMsg = response.error || '获取关注列表失败';
        console.error('关注列表API返回失败:', errorMsg);
        message.error(errorMsg);
      }
    } catch (error: any) {
      console.error('获取关注列表异常:', error);
      
      let errorMessage = '获取关注列表失败，请重试';
      
      if (error.response) {
        // 服务器响应了错误状态码
        const status = error.response.status;
        const data = error.response.data;
        
        console.error('HTTP错误:', status, data);
        
        if (status === 401) {
          errorMessage = '认证失败，请重新登录';
        } else if (status === 403) {
          errorMessage = '权限不足';
        } else if (status === 500) {
          errorMessage = '服务器内部错误';
        } else if (data && data.message) {
          errorMessage = data.message;
        } else if (data && data.error) {
          errorMessage = data.error;
        }
      } else if (error.request) {
        // 请求已发出但没有收到响应
        console.error('请求错误详情:', {
          request: error.request,
          code: error.code,
          message: error.message,
          config: error.config,
          stack: error.stack
        });
        
        // 更精确地识别错误类型
        if (error.code === 'ECONNREFUSED') {
          errorMessage = '无法连接到服务器，请确认后端服务已启动（端口5000）';
        } else if (error.code === 'NETWORK_ERROR') {
          errorMessage = '网络连接错误，请检查网络设置';
        } else if (error.code === 'TIMEOUT' || error.code === 'ECONNABORTED') {
          errorMessage = '请求超时，请稍后重试';
        } else if (error.message?.includes('CORS')) {
          errorMessage = 'CORS跨域错误，请检查后端CORS配置';
        } else if (error.message?.includes('ERR_INTERNET_DISCONNECTED')) {
          errorMessage = '网络连接已断开，请检查网络连接';
        } else if (error.message?.includes('ERR_NAME_NOT_RESOLVED')) {
          errorMessage = 'DNS解析失败，请检查网络配置';
        } else if (error.message?.includes('fetch')) {
          errorMessage = 'API请求失败，可能是服务器未启动或配置错误';
        } else {
          // 对于其他未知错误，提供更详细的信息
          errorMessage = `请求失败: ${error.message || '未知错误'}`;
          console.log('完整错误对象:', error);
        }
        
        // 只有在真正的网络连接问题时才显示网络诊断提示
        const isRealNetworkError = error.code === 'NETWORK_ERROR' || 
                                  error.message?.includes('ERR_INTERNET_DISCONNECTED') ||
                                  error.message?.includes('ERR_NAME_NOT_RESOLVED');
        
        if (isRealNetworkError) {
          setTimeout(() => {
            Modal.confirm({
              title: '网络连接失败',
              content: '检测到网络连接问题，是否运行网络诊断工具来帮助解决问题？',
              okText: '运行诊断',
              cancelText: '取消',
              onOk: () => {
                runNetworkDiagnostic();
              }
            });
          }, 1000);
        }
      } else {
        // 其他错误（如代码错误、配置错误等）
        console.error('其他类型错误:', error);
        if (error.message) {
          errorMessage = `应用错误: ${error.message}`;
        } else {
          errorMessage = '应用内部错误，请刷新页面重试';
        }
      }
      
      message.error(errorMessage);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

  // 刷新数据
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchWatchlist(false);
      message.success('数据已刷新');
    } catch (error) {
      message.error('刷新失败');
    } finally {
      setRefreshing(false);
    }
  };

  // 运行网络诊断
  const runNetworkDiagnostic = async () => {
    setDiagnosticLoading(true);
    setDiagnosticVisible(true);
    
    try {
      const results = await NetworkDiagnostic.runFullDiagnostic();
      setDiagnosticResults(results);
      
      const failedTests = results.filter(r => !r.success);
      if (failedTests.length === 0) {
        message.success('网络诊断完成，所有测试通过');
      } else {
        message.warning(`网络诊断完成，发现 ${failedTests.length} 个问题`);
      }
    } catch (error) {
      console.error('网络诊断失败:', error);
      message.error('网络诊断失败');
    } finally {
      setDiagnosticLoading(false);
    }
  };

  // 生成诊断报告
  const generateDiagnosticReport = () => {
    const report = NetworkDiagnostic.generateReport(diagnosticResults);
    
    // 创建下载链接
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `network-diagnostic-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    message.success('诊断报告已下载');
  };

  // 处理退出登录
  const handleLogout = async () => {
    if (window.confirm('确定要退出登录吗？')) {
      try {
        await logout();
        // 登出成功后会自动重定向
      } catch (error) {
        console.error('登出失败:', error);
        message.error('登出失败，请重试');
      }
    }
  };

  // 添加股票到关注列表
  const handleAddStock = async (stock: { code: string; name: string; industry?: string }) => {
    try {
      const response = await apiService.addToWatchlist(stock.code, stock.industry || '');
      if (response.success) {
        message.success(`已添加 ${stock.name} 到关注列表`);
        await fetchWatchlist(false); // 刷新列表
      } else {
        message.error(response.error || '添加失败');
      }
    } catch (error) {
      console.error('添加股票失败:', error);
      message.error('添加失败，请重试');
    }
  };

  // 从关注列表移除股票
  const handleRemoveStock = async (code: string) => {
    try {
      const response = await apiService.removeFromWatchlist(code);
      if (response.success) {
        message.success('已从关注列表移除');
        await fetchWatchlist(false); // 刷新列表
      } else {
        message.error(response.error || '移除失败');
      }
    } catch (error) {
      console.error('移除股票失败:', error);
      message.error('移除失败，请重试');
    }
  };

  // 处理抽屉状态变化
  const handleDrawerStateChange = (isOpen: boolean) => {
    setDrawerOpen(isOpen);
  };

  // 初始化加载数据
  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  return (
    <>
      <Content style={{ 
        padding: '0', /* 完全移除padding */
        margin: '0', /* 完全移除margin */
        minHeight: 'calc(100vh - 64px - 40px)', /* 减去header和footer高度 */
        background: '#1a1d29', /* 修复背景色为原来的深蓝灰色 */
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ 
          maxWidth: '1400px', 
          margin: '0 auto',
          width: '100%',
          flex: 1,
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* 页面标题、搜索框和操作栏 - 使用flexbox布局水平对齐 */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '8px 24px',
            paddingTop: '8px',
            marginBottom: '16px'
          }}>
            {/* 左侧标题 */}
            <h1 style={{ 
              margin: 0, 
              fontSize: '24px', 
              fontWeight: 'bold', 
              color: '#ffffff',
              flexShrink: 0,
              width: '180px'
            }}>
              股票数据看板
            </h1>
            
            {/* 中间搜索框 */}
            <div style={{ 
              flex: 1,
              display: 'flex',
              justifyContent: 'center'
            }}>
              <SearchBox 
                onSelectStock={handleAddStock}
                placeholder="搜索股票代码或名称，点击添加到关注列表"
              />
            </div>
            
            {/* 右侧按钮组 */}
            <div style={{
              width: '280px',
              display: 'flex',
              justifyContent: 'flex-end',
              flexShrink: 0,
              gap: '8px'
            }}>
              <Button 
                icon={<ToolOutlined />} 
                onClick={runNetworkDiagnostic}
                type="default"
                style={{
                  borderRadius: '6px'
                }}
              >
                网络诊断
              </Button>
              <Button 
                type="primary" 
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
                loading={refreshing}
                style={{
                  background: '#667eea',
                  borderColor: '#667eea',
                  borderRadius: '6px'
                }}
              >
                刷新数据
              </Button>
              <Button 
                icon={<LogoutOutlined />}
                onClick={handleLogout}
                style={{
                  background: '#ff4757',
                  borderColor: '#ff4757',
                  color: '#ffffff',
                  borderRadius: '6px'
                }}
              >
                退出登录
              </Button>
            </div>
          </div>

          {/* 统计卡片 */}
          <div style={{ 
            marginBottom: '16px',
            padding: '0 24px'
          }}>
            <StatsCards stocks={stocks} loading={loading} />
          </div>

          {/* 股票列表 */}
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            margin: '0 24px 24px 24px' /* 左右和底部margin */
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <Title level={4} style={{ margin: 0, color: '#ffffff' }}>
                我的关注列表
              </Title>
              <span style={{ color: '#888', fontSize: '14px' }}>
                API调用: {loading ? '加载中...' : `共 ${stocks.length} 只股票`}
              </span>
            </div>
            
            <div style={{ flex: 1 }}>
              {loading ? (
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  height: '200px'
                }}>
                  <Spin size="large" />
                </div>
              ) : (
                <StockTable 
                  stocks={stocks}
                  loading={refreshing}
                  onRemoveStock={handleRemoveStock}
                  onDrawerStateChange={handleDrawerStateChange}
                  onRefresh={fetchWatchlist}
                />
              )}
            </div>
          </div>
        </div>
      </Content>

      {/* 网络诊断抽屉 */}
      <Drawer
      title="网络连接诊断"
      placement="right"
      width={600}
      open={diagnosticVisible}
      onClose={() => setDiagnosticVisible(false)}
      extra={
        <Space>
          <Button onClick={runNetworkDiagnostic} loading={diagnosticLoading}>
            重新诊断
          </Button>
          {diagnosticResults.length > 0 && (
            <Button type="primary" onClick={generateDiagnosticReport}>
              下载报告
            </Button>
          )}
        </Space>
      }
    >
      {diagnosticLoading ? (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>正在进行网络诊断...</div>
        </div>
      ) : diagnosticResults.length > 0 ? (
        <div>
          <Alert
            message="诊断完成"
            description={`共进行了 ${diagnosticResults.length} 项测试，${diagnosticResults.filter(r => r.success).length} 项通过，${diagnosticResults.filter(r => !r.success).length} 项失败`}
            type={diagnosticResults.every(r => r.success) ? 'success' : 'warning'}
            style={{ marginBottom: 16 }}
          />
          
          {diagnosticResults.map((result, index) => (
            <Card 
              key={index} 
              size="small" 
              style={{ marginBottom: 12 }}
              title={
                <Space>
                  <span style={{ color: result.success ? '#52c41a' : '#ff4d4f' }}>
                    {result.success ? '✅' : '❌'}
                  </span>
                  {result.test}
                  {result.duration && (
                    <span style={{ color: '#666', fontSize: '12px' }}>
                      ({result.duration}ms)
                    </span>
                  )}
                </Space>
              }
            >
              <div style={{ marginBottom: 8 }}>
                <strong>结果:</strong> {result.message}
              </div>
              {result.details && (
                <div>
                  <strong>详情:</strong>
                  <pre style={{ 
                    background: '#f5f5f5', 
                    padding: '8px', 
                    borderRadius: '4px',
                    fontSize: '12px',
                    marginTop: '4px',
                    overflow: 'auto'
                  }}>
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                </div>
              )}
            </Card>
          ))}
          
          {diagnosticResults.some(r => !r.success) && (
            <Alert
              message="问题解决建议"
              description={
                <ul style={{ marginBottom: 0 }}>
                  <li>确认后端服务已启动 (python app.py)</li>
                  <li>检查端口5000是否被占用</li>
                  <li>确认防火墙设置允许访问端口5000</li>
                  <li>检查网络连接稳定性</li>
                  <li>尝试重启前端和后端服务</li>
                  <li>清除浏览器缓存</li>
                </ul>
              }
              type="info"
              style={{ marginTop: 16 }}
            />
          )}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '50px 0', color: '#666' }}>
          点击"重新诊断"开始网络连接测试
        </div>
      )}
    </Drawer>
    </>
  );
};

export default DashboardPage;