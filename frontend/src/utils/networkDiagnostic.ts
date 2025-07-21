/**
 * 网络连接诊断工具
 * 用于诊断前端到后端的网络连接问题
 */

export interface NetworkDiagnosticResult {
  test: string;
  success: boolean;
  message: string;
  details?: any;
  duration?: number;
}

export class NetworkDiagnostic {
  private static readonly BACKEND_URL = 'http://localhost:5000';
  private static readonly API_URL = 'http://localhost:5000/api';

  /**
   * 运行完整的网络诊断
   */
  static async runFullDiagnostic(): Promise<NetworkDiagnosticResult[]> {
    const results: NetworkDiagnosticResult[] = [];

    // 1. 测试后端基础连接
    results.push(await this.testBackendConnection());

    // 2. 测试健康检查接口
    results.push(await this.testHealthCheck());

    // 3. 测试CORS配置
    results.push(await this.testCORS());

    // 4. 测试认证接口
    results.push(await this.testAuthAPI());

    // 5. 测试关注列表接口（无token）
    results.push(await this.testWatchlistNoToken());

    return results;
  }

  /**
   * 测试后端基础连接
   */
  private static async testBackendConnection(): Promise<NetworkDiagnosticResult> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(this.BACKEND_URL, {
        method: 'GET',
        mode: 'no-cors',
        signal: AbortSignal.timeout(5000)
      });
      
      const duration = Date.now() - startTime;
      
