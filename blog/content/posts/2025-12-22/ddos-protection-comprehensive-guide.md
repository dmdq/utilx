---
title: "DDoS防护完全指南：从原理分析到实战部署的完整防护体系"
summary: "全面解析DDoS攻击的类型、原理和防护策略，包括网络层防护、应用层防护、云原生安全方案和应急响应流程，帮助企业构建多层次、智能化的DDoS防护体系。"
date: 2025-12-22T13:00:00+08:00
draft: false
tags: ["DDoS防护", "网络安全", "DDoS攻击", "Web安全", "防护策略"]
categories: ["网络安全"]
---

分布式拒绝服务（DDoS）攻击是当今互联网面临的最严重安全威胁之一。随着攻击手段的不断进化，企业需要构建多层次、智能化的防护体系。本文将深入探讨DDoS攻击的各种类型、防护原理和实战部署方案。

## DDoS攻击类型与原理

### 网络层DDoS攻击

网络层攻击主要通过消耗网络带宽和服务器资源来瘫痪目标服务：

```javascript
// DDoS攻击类型识别系统
class DDoSAttackDetector {
  constructor() {
    this.attackPatterns = {
      // SYN Flood攻击检测
      synFlood: {
        thresholds: {
          synRate: 1000,        // 每秒SYN包数量
          synAckRatio: 10,      // SYN/SYN-ACK比率
          connectionHalfOpen: 5000  // 半连接数
        },
        detection: this.detectSYNFlood.bind(this)
      },

      // UDP Flood攻击检测
      udpFlood: {
        thresholds: {
          udpRate: 5000,        // 每秒UDP包数量
          udpPortSpread: 100    // UDP端口分布数
        },
        detection: this.detectUDPFlood.bind(this)
      },

      // ICMP Flood攻击检测
      icmpFlood: {
        thresholds: {
          icmpRate: 1000,       // 每秒ICMP包数量
          icmpSize: 1500        // ICMP包大小
        },
        detection: this.detectICMPFlood.bind(this)
      }
    };

    this.trafficStats = new Map();
  }

  // SYN Flood攻击检测
  detectSYNFlood(trafficData) {
    const recentTraffic = this.getRecentTraffic(5000); // 最近5秒
    const synPackets = recentTraffic.filter(p => p.type === 'SYN');
    const synAckPackets = recentTraffic.filter(p => p.type === 'SYN-ACK');

    const synRate = synPackets.length / 5;
    const synAckRatio = synPackets.length / Math.max(synAckPackets.length, 1);
    const halfOpenConnections = this.getHalfOpenConnections();

    return {
      isAttack: synRate > this.attackPatterns.synFlood.thresholds.synRate ||
                synAckRatio > this.attackPatterns.synFlood.thresholds.synAckRatio ||
                halfOpenConnections > this.attackPatterns.synFlood.thresholds.connectionHalfOpen,
      confidence: this.calculateConfidence([
        synRate / this.attackPatterns.synFlood.thresholds.synRate,
        synAckRatio / this.attackPatterns.synFlood.thresholds.synAckRatio,
        halfOpenConnections / this.attackPatterns.synFlood.thresholds.connectionHalfOpen
      ]),
      details: {
        synRate,
        synAckRatio,
        halfOpenConnections
      }
    };
  }

  // UDP Flood攻击检测
  detectUDPFlood(trafficData) {
    const recentTraffic = this.getRecentTraffic(5000);
    const udpPackets = recentTraffic.filter(p => p.protocol === 'UDP');
    const uniquePorts = new Set(udpPackets.map(p => p.destinationPort));

    const udpRate = udpPackets.length / 5;
    const portSpread = uniquePorts.size;

    return {
      isAttack: udpRate > this.attackPatterns.udpFlood.thresholds.udpRate ||
                portSpread > this.attackPatterns.udpFlood.thresholds.udpPortSpread,
      confidence: this.calculateConfidence([
        udpRate / this.attackPatterns.udpFlood.thresholds.udpRate,
        portSpread / this.attackPatterns.udpFlood.thresholds.udpPortSpread
      ]),
      details: {
        udpRate,
        portSpread
      }
    };
  }

  // ICMP Flood攻击检测
  detectICMPFlood(trafficData) {
    const recentTraffic = this.getRecentTraffic(5000);
    const icmpPackets = recentTraffic.filter(p => p.protocol === 'ICMP');
    const avgPacketSize = icmpPackets.reduce((sum, p) => sum + p.size, 0) / icmpPackets.length;

    const icmpRate = icmpPackets.length / 5;

    return {
      isAttack: icmpRate > this.attackPatterns.icmpFlood.thresholds.icmpRate &&
                avgPacketSize > this.attackPatterns.icmpFlood.thresholds.icmpSize,
      confidence: this.calculateConfidence([
        icmpRate / this.attackPatterns.icmpFlood.thresholds.icmpRate,
        avgPacketSize / this.attackPatterns.icmpFlood.thresholds.icmpSize
      ]),
      details: {
        icmpRate,
        avgPacketSize
      }
    };
  }

  calculateConfidence(ratios) {
    return Math.min(1.0, ratios.reduce((sum, r) => sum + Math.min(r, 1.0), 0) / ratios.length);
  }
}
```

