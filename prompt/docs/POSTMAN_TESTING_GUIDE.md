# Postman 测试指南 - 股票历史数据接口

## 🚀 快速开始

### 1. 启动后端服务
```bash
cd backend
python run.py
```
服务将在 `http://localhost:5000` 启动

### 2. 健康检查
**请求方式**: GET  
**URL**: `http://localhost:5000/api/health`  
**预期响应**:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-16T15:45:58.123456",
  "version": "1.0.0"
}
```

## 📊 历史数据接口测试

### 基本请求
**请求方式**: GET  
**URL**: `http://localhost:5000/api/stocks/{stock_code}/history`  
**参数**:
- `stock_code`: 股票代码（路径参数）
- `period`: 时间周期（查询参数，可选）

### 支持的时间周期
- `1d`: 1天
- `1w`: 1周  
- `1m`: 1个月
- `3m`: 3个月
- `6m`: 6个月
- `1y`: 1年（默认）

### 测试用例

#### 1. 获取平安银行1个月历史数据
**URL**: `http://localhost:5000/api/stocks/000001/history?period=1m`  
**方法**: GET  
**Headers**: 
```
Content-Type: application/json
```

#### 2. 获取腾讯控股1年历史数据
**URL**: `http://localhost:5000/api/stocks/00700/history?period=1y`  
**方法**: GET

#### 3. 获取贵州茅台3个月历史数据
**URL**: `http://localhost:5000/api/stocks/600519/history?period=3m`  
**方法**: GET

#### 4. 获取比亚迪1周历史数据
**URL**: `http://localhost:5000/api/stocks/002594/history?period=1w`  
**方法**: GET

### 预期响应格式
```json
{
  "success": true,
  "data": [
    {
      "date": "2025-01-16",
      "open": 11.88,
      "high": 11.91,
      "low": 11.66,
      "close": 11.67,
      "volume": 116680349
    },
    {
      "date": "2025-01-15",
      "open": 11.75,
      "high": 11.89,
      "low": 11.72,
      "close": 11.85,
      "volume": 98765432
    }
  ],
  "count": 30,
  "period": "1m",
  "stock_code": "000001",
  "cache_hit": false
}
```

## 🔧 Postman 配置步骤

### 1. 创建新的 Collection
1. 打开 Postman
2. 点击 "New" → "Collection"
3. 命名为 "StockInsight API"

### 2. 添加环境变量
1. 点击右上角的齿轮图标
2. 选择 "Manage Environments"
3. 点击 "Add"
4. 创建环境变量：
   - `base_url`: `http://localhost:5000`
   - `api_prefix`: `/api`

### 3. 创建请求模板

#### 健康检查请求
- **Name**: Health Check
- **Method**: GET
- **URL**: `{{base_url}}{{api_prefix}}/health`

#### 历史数据请求
- **Name**: Get Stock History
- **Method**: GET
- **URL**: `{{base_url}}{{api_prefix}}/stocks/000001/history`
- **Params**:
  - Key: `period`, Value: `1m`

### 4. 设置 Headers
在每个请求中添加：
```
Content-Type: application/json
Accept: application/json
```

## 🧪 测试场景

### 场景1: 正常请求测试
1. 使用有效股票代码（如 000001, 600519, 00700）
2. 使用支持的时间周期
3. 验证返回数据格式和内容

### 场景2: 参数验证测试
1. 测试无效股票代码
2. 测试不支持的时间周期
3. 测试缺少必要参数

### 场景3: 缓存机制测试
1. 连续发送相同请求
2. 观察 `cache_hit` 字段变化
3. 验证响应时间差异

### 场景4: 错误处理测试
1. 测试不存在的股票代码
2. 测试网络异常情况
3. 验证错误响应格式

## 📝 测试脚本示例

### Pre-request Script
```javascript
// 设置时间戳
pm.environment.set("timestamp", new Date().toISOString());

// 随机选择股票代码
const stockCodes = ["000001", "600519", "00700", "002594"];
const randomCode = stockCodes[Math.floor(Math.random() * stockCodes.length)];
pm.environment.set("random_stock", randomCode);
```

### Tests Script
```javascript
// 验证响应状态
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

// 验证响应格式
pm.test("Response has required fields", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('success');
    pm.expect(jsonData).to.have.property('data');
    pm.expect(jsonData).to.have.property('count');
});

// 验证数据结构
pm.test("Data array contains valid objects", function () {
    const jsonData = pm.response.json();
    if (jsonData.data && jsonData.data.length > 0) {
        const firstItem = jsonData.data[0];
        pm.expect(firstItem).to.have.property('date');
        pm.expect(firstItem).to.have.property('open');
        pm.expect(firstItem).to.have.property('high');
        pm.expect(firstItem).to.have.property('low');
        pm.expect(firstItem).to.have.property('close');
        pm.expect(firstItem).to.have.property('volume');
    }
});

// 验证响应时间
pm.test("Response time is less than 5000ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(5000);
});
```

## 🚨 常见问题

### 1. 连接被拒绝
- 确保后端服务已启动
- 检查端口 5000 是否被占用
- 验证防火墙设置

### 2. 数据为空
- 检查股票代码格式
- 验证时间周期参数
- 查看后端日志错误信息

### 3. 响应超时
- 网络连接问题
- 数据源服务异常
- 增加请求超时时间

### 4. 缓存问题
- 缓存有效期为 30 分钟
- 可通过重启服务清除缓存
- 观察 `cache_hit` 字段判断缓存状态

## 📈 性能测试

### 并发测试
使用 Postman Runner 进行批量测试：
1. 设置迭代次数：10-50
2. 设置延迟：100-500ms
3. 监控响应时间和成功率

### 压力测试
1. 增加并发请求数量
2. 测试不同股票代码
3. 验证系统稳定性

## 🔍 调试技巧

1. **查看 Console**: 使用 `console.log()` 输出调试信息
2. **网络面板**: 查看详细的请求/响应信息
3. **后端日志**: 观察服务器端日志输出
4. **环境切换**: 在开发/测试环境间切换

---

**更新时间**: 2025-01-16  
**版本**: v1.0.0  
**维护者**: StockInsight Team