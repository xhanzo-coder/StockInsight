import React, { useState, useEffect } from 'react';
import { Modal, Select, Spin, message, Typography, Space, Button } from 'antd';
import { CloseOutlined, ReloadOutlined, FullscreenOutlined, FullscreenExitOutlined } from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { apiService, HistoryData } from '../services/api';
import { formatPrice, formatPercent } from '../utils/helpers';

const { Title, Text } = Typography;
const { Option } = Select;

interface StockChartProps {
  visible: boolean;
  onClose: () => void;
  stockCode: string;
  stockName: string;
}

interface ChartData {
  date: string;
  close: number;
  formattedDate: string;
}

const StockChart: React.FC<StockChartProps> = ({ visible, onClose, stockCode, stockName }) => {
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [period, setPeriod] = useState('1m');
  const [priceChange, setPriceChange] = useState<{ amount: number; percent: number } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 添加CSS动画样式
  const animationStyles = `
    @keyframes modalSlideIn {
      from {
        opacity: 0;
        transform: scale(0.8) translateY(-50px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }

    @keyframes modalSlideOut {
      from {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
      to {
        opacity: 0;
        transform: scale(0.8) translateY(-50px);
      }
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    @keyframes slideInFromRight {
      from {
        opacity: 0;
        transform: translateX(30px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    .stock-chart-modal .ant-modal-content {
      animation: modalSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      border: 1px solid #334155;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(20px);
      border-radius: 20px;
      overflow: hidden;
    }

    .stock-chart-modal .ant-modal-header {
      background: transparent;
      border-bottom: 1px solid #334155;
      padding: 0;
    }

    .stock-chart-modal .ant-modal-body {
      padding: 0;
    }

    .stock-chart-modal .ant-modal-close {
      display: none;
    }

    .chart-header-animation {
      animation: slideInFromRight 0.6s ease-out;
    }

    .price-badge {
      animation: slideInFromRight 0.8s ease-out;
    }

    .period-buttons {
      animation: slideInFromRight 1s ease-out;
    }
  `;

  // 将样式注入到head中
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = animationStyles;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // 时间周期选项
  const periodOptions = [
    { value: '1w', label: '1周' },
    { value: '1m', label: '1月' },
    { value: '3m', label: '3月' },
    { value: '6m', label: '6月' },
    { value: '1y', label: '1年' },
  ];

  // 获取股票历史数据
  const fetchStockHistory = async (code: string, selectedPeriod: string) => {
    if (!code) return;
    
    setLoading(true);
    try {
      const response = await apiService.getStockHistory(code, selectedPeriod);
      if (response.success && response.data) {
        // 转换数据格式
        const formattedData: ChartData[] = response.data.map((item: HistoryData) => ({
          date: item.date,
          close: item.close,
          formattedDate: formatDate(item.date),
        }));

        // 按日期排序
        formattedData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        setChartData(formattedData);

        // 计算价格变化
        if (formattedData.length >= 2) {
          const firstPrice = formattedData[0].close;
          const lastPrice = formattedData[formattedData.length - 1].close;
          const changeAmount = lastPrice - firstPrice;
          const changePercent = (changeAmount / firstPrice) * 100;
          setPriceChange({ amount: changeAmount, percent: changePercent });
        }
      } else {
        message.error(response.message || '获取历史数据失败');
        setChartData([]);
        setPriceChange(null);
      }
    } catch (error) {
      console.error('获取历史数据失败:', error);
      message.error('获取历史数据失败，请重试');
      setChartData([]);
      setPriceChange(null);
    } finally {
      setLoading(false);
    }
  };

  // 格式化日期显示
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}/${day}`;
  };

  // 自定义Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid #475569',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
          backdropFilter: 'blur(16px)',
          minWidth: '180px',
          transform: 'translateY(-10px)'
        }}>
          <div style={{ 
            color: '#f1f5f9', 
            marginBottom: '12px', 
            fontSize: '15px',
            fontWeight: 600,
            borderBottom: '1px solid #475569',
            paddingBottom: '10px',
            textAlign: 'center'
          }}>
            {data.date}
          </div>
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}>
            <div style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: '#60a5fa',
              boxShadow: '0 0 10px rgba(96, 165, 250, 0.6)'
            }}></div>
            <span style={{ 
              color: '#60a5fa', 
              fontSize: '18px', 
              fontWeight: 700,
              textShadow: '0 0 10px rgba(96, 165, 250, 0.3)'
            }}>
              ¥{formatPrice(data.close)}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  // 当模态框打开或股票代码/周期改变时获取数据
  useEffect(() => {
    if (visible && stockCode) {
      fetchStockHistory(stockCode, period);
    }
  }, [visible, stockCode, period]);

  // 处理周期变化
  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
  };

  // 刷新数据
  const handleRefresh = () => {
    fetchStockHistory(stockCode, period);
  };

  // 切换全屏
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <Modal
      title={null}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={isFullscreen ? '95vw' : '85vw'}
      style={{
        top: isFullscreen ? 10 : 50,
        maxWidth: isFullscreen ? 'none' : '1400px',
        height: isFullscreen ? '95vh' : 'auto'
      }}
      className="stock-chart-modal"
      destroyOnClose
      maskStyle={{
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(8px)'
      }}
      closable={false}
    >
      <div style={{ 
        height: isFullscreen ? '90vh' : '75vh',
        minHeight: '600px',
        display: 'flex', 
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
      }}>
        {/* 头部 */}
        <div style={{
          padding: '28px 32px',
          borderBottom: '1px solid #334155',
          background: 'linear-gradient(135deg, rgba(51, 65, 85, 0.3) 0%, rgba(30, 41, 59, 0.3) 100%)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start',
            minHeight: '80px'
          }}>
            {/* 左侧股票信息 */}
            <div style={{ flex: 1 }} className="chart-header-animation">
              <div style={{ 
                display: 'flex', 
                alignItems: 'baseline', 
                marginBottom: '16px',
                gap: '20px'
              }}>
                <Title level={1} style={{ 
                  color: '#f8fafc', 
                  margin: 0,
                  fontSize: '32px',
                  fontWeight: 700,
                  lineHeight: 1.2,
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                }}>
                  {stockName}
                </Title>
                <div style={{
                  padding: '6px 16px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                  border: '1px solid #64748b'
                }}>
                  <Text style={{ 
                    color: '#cbd5e1', 
                    fontSize: '16px',
                    fontWeight: 600,
                    letterSpacing: '0.5px'
                  }}>
                    {stockCode}
                  </Text>
                </div>
              </div>
              
              {priceChange && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '20px',
                  flexWrap: 'wrap'
                }} className="price-badge">
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px',
                    padding: '12px 20px',
                    borderRadius: '16px',
                    background: priceChange.amount >= 0 
                      ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(22, 163, 74, 0.1) 100%)' 
                      : 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%)',
                    border: `2px solid ${priceChange.amount >= 0 ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                    boxShadow: `0 8px 32px ${priceChange.amount >= 0 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                  }}>
                    <Text style={{ 
                      color: priceChange.amount >= 0 ? '#22c55e' : '#ef4444',
                      fontSize: '22px',
                      fontWeight: 800,
                      textShadow: `0 0 20px ${priceChange.amount >= 0 ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`
                    }}>
                      {priceChange.amount >= 0 ? '+' : ''}{formatPrice(priceChange.amount)}
                    </Text>
                    <Text style={{ 
                      color: priceChange.amount >= 0 ? '#22c55e' : '#ef4444',
                      fontSize: '18px',
                      fontWeight: 700
                    }}>
                      ({priceChange.amount >= 0 ? '+' : ''}{formatPercent(priceChange.percent)})
                    </Text>
                  </div>
                  
                  <div style={{
                    padding: '8px 16px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                    border: '1px solid #64748b',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
                  }}>
                    <Text style={{ 
                      color: '#e2e8f0', 
                      fontSize: '15px',
                      fontWeight: 600
                    }}>
                      {periodOptions.find(opt => opt.value === period)?.label}周期
                    </Text>
                  </div>
                </div>
              )}
            </div>

            {/* 右侧操作按钮 */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '16px',
              marginLeft: '32px'
            }} className="period-buttons">
              <div style={{
                display: 'flex',
                gap: '6px',
                padding: '6px',
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                borderRadius: '16px',
                border: '1px solid #475569',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
              }}>
                {periodOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => handlePeriodChange(option.value)}
                    style={{
                      padding: '10px 18px',
                      border: 'none',
                      borderRadius: '12px',
                      background: period === option.value 
                        ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' 
                        : 'transparent',
                      color: period === option.value ? '#ffffff' : '#94a3b8',
                      fontSize: '14px',
                      fontWeight: period === option.value ? 700 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      minWidth: '70px',
                      boxShadow: period === option.value ? '0 4px 20px rgba(59, 130, 246, 0.4)' : 'none',
                      textShadow: period === option.value ? '0 0 10px rgba(255, 255, 255, 0.3)' : 'none'
                    }}
                    onMouseEnter={(e) => {
                      if (period !== option.value) {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #475569 0%, #334155 100%)';
                        e.currentTarget.style.color = '#f1f5f9';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.3)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (period !== option.value) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#94a3b8';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              
              <button
                onClick={toggleFullscreen}
                style={{
                  padding: '12px',
                  border: '1px solid #64748b',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                  color: '#e5e7eb',
                  fontSize: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #64748b 0%, #475569 100%)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #475569 0%, #334155 100%)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)';
                }}
              >
                {isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
              </button>
              
              <button
                onClick={handleRefresh}
                disabled={loading}
                style={{
                  padding: '12px 24px',
                  border: '1px solid #64748b',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                  color: '#e5e7eb',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  opacity: loading ? 0.6 : 1,
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #64748b 0%, #475569 100%)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #475569 0%, #334155 100%)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)';
                  }
                }}
              >
                <ReloadOutlined style={{ 
                  fontSize: '16px',
                  animation: loading ? 'spin 1s linear infinite' : 'none'
                }} />
                刷新
              </button>
              
              <button
                onClick={onClose}
                style={{
                  padding: '12px 24px',
                  border: '1px solid #dc2626',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  boxShadow: '0 4px 20px rgba(220, 38, 38, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #b91c1c 0%, #991b1b 100%)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 30px rgba(220, 38, 38, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(220, 38, 38, 0.3)';
                }}
              >
                <CloseOutlined style={{ fontSize: '16px' }} />
                关闭
              </button>
            </div>
          </div>
        </div>

        {/* 图表区域 */}
        <div style={{ 
          flex: 1, 
          padding: '32px',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          overflow: 'hidden'
        }}>
          {loading ? (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '100%',
              flexDirection: 'column',
              gap: '24px'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                border: '4px solid #334155',
                borderTop: '4px solid #60a5fa',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                boxShadow: '0 0 30px rgba(96, 165, 250, 0.3)'
              }}></div>
              <Text style={{ 
                color: '#cbd5e1', 
                fontSize: '18px', 
                fontWeight: 600,
                animation: 'pulse 2s ease-in-out infinite'
              }}>
                正在加载股票数据...
              </Text>
            </div>
          ) : chartData.length > 0 ? (
            <div style={{ 
              height: '100%',
              background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%)',
              borderRadius: '20px',
              padding: '32px',
              border: '1px solid #475569',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
              backdropFilter: 'blur(20px)'
            }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 30, right: 40, left: 30, bottom: 30 }}
                >
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="#475569" 
                    strokeOpacity={0.4}
                    horizontal={true}
                    vertical={false}
                  />
                  <XAxis 
                    dataKey="formattedDate"
                    stroke="#94a3b8"
                    fontSize={13}
                    tickLine={false}
                    axisLine={false}
                    tick={{ 
                      fill: '#94a3b8', 
                      fontSize: 13,
                      fontWeight: 600
                    }}
                    tickMargin={15}
                  />
                  <YAxis 
                    stroke="#94a3b8"
                    fontSize={13}
                    tickLine={false}
                    axisLine={false}
                    tick={{ 
                      fill: '#94a3b8', 
                      fontSize: 13,
                      fontWeight: 600
                    }}
                    tickMargin={15}
                    tickFormatter={(value) => `¥${formatPrice(value)}`}
                    domain={['dataMin - 1', 'dataMax + 1']}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="close" 
                    stroke="#60a5fa"
                    strokeWidth={4}
                    dot={false}
                    activeDot={{ 
                      r: 8, 
                      fill: '#60a5fa',
                      stroke: '#1e40af',
                      strokeWidth: 3,
                      filter: 'drop-shadow(0 0 12px rgba(96, 165, 250, 0.8))'
                    }}
                    style={{
                      filter: 'drop-shadow(0 0 8px rgba(96, 165, 250, 0.4))'
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '100%',
              flexDirection: 'column',
              background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%)',
              borderRadius: '20px',
              border: '1px solid #475569',
              gap: '24px',
              backdropFilter: 'blur(20px)'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)'
              }}>
                <span style={{
                  fontSize: '40px',
                  filter: 'grayscale(1) opacity(0.7)'
                }}>📊</span>
              </div>
              <Text style={{ 
                color: '#f1f5f9', 
                fontSize: '22px', 
                fontWeight: 700,
                textAlign: 'center',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
              }}>
                暂无数据
              </Text>
              <Text style={{
                color: '#94a3b8',
                fontSize: '16px',
                textAlign: 'center',
                lineHeight: '1.6',
                marginBottom: '16px',
                maxWidth: '300px'
              }}>
                当前时间段内没有可用的股票数据，请尝试刷新或选择其他时间周期
              </Text>
              <Button 
                type="primary" 
                onClick={handleRefresh}
                size="large"
                style={{ 
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  borderColor: 'transparent',
                  height: '48px',
                  padding: '0 32px',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: 600,
                  boxShadow: '0 8px 25px rgba(59, 130, 246, 0.3)'
                }}
              >
                重新加载
              </Button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default StockChart;