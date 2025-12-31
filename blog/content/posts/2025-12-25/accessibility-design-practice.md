---
title: "Web可访问性设计实践：构建人人可用的数字产品"
summary: "深入探讨Web可访问性（a11y）的核心原则、技术实现和测试方法，帮助你构建对所有人都友好的、符合WCAG标准的无障碍网站。"
date: 2025-12-25T17:30:00+08:00
draft: false
tags: ["可访问性", "a11y", "无障碍", "WCAG", "包容性设计"]
categories: ["前端开发"]
author: "有条工具团队"
---

可访问性（Accessibility，简称a11y）确保残障人士也能有效使用Web。这不仅关乎社会责任，也是法律要求，更能提升所有用户的体验。

## WCAG 2.1核心原则

### POUR原则

```python
"""
WCAG 2.1四大原则（POUR）：

┌─────────────────────────────────────────────────────────────┐
│ P - Perceivable 可感知性                                    │
│     信息和UI组件必须以用户能够感知的方式呈现                │
│     - 文本替代：为非文本内容提供替代                        │
│     - 时基媒体：提供字幕和描述                              │
│     - 可适应性：内容可以不同方式呈现                        │
│     - 可辨别性：更容易看到和听到内容                        │
├─────────────────────────────────────────────────────────────┤
│ O - Operable 可操作性                                       │
│     UI组件和导航必须可操作                                  │
│     - 键盘可访问：所有功能都可通过键盘使用                  │
│     - 足够时间：提供足够时间完成任务                        │
│     - 癫痫和身体反应：不设计导致癫痫的内容                 │
│     - 导航性：帮助用户导航和查找内容                        │
├─────────────────────────────────────────────────────────────┤
│ U - Understandable 可理解性                                 │
│     信息和UI操作必须可理解                                  │
│     - 可读性：使文本内容可读可理解                          │
│     - 可预测性：使页面以可预测的方式出现和操作              │
│     - 输入协助：帮助用户避免和纠正错误                      │
├─────────────────────────────────────────────────────────────┤
│ R - Robust 健壮性                                           │
│     内容必须足够健壮，能被各种用户代理（包括AT）可靠地解释  │
│     - 兼容性：最大化与当前和未来用户代理的兼容性            │
└─────────────────────────────────────────────────────────────┘
"""

class WCAGChecker:
    """WCAG合规性检查"""

    def check_aa_compliance(self):
        """
        WCAG 2.1 AA级别要求
        """
        return {
            "contrast": {
                "normal_text": "至少4.5:1",
                "large_text": "至少3:1",
                "ui_components": "至少3:1"
            },
            "touch_target": {
                "min_size": "至少44x44 CSS像素"
            },
            "error_identification": "必须识别错误",
            "labels_or_instructions": "必须提供标签或说明",
            "focus_visible": "焦点指示器必须可见"
        }

    def check_success_criteria(self, page_content: str) -> dict:
        """检查成功标准"""
        results = {
            "images_alt": self.check_images_alt(page_content),
            "heading_hierarchy": self.check_headings(page_content),
            "form_labels": self.check_form_labels(page_content),
            "color_contrast": self.check_contrast(page_content),
            "keyboard_access": self.check_keyboard_nav(page_content)
        }

        overall_score = sum(
            1 for v in results.values() if v["pass"]
        ) / len(results)

        return {
            "checks": results,
            "overall_score": overall_score,
            "level": "AA" if overall_score >= 0.9 else "A" if overall_score >= 0.7 else "不合规"
        }
```

## 语义化HTML

### 正确的HTML结构

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <!-- 页面语言声明 - 帮助屏幕阅读器选择发音 -->
    <html lang="zh-CN">

    <!-- 跳过导航链接 -->
    <style>
        .skip-link {
            position: absolute;
            top: -40px;
            left: 0;
            background: #000;
            color: #fff;
            padding: 8px;
            text-decoration: none;
            z-index: 100;
        }

        .skip-link:focus {
            top: 0;
        }
    </style>
