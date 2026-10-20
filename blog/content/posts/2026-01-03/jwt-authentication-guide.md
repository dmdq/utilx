---
title: "JWT认证机制完全指南"
slug: "jwt-authentication-guide"
date: 2026-01-03T13:00:00+08:00
draft: false
tags: ['JWT', '认证', '安全', 'Web开发', '前后端分离']
categories: ['技术教程']
author: 'util.cn Team'
summary: '深入解析JWT认证机制的工作原理、结构和最佳实践，帮助开发者构建安全的身份认证系统'
layout: "single"
ShowToc: true
---

# JWT认证机制完全指南

JSON Web Token（JWT）是一种开放标准（RFC 7519），用于在各方之间安全地传输信息。它是现代Web应用中最流行的身份认证方案之一。

## 什么是JWT

JWT是一个紧凑的、自包含的令牌格式，用于在各方之间以JSON对象安全地传输信息。由于信息是经过数字签名的，因此可以被验证和信任。

### JWT的特点

- **无状态**：服务器不需要存储会话信息
- **跨域支持**：适合分布式系统和微服务架构
- **自包含**：令牌本身包含了所有必要的用户信息
- **性能优秀**：减少数据库查询

## JWT的结构

JWT由三部分组成，用点（.）分隔：

```
Header.Payload.Signature
```

### 1. Header（头部）

包含令牌的类型和使用的签名算法：

```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

**常见算法**：
- HS256：HMAC SHA256（对称加密）
- RS256：RSA SHA256（非对称加密）
- ES256：ECDSA SHA256

### 2. Payload（载荷）

包含声明（claims），即关于实体和其他数据的声明：

```json
{
  "sub": "1234567890",
  "name": "John Doe",
  "iat": 1516239022,
  "exp": 1516242622
}
```

**标准声明**：
- `iss`（issuer）：签发者
- `sub`（subject）：主题
- `aud`（audience）：接收方
- `exp`（expiration）：过期时间
- `nbf`（not before）：在此之前不可用
- `iat`（issued at）：签发时间
- `jti`（JWT ID）：唯一标识符

### 3. Signature（签名）

用于验证消息在传输过程中未被篡改：

```
HMACSHA256(
  base64UrlEncode(header) + "." +
  base64UrlEncode(payload),
  secret
)
```

## JWT工作流程

```
┌──────────┐                ┌──────────┐                ┌──────────┐
│   用户    │                │  服务器   │                │   资源    │
└────┬─────┘                └────┬─────┘                └────┬─────┘
     │                            │                            │
     │  1. POST /login            │                            │
     ├───────────────────────────>│                            │
     │                            │                            │
     │  2. 返回JWT                 │                            │
     │<───────────────────────────┤                            │
     │                            │                            │
     │  3. GET /api/data          │                            │
     │     Header: Authorization  │                            │
     │             Bearer <JWT>    │                            │
     ├───────────────────────────────────────────────────────>│
     │                            │                            │
     │  4. 返回数据                │                            │
     │<───────────────────────────────────────────────────────┤
     │                            │                            │
```

## JWT实战实现

### 生成JWT

```javascript
const crypto = require('crypto');

// Base64URL编码
function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// 生成JWT
function generateJWT(payload, secret, algorithm = 'HS256') {
  const header = {
    alg: algorithm,
    typ: 'JWT'
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));

  const data = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return `${data}.${signature}`;
}

// 使用示例
const payload = {
  sub: '1234567890',
  name: 'John Doe',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1小时后过期
};

const secret = 'your-256-bit-secret';
const token = generateJWT(payload, secret);
console.log(token);
```

### 验证JWT

```javascript
// 验证JWT
function verifyJWT(token, secret) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    const [encodedHeader, encodedPayload, signature] = parts;

    // 重新生成签名
    const data = `${encodedHeader}.${encodedPayload}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(data)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    // 验证签名
    if (signature !== expectedSignature) {
      throw new Error('Invalid signature');
    }

    // 解码payload
    const payload = JSON.parse(
      Buffer.from(encodedPayload, 'base64').toString()
    );

    // 检查过期时间
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('Token expired');
    }

    return { valid: true, payload };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

// 使用示例
const result = verifyJWT(token, secret);
console.log(result);
```

### 解码JWT（不验证签名）

```javascript
// 仅解码JWT（用于调试）
function decodeJWT(token) {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid token format');
  }

  const [encodedHeader, encodedPayload] = parts;

  const header = JSON.parse(
    Buffer.from(encodedHeader, 'base64url').toString()
  );

  const payload = JSON.parse(
    Buffer.from(encodedPayload, 'base64url').toString()
  );

  return { header, payload };
}
```

## Express.js集成JWT

### 安装依赖

```bash
npm install jsonwebtoken express
```

### 登录接口

```javascript
const jwt = require('jsonwebtoken');
const express = require('express');
const app = express();

const SECRET_KEY = 'your-secret-key';

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  // 验证用户凭据
  if (username === 'admin' && password === 'password') {
    // 创建JWT
    const token = jwt.sign(
      {
        userId: 1,
        username: 'admin',
        role: 'admin'
      },
      SECRET_KEY,
      { expiresIn: '1h' }
    );

    res.json({
      success: true,
      token: token
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
});
```

### 中间件验证

```javascript
// 验证JWT中间件
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    req.user = user;
    next();
  });
}

// 保护的路由
app.get('/api/protected', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: 'This is protected data',
    user: req.user
  });
});
```

### 刷新令牌

