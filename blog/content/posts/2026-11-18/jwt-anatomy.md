---
title: "JWT 解剖：base64url 的三段结构、HMAC 签名验证与 alg=none 那扇没锁的门"
slug: "jwt-anatomy"
date: 2026-11-18T08:00:00+08:00
draft: false
tags: ['JWT', 'HMAC', 'RSA', 'Web Crypto']
categories: ['技术笔记']
author: '有条工具团队'
summary: 'JWT 是两个点号隔开的三段字符串：header.payload.signature，前两段只是 base64url 编码的 JSON——不加密、可徒手读出；第三段才是安全性的全部来源。这篇拆解三段结构、base64url 与标准 base64 的三处差异、HS256 用 WebCrypto 验签的完整流程、RS256 公钥验签的分工，以及 payload 里的 exp/nbf/iat 时间声明和历史上著名的 alg=none 攻击为什么能得手。'
---

## 三段字符串，两个能徒手读

抓包看到的 `eyJhbGciOiJIUzI1NiIs...` 开头的长串就是 JWT（JSON Web Token）：两个点号把它切成三段——header、payload、signature。前两段**不是加密，只是编码**：base64url 解开就是明文 JSON，`ey` 开头正是 `{"` 的 base64 形态。用记事本就能读出 token 里装了什么（用户 ID、角色、过期时间）——所以「token 里能放什么」是纪律问题不是技术问题：任何拿到它的人都能看见内容。

第三段签名是 JWT 安全模型的全部：签发方用密钥对「header + payload」这段字节做不可伪造的运算，验证方重算比对。改一个字符的 payload，签名立刻失配——完整性靠它，身份认证也靠它（没有密钥的人造不出合法签名）。

## base64url：为 URL 生病的 base64

JWT 用的是 base64 的 URL 安全变体，三处改动：标准 base64 的 `+` 换成 `-`、`/` 换成 `_`（这两个在 URL 里有特殊含义），填充用的 `=` 全部去掉（长度信息由 JWT 的分段结构隐含）。手写解码时要补齐 padding 再喂给 atob，少这步是新手解析器最常见的翻车点。

## 验签：HS256 与 RS256 的分工

**HS256**（HMAC-SHA256）：对称密钥——签发与验证用同一个密钥。WebCrypto 验签三步：`importKey`（HMAC 算法导入密钥字节）→ 以 `signing input`（header 段原文 + `.` + payload 段原文，注意是**段原文不是解码后的 JSON**）为数据算 HMAC → 与第三段的 base64url 解码字节做**恒定时间比较**。最后一步的门道在「恒定时间」：逐字节短路比较的耗时差异会被高精度计时侧信道放大出密钥信息，密码学比较函数（如 `crypto.subtle.verify`）内部已做等时处理，手写循环比较要显式避免提前返回。

**RS256**（RSA-SHA256）：非对称——签发方持私钥，验证方只需公钥。多一方信任的体系就此成立：微服务各自持公钥即可验证网关签发的 token，私钥永不出签发方。代价是慢一个数量级、token 签名段更长（RSA 签名 256 字节起，HMAC-SHA256 是 32 字节）。选型经验：单体应用 HS256 够用，跨服务/跨组织发 token 用 RS256/ES256。

## exp：一行数字的时间法

payload 里的时间声明是纯数字 Unix 秒：`exp`（过期时刻）、`nbf`（not before，生效时刻）、`iat`（签发时刻）。验证 = `Date.now()/1000 < exp`，简单但有坑：**时钟偏移**——验证机与签发机差几十秒，就会出现在 A 机有效、B 机已过期的灵异事件，严谨的实现留 30–60 秒的 leeway 容差；**exp 不自动续期**——过期就得重新签发，刷新令牌那套机制就是为补这个缺口发明的。

## alg=none：规范里那扇没锁的门

JWT 规范允许 `alg: none`——不签名、第三段为空。这本为明文调试场景设计，却成了经典漏洞的源头：早期一些验证库**信任 token header 里声明的算法**——攻击者把 payload 里的管理员标志改成 true、header 的 alg 改成 none、删掉签名段，验证库一看「不用验签」就放行了。教训写进了所有后来的实现：**算法必须由服务端预先指定**，header 里声明什么只作一致性校验，绝不能成为「按你的算法来」的依据。这也是「验证 JWT 时永远显式选择算法」这条安全军规的出处。

{{< tool id="jwt-parser" >}}JWT解析器{{< /tool >}}本地解析三段结构、按 HS256/384/512 与 RS256 验签（密钥不出浏览器）、高亮过期时刻——联调时把它和 {{< tool id="base64-encode" >}}Base64编解码{{< /tool >}}放一起，token 的每一段都能摊开看。签名验证之外，站内另一套「密钥派生 60 万次迭代」的对称加密在[AES-GCM 那篇](/blog/articles/aes-gcm-authenticated-encryption/)里拆过。JWT 与 Mock、CORS 排查这些联调工具，收在[接口联调工具包](/collections/api-debug-kit/)专题里。
