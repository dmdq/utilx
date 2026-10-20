---
title: "网站安全自查工具箱：上线前过一遍"
slug: "security-toolbox"
date: 2026-10-20T11:40:00+08:00
draft: false
tags: ['网站安全', '安全头', 'XSS', '数据脱敏', '密钥管理']
categories: ['技术教程']
author: '有条工具团队'
summary: '新功能上线前那一小时，最该过的不是功能测试，是安全清单：头配没配、CORS 开没开大、密钥有没有写进代码、手机号有没有原样回显。这篇把站内安全自查工具排成一条流水线——响应头、传输、注入、数据、凭据、本地加密六站，逐个过完再点发布。全部浏览器本地计算，检测样本不出本机。'
---

## 为什么值得攒一篇"上线前过一遍"

绝大多数翻车的安全问题，不是高深漏洞，是**没人检查过的配置**：CSP 没配、`Server` 响应头裸奔、测试时塞进代码的 API Key 忘了删、接口返回整条手机号。这些每一项都有免费工具能在几分钟内核一遍，但没人会把二十几个入口记全。这篇就干这件事：按上线流程把站内安全工具串成一条固定动线，收藏一次，以后每次发布照着走。

**合规提示：本清单仅用于检查你自己拥有或有权测试的系统。** 检测器、扫描器都是"输入样本给判断"的工具，拿去测未授权的目标网站属于违规行为。

## 第一站：响应头——门户关没关好

- [安全头检查器](https://www.util.cn/tools/security-headers-check/)：给自家站点 URL 跑一遍，CSP、HSTS、X-Frame-Options 等配置逐项打分并给改进建议，是整个清单的第一入口。
- [HTTP 头分析器](https://www.util.cn/tools/http-header-analyzer/)：不止安全头，缓存策略、跨域响应头一起分析——排查"改了配置怎么没生效"时比检查器更细。
- [CSP 策略生成器](https://www.util.cn/tools/csp-builder/)：检查发现没配 CSP 的，用它可视化勾选资源来源，预设模板起步，生成策略头直接贴进 Nginx 或 meta。
- [CORS 配置生成器](https://www.util.cn/tools/cors-configurator/)：跨域需求明确后，生成 Nginx/Apache/Node.js 对应配置，别再用 `Access-Control-Allow-Origin: *` 一把梭。

## 第二站：传输层——证书和协议

[SSL/TLS 配置检查器](https://www.util.cn/tools/ssl-tls-checker/)核协议版本与套件安全性，看有没有还在兼容老旧 TLS；[证书验证器](https://www.util.cn/tools/certificate-validator/)核证书链、有效期和配置——**证书过期是典型"迟早发生"事故**，两个工具各花一分钟，换掉一个深夜告警。

## 第三站：输入口——注入样本自测

新接口接收自由文本的，先投喂测试：[XSS 攻击检测器](https://www.util.cn/tools/xss-detector/)判断输入里有没有脚本攻击代码并给防护建议；[SQL 注入检测器](https://www.util.cn/tools/sql-injection-scanner/)同理盯拼接查询。定位是"发布前拿典型用户输入过一遍"，检测通过不等于刀枪入库，参数化查询和输出转义仍要在代码层落实。

## 第四站：数据面——别把敏感信息带上线

[敏感信息扫描器](https://www.util.cn/tools/secret-scanner/)扫一段代码或配置，API 密钥、密码、令牌无所遁形——提交前扫一遍 diff，密钥泄露大多止于此；[PII 信息检测器](https://www.util.cn/tools/pii-detector/)扫文本中的身份证号、手机号、邮箱、银行卡号，日志样例和接口返回值先过它这关；确认有敏感字段的，用 [数据脱敏工具](https://www.util.cn/tools/data-masking-tool/)处理后再接测试、演示、截图。**"截图发给前端联调"是 PII 泄露成本最低的路径，脱敏应该是 reflex。**

## 第五站：凭据——口令、密钥、令牌

[密码生成器](https://www.util.cn/tools/password-generator/)出高熵口令，[密码强度检测器](https://www.util.cn/tools/password-strength-checker/)负责评估现有口令并给改进建议，一发一检；Nginx/Apache Basic Auth 场景用 [htpasswd 生成器](https://www.util.cn/tools/htpasswd-generator/)直接出条目和配置片段。管第三方凭据用 [API 密钥管理器](https://www.util.cn/tools/api-key-manager/)——本地加密存储，别再开一个 `keys.txt`；给自家系统发令牌（API Token、CSRF Token 等）走 [安全令牌生成器](https://www.util.cn/tools/token-generator/)，[加密伪随机数生成器](https://www.util.cn/tools/crypto-prng/)基于 Web Crypto API 出密码学安全的随机数——记住：**盐、nonce、密钥都用 Math.random 生成本身就是漏洞**。

## 第六站：加密与哈希——存储侧的本地实现

- 口令存储三件套：[BCrypt](https://www.util.cn/tools/bcrypt-generator/) 可调成本因子、[Argon2](https://www.util.cn/tools/argon2-hasher/) 自定义内存与并行度、[PBKDF2](https://www.util.cn/tools/pbkdf2-generator/) 自定义迭代与盐值——新用户注册系统，从这三个里选，MD5 存密码请直接进历史博物馆。
- 数据加解密：[AES 加密/解密工具](https://www.util.cn/tools/aes-encryptor/) 走 AES-256 的 CBC/GCM 模式，全程浏览器本地；[RSA 密钥对生成器](https://www.util.cn/tools/rsa-key-pair/) 多长度可选、导出 PEM——和加密全景篇（[《加密与哈希工具全景》](https://www.util.cn/blog/articles/crypto-security-overview/)）配合，那边讲原理选型，这边管落地操作。

## 常见问题

### 安全头检查拿满分，网站就安全了吗？

不是。检查器管的是"防御配置"这一层：不防注入、不防弱口令、不防业务逻辑漏洞。正确理解是**底线题**——满分说明门栓都落了，丢分说明有人在白送；分数之外的战场要靠注入检测、代码扫描和开发规范补。

### 扫描器没检出密钥，就能放心提交吗？

不能保证。特征扫描覆盖常见格式，混淆过、拆散存、写进注释的它未必认识。扫描是兜底，正解是密钥不进仓库：环境变量或本地密钥管理器（第五站那两个）从源头断掉"复制粘贴"的机会。

## 小结

六站动线背下来就是清单：**头（安全头/HTTP 头/CSP/CORS）→ 传输（TLS/证书）→ 输入（XSS/SQL 注入）→ 数据（敏感扫描/PII/脱敏）→ 凭据（生成/强度/htpasswd/API Key/令牌/随机数）→ 存储（三哈希 + AES/RSA）**。一次自查十分钟，换来的是"发布那一下我心里有底"。全部工具浏览器本地运行，URL、代码片段、样本数据都不上传——安全自查工具自己先别成为泄露渠道。
