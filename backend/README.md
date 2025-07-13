# 股票数据API后端

一个基于Flask的股票数据API服务，提供股票搜索、详情查询、历史数据获取和关注列表管理功能。

## 🚀 快速开始

### 环境要求

- Python 3.8+
- pip 包管理器

### 安装步骤

1. **进入后端目录**
   ```bash
   cd backend
   ```

2. **安装依赖包**
   ```bash
   pip install -r requirements.txt
   ```

3. **启动服务**
   ```bash
   python run.py
   ```
   或者
   ```bash
   python app.py
   ```

4. **验证服务**
   打开浏览器访问：http://localhost:5000/api/health

## 📚 API接口文档

### 基础信息

- **服务地址**: http://localhost:5000
- **API前缀**: /api
- **返回格式**: JSON
- **字符编码**: UTF-8

### 通用响应格式

**成功响应**:
```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

**错误响应**:
```json
{
  "success": false,
  "error": "错误描述",
  "error_code": "ERROR_CODE"
}
```

### 接口列表

#### 1. 健康检查

**接口**: `GET /api/health`

**描述**: 检查API服务状态

**响应示例**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "version": "1.0.0",
    "timestamp": 1703123456.789
  },
  "message": "股票数据API服务正常运行"
}
```

#### 2. 股票搜索

**接口**: `GET /api/stocks/search`

**参数**:
- `keyword` (必需): 搜索关键词，可以是股票代码或名称
- `limit` (可选): 返回结果数量限制，默认20

**请求示例**:
```
GET /api/stocks/search?keyword=中远海控
GET /api/stocks/search?keyword=601919
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "code": "601919",
      "name": "中远海控",
      "price": 14.94,
      "change_percent": 4.69,
      "change_amount": 0.67,
      "volume": 12345678,
      "turnover": 184567890.12
    }
  ],
  "count": 1,
  "keyword": "中远海控"
}
```

#### 3. 股票详情

**接口**: `GET /api/stocks/{stock_code}`

**参数**:
- `stock_code`: 6位股票代码

**请求示例**:
```
GET /api/stocks/601919
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "code": "601919",
    "name": "中远海控",
    "price": 14.94,
    "change_percent": 4.69,
    "change_amount": 0.67,
    "volume": 12345678,
    "turnover": 184567890.12,
    "high": 15.20,
    "low": 14.50,
    "open": 14.80,
    "yesterday_close": 14.27,
    "market_cap": "2355亿",
    "pe_ratio": 4.69,
    "pb_ratio": 0.26,
    "roe": 17.82,
    "eps": 3.18,
    "bps": 57.42,
    "dividend_yield": 0.35,
    "is_watched": false,
    "timestamp": "2024-01-01T12:00:00"
  }
}
```

#### 4. 股票历史数据

**接口**: `GET /api/stocks/{stock_code}/history`

**参数**:
- `stock_code`: 6位股票代码
- `period` (可选): 时间周期，支持 1d, 1w, 1m, 3m, 6m, 1y，默认1y

**请求示例**:
```
GET /api/stocks/601919/history?period=1m
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "date": "2024-01-01",
      "open": 14.50,
      "close": 14.80,
      "high": 15.00,
      "low": 14.30,
      "volume": 12345678,
      "turnover": 184567890.12,
      "change_percent": 2.07,
      "change_amount": 0.30
    }
  ],
  "count": 30,
  "period": "1m",
  "stock_code": "601919"
}
```

#### 5. 批量获取股票数据

**接口**: `POST /api/stocks/batch`

**请求体**:
```json
{
  "codes": ["601919", "600919", "000001"]
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "stocks": [
      {
        "code": "601919",
        "name": "中远海控",
        "price": 14.94
      }
    ],
    "requested_count": 3,
    "valid_count": 3,
    "success_count": 1,
    "invalid_codes": []
  }
}
```

#### 6. 获取关注列表

