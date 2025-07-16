/**
 * 股票数据缓存工具类
 * 支持交易时间和非交易时间的不同缓存策略
 */

export interface CacheItem<T> {
  data: T;
  timestamp: number;
  expireTime: number;
}

export interface CacheOptions {
  /** 交易时间缓存时长（分钟），默认2分钟 */
  tradingCacheDuration?: number;
  /** 非交易时间缓存时长（分钟），默认30分钟 */
  nonTradingCacheDuration?: number;
}

class StockCache {
  private readonly TRADING_CACHE_DURATION = 2; // 2分钟
  private readonly NON_TRADING_CACHE_DURATION = 30; // 30分钟
  private readonly CACHE_PREFIX = 'stock_cache_';

  /**
   * 判断当前是否为交易时间
   * 交易时间：周一到周五 9:30-11:30, 13:00-15:00
   */
  private isTradingTime(): boolean {
    const now = new Date();
    const day = now.getDay(); // 0=周日, 1=周一, ..., 6=周六
    const hour = now.getHours();
    const minute = now.getMinutes();
    const timeInMinutes = hour * 60 + minute;

    // 非工作日
    if (day === 0 || day === 6) {
      return false;
    }

    // 上午交易时间：9:30-11:30
    const morningStart = 9 * 60 + 30; // 9:30
    const morningEnd = 11 * 60 + 30;   // 11:30
    
    // 下午交易时间：13:00-15:00
    const afternoonStart = 13 * 60;    // 13:00
    const afternoonEnd = 15 * 60;      // 15:00

    return (timeInMinutes >= morningStart && timeInMinutes <= morningEnd) ||
           (timeInMinutes >= afternoonStart && timeInMinutes <= afternoonEnd);
  }

  /**
   * 获取缓存过期时间
   */
  private getExpireTime(options?: CacheOptions): number {
    const isTrading = this.isTradingTime();
    const duration = isTrading 
      ? (options?.tradingCacheDuration || this.TRADING_CACHE_DURATION)
      : (options?.nonTradingCacheDuration || this.NON_TRADING_CACHE_DURATION);
    
    return Date.now() + duration * 60 * 1000;
  }

  /**
   * 生成缓存键名
   */
  private getCacheKey(key: string): string {
    return `${this.CACHE_PREFIX}${key}`;
  }

  /**
   * 设置缓存
   */
  set<T>(key: string, data: T, options?: CacheOptions): void {
    try {
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        expireTime: this.getExpireTime(options)
      };
      
      localStorage.setItem(this.getCacheKey(key), JSON.stringify(cacheItem));
    } catch (error) {
      console.warn('缓存设置失败:', error);
    }
  }

  /**
   * 获取缓存
   */
  get<T>(key: string): T | null {
    try {
      const cached = localStorage.getItem(this.getCacheKey(key));
      if (!cached) {
        return null;
      }

      const cacheItem: CacheItem<T> = JSON.parse(cached);
      
      // 检查是否过期
      if (Date.now() > cacheItem.expireTime) {
        this.remove(key);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      console.warn('缓存读取失败:', error);
      this.remove(key);
      return null;
    }
  }

  /**
   * 获取缓存信息（包含时间戳）
   */
  getCacheInfo<T>(key: string): { data: T; timestamp: number } | null {
    try {
      const cached = localStorage.getItem(this.getCacheKey(key));
      if (!cached) {
        return null;
      }

      const cacheItem: CacheItem<T> = JSON.parse(cached);
      
      // 检查是否过期
      if (Date.now() > cacheItem.expireTime) {
        this.remove(key);
        return null;
      }

      return {
        data: cacheItem.data,
        timestamp: cacheItem.timestamp
      };
    } catch (error) {
      console.warn('缓存信息读取失败:', error);
      this.remove(key);
      return null;
    }
  }

  /**
   * 检查缓存是否存在且有效
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * 删除指定缓存
   */
  remove(key: string): void {
    try {
      localStorage.removeItem(this.getCacheKey(key));
    } catch (error) {
      console.warn('缓存删除失败:', error);
    }
  }

  /**
   * 清空所有股票相关缓存
   */
  clear(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('缓存清空失败:', error);
    }
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): { count: number; totalSize: number } {
    let count = 0;
    let totalSize = 0;

    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.CACHE_PREFIX)) {
          count++;
          const value = localStorage.getItem(key);
          if (value) {
            totalSize += value.length;
          }
        }
      });
    } catch (error) {
      console.warn('缓存统计失败:', error);
    }

    return { count, totalSize };
  }

  /**
   * 格式化时间戳为可读格式
   */
  formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - timestamp;
    
    // 如果是今天
    if (date.toDateString() === now.toDateString()) {
      if (diff < 60000) { // 1分钟内
        return '刚刚';
      } else if (diff < 3600000) { // 1小时内
        const minutes = Math.floor(diff / 60000);
        return `${minutes}分钟前`;
      } else {
        return date.toLocaleTimeString('zh-CN', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      }
    } else {
      return date.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }
}

// 导出单例实例
export const stockCache = new StockCache();

// 导出类型
export type { StockCache };

// 导出常用的缓存键名
export const CACHE_KEYS = {
  WATCHLIST: 'watchlist',
  MARKET_OVERVIEW: 'market_overview',
  STOCK_DETAIL: (code: string) => `stock_detail_${code}`,
  STOCK_HISTORY: (code: string, period: string) => `stock_history_${code}_${period}`,
  SEARCH_RESULTS: (query: string) => `search_${query}`,
} as const;