我需要你帮我用React开发一个股票数据看板，要求如下：

## 🎯 项目技术栈
- React 18 + TypeScript
- Ant Design (antd) - UI组件库
- Recharts - 图表库
- Axios - API请求
- 使用 Create React App 创建项目

## 🎨 设计风格要求
参考我提供的HTML页面设计，实现相同的视觉效果：
- 深色主题 (#1a1d29背景色)
- 卡片式布局
- 现代化的圆角和间距
- 蓝色主色调 (#667eea)
- 数据用红绿颜色区分涨跌

## 📋 功能需求

### 1. 页面布局
- 顶部导航：Logo + 搜索框(带搜索按钮) + 更新按钮
- 统计卡片：4个数据统计卡片
- 股票详情：选中股票后显示，包含趋势图和6个指标卡片
- 数据表格：关注列表，支持排序
- 操作列：每个股票行末增加操作列，包含“删除”按钮

### 2. 核心功能
- 搜索功能：Antd的AutoComplete组件 + 搜索按钮
- 股票趋势图：使用Recharts的LineChart组件
- 数据表格：Antd的Table组件，支持排序
- 增删操作：添加/删除关注列表

### 3. API接口对接
请对接以下后端接口：
- GET /api/watchlist - 获取关注列表
- GET /api/stocks/search?keyword=xxx - 搜索股票  
- GET /api/stocks/{code} - 获取股票详情
- GET /api/stocks/{code}/history - 获取历史数据(用于趋势图)
- POST /api/watchlist - 添加股票
- DELETE /api/watchlist/{code} - 删除股票

### 4. 数据表格字段 (13列)
股票代码、名称、行业、当前价格、市盈率TTM、ROE、市净率、股利支付率、修正系数、修正市盈率、理论股价、操作

### 5. 特殊要求
- 使用Recharts实现真正的股票趋势图，不是占位符
- 使用Antd的Table组件实现排序功能
- 使用Antd的AutoComplete实现搜索下拉
- 响应式设计，支持移动端
- 错误处理和Loading状态

## 📦 项目结构要求
请创建以下文件结构：