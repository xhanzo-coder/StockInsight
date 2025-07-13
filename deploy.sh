#!/bin/bash

# 股票数据看板自动部署脚本
# 使用方法: chmod +x deploy.sh && ./deploy.sh

set -e  # 遇到错误立即退出

echo "🚀 开始部署股票数据看板..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查是否为 root 用户
check_root() {
    if [[ $EUID -eq 0 ]]; then
        print_error "请不要使用 root 用户运行此脚本"
        exit 1
    fi
}

# 检查系统类型
check_system() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        print_info "检测到 Linux 系统"
        if command -v apt-get &> /dev/null; then
            PACKAGE_MANAGER="apt"
        elif command -v yum &> /dev/null; then
            PACKAGE_MANAGER="yum"
        else
            print_error "不支持的 Linux 发行版"
            exit 1
        fi
    else
        print_error "此脚本仅支持 Linux 系统"
        exit 1
    fi
}

# 安装系统依赖
install_dependencies() {
    print_info "安装系统依赖..."
    
    if [[ $PACKAGE_MANAGER == "apt" ]]; then
        sudo apt update
        sudo apt install -y python3 python3-pip python3-venv nodejs npm nginx curl
    elif [[ $PACKAGE_MANAGER == "yum" ]]; then
        sudo yum update -y
        sudo yum install -y python3 python3-pip nodejs npm nginx curl
    fi
    
    # 安装 PM2
    sudo npm install -g pm2
    
    print_success "系统依赖安装完成"
}

# 设置项目目录
setup_project_directory() {
    print_info "设置项目目录..."
    
    PROJECT_DIR="/var/www/stock-insight"
    
    # 创建项目目录
    sudo mkdir -p $PROJECT_DIR
    sudo chown $USER:$USER $PROJECT_DIR
    
    # 复制项目文件
    cp -r . $PROJECT_DIR/
    cd $PROJECT_DIR
    
    print_success "项目目录设置完成: $PROJECT_DIR"
}

# 部署后端
deploy_backend() {
    print_info "部署后端服务..."
    
    cd $PROJECT_DIR/backend
    
    # 创建虚拟环境
    python3 -m venv venv
    source venv/bin/activate
    
    # 安装依赖
    pip install -r requirements.txt
    
    # 创建日志目录
    sudo mkdir -p /var/log/stock-insight
    sudo chown $USER:$USER /var/log/stock-insight
    
    # 创建 PM2 配置文件
    cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'stock-insight-backend',
    script: 'run.py',
    interpreter: '$PROJECT_DIR/backend/venv/bin/python',
    cwd: '$PROJECT_DIR/backend',
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
EOF
    
    # 启动后端服务
    pm2 start ecosystem.config.js
    pm2 save
    
    print_success "后端服务部署完成"
}

# 部署前端
deploy_frontend() {
    print_info "部署前端应用..."
    
    cd $PROJECT_DIR/frontend
    
    # 安装依赖
    npm install
    
    # 构建生产版本
    npm run build
    
    # 复制到 Nginx 目录
    sudo cp -r build/* /var/www/html/
    
    print_success "前端应用部署完成"
}

# 配置 Nginx
configure_nginx() {
    print_info "配置 Nginx..."
    
    # 获取服务器 IP
    SERVER_IP=$(curl -s ifconfig.me || echo "localhost")
    
    # 创建 Nginx 配置
    sudo tee /etc/nginx/sites-available/stock-insight > /dev/null << EOF
server {
    listen 80;
    server_name $SERVER_IP;
    
    # 前端静态文件
    location / {
        root /var/www/html;
        index index.html index.htm;
        try_files \$uri \$uri/ /index.html;
    }
    
    # API 代理到后端
    location /api {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # 处理 CORS
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods 'GET, POST, PUT, DELETE, OPTIONS';
        add_header Access-Control-Allow-Headers 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';
        
        if (\$request_method = 'OPTIONS') {
            return 204;
        }
    }
    
    # 静态资源缓存
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg)\$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF
    
    # 启用站点
    sudo ln -sf /etc/nginx/sites-available/stock-insight /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # 测试配置
    sudo nginx -t
    
    # 重启 Nginx
    sudo systemctl restart nginx
    sudo systemctl enable nginx
    
    print_success "Nginx 配置完成"
}

# 配置防火墙
configure_firewall() {
    print_info "配置防火墙..."
    
    if command -v ufw &> /dev/null; then
        sudo ufw --force enable
        sudo ufw allow 'Nginx Full'
        sudo ufw allow ssh
        print_success "防火墙配置完成"
    else
        print_warning "未检测到 ufw，请手动配置防火墙"
    fi
}

# 设置开机自启
setup_autostart() {
    print_info "设置开机自启..."
    
    # PM2 开机自启
    pm2 startup
    
    print_success "开机自启设置完成"
}

# 显示部署结果
show_result() {
    SERVER_IP=$(curl -s ifconfig.me || echo "localhost")
    
    echo ""
    echo "🎉 部署完成！"
    echo "================================"
    echo "📱 前端地址: http://$SERVER_IP"
    echo "🔧 后端地址: http://$SERVER_IP/api"
    echo "📊 健康检查: http://$SERVER_IP/api/health"
    echo "================================"
    echo ""
    echo "📋 管理命令:"
    echo "  查看后端状态: pm2 status"
    echo "  查看后端日志: pm2 logs stock-insight-backend"
    echo "  重启后端: pm2 restart stock-insight-backend"
    echo "  查看 Nginx 状态: sudo systemctl status nginx"
    echo "  重启 Nginx: sudo systemctl restart nginx"
    echo ""
    echo "📁 项目目录: $PROJECT_DIR"
    echo "📝 日志目录: /var/log/stock-insight"
    echo ""
    echo "🔧 如需更新部署，请运行: ./update.sh"
}

# 创建更新脚本
create_update_script() {
    print_info "创建更新脚本..."
    
    cat > $PROJECT_DIR/update.sh << 'EOF'
#!/bin/bash

echo "🔄 更新股票数据看板..."

PROJECT_DIR="/var/www/stock-insight"
cd $PROJECT_DIR

# 备份当前版本
echo "📦 备份当前版本..."
cp -r backend/stock_data.db /tmp/stock_data_backup_$(date +%Y%m%d_%H%M%S).db

# 更新代码 (如果使用 Git)
if [ -d ".git" ]; then
    echo "📥 拉取最新代码..."
    git pull origin main
fi

# 更新后端
echo "🔧 更新后端..."
cd backend
source venv/bin/activate
pip install -r requirements.txt
pm2 restart stock-insight-backend

# 更新前端
echo "🎨 更新前端..."
cd ../frontend
npm install
npm run build
sudo cp -r build/* /var/www/html/

echo "✅ 更新完成！"
EOF
    
    chmod +x $PROJECT_DIR/update.sh
    
    print_success "更新脚本创建完成: $PROJECT_DIR/update.sh"
}

# 主函数
main() {
    echo "🚀 股票数据看板自动部署脚本"
    echo "================================"
    
    check_root
    check_system
    
    print_info "开始部署过程..."
    
    install_dependencies
    setup_project_directory
    deploy_backend
    deploy_frontend
    configure_nginx
    configure_firewall
    setup_autostart
    create_update_script
    
    show_result
    
    print_success "🎉 部署完成！请访问上述地址查看您的股票数据看板。"
}

# 运行主函数
main "$@"