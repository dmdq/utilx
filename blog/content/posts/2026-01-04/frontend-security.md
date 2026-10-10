---
title: "前端安全防护最佳实践：构建安全的Web应用"
slug: "frontend-security"
date: 2026-01-04T18:00:00+08:00
draft: false
author: "技术团队"
description: "全面介绍前端安全防护策略，包括XSS、CSRF、CSP等安全威胁的防护措施，帮助构建更安全的Web应用"
tags: ["前端安全", "XSS", "CSRF", "CSP", "Web安全"]
categories: ["前端技术", "安全"]
---

## 前端安全威胁概述

前端安全是Web应用的重要组成部分。主要的安全威胁包括：

1. **XSS（跨站脚本攻击）**
2. **CSRF（跨站请求伪造）**
3. **点击劫持**
4. **中间人攻击**
5. **敏感信息泄露**

## XSS防护

### 内容安全策略（CSP）

```javascript
// 通过HTTP头设置CSP
// Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.example.com

// 在HTML中设置
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://cdn.trusted.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://api.example.com;
">

// Nuxt配置
export default defineNuxtConfig({
  app: {
    head: {
      meta: [
        {
          'http-equiv': 'Content-Security-Policy',
          content: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
        }
      ]
    }
  }
})
```

### 输入转义

```javascript
// HTML转义函数
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

// URL转义
function escapeUrl(unsafe) {
  return encodeURIComponent(unsafe)
}

// 使用DOM API而非innerHTML
const div = document.createElement('div')
div.textContent = userInput // 自动转义
document.body.appendChild(div)
```

### Vue自动转义

```vue
<template>
  <!-- Vue自动转义 -->
  <div>{{ userInput }}</div>

  <!-- 使用v-html时需要特别小心 -->
  <div v-html="sanitizedHtml"></div>
</template>

<script setup>
import DOMPurify from 'dompurify'

const userInput = ref('<script>alert("XSS")<\/script>')

// 使用DOMPurify清理HTML
const sanitizedHtml = computed(() => {
  return DOMPurify.sanitize(userInput.value)
})
</script>
```

## CSRF防护

### CSRF Token

```javascript
// 生成CSRF Token
function generateCsrfToken() {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('')
}

// 存储Token
document.cookie = `csrf_token=${generateCsrfToken()}; SameSite=Strict; Secure`

// 发送请求时携带Token
fetch('/api/data', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': getCsrfToken()
  },
  body: JSON.stringify(data)
})
```

### SameSite Cookie

```javascript
// 设置SameSite属性
document.cookie = 'session_id=xxx; SameSite=Strict; Secure; HttpOnly'

// 服务器端设置Cookie
Set-Cookie: session_id=xxx; SameSite=Strict; Secure; HttpOnly
```

## 点击劫持防护

### X-Frame-Options

```javascript
// 通过HTTP头设置
X-Frame-Options: DENY
X-Frame-Options: SAMEORIGIN

// Nuxt配置
export default defineNuxtConfig({
  routeRules: {
    '/**': {
      headers: {
        'X-Frame-Options': 'DENY'
      }
    }
  }
})
```

### Frame Ancestors CSP

```javascript
// 使用CSP frame-ancestors
Content-Security-Policy: frame-ancestors 'none';
Content-Security-Policy: frame-ancestors 'self';
```

## 敏感信息保护

### 不在本地存储敏感信息

```javascript
// ❌ 不要存储密码
localStorage.setItem('password', password)

// ❌ 不要存储敏感token
localStorage.setItem('api_key', api_key)

// ✅ 使用httpOnly cookie
// 服务器端设置
Set-Cookie: token=xxx; HttpOnly; Secure; SameSite=Strict

// ✅ 使用sessionStorage（关闭浏览器即清除）
sessionStorage.setItem('temp_data', data)
```

### 安全的数据传输

```javascript
// 始终使用HTTPS
fetch('https://api.example.com/data', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(data)
})

// 启用HSTS
Strict-Transport-Security: max-age=31536000; includeSubDomains

// 子域名资源限制
Content-Security-Policy: frame-ancestors 'self' https://trusted.example.com;
```

## 密码安全

### 前端密码验证

```javascript
function validatePassword(password) {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    numbers: /\d/.test(password),
    special: /[!@#$%^&*]/.test(password)
  }

  return {
    valid: Object.values(checks).every(Boolean),
    checks
  }
}

// 密码强度评估
function getPasswordStrength(password) {
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[a-z]/.test(password)) score++
  if (/[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[!@#$%^&*]/.test(password)) score++

  return ['weak', 'fair', 'good', 'strong'][score]
}
```

### 安全的密码输入

