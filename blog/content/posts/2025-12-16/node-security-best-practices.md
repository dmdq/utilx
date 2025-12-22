---
title: "Node.js安全最佳实践：构建安全可靠的服务端应用"
slug: "node-security-best-practices"
date: 2025-12-16
summary: "全面介绍Node.js应用的安全防护策略，包括输入验证、认证授权、数据加密、安全配置等关键技术，帮助开发者构建安全的服务端应用。"
author: "有条工具团队"
categories: ["后端开发"]
tags: ["Node.js", "安全", "Express", "JWT", "OWASP"]
draft: false
---

Node.js应用的安全性是生产环境部署的重要考虑因素。随着Node.js在服务端开发中的广泛应用，安全问题也日益突出。本文将介绍Node.js安全开发的最佳实践和防护策略。

## 1. 输入验证和数据清理

### 防止注入攻击

```javascript
// 使用helmet设置安全HTTP头
const helmet = require('helmet');

app.use(helmet());

// 自定义安全头配置
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));

// 输入验证中间件
const { body, validationResult, check } = require('express-validator');

// 用户注册验证
const validateUserRegistration = [
    check('username')
        .isLength({ min: 3, max: 30 })
        .withMessage('用户名长度必须在3-30个字符之间')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('用户名只能包含字母、数字和下划线'),

    check('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('请输入有效的邮箱地址'),

    check('password')
        .isLength({ min: 8 })
        .withMessage('密码长度至少8个字符')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('密码必须包含大小写字母、数字和特殊字符'),

    check('age')
        .isInt({ min: 18, max: 120 })
        .withMessage('年龄必须在18-120之间'),
];

// 验证中间件处理
app.post('/api/users/register', validateUserRegistration, (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    // 处理注册逻辑
    const { username, email, password, age } = req.body;
    // ...
});

// SQL注入防护
const mysql = require('mysql2/promise');

const getUserById = async (userId) => {
    const connection = await mysql.createConnection(dbConfig);

    try {
        // ✅ 使用参数化查询
        const [rows] = await connection.execute(
            'SELECT * FROM users WHERE id = ?',
            [userId]
        );
        return rows[0];

        // ❌ 危险的字符串拼接
        // const query = `SELECT * FROM users WHERE id = ${userId}`;
        // const [rows] = await connection.execute(query);
    } finally {
        await connection.end();
    }
};

// NoSQL注入防护
const mongoSanitize = require('express-mongo-sanitize');

app.use(mongoSanitize());

// 使用mongoose的验证和安全查询
const User = require('./models/User');

const findUsers = async (criteria) => {
    // ✅ 使用mongoose的查询构建器
    const query = {};

    if (criteria.name) {
        query.name = new RegExp(criteria.name, 'i');
    }

    if (criteria.age) {
        query.age = criteria.age;
    }

    return await User.find(query).select('-password');

    // ❌ 危险的直接查询
    // return await User.find(JSON.parse(criteria));
};
```

### XSS防护

```javascript
const xss = require('xss');

// HTML内容清理
const sanitizeHTML = (html) => {
    return xss(html, {
        whiteList: {
            a: ['href', 'title', 'target'],
            b: [],
            i: [],
            em: [],
            strong: [],
            p: [],
            br: []
        },
        stripIgnoreTag: true,
        stripIgnoreTagBody: ['script']
    });
};

// 用户内容处理
app.post('/api/posts', (req, res) => {
    const { title, content } = req.body;

    // 清理用户输入
    const sanitizedContent = sanitizeHTML(content);

    // 保存到数据库
    const post = new Post({
        title: xss(title),
        content: sanitizedContent,
        author: req.user.id
    });

    await post.save();

    res.json({
        success: true,
        post: post
    });
});

// 输出时转义
app.set('view engine', 'ejs');
app.get('/posts/:id', async (req, res) => {
    const post = await Post.findById(req.params.id);
    res.render('post', { post }); // EJS模板引擎会自动转义
});
```

## 2. 认证和授权

### JWT令牌安全

