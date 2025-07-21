#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
简单的前端认证测试
"""

import requests
import json

def test_frontend_auth():
    """模拟前端的认证流程"""
    print("=== 模拟前端认证流程 ===")
    
    # 1. 登录获取token
    login_data = {
        'username': 'admin',
        'password': 'admin123'
    }
    
    print("1. 登录...")
    response = requests.post('http://localhost:5000/api/auth/login', json=login_data)
    print(f"登录状态: {response.status_code}")
    
    if response.status_code != 200:
        print("登录失败")
        return
    
    data = response.json()
    if not data.get('success'):
        print("登录API返回失败")
        return
    
    token = data.get('data', {}).get('token')
    if not token:
        print("没有获取到token")
        return
    
    print(f"获取到token: {token[:30]}...")
    
    # 2. 使用token访问关注列表
    print("\n2. 访问关注列表...")
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    print(f"请求头: {headers}")
    
    response = requests.get('http://localhost:5000/api/watchlist', headers=headers)
    print(f"关注列表状态: {response.status_code}")
    print(f"关注列表响应: {response.text[:500]}...")
    
    # 3. 测试无token访问
    print("\n3. 测试无token访问...")
    response = requests.get('http://localhost:5000/api/watchlist')
    print(f"无token状态: {response.status_code}")
    print(f"无token响应: {response.text[:200]}...")

if __name__ == "__main__":
    test_frontend_auth()