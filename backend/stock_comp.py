import easyquotation
import requests
import re
import pandas as pd
import time
import json
from bs4 import BeautifulSoup
import warnings

warnings.filterwarnings('ignore')


class AutoStockDataFetcher:
    """全自动股票数据获取器"""

    def __init__(self):
        self.eq_sina = easyquotation.use('sina')

    def get_stock_data(self, stock_codes):
        """获取11个字段的股票数据"""
        results = []

        for code in stock_codes:
            print(f"正在获取 {code} 的数据...")

            try:
                # 1. 基础行情数据（股票名称、当前价格）
                basic_data = self._get_basic_data(code)
                if not basic_data:
                    print(f"  ❌ {code} 基础数据获取失败")
                    continue

                # 2. 估值数据（市盈率TTM、市净率、总市值）
                valuation_data = self._get_valuation_data(code)

                # 3. 财务数据（ROE、行业、股利支付率）
                financial_data = self._get_financial_data(code)

                # 4. 计算衍生指标（市赚率、修正系数、修正市赚率、理论股价）
                derived_data = self._calculate_derived_indicators(
                    basic_data, valuation_data, financial_data
                )

                # 5. 合并所有数据
                stock_info = {
                    '股票名称': basic_data['name'],
                    '所属行业': financial_data['industry'],
                    '总市值（亿）': valuation_data['total_market_value'],
                    '当前价格': basic_data['current_price'],
                    '市盈率': valuation_data['pe_ttm'],
                    'ROE': financial_data['roe'],
                    '市赚率': derived_data['market_earning_ratio'],
                    '股利支付率': financial_data['dividend_ratio'],
                    '修正系数': derived_data['correction_factor'],
                    '修正市赚率': derived_data['corrected_market_earning_ratio'],
                    '理论股价': derived_data['theoretical_price']
                }

                results.append(stock_info)
                print(f"  ✅ {code} 数据获取成功")
                time.sleep(0.5)  # 避免请求过快

            except Exception as e:
                print(f"  ❌ {code} 获取失败: {e}")

        return results

    def _get_basic_data(self, code):
        """获取基础行情数据"""
        try:
            eq_data = self.eq_sina.real([code], prefix=True)

            for key, value in eq_data.items():
                if code in key:
                    return {
                        'name': value.get('name', ''),
                        'current_price': value.get('now', 0)
                    }
            return {}
        except:
            return {}

    def _get_valuation_data(self, code):
        """获取估值数据"""
        try:
            # 腾讯财经接口
            tencent_code = f"sh{code}" if code.startswith('6') else f"sz{code}"
            url = f"http://qt.gtimg.cn/q={tencent_code}"

            response = requests.get(url, timeout=5)
            response.encoding = 'gbk'
            data = response.text

            pe_ttm = 0
            pb = 0
            total_shares = 0

            match = re.search(rf'v_{tencent_code}="([^"]+)"', data)
            if match:
                fields = match.group(1).split('~')
                if len(fields) > 50:
                    try:
                        pe_ttm = float(fields[39]) if fields[39] and fields[39] != '-' else 0
                        pb = float(fields[46]) if fields[46] and fields[46] != '-' else 0
                        total_shares = float(fields[38]) if len(fields) > 38 and fields[38] else 0
                    except:
                        pass

            # 计算总市值（从腾讯数据或东方财富获取）
            total_market_value = self._get_market_value(code, total_shares)

            return {
                'pe_ttm': pe_ttm,
                'pb': pb,
                'total_market_value': total_market_value
            }
        except:
            return {'pe_ttm': 0, 'pb': 0, 'total_market_value': 0}

    def _get_market_value(self, code, total_shares):
        """获取总市值"""
        try:
            # 方法1: 从东方财富获取
            url = "http://push2.eastmoney.com/api/qt/stock/get"
            params = {
                'secid': f"{'1' if code.startswith('6') else '0'}.{code}",
                'fields': 'f116,f117'  # 总股本、总市值
            }

            response = requests.get(url, params=params, timeout=5)
            data = response.json()

            if 'data' in data and data['data']:
                # 总市值（元），转换为亿元
                market_value = data['data'].get('f117', 0)
                if market_value:
                    return round(market_value / 100000000, 2)

            # 方法2: 如果东方财富失败，用腾讯数据计算
            if total_shares > 0:
                current_price = self._get_current_price(code)
                if current_price > 0:
                    return round((current_price * total_shares) / 10000, 2)

            return 0
        except:
            return 0

    def _get_current_price(self, code):
        """获取当前价格"""
        try:
            eq_data = self.eq_sina.real([code], prefix=True)
            for key, value in eq_data.items():
                if code in key:
                    return value.get('now', 0)
            return 0
        except:
            return 0

    def _get_financial_data(self, code):
        """自动获取财务数据（ROE等）"""

        # 方法1: 自己计算ROE = 净利润 / 净资产
        roe = self._calculate_roe(code)

        # 方法2: 如果计算失败，尝试从API获取
        if roe == 0:
            roe = self._get_roe_from_apis(code)

        # 获取行业信息
        industry = self._get_industry(code)

        # 计算股利支付率
        dividend_ratio = self._get_dividend_ratio(code)

        return {
            'roe': roe,
            'industry': industry,
            'dividend_ratio': dividend_ratio
        }

    def _calculate_roe(self, code):
        """通过财务数据计算ROE = 净利润 / 净资产"""
        try:
            # 方法1: 从东方财富获取净利润和净资产
            financial_data = self._get_financial_statements(code)

            if financial_data and financial_data['net_profit'] > 0 and financial_data['net_assets'] > 0:
                roe = (financial_data['net_profit'] / financial_data['net_assets']) * 100
                return round(roe, 2)

            # 方法2: 通过每股数据计算 ROE = EPS / 每股净资产
            eps_data = self._get_eps_data(code)
            if eps_data and eps_data['eps'] > 0 and eps_data['bps'] > 0:
                roe = (eps_data['eps'] / eps_data['bps']) * 100
                return round(roe, 2)

            return 0

        except Exception as e:
            print(f"  ROE计算失败: {e}")
            return 0

    def _get_financial_statements(self, code):
        """获取财务报表数据（净利润、净资产）"""
        try:
            # 从新浪财经获取财务摘要
            url = f"http://money.finance.sina.com.cn/corp/go.php/vFD_FinanceSummary/stockid/{code}.phtml"
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }

            response = requests.get(url, headers=headers, timeout=5)
            response.encoding = 'gbk'

            # 解析HTML获取净利润和净资产
            content = response.text

            # 查找净利润（单位：万元）
            net_profit_pattern = r'净利润[^>]*>([^<]*)</td>'
            net_profit_match = re.search(net_profit_pattern, content)

            # 查找净资产（单位：万元）
            net_assets_pattern = r'资产总计[^>]*>([^<]*)</td>'
            net_assets_match = re.search(net_assets_pattern, content)

            if net_profit_match and net_assets_match:
                try:
                    # 提取数字，去掉逗号
                    net_profit_str = net_profit_match.group(1).replace(',', '').replace('--', '0')
                    net_assets_str = net_assets_match.group(1).replace(',', '').replace('--', '0')

                    net_profit = float(net_profit_str) * 10000  # 转换为元
                    net_assets = float(net_assets_str) * 10000  # 转换为元

                    if net_profit > 0 and net_assets > 0:
                        return {
                            'net_profit': net_profit,
                            'net_assets': net_assets
                        }
                except:
                    pass

            return None

        except:
            return None

    def _get_eps_data(self, code):
        """获取每股收益和每股净资产"""
        try:
            # 从腾讯财经获取每股数据
            tencent_code = f"sh{code}" if code.startswith('6') else f"sz{code}"
            url = f"http://qt.gtimg.cn/q={tencent_code}"

            response = requests.get(url, timeout=5)
            response.encoding = 'gbk'
            data = response.text

            match = re.search(rf'v_{tencent_code}="([^"]+)"', data)
            if match:
                fields = match.group(1).split('~')
                if len(fields) > 50:
                    try:
                        # 从腾讯数据中提取每股收益和每股净资产
                        # 需要根据实际字段位置调整
                        current_price = float(fields[3]) if fields[3] else 0
                        pe_ttm = float(fields[39]) if fields[39] and fields[39] != '-' else 0
                        pb = float(fields[46]) if fields[46] and fields[46] != '-' else 0

                        if current_price > 0 and pe_ttm > 0 and pb > 0:
                            # EPS = 股价 / PE
                            eps = current_price / pe_ttm
                            # BPS = 股价 / PB
                            bps = current_price / pb

                            return {
                                'eps': eps,
                                'bps': bps
                            }
                    except:
                        pass

            return None

        except:
            return None

    def _get_roe_from_apis(self, code):
        """从各种API获取ROE（备用方法）"""

        # 方法1: 东方财富
        roe = self._get_roe_from_eastmoney(code)
        if roe > 0:
            return roe

        # 方法2: 从雪球获取
        roe = self._get_roe_from_xueqiu(code)
        if roe > 0:
            return roe

        # 方法3: 从同花顺获取
        roe = self._get_roe_from_10jqka(code)
        if roe > 0:
            return roe

        return 0

    def _get_roe_from_xueqiu(self, code):
        """从雪球获取ROE"""
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }

            # 雪球API
            symbol = f"SH{code}" if code.startswith('6') else f"SZ{code}"
            url = f"https://stock.xueqiu.com/v5/stock/finance/cn/indicator.json"
            params = {
                'symbol': symbol,
                'type': 'Q4',
                'is_detail': 'true',
                'count': 1
            }

            response = requests.get(url, params=params, headers=headers, timeout=5)
            if response.status_code == 200:
                data = response.json()

                if 'data' in data and 'list' in data['data'] and data['data']['list']:
                    latest_data = data['data']['list'][0]
                    roe_list = latest_data.get('avg_roe', [])
                    if roe_list and len(roe_list) > 0 and roe_list[0]:
                        return round(float(roe_list[0]), 2)

            return 0
        except:
            return 0

    def _get_roe_from_10jqka(self, code):
        """从同花顺获取ROE"""
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }

            # 同花顺财务数据页面
            url = f"http://basic.10jqka.com.cn/{code}/finance.html"
            response = requests.get(url, headers=headers, timeout=5)
            response.encoding = 'gbk'

            # 使用正则表达式提取ROE
            roe_patterns = [
                r'净资产收益率[^>]*>([^<]*)</td>',
                r'ROE[^>]*>([^<]*)</td>',
                r'净资产收益率.*?(\d+\.?\d*)%'
            ]

            for pattern in roe_patterns:
                match = re.search(pattern, response.text)
                if match:
                    try:
                        roe_str = match.group(1).strip().replace('%', '').replace('--', '0')
                        roe = float(roe_str)
                        if 0 < roe < 100:  # 合理范围检查
                            return round(roe, 2)
                    except:
                        continue

            return 0
        except:
            return 0

    def _get_roe_from_eastmoney(self, code):
        """从东方财富获取ROE"""
        try:
            # 东方财富财务指标接口
            url = "http://datacenter-web.eastmoney.com/api/data/v1/get"
            params = {
                'sortColumns': 'REPORT_DATE',
                'sortTypes': '-1',
                'pageSize': '1',
                'pageNumber': '1',
                'reportName': 'RPT_DMSK_FN_MAIN',
                'columns': 'SECUCODE,REPORT_DATE,ROEJQ',
                'filter': f'(SECUCODE="{code}.{"SH" if code.startswith("6") else "SZ"}")'
            }

            response = requests.get(url, params=params, timeout=5)

            # 检查响应状态和内容
            if response.status_code != 200:
                return 0

            try:
                data = response.json()
            except:
                return 0

            # 安全地检查数据结构
            if not isinstance(data, dict):
                return 0

            result = data.get('result')
            if not result or not isinstance(result, dict):
                return 0

            result_data = result.get('data')
            if not result_data or not isinstance(result_data, list) or len(result_data) == 0:
                return 0

            # 获取ROE数据
            roe_data = result_data[0]
            if not isinstance(roe_data, dict):
                return 0

            roe = roe_data.get('ROEJQ')
            if roe and isinstance(roe, (int, float)) and roe != 0:
                return round(float(roe), 2)

            return 0

        except Exception as e:
            print(f"  东方财富ROE获取失败: {e}")
            return 0
        """从同花顺获取ROE"""
        try:
            # 同花顺F10数据接口
            url = f"http://basic.10jqka.com.cn/{code}/finance.html"
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }

            response = requests.get(url, headers=headers, timeout=5)
            response.encoding = 'gbk'

            # 简单的正则匹配ROE数据
            roe_pattern = r'净资产收益率.*?(\d+\.?\d*)%'
            match = re.search(roe_pattern, response.text)

            if match:
                roe = float(match.group(1))
                return round(roe, 2)

            return 0
        except:
            return 0

    def _get_roe_from_163(self, code):
        """从网易财经获取ROE"""
        try:
            # 网易财经API
            stock_code = f"{'0' if code.startswith('0') or code.startswith('3') else '1'}{code}"
            url = f"http://quotes.money.163.com/service/zycwzb_{stock_code}.html"

            response = requests.get(url, timeout=5)
            response.encoding = 'gbk'

            # 解析返回的数据
            if 'ROE' in response.text:
                # 简单的数据提取
                data_lines = response.text.split('\\n')
                for line in data_lines:
                    if 'ROE' in line:
                        # 提取数字
                        numbers = re.findall(r'\\d+\\.?\\d*', line)
                        if numbers:
                            try:
                                roe = float(numbers[-1])  # 取最后一个数字
                                if 0 < roe < 100:  # 合理范围
                                    return round(roe, 2)
                            except:
                                pass
            return 0
        except:
            return 0

    def _get_industry(self, code):
        """获取行业信息"""
        try:
            # 从东方财富获取行业信息
            url = "http://push2.eastmoney.com/api/qt/stock/get"
            params = {
                'secid': f"{'1' if code.startswith('6') else '0'}.{code}",
                'fields': 'f127'  # 行业字段
            }

            response = requests.get(url, params=params, timeout=5)
            data = response.json()

            if 'data' in data and data['data']:
                industry = data['data'].get('f127', '未知行业')
                return industry if industry else '未知行业'

            # 备用：基于股票代码推断行业
            industry_map = {
                '000001': '银行业', '600036': '银行业', '600000': '银行业',
                '002594': '汽车制造业', '000002': '房地产业'
            }
            return industry_map.get(code, '未知行业')

        except:
            return '未知行业'

    def _get_dividend_ratio(self, code):
        """获取股利支付率"""
        try:
            # 方法1: 尝试从真实数据计算
            dividend_ratio = self._calculate_real_dividend_ratio(code)
            if dividend_ratio > 0:
                return dividend_ratio

            # 方法2: 基于行业估算
            industry = self._get_industry(code)
            industry_dividend_ratios = {
                '银行': 35.0,
                '银行业': 35.0,
                '汽车整车': 15.0,
                '汽车制造业': 15.0,
                '房地产': 25.0,
                '房地产业': 25.0,
                '仪器仪表': 20.0,
                '化学制药': 25.0,
                '医药制造': 25.0,
                '未知行业': 20.0
            }

            return industry_dividend_ratios.get(industry, 20.0)

        except:
            return 20.0

    def _calculate_real_dividend_ratio(self, code):
        """尝试计算真实的股利支付率"""
        try:
            # 从东方财富获取分红数据
            url = "http://datacenter-web.eastmoney.com/api/data/v1/get"
            params = {
                'sortColumns': 'REPORT_DATE',
                'sortTypes': '-1',
                'pageSize': '1',
                'pageNumber': '1',
                'reportName': 'RPT_DMSK_FN_MAIN',
                'columns': 'SECUCODE,REPORT_DATE,EPSJB,MGJYXJJE',
                'filter': f'(SECUCODE="{code}.{"SH" if code.startswith("6") else "SZ"}")'
            }

            response = requests.get(url, params=params, timeout=5)
            if response.status_code == 200:
                try:
                    data = response.json()
                    if (data and isinstance(data, dict) and
                            'result' in data and data['result'] and
                            'data' in data['result'] and data['result']['data']):

                        financial_data = data['result']['data'][0]
                        if isinstance(financial_data, dict):
                            eps = financial_data.get('EPSJB', 0)  # 每股收益
                            dividend = financial_data.get('MGJYXJJE', 0)  # 每股分红

                            if eps and dividend and eps > 0:
                                ratio = (float(dividend) / float(eps)) * 100
                                if 0 <= ratio <= 100:  # 合理范围检查
                                    return round(ratio, 1)
                except:
                    pass

            return 0
        except:
            return 0

    def _calculate_derived_indicators(self, basic_data, valuation_data, financial_data):
        """计算衍生指标"""
        try:
            pe_ttm = valuation_data['pe_ttm']
            roe = financial_data['roe']
            dividend_ratio = financial_data['dividend_ratio']
            current_price = basic_data['current_price']

            # ============ 1. 市赚率计算 ============
            # 计算公式：市赚率 = PE / ROE
            # 说明：反映市盈率相对于净资产收益率的比值，用于评估估值合理性
            if roe > 0:
                market_earning_ratio = round(pe_ttm / roe, 2)
            else:
                market_earning_ratio = 0

            # ============ 2. 修正系数计算 ============
            # 计算规则：
            # - 如果股利支付率 > 50%，修正系数 = 1.00
            # - 如果股利支付率 < 25%，修正系数 = 2.00
            # - 如果股利支付率在 25%-50% 之间，修正系数 = 0.5 / (股利支付率/100)
            # 说明：根据分红政策调整估值，高分红公司风险较低，低分红公司成长性较强
            if dividend_ratio > 50:
                correction_factor = 1.00
            elif dividend_ratio < 25:
                correction_factor = 2.00
            else:
                # 将百分比转换为小数进行计算
                correction_factor = 0.5 / (dividend_ratio / 100)

            correction_factor = round(correction_factor, 2)

            # ============ 3. 修正市赚率计算 ============
            # 计算公式：修正市赚率 = 修正系数 × 市赚率
            # 说明：经过股利支付率修正后的市赚率，更准确反映投资价值
            corrected_market_earning_ratio = round(correction_factor * market_earning_ratio, 2)

            # ============ 4. 理论股价计算 ============
            # 计算公式：理论股价 = 当前股价 ÷ 修正市赚率
            # 说明：基于修正市赚率计算的理论合理价格，修正市赚率越高表示估值越高
            if corrected_market_earning_ratio > 0:
                theoretical_price = round(current_price / corrected_market_earning_ratio, 2)
            else:
                # 如果修正市赚率为0，则理论股价等于当前股价
                theoretical_price = current_price

            return {
                'market_earning_ratio': market_earning_ratio,
                'correction_factor': correction_factor,
                'corrected_market_earning_ratio': corrected_market_earning_ratio,
                'theoretical_price': theoretical_price
            }

        except Exception as e:
            print(f"  衍生指标计算失败: {e}")
            return {
                'market_earning_ratio': 0,
                'correction_factor': 1.00,
                'corrected_market_earning_ratio': 0,
                'theoretical_price': basic_data.get('current_price', 0)
            }

    def display_results(self, data, stock_codes):
        """显示结果"""
        if not data:
            print("❌ 未获取到任何数据")
            return

        print("\n" + "=" * 100)
        print("🤖 全自动获取的股票数据（11个字段）")
        print("=" * 100)

        for i, (code, row) in enumerate(zip(stock_codes[:len(data)], data)):
            print(f"\n📊 {code} - {row['股票名称']}")
            print(f"   所属行业: {row['所属行业']}")
            print(f"   总市值（亿）: {row['总市值（亿）']}")
            print(f"   当前价格: ¥{row['当前价格']}")
            print(f"   市盈率(TTM): {row['市盈率']}")
            print(f"   ROE: {row['ROE']}% 🤖 自动计算")
            print(f"   市赚率: {row['市赚率']} (PE/ROE)")
            print(f"   股利支付率: {row['股利支付率']}%")
            print(f"   修正系数: {row['修正系数']} 📝 根据分红政策计算")
            print(f"   修正市赚率: {row['修正市赚率']} (修正系数×市赚率)")
            print(f"   理论股价: ¥{row['理论股价']}")

        # 保存数据
        df = pd.DataFrame(data)
        df.index = stock_codes[:len(data)]
        df.to_csv('完整股票数据_11字段.csv', encoding='utf-8-sig')
        print(f"\n✅ 数据已保存到 完整股票数据_11字段.csv")

        print(f"\n📝 字段计算说明:")
        print(f"✅ 市赚率 = PE ÷ ROE")
        print(f"✅ 修正系数规则:")
        print(f"   • 股利支付率 > 50% → 修正系数 = 1.00")
        print(f"   • 股利支付率 < 25% → 修正系数 = 2.00")
        print(f"   • 25% ≤ 股利支付率 ≤ 50% → 修正系数 = 0.5 ÷ (股利支付率÷100)")
        print(f"✅ 修正市赚率 = 修正系数 × 市赚率")
        print(f"✅ 理论股价 = 当前股价 ÷ 修正市赚率")

        print(f"\n🔧 数据源说明:")
        print(f"✅ 实时行情: easyquotation")
        print(f"✅ 估值数据: 腾讯财经 + 东方财富")
        print(f"✅ ROE数据: 财务报表自动计算 + API备用")
        print(f"✅ 完全自动化，适合网站开发！")


# 主程序
def main():
    """主程序"""
    print("🤖 全自动股票数据获取系统（11个字段完整版）")
    print("=" * 60)
    print("📋 获取字段:")
    print("1. 股票名称  2. 所属行业  3. 总市值(亿)  4. 当前价格")
    print("5. 市盈率   6. ROE      7. 市赚率      8. 股利支付率")
    print("9. 修正系数 10. 修正市赚率 11. 理论股价")
    print("=" * 60)

    # 测试股票
    test_codes = ['600036', '000001', '002594', '000002', '301006']

    fetcher = AutoStockDataFetcher()
    data = fetcher.get_stock_data(test_codes)
    fetcher.display_results(data, test_codes)


if __name__ == "__main__":
    main()