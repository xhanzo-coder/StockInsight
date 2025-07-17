import React, { useState } from 'react';
import { Table, Button, message, Tooltip, Space } from 'antd';
import { DeleteOutlined, BarChartOutlined, PushpinOutlined, PushpinFilled } from '@ant-design/icons';
import type { ColumnsType, TableProps } from 'antd/es/table';
import { StockInfo, apiService } from '../services/api';
import StockChart from './StockChart';

interface StockTableProps {
  stocks: StockInfo[];
  loading?: boolean;
  onRemoveStock: (code: string) => void;
  onDrawerStateChange?: (isOpen: boolean) => void;
  onRefresh?: () => void;
}

const StockTable: React.FC<StockTableProps> = ({ 
  stocks, 
  loading = false, 
  onRemoveStock,
  onDrawerStateChange,
  onRefresh 
}) => {
  const [chartVisible, setChartVisible] = useState(false);
  const [selectedStock, setSelectedStock] = useState<{ code: string; name: string } | null>(null);
  const [pinLoading, setPinLoading] = useState<string>(''); // 记录正在切换置顶状态的股票代码
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // 计算动态表格高度
  const getTableHeight = () => {
    // 基础高度：表头(40px) + 每行(40px) + 底部间距(20px)
    const headerHeight = 40;
    const rowHeight = 40;
    const bottomPadding = 20;
    const calculatedHeight = headerHeight + (pageSize * rowHeight) + bottomPadding;
    
    // 设置最小高度和最大高度
    const minHeight = 200;
    const maxHeight = 600;
    
    return Math.max(minHeight, Math.min(maxHeight, calculatedHeight));
  };

  // 自定义排序图标
  const CustomSortIcon = ({ sortOrder }: { sortOrder?: 'ascend' | 'descend' | null }) => {
    if (sortOrder === 'ascend') {
      return <span style={{ color: '#1890ff' }}>↑</span>;
    }
    if (sortOrder === 'descend') {
      return <span style={{ color: '#1890ff' }}>↓</span>;
    }
    return <span style={{ color: '#bfbfbf' }}>↕</span>;
  };

  // 处理股票移除
  const handleRemove = async (code: string) => {
    try {
      await onRemoveStock(code);
    } catch (error) {
      console.error('移除股票失败:', error);
      message.error('移除失败，请重试');
    }
  };

  // 处理股票置顶切换
  const handleTogglePin = async (code: string) => {
    setPinLoading(code);
    try {
      const response = await apiService.togglePinStock(code);
      if (response.success) {
        message.success(response.message);
        onRefresh?.(); // 刷新列表以更新排序
      } else {
        message.error(response.error || '操作失败');
      }
    } catch (error) {
      console.error('切换置顶状态失败:', error);
      message.error('操作失败，请重试');
    } finally {
      setPinLoading('');
    }
  };

  // 处理股票名称点击，显示走势图
  const handleStockNameClick = (code: string, name: string) => {
    setSelectedStock({ code, name });
    setChartVisible(true);
    onDrawerStateChange?.(true);
  };

  // 关闭走势图
  const handleChartClose = () => {
    setChartVisible(false);
    setSelectedStock(null);
    onDrawerStateChange?.(false);
  };

  // 双击股票代码复制到剪贴板
  const handleCodeDoubleClick = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      message.success(`股票代码 ${code} 已复制到剪贴板`);
    } catch (error) {
      console.error('复制失败:', error);
      message.error('复制失败');
    }
  };

  // 表格列定义
  const columns: ColumnsType<StockInfo> = [
    {
      title: '股票信息',
      key: 'stock_info',
      width: 180,
      fixed: 'left',
      render: (_, record) => (
        <div>
          <div 
            style={{ 
              fontWeight: 'bold', 
              cursor: 'pointer',
              color: '#1890ff',
              marginBottom: '2px'
            }}
            onClick={() => handleStockNameClick(record.code, record.name)}
            title="点击查看走势图"
          >
            {record.name}
          </div>
          <div 
            style={{ 
              fontSize: '12px', 
              color: '#666',
              cursor: 'pointer'
            }}
            onDoubleClick={() => handleCodeDoubleClick(record.code)}
            title="双击复制代码"
          >
            {record.code}
          </div>
          <div style={{ fontSize: '11px', color: '#999' }}>
            {record.industry}
          </div>
        </div>
      ),
    },
    {
      title: '当前价格',
      dataIndex: 'current_price',
      key: 'current_price',
      width: 100,
      align: 'right',
      sorter: (a, b) => (a.current_price || 0) - (b.current_price || 0),
      sortIcon: CustomSortIcon,
      render: (value) => value ? `¥${value.toFixed(2)}` : '-',
    },
    {
      title: '涨跌幅',
      key: 'change',
      width: 120,
      align: 'right',
      sorter: (a, b) => (a.change_percent || 0) - (b.change_percent || 0),
      sortIcon: CustomSortIcon,
      render: (_, record) => {
        const changePercent = record.change_percent;
        const changeAmount = record.change_amount;
        if (changePercent === null || changePercent === undefined) return '-';
        
        const color = changePercent > 0 ? '#f5222d' : changePercent < 0 ? '#52c41a' : '#666';
        const prefix = changePercent > 0 ? '+' : '';
        
        return (
          <div style={{ color }}>
            <div>{prefix}{changePercent.toFixed(2)}%</div>
            {changeAmount && (
              <div style={{ fontSize: '11px' }}>
                {prefix}{changeAmount.toFixed(2)}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: '市值',
      dataIndex: 'market_cap',
      key: 'market_cap',
      width: 100,
      align: 'right',
      sorter: (a, b) => {
        const getNumericValue = (cap: string) => {
          if (!cap || cap === '-') return 0;
          const num = parseFloat(cap.replace(/[^\d.]/g, ''));
          if (cap.includes('万亿')) return num * 10000;
          if (cap.includes('千亿')) return num * 1000;
          if (cap.includes('亿')) return num;
          return num / 100;
        };
        return getNumericValue(a.market_cap || '') - getNumericValue(b.market_cap || '');
      },
      sortIcon: CustomSortIcon,
      render: (value) => value || '-',
    },
    {
      title: '市赚率',
      dataIndex: 'market_earning_ratio',
      key: 'market_earning_ratio',
      width: 90,
      align: 'right',
      sorter: (a, b) => (a.market_earning_ratio || 0) - (b.market_earning_ratio || 0),
      sortIcon: CustomSortIcon,
      render: (value) => value ? value.toFixed(2) : '-',
    },
    {
      title: (
        <Tooltip title="TTM市盈率">
          <span style={{ whiteSpace: 'nowrap' }}>TTM市盈率</span>
        </Tooltip>
      ),
      dataIndex: 'pe_ratio_ttm',
      key: 'pe_ratio_ttm',
      width: 100,
      align: 'right',
      sorter: (a, b) => (a.pe_ratio_ttm || 0) - (b.pe_ratio_ttm || 0),
      sortIcon: CustomSortIcon,
      render: (value) => value ? value.toFixed(2) : '-',
    },
    {
      title: 'ROE',
      dataIndex: 'roe',
      key: 'roe',
      width: 80,
      align: 'right',
      sorter: (a, b) => {
        const aValue = typeof a.roe === 'number' ? a.roe : 0;
        const bValue = typeof b.roe === 'number' ? b.roe : 0;
        return aValue - bValue;
      },
      sortIcon: CustomSortIcon,
      render: (value) => {
        if (typeof value === 'number') {
          return `${(value * 100).toFixed(2)}%`;
        }
        return value || '-';
      },
    },
    {
      title: '市净率',
      dataIndex: 'pb_ratio',
      key: 'pb_ratio',
      width: 90,
      align: 'right',
      sorter: (a, b) => (a.pb_ratio || 0) - (b.pb_ratio || 0),
      sortIcon: CustomSortIcon,
      render: (value) => value ? value.toFixed(2) : '-',
    },
    {
      title: (
        <Tooltip title="股利支付率">
          <span style={{ whiteSpace: 'nowrap' }}>股利支付率</span>
        </Tooltip>
      ),
      dataIndex: 'dividend_payout_ratio',
      key: 'dividend_payout_ratio',
      width: 110,
      align: 'right',
      sorter: (a, b) => {
        const aValue = typeof a.dividend_payout_ratio === 'number' ? a.dividend_payout_ratio : 0;
        const bValue = typeof b.dividend_payout_ratio === 'number' ? b.dividend_payout_ratio : 0;
        return aValue - bValue;
      },
      sortIcon: CustomSortIcon,
      render: (value) => {
        if (typeof value === 'number') {
          return `${(value * 100).toFixed(2)}%`;
        }
        return value || '-';
      },
    },
    {
      title: '修正系数',
      dataIndex: 'correction_factor',
      key: 'correction_factor',
      width: 100,
      align: 'right',
      sorter: (a, b) => (a.correction_factor || 0) - (b.correction_factor || 0),
      sortIcon: CustomSortIcon,
      render: (value) => value ? value.toFixed(2) : '-',
    },
    {
      title: (
        <Tooltip title="修正市赚率">
          <span style={{ whiteSpace: 'nowrap' }}>修正市赚率</span>
        </Tooltip>
      ),
      dataIndex: 'corrected_market_earning_ratio',
      key: 'corrected_market_earning_ratio',
      width: 110,
      align: 'right',
      sorter: (a, b) => (a.corrected_market_earning_ratio || 0) - (b.corrected_market_earning_ratio || 0),
      sortIcon: CustomSortIcon,
      render: (value) => value ? value.toFixed(2) : '-',
    },
    {
      title: '理论股价',
      dataIndex: 'theoretical_price',
      key: 'theoretical_price',
      width: 100,
      align: 'right',
      sorter: (a, b) => (a.theoretical_price || 0) - (b.theoretical_price || 0),
      sortIcon: CustomSortIcon,
      render: (value) => value ? `¥${value.toFixed(2)}` : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title={record.is_pinned ? "取消置顶" : "置顶"}>
            <Button
              type="text"
              size="small"
              icon={record.is_pinned ? <PushpinFilled /> : <PushpinOutlined />}
              loading={pinLoading === record.code}
              onClick={() => handleTogglePin(record.code)}
              style={{ 
                color: record.is_pinned ? '#f5222d' : '#666',
                padding: '0 4px'
              }}
            />
          </Tooltip>
          <Tooltip title="查看走势图">
            <Button
              type="text"
              size="small"
              icon={<BarChartOutlined />}
              onClick={() => handleStockNameClick(record.code, record.name)}
              style={{ color: '#1890ff', padding: '0 4px' }}
            />
          </Tooltip>
          <Tooltip title="移除">
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleRemove(record.code)}
              style={{ padding: '0 4px' }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // 表格配置
  const tableProps: TableProps<StockInfo> = {
    columns,
    dataSource: stocks,
    loading,
    rowKey: 'code',
    size: 'small',
    scroll: { x: 1400, y: getTableHeight() },
    pagination: {
      current: currentPage,
      pageSize: pageSize,
      showSizeChanger: true,
      showQuickJumper: true,
      showTotal: (total, range) => (
        <span style={{ color: '#8b8d97' }}>
          第 {range[0]}-{range[1]} 条，共 {total} 条
        </span>
      ),
      pageSizeOptions: ['10', '20', '50', '100'],
      size: 'default',
      className: 'custom-pagination',
      style: {
        marginTop: '16px',
        textAlign: 'center',
      },
      onChange: (page, size) => {
        console.log('分页变化:', { page, size });
        setCurrentPage(page);
        if (size !== pageSize) {
          setPageSize(size);
          setCurrentPage(1); // 改变页面大小时重置到第一页
        }
      },
      onShowSizeChange: (current, size) => {
        console.log('页面大小变化:', { current, size });
        setPageSize(size);
        setCurrentPage(1); // 改变页面大小时重置到第一页
      },
    },
    style: {
      backgroundColor: '#2a2d3a',
      borderRadius: '8px',
      overflow: 'hidden',
      border: '1px solid #3a3d4a',
    },
    onRow: (record) => ({
      onDoubleClick: () => {
        handleStockNameClick(record.code, record.name);
      },
    }),
  };

  return (
    <>
      <Table {...tableProps} />
      
      {chartVisible && selectedStock && (
        <StockChart
          visible={chartVisible}
          stockCode={selectedStock.code}
          stockName={selectedStock.name}
          onClose={handleChartClose}
        />
      )}
    </>
  );
};

export default StockTable;