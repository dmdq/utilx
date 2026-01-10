# 网络工具 (network/) 分类规划文档

## 现有网络工具（9个）

1. dns-lookup.vue - DNS查询工具
2. godaddy-dns.vue - GoDaddy DNS工具
3. ip-address-convert.vue - IP地址转换
4. ip-info.vue - IP信息查询
5. url-encode.vue - URL编码
6. url-decode.vue - URL解码
7. url-params-builder.vue - URL参数构建
8. json-url-encode.vue - JSON URL编码
9. curl-to-code.vue - Curl转代码

---

## 规划新增工具（25个）

### 一、IP地址相关工具（5个）

#### 1. ip-subnet-calculator.vue - IP子网计算器
**功能描述**：
- 输入IP地址和子网掩码（或CIDR）
- 计算网络地址、广播地址、可用IP范围
- 显示子网信息（网络位、主机位、总主机数）
- 支持IPv4和IPv6

**核心功能**：
- CIDR格式转换（如 /24 → 255.255.255.0）
- 子网划分（VLSM）
- IP地址范围计算
- 子网掩码转换

#### 2. ip-range-calculator.vue - IP范围计算器
**功能描述**：
- 计算起始IP和结束IP之间的所有地址
- 支持CIDR表示法转换
- 计算IP数量
- 生成IP列表（可导出）

**核心功能**：
- 起始IP、结束IP转CIDR
- CIDR转IP范围
- IP地址包含检测
- IP范围验证

#### 3. ipv6-converter.vue - IPv6转换工具
**功能描述**：
- IPv6地址格式转换（压缩/展开）
- IPv4转IPv6映射地址
- IPv6地址验证
- 前缀计算

**核心功能**：
- IPv6地址标准化
- IPv6前缀计算
- IPv6地址压缩显示
- IPv4-mapped IPv6转换

#### 4. private-ip-detector.vue - 私有IP检测器
**功能描述**：
- 检测IP是否为私有地址
- 识别私有IP范围（10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16）
- 显示IP类型（公网/私网/本地环回）
- 批量检测

**核心功能**：
- 私有IP范围判断
- 保留IP地址识别
- ISP信息查询
- 地理位置显示

#### 5. ip-integer-converter.vue - IP整数转换器
**功能描述**：
- IP地址与长整型互转
- 支持大端序和小端序
- 批量转换
- 二进制显示

**核心功能**：
- IP → Integer
- Integer → IP
- 二进制显示
- 十六进制显示

---

### 二、URL相关工具（4个）

#### 6. url-parser.vue - URL解析器
**功能描述**：
- 解析URL各个组成部分
- 提取协议、域名、路径、参数、锚点
- URL验证
- 显示URL结构树

**核心功能**：
- 协议提取（http/https/ftp等）
- 域名提取
- 路径提取
- 查询参数解析
- 片段（锚点）提取

#### 7. url-builder.vue - URL构建器
**功能描述**：
- 可视化构建URL
- 添加/修改协议、域名、路径、参数
- 实时预览
- 参数自动编码

**核心功能**：
- 协议选择
- 域名输入
- 路径构建
- 参数添加/删除
- URL生成和复制

#### 8. slug-generator.vue - URL Slug生成器
**功能描述**：
- 将标题转换为URL友好的slug
- 支持多种slug风格（kebab-case, snake_case, camelCase）
- 移除特殊字符
- 自定义分隔符

**核心功能**：
- 文本转slug
- 多种风格选择
- 特殊字符处理
- 保留词过滤
- 批量生成

#### 9. url-shortener-helper.vue - 短链辅助工具
**功能描述**：
- 短链展开（解析真实URL）
- 短链参数分析
- UTM参数提取
- 批量展开

**核心功能**：
- 短链解析（支持多个短链服务）
- 重定向链路追踪
- UTM参数提取
- 批量处理

---

### 三、DNS相关工具（3个）

#### 10. dns-propagation-checker.vue - DNS传播检查器
**功能描述**：
- 检查DNS记录在全球DNS服务器的传播情况
- 多地域DNS查询
- 传播时间估算
- 可视化传播状态

**核心功能**：
- 多地域DNS服务器查询
- 传播状态显示
- TTL计算
- 传播地图可视化

