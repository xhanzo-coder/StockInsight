#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
清理测试数据脚本
"""

import requests
import time

BASE_URL = "http://localhost:5000"

def cleanup_test_data():
    """清理测试数据"""
    print("🧹 开始清理测试数据...")
    
    # 登录获取token
    login_data = {
        "username": "admin",
        "password": "admin123"
    }
    login_response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
    if login_response.status_code != 200:
        print("❌ 登录失败，无法清理数据")
        return False
    
    token = login_response.json().get('data', {}).get('token')
    headers = {"Authorization": f"Bearer {token}"}
    
    # 获取当前关注列表
    get_response = requests.get(f"{BASE_URL}/api/watchlist", headers=headers)
    if get_response.status_code == 200:
        watchlist = get_response.json().get('data', [])
        print(f"📋 当前关注列表有 {len(watchlist)} 只股票")
        
        # 删除所有股票
        for stock in watchlist:
            stock_code = stock.get('code')
            if stock_code:
                try:
                    delete_response = requests.delete(
                        f"{BASE_URL}/api/watchlist/{stock_code}", 
                        headers=headers
                    )
                    if delete_response.status_code == 200:
                        print(f"✅ 删除股票: {stock_code}")
                    else:
                        print(f"❌ 删除失败: {stock_code} - {delete_response.text}")
                except Exception as e:
                    print(f"❌ 删除异常: {stock_code} - {str(e)}")
    
    print("🧹 测试数据清理完成")
    return True

if __name__ == "__main__":
    cleanup_test_data()