import React, { useState } from 'react';
import { Table, Button, Popconfirm, message, Tooltip } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { StockInfo } from '../services/api';
import { 
  formatPrice, 
  formatPercent, 
  formatNumber, 
  formatMarketCap,
  formatDividendRatio,
  formatROE,
  getPriceColor
} from '../utils/helpers';

interface StockTableProps {
  stocks: StockInfo[];
  loading?: boolean;
  onRemoveStock: (code: string) => void;
}

const StockTable: React.FC<StockTableProps> = ({ stocks, loading = false, onRemoveStock }) => {
  const [sortedInfo, setSortedInfo] = useState<any>({});

  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    setSortedInfo(sorter);
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
      render: (record: StockInfo) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 2 }}>
            {record.name}
          </div>
          <div style={{ color: '#8b8d97', fontSize: '0.8rem' }}>
            {record.code}
          </div>
        </div>
      ),
    },
    {
      title: '当前价格',
      dataIndex: 'current_price',
      key: 'current_price',
      width: 100,
      sorter: (a: StockInfo, b: StockInfo) => (a.current_price || 0) - (b.current_price || 0),
      sortOrder: sortedInfo.columnKey === 'current_price' ? sortedInfo.order : null,
      render: (price: number) => (
        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
          {formatPrice(price)}
        </span>
      ),
    },
    {
      title: '涨跌幅',
      dataIndex: 'change_percent',
      key: 'change_percent',
      width: 100,
      sorter: (a: StockInfo, b: StockInfo) => (a.change_percent || 0) - (b.change_percent || 0),
      sortOrder: sortedInfo.columnKey === 'change_percent' ? sortedInfo.order : null,
      render: (percent: number, record: StockInfo) => (
        <div>
          <div style={{ color: getPriceColor(percent), fontWeight: 600 }}>
            {formatPercent(percent)}
          </div>
          <div style={{ color: getPriceColor(record.change_amount), fontSize: '0.8rem' }}>
            {formatPrice(record.change_amount)}
          </div>
        </div>
      ),
    },
    {
      title: '市值',
      dataIndex: 'market_cap',
      key: 'market_cap',
      width: 100,
      className: 'hide-mobile',
      render: (marketCap: string) => (
        <span style={{ fontSize: '0.9rem' }}>
          {formatMarketCap(marketCap)}
        </span>
      ),
    },
    {
      title: '市赚率',
      dataIndex: 'market_earning_ratio',
      key: 'market_earning_ratio',
      width: 80,
      className: 'hide-mobile',
      sorter: (a: StockInfo, b: StockInfo) => (a.market_earning_ratio || 0) - (b.market_earning_ratio || 0),
      sortOrder: sortedInfo.columnKey === 'market_earning_ratio' ? sortedInfo.order : null,
      render: (ratio: number) => (
        <span style={{ fontSize: '0.9rem' }}>
          {formatNumber(ratio)}
        </span>
      ),
    },
    {
      title: 'TTM市盈率',
      dataIndex: 'pe_ratio_ttm',
      key: 'pe_ratio_ttm',
      width: 100,
      sorter: (a: StockInfo, b: StockInfo) => (a.pe_ratio_ttm || 0) - (b.pe_ratio_ttm || 0),
      sortOrder: sortedInfo.columnKey === 'pe_ratio_ttm' ? sortedInfo.order : null,
      render: (pe: number) => (
        <span style={{ 
          color: pe && pe < 15 ? '#22c55e' : pe && pe > 30 ? '#ef4444' : '#ffffff',
          fontSize: '0.9rem'
        }}>
          {formatNumber(pe)}
        </span>
      ),
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
      render: (roe: number) => (
        <span style={{ 
          color: roe && roe > 15 ? '#22c55e' : roe && roe < 5 ? '#ef4444' : '#ffffff',
          fontSize: '0.9rem'
        }}>
          {formatROE(roe)}
        </span>
      ),
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
      scroll={{ x: 1200 }}
      size="middle"
      style={{ 
        background: '#222530',
        borderRadius: '12px'
      }}
    />
  );
};

export default StockTable;