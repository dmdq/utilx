/**
 * 外链拦截器
 * 拦截所有外部链接，显示确认页面后再跳转
 */

class ExternalLinkInterceptor {
  constructor(options = {}) {
    this.options = {
      // 是否启用拦截器
      enabled: true,
      // 当前域名（自动检测）
      currentDomain: window.location.hostname,
      // 需要排除的域名（认为是内链）
      internalDomains: [],
      // 确认页面配置
      confirmPage: {
        title: '即将离开本站',
        message: '您即将访问外部链接，请确认是否继续：',
        cancelText: '取消',
        continueText: '继续访问',
        timer: 10, // 自动跳转倒计时（秒）
        favicon: '/favicon.ico' // 确认页面的图标
      },
      // 缓存配置
      cache: {
        // 缓存确认过的域名（避免重复确认）
        enabled: true,
        // 缓存过期时间（毫秒）
        expiry: 24 * 60 * 60 * 1000 // 24小时
      },
      ...options
    };

    this.init();
  }

  init() {
    if (!this.options.enabled) return;

    this.setupEventListeners();
    this.createConfirmPage();
    this.loadCachedDomains();
  }

  // 设置事件监听器
  setupEventListeners() {
    // 使用事件委托处理所有链接点击
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (link && this.isExternalLink(link.href)) {
        e.preventDefault();
        this.handleExternalLink(link);
      }
    });

    // 处理右键菜单（可选）
    document.addEventListener('contextmenu', (e) => {
      const link = e.target.closest('a');
      if (link && this.isExternalLink(link.href)) {
        // 可以在这里添加右键菜单的处理逻辑
      }
    });
  }

  // 判断是否为外部链接
  isExternalLink(href) {
    if (!href) return false;

    try {
      const url = new URL(href);

      // 如果是不同的协议（如mailto:, tel:等）
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return false;
      }

      // 如果域名相同
      if (url.hostname === this.options.currentDomain) {
        return false;
      }

      // 检查是否在内部域名列表中
      if (this.options.internalDomains.includes(url.hostname)) {
        return false;
      }

      // 检查子域名
      if (url.hostname.endsWith('.' + this.options.currentDomain)) {
        return false;
      }

      return true;
    } catch (e) {
      console.warn('Invalid URL:', href);
      return false;
    }
  }

  // 处理外部链接点击
  handleExternalLink(link) {
    const url = new URL(link.href);

    // 检查是否已经确认过此域名
    if (this.options.cache.enabled && this.isDomainConfirmed(url.hostname)) {
      this.redirectTo(url.href);
      return;
    }

    // 显示确认页面
    this.showConfirmPage(url);
  }

  // 创建确认页面
  createConfirmPage() {
    const confirmPage = document.createElement('div');
    confirmPage.id = 'external-link-confirm';
    confirmPage.innerHTML = `
      <div class="confirm-overlay">
        <div class="confirm-dialog">
          <div class="confirm-header">
            <h2>${this.options.confirmPage.title}</h2>
          </div>

          <div class="confirm-content">
            <p class="confirm-message">${this.options.confirmPage.message}</p>
            <div class="external-url">
              <span class="url-label">目标网址：</span>
              <span class="url-value" id="target-url"></span>
            </div>
            <div class="url-info" id="url-info">
              <div class="info-item">
                <span class="info-label">域名：</span>
                <span class="info-value" id="domain-info"></span>
              </div>
              <div class="info-item">
                <span class="info-label">协议：</span>
                <span class="info-value" id="protocol-info"></span>
              </div>
            </div>
            <div class="security-warning">
              <svg class="warning-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <span>请确认这是一个安全的网站，您了解访问外部网站的风险。</span>
            </div>
          </div>

          <div class="confirm-actions">
            <button class="btn-cancel" id="btn-cancel">
              ${this.options.confirmPage.cancelText}
            </button>
            <button class="btn-continue" id="btn-continue">
              ${this.options.confirmPage.continueText}
              <span class="timer" id="timer"></span>
            </button>
          </div>

          <div class="confirm-options">
            <label class="checkbox-label">
              <input type="checkbox" id="remember-domain">
              <span>记住我的选择，今日不再提示此域名</span>
            </label>
          </div>
        </div>
      </div>
    `;

    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
      #external-link-confirm {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 999999;
        display: none;
      }

      .confirm-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(5px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }

      .confirm-dialog {
        background: white;
        border-radius: 12px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        max-width: 500px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        animation: slideIn 0.3s ease-out;
      }

      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .confirm-header {
        display: flex;
        align-items: center;
        padding: 24px 24px 16px;
        border-bottom: 1px solid #e5e7eb;
      }

      .site-icon {
        width: 32px;
        height: 32px;
        margin-right: 12px;
        border-radius: 4px;
      }

      .confirm-header h2 {
        margin: 0;
        font-size: 1.25rem;
        color: #1f2937;
        font-weight: 600;
      }

      .confirm-content {
        padding: 20px 24px;
      }

      .confirm-message {
        margin: 0 0 16px;
        color: #6b7280;
        line-height: 1.5;
      }

      .external-url {
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 16px;
      }

      .url-label {
        font-size: 0.875rem;
        color: #6b7280;
        margin-right: 8px;
      }

      .url-value {
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: 0.875rem;
        color: #1f2937;
        word-break: break-all;
        font-weight: 500;
      }

      .url-info {
        background: #f3f4f6;
        border-radius: 6px;
        padding: 12px;
        margin-bottom: 16px;
      }

      .info-item {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
      }

      .info-item:last-child {
        margin-bottom: 0;
      }

      .info-label {
        font-size: 0.875rem;
        color: #6b7280;
      }

      .info-value {
        font-size: 0.875rem;
        color: #1f2937;
        font-weight: 500;
      }

      .security-warning {
        display: flex;
        align-items: center;
        gap: 8px;
        background: #fef3c7;
        border: 1px solid #f59e0b;
        border-radius: 6px;
        padding: 12px;
        color: #92400e;
        font-size: 0.875rem;
      }

      .warning-icon {
        color: #f59e0b;
        flex-shrink: 0;
      }

      .confirm-actions {
        display: flex;
        gap: 12px;
        padding: 16px 24px;
        border-top: 1px solid #e5e7eb;
      }

      .btn-cancel,
      .btn-continue {
        flex: 1;
        padding: 10px 16px;
        border: none;
        border-radius: 6px;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }

      .btn-cancel {
        background: #f9fafb;
        color: #6b7280;
        border: 1px solid #e5e7eb;
      }

      .btn-cancel:hover {
        background: #f3f4f6;
      }

      .btn-continue {
        background: #3b82f6;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }

      .btn-continue:hover {
        background: #2563eb;
      }

      .btn-continue:disabled {
        background: #9ca3af;
        cursor: not-allowed;
      }

      .timer {
        font-size: 0.75rem;
        background: rgba(255, 255, 255, 0.2);
        padding: 2px 6px;
        border-radius: 4px;
      }

      .confirm-options {
        padding: 16px 24px;
        border-top: 1px solid #f3f4f6;
      }

      .checkbox-label {
        display: flex;
        align-items: center;
        font-size: 0.875rem;
        color: #6b7280;
        cursor: pointer;
      }

      .checkbox-label input[type="checkbox"] {
        margin-right: 8px;
      }

      /* 移动端适配 */
      @media (max-width: 640px) {
        .confirm-overlay {
          padding: 10px;
        }

        .confirm-dialog {
          margin: 0;
          border-radius: 8px;
        }

        .confirm-header {
          padding: 20px 20px 12px;
        }

        .confirm-content {
          padding: 16px 20px;
        }

        .confirm-actions {
          padding: 12px 20px;
          flex-direction: column;
        }

        .btn-cancel,
        .btn-continue {
          width: 100%;
        }
      }

      /* 深色模式支持 */
      @media (prefers-color-scheme: dark) {
        #external-link-confirm {
          color-scheme: dark;
        }

        .confirm-dialog {
          background: #1f2937;
          color: #f9fafb;
        }

        .confirm-header {
          border-bottom-color: #374151;
        }

        .confirm-header h2 {
          color: #f9fafb;
        }

        .external-url {
          background: #374151;
          border-color: #4b5563;
        }

        .url-value {
          color: #f9fafb;
        }

        .url-info {
          background: #374151;
        }

        .btn-cancel {
          background: #374151;
          color: #f9fafb;
          border-color: #4b5563;
        }

        .btn-cancel:hover {
          background: #4b5563;
        }

        .checkbox-label {
          color: #9ca3af;
        }
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(confirmPage);

    this.confirmPage = confirmPage;
    this.setupConfirmPageEvents();
  }

  // 设置确认页面事件
  setupConfirmPageEvents() {
    const cancelBtn = document.getElementById('btn-cancel');
    const continueBtn = document.getElementById('btn-continue');
    const rememberCheckbox = document.getElementById('remember-domain');
    let timerInterval = null;

    cancelBtn.addEventListener('click', () => {
      this.hideConfirmPage();
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    });

    continueBtn.addEventListener('click', () => {
      this.handleContinue(rememberCheckbox.checked);
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    });

    // ESC键关闭
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.confirmPage.style.display === 'block') {
        this.hideConfirmPage();
        if (timerInterval) {
          clearInterval(timerInterval);
        }
      }
    });
  }

  // 显示确认页面
  showConfirmPage(url) {
    const targetUrlElement = document.getElementById('target-url');
    const domainInfoElement = document.getElementById('domain-info');
    const protocolInfoElement = document.getElementById('protocol-info');
    const continueBtn = document.getElementById('btn-continue');
    const timerElement = document.getElementById('timer');

    // 更新URL信息
    targetUrlElement.textContent = url.href;
    domainInfoElement.textContent = url.hostname;
    protocolInfoElement.textContent = url.protocol.replace(':', '');

    // 显示确认页面
    this.confirmPage.style.display = 'block';
    this.currentUrl = url.href;
    this.currentDomain = url.hostname;

    // 禁用继续按钮并开始倒计时
    continueBtn.disabled = true;
    let secondsLeft = this.options.confirmPage.timer;

    const updateTimer = () => {
      timerElement.textContent = `(${secondsLeft}s)`;
      secondsLeft--;

      if (secondsLeft < 0) {
        clearInterval(timerInterval);
        timerElement.textContent = '';
        continueBtn.disabled = false;
      }
    };

    updateTimer();
    const timerInterval = setInterval(updateTimer, 1000);

    // 禁止页面滚动
    document.body.style.overflow = 'hidden';
  }

  // 隐藏确认页面
  hideConfirmPage() {
    this.confirmPage.style.display = 'none';
    document.body.style.overflow = '';

    // 重置表单
    const rememberCheckbox = document.getElementById('remember-domain');
    if (rememberCheckbox) {
      rememberCheckbox.checked = false;
    }
  }

  // 处理继续操作
  handleContinue(rememberDomain) {
    if (rememberDomain && this.options.cache.enabled) {
      this.cacheDomain(this.currentDomain);
    }

    this.hideConfirmPage();
    this.redirectTo(this.currentUrl);
  }

  // 重定向到目标URL
  redirectTo(url) {
    // 使用 window.open 在新标签页打开
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  // 缓存已确认的域名
  cacheDomain(domain) {
    const cacheKey = 'external-link-confirm-cache';
    const cache = JSON.parse(localStorage.getItem(cacheKey) || '{}');

    cache[domain] = {
      timestamp: Date.now(),
      expires: Date.now() + this.options.cache.expiry
    };

    localStorage.setItem(cacheKey, JSON.stringify(cache));
  }

  // 检查域名是否已确认
  isDomainConfirmed(domain) {
    const cacheKey = 'external-link-confirm-cache';
    const cache = JSON.parse(localStorage.getItem(cacheKey) || '{}');

    if (cache[domain]) {
      return cache[domain].expires > Date.now();
    }

    return false;
  }

  // 加载缓存的域名
  loadCachedDomains() {
    // 可以在这里清理过期的缓存
    const cacheKey = 'external-link-confirm-cache';
    const cache = JSON.parse(localStorage.getItem(cacheKey) || '{}');

    let cleaned = false;
    Object.keys(cache).forEach(domain => {
      if (cache[domain].expires <= Date.now()) {
        delete cache[domain];
        cleaned = true;
      }
    });

    if (cleaned) {
      localStorage.setItem(cacheKey, JSON.stringify(cache));
    }
  }

  // 清除所有缓存
  clearCache() {
    localStorage.removeItem('external-link-confirm-cache');
  }

  // 添加内部域名
  addInternalDomain(domain) {
    if (!this.options.internalDomains.includes(domain)) {
      this.options.internalDomains.push(domain);
    }
  }

  // 移除内部域名
  removeInternalDomain(domain) {
    const index = this.options.internalDomains.indexOf(domain);
    if (index > -1) {
      this.options.internalDomains.splice(index, 1);
    }
  }

  // 启用/禁用拦截器
  setEnabled(enabled) {
    this.options.enabled = enabled;
  }

  // 获取统计信息
  getStats() {
    const cacheKey = 'external-link-confirm-cache';
    const cache = JSON.parse(localStorage.getItem(cacheKey) || '{}');

    return {
      cachedDomains: Object.keys(cache).length,
      currentDomain: this.options.currentDomain,
      internalDomains: this.options.internalDomains.length,
      enabled: this.options.enabled
    };
  }
}

// 自动初始化
document.addEventListener('DOMContentLoaded', () => {
  // 配置选项
  const options = {
    // 可以根据需要调整配置
    internalDomains: [
      // 添加你的子域名
      // 'blog.example.com',
      // 'docs.example.com',
    ],
    confirmPage: {
      timer: 5, // 5秒倒计时
      // 可以自定义文本
      title: '即将离开本站',
      message: '您即将访问外部链接，请确认是否继续：',
      cancelText: '取消',
      continueText: '继续访问'
    }
  };

  window.externalLinkInterceptor = new ExternalLinkInterceptor(options);

  // 将实例暴露到全局，方便调试
  console.log('External Link Interceptor initialized');
  console.log('Stats:', window.externalLinkInterceptor.getStats());
});

// 导出类，方便在其他地方使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ExternalLinkInterceptor;
}