**接口**: `GET /api/watchlist`

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "code": "601919",
      "name": "中远海控",
      "industry": "航运港口",
      "added_time": "2024-01-01 12:00:00",
      "updated_time": "2024-01-01 12:00:00",
      "current_price": 14.94,
      "change_percent": 4.69,
      "change_amount": 0.67
    }
  ],
  "count": 1
}
```

#### 7. 添加股票到关注列表

**接口**: `POST /api/watchlist`

**请求体**:
```json
{
  "code": "601919",
  "industry": "航运港口"
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "code": "601919",
    "name": "中远海控",
    "industry": "航运港口"
  },
  "message": "添加到关注列表成功"
}
```

#### 8. 删除关注的股票

**接口**: `DELETE /api/watchlist/{stock_code}`

**请求示例**:
```
DELETE /api/watchlist/601919
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "code": "601919"
  },
  "message": "从关注列表删除成功"
}
```

#### 9. 市场概览

**接口**: `GET /api/market/overview`

**响应示例**:
```json
{
  "success": true,
  "data": {
    "indices": {
      "上证指数": {
        "code": "000001",
        "name": "上证指数",
        "price": 3200.50,
        "change_percent": 1.25,
        "change_amount": 39.50
      }
    },
    "timestamp": "2024-01-01T12:00:00"
  }
}
```

#### 10. 管理接口

**清空缓存**: `POST /api/cache/clear`

**API统计**: `GET /api/stats?hours=24`

## 🔧 配置说明

### 环境配置

通过设置环境变量 `FLASK_ENV` 来切换配置：

- `development`: 开发环境（默认）
- `production`: 生产环境
- `testing`: 测试环境

### 主要配置项

- **缓存时间**: 5分钟
- **请求频率限制**: 每分钟60次
- **批量查询限制**: 最多20只股票
- **搜索结果限制**: 最多20条

## 📁 项目结构

```
backend/
├── app.py              # 主应用文件
├── run.py              # 启动脚本
├── config.py           # 配置文件
├── database.py         # 数据库操作
├── stock_service.py    # 股票数据服务
├── api_routes.py       # API路由
├── requirements.txt    # 依赖包列表
├── README.md          # 说明文档
├── stock_data.db      # SQLite数据库（自动创建）
└── stock_api.log      # 日志文件（自动创建）
```

## 🛠️ 开发说明

### 数据源

本项目使用 [AKShare](https://akshare.akfamily.xyz/) 库获取股票数据，这是一个免费的金融数据接口库。

### 缓存机制

- 股票基本信息缓存5分钟
- 搜索结果缓存5分钟
- 历史数据缓存5分钟

### 错误处理

所有API都有统一的错误处理机制，包括：

- 参数验证
- 数据格式检查
- 外部API调用异常
- 数据库操作异常
- 请求频率限制

### 日志记录

- 所有API调用都会记录日志
- 错误信息会详细记录
- 日志文件：`stock_api.log`

## 🚨 常见问题

### 1. 安装依赖失败

**问题**: pip install 失败

**解决方案**:
```bash
# 升级pip
pip install --upgrade pip

# 使用国内镜像源
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple/
```

### 2. AKShare数据获取失败

**问题**: 股票数据获取返回空或错误

**解决方案**:
- 检查网络连接
- 确认股票代码格式正确（6位数字）
- 重试请求（有缓存机制）

### 3. 数据库权限问题

**问题**: SQLite数据库创建失败

**解决方案**:
- 确保当前目录有写权限
- 检查磁盘空间

### 4. 端口占用

**问题**: 5000端口被占用

**解决方案**:
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# 或修改app.py中的端口号
app.run(host='0.0.0.0', port=5001, debug=config.DEBUG)
```

## 📈 性能优化

1. **缓存策略**: 合理设置缓存时间，减少API调用
2. **批量查询**: 使用批量接口减少请求次数
3. **请求频率**: 遵守频率限制，避免被限流
4. **数据库索引**: 关注列表查询已优化索引

## 🔒 安全说明

1. **CORS配置**: 已配置跨域访问
2. **请求频率限制**: 防止API滥用
3. **输入验证**: 所有输入都经过验证
4. **错误处理**: 不暴露敏感信息

## 📞 技术支持

如果遇到问题，请检查：

1. Python版本是否符合要求
2. 依赖包是否正确安装
3. 网络连接是否正常
4. 日志文件中的错误信息

---

**版本**: 1.0.0  
**更新时间**: 2024年1月  
**作者**: AI助手