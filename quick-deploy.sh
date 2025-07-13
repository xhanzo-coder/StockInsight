#!/bin/bash

# 股票数据看板一键部署脚本 (适合小白用户)
# 使用 Docker 方式部署，简单快捷

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# 打印函数
print_header() {
    echo -e "${PURPLE}"
    echo "================================================"
    echo "    🚀 股票数据看板一键部署脚本"
    echo "    📊 适合小白用户的 Docker 部署方案"
    echo "================================================"
    echo -e "${NC}"
}

print_info() {
    echo -e "${BLUE}[信息]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[成功]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[警告]${NC} $1"
}

print_error() {
    echo -e "${RED}[错误]${NC} $1"
}

print_step() {
    echo -e "${PURPLE}[步骤]${NC} $1"
}

# 检查系统要求
check_system() {
    print_step "检查系统环境..."
    
    # 检查操作系统
    if [[ "$OSTYPE" != "linux-gnu"* ]]; then
        print_error "此脚本仅支持 Linux 系统"
        print_info "如果您使用 Windows，请安装 WSL2 或使用 Linux 服务器"
        exit 1
    fi
    
    # 检查是否为 root 用户
    if [[ $EUID -eq 0 ]]; then
        print_warning "检测到您正在使用 root 用户"
        print_info "建议使用普通用户运行此脚本"
        read -p "是否继续？(y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    print_success "系统检查通过"
}

# 安装 Docker
install_docker() {
    if command -v docker &> /dev/null; then
        print_success "Docker 已安装"
        return
    fi
    
    print_step "安装 Docker..."
    
    # 检测系统类型
    if command -v apt-get &> /dev/null; then
        # Ubuntu/Debian
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        sudo usermod -aG docker $USER
    elif command -v yum &> /dev/null; then
        # CentOS/RHEL
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        sudo usermod -aG docker $USER
        sudo systemctl start docker
        sudo systemctl enable docker
    else
        print_error "不支持的 Linux 发行版"
        print_info "请手动安装 Docker: https://docs.docker.com/engine/install/"
        exit 1
    fi
    
    rm -f get-docker.sh
    print_success "Docker 安装完成"
    print_warning "请重新登录以使 Docker 权限生效，然后重新运行此脚本"
    exit 0
}

# 安装 Docker Compose
install_docker_compose() {
    if command -v docker-compose &> /dev/null; then
        print_success "Docker Compose 已安装"
        return
    fi
    
    print_step "安装 Docker Compose..."
    
    # 获取最新版本
    DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d'"' -f4)
    
    # 下载并安装
    sudo curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    
    print_success "Docker Compose 安装完成"
}

# 准备部署环境
prepare_environment() {
    print_step "准备部署环境..."
    
    # 创建数据目录
    mkdir -p data logs
    
    # 设置权限
    chmod 755 data logs
    
    print_success "环境准备完成"
}

# 构建和启动服务
deploy_application() {
    print_step "构建和启动应用..."
    
    # 停止可能存在的旧容器
    docker-compose down 2>/dev/null || true
    
    # 构建镜像
    print_info "正在构建 Docker 镜像，这可能需要几分钟..."
    docker-compose build --no-cache
    
    # 启动服务
    print_info "启动服务..."
    docker-compose up -d
    
    # 等待服务启动
    print_info "等待服务启动..."
    sleep 30
    
    print_success "应用部署完成"
}

# 检查服务状态
check_services() {
    print_step "检查服务状态..."
    
    # 检查容器状态
    if docker-compose ps | grep -q "Up"; then
        print_success "容器运行正常"
    else
        print_error "容器启动失败"
        print_info "查看日志: docker-compose logs"
        return 1
    fi
    
    # 检查健康状态
    print_info "等待健康检查..."
    for i in {1..10}; do
        if curl -f http://localhost:8080/api/health &>/dev/null; then
            print_success "服务健康检查通过"
            return 0
        fi
        print_info "等待服务启动... ($i/10)"
        sleep 10
    done
    
    print_warning "健康检查超时，但服务可能仍在启动中"
    return 0
}