</head>
<body>
    <!-- 跳过导航链接 - 让键盘用户跳过重复内容 -->
    <a href="#main-content" class="skip-link">跳到主内容</a>

    <!-- 页面头部 -->
    <header role="banner">
        <nav aria-label="主导航">
            <ul>
                <li><a href="/" aria-current="page">首页</a></li>
                <li><a href="/about">关于</a></li>
                <li><a href="/contact">联系</a></li>
            </ul>
        </nav>
    </header>

    <!-- 主要内容 -->
    <main id="main-content" role="main">
        <!-- 文章标题 -->
        <h1>文章标题</h1>

        <!-- 文章内容 -->
        <article>
            <h2>章节标题</h2>
            <p>段落内容...</p>
        </article>
    </main>

    <!-- 侧边栏 -->
    <aside aria-label="相关链接">
        <h2>相关内容</h2>
        <ul>
            <li><a href="/link1">链接1</a></li>
            <li><a href="/link2">链接2</a></li>
        </ul>
    </aside>

    <!-- 页脚 -->
    <footer role="contentinfo">
        <p>&copy; 2024 公司名称</p>
    </footer>
</body>
</html>
```

### ARIA属性使用

```html
<!-- 1. 地标角色（Landmark Roles） -->
<div role="banner">页头</div>
<div role="navigation">导航</div>
<div role="main">主要内容</div>
<div role="complementary">侧边栏</div>
<div role="contentinfo">页脚</div>

<!-- 2. 动态内容更新 -->
<div id="live-region" aria-live="polite" aria-atomic="true">
    <!-- 内容更新时屏幕阅读器会通知用户 -->
</div>

<div id="alert-region" aria-live="assertive">
    <!-- 紧急通知，立即打断用户 -->
</div>

<!-- 3. 可展开/折叠内容 -->
<button aria-expanded="false" aria-controls="menu1">
    显示菜单
</button>
<ul id="menu1" hidden>
    <li>选项1</li>
    <li>选项2</li>
</ul>

<!-- 4. 模态对话框 -->
<div
    role="dialog"
    aria-modal="true"
    aria-labelledby="dialog-title"
    aria-describedby="dialog-description">
    <h2 id="dialog-title">对话框标题</h2>
    <p id="dialog-description">对话框说明</p>
    <button>关闭</button>
</div>

<!-- 5. 标签页 -->
<div role="tablist">
    <button
        role="tab"
        aria-selected="true"
        aria-controls="panel1"
        id="tab1">
        标签1
    </button>
    <button
        role="tab"
        aria-selected="false"
        aria-controls="panel2"
        id="tab2">
        标签2
    </button>
</div>

<div
    role="tabpanel"
    id="panel1"
    aria-labelledby="tab1">
    面板1内容
</div>

<div
    role="tabpanel"
    id="panel2"
    aria-labelledby="tab2"
    hidden>
    面板2内容
</div>

<!-- 6. 进度指示器 -->
<div
    role="progressbar"
    aria-valuenow="75"
    aria-valuemin="0"
    aria-valuemax="100"
    aria-label="下载进度">
    75%
</div>

<!-- 7. 加载状态 -->
<div role="status" aria-live="polite">
    <span aria-hidden="true">⏳</span>
    <span>加载中...</span>
</div>
```

## 键盘可访问性

### 焦点管理

```css
/**
 * 焦点样式
 */

/* 可见的焦点指示器 - WCAG要求 */
:focus {
    outline: 3px solid #3b82f6;
    outline-offset: 2px;
}

/* 更明显的焦点样式 */
.focus-visible:focus {
    outline: 3px solid #3b82f6;
    outline-offset: 2px;
    box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.3);
}

/* 移除默认样式，然后添加自定义样式 */
.custom-focus {
    outline: none;
}

.custom-focus:focus {
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
}

