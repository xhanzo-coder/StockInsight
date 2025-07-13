# 股票数据看板 Windows 一键部署脚本
# 适合 Windows 用户使用 Docker Desktop

# 设置错误处理
$ErrorActionPreference = "Stop"

# 颜色函数
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    } else {
        $input | Write-Output
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Info($message) {
    Write-ColorOutput Blue "[信息] $message"
}

function Write-Success($message) {
    Write-ColorOutput Green "[成功] $message"
}

function Write-Warning($message) {
    Write-ColorOutput Yellow "[警告] $message"
}

function Write-Error($message) {
    Write-ColorOutput Red "[错误] $message"
}

function Write-Step($message) {
    Write-ColorOutput Magenta "[步骤] $message"
}

function Write-Header {
    Write-ColorOutput Magenta @"
================================================
    🚀 股票数据看板一键部署脚本
    📊 适合 Windows 用户的 Docker 部署方案
================================================
"@
}

# 检查管理员权限
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# 检查 Docker Desktop
function Test-DockerDesktop {
    try {
        $dockerVersion = docker --version 2>$null
        if ($dockerVersion) {
            Write-Success "Docker Desktop 已安装: $dockerVersion"
            return $true
        }
    } catch {
        return $false
    }
    return $false
}

# 检查 Docker 服务状态
function Test-DockerService {
    try {
        docker info 2>$null | Out-Null
        return $true
    } catch {
        return $false
    }
}

# 安装 Docker Desktop
function Install-DockerDesktop {
    Write-Step "准备安装 Docker Desktop..."
    
    $downloadUrl = "https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe"
    $installerPath = "$env:TEMP\DockerDesktopInstaller.exe"
    
    Write-Info "下载 Docker Desktop 安装程序..."
    try {
        Invoke-WebRequest -Uri $downloadUrl -OutFile $installerPath -UseBasicParsing
        Write-Success "下载完成"
    } catch {
        Write-Error "下载失败: $_"
        Write-Info "请手动下载并安装 Docker Desktop: https://www.docker.com/products/docker-desktop"
        exit 1
    }
    
    Write-Info "启动安装程序..."
    Write-Warning "请按照安装向导完成 Docker Desktop 的安装"
    Write-Warning "安装完成后，请重启计算机并重新运行此脚本"
    
    Start-Process -FilePath $installerPath -Wait
    
    Write-Info "请重启计算机后重新运行此脚本"
    Read-Host "按 Enter 键退出"
    exit 0
}

# 检查系统要求
function Test-SystemRequirements {
    Write-Step "检查系统要求..."
    
    # 检查 Windows 版本
    $osVersion = [System.Environment]::OSVersion.Version
    if ($osVersion.Major -lt 10) {
        Write-Error "需要 Windows 10 或更高版本"
        exit 1
    }
    
    # 检查 Hyper-V 支持
    $hyperV = Get-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V-All 2>$null
    if (-not $hyperV -or $hyperV.State -ne "Enabled") {
        Write-Warning "Hyper-V 未启用，Docker Desktop 可能需要 WSL2"
    }
    
    Write-Success "系统要求检查通过"
}

# 等待 Docker 服务启动
function Wait-DockerService {
    Write-Info "等待 Docker 服务启动..."
    
    $maxAttempts = 30
    $attempt = 0
    
    while ($attempt -lt $maxAttempts) {
        if (Test-DockerService) {
            Write-Success "Docker 服务已启动"
            return $true
        }
        
        $attempt++
        Write-Info "等待 Docker 启动... ($attempt/$maxAttempts)"
        Start-Sleep -Seconds 10
    }
    
    Write-Error "Docker 服务启动超时"
    return $false
}

# 准备部署环境
function Initialize-Environment {
    Write-Step "准备部署环境..."
    
    # 创建数据目录
    if (-not (Test-Path "data")) {
        New-Item -ItemType Directory -Path "data" | Out-Null
    }
    
    if (-not (Test-Path "logs")) {
        New-Item -ItemType Directory -Path "logs" | Out-Null
    }
    
    Write-Success "环境准备完成"
}

# 部署应用
function Deploy-Application {
    Write-Step "构建和启动应用..."
    
    # 停止可能存在的旧容器
    try {
        docker-compose down 2>$null
    } catch {
        # 忽略错误
    }
    
    # 构建镜像
    Write-Info "正在构建 Docker 镜像，这可能需要几分钟..."
    try {
        docker-compose build --no-cache
        Write-Success "镜像构建完成"
    } catch {
        Write-Error "镜像构建失败: $_"
        exit 1
    }
    
    # 启动服务
    Write-Info "启动服务..."
    try {
        docker-compose up -d
        Write-Success "服务启动完成"
    } catch {
        Write-Error "服务启动失败: $_"
        exit 1
    }
    
    # 等待服务启动
    Write-Info "等待服务完全启动..."
    Start-Sleep -Seconds 30
}

# 检查服务状态
function Test-Services {
    Write-Step "检查服务状态..."
    
    # 检查容器状态
    try {
        $containers = docker-compose ps --format json | ConvertFrom-Json
        $runningContainers = $containers | Where-Object { $_.State -eq "running" }
        
        if ($runningContainers.Count -gt 0) {
            Write-Success "容器运行正常"
        } else {
            Write-Error "容器启动失败"
            Write-Info "查看日志: docker-compose logs"
            return $false
        }
    } catch {
        Write-Warning "无法检查容器状态"
    }
    
    # 检查健康状态
    Write-Info "等待健康检查..."
    for ($i = 1; $i -le 10; $i++) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:8080/api/health" -UseBasicParsing -TimeoutSec 5
            if ($response.StatusCode -eq 200) {
                Write-Success "服务健康检查通过"
                return $true
            }
        } catch {
            Write-Info "等待服务启动... ($i/10)"
            Start-Sleep -Seconds 10
        }
    }
    
    Write-Warning "健康检查超时，但服务可能仍在启动中"
    return $true
}

