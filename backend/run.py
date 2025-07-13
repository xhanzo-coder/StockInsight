#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
股票数据API启动脚本
用于启动Flask应用服务器
"""

import os
import sys
from app import create_app
from config import get_config

def main():
    """主函数"""
    # 设置环境变量
    config_name = os.environ.get('FLASK_ENV', 'development')
    
    # 创建应用
    app = create_app(config_name)
    config = get_config(config_name)
    
    # 打印启动信息
    print("="*60)
    print("🚀 股票数据API服务启动中...")
    print(f"📊 环境: {config_name}")
    print(f"🌐 服务地址: http://localhost:5000")
    print(f"💡 健康检查: http://localhost:5000/api/health")
    print(f"📚 API接口列表:")
    print(f"   - GET  /api/health                    # 健康检查")
    print(f"   - GET  /api/stocks/search?keyword=XX  # 股票搜索")
    print(f"   - GET  /api/stocks/{{code}}             # 股票详情")
    print(f"   - GET  /api/stocks/{{code}}/history     # 历史数据")
    print(f"   - POST /api/stocks/batch              # 批量查询")
    print(f"   - GET  /api/watchlist                 # 关注列表")
    print(f"   - POST /api/watchlist                 # 添加关注")
    print(f"   - DEL  /api/watchlist/{{code}}          # 删除关注")
    print(f"   - GET  /api/market/overview           # 市场概览")
    print("="*60)
    
    try:
        # 启动服务器
        app.run(
            host='0.0.0.0',
            port=5000,
            debug=config.DEBUG,
            threaded=True
        )
    except KeyboardInterrupt:
        print("\n👋 服务已停止")
    except Exception as e:
        print(f"❌ 服务启动失败: {str(e)}")
        sys.exit(1)

if __name__ == '__main__':
    main()