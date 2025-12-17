---
title: "Node.js 后端开发最佳实践"
date: 2025-12-10T14:30:00+08:00
draft: false
tags: ['Node.js', '后端开发', '最佳实践', '性能优化']
categories: ['后端开发']
author: '有条工具团队'
summary: '分享 Node.js 后端开发的最佳实践，包括项目结构、错误处理、性能优化等方面'
---

## 前言

Node.js 已经成为构建高性能后端服务的重要选择。然而，仅仅使用 Node.js 是不够的，掌握最佳实践才能构建出可维护、可扩展的生产级应用。

## 项目结构组织

### 1. 分层架构

```
project/
├── src/
│   ├── controllers/     # 控制器层
│   ├── services/        # 业务逻辑层
│   ├── models/          # 数据模型层
│   ├── middleware/      # 中间件
│   ├── routes/          # 路由定义
│   ├── utils/           # 工具函数
│   ├── config/          # 配置文件
│   └── app.js           # 应用入口
├── tests/               # 测试文件
├── docs/                # 文档
├── package.json
└── .env.example
```

### 2. 模块化设计

```javascript
// controllers/userController.js
const userService = require('../services/userService');
const { validateUser } = require('../utils/validation');

class UserController {
  async createUser(req, res, next) {
    try {
      const validatedData = validateUser(req.body);
      const user = await userService.createUser(validatedData);
      res.status(201).json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req, res, next) {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id);
      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
```

```javascript
// services/userService.js
const User = require('../models/User');
const { hashPassword } = require('../utils/crypto');

class UserService {
  async createUser(userData) {
    const hashedPassword = await hashPassword(userData.password);

    const user = new User({
      ...userData,
      password: hashedPassword
    });

    return await user.save();
  }

  async getUserById(id) {
    const user = await User.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }
}

module.exports = new UserService();
```

## 错误处理

### 1. 全局错误处理中间件

```javascript
// middleware/errorHandler.js
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // MongoDB 错误处理
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new AppError(message, 404);
  }

  // MongoDB 重复字段错误
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = new AppError(message, 400);
  }

  // Mongoose 验证错误
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = new AppError(message, 400);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error'
  });
};

module.exports = { AppError, errorHandler };
```

### 2. 异步错误处理

```javascript
// utils/catchAsync.js
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// 使用示例
const User = require('../models/User');

exports.createUser = catchAsync(async (req, res, next) => {
  const user = await User.create(req.body);

  res.status(201).json({
    success: true,
    data: user
  });
});
```

## 数据库设计

### 1. Mongoose 模型定义

```javascript
// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { isEmail } = require('validator');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [isEmail, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false // 默认不返回密码
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// 索引
userSchema.index({ email: 1 });

// 中间件：保存前加密密码
userSchema.pre('save', async function(next) {
  // 只有密码被修改时才加密
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// 实例方法：验证密码
userSchema.methods.correctPassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
```

### 2. 数据库连接优化

```javascript
// config/database.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10, // 连接池大小
      serverSelectionTimeoutMS: 5000, // 服务器选择超时
      socketTimeoutMS: 45000, // Socket 超时
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

// 优雅关闭数据库连接
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('Database connection closed');
  process.exit(0);
});

module.exports = connectDB;
```

## 安全最佳实践

### 1. 输入验证和清理

```javascript
// utils/validation.js
const { body, param, query, validationResult } = require('express-validator');

// 用户创建验证规则
const createUserValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),

  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
];

// 检查验证结果
const checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

module.exports = { createUserValidation, checkValidation };
```

### 2. 安全头设置

```javascript
// middleware/security.js
const helmet = require('helmet');

const securityMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
});

// CORS 配置
const cors = require('cors');
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};

module.exports = {
  securityMiddleware,
  corsMiddleware: cors(corsOptions)
};
```

### 3. 速率限制

```javascript
// middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

// 通用速率限制
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制每个IP 15分钟内最多100个请求
  message: {
    error: 'Too many requests from this IP, please try again later'
  }
});

// 登录速率限制
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 限制每个IP 15分钟内最多5次登录尝试
  message: {
    error: 'Too many login attempts, please try again later'
  }
});

module.exports = { generalLimiter, loginLimiter };
```

## 性能优化

### 1. 缓存策略

```javascript
// utils/cache.js
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 600 }); // 10分钟缓存

const setCache = (key, data) => {
  cache.set(key, data);
};

const getCache = (key) => {
  return cache.get(key);
};

const deleteCache = (key) => {
  cache.del(key);
};

// 缓存中间件
const cacheMiddleware = (duration = 600) => {
  return (req, res, next) => {
    const key = req.originalUrl;
    const cachedData = getCache(key);

    if (cachedData) {
      return res.json({
        success: true,
        data: cachedData,
        cached: true
      });
    }

    // 重写 res.json 方法以缓存响应
    const originalJson = res.json;
    res.json = function(data) {
      setCache(key, data.data);
      return originalJson.call(this, data);
    };

    next();
  };
};

module.exports = {
  setCache,
  getCache,
  deleteCache,
  cacheMiddleware
};
```

