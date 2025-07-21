# StockInsight 项目文件结构

```
StockInsight/
├── .gitattributes
├── .trae/
│   └── rules/
│       └── project_rules.md
├── NETWORK_DIAGNOSTIC_GUIDE.md
├── README.md
├── SERVER_DEPLOYMENT_GUIDE.md
├── backend/
│   ├── README.md
│   ├── __pycache__/
│   │   ├── api_routes.cpython-311.pyc
│   │   ├── app.cpython-311.pyc
│   │   ├── auth_routes.cpython-311.pyc
│   │   ├── auth_utils.cpython-311.pyc
│   │   ├── config.cpython-311.pyc
│   │   ├── database.cpython-311.pyc
│   │   ├── stock_comp.cpython-311.pyc
│   │   └── stock_service.cpython-311.pyc
│   ├── api_routes.py
│   ├── app.py
│   ├── auth_routes.py
│   ├── auth_utils.py
│   ├── cleanup_test_data.py
│   ├── config.py
│   ├── database.py
│   ├── db_viewer.py
│   ├── package-lock.json
│   ├── package.json
│   ├── requirements.txt
│   ├── run.py
│   ├── stock_api.log
│   ├── stock_comp.py
│   ├── stock_data.db
│   ├── stock_service.py
│   ├── test_api.py
│   ├── test_auth_flow.py
│   ├── test_database_fix.py
│   ├── test_enhanced_watchlist.py
│   └── test_frontend_auth.py
├── frontend/
│   ├── .env
│   ├── README.md
│   ├── STYLE_OPTIMIZATION_SUMMARY.md
│   ├── build/
│   │   ├── api-test-simple.html
│   │   ├── api-test.html
│   │   ├── asset-manifest.json
│   │   ├── cache-test.html
│   │   ├── debug-api.html
│   │   ├── favicon.svg
│   │   ├── index.html
│   │   ├── login-test.html
│   │   ├── manifest.json
│   │   ├── network-diagnostic-test.html
│   │   ├── static/
│   │   │   ├── css/
│   │   │   │   ├── main.40ed887b.css
│   │   │   │   └── main.40ed887b.css.map
│   │   │   └── js/
│   │   │       ├── main.febb31c9.js
│   │   │       ├── main.febb31c9.js.LICENSE.txt
│   │   │       └── main.febb31c9.js.map
│   │   ├── test-auth.html
│   │   └── test.html
│   ├── package-lock.json
│   ├── package.json
│   ├── public/
│   │   ├── api-connection-test.html
│   │   ├── api-test-simple.html
│   │   ├── api-test.html
│   │   ├── cache-test.html
│   │   ├── cors-test.html
│   │   ├── debug-api.html
│   │   ├── env-debug.html
│   │   ├── favicon.svg
│   │   ├── index.html
│   │   ├── login-test.html
│   │   ├── manifest.json
│   │   ├── network-diagnostic-test.html
│   │   ├── simple-test.html
│   │   ├── test-auth.html
│   │   └── test.html
│   ├── src/
│   │   ├── App.css
│   │   ├── App.tsx
│   │   ├── TestApp.tsx
│   │   ├── components/
│   │   │   ├── ConfirmModal.tsx
│   │   │   ├── SearchBox.tsx
│   │   │   ├── StatCard.tsx
│   │   │   ├── StatsCards.tsx
│   │   │   ├── StockChart.tsx
│   │   │   ├── StockTable.tsx
│   │   │   ├── StyleDemo.tsx
│   │   │   ├── Toast.tsx
│   │   │   └── auth/
│   │   │       ├── Auth.css
│   │   │       ├── ForceStyledComponents.tsx
│   │   │       ├── GlobalAuthStyles.css
│   │   │       ├── Login.css
│   │   │       ├── Login.tsx
│   │   │       ├── ProtectedRoute.tsx
│   │   │       ├── Register.tsx
│   │   │       └── StyledComponents.tsx
│   │   ├── config/
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx
│   │   ├── index.css
│   │   ├── index.tsx
│   │   ├── layouts/
│   │   │   ├── AuthLayout.tsx
│   │   │   └── DashboardLayout.tsx
│   │   ├── pages/
│   │   │   ├── AuthPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── HomePage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   └── RegisterPage.tsx
│   │   ├── react-app-env.d.ts
│   │   ├── reportWebVitals.js
│   │   ├── routes/
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   └── authService.ts
│   │   ├── styles/
│   │   │   ├── AuthLayout.css
│   │   │   ├── ConfirmModal.css
│   │   │   ├── DashboardLayout.css
│   │   │   ├── DashboardPage.css
│   │   │   ├── HomePage.css
│   │   │   ├── LoginPage.css
│   │   │   ├── Toast.css
│   │   │   └── global.css
│   │   └── utils/
│   │       ├── CACHE_USAGE_GUIDE.md
│   │       ├── cache.ts
│   │       ├── exportUtils.ts
│   │       ├── helpers.ts
│   │       ├── networkDiagnostic.ts
│   │       └── stockCache.ts
│   ├── start.bat
│   ├── start_frontend.bat
│   ├── stock_api.log
│   ├── test_network.html
│   └── tsconfig.json
├── prompt/
│   ├── PROJECT_REPORT.md
│   ├── backend_api_documentation.md
│   ├── database_structure.md
│   ├── docs/
│   │   ├── POSTMAN_TESTING_GUIDE.md
│   │   ├── STOCK_CHART_GUIDE.md
│   │   ├── STOCK_HISTORY_IMPLEMENTATION.md
│   │   └── StockInsight_API.postman_collection.json
│   ├── frontend_need.md
│   ├── frontend_style.md
│   ├── login_page.html
│   ├── project_structure.md
│   └── sign_page.md
├── stock_api.log
└── stock_comp.py
```

## 项目结构说明

### 根目录
- **README.md**: 项目说明文档
- **NETWORK_DIAGNOSTIC_GUIDE.md**: 网络诊断指南
- **SERVER_DEPLOYMENT_GUIDE.md**: 服务器部署指南

### backend/ - 后端目录
- **app.py**: Flask 应用主文件
- **config.py**: 配置文件
- **database.py**: 数据库操作
- **api_routes.py**: API 路由
- **auth_routes.py**: 认证路由
- **stock_service.py**: 股票数据服务
- **requirements.txt**: Python 依赖包
- **stock_data.db**: SQLite 数据库文件

### frontend/ - 前端目录
- **src/**: 源代码目录
  - **components/**: React 组件
  - **pages/**: 页面组件
  - **services/**: API 服务
  - **utils/**: 工具函数
  - **styles/**: 样式文件
- **public/**: 静态资源和测试页面
- **build/**: 构建输出目录
- **package.json**: Node.js 依赖配置

### prompt/ - 项目文档目录
- **PROJECT_REPORT.md**: 项目报告
- **backend_api_documentation.md**: 后端 API 文档
- **database_structure.md**: 数据库结构说明
- **docs/**: 详细文档目录