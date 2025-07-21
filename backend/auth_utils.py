"""
认证工具模块
提供JWT令牌生成/验证和密码加密/验证功能
"""

from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, verify_jwt_in_request, get_jwt
import bcrypt
from datetime import timedelta
from functools import wraps
from flask import request, jsonify, current_app
import logging

logger = logging.getLogger(__name__)

class AuthUtils:
    """认证工具类"""
    
    @staticmethod
    def hash_password(password):
        """加密密码"""
        try:
            # 生成盐值并加密密码
            salt = bcrypt.gensalt()
            hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
            return hashed.decode('utf-8')
        except Exception as e:
            logger.error(f"密码加密失败: {str(e)}")
            raise
    
    @staticmethod
    def verify_password(password, hashed_password):
        """验证密码"""
        try:
            return bcrypt.checkpw(
                password.encode('utf-8'), 
                hashed_password.encode('utf-8')
            )
        except Exception as e:
            logger.error(f"密码验证失败: {str(e)}")
            return False
    
    @staticmethod
    def generate_token(user_id, username, expires_hours=24):
        """生成JWT令牌"""
        try:
            # 创建身份信息 - 使用字符串作为subject，额外信息放在additional_claims中
            identity = str(user_id)  # subject必须是字符串
            additional_claims = {
                'user_id': user_id,
                'username': username
            }
            
            # 设置过期时间
            expires_delta = timedelta(hours=expires_hours)
            
            # 生成访问令牌
            token = create_access_token(
                identity=identity,
                expires_delta=expires_delta,
                additional_claims=additional_claims
            )
            
            return token
        except Exception as e:
            logger.error(f"生成JWT令牌失败: {str(e)}")
            raise
    
    @staticmethod
    def verify_token():
        """验证JWT令牌"""
        try:
            verify_jwt_in_request()
            user_id = get_jwt_identity()  # 这是字符串形式的user_id
            claims = get_jwt()  # 获取额外的claims
            
            # 构建完整的身份信息
            identity = {
                'user_id': int(user_id),  # 转换回整数
                'username': claims.get('username')
            }
            return identity
        except Exception as e:
            logger.warning(f"验证JWT令牌失败: {str(e)}")
            return None
    
    @staticmethod
    def get_token_from_header():
        """从请求头获取令牌"""
        auth_header = request.headers.get('Authorization')
        if auth_header:
            try:
                # 格式: "Bearer <token>"
                token = auth_header.split(' ')[1]
                return token
            except IndexError:
                return None
        return None


def token_required(f):
    """JWT令牌验证装饰器"""
    @wraps(f)
    def decorated(*args, **kwargs):
        try:
            # 处理OPTIONS预检请求，直接返回200
            if request.method == 'OPTIONS':
                return '', 200
            
            # 获取请求头中的Authorization
            auth_header = request.headers.get('Authorization')
            if not auth_header:
                logger.warning('请求缺少Authorization头')
                return jsonify({
                    'success': False,
                    'message': '缺少认证令牌'
                }), 401
                
            # 检查令牌格式
            try:
                token_type, token = auth_header.split(' ')
                if token_type.lower() != 'bearer':
                    logger.warning(f'无效的令牌类型: {token_type}')
                    return jsonify({
                        'success': False,
                        'message': '无效的令牌类型'
                    }), 401
            except ValueError:
                logger.warning('无效的Authorization头格式')
                return jsonify({
                    'success': False,
                    'message': '无效的认证头格式'
                }), 401
            
            # 验证JWT令牌
            verify_jwt_in_request()
            user_id = get_jwt_identity()  # 这是字符串形式的user_id
            claims = get_jwt()  # 获取额外的claims
            
            # 构建完整的身份信息
            identity = {
                'user_id': int(user_id),  # 转换回整数
                'username': claims.get('username')
            }
            
            if not identity or not identity.get('user_id'):
                logger.warning('JWT令牌验证失败: 无效的身份信息')
                return jsonify({
                    'success': False,
                    'message': '无效的令牌'
                }), 401
            
            # 将用户信息添加到请求上下文
            request.current_user = identity
            logger.debug(f'JWT令牌验证成功: 用户ID {identity.get("user_id")}')
            
            return f(*args, **kwargs)
            
        except Exception as e:
            logger.error(f'JWT令牌验证异常: {str(e)}')
            return jsonify({
                'success': False,
                'message': '缺少或无效的认证令牌'
            }), 401
    
    return decorated


def optional_token(f):
    """可选的JWT令牌验证装饰器"""
    @wraps(f)
    def decorated(*args, **kwargs):
        try:
            verify_jwt_in_request(optional=True)
            user_id = get_jwt_identity()  # 这是字符串形式的user_id
            if user_id:
                claims = get_jwt()  # 获取额外的claims
                # 构建完整的身份信息
                identity = {
                    'user_id': int(user_id),  # 转换回整数
                    'username': claims.get('username')
                }
                request.current_user = identity
            else:
                request.current_user = None
        except Exception:
            request.current_user = None
        
        return f(*args, **kwargs)
    
    return decorated


def validate_user_input(data, required_fields):
    """验证用户输入数据"""
    errors = []
    
    # 检查必填字段
    for field in required_fields:
        if field not in data or not data[field]:
            errors.append(f'{field} 是必填字段')
    
    # 验证用户名
    if 'username' in data:
        username = data['username'].strip()
        if len(username) < 3:
            errors.append('用户名至少需要3个字符')
        elif len(username) > 20:
            errors.append('用户名不能超过20个字符')
        elif not username.replace('_', '').replace('-', '').isalnum():
            errors.append('用户名只能包含字母、数字、下划线和连字符')
    
    # 验证邮箱
    if 'email' in data:
        email = data['email'].strip()
        if '@' not in email or '.' not in email.split('@')[-1]:
            errors.append('请输入有效的邮箱地址')
    
    # 验证密码
    if 'password' in data:
        password = data['password']
        if len(password) < 6:
            errors.append('密码至少需要6个字符')
        elif len(password) > 50:
            errors.append('密码不能超过50个字符')
    
    return errors


def create_response(success=True, message='', data=None, status_code=200):
    """创建统一的响应格式"""
    response = {
        'success': success,
        'message': message
    }
    
    if data is not None:
        response['data'] = data
    
    return jsonify(response), status_code