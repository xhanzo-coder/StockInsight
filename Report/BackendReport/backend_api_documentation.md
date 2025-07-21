# StockInsight 后端API接口说明

## API概述

StockInsight 后端提供RESTful API服务，包括用户认证、股票数据查询、关注列表管理等功能。所有API都返回JSON格式的响应。

**基础URL：** `http://localhost:5000`  
**API版本：** v1.0.0  
**更新时间：** 2025-01-17

## 响应格式

### 成功响应格式
```json
{
    "success": true,
    "data": {...},
    "message": "操作成功"
}
```

### 错误响应格式
```json
{
    "success": false,
    "error_code": "ERROR_CODE",
    "error": "错误描述信息"
}
```

## 认证机制

### JWT Token认证
- 使用JWT (JSON Web Token) 进行用户认证
- Token在请求头中传递：`Authorization: Bearer <token>`
- Token包含用户ID和用户名信息
- Token有效期：24小时（可配置）
- 支持自动刷新机制

### 认证装饰器
- `@token_required`: 必须提供有效token
- `@optional_token`: 可选token，支持匿名访问

### 前端集成
- 前端使用 AuthContext 进行全局认证状态管理
- 自动处理token存储、验证和刷新
- 支持自动重定向和错误处理

## API接口详细说明

### 1. 认证相关接口 (`/api/auth`)

#### 1.1 用户注册
- **URL:** `POST /api/auth/register`
- **描述:** 注册新用户账户
- **认证:** 无需认证
- **请求体:**
```json
{
    "username": "用户名",
    "email": "邮箱地址",
    "password": "密码"
}
```
- **验证规则:**
  - 用户名：3-20个字符，只能包含字母、数字、下划线
  - 邮箱：有效的邮箱格式
  - 密码：至少6个字符
- **响应示例:**
```json
{
    "success": true,
    "message": "注册成功",
    "data": {
        "user": {
            "id": 1,
            "username": "testuser",
            "email": "test@example.com"
        },
        "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
    }
}
```
- **错误响应:**
  - `400`: 输入数据验证失败
  - `409`: 用户名已存在
  - `500`: 服务器内部错误

#### 1.2 用户登录
- **URL:** `POST /api/auth/login`
- **描述:** 用户登录获取访问令牌
- **认证:** 无需认证
- **请求体:**
```json
{
    "username": "用户名",
    "password": "密码"
}
```
- **响应示例:**
```json
{
    "success": true,
    "message": "登录成功",
    "data": {
        "user": {
            "id": 1,
            "username": "admin",
            "email": "admin@stockinsight.com"
        },
        "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
    }
}
```
- **错误响应:**
  - `400`: 用户名或密码为空
  - `401`: 用户名或密码错误
  - `500`: 服务器内部错误

#### 1.3 验证令牌
- **URL:** `GET /api/auth/verify`
- **描述:** 验证当前令牌的有效性，用于前端自动登录检查
- **认证:** 需要token
- **响应示例:**
```json
{
    "success": true,
    "message": "令牌有效",
    "data": {
        "user": {
            "id": 1,
            "username": "admin",
            "email": "admin@stockinsight.com"
        }
    }
}
```
- **错误响应:**
  - `401`: Token无效或已过期
  - `404`: 用户不存在
  - `500`: 服务器内部错误

#### 1.4 获取用户资料
- **URL:** `GET /api/auth/profile`
- **描述:** 获取当前用户的详细资料
- **认证:** 需要token
- **响应示例:**
```json
{
    "success": true,
    "message": "获取成功",
    "data": {
        "user": {
            "id": 1,
            "username": "admin",
            "email": "admin@stockinsight.com",
            "created_time": "2025-01-17 10:30:00",
            "last_login": "2025-01-17 14:20:15"
        }
    }
}
```

#### 1.5 用户登出
- **URL:** `POST /api/auth/logout`
- **描述:** 用户登出（主要由客户端处理token删除）
- **认证:** 需要token
- **响应示例:**
```json
{
    "success": true,
    "message": "登出成功"
}
```