/* 跳过链接样式 */
.skip-link {
    position: absolute;
    top: -100%;
    left: 16px;
    padding: 8px 16px;
    background: #000;
    color: #fff;
    text-decoration: none;
    z-index: 9999;
}

.skip-link:focus {
    top: 8px;
}

/* 焦点陷阱（模态框） */
.modal:focus-within {
    /* 确保焦点在模态框内循环 */
}
```

```javascript
/**
 * 键盘导航实现
 */

// 1. 焦点陷阱（用于模态框）
class FocusTrap {
    constructor(element) {
        this.element = element;
        this.focusableElements = null;
        this.firstFocusable = null;
        this.lastFocusable = null;
        this.previousActiveElement = null;
    }

    activate() {
        // 保存当前焦点元素
        this.previousActiveElement = document.activeElement;

        // 获取所有可聚焦元素
        this.focusableElements = this.element.querySelectorAll(
            'a[href], button:not([disabled]), textarea:not([disabled]), ' +
            'input[type="text"]:not([disabled]), input[type="radio"]:not([disabled]), ' +
            'input[type="checkbox"]:not([disabled]), select:not([disabled]), ' +
            '[tabindex]:not([tabindex="-1"])'
        );

        this.firstFocusable = this.focusableElements[0];
        this.lastFocusable = this.focusableElements[this.focusableElements.length - 1];

        // 聚焦到第一个元素
        this.firstFocusable.focus();

        // 添加键盘事件监听
        this.element.addEventListener('keydown', this.handleKeyDown);
    }

    deactivate() {
        this.element.removeEventListener('keydown', this.handleKeyDown);

        // 恢复之前的焦点
        if (this.previousActiveElement) {
            this.previousActiveElement.focus();
        }
    }

    handleKeyDown = (e) => {
        if (e.key === 'Tab') {
            if (e.shiftKey) {
                // Shift + Tab
                if (document.activeElement === this.firstFocusable) {
                    e.preventDefault();
                    this.lastFocusable.focus();
                }
            } else {
                // Tab
                if (document.activeElement === this.lastFocusable) {
                    e.preventDefault();
                    this.firstFocusable.focus();
                }
            }
        }

        // Esc键关闭
        if (e.key === 'Escape') {
            this.deactivate();
        }
    }
}

// 2. 箭头键导航（用于列表、菜单等）
class ArrowKeyNavigation {
    constructor(container, options = {}) {
        this.container = container;
        this.selector = options.selector || '[role="menuitem"]';
        this.loop = options.loop || false;
        this.orientation = options.orientation || 'vertical';
        this.init();
    }

    init() {
        this.items = Array.from(this.container.querySelectorAll(this.selector));

        this.container.addEventListener('keydown', (e) => {
            const currentIndex = this.items.indexOf(document.activeElement);

            if (currentIndex === -1) return;

            let nextIndex;

            if (this.orientation === 'vertical') {
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    nextIndex = currentIndex + 1;
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    nextIndex = currentIndex - 1;
                }
            } else {
                if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    nextIndex = currentIndex + 1;
                } else if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    nextIndex = currentIndex - 1;
                }
            }

            if (nextIndex !== undefined) {
                if (this.loop) {
                    nextIndex = (nextIndex + this.items.length) % this.items.length;
                } else {
                    nextIndex = Math.max(0, Math.min(nextIndex, this.items.length - 1));
                }

                this.items[nextIndex].focus();
            }

            // Home/End键
            if (e.key === 'Home') {
                e.preventDefault();
                this.items[0].focus();
            } else if (e.key === 'End') {
                e.preventDefault();
                this.items[this.items.length - 1].focus();
            }
        });
    }
}
```

## 颜色和对比度

### 对比度检查

```javascript
/**
 * 颜色对比度计算
 * WCAG AA级别要求：
 * - 普通文本：至少4.5:1
 * - 大文本（18pt+或14pt+粗体）：至少3:1
 * - UI组件：至少3:1
 */
