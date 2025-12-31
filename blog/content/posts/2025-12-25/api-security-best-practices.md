---
title: "API安全最佳实践：构建可信赖的API接口"
summary: "全面解析API安全的方方面面，包括身份认证、授权控制、数据加密、输入验证、速率限制等，帮助你构建安全可靠的API服务。"
date: 2025-12-25T18:00:00+08:00
draft: false
tags: ["API安全", "后端安全", "JWT", "OAuth2", "OWASP"]
categories: ["系统安全"]
author: "有条工具团队"
---

API是现代应用的神经系统，但同时也是攻击者的主要目标。据统计，超过80%的Web应用攻击针对API层面。本文将系统性地介绍API安全的最佳实践。

## 认证与授权

### JWT令牌认证

```typescript
// JWT工具类
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

class JWTService {
  private client: jwksClient.JwksClient;
  private secret: string;

  constructor(config: { jwksUri?: string; secret?: string }) {
    if (config.secret) {
      this.secret = config.secret;
    } else if (config.jwksUri) {
      this.client = jwksClient({
        jwksUri: config.jwksUri
      });
    }
  }

  // 生成令牌
  sign(payload: JWTPayload): string {
    return jwt.sign(payload, this.secret, {
      expiresIn: '1h',
      issuer: 'api.example.com',
      audience: 'api.example.com',
      subject: payload.userId
    });
  }

  // 验证令牌
  async verify(token: string): Promise<JWTPayload> {
    try {
      if (this.secret) {
        return jwt.verify(token, this.secret) as JWTPayload;
      } else {
        // 使用JWKS验证（适用于分布式系统）
        const getKey = await this.client.getSigningKeyAsync();
        return jwt.verify(token, getKey.getPublicKey()) as JWTPayload;
      }
    } catch (error) {
      throw new UnauthorizedError('Invalid token');
    }
  }

  // 刷新令牌
  refresh(refreshToken: string): { accessToken: string; refreshToken: string } {
    const payload = jwt.verify(refreshToken, this.secret) as JWTPayload;

    // 生成新的访问令牌
    const accessToken = this.sign({
      userId: payload.userId,
      type: 'access'
    });

    // 生成新的刷新令牌
    const newRefreshToken = jwt.sign(
      { userId: payload.userId, type: 'refresh' },
      this.secret,
      { expiresIn: '7d' }
    );

    return { accessToken, refreshToken: newRefreshToken };
  }
}

// 认证中间件
class AuthMiddleware {
  constructor(private jwtService: JWTService) {}

  async handle(request: Request): Promise<void> {
    // 提取令牌
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedError('Missing token');
    }

    // 验证令牌
    const payload = await this.jwtService.verify(token);

    // 附加用户信息到请求
    request.user = payload;
  }

  private extractToken(request: Request): string | null {
    // 从Authorization头提取
    const authHeader = request.headers['authorization'];

    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // 从查询参数提取（不推荐）
    return request.query.token || null;
  }
}
```

### OAuth2授权

```typescript
// OAuth2授权服务
class OAuth2Service {
  async authorize(
    client_id: string,
    redirect_uri: string,
    scope: string[],
    response_type: string
  ): Promise<string> {
    // 1. 验证客户端
    const client = await this.validateClient(client_id, redirect_uri);

    // 2. 生成授权码
    const code = this.generateAuthorizationCode({
      client_id,
      redirect_uri,
      scope,
      user_id: request.user.userId
    });

    // 3. 存储授权码（有效期10分钟）
    await this.redis.setex(
      `auth_code:${code}`,
      600,
      JSON.stringify({ client_id, redirect_uri, scope })
    );

    return code;
  }

  async exchangeToken(
    grant_type: string,
    code: string,
    client_id: string,
    client_secret: string,
    redirect_uri: string
  ): Promise<TokenResponse> {
    // 1. 验证客户端
    await this.validateClientCredentials(client_id, client_secret);

    // 2. 验证授权码
    const authData = await this.redis.get(`auth_code:${code}`);

    if (!authData) {
      throw new InvalidGrantError('Invalid authorization code');
    }

    // 3. 删除授权码（一次性使用）
    await this.redis.del(`auth_code:${code}`);

    // 4. 生成访问令牌
    const access_token = this.jwtService.sign({
      user_id: authData.user_id,
      scope: authData.scope
    });

    // 5. 生成刷新令牌
    const refresh_token = this.generateRefreshToken(authData.user_id);

    return {
      access_token,
      refresh_token,
      token_type: 'Bearer',
      expires_in: 3600,
      scope: authData.scope.join(' ')
    };
  }
}
```