```javascript
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// JWT配置
const JWT_CONFIG = {
    secret: process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex'),
    expiresIn: '15m',
    refreshExpiresIn: '7d'
};

// 生成JWT令牌
const generateTokens = (user) => {
    const payload = {
        id: user.id,
        email: user.email,
        role: user.role,
        type: 'access'
    };

    const accessToken = jwt.sign(payload, JWT_CONFIG.secret, {
        expiresIn: JWT_CONFIG.expiresIn,
        issuer: 'your-app',
        audience: 'your-app-users'
    });

    const refreshToken = jwt.sign(
        {
            id: user.id,
            type: 'refresh',
            tokenVersion: user.tokenVersion || 0
        },
        JWT_CONFIG.secret,
        { expiresIn: JWT_CONFIG.refreshExpiresIn }
    );

    return { accessToken, refreshToken };
};

// 验证JWT中间件
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: '访问令牌缺失'
        });
    }

    jwt.verify(token, JWT_CONFIG.secret, (err, user) => {
        if (err) {
            return res.status(403).json({
                success: false,
                message: '无效的访问令牌'
            });
        }

        if (user.type !== 'access') {
            return res.status(403).json({
                success: false,
                message: '令牌类型错误'
            });
        }

        req.user = user;
        next();
    });
};

// 刷新令牌
const refreshAccessToken = async (refreshToken) => {
    try {
        const decoded = jwt.verify(refreshToken, JWT_CONFIG.secret);

        if (decoded.type !== 'refresh') {
            throw new Error('无效的刷新令牌');
        }

        const user = await User.findById(decoded.id);

        if (!user || user.tokenVersion !== decoded.tokenVersion) {
            throw new Error('用户信息已更新，请重新登录');
        }

        const tokens = generateTokens(user);

        // 保存新的refresh token
        user.refreshToken = tokens.refreshToken;
        await user.save();

        return tokens;
    } catch (error) {
        throw new Error('令牌刷新失败');
    }
};
```

### 基于角色的访问控制（RBAC）

```javascript
// 权限检查中间件
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: '未认证用户'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: '权限不足'
            });
        }

        next();
    };
};

// 精细化权限控制
const checkPermission = (resource, action) => {
    return (req, res, next) => {
        const user = req.user;
        const permission = `${resource}:${action}`;

        // 管理员拥有所有权限
        if (user.role === 'admin') {
            return next();
        }

        // 检查用户权限
        if (!user.permissions || !user.permissions.includes(permission)) {
            return res.status(403).json({
                success: false,
                message: '操作权限不足'
            });
        }

        next();
    };
};

// 资源所有者检查
const checkOwnership = (resourceModel, resourceIdParam = 'id') => {
    return async (req, res, next) => {
        try {
            const resourceId = req.params[resourceIdParam];
            const resource = await resourceModel.findById(resourceId);

            if (!resource) {
                return res.status(404).json({
                    success: false,
                    message: '资源不存在'
                });
            }

            // 管理员或资源所有者可以访问
            if (req.user.role === 'admin' ||
                resource.owner.toString() === req.user.id) {
                req.resource = resource;
                return next();
            }

            res.status(403).json({
                success: false,
                message: '无权访问此资源'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '权限检查失败'
            });
        }
    };
};

// 使用示例
app.get('/api/users/profile', authenticateToken, (req, res) => {
    // 用户只能查看自己的资料
});

app.get('/api/users/:id',
    authenticateToken,
    authorize('admin'),
    (req, res) => {
        // 只有管理员可以查看其他用户信息
    }
);

app.put('/api/posts/:id',
    authenticateToken,
    checkOwnership(Post),
    (req, res) => {
        // 只有文章作者或管理员可以修改
    }
);
```

## 3. 数据加密和存储安全

### 密码加密

```javascript
const bcrypt = require('bcrypt');
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

// 用户注册示例
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // 检查用户是否已存在
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: '用户名或邮箱已存在'
            });
        }

        // 加密密码
        const hashedPassword = await hashPassword(password);

        // 创建用户
        const user = new User({
            username,
            email,
            password: hashedPassword,
            tokenVersion: 0
        });

        await user.save();

        res.status(201).json({
            success: true,
            message: '注册成功'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '注册失败'
        });
    }
});
```

### 敏感数据加密