### 应用层DDoS攻击

应用层攻击主要针对应用协议和业务逻辑：

```javascript
// 应用层攻击检测
class ApplicationLayerDDoSDetector {
  constructor() {
    this.httpStats = {
      requests: new Map(),
      userAgents: new Map(),
      ips: new Map(),
      endpoints: new Map()
    };

    this.attackThresholds = {
      // HTTP Flood攻击阈值
      httpFlood: {
        requestsPerSecond: 1000,
        requestsPerIP: 100,
        suspiciousUserAgents: [
          /bot/i,
          /crawler/i,
          /scraper/i,
          /^$/,
          /python/i,
          /curl/i
        ]
      },

      // Slowloris攻击阈值
      slowloris: {
        maxConnections: 1000,
        slowConnectionThreshold: 30000, // 30秒
        minHeadersPerConnection: 1
      },

      // HTTP GET/POST Flood阈值
      httpGetPostFlood: {
        getRequestsPerSecond: 500,
        postRequestsPerSecond: 100,
        largePayloadThreshold: 1024 * 1024 // 1MB
      }
    };
  }

  // HTTP请求分析
  analyzeHTTPRequest(request, timestamp) {
    const ip = request.ip;
    const userAgent = request.headers['user-agent'] || '';
    const method = request.method;
    const endpoint = request.path;
    const payloadSize = request.contentLength || 0;

    // 记录请求统计
    this.recordRequestStats(ip, userAgent, method, endpoint, payloadSize, timestamp);

    // 检测各种攻击模式
    return {
      httpFlood: this.detectHTTPFlood(timestamp),
      slowloris: this.detectSlowlorisAttack(timestamp),
      httpGetPostFlood: this.detectHTTPGetPostFlood(timestamp),
      suspiciousPatterns: this.detectSuspiciousPatterns(request)
    };
  }

  // HTTP Flood攻击检测
  detectHTTPFlood(timestamp) {
    const recentRequests = this.getRecentRequests(timestamp, 1000); // 最近1秒
    const requestRate = recentRequests.length;
    const requestsPerIP = this.calculateRequestsPerIP(recentRequests);
    const suspiciousUARequests = this.countSuspiciousUserAgents(recentRequests);

    const isAttack = requestRate > this.attackThresholds.httpFlood.requestsPerSecond ||
                    Array.from(requestsPerIP.values()).some(count =>
                      count > this.attackThresholds.httpFlood.requestsPerIP
                    ) ||
                    suspiciousUARequests > requestRate * 0.5;

    return {
      isAttack,
      confidence: this.calculateHTTPFloodConfidence(requestRate, requestsPerIP, suspiciousUARequests),
      details: {
        requestRate,
        requestsPerIP,
        suspiciousUARequests
      }
    };
  }

  // Slowloris攻击检测
  detectSlowlorisAttack(timestamp) {
    const activeConnections = this.getActiveConnections(timestamp);
    const slowConnections = activeConnections.filter(conn =>
      timestamp - conn.startTime > this.attackThresholds.slowloris.slowConnectionThreshold &&
      conn.headersReceived <= this.attackThresholds.slowloris.minHeadersPerConnection
    );

    const isAttack = activeConnections.length > this.attackThresholds.slowloris.maxConnections ||
                    slowConnections.length > activeConnections.length * 0.7;

    return {
      isAttack,
      confidence: isAttack ?
        Math.max(0.8, slowConnections.length / Math.max(activeConnections.length, 1)) : 0,
      details: {
        totalConnections: activeConnections.length,
        slowConnections: slowConnections.length,
        suspiciousIPs: [...new Set(slowConnections.map(c => c.ip))]
      }
    };
  }

  // 检测可疑请求模式
  detectSuspiciousPatterns(request) {
    const patterns = {
      // 随机User-Agent
      randomUserAgent: this.isRandomUserAgent(request.headers['user-agent'] || ''),

      // 异常请求头
      unusualHeaders: this.detectUnusualHeaders(request.headers),

      // SQL注入尝试
      sqlInjection: this.detectSQLInjection(request.url, request.body),

      // XSS尝试
      xssAttempt: this.detectXSS(request.url, request.body),

      // 路径遍历
      pathTraversal: this.detectPathTraversal(request.url),

      // 暴力破解模式
      bruteForce: this.detectBruteForcePattern(request.ip, request.path)
    };

    return {
      hasSuspiciousPattern: Object.values(patterns).some(p => p.detected),
      patterns
    };
  }

  // 检测随机User-Agent
  isRandomUserAgent(userAgent) {
    // 检测User-Agent是否为随机字符串
    const randomPattern = /^[a-zA-Z0-9]{8,}$/;
    const commonPatterns = [
      /Mozilla/i,
      /Chrome/i,
      /Firefox/i,
      /Safari/i,
      /Edge/i,
      /Opera/i
    ];

    return randomPattern.test(userAgent) &&
           !commonPatterns.some(pattern => pattern.test(userAgent));
  }

  // 检测异常请求头
  detectUnusualHeaders(headers) {
    const suspiciousHeaders = [
      /^X-Forwarded-For:\s*\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
      /^X-Real-IP:\s*\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
      /^X-Originating-IP:/i
    ];

    return {
      detected: suspiciousHeaders.some(pattern =>
        Object.keys(headers).some(key => pattern.test(`${key}: ${headers[key]}`))
      ),
      suspiciousHeaders: Object.keys(headers).filter(key =>
        suspiciousHeaders.some(pattern => pattern.test(`${key}: ${headers[key]}`))
      )
    };
  }
}
```

