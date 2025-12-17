---
title: "Web 安全最佳实践：保护你的应用免受攻击"
slug: "web-security-best-practices"
date: 2025-12-08T13:30:00+08:00
draft: false
tags: ['Web安全', '网络安全', '前端安全', '后端安全']
categories: ['安全开发']
author: '有条工具团队'
summary: '全面介绍 Web 应用安全开发的最佳实践，防范常见的安全威胁'
---

## 前言

Web 安全是每个开发者都必须重视的问题。随着网络攻击手段的不断演进，了解并实施安全最佳实践对于保护用户数据和系统安全至关重要。

## OWASP Top 10 防范

### 1. 注入攻击防护

**SQL 注入防护：**

```javascript
// ❌ 危险：字符串拼接
const query = `SELECT * FROM users WHERE id = ${userId}`;

// ✅ 安全：参数化查询
const query = 'SELECT * FROM users WHERE id = ?';
const result = db.query(query, [userId]);

// 使用 ORM（如 Sequelize）
const user = await User.findOne({
  where: {
    id: userId
  }
});

// 或使用模板标签（如 pg 库的 tagged template literals）
const query = sql`SELECT * FROM users WHERE id = ${userId}`;
```

**NoSQL 注入防护：**

```javascript
// ❌ 危险：直接使用用户输入
const users = db.users.find({
  username: req.body.username,
  password: req.body.password
});

// ✅ 安全：使用白名单验证
const { username, password } = req.body;

// 验证输入格式
if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
  return res.status(400).json({ error: 'Invalid username' });
}

const users = db.users.find({
  username: username,
  password: hashPassword(password)
});
```

### 2. 身份验证和授权

**密码安全：**

```javascript
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// 密码哈希
const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// 密码验证
const verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// 生成随机密码
const generateRandomPassword = (length = 12) => {
  return crypto.randomBytes(length).toString('hex');
};

// 密码强度验证
const validatePasswordStrength = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return {
    isValid: password.length >= minLength &&
             hasUpperCase &&
             hasLowerCase &&
             hasNumbers &&
             hasSpecialChar,
    errors: [
      password.length < minLength ? 'Password must be at least 8 characters' : null,
      !hasUpperCase ? 'Password must contain uppercase letter' : null,
      !hasLowerCase ? 'Password must contain lowercase letter' : null,
      !hasNumbers ? 'Password must contain a number' : null,
      !hasSpecialChar ? 'Password must contain a special character' : null
    ].filter(Boolean)
  };
};
```

**JWT 实现：**

```javascript
const jwt = require('jsonwebtoken');

const tokenService = {
  // 生成 token
  generateToken(payload, expiresIn = '24h') {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
  },

  // 验证 token
  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid token');
    }
  },

  // 刷新 token
  refreshToken(oldToken) {
    try {
      const decoded = jwt.verify(oldToken, process.env.JWT_SECRET, { ignoreExpiration: true });

      // 检查 token 是否在刷新期内
      if (Date.now() - decoded.iat * 1000 > 7 * 24 * 60 * 60 * 1000) {
        throw new Error('Token too old to refresh');
      }

      return this.generateToken({
        userId: decoded.userId,
        role: decoded.role
      }, '24h');
    } catch (error) {
      throw new Error('Cannot refresh token');
    }
  }
};
```

### 3. 数据验证和清理

**输入验证中间件：**

```javascript
const { body, param, query, validationResult } = require('express-validator');
const xss = require('xss');
const validator = require('validator');

// 清理 HTML 输入
const sanitizeHtml = (input) => {
  return xss(input, {
    whiteList: {
      a: ['href', 'title', 'target'],
      b: [],
      i: [],
      em: [],
      strong: []
    },
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script']
  });
};

// 通用验证中间件
const validateRequest = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // 清理输入数据
    const sanitizeObject = (obj) => {
      if (typeof obj === 'string') {
        return sanitizeHtml(validator.escape(obj));
      }
      if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
      }
      if (obj && typeof obj === 'object') {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
          sanitized[key] = sanitizeObject(value);
        }
        return sanitized;
      }
      return obj;
    };

    req.body = sanitizeObject(req.body);
    req.params = sanitizeObject(req.params);
    req.query = sanitizeObject(req.query);

    next();
  };
};

// 使用示例
const userValidation = [
  body('email')
    .isEmail()
    .normalizeEmail(),
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .escape(),
  body('age')
    .optional()
    .isInt({ min: 0, max: 120 })
];

app.post('/api/users', validateRequest(userValidation), (req, res) => {
  // 处理逻辑
});
```