```javascript
const crypto = require('crypto');

// 对称加密
class DataEncryption {
    constructor(secretKey) {
        this.algorithm = 'aes-256-gcm';
        this.secretKey = crypto.scryptSync(secretKey, 'salt', 32);
    }

    encrypt(text) {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipher(this.algorithm, this.secretKey);
        cipher.setAAD(Buffer.from('additional-data'));

        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        const authTag = cipher.getAuthTag();

        return {
            encrypted,
            iv: iv.toString('hex'),
            authTag: authTag.toString('hex')
        };
    }

    decrypt(encryptedData) {
        const decipher = crypto.createDecipher(this.algorithm, this.secretKey);
        decipher.setAAD(Buffer.from('additional-data'));
        decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

        let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    }
}

const encryption = new DataEncryption(process.env.ENCRYPTION_KEY);

// 敏感信息存储
const saveSensitiveData = async (userId, sensitiveInfo) => {
    const encrypted = encryption.encrypt(JSON.stringify(sensitiveInfo));

    const sensitiveData = new SensitiveData({
        userId,
        data: encrypted.encrypted,
        iv: encrypted.iv,
        authTag: encrypted.authTag
    });

    await sensitiveData.save();
};

// API密钥管理
class APIKeyManager {
    static generateAPIKey() {
        return crypto.randomBytes(32).toString('hex');
    }

    static hashAPIKey(apiKey) {
        return crypto.createHash('sha256').update(apiKey).digest('hex');
    }

    static verifyAPIKey(apiKey, hashedKey) {
        const hashed = this.hashAPIKey(apiKey);
        return crypto.timingSafeEqual(
            Buffer.from(hashed),
            Buffer.from(hashedKey)
        );
    }
}
```

## 4. 会话和Cookie安全

```javascript
const session = require('express-session');
const cookieParser = require('cookie-parser');

// 安全的会话配置
app.use(session({
    secret: process.env.SESSION_SECRET || crypto.randomBytes(64).toString('hex'),
    resave: false,
    saveUninitialized: false,
    name: 'sessionId', // 自定义cookie名称
    cookie: {
        secure: process.env.NODE_ENV === 'production', // HTTPS only
        httpOnly: true, // 防止XSS
        maxAge: 24 * 60 * 60 * 1000, // 24小时
        sameSite: 'strict', // CSRF防护
        path: '/'
    }
}));

// 会话中间件
const sessionMiddleware = (req, res, next) => {
    if (!req.session.userId) {
        req.session.userId = req.user.id;
        req.session.createdAt = Date.now();
    }

    // 会话超时检查
    const sessionAge = Date.now() - req.session.createdAt;
    const maxSessionAge = 24 * 60 * 60 * 1000; // 24小时

    if (sessionAge > maxSessionAge) {
        req.session.destroy();
        return res.status(401).json({
            success: false,
            message: '会话已过期，请重新登录'
        });
    }

    next();
};

// 登出处理
app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: '登出失败'
            });
        }

        res.clearCookie('sessionId');
        res.json({
            success: true,
            message: '已成功登出'
        });
    });
});
```

## 5. 限流和防护

### 请求限流

```javascript
const rateLimit = require('express-rate-limit');

// 通用限流
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100, // 限制每个IP 15分钟内最多100个请求
    message: {
        success: false,
        message: '请求过于频繁，请稍后再试'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// 登录限流
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 5, // 限制每个IP 15分钟内最多5次登录尝试
    message: {
        success: false,
        message: '登录尝试次数过多，请15分钟后再试'
    },
    skipSuccessfulRequests: true,
});

// API限流
const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1分钟
    max: 30, // 限制每个IP 1分钟内最多30个API请求
    keyGenerator: (req) => {
        return req.user ? `user_${req.user.id}` : req.ip;
    },
});

// 应用限流中间件
app.use('/api/', apiLimiter);
app.post('/api/auth/login', loginLimiter);

// 自定义限流逻辑
const createCustomLimiter = (maxRequests, windowMs) => {
    const requests = new Map();

    return (req, res, next) => {
        const key = req.user ? `user_${req.user.id}` : req.ip;
        const now = Date.now();
        const windowStart = now - windowMs;

        // 清理过期记录
        if (requests.has(key)) {
            const userRequests = requests.get(key).filter(
                timestamp => timestamp > windowStart
            );
            requests.set(key, userRequests);
        }

        // 检查请求数量
        const currentRequests = requests.get(key) || [];

        if (currentRequests.length >= maxRequests) {
            return res.status(429).json({
                success: false,
                message: '请求过于频繁，请稍后再试'
            });
        }

        // 记录当前请求
        currentRequests.push(now);
        requests.set(key, currentRequests);

        next();
    };
};
```

### CSRF防护

```javascript
const csrf = require('csurf');

const csrfProtection = csrf({
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    }
});

app.use(csrfProtection);

// 提供CSRF令牌
app.get('/api/csrf-token', (req, res) => {
    res.json({
        csrfToken: req.csrfToken()
    });
});

// 错误处理
app.use((err, req, res, next) => {
    if (err.code !== 'EBADCSRFTOKEN') return next(err);

    res.status(403).json({
        success: false,
        message: 'CSRF令牌验证失败'
    });
});
```