# 显示部署结果
function Show-Result {
    Write-Host ""
    Write-ColorOutput Green "🎉🎉🎉 部署成功！🎉🎉🎉"
    Write-Host ""
    Write-Host "================================"
    Write-ColorOutput Blue "📱 访问地址:"
    Write-Host "   本地访问: http://localhost:8080"
    Write-Host ""
    Write-ColorOutput Blue "🔧 API 地址:"
    Write-Host "   健康检查: http://localhost:8080/api/health"
    Write-Host "   API 文档: http://localhost:8080/api"
    Write-Host "================================"
    Write-Host ""
    Write-ColorOutput Yellow "📋 常用管理命令:"
    Write-Host "   查看状态: docker-compose ps"
    Write-Host "   查看日志: docker-compose logs -f"
    Write-Host "   重启服务: docker-compose restart"
    Write-Host "   停止服务: docker-compose down"
    Write-Host "   更新应用: docker-compose pull; docker-compose up -d"
    Write-Host ""
    Write-ColorOutput Yellow "📁 重要目录:"
    Write-Host "   数据目录: .\data (数据库文件)"
    Write-Host "   日志目录: .\logs (应用日志)"
    Write-Host ""
    Write-ColorOutput Red "⚠️  注意事项:"
    Write-Host "   1. 数据库文件保存在 .\data 目录，请定期备份"
    Write-Host "   2. 如需修改端口，请编辑 docker-compose.yml 文件"
    Write-Host "   3. 如需外网访问，请配置路由器端口转发"
    Write-Host ""
}

# 创建管理脚本
function New-ManagementScripts {
    Write-Step "创建管理脚本..."
    
    # 创建启动脚本
    @'
Write-Host "🚀 启动股票数据看板..."
docker-compose up -d
Write-Host "✅ 启动完成！访问 http://localhost:8080"
Read-Host "按 Enter 键退出"
'@ | Out-File -FilePath "start.ps1" -Encoding UTF8
    
    # 创建停止脚本
    @'
Write-Host "🛑 停止股票数据看板..."
docker-compose down
Write-Host "✅ 停止完成！"
Read-Host "按 Enter 键退出"
'@ | Out-File -FilePath "stop.ps1" -Encoding UTF8
    
    # 创建更新脚本
    @'
Write-Host "🔄 更新股票数据看板..."
Write-Host "📦 备份数据..."
$backupName = "data_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
Copy-Item -Path "data" -Destination $backupName -Recurse
Write-Host "🛑 停止服务..."
docker-compose down
Write-Host "🔧 重新构建..."
docker-compose build --no-cache
Write-Host "🚀 启动服务..."
docker-compose up -d
Write-Host "✅ 更新完成！"
Read-Host "按 Enter 键退出"
'@ | Out-File -FilePath "update.ps1" -Encoding UTF8
    
    # 创建备份脚本
    @'
$backupName = "backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
Write-Host "📦 创建备份: $backupName"
New-Item -ItemType Directory -Path $backupName
Copy-Item -Path "data" -Destination "$backupName\data" -Recurse
Copy-Item -Path "logs" -Destination "$backupName\logs" -Recurse
Copy-Item -Path "docker-compose.yml" -Destination "$backupName\"
Compress-Archive -Path $backupName -DestinationPath "$backupName.zip"
Remove-Item -Path $backupName -Recurse
Write-Host "✅ 备份完成: $backupName.zip"
Read-Host "按 Enter 键退出"
'@ | Out-File -FilePath "backup.ps1" -Encoding UTF8
    
    Write-Success "管理脚本创建完成"
}

# 主函数
function Main {
    Write-Header
    
    Write-Info "欢迎使用股票数据看板 Windows 一键部署脚本！"
    Write-Info "此脚本将自动检查并安装 Docker Desktop，然后部署应用"
    Write-Host ""
    
    Read-Host "按 Enter 键开始部署，或 Ctrl+C 取消"
    
    # 检查系统要求
    Test-SystemRequirements
    
    # 检查 Docker Desktop
    if (-not (Test-DockerDesktop)) {
        Write-Warning "未检测到 Docker Desktop"
        $install = Read-Host "是否自动下载并安装 Docker Desktop？(y/N)"
        if ($install -eq 'y' -or $install -eq 'Y') {
            Install-DockerDesktop
        } else {
            Write-Info "请手动安装 Docker Desktop: https://www.docker.com/products/docker-desktop"
            exit 1
        }
    }
    
    # 等待 Docker 服务
    if (-not (Wait-DockerService)) {
        Write-Error "Docker 服务未启动，请检查 Docker Desktop 是否正常运行"
        exit 1
    }
    
    # 部署应用
    Initialize-Environment
    Deploy-Application
    
    if (Test-Services) {
        New-ManagementScripts
        Show-Result
        Write-Success "🎉 恭喜！股票数据看板部署成功！"
        
        # 自动打开浏览器
        $openBrowser = Read-Host "是否自动打开浏览器访问应用？(Y/n)"
        if ($openBrowser -ne 'n' -and $openBrowser -ne 'N') {
            Start-Process "http://localhost:8080"
        }
    } else {
        Write-Error "部署过程中出现问题，请检查日志"
        Write-Info "查看详细日志: docker-compose logs"
        exit 1
    }
    
    Read-Host "按 Enter 键退出"
}

# 运行主函数
Main