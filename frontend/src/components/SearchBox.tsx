import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { AutoComplete, Button, message, Divider, Tag, Tooltip } from 'antd';
import { SearchOutlined, HistoryOutlined, FireOutlined, DeleteOutlined } from '@ant-design/icons';
import { apiService, SearchResult } from '../services/api';
import { debounce, handleApiError } from '../utils/helpers';
import { stockCache, CACHE_KEYS } from '../utils/stockCache';

interface SearchBoxProps {
  onSelectStock: (stock: SearchResult) => void;
  onAddStock?: (stock: SearchResult) => void;
  placeholder?: string;
}

// 热门股票列表
const HOT_STOCKS = [
  { code: '600519', name: '贵州茅台' },
  { code: '300750', name: '宁德时代' },
  { code: '002594', name: '比亚迪' },
  { code: '600036', name: '招商银行' },
  { code: '601318', name: '中国平安' },
  { code: '600276', name: '恒瑞医药' },
  { code: '601888', name: '中国中免' },
  { code: '000858', name: '五粮液' }
];

// 搜索历史本地存储键名
const SEARCH_HISTORY_KEY = 'stock_search_history';

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
  const [searchHistory, setSearchHistory] = useState<SearchResult[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // 加载搜索历史
  useEffect(() => {
    try {
      const historyJson = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (historyJson) {
        const history = JSON.parse(historyJson);
        setSearchHistory(history);
      }
    } catch (error) {
      console.error('加载搜索历史失败:', error);
    }
  }, []);

  // 保存搜索历史
  const saveToHistory = (stock: SearchResult) => {
    try {
      // 检查是否已存在
      const exists = searchHistory.some(item => item.code === stock.code);
      if (!exists) {
        // 添加到历史记录前端，限制为10条
        const newHistory = [stock, ...searchHistory].slice(0, 10);
        setSearchHistory(newHistory);
        // 保存到localStorage
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
      } else {
        // 如果已存在，将其移到最前面
        const newHistory = [
          stock,
          ...searchHistory.filter(item => item.code !== stock.code)
        ].slice(0, 10);
        setSearchHistory(newHistory);
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
      }
    } catch (error) {
      console.error('保存搜索历史失败:', error);
    }
  };

  // 清空搜索历史
  const clearSearchHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      localStorage.removeItem(SEARCH_HISTORY_KEY);
      setSearchHistory([]);
      message.success('搜索历史已清空');
    } catch (error) {
      console.error('清空搜索历史失败:', error);
      message.error('清空搜索历史失败');
    }
  };

  // 搜索股票的核心逻辑
  const performSearch = useCallback(async (keyword: string) => {
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
  }, [onAddStock]);

  // 防抖搜索函数
  const searchStocks = useMemo(
    () => debounce((keyword: string) => {
      performSearch(keyword);
    }, 300),
    [performSearch]
  );

  // 处理输入变化时的下拉选项显示（仅用于建议，不执行搜索）
  const handleInputChange = (value: string) => {
    setSearchValue(value);
    if (value.trim().length >= 2) {
      // 只有输入2个字符以上才显示建议，但不执行实际搜索
      searchStocks(value);
    } else if (value.trim() === '') {
      // 当输入框为空时，显示历史记录和热门股票
      setShowHistory(true);
      setOptions([]);
    } else {
      setOptions([]);
      setShowHistory(false);
    }
  };
  
  // 处理输入框获得焦点
  const handleFocus = () => {
    if (!searchValue.trim()) {
      setShowHistory(true);
    }
  };
  
  // 处理输入框失去焦点
  const handleBlur = () => {
    // 延迟关闭，以便用户可以点击历史记录
    setTimeout(() => {
      setShowHistory(false);
    }, 200);
  };

  // 处理选择
  const handleSelect = (value: string, option: OptionType) => {
    onSelectStock(option.stock);
    saveToHistory(option.stock);
    setSearchValue('');
    setOptions([]);
    setShowHistory(false);
  };
  
  // 从历史记录中选择
  const selectFromHistory = (stock: SearchResult) => {
    onSelectStock(stock);
    saveToHistory(stock);
    setSearchValue('');
    setShowHistory(false);
  };
  
  // 从热门股票中选择
  const selectHotStock = async (hotStock: {code: string, name: string}) => {
    try {
      setLoading(true);
      // 先检查缓存
      const cacheKey = CACHE_KEYS.SEARCH_RESULTS(hotStock.code);
      const cached = stockCache.get<any>(cacheKey);
      
      if (cached && cached.success && cached.data && cached.data.length > 0) {
        const stock = cached.data[0];
        onSelectStock(stock);
        saveToHistory(stock);
        message.success(`已添加 ${hotStock.name} 到关注列表`);
      } else {
        // 如果缓存中没有，则从API获取
        const response = await apiService.searchStocks(hotStock.code, 1);
        if (response.success && response.data && response.data.length > 0) {
          const stock = response.data[0];
          onSelectStock(stock);
          saveToHistory(stock);
          message.success(`已添加 ${hotStock.name} 到关注列表`);
        } else {
          message.error(`未找到股票: ${hotStock.name}`);
        }
      }
    } catch (error) {
      console.error('添加热门股票失败:', error);
      message.error(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  // 处理搜索按钮点击
  const handleSearchClick = async () => {
    if (searchValue.trim()) {
      setLoading(true);
      try {
        const response = await apiService.searchStocks(searchValue, 10);
        if (response.success && response.data && response.data.length > 0) {
          // 如果搜索成功且有结果，保存第一个结果到历史记录
          if (response.data[0]) {
            saveToHistory(response.data[0]);
          }
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
    <div style={{ position: 'relative', zIndex: 1050 }}> {/* 增加 z-index 确保下拉内容在其他元素之上 */}
      <div 
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            width: '320px',
            height: '48px',
            margin: '0 auto 30px auto', // 增加底部外边距，为下拉内容留出更多空间
            marginTop: '10px' // 增加顶部间距
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
          onFocus={handleFocus}
          onBlur={handleBlur}
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
      
      {/* 搜索历史和热门股票 */}
      {showHistory && (
        <div style={{
          position: 'absolute',
          top: '60px', // 增加顶部距离，避免与搜索框重叠
          left: 0,
          width: '320px',
          background: '#2a2d3a',
          border: '1px solid #3a3d4a',
          borderRadius: '8px',
          padding: '12px',
          zIndex: 1051, // 提高z-index确保在其他元素之上
          boxShadow: '0 6px 16px rgba(0, 0, 0, 0.25)',
          maxHeight: '400px', // 限制最大高度
          overflowY: 'auto' // 内容过多时可滚动
        }}>
          {/* 搜索历史 */}
          {searchHistory.length > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <HistoryOutlined style={{ color: '#8b8d97' }} />
                  <span style={{ color: '#8b8d97', fontSize: '12px' }}>搜索历史</span>
                </div>
                <Button 
                  type="text" 
                  size="small" 
                  icon={<DeleteOutlined />} 
                  onClick={clearSearchHistory}
                  style={{ color: '#8b8d97', fontSize: '12px' }}
                >
                  清空
                </Button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                {searchHistory.map((stock) => (
                  <Tag 
                    key={stock.code}
                    style={{
                      background: '#3a3d4a',
                      borderColor: '#4a4d5a',
                      color: '#ffffff',
                      cursor: 'pointer',
                      padding: '4px 8px',
                      borderRadius: '4px'
                    }}
                    onClick={() => selectFromHistory(stock)}
                  >
                    {stock.name} ({stock.code})
                  </Tag>
                ))}
              </div>
              <Divider style={{ margin: '8px 0', borderColor: '#3a3d4a' }} />
            </div>
          )}
          
          {/* 热门股票 */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <FireOutlined style={{ color: '#f59e0b' }} />
              <span style={{ color: '#8b8d97', fontSize: '12px' }}>热门股票</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {HOT_STOCKS.map((stock) => (
                <Tooltip key={stock.code} title={`添加${stock.name}到关注列表`}>
                  <Tag 
                    style={{
                      background: '#3a3d4a',
                      borderColor: '#4a4d5a',
                      color: '#ffffff',
                      cursor: 'pointer',
                      padding: '4px 8px',
                      borderRadius: '4px'
                    }}
                    onClick={() => selectHotStock(stock)}
                  >
                    {stock.name} ({stock.code})
                  </Tag>
                </Tooltip>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBox;