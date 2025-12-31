---
title: "高可用系统设计：构建永不宕机的后端架构"
summary: "全面解析高可用系统设计的原则、模式和实战技巧，包括冗余设计、故障转移、限流降级、容错机制等，帮助你构建99.99%可用性的系统。"
date: 2025-12-25T17:00:00+08:00
draft: false
tags: ["高可用", "系统架构", "容错设计", "SLA", "负载均衡"]
categories: ["系统架构"]
author: "有条工具团队"
---

系统可用性是衡量服务质量的核心指标。一个99.9%可用性的系统意味着每年只能有8.76小时的停机时间，而99.99%则只能有52.56分钟。本文将系统性地介绍如何设计真正高可用的后端系统。

## 可用性度量

### SLA与计算

```
可用性等级对比：
┌──────────┬───────────┬──────────────┬─────────────┐
│ 可用性   │ 年停机时间 │ 月停机时间   │ 周停机时间  │
├──────────┼───────────┼──────────────┼─────────────┤
│ 99%      │ 3.65天    │ 7.31小时     │ 1.68小时    │
│ 99.9%    │ 8.77小时  │ 43.83分钟    │ 10.08分钟   │
│ 99.99%   │ 52.60分钟 │ 4.38分钟     │ 1.01分钟    │
│ 99.999%  │ 5.26分钟  │ 26.30秒      │ 6.05秒      │
└──────────┴───────────┴──────────────┴─────────────┘
```

### MTTR与MTBF

```typescript
// 可靠性指标计算
interface ReliabilityMetrics {
  mtbf: number; // Mean Time Between Failures - 平均故障间隔
  mttr: number; // Mean Time To Repair - 平均修复时间
  availability: number; // 可用性 = MTBF / (MTBF + MTTR)
}

class AvailabilityCalculator {
  calculate(metrics: ReliabilityMetrics): number {
    return metrics.mtbf / (metrics.mtbf + metrics.mttr);
  }

  // 示例：系统平均运行720小时故障一次，修复需要1小时
  example(): void {
    const metrics: ReliabilityMetrics = {
      mtbf: 720 * 3600 * 1000, // 720小时（毫秒）
      mttr: 1 * 3600 * 1000     // 1小时（毫秒）
    };

    const availability = this.calculate(metrics);
    // 可用性 = 720 / (720 + 1) ≈ 99.86%

    // 要达到99.99%，MTTR需要降至：
    // 0.9999 = 720 / (720 + x)
    // x = 720 / 0.9999 - 720 ≈ 0.072小时 ≈ 4.3分钟
  }
}
```

## 核心设计原则

### 1. 消除单点故障（SPOF）

```typescript
// 单点故障示例
class BadArchitecture {
  // ❌ 单数据库实例
  private db: Database = new SingleDatabaseInstance();

  // ❌ 单缓存服务器
  private cache: Cache = new SingleRedisServer();

  // ❌ 单文件存储
  private storage: Storage = new SingleNFSServer();
}

// 高可用架构
class GoodArchitecture {
  // ✅ 数据库主从复制
  private db: DatabaseCluster = new DatabaseCluster({
    primary: 'db-primary',
    replicas: ['db-replica-1', 'db-replica-2'],
    autoFailover: true
  });

  // ✅ 缓存集群
  private cache: CacheCluster = new RedisCluster({
    nodes: ['redis-1', 'redis-2', 'redis-3'],
    replicationFactor: 2
  });

  // ✅ 分布式存储
  private storage: Storage = new S3Storage({
    region: 'us-east-1',
    availabilityZones: ['us-east-1a', 'us-east-1b', 'us-east-1c']
  });
}
```

### 2. 冗余设计

