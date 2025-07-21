#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
数据库查看工具
用于查看和管理StockInsight数据库
"""

import sqlite3
import os
import sys
from datetime import datetime

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config import get_config

try:
    import bcrypt
    BCRYPT_AVAILABLE = True
except ImportError:
    BCRYPT_AVAILABLE = False
    print("警告: bcrypt 模块未安装，无法创建加密密码")

def get_db_path():
    """获取数据库路径"""
    config = get_config()
    return config.DATABASE_PATH

def view_database():
    """查看数据库内容"""
    db_path = get_db_path()
    
    if not os.path.exists(db_path):
        print(f"数据库文件不存在: {db_path}")
        return
    
    print(f"数据库路径: {db_path}")
    print("=" * 50)
    
    try:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # 查看所有表
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = cursor.fetchall()
        
        print("数据库表:")
        for table in tables:
            print(f"  - {table['name']}")
        
        print("\n" + "=" * 50)
        
        # 查看用户表
        print("用户表 (users):")
        cursor.execute("SELECT * FROM users")
        users = cursor.fetchall()
        
        if users:
            print(f"共有 {len(users)} 个用户:")
            for user in users:
                print(f"  ID: {user['id']}")
                print(f"  用户名: {user['username']}")
                print(f"  邮箱: {user['email']}")
                print(f"  创建时间: {user['created_time']}")
                print(f"  最后登录: {user['last_login']}")
                print(f"  是否激活: {user['is_active']}")
                print(f"  密码哈希: {user['password_hash'][:20]}..." if user['password_hash'] else "  密码哈希: None")
                print("  " + "-" * 30)
        else:
            print("  没有用户数据")
        
        print("\n" + "=" * 50)
        
        # 查看关注列表表
        print("关注列表表 (watchlist):")
        cursor.execute("SELECT * FROM watchlist")
        watchlist = cursor.fetchall()
        
        if watchlist:
            print(f"共有 {len(watchlist)} 条关注记录:")
            for item in watchlist:
                print(f"  ID: {item['id']}")
                print(f"  用户ID: {item['user_id']}")
                print(f"  股票代码: {item['stock_code']}")
                print(f"  股票名称: {item['stock_name']}")
                print(f"  行业: {item['industry']}")
                print(f"  是否置顶: {item['is_pinned']}")
                print(f"  添加时间: {item['added_time']}")
                print("  " + "-" * 30)
        else:
            print("  没有关注列表数据")
        
        conn.close()
        
    except Exception as e:
        print(f"查看数据库失败: {str(e)}")

def create_test_user():
    """创建测试用户"""
    if not BCRYPT_AVAILABLE:
        print("错误: bcrypt 模块未安装，无法创建用户")
        return
    
    db_path = get_db_path()
    
    try:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # 检查是否已存在测试用户
        cursor.execute("SELECT * FROM users WHERE username = ?", ("admin",))
        existing_user = cursor.fetchone()
        
        if existing_user:
            print("测试用户 'admin' 已存在")
            print(f"用户ID: {existing_user['id']}")
            print(f"邮箱: {existing_user['email']}")
            print("可以使用以下信息登录:")
            print("用户名: admin")
            print("密码: admin123")
            conn.close()
            return
        
        # 创建密码哈希
        password = "admin123"
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # 插入测试用户
        cursor.execute('''
            INSERT INTO users (username, email, password_hash, created_time, is_active)
            VALUES (?, ?, ?, ?, ?)
        ''', ("admin", "admin@stockinsight.com", password_hash, datetime.now().isoformat(), 1))
        
        user_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        print("测试用户创建成功!")
        print(f"用户ID: {user_id}")
        print("登录信息:")
        print("用户名: admin")
        print("邮箱: admin@stockinsight.com")
        print("密码: admin123")
        
    except Exception as e:
        print(f"创建测试用户失败: {str(e)}")

def reset_database():
    """重置数据库"""
    db_path = get_db_path()
    
    if os.path.exists(db_path):
        os.remove(db_path)
        print(f"数据库文件已删除: {db_path}")
    
    # 重新初始化数据库
    from database import DatabaseManager
    db_manager = DatabaseManager()
    print("数据库已重新初始化")

def main():
    """主函数"""
    if len(sys.argv) < 2:
        print("用法:")
        print("  python db_viewer.py view        - 查看数据库内容")
        print("  python db_viewer.py create_user - 创建测试用户")
        print("  python db_viewer.py reset       - 重置数据库")
        return
    
    command = sys.argv[1]
    
    if command == "view":
        view_database()
    elif command == "create_user":
        create_test_user()
    elif command == "reset":
        reset_database()
    else:
        print(f"未知命令: {command}")

if __name__ == "__main__":
    main()