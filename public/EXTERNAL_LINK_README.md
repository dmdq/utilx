# 外链拦截器使用说明

## 功能概述

这个外链拦截器会拦截所有指向外部网站的链接，并显示一个确认页面，让用户确认后再跳转。这有助于：
- 提醒用户即将离开你的网站
- 增加用户安全意识
- 减少意外跳转
- 提供更好的用户体验

## 文件结构

```
public/
├── js/
│   ├── external-link-config.js     # 配置文件
│   └── external-link-interceptor.js # 主拦截器脚本
├── assets/css/
│   └── external-link-interceptor.css # 可选的自定义样式
├── external-link-test.html          # 测试页面
└── EXTERNAL_LINK_README.md          # 说明文件
```

## 配置方法

### 1. 基础配置

编辑 `js/external-link-config.js` 文件：

```javascript
window.EXTERNAL_LINK_CONFIG = {
  enabled: true, // 启用拦截器

  // 内部域名（不会被拦截）
  internalDomains: [
    'util.cn',
    'www.util.cn',
    'blog.util.cn'
  ],

  confirmPage: {
    title: '即将离开本站',
    message: '您即将访问外部链接，请确认是否继续：',
    cancelText: '取消',
    continueText: '继续访问',
    timer: 5 // 倒计时秒数
  }
};
```

### 2. Hugo集成

将以下代码添加到你的Hugo模板中（通常在 `layouts/_default/baseof.html`）：

```html
<!DOCTYPE html>
<html>
<head>
  <!-- 其他head内容 -->

  <!-- 外链拦截器配置 -->
  <script src="/js/external-link-config.js"></script>
</head>
<body>
  <!-- 页面内容 -->

  <!-- 外链拦截器 -->
  <script src="/js/external-link-interceptor.js"></script>
</body>
</html>
```

### 3. 自定义样式（可选）

如果你想要自定义拦截器的外观，可以：

1. 修改 `assets/css/external-link-interceptor.css`
2. 或者在你主CSS文件中添加覆盖样式

## 功能特性

### 🔍 智能识别
- 自动识别外部链接
- 支持子域名配置
- 智能处理协议和特殊链接

### 💾 智能缓存
- 记住用户的域名选择
- 可配置缓存过期时间
- 支持批量管理

### 📱 响应式设计
- 完美适配移动设备
- 支持触摸操作
- 优化的移动端体验

### 🎨 可定制外观
- 支持深色模式
- 可自定义颜色主题
- 平滑动画效果

### ♿ 无障碍支持
- 键盘导航支持
- 高对比度模式
- 减少动画模式

## 使用方法

### 普通用户
1. 点击外部链接
2. 在确认页面查看目标URL信息
3. 等待倒计时结束或直接点击"继续访问"
4. 选择是否记住该域名（勾选复选框）

### 开发者

#### 调试模式
在配置文件中启用调试：

```javascript
window.EXTERNAL_LINK_CONFIG = {
  debug: true, // 启用调试模式
  // ...
};
```

#### 控制台命令
在浏览器控制台中使用：

```javascript
// 查看统计信息
window.externalLinkInterceptor.getStats();

// 清除缓存
window.externalLinkInterceptor.clearCache();

// 添加内部域名
window.externalLinkInterceptor.addInternalDomain('example.com');

// 移除内部域名
window.externalLinkInterceptor.removeInternalDomain('example.com');

// 启用/禁用拦截器
window.externalLinkInterceptor.setEnabled(false);
```

#### 快捷键
- `Ctrl+Shift+E`: 显示调试信息和统计

## 测试

访问 `/external-link-test.html` 页面来测试拦截器功能。

该页面包含：
- 外部链接测试
- 内部链接测试
- 特殊情况测试（mailto、tel等）
- 控制面板

## 高级配置

### 1. 自定义确认页面

你可以通过JavaScript动态修改配置：

```javascript
// 运行时修改配置
window.externalLinkInterceptor.options.confirmPage.title = '自定义标题';
window.externalLinkInterceptor.options.confirmPage.timer = 10;
```

### 2. 监听拦截事件

```javascript
// 监听外部链接点击
document.addEventListener('click', (e) => {
  const link = e.target.closest('a');
  if (link && window.externalLinkInterceptor.isExternalLink(link.href)) {
    console.log('拦截了外部链接:', link.href);
  }
});
```

### 3. 统计分析

你可以集成Google Analytics来跟踪拦截器的使用情况：

```javascript
// 在拦截器中添加统计代码
gtag('event', 'external_link_intercepted', {
  'domain': new URL(url).hostname,
  'page': window.location.pathname
});
```

## 常见问题

### Q: 为什么有些链接没有被拦截？
A: 检查是否在 `internalDomains` 配置中，或者是否是特殊协议（如mailto、tel等）。

### Q: 如何让拦截器忽略特定链接？
A: 给链接添加 `data-no-intercept` 属性：
```html
<a href="https://example.com" data-no-intercept>这个链接不会被拦截</a>
```

### Q: 如何修改确认页面的样式？
A: 编辑 CSS文件或在主样式表中添加覆盖样式。

### Q: 缓存怎么清理？
A: 使用浏览器开发者工具清理localStorage，或者调用 `window.externalLinkInterceptor.clearCache()`。

## 安全考虑

- 使用 `rel="noopener noreferrer"` 安全属性
- 验证URL格式
- 防止XSS攻击
- 限制缓存时间和大小

## 浏览器兼容性

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+
- ⚠️ IE 11（部分功能）

## 许可证

MIT License - 可自由使用和修改。

## 更新日志

### v1.0.0
- 初始版本
- 基础拦截功能
- 响应式设计
- 缓存支持
- 无障碍支持