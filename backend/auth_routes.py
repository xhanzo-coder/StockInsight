"""
用户认证API路由
提供用户注册、登录、验证等功能
"""

from flask import Blueprint, request, current_app
from database import db_manager
from auth_utils import AuthUtils, token_required, validate_user_input, create_response
import logging

logger = logging.getLogger(__name__)

# 创建认证蓝图
auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


@auth_bp.route('/register', methods=['POST'])
def register():
    """用户注册"""
    try:
        data = request.get_json()
        if not data:
            return create_response(False, '请提供注册信息', status_code=400)
        
        # 验证输入数据
        required_fields = ['username', 'email', 'password']
        errors = validate_user_input(data, required_fields)
        
        if errors:
            return create_response(False, '; '.join(errors), status_code=400)
        
        username = data['username'].strip()
        email = data['email'].strip().lower()
        password = data['password']
        
        # 检查用户是否已存在
        existing_user = db_manager.get_user_by_username(username)
        if existing_user:
            return create_response(False, '用户名已存在', status_code=409)
        
        # 加密密码
        password_hash = AuthUtils.hash_password(password)
        
        # 创建用户
        user_id = db_manager.create_user(username, email, password_hash)
        
        # 生成JWT令牌
        token = AuthUtils.generate_token(user_id, username)
        
        logger.info(f"用户 {username} 注册成功")
        
        return create_response(
            True, 
            '注册成功', 
            {
                'user': {
                    'id': user_id,
                    'username': username,
                    'email': email
                },
                'token': token
            }
        )
        
    except ValueError as e:
        return create_response(False, str(e), status_code=409)
    except Exception as e:
        logger.error(f"用户注册失败: {str(e)}")
        return create_response(False, '注册失败，请稍后重试', status_code=500)


@auth_bp.route('/login', methods=['POST'])
def login():
    """用户登录"""
    try:
        data = request.get_json()
        if not data:
            return create_response(False, '请提供登录信息', status_code=400)
        
        username = data.get('username', '').strip()
        password = data.get('password', '')
        
        if not username or not password:
            return create_response(False, '用户名和密码不能为空', status_code=400)
        
        # 获取用户信息
        user = db_manager.get_user_by_username(username)
        if not user:
            return create_response(False, '用户名或密码错误', status_code=401)
        
        # 验证密码
        if not AuthUtils.verify_password(password, user['password_hash']):
            return create_response(False, '用户名或密码错误', status_code=401)
        
        # 更新最后登录时间
        db_manager.update_last_login(user['id'])
        
        # 生成JWT令牌
        token = AuthUtils.generate_token(user['id'], user['username'])
        
        logger.info(f"用户 {username} 登录成功")
        
        return create_response(
            True, 
            '登录成功', 
            {
                'user': {
                    'id': user['id'],
                    'username': user['username'],
                    'email': user['email']
                },
                'token': token
            }
        )
        
    except Exception as e:
        logger.error(f"用户登录失败: {str(e)}")
        return create_response(False, '登录失败，请稍后重试', status_code=500)


@auth_bp.route('/verify', methods=['GET'])
@token_required
def verify_token():
    """验证令牌有效性"""
    try:
        user_id = request.current_user['user_id']
        
        # 获取最新用户信息
        user = db_manager.get_user_by_id(user_id)
        if not user:
            return create_response(False, '用户不存在', status_code=404)
        
        return create_response(
            True, 
            '令牌有效', 
            {
                'user': {
                    'id': user['id'],
                    'username': user['username'],
                    'email': user['email']
                }
            }
        )
        
    except Exception as e:
        logger.error(f"令牌验证失败: {str(e)}")
        return create_response(False, '验证失败', status_code=500)


@auth_bp.route('/profile', methods=['GET'])
@token_required
def get_profile():
    """获取用户资料"""
    try:
        user_id = request.current_user['user_id']
        
        user = db_manager.get_user_by_id(user_id)
        if not user:
            return create_response(False, '用户不存在', status_code=404)
        
        return create_response(
            True, 
            '获取成功', 
            {
                'user': {
                    'id': user['id'],
                    'username': user['username'],
                    'email': user['email'],
                    'created_time': user['created_time'],
                    'last_login': user['last_login']
                }
            }
        )
        
    except Exception as e:
        logger.error(f"获取用户资料失败: {str(e)}")
        return create_response(False, '获取失败', status_code=500)


@auth_bp.route('/create-test-user', methods=['POST'])
def create_test_user():
    """创建测试用户（仅用于开发测试）"""
    try:
        # 检查是否已存在测试用户
        existing_user = db_manager.get_user_by_username("admin")
        if existing_user:
            return create_response(
                True, 
                '测试用户已存在', 
                {
                    'user': {
                        'id': existing_user['id'],
                        'username': existing_user['username'],
                        'email': existing_user['email']
                    },
                    'credentials': {
                        'username': 'admin',
                        'password': 'admin123'
                    }
                }
            )
        
        # 创建测试用户
        username = "admin"
        email = "admin@stockinsight.com"
        password = "admin123"
        
        # 加密密码
        password_hash = AuthUtils.hash_password(password)
        
        # 创建用户
        user_id = db_manager.create_user(username, email, password_hash)
        
        logger.info(f"测试用户 {username} 创建成功")
        
        return create_response(
            True, 
            '测试用户创建成功', 
            {
                'user': {
                    'id': user_id,
                    'username': username,
                    'email': email
                },
                'credentials': {
                    'username': username,
                    'password': password
                }
            }
        )
        
    except Exception as e:
        logger.error(f"创建测试用户失败: {str(e)}")
        return create_response(False, '创建测试用户失败', status_code=500)


@auth_bp.route('/logout', methods=['POST'])
@token_required
def logout():
    """用户登出（客户端处理令牌删除）"""
    try:
        username = request.current_user['username']
        logger.info(f"用户 {username} 登出")
        
        return create_response(True, '登出成功')
        
    except Exception as e:
        logger.error(f"用户登出失败: {str(e)}")
        return create_response(False, '登出失败', status_code=500)


# 错误处理
@auth_bp.errorhandler(400)
def bad_request(error):
    return create_response(False, '请求参数错误', status_code=400)


@auth_bp.errorhandler(401)
def unauthorized(error):
    return create_response(False, '未授权访问', status_code=401)


@auth_bp.errorhandler(404)
def not_found(error):
    return create_response(False, '资源不存在', status_code=404)


@auth_bp.errorhandler(500)
def internal_error(error):
    return create_response(False, '服务器内部错误', status_code=500)