```typescript
// 服务冗余 - 多副本部署
class ServiceDeployment {
  async deploy(service: Service): Promise<void> {
    // 在多个可用区部署副本
    const zones = ['us-east-1a', 'us-east-1b', 'us-east-1c'];

    for (const zone of zones) {
      await this.k8s.deploy({
        service: service.name,
        replicas: 3, // 每个区域3个副本
        affinity: {
          podAntiAffinity: {
            requiredDuringSchedulingIgnoredDuringExecution: [{
              labelSelector: {
                matchLabels: { app: service.name }
              },
              topologyKey: 'kubernetes.io/hostname'
            }]
          }
        }
      });
    }
  }
}

// 数据冗余 - 主从复制
class DatabaseReplication {
  async setupReplication(): Promise<void> {
    const primary = new PostgreSQL('db-primary');
    const standby1 = new PostgreSQL('db-standby-1');
    const standby2 = new PostgreSQL('db-standby-2');

    // 配置流复制
    await primary.config({
      wal_level: 'replica',
      max_wal_senders: 10,
      wal_keep_size: '1GB'
    });

    await standby1.config({
      hot_standby: 'on',
      primary_conninfo: 'host=db-primary port=5432'
    });

    await standby2.config({
      hot_standby: 'on',
      primary_conninfo: 'host=db-primary port=5432'
    });
  }
}
```

### 3. 故障检测与转移

```typescript
// 健康检查系统
class HealthChecker {
  private services = new Map<string, ServiceHealth>();

  async checkAll(): Promise<HealthReport> {
    const results = await Promise.allSettled(
      Array.from(this.services.values()).map(svc =>
        this.checkService(svc)
      )
    );

    const report: HealthReport = {
      healthy: 0,
      unhealthy: 0,
      details: []
    };

    for (const result of results) {
      if (result.status === 'fulfilled') {
        report.healthy++;
        report.details.push({
          service: result.value.name,
          status: 'healthy',
          responseTime: result.value.responseTime
        });
      } else {
        report.unhealthy++;
        report.details.push({
          service: result.reason.service,
          status: 'unhealthy',
          error: result.reason.message
        });
      }
    }

    return report;
  }

  private async checkService(
    service: ServiceHealth
  ): Promise<ServiceHealth> {
    const start = Date.now();

    try {
      // TCP检查
      await this.tcpCheck(service.host, service.port);

      // HTTP检查
      await this.httpCheck(`${service.url}/health`);

      // 响应时间
      const responseTime = Date.now() - start;

      if (responseTime > service.timeout) {
        throw new Error('Response timeout');
      }

      return {
        ...service,
        status: 'healthy',
        responseTime,
        lastCheck: Date.now()
      };
    } catch (error) {
      throw {
        service: service.name,
        message: error.message
      };
    }
  }
}

// 自动故障转移
class FailoverController {
  private primary: string;
  private secondaries: string[];
  private currentPrimary: string;

  async monitorAndFailover(): Promise<void> {
    setInterval(async () => {
      const isHealthy = await this.checkHealth(this.currentPrimary);

      if (!isHealthy) {
        console.warn('Primary unhealthy, initiating failover');

        await this.failover();
      }
    }, 5000); // 每5秒检查一次
  }

  private async failover(): Promise<void> {
    // 1. 选择新的主节点
    const newPrimary = await this.selectBestSecondary();

    // 2. 提升新主节点
    await this.promoteToPrimary(newPrimary);

    // 3. 更新DNS/负载均衡
    await this.updateRouting(newPrimary);

    // 4. 重新配置复制
    await this.reconfigureReplication(newPrimary);

    this.currentPrimary = newPrimary;

    console.log(`Failover completed: ${newPrimary} is now primary`);
  }

  private async selectBestSecondary(): Promise<string> {
    const candidates = await Promise.all(
      this.secondaries.map(async (sec) => ({
        id: sec,
        health: await this.checkHealth(sec),
        replicationLag: await this.getReplicationLag(sec)
      }))
    );

    // 选择健康且延迟最小的
    return candidates
      .filter(c => c.health)
      .sort((a, b) => a.replicationLag - b.replicationLag)[0].id;
  }
}
```

## 负载均衡

### 多层负载均衡

