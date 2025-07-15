# -*- coding: utf-8 -*-
"""
API路由模块
定义所有的API接口路由和处理逻辑
"""

from flask import Blueprint, request, jsonify
import logging
import time
from functools import wraps
from typing import Dict, Any

from config import get_config
from database import db_manager
from stock_service import stock_service

# 获取配置
config = get_config()
logger = logging.getLogger(__name__)

# 创建蓝图
api_bp = Blueprint('api', __name__, url_prefix='/api')

# 请求频率限制存储
request_counts = {}

def rate_limit(f):
    """请求频率限制装饰器"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        client_ip = request.remote_addr
        current_time = time.time()
        
        # 清理过期的请求记录
        if client_ip in request_counts:
            request_counts[client_ip] = [
                req_time for req_time in request_counts[client_ip]
                if current_time - req_time < config.RATE_LIMIT_WINDOW
            ]
        else:
            request_counts[client_ip] = []
        
        # 检查请求频率
        if len(request_counts[client_ip]) >= config.RATE_LIMIT_PER_MINUTE:
            return create_error_response(
                'RATE_LIMIT_EXCEEDED',
                config.ERROR_MESSAGES['RATE_LIMIT_EXCEEDED'],
                429
            )
        
        # 记录当前请求
        request_counts[client_ip].append(current_time)
        
        return f(*args, **kwargs)
    return decorated_function

def log_api_call(f):
    """API调用日志装饰器"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        start_time = time.time()
        endpoint = request.endpoint
        method = request.method
        ip_address = request.remote_addr
        user_agent = request.headers.get('User-Agent', '')
        
        try:
            response = f(*args, **kwargs)
            response_code = response[1] if isinstance(response, tuple) else 200
            error_message = None
        except Exception as e:
            response = create_error_response('INTERNAL_ERROR', str(e), 500)
            response_code = 500
            error_message = str(e)
            logger.error(f"API调用异常: {endpoint}, 错误: {str(e)}")
        
        # 计算响应时间
        response_time_ms = int((time.time() - start_time) * 1000)
        
        # 记录日志
        try:
            db_manager.log_api_call(
                endpoint=endpoint,
                method=method,
                ip_address=ip_address,
                user_agent=user_agent,
                response_code=response_code,
                response_time_ms=response_time_ms,
                error_message=error_message
            )
        except Exception as log_error:
            logger.error(f"记录API日志失败: {str(log_error)}")
        
        return response
    return decorated_function

def create_success_response(data: Any, message: str = None, **kwargs) -> Dict:
    """创建成功响应"""
    response = {
        'success': True,
        'data': data
    }
    
    if message:
        response['message'] = message
    
    # 添加额外字段
    response.update(kwargs)
    
    return jsonify(response)

def create_error_response(error_code: str, error_message: str = None, status_code: int = 400) -> tuple:
    """创建错误响应"""
    response = {
        'success': False,
        'error_code': error_code,
        'error': error_message or config.ERROR_MESSAGES.get(error_code, '未知错误')
    }
    
    return jsonify(response), status_code

def validate_stock_code(stock_code: str) -> bool:
    """验证股票代码格式"""
    return (
        stock_code and 
        len(stock_code) == config.STOCK_CODE_LENGTH and 
        stock_code.isdigit()
    )

# ==================== API路由定义 ====================

@api_bp.route('/health', methods=['GET'])
def health_check():
    """健康检查接口"""
    return create_success_response(
        data={
            'status': 'healthy',
            'version': config.API_VERSION,
            'timestamp': time.time()
        },
        message='股票数据API服务正常运行'
    )

