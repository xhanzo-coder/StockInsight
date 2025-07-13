# 股票数据看板部署指南

本指南将详细介绍如何将股票数据看板项目部署到服务器上，适合初学者按步骤操作。

## 🚀 快速部署（推荐）

我们提供了三种简单的一键部署方案：

### 方案一：Docker 部署（最简单）

**适用于：** 所有用户，特别是小白用户

#### Linux/macOS 用户：
```bash
# 下载项目
git clone <your-repo-url>
cd StockInsight

# 运行一键部署脚本
chmod +x quick-deploy.sh
./quick-deploy.sh
```

#### Windows 用户：
```powershell
# 下载项目
git clone <your-repo-url>
cd StockInsight

# 以管理员身份运行 PowerShell，然后执行
.\quick-deploy.ps1
```

### 方案二：Docker Compose 手动部署

```bash
# 确保已安装 Docker 和 Docker Compose
docker --version
docker-compose --version

# 创建数据目录
mkdir -p data logs

# 启动服务
docker-compose up -d

# 查看状态
docker-compose ps
```

### 方案三：传统部署

如果您不想使用 Docker，可以按照下面的传统部署方式进行。

## 📋 部署前准备

### 1. 服务器要求
- **操作系统**: Linux (推荐 Ubuntu 20.04+) 或 Windows Server
- **内存**: 至少 2GB RAM
- **存储**: 至少 10GB 可用空间
- **网络**: 公网IP或域名

### 2. 软件环境
- **Python 3.8+**
- **Node.js 16+**
- **Nginx** (用作反向代理)
- **PM2** (进程管理器)

## 🚀 部署步骤

### 第一步：服务器环境准备

#### 1.1 更新系统 (Ubuntu)
```bash
sudo apt update
sudo apt upgrade -y
```

#### 1.2 安装 Python 和 pip
```bash
sudo apt install python3 python3-pip python3-venv -y
```

#### 1.3 安装 Node.js 和 npm
```bash
# 安装 Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

#### 1.4 安装 Nginx
```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

#### 1.5 安装 PM2
```bash
sudo npm install -g pm2
```

### 第二步：上传项目文件

#### 2.1 创建项目目录
```bash
sudo mkdir -p /var/www/stock-insight
sudo chown $USER:$USER /var/www/stock-insight
cd /var/www/stock-insight
```

#### 2.2 上传项目文件
使用以下方式之一上传项目：

**方式1: 使用 SCP (从本地)**
```bash
# 在本地执行，将整个项目上传到服务器
scp -r /path/to/StockInsight username@server_ip:/var/www/stock-insight/
```

**方式2: 使用 Git (推荐)**
```bash
# 在服务器上执行
git clone https://github.com/your-username/StockInsight.git .
```

**方式3: 使用 FTP 工具**
- 使用 FileZilla 等 FTP 工具上传项目文件

### 第三步：后端部署

#### 3.1 进入后端目录
```bash
cd /var/www/stock-insight/backend
```

#### 3.2 创建虚拟环境
```bash
python3 -m venv venv
source venv/bin/activate
```

#### 3.3 安装依赖
```bash
pip install -r requirements.txt
```

#### 3.4 配置环境变量
```bash
# 创建环境配置文件
cp config.py config_prod.py

# 编辑生产环境配置
nano config_prod.py
```

在 `config_prod.py` 中修改以下配置：
```python
# 生产环境配置
class ProductionConfig:
    DEBUG = False
    HOST = '0.0.0.0'
    PORT = 5000
    DATABASE_URL = '/var/www/stock-insight/backend/stock_data.db'
    # 添加其他生产环境配置
```

#### 3.5 创建 PM2 配置文件
```bash
nano ecosystem.config.js
```

内容如下：
```javascript
module.exports = {
  apps: [{
    name: 'stock-insight-backend',
    script: 'run.py',
    interpreter: '/var/www/stock-insight/backend/venv/bin/python',
    cwd: '/var/www/stock-insight/backend',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      FLASK_ENV: 'production'
    },
    error_file: '/var/log/stock-insight/backend-error.log',
    out_file: '/var/log/stock-insight/backend-out.log',
    log_file: '/var/log/stock-insight/backend.log'
  }]
};
```

#### 3.6 创建日志目录
```bash
sudo mkdir -p /var/log/stock-insight
sudo chown $USER:$USER /var/log/stock-insight
```

