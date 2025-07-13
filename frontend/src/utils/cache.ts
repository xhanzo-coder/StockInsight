/**
 * 前端缓存工具
 * 提供内存缓存和localStorage缓存功能
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

class FrontendCache {
  private memoryCache = new Map<string, CacheItem<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5分钟默认过期时间

  /**
   * 设置缓存
   * @param key 缓存键
   * @param data 缓存数据
   * @param ttl 过期时间（毫秒），默认5分钟
   * @param useLocalStorage 是否使用localStorage持久化
   */
  set<T>(key: string, data: T, ttl: number = this.defaultTTL, useLocalStorage: boolean = false): void {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ttl
    };

    // 内存缓存
    this.memoryCache.set(key, item);

    // localStorage缓存（可选）
    if (useLocalStorage) {
      try {
        localStorage.setItem(`cache_${key}`, JSON.stringify(item));
      } catch (error) {
        console.warn('localStorage缓存失败:', error);
      }
    }
  }

  /**
   * 获取缓存
   * @param key 缓存键
   * @param checkLocalStorage 是否检查localStorage
   */
  get<T>(key: string, checkLocalStorage: boolean = false): T | null {
    // 先检查内存缓存
    const memoryItem = this.memoryCache.get(key);
    if (memoryItem && Date.now() < memoryItem.expiry) {
      return memoryItem.data;
    }

    // 检查localStorage缓存
    if (checkLocalStorage) {
      try {
        const stored = localStorage.getItem(`cache_${key}`);
        if (stored) {
          const item: CacheItem<T> = JSON.parse(stored);
          if (Date.now() < item.expiry) {
            // 恢复到内存缓存
            this.memoryCache.set(key, item);
            return item.data;
          } else {
            // 过期，删除localStorage中的数据
            localStorage.removeItem(`cache_${key}`);
          }
        }
      } catch (error) {
        console.warn('localStorage读取失败:', error);
      }
    }

    // 清理过期的内存缓存
    if (memoryItem) {
      this.memoryCache.delete(key);
    }

    return null;
  }

  /**
   * 删除缓存
   * @param key 缓存键
   */
  delete(key: string): void {
    this.memoryCache.delete(key);
    try {
      localStorage.removeItem(`cache_${key}`);
    } catch (error) {
      console.warn('localStorage删除失败:', error);
    }
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.memoryCache.clear();
    
    // 清理localStorage中的缓存项
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('cache_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('localStorage清理失败:', error);
    }
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): { memorySize: number; localStorageSize: number } {
    let localStorageSize = 0;
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('cache_')) {
          localStorageSize++;
        }
      });
    } catch (error) {
      console.warn('获取localStorage统计失败:', error);
    }

    return {
      memorySize: this.memoryCache.size,
      localStorageSize
    };
  }

  /**
   * 清理过期缓存
   */
  cleanup(): void {
    const now = Date.now();
    
    // 清理内存缓存
    Array.from(this.memoryCache.entries()).forEach(([key, item]) => {
      if (now >= item.expiry) {
        this.memoryCache.delete(key);
      }
    });

    // 清理localStorage缓存
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('cache_')) {
          try {
            const stored = localStorage.getItem(key);
            if (stored) {
              const item = JSON.parse(stored);
              if (now >= item.expiry) {
                localStorage.removeItem(key);
              }
            }
          } catch (error) {
            // 解析失败，删除该项
            localStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      console.warn('localStorage清理失败:', error);
    }
  }
}

// 创建全局缓存实例
export const frontendCache = new FrontendCache();

// 定期清理过期缓存（每10分钟）
setInterval(() => {
  frontendCache.cleanup();
}, 10 * 60 * 1000);

export default frontendCache;