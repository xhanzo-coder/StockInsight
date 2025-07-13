import React, { useState, useCallback } from 'react';
import { AutoComplete, Button, message } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { apiService, SearchResult } from '../services/api';
import { debounce, handleApiError } from '../utils/helpers';

interface SearchBoxProps {
  onSelectStock: (stock: SearchResult) => void;
  placeholder?: string;
}

interface OptionType {
  value: string;
  label: React.ReactNode;
  stock: SearchResult;
}

const SearchBox: React.FC<SearchBoxProps> = ({ 
  onSelectStock, 
  placeholder = "搜索股票代码或名称..." 
}) => {
  const [options, setOptions] = useState<OptionType[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  // 搜索股票
  const searchStocks = useCallback(
    debounce(async (keyword: string) => {
      if (!keyword.trim()) {
        setOptions([]);
        return;
      }

      setLoading(true);
      try {
        const response = await apiService.searchStocks(keyword, 10);
        if (response.success && response.data) {
          const searchOptions: OptionType[] = response.data.map(stock => ({
            value: `${stock.code} ${stock.name}`,
            label: (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 500, color: '#ffffff' }}>{stock.name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#8b8d97' }}>
                    {stock.code} | ¥{stock.current_price.toFixed(2)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ 
                    color: stock.change_percent > 0 ? '#22c55e' : 
                           stock.change_percent < 0 ? '#ef4444' : '#8b8d97',
                    fontSize: '0.8rem'
                  }}>
                    {stock.change_percent > 0 ? '+' : ''}{stock.change_percent.toFixed(2)}%
                  </div>
                </div>
              </div>
            ),
            stock
          }));
          setOptions(searchOptions);
        } else {
          setOptions([]);
        }
      } catch (error) {
        console.error('搜索失败:', error);
        message.error(handleApiError(error));
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  // 处理输入变化时的下拉选项显示（仅用于建议，不执行搜索）
  const handleInputChange = (value: string) => {
    setSearchValue(value);
    if (value.trim().length >= 2) {
      // 只有输入2个字符以上才显示建议，但不执行实际搜索
      searchStocks(value);
    } else {
      setOptions([]);
    }
  };

  // 处理选择
  const handleSelect = (value: string, option: OptionType) => {
    onSelectStock(option.stock);
    setSearchValue('');
    setOptions([]);
  };

  // 处理搜索按钮点击
  const handleSearchClick = async () => {
    if (searchValue.trim()) {
      setLoading(true);
      try {
        const response = await apiService.searchStocks(searchValue, 10);
        if (response.success && response.data && response.data.length > 0) {
          const searchOptions: OptionType[] = response.data.map(stock => ({
            value: `${stock.code} ${stock.name}`,
            label: (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 500, color: '#ffffff' }}>{stock.name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#8b8d97' }}>
                    {stock.code} | ¥{stock.current_price.toFixed(2)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ 
                    color: stock.change_percent > 0 ? '#22c55e' : 
                           stock.change_percent < 0 ? '#ef4444' : '#8b8d97',
                    fontSize: '0.8rem'
                  }}>
                    {stock.change_percent > 0 ? '+' : ''}{stock.change_percent.toFixed(2)}%
                  </div>
                </div>
              </div>
            ),
            stock
          }));
          setOptions(searchOptions);
          message.success(`找到 ${response.data.length} 个相关股票`);
        } else {
          setOptions([]);
          message.info('未找到相关股票，请尝试其他关键词');
        }
      } catch (error) {
        console.error('搜索失败:', error);
        message.error(handleApiError(error));
        setOptions([]);
      } finally {
        setLoading(false);
      }
    } else {
      message.warning('请输入搜索关键词');
    }
  };

  // 处理键盘事件
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearchClick();
    }
  };

  return (
    <div className="search-container">
      <div className="search-icon">
        <SearchOutlined />
      </div>
      <AutoComplete
        value={searchValue}
        options={options}
        onSearch={handleInputChange}
        onSelect={handleSelect}
        onInputKeyDown={handleKeyPress}
        placeholder={placeholder}
        className="search-input"
        dropdownStyle={{
          background: '#2a2d3a',
          border: '1px solid #3a3d4a',
          borderRadius: '8px'
        }}
        notFoundContent={loading ? '搜索中...' : searchValue.trim().length < 2 ? '请输入至少2个字符' : '暂无结果'}
        filterOption={false}
      />
      <Button 
        type="primary" 
        className="search-btn"
        onClick={handleSearchClick}
        loading={loading}
        style={{
          position: 'absolute',
          right: 6,
          background: '#667eea',
          borderColor: '#667eea',
          borderRadius: '20px',
          padding: '8px 16px',
          fontSize: '0.85rem',
          fontWeight: 500,
          zIndex: 1
        }}
      >
        搜索
      </Button>
    </div>
  );
};

export default SearchBox;