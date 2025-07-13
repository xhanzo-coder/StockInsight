# -*- coding: utf-8 -*-
"""
股票数据API后端主应用
作者: AI助手
功能: 提供股票数据查询、搜索、历史数据和关注列表管理的API接口
"""

from flask import Flask
from flask_cors import CORS
import logging
import os
from datetime import datetime

# 导入配置和模块
from config import get_config
from database import db_manager
from api_routes import api_bp

def create_app(config_name=None):
    """应用工厂函数"""
    # 创建Flask应用实例
    app = Flask(__name__)
    
    # 加载配置
    config = get_config(config_name)
    app.config.from_object(config)
    
    # 配置CORS，允许跨域请求
    CORS(app, resources={
        r"/api/*": {
            "origins": config.CORS_ORIGINS,
            "methods": config.CORS_METHODS,
            "allow_headers": config.CORS_HEADERS
        }
    })
    
    # 配置日志
    setup_logging(config)
    
    # 注册蓝图
    app.register_blueprint(api_bp)
    
    # 注册错误处理器
    register_error_handlers(app)
    
    # 初始化数据库
    with app.app_context():
        try:
            db_manager.init_database()
            app.logger.info("数据库初始化完成")
        except Exception as e:
            app.logger.error(f"数据库初始化失败: {str(e)}")
            raise
    
    app.logger.info(f"股票数据API应用创建完成，配置: {config_name or 'default'}")
    return app

def setup_logging(config):
    """设置日志配置"""
    logging.basicConfig(
        level=getattr(logging, config.LOG_LEVEL),
        format=config.LOG_FORMAT,
        handlers=[
            logging.FileHandler(config.LOG_FILE, encoding='utf-8'),
            logging.StreamHandler()
        ]
    )

def register_error_handlers(app):
    """注册全局错误处理器"""
    
    @app.errorhandler(404)
    def not_found(error):
        """404错误处理"""
        return {
            'success': False,
            'error': '页面不存在',
            'error_code': 'PAGE_NOT_FOUND'
        }, 404
    
    @app.errorhandler(500)
    def internal_error(error):
        """500错误处理"""
        app.logger.error(f"服务器内部错误: {str(error)}")
        return {
            'success': False,
            'error': '服务器内部错误',
            'error_code': 'INTERNAL_SERVER_ERROR'
        }, 500
    
    @app.errorhandler(Exception)
    def handle_exception(error):
        """全局异常处理"""
        app.logger.error(f"未处理的异常: {str(error)}", exc_info=True)
        return {
            'success': False,
            'error': '服务器发生未知错误',
            'error_code': 'UNKNOWN_ERROR'
        }, 500

# 创建应用实例
app = create_app()

if __name__ == '__main__':
    # 获取配置
    config = get_config()
    
    # 启动应用
    app.logger.info("股票数据API服务启动中...")
    app.logger.info(f"服务地址: http://localhost:5000")
    app.logger.info(f"API文档: http://localhost:5000/api/health")
    
    try:
        app.run(
            host='0.0.0.0', 
            port=5000, 
            debug=config.DEBUG
        )
    except KeyboardInterrupt:
        app.logger.info("服务已停止")
    except Exception as e:
        app.logger.error(f"服务启动失败: {str(e)}")
        raise