## 前端安全

### 1. XSS 防护

```javascript
// Content Security Policy 设置
const csp = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: [
      "'self'",
      "'unsafe-inline'", // 开发环境使用
      'https://trusted-cdn.com'
    ],
    styleSrc: [
      "'self'",
      "'unsafe-inline'",
      'https://fonts.googleapis.com'
    ],
    fontSrc: [
      "'self'",
      'https://fonts.gstatic.com'
    ],
    imgSrc: [
      "'self'",
      'data:',
      'https:'
    ],
    connectSrc: ["'self'"],
    frameSrc: ["'none'"],
    objectSrc: ["'none'"]
  }
};

// React 中的安全实践
const SafeComponent = ({ content }) => {
  // ❌ 危险：直接渲染 HTML
  // return <div dangerouslySetInnerHTML={{ __html: content }} />;

  // ✅ 安全：使用专门的库
  const DOMPurify = require('dompurify');
  const cleanContent = DOMPurify.sanitize(content);

  return (
    <div>
      <span>Safe content:</span>
      <div dangerouslySetInnerHTML={{ __html: cleanContent }} />
    </div>
  );
};

// 安全的 URL 处理
const SafeLink = ({ url, children }) => {
  // 验证 URL
  const isValidUrl = (url) => {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  };

  if (!isValidUrl(url)) {
    console.warn('Invalid URL detected:', url);
    return <span>{children}</span>;
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
};
```

### 2. CSRF 防护

```javascript
// CSRF Token 生成和验证
const csrf = require('csurf');
const cookieParser = require('cookie-parser');

app.use(cookieParser());
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
});

// 提供 CSRF token
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// 受保护的路由
app.post('/api/protected', csrfProtection, (req, res) => {
  // 处理请求
});

// 前端使用
const postWithCSRF = async (url, data) => {
  // 获取 CSRF token
  const { csrfToken } = await fetch('/api/csrf-token').then(r => r.json());

  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken
    },
    body: JSON.stringify(data)
  });
};
```

## 后端安全

### 1. 安全头设置

```javascript
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// 自定义安全头
app.use((req, res, next) => {
  // 防止点击劫持
  res.setHeader('X-Frame-Options', 'DENY');

  // 防止 MIME 类型嗅探
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // XSS 保护
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // 引用策略
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // 权限策略（替代 Feature-Policy）
  res.setHeader('Permissions-Policy',
    'geolocation=(), microphone=(), camera=()'
  );

  next();
});
```

### 2. 速率限制

```javascript
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

// 通用速率限制
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制每个IP 15分钟内最多100个请求
  message: {
    error: 'Too many requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// 登录速率限制
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 最多5次尝试
  skipSuccessfulRequests: true
});

// API 速率限制
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1分钟
  max: 60, // 每分钟60个请求
  keyGenerator: (req) => {
    return req.user ? req.user.id : req.ip;
  }
});

// 减慢响应速度
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 50, // 50个请求后开始延迟
  delayMs: 500, // 每个请求延迟500ms
  maxDelayMs: 20000 // 最大延迟20秒
});

app.use(generalLimiter);
app.use('/api/login', loginLimiter);
app.use('/api/', apiLimiter);
app.use('/api/', speedLimiter);
```

## 数据安全

### 1. 加密存储

```javascript
const crypto = require('crypto');
const algorithm = 'aes-256-gcm';
const secretKey = crypto.scryptSync(process.env.ENCRYPTION_KEY, 'salt', 32);

const encryption = {
  // 加密
  encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, secretKey, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  },

  // 解密
  decrypt(encryptedData) {
    const decipher = crypto.createDecipher(
      algorithm,
      secretKey,
      Buffer.from(encryptedData.iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
};

// 使用示例
const sensitiveData = "user's credit card number";
const encrypted = encryption.encrypt(sensitiveData);
const decrypted = encryption.decrypt(encrypted);
```

### 2. 安全配置

