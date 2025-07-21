## 项目概述
这是一个股票数据看板系统，使用 React + TypeScript + Flask 构建。

## 技术栈
### 前端
- React 18 + TypeScript
- Ant Design 5.12.8 (UI组件库)
- Recharts 2.8.0 (图表库)
- Axios 1.6.2 (HTTP客户端)
- CSS3 自定义样式
- Create React App (脚手架)

### 后端
- Flask 2.3.3 (Web框架)
- SQLite (数据库，测试阶段使用)
- easyquotation 0.7.7 (实时行情数据)
- BeautifulSoup4 4.13.4 (HTML解析)
- Pandas 2.0.3 (数据处理)
- Requests 2.31.0 (HTTP请求)
- Gunicorn (生产环境WSGI服务器)

## 项目文件的存放
- 请一定遵循此条规则
- 整个后端文件都放在backend文件夹下
- 整个前端文件都放在frontend文件夹下，尤其是node_modules只能放在frontend文件夹下！！！不要给我把一些项目文件自己放在这两个文件夹之外！！！！
- 所有生成的md文件都存放在Report文件夹下.

## 端口
- 在开发阶段，前端使用 3000 端口，后端使用 5000 端口
- 在生产阶段，前端和后端端口根据 Nginx 配置
- 在开发阶段，前端不要有任何其他的接口，且不要使用代理，直接前端对接后端即可。

## 数据库设计原则
1. 当前使用 SQLite，适合测试和小规模部署
2. 设计时考虑未来迁移到 PostgreSQL/MySQL
3. 使用 SQL 标准语法，避免 SQLite 特有功能
4. 预留索引设计，便于未来优化

## 项目发展阶段
- **当前阶段**：MVP/测试阶段，用户量 < 100
- **短期目标**：完善核心功能，优化用户体验
- **中期目标**：支持 1000+ 用户，可能需要迁移数据库
- **长期目标**：支持万级用户，微服务架构

## 数据库使用建议
### 保持 SQLite 的场景
- 用户量 < 1000
- 并发请求 < 100/秒
- 数据量 < 1GB
- 单机部署

### 需要迁移的信号
- 写入操作频繁排队
- 数据库文件超过 1GB
- 需要实时数据同步
- 需要复杂的事务处理

## 为未来迁移做准备
1. 使用 ORM 或数据库抽象层
2. 避免使用 SQLite 特有语法
3. 合理设计表结构和索引
4. 定期备份数据

## 开发原则
1. TypeScript 严格类型
2. 函数式组件 + Hooks
3. 统一使用 Ant Design 组件
4. API 统一响应格式：`{ success: boolean, data?: any, message?: string }`
5. 异步操作用 async/await + try-catch
6. 错误提示用 message.error()

## UI 规范
- 深色主题 (#0a0b0d 背景)
- 响应式设计
- Loading 用 Spin 组件
- 消息提示用 message