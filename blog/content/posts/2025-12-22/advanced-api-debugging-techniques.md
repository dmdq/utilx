---
title: "高级API调试技术：从接口测试到性能监控的完整调试指南"
slug: "advanced-api-debugging-techniques"
summary: "深入探讨现代API调试的高级技术和最佳实践，包括自动化测试、性能监控、错误追踪、安全调试和调试工具的使用，帮助开发者快速定位和解决API问题。"
date: 2025-12-22T16:00:00+08:00
draft: false
tags: ["API调试", "接口测试", "性能监控", "错误追踪", "调试工具"]
categories: ["前端开发"]
---

API调试是现代Web开发中的核心技能之一。随着微服务架构的普及和API复杂度的增加，掌握高效的API调试技术变得尤为重要。本文将全面介绍API调试的各个方面，从基础测试到高级监控。

## API调试基础工具

### 浏览器开发者工具

掌握Chrome DevTools的高级功能：

```javascript
// API调试工具类
class APIDebugger {
  constructor() {
    this.requestHistory = [];
    this.mockResponses = new Map();
    this.breakpoints = new Set();
    this.debugMode = false;
  }

  // 拦截和记录API请求
  interceptRequests() {
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      const startTime = performance.now();
      const requestId = this.generateRequestId();

      try {
        // 记录请求信息
        const [url, options = {}] = args;
        const requestInfo = {
          id: requestId,
          url,
          method: options.method || 'GET',
          headers: options.headers || {},
          body: options.body,
          timestamp: startTime,
          stackTrace: this.getStackTrace()
        };

        // 检查断点
        if (this.shouldBreak(requestInfo)) {
          this.breakExecution(requestInfo);
        }

        // 发送请求
        const response = await originalFetch(...args);
        const endTime = performance.now();

        // 克隆响应以便多次读取
        const clonedResponse = response.clone();

        // 记录响应信息
        const responseInfo = await this.captureResponse(clonedResponse);
        responseInfo.id = requestId;
        responseInfo.duration = endTime - startTime;

        // 保存到历史记录
        this.requestHistory.push({
          request: requestInfo,
          response: responseInfo
        });

        // 更新调试面板
        this.updateDebugPanel();

        return response;

      } catch (error) {
        const endTime = performance.now();

        // 记录错误信息
        this.requestHistory.push({
          request: {
            id: requestId,
            url: args[0],
            method: args[1]?.method || 'GET',
            timestamp: startTime
          },
          error: {
            message: error.message,
            stack: error.stack,
            duration: endTime - startTime
          }
        });

        throw error;
      }
    };

    // 拦截XMLHttpRequest
    this.interceptXHR();
  }

  // 拦截XMLHttpRequest
  interceptXHR() {
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(method, url, ...args) {
      this._requestInfo = {
        method,
        url,
        timestamp: performance.now()
      };

      return originalXHROpen.call(this, method, url, ...args);
    };

    XMLHttpRequest.prototype.send = function(body) {
      const startTime = performance.now();
      const requestId = APIDebugger.prototype.generateRequestId();

      this._requestInfo.id = requestId;
      this._requestInfo.body = body;

      const originalOnReadyStateChange = this.onreadystatechange;
      this.onreadystatechange = function() {
        if (this.readyState === 4) {
          const endTime = performance.now();

          const responseInfo = {
            status: this.status,
            statusText: this.statusText,
            headers: APIDebugger.prototype.parseHeaders(this.getAllResponseHeaders()),
            response: this.response,
            duration: endTime - startTime
          };

          APIDebugger.prototype.requestHistory.push({
            request: this._requestInfo,
            response: responseInfo
          });

          APIDebugger.prototype.updateDebugPanel();
        }

        if (originalOnReadyStateChange) {
          originalOnReadyStateChange.call(this);
        }
      };

      return originalXHRSend.call(this, body);
    };
  }

  // 生成请求ID
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 捕获响应信息
  async captureResponse(response) {
    const responseInfo = {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      type: response.type,
      url: response.url,
      redirected: response.redirected
    };

    try {
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        responseInfo.data = await response.json();
      } else if (contentType?.includes('text/')) {
        responseInfo.data = await response.text();
      } else {
        responseInfo.data = '[Binary Data]';
      }
    } catch (error) {
      responseInfo.data = '[Failed to parse response]';
    }

    return responseInfo;
  }

  // 添加API断点
  addBreakpoint(url, method = 'GET') {
    const breakpoint = { url, method };
    this.breakpoints.add(JSON.stringify(breakpoint));
    console.log(`Added API breakpoint for ${method} ${url}`);
  }

  // 移除API断点
  removeBreakpoint(url, method = 'GET') {
    const breakpoint = { url, method };
    this.breakpoints.delete(JSON.stringify(breakpoint));
    console.log(`Removed API breakpoint for ${method} ${url}`);
  }

  // 检查是否应该断点
  shouldBreak(requestInfo) {
    return Array.from(this.breakpoints).some(breakpoint => {
      const { url, method } = JSON.parse(breakpoint);
      return requestInfo.url.includes(url) &&
             requestInfo.method.toLowerCase() === method.toLowerCase();
    });
  }

  // 断点执行
  breakExecution(requestInfo) {
    console.group('🔴 API Breakpoint Hit');
    console.log('Request:', requestInfo);
    console.groupEnd();

    // 暂停执行
    if (this.debugMode) {
      debugger;
    }

    // 显示调试界面
    this.showDebugDialog(requestInfo);
  }

  // Mock API响应
  mockAPI(url, response, status = 200) {
    this.mockResponses.set(url, { response, status });
    console.log(`Mocked API: ${url}`);
  }

  // 清除Mock
  clearMocks() {
    this.mockResponses.clear();
    console.log('All API mocks cleared');
  }

  // 获取请求历史
  getRequestHistory() {
    return this.requestHistory;
  }

  // 导出请求历史
  exportHistory() {
    const data = JSON.stringify(this.requestHistory, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `api_requests_${Date.now()}.json`;
    a.click();

    URL.revokeObjectURL(url);
  }

  // 调用栈信息
  getStackTrace() {
    const stack = new Error().stack;
    return stack.split('\n').slice(2).map(line => line.trim());
  }

  // 解析响应头
  parseHeaders(headerString) {
    const headers = {};
    const lines = headerString.split('\r\n');

    lines.forEach(line => {
      const [name, value] = line.split(': ');
      if (name && value) {
        headers[name] = value;
      }
    });

    return headers;
  }
}
```

