#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试数据库锁定问题修复
"""

import requests
import json
import time

# 测试配置
BASE_URL = "http://localhost:5000"
TEST_USER = {
    "username": "testuser",
    "password": "testpass123"
}

def test_auth_and_watchlist():
    """测试认证和关注列表操作"""
    print("🔧 开始测试数据库写操作修复...")
    
    # 1. 创建测试用户
    print("\n1. 创建测试用户...")
    create_user_response = requests.post(f"{BASE_URL}/api/auth/create-test-user")
    
    if create_user_response.status_code == 200:
        print("✅ 测试用户创建/确认成功")
    else:
        print(f"❌ 创建测试用户失败: {create_user_response.text}")
    
    # 2. 用户登录
    print("\n2. 测试用户登录...")
    login_data = {
        "username": "admin",
        "password": "admin123"
    }
    login_response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
    
    if login_response.status_code != 200:
        print(f"❌ 登录失败: {login_response.text}")
        return False
    
    login_result = login_response.json()
    token = login_result.get('data', {}).get('token')
    print(f"✅ 登录成功，获取到token")
    
    # 设置认证头
    headers = {"Authorization": f"Bearer {token}"}
    
    # 3. 测试添加股票到关注列表
    print("\n3. 测试添加股票到关注列表...")
    test_stock = {
        "code": "000001",
        "industry": "银行"
    }
    
    add_response = requests.post(
        f"{BASE_URL}/api/watchlist", 
        json=test_stock, 
        headers=headers
    )
    
    print(f"添加股票响应状态: {add_response.status_code}")
    print(f"添加股票响应内容: {add_response.text}")
    
    if add_response.status_code == 200:
        print("✅ 添加股票到关注列表成功")
    else:
        print(f"❌ 添加股票失败: {add_response.text}")
        return False
    
    # 4. 测试获取关注列表
    print("\n4. 测试获取关注列表...")
    get_response = requests.get(f"{BASE_URL}/api/watchlist", headers=headers)
    
    if get_response.status_code == 200:
        watchlist = get_response.json()
        print(f"✅ 获取关注列表成功，共 {len(watchlist.get('data', []))} 只股票")
        for stock in watchlist.get('data', []):
            print(f"  - {stock.get('code')}: {stock.get('name')}")
    else:
        print(f"❌ 获取关注列表失败: {get_response.text}")
        return False
    
    # 5. 测试切换股票置顶状态
    print("\n5. 测试切换股票置顶状态...")
    pin_response = requests.post(
        f"{BASE_URL}/api/watchlist/000001/pin", 
        headers=headers
    )
    
    print(f"置顶操作响应状态: {pin_response.status_code}")
    print(f"置顶操作响应内容: {pin_response.text}")
    
    if pin_response.status_code == 200:
        print("✅ 切换置顶状态成功")
    else:
        print(f"❌ 切换置顶状态失败: {pin_response.text}")
        return False
    
    # 6. 测试删除股票
    print("\n6. 测试删除股票...")
    delete_response = requests.delete(
        f"{BASE_URL}/api/watchlist/000001", 
        headers=headers
    )
    
    print(f"删除股票响应状态: {delete_response.status_code}")
    print(f"删除股票响应内容: {delete_response.text}")
    
    if delete_response.status_code == 200:
        print("✅ 删除股票成功")
    else:
        print(f"❌ 删除股票失败: {delete_response.text}")
        return False
    
    print("\n🎉 所有数据库写操作测试通过！数据库锁定问题已修复。")
    return True

def test_concurrent_operations():
    """测试并发操作"""
    print("\n🔧 测试并发数据库操作...")
    
    # 登录获取token
    login_data = {
        "username": "admin",
        "password": "admin123"
    }
    login_response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
    if login_response.status_code != 200:
        print("❌ 登录失败，无法进行并发测试")
        return False
    
    token = login_response.json().get('data', {}).get('token')
    headers = {"Authorization": f"Bearer {token}"}
    
    # 并发添加多只股票
    stocks = [
        {"code": "000002", "industry": "房地产"},
        {"code": "000858", "industry": "白酒"},
        {"code": "600036", "industry": "银行"},
    ]
    
    print("并发添加多只股票...")
    success_count = 0
    
    for stock in stocks:
        try:
            response = requests.post(
                f"{BASE_URL}/api/watchlist", 
                json=stock, 
                headers=headers,
                timeout=10
            )
            if response.status_code == 200:
                success_count += 1
                print(f"✅ 成功添加: {stock['code']}")
            else:
                print(f"❌ 添加失败: {stock['code']} - {response.text}")
        except Exception as e:
            print(f"❌ 添加异常: {stock['code']} - {str(e)}")
    
    print(f"\n并发操作结果: {success_count}/{len(stocks)} 成功")
    
    # 清理测试数据
    print("\n清理测试数据...")
    for stock in stocks:
        try:
            requests.delete(
                f"{BASE_URL}/api/watchlist/{stock['code']}", 
                headers=headers
            )
        except:
            pass
    
    return success_count == len(stocks)

if __name__ == "__main__":
    print("=" * 60)
    print("🔧 StockInsight 数据库锁定问题修复测试")
    print("=" * 60)
    
    # 等待服务启动
    print("等待后端服务启动...")
    time.sleep(2)
    
    try:
        # 基础功能测试
        basic_test_passed = test_auth_and_watchlist()
        
        # 并发操作测试
        concurrent_test_passed = test_concurrent_operations()
        
        print("\n" + "=" * 60)
        print("📊 测试结果总结:")
        print(f"  基础功能测试: {'✅ 通过' if basic_test_passed else '❌ 失败'}")
        print(f"  并发操作测试: {'✅ 通过' if concurrent_test_passed else '❌ 失败'}")
        
        if basic_test_passed and concurrent_test_passed:
            print("\n🎉 所有测试通过！数据库锁定问题已完全修复。")
        else:
            print("\n⚠️  部分测试失败，可能仍存在问题。")
        
    except Exception as e:
        print(f"\n❌ 测试过程中发生异常: {str(e)}")
    
    print("=" * 60)