#### 1.6 创建测试用户
- **URL:** `POST /api/auth/create-test-user`
- **描述:** 创建测试用户（仅开发环境使用）
- **认证:** 无需认证
- **响应示例:**
```json
{
    "success": true,
    "message": "测试用户创建成功",
    "data": {
        "user": {
            "id": 1,
            "username": "admin",
            "email": "admin@stockinsight.com"
        },
        "credentials": {
            "username": "admin",
            "password": "admin123"
        }
    }
}
```

### 2. 股票数据接口 (`/api`)

#### 2.1 健康检查
- **URL:** `GET /api/health`
- **描述:** 检查API服务状态
- **认证:** 无需认证
- **响应示例:**
```json
{
    "success": true,
    "data": {
        "status": "healthy",
        "version": "1.0.0",
        "timestamp": 1642694400.0
    },
    "message": "股票数据API服务正常运行"
}
```

#### 2.2 股票搜索
- **URL:** `GET /api/stocks/search`
- **描述:** 根据关键词搜索股票，支持股票代码或名称模糊匹配
- **认证:** 无需认证
- **查询参数:**
  - `keyword`: 搜索关键词（必需）
  - `limit`: 返回结果数量限制（可选，默认10，最大50）
- **限制:** 最多返回20条搜索结果
- **请求示例:** `GET /api/stocks/search?keyword=平安&limit=5`
- **响应示例:**
```json
{
    "success": true,
    "data": [
        {
            "code": "000001",
            "name": "平安银行",
            "industry": "银行"
        },
        {
            "code": "601318",
            "name": "中国平安",
            "industry": "保险"
        }
    ],
    "count": 2,
    "keyword": "平安"
}
```
- **错误响应:**
  - `400`: 搜索关键词不能为空
  - `500`: 服务器内部错误

#### 2.3 获取股票详细信息
- **URL:** `GET /api/stocks/{stock_code}`
- **描述:** 获取指定股票的详细信息，包含实时价格和财务指标
- **认证:** 可选token（影响is_watched字段）
- **路径参数:**
  - `stock_code`: 6位股票代码
- **请求示例:** `GET /api/stocks/000001`
- **响应示例:**
```json
{
    "success": true,
    "data": {
        "code": "000001",
        "name": "平安银行",
        "current_price": 12.50,
        "change_percent": "+2.45%",
        "change_amount": "+0.30",
        "market_cap": "2420.5",
        "pe_ratio_ttm": "5.2",
        "roe": "12.8%",
        "market_earning_ratio": "8.5",
        "pb_ratio": "0.65",
        "dividend_payout_ratio": "30.2%",
        "correction_factor": "1.15",
        "corrected_market_earning_ratio": "7.4",
        "theoretical_price": "14.20",
        "is_watched": true
    }
}
```
- **错误响应:**
  - `400`: 股票代码格式错误
  - `404`: 股票不存在或数据获取失败
  - `500`: 服务器内部错误

#### 2.4 获取股票历史数据
- **URL:** `GET /api/stocks/{stock_code}/history`
- **描述:** 获取股票历史价格数据
- **认证:** 无需认证
- **路径参数:**
  - `stock_code`: 6位股票代码
- **查询参数:**
  - `period`: 时间周期（可选，支持：1d, 5d, 1m, 3m, 6m, 1y, 2y, 5y, 10y, max）
- **请求示例:** `GET /api/stocks/000001/history?period=1m`
- **响应示例:**
```json
{
    "success": true,
    "data": [
        {
            "date": "2025-01-01",
            "open": 12.20,
            "high": 12.80,
            "low": 12.10,
            "close": 12.50,
            "volume": 1500000
        }
    ],
    "count": 30,
    "period": "1m",
    "stock_code": "000001",
    "cache_hit": true
}
```