@api_bp.route('/stocks/search', methods=['GET'])
@rate_limit
@log_api_call
def search_stocks():
    """股票搜索接口"""
    try:
        keyword = request.args.get('keyword', '').strip()
        if not keyword:
            return create_error_response(
                'MISSING_KEYWORD',
                config.ERROR_MESSAGES['MISSING_KEYWORD']
            )
        
        limit = request.args.get('limit', config.MAX_SEARCH_RESULTS, type=int)
        if limit > config.MAX_SEARCH_RESULTS:
            limit = config.MAX_SEARCH_RESULTS
        
        # 搜索股票
        results = stock_service.search_stocks(keyword, limit)
        
        return create_success_response(
            data=results,
            count=len(results),
            keyword=keyword
        )
    
    except Exception as e:
        logger.error(f"搜索股票API错误: {str(e)}")
        return create_error_response('INTERNAL_ERROR', str(e), 500)

@api_bp.route('/stocks/<stock_code>', methods=['GET'])
@rate_limit
@log_api_call
def get_stock_detail(stock_code):
    """获取股票详细信息接口"""
    try:
        # 验证股票代码格式
        if not validate_stock_code(stock_code):
            return create_error_response(
                'INVALID_STOCK_CODE',
                config.ERROR_MESSAGES['INVALID_STOCK_CODE']
            )
        
        # 获取股票信息
        stock_info = stock_service.get_stock_complete_data(stock_code)
        if not stock_info:
            return create_error_response(
                'STOCK_NOT_FOUND',
                config.ERROR_MESSAGES['STOCK_NOT_FOUND'],
                404
            )
        
        # 检查是否在关注列表中
        is_watched = db_manager.is_in_watchlist(stock_code)
        stock_info['is_watched'] = is_watched
        
        return create_success_response(data=stock_info)
    
    except Exception as e:
        logger.error(f"获取股票详情API错误: {stock_code}, {str(e)}")
        return create_error_response('INTERNAL_ERROR', str(e), 500)

@api_bp.route('/stocks/<stock_code>/history', methods=['GET'])
@rate_limit
@log_api_call
def get_stock_history(stock_code):
    """获取股票历史数据接口"""
    try:
        # 验证股票代码格式
        if not validate_stock_code(stock_code):
            return create_error_response(
                'INVALID_STOCK_CODE',
                config.ERROR_MESSAGES['INVALID_STOCK_CODE']
            )
        
        period = request.args.get('period', '1y')
        if period not in config.SUPPORTED_PERIODS:
            return create_error_response(
                'INVALID_PERIOD',
                f'时间周期参数错误，支持的周期: {", ".join(config.SUPPORTED_PERIODS)}'
            )
        
        # 获取历史数据
        history_data = stock_service.get_stock_history(stock_code, period)
        
        return create_success_response(
            data=history_data,
            count=len(history_data),
            period=period,
            stock_code=stock_code
        )
    
    except Exception as e:
        logger.error(f"获取股票历史数据API错误: {stock_code}, {str(e)}")
        return create_error_response('INTERNAL_ERROR', str(e), 500)

@api_bp.route('/stocks/batch', methods=['POST'])
@rate_limit
@log_api_call
def get_stocks_batch():
    """批量获取股票数据接口"""
    try:
        data = request.get_json()
        if not data or 'codes' not in data:
            return create_error_response(
                'INVALID_REQUEST_DATA',
                '请求数据格式错误，需要codes字段'
            )
        
        codes = data['codes']
        if not isinstance(codes, list) or len(codes) == 0:
            return create_error_response(
                'INVALID_CODES_FORMAT',
                config.ERROR_MESSAGES['INVALID_CODES_FORMAT']
            )
        
        if len(codes) > config.MAX_BATCH_SIZE:
            return create_error_response(
                'TOO_MANY_CODES',
                config.ERROR_MESSAGES['TOO_MANY_CODES']
            )
        
        # 验证所有股票代码
        valid_codes = []
        invalid_codes = []
        
        for code in codes:
            if validate_stock_code(str(code)):
                valid_codes.append(str(code))
            else:
                invalid_codes.append(str(code))
        
        # 批量获取股票数据
        results = stock_service.get_batch_stocks(valid_codes)
        
        response_data = {
            'stocks': results,
            'requested_count': len(codes),
            'valid_count': len(valid_codes),
            'success_count': len(results)
        }
        
        if invalid_codes:
            response_data['invalid_codes'] = invalid_codes
        
        return create_success_response(data=response_data)
    
    except Exception as e:
        logger.error(f"批量获取股票数据API错误: {str(e)}")
        return create_error_response('INTERNAL_ERROR', str(e), 500)

