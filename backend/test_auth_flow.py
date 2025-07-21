#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试认证和关注列表API
"""

import requests
import json

BASE_URL = 'http://localhost:5000/api'

def test_login():
    """测试登录"""
    print("=== 测试登录 ===")
    
    login_data = {
        'username': 'admin',
        'password': 'admin123'
    }
    
    try:
        response = requests.post(f'{BASE_URL}/auth/login', json=login_data)
        print(f"登录响应状态: {response.status_code}")
        print(f"登录响应内容: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success') and data.get('data', {}).get('token'):
                token = data['data']['token']
                print(f"登录成功，获得token: {token[:50]}...")
                return token
            else:
                print("登录失败：响应中没有token")
                return None
        else:
            print(f"登录失败：HTTP {response.status_code}")
            return None
            
    except Exception as e:
        print(f"登录异常: {e}")
        return None

def test_watchlist(token):
    """测试关注列表"""
    print("\n=== 测试关注列表 ===")
    
    headers = {}
    if token:
        headers['Authorization'] = f'Bearer {token}'
        print(f"使用Authorization头: Bearer {token[:20]}...")
    else:
        print("没有token，测试无认证访问")
    
    try:
        response = requests.get(f'{BASE_URL}/watchlist', headers=headers)
        print(f"关注列表响应状态: {response.status_code}")
        print(f"关注列表响应内容: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                watchlist = data.get('data', [])
                print(f"获取关注列表成功，数量: {len(watchlist)}")
                for item in watchlist[:3]:  # 只显示前3个
                    print(f"  - {item.get('code')} {item.get('name')}")
            else:
                print("关注列表API返回失败")
        else:
            print(f"关注列表失败：HTTP {response.status_code}")
            
    except Exception as e:
        print(f"关注列表异常: {e}")

def test_health():
    """测试健康检查"""
    print("=== 测试健康检查 ===")
    
    try:
        response = requests.get(f'{BASE_URL}/health')
        print(f"健康检查响应状态: {response.status_code}")
        print(f"健康检查响应内容: {response.text}")
    except Exception as e:
        print(f"健康检查异常: {e}")

if __name__ == "__main__":
    print("开始测试认证和API...")
    
    # 测试健康检查
    test_health()
    
    # 测试登录
    token = test_login()
    
    # 测试关注列表（有token）
    test_watchlist(token)
    
    # 测试关注列表（无token）
    test_watchlist(None)
    
    print("\n测试完成！")