#### 2.5 批量获取股票数据
- **URL:** `POST /api/stocks/batch`
- **描述:** 批量获取多只股票的基本信息
- **认证:** 无需认证
- **请求体:**
```json
{
    "codes": ["000001", "601318", "002594"]
}
```
- **响应示例:**
```json
{
    "success": true,
    "data": {
        "stocks": [
            {
                "code": "000001",
                "name": "平安银行",
                "current_price": 12.50,
                "change_percent": "+2.45%"
            }
        ],
        "requested_count": 3,
        "valid_count": 3,
        "success_count": 1
    }
}
```

### 3. 关注列表接口 (`/api/watchlist`)

#### 3.1 获取关注列表

- **URL:** `GET /api/watchlist`
- **描述:** 获取当前用户的股票关注列表，包含完整的股票信息和财务指标
- **认证:** 需要token（必须登录）
- **响应示例:**
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "code": "000001",
            "name": "平安银行",
            "industry": "银行",
            "is_pinned": false,
            "added_time": "2025-07-11 04:22:22",
            "updated_time": "2025-07-11 04:22:22",
            "current_price": 12.50,
            "change_percent": "+2.45%",
            "change_amount": "+0.30",
            "market_cap": "2420.5",
            "pe_ratio_ttm": 5.2,
            "roe": "12.5%",
            "market_earning_ratio": 8.5,
            "pb_ratio": 0.85,
            "dividend_payout_ratio": "30.2%",
            "correction_factor": 1.2,
            "corrected_market_earning_ratio": 7.1,
            "theoretical_price": 13.20
        }
    ],
    "count": 1
}
```
- **错误响应:**
  - `401`: 未授权访问
  - `500`: 服务器内部错误

#### 3.2 添加股票到关注列表
- **URL:** `POST /api/watchlist`
- **描述:** 将指定股票添加到当前用户的关注列表
- **认证:** 需要token（必须登录）
- **请求体:**
```json
{
    "code": "000001",
    "industry": "银行"
}
```
- **响应示例:**
```json
{
    "success": true,
    "data": {
        "code": "000001",
        "name": "平安银行",
        "industry": "银行"
    },
    "message": "添加到关注列表成功"
}
```
- **错误响应:**
  - `400`: 请求数据格式错误，需要code字段 / 股票代码格式错误
  - `401`: 未授权访问
  - `404`: 股票不存在或数据获取失败
  - `409`: 股票已在关注列表中
  - `500`: 服务器内部错误

#### 3.3 从关注列表删除股票
- **URL:** `DELETE /api/watchlist/{stock_code}`
- **描述:** 从当前用户的关注列表中删除指定股票
- **认证:** 需要token（必须登录）
- **路径参数:**
  - `stock_code`: 6位股票代码
- **请求示例:** `DELETE /api/watchlist/000001`
- **响应示例:**
```json
{
    "success": true,
    "data": {
        "code": "000001"
    },
    "message": "从关注列表删除成功"
}
```
- **错误响应:**
  - `400`: 股票代码格式错误
  - `401`: 未授权访问
  - `404`: 股票不在关注列表中
  - `500`: 服务器内部错误

#### 3.4 切换股票置顶状态
- **URL:** `POST /api/watchlist/{stock_code}/pin`
- **描述:** 切换指定股票在关注列表中的置顶状态
- **认证:** 需要token（必须登录）
- **路径参数:**
  - `stock_code`: 6位股票代码
- **请求示例:** `POST /api/watchlist/000001/pin`
- **响应示例:**
```json
{
    "success": true,
    "data": {
        "code": "000001",
        "is_pinned": true
    },
    "message": "股票置顶成功"
}
```
- **错误响应:**
  - `400`: 股票代码格式错误
  - `401`: 未授权访问
  - `404`: 股票不在关注列表中
  - `500`: 服务器内部错误

## 5. 管理功能接口

### 5.1 清空缓存
- **URL**: `/api/cache/clear`
- **方法**: POST
- **描述**: 清空系统缓存（管理功能）
- **认证**: 不需要
- **响应示例**:
```json
{
  "success": true,
  "data": {
    "cleared": true
  },
  "message": "缓存清空成功"
}
```
- **错误响应**:
  - `500`: 服务器内部错误

### 5.2 获取API统计信息
- **URL**: `/api/stats`
- **方法**: GET
- **描述**: 获取API调用统计信息（管理功能）
- **认证**: 不需要
- **参数**:
  - `hours` (query, 可选): 统计时间范围（小时），默认24，最大168（7天）
- **响应示例**:
```json
{
  "success": true,
  "data": {
    "api_stats": {
      "total_calls": 1250,
      "success_calls": 1200,
      "error_calls": 50,
      "success_rate": "96.0%"
    },
    "cache_stats": {
      "hit_rate": "85.2%",
      "total_requests": 1000,
      "cache_hits": 852
    },
    "period_hours": 24
  }
}
```
- **错误响应**:
  - `500`: 服务器内部错误

## 6. 错误处理

### 6.1 统一错误响应格式
所有API接口在发生错误时都会返回统一的错误响应格式：

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述信息"
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### 6.2 常见错误码说明

| 错误码 | HTTP状态码 | 描述 |
|--------|------------|------|
| `MISSING_KEYWORD` | 400 | 搜索关键词不能为空 |
| `INVALID_STOCK_CODE` | 400 | 股票代码格式错误 |
| `STOCK_NOT_FOUND` | 404 | 股票不存在或数据获取失败 |
| `INVALID_PERIOD` | 400 | 时间周期参数错误 |
| `INVALID_REQUEST_DATA` | 400 | 请求数据格式错误 |
| `INVALID_CODES_FORMAT` | 400 | codes必须是非空数组 |
| `TOO_MANY_CODES` | 400 | 一次最多查询20只股票 |
| `ALREADY_IN_WATCHLIST` | 409 | 股票已在关注列表中 |
| `NOT_IN_WATCHLIST` | 404 | 股票不在关注列表中 |
| `RATE_LIMIT_EXCEEDED` | 429 | 请求过于频繁，请稍后再试 |
| `API_NOT_FOUND` | 404 | 接口不存在 |
| `INTERNAL_ERROR` | 500 | 服务器内部错误 |
| `UNAUTHORIZED` | 401 | 未授权访问 |
| `TOKEN_EXPIRED` | 401 | Token已过期 |
| `INVALID_TOKEN` | 401 | Token无效 |

### 6.3 请求频率限制
- 所有API接口都有请求频率限制：每分钟最多60次请求
- 超出限制时返回429状态码和`RATE_LIMIT_EXCEEDED`错误
- 建议客户端实现指数退避重试机制

### 6.4 数据验证规则
- **股票代码**: 必须是6位数字字符串
- **搜索关键词**: 不能为空字符串
- **时间周期**: 仅支持 1d/1w/1m/3m/6m/1y
- **批量查询**: 一次最多查询20只股票
- **用户名**: 3-20个字符，支持字母、数字、下划线
- **密码**: 最少6个字符

## 7. 性能优化

### 7.1 缓存机制
- 股票基本信息缓存5分钟
- 搜索结果缓存5分钟
- 市场概览数据缓存1分钟
- 支持手动清空缓存

### 7.2 数据更新频率
- 股票实时价格：每5分钟更新
- 财务指标数据：每日更新
- 市场概览：每分钟更新

### 7.3 并发处理
- 支持高并发请求
- 数据库连接池优化
- 异步数据获取

## 8. 安全说明

### 8.1 认证安全
- JWT Token采用HS256算法签名
- Token有效期24小时，支持自动刷新
- 密码使用bcrypt加密存储
- 支持安全的登出机制

### 8.2 数据安全
- 所有用户输入都经过验证和清理
- SQL注入防护
- XSS攻击防护
- CORS跨域访问控制

### 8.3 日志记录
- 记录所有API调用日志
- 记录认证失败尝试
- 记录系统错误和异常
- 不记录敏感信息（密码、Token等）

## 9. 使用示例

### 9.1 完整的用户认证流程

```javascript
// 1. 用户注册
const registerResponse = await fetch('/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: 'testuser',
    password: 'password123'
  })
});

