---
title: "加密与哈希工具全景：从 MD5 到国密"
slug: "crypto-security-overview"
date: 2026-10-20T11:35:00+08:00
draft: false
tags: ['加密', '哈希', '数字签名', '国密', '密码学']
categories: ['技术教程']
author: '有条工具团队'
summary: '学密码学最缺的不是教材，是能立刻"跑一遍看看"的练习台：哈希算一次、AES 加密再解回来、签名验一遍、把 RSA 密钥对摆出来看结构。这篇把站内加密与哈希工具按哈希、认证与派生、对称、非对称与签名、国密、令牌与密钥六条线收齐，全部浏览器本地计算，密钥和明文不出本机。'
---

## 为什么值得收藏这一篇

加密算法的知识很容易"看过就等于会了"：文档说 AES 分 CBC 和 GCM，说 RSA 公钥加密私钥解密，说 Ed25519 比 RSA 短——但没有一样东西在浏览器里跑一遍，这些句子留不下来。站内的加密家族正好当练习台：每个算法都有入口，输入样例、看到输出、再对照参数，一轮就懂一层。这篇把这条线完整铺开。

**合规提示：以下工具用于密码学学习、开发调试与自有数据的加解密，请勿用于非法侵入他人系统、破解非本人数据或规避法律监管。**

## 哈希家族：不是所有"摘要"都能用来防篡改

- [MD5 生成器](https://www.util.cn/tools/md5-generator/)：今天它的正确用法是校验下载完整性、做去重指纹——**别再拿它当安全用途**，碰撞早已被公开构造。
- [SHA 生成器](https://www.util.cn/tools/sha-generator/)：SHA-1 同样日落，日常从 SHA-256 起步，长内容或更高安全场景用 SHA-512。
- [BLAKE2 哈希](https://www.util.cn/tools/blake2-hash/)：比 SHA-256 更快、输出长度可变，b 和 s 两个变体分别面向宽平台和资源受限场景。
- [RIPEMD-160 哈希](https://www.util.cn/tools/ripemd160-hash/)：主要出现在比特币地址和 OpenPGP 里——看懂"地址为什么这么短"绕不开它。

四个放一起看，正好是一堂"哈希选型课"：速度、碰撞抗性、行业惯例三个维度，各占一头。

## 消息认证与密钥派生

哈希不带密钥，防"内容被改且伪造者知道算法"要上认证。[HMAC 生成器](https://www.util.cn/tools/hmac-generator/)给消息配一个密钥算摘要，接口签名、Webhook 校验都是这个套路；[HKDF 密钥派生器](https://www.util.cn/tools/hkdf-generator/)（RFC 5869）则相反——从一个弱密钥**扩**出多个强密钥，TLS 那类协议里"主密钥派生出会话密钥"就是它干的事。存密码是第三类专用场景：[Scrypt 哈希](https://www.util.cn/tools/scrypt-generator/)内存密集、可调 CPU/成本参数，[Argon2 哈希](https://www.util.cn/tools/argon2-hash/)是 2015 年密码哈希竞赛冠军、支持 2d/2i/2id 三种变体。共同点：**故意算得慢**，让撞库和暴力破解付出代价——这也是它们和 MD5 的本质区别。

## 对称加密：一把钥匙两头用

[AES 加密](https://www.util.cn/tools/aes-encrypt/)和 [AES 解密](https://www.util.cn/tools/aes-decrypt/)一对：加密端换一串密文，解密端换回明文，来回走一遍比读十页"分组密码模式"直观。想认识现代默认答案的，试 [ChaCha20-Poly1305](https://www.util.cn/tools/chacha20-poly1305/)：流加密加认证标签的 AEAD 组合，支持 AAD 附加认证数据——"密文不能被改"这件事，跑一次 AAD 校验失败就懂了。

## 非对称与签名：公钥随便发，私钥不落地

这一组按"生成→加密→解密→签名→验签→协商"的顺序练：

1. [RSA 密钥生成](https://www.util.cn/tools/rsa-generate/) 先产一对公私钥，看看 PEM 长什么样；
2. [RSA 加密](https://www.util.cn/tools/rsa-encrypt/) / [RSA 解密](https://www.util.cn/tools/rsa-decrypt/) 用公钥锁、私钥开；
3. [RSA 签名验签](https://www.util.cn/tools/rsa-sign-verify/) 反过来——私钥签、公钥验，支持 PKCS#1 v1.5 与 PSS 两种填充；
4. [ECDSA 椭圆曲线签名](https://www.util.cn/tools/ecdsa-tools/) 覆盖 P-256/P-384/P-521 和 secp256k1（区块链同款曲线），[Ed25519 签名](https://www.util.cn/tools/ed25519-tools/) 是 Curve25519 上的现代方案，密钥短、速度快，还支持 SSH 公钥格式。

签名线走完，"加密用公钥、签名用私钥"的方向感就该建立了；再往深一步是双方不见面怎么协商出同一把会话密钥（ECDH/X25519 那一类），站内另有独立工具，本篇先把签名线收扎实。

## 国密：SM2/SM3/SM4 一屏看全

做政企、金融、等保合规绕不开国产算法。[国密算法工具](https://www.util.cn/tools/gmsm-tools/)一个页面集齐三件套：SM2 对位 RSA/ECDSA（签名与加密）、SM3 对位 SHA-256（摘要）、SM4 对位 AES（分组加密）。和前面的国际算法一一对着跑，两边输出并排看，"国密不是另一套体系，是同一套体系的另一组标准答案"就具象了。

## 令牌与密钥的入口工具

[JWT 解析器](https://www.util.cn/tools/jwt-decode/)把 Token 拆成 Header、Payload、签名三段——**解析只是看，不代表相信**；要确认没被篡改，用 [JWT 验证器](https://www.util.cn/tools/jwt-verify/)带密钥验签，两步分开正是零信任的第一课。[SSH 密钥生成器](https://www.util.cn/tools/ssh-key-generator/) 支持 RSA 与 Ed25519 生成登录服务器、Git 用的密钥对；[OTP 动态口令](https://www.util.cn/tools/otp-generator/) 生成 TOTP/HOTP，兼容 Google Authenticator——把"密钥 + 时间"变成六位数字，动手演示双因子认证就靠它。

## 常见问题

### 这些工具能帮我破解别人的密码或文件吗？

不能，也不该。哈希工具可以比对"猜测值"的摘要，但速度设计面向验证而非爆破；加密工具要求持有正确的密钥或密码，没有钥匙就没有输出。工具的定位是学习与自有数据处理，超出这个范围即属违规使用。

### 明文和密钥会不会被上传？

不会。全部计算在浏览器本地完成，输入的明文、口令、私钥不发往服务器——这也正是本篇反复强调"本地"的原因：把密钥交给一个来路不明的在线加密站，本身就是安全反面教材。

## 小结

六条线各管一段：**哈希**（MD5/SHA/BLAKE2/RIPEMD）管指纹与选型认知，**认证与派生**（HMAC/HKDF/Scrypt/Argon2）管密钥与存密码，**对称**（AES/ChaCha20-Poly1305）管一把钥匙两头用，**非对称与签名**（RSA 三件套/ECDSA/Ed25519）管公钥体系，**国密**（SM2/SM3/SM4）管合规场景，**令牌与密钥**（JWT 解析验证/SSH/OTP）管日常凭据。全部浏览器本地运行，数据不出本机；再次提醒：仅限学习、调试与处理本人有权处理的数据。
