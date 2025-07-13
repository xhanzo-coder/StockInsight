# Postman API测试指南

本文档详细说明如何使用Postman测试股票数据API的所有接口。

## 📋 测试前准备

### 1. 启动后端服务

确保后端服务已启动并运行在 `http://localhost:5000`

```bash
cd backend
python run.py
```

### 2. 安装Postman

下载并安装 [Postman](https://www.postman.com/downloads/)

### 3. 创建新的Collection

在Postman中创建一个新的Collection，命名为 "股票数据API测试"

## 🧪 API接口测试

### 1. 健康检查接口

**目的**: 验证API服务是否正常运行

**配置**:
- **Method**: GET
- **URL**: `http://localhost:5000/api/health`
- **Headers**: 无需特殊设置

**预期结果**:
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

**状态码**: 200 OK

---

### 2. 股票搜索接口

**目的**: 测试股票搜索功能

#### 测试用例2.1: 按股票名称搜索

**配置**:
- **Method**: GET
- **URL**: `http://localhost:5000/api/stocks/search`
- **Params**: 
  - `keyword`: `中远海控`
  - `limit`: `10` (可选)

**预期结果**:
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

#### 测试用例2.2: 按股票代码搜索

**配置**:
- **Method**: GET
- **URL**: `http://localhost:5000/api/stocks/search`
- **Params**: 
  - `keyword`: `601919`

#### 测试用例2.3: 搜索关键词为空（错误测试）

**配置**:
- **Method**: GET
- **URL**: `http://localhost:5000/api/stocks/search`
- **Params**: 
  - `keyword`: `` (空字符串)

**预期结果**:
```json
{
    "success": false,
    "error_code": "MISSING_KEYWORD",
    "error": "搜索关键词不能为空"
}
```

**状态码**: 400 Bad Request

---

### 3. 股票详情接口

**目的**: 获取单只股票的详细信息

#### 测试用例3.1: 获取有效股票详情

**配置**:
- **Method**: GET
- **URL**: `http://localhost:5000/api/stocks/601919`

**预期结果**:
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

#### 测试用例3.2: 无效股票代码（错误测试）

**配置**:
- **Method**: GET
- **URL**: `http://localhost:5000/api/stocks/123456`

**预期结果**:
```json
{
    "success": false,
    "error_code": "STOCK_NOT_FOUND",
    "error": "股票不存在或数据获取失败"
}
```

**状态码**: 404 Not Found

#### 测试用例3.3: 股票代码格式错误（错误测试）

**配置**:
- **Method**: GET
- **URL**: `http://localhost:5000/api/stocks/abc123`

**预期结果**:
```json
{
    "success": false,
    "error_code": "INVALID_STOCK_CODE",
    "error": "股票代码格式错误"
}
```

**状态码**: 400 Bad Request

---

### 4. 股票历史数据接口

**目的**: 获取股票的历史价格数据

#### 测试用例4.1: 获取1个月历史数据

**配置**:
- **Method**: GET
- **URL**: `http://localhost:5000/api/stocks/601919/history`
- **Params**: 
  - `period`: `1m`

**预期结果**:
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

#### 测试用例4.2: 获取1年历史数据（默认）

**配置**:
- **Method**: GET
- **URL**: `http://localhost:5000/api/stocks/601919/history`
- **Params**: 无（使用默认period=1y）

#### 测试用例4.3: 无效时间周期（错误测试）

**配置**:
- **Method**: GET
- **URL**: `http://localhost:5000/api/stocks/601919/history`
- **Params**: 
  - `period`: `2y`

**预期结果**:
```json
{
    "success": false,
    "error_code": "INVALID_PERIOD",
    "error": "时间周期参数错误，支持的周期: 1d, 1w, 1m, 3m, 6m, 1y"
}
```

**状态码**: 400 Bad Request

---

### 5. 批量获取股票数据接口

**目的**: 一次性获取多只股票的数据

#### 测试用例5.1: 批量获取有效股票

**配置**:
- **Method**: POST
- **URL**: `http://localhost:5000/api/stocks/batch`
- **Headers**: 
  - `Content-Type`: `application/json`
- **Body** (raw JSON):
```json
{
    "codes": ["601919", "600919", "000001"]
}
```

**预期结果**:
```json
{
    "success": true,
    "data": {
        "stocks": [
            {
                "code": "601919",
                "name": "中远海控",
                "price": 14.94,
                "change_percent": 4.69
            }
        ],
        "requested_count": 3,
        "valid_count": 3,
        "success_count": 1,
        "invalid_codes": []
    }
}
```

#### 测试用例5.2: 请求数据格式错误（错误测试）

**配置**:
- **Method**: POST
- **URL**: `http://localhost:5000/api/stocks/batch`
- **Headers**: 
  - `Content-Type`: `application/json`
- **Body** (raw JSON):
```json
{
    "stock_codes": ["601919"]
}
```

**预期结果**:
```json
{
    "success": false,
    "error_code": "INVALID_REQUEST_DATA",
    "error": "请求数据格式错误，需要codes字段"
}
```

**状态码**: 400 Bad Request

#### 测试用例5.3: 超过批量限制（错误测试）

**配置**:
- **Method**: POST
- **URL**: `http://localhost:5000/api/stocks/batch`
- **Headers**: 
  - `Content-Type`: `application/json`
- **Body** (raw JSON):
```json
{
    "codes": ["601919", "600919", "000001", "000002", "000004", "000005", "000006", "000007", "000008", "000009", "000010", "000011", "000012", "000013", "000014", "000015", "000016", "000017", "000018", "000019", "000020", "000021"]
}
```

**预期结果**:
```json
{
    "success": false,
    "error_code": "TOO_MANY_CODES",
    "error": "一次最多查询20只股票"
}
```

**状态码**: 400 Bad Request

---

### 6. 获取关注列表接口

**目的**: 获取用户的股票关注列表

#### 测试用例6.1: 获取关注列表

**配置**:
- **Method**: GET
- **URL**: `http://localhost:5000/api/watchlist`

**预期结果**:
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

---

### 7. 添加股票到关注列表接口

**目的**: 将股票添加到关注列表

#### 测试用例7.1: 添加有效股票

**配置**:
- **Method**: POST
- **URL**: `http://localhost:5000/api/watchlist`
- **Headers**: 
  - `Content-Type`: `application/json`
- **Body** (raw JSON):
```json
{
    "code": "601919",
    "industry": "航运港口"
}
```

**预期结果**:
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

#### 测试用例7.2: 重复添加（错误测试）

**配置**: 与7.1相同

**预期结果**:
```json
{
    "success": false,
    "error_code": "ALREADY_IN_WATCHLIST",
    "error": "股票已在关注列表中"
}
```

**状态码**: 409 Conflict

#### 测试用例7.3: 添加不存在的股票（错误测试）

**配置**:
- **Method**: POST
- **URL**: `http://localhost:5000/api/watchlist`
- **Headers**: 
  - `Content-Type`: `application/json`
- **Body** (raw JSON):
```json
{
    "code": "999999",
    "industry": "测试行业"
}
```

**预期结果**:
```json
{
    "success": false,
    "error_code": "STOCK_NOT_FOUND",
    "error": "股票不存在或数据获取失败"
}
```

**状态码**: 404 Not Found

---

### 8. 删除关注的股票接口

**目的**: 从关注列表中删除股票

#### 测试用例8.1: 删除存在的股票

**配置**:
- **Method**: DELETE
- **URL**: `http://localhost:5000/api/watchlist/601919`

**预期结果**:
```json
{
    "success": true,
    "data": {
        "code": "601919"
    },
    "message": "从关注列表删除成功"
}
```

#### 测试用例8.2: 删除不存在的股票（错误测试）

**配置**:
- **Method**: DELETE
- **URL**: `http://localhost:5000/api/watchlist/999999`

**预期结果**:
```json
{
    "success": false,
    "error_code": "NOT_IN_WATCHLIST",
    "error": "股票不在关注列表中"
}
```

**状态码**: 404 Not Found

---

### 9. 市场概览接口

**目的**: 获取主要股指的概览信息

#### 测试用例9.1: 获取市场概览

**配置**:
- **Method**: GET
- **URL**: `http://localhost:5000/api/market/overview`

**预期结果**:
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
            },
            "深证成指": {
                "code": "399001",
                "name": "深证成指",
                "price": 11500.30,
                "change_percent": 0.85,
                "change_amount": 97.20
            },
            "创业板指": {
                "code": "399006",
                "name": "创业板指",
                "price": 2450.80,
                "change_percent": -0.45,
                "change_amount": -11.10
            }
        },
        "timestamp": "2024-01-01T12:00:00"
    }
}
```

---

### 10. 管理接口测试

#### 测试用例10.1: 清空缓存

**配置**:
- **Method**: POST
- **URL**: `http://localhost:5000/api/cache/clear`