class ColorContrast {
    /**
     * 计算相对亮度
     */
    static getLuminance(r, g, b) {
        const [rs, gs, bs] = [r, g, b].map(c => {
            c = c / 255;
            return c <= 0.03928
                ? c / 12.92
                : Math.pow((c + 0.055) / 1.055, 2.4);
        });

        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    }

    /**
     * 计算对比度
     */
    static getContrastRatio(color1, color2) {
        const lum1 = this.getLuminance(...color1);
        const lum2 = this.getLuminance(...color2);

        const lighter = Math.max(lum1, lum2);
        const darker = Math.min(lum1, lum2);

        return (lighter + 0.05) / (darker + 0.05);
    }

    /**
     * 检查对比度是否符合WCAG标准
     */
    static checkContrast(foreground, background, isLargeText = false) {
        const ratio = this.getContrastRatio(foreground, background);

        const requirements = isLargeText
            ? { AA: 3.0, AAA: 4.5 }
            : { AA: 4.5, AAA: 7.0 };

        return {
            ratio: ratio.toFixed(2),
            AA: ratio >= requirements.AA,
            AAA: ratio >= requirements.AAA,
            pass: ratio >= requirements.AA
        };
    }

    /**
     * 解析颜色为RGB
     */
    static parseColor(color) {
        // 十六进制颜色
        if (color.startsWith('#')) {
            const hex = color.slice(1);

            if (hex.length === 3) {
                return [
                    parseInt(hex[0] + hex[0], 16),
                    parseInt(hex[1] + hex[1], 16),
                    parseInt(hex[2] + hex[2], 16)
                ];
            } else if (hex.length === 6) {
                return [
                    parseInt(hex.slice(0, 2), 16),
                    parseInt(hex.slice(2, 4), 16),
                    parseInt(hex.slice(4, 6), 16)
                ];
            }
        }

        // rgb()格式
        const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (rgbMatch) {
            return [
                parseInt(rgbMatch[1]),
                parseInt(rgbMatch[2]),
                parseInt(rgbMatch[3])
            ];
        }

        throw new Error(`无法解析颜色: ${color}`);
    }
}

// 使用示例
const foreground = ColorContrast.parseColor('#3b82f6');
const background = ColorContrast.parseColor('#ffffff');

const result = ColorContrast.checkContrast(foreground, background);
console.log(result);
// { ratio: "5.12", AA: true, AAA: false, pass: true }
```

### 不依赖颜色的信息传达

```css
/**
 * 除了颜色外，还需要其他方式传达信息
 */

/* 不好的做法：只用颜色表示错误 */
.error-bad {
    color: red;
}

/* 好的做法：使用图标+颜色 */
.error-good {
    color: #ef4444;
    position: relative;
    padding-left: 24px;
}

.error-good::before {
    content: "✖";
    position: absolute;
    left: 0;
    font-weight: bold;
}

/* 表单验证 */
input.invalid {
    border: 2px solid #ef4444;
}

input.invalid + label::after {
    content: " (必填)";
    color: #ef4444;
}

input.valid {
    border: 2px solid #10b981;
}

input.valid + label::after {
    content: " ✓";
    color: #10b981;
}

/* 链接样式 - 不仅依赖颜色 */
a {
    color: #3b82f6;
    text-decoration: underline;
}

a:hover,
a:focus {
    color: #1d4ed8;
    text-decoration: none;
    background-color: #dbeafe;
}

