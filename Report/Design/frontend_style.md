<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>股票数据观察平台</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'SF Pro Display', Roboto, sans-serif;
            background: #1a1d29;
            color: #ffffff;
            min-height: 100vh;
            line-height: 1.5;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 24px;
        }

        /* 顶部导航栏 */
        .top-nav {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 32px;
            padding: 16px 0;
        }

        .logo {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 1.25rem;
            font-weight: 600;
            color: #ffffff;
        }

        .logo-icon {
            width: 32px;
            height: 32px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.2rem;
        }

        .search-nav {
            display: flex;
            align-items: center;
            gap: 16px;
        }

        .search-box {
            position: relative;
            display: flex;
            align-items: center;
        }

        .search-input {
            width: 320px;
            padding: 12px 48px 12px 40px;
            background: #2a2d3a;
            border: 1px solid #3a3d4a;
            border-radius: 24px;
            color: #ffffff;
            font-size: 0.9rem;
            transition: all 0.2s ease;
        }

        .search-input:focus {
            outline: none;
            border-color: #667eea;
            background: #2e3140;
        }

        .search-input::placeholder {
            color: #8b8d97;
        }

        .search-icon {
            position: absolute;
            left: 14px;
            color: #8b8d97;
            font-size: 1rem;
        }

        .search-btn {
            position: absolute;
            right: 6px;
            background: #667eea;
            border: none;
            border-radius: 20px;
            padding: 8px 16px;
            color: white;
            cursor: pointer;
            font-size: 0.85rem;
            font-weight: 500;
            transition: background-color 0.2s ease;
        }

        .search-btn:hover {
            background: #5a6fd8;
        }

        .update-btn {
            background: #667eea;
            border: none;
            border-radius: 8px;
            padding: 10px 20px;
            color: white;
            cursor: pointer;
            font-size: 0.875rem;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: background-color 0.2s ease;
        }

        .update-btn:hover {
            background: #5a6fd8;
        }

        /* 数据卡片区域 */
        .stats-cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 20px;
            margin-bottom: 32px;
        }

        .stat-card {
            background: #2a2d3a;
            border: 1px solid #3a3d4a;
            border-radius: 12px;
            padding: 20px;
            position: relative;
            overflow: hidden;
        }

        .stat-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: linear-gradient(90deg, #667eea, #764ba2);
        }

        .stat-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
        }

        .stat-title {
            font-size: 0.9rem;
            color: #8b8d97;
            font-weight: 500;
        }

        .stat-icon {
            width: 24px;
            height: 24px;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.9rem;
        }

        .icon-chart { background: rgba(251, 191, 36, 0.2); color: #fbbf24; }
        .icon-trend { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
        .icon-star { background: rgba(251, 191, 36, 0.2); color: #fbbf24; }
        .icon-bell { background: rgba(239, 68, 68, 0.2); color: #ef4444; }

        .stat-number {
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 8px;
        }

        .stat-subtitle {
            font-size: 0.85rem;
            color: #8b8d97;
        }

        .positive { color: #22c55e; }
        .negative { color: #ef4444; }

        /* 搜索结果 */
        .search-results {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: #2a2d3a;
            border: 1px solid #3a3d4a;
            border-radius: 12px;
            margin-top: 8px;
            max-height: 320px;
            overflow-y: auto;
            z-index: 1000;
            display: none;
        }

        .search-result-item {
            padding: 12px 16px;
            cursor: pointer;
            border-bottom: 1px solid #3a3d4a;
            transition: background-color 0.2s ease;
        }

        .search-result-item:hover {
            background: #333647;
        }

        .search-result-item:last-child {
            border-bottom: none;
        }

        .search-result-name {
            font-weight: 500;
            margin-bottom: 2px;
        }

        .search-result-info {
            color: #8b8d97;
            font-size: 0.8rem;
        }

        /* 股票详情区域 */
        .stock-detail {
            background: #2a2d3a;
            border: 1px solid #3a3d4a;
            border-radius: 16px;
            padding: 32px;
            margin-bottom: 32px;
            display: none;
        }

        .stock-detail-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 32px;
        }

        .stock-info h2 {
            font-size: 1.75rem;
            font-weight: 600;
            margin-bottom: 4px;
        }

        .stock-code {
            color: #8b8d97;
            font-size: 1rem;
        }

        .add-button {
            background: #667eea;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.2s ease;
        }

        .add-button:hover {
            background: #5a6fd8;
        }

        .detail-content {
            display: grid;
            grid-template-columns: 1fr 400px;
            gap: 32px;
        }

        .chart-section {
            background: #222530;
            border-radius: 12px;
            padding: 24px;
            border: 1px solid #3a3d4a;
        }

        .chart-header {
            font-size: 1rem;
            font-weight: 600;
            margin-bottom: 20px;
            color: #ffffff;
        }

        .chart-placeholder {
            height: 280px;
            border: 2px dashed #3a3d4a;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #8b8d97;
            font-size: 0.9rem;
        }

        .metrics-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
        }

        .metric-card {
            background: #222530;
            border: 1px solid #3a3d4a;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
        }

        .metric-label {
            color: #8b8d97;
            font-size: 0.8rem;
            margin-bottom: 8px;
        }

        .metric-value {
            font-size: 1.4rem;
            font-weight: 600;
        }

        /* 主数据表格区域 */
        .main-section {
            background: #2a2d3a;
            border: 1px solid #3a3d4a;
            border-radius: 16px;
            padding: 32px;
        }

        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
        }

        .section-title {
            font-size: 1.5rem;
            font-weight: 600;
        }

        .filter-tabs {
            display: flex;
            gap: 8px;
        }

        .filter-tab {
            background: #333647;
            border: none;
            border-radius: 20px;
            padding: 8px 16px;
            color: #8b8d97;
            cursor: pointer;
            font-size: 0.85rem;
            transition: all 0.2s ease;
        }

        .filter-tab.active {
            background: #667eea;
            color: white;
        }

        .filter-tab:hover:not(.active) {
            background: #3a3d4a;
            color: #ffffff;
        }

        /* 表格样式 */
        .table-container {
            overflow-x: auto;
            border-radius: 12px;
            border: 1px solid #3a3d4a;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            background: #222530;
        }

        th, td {
            padding: 16px 12px;
            text-align: left;
            border-bottom: 1px solid #3a3d4a;
            font-size: 0.85rem;
        }

        th {
            background: #2a2d3a;
            font-weight: 600;
            color: #ffffff;
            cursor: pointer;
            user-select: none;
            position: sticky;
            top: 0;
            z-index: 10;
        }

        th:hover {
            background: #333647;
        }

        .sortable::after {
            content: '';
            margin-left: 8px;
            opacity: 0.4;
        }

        .sort-asc::after {
            content: '↑';
            opacity: 1;
            color: #667eea;
        }

        .sort-desc::after {
            content: '↓';
            opacity: 1;
            color: #667eea;
        }

        tr:hover {
            background: #2a2d3a;
        }

        tr:last-child td {
            border-bottom: none;
        }

        .delete-btn {
            background: transparent;
            color: #ef4444;
            border: 1px solid #ef4444;
            padding: 6px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.75rem;
            transition: all 0.2s ease;
        }

        .delete-btn:hover {
            background: #ef4444;
            color: #ffffff;
        }

        /* 状态消息 */
        .status-message {
            padding: 12px 16px;
            border-radius: 8px;
            margin-bottom: 16px;
            font-size: 0.875rem;
            text-align: center;
        }

        .status-success {
            background: rgba(34, 197, 94, 0.1);
            color: #22c55e;
            border: 1px solid rgba(34, 197, 94, 0.2);
        }

        .status-error {
            background: rgba(239, 68, 68, 0.1);
            color: #ef4444;
            border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .status-loading {
            background: rgba(102, 126, 234, 0.1);
            color: #667eea;
            border: 1px solid rgba(102, 126, 234, 0.2);
        }

        /* 响应式 */
        @media (max-width: 1200px) {
            .detail-content {
                grid-template-columns: 1fr;
            }
            
            .metrics-section {
                grid-template-columns: repeat(3, 1fr);
            }
        }

        @media (max-width: 768px) {
            .container {
                padding: 16px;
            }
            
            .top-nav {
                flex-direction: column;
                gap: 16px;
            }
            
            .search-input {
                width: 280px;
            }
            
            .stats-cards {
                grid-template-columns: repeat(2, 1fr);
            }
            
            .metrics-section {
                grid-template-columns: repeat(2, 1fr);
            }
            
            th, td {
                padding: 12px 8px;
                font-size: 0.8rem;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- 顶部导航 -->
        <div class="top-nav">
            <div class="logo">
                <div class="logo-icon">📈</div>
                股票数据观察平台
            </div>
            <div class="search-nav">
                <div class="search-box">
                    <div class="search-icon">🔍</div>
                    <input type="text" class="search-input" placeholder="搜索股票代码或名称..." id="searchInput">
                    <button class="search-btn" onclick="performSearch()">搜索</button>
                    <div class="search-results" id="searchResults">
                        <!-- 搜索结果示例 -->
                        <div class="search-result-item" onclick="selectStock('600036', '招商银行', '银行')">
                            <div class="search-result-name">招商银行</div>
                            <div class="search-result-info">600036 | 银行</div>
                        </div>
                        <div class="search-result-item" onclick="selectStock('000001', '平安银行', '银行')">
                            <div class="search-result-name">平安银行</div>
                            <div class="search-result-info">000001 | 银行</div>
                        </div>
                        <div class="search-result-item" onclick="selectStock('601919', '中远海控', '航运港口')">
                            <div class="search-result-name">中远海控</div>
                            <div class="search-result-info">601919 | 航运港口</div>
                        </div>
                    </div>
                </div>
                <button class="update-btn" onclick="refreshData()">
                    <span>🔄</span>
                    更新数据
                </button>
            </div>
        </div>

        <!-- 数据统计卡片 -->
        <div class="stats-cards">
            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-title">关注股票总数</span>
                    <div class="stat-icon icon-chart">📊</div>
                </div>
                <div class="stat-number">86</div>
                <div class="stat-subtitle">↗ 本周新增 3 只</div>
            </div>
            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-title">平均市盈率</span>
                    <div class="stat-icon icon-trend">⚡</div>
                </div>
                <div class="stat-number">18.6</div>
                <div class="stat-subtitle negative">↘ 较上次 -2.1</div>
            </div>
            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-title">优质标的</span>
                    <div class="stat-icon icon-star">⭐</div>
                </div>
                <div class="stat-number">23</div>
                <div class="stat-subtitle positive">✓ PE < 15 & ROE > 15%</div>
            </div>
            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-title">最后更新</span>
                    <div class="stat-icon icon-bell">🔔</div>
                </div>
                <div class="stat-number">15:30</div>
                <div class="stat-subtitle">📅 2025-07-11</div>
            </div>
        </div>

        <!-- 股票详情区域 -->
        <div class="stock-detail" id="stockDetail">
            <div class="stock-detail-header">
                <div class="stock-info">
                    <h2 id="stockName">招商银行</h2>
                    <div class="stock-code" id="stockCode">600036</div>
                </div>
                <button class="add-button" onclick="addToWatchlist()">添加到关注列表</button>
            </div>
            
            <div class="detail-content">
                <div class="chart-section">
                    <div class="chart-header">股价趋势图 (近一年)</div>
                    <div class="chart-placeholder">
                        📈 股票趋势图将在这里显示<br>
                        <small style="color: #666; margin-top: 8px; display: block;">
                            集成 ECharts 或 TradingView 图表组件
                        </small>
                    </div>
                </div>
                
                <div class="metrics-section">
                    <div class="metric-card">
                        <div class="metric-label">当前价格</div>
                        <div class="metric-value positive" id="detailPrice">¥35.48</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">涨跌幅</div>
                        <div class="metric-value positive" id="detailChange">+1.23%</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">总市值</div>
                        <div class="metric-value" id="detailMarketCap">4540亿</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">TTM市盈率</div>
                        <div class="metric-value" id="detailPE">11.76</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">ROE</div>
                        <div class="metric-value" id="detailROE">10.72%</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">理论股价</div>
                        <div class="metric-value" id="detailTheoretical">¥34.47</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 主数据表格 -->
        <div class="main-section">
            <div class="section-header">
                <h2 class="section-title">股票数据总览</h2>
                <div class="filter-tabs">
                    <button class="filter-tab active">全部</button>
                    <button class="filter-tab">低估值</button>
                    <button class="filter-tab">高ROE</button>
                    <button class="filter-tab">自定义</button>
                </div>
            </div>
            
            <div id="messageContainer"></div>
            
            <div class="table-container">
                <table id="stockTable">
                    <thead>
                        <tr>
                            <th class="sortable" data-column="code">股票信息</th>
                            <th class="sortable" data-column="industry">所属行业</th>
                            <th class="sortable" data-column="market_cap">总市值(亿)</th>
                            <th class="sortable" data-column="current_price">当前价格(元)</th>
                            <th class="sortable" data-column="change_percent">市盈率(PE)</th>
                            <th class="sortable" data-column="roe">净资产收益率(ROE)</th>
                            <th class="sortable" data-column="pb_ratio">市净率(PB)</th>
                            <th class="sortable" data-column="dividend_payout_ratio">股利支付率</th>
                            <th class="sortable" data-column="correction_factor">修正系数</th>
                            <th class="sortable" data-column="corrected_pe">修正市盈率</th>
                            <th class="sortable" data-column="theoretical_price">理论股价(元)</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody id="stockTableBody">
                        <!-- 示例数据 -->
                        <tr>
                            <td>
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <div>
                                        <div style="font-weight: 600;">平安银行</div>
                                        <div style="color: #8b8d97; font-size: 0.75rem;">000001</div>
                                    </div>
                                </div>
                            </td>
                            <td><span style="background: rgba(102, 126, 234, 0.2); color: #667eea; padding: 4px 8px; border-radius: 12px; font-size: 0.75rem;">银行</span></td>
                            <td>3,374.7</td>
                            <td><span style="color: #22c55e; font-weight: 600;">17.41</span></td>
                            <td><span style="color: #22c55e;">5.12</span></td>
                            <td><span style="color: #ef4444; font-weight: 600;">11.8%</span></td>
                            <td>0.98</td>
                            <td>31.2%</td>
                            <td>0.92</td>
                            <td>4.71</td>
                            <td><span style="color: #667eea; font-weight: 600;">19.45</span></td>
                            <td><button class="delete-btn" onclick="removeStock('000001')">删除</button></td>
                        </tr>
                        <tr>
                            <td>
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <div>
                                        <div style="font-weight: 600;">万科A</div>
                                        <div style="color: #8b8d97; font-size: 0.75rem;">000002</div>
                                    </div>
                                </div>
                            </td>
                            <td><span style="background: rgba(251, 191, 36, 0.2); color: #fbbf24; padding: 4px 8px; border-radius: 12px; font-size: 0.75rem;">房地产开发</span></td>
                            <td>764.3</td>
                            <td><span style="color: #22c55e; font-weight: 600;">6.81</span></td>
                            <td><span style="color: #22c55e;">4.35</span></td>
                            <td><span style="color: #22c55e; font-weight: 600;">7.2%</span></td>
                            <td>0.55</td>
                            <td>45.8%</td>
                            <td>0.85</td>
                            <td>3.70</td>
                            <td><span style="color: #667eea; font-weight: 600;">8.12</span></td>
                            <td><button class="delete-btn" onclick="removeStock('000002')">删除</button></td>
                        </tr>
                        <tr>
                            <td>
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <div>
                                        <div style="font-weight: 600;">中国国旅</div>
                                        <div style="color: #8b8d97; font-size: 0.75rem;">601888</div>
                                    </div>
                                </div>
                            </td>
                            <td><span style="background: rgba(239, 68, 68, 0.2); color: #ef4444; padding: 4px 8px; border-radius: 12px; font-size: 0.75rem;">旅游</span></td>
                            <td>2,156.8</td>
                            <td><span style="color: #22c55e; font-weight: 600;">108.32</span></td>
                            <td><span style="color: #ef4444;">18.67</span></td>
                            <td><span style="color: #ef4444; font-weight: 600;">15.6%</span></td>
                            <td>2.91</td>
                            <td>28.4%</td>
                            <td>1.05</td>
                            <td>19.60</td>
                            <td><span style="color: #667eea; font-weight: 600;">125.67</span></td>
                            <td><button class="delete-btn" onclick="removeStock('601888')">删除</button></td>
                        </tr>
                        <tr>
                            <td>
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <div>
                                        <div style="font-weight: 600;">贵州茅台</div>
                                        <div style="color: #8b8d97; font-size: 0.75rem;">600519</div>
                                    </div>
                                </div>
                            </td>
                            <td><span style="background: rgba(34, 197, 94, 0.2); color: #22c55e; padding: 4px 8px; border-radius: 12px; font-size: 0.75rem;">白酒</span></td>
                            <td>21,456.7</td>
                            <td><span style="color: #22c55e; font-weight: 600;">1,712.50</span></td>
                            <td><span style="color: #ef4444;">27.84</span></td>
                            <td><span style="color: #ef4444; font-weight: 600;">31.2%</span></td>
                            <td>8.69</td>
                            <td>52.1%</td>
                            <td>1.15</td>
                            <td>32.02</td>
                            <td><span style="color: #667eea; font-weight: 600;">1,856.34</span></td>
                            <td><button class="delete-btn" onclick="removeStock('600519')">删除</button></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <script>
        // 全局变量
        let watchlistData = [];
        let currentSortColumn = null;
        let currentSortDirection = 'asc';
        let selectedStock = null;

        // 示例数据
        const mockWatchlistData = [
            {
                code: '000001',
                name: '平安银行',
                industry: '银行',
                current_price: 17.41,
                change_percent: 1.23,
                market_cap: '3374.7',
                pe_ratio_ttm: 5.12,
                roe: 11.8,
                pb_ratio: 0.98,
                dividend_payout_ratio: 0.312,
                correction_factor: 0.92,
                corrected_pe: 4.71,
                theoretical_price: 19.45
            },
            {
                code: '000002',
                name: '万科A',
                industry: '房地产开发',
                current_price: 6.81,
                change_percent: -0.58,
                market_cap: '764.3',
                pe_ratio_ttm: 4.35,
                roe: 7.2,
                pb_ratio: 0.55,
                dividend_payout_ratio: 0.458,
                correction_factor: 0.85,
                corrected_pe: 3.70,
                theoretical_price: 8.12
            },
            {
                code: '601888',
                name: '中国国旅',
                industry: '旅游',
                current_price: 108.32,
                change_percent: 2.15,
                market_cap: '2156.8',
                pe_ratio_ttm: 18.67,
                roe: 15.6,
                pb_ratio: 2.91,
                dividend_payout_ratio: 0.284,
                correction_factor: 1.05,
                corrected_pe: 19.60,
                theoretical_price: 125.67
            },
            {
                code: '600519',
                name: '贵州茅台',
                industry: '白酒',
                current_price: 1712.50,
                change_percent: 1.89,
                market_cap: '21456.7',
                pe_ratio_ttm: 27.84,
                roe: 31.2,
                pb_ratio: 8.69,
                dividend_payout_ratio: 0.521,
                correction_factor: 1.15,
                corrected_pe: 32.02,
                theoretical_price: 1856.34
            }
        ];

        // 初始化
        document.addEventListener('DOMContentLoaded', function() {
            watchlistData = mockWatchlistData;
            initializeSearch();
            initializeSort();
        });

        // 搜索功能
        function initializeSearch() {
            const searchInput = document.getElementById('searchInput');
            const searchResults = document.getElementById('searchResults');

            searchInput.addEventListener('input', function() {
                const query = this.value.trim().toLowerCase();
                
                if (query.length === 0) {
                    searchResults.style.display = 'none';
                    return;
                }

                // 模拟搜索结果显示
                searchResults.style.display = 'block';
            });

            // 点击其他地方关闭搜索结果
            document.addEventListener('click', function(e) {
                if (!e.target.closest('.search-box')) {
                    searchResults.style.display = 'none';
                }
            });
        }

        // 执行搜索
        function performSearch() {
            const query = document.getElementById('searchInput').value.trim();
            if (query) {
                showMessage('搜索功能将连接到后端API', 'loading');
                // 这里将调用实际的搜索API
                // searchStocks(query);
            }
        }

        // 排序功能
        function initializeSort() {
            const headers = document.querySelectorAll('th.sortable');
            headers.forEach(header => {
                header.addEventListener('click', function() {
                    const column = this.dataset.column;
                    sortTable(column);
                });
            });
        }

        // 选择股票
        function selectStock(code, name, industry) {
            selectedStock = { code, name, industry };
            
            // 模拟股票详情数据
            const mockDetail = {
                name: name,
                code: code,
                price: code === '600036' ? 35.48 : code === '000001' ? 17.41 : 108.32,
                change_percent: code === '600036' ? 1.23 : code === '000001' ? 1.23 : 2.15,
                market_cap: code === '600036' ? '4540亿' : code === '000001' ? '3374.7亿' : '2156.8亿',
                pe_ratio: code === '600036' ? 11.76 : code === '000001' ? 5.12 : 18.67,
                roe: code === '600036' ? 10.72 : code === '000001' ? 11.8 : 15.6,
                theoretical_price: code === '600036' ? 34.47 : code === '000001' ? 19.45 : 125.67
            };
            
            displayStockDetail(mockDetail);
            document.getElementById('searchResults').style.display = 'none';
            document.getElementById('searchInput').value = '';
        }

        // 显示股票详情
        function displayStockDetail(stock) {
            document.getElementById('stockName').textContent = stock.name;
            document.getElementById('stockCode').textContent = stock.code;
            document.getElementById('detailPrice').textContent = `¥${stock.price}`;
            document.getElementById('detailChange').textContent = `${stock.change_percent >= 0 ? '+' : ''}${stock.change_percent}%`;
            document.getElementById('detailMarketCap').textContent = stock.market_cap;
            document.getElementById('detailPE').textContent = stock.pe_ratio;
            document.getElementById('detailROE').textContent = `${stock.roe}%`;
            document.getElementById('detailTheoretical').textContent = `¥${stock.theoretical_price}`;
            
            // 设置颜色
            const changeElement = document.getElementById('detailChange');
            const priceElement = document.getElementById('detailPrice');
            if (stock.change_percent >= 0) {
                changeElement.className = 'metric-value positive';
                priceElement.className = 'metric-value positive';
            } else {
                changeElement.className = 'metric-value negative';
                priceElement.className = 'metric-value negative';
            }
            
            document.getElementById('stockDetail').style.display = 'block';
        }

        // 排序表格
        function sortTable(column) {
            // 移除所有排序样式
            document.querySelectorAll('th').forEach(th => {
                th.classList.remove('sort-asc', 'sort-desc');
            });

            // 确定排序方向
            if (currentSortColumn === column) {
                currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                currentSortDirection = 'asc';
            }
            currentSortColumn = column;

            // 添加排序样式
            const headerElement = document.querySelector(`th[data-column="${column}"]`);
            headerElement.classList.add(currentSortDirection === 'asc' ? 'sort-asc' : 'sort-desc');

            // 排序数据
            watchlistData.sort((a, b) => {
                let aVal = a[column];
                let bVal = b[column];

                // 处理数值类型
                if (typeof aVal === 'number' && typeof bVal === 'number') {
                    if (currentSortDirection === 'asc') {
                        return aVal - bVal;
                    } else {
                        return bVal - aVal;
                    }
                }

                // 处理字符串类型
                if (currentSortDirection === 'asc') {
                    return aVal > bVal ? 1 : -1;
                } else {
                    return aVal < bVal ? 1 : -1;
                }
            });

            renderWatchlist();
        }

        // 渲染关注列表
        function renderWatchlist() {
            const tbody = document.getElementById('stockTableBody');
            
            tbody.innerHTML = watchlistData.map(stock => `
                <tr>
                    <td>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div>
                                <div style="font-weight: 600;">${stock.name}</div>
                                <div style="color: #8b8d97; font-size: 0.75rem;">${stock.code}</div>
                            </div>
                        </div>
                    </td>
                    <td><span style="background: ${getIndustryColor(stock.industry)}; padding: 4px 8px; border-radius: 12px; font-size: 0.75rem;">${stock.industry}</span></td>
                    <td>${stock.market_cap}</td>
                    <td><span style="color: ${stock.change_percent >= 0 ? '#22c55e' : '#ef4444'}; font-weight: 600;">${stock.current_price}</span></td>
                    <td><span style="color: ${stock.pe_ratio_ttm < 15 ? '#22c55e' : '#ef4444'};">${stock.pe_ratio_ttm}</span></td>
                    <td><span style="color: ${stock.roe > 15 ? '#ef4444' : '#22c55e'}; font-weight: 600;">${stock.roe}%</span></td>
                    <td>${stock.pb_ratio}</td>
                    <td>${(stock.dividend_payout_ratio * 100).toFixed(1)}%</td>
                    <td>${stock.correction_factor}</td>
                    <td>${stock.corrected_pe}</td>
                    <td><span style="color: #667eea; font-weight: 600;">${stock.theoretical_price}</span></td>
                    <td><button class="delete-btn" onclick="removeStock('${stock.code}')">删除</button></td>
                </tr>
            `).join('');
        }

        // 获取行业颜色
        function getIndustryColor(industry) {
            const colors = {
                '银行': 'rgba(102, 126, 234, 0.2); color: #667eea',
                '房地产开发': 'rgba(251, 191, 36, 0.2); color: #fbbf24',
                '旅游': 'rgba(239, 68, 68, 0.2); color: #ef4444',
                '白酒': 'rgba(34, 197, 94, 0.2); color: #22c55e',
                '航运港口': 'rgba(168, 85, 247, 0.2); color: #a855f7'
            };
            return colors[industry] || 'rgba(156, 163, 175, 0.2); color: #9ca3af';
        }

        // 添加到关注列表
        function addToWatchlist() {
            if (!selectedStock) {
                showMessage('请先选择一只股票', 'error');
                return;
            }
            showMessage(`${selectedStock.name} 已添加到关注列表`, 'success');
        }

        // 删除股票
        function removeStock(code) {
            if (confirm('确定要删除这只股票吗？')) {
                watchlistData = watchlistData.filter(stock => stock.code !== code);
                renderWatchlist();
                showMessage('股票已从关注列表删除', 'success');
            }
        }

        // 刷新数据
        function refreshData() {
            showMessage('正在更新数据...', 'loading');
            // 模拟数据更新
            setTimeout(() => {
                showMessage('数据更新完成', 'success');
            }, 2000);
        }

        // 显示消息
        function showMessage(message, type) {
            const container = document.getElementById('messageContainer');
            container.innerHTML = `<div class="status-message status-${type}">${message}</div>`;
            
            if (type === 'success') {
                setTimeout(() => {
                    container.innerHTML = '';
                }, 3000);
            }
        }

        // 初始化渲染
        renderWatchlist();