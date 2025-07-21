# -*- coding: utf-8 -*-
"""
数据库操作模块
负责SQLite数据库的初始化、连接和基本操作
"""

import sqlite3
import logging
from datetime import datetime
from config import get_config

# 获取配置
config = get_config()
logger = logging.getLogger(__name__)

class DatabaseManager:
    """数据库管理器"""
    
    def __init__(self, db_path=None):
        """初始化数据库管理器"""
        self.db_path = db_path or config.DATABASE_PATH
        self.init_database()
    
    def get_connection(self):
        """获取数据库连接"""
        try:
            # 设置连接超时和WAL模式以避免锁定问题
            conn = sqlite3.connect(
                self.db_path, 
                timeout=30.0,  # 30秒超时
                check_same_thread=False  # 允许多线程访问
            )
            conn.row_factory = sqlite3.Row  # 使结果可以通过列名访问
            
            # 启用WAL模式以提高并发性能
            conn.execute('PRAGMA journal_mode=WAL')
            # 设置忙等待超时
            conn.execute('PRAGMA busy_timeout=30000')  # 30秒
            # 启用外键约束
            conn.execute('PRAGMA foreign_keys=ON')
            
            return conn
        except Exception as e:
            logger.error(f"数据库连接失败: {str(e)}")
            raise
    
    def init_database(self):
        """初始化数据库表结构"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            # 创建用户表
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    email TEXT UNIQUE,
                    password_hash TEXT NOT NULL,
                    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_login TIMESTAMP,
                    is_active BOOLEAN DEFAULT 1
                )
            ''')
            
            # 检查并添加password_hash字段（为现有数据库升级）
            try:
                cursor.execute('ALTER TABLE users ADD COLUMN password_hash TEXT')
                logger.info("添加password_hash字段成功")
            except sqlite3.OperationalError:
                # 字段已存在，忽略错误
                pass
            
            # 创建关注列表表（支持多用户）
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS watchlist (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    stock_code TEXT NOT NULL,
                    stock_name TEXT NOT NULL,
                    industry TEXT DEFAULT '',
                    is_pinned BOOLEAN DEFAULT 0,
                    added_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                    UNIQUE(user_id, stock_code)
                )
            ''')
            
            # 检查并添加user_id字段（为现有数据库升级）
            try:
                cursor.execute('ALTER TABLE watchlist ADD COLUMN user_id INTEGER DEFAULT 1')
                logger.info("添加user_id字段成功")
            except sqlite3.OperationalError:
                # 字段已存在，忽略错误
                pass
            
            # 检查并添加is_pinned字段（为现有数据库升级）
            try:
                cursor.execute('ALTER TABLE watchlist ADD COLUMN is_pinned BOOLEAN DEFAULT 0')
                logger.info("添加is_pinned字段成功")
            except sqlite3.OperationalError:
                # 字段已存在，忽略错误
                pass
            
            # 创建索引
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_users_username 
                ON users(username)
            ''')
            
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_users_email 
                ON users(email)
            ''')
            
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_watchlist_user_id 
                ON watchlist(user_id)
            ''')
            
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_watchlist_code 
                ON watchlist(stock_code)
            ''')
            
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_watchlist_user_code 
                ON watchlist(user_id, stock_code)
            ''')
            
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_watchlist_added_time 
                ON watchlist(added_time)
            ''')
            
            # 创建API调用日志表（用于监控和分析）
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS api_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    endpoint TEXT NOT NULL,
                    method TEXT NOT NULL,
                    ip_address TEXT,
                    user_agent TEXT,
                    request_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    response_code INTEGER,
                    response_time_ms INTEGER,
                    error_message TEXT
                )
            ''')
            
            conn.commit()
            conn.close()
            logger.info("数据库初始化完成")
            
        except Exception as e:
            logger.error(f"数据库初始化失败: {str(e)}")
            raise
    
    def add_to_watchlist(self, stock_code, stock_name, industry='', user_id=1):
        """添加股票到关注列表"""
        conn = None
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO watchlist (user_id, stock_code, stock_name, industry)
                VALUES (?, ?, ?, ?)
            ''', (user_id, stock_code, stock_name, industry))
            
            conn.commit()
            logger.info(f"用户 {user_id} 添加股票 {stock_code} 到关注列表成功")
            return True
            
        except sqlite3.IntegrityError:
            logger.warning(f"用户 {user_id} 的股票 {stock_code} 已在关注列表中")
            raise ValueError("股票已在关注列表中")
        except Exception as e:
            if conn:
                conn.rollback()
            logger.error(f"添加股票到关注列表失败: {str(e)}")
            raise
        finally:
            if conn:
                conn.close()
    
    def remove_from_watchlist(self, stock_code, user_id=1):
        """从关注列表删除股票"""
        conn = None
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('DELETE FROM watchlist WHERE stock_code = ? AND user_id = ?', (stock_code, user_id))
            
            if cursor.rowcount == 0:
                raise ValueError("股票不在关注列表中")
            
            conn.commit()
            logger.info(f"用户 {user_id} 从关注列表删除股票 {stock_code} 成功")
            return True
            
        except ValueError:
            raise
        except Exception as e:
            if conn:
                conn.rollback()
            logger.error(f"从关注列表删除股票失败: {str(e)}")
            raise
        finally:
            if conn:
                conn.close()
    
    def get_watchlist(self, user_id=1):
        """获取关注列表"""
        conn = None
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT stock_code, stock_name, industry, is_pinned, added_time, updated_time
                FROM watchlist 
                WHERE user_id = ?
                ORDER BY is_pinned DESC, added_time DESC
            ''', (user_id,))
            
            watchlist = []
            for row in cursor.fetchall():
                watchlist.append({
                    'code': row['stock_code'],
                    'name': row['stock_name'],
                    'industry': row['industry'],
                    'is_pinned': bool(row['is_pinned']) if row['is_pinned'] is not None else False,
                    'added_time': row['added_time'],
                    'updated_time': row['updated_time']
                })
            
            return watchlist
            
        except Exception as e:
            logger.error(f"获取关注列表失败: {str(e)}")
            raise
        finally:
            if conn:
                conn.close()
    
    def is_in_watchlist(self, stock_code, user_id=1):
        """检查股票是否在关注列表中"""
        conn = None
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('SELECT 1 FROM watchlist WHERE stock_code = ? AND user_id = ?', (stock_code, user_id))
            result = cursor.fetchone()
            
            return result is not None
            
        except Exception as e:
            logger.error(f"检查股票是否在关注列表失败: {str(e)}")
            raise
        finally:
            if conn:
                conn.close()
    
    def toggle_pin_stock(self, stock_code, user_id=1):
        """切换股票置顶状态"""
        conn = None
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            # 先获取当前置顶状态
            cursor.execute('SELECT is_pinned FROM watchlist WHERE stock_code = ? AND user_id = ?', (stock_code, user_id))
            result = cursor.fetchone()
            
            if not result:
                raise ValueError("股票不在关注列表中")
            
            current_pinned = bool(result['is_pinned']) if result['is_pinned'] is not None else False
            new_pinned = not current_pinned
            
            # 更新置顶状态
            cursor.execute('''
                UPDATE watchlist 
                SET is_pinned = ?, updated_time = CURRENT_TIMESTAMP 
                WHERE stock_code = ? AND user_id = ?
            ''', (new_pinned, stock_code, user_id))
            
            conn.commit()
            
            action = "置顶" if new_pinned else "取消置顶"
            logger.info(f"用户 {user_id} 股票 {stock_code} {action}成功")
            return new_pinned
            
        except ValueError:
            raise
        except Exception as e:
            if conn:
                conn.rollback()
            logger.error(f"切换股票置顶状态失败: {str(e)}")
            raise
        finally:
            if conn:
                conn.close()

    # ==================== 用户管理方法 ====================
    
    def create_user(self, username, email, password_hash):
        """创建新用户"""
        conn = None
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO users (username, email, password_hash)
                VALUES (?, ?, ?)
            ''', (username, email, password_hash))
            
            user_id = cursor.lastrowid
            conn.commit()
            
            logger.info(f"用户 {username} 创建成功，ID: {user_id}")
            return user_id
            
        except sqlite3.IntegrityError as e:
            if conn:
                conn.rollback()
            if 'username' in str(e):
                raise ValueError("用户名已存在")
            elif 'email' in str(e):
                raise ValueError("邮箱已存在")
            else:
                raise ValueError("用户信息冲突")
        except Exception as e:
            if conn:
                conn.rollback()
            logger.error(f"创建用户失败: {str(e)}")
            raise
        finally:
            if conn:
                conn.close()
    
    def get_user_by_username(self, username):
        """根据用户名获取用户信息"""
        conn = None
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT id, username, email, password_hash, created_time, last_login, is_active
                FROM users 
                WHERE username = ? AND is_active = 1
            ''', (username,))
            
            result = cursor.fetchone()
            
            if result:
                return {
                    'id': result['id'],
                    'username': result['username'],
                    'email': result['email'],
                    'password_hash': result['password_hash'],
                    'created_time': result['created_time'],
                    'last_login': result['last_login'],
                    'is_active': bool(result['is_active'])
                }
            return None
            
        except Exception as e:
            logger.error(f"获取用户信息失败: {str(e)}")
            raise
        finally:
            if conn:
                conn.close()
    
    def get_user_by_id(self, user_id):
        """根据用户ID获取用户信息"""
        conn = None
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT id, username, email, created_time, last_login, is_active
                FROM users 
                WHERE id = ? AND is_active = 1
            ''', (user_id,))
            
            result = cursor.fetchone()
            
            if result:
                return {
                    'id': result['id'],
                    'username': result['username'],
                    'email': result['email'],
                    'created_time': result['created_time'],
                    'last_login': result['last_login'],
                    'is_active': bool(result['is_active'])
                }
            return None
            
        except Exception as e:
            logger.error(f"获取用户信息失败: {str(e)}")
            raise
        finally:
            if conn:
                conn.close()
    
    def update_last_login(self, user_id):
        """更新用户最后登录时间"""
        conn = None
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                UPDATE users 
                SET last_login = CURRENT_TIMESTAMP 
                WHERE id = ?
            ''', (user_id,))
            
            conn.commit()
            
            logger.info(f"用户 {user_id} 最后登录时间更新成功")
            return True
            
        except Exception as e:
            if conn:
                conn.rollback()
            logger.error(f"更新最后登录时间失败: {str(e)}")
            return False
        finally:
            if conn:
                conn.close()
    
    def update_watchlist_item(self, stock_code, stock_name=None, industry=None):
        """更新关注列表项信息"""
        conn = None
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            # 构建更新语句
            update_fields = []
            params = []
            
            if stock_name is not None:
                update_fields.append('stock_name = ?')
                params.append(stock_name)
            
            if industry is not None:
                update_fields.append('industry = ?')
                params.append(industry)
            
            if not update_fields:
                return False
            
            update_fields.append('updated_time = CURRENT_TIMESTAMP')
            params.append(stock_code)
            
            sql = f'''
                UPDATE watchlist 
                SET {', '.join(update_fields)}
                WHERE stock_code = ?
            '''
            
            cursor.execute(sql, params)
            
            if cursor.rowcount == 0:
                return False
            
            conn.commit()
            
            logger.info(f"股票 {stock_code} 信息更新成功")
            return True
            
        except Exception as e:
            if conn:
                conn.rollback()
            logger.error(f"更新关注列表项失败: {str(e)}")
            raise
        finally:
            if conn:
                conn.close()
    
    def log_api_call(self, endpoint, method, ip_address=None, user_agent=None, 
                     response_code=None, response_time_ms=None, error_message=None):
        """记录API调用日志"""
        conn = None
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO api_logs 
                (endpoint, method, ip_address, user_agent, response_code, response_time_ms, error_message)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (endpoint, method, ip_address, user_agent, response_code, response_time_ms, error_message))
            
            conn.commit()
            
        except Exception as e:
            if conn:
                conn.rollback()
            logger.error(f"记录API日志失败: {str(e)}")
            # 不抛出异常，避免影响主要功能
        finally:
            if conn:
                conn.close()
    
    def get_api_stats(self, hours=24):
        """获取API调用统计"""
        conn = None
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            # 使用参数化查询，避免SQL注入
            cursor.execute('''
                SELECT 
                    endpoint,
                    COUNT(*) as call_count,
                    AVG(response_time_ms) as avg_response_time,
                    COUNT(CASE WHEN response_code >= 400 THEN 1 END) as error_count
                FROM api_logs 
                WHERE request_time >= datetime('now', '-' || ? || ' hours')
                GROUP BY endpoint
                ORDER BY call_count DESC
            ''', (hours,))
            
            stats = []
            for row in cursor.fetchall():
                call_count = row['call_count']
                error_count = row['error_count']
                success_rate = ((call_count - error_count) / call_count * 100) if call_count > 0 else 0
                
                stats.append({
                    'endpoint': row['endpoint'],
                    'call_count': call_count,
                    'avg_response_time': round(row['avg_response_time'] or 0, 2),
                    'error_count': error_count,
                    'success_rate': round(success_rate, 2)
                })
            
            return stats
            
        except Exception as e:
            logger.error(f"获取API统计失败: {str(e)}")
            return []
        finally:
            if conn:
                conn.close()
    
    def cleanup_old_logs(self, days=30):
        """清理旧的API日志"""
        conn = None
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            # 使用参数化查询，避免SQL注入
            cursor.execute('''
                DELETE FROM api_logs 
                WHERE request_time < datetime('now', '-' || ? || ' days')
            ''', (days,))
            
            deleted_count = cursor.rowcount
            conn.commit()
            
            logger.info(f"清理了 {deleted_count} 条旧日志记录")
            return deleted_count
            
        except Exception as e:
            if conn:
                conn.rollback()
            logger.error(f"清理旧日志失败: {str(e)}")
            return 0
        finally:
            if conn:
                conn.close()

# 创建全局数据库管理器实例
db_manager = DatabaseManager()