### 2. 数据库查询优化

```javascript
// services/userService.js
class UserService {
  // 使用 lean() 提高查询性能
  async getUsers(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    return await User.find({})
      .select('name email role createdAt')
      .lean() // 返回普通 JavaScript 对象，提高性能
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
  }

  // 使用聚合管道
  async getUserStats() {
    return await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          avgAge: { $avg: '$age' }
        }
      }
    ]);
  }

  // 批量操作
  async updateUsersStatus(userIds, status) {
    return await User.updateMany(
      { _id: { $in: userIds } },
      { status },
      { multi: true }
    );
  }
}
```

### 3. 压缩和响应优化

```javascript
// middleware/compression.js
const compression = require('compression');

const compressionMiddleware = compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6,
  threshold: 1024
});

// 响应时间中间件
const responseTime = require('response-time');

module.exports = {
  compressionMiddleware,
  responseTimeMiddleware: responseTime()
};
```

## 日志和监控

### 1. 结构化日志

```javascript
// utils/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'user-service' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// 请求日志中间件
const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;

    logger.info('HTTP Request', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
  });

  next();
};

module.exports = { logger, requestLogger };
```

### 2. 健康检查

```javascript
// routes/health.js
const mongoose = require('mongoose');
const redis = require('../config/redis');

const getHealthStatus = async (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    services: {}
  };

  try {
    // MongoDB 健康检查
    if (mongoose.connection.readyState === 1) {
      health.services.mongodb = { status: 'OK' };
    } else {
      health.services.mongodb = { status: 'ERROR', message: 'MongoDB disconnected' };
      health.status = 'ERROR';
    }

    // Redis 健康检查（如果使用）
    if (redis) {
      await redis.ping();
      health.services.redis = { status: 'OK' };
    }

    // 内存使用情况
    health.memory = process.memoryUsage();

    res.status(health.status === 'OK' ? 200 : 503).json(health);
  } catch (error) {
    health.status = 'ERROR';
    health.error = error.message;
    res.status(503).json(health);
  }
};

module.exports = { getHealthStatus };
```

## 测试

### 1. 单元测试

```javascript
// tests/services/userService.test.js
const userService = require('../../src/services/userService');
const User = require('../../src/models/User');

jest.mock('../../src/models/User');

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create a user successfully', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      };

      const mockUser = { _id: '1', ...userData };
      User.create.mockResolvedValue(mockUser);

      const result = await userService.createUser(userData);

      expect(User.create).toHaveBeenCalledWith(userData);
      expect(result).toEqual(mockUser);
    });

    it('should throw error if user creation fails', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      };

      User.create.mockRejectedValue(new Error('Database error'));

      await expect(userService.createUser(userData))
        .rejects.toThrow('Database error');
    });
  });
});
```

### 2. 集成测试

```javascript
// tests/integration/users.test.js
const request = require('supertest');
const app = require('../../src/app');

describe('User Routes', () => {
  let authToken;

  beforeAll(async () => {
    // 登录获取 token
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'password123'
      });

    authToken = response.body.token;
  });

  describe('POST /api/v1/users', () => {
    it('should create a new user', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(userData.email);
    });

    it('should return 400 for invalid data', async () => {
      const invalidData = {
        name: 'T', // 太短
        email: 'invalid-email',
        password: '123' // 太短
      };

      const response = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });
});
```

## 部署

### 1. 环境配置

```javascript
// config/config.js
const dotenv = require('dotenv');

dotenv.config();

const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  mongodb: {
    uri: process.env.MONGODB_URI
  },
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD
  },
  email: {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD
  }
};

module.exports = config;
```

### 2. Docker 配置

```dockerfile
# Dockerfile
FROM node:16-alpine

WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# 更改文件所有权
USER nodejs

EXPOSE 3000

CMD ["node", "src/app.js"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/myapp
    depends_on:
      - mongo
      - redis

  mongo:
    image: mongo:4.4
    volumes:
      - mongo_data:/data/db
    ports:
      - "27017:27017"

  redis:
    image: redis:6-alpine
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"

volumes:
  mongo_data:
  redis_data:
```

## 总结

Node.js 后端开发的最佳实践包括：

1. **项目结构**：采用分层架构，保持代码组织清晰
2. **错误处理**：实现全局错误处理和异步错误捕获
3. **安全**：输入验证、安全头、速率限制等
4. **性能**：缓存、数据库优化、压缩等
5. **监控**：结构化日志、健康检查
6. **测试**：单元测试和集成测试
7. **部署**：容器化部署和环境配置

遵循这些最佳实践将帮助你构建出健壮、可维护、高性能的 Node.js 应用。

---

**相关工具：**
- [Node.js 性能监控](https://www.util.cn/tools/nodejs-monitor/)
- [API 文档生成器](https://www.util.cn/tools/api-docs/)
- [数据库设计工具](https://www.util.cn/tools/db-designer/)