### 高级调试面板

创建可视化的API调试界面：

```javascript
// API调试面板
class APIDebugPanel {
  constructor() {
    this.panel = null;
    this.isVisible = false;
    this.apiDebugger = new APIDebugger();
    this.createPanel();
  }

  // 创建调试面板
  createPanel() {
    this.panel = document.createElement('div');
    this.panel.id = 'api-debug-panel';
    this.panel.innerHTML = `
      <div class="debug-panel-header">
        <h3>API Debugger</h3>
        <div class="debug-controls">
          <button id="clear-history">Clear History</button>
          <button id="export-history">Export</button>
          <button id="toggle-panel">Hide</button>
        </div>
      </div>

      <div class="debug-panel-tabs">
        <button class="tab active" data-tab="requests">Requests</button>
        <button class="tab" data-tab="mocks">Mocks</button>
        <button class="tab" data-tab="breakpoints">Breakpoints</button>
        <button class="tab" data-tab="performance">Performance</button>
      </div>

      <div class="debug-panel-content">
        <div id="requests-tab" class="tab-content active">
          <div class="request-filters">
            <input type="text" placeholder="Filter by URL..." id="url-filter">
            <select id="method-filter">
              <option value="">All Methods</option>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
            <select id="status-filter">
              <option value="">All Status</option>
              <option value="success">Success (2xx)</option>
              <option value="redirect">Redirect (3xx)</option>
              <option value="error">Error (4xx/5xx)</option>
            </select>
          </div>
          <div id="request-list" class="request-list"></div>
        </div>

        <div id="mocks-tab" class="tab-content">
          <div class="mock-controls">
            <input type="text" placeholder="API URL" id="mock-url">
            <select id="mock-status">
              <option value="200">200 OK</option>
              <option value="400">400 Bad Request</option>
              <option value="401">401 Unauthorized</option>
              <option value="404">404 Not Found</option>
              <option value="500">500 Internal Server Error</option>
            </select>
            <button id="add-mock">Add Mock</button>
          </div>
          <div id="mock-list" class="mock-list"></div>
        </div>

        <div id="breakpoints-tab" class="tab-content">
          <div class="breakpoint-controls">
            <input type="text" placeholder="API URL" id="breakpoint-url">
            <select id="breakpoint-method">
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
            <button id="add-breakpoint">Add Breakpoint</button>
          </div>
          <div id="breakpoint-list" class="breakpoint-list"></div>
        </div>

        <div id="performance-tab" class="tab-content">
          <div id="performance-charts"></div>
        </div>
      </div>

      <div id="request-detail" class="request-detail hidden"></div>
    `;

    this.addStyles();
    this.attachEventListeners();
    document.body.appendChild(this.panel);
  }

  // 添加样式
  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      #api-debug-panel {
        position: fixed;
        top: 0;
        right: 0;
        width: 600px;
        height: 100vh;
        background: #1e1e1e;
        color: #d4d4d4;
        font-family: 'Consolas', 'Monaco', monospace;
        font-size: 12px;
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
      }

      #api-debug-panel.visible {
        transform: translateX(0);
      }

      .debug-panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px;
        background: #2d2d2d;
        border-bottom: 1px solid #444;
      }

      .debug-controls button {
        background: #007acc;
        color: white;
        border: none;
        padding: 5px 10px;
        margin-left: 5px;
        border-radius: 3px;
        cursor: pointer;
      }

      .debug-panel-tabs {
        display: flex;
        background: #252526;
        border-bottom: 1px solid #444;
      }

      .debug-panel-tabs .tab {
        background: transparent;
        border: none;
        color: #969696;
        padding: 10px 15px;
        cursor: pointer;
        border-bottom: 2px solid transparent;
      }

      .debug-panel-tabs .tab.active {
        color: #fff;
        border-bottom-color: #007acc;
      }

      .debug-panel-content {
        height: calc(100vh - 100px);
        overflow-y: auto;
        padding: 10px;
      }

      .request-filters {
        display: flex;
        gap: 10px;
        margin-bottom: 10px;
      }

      .request-filters input,
      .request-filters select {
        background: #2d2d2d;
        border: 1px solid #444;
        color: #d4d4d4;
        padding: 5px;
        border-radius: 3px;
      }

      .request-list {
        max-height: 400px;
        overflow-y: auto;
      }

      .request-item {
        background: #2d2d2d;
        border: 1px solid #444;
        border-radius: 3px;
        padding: 10px;
        margin-bottom: 5px;
        cursor: pointer;
      }

      .request-item:hover {
        background: #353535;
      }

      .request-item.error {
        border-color: #f14c4c;
      }

      .request-item.success {
        border-color: #4ec9b0;
      }

      .request-detail {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.9);
        z-index: 10001;
        overflow-y: auto;
        padding: 20px;
      }

      .request-detail.hidden {
        display: none;
      }

      .code-block {
        background: #2d2d2d;
        border: 1px solid #444;
        border-radius: 3px;
        padding: 15px;
        margin: 10px 0;
        overflow-x: auto;
        font-family: 'Consolas', 'Monaco', monospace;
        white-space: pre-wrap;
      }

      .json-format {
        color: #9cdcfe;
      }

      .json-key {
        color: #ce9178;
      }

      .json-string {
        color: #ce9178;
      }

      .json-number {
        color: #b5cea8;
      }

      .json-boolean {
        color: #569cd6;
      }

      .json-null {
        color: #808080;
      }
    `;

    document.head.appendChild(style);
  }

  // 显示面板
  show() {
    this.isVisible = true;
    this.panel.classList.add('visible');
  }

  // 隐藏面板
  hide() {
    this.isVisible = false;
    this.panel.classList.remove('visible');
  }

  // 更新调试面板
  updateDebugPanel() {
    const requestList = document.getElementById('request-list');
    const history = this.apiDebugger.getRequestHistory();

    requestList.innerHTML = history.map((item, index) => {
      const { request, response, error } = item;
      const status = error ? 'error' :
                     response?.status >= 200 && response?.status < 300 ? 'success' : 'warning';

      return `
        <div class="request-item ${status}" data-index="${index}">
          <div style="display: flex; justify-content: space-between;">
            <div>
              <strong>${request.method}</strong> ${request.url}
            </div>
            <div>
              ${error ? 'ERROR' : `${response.status} ${response.statusText}`}
              <span style="margin-left: 10px;">${(error ? error.duration : response.duration).toFixed(2)}ms</span>
            </div>
          </div>
          <div style="font-size: 10px; color: #808080; margin-top: 5px;">
            ${new Date(request.timestamp).toLocaleTimeString()}
          </div>
        </div>
      `;
    }).join('');

    // 添加点击事件
    requestList.querySelectorAll('.request-item').forEach(item => {
      item.addEventListener('click', () => {
        const index = parseInt(item.dataset.index);
        this.showRequestDetail(history[index]);
      });
    });
  }

  // 显示请求详情
  showRequestDetail(requestData) {
    const detailPanel = document.getElementById('request-detail');
    const { request, response, error } = requestData;

    const formatJSON = (obj) => {
      if (typeof obj === 'string') {
        try {
          obj = JSON.parse(obj);
        } catch (e) {
          return obj;
        }
      }

      return JSON.stringify(obj, null, 2)
        .replace(/"([^"]+)":/g, '<span class="json-key">"$1"</span>:')
        .replace(/: "([^"]*)"/g, ': <span class="json-string">"$1"</span>')
        .replace(/: (\d+)/g, ': <span class="json-number">$1</span>')
        .replace(/: (true|false)/g, ': <span class="json-boolean">$1</span>')
        .replace(/: null/g, ': <span class="json-null">null</span>');
    };

    detailPanel.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2>Request Details</h2>
        <button onclick="this.parentElement.parentElement.classList.add('hidden')"
                style="background: #007acc; color: white; border: none;
                       padding: 10px 20px; border-radius: 3px; cursor: pointer;">
          Close
        </button>
      </div>

      <div class="request-section">
        <h3>Request</h3>
        <div class="code-block">
          <strong>URL:</strong> ${request.url}<br>
          <strong>Method:</strong> ${request.method}<br>
          <strong>Timestamp:</strong> ${new Date(request.timestamp).toLocaleString()}
        </div>

        <h4>Headers</h4>
        <div class="code-block">
          ${formatJSON(request.headers)}
        </div>

        ${request.body ? `
          <h4>Body</h4>
          <div class="code-block">
            ${formatJSON(request.body)}
          </div>
        ` : ''}
      </div>

      ${error ? `
        <div class="error-section">
          <h3>Error</h3>
          <div class="code-block" style="border-color: #f14c4c;">
            <strong>Message:</strong> ${error.message}<br>
            <strong>Stack:</strong><br>
            ${error.stack?.replace(/\n/g, '<br>')}
          </div>
        </div>
      ` : response ? `
        <div class="response-section">
          <h3>Response</h3>
          <div class="code-block">
            <strong>Status:</strong> ${response.status} ${response.statusText}<br>
            <strong>Duration:</strong> ${response.duration.toFixed(2)}ms<br>
            <strong>Type:</strong> ${response.type}
          </div>

          <h4>Headers</h4>
          <div class="code-block">
            ${formatJSON(response.headers)}
          </div>

          <h4>Data</h4>
          <div class="code-block">
            ${formatJSON(response.data)}
          </div>
        </div>
      ` : ''}
    `;

    detailPanel.classList.remove('hidden');
  }
}
```

