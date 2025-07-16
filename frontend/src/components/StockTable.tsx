import React, { useState } from 'react';
import { Table, Button, Popconfirm, message, Tooltip } from 'antd';
import { DeleteOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { StockInfo } from '../services/api';
import { 
  formatPrice, 
  formatPercent, 
  formatNumber, 
  formatMarketCap,
  formatDividendRatio,
  formatROE
} from '../utils/helpers';

interface StockTableProps {
  stocks: StockInfo[];
  loading?: boolean;
  onRemoveStock: (code: string) => void;
}

const StockTable: React.FC<StockTableProps> = ({ stocks, loading = false, onRemoveStock }) => {
  const [sortedInfo, setSortedInfo] = useState<any>({});
  
  // 调试日志
  console.log('StockTable接收到的stocks数据:', stocks);
  console.log('stocks数组长度:', stocks.length);
  if (stocks.length > 0) {
    console.log('第一条股票数据:', stocks[0]);
    console.log('第一条股票的name字段:', stocks[0]?.name);
  }

  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    setSortedInfo(sorter);
  };
  
  // 自定义排序图标
  const customSorterIcon = (sortOrder: 'ascend' | 'descend' | undefined | null) => {
    if (sortOrder === 'ascend') {
      return <ArrowUpOutlined style={{ color: '#1890ff' }} />;
    }
    if (sortOrder === 'descend') {
      return <ArrowDownOutlined style={{ color: '#1890ff' }} />;
    }
    return null;
  };

  const handleRemove = async (code: string, name: string) => {
    try {
      await onRemoveStock(code);
      // 成功消息已在App组件中处理
    } catch (error) {
      message.error('移除失败，请重试');
    }
  };

  const columns = [
    {
      title: '股票信息',
      key: 'info',
      width: 180,
      render: (record: StockInfo) => {
        console.log('渲染股票信息:', record);
        console.log('股票名称:', record?.name);
        console.log('股票代码:', record?.code);
        return (
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 2, color: '#ffffff' }}>
              {record?.name || '未知股票'}
            </div>
            <div 
              style={{ 
                color: '#8b8d97', 
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
              title="双击复制股票代码"
              onDoubleClick={(e) => {
                e.stopPropagation();
                handleCodeDoubleClick(record?.code || '');
              }}
            >
              {record?.code || '000000'}
            </div>
          </div>
        );
      },
    },
    {
      title: '当前价格',
      dataIndex: 'current_price',
      key: 'current_price',
      width: 100,
      sorter: (a: StockInfo, b: StockInfo) => (a.current_price || 0) - (b.current_price || 0),
      sortOrder: sortedInfo.columnKey === 'current_price' ? sortedInfo.order : null,
      render: (price: number, record: StockInfo) => {
        console.log('渲染当前价格:', price, record);
        return (
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
            {formatPrice(price || 0)}
          </span>
        );
      },
    },
    {
      title: '涨跌幅',
      dataIndex: 'change_percent',
      key: 'change_percent',
      width: 100,
      sorter: (a: StockInfo, b: StockInfo) => (a.change_percent || 0) - (b.change_percent || 0),
      sortOrder: sortedInfo.columnKey === 'change_percent' ? sortedInfo.order : null,
      render: (percent: number, record: StockInfo) => {
        const isBold = Math.abs(percent) > 5;
        const percentClass = `${percent > 0 ? 'percent-up' : percent < 0 ? 'percent-down' : ''} ${isBold ? 'percent-bold' : ''}`;
        
        return (
          <div>
            <div className={percentClass} style={{ 
              display: 'flex',
              alignItems: 'center'
            }}>
              {percent > 0 ? <ArrowUpOutlined style={{ marginRight: 4 }} /> : 
               percent < 0 ? <ArrowDownOutlined style={{ marginRight: 4 }} /> : null}
              {formatPercent(percent)}
            </div>
            <div className={percent > 0 ? 'percent-up' : percent < 0 ? 'percent-down' : ''} style={{ fontSize: '0.8rem' }}>
              {formatPrice(record.change_amount)}
            </div>
          </div>
        );
      },
    },
    {
      title: '市值',
      dataIndex: 'market_cap',
      key: 'market_cap',
      width: 100,
      className: 'hide-mobile',
      sorter: (a: StockInfo, b: StockInfo) => {
        const aValue = typeof a.market_cap === 'string' ? parseFloat(a.market_cap.replace(/[^\d.]/g, '')) || 0 : a.market_cap || 0;
        const bValue = typeof b.market_cap === 'string' ? parseFloat(b.market_cap.replace(/[^\d.]/g, '')) || 0 : b.market_cap || 0;
        return aValue - bValue;
      },
      sortOrder: sortedInfo.columnKey === 'market_cap' ? sortedInfo.order : null,
      render: (marketCap: string, record: StockInfo) => {
        console.log('渲染市值:', marketCap, record);
        return (
          <span style={{ fontSize: '0.9rem' }}>
            {formatMarketCap(marketCap || '0')}
          </span>
        );
      },
    },
    {
      title: '市赚率',
      dataIndex: 'market_earning_ratio',
      key: 'market_earning_ratio',
      width: 80,
      className: 'hide-mobile',
      sorter: (a: StockInfo, b: StockInfo) => (a.market_earning_ratio || 0) - (b.market_earning_ratio || 0),
      sortOrder: sortedInfo.columnKey === 'market_earning_ratio' ? sortedInfo.order : null,
      render: (ratio: number, record: StockInfo) => {
        console.log('渲染市赚率:', ratio, record);
        return (
          <span style={{ fontSize: '0.9rem' }}>
            {formatNumber(ratio || 0)}
          </span>
        );
      },
    },
    {
      title: 'TTM市盈率',
      dataIndex: 'pe_ratio_ttm',
      key: 'pe_ratio_ttm',
      width: 100,
      sorter: (a: StockInfo, b: StockInfo) => (a.pe_ratio_ttm || 0) - (b.pe_ratio_ttm || 0),
      sortOrder: sortedInfo.columnKey === 'pe_ratio_ttm' ? sortedInfo.order : null,
      render: (pe: number, record: StockInfo) => {
        console.log('渲染TTM市盈率:', pe, record);
        return (
          <span style={{ 
            color: pe && pe < 15 ? '#22c55e' : pe && pe > 30 ? '#ef4444' : '#ffffff',
            fontSize: '0.9rem'
          }}>
            {formatNumber(pe || 0)}
          </span>
        );
      },
    },
    {
      title: 'ROE',
      dataIndex: 'roe',
      key: 'roe',
      width: 80,
      sorter: (a: StockInfo, b: StockInfo) => {
        const aValue = typeof a.roe === 'string' ? parseFloat(a.roe) || 0 : a.roe || 0;
        const bValue = typeof b.roe === 'string' ? parseFloat(b.roe) || 0 : b.roe || 0;
        return aValue - bValue;
      },
      sortOrder: sortedInfo.columnKey === 'roe' ? sortedInfo.order : null,
      render: (roe: number, record: StockInfo) => {
        console.log('渲染ROE:', roe, record);
        return (
          <span style={{ 
            color: roe && roe > 15 ? '#22c55e' : roe && roe < 5 ? '#ef4444' : '#ffffff',
            fontSize: '0.9rem'
          }}>
            {formatROE(roe || 0)}
          </span>
        );
      },
    },
    {
      title: '市净率',
      dataIndex: 'pb_ratio',
      key: 'pb_ratio',
      width: 80,
      className: 'hide-mobile',
      sorter: (a: StockInfo, b: StockInfo) => (a.pb_ratio || 0) - (b.pb_ratio || 0),
      sortOrder: sortedInfo.columnKey === 'pb_ratio' ? sortedInfo.order : null,
      render: (pb: number) => (
        <span style={{ fontSize: '0.9rem' }}>
          {formatNumber(pb)}
        </span>
      ),
    },
    {
      title: '股利支付率',
      dataIndex: 'dividend_payout_ratio',
      key: 'dividend_payout_ratio',
      width: 100,
      className: 'hide-mobile',
      sorter: (a: StockInfo, b: StockInfo) => {
        const aValue = typeof a.dividend_payout_ratio === 'string' ? parseFloat(a.dividend_payout_ratio) || 0 : a.dividend_payout_ratio || 0;
        const bValue = typeof b.dividend_payout_ratio === 'string' ? parseFloat(b.dividend_payout_ratio) || 0 : b.dividend_payout_ratio || 0;
        return aValue - bValue;
      },
      sortOrder: sortedInfo.columnKey === 'dividend_payout_ratio' ? sortedInfo.order : null,
      render: (ratio: number) => (
        <span style={{ fontSize: '0.9rem' }}>
          {formatDividendRatio(ratio)}
        </span>
      ),
    },
    {
      title: (
        <Tooltip title="修正系数 = 当前价格 / 理论股价">
          修正系数
        </Tooltip>
      ),
      dataIndex: 'correction_factor',
      key: 'correction_factor',
      width: 100,
      className: 'hide-mobile',
      sorter: (a: StockInfo, b: StockInfo) => (a.correction_factor || 0) - (b.correction_factor || 0),
      sortOrder: sortedInfo.columnKey === 'correction_factor' ? sortedInfo.order : null,
      render: (factor: number) => (
        <span style={{ 
          color: factor && factor < 0.8 ? '#22c55e' : factor && factor > 1.2 ? '#ef4444' : '#ffffff',
          fontSize: '0.9rem'
        }}>
          {formatNumber(factor)}
        </span>
      ),
    },
    {
      title: (
        <Tooltip title="修正市赚率 = 修正系数 × 市赚率">
          修正市赚率
        </Tooltip>
      ),
      dataIndex: 'corrected_market_earning_ratio',
      key: 'corrected_market_earning_ratio',
      width: 100,
      sorter: (a: StockInfo, b: StockInfo) => (a.corrected_market_earning_ratio || 0) - (b.corrected_market_earning_ratio || 0),
      sortOrder: sortedInfo.columnKey === 'corrected_market_earning_ratio' ? sortedInfo.order : null,
      render: (ratio: number) => (
        <span style={{ 
          color: ratio && ratio < 1.2 ? '#22c55e' : ratio && ratio > 2.5 ? '#ef4444' : '#ffffff',
          fontSize: '0.9rem'
        }}>
          {formatNumber(ratio)}
        </span>
      ),
    },
    {
      title: '理论股价',
      dataIndex: 'theoretical_price',
      key: 'theoretical_price',
      width: 100,
      className: 'hide-mobile',
      sorter: (a: StockInfo, b: StockInfo) => (a.theoretical_price || 0) - (b.theoretical_price || 0),
      sortOrder: sortedInfo.columnKey === 'theoretical_price' ? sortedInfo.order : null,
      render: (price: number) => (
        <span style={{ fontSize: '0.9rem' }}>
          {formatPrice(price)}
        </span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      fixed: 'right' as const,
      render: (record: StockInfo) => (
        <Popconfirm
          title="确定要移除这只股票吗？"
          onConfirm={() => handleRemove(record.code, record.name)}
          okText="确定"
          cancelText="取消"
          okButtonProps={{ danger: true }}
        >
          <Button 
            type="text" 
            danger 
            size="small"
            icon={<DeleteOutlined />}
            className="table-action-btn"
          >
            移除
          </Button>
        </Popconfirm>
      ),
    },
  ];

  // 处理双击股票代码复制到剪贴板
  const handleCodeDoubleClick = (code: string) => {
    navigator.clipboard.writeText(code)
      .then(() => {
        message.success(`股票代码 ${code} 已复制到剪贴板`);
      })
      .catch(() => {
        message.error('复制失败，请手动复制');
      });
  };

  return (
    <Table
      columns={columns}
      dataSource={stocks}
      rowKey="code"
      loading={loading}
      onChange={handleTableChange}
      pagination={{
        pageSize: 20,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
        style: { color: '#ffffff' }
      }}
      scroll={{ x: 1200, y: stocks.length > 10 ? 500 : undefined }}
      size="middle"
      style={{ 
        background: '#222530',
        borderRadius: '12px'
      }}
      onRow={(record) => ({
        onDoubleClick: () => handleCodeDoubleClick(record.code),
        onMouseEnter: (e) => {
          e.currentTarget.style.backgroundColor = '#2a2e3d';
        },
        onMouseLeave: (e) => {
          e.currentTarget.style.backgroundColor = '';
        }
      })}
      sticky={{ offsetHeader: 0 }}
      showSorterTooltip={false}

    />
  );
};

export default StockTable;