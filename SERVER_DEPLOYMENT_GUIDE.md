# StockInsight 生产环境部署指南

本指南提供完整的生产环境部署方案，包括进程管理、反向代理、SSL配置和监控等。

## 部署架构

```
用户 → Nginx (反向代理/SSL) → PM2 (进程管理) → Flask应用
                ↓
            静态文件服务
```

## 部署策略

1. **本地构建优化**：在本地完成前端构建，减少服务器负载
2. **进程管理**：使用PM2管理应用进程，确保高可用性
3. **反向代理**：使用Nginx处理静态文件和SSL
4. **监控告警**：配置日志和监控系统

## 第一步：本地准备工作

### 1.1 构建前端应用
```bash
cd frontend
npm run build
```

### 1.2 准备后端生产环境
确保后端requirements.txt包含所有必要依赖：
```bash
cd backend
pip freeze > requirements.txt
```

### 1.3 创建部署包
创建一个新文件夹，只包含生产环境需要的文件：

```
StockInsight-deploy/
├── backend/
│   ├── api_routes.py
│   ├── app.py
│   ├── config.py
│   ├── database.py
│   ├── stock_service.py
│   ├── stock_comp.py
│   ├── requirements.txt
│   ├── run.py
│   └── 完整股票数据_11字段.csv
├── frontend/
│   └── build/          # 这是npm run build生成的文件夹
├── deploy_server.py    # 服务器启动脚本
└── README.md
```

## 第二步：服务器环境准备

### 2.1 系统更新和基础软件安装
```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装必要软件
sudo apt install -y python3 python3-pip python3-venv nginx git curl

# 安装Node.js和npm（用于PM2）
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 安装PM2进程管理器
sudo npm install -g pm2
```

### 2.2 创建应用用户
```bash
# 创建专用用户（推荐）
sudo useradd -m -s /bin/bash stockinsight
sudo usermod -aG sudo stockinsight

# 切换到应用用户
sudo su - stockinsight
```

## 第三步：应用部署

### 3.1 上传应用文件
```bash
# 在本地打包
tar -czf stockinsight-deploy.tar.gz StockInsight-deploy/

# 上传到服务器
scp stockinsight-deploy.tar.gz stockinsight@your-server-ip:/home/stockinsight/

# 在服务器上解压
ssh stockinsight@your-server-ip
tar -xzf stockinsight-deploy.tar.gz
rm stockinsight-deploy.tar.gz
```

### 3.2 Python环境配置
```bash
# 进入项目目录
cd StockInsight-deploy

# 创建虚拟环境
python3 -m venv venv
source venv/bin/activate

# 升级pip
pip install --upgrade pip

# 安装依赖
cd backend
pip install -r requirements.txt

# 安装生产环境WSGI服务器
pip install gunicorn

# 返回项目根目录
cd ..
```

### 3.3 创建应用启动脚本
创建 `app.py` 文件：
```python
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from backend.app import app
from flask import send_from_directory
import os

# 静态文件服务
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    frontend_dir = os.path.join(os.path.dirname(__file__), 'frontend', 'build')
    if path != "" and os.path.exists(os.path.join(frontend_dir, path)):
        return send_from_directory(frontend_dir, path)
    else:
        return send_from_directory(frontend_dir, 'index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
```

## 第四步：PM2进程管理配置

### 4.1 创建PM2配置文件
创建 `ecosystem.config.js` 文件：
```javascript
module.exports = {
  apps: [{
    name: 'stockinsight',
    script: 'venv/bin/gunicorn',
    args: '--bind 127.0.0.1:5000 --workers 2 --timeout 120 app:app',
    cwd: '/home/stockinsight/StockInsight-deploy',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      FLASK_ENV: 'production'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

### 4.2 启动应用
```bash
# 创建日志目录
mkdir -p logs

# 启动应用
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs stockinsight

