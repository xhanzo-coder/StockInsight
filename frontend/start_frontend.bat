@echo off
chcp 65001 >nul
echo ========================================
echo 🚀 启动前端代理服务器
echo ========================================
echo.
echo 💡 使用说明:
echo    1. 确保后端已启动 (python app.py)
echo    2. 在浏览器访问: http://localhost:3001
echo    3. 按 Ctrl+C 停止服务器
echo.
echo ========================================
echo.

cd /d "%~dp0"
python proxy_server.py

echo.
echo 🛑 服务器已停止
pause