// 2. 用户登录
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: 'testuser',
    password: 'password123'
  })
});

const { token } = await loginResponse.json();

// 3. 使用Token访问受保护的接口
const watchlistResponse = await fetch('/api/watchlist', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### 9.2 股票数据查询示例

```javascript
// 搜索股票
const searchResponse = await fetch('/api/stocks/search?keyword=平安');
const searchData = await searchResponse.json();

// 获取股票详细信息
const stockResponse = await fetch('/api/stocks/000001');
const stockData = await stockResponse.json();

// 批量获取股票信息
const batchResponse = await fetch('/api/stocks/batch', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    codes: ['000001', '000002', '600036']
  })
});
```

### 9.3 关注列表管理示例

```javascript
// 添加股票到关注列表
const addResponse = await fetch('/api/watchlist', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    code: '000001',
    industry: '银行'
  })
});

// 获取关注列表
const watchlistResponse = await fetch('/api/watchlist', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// 删除关注的股票
const deleteResponse = await fetch('/api/watchlist/000001', {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## 10. 注意事项

### 10.1 开发建议
1. **错误处理**: 始终检查API响应的`success`字段，正确处理错误情况
2. **Token管理**: 实现Token自动刷新机制，避免用户频繁重新登录
3. **请求重试**: 对于网络错误或服务器错误，实现合理的重试机制
4. **数据缓存**: 在客户端适当缓存数据，减少不必要的API调用
5. **用户体验**: 在数据加载时显示加载状态，提升用户体验

### 10.2 性能优化建议
1. **批量请求**: 尽量使用批量接口减少请求次数
2. **分页加载**: 对于大量数据，实现分页或虚拟滚动
3. **防抖处理**: 对搜索等频繁操作实现防抖机制
4. **并发控制**: 控制同时发起的请求数量，避免过载

### 10.3 安全注意事项
1. **Token存储**: 安全存储JWT Token，避免XSS攻击
2. **HTTPS**: 生产环境必须使用HTTPS协议
3. **输入验证**: 客户端也要进行输入验证，不能完全依赖服务端
4. **敏感信息**: 不要在客户端存储敏感信息

### 10.4 兼容性说明
1. **浏览器支持**: 支持现代浏览器（Chrome 70+, Firefox 65+, Safari 12+）
2. **移动端**: 支持移动端浏览器访问
3. **API版本**: 当前API版本为v1.0.0，后续版本会保持向后兼容

### 10.5 故障排除
1. **网络问题**: 检查网络连接和防火墙设置
2. **认证失败**: 检查Token是否有效和正确传递
3. **数据异常**: 检查请求参数格式和数据类型
4. **性能问题**: 检查请求频率和数据量大小

## 11. 更新日志

### v1.0.0 (2024-01-01)
- 初始版本发布
- 实现用户认证系统
- 实现股票数据查询功能
- 实现关注列表管理
- 实现基础管理功能
- 支持JWT Token认证
- 实现请求频率限制
- 添加完整的错误处理机制

## 请求频率限制

- 每个IP地址每分钟最多60次请求
- 超出限制返回429状态码
- 限制窗口为60秒滑动窗口

## 数据缓存机制

- 股票基本信息缓存5分钟
- 股票历史数据缓存30分钟
- 市场概览数据缓存1分钟
- 支持手动清空缓存

## 日志记录

- 所有API调用都会记录到数据库
- 记录内容包括：端点、方法、IP、响应时间、状态码等
- 支持统计分析和监控

## 开发环境配置

- 服务器地址：`http://localhost:5000`
- 调试模式：开启
- 日志级别：INFO
- 数据库：SQLite（`backend/stock_data.db`）

## 生产环境注意事项

1. 关闭调试模式
2. 配置适当的日志级别
3. 设置安全的JWT密钥
4. 配置HTTPS
5. 设置适当的CORS策略
6. 定期备份数据库
7. 监控API性能和错误率

---

**文档最后更新**: 2024-01-01  
**API版本**: v1.0.0  
**维护团队**: StockInsight开发团队