@api_bp.route('/watchlist', methods=['GET'])
@log_api_call
def get_watchlist():
    """获取关注列表接口"""
    try:
        watchlist = db_manager.get_watchlist()
        
        # 为每个关注的股票添加完整的股票信息
        enriched_watchlist = []
        for item in watchlist:
            stock_info = stock_service.get_stock_basic_info(item['code'])
            if stock_info:
                # 合并关注列表基本信息和完整股票信息（按新字段格式）
                enriched_item = {
                    **item,  # 包含 code, name, industry, added_time, updated_time
                    'current_price': stock_info['current_price'],
                    'change_percent': stock_info['change_percent'],
                    'change_amount': stock_info['change_amount'],
                    # 添加完整的11个字段
                    'market_cap': stock_info.get('market_cap'),  # 总市值（亿）
                    'pe_ratio_ttm': stock_info.get('pe_ratio_ttm'),  # 市盈率(TTM)
                    'roe': stock_info.get('roe'),  # ROE（已含百分号）
                    'market_earning_ratio': stock_info.get('market_earning_ratio'),  # 市赚率
                    'pb_ratio': stock_info.get('pb_ratio'),  # 市净率
                    'dividend_payout_ratio': stock_info.get('dividend_payout_ratio'),  # 股利支付率（已含百分号）
                    'correction_factor': stock_info.get('correction_factor'),  # 修正系数
                    'corrected_market_earning_ratio': stock_info.get('corrected_market_earning_ratio'),  # 修正市赚率
                    'theoretical_price': stock_info.get('theoretical_price')  # 理论股价
                }
            else:
                # 如果获取股票信息失败，设置默认值
                enriched_item = {
                    **item,
                    'current_price': None,
                    'change_percent': None,
                    'change_amount': None,
                    'market_cap': None,
                    'pe_ratio_ttm': None,
                    'roe': None,
                    'market_earning_ratio': None,
                    'pb_ratio': None,
                    'dividend_payout_ratio': None,
                    'correction_factor': None,
                    'corrected_market_earning_ratio': None,
                    'theoretical_price': None
                }
            enriched_watchlist.append(enriched_item)
        
        return create_success_response(
            data=enriched_watchlist,
            count=len(enriched_watchlist)
        )
    
    except Exception as e:
        logger.error(f"获取关注列表API错误: {str(e)}")
        return create_error_response('INTERNAL_ERROR', str(e), 500)

@api_bp.route('/watchlist', methods=['POST'])
@log_api_call
def add_to_watchlist():
    """添加股票到关注列表接口"""
    try:
        data = request.get_json()
        if not data or 'code' not in data:
            return create_error_response(
                'INVALID_REQUEST_DATA',
                '请求数据格式错误，需要code字段'
            )
        
        stock_code = str(data['code']).strip()
        if not validate_stock_code(stock_code):
            return create_error_response(
                'INVALID_STOCK_CODE',
                config.ERROR_MESSAGES['INVALID_STOCK_CODE']
            )
        
        # 获取股票信息验证股票是否存在
        stock_info = stock_service.get_stock_basic_info(stock_code)
        if not stock_info:
            return create_error_response(
                'STOCK_NOT_FOUND',
                config.ERROR_MESSAGES['STOCK_NOT_FOUND'],
                404
            )
        
        # 添加到关注列表
        try:
            db_manager.add_to_watchlist(
                stock_code=stock_code,
                stock_name=stock_info['name'],
                industry=data.get('industry', '')
            )
            
            return create_success_response(
                data={
                    'code': stock_code,
                    'name': stock_info['name'],
                    'industry': data.get('industry', '')
                },
                message='添加到关注列表成功'
            )
        
        except ValueError as e:
            if '已在关注列表中' in str(e):
                return create_error_response(
                    'ALREADY_IN_WATCHLIST',
                    config.ERROR_MESSAGES['ALREADY_IN_WATCHLIST'],
                    409
                )
            raise
    
    except Exception as e:
        logger.error(f"添加关注列表API错误: {str(e)}")
        return create_error_response('INTERNAL_ERROR', str(e), 500)