## 6. 日志和监控

### 安全日志记录

```javascript
const winston = require('winston');

// 安全日志配置
const securityLogger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({
            filename: 'security.log',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        new winston.transports.Console({
            format: winston.format.simple()
        })
    ]
});

// 安全事件记录
const logSecurityEvent = (event, details) => {
    securityLogger.info({
        event,
        timestamp: new Date().toISOString(),
        ...details
    });
};

// 登录失败监控
const failedLoginAttempts = new Map();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15分钟

const monitorFailedLogin = (email, ip) => {
    const key = `${email}_${ip}`;
    const attempts = failedLoginAttempts.get(key) || {
        count: 0,
        lastAttempt: 0
    };

    attempts.count++;
    attempts.lastAttempt = Date.now();
    failedLoginAttempts.set(key, attempts);

    // 记录安全事件
    logSecurityEvent('LOGIN_FAILED', {
        email,
        ip,
        attempts: attempts.count
    });

    // 检查是否需要锁定账户
    if (attempts.count >= MAX_FAILED_ATTEMPTS) {
        logSecurityEvent('ACCOUNT_LOCKED', {
            email,
            ip,
            attempts: attempts.count,
            lockoutDuration: LOCKOUT_TIME / 60000
        });

        return true; // 需要锁定
    }

    return false; // 不需要锁定
};

// 清理过期的失败记录
setInterval(() => {
    const now = Date.now();
    for (const [key, attempts] of failedLoginAttempts.entries()) {
        if (now - attempts.lastAttempt > LOCKOUT_TIME) {
            failedLoginAttempts.delete(key);
        }
    }
}, 60000); // 每分钟清理一次
```

### 入侵检测

```javascript
// 异常请求检测
const detectSuspiciousActivity = (req, res, next) => {
    const suspiciousPatterns = [
        /\.\./,                    // 路径遍历
        /<script/i,               // XSS尝试
        /union.*select/i,         // SQL注入尝试
        /javascript:/i,           // JavaScript协议
        /data:/i                  // Data协议
    ];

    const url = req.url;
    const userAgent = req.get('User-Agent') || '';

    // 检查可疑URL模式
    for (const pattern of suspiciousPatterns) {
        if (pattern.test(url)) {
            logSecurityEvent('SUSPICIOUS_REQUEST', {
                url,
                userAgent,
                ip: req.ip,
                pattern: pattern.toString()
            });

            return res.status(400).json({
                success: false,
                message: '请求包含恶意内容'
            });
        }
    }

    // 检查异常User-Agent
    if (!userAgent || userAgent.length < 10) {
        logSecurityEvent('SUSPICIOUS_USER_AGENT', {
            userAgent,
            ip: req.ip
        });
    }

    next();
};

// 文件上传安全检查
const multer = require('multer');
const path = require('path');

const fileFilter = (req, file, cb) => {
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx'];
    const fileExtension = path.extname(file.originalname).toLowerCase();

    if (!allowedExtensions.includes(fileExtension)) {
        logSecurityEvent('SUSPICIOUS_FILE_UPLOAD', {
            filename: file.originalname,
            mimetype: file.mimetype,
            ip: req.ip
        });

        return cb(new Error('不支持的文件类型'), false);
    }

    cb(null, true);
};

const upload = multer({
    dest: 'uploads/',
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB限制
    }
});
```

## 7. 环境和部署安全

### 环境变量安全

```javascript
// .env文件示例（不提交到版本控制）
NODE_ENV=production
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-here
ENCRYPTION_KEY=your-encryption-key-here
DATABASE_URL=postgresql://username:password@localhost:5432/dbname
REDIS_URL=redis://localhost:6379

// 环境变量验证
const requiredEnvVars = [
    'JWT_SECRET',
    'ENCRYPTION_KEY',
    'DATABASE_URL'
];

const validateEnvironment = () => {
    const missingVars = requiredEnvVars.filter(
        varName => !process.env[varName]
    );

    if (missingVars.length > 0) {
        throw new Error(`缺少必需的环境变量: ${missingVars.join(', ')}`);
    }

    // 检查密钥长度
    if (process.env.JWT_SECRET.length < 32) {
        throw new Error('JWT_SECRET长度至少32个字符');
    }

    if (process.env.ENCRYPTION_KEY.length < 16) {
        throw new Error('ENCRYPTION_KEY长度至少16个字符');
    }
};

// 应用启动时验证
validateEnvironment();
```

### Docker安全配置