#### 11. dns-sec-lookup.vue - DNSSEC查询工具
**功能描述**：
- 查询DNSSEC记录
- 验证DNS签名链
- 显示DNSKEY、DS、RRSIG记录
- DNSSEC状态检测

**核心功能**：
- DNSSEC记录查询
- 签名链验证
- 安全状态显示
- 记录详情展示

#### 12. mx-record-lookup.vue - MX记录查询器
**功能描述**：
- 查询域名的MX记录
- 显示邮件服务器优先级
- MX记录验证
- SPF记录查询

**核心功能**：
- MX记录查询
- 优先级显示
- 邮件服务器验证
- SPF/DKIM记录查询

---

### 四、网络编码/解码工具（4个）

#### 13. base64-url-encoder.vue - Base64 URL编码器
**功能描述**：
- Base64 URL安全编码
- 替换+和/为URL安全字符
- 文件名安全编码
- 标准Base64转换

**核心功能**：
- 标准Base64编码
- URL安全Base64编码
- 文本/文件互转
- 实时预览

#### 14. punycode-converter.vue - Punycode转换器
**功能描述**：
- 国际化域名(IDN)转Punycode
- Unicode转ASCII
- 多语言域名支持
- 域名验证

**核心功能**：
- 中文域名转Punycode
- Punycode转中文域名
- 多语言支持
- 域名有效性验证

#### 15. html-entity-encoder.vue - HTML实体编码器
**功能描述**：
- HTML实体编码/解码
- 特殊字符转换
- 支持命名实体和数字实体
- 批量处理

**核心功能**：
- 字符转HTML实体
- HTML实体解码
- 命名实体支持（&nbsp;, &copy;等）
- 数字实体支持
- 特殊字符处理

#### 16. unicode-escape.vue - Unicode转义工具
**功能描述**：
- Unicode转义序列编码/解码
- 支持\u格式和\u{}格式
- JavaScript/Java字符串转义
- Emoji处理

**核心功能**：
- 文本转Unicode转义
- Unicode转义解码
- JavaScript字符串转义
- Emoji转义
- 批量转换

---

### 五、网络计算工具（3个）

#### 17. download-time-calculator.vue - 下载时间计算器
**功能描述**：
- 根据文件大小和网络速度计算下载时间
- 支持多种网络速度（2G/3G/4G/5G/WiFi）
- 显示下载进度模拟
- 比特率换算

**核心功能**：
- 文件大小输入（自动识别单位）
- 网络速度选择
- 下载时间计算
- 多文件批量计算
- 速度单位换算

#### 18. bandwidth-converter.vue - 带宽转换器
**功能描述**：
- 网络带宽单位换算
- bps/Bps/KBps/MBps/GBps互转
- 下载/上传速度计算
- 流量使用计算

**核心功能**：
- 带宽单位转换
- 比特/字节转换
- KB/MB/GB转换
- 流量计算器
- 带宽需求估算

#### 19. network-latency-simulator.vue - 网络延迟模拟器
**功能描述**：
- 模拟不同网络延迟
- 计算延迟对应用的影响
- 带宽延迟乘积计算
- 丢包影响评估

**核心功能**：
- 延迟输入（ms）
- 带宽设置
- 丢包率设置
- RTT计算
- 延迟影响可视化

---

### 六、域名相关工具（2个）

#### 20. whois-lookup.vue - Whois查询工具
**功能描述**：
- 域名Whois信息查询
- 显示注册者信息
- 域名到期时间
- 域名状态

**核心功能**：
- Whois查询
- 注册信息显示
- 域名状态查询
- 到期时间计算
- 联系信息提取

#### 21. domain-age-checker.vue - 域名年龄查询
**功能描述**：
- 查询域名的注册年龄
- 域名历史时间线
- SEO建议
- 批量查询

**核心功能**：
- 域名创建日期查询
- 域名年龄计算
- SEO价值评估
- 批量域名查询
- 历史记录显示

---

### 七、端口相关工具（1个）

#### 22. port-checker.vue - 端口检测工具
**功能描述**：
- 检测端口是否开放
- 常用服务端口扫描
- 端口状态显示
- 防火墙诊断

**核心功能**：
- 单个端口检测
- 端口范围扫描
- 常用端口数据库（HTTP:80, HTTPS:443, SSH:22等）
- 连接测试
- 超时设置

---

### 八、HTTP相关工具（1个）

