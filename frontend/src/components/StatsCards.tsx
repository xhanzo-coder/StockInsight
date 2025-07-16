import React from 'react';
import { Row, Col, Tooltip } from 'antd';
import { StockInfo } from '../services/api';
import { calculateStats, formatPercent, getPriceColor } from '../utils/helpers';

interface StatsCardsProps {
  stocks: StockInfo[];
  loading?: boolean;
}

const StatsCards: React.FC<StatsCardsProps> = ({ stocks, loading = false }) => {
  const stats = calculateStats(stocks);

  const getTooltipContent = (type: string) => {
    switch (type) {
      case 'total':
        return (
          <div>
            <div>涨跌分布明细：</div>
            <div style={{ color: '#22c55e' }}>📈 上涨：{stats.risingCount} 只</div>
            <div style={{ color: '#ef4444' }}>📉 下跌：{stats.fallingCount} 只</div>
            <div style={{ color: '#ffffff' }}>➡️ 平盘：{stats.flatCount} 只</div>
          </div>
        );
      case 'average':
        return (
          <div>
            <div>涨跌幅详情：</div>
            <div style={{ color: '#22c55e' }}>📈 最高涨幅：{formatPercent(stats.maxChangePercent)}</div>
            <div style={{ color: '#ef4444' }}>📉 最低跌幅：{formatPercent(stats.minChangePercent)}</div>
            <div>📊 平均涨跌幅：{formatPercent(stats.avgChangePercent)}</div>
          </div>
        );
      case 'strong':
         return (
           <div>
             <div>强势股详情（涨幅 {'>'} 5%）：</div>
             {stats.strongStocksList.length > 0 ? (
               stats.strongStocksList.map((stock, index) => (
                 <div key={index} style={{ color: '#22c55e' }}>
                   🚀 {stock.name}({stock.code})：{formatPercent(stock.change_percent)}
                 </div>
               ))
             ) : (
               <div style={{ color: '#888' }}>暂无强势股</div>
             )}
           </div>
         );
      default:
        return null;
    }
  };

  const cards = [
    {
      title: '关注股票总数',
      icon: '📊',
      iconClass: 'icon-chart',
      value: stats.totalCount,
      subtitle: `↑涨${stats.risingCount} ↓跌${stats.fallingCount} →平${stats.flatCount}`,
      trend: 'neutral',
      tooltipType: 'total'
    },
    {
      title: '平均涨跌幅',
      icon: stats.avgChangePercent > 0 ? '📈' : stats.avgChangePercent < 0 ? '📉' : '➡️',
      iconClass: 'icon-trend',
      value: formatPercent(stats.avgChangePercent),
      subtitle: '今日整体表现',
      trend: stats.avgChangePercent > 0 ? 'up' : stats.avgChangePercent < 0 ? 'down' : 'neutral',
      color: getPriceColor(stats.avgChangePercent),
      tooltipType: 'average'
    },
    {
      title: '强势股',
      icon: stats.strongStocks > 0 ? '🚀' : '📊',
      iconClass: 'icon-star',
      value: stats.strongStocks,
      subtitle: '涨幅 > 5%',
      trend: stats.strongStocks > 0 ? 'up' : 'neutral',
      tooltipType: 'strong'
    },
    {
      title: '最后更新',
      icon: '🔔',
      iconClass: 'icon-bell',
      value: stats.lastUpdate,
      subtitle: new Date().toLocaleDateString('zh-CN'),
      trend: 'neutral'
    }
  ];

  return (
    <Row gutter={[20, 20]} style={{ marginBottom: 32 }}>
      {cards.map((card, index) => {
        const CardContent = (
          <div className={`stat-card fade-in`} style={{ animationDelay: `${index * 0.1}s` }}>
            <div className="stat-header">
              <span className="stat-title">{card.title}</span>
              <div className={`stat-icon ${card.iconClass}`}>
                {card.icon}
              </div>
            </div>
            <div 
              className="stat-number"
              style={{ 
                color: card.color || '#ffffff'
              }}
            >
              {loading ? '--' : card.value}
            </div>
            <div className={`stat-subtitle ${
              card.trend === 'up' ? 'positive' : 
              card.trend === 'down' ? 'negative' : 'neutral'
            }`}>
              {loading ? '加载中...' : (
                <>
                  {card.trend === 'up' && '↗ '}
                  {card.trend === 'down' && '↘ '}
                  {card.trend === 'neutral' && '📅 '}
                  {card.subtitle}
                </>
              )}
            </div>
          </div>
        );

        return (
          <Col xs={12} sm={12} md={6} lg={6} xl={6} key={index}>
            {card.tooltipType ? (
              <Tooltip 
                title={getTooltipContent(card.tooltipType)} 
                placement="top"
                overlayStyle={{ maxWidth: '300px' }}
              >
                {CardContent}
              </Tooltip>
            ) : (
              CardContent
            )}
          </Col>
        );
      })}
    </Row>
  );
};

export default StatsCards;