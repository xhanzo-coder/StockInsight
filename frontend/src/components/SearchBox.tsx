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
      console.log('🔍 搜索取消：查询字符串为空');
      setOptions([]);
      return;
    }

    // 如果关键词长度小于2，不执行搜索
    if (keyword.trim().length < 2) {
      console.log('🔍 搜索取消：关键词长度不足2个字符');
      setOptions([]);
      return;
    }

    console.log('🔍 开始搜索：', {
      keyword: keyword.trim(),
      timestamp: new Date().toISOString(),
      searchValue: searchValue,
      currentOptions: options.length
    });

    setLoading(true);
    try {
      console.log('📡 调用API搜索股票:', keyword);
      const response = await apiService.searchStocks(keyword, 10);
      
      console.log('📊 API响应详情:', {
        success: response.success,
        hasData: !!response.data,
        dataType: typeof response.data,
        isArray: Array.isArray(response.data),
        dataLength: Array.isArray(response.data) ? response.data.length : 'N/A',
        firstItem: Array.isArray(response.data) && response.data.length > 0 ? response.data[0] : null,
        rawResponse: response
      });
      
      if (response.success && response.data && Array.isArray(response.data)) {
        const searchOptions: OptionType[] = response.data.map((stock, index) => {
          console.log(`📋 处理搜索结果 ${index + 1}:`, {
            stock,
            hasCode: 'code' in stock,
            hasName: 'name' in stock,
            hasPrice: 'current_price' in stock,
            hasChangePercent: 'change_percent' in stock
          });

          return {
            value: `${stock.code} ${stock.name}`,
            label: (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, color: '#ffffff' }}>{stock.name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#8b8d97' }}>
                    {stock.code} | ¥{typeof stock.current_price === 'number' ? stock.current_price.toFixed(2) : '0.00'}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ 
                      color: (stock.change_percent || 0) > 0 ? '#22c55e' : 
                             (stock.change_percent || 0) < 0 ? '#ef4444' : '#8b8d97',
                      fontSize: '0.8rem'
                    }}>
                      {(stock.change_percent || 0) > 0 ? '+' : ''}{(stock.change_percent || 0).toFixed(2)}%
                    </div>
                  </div>
                  {onAddStock && (
                    <Button
                      type="primary"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddStock(stock);
                        message.success(`已添加 ${stock.name} 到关注列表`);
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
          };
        });
        
        console.log('✅ 搜索结果处理完成：', {
          originalCount: response.data.length,
          formattedCount: searchOptions.length,
          formattedOptions: searchOptions.map(opt => ({
            value: opt.value,
            hasLabel: !!opt.label,
            stock: opt.stock
          }))
        });
        
        setOptions(searchOptions);
        console.log('搜索结果处理完成，共', searchOptions.length, '条');
      } else {
        console.warn('⚠️ 搜索结果格式异常：', {
          success: response.success,
          hasData: !!response.data,
          dataType: typeof response.data,
          isArray: Array.isArray(response.data),
          response: response
        });
        console.log('搜索无结果或响应格式错误');
        setOptions([]);
      }
    } catch (error) {
      console.error('💥 搜索请求异常：', {
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        keyword: keyword.trim(),
        timestamp: new Date().toISOString()
      });
      
      const errorMessage = handleApiError(error);
      // 只在非网络错误时显示错误消息，避免频繁弹窗
      if (!errorMessage.includes('网络') && !errorMessage.includes('连接')) {
        message.error(errorMessage);
      }
      setOptions([]);
    } finally {
      setLoading(false);
      console.log('🏁 搜索完成：', {
        keyword: keyword.trim(),
        timestamp: new Date().toISOString(),
        finalOptionsCount: options.length
      });
    }
  }, [onAddStock, searchValue, options.length]);

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
    const trimmedValue = searchValue.trim();
    if (!trimmedValue) {
      message.warning('请输入搜索关键词');
      return;
    }

    if (trimmedValue.length < 2) {
      message.warning('请输入至少2个字符');
      return;
    }

    setLoading(true);
    try {
      console.log('手动搜索:', trimmedValue);
      const response = await apiService.searchStocks(trimmedValue, 10);
      console.log('手动搜索响应:', response);
      
      if (response.success && response.data && Array.isArray(response.data) && response.data.length > 0) {
        // 如果搜索成功且有结果，保存第一个结果到历史记录
        saveToHistory(response.data[0]);
        
        const searchOptions: OptionType[] = response.data.map(stock => ({
          value: `${stock.code} ${stock.name}`,
          label: (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, color: '#ffffff' }}>{stock.name}</div>
                <div style={{ fontSize: '0.8rem', color: '#8b8d97' }}>
                  {stock.code} | ¥{typeof stock.current_price === 'number' ? stock.current_price.toFixed(2) : '0.00'}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ 
                    color: (stock.change_percent || 0) > 0 ? '#22c55e' : 
                           (stock.change_percent || 0) < 0 ? '#ef4444' : '#8b8d97',
                    fontSize: '0.8rem'
                  }}>
                    {(stock.change_percent || 0) > 0 ? '+' : ''}{(stock.change_percent || 0).toFixed(2)}%
                  </div>
                </div>
                {onAddStock && (
                  <Button
                    type="primary"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddStock(stock);
                      message.success(`已添加 ${stock.name} 到关注列表`);
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
        message.info(`未找到与"${trimmedValue}"相关的股票，请尝试其他关键词`);
      }
    } catch (error) {
      console.error('搜索失败:', error);
      const errorMessage = handleApiError(error);
      message.error(`搜索失败: ${errorMessage}`);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  // 处理键盘事件
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearchClick();
    }
  };

  return (
    <div className="search-box-container" style={{ position: 'relative', zIndex: 1050 }}>
      <div 
        className="search-input-wrapper"
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          maxWidth: '600px',
          height: '48px',
          margin: '0 auto',
          marginTop: '0px'
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
            zIndex: 1100,
            boxShadow: '0 6px 16px rgba(0, 0, 0, 0.25)',
            maxHeight: '300px',
            overflowY: 'auto'
          }}
          notFoundContent={loading ? '搜索中...' : searchValue.trim().length < 2 ? '请输入至少2个字符' : '暂无结果'}
          filterOption={false}
          allowClear={false}
          showSearch={false}
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
      </div>
      
      {/* 增强的样式隔离 */}
      <style dangerouslySetInnerHTML={{
        __html: `
          /* 搜索框容器样式 - 高特异性确保不被全局样式覆盖 */
          .search-box-container {
            position: relative;
            display: flex;
            align-items: center;
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
          }

          /* 搜索框主体样式 - 使用高特异性选择器 */
          .search-box-container .ant-select.ant-select-auto-complete {
            width: 100% !important;
            height: 48px !important;
          }

          .search-box-container .ant-select.ant-select-auto-complete .ant-select-selector {
            background: #2a2d3a !important;
            border: 1px solid #3a3d4a !important;
            border-radius: 24px !important;
            padding: 0 60px 0 40px !important;
            height: 48px !important;
            color: #ffffff !important;
            display: flex !important;
            align-items: center !important;
            min-height: 48px !important;
            box-sizing: border-box !important;
            line-height: 24px !important;
            transition: all 0.3s ease !important;
          }

          .search-box-container .ant-select.ant-select-auto-complete .ant-select-selector:hover {
            border-color: #667eea !important;
          }

          .search-box-container .ant-select.ant-select-auto-complete .ant-select-selection-search {
            left: 40px !important;
            right: 60px !important;
            height: 100% !important;
            display: flex !important;
            align-items: center !important;
          }

          .search-box-container .ant-select.ant-select-auto-complete .ant-select-selection-search-input {
            background: transparent !important;
            border: none !important;
            color: #ffffff !important;
            height: 100% !important;
            line-height: 24px !important;
            font-size: 14px !important;
            padding: 0 !important;
            margin: 0 !important;
            outline: none !important;
          }

          .search-box-container .ant-select.ant-select-auto-complete .ant-select-selection-placeholder {
            color: #8b8d97 !important;
            left: 40px !important;
            right: 60px !important;
            line-height: 24px !important;
            display: flex !important;
            align-items: center !important;
            height: 100% !important;
            font-size: 14px !important;
          }

          .search-box-container .ant-select.ant-select-auto-complete.ant-select-focused .ant-select-selector {
            border-color: #667eea !important;
            box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2) !important;
          }

          /* 下拉菜单样式 */
          .search-box-container .ant-select-dropdown {
            background: #2a2d3a !important;
            border: 1px solid #3a3d4a !important;
            border-radius: 8px !important;
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25) !important;
            z-index: 1100 !important;
          }

          .search-box-container .ant-select-item {
            color: #ffffff !important;
            background: transparent !important;
            padding: 8px 12px !important;
            transition: all 0.2s ease !important;
          }

          .search-box-container .ant-select-item:hover {
            background: #3a3d4a !important;
          }

          .search-box-container .ant-select-item-option-selected {
            background: #667eea !important;
          }

          .search-box-container .ant-empty {
            color: #8b8d97 !important;
          }

          .search-box-container .ant-empty-description {
            color: #8b8d97 !important;
          }
        `
      }} />
      
      {/* 搜索历史和热门股票 */}
      {showHistory && (
        <div style={{
          position: 'absolute',
          top: '52px', // 调整顶部距离，确保不与搜索框重叠
          left: '0',
          right: '0',
          width: '100%',
          maxWidth: '600px',
          margin: '0 auto',
          background: '#2a2d3a',
          border: '1px solid #3a3d4a',
          borderRadius: '8px',
          padding: '12px',
          zIndex: 1200, // 提高z-index确保在其他元素之上
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
                      borderRadius: '4px',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => selectFromHistory(stock)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#4a4d5a';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#3a3d4a';
                    }}
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
                      borderRadius: '4px',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => selectHotStock(stock)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#4a4d5a';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#3a3d4a';
                    }}
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