## 防护策略与架构

### 多层防护架构

构建完整的DDoS防护体系：

```yaml
# DDoS防护架构配置
ddos_protection:
  layers:
    # 第一层：网络边界防护
    network_boundary:
      hardware_firewall:
        vendor: "Cisco ASA"
        features:
          - "SYN Flood Protection"
          - "UDP Flood Protection"
          - "ICMP Rate Limiting"
          - "IP Reputation Filtering"
        configuration:
          syn_flood_threshold: 10000
          udp_flood_threshold: 50000
          icmp_rate_limit: 1000

      ddos_mitigation_device:
        vendor: "Arbors Pravail"
        capabilities:
          - "Real-time Traffic Analysis"
          - "Behavioral Attack Detection"
          - "Automatic Traffic Scrubbing"
        deployment_mode: "inline"

    # 第二层：CDN和云防护
    cdn_protection:
      provider: "Cloudflare"
      services:
        - "DDoS Protection"
        - "Web Application Firewall"
        - "Rate Limiting"
        - "IP Reputation"
      settings:
        security_level: "high"
        rate_limiting:
          requests_per_minute: 1000
          burst_size: 200

    # 第三层：应用层防护
    application_layer:
      web_application_firewall:
        rules_engine: "ModSecurity"
        rule_sets:
          - "OWASP Core Rule Set"
          - "Custom DDoS Rules"
        custom_rules:
          - "Rate limiting by IP"
          - "Session-based protection"
          - "CAPTCHA integration"

      rate_limiting:
        implementation: "Redis + Nginx"
        strategies:
          global_rate_limit:
            requests: 1000
            window: 60s
          per_ip_rate_limit:
            requests: 100
            window: 60s
          endpoint_rate_limit:
            "/api/v1/users": 10/minute
            "/api/v1/auth": 5/minute

    # 第四层：业务逻辑防护
    business_logic:
      anomaly_detection:
        machine_learning_model: "isolation_forest"
        features:
          - "request_rate"
          - "session_duration"
          - "click_patterns"
          - "conversion_rates"

      adaptive_protection:
        auto_scaling:
          min_instances: 5
          max_instances: 50
          scale_up_threshold: "cpu > 80% or requests_per_second > 1000"
          scale_down_threshold: "cpu < 30% for 5 minutes"
```

### 智能限流算法

实现动态和智能的限流策略：

