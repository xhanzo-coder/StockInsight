#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
前端API代理服务器
解决前端请求错误端口的问题
将 /api/* 请求代理到后端 localhost:5000
"""

import http.server
import socketserver
import urllib.request
import urllib.parse
from urllib.error import URLError, HTTPError
import json
import os
import sys
from datetime import datetime

class ProxyHandler(http.server.SimpleHTTPRequestHandler):
    """代理处理器，将API请求转发到后端"""
    
    def log_message(self, format, *args):
        """自定义日志格式"""
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        try:
            message = format % args
            # 确保消息可以安全编码
            safe_message = message.encode('utf-8', errors='replace').decode('utf-8')
            print(f"[{timestamp}] {safe_message}")
        except Exception:
            print(f"[{timestamp}] Log encoding error")
    
    def do_GET(self):
        if self.path.startswith('/api/'):
            self.proxy_request()
        else:
            # 服务静态文件
            if self.path == '/':
                self.path = '/index.html'
            return super().do_GET()
    
    def do_POST(self):
        if self.path.startswith('/api/'):
            self.proxy_request()
        else:
            self.send_error(404, "API endpoint not found")
    
    def do_DELETE(self):
        if self.path.startswith('/api/'):
            self.proxy_request()
        else:
            self.send_error(404, "API endpoint not found")
    
    def do_OPTIONS(self):
        """处理CORS预检请求"""
        if self.path.startswith('/api/'):
            self.proxy_request()
        else:
            self.send_response(200)
            self.send_cors_headers()
            self.end_headers()
    
    def send_cors_headers(self):
        """发送CORS头"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Access-Control-Max-Age', '86400')
    
    def proxy_request(self):
        """代理请求到后端"""
        # 构建后端URL
        backend_url = f"http://localhost:5000{self.path}"
        
        # 解析查询参数
        if '?' in self.path:
            path_part, query_part = self.path.split('?', 1)
            backend_url = f"http://localhost:5000{path_part}?{query_part}"
        
        self.log_message(f"代理请求: {self.command} {self.path} -> {backend_url}")
        
        try:
            # 创建请求
            req = urllib.request.Request(backend_url, method=self.command)
            
            # 复制请求头（排除一些不需要的头）
            skip_headers = ['host', 'connection', 'content-length']
            for header, value in self.headers.items():
                if header.lower() not in skip_headers:
                    req.add_header(header, value)
            
            # 处理请求体（POST/PUT/PATCH）
            if self.command in ['POST', 'PUT', 'PATCH']:
                content_length = int(self.headers.get('Content-Length', 0))
                if content_length > 0:
                    req.data = self.rfile.read(content_length)
            
            # 发送请求到后端
            with urllib.request.urlopen(req, timeout=30) as response:
                # 发送响应状态
                self.send_response(response.getcode())
                
                # 复制响应头
                skip_response_headers = ['connection', 'transfer-encoding', 'content-encoding']
                for header, value in response.headers.items():
                    if header.lower() not in skip_response_headers:
                        self.send_header(header, value)
                
                # 添加CORS头
                self.send_cors_headers()
                self.end_headers()
                
                # 发送响应体
                response_data = response.read()
                self.wfile.write(response_data)
                
                self.log_message(f"代理成功: {response.getcode()} - {len(response_data)} bytes")
                
        except HTTPError as e:
            # HTTP错误（4xx, 5xx）
            self.log_message(f"后端HTTP错误: {e.code} {str(e.reason)}")
            self.send_response(e.code)
            self.send_cors_headers()
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            
            error_response = {
                'success': False,
                'error': f'Backend error: {str(e.reason)}',
                'error_code': f'HTTP_{e.code}'
            }
            self.wfile.write(json.dumps(error_response, ensure_ascii=True).encode('utf-8'))
            
        except URLError as e:
            # 连接错误
            self.log_message(f"后端连接错误: {str(e)}")
            self.send_response(502)
            self.send_cors_headers()
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            
            error_response = {
                'success': False,
                'error': 'Backend connection failed',
                'error_code': 'CONNECTION_ERROR'
            }
            self.wfile.write(json.dumps(error_response, ensure_ascii=True).encode('utf-8'))
            
        except Exception as e:
            # 其他错误
            self.log_message(f"代理错误: {str(e)}")
            self.send_response(500)
            self.send_cors_headers()
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            
            error_response = {
                'success': False,
                'error': 'Proxy error',
                'error_code': 'PROXY_ERROR'
            }
            self.wfile.write(json.dumps(error_response, ensure_ascii=True).encode('utf-8'))

def main():
    """主函数"""
    PORT = 3001
    BACKEND_PORT = 5000
    
    # 检查build目录是否存在
    build_dir = os.path.join(os.getcwd(), 'build')
    if not os.path.exists(build_dir):
        print(f"❌ 错误: build目录不存在: {build_dir}")
        print("请确保在frontend目录下运行此脚本")
        sys.exit(1)
    
    # 切换到build目录
    os.chdir(build_dir)
    print(f"📁 工作目录: {os.getcwd()}")
    
    # 检查后端是否运行
    try:
        test_url = f"http://localhost:{BACKEND_PORT}/api/health"
        with urllib.request.urlopen(test_url, timeout=5) as response:
            if response.getcode() == 200:
                print(f"✅ 后端服务正常运行在端口 {BACKEND_PORT}")
            else:
                print(f"⚠️  后端服务响应异常: {response.getcode()}")
    except Exception as e:
        print(f"❌ 警告: 无法连接到后端服务 (localhost:{BACKEND_PORT})")
        print(f"   错误: {str(e)}")
        print(f"   请确保后端服务已启动")
        print()
    
    # 启动代理服务器
    try:
        with socketserver.TCPServer(("", PORT), ProxyHandler) as httpd:
            print("="*60)
            print(f"🚀 前端代理服务器启动成功!")
            print(f"📍 前端地址: http://localhost:{PORT}")
            print(f"🔄 API代理: /api/* -> http://localhost:{BACKEND_PORT}/api/*")
            print(f"📂 静态文件: {build_dir}")
            print("="*60)
            print("💡 使用说明:")
            print(f"   1. 在浏览器中访问: http://localhost:{PORT}")
            print(f"   2. 所有API请求会自动转发到后端")
            print(f"   3. 按 Ctrl+C 停止服务器")
            print("="*60)
            print()
            
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n🛑 服务器已停止")
    except OSError as e:
        if "Address already in use" in str(e):
            print(f"❌ 错误: 端口 {PORT} 已被占用")
            print("   请关闭其他使用该端口的程序，或修改PORT变量")
        else:
            print(f"❌ 服务器启动失败: {str(e)}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ 未知错误: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()