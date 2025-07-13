#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
API测试脚本
用于快速验证股票数据API的基本功能
"""

import requests
import json
import time
from typing import Dict, Any

class APITester:
    """API测试类"""
    
    def __init__(self, base_url: str = "http://localhost:5000"):
        self.base_url = base_url
        self.session = requests.Session()
        self.test_results = []
    
    def test_request(self, method: str, endpoint: str, data: Dict = None, 
                    params: Dict = None, expected_status: int = 200) -> Dict[str, Any]:
        """执行API测试请求"""
        url = f"{self.base_url}{endpoint}"
        
        try:
            if method.upper() == 'GET':
                response = self.session.get(url, params=params)
            elif method.upper() == 'POST':
                response = self.session.post(url, json=data, params=params)
            elif method.upper() == 'DELETE':
                response = self.session.delete(url, params=params)
            else:
                raise ValueError(f"不支持的HTTP方法: {method}")
            
            # 解析响应
            try:
                response_data = response.json()
            except:
                response_data = {"raw_response": response.text}
            
            # 记录测试结果
            result = {
                "method": method.upper(),
                "endpoint": endpoint,
                "status_code": response.status_code,
                "expected_status": expected_status,
                "success": response.status_code == expected_status,
                "response_data": response_data,
                "request_data": data,
                "request_params": params
            }
            
            self.test_results.append(result)
            return result
            
        except Exception as e:
            result = {
                "method": method.upper(),
                "endpoint": endpoint,
                "status_code": 0,
                "expected_status": expected_status,
                "success": False,
                "error": str(e),
                "request_data": data,
                "request_params": params
            }
            self.test_results.append(result)
            return result
    
    def print_result(self, result: Dict[str, Any]):
        """打印测试结果"""
        status_icon = "✅" if result['success'] else "❌"
        print(f"{status_icon} {result['method']} {result['endpoint']}")
        print(f"   状态码: {result['status_code']} (期望: {result['expected_status']})")
        
        if not result['success']:
            if 'error' in result:
                print(f"   错误: {result['error']}")
            elif 'response_data' in result:
                print(f"   响应: {json.dumps(result['response_data'], ensure_ascii=False, indent=2)}")
        else:
            if 'response_data' in result and isinstance(result['response_data'], dict):
                if 'success' in result['response_data']:
                    print(f"   API成功: {result['response_data']['success']}")
                if 'data' in result['response_data']:
                    data = result['response_data']['data']
                    if isinstance(data, list):
                        print(f"   数据条数: {len(data)}")
                    elif isinstance(data, dict):
                        print(f"   数据字段: {list(data.keys())}")
        print()
    
    def run_basic_tests(self):
        """运行基础API测试"""
        print("🚀 开始API基础功能测试...\n")
        
        # 1. 健康检查
        print("1. 健康检查测试")
        result = self.test_request('GET', '/api/health')
        self.print_result(result)
        
        # 2. 股票搜索测试
        print("2. 股票搜索测试")
        result = self.test_request('GET', '/api/stocks/search', params={'keyword': '中国平安'})
        self.print_result(result)
        
        # 3. 股票详情测试（使用中国平安的代码）
        print("3. 股票详情测试")
        result = self.test_request('GET', '/api/stocks/601318')
        self.print_result(result)
        
        # 4. 历史数据测试
        print("4. 股票历史数据测试")
        result = self.test_request('GET', '/api/stocks/601318/history', params={'period': '1m'})
        self.print_result(result)
        
        # 5. 批量查询测试
        print("5. 批量查询测试")
        result = self.test_request('POST', '/api/stocks/batch', 
                                 data={'codes': ['601318', '000001', '600036']})
        self.print_result(result)
        
        # 6. 获取关注列表（初始为空）
        print("6. 获取关注列表测试")
        result = self.test_request('GET', '/api/watchlist')
        self.print_result(result)
        
        # 7. 添加到关注列表
        print("7. 添加到关注列表测试")
        result = self.test_request('POST', '/api/watchlist', 
                                 data={'code': '601318', 'industry': '保险'})
        self.print_result(result)
        
        # 8. 再次获取关注列表（应该有数据）
        print("8. 再次获取关注列表测试")
        result = self.test_request('GET', '/api/watchlist')
        self.print_result(result)
        
        # 9. 市场概览测试
        print("9. 市场概览测试")
        result = self.test_request('GET', '/api/market/overview')
        self.print_result(result)
        
        # 10. 删除关注列表
        print("10. 删除关注列表测试")
        result = self.test_request('DELETE', '/api/watchlist/601318')
        self.print_result(result)
    
    def run_error_tests(self):
        """运行错误处理测试"""
        print("🔍 开始错误处理测试...\n")
        
        # 1. 搜索关键词为空
        print("1. 搜索关键词为空测试")
        result = self.test_request('GET', '/api/stocks/search', 
                                 params={'keyword': ''}, expected_status=400)
        self.print_result(result)
        
        # 2. 无效股票代码
        print("2. 无效股票代码测试")
        result = self.test_request('GET', '/api/stocks/abc123', expected_status=400)
        self.print_result(result)
        
        # 3. 不存在的股票
        print("3. 不存在的股票测试")
        result = self.test_request('GET', '/api/stocks/999999', expected_status=404)
        self.print_result(result)
        
        # 4. 无效时间周期
        print("4. 无效时间周期测试")
        result = self.test_request('GET', '/api/stocks/601318/history', 
                                 params={'period': '2y'}, expected_status=400)
        self.print_result(result)
        
        # 5. 批量查询格式错误
        print("5. 批量查询格式错误测试")
        result = self.test_request('POST', '/api/stocks/batch', 
                                 data={'stock_codes': ['601318']}, expected_status=400)
        self.print_result(result)
        
        # 6. 添加不存在的股票到关注列表
        print("6. 添加不存在股票到关注列表测试")
        result = self.test_request('POST', '/api/watchlist', 
                                 data={'code': '999999'}, expected_status=404)
        self.print_result(result)
        
        # 7. 删除不在关注列表的股票
        print("7. 删除不在关注列表的股票测试")
        result = self.test_request('DELETE', '/api/watchlist/999999', expected_status=404)
        self.print_result(result)
        
        # 8. 访问不存在的API
        print("8. 访问不存在的API测试")
        result = self.test_request('GET', '/api/nonexistent', expected_status=404)
        self.print_result(result)
    
    def run_performance_tests(self):
        """运行性能测试"""
        print("⚡ 开始性能测试...\n")
        
        # 缓存测试
        print("1. 缓存性能测试")
        
        # 第一次请求（无缓存）
        start_time = time.time()
        result1 = self.test_request('GET', '/api/stocks/601318')
        time1 = time.time() - start_time
        
        # 第二次请求（有缓存）
        start_time = time.time()
        result2 = self.test_request('GET', '/api/stocks/601318')
        time2 = time.time() - start_time
        
        print(f"   第一次请求时间: {time1:.3f}秒")
        print(f"   第二次请求时间: {time2:.3f}秒")
        print(f"   性能提升: {((time1 - time2) / time1 * 100):.1f}%")
        print()
    
    def generate_report(self):
        """生成测试报告"""
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        print("📊 测试报告")
        print("=" * 50)
        print(f"总测试数: {total_tests}")
        print(f"通过测试: {passed_tests} ✅")
        print(f"失败测试: {failed_tests} ❌")
        print(f"通过率: {(passed_tests / total_tests * 100):.1f}%")
        
        if failed_tests > 0:
            print("\n失败的测试:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['method']} {result['endpoint']} (状态码: {result['status_code']})")
        
        print("=" * 50)

def main():
    """主函数"""
    print("🧪 股票数据API测试工具")
    print("=" * 50)
    
    # 检查服务是否运行
    try:
        response = requests.get("http://localhost:5000/api/health", timeout=5)
        if response.status_code == 200:
            print("✅ API服务运行正常\n")
        else:
            print("❌ API服务响应异常\n")
    except:
        print("❌ 无法连接到API服务，请确保后端服务已启动 (python run.py)\n")
        return
    
    # 创建测试器
    tester = APITester()
    
    try:
        # 运行测试
        tester.run_basic_tests()
        tester.run_error_tests()
        tester.run_performance_tests()
        
        # 生成报告
        tester.generate_report()
        
    except KeyboardInterrupt:
        print("\n测试被用户中断")
    except Exception as e:
        print(f"\n测试过程中发生错误: {str(e)}")

if __name__ == '__main__':
    main()