```javascript
// 智能限流系统
class IntelligentRateLimiter {
  constructor() {
    this.redis = require('redis').createClient();
    this.limiters = new Map();
    this.adaptiveThresholds = new Map();
    this.mlModel = null;
  }

  // 初始化机器学习模型
  async initializeMLModel() {
    // 使用TensorFlow.js加载预训练模型
    const tf = require('@tensorflow/tfjs-node');
    this.mlModel = await tf.loadLayersModel('file://./models/ddos_detection_model.h5');
  }

  // 滑动窗口限流器
  async slidingWindowRateLimit(key, limit, windowMs) {
    const now = Date.now();
    const windowStart = now - windowMs;
    const pipeline = this.redis.pipeline();

    // 清理过期记录
    pipeline.zremrangebyscore(key, 0, windowStart);

    // 获取当前窗口内的请求数
    pipeline.zcard(key);

    // 添加当前请求
    pipeline.zadd(key, now, `${now}-${Math.random()}`);

    // 设置过期时间
    pipeline.expire(key, Math.ceil(windowMs / 1000));

    const results = await pipeline.exec();
    const currentCount = results[1][1];

    return {
      allowed: currentCount < limit,
      remaining: Math.max(0, limit - currentCount - 1),
      resetTime: now + windowMs,
      currentCount
    };
  }

  // 令牌桶限流器
  async tokenBucketRateLimit(key, capacity, refillRate) {
    const now = Date.now();
    const script = `
      local key = KEYS[1]
      local capacity = tonumber(ARGV[1])
      local tokens = tonumber(ARGV[2])
      local interval = tonumber(ARGV[3])
      local now = tonumber(ARGV[4])

      local bucket = redis.call('hmget', key, 'tokens', 'last_refill')
      local current_tokens = tonumber(bucket[1]) or capacity
      local last_refill = tonumber(bucket[2]) or now

      -- 计算需要补充的令牌数
      local elapsed = now - last_refill
      local tokens_to_add = math.floor(elapsed / interval * tokens)
      current_tokens = math.min(capacity, current_tokens + tokens_to_add)

      -- 检查是否有足够的令牌
      if current_tokens >= 1 then
        current_tokens = current_tokens - 1
        redis.call('hmset', key, 'tokens', current_tokens, 'last_refill', now)
        redis.call('expire', key, math.ceil(capacity / tokens * interval))
        return {1, current_tokens}
      else
        redis.call('hmset', key, 'tokens', current_tokens, 'last_refill', now)
        redis.call('expire', key, math.ceil(capacity / tokens * interval))
        return {0, current_tokens}
      end
    `;

    const result = await this.redis.eval(script, 1, key, capacity, refillRate, 1000, now);
    return {
      allowed: result[0] === 1,
      remaining: result[1],
      capacity
    };
  }

  // 自适应限流器
  async adaptiveRateLimit(ip, endpoint, requestData) {
    const key = `adaptive:${ip}:${endpoint}`;

    // 获取历史数据
    const history = await this.getRequestHistory(key, 3600000); // 最近1小时

    // 使用机器学习模型预测攻击概率
    const attackProbability = await this.predictAttackProbability(history, requestData);

    // 根据攻击概率调整限流阈值
    const baseLimit = this.getBaseLimit(endpoint);
    const adaptiveLimit = Math.max(1, Math.floor(baseLimit * (1 - attackProbability)));

    console.log(`Attack probability for ${ip}: ${attackProbability}, adaptive limit: ${adaptiveLimit}`);

    return await this.slidingWindowRateLimit(key, adaptiveLimit, 60000);
  }

  // 预测攻击概率
  async predictAttackProbability(history, requestData) {
    if (!this.mlModel) {
      // 如果模型未加载，使用简单的启发式规则
      return this.heuristicAttackDetection(history, requestData);
    }

    const tf = require('@tensorflow/tfjs-node');

    // 提取特征
    const features = this.extractFeatures(history, requestData);

    // 预测
    const prediction = this.mlModel.predict(tf.tensor2d([features]));
    const probability = prediction.dataSync()[0];

    return probability;
  }

  // 启发式攻击检测
  heuristicAttackDetection(history, requestData) {
    const recentRequests = history.filter(req => Date.now() - req.timestamp < 60000);
    const requestRate = recentRequests.length;

    // 检测异常高的请求速率
    if (requestRate > 100) return 0.8;

    // 检测可疑的User-Agent
    if (this.isSuspiciousUserAgent(requestData.userAgent)) return 0.6;

    // 检测异常请求模式
    if (this.hasAbnormalPattern(recentRequests)) return 0.7;

    return 0.1; // 基础攻击概率
  }

  // 提取特征用于机器学习
  extractFeatures(history, requestData) {
    const recentMinute = history.filter(req => Date.now() - req.timestamp < 60000);
    const recentHour = history.filter(req => Date.now() - req.timestamp < 3600000);

    return [
      recentMinute.length / 60,                    // 每秒请求数（最近1分钟）
      recentHour.length / 3600,                    // 每秒请求数（最近1小时）
      this.calculateUniqueIPs(recentHour),         // 唯一IP数
      this.calculateUniqueEndpoints(recentHour),   // 唯一端点数
      this.averageResponseTime(recentMinute),      // 平均响应时间
      this.errorRate(recentMinute),                // 错误率
      this.suspiciousUserAgentRatio(recentMinute), // 可疑User-Agent比例
      this.requestSizeVariance(recentMinute),      // 请求大小方差
      this.calculateEntropy(recentMinute),         // 请求熵
      this.calculateBurstiness(recentMinute)       // 请求突发性
    ];
  }

  // 集群限流器
  async clusterRateLimit(key, limit, windowMs) {
    const nodeId = process.env.NODE_ID || 'node1';
    const clusterKey = `cluster:${key}`;

    // 使用Redis的原子操作实现集群限流
    const script = `
      local key = KEYS[1]
      local window = tonumber(ARGV[1])
      local limit = tonumber(ARGV[2])
      local now = tonumber(ARGV[3])
      local node_id = ARGV[4]

      -- 清理过期记录
      redis.call('zremrangebyscore', key, 0, now - window)

      -- 获取当前计数
      local current = redis.call('zcard', key)

      -- 检查是否超过限制
      if current < limit then
        -- 添加当前请求记录
        redis.call('zadd', key, now, node_id .. ':' .. now)
        redis.call('expire', key, math.ceil(window / 1000))
        return {1, limit - current - 1}
      else
        return {0, 0}
      end
    `;

    const result = await this.redis.eval(script, 1, clusterKey, windowMs, limit, Date.now(), nodeId);

    return {
      allowed: result[0] === 1,
      remaining: result[1]
    };
  }
}
```

