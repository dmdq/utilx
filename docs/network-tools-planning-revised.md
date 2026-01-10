# 网络工具 (network/) 分类重新规划文档

## 已存在的网络相关工具（共49个）

### 编码/解码类（15个）
1. base32-encode.vue - Base32编码
2. base58-encode.vue - Base58编码
3. base62-encode.vue - Base62编码
4. base64-decode.vue - Base64解码
5. base64-encode.vue - Base64编码
6. base64-file-converter.vue - Base64文件转换器
7. base64-image.vue - Base64图像工具
8. html-decode.vue - HTML解码
9. html-encode.vue - HTML编码
10. html-entities-encoder.vue - HTML实体编码器
11. mime-encode.vue - MIME编码
12. punycode-convert.vue - Punycode转换
13. uuencode.vue - UUEncode编码
14. url-decode.vue - URL解码
15. url-encode.vue - URL编码

### IP/网络工具类（14个）
16. dns-lookup.vue - DNS查询
17. godaddy-dns.vue - GoDaddy DNS
18. http-client.vue - HTTP客户端
19. http-header-analyzer.vue - HTTP头分析器
20. ip-address-convert.vue - IP地址转换
21. ip-info.vue - IP信息查询
22. json-url-encode.vue - JSON URL编码
23. mac-address-convert.vue - MAC地址转换
24. port-checker.vue - 端口检测
25. ssl-checker.vue - SSL证书检查
26. ssl-tls-checker.vue - SSL/TLS检查
27. subnet-calculator.vue - 子网计算器
28. url-params-builder.vue - URL参数构建
29. websocket-test.vue - WebSocket测试

### 域名/其他类（20个）
30. curl-to-code.vue - Curl转代码
31. html-slug-generator.vue - HTML Slug生成器
32. hmac-generator.vue - HMAC生成器
33. jwt-decode.vue - JWT解码
34. web-component-analyzer.vue - Web组件分析器
35-49. (其他工具)

---

## 规划新增工具（精选12个真正缺失的工具）

### 一、IPv6专用工具（2个）

#### 1. ipv6-address-converter.vue - IPv6地址转换器
**功能描述**：
- IPv6地址格式转换（压缩↔展开）
- IPv6前缀计算器
- IPv6地址验证
- IPv4-mapped IPv6地址转换

**与现有工具区别**：
- 现有：`ip-address-convert.vue` 主要处理IPv4
- 新增：专门处理IPv6的特殊格式（如::1缩写）

**核心功能**：
```javascript
// 示例功能
输入：2001:0db8:85a3::8a2e:0370:7334
输出：2001:0db8:85a3:0000:0000:8a2e:0370:7334 (展开)
     2001:db8:85a3::8a2e:370:7334 (压缩)

前缀计算：
输入：2001:0db8:85a3::/48
输出：网络前缀：2001:0db8:85a3::
     起始地址：2001:db8:85a3::
     结束地址：2001:db8:85a3:ffff:ffff:ffff:ffff
```

#### 2. ipv6-scope-calculator.vue - IPv6地址范围计算器
**功能描述**：
- 计算IPv6地址范围
- SLAAC地址计算
- IPv6前缀规划工具
- EUI-64地址生成

**核心功能**：
- IPv6前缀/后缀计算
- 地址范围生成
- EUI-64格式转换
- 接口标识符生成

---

### 二、高级DNS工具（3个）

#### 3. dns-cache-flusher.vue - DNS缓存刷新工具
**功能描述**：
- 检测DNS缓存状态
- 提供清除DNS缓存的指导
- 不同操作系统的清除命令
- DNS传播时间估算

**核心功能**：
- 操作系统检测（Windows/Mac/Linux）
- 清除命令生成
- 缓存验证工具
- TTL查询
- 刷新指南（浏览器、OS、路由器）

#### 4. dns-sec-verifier.vue - DNSSEC验证工具
**功能描述**：
- 验证域名的DNSSEC状态
- 检查签名链完整性
- 显示DNSKEY/DS/RRSIG记录
- 安全状态评估

**与现有工具区别**：
- 现有：无专门的DNSSEC工具
- 新增：专注DNS安全扩展验证

**核心功能**：
- DNSSEC状态查询
- 签名链验证
- 密钥算法显示
- 安全等级评估

#### 5. txt-record-editor.vue - TXT记录编辑器
**功能描述**：
- DNS TXT记录生成器
- SPF记录构建
- DKIM记录生成
- 验证TXT记录格式

**核心功能**：
- TXT记录生成（支持多行）
- SPF记录向导
- DKIM记录生成
- 记录验证
- 常用模板

---

### 三、网络性能测试工具（2个）

#### 6. network-speed-test.vue - 网络速度测试
**功能描述**：
- 下载/上传速度测试
- 延迟和抖动测试
- 网络质量评估
- 历史记录对比

**核心功能**：
- 速度测试（选择服务器）
- Ping测试
- 抖动测试
- 丢包率检测
- 测试报告生成

#### 7. route-tracer.vue - 路由追踪工具
**功能描述**：
- 可视化路由追踪
- Traceroute结果展示
- 跳数和延迟分析
- 地理位置显示

**核心功能**：
- ICMP/UDP追踪
- 跳数统计
- 延迟分析
- 地理IP定位
- 路由地图可视化

---

### 四、URL高级工具（2个）

#### 8. url-canonicalizer.vue - URL标准化工具
**功能描述**：
- URL标准化处理
- 移除跟踪参数
- 添加/删除WWW
- 统一协议（http/https）

**核心功能**：
- URL标准化
- 移除UTM参数（可选保留）
- 协议统一
- 大小写规范化
- 尾部斜杠处理