#### 23. http-header-analyzer.vue - HTTP头分析器
**功能描述**：
- 分析HTTP响应头
- 显示请求头和响应头
- 检测安全头（CORS, CSP等）
- 缓存策略分析

**核心功能**：
- 输入URL分析HTTP头
- 响应头解析
- 请求头生成
- 安全头检测
- 缓存控制分析
- CORS策略检查

---

### 九、网络安全工具（1个）

#### 24. ssl-cert-checker.vue - SSL证书检查器
**功能描述**：
- 检查SSL证书状态
- 显示证书详细信息
- 证书有效期检查
- 证书链验证

**核心功能**：
- SSL证书查询
- 证书有效期显示
- 颁发者信息
- 证书链验证
- 到期提醒
- 安全等级评估

---

### 十、子网工具（1个）

#### 25. cidr-calculator.vue - CIDR计算器
**功能描述**：
- CIDR表示法计算
- 子网掩码转换
- 地址范围计算
- 通配符掩码生成

**核心功能**：
- CIDR转子网掩码
- 子网掩码转CIDR
- IP地址范围计算
- 通配符掩码（如 *.0.0.0.0/0）
- 网络位/主机位分析
- 反向掩码计算

---

## 工具分类汇总

| 分类 | 工具数量 | 工具列表 |
|------|---------|---------|
| IP地址相关 | 5 | ip-subnet-calculator, ip-range-calculator, ipv6-converter, private-ip-detector, ip-integer-converter |
| URL相关 | 4 | url-parser, url-builder, slug-generator, url-shortener-helper |
| DNS相关 | 3 | dns-propagation-checker, dns-sec-lookup, mx-record-lookup |
| 网络编码/解码 | 4 | base64-url-encoder, punycode-converter, html-entity-encoder, unicode-escape |
| 网络计算 | 3 | download-time-calculator, bandwidth-converter, network-latency-simulator |
| 域名相关 | 2 | whois-lookup, domain-age-checker |
| 端口相关 | 1 | port-checker |
| HTTP相关 | 1 | http-header-analyzer |
| 网络安全 | 1 | ssl-cert-checker |
| 子网工具 | 1 | cidr-calculator |

**总计新增：25个工具**
**现有工具：9个**
**规划完成后总计：34个网络工具**

---

## 优先级建议

### 高优先级（常用、实用）
1. ip-subnet-calculator - IP子网计算器
2. url-parser - URL解析器
3. base64-url-encoder - Base64 URL编码器
4. download-time-calculator - 下载时间计算器
5. cidr-calculator - CIDR计算器

### 中优先级（专业、特定场景）
6. ip-range-calculator - IP范围计算器
7. url-builder - URL构建器
8. dns-propagation-checker - DNS传播检查器
9. ssl-cert-checker - SSL证书检查器
10. http-header-analyzer - HTTP头分析器

### 标准优先级（补充、完善）
11-25. 其余工具按需开发

---

## 技术实现建议

### 组件复用策略
- 创建通用的网络请求模块（用于DNS查询、Whois等）
- IP地址解析模块
- URL解析模块
- 网络计算模块

### API选择
- DNS查询：使用公共DNS API（如Cloudflare DoH, Google DoH）
- Whois查询：使用Whois API服务
- SSL证书查询：使用SSL Labs API
- IP信息：使用ip-api.com或ipinfo.io

### 性能优化
- API请求缓存
- 防抖处理
- 错误处理
- 加载状态显示

---

## 开发路线图

### 第一阶段（5个工具）
- IP子网计算器
- URL解析器
- Base64 URL编码器
- 下载时间计算器
- CIDR计算器

### 第二阶段（10个工具）
- IP范围计算器
- IPv6转换工具
- URL构建器
- Slug生成器
- DNS传播检查器
- MX记录查询器
- HTML实体编码器
- 带宽转换器
- 端口检测器
- HTTP头分析器

### 第三阶段（10个工具）
- 其余15个工具

---

## 备注

1. 所有工具遵循项目统一的设计风格
2. 支持深色/浅色主题
3. 响应式设计（移动端友好）
4. 包含使用示例和帮助文档
5. 添加相关工具推荐
6. SEO优化（meta标签、结构化数据）

---

*文档创建时间：2026-01-08*
*规划工具总数：25个*