/* 焦点可见性 - 对低视力用户很重要 */
a:focus {
    outline: 3px solid #3b82f6;
    outline-offset: 2px;
}
```

## 表单可访问性

### 表单标签和错误提示

```html
<!-- 1. 正确的表单标签 -->
<form>
    <!-- 显式关联 -->
    <label for="email">邮箱：</label>
    <input
        type="email"
        id="email"
        name="email"
        required
        aria-required="true">

    <!-- 隐式关联（不推荐） -->
    <label>
        密码：
        <input type="password" name="password">
    </label>

    <!-- 带描述的表单字段 -->
    <label for="password">密码</label>
    <input
        type="password"
        id="password"
        name="password"
        aria-describedby="password-help"
        aria-required="true">
    <small id="password-help">
        密码至少8个字符，包含字母和数字
    </small>

    <!-- 单选按钮组 -->
    <fieldset>
        <legend>选择性别：</legend>
        <label>
            <input type="radio" name="gender" value="male">
            男
        </label>
        <label>
            <input type="radio" name="gender" value="female">
            女
        </label>
    </fieldset>

    <!-- 复选框组 -->
    <fieldset>
        <legend>选择兴趣：</legend>
        <label>
            <input type="checkbox" name="interest" value="sports">
            运动
        </label>
        <label>
            <input type="checkbox" name="interest" value="music">
            音乐
        </label>
    </fieldset>
</form>

<!-- 2. 错误提示 -->
<form>
    <label for="email">邮箱：</label>
    <input
        type="email"
        id="email"
        name="email"
        required
        aria-invalid="false"
        aria-describedby="email-error">
    <span id="email-error" role="alert" aria-live="assertive">
        请输入有效的邮箱地址
    </span>
</form>

<!-- 3. 搜索表单 -->
<form role="search">
    <label for="search" class="visually-hidden">搜索：</label>
    <input
        type="search"
        id="search"
        name="q"
        placeholder="搜索..."
        aria-label="搜索">
    <button type="submit" aria-label="搜索">🔍</button>
</form>

<style>
/* 视觉隐藏但屏幕阅读器可访问 */
.visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
}
</style>
```

```javascript
/**
 * 可访问的表单验证
 */
class AccessibleForm {
    constructor(form) {
        this.form = form;
        this.init();
    }

    init() {
        this.form.addEventListener('submit', (e) => {
            this.handleSubmit(e);
        });

        // 实时验证
        this.form.querySelectorAll('input, select, textarea').forEach(field => {
            field.addEventListener('blur', () => {
                this.validateField(field);
            });

            field.addEventListener('input', () => {
                // 清除之前的错误
                if (field.getAttribute('aria-invalid') === 'true') {
                    this.clearFieldError(field);
                }
            });
        });
    }

    validateField(field) {
        const error = this.getFieldError(field);

        if (error) {
            this.showFieldError(field, error);
            return false;
        }

        this.clearFieldError(field);
        return true;
    }

    getFieldError(field) {
        if (field.required && !field.value) {
            return '此字段为必填';
        }

        if (field.type === 'email' && field.value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(field.value)) {
                return '请输入有效的邮箱地址';
            }
        }

        // 自定义验证
        const min = field.getAttribute('minlength');
        if (min && field.value.length < parseInt(min)) {
            return `至少需要${min}个字符`;
        }

        return null;
    }

    showFieldError(field, message) {
        field.setAttribute('aria-invalid', 'true');

        let errorElement = document.getElementById(`${field.id}-error`);

        if (!errorElement) {
            errorElement = document.createElement('span');
            errorElement.id = `${field.id}-error`;
            errorElement.className = 'error-message';
            errorElement.setAttribute('role', 'alert');
            errorElement.setAttribute('aria-live', 'assertive');

            field.parentNode.insertBefore(errorElement, field.nextSibling);
        }

        errorElement.textContent = message;
        field.setAttribute('aria-describedby', `${field.id}-error`);
    }

    clearFieldError(field) {
        field.setAttribute('aria-invalid', 'false');

        const errorElement = document.getElementById(`${field.id}-error`);
        if (errorElement) {
            errorElement.remove();
        }

        field.removeAttribute('aria-describedby');
    }

    handleSubmit(e) {
        const fields = this.form.querySelectorAll('input, select, textarea');
        let isValid = true;
        let firstInvalid = null;

        fields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
                if (!firstInvalid) {
                    firstInvalid = field;
                }
            }
        });

        if (!isValid) {
            e.preventDefault();

            // 聚焦到第一个错误字段
            if (firstInvalid) {
                firstInvalid.focus();

                // 滚动到错误位置
                firstInvalid.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }

            // 显示总体错误消息
            this.showFormError();
        }
    }

    showFormError() {
        let alertElement = this.form.querySelector('[role="alert"]');

        if (!alertElement) {
            alertElement = document.createElement('div');
            alertElement.setAttribute('role', 'alert');
            alertElement.className = 'form-error';
            this.form.insertBefore(alertElement, this.form.firstChild);
        }

        alertElement.textContent = '请修正表单中的错误后重新提交';
    }
}
```

## 可访问性测试

```javascript
/**
 * 自动化可访问性测试
 */