**预期结果**:
```json
{
    "success": true,
    "data": {
        "cleared": true
    },
    "message": "缓存清空成功"
}
```

#### 测试用例10.2: 获取API统计

**配置**:
- **Method**: GET
- **URL**: `http://localhost:5000/api/stats`
- **Params**: 
  - `hours`: `24`

**预期结果**:
```json
{
    "success": true,
    "data": {
        "api_stats": [
            {
                "endpoint": "api.search_stocks",
                "call_count": 15,
                "avg_response_time": 250.5,
                "error_count": 1,
                "success_rate": 93.33
            }
        ],
        "cache_stats": {
            "cache_size": 10,
            "cache_duration": 300
        },
        "period_hours": 24
    }
}
```

---

## 🔄 测试流程建议

### 完整测试流程

1. **基础功能测试**
   - 健康检查 → 股票搜索 → 股票详情 → 历史数据

2. **关注列表功能测试**
   - 获取空关注列表 → 添加股票 → 获取关注列表 → 删除股票

3. **批量和高级功能测试**
   - 批量获取 → 市场概览 → 管理接口

4. **错误处理测试**
   - 测试所有错误用例，验证错误响应格式

### 性能测试

1. **缓存测试**
   - 第一次请求记录响应时间
   - 立即重复请求，验证缓存生效（响应更快）

2. **频率限制测试**
   - 快速连续发送超过60个请求
   - 验证返回429状态码

## 📊 测试结果验证

### 成功标准

- ✅ 所有正常用例返回200状态码
- ✅ 响应格式符合API文档
- ✅ 错误用例返回正确的错误码和状态码
- ✅ 数据内容合理（价格、百分比等）
- ✅ 缓存机制正常工作
- ✅ 关注列表增删改查功能正常

### 常见问题排查

1. **连接失败**: 检查后端服务是否启动
2. **数据为空**: 检查网络连接和AKShare服务状态
3. **响应慢**: 第一次请求较慢是正常的，后续有缓存
4. **股票不存在**: 使用真实存在的股票代码进行测试

---

**测试完成后，你应该对API的所有功能都有了全面的了解，可以开始前端开发或集成工作！**