```dockerfile
# 使用非root用户运行
FROM node:18-alpine

# 创建应用用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# 复制package文件并安装依赖
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# 复制应用代码
COPY --chown=nodejs:nodejs . .

# 设置文件权限
RUN chmod -R 755 /app

# 切换到非root用户
USER nodejs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node healthcheck.js

# 启动应用
CMD ["node", "server.js"]
```

### HTTPS配置

```javascript
const https = require('https');
const fs = require('fs');

// HTTPS服务器配置
const httpsOptions = {
    key: fs.readFileSync('/path/to/private.key'),
    cert: fs.readFileSync('/path/to/certificate.crt'),
    ca: fs.readFileSync('/path/to/ca_bundle.crt'),
    minVersion: 'TLSv1.2',
    ciphers: [
        'ECDHE-ECDSA-AES256-GCM-SHA384',
        'ECDHE-RSA-AES256-GCM-SHA384',
        'ECDHE-ECDSA-CHACHA20-POLY1305',
        'ECDHE-RSA-CHACHA20-POLY1305',
        'ECDHE-ECDSA-AES128-GCM-SHA256',
        'ECDHE-RSA-AES128-GCM-SHA256'
    ].join(':'),
    honorCipherOrder: true
};

// 创建HTTPS服务器
const server = https.createServer(httpsOptions, app);

// HSTS强制HTTPS
app.use((req, res, next) => {
    if (req.protocol === 'http') {
        return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
});

// 启动服务器
server.listen(443, () => {
    console.log('HTTPS服务器运行在端口443');
});
```

## 8. 安全检查清单

### 开发阶段

```javascript
// 安全检查脚本
const securityChecklist = {
    inputValidation: {
        isUserInputSanitized: true,
        isParameterizedQueryUsed: true,
        isXSSProtectionEnabled: true,
        isCSRFTokenImplemented: true
    },
    authentication: {
        isPasswordHashed: true,
        isSessionSecure: true,
        isJWTSecure: true,
        isRateLimitingEnabled: true
    },
    dataProtection: {
        isSensitiveDataEncrypted: true,
        isHTTPSUsed: true,
        isDatabaseSecure: true,
        isBackupEncrypted: true
    },
    infrastructure: {
        isEnvironmentSecure: true,
        AreDependenciesUpdated: true,
        isLoggingEnabled: true,
        isMonitoringSetup: true
    }
};

// 自动化安全测试
const runSecurityTests = async () => {
    const tests = [
        testSQLInjectionProtection,
        testXSSProtection,
        testCSRFProtection,
        testAuthentication,
        testAuthorization,
        testRateLimiting,
        testInputValidation,
        testDataEncryption
    ];

    for (const test of tests) {
        try {
            await test();
            console.log(`✅ ${test.name} 通过`);
        } catch (error) {
            console.error(`❌ ${test.name} 失败:`, error.message);
        }
    }
};
```

### 生产部署检查

```javascript
// 生产环境安全检查
const productionSecurityCheck = () => {
    const checks = [
        {
            name: '环境变量安全',
            check: () => process.env.NODE_ENV === 'production'
        },
        {
            name: 'HTTPS启用',
            check: () => process.env.HTTPS === 'true'
        },
        {
            name: '密钥强度',
            check: () => process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32
        },
        {
            name: '数据库连接安全',
            check: () => !process.env.DATABASE_URL.includes('password')
        },
        {
            name: '日志级别',
            check: () => process.env.LOG_LEVEL === 'warn' || process.env.LOG_LEVEL === 'error'
        }
    ];

    const results = checks.map(({ name, check }) => ({
        name,
        passed: check()
    }));

    const failedChecks = results.filter(r => !r.passed);

    if (failedChecks.length > 0) {
        console.error('安全检查失败:', failedChecks);
        process.exit(1);
    }

    console.log('所有安全检查通过');
};

// 应用启动前执行
productionSecurityCheck();
```

## 总结

Node.js应用安全需要从多个层面考虑：

**输入安全：**
- 严格的输入验证
- SQL注入防护
- XSS攻击防护
- 文件上传安全

**认证授权：**
- 强密码策略
- JWT令牌安全
- RBAC权限控制
- 会话管理

**数据保护：**
- 密码加密存储
- 敏感数据加密
- HTTPS传输
- 数据库安全

**运行安全：**
- 环境变量保护
- 依赖安全管理
- 日志监控
- 限流防护

安全是一个持续的过程，需要定期更新安全策略、监控安全事件、及时修复漏洞。记住，安全没有终点，只有持续改进。

---
