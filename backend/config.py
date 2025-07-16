# -*- coding: utf-8 -*-
"""
股票数据API配置文件
包含数据库配置、缓存配置、API配置等
"""

import os
from datetime import timedelta

class Config:
    """基础配置类"""
    
    # Flask基础配置
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'stock-api-secret-key-2024'
    
    # 数据库配置
    DATABASE_PATH = os.path.join(os.path.dirname(__file__), 'stock_data.db')
    
    # 缓存配置
    CACHE_DURATION = 300  # 5分钟缓存时间（秒）
    
    # API配置
    API_VERSION = '1.0.0'
    API_PREFIX = '/api'
    
    # 请求频率限制配置
    RATE_LIMIT_PER_MINUTE = 60  # 每分钟最多请求次数
    RATE_LIMIT_WINDOW = 60      # 时间窗口（秒）
    
    # 批量查询限制
    MAX_BATCH_SIZE = 20  # 批量查询最大股票数量
    
    # 股票代码验证
    STOCK_CODE_LENGTH = 6
    
    # 支持的历史数据时间周期
    SUPPORTED_PERIODS = ['1d', '1w', '1m', '3m', '6m', '1y']
    
    # 搜索结果限制
    MAX_SEARCH_RESULTS = 20
    
    # 日志配置
    LOG_LEVEL = 'INFO'
    LOG_FILE = 'stock_api.log'
    LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    
    # CORS配置
    CORS_ORIGINS = ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001']
    CORS_METHODS = ['GET', 'POST', 'DELETE', 'OPTIONS']
    CORS_HEADERS = ['Content-Type', 'Authorization', 'Access-Control-Allow-Origin']
    
    # AKShare配置
    AKSHARE_TIMEOUT = 30  # 请求超时时间（秒）
    
    # 错误码定义
    ERROR_CODES = {
        'SUCCESS': 'SUCCESS',
        'MISSING_KEYWORD': 'MISSING_KEYWORD',
        'INVALID_STOCK_CODE': 'INVALID_STOCK_CODE',
        'STOCK_NOT_FOUND': 'STOCK_NOT_FOUND',
        'INVALID_PERIOD': 'INVALID_PERIOD',
        'INVALID_REQUEST_DATA': 'INVALID_REQUEST_DATA',
        'INVALID_CODES_FORMAT': 'INVALID_CODES_FORMAT',
        'TOO_MANY_CODES': 'TOO_MANY_CODES',
        'ALREADY_IN_WATCHLIST': 'ALREADY_IN_WATCHLIST',
        'NOT_IN_WATCHLIST': 'NOT_IN_WATCHLIST',
        'RATE_LIMIT_EXCEEDED': 'RATE_LIMIT_EXCEEDED',
        'API_NOT_FOUND': 'API_NOT_FOUND',
        'INTERNAL_ERROR': 'INTERNAL_ERROR',
        'INTERNAL_SERVER_ERROR': 'INTERNAL_SERVER_ERROR'
    }
    
    # 错误消息定义
    ERROR_MESSAGES = {
        'MISSING_KEYWORD': '搜索关键词不能为空',
        'INVALID_STOCK_CODE': '股票代码格式错误',
        'STOCK_NOT_FOUND': '股票不存在或数据获取失败',
        'INVALID_PERIOD': '时间周期参数错误',
        'INVALID_REQUEST_DATA': '请求数据格式错误',
        'INVALID_CODES_FORMAT': 'codes必须是非空数组',
        'TOO_MANY_CODES': f'一次最多查询{MAX_BATCH_SIZE}只股票',
        'ALREADY_IN_WATCHLIST': '股票已在关注列表中',
        'NOT_IN_WATCHLIST': '股票不在关注列表中',
        'RATE_LIMIT_EXCEEDED': '请求过于频繁，请稍后再试',
        'API_NOT_FOUND': '接口不存在',
        'INTERNAL_ERROR': '服务器内部错误',
        'INTERNAL_SERVER_ERROR': '服务器内部错误'
    }

class DevelopmentConfig(Config):
    """开发环境配置"""
    DEBUG = True
    LOG_LEVEL = 'DEBUG'
    
class ProductionConfig(Config):
    """生产环境配置"""
    DEBUG = False
    LOG_LEVEL = 'WARNING'
    
class TestingConfig(Config):
    """测试环境配置"""
    TESTING = True
    DATABASE_PATH = ':memory:'  # 使用内存数据库进行测试
    
# 配置字典
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}

def get_config(config_name=None):
    """获取配置对象"""
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'default')
    return config.get(config_name, config['default'])