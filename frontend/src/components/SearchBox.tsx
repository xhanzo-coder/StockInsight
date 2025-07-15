import React, { useState, useCallback } from 'react';
import { AutoComplete, Button, message } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { apiService, SearchResult } from '../services/api';
import { debounce, handleApiError } from '../utils/helpers';

interface SearchBoxProps {
  onSelectStock: (stock: SearchResult) => void;
  onAddStock?: (stock: SearchResult) => void;
  placeholder?: string;
}

interface OptionType {
  value: string;
  label: React.ReactNode;
  stock: SearchResult;
}

const SearchBox: React.FC<SearchBoxProps> = ({ 
  onSelectStock,
  onAddStock,
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
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, color: '#ffffff' }}>{stock.name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#8b8d97' }}>
                    {stock.code} | ¥{stock.current_price.toFixed(2)}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ 
                      color: stock.change_percent > 0 ? '#22c55e' : 
                             stock.change_percent < 0 ? '#ef4444' : '#8b8d97',
                      fontSize: '0.8rem'
                    }}>
                      {stock.change_percent > 0 ? '+' : ''}{stock.change_percent.toFixed(2)}%
                    </div>
                  </div>
                  {onAddStock && (
                    <Button
                      type="primary"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddStock(stock);
                      }}
                      style={{
                        background: '#667eea',
                        borderColor: '#667eea',
                        fontSize: '0.75rem',
                        height: '24px',
                        padding: '0 8px'
                      }}
                    >
                      添加
                    </Button>
                  )}
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
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, color: '#ffffff' }}>{stock.name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#8b8d97' }}>
                    {stock.code} | ¥{stock.current_price.toFixed(2)}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ 
                      color: stock.change_percent > 0 ? '#22c55e' : 
                             stock.change_percent < 0 ? '#ef4444' : '#8b8d97',
                      fontSize: '0.8rem'
                    }}>
                      {stock.change_percent > 0 ? '+' : ''}{stock.change_percent.toFixed(2)}%
                    </div>
                  </div>
                  {onAddStock && (
                    <Button
                      type="primary"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddStock(stock);
                      }}
                      style={{
                        background: '#667eea',
                        borderColor: '#667eea',
                        fontSize: '0.75rem',
                        height: '24px',
                        padding: '0 8px'
                      }}
                    >
                      添加
                    </Button>
                  )}
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
    <div 
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        width: '320px',
        height: '48px',
        margin: '0 auto 20px auto'
      }}
    >
      <SearchOutlined 
        style={{
          position: 'absolute',
          left: '14px',
          color: '#8b8d97',
          fontSize: '16px',
          zIndex: 10
        }}
      />
      <AutoComplete
        value={searchValue}
        options={options}
        onSearch={handleInputChange}
        onSelect={handleSelect}
        onInputKeyDown={handleKeyPress}
        placeholder={placeholder}
        style={{
          width: '100%',
          height: '48px'
        }}
        dropdownStyle={{
          background: '#2a2d3a',
          border: '1px solid #3a3d4a',
          borderRadius: '8px',
          zIndex: 1000
        }}
        notFoundContent={loading ? '搜索中...' : searchValue.trim().length < 2 ? '请输入至少2个字符' : '暂无结果'}
        filterOption={false}
      />
      <Button 
        type="primary" 
        onClick={handleSearchClick}
        loading={loading}
        style={{
          position: 'absolute',
          right: '6px',
          background: '#667eea',
          borderColor: '#667eea',
          borderRadius: '20px',
          padding: '8px 16px',
          fontSize: '14px',
          fontWeight: 500,
          zIndex: 10,
          height: '36px',
          lineHeight: '20px'
        }}
      >
        搜索
      </Button>
      <style dangerouslySetInnerHTML={{
        __html: `
          .ant-select-selector {
            background: #2a2d3a !important;
            border: 1px solid #3a3d4a !important;
            border-radius: 24px !important;
            padding: 0 50px 0 40px !important;
            height: 48px !important;
            color: #ffffff !important;
            display: flex !important;
            align-items: center !important;
          }
          .ant-select-selection-search-input {
            background: transparent !important;
            border: none !important;
            color: #ffffff !important;
            height: 100% !important;
          }
          .ant-select-selection-placeholder {
            color: #8b8d97 !important;
            left: 40px !important;
          }
        `
      }} />
    </div>
  );
};

export default SearchBox;