// 使用axe-core进行测试
import axe from 'axe-core';

async function runAccessibilityTests() {
    const results = await axe.run(document, {
        runOnly: {
            type: 'tag',
            values: ['wcag2a', 'wcag2aa', 'wcag21aa']
        }
    });

    if (results.violations.length === 0) {
        console.log('✅ 没有发现可访问性问题');
    } else {
        console.log('❌ 发现可访问性问题：');

        results.violations.forEach(violation => {
            console.log(`\n${violation.id}: ${violation.description}`);
            console.log(`影响: ${violation.impact}`);
            console.log('问题元素:', violation.nodes.map(n => n.html));
        });
    }

    return results;
}

// 键盘导航测试
function testKeyboardNavigation() {
    const focusableElements = document.querySelectorAll(
        'a[href], button:not([disabled]), ' +
        'textarea:not([disabled]), ' +
        'input:not([disabled]), ' +
        'select:not([disabled])'
    );

    const issues = [];

    focusableElements.forEach((el, index) => {
        // 测试是否可以聚焦
        el.focus();

        if (document.activeElement !== el) {
            issues.push({
                element: el,
                issue: '元素无法通过键盘聚焦',
                index
            });
        }

        // 检查焦点样式
        const styles = window.getComputedStyle(el);
        const hasVisibleFocus = styles.outline !== 'none' ||
                              styles.boxShadow !== 'none';

        if (!hasVisibleFocus) {
            issues.push({
                element: el,
                issue: '焦点指示器不可见',
                index
            });
        }
    });

    return issues;
}

// 颜色对比度测试
function testColorContrast() {
    const elements = document.querySelectorAll('*');
    const issues = [];

    elements.forEach(el => {
        const styles = window.getComputedStyle(el);
        const color = styles.color;
        const backgroundColor = styles.backgroundColor;

        if (backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent') {
            return;
        }

        try {
            const foreground = ColorContrast.parseColor(color);
            const background = ColorContrast.parseColor(backgroundColor);
            const fontSize = parseFloat(styles.fontSize);
            const fontWeight = parseInt(styles.fontWeight);

            const isLargeText = fontSize >= 18 || (fontSize >= 14 && fontWeight >= 700);
            const result = ColorContrast.checkContrast(foreground, background, isLargeText);

            if (!result.pass) {
                issues.push({
                    element: el,
                    issue: `对比度不足 (${result.ratio}:1)`,
                    element: el.tagName,
                    isLargeText
                });
            }
        } catch (e) {
            // 无法解析颜色，跳过
        }
    });

    return issues;
}
```

## 总结

Web可访问性的核心要点：

1. **语义化HTML**：使用正确的HTML元素和ARIA属性
2. **键盘可访问**：确保所有功能都能通过键盘操作
3. **颜色对比**：满足WCAG对比度要求，不只依赖颜色传达信息
4. **文本替代**：为图像和媒体提供替代文本
5. **表单可访问**：正确的标签、错误提示和验证
6. **测试验证**：使用工具和真实用户测试
7. **持续改进**：将可访问性融入开发流程

可访问性不是一次性任务，而是需要持续关注和实践的设计原则。