### 基于角色的访问控制（RBAC）

```typescript
// 权限定义
interface Permission {
  resource: string;   // 资源类型
  action: string;     // 操作类型
  condition?: (context: any) => boolean;
}

// 角色定义
interface Role {
  name: string;
  permissions: Permission[];
}

// RBAC实现
class RBACService {
  private roles = new Map<string, Role>();

  constructor() {
    this.initializeRoles();
  }

  private initializeRoles(): void {
    // 管理员角色
    this.roles.set('admin', {
      name: 'admin',
      permissions: [
        { resource: '*', action: '*' }  // 全部权限
      ]
    });

    // 编辑角色
    this.roles.set('editor', {
      name: 'editor',
      permissions: [
        { resource: 'posts', action: 'create' },
        { resource: 'posts', action: 'update' },
        { resource: 'posts', action: 'delete', condition: ctx => ctx.resource.ownerId === ctx.user.userId },
        { resource: 'posts', action: 'read' },
        { resource: 'comments', action: 'moderate' }
      ]
    });

    // 普通用户角色
    this.roles.set('user', {
      name: 'user',
      permissions: [
        { resource: 'posts', action: 'read' },
        { resource: 'comments', action: 'create' },
        { resource: 'comments', action: 'update', condition: ctx => ctx.resource.ownerId === ctx.user.userId },
        { resource: 'comments', action: 'delete', condition: ctx => ctx.resource.ownerId === ctx.user.userId }
      ]
    });
  }

  // 检查权限
  async checkPermission(
    user: User,
    resource: string,
    action: string,
    context?: any
  ): Promise<boolean> {
    // 获取用户角色
    const userRoles = await this.getUserRoles(user.userId);

    for (const roleName of userRoles) {
      const role = this.roles.get(roleName);

      if (!role) continue;

      for (const perm of role.permissions) {
        // 通配符匹配
        if (perm.resource === '*' && perm.action === '*') {
          return true;
        }

        // 资源和操作匹配
        if (
          this.matchPattern(perm.resource, resource) &&
          this.matchPattern(perm.action, action)
        ) {
          // 检查条件
          if (perm.condition) {
            return perm.condition(context);
          }

          return true;
        }
      }
    }

    return false;
  }

  // 权限中间件
  requirePermission(resource: string, action: string) {
    return async (request: Request, response: Response, next: NextFunction) => {
      const hasPermission = await this.checkPermission(
        request.user,
        resource,
        action,
        { resource: request.resource, user: request.user }
      );

      if (!hasPermission) {
        throw new ForbiddenError('Insufficient permissions');
      }

      next();
    };
  }

  private matchPattern(pattern: string, value: string): boolean {
    // 简单的通配符匹配
    const regex = new RegExp(
      '^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$'
    );
    return regex.test(value);
  }
}
```

## 输入验证

### Schema验证

```typescript
// 使用Zod进行输入验证
import { z } from 'zod';

// 定义用户创建schema
const CreateUserSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .min(5, 'Email too short')
    .max(100, 'Email too long')
    .toLowerCase()
    .trim(),

  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens and underscores'),

  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),

  age: z.number()
    .int('Age must be an integer')
    .min(13, 'Must be at least 13 years old')
    .max(120, 'Invalid age')
    .optional(),

  bio: z.string()
    .max(500, 'Bio too long')
    .optional()
});

// 验证中间件
class ValidationMiddleware {
  validate(schema: z.ZodSchema) {
    return (request: Request, response: Response, next: NextFunction) => {
      try {
        // 验证请求体
        request.body = schema.parse(request.body);
        next();
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new ValidationError({
            message: 'Validation failed',
            errors: error.errors
          });
        }
        throw error;
      }
    };
  }
}

// 使用示例
app.post('/api/users',
  authMiddleware.handle.bind(authMiddleware),
  new ValidationMiddleware().validate(CreateUserSchema),
  userController.create
);
```