```typescript
// 四层负载均衡（TCP/UDP）
class L4LoadBalancer {
  private backendServers: string[];

  distributeTraffic(sourceIP: string, sourcePort: number): string {
    // 使用一致性哈希
    const hash = this.consistentHash(`${sourceIP}:${sourcePort}`);
    const index = hash % this.backendServers.length;

    return this.backendServers[index];
  }
}

// 七层负载均衡（HTTP）
class L7LoadBalancer {
  private backends: Backend[];

  selectBackend(request: HttpRequest): Backend {
    // 基于请求路径的路由
    if (request.path.startsWith('/api/')) {
      return this.backends.find(b => b.name === 'api-server');
    }

    // 基于HTTP头的路由
    if (request.headers['x-api-version'] === 'v2') {
      return this.backends.find(b => b.name === 'api-v2-server');
    }

    // 基于内容类型的路由
    if (request.headers['content-type'] === 'application/grpc') {
      return this.backends.find(b => b.name === 'grpc-server');
    }

    // 默认轮询
    return this.roundRobin();
  }
}

// 负载均衡算法
class LoadBalancingAlgorithms {
  // 轮询
  private roundRobinIndex = 0;
  roundRobin(servers: Server[]): Server {
    const server = servers[this.roundRobinIndex];
    this.roundRobinIndex = (this.roundRobinIndex + 1) % servers.length;
    return server;
  }

  // 最少连接
  leastConnections(servers: Server[]): Server {
    return servers.reduce((min, server) =>
      server.connections < min.connections ? server : min
    );
  }

  // 加权轮询
  weightedRoundRobin(servers: WeightedServer[]): Server {
    const totalWeight = servers.reduce((sum, s) => sum + s.weight, 0);
    let random = Math.random() * totalWeight;

    for (const server of servers) {
      random -= server.weight;
      if (random <= 0) {
        return server;
      }
    }

    return servers[0];
  }

  // 一致性哈希
  consistentHash(key: string, servers: Server[]): Server {
    const hash = this.md5(key);
    const index = parseInt(hash.substring(0, 8), 16) % servers.length;
    return servers[index];
  }
}
```

## 限流与降级

### 限流策略

```typescript
// 令牌桶算法
class TokenBucket {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private capacity: number,
    private refillRate: number // 每秒令牌数
  ) {
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  async consume(tokens: number = 1): Promise<boolean> {
    this.refill();

    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }

    return false;
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;

    const newTokens = elapsed * this.refillRate;
    this.tokens = Math.min(this.capacity, this.tokens + newTokens);
    this.lastRefill = now;
  }
}

// 限流中间件
class RateLimitMiddleware {
  private limiters = new Map<string, TokenBucket>();

  async handle(
    request: Request,
    next: () => Promise<Response>
  ): Promise<Response> {
    const key = this.getClientKey(request);
    const limiter = this.getLimiter(key);

    // 尝试获取令牌
    const allowed = await limiter.consume();

    if (!allowed) {
      throw new RateLimitError({
        limit: limiter['capacity'],
        retryAfter: this.calculateRetryAfter(limiter)
      });
    }

    return await next();
  }

  private getClientKey(request: Request): string {
    // 按用户限流
    if (request.userId) {
      return `user:${request.userId}`;
    }

    // 按IP限流
    return `ip:${request.ip}`;
  }
}
```

### 服务降级

```typescript
// 降级策略管理
class DegradationManager {
  private strategies = new Map<string, DegradationStrategy>();

  async execute(
    feature: string,
    normal: () => Promise<any>,
    fallback: () => Promise<any>
  ): Promise<any> {
    const strategy = this.strategies.get(feature);

    // 检查系统负载
    const load = await this.getSystemLoad();

    if (strategy && load > strategy.threshold) {
      console.log(`System under load, degrading ${feature}`);

      // 执行降级逻辑
      return await fallback();
    }

    // 正常执行
    try {
      return await normal();
    } catch (error) {
      // 失败时降级
      if (strategy?.fallbackOnError) {
        return await fallback();
      }
      throw error;
    }
  }
}

// 降级策略示例
class FeatureFlags {
  // 推荐系统降级
  async getRecommendations(userId: string): Promise<Product[]> {
    return await this.degradation.execute(
      'recommendations',
      // 正常：调用推荐引擎
      async () => {
        return await this.recommendationEngine.getForUser(userId);
      },
      // 降级：返回热门商品
      async () => {
        return await this.cache.get('popular_products');
      }
    );
  }

  // 搜索服务降级
  async search(query: string): Promise<SearchResult[]> {
    return await this.degradation.execute(
      'search',
      // 正常：全文搜索
      async () => {
        return await this.elasticsearch.search(query);
      },
      // 降级：简单匹配
      async () => {
        return await this.database.simpleSearch(query);
      }
    );
  }
}
```

## 熔断机制

