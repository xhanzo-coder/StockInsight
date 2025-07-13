# 🚀 股票数据看板 - 部署说明

## 📖 简介

这是一个基于 Python Flask + React 的股票数据看板系统，提供实时股票数据查询、关注列表管理、财务指标分析等功能。

## 🎯 快速开始

### 方法一：一键部署（推荐新手）

#### Linux/macOS 用户
```bash
# 1. 下载项目
git clone https://github.com/your-username/StockInsight.git
cd StockInsight

# 2. 运行一键部署脚本
chmod +x quick-deploy.sh
./quick-deploy.sh

# 3. 等待部署完成，访问 http://localhost:8080
```

#### Windows 用户
```powershell
# 1. 下载项目
git clone https://github.com/your-username/StockInsight.git
cd StockInsight

# 2. 以管理员身份运行 PowerShell
# 3. 执行部署脚本
.\quick-deploy.ps1

# 4. 等待部署完成，访问 http://localhost:8080
```

### 方法二：Docker Compose 部署

```bash
# 前提：已安装 Docker 和 Docker Compose

# 1. 克隆项目
git clone https://github.com/your-username/StockInsight.git
cd StockInsight

# 2. 创建数据目录
mkdir -p data logs

# 3. 启动服务
docker-compose up -d

# 4. 检查状态
docker-compose ps

# 5. 访问应用
# 浏览器打开 http://localhost:8080
```

## 🛠️ 管理命令

部署完成后，您可以使用以下命令管理应用：

### Docker 方式部署的管理命令

```bash
# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 重启服务
docker-compose restart

# 停止服务
docker-compose down

# 更新应用
docker-compose pull
docker-compose up -d

# 备份数据
./backup.sh  # Linux/macOS
.\backup.ps1  # Windows
```

### 便捷脚本（部署后自动生成）

- `start.sh` / `start.ps1` - 启动服务
- `stop.sh` / `stop.ps1` - 停止服务
- `update.sh` / `update.ps1` - 更新应用
- `backup.sh` / `backup.ps1` - 备份数据

## 📁 目录结构

```
StockInsight/
├── backend/              # 后端 Flask 应用
├── frontend/             # 前端 React 应用
├── docker/               # Docker 配置文件
├── data/                 # 数据库文件（部署后生成）
├── logs/                 # 日志文件（部署后生成）
├── docker-compose.yml    # Docker Compose 配置
├── Dockerfile           # Docker 镜像构建文件
├── quick-deploy.sh      # Linux/macOS 一键部署脚本
├── quick-deploy.ps1     # Windows 一键部署脚本
└── DEPLOYMENT_GUIDE.md  # 详细部署指南
```

## 🌐 访问地址

部署成功后，您可以通过以下地址访问：

- **前端界面**: http://localhost:8080
- **API 接口**: http://localhost:8080/api
- **健康检查**: http://localhost:8080/api/health

## 🔧 配置说明

### 端口配置

默认端口为 8080，如需修改请编辑 `docker-compose.yml` 文件：

```yaml
services:
  stock-insight:
    ports:
      - "8080:80"  # 修改为您需要的端口
```

### 数据持久化

- 数据库文件保存在 `./data` 目录
- 日志文件保存在 `./logs` 目录
- 请定期备份这些目录

## 🚨 常见问题

### 1. 端口被占用

```bash
# 检查端口占用
netstat -tulpn | grep 8080  # Linux
netstat -ano | findstr 8080  # Windows

# 修改 docker-compose.yml 中的端口配置
```

### 2. Docker 服务未启动

```bash
# Linux
sudo systemctl start docker

# Windows
# 启动 Docker Desktop
```

### 3. 权限问题

```bash
# Linux - 将用户添加到 docker 组
sudo usermod -aG docker $USER
# 然后重新登录
```

### 4. 内存不足

```bash
# 检查系统资源
docker system df
docker system prune  # 清理无用镜像和容器
```

## 📊 性能优化

### 1. 生产环境建议

- 使用 Nginx 反向代理
- 配置 HTTPS 证书
- 设置防火墙规则
- 定期备份数据

### 2. 资源要求

- **最低配置**: 1GB RAM, 1 CPU 核心
- **推荐配置**: 2GB RAM, 2 CPU 核心
- **存储空间**: 至少 5GB 可用空间

## 🔒 安全建议

1. **更改默认端口**: 避免使用常见端口
2. **设置防火墙**: 只开放必要的端口
3. **定期更新**: 保持系统和依赖包最新
4. **备份数据**: 定期备份重要数据
5. **监控日志**: 定期检查应用日志

## 📞 技术支持

如果您在部署过程中遇到问题：

1. 查看详细部署指南：`DEPLOYMENT_GUIDE.md`
2. 检查应用日志：`docker-compose logs`
3. 查看系统资源：`docker stats`
4. 提交 Issue 或联系技术支持

## 📝 更新日志

- **v1.0.0**: 初始版本，支持 Docker 一键部署
- 支持 Linux、macOS、Windows 三大平台
- 提供完整的管理脚本和备份方案

---

🎉 **恭喜！** 您已成功部署股票数据看板系统！

现在可以开始使用系统进行股票数据分析了。如有任何问题，请参考上述文档或联系技术支持。