### SQL注入防护

```typescript
// 使用参数化查询
class UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    // ✅ 安全：参数化查询
    const result = await this.db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    return result.rows[0] || null;
  }

  async searchUsers(query: string): Promise<User[]> {
    // ✅ 安全：使用参数绑定
    const pattern = `%${query}%`;

    const result = await this.db.query(
      'SELECT * FROM users WHERE username LIKE $1 OR email LIKE $1',
      [pattern]
    );

    return result.rows;
  }

  // ❌ 危险：字符串拼接（SQL注入风险）
  async dangerousSearch(query: string): Promise<User[]> {
    // 不要这样做！
    const sql = `SELECT * FROM users WHERE username LIKE '%${query}%'`;
    return await this.db.query(sql);
  }
}

// ORM安全使用（Prisma）
class PrismaUserRepository {
  async findByEmail(email: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { email }
    });
  }

  async search(query: string): Promise<User[]> {
    // Prisma自动处理参数化
    return await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } }
        ]
      }
    });
  }
}
```

### XSS防护

```typescript
// 输出编码
class XssProtection {
  // HTML转义
  escapeHtml(unsafe: string): string {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // 属性转义
  escapeAttribute(unsafe: string): string {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;")
      .replace(/\//g, "&#x2F;");
  }

  // JavaScript转义
  escapeJs(unsafe: string): string {
    return unsafe
      .replace(/\\/g, "\\\\")
      .replace(/'/g, "\\'")
      .replace(/"/g, '\\"')
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")
      .replace(/\t/g, "\\t")
      .replace(/\f/g, "\\f");
  }
}

// 内容安全策略（CSP）
app.use((request, response, next) => {
  response.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://cdn.example.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://api.example.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ')
  );

  next();
});
```

## 数据加密

### 传输加密（HTTPS）

```typescript
// 强制HTTPS
import express from 'express';
import helmet from 'helmet';
import compression from 'compression';

const app = express();

// 安全头
app.use(helmet({
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  }
}));

// SSL重定向
if (process.env.NODE_ENV === 'production') {
  app.use((request, response, next) => {
    if (request.header('x-forwarded-proto') !== 'https') {
      return response.redirect(`https://${request.header('host')}${request.url}`);
    }
    next();
  });
}

// 启用HTTP/2
import spdy from 'spdy';

spdy.createServer({
  cert: fs.readFileSync('./certs/server.crt'),
  key: fs.readFileSync('./certs/server.key')
}, app).listen(443);
```

### 敏感数据加密

```typescript
// 数据加密服务
import crypto from 'crypto';

