import React from 'react';
import { Tooltip } from 'antd';

interface StatCardProps {
  title: string;
  icon: string;
  iconClass?: string;
  value: string | number;
  subtitle: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: string;
  tooltipTitle?: React.ReactNode;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  icon,
  iconClass = '',
  value,
  subtitle,
  trend = 'neutral',
  color,
  tooltipTitle,
  loading = false
}) => {
  const CardContent = (
    <div className={`stat-card fade-in`}>
      <div className="stat-header">
        <span className="stat-title">{title}</span>
        <div className={`stat-icon ${iconClass}`}>
          {icon}
        </div>
      </div>
      <div 
        className="stat-number"
        style={{ 
          color: color || '#ffffff'
        }}
      >
        {loading ? '--' : value}
      </div>
      <div className={`stat-subtitle ${
        trend === 'up' ? 'positive' : 
        trend === 'down' ? 'negative' : 'neutral'
      }`}>
        {loading ? '加载中...' : (
          <>
            {trend === 'up' && '↗ '}
            {trend === 'down' && '↘ '}
            {trend === 'neutral' && '📅 '}
            {subtitle}
          </>
        )}
      </div>
    </div>
  );

  return tooltipTitle ? (
    <Tooltip 
      title={tooltipTitle} 
      placement="top"
      overlayStyle={{ maxWidth: '300px' }}
    >
      {CardContent}
    </Tooltip>
  ) : (
    CardContent
  );
};

export default StatCard;