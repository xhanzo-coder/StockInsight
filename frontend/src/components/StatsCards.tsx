import React from 'react';
import { Row, Col } from 'antd';
import { StockInfo } from '../services/api';
import { calculateStats } from '../utils/helpers';

interface StatsCardsProps {
  stocks: StockInfo[];
  loading?: boolean;
}

const StatsCards: React.FC<StatsCardsProps> = ({ stocks, loading = false }) => {
  const stats = calculateStats(stocks);

  const cards = [
    {
      title: '关注股票总数',
      icon: '📊',
      iconClass: 'icon-chart',
      value: stats.totalCount,
      subtitle: `共关注 ${stats.totalCount} 只股票`,
      trend: 'neutral'
    },
    {
      title: '平均市盈率',
      icon: '⚡',
      iconClass: 'icon-trend',
      value: stats.avgPE,
      subtitle: `较上次 ${stats.avgPE < 15 ? '估值偏低' : stats.avgPE > 25 ? '估值偏高' : '估值合理'}`,
      trend: stats.avgPE < 15 ? 'up' : stats.avgPE > 25 ? 'down' : 'neutral'
    },
    {
      title: '优质标的',
      icon: '⭐',
      iconClass: 'icon-star',
      value: stats.qualityCount,
      subtitle: 'PE < 15 & ROE > 15%',
      trend: stats.qualityCount > 0 ? 'up' : 'neutral'
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
      {cards.map((card, index) => (
        <Col xs={12} sm={12} md={6} lg={6} xl={6} key={index}>
          <div className={`stat-card fade-in`} style={{ animationDelay: `${index * 0.1}s` }}>
            <div className="stat-header">
              <span className="stat-title">{card.title}</span>
              <div className={`stat-icon ${card.iconClass}`}>
                {card.icon}
              </div>
            </div>
            <div className="stat-number">
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
        </Col>
      ))}
    </Row>
  );
};

export default StatsCards;