class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private keyLength = 32; // 256位
  private ivLength = 16;   // 128位
  private authTagLength = 16;

  constructor(private encryptionKey: Buffer) {}

  // 加密
  encrypt(plaintext: string): EncryptedData {
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(
      this.algorithm,
      this.encryptionKey,
      iv
    );

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  // 解密
  decrypt(data: EncryptedData): string {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.encryptionKey,
      Buffer.from(data.iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(data.authTag, 'hex'));

    let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}

// 敏感字段加密
class SecureField {
  constructor(private encryption: EncryptionService) {}

  // 保存前加密
  async encryptField<T extends Record<string, any>>(
    entity: T,
    field: keyof T
  ): Promise<void> {
    if (entity[field]) {
      const encrypted = this.encryption.encrypt(String(entity[field]));
      entity[`${String(field)}_encrypted`] = JSON.stringify(encrypted);
      delete entity[field];
    }
  }

  // 读取后解密
  async decryptField<T extends Record<string, any>>(
    entity: T,
    field: keyof T
  ): Promise<void> {
    const encryptedField = `${String(field)}_encrypted` as keyof T;

    if (entity[encryptedField]) {
      const encrypted = JSON.parse(String(entity[encryptedField]));
      entity[field] = this.encryption.decrypt(encrypted) as T[Extract<keyof T, string>];
      delete entity[encryptedField];
    }
  }
}
```

## 速率限制

```typescript
// 多层级速率限制
class RateLimiter {
  private limiters = {
    // IP级别限制
    ip: new Map<string, RateLimitInfo>(),

    // 用户级别限制
    user: new Map<string, RateLimitInfo>(),

    // API密钥级别限制
    apiKey: new Map<string, RateLimitInfo>()
  };

  // 检查限制
  async checkLimit(
    identifier: string,
    type: 'ip' | 'user' | 'apiKey',
    limit: number,
    window: number
  ): Promise<boolean> {
    const limiter = this.limiters[type];
    const now = Date.now();
    const info = limiter.get(identifier);

    if (!info || now > info.resetTime) {
      // 创建新的限制窗口
      limiter.set(identifier, {
        count: 1,
        resetTime: now + window * 1000
      });
      return true;
    }

    if (info.count >= limit) {
      return false;
    }

    info.count++;
    return true;
  }
}

// 速率限制中间件
class RateLimitMiddleware {
  constructor(private limiter: RateLimiter) {}

  // IP限制
  ipLimit(options: { limit: number; window: number }) {
    return async (request: Request, response: Response, next: NextFunction) => {
      const allowed = await this.limiter.checkLimit(
        request.ip,
        'ip',
        options.limit,
        options.window
      );

      if (!allowed) {
        response.setHeader('X-RateLimit-Limit', options.limit.toString());
        response.setHeader('X-RateLimit-Remaining', '0');
        response.setHeader('Retry-After', options.window.toString());

        throw new TooManyRequestsError('Rate limit exceeded');
      }

      next();
    };
  }

  // 用户限制
  userLimit(options: { limit: number; window: number }) {
    return async (request: Request, response: Response, next: NextFunction) => {
      if (!request.user) {
        return next();
      }

      const allowed = await this.limiter.checkLimit(
        request.user.userId,
        'user',
        options.limit,
        options.window
      );

      if (!allowed) {
        throw new TooManyRequestsError('User rate limit exceeded');
      }

      next();
    };
  }
}
```

## 日志与监控

```typescript
// 安全审计日志
class SecurityAuditLogger {
  private logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    transports: [
      new winston.transports.File({
        filename: 'security-audit.log',
        level: 'info'
      }),
      new winston.transports.File({
        filename: 'security-errors.log',
        level: 'error'
      })
    ]
  });

  // 记录认证事件
  logAuthentication(event: AuthEvent): void {
    this.logger.info({
      type: 'authentication',
      event: event.type, // 'login', 'logout', 'failed_login'
      userId: event.userId,
      ip: event.ip,
      userAgent: event.userAgent,
      timestamp: new Date().toISOString(),
      success: event.success
    });
  }

  // 记录授权事件
  logAuthorization(event: AuthzEvent): void {
    this.logger.info({
      type: 'authorization',
      userId: event.user?.userId,
      resource: event.resource,
      action: event.action,
      granted: event.granted,
      reason: event.reason,
      timestamp: new Date().toISOString()
    });
  }

  // 记录数据访问
  logDataAccess(event: DataAccessEvent): void {
    this.logger.info({
      type: 'data_access',
      userId: event.userId,
      resourceType: event.resourceType,
      resourceId: event.resourceId,
      action: event.action,
      timestamp: new Date().toISOString()
    });
  }
}
```

## 总结

API安全的关键实践：

1. **认证**：使用JWT/OAuth2等标准协议
2. **授权**：实施基于角色的访问控制
3. **输入验证**：严格验证所有输入数据
4. **输出编码**：防止XSS注入攻击
5. **加密传输**：强制使用HTTPS
6. **敏感数据**：加密存储敏感信息
7. **速率限制**：防止暴力破解和DDoS
8. **审计日志**：记录所有安全相关事件
9. **安全头**：配置CSP、HSTS等安全响应头
10. **定期测试**：进行安全审计和渗透测试

记住：**安全是一个持续的过程，不是一次性的任务**。