## 应急响应流程

### DDoS攻击应急响应

建立完善的应急响应机制：

```javascript
// DDoS应急响应系统
class DDoSResponseSystem {
  constructor() {
    this.responsePlan = {
      detection: {
        alerting: this.setupAlerting(),
        automated_response: this.enableAutomatedResponse()
      },
      mitigation: {
        immediate_actions: [
          'enable_scrubbing',
          'activate_rate_limiting',
          'block_malicious_ips',
          'enable_captcha'
        ],
        escalation_actions: [
          'activate_additional_bandwidth',
          'enable_cloudflare_under_attack_mode',
          'contact_ddos_mitigation_provider'
        ]
      },
      recovery: {
        post_attack_analysis: this.setupPostAttackAnalysis(),
        system_hardening: this.hardenSystems()
      }
    };

    this.alertChannels = [
      'email',
      'slack',
      'sms',
      'webhook'
    ];

    this.mitigationStrategies = new Map();
    this.initializeMitigationStrategies();
  }

  // 设置告警系统
  setupAlerting() {
    return {
      thresholds: {
        // 流量阈值
        traffic_increase: 300,        // 流量增长300%
        request_rate_increase: 500,   // 请求率增长500%

        // 错误率阈值
        error_rate_threshold: 10,     // 错误率超过10%
        response_time_threshold: 5000, // 响应时间超过5秒

        // 连接数阈值
        concurrent_connections: 10000, // 并发连接数
        half_open_connections: 5000   // 半连接数
      },

      alert_levels: {
        info: { color: '#36a64f', prefix: 'ℹ️' },
        warning: { color: '#ff9500', prefix: '⚠️' },
        critical: { color: '#ff0000', prefix: '🚨' }
      },

      cooldown_periods: {
        info: 300000,     // 5分钟
        warning: 600000,  // 10分钟
        critical: 0       // 立即
      }
    };
  }

  // 检测到攻击时的响应
  async handleAttackDetection(attackData) {
    console.log(`DDoS Attack Detected: ${JSON.stringify(attackData)}`);

    // 1. 发送告警
    await this.sendAlert('critical', 'DDoS Attack Detected', attackData);

    // 2. 记录攻击信息
    await this.logAttackIncident(attackData);

    // 3. 确定攻击严重程度
    const severity = this.assessAttackSeverity(attackData);

    // 4. 执行自动缓解措施
    await this.executeAutomatedMitigation(attackData, severity);

    // 5. 通知相关人员
    await this.notifyPersonnel(severity);

    // 6. 开始监控缓解效果
    this.startMitigationMonitoring(attackData);
  }

  // 执行自动缓解措施
  async executeAutomatedMitigation(attackData, severity) {
    const actions = this.getMitigationActions(severity);

    for (const action of actions) {
      try {
        await this.executeMitigationAction(action, attackData);
        console.log(`Executed mitigation action: ${action.name}`);
      } catch (error) {
        console.error(`Failed to execute action ${action.name}:`, error);
        await this.sendAlert('warning', 'Mitigation Action Failed', {
          action: action.name,
          error: error.message
        });
      }
    }
  }

  // 获取缓解措施
  getMitigationActions(severity) {
    const baseActions = [
      { name: 'enable_rate_limiting', priority: 1, delay: 0 },
      { name: 'enable_captcha', priority: 2, delay: 30000 },
      { name: 'cache_static_content', priority: 3, delay: 0 }
    ];

    if (severity >= 5) {
      baseActions.push(
        { name: 'block_malicious_ips', priority: 1, delay: 0 },
        { name: 'enable_scrubbing', priority: 2, delay: 0 },
        { name: 'activate_cloudflare_mode', priority: 3, delay: 60000 }
      );
    }

    if (severity >= 8) {
      baseActions.push(
        { name: 'emergency_bypass_mode', priority: 1, delay: 0 },
        { name: 'activate_additional_bandwidth', priority: 2, delay: 30000 },
        { name: 'contact_mitigation_provider', priority: 3, delay: 120000 }
      );
    }

    return baseActions.sort((a, b) => a.priority - b.priority);
  }

  // 执行具体的缓解动作
  async executeMitigationAction(action, attackData) {
    switch (action.name) {
      case 'enable_rate_limiting':
        await this.enableRateLimiting(attackData);
        break;

      case 'block_malicious_ips':
        await this.blockMaliciousIPs(attackData);
        break;

      case 'enable_captcha':
        await this.enableCaptcha();
        break;

      case 'activate_cloudflare_mode':
        await this.activateCloudflareUnderAttackMode();
        break;

      case 'enable_scrubbing':
        await this.enableTrafficScrubbing();
        break;

      case 'emergency_bypass_mode':
        await this.activateEmergencyBypassMode();
        break;

      default:
        console.warn(`Unknown mitigation action: ${action.name}`);
    }

    // 记录执行的动作
    await this.logMitigationAction(action, attackData);
  }

  // 启用速率限制
  async enableRateLimiting(attackData) {
    const rateLimiter = new IntelligentRateLimiter();

    // 根据攻击类型调整限流参数
    if (attackData.type === 'HTTP_FLOOD') {
      // 对所有IP实施严格限流
      await rateLimiter.updateGlobalLimits({
        requests_per_minute: 1000,
        burst_size: 200
      });
    } else if (attackData.type === 'SLOWLORIS') {
      // 限制连接持续时间
      await this.updateConnectionTimeouts({
        client_body_timeout: 10,
        client_header_timeout: 10,
        keepalive_timeout: 10
      });
    }
  }

  // 阻止恶意IP
  async blockMaliciousIPs(attackData) {
    const maliciousIPs = this.identifyMaliciousIPs(attackData);

    for (const ip of maliciousIPs) {
      // 在防火墙中阻止IP
      await this.blockIPInFirewall(ip);

      // 在应用层阻止IP
      await this.blockIPInApplication(ip);

      // 添加到IP黑名单
      await this.addToIPBlacklist(ip, 'DDoS attack', 3600); // 1小时
    }

    console.log(`Blocked ${maliciousIPs.length} malicious IPs`);
  }

  // 激活Cloudflare Under Attack Mode
  async activateCloudflareUnderAttackMode() {
    const cloudflareAPI = require('cloudflare-api');

    try {
      // 设置安全级别为 "Under Attack"
      await cloudflareAPI.setSecurityLevel('under_attack');

      // 启用高级DDoS防护
      await cloudflareAPI.enableAdvancedDDoSProtection();

      // 启用速率限制
      await cloudflareAPI.enableRateLimiting({
        requests_per_minute: 100,
        burst_size: 20
      });

      console.log('Cloudflare Under Attack Mode activated');
    } catch (error) {
      console.error('Failed to activate Cloudflare Under Attack Mode:', error);
      throw error;
    }
  }

  // 监控缓解效果
  startMitigationMonitoring(attackData) {
    const monitoringInterval = setInterval(async () => {
      try {
        const currentStatus = await this.getCurrentSystemStatus();
        const mitigationEffectiveness = this.calculateMitigationEffectiveness(attackData, currentStatus);

        if (mitigationEffectiveness.isEffective) {
          console.log('Mitigation is effective, attack is subsiding');

          if (mitigationEffectiveness.attackEnded) {
            // 攻击已结束，开始恢复流程
            clearInterval(monitoringInterval);
            await this.startRecoveryProcess();
          }
        } else {
          console.log('Mitigation not effective, escalating response');
          await this.escalateResponse(attackData, currentStatus);
        }

        // 发送状态更新
        await this.sendStatusUpdate(mitigationEffectiveness);

      } catch (error) {
        console.error('Error in mitigation monitoring:', error);
      }
    }, 30000); // 每30秒检查一次

    // 设置超时清理
    setTimeout(() => {
      clearInterval(monitoringInterval);
      console.log('Mitigation monitoring timeout, stopping monitoring');
    }, 3600000); // 1小时后停止监控
  }

  // 计算缓解效果
  calculateMitigationEffectiveness(attackData, currentStatus) {
    const initialTraffic = attackData.peakTraffic;
    const currentTraffic = currentStatus.currentTraffic;
    const trafficReduction = ((initialTraffic - currentTraffic) / initialTraffic) * 100;

    const initialErrorRate = attackData.errorRate || 0;
    const currentErrorRate = currentStatus.errorRate;
    const errorRateImprovement = initialErrorRate - currentErrorRate;

    const isEffective = trafficReduction > 50 && errorRateImprovement > 5;
    const attackEnded = currentTraffic < (initialTraffic * 0.2) && currentErrorRate < 5;

    return {
      isEffective,
      attackEnded,
      trafficReduction,
      errorRateImprovement,
      currentStatus
    };
  }
}
```