## API性能监控

### 实时性能分析

```javascript
// API性能监控系统
class APIPerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: [],
      performance: {},
      alerts: []
    };

    this.thresholds = {
      responseTime: 2000,      // 2秒
      errorRate: 0.05,         // 5%
      throughput: 100,         // 请求/秒
      concurrency: 50          // 并发数
    };

    this.startMonitoring();
  }

  // 开始监控
  startMonitoring() {
    this.setupRequestInterception();
    this.setupPerformanceObserver();
    this.startRealTimeMonitoring();
  }

  // 设置请求拦截
  setupRequestInterception() {
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      const startTime = performance.now();
      const url = args[0];
      const options = args[1] || {};

      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        const duration = endTime - startTime;

        // 记录性能指标
        this.recordRequest({
          url,
          method: options.method || 'GET',
          status: response.status,
          duration,
          size: this.getResponseSize(response),
          timestamp: startTime,
          success: response.ok
        });

        return response;

      } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;

        this.recordRequest({
          url,
          method: options.method || 'GET',
          status: 0,
          duration,
          timestamp: startTime,
          success: false,
          error: error.message
        });

        throw error;
      }
    };
  }

  // 记录请求
  recordRequest(requestData) {
    this.metrics.requests.push(requestData);

    // 保持最近1000个请求
    if (this.metrics.requests.length > 1000) {
      this.metrics.requests = this.metrics.requests.slice(-1000);
    }

    // 更新性能统计
    this.updatePerformanceStats();

    // 检查性能告警
    this.checkPerformanceAlerts(requestData);
  }

  // 更新性能统计
  updatePerformanceStats() {
    const recentRequests = this.metrics.requests.slice(-100);
    const timeWindow = 60000; // 1分钟

    const now = Date.now();
    const lastMinuteRequests = recentRequests.filter(
      req => now - req.timestamp < timeWindow
    );

    const stats = {
      totalRequests: lastMinuteRequests.length,
      successfulRequests: lastMinuteRequests.filter(req => req.success).length,
      failedRequests: lastMinuteRequests.filter(req => !req.success).length,
      averageResponseTime: this.calculateAverage(lastMinuteRequests, 'duration'),
      p95ResponseTime: this.calculatePercentile(lastMinuteRequests, 'duration', 95),
      p99ResponseTime: this.calculatePercentile(lastMinuteRequests, 'duration', 99),
      throughput: lastMinuteRequests.length / (timeWindow / 1000),
      errorRate: lastMinuteRequests.filter(req => !req.success).length / Math.max(lastMinuteRequests.length, 1)
    };

    this.metrics.performance = stats;
  }

  // 计算平均值
  calculateAverage(data, field) {
    if (data.length === 0) return 0;
    const sum = data.reduce((acc, item) => acc + (item[field] || 0), 0);
    return sum / data.length;
  }

  // 计算百分位数
  calculatePercentile(data, field, percentile) {
    if (data.length === 0) return 0;

    const sorted = data
      .map(item => item[field] || 0)
      .sort((a, b) => a - b);

    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  // 检查性能告警
  checkPerformanceAlerts(requestData) {
    const alerts = [];

    // 响应时间告警
    if (requestData.duration > this.thresholds.responseTime) {
      alerts.push({
        type: 'slow_response',
        severity: 'warning',
        message: `Slow response time: ${requestData.duration.toFixed(2)}ms for ${requestData.url}`,
        data: requestData
      });
    }

    // 错误率告警
    if (this.metrics.performance.errorRate > this.thresholds.errorRate) {
      alerts.push({
        type: 'high_error_rate',
        severity: 'error',
        message: `High error rate: ${(this.metrics.performance.errorRate * 100).toFixed(2)}%`,
        data: this.metrics.performance
      });
    }

    // 吞吐量告警
    if (this.metrics.performance.throughput < this.thresholds.throughput / 10) {
      alerts.push({
        type: 'low_throughput',
        severity: 'warning',
        message: `Low throughput: ${this.metrics.performance.throughput.toFixed(2)} req/s`,
        data: this.metrics.performance
      });
    }

    // 发送告警
    alerts.forEach(alert => this.sendAlert(alert));
  }

  // 发送告警
  sendAlert(alert) {
    console.warn('Performance Alert:', alert.message);

    // 可以集成到监控系统
    if (window.analytics) {
      window.analytics.track('api_performance_alert', alert);
    }

    // 保存告警记录
    this.metrics.alerts.push({
      ...alert,
      timestamp: Date.now()
    });

    // 保持最近100个告警
    if (this.metrics.alerts.length > 100) {
      this.metrics.alerts = this.metrics.alerts.slice(-100);
    }
  }

  // 生成性能报告
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      performance: this.metrics.performance,
      topSlowRequests: this.getTopSlowRequests(),
      errorAnalysis: this.getErrorAnalysis(),
      recommendations: this.generateRecommendations()
    };

    return report;
  }

  // 获取最慢的请求
  getTopSlowRequests(limit = 10) {
    return this.metrics.requests
      .filter(req => req.success)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit)
      .map(req => ({
        url: req.url,
        method: req.method,
        duration: req.duration,
        timestamp: new Date(req.timestamp).toISOString()
      }));
  }

  // 错误分析
  getErrorAnalysis() {
    const errorRequests = this.metrics.requests.filter(req => !req.success);
    const errorCounts = {};

    errorRequests.forEach(req => {
      const key = `${req.method} ${req.url}`;
      errorCounts[key] = (errorCounts[key] || 0) + 1;
    });

    return Object.entries(errorCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([endpoint, count]) => ({
        endpoint,
        count,
        percentage: (count / errorRequests.length * 100).toFixed(2)
      }));
  }

  // 生成优化建议
  generateRecommendations() {
    const recommendations = [];
    const stats = this.metrics.performance;

    if (stats.averageResponseTime > this.thresholds.responseTime / 2) {
      recommendations.push({
        priority: 'high',
        type: 'performance',
        message: 'Consider implementing response caching',
        details: `Average response time is ${stats.averageResponseTime.toFixed(2)}ms`
      });
    }

    if (stats.errorRate > this.thresholds.errorRate / 2) {
      recommendations.push({
        priority: 'high',
        type: 'reliability',
        message: 'Implement better error handling and retry mechanisms',
        details: `Error rate is ${(stats.errorRate * 100).toFixed(2)}%`
      });
    }

    if (stats.throughput > this.thresholds.throughput * 0.8) {
      recommendations.push({
        priority: 'medium',
        type: 'scaling',
        message: 'Consider scaling up backend resources',
        details: `Current throughput: ${stats.throughput.toFixed(2)} req/s`
      });
    }

    return recommendations;
  }

  // 开始实时监控
  startRealTimeMonitoring() {
    setInterval(() => {
      this.updatePerformanceStats();
      this.renderPerformanceChart();
    }, 5000); // 每5秒更新一次
  }

  // 渲染性能图表
  renderPerformanceChart() {
    // 这里可以集成Chart.js或其他图表库
    const chartContainer = document.getElementById('performance-chart');
    if (chartContainer) {
      // 渲染性能数据的图表
      this.renderChart(chartContainer);
    }
  }
}
```

