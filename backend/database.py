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
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row  # 使结果可以通过列名访问
            return conn
        except Exception as e:
            logger.error(f"数据库连接失败: {str(e)}")
            raise
    
    def init_database(self):
        """初始化数据库表结构"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            # 创建关注列表表
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS watchlist (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    stock_code TEXT NOT NULL UNIQUE,
                    stock_name TEXT NOT NULL,
                    industry TEXT DEFAULT '',
                    added_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # 创建索引
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_watchlist_code 
                ON watchlist(stock_code)
            ''')
            
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_watchlist_added_time 
                ON watchlist(added_time)
            ''')
            
            # 创建用户表（为将来扩展准备）
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    email TEXT UNIQUE,
                    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_login TIMESTAMP,
                    is_active BOOLEAN DEFAULT 1
                )
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
    
    def add_to_watchlist(self, stock_code, stock_name, industry=''):
        """添加股票到关注列表"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO watchlist (stock_code, stock_name, industry)
                VALUES (?, ?, ?)
            ''', (stock_code, stock_name, industry))
            
            conn.commit()
            conn.close()
            
            logger.info(f"股票 {stock_code} 添加到关注列表成功")
            return True
            
        except sqlite3.IntegrityError:
            logger.warning(f"股票 {stock_code} 已在关注列表中")
            raise ValueError("股票已在关注列表中")
        except Exception as e:
            logger.error(f"添加股票到关注列表失败: {str(e)}")
            raise
    
    def remove_from_watchlist(self, stock_code):
        """从关注列表删除股票"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('DELETE FROM watchlist WHERE stock_code = ?', (stock_code,))
            
            if cursor.rowcount == 0:
                conn.close()
                raise ValueError("股票不在关注列表中")
            
            conn.commit()
            conn.close()
            
            logger.info(f"股票 {stock_code} 从关注列表删除成功")
            return True
            
        except ValueError:
            raise
        except Exception as e:
            logger.error(f"从关注列表删除股票失败: {str(e)}")
            raise
    
    def get_watchlist(self):
        """获取关注列表"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT stock_code, stock_name, industry, added_time, updated_time
                FROM watchlist 
                ORDER BY added_time DESC
            ''')
            
            watchlist = []
            for row in cursor.fetchall():
                watchlist.append({
                    'code': row['stock_code'],
                    'name': row['stock_name'],
                    'industry': row['industry'],
                    'added_time': row['added_time'],
                    'updated_time': row['updated_time']
                })
            
            conn.close()
            return watchlist
            
        except Exception as e:
            logger.error(f"获取关注列表失败: {str(e)}")
            raise
    
    def is_in_watchlist(self, stock_code):
        """检查股票是否在关注列表中"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute(
                'SELECT COUNT(*) as count FROM watchlist WHERE stock_code = ?', 
                (stock_code,)
            )
            
            result = cursor.fetchone()
            conn.close()
            
            return result['count'] > 0
            
        except Exception as e:
            logger.error(f"检查关注列表失败: {str(e)}")
            return False
    
    def update_watchlist_item(self, stock_code, stock_name=None, industry=None):
        """更新关注列表中的股票信息"""
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
                conn.close()
                return False
            
            conn.commit()
            conn.close()
            
            logger.info(f"股票 {stock_code} 信息更新成功")
            return True
            
        except Exception as e:
            logger.error(f"更新关注列表项失败: {str(e)}")
            raise
    
    def log_api_call(self, endpoint, method, ip_address=None, user_agent=None, 
                     response_code=None, response_time_ms=None, error_message=None):
        """记录API调用日志"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO api_logs 
                (endpoint, method, ip_address, user_agent, response_code, response_time_ms, error_message)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (endpoint, method, ip_address, user_agent, response_code, response_time_ms, error_message))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            logger.error(f"记录API日志失败: {str(e)}")
            # 不抛出异常，避免影响主要功能
    
    def get_api_stats(self, hours=24):
        """获取API调用统计"""
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
            
            conn.close()
            return stats
            
        except Exception as e:
            logger.error(f"获取API统计失败: {str(e)}")
            return []
    
    def cleanup_old_logs(self, days=30):
        """清理旧的API日志"""
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
            conn.close()
            
            logger.info(f"清理了 {deleted_count} 条旧日志记录")
            return deleted_count
            
        except Exception as e:
            logger.error(f"清理旧日志失败: {str(e)}")
            return 0

# 创建全局数据库管理器实例
db_manager = DatabaseManager()