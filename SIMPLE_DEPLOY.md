# StockInsight 简单部署指南

## 📁 项目结构（已优化）

```
StockInsight/
├── backend/                 # 后端API服务
│   ├── app.py              # 主应用文件
│   ├── api_routes.py       # API路由
│   ├── config.py           # 配置文件
│   ├── database.py         # 数据库操作
│   ├── stock_service.py    # 股票服务
│   ├── stock_comp.py       # 股票比较
│   ├── requirements.txt    # Python依赖
│   ├── stock_data.db       # SQLite数据库
│   └── 完整股票数据_11字段.csv
└── frontend/               # 前端应用
    ├── build/              # 构建后的静态文件
    ├── proxy_server.py     # 代理服务器
    └── start_frontend.bat  # Windows启动脚本
```

## 🚀 本地运行

### 1. 启动后端（端口5000）
```bash
cd backend
python app.py
```

### 2. 启动前端（端口3001）
```bash
cd frontend
python proxy_server.py
```

### 3. 访问应用
浏览器打开：`http://localhost:3001`

## 🌐 服务器部署（推荐方案）

### 方案1：使用Python内置服务器（最简单）

**适用于：** 小型服务器、个人项目、测试环境

#### 后端部署：
```bash
# 1. 上传backend文件夹到服务器
# 2. 安装依赖
pip install -r requirements.txt

# 3. 修改app.py，绑定到所有接口
# 在app.py最后一行改为：
# app.run(host='0.0.0.0', port=5000, debug=False)

# 4. 启动后端
nohup python app.py > backend.log 2>&1 &
```

#### 前端部署：
```bash
# 1. 上传frontend文件夹到服务器
# 2. 修改proxy_server.py中的端口（如果需要）
# 3. 启动前端代理
nohup python proxy_server.py > frontend.log 2>&1 &
```

### 方案2：使用Nginx反向代理（推荐生产环境）

#### 1. 后端配置
```bash
# 使用gunicorn运行后端
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

#### 2. 前端配置
```bash
# 直接使用Python服务器提供静态文件
cd frontend/build
python -m http.server 8080
```

#### 3. Nginx配置
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # 前端静态文件
    location / {
        proxy_pass http://localhost:8080;
    }
    
    # API代理到后端
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## 🔧 服务器性能优化建议

### 低配置服务器（1GB内存以下）
- 使用方案1（Python内置服务器）
- 关闭debug模式
- 限制并发连接数

### 中等配置服务器（1-4GB内存）
- 使用方案2（Nginx + Gunicorn）
- 配置2-4个worker进程

### 高配置服务器（4GB+内存）
- 使用Nginx + Gunicorn + Redis缓存
- 配置更多worker进程

## 📝 部署检查清单

- [ ] 后端服务正常启动（检查5000端口）
- [ ] 前端服务正常启动（检查3001端口）
- [ ] API健康检查：`curl http://localhost:5000/api/health`
- [ ] 前端页面正常加载
- [ ] 股票搜索功能正常
- [ ] 监控列表功能正常

## 🛠️ 常见问题

### 1. 端口被占用
```bash
# 查看端口占用
netstat -tulpn | grep :5000
# 或者修改配置文件中的端口号
```

### 2. 权限问题
```bash
# 给予执行权限
chmod +x *.py
```

### 3. 防火墙设置
```bash
# 开放端口（Ubuntu/CentOS）
sudo ufw allow 5000
sudo ufw allow 3001
```

## 📊 监控和日志

### 查看运行状态
```bash
# 查看进程
ps aux | grep python

# 查看日志
tail -f backend.log
tail -f frontend.log
```

### 重启服务
```bash
# 停止服务
pkill -f "python app.py"
pkill -f "python proxy_server.py"

# 重新启动
nohup python app.py > backend.log 2>&1 &
nohup python proxy_server.py > frontend.log 2>&1 &
```

---

**注意：** 这是最简化的部署方案，适合快速上线和测试。生产环境建议使用更专业的部署工具如Docker、PM2等。