## 自动化API测试

### 自动化测试框架

```javascript
// API自动化测试框架
class APITestFramework {
  constructor() {
    this.testSuites = new Map();
    this.testResults = [];
    this.config = {
      baseUrl: '',
      timeout: 5000,
      retryCount: 3,
      parallel: false
    };
  }

  // 设置配置
  configure(config) {
    this.config = { ...this.config, ...config };
  }

  // 创建测试套件
  createTestSuite(name) {
    const suite = new APITestSuite(name, this.config);
    this.testSuites.set(name, suite);
    return suite;
  }

  // 运行所有测试
  async runAllTests() {
    const results = [];

    for (const [name, suite] of this.testSuites) {
      console.log(`Running test suite: ${name}`);
      const suiteResult = await suite.run();
      results.push(suiteResult);
    }

    this.testResults = results;
    this.generateReport(results);

    return results;
  }

  // 运行特定测试套件
  async runTestSuite(suiteName) {
    const suite = this.testSuites.get(suiteName);
    if (!suite) {
      throw new Error(`Test suite '${suiteName}' not found`);
    }

    const result = await suite.run();
    this.testResults.push(result);
    return result;
  }

  // 生成测试报告
  generateReport(results) {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalSuites: results.length,
        passedSuites: results.filter(r => r.status === 'passed').length,
        failedSuites: results.filter(r => r.status === 'failed').length,
        totalTests: results.reduce((sum, r) => sum + r.totalTests, 0),
        passedTests: results.reduce((sum, r) => sum + r.passedTests, 0),
        failedTests: results.reduce((sum, r) => sum + r.failedTests, 0),
        duration: results.reduce((sum, r) => sum + r.duration, 0)
      },
      suites: results
    };

    this.displayReport(report);
    return report;
  }

  // 显示报告
  displayReport(report) {
    console.group('🧪 API Test Report');
    console.log('Summary:', report.summary);
    console.log('Suite Results:', report.suites);
    console.groupEnd();

    // 可以生成HTML报告或其他格式的报告
  }
}

// API测试套件
class APITestSuite {
  constructor(name, config) {
    this.name = name;
    this.config = config;
    this.tests = [];
    this.beforeEachCallbacks = [];
    this.afterEachCallbacks = [];
  }

  // 添加测试
  test(description, testFunction) {
    this.tests.push({
      description,
      testFunction,
      timeout: this.config.timeout
    });
  }

  // 添加前置回调
  beforeEach(callback) {
    this.beforeEachCallbacks.push(callback);
  }

  // 添加后置回调
  afterEach(callback) {
    this.afterEachCallbacks.push(callback);
  }

  // 运行测试套件
  async run() {
    const startTime = Date.now();
    const results = {
      suiteName: this.name,
      status: 'passed',
      totalTests: this.tests.length,
      passedTests: 0,
      failedTests: 0,
      testResults: [],
      duration: 0
    };

    for (const test of this.tests) {
      try {
        // 执行前置回调
        for (const callback of this.beforeEachCallbacks) {
          await callback();
        }

        // 执行测试
        const testResult = await this.runSingleTest(test);
        results.testResults.push(testResult);

        if (testResult.status === 'passed') {
          results.passedTests++;
        } else {
          results.failedTests++;
          results.status = 'failed';
        }

        // 执行后置回调
        for (const callback of this.afterEachCallbacks) {
          await callback();
        }

      } catch (error) {
        results.failedTests++;
        results.status = 'failed';
        results.testResults.push({
          description: test.description,
          status: 'error',
          error: error.message,
          duration: 0
        });
      }
    }

    results.duration = Date.now() - startTime;
    return results;
  }

  // 运行单个测试
  async runSingleTest(test) {
    const startTime = Date.now();

    try {
      const result = await Promise.race([
        test.testFunction(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Test timeout')), test.timeout)
        )
      ]);

      return {
        description: test.description,
        status: 'passed',
        result,
        duration: Date.now() - startTime
      };

    } catch (error) {
      return {
        description: test.description,
        status: 'failed',
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }
}

// 测试断言库
class APIAssertions {
  static assertEqual(actual, expected, message = '') {
    if (actual !== expected) {
      throw new Error(`Assertion failed: expected ${expected}, got ${actual}. ${message}`);
    }
  }

  static assertContains(haystack, needle, message = '') {
    if (!haystack.includes(needle)) {
      throw new Error(`Assertion failed: ${haystack} does not contain ${needle}. ${message}`);
    }
  }

  static assertStatus(response, expectedStatus, message = '') {
    if (response.status !== expectedStatus) {
      throw new Error(`Expected status ${expectedStatus}, got ${response.status}. ${message}`);
    }
  }

  static assertJSONStructure(data, expectedStructure, message = '') {
    for (const key in expectedStructure) {
      if (!(key in data)) {
        throw new Error(`Missing key '${key}' in response. ${message}`);
      }

      if (typeof expectedStructure[key] === 'object' && !Array.isArray(expectedStructure[key])) {
        this.assertJSONStructure(data[key], expectedStructure[key], message);
      }
    }
  }

  static async assertResponseTime(url, maxTime, message = '') {
    const startTime = Date.now();
    await fetch(url);
    const duration = Date.now() - startTime;

    if (duration > maxTime) {
      throw new Error(`Response time ${duration}ms exceeds maximum ${maxTime}ms. ${message}`);
    }
  }
}

// 使用示例
const testFramework = new APITestFramework();
testFramework.configure({
  baseUrl: 'https://api.example.com',
  timeout: 10000
});

const userAPISuite = testFramework.createTestSuite('User API Tests');

userAPISuite.test('GET /users should return list of users', async () => {
  const response = await fetch('/users');
  APIAssertions.assertStatus(response, 200);

  const data = await response.json();
  APIAssertions.assertJSONStructure(data, {
    users: [],
    pagination: {}
  });

  APIAssertions.assertContains(data.users[0].email, '@');
});

userAPISuite.test('POST /users should create new user', async () => {
  const newUser = {
    name: 'Test User',
    email: 'test@example.com'
  };

  const response = await fetch('/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(newUser)
  });

  APIAssertions.assertStatus(response, 201);

  const data = await response.json();
  APIAssertions.assertEqual(data.name, newUser.name);
  APIAssertions.assertEqual(data.email, newUser.email);
});

// 运行测试
testFramework.runAllTests();
```

