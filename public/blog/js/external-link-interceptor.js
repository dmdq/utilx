/**
 * 外链拦截器
 * 拦截所有外部链接，显示确认页面后再跳转
 */

class ExternalLinkInterceptor {
  constructor(options = {}) {
    this.options = {
      // 是否启用拦截器
      enabled: true,

      // 当前域名，用于判断是否为外部链接
      currentDomain: window.location.hostname,

      // 内部域名列表（这些域名不会被拦截）
      internalDomains: [],

      // 确认页面配置
      confirmPage: {
        title: '外链跳转提示',
        message: '您即将离开本站，访问外部链接：',
        confirmText: '继续访问',
        cancelText: '返回',
        securityNote: '请注意：外部网站的内容和安全性与本站无关',
        countdown: 10,
        rememberChoice: true,
        memoryExpiry: 24 * 60 * 60 * 1000
      },

      // 缓存配置
      cache: {
        enabled: true,
        expiry: 24 * 60 * 60 * 1000,
        keyPrefix: 'ext_link_cache_'
      },

      ...window.ExternalLinkConfig,
      ...options
    };

    this.init();
  }

  init() {
    if (!this.options.enabled) {
      return;
    }

    // 等待DOM加载完成
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.setupInterception();
      });
    } else {
      this.setupInterception();
    }
  }

  setupInterception() {
    // 使用事件委托来拦截所有外部链接
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href]');
      if (!link) return;

      const href = link.href;
      if (this.isExternalLink(href)) {
        e.preventDefault();
        this.showConfirmDialog(href);
      }
    });

    // 同时处理键盘事件（支持Enter键）
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const link = e.target.closest('a[href]');
        if (!link) return;

        const href = link.href;
        if (this.isExternalLink(href)) {
          e.preventDefault();
          this.showConfirmDialog(href);
        }
      }
    });
  }

  isExternalLink(url) {
    try {
      const urlObj = new URL(url);

      // 检查协议（只处理http和https）
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return false;
      }

      // 检查是否为当前域名
      if (urlObj.hostname === this.options.currentDomain) {
        return false;
      }

      // 检查是否在内部域名列表中
      if (this.options.internalDomains.includes(urlObj.hostname)) {
        return false;
      }

      return true;
    } catch (e) {
      // 如果URL解析失败，认为不是外部链接
      return false;
    }
  }

  showConfirmDialog(url) {
    // 检查缓存
    if (this.options.cache.enabled) {
      const cached = this.getCachedDecision(url);
      if (cached) {
        if (cached.decision === 'allow') {
          this.redirectTo(url);
          return;
        }
      }
    }

    // 检查记住的选择
    if (this.options.confirmPage.rememberChoice) {
      const remembered = this.getRememberedChoice(url);
      if (remembered) {
        this.redirectTo(url);
        return;
      }
    }

    // 创建确认对话框
    this.createConfirmDialog(url);
  }

  createConfirmDialog(url) {
    // 创建遮罩层
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 999998;
      display: flex;
      justify-content: center;
      align-items: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    // 创建对话框容器
    const dialog = document.createElement('div');
    dialog.style.cssText = `
      background: ${this.options.customStyles?.containerBackground || '#ffffff'};
      border-radius: 8px;
      padding: 2rem;
      max-width: 500px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      border: 1px solid ${this.options.customStyles?.borderColor || '#e5e7eb'};
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    `;

    // 对话框内容
    dialog.innerHTML = `
      <div style="text-align: center; margin-bottom: 1.5rem;">
        <div style="width: 48px; height: 48px; margin: 0 auto 1rem; background-color: #fef3c7; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 9V13" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"/>
            <circle cx="12" cy="16" r="1" fill="#f59e0b"/>
            <path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z" stroke="#f59e0b" stroke-width="2"/>
          </svg>
        </div>
        <h2 style="margin: 0; font-size: 1.5rem; color: #111827;">${this.options.confirmPage.title}</h2>
      </div>

      <div style="margin-bottom: 1.5rem;">
        <p style="margin: 0 0 0.5rem 0; color: #374151; line-height: 1.5;">${this.options.confirmPage.message}</p>
        <div style="background-color: #f3f4f6; padding: 0.75rem; border-radius: 6px; word-break: break-all;">
          <code style="color: #dc2626; font-size: 0.875rem;">${this.escapeHtml(url)}</code>
        </div>
      </div>

      <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 0.75rem; margin-bottom: 1.5rem;">
        <p style="margin: 0; color: #92400e; font-size: 0.875rem; line-height: 1.4;">
          ${this.options.confirmPage.securityNote}
        </p>
      </div>

      <div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
        <button id="cancel-btn" style="
          flex: 1;
          padding: 0.75rem 1rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          background-color: #ffffff;
          color: #374151;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.2s;
        " onmouseover="this.style.backgroundColor='#f9fafb'" onmouseout="this.style.backgroundColor='#ffffff'">
          ${this.options.confirmPage.cancelText}
        </button>

        <button id="confirm-btn" style="
          flex: 2;
          padding: 0.75rem 1rem;
          border: none;
          border-radius: 6px;
          background-color: ${this.options.customStyles?.primaryButtonColor || '#3b82f6'};
          color: white;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.2s;
        " onmouseover="this.style.backgroundColor='#2563eb'" onmouseout="this.style.backgroundColor='${this.options.customStyles?.primaryButtonColor || '#3b82f6'}'">
          ${this.options.confirmPage.confirmText}
          ${this.options.confirmPage.countdown > 0 ? '<span id="countdown">(' + this.options.confirmPage.countdown + ')</span>' : ''}
        </button>
      </div>

      ${this.options.confirmPage.rememberChoice ? `
        <label style="
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          font-size: 0.875rem;
          color: #6b7280;
        ">
          <input type="checkbox" id="remember-choice" style="margin: 0;">
          记住我的选择（24小时内有效）
        </label>
      ` : ''}
    `;

    // 添加到页面
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    // 倒计时功能
    let countdown = this.options.confirmPage.countdown;
    const countdownElement = dialog.querySelector('#countdown');
    const confirmBtn = dialog.querySelector('#confirm-btn');

    if (countdown > 0) {
      confirmBtn.disabled = true;
      confirmBtn.style.opacity = '0.5';
      confirmBtn.style.cursor = 'not-allowed';

      const timer = setInterval(() => {
        countdown--;
        if (countdownElement) {
          countdownElement.textContent = `(${countdown})`;
        }

        if (countdown <= 0) {
          clearInterval(timer);
          confirmBtn.disabled = false;
          confirmBtn.style.opacity = '1';
          confirmBtn.style.cursor = 'pointer';
          if (countdownElement) {
            countdownElement.style.display = 'none';
          }
        }
      }, 1000);
    }

    // 事件监听
    dialog.querySelector('#cancel-btn').addEventListener('click', () => {
      this.closeDialog(overlay);
    });

    confirmBtn.addEventListener('click', () => {
      if (countdown <= 0) {
        const rememberChoice = dialog.querySelector('#remember-choice')?.checked;

        if (rememberChoice) {
          this.rememberChoice(url);
        }

        if (this.options.cache.enabled) {
          this.cacheDecision(url, 'allow');
        }

        this.closeDialog(overlay);
        this.redirectTo(url);
      }
    });

    // 点击遮罩层关闭（可选）
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.closeDialog(overlay);
      }
    });

    // ESC键关闭
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        this.closeDialog(overlay);
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);

    // 聚焦到取消按钮（提高可访问性）
    dialog.querySelector('#cancel-btn').focus();
  }

  closeDialog(overlay) {
    if (overlay && overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
  }

  redirectTo(url) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // 缓存相关方法
  cacheDecision(url, decision) {
    if (!this.options.cache.enabled) return;

    const key = this.options.cache.keyPrefix + btoa(url);
    const data = {
      decision: decision,
      timestamp: Date.now()
    };

    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn('无法写入缓存:', e);
    }
  }

  getCachedDecision(url) {
    if (!this.options.cache.enabled) return null;

    const key = this.options.cache.keyPrefix + btoa(url);

    try {
      const data = JSON.parse(localStorage.getItem(key));
      if (!data) return null;

      // 检查缓存是否过期
      if (Date.now() - data.timestamp > this.options.cache.expiry) {
        localStorage.removeItem(key);
        return null;
      }

      return data;
    } catch (e) {
      console.warn('无法读取缓存:', e);
      return null;
    }
  }

  // 记住选择相关方法
  rememberChoice(url) {
    if (!this.options.confirmPage.rememberChoice) return;

    const key = 'ext_link_remember_' + btoa(url);
    const data = {
      timestamp: Date.now()
    };

    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn('无法记住选择:', e);
    }
  }

  getRememberedChoice(url) {
    if (!this.options.confirmPage.rememberChoice) return false;

    const key = 'ext_link_remember_' + btoa(url);

    try {
      const data = JSON.parse(localStorage.getItem(key));
      if (!data) return false;

      // 检查是否过期
      if (Date.now() - data.timestamp > this.options.confirmPage.memoryExpiry) {
        localStorage.removeItem(key);
        return false;
      }

      return true;
    } catch (e) {
      console.warn('无法读取记住的选择:', e);
      return false;
    }
  }

  // 清理过期缓存
  clearExpiredCache() {
    const now = Date.now();

    // 清理决策缓存
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.options.cache.keyPrefix)) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          if (data && now - data.timestamp > this.options.cache.expiry) {
            localStorage.removeItem(key);
          }
        } catch (e) {
          // 清理无效数据
          localStorage.removeItem(key);
        }
      }
    }

    // 清理记住的选择
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('ext_link_remember_')) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          if (data && now - data.timestamp > this.options.confirmPage.memoryExpiry) {
            localStorage.removeItem(key);
          }
        } catch (e) {
          // 清理无效数据
          localStorage.removeItem(key);
        }
      }
    }
  }
}

// 初始化外链拦截器
new ExternalLinkInterceptor();

// 可选：定期清理过期缓存
setInterval(() => {
  const interceptor = new ExternalLinkInterceptor();
  interceptor.clearExpiredCache();
}, 60 * 60 * 1000); // 每小时清理一次