#### 3.7 启动后端服务
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 第四步：前端部署

#### 4.1 进入前端目录
```bash
cd /var/www/stock-insight/frontend
```

#### 4.2 安装依赖
```bash
npm install
```

#### 4.3 修改 API 配置
编辑 `src/services/api.ts`，确保 API 基础路径正确：
```typescript
const api = axios.create({
  baseURL: '/api',  // 使用相对路径，通过 Nginx 代理
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

#### 4.4 构建生产版本
```bash
npm run build
```

#### 4.5 复制构建文件到 Nginx 目录
```bash
sudo cp -r build/* /var/www/html/
```

### 第五步：配置 Nginx

#### 5.1 创建 Nginx 配置文件
```bash
sudo nano /etc/nginx/sites-available/stock-insight
```

配置内容：
```nginx
server {
    listen 80;
    server_name your-domain.com;  # 替换为你的域名或服务器IP
    
    # 前端静态文件
    location / {
        root /var/www/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }
    
    # API 代理到后端
    location /api {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 处理 CORS
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods 'GET, POST, PUT, DELETE, OPTIONS';
        add_header Access-Control-Allow-Headers 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';
        
        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }
    
    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
}
```

#### 5.2 启用站点配置
```bash
sudo ln -s /etc/nginx/sites-available/stock-insight /etc/nginx/sites-enabled/
sudo nginx -t  # 测试配置
sudo systemctl reload nginx
```

### 第六步：配置防火墙

```bash
# 允许 HTTP 和 HTTPS 流量
sudo ufw allow 'Nginx Full'
sudo ufw allow ssh
sudo ufw enable
```

### 第七步：配置 HTTPS (可选但推荐)

#### 7.1 安装 Certbot
```bash
sudo apt install certbot python3-certbot-nginx -y
```

#### 7.2 获取 SSL 证书
```bash
sudo certbot --nginx -d your-domain.com
```

## 🔧 部署后管理

### 监控服务状态
```bash
# 查看后端服务状态
pm2 status
pm2 logs stock-insight-backend

# 查看 Nginx 状态
sudo systemctl status nginx

# 查看系统资源
htop
```

### 更新部署
```bash
# 更新代码
cd /var/www/stock-insight
git pull origin main

# 更新后端
cd backend
source venv/bin/activate
pip install -r requirements.txt
pm2 restart stock-insight-backend

# 更新前端
cd ../frontend
npm install
npm run build
sudo cp -r build/* /var/www/html/
```

### 备份数据
```bash
# 备份数据库
cp /var/www/stock-insight/backend/stock_data.db /backup/stock_data_$(date +%Y%m%d).db

# 备份配置文件
tar -czf /backup/config_$(date +%Y%m%d).tar.gz /etc/nginx/sites-available/stock-insight
```

## 🐛 常见问题解决

### 1. 后端服务无法启动
```bash
# 检查日志
pm2 logs stock-insight-backend

# 检查端口占用
sudo netstat -tlnp | grep :5000

# 手动测试
cd /var/www/stock-insight/backend
source venv/bin/activate
python run.py
```

### 2. 前端无法访问 API
```bash
# 检查 Nginx 配置
sudo nginx -t

# 检查 Nginx 日志
sudo tail -f /var/log/nginx/error.log

# 测试 API 连接
curl http://localhost:5000/api/health
```

### 3. 权限问题
```bash
# 修复文件权限
sudo chown -R $USER:$USER /var/www/stock-insight
sudo chmod -R 755 /var/www/stock-insight
```

## 📊 性能优化建议

1. **启用 Gzip 压缩**
2. **配置 Redis 缓存**
3. **使用 CDN 加速静态资源**
4. **定期清理日志文件**
5. **监控服务器资源使用情况**

## 🔒 安全建议

1. **定期更新系统和软件包**
2. **配置防火墙规则**
3. **使用强密码和密钥认证**
4. **定期备份数据**
5. **监控异常访问**

---

## 📞 技术支持

如果在部署过程中遇到问题，可以：
1. 检查日志文件获取错误信息
2. 参考官方文档
3. 在项目 Issues 中提问

**部署完成后，您的股票数据看板将在 `http://your-domain.com` 或 `http://your-server-ip` 上运行！**