#### 9. open-graph-validator.vue - Open Graph验证器
**功能描述**：
- 验证URL的Open Graph标签
- 显示OG标签内容
- 社交媒体预览模拟
- 提供优化建议

**核心功能**：
- URL的OG标签抓取
- 标签完整性检查
- 社交预览模拟（Facebook/Twitter/LinkedIn）
- 图片验证
- 优化建议生成

---

### 五、网络安全工具（1个）

#### 10. cors-tester.vue - CORS测试工具
**功能描述**：
- 测试跨域请求
- 显示CORS头信息
- 诊断CORS错误
- 生成CORS配置

**核心功能**：
- CORS请求测试
- 响应头分析
- 预检请求检测
- 错误诊断
- 配置代码生成（各种后端）

---

### 六、WebSocket/WebRTC工具（1个）

#### 11. webrtc-diagnostics.vue - WebRTC诊断工具
**功能描述**：
- WebRTC连接测试
- STUN/TURN服务器测试
- ICE候选分析
- 媒体统计显示

**与现有工具区别**：
- 现有：`websocket-test.vue` 是基础WebSocket测试
- 新增：专门测试WebRTC的P2P连接

**核心功能**：
- 浏览器兼容性检查
- ICE收集分析
- TURN/STUN连接测试
- 媒体质量测试
- 连接状态监控

---

### 七、数据分析工具（1个）

#### 12. user-agent-parser.vue - User Agent解析器
**功能描述**：
- 解析User-Agent字符串
- 显示浏览器、操作系统信息
- 设备类型识别（手机/平板/桌面）
- 爬虫/机器人检测

**核心功能**：
- UA字符串解析
- 浏览器信息提取
- 操作系统信息
- 设备类型识别
- 爬虫检测
- UA信息统计

---

## 新工具分类汇总

| 分类 | 工具数量 | 工具列表 |
|------|---------|---------|
| IPv6专用 | 2 | ipv6-address-converter, ipv6-scope-calculator |
| 高级DNS | 3 | dns-cache-flusher, dns-sec-verifier, txt-record-editor |
| 网络性能 | 2 | network-speed-test, route-tracer |
| URL高级 | 2 | url-canonicalizer, open-graph-validator |
| 网络安全 | 1 | cors-tester |
| WebRTC | 1 | webrtc-diagnostics |
| 数据分析 | 1 | user-agent-parser |

**总计新增：12个高价值工具**
**避免重复，精选实用**

---

## 为什么只规划12个？

### 原因说明
1. **避免重复**：现有工具已覆盖大部分基础需求
2. **精选实用**：只添加真正有用且缺失的工具
3. **专业化**：每个工具都有明确的应用场景
4. **可维护性**：避免工具过多导致维护困难

### 已有但可以增强的工具
这些工具可以考虑增强功能：
- `base64-encode.vue` → 可添加Base64 URL安全模式切换
- `subnet-calculator.vue` → 可添加IPv6支持
- `port-checker.vue` → 可添加批量端口扫描
- `whois-lookup.vue` → 可添加域名历史查询
- `ssl-checker.vue` → 可添加证书链完整性检查

---

## 开发优先级建议

### P0（核心工具，立即开发）
1. **ipv6-address-converter** - IPv6普及需要
2. **network-speed-test** - 用户需求大
3. **url-canonicalizer** - SEO常用

### P1（实用工具，第二阶段）
4. **dns-cache-flusher** - 开发调试必备
5. **cors-tester** - 前端开发常用
6. **user-agent-parser** - 数据分析需要

### P2（专业工具，按需开发）
7-12. 其余6个专业工具

---

## 技术实现建议

### 复用现有模块
- IP解析模块（从`ip-address-convert.vue`提取）
- URL解析模块（从`url-encode.vue`提取）
- Base64模块（从`base64-encode.vue`提取）
- HTTP请求模块（从`http-client.vue`提取）

### API推荐
```javascript
// 网络速度测试
- SpeedTest.net API（不可用）
- Cloudflare Speed Test
- 自建测速节点

// DNS相关
- Cloudflare DNS (1.1.1.1)
- Google DNS (8.8.8.8)
- DoH (DNS over HTTPS)

// IPv6相关
- 自建IPv6测试
- IPv6公共DNS

// 社交媒体预览
- Facebook Debugger API
- Twitter Card Validator
- LinkedIn Post Inspector
```

### 性能优化
- API请求限流
- 结果缓存策略
- 懒加载组件
- 离线功能支持

---

## 对比分析

### 与现有工具的关系

| 新工具 | 类似现有工具 | 主要区别 |
|--------|---------------|---------|
| ipv6-address-converter | ip-address-convert | 专注IPv6格式 |
| dns-cache-flusher | dns-lookup | 侧重缓存刷新 |
| dns-sec-verifier | ssl-checker | 侧重DNS安全 |
| url-canonicalizer | url-encode | 规范化URL |
| open-graph-validator | http-header-analyzer | 社交媒体标签 |
| network-speed-test | 无 | 全新功能 |
| route-tracer | 无 | 全新功能 |
| cors-tester | http-header-analyzer | CORS专项 |
| webrtc-diagnostics | websocket-test | WebRTC专项 |
| user-agent-parser | http-header-analyzer | UA专项 |

---

## 工具命名规范

遵循现有命名风格：
- 小写字母
- 连字符分隔
- 功能描述清晰
- 简洁易记

示例：
- ✅ ipv6-address-converter
- ✅ dns-cache-flusher
- ✅ url-canonicalizer
- ✅ user-agent-parser

---

*重新规划时间：2026-01-08*
*现有工具：49个*
*规划新增：12个*
*精选实用，避免重复*