```javascript
// 环境变量验证
const requiredEnvVars = [
  'JWT_SECRET',
  'ENCRYPTION_KEY',
  'DATABASE_URL'
];

const validateEnv = () => {
  const missing = requiredEnvVars.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

// 安全随机数生成
const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// 密钥轮换
const keyRotation = {
  currentKey: process.env.ENCRYPTION_KEY,
  previousKeys: [],

  encryptWithCurrentKey(data) {
    return this.encrypt(data, this.currentKey);
  },

  decryptWithAnyKey(encryptedData) {
    // 尝试用当前密钥解密
    try {
      return this.decrypt(encryptedData, this.currentKey);
    } catch (e) {
      // 尝试用以前的密钥解密
      for (const key of this.previousKeys) {
        try {
          return this.decrypt(encryptedData, key);
        } catch (e) {
          continue;
        }
      }
      throw new Error('Unable to decrypt data with any available key');
    }
  },

  rotateKey(newKey) {
    this.previousKeys.push(this.currentKey);
    this.currentKey = newKey;

    // 保留最近3个密钥
    if (this.previousKeys.length > 3) {
      this.previousKeys.shift();
    }
  }
};
```

## 安全日志和监控

### 1. 安全事件日志

```javascript
const winston = require('winston');

const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/security.log' })
  ]
});

const securityEvents = {
  logFailedLogin(ip, email, reason) {
    securityLogger.warn('Failed login attempt', {
      event: 'FAILED_LOGIN',
      ip,
      email,
      reason,
      timestamp: new Date().toISOString()
    });
  },

  logSuspiciousActivity(ip, userId, activity) {
    securityLogger.error('Suspicious activity detected', {
      event: 'SUSPICIOUS_ACTIVITY',
      ip,
      userId,
      activity,
      timestamp: new Date().toISOString()
    });
  },

  logPrivilegedAction(userId, action, resource) {
    securityLogger.info('Privileged action performed', {
      event: 'PRIVILEGED_ACTION',
      userId,
      action,
      resource,
      timestamp: new Date().toISOString()
    });
  }
};
```

### 2. 异常检测

```javascript
class SecurityMonitor {
  constructor() {
    this.failedLogins = new Map();
    this.suspiciousIPs = new Set();
  }

  recordFailedLogin(ip) {
    const count = this.failedLogins.get(ip) || 0;
    this.failedLogins.set(ip, count + 1);

    // 5次失败登录后标记为可疑
    if (count >= 5) {
      this.suspiciousIPs.add(ip);
      securityEvents.logSuspiciousActivity(ip, null, 'Multiple failed logins');
    }

    // 24小时后重置计数
    setTimeout(() => {
      this.failedLogins.delete(ip);
    }, 24 * 60 * 60 * 1000);
  }

  isIPSuspicious(ip) {
    return this.suspiciousIPs.has(ip);
  }

  detectAnomalousPattern(userId, action) {
    // 实现异常模式检测逻辑
    // 例如：短时间内大量操作、异常时间访问等
  }
}

const securityMonitor = new SecurityMonitor();
```

## 安全测试

### 1. 依赖安全扫描

```json
// package.json scripts
{
  "scripts": {
    "audit": "npm audit --audit-level=moderate",
    "audit:fix": "npm audit fix",
    "snyk": "snyk test",
    "snyk:monitor": "snyk monitor"
  }
}
```

### 2. 安全测试

```javascript
// 安全测试示例
const request = require('supertest');
const app = require('../app');

describe('Security Tests', () => {
  test('should prevent SQL injection', async () => {
    const maliciousInput = "'; DROP TABLE users; --";

    const response = await request(app)
      .get(`/api/users/${maliciousInput}`)
      .expect(400);

    expect(response.body.error).toContain('Invalid input');
  });

  test('should prevent XSS in user input', async () => {
    const xssPayload = '<script>alert("xss")</script>';

    const response = await request(app)
      .post('/api/users')
      .send({ name: xssPayload })
      .expect(400);

    expect(response.body.error).toContain('Invalid input');
  });

  test('should have proper security headers', async () => {
    const response = await request(app)
      .get('/')
      .expect(200);

    expect(response.headers['x-frame-options']).toBe('DENY');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-xss-protection']).toBe('1; mode=block');
  });
});
```

## 总结

Web 安全是一个持续的过程，需要多层次的保护：

1. **输入验证**：严格验证所有用户输入
2. **身份认证**：使用强密码策略和多因素认证
3. **授权控制**：实施最小权限原则
4. **数据保护**：加密敏感数据
5. **安全头**：设置适当的安全响应头
6. **监控日志**：记录和监控安全事件
7. **定期更新**：保持依赖和系统更新

记住，安全不是一次性的任务，而是需要持续关注和改进的过程。

---

**相关工具：**
- [OWASP ZAP](https://www.zaproxy.org/) - 安全测试工具
- [密码生成器](https://www.util.cn/tools/password-generator/)
- [加密工具](https://www.util.cn/tools/encryption/)