## 监控与分析

### 实时攻击监控

建立全面的DDoS攻击监控体系：

```javascript
// DDoS攻击监控系统
class DDoSMonitoringSystem {
  constructor() {
    this.metrics = {
      traffic: {
        inbound: 0,
        outbound: 0,
        dropped: 0
      },
      connections: {
        total: 0,
        active: 0,
        half_open: 0
      },
      requests: {
        total: 0,
        legitimate: 0,
        suspicious: 0,
        blocked: 0
      },
      attacks: {
        ongoing: 0,
        total_today: 0,
        mitigated: 0
      }
    };

    this.alertThresholds = {
      traffic_spike: 200,        // 流量突增200%
      error_rate: 10,            // 错误率超过10%
      response_time: 5000,       // 响应时间超过5秒
      connection_flood: 10000    // 连接数超过10000
    };

    this.startMonitoring();
  }

  startMonitoring() {
    // 监控网络流量
    this.monitorNetworkTraffic();

    // 监控应用指标
    this.monitorApplicationMetrics();

    // 监控系统资源
    this.monitorSystemResources();

    // 监控攻击模式
    this.monitorAttackPatterns();
  }

  // 监控网络流量
  monitorNetworkTraffic() {
    setInterval(() => {
      this.collectNetworkMetrics()
        .then(metrics => {
          this.metrics.traffic = metrics;
          this.analyzeTrafficPatterns(metrics);
        })
        .catch(error => {
          console.error('Error collecting network metrics:', error);
        });
    }, 5000); // 每5秒收集一次
  }

  // 监控应用指标
  monitorApplicationMetrics() {
    setInterval(() => {
      this.collectApplicationMetrics()
        .then(metrics => {
          this.metrics.requests = metrics;
          this.analyzeRequestPatterns(metrics);
        })
        .catch(error => {
          console.error('Error collecting application metrics:', error);
        });
    }, 2000); // 每2秒收集一次
  }

  // 分析流量模式
  analyzeTrafficPatterns(trafficMetrics) {
    const baseline = this.getTrafficBaseline();
    const currentTraffic = trafficMetrics.inbound;
    const spikePercentage = ((currentTraffic - baseline) / baseline) * 100;

    if (spikePercentage > this.alertThresholds.traffic_spike) {
      this.triggerAlert('TRAFFIC_SPIKE', {
        current: currentTraffic,
        baseline: baseline,
        spike: spikePercentage
      });
    }

    // 检测流量异常模式
    this.detectTrafficAnomalies(trafficMetrics);
  }

  // 检测流量异常
  detectTrafficAnomalies(trafficMetrics) {
    const recentTraffic = this.getRecentTrafficHistory(300000); // 最近5分钟

    // 使用统计方法检测异常
    const mean = this.calculateMean(recentTraffic);
    const stdDev = this.calculateStandardDeviation(recentTraffic, mean);
    const current = trafficMetrics.inbound;

    // 如果当前流量超出3个标准差，认为是异常
    if (Math.abs(current - mean) > 3 * stdDev) {
      this.triggerAlert('TRAFFIC_ANOMALY', {
        current: current,
        mean: mean,
        standardDeviation: stdDev,
        zScore: (current - mean) / stdDev
      });
    }
  }

  // 生成实时仪表板数据
  getDashboardData() {
    return {
      overview: {
        totalRequests: this.metrics.requests.total,
        blockedRequests: this.metrics.requests.blocked,
        attackStatus: this.metrics.attacks.ongoing > 0 ? 'under_attack' : 'normal',
        systemLoad: this.getSystemLoadPercentage()
      },
      traffic: {
        inbound: this.metrics.traffic.inbound,
        outbound: this.metrics.traffic.outbound,
        dropped: this.metrics.traffic.dropped,
        chart: this.getTrafficChartData()
      },
      attacks: {
        ongoing: this.metrics.attacks.ongoing,
        today: this.metrics.attacks.total_today,
        mitigated: this.metrics.attacks.mitigated,
        recent: this.getRecentAttacks()
      },
      performance: {
        averageResponseTime: this.getAverageResponseTime(),
        errorRate: this.getErrorRate(),
        throughput: this.getThroughput()
      },
      topAttackers: this.getTopAttackers(),
      blockedIPs: this.getBlockedIPs()
    };
  }

  // 获取流量图表数据
  getTrafficChartData() {
    const now = Date.now();
    const timeRange = 3600000; // 最近1小时
    const interval = 60000;    // 1分钟间隔

    const data = [];
    for (let i = timeRange; i >= 0; i -= interval) {
      const timestamp = now - i;
      const traffic = this.getTrafficAtTimestamp(timestamp);

      data.push({
        timestamp: new Date(timestamp),
        inbound: traffic.inbound,
        outbound: traffic.outbound,
        legitimate: traffic.legitimate,
        malicious: traffic.malicious
      });
    }

    return data;
  }

  // 获取最近的攻击记录
  getRecentAttacks() {
    return this.recentAttacks
      .filter(attack => Date.now() - attack.startTime < 86400000) // 最近24小时
      .map(attack => ({
        id: attack.id,
        type: attack.type,
        severity: attack.severity,
        startTime: new Date(attack.startTime),
        duration: attack.endTime ? attack.endTime - attack.startTime : Date.now() - attack.startTime,
        peakTraffic: attack.peakTraffic,
        status: attack.status
      }))
      .sort((a, b) => b.startTime - a.startTime)
      .slice(0, 10); // 最近10次攻击
  }

  // 获取顶级攻击者IP
  getTopAttackers() {
    const ipStats = this.getIPStatistics();

    return Object.entries(ipStats)
      .map(([ip, stats]) => ({
        ip: ip,
        requests: stats.total,
        blocked: stats.blocked,
        suspiciousScore: stats.suspiciousScore,
        country: stats.country,
        lastSeen: stats.lastSeen
      }))
      .sort((a, b) => b.suspiciousScore - a.suspiciousScore)
      .slice(0, 20); // 前20个可疑IP
  }

  // 获取被阻止的IP列表
  getBlockedIPs() {
    return this.blockedIPs
      .map(ip => ({
        address: ip.address,
        reason: ip.reason,
        blockedAt: new Date(ip.blockedAt),
        expiresAt: ip.expiresAt ? new Date(ip.expiresAt) : null,
        blockedRequests: ip.blockedRequests
      }))
      .filter(ip => !ip.expiresAt || ip.expiresAt > Date.now())
      .sort((a, b) => b.blockedAt - a.blockedAt);
  }
}
```

## 总结

DDoS防护是一个多层次、持续进化的安全领域。通过构建完整的防护体系：

1. **检测能力**：实时监控和智能识别各种DDoS攻击模式
2. **防护策略**：网络层、应用层和业务层的多层防护机制
3. **应急响应**：自动化和人工相结合的快速响应流程
4. **持续改进**：基于历史数据的防护策略优化

记住，DDoS防护不是一次性的部署，而是一个持续对抗和优化的过程。只有通过技术、流程和人员的有机结合，才能构建真正有效的DDoS防护体系，保护业务的连续性和可用性。