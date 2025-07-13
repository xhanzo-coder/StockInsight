#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试增强后的关注列表接口
验证新增的财务指标字段
"""

import requests
import json
import time

class EnhancedWatchlistTester:
    def __init__(self, base_url="http://localhost:5000/api"):
        self.base_url = base_url
        self.session = requests.Session()
        self.test_results = []
    
    def log_test(self, test_name, success, message, data=None):
        """记录测试结果"""
        result = {
            'test': test_name,
            'success': success,
            'message': message,
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S')
        }
        if data:
            result['data'] = data
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        if data and not success:
            print(f"   详细信息: {json.dumps(data, ensure_ascii=False, indent=2)}")
    
    def test_health_check(self):
        """测试健康检查"""
        try:
            response = self.session.get(f"{self.base_url}/health")
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    self.log_test("健康检查", True, "API服务正常运行")
                    return True
            self.log_test("健康检查", False, f"健康检查失败: {response.status_code}")
            return False
        except Exception as e:
            self.log_test("健康检查", False, f"连接失败: {str(e)}")
            return False
    
    def test_add_stock_to_watchlist(self, stock_code, industry="测试行业"):
        """添加股票到关注列表"""
        try:
            payload = {
                "code": stock_code,
                "industry": industry
            }
            response = self.session.post(
                f"{self.base_url}/watchlist",
                json=payload,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    self.log_test(
                        f"添加股票{stock_code}", 
                        True, 
                        f"成功添加 {data['data']['name']} 到关注列表"
                    )
                    return True
            elif response.status_code == 409:
                # 股票已在关注列表中
                self.log_test(
                    f"添加股票{stock_code}", 
                    True, 
                    "股票已在关注列表中（预期行为）"
                )
                return True
            
            self.log_test(
                f"添加股票{stock_code}", 
                False, 
                f"添加失败: {response.status_code}",
                response.json() if response.content else None
            )
            return False
        except Exception as e:
            self.log_test(f"添加股票{stock_code}", False, f"请求异常: {str(e)}")
            return False
    
    def test_get_enhanced_watchlist(self):
        """测试增强后的关注列表接口"""
        try:
            response = self.session.get(f"{self.base_url}/watchlist")
            
            if response.status_code != 200:
                self.log_test(
                    "获取增强关注列表", 
                    False, 
                    f"请求失败: {response.status_code}",
                    response.json() if response.content else None
                )
                return False
            
            data = response.json()
            if not data.get('success'):
                self.log_test(
                    "获取增强关注列表", 
                    False, 
                    "API返回失败状态",
                    data
                )
                return False
            
            watchlist = data.get('data', [])
            if not watchlist:
                self.log_test(
                    "获取增强关注列表", 
                    True, 
                    "关注列表为空（正常情况）"
                )
                return True
            
            # 验证增强字段
            required_fields = [
                'code', 'name', 'industry', 'current_price', 
                'change_percent', 'change_amount', 'market_cap',
                'pe_ratio_ttm', 'roe', 'pb_ratio', 'dividend_payout_ratio',
                'correction_factor', 'corrected_pe', 'theoretical_price',
                'added_time', 'updated_time'
            ]
            
            missing_fields = []
            sample_stock = watchlist[0]
            
            for field in required_fields:
                if field not in sample_stock:
                    missing_fields.append(field)
            
            if missing_fields:
                self.log_test(
                    "验证增强字段", 
                    False, 
                    f"缺少字段: {missing_fields}",
                    sample_stock
                )
                return False
            
            # 验证数据类型和格式
            validation_errors = []
            
            # 验证市值格式
            market_cap = sample_stock.get('market_cap')
            if market_cap and not (isinstance(market_cap, str) and '亿' in market_cap):
                validation_errors.append(f"市值格式错误: {market_cap}")
            
            # 验证数值字段
            numeric_fields = ['pe_ratio_ttm', 'roe', 'pb_ratio', 'dividend_payout_ratio', 
                            'correction_factor', 'corrected_pe', 'theoretical_price']
            for field in numeric_fields:
                value = sample_stock.get(field)
                if value is not None and not isinstance(value, (int, float)):
                    validation_errors.append(f"{field}应为数值类型: {value}")
            
            if validation_errors:
                self.log_test(
                    "验证数据格式", 
                    False, 
                    f"数据格式错误: {validation_errors}",
                    sample_stock
                )
                return False
            
            self.log_test(
                "获取增强关注列表", 
                True, 
                f"成功获取 {len(watchlist)} 只股票，所有增强字段完整"
            )
            
            # 打印示例数据
            print("\n📊 增强关注列表示例数据:")
            print(json.dumps(sample_stock, ensure_ascii=False, indent=2))
            
            return True
            
        except Exception as e:
            self.log_test("获取增强关注列表", False, f"请求异常: {str(e)}")
            return False
    
    def run_all_tests(self):
        """运行所有测试"""
        print("🧪 开始测试增强后的关注列表接口...\n")
        
        # 1. 健康检查
        if not self.test_health_check():
            print("❌ 服务不可用，停止测试")
            return
        
        # 2. 添加测试股票到关注列表
        test_stocks = [
            ('600036', '银行'),
            ('601318', '保险'),
            ('000001', '银行')
        ]
        
        for stock_code, industry in test_stocks:
            self.test_add_stock_to_watchlist(stock_code, industry)
            time.sleep(0.5)  # 避免请求过快
        
        # 3. 测试增强后的关注列表
        time.sleep(1)  # 等待数据处理
        self.test_get_enhanced_watchlist()
        
        # 4. 生成测试报告
        self.generate_report()
    
    def generate_report(self):
        """生成测试报告"""
        print("\n" + "="*60)
        print("📋 测试报告")
        print("="*60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"总测试数: {total_tests}")
        print(f"通过: {passed_tests}")
        print(f"失败: {failed_tests}")
        print(f"通过率: {passed_tests/total_tests*100:.1f}%")
        
        if failed_tests > 0:
            print("\n❌ 失败的测试:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['message']}")
        
        print("\n✅ 测试完成！")
        
        if failed_tests == 0:
            print("🎉 所有测试通过！增强后的关注列表接口工作正常。")
            print("\n📝 新增字段说明:")
            print("  - market_cap: 总市值（格式如'1224亿'）")
            print("  - pe_ratio_ttm: TTM市盈率（基于过去12个月数据）")
            print("  - roe: 净资产收益率")
            print("  - pb_ratio: 市净率")
            print("  - dividend_payout_ratio: 股利支付率")
            print("  - correction_factor: 修正系数")
            print("  - corrected_pe: 修正市盈率")
            print("  - theoretical_price: 理论股价")

if __name__ == "__main__":
    tester = EnhancedWatchlistTester()
    tester.run_all_tests()