# 设置开机自启
pm2 startup
pm2 save
```

## 第五步：Nginx反向代理配置

### 5.1 创建Nginx配置
创建 `/etc/nginx/sites-available/stockinsight` 文件：
```nginx
server {
    listen 80;
    server_name your-domain.com;  # 替换为您的域名或IP
    
    # 日志配置
    access_log /var/log/nginx/stockinsight_access.log;
    error_log /var/log/nginx/stockinsight_error.log;
    
    # 静态文件服务
    location /static/ {
        alias /home/stockinsight/StockInsight-deploy/frontend/build/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API代理
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # 前端应用
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket支持（如果需要）
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### 5.2 启用Nginx配置
```bash
# 启用站点
sudo ln -s /etc/nginx/sites-available/stockinsight /etc/nginx/sites-enabled/

# 删除默认站点（可选）
sudo rm /etc/nginx/sites-enabled/default

# 测试配置
sudo nginx -t

# 重启Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## 第六步：SSL证书配置（推荐）

### 6.1 使用Let's Encrypt免费SSL
```bash
# 安装Certbot
sudo apt install certbot python3-certbot-nginx

# 获取SSL证书
sudo certbot --nginx -d your-domain.com

# 设置自动续期
sudo crontab -e
# 添加以下行：
# 0 12 * * * /usr/bin/certbot renew --quiet
```

## 第七步：防火墙配置

```bash
# 启用UFW防火墙
sudo ufw enable

# 允许SSH
sudo ufw allow ssh

# 允许HTTP和HTTPS
sudo ufw allow 'Nginx Full'

# 查看状态
sudo ufw status
```

## 第八步：访问应用

部署完成后，您可以通过以下地址访问：
- `http://your-domain.com` - 访问完整应用（通过Nginx）
- `https://your-domain.com` - HTTPS访问（如果配置了SSL）
- `http://your-domain.com/api/health` - 检查API状态

## 第九步：监控和日志管理

### 9.1 PM2监控
```bash
# 实时监控
pm2 monit

# 查看详细信息
pm2 show stockinsight

# 重启应用
pm2 restart stockinsight

# 停止应用
pm2 stop stockinsight

# 查看日志
pm2 logs stockinsight --lines 100
```

### 9.2 系统监控
```bash
# 安装htop（系统监控）
sudo apt install htop

# 查看系统资源
htop

# 查看磁盘使用
df -h

# 查看内存使用
free -h
```

### 9.3 日志轮转配置
创建 `/etc/logrotate.d/stockinsight` 文件：
```
/home/stockinsight/StockInsight-deploy/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 stockinsight stockinsight
    postrotate
        pm2 reload stockinsight
    endscript
}
```

## 第十步：备份策略

### 10.1 数据库备份
```bash
# 创建备份脚本
cat > /home/stockinsight/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/stockinsight/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
cp /home/stockinsight/StockInsight-deploy/backend/stock_data.db $BACKUP_DIR/stock_data_$DATE.db

# 保留最近7天的备份
find $BACKUP_DIR -name "stock_data_*.db" -mtime +7 -delete

echo "Backup completed: stock_data_$DATE.db"
EOF

# 设置执行权限
chmod +x /home/stockinsight/backup.sh

# 设置定时备份（每天凌晨2点）
crontab -e
# 添加：0 2 * * * /home/stockinsight/backup.sh
```

## 第十一步：性能优化

### 11.1 Gunicorn优化
根据服务器配置调整worker数量：
```bash
# 计算最佳worker数量：(2 x CPU核心数) + 1
nproc  # 查看CPU核心数

# 修改ecosystem.config.js中的args参数
# 例如：4核CPU使用 --workers 9
```

### 11.2 Nginx缓存优化
在Nginx配置中添加缓存：
```nginx
# 在http块中添加
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=10g 
                 inactive=60m use_temp_path=off;

# 在server块中添加
location /api/ {
    proxy_cache my_cache;
    proxy_cache_valid 200 5m;
    proxy_cache_use_stale error timeout invalid_header updating;
    # ... 其他配置
}
```

### 11.3 系统优化
```bash
# 增加文件描述符限制
echo "stockinsight soft nofile 65536" | sudo tee -a /etc/security/limits.conf
echo "stockinsight hard nofile 65536" | sudo tee -a /etc/security/limits.conf

# 优化内核参数
echo "net.core.somaxconn = 65536" | sudo tee -a /etc/sysctl.conf
echo "net.ipv4.tcp_max_syn_backlog = 65536" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## 第十二步：故障排除

### 12.1 常见问题诊断

#### 应用无法启动
```bash
# 检查PM2状态
pm2 status

# 查看详细错误
pm2 logs stockinsight --err

# 检查Python环境
source /home/stockinsight/StockInsight-deploy/venv/bin/activate
python -c "import flask; print('Flask OK')"

# 检查端口占用
sudo netstat -tulpn | grep :5000
```

#### Nginx配置问题
```bash
# 测试Nginx配置
sudo nginx -t

# 查看Nginx错误日志
sudo tail -f /var/log/nginx/error.log

# 重新加载配置
sudo nginx -s reload
```

#### SSL证书问题
```bash
# 检查证书状态
sudo certbot certificates

# 手动续期
sudo certbot renew --dry-run

# 查看证书详情
openssl x509 -in /etc/letsencrypt/live/your-domain.com/cert.pem -text -noout
```

### 12.2 性能问题排查

#### 内存使用过高
```bash
# 查看进程内存使用
pm2 monit

# 系统内存分析
sudo apt install smem
smem -t -k

# 重启应用释放内存
pm2 restart stockinsight
```

#### 响应速度慢
```bash
# 查看Nginx访问日志
sudo tail -f /var/log/nginx/stockinsight_access.log

# 分析响应时间
awk '{print $NF}' /var/log/nginx/stockinsight_access.log | sort -n | tail -10

# 检查数据库性能
sqlite3 /home/stockinsight/StockInsight-deploy/backend/stock_data.db ".timeout 1000" ".tables"
```

### 12.3 应急处理

#### 快速重启服务
```bash
# 重启应用
pm2 restart stockinsight

# 重启Nginx
sudo systemctl restart nginx

# 重启整个系统（最后手段）
sudo reboot
```

#### 回滚部署
```bash
# 停止当前应用
pm2 stop stockinsight

# 恢复备份
cp /home/stockinsight/backups/stock_data_YYYYMMDD_HHMMSS.db /home/stockinsight/StockInsight-deploy/backend/stock_data.db

# 重启应用
pm2 start stockinsight
```

### 12.4 监控告警设置

#### 创建健康检查脚本
```bash
cat > /home/stockinsight/health_check.sh << 'EOF'
#!/bin/bash
URL="http://localhost/api/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $URL)

if [ $RESPONSE -ne 200 ]; then
    echo "$(date): Health check failed - HTTP $RESPONSE" >> /var/log/stockinsight_health.log
    # 可以添加邮件通知或重启逻辑
    pm2 restart stockinsight
fi
EOF

chmod +x /home/stockinsight/health_check.sh

# 添加到crontab（每5分钟检查一次）
crontab -e
# 添加：*/5 * * * * /home/stockinsight/health_check.sh
```

## 第十三步：维护清单

### 13.1 日常维护
- [ ] 检查应用状态：`pm2 status`
- [ ] 查看系统资源：`htop`
- [ ] 检查磁盘空间：`df -h`
- [ ] 查看错误日志：`pm2 logs stockinsight --err`

### 13.2 周期性维护
- [ ] 更新系统包：`sudo apt update && sudo apt upgrade`
- [ ] 清理日志文件：`sudo logrotate -f /etc/logrotate.conf`
- [ ] 检查SSL证书：`sudo certbot certificates`
- [ ] 验证备份：检查 `/home/stockinsight/backups/`

### 13.3 安全检查
- [ ] 检查防火墙状态：`sudo ufw status`
- [ ] 查看登录日志：`sudo last`
- [ ] 检查异常访问：`sudo tail /var/log/nginx/stockinsight_access.log`

## 部署完成检查清单

- [ ] 前端构建完成并上传
- [ ] 后端依赖安装完成
- [ ] PM2进程管理配置并启动
- [ ] Nginx反向代理配置并启动
- [ ] SSL证书配置（如果需要）
- [ ] 防火墙规则配置
- [ ] 日志轮转配置
- [ ] 备份策略配置
- [ ] 健康检查脚本配置
- [ ] 应用可正常访问

## 文件大小估算

预计需要上传的文件大小：
- 后端Python文件：< 1MB
- 前端构建文件：2-5MB
- 股票数据CSV：根据实际大小
- 配置文件：< 100KB
- **总计：通常 < 10MB**

即使在慢速网络下也能在几分钟内完成传输。

---

**部署完成后，您的StockInsight应用将具备：**
- 高可用性（PM2进程管理）
- 高性能（Nginx反向代理）
- 安全性（SSL加密、防火墙）
- 可维护性（日志管理、监控告警）
- 可扩展性（负载均衡就绪）