```javascript
const refreshTokens = [];

app.post('/api/refresh', (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Refresh token required'
    });
  }

  if (!refreshTokens.includes(token)) {
    return res.status(403).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }

  jwt.verify(token, REFRESH_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    const accessToken = jwt.sign(
      { userId: user.userId, username: user.username },
      SECRET_KEY,
      { expiresIn: '15m' }
    );

    res.json({
      success: true,
      accessToken: accessToken
    });
  });
});
```

## 前端使用JWT

### 存储JWT

```javascript
// 登录后存储token
async function login(username, password) {
  const response = await fetch('/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password })
  });

  const data = await response.json();

  if (data.success) {
    // 存储到localStorage
    localStorage.setItem('token', data.token);

    // 或存储到cookie
    document.cookie = `token=${data.token}; path=/; secure; httponly`;
  }

  return data;
}
```

### 发送JWT

```javascript
// 在请求头中携带token
async function fetchData() {
  const token = localStorage.getItem('token');

  const response = await fetch('/api/protected', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (response.status === 401) {
    // Token过期，需要重新登录
    logout();
    return null;
  }

  return await response.json();
}

// 使用axios拦截器
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // 处理token过期
      logout();
    }
    return Promise.reject(error);
  }
);
```

## 安全最佳实践

### 1. 使用HTTPS

JWT必须在HTTPS连接中传输，防止中间人攻击。

### 2. 设置合理的过期时间

```javascript
// 短期访问令牌
const accessToken = jwt.sign(payload, SECRET_KEY, {
  expiresIn: '15m' // 15分钟
});

// 长期刷新令牌
const refreshToken = jwt.sign(payload, REFRESH_SECRET, {
  expiresIn: '7d' // 7天
});
```

### 3. 敏感信息不放入JWT

```javascript
// ❌ 错误：不要将敏感信息放入JWT
const payload = {
  userId: 1,
  password: 'secret123',  // 不要这样做
  creditCard: '1234-5678-9012-3456'
};

// ✅ 正确：只存储必要信息
const payload = {
  userId: 1,
  role: 'user'
};
```

### 4. 使用强密钥

```javascript
// 生成强密钥
const crypto = require('crypto');
const SECRET_KEY = crypto.randomBytes(64).toString('hex');
```

### 5. 验证所有声明

```javascript
function verifyJWT(token) {
  const decoded = jwt.verify(token, SECRET_KEY);

  // 验证发行者
  if (decoded.iss !== 'https://yourdomain.com') {
    throw new Error('Invalid issuer');
  }

  // 验证接收者
  if (decoded.aud !== 'your-api') {
    throw new Error('Invalid audience');
  }

  return decoded;
}
```

### 6. 实现令牌吊销

```javascript
// 使用Redis存储已吊销的令牌
const revokedTokens = new Set();

function revokeToken(token) {
  revokedTokens.add(token);
}

function isTokenRevoked(token) {
  return revokedTokens.has(token);
}

app.use((req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (token && isTokenRevoked(token)) {
    return res.status(401).json({
      success: false,
      message: 'Token has been revoked'
    });
  }

  next();
});
```

## 常见问题

### Q1: JWT vs Session

**JWT优势**：
- 无状态，易于扩展
- 跨域支持好
- 减少服务器存储

**Session优势**：
- 更容易控制吊销
- 更小的token大小
- 传统且成熟

### Q2: 如何处理Token过期

```javascript
// 自动刷新token
let refreshTokenTimeout;

function startRefreshTokenTimer() {
  const token = JSON.parse(localStorage.getItem('token'));
  const expires = new Date(token.expireAt);
  const timeout = expires.getTime() - Date.now() - (60 * 1000); // 提前1分钟

  refreshTokenTimeout = setTimeout(() => {
    refreshToken();
  }, timeout);
}

async function refreshToken() {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  });

  const data = await response.json();
  localStorage.setItem('token', JSON.stringify(data.token));
  startRefreshTokenTimer();
}
```

### Q3: JWT的存储位置

**localStorage**：
- ✅ 易于使用
- ✅ 跨标签页共享
- ❌ 容易受到XSS攻击

**Cookie**：
- ✅ httponly防止XSS
- ✅ 自动发送
- ❌ 容易受到CSRF攻击

**最佳实践**：存储在httpOnly、secure、sameSite的cookie中。

## 总结

JWT是一种强大且灵活的认证机制，特别适合现代分布式应用和微服务架构。正确使用JWT可以简化认证流程，提升应用性能和可扩展性。

记住安全第一：始终使用HTTPS、设置合理的过期时间、不在JWT中存储敏感信息，并根据具体需求选择合适的认证方案。

## 🧰 本章配套工具箱

边读边练：以下工具均在浏览器本地运行，数据不上传，可直接打开使用。

- [JWT令牌解析器](https://www.util.cn/tools/jwt-parser/)：三段式拆解令牌载荷结构
- [JWT验证器](https://www.util.cn/tools/jwt-verify/)：验证签名确认令牌有无被篡改
- [JWT调试器](https://www.util.cn/tools/jwt-debugger/)：换密钥试文中 HS256 验签流程
- [Base64解码](https://www.util.cn/tools/base64-decode/)：手动解码 base64url 段看载荷
- [HMAC生成器](https://www.util.cn/tools/hmac-generator/)：用 HMAC-SHA256 复现签名过程
- [安全令牌生成器](https://www.util.cn/tools/token-generator/)：生成本地调试用的测试 JWT 令牌
