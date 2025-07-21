# StockInsight 数据库结构说明

## 数据库概述

StockInsight 使用 SQLite 数据库存储用户信息、关注列表和API调用日志。数据库文件位于 `backend/stock_data.db`。

## 数据库表结构

### 1. users 表 - 用户信息表

用于存储用户账户信息和认证数据。

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT 1
);
```

**字段说明：**
- `id`: 用户唯一标识符（主键，自增）
- `username`: 用户名（唯一，非空）
- `email`: 邮箱地址（唯一）
- `password_hash`: 密码哈希值（使用bcrypt加密）
- `created_time`: 账户创建时间
- `last_login`: 最后登录时间
- `is_active`: 账户是否激活（布尔值，默认为1）

**索引：**
- `idx_users_username`: 用户名索引
- `idx_users_email`: 邮箱索引

### 2. watchlist 表 - 股票关注列表表

用于存储用户的股票关注列表，支持多用户隔离。

```sql
CREATE TABLE watchlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    stock_code TEXT NOT NULL,
    stock_name TEXT NOT NULL,
    industry TEXT DEFAULT '',
    is_pinned BOOLEAN DEFAULT 0,
    added_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    UNIQUE(user_id, stock_code)
);
```

**字段说明：**
- `id`: 记录唯一标识符（主键，自增）
- `user_id`: 用户ID（外键，关联users表）
- `stock_code`: 股票代码（6位数字）
- `stock_name`: 股票名称
- `industry`: 所属行业
- `is_pinned`: 是否置顶（布尔值，默认为0）
- `added_time`: 添加时间
- `updated_time`: 更新时间

**约束：**
- 外键约束：`user_id` 关联 `users.id`，级联删除
- 唯一约束：`(user_id, stock_code)` 组合唯一

**索引：**
- `idx_watchlist_user_id`: 用户ID索引
- `idx_watchlist_code`: 股票代码索引
- `idx_watchlist_user_code`: 用户ID和股票代码组合索引
- `idx_watchlist_added_time`: 添加时间索引

### 3. api_logs 表 - API调用日志表

用于记录API调用情况，便于监控和分析。

```sql
CREATE TABLE api_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    request_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    response_code INTEGER,
    response_time_ms INTEGER,
    error_message TEXT
);
```

**字段说明：**
- `id`: 日志记录唯一标识符（主键，自增）
- `endpoint`: API端点路径
- `method`: HTTP请求方法（GET、POST等）
- `ip_address`: 客户端IP地址
- `user_agent`: 客户端User-Agent
- `request_time`: 请求时间
- `response_code`: HTTP响应状态码
- `response_time_ms`: 响应时间（毫秒）
- `error_message`: 错误信息（如有）

## 当前数据库数据

### 用户数据

目前数据库中有1个测试用户：

```
ID: 1
用户名: admin
邮箱: admin@stockinsight.com
密码: admin123 (哈希存储)
创建时间: 2025-07-11 04:21:47
最后登录: 2025-07-17 02:48:10
状态: 激活
```

### 关注列表数据

用户ID为1的用户当前关注了以下股票：

| ID | 股票代码 | 股票名称 | 行业 | 是否置顶 | 添加时间 |
|----|----------|----------|------|----------|----------|
| 1 | 601318 | 中国平安 | 保险 | 否 | 2025-07-11 04:22:08 |
| 6 | 000001 | 平安银行 | 银行 | 否 | 2025-07-11 04:22:22 |
| 9 | 601288 | 农业银行 | - | 是 | 2025-07-11 09:36:08 |
| 13 | 600015 | 华夏银行 | - | 否 | 2025-07-11 13:27:13 |
| 14 | 002594 | 比亚迪 | 汽车整车 | 否 | 2025-07-14 09:35:32 |
| 16 | 600036 | 招商银行 | - | 否 | 2025-07-14 12:29:21 |
| 18 | 000007 | 全新好 | - | 否 | 2025-07-15 02:30:41 |
| 19 | 600276 | 恒瑞医药 | - | 否 | 2025-07-16 02:08:09 |
| 20 | 000906 | 浙商中拓 | - | 否 | 2025-07-16 02:11:13 |
| 21 | 300750 | 宁德时代 | - | 否 | 2025-07-16 02:11:56 |
| 22 | 601888 | 中国中免 | - | 是 | 2025-07-16 02:12:21 |
| 23 | 601088 | 中国神华 | - | 是 | 2025-07-17 02:48:10 |

**统计信息：**
- 总关注股票数：12只
- 置顶股票数：3只
- 涉及行业：保险、银行、汽车整车等

## 数据库特性

### 1. 多用户支持
- 通过 `user_id` 字段实现用户数据隔离
- 支持用户注册、登录、认证功能
- 关注列表按用户分离

### 2. 数据完整性
- 外键约束确保数据一致性
- 唯一约束防止重复数据
- 级联删除保证数据清理

### 3. 性能优化
- 合理的索引设计提高查询效率
- 时间戳字段便于数据排序和过滤

### 4. 扩展性
- 预留字段支持功能扩展
- 日志表支持API监控和分析

## 数据库维护

### 备份建议
- 定期备份 `stock_data.db` 文件
- 重要操作前创建备份点

### 清理建议
- 定期清理过期的API日志
- 监控数据库文件大小

### 升级机制
- 数据库初始化时自动检查和添加新字段
- 向后兼容的升级策略