      return {
        test: '后端基础连接',
        success: true,
        message: `后端服务器响应正常 (${duration}ms)`,
        duration
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      return {
        test: '后端基础连接',
        success: false,
        message: `无法连接到后端服务器: ${error.message}`,
        details: { error: error.message, code: error.code },
        duration
      };
    }
  }

  /**
   * 测试健康检查接口
   */
  private static async testHealthCheck(): Promise<NetworkDiagnosticResult> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${this.API_URL}/health`, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(10000)
      });
      
      const duration = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        return {
          test: '健康检查接口',
          success: true,
          message: `健康检查通过 (${duration}ms)`,
          details: data,
          duration
        };
      } else {
        return {
          test: '健康检查接口',
          success: false,
          message: `健康检查失败: HTTP ${response.status}`,
          details: { status: response.status, statusText: response.statusText },
          duration
        };
      }
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      return {
        test: '健康检查接口',
        success: false,
        message: `健康检查请求失败: ${error.message}`,
        details: { error: error.message, code: error.code },
        duration
      };
    }
  }

  /**
   * 测试CORS配置
   */
  private static async testCORS(): Promise<NetworkDiagnosticResult> {
    const startTime = Date.now();
    
    try {
      // 发送一个OPTIONS预检请求
      const response = await fetch(`${this.API_URL}/health`, {
        method: 'OPTIONS',
        mode: 'cors',
        headers: {
          'Origin': window.location.origin,
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Content-Type,Authorization'
        },
        signal: AbortSignal.timeout(5000)
      });
      
      const duration = Date.now() - startTime;
      
      if (response.ok) {
        const corsHeaders = {
          'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
          'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
          'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
        };
        
        return {
          test: 'CORS配置',
          success: true,
          message: `CORS配置正确 (${duration}ms)`,
          details: corsHeaders,
          duration
        };
      } else {
        return {
          test: 'CORS配置',
          success: false,
          message: `CORS预检请求失败: HTTP ${response.status}`,
          details: { status: response.status },
          duration
        };
      }
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      return {
        test: 'CORS配置',
        success: false,
        message: `CORS测试失败: ${error.message}`,
        details: { error: error.message },
        duration
      };
    }
  }

  /**
   * 测试认证接口
   */
  private static async testAuthAPI(): Promise<NetworkDiagnosticResult> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${this.API_URL}/auth/login`, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: 'test',
          password: 'test'
        }),
        signal: AbortSignal.timeout(10000)
      });
      
      const duration = Date.now() - startTime;
      const data = await response.json();
      
      // 认证失败是预期的，我们只是测试接口是否可达
      if (response.status === 400 || response.status === 401) {
        return {
          test: '认证接口',
          success: true,
          message: `认证接口可达 (${duration}ms)`,
          details: { status: response.status, message: data.message },
          duration
        };
      } else {
        return {
          test: '认证接口',
          success: false,
          message: `认证接口异常响应: HTTP ${response.status}`,
          details: { status: response.status, data },
          duration
        };
      }
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      return {
        test: '认证接口',
        success: false,
        message: `认证接口请求失败: ${error.message}`,
        details: { error: error.message },
        duration
      };
    }
  }

  /**
   * 测试关注列表接口（无token）
   */
  private static async testWatchlistNoToken(): Promise<NetworkDiagnosticResult> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${this.API_URL}/watchlist`, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(10000)
      });
      
      const duration = Date.now() - startTime;
      const data = await response.json();
      
      // 401未授权是预期的
      if (response.status === 401) {
        return {
          test: '关注列表接口',
          success: true,
          message: `关注列表接口可达，正确返回401未授权 (${duration}ms)`,
          details: { status: response.status, message: data.message },
          duration
        };
      } else {
        return {
          test: '关注列表接口',
          success: false,
          message: `关注列表接口异常响应: HTTP ${response.status}`,
          details: { status: response.status, data },
          duration
        };
      }
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      return {
        test: '关注列表接口',
        success: false,
        message: `关注列表接口请求失败: ${error.message}`,
        details: { error: error.message, code: error.code },
        duration
      };
    }
  }

  /**
   * 获取网络环境信息
   */
  static getNetworkInfo(): any {
    return {
      userAgent: navigator.userAgent,
      onLine: navigator.onLine,
      connection: (navigator as any).connection ? {
        effectiveType: (navigator as any).connection.effectiveType,
        downlink: (navigator as any).connection.downlink,
        rtt: (navigator as any).connection.rtt
      } : null,
      location: {
        origin: window.location.origin,
        hostname: window.location.hostname,
        port: window.location.port,
        protocol: window.location.protocol
      }
    };
  }

  /**
   * 生成诊断报告
   */
  static generateReport(results: NetworkDiagnosticResult[]): string {
    const networkInfo = this.getNetworkInfo();
    const timestamp = new Date().toISOString();
    
    let report = `# StockInsight 网络诊断报告\n\n`;
    report += `**生成时间**: ${timestamp}\n\n`;
    
    report += `## 网络环境信息\n`;
    report += `- **在线状态**: ${networkInfo.onLine ? '在线' : '离线'}\n`;
    report += `- **当前地址**: ${networkInfo.location.origin}\n`;
    report += `- **协议**: ${networkInfo.location.protocol}\n`;
    if (networkInfo.connection) {
      report += `- **连接类型**: ${networkInfo.connection.effectiveType}\n`;
      report += `- **下行速度**: ${networkInfo.connection.downlink} Mbps\n`;
      report += `- **延迟**: ${networkInfo.connection.rtt} ms\n`;
    }
    report += `\n`;
    
    report += `## 诊断结果\n\n`;
    
    results.forEach((result, index) => {
      const status = result.success ? '✅ 通过' : '❌ 失败';
      report += `### ${index + 1}. ${result.test} - ${status}\n`;
      report += `**消息**: ${result.message}\n`;
      if (result.duration) {
        report += `**耗时**: ${result.duration}ms\n`;
      }
      if (result.details) {
        report += `**详情**: \`${JSON.stringify(result.details, null, 2)}\`\n`;
      }
      report += `\n`;
    });
    
    // 添加建议
    const failedTests = results.filter(r => !r.success);
    if (failedTests.length > 0) {
      report += `## 问题解决建议\n\n`;
      
      failedTests.forEach(test => {
        report += `### ${test.test}\n`;
        
        if (test.test === '后端基础连接') {
          report += `- 确认后端服务已启动 (python app.py)\n`;
          report += `- 检查端口5000是否被占用\n`;
          report += `- 确认防火墙设置允许访问端口5000\n`;
        } else if (test.test === 'CORS配置') {
          report += `- 检查后端CORS配置是否包含前端域名\n`;
          report += `- 确认浏览器没有阻止跨域请求\n`;
        } else if (test.details?.code === 'TIMEOUT') {
          report += `- 网络连接较慢，尝试增加超时时间\n`;
          report += `- 检查网络连接稳定性\n`;
        } else {
          report += `- 检查网络连接\n`;
          report += `- 重启前端和后端服务\n`;
          report += `- 清除浏览器缓存\n`;
        }
        report += `\n`;
      });
    } else {
      report += `## 结论\n\n`;
      report += `所有网络连接测试均通过，网络配置正常。\n`;
    }
    
    return report;
  }
}