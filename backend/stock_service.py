import easyquotation
import requests
import re
import pandas as pd
import time
import json
from bs4 import BeautifulSoup
import warnings
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any

warnings.filterwarnings('ignore')

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class StockService:
    """股票数据服务类 - 基于 stock_comp.py 的实现"""
    
    def __init__(self):
        self.eq_sina = easyquotation.use('sina')
        self.cache = {}
        self.cache_timeout = 300  # 5分钟缓存
    
    def search_stocks(self, keyword: str, limit: int = 10) -> List[Dict[str, Any]]:
        """搜索股票 - 返回11个字段的完整数据"""
        try:
            logger.info(f"搜索股票关键词: {keyword}")
            
            # 简单的股票代码匹配逻辑
            stock_codes = self._get_stock_codes_by_keyword(keyword, limit)
            
            if not stock_codes:
                logger.warning(f"未找到匹配的股票: {keyword}")
                return []
            
            # 获取完整的11个字段数据
            results = []
            for code in stock_codes:
                stock_data = self.get_stock_complete_data(code)
                if stock_data:
                    results.append(stock_data)
                    
                if len(results) >= limit:
                    break
            
            logger.info(f"搜索完成，返回 {len(results)} 条结果")
            return results
            
        except Exception as e:
            logger.error(f"搜索股票失败: {e}")
            return []
    
    def get_stock_complete_data(self, code: str) -> Optional[Dict[str, Any]]:
        """获取单只股票的完整11个字段数据"""
        try:
            logger.info(f"获取股票 {code} 的完整数据")
            
            # 检查缓存
            cache_key = f"stock_complete_{code}"
            if self._is_cache_valid(cache_key):
                logger.info(f"使用缓存数据: {code}")
                return self.cache[cache_key]['data']
            
            # 1. 基础行情数据（股票名称、当前价格）
            basic_data = self._get_basic_data(code)
            if not basic_data:
                logger.warning(f"股票 {code} 基础数据获取失败")
                return None
            
            # 2. 估值数据（市盈率TTM、市净率、总市值）
            valuation_data = self._get_valuation_data(code)
            
            # 3. 财务数据（ROE、行业、股利支付率）
            financial_data = self._get_financial_data(code)
            
            # 4. 计算衍生指标（市赚率、修正系数、修正市赚率、理论股价）
            derived_data = self._calculate_derived_indicators(
                basic_data, valuation_data, financial_data
            )
            
            # 5. 合并所有数据为11个字段
            stock_info = {
                'code': code,
                'name': basic_data['name'],
                'industry': financial_data['industry'],
                'current_price': basic_data['current_price'],
                'change_percent': basic_data.get('change_percent', 0),
                'change_amount': basic_data.get('change_amount', 0),
                'market_cap': f"{valuation_data['total_market_value']}亿",
                'pe_ratio_ttm': valuation_data['pe_ttm'],
                'roe': financial_data['roe'],
                'pb_ratio': valuation_data['pb'],
                'dividend_payout_ratio': financial_data['dividend_ratio'],
                'correction_factor': derived_data['correction_factor'],
                'corrected_pe': derived_data['corrected_market_earning_ratio'],
                'theoretical_price': derived_data['theoretical_price'],
                'timestamp': datetime.now().isoformat()
            }
            
            # 缓存结果
            self._set_cache(cache_key, stock_info)
            
            logger.info(f"股票 {code} 数据获取成功")
            return stock_info
            
        except Exception as e:
            logger.error(f"获取股票 {code} 数据失败: {e}")
            return None
    
    def _get_stock_codes_by_keyword(self, keyword: str, limit: int) -> List[str]:
        """根据关键词获取股票代码列表"""
        # 如果是6位数字，直接作为股票代码
        if keyword.isdigit() and len(keyword) == 6:
            return [keyword]
        
        # 扩展的股票代码映射
        stock_mapping = {
            '平安银行': ['000001'],
            '万科': ['000002'], 
            '招商银行': ['600036'],
            '浦发银行': ['600000'],
            '中国平安': ['601318'],
            '贵州茅台': ['600519'],
            '五粮液': ['000858'],
            '比亚迪': ['002594'],
            '宁德时代': ['300750'],
            '江苏银行': ['600919'],
            '南京银行': ['601009'],
            '宁波银行': ['002142'],
            '兴业银行': ['601166'],
            '民生银行': ['600016'],
            '光大银行': ['601818'],
            '华夏银行': ['600015'],
            '中信银行': ['601998'],
            '建设银行': ['601939'],
            '工商银行': ['601398'],
            '农业银行': ['601288'],
            '中国银行': ['601988']
        }
        
        # 根据名称搜索
        codes = []
        for name, code_list in stock_mapping.items():
            if keyword in name:
                codes.extend(code_list)
        
        # 如果没找到精确匹配，尝试模糊匹配
        if not codes:
            for name, code_list in stock_mapping.items():
                if any(char in name for char in keyword) and len(keyword) >= 2:
                    codes.extend(code_list)
        
        # 如果还是没找到，返回空列表而不是默认代码
        return codes[:limit]
    
    def _get_basic_data(self, code: str) -> Dict[str, Any]:
        """获取基础行情数据"""
        try:
            eq_data = self.eq_sina.real([code], prefix=True)
            
            for key, value in eq_data.items():
                if code in key:
                    current_price = value.get('now', 0)
                    yesterday_close = value.get('close', 0)
                    
                    # 计算涨跌幅和涨跌额
                    change_amount = current_price - yesterday_close if yesterday_close > 0 else 0
                    change_percent = (change_amount / yesterday_close * 100) if yesterday_close > 0 else 0
                    
                    return {
                        'name': value.get('name', ''),
                        'current_price': current_price,
                        'change_percent': round(change_percent, 2),
                        'change_amount': round(change_amount, 2)
                    }
            return {}
        except Exception as e:
            logger.error(f"获取基础数据失败 {code}: {e}")
            return {}
    
    def _get_valuation_data(self, code: str) -> Dict[str, float]:
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
            
            # 计算总市值
            total_market_value = self._get_market_value(code, total_shares)
            
            return {
                'pe_ttm': pe_ttm,
                'pb': pb,
                'total_market_value': total_market_value
            }
        except Exception as e:
            logger.error(f"获取估值数据失败 {code}: {e}")
            return {'pe_ttm': 0, 'pb': 0, 'total_market_value': 0}
    
    def _get_market_value(self, code: str, total_shares: float) -> float:
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
        except Exception as e:
            logger.error(f"获取市值失败 {code}: {e}")
            return 0
    
    def _get_current_price(self, code: str) -> float:
        """获取当前价格"""
        try:
            eq_data = self.eq_sina.real([code], prefix=True)
            for key, value in eq_data.items():
                if code in key:
                    return value.get('now', 0)
            return 0
        except:
            return 0
    
    def _get_financial_data(self, code: str) -> Dict[str, Any]:
        """获取财务数据（ROE、行业、股利支付率）"""
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
    
    def _calculate_roe(self, code: str) -> float:
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
            logger.error(f"ROE计算失败 {code}: {e}")
            return 0
    
    def _get_financial_statements(self, code: str) -> Optional[Dict[str, float]]:
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
            
        except Exception as e:
            logger.error(f"获取财务报表失败 {code}: {e}")
            return None
    
    def _get_eps_data(self, code: str) -> Optional[Dict[str, float]]:
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
            
        except Exception as e:
            logger.error(f"获取每股数据失败 {code}: {e}")
            return None
    
    def _get_roe_from_apis(self, code: str) -> float:
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
    
    def _get_roe_from_eastmoney(self, code: str) -> float:
        """从东方财富获取ROE"""
        try:
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
            
            if response.status_code != 200:
                return 0
            
            try:
                data = response.json()
            except:
                return 0
            
            if not isinstance(data, dict):
                return 0
            
            result = data.get('result')
            if not result or not isinstance(result, dict):
                return 0
            
            result_data = result.get('data')
            if not result_data or not isinstance(result_data, list) or len(result_data) == 0:
                return 0
            
            roe_data = result_data[0]
            if not isinstance(roe_data, dict):
                return 0
            
            roe = roe_data.get('ROEJQ')
            if roe and isinstance(roe, (int, float)) and roe != 0:
                return round(float(roe), 2)
            
            return 0
            
        except Exception as e:
            logger.error(f"东方财富ROE获取失败 {code}: {e}")
            return 0
    
    def _get_roe_from_xueqiu(self, code: str) -> float:
        """从雪球获取ROE"""
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            
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
        except Exception as e:
            logger.error(f"雪球ROE获取失败 {code}: {e}")
            return 0
    
    def _get_roe_from_10jqka(self, code: str) -> float:
        """从同花顺获取ROE"""
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            
            url = f"http://basic.10jqka.com.cn/{code}/finance.html"
            response = requests.get(url, headers=headers, timeout=5)
            response.encoding = 'gbk'
            
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
        except Exception as e:
            logger.error(f"同花顺ROE获取失败 {code}: {e}")
            return 0
    
    def _get_industry(self, code: str) -> str:
        """获取行业信息"""
        try:
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
            
        except Exception as e:
            logger.error(f"获取行业失败 {code}: {e}")
            return '未知行业'
    
    def _get_dividend_ratio(self, code: str) -> float:
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
            
        except Exception as e:
            logger.error(f"获取股利支付率失败 {code}: {e}")
            return 20.0
    
    def _calculate_real_dividend_ratio(self, code: str) -> float:
        """尝试计算真实的股利支付率"""
        try:
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
        except Exception as e:
            logger.error(f"计算真实股利支付率失败 {code}: {e}")
            return 0
    
    def _calculate_derived_indicators(self, basic_data: Dict, valuation_data: Dict, financial_data: Dict) -> Dict[str, float]:
        """计算衍生指标（市赚率、修正系数、修正市赚率、理论股价）"""
        try:
            current_price = basic_data.get('current_price', 0)
            pe_ttm = valuation_data.get('pe_ttm', 0)
            roe = financial_data.get('roe', 0)
            dividend_ratio = financial_data.get('dividend_ratio', 0)
            
            # 1. 市赚率 = 市盈率TTM / ROE
            market_earning_ratio = 0
            if roe > 0 and pe_ttm > 0:
                market_earning_ratio = round(pe_ttm / roe, 2)
            
            # 2. 修正系数计算（根据用户要求）
            # 如果股利支付率 > 50%，修正系数 = 1
            # 如果股利支付率 < 25%，修正系数 = 2  
            # 如果股利支付率在25%-50%之间，修正系数 = 0.5 / (股利支付率/100)
            correction_factor = 0
            if dividend_ratio > 0:
                if dividend_ratio > 50:
                    correction_factor = 1.0
                elif dividend_ratio < 25:
                    correction_factor = 2.0
                else:
                    # 25% <= dividend_ratio <= 50%
                    correction_factor = 0.5 / (dividend_ratio / 100)
                correction_factor = round(correction_factor, 2)
            
            # 3. 修正市赚率 = 修正系数 × 市赚率
            corrected_market_earning_ratio = 0
            if market_earning_ratio > 0 and correction_factor > 0:
                corrected_market_earning_ratio = round(correction_factor * market_earning_ratio, 2)
            
            # 4. 理论股价 = 现在的股价 / 修正市赚率
            theoretical_price = 0
            if current_price > 0 and corrected_market_earning_ratio > 0:
                theoretical_price = round(current_price / corrected_market_earning_ratio, 2)
            
            return {
                'market_earning_ratio': market_earning_ratio,
                'correction_factor': correction_factor,
                'corrected_market_earning_ratio': corrected_market_earning_ratio,
                'theoretical_price': theoretical_price
            }
            
        except Exception as e:
            logger.error(f"计算衍生指标失败: {e}")
            return {
                'market_earning_ratio': 0,
                'correction_factor': 0,
                'corrected_market_earning_ratio': 0,
                'theoretical_price': 0
            }
    
    def get_stock_detail(self, code: str) -> Optional[Dict[str, Any]]:
        """获取股票详情（与完整数据相同）"""
        return self.get_stock_complete_data(code)
    
    def get_stock_basic_info(self, code: str) -> Optional[Dict[str, Any]]:
        """获取股票基本信息（与完整数据相同）"""
        return self.get_stock_complete_data(code)
    
    def add_to_watchlist(self, code: str, industry: str = '') -> bool:
        """添加到关注列表（简化实现）"""
        try:
            # 这里应该连接数据库，暂时返回成功
            logger.info(f"添加股票到关注列表: {code}")
            return True
        except Exception as e:
            logger.error(f"添加关注失败: {e}")
            return False
    
    def remove_from_watchlist(self, code: str) -> bool:
        """从关注列表移除（简化实现）"""
        try:
            logger.info(f"从关注列表移除股票: {code}")
            return True
        except Exception as e:
            logger.error(f"移除关注失败: {e}")
            return False
    
    def get_watchlist(self) -> List[Dict[str, Any]]:
        """获取关注列表（返回测试数据）"""
        try:
            # 返回一些测试股票的完整数据
            test_codes = ['000001', '600036', '000002']
            watchlist = []
            
            for code in test_codes:
                stock_data = self.get_stock_complete_data(code)
                if stock_data:
                    stock_data['added_time'] = datetime.now().isoformat()
                    stock_data['updated_time'] = datetime.now().isoformat()
                    watchlist.append(stock_data)
            
            return watchlist
        except Exception as e:
            logger.error(f"获取关注列表失败: {e}")
            return []
    
    def _is_cache_valid(self, cache_key: str) -> bool:
        """检查缓存是否有效"""
        if cache_key not in self.cache:
            return False
        
        cache_time = self.cache[cache_key]['timestamp']
        return (datetime.now() - cache_time).seconds < self.cache_timeout
    
    def _set_cache(self, cache_key: str, data: Any) -> None:
        """设置缓存"""
        self.cache[cache_key] = {
            'data': data,
            'timestamp': datetime.now()
        }
    
    def clear_cache(self) -> None:
        """清空缓存"""
        self.cache.clear()
        logger.info("缓存已清空")

# 创建全局实例
stock_service = StockService()