@api_bp.route('/watchlist/<stock_code>', methods=['DELETE'])
@log_api_call
def remove_from_watchlist(stock_code):
    """从关注列表删除股票接口"""
    try:
        if not validate_stock_code(stock_code):
            return create_error_response(
                'INVALID_STOCK_CODE',
                config.ERROR_MESSAGES['INVALID_STOCK_CODE']
            )
        
        try:
            db_manager.remove_from_watchlist(stock_code)
            
            return create_success_response(
                data={'code': stock_code},
                message='从关注列表删除成功'
            )
        
        except ValueError as e:
            if '不在关注列表中' in str(e):
                return create_error_response(
                    'NOT_IN_WATCHLIST',
                    config.ERROR_MESSAGES['NOT_IN_WATCHLIST'],
                    404
                )
            raise
    
    except Exception as e:
        logger.error(f"删除关注列表API错误: {stock_code}, {str(e)}")
        return create_error_response('INTERNAL_ERROR', str(e), 500)

@api_bp.route('/market/overview', methods=['GET'])
@rate_limit
@log_api_call
def get_market_overview():
    """获取市场概览接口"""
    try:
        market_data = stock_service.get_market_overview()
        if not market_data:
            return create_error_response(
                'INTERNAL_ERROR',
                '获取市场数据失败',
                500
            )
        
        return create_success_response(data=market_data)
    
    except Exception as e:
        logger.error(f"获取市场概览API错误: {str(e)}")
        return create_error_response('INTERNAL_ERROR', str(e), 500)

@api_bp.route('/cache/clear', methods=['POST'])
@log_api_call
def clear_cache():
    """清空缓存接口（管理功能）"""
    try:
        stock_service.clear_cache()
        
        return create_success_response(
            data={'cleared': True},
            message='缓存清空成功'
        )
    
    except Exception as e:
        logger.error(f"清空缓存API错误: {str(e)}")
        return create_error_response('INTERNAL_ERROR', str(e), 500)

@api_bp.route('/stats', methods=['GET'])
@log_api_call
def get_api_stats():
    """获取API统计信息接口（管理功能）"""
    try:
        hours = request.args.get('hours', 24, type=int)
        if hours > 168:  # 最多7天
            hours = 168
        
        api_stats = db_manager.get_api_stats(hours)
        cache_stats = stock_service.get_cache_stats()
        
        return create_success_response(
            data={
                'api_stats': api_stats,
                'cache_stats': cache_stats,
                'period_hours': hours
            }
        )
    
    except Exception as e:
        logger.error(f"获取API统计错误: {str(e)}")
        return create_error_response('INTERNAL_ERROR', str(e), 500)

# 错误处理器
@api_bp.errorhandler(404)
def api_not_found(error):
    """API 404错误处理"""
    return create_error_response(
        'API_NOT_FOUND',
        config.ERROR_MESSAGES['API_NOT_FOUND'],
        404
    )

@api_bp.errorhandler(405)
def method_not_allowed(error):
    """方法不允许错误处理"""
    return create_error_response(
        'METHOD_NOT_ALLOWED',
        '请求方法不被允许',
        405
    )

@api_bp.errorhandler(500)
def api_internal_error(error):
    """API 500错误处理"""
    return create_error_response(
        'INTERNAL_SERVER_ERROR',
        config.ERROR_MESSAGES['INTERNAL_SERVER_ERROR'],
        500
    )