## 总结

API调试是一个系统性的工程，需要掌握多种技术和工具：

1. **基础工具使用**：熟练使用浏览器开发者工具和调试插件
2. **高级调试技术**：请求拦截、断点调试、Mock数据
3. **性能监控**：实时监控API性能指标和异常
4. **自动化测试**：建立完善的API测试体系
5. **错误追踪**：快速定位和解决API问题

通过这些技术的综合应用，你可以大大提高API开发和调试的效率，确保API的稳定性和性能。记住，好的调试工具和方法论是高质量API开发的重要保障。

## 🧰 本章配套工具箱

边读边练：以下工具均在浏览器本地运行，数据不上传，可直接打开使用。

- [HTTP客户端](https://www.util.cn/tools/http-client/)：手发请求核对状态码与响应体
- [cURL转代码](https://www.util.cn/tools/curl-to-code/)：把 curl 复现命令转成工程代码
- [Postman集合转换器](https://www.util.cn/tools/postman-collection-converter/)：集合转成 cURL 等调试格式
- [HTTP响应模拟器](https://www.util.cn/tools/api-response-simulator/)：模拟延迟错误码验证前端容错
- [API契约测试器](https://www.util.cn/tools/api-contract-tester/)：按契约校验接口字段是否漂移
- [批量请求工具](https://www.util.cn/tools/bulk-request/)：小流量并发压测接口性能基线