# 显示部署结果
show_result() {
    # 获取服务器 IP
    SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || echo "localhost")
    
    echo ""
    echo -e "${GREEN}"
    echo "🎉🎉🎉 部署成功！🎉🎉🎉"
    echo -e "${NC}"
    echo "================================"
    echo -e "📱 ${BLUE}访问地址:${NC}"
    echo "   本地访问: http://localhost:8080"
    if [[ $SERVER_IP != "localhost" ]]; then
        echo "   外网访问: http://$SERVER_IP:8080"
    fi
    echo ""
    echo -e "🔧 ${BLUE}API 地址:${NC}"
    echo "   健康检查: http://localhost:8080/api/health"
    echo "   API 文档: http://localhost:8080/api"
    echo "================================"
    echo ""
    echo -e "📋 ${YELLOW}常用管理命令:${NC}"
    echo "   查看状态: docker-compose ps"
    echo "   查看日志: docker-compose logs -f"
    echo "   重启服务: docker-compose restart"
    echo "   停止服务: docker-compose down"
    echo "   更新应用: docker-compose pull && docker-compose up -d"
    echo ""
    echo -e "📁 ${YELLOW}重要目录:${NC}"
    echo "   数据目录: ./data (数据库文件)"
    echo "   日志目录: ./logs (应用日志)"
    echo ""
    echo -e "⚠️  ${RED}注意事项:${NC}"
    echo "   1. 请确保服务器防火墙开放 8080 端口"
    echo "   2. 数据库文件保存在 ./data 目录，请定期备份"
    echo "   3. 如需修改端口，请编辑 docker-compose.yml 文件"
    echo ""
}

# 创建管理脚本
create_management_scripts() {
    print_step "创建管理脚本..."
    
    # 创建启动脚本
    cat > start.sh << 'EOF'
#!/bin/bash
echo "🚀 启动股票数据看板..."
docker-compose up -d
echo "✅ 启动完成！访问 http://localhost:8080"
EOF
    
    # 创建停止脚本
    cat > stop.sh << 'EOF'
#!/bin/bash
echo "🛑 停止股票数据看板..."
docker-compose down
echo "✅ 停止完成！"
EOF
    
    # 创建更新脚本
    cat > update.sh << 'EOF'
#!/bin/bash
echo "🔄 更新股票数据看板..."
echo "📦 备份数据..."
cp -r data data_backup_$(date +%Y%m%d_%H%M%S)
echo "🛑 停止服务..."
docker-compose down
echo "🔧 重新构建..."
docker-compose build --no-cache
echo "🚀 启动服务..."
docker-compose up -d
echo "✅ 更新完成！"
EOF
    
    # 创建备份脚本
    cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="backup_$(date +%Y%m%d_%H%M%S)"
echo "📦 创建备份: $BACKUP_DIR"
mkdir -p $BACKUP_DIR
cp -r data $BACKUP_DIR/
cp -r logs $BACKUP_DIR/
cp docker-compose.yml $BACKUP_DIR/
tar -czf ${BACKUP_DIR}.tar.gz $BACKUP_DIR
rm -rf $BACKUP_DIR
echo "✅ 备份完成: ${BACKUP_DIR}.tar.gz"
EOF
    
    # 设置执行权限
    chmod +x start.sh stop.sh update.sh backup.sh
    
    print_success "管理脚本创建完成"
}

# 主函数
main() {
    print_header
    
    print_info "欢迎使用股票数据看板一键部署脚本！"
    print_info "此脚本将自动安装 Docker 并部署应用"
    echo ""
    
    read -p "按 Enter 键开始部署，或 Ctrl+C 取消: "
    
    check_system
    install_docker
    install_docker_compose
    prepare_environment
    deploy_application
    
    if check_services; then
        create_management_scripts
        show_result
        print_success "🎉 恭喜！股票数据看板部署成功！"
    else
        print_error "部署过程中出现问题，请检查日志"
        print_info "查看详细日志: docker-compose logs"
        exit 1
    fi
}

# 运行主函数
main "$@"