```vue
<template>
  <div class="password-input">
    <input
      :type="showPassword ? 'text' : 'password'"
      v-model="password"
      @input="validate"
    />
    <button @click="showPassword = !showPassword">
      {{ showPassword ? 'Hide' : 'Show' }}
    </button>
    <div v-if="error" class="error">{{ error }}</div>
  </div>
</template>

<script setup>
const password = ref('')
const showPassword = ref(false)
const error = ref('')

function validate() {
  const result = validatePassword(password.value)
  if (!result.valid) {
    const failedChecks = Object.entries(result.checks)
      .filter(([, valid]) => !valid)
      .map(([check]) => check)
    error.value = `Password fails: ${failedChecks.join(', ')}`
  } else {
    error.value = ''
  }
}
</script>
```

## API安全

### 请求签名

```javascript
async function makeSecureRequest(url, data) {
  const timestamp = Date.now()
  const nonce = generateNonce()

  // 构建签名内容
  const signatureContent = `${timestamp}${nonce}${JSON.stringify(data)}`
  const signature = await hmac(signatureContent, secretKey)

  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Timestamp': timestamp,
      'X-Nonce': nonce,
      'X-Signature': signature
    },
    body: JSON.stringify(data)
  })
}
```

### 响应数据验证

```javascript
async function fetchAndValidate(url) {
  const response = await fetch(url)
  const data = await response.json()

  // 验证响应数据结构
  const validatedData = validateResponseSchema(data, {
    required: ['id', 'name'],
    types: {
      id: 'number',
      name: 'string',
      email: 'string'
    }
  })

  return validatedData
}

function validateResponseSchema(data, schema) {
  const errors = []

  for (const field of schema.required) {
    if (!(field in data)) {
      errors.push(`Missing required field: ${field}`)
    }
  }

  for (const [field, type] of Object.entries(schema.types)) {
    if (field in data && typeof data[field] !== type) {
      errors.push(`Invalid type for ${field}: expected ${type}`)
    }
  }

  if (errors.length > 0) {
    throw new Error(`Validation error: ${errors.join(', ')}`)
  }

  return data
}
```

## 第三方资源安全

### Subresource Integrity (SRI)

```html
<!-- 使用SRI确保CDN资源未被篡改 -->
<script
  src="https://cdn.example.com/library.js"
  integrity="sha384-..."
  crossorigin="anonymous"
></script>
```

### 预加载安全检查

```javascript
// 验证外部脚本
async function validateExternalScript(url) {
  const response = await fetch(url)
  const content = await response.text()

  // 检查是否包含可疑代码
  if (content.includes('eval') || content.includes('innerHTML')) {
    console.warn('Potentially unsafe script detected')
    return false
  }

  return true
}
```

## 安全审计

### 依赖检查

```bash
# 检查依赖漏洞
npm audit

# 自动修复漏洞
npm audit fix

# 使用Snyk进行深度扫描
npx snyk test
```

### 代码安全扫描

```javascript
// ESLint安全规则
// .eslintrc.js
module.exports = {
  extends: [
    'plugin:security/recommended'
  ],
  plugins: ['security']
}
```

## 安全监控

### 实时监控

```javascript
class SecurityMonitor {
  constructor() {
    this.init()
  }

  init() {
    // 监控XSS尝试
    this.monitorXSS()

    // 监控异常请求
    this.monitorRequests()

    // 监控控制台错误
    this.monitorErrors()
  }

  monitorXSS() {
    const originalCreateElement = document.createElement
    document.createElement = function(tagName) {
      const element = originalCreateElement.call(this, tagName)

      if (tagName === 'script') {
        let originalSrc = ''
        Object.defineProperty(element, 'src', {
          get() {
            return originalSrc
          },
          set(value) {
            // 检查脚本来源
            if (!this.isTrustedSource(value)) {
              console.warn('Untrusted script source:', value)
              securityEvent('untrusted_script', { src: value })
            }
            originalSrc = value
          }
        })
      }

      return element
    }
  }

  monitorRequests() {
    const originalFetch = window.fetch
    window.fetch = function(...args) {
      const url = args[0]

      // 检查请求目标
      if (!this.isTrustedDomain(url)) {
        console.warn('Request to untrusted domain:', url)
        securityEvent('untrusted_request', { url })
      }

      return originalFetch.apply(this, args)
    }
  }

  monitorErrors() {
    window.addEventListener('error', (event) => {
      if (event.message.includes('Script error')) {
        securityEvent('possible_xss', {
          message: event.message,
          filename: event.filename
        })
      }
    })
  }

  isTrustedSource(url) {
    const trusted = ['https://cdn.trusted.com', 'https://api.trusted.com']
    return trusted.some(domain => url.startsWith(domain))
  }

  isTrustedDomain(url) {
    try {
      const urlObj = new URL(url, window.location.origin)
      return urlObj.origin === window.location.origin
    } catch {
      return false
    }
  }
}
```

## 最佳实践总结

1. **永远不要信任用户输入** - 始终验证和转义
2. **使用HTTPS** - 保护数据传输
3. **设置CSP** - 限制资源加载
4. **使用HttpOnly Cookie** - 防止XSS窃取
5. **定期审计** - 检查依赖和代码安全性

## 总结

前端安全是一个持续的过程。通过实施这些安全措施，可以大大降低应用的安全风险，保护用户数据安全。