```typescript
// 熔断器实现
enum CircuitState {
  CLOSED = 'CLOSED',     // 正常状态
  OPEN = 'OPEN',         // 熔断开启
  HALF_OPEN = 'HALF_OPEN' // 半开（尝试恢复）
}

class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private lastFailureTime = 0;
  private successCount = 0;

  constructor(
    private threshold: number = 5,      // 失败阈值
    private timeout: number = 60000,     // 熔断超时（毫秒）
    private halfOpenMaxCalls: number = 3 // 半开状态最大调用数
  ) {}

  async execute<T>(
    fn: () => Promise<T>
  ): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      // 检查是否可以尝试恢复
      if (this.shouldAttemptReset()) {
        this.state = CircuitState.HALF_OPEN;
        this.successCount = 0;
      } else {
        throw new CircuitBreakerOpenError();
      }
    }

    try {
      const result = await fn();

      // 成功，记录
      this.onSuccess();

      return result;
    } catch (error) {
      // 失败，记录
      this.onFailure();

      throw error;
    }
  }

  private onSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;

      // 半开状态连续成功，恢复
      if (this.successCount >= this.halfOpenMaxCalls) {
        this.state = CircuitState.CLOSED;
        this.failureCount = 0;
      }
    } else {
      this.failureCount = 0;
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    // 达到阈值，开启熔断
    if (this.failureCount >= this.threshold) {
      this.state = CircuitState.OPEN;
    }
  }

  private shouldAttemptReset(): boolean {
    return Date.now() - this.lastFailureTime > this.timeout;
  }
}

// 使用熔断器保护外部服务调用
class ProtectedServiceClient {
  private breaker = new CircuitBreaker(5, 60000);

  async callExternalAPI(url: string): Promise<any> {
    return await this.breaker.execute(async () => {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`API failed: ${response.status}`);
      }

      return await response.json();
    });
  }
}
```

## 超时与重试

```typescript
// 指数退避重试
class RetryPolicy {
  async execute<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const {
      maxAttempts = 3,
      baseDelay = 1000,
      maxDelay = 10000,
      backoffMultiplier = 2,
      retryableErrors = [TimeoutError, NetworkError]
    } = options;

    let lastError: Error;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        // 检查是否可重试
        const isRetryable = retryableErrors.some(
          ErrorClass => error instanceof ErrorClass
        );

        if (!isRetryable || attempt === maxAttempts) {
          throw error;
        }

        // 计算退避时间
        const delay = Math.min(
          baseDelay * Math.pow(backoffMultiplier, attempt - 1),
          maxDelay
        );

        console.log(`Attempt ${attempt} failed, retrying in ${delay}ms`);

        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 超时控制
class TimeoutController {
  async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeout: number
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new TimeoutError()), timeout)
      )
    ]);
  }
}
```

## 数据库高可用

```yaml
# PostgreSQL高可用配置（Patroni）
apiVersion: 'v1'
kind: ConfigMap
metadata:
  name: patroni-config
data:
  patroni.yml: |
    scope: postgres-cluster
    name: postgres-0

    restapi:
      listen: 0.0.0.0:8008
      connect_address: postgres-0:8008

    etcd3:
      hosts:
        - etcd-0.etcd:2379
        - etcd-1.etcd:2379
        - etcd-2.etcd:2379

    bootstrap:
      dcs:
        ttl: 30
        loop_wait: 10
        retry_timeout: 10
        maximum_lag_on_failover: 1048576

      postgresql:
        use_pg_rewind: true
        remove_data_directory_on_rewind_failure: true

        parameters:
          max_connections: 200
          shared_buffers: 2GB
          effective_cache_size: 6GB
          maintenance_work_mem: 512MB
          checkpoint_completion_target: 0.9
          wal_buffers: 16MB
          default_statistics_target: 100
          random_page_cost: 1.1
          effective_io_concurrency: 200
          work_mem: 4MB
          min_wal_size: 1GB
          max_wal_size: 4GB

        pg_hba:
          - host replication replicator all md5
          - host all all all md5

    tags:
      nofailover: false
      noloadbalance: false
      clonefrom: false
      nostream: false
```

## 总结

高可用系统设计的关键要素：

1. **冗余**：消除所有单点故障
2. **故障检测**：快速发现问题
3. **自动恢复**：最小化人工介入
4. **降级策略**：保证核心功能
5. **容量规划**：预留安全边际
6. **持续演练**：定期故障测试

记住：**故障不可避免，但可以通过设计最小化其影响**。
