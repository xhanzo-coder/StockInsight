# 股票数据看板 - 前端项目

这是一个基于 React + TypeScript + Ant Design 的现代化股票数据看板应用。

## 🚀 功能特性

### 核心功能
- **股票搜索**: 实时搜索股票代码或名称，支持模糊匹配
- **关注列表**: 添加/移除股票到个人关注列表
- **数据展示**: 完整的股票财务指标展示
- **实时更新**: 自动刷新股票价格和涨跌幅数据
- **智能排序**: 支持按各种指标排序和筛选

### 数据指标
- 基础信息：股票代码、名称、当前价格、涨跌幅
- 估值指标：市值、TTM市盈率、市净率、净资产收益率
- 高级指标：股利支付率、修正系数、修正市盈率、理论股价

### 界面特色
- **深色主题**: 现代化的深色界面设计
- **响应式布局**: 适配各种屏幕尺寸
- **数据可视化**: 直观的统计卡片和图表
- **交互体验**: 流畅的动画和反馈效果

## 🛠️ 技术栈

- **React 18**: 现代化的前端框架
- **TypeScript**: 类型安全的开发体验
- **Ant Design**: 企业级UI组件库
- **Axios**: HTTP客户端库
- **CSS3**: 自定义样式和动画

## 📦 项目结构

```
frontend/
├── public/
│   └── index.html          # HTML模板
├── src/
│   ├── components/         # React组件
│   │   ├── StatsCards.tsx  # 统计卡片组件
│   │   ├── SearchBox.tsx   # 搜索框组件
│   │   └── StockTable.tsx  # 股票表格组件
│   ├── services/
│   │   └── api.ts          # API服务层
│   ├── styles/
│   │   └── global.css      # 全局样式
│   ├── utils/
│   │   └── helpers.ts      # 工具函数
│   ├── App.tsx             # 主应用组件
│   ├── index.tsx           # 应用入口
│   └── react-app-env.d.ts  # 类型声明
├── package.json            # 项目配置
├── tsconfig.json           # TypeScript配置
└── README.md               # 项目文档
```

## 🚀 快速开始

### 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0 或 yarn >= 1.22.0

### 安装依赖
```bash
cd frontend
npm install
# 或
yarn install
```

### 启动开发服务器
```bash
npm start
# 或
yarn start
```

应用将在 http://localhost:3000 启动，并自动代理API请求到 http://localhost:5000

### 构建生产版本
```bash
npm run build
# 或
yarn build
```

### 运行测试
```bash
npm test
# 或
yarn test
```

## 🔧 配置说明

### API代理配置
项目已配置代理，所有 `/api/*` 请求会自动转发到后端服务器 `http://localhost:5000`

### 环境变量
可以创建 `.env` 文件来配置环境变量：
```env
REACT_APP_API_BASE_URL=http://localhost:5000
REACT_APP_REFRESH_INTERVAL=300000
```

## 📱 界面预览

### 主界面
- 顶部导航栏：包含Logo、搜索框和操作按钮
- 统计卡片：显示关注股票总数、平均市盈率等关键指标
- 数据表格：完整的股票信息展示，支持排序和操作

### 功能特色
- **智能搜索**: 输入股票代码或名称即可实时搜索
- **一键添加**: 搜索结果中直接添加到关注列表
- **数据排序**: 点击表头可按各种指标排序
- **颜色编码**: 涨跌用红绿色区分，优质指标用绿色标注
- **操作确认**: 删除操作有确认提示，防止误操作

## 🎨 设计理念

### 色彩方案
- **主色调**: 深蓝紫渐变 (#667eea)
- **背景色**: 深色系 (#1a1d29, #2a2d3a)
- **文字色**: 白色和灰色层次
- **状态色**: 绿色(上涨/优质)、红色(下跌/风险)、灰色(中性)

### 交互设计
- **响应式反馈**: 按钮悬停、点击有视觉反馈
- **加载状态**: 数据加载时显示骨架屏或加载动画
- **错误处理**: 友好的错误提示和重试机制
- **数据刷新**: 自动刷新和手动刷新相结合

## 🔗 API集成

### 主要接口
- `GET /api/watchlist` - 获取关注列表
- `POST /api/watchlist` - 添加股票到关注列表
- `DELETE /api/watchlist/{code}` - 从关注列表移除股票
- `GET /api/search` - 搜索股票
- `GET /api/stock/{code}` - 获取股票详情
- `GET /api/market/overview` - 获取市场概览

### 数据格式
所有API返回统一的响应格式：
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
```

## 🚀 部署说明

### 开发环境
1. 确保后端服务在 http://localhost:5000 运行
2. 启动前端开发服务器：`npm start`
3. 访问 http://localhost:3000

### 生产环境
1. 构建生产版本：`npm run build`
2. 将 `build` 目录部署到Web服务器
3. 配置反向代理将API请求转发到后端服务

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支：`git checkout -b feature/new-feature`
3. 提交更改：`git commit -am 'Add new feature'`
4. 推送分支：`git push origin feature/new-feature`
5. 提交Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🆘 常见问题

### Q: 为什么搜索不到股票？
A: 请检查后端服务是否正常运行，以及网络连接是否正常。

### Q: 数据更新频率是多少？
A: 前端每5分钟自动刷新一次数据，也可以手动点击刷新按钮。

### Q: 支持哪些浏览器？
A: 支持所有现代浏览器，包括Chrome、Firefox、Safari、Edge等。

### Q: 如何自定义主题？
A: 可以修改 `src/index.tsx` 中的 `darkTheme` 配置来自定义主题色彩。