---
title: "AES、国密、Ed25519：19 件加密与哈希工具大盘点"
slug: "crypto-tools-roundup"
date: 2026-11-08T20:45:00+08:00
draft: false
tags: ['加密解密', '哈希', '网络安全', '开发者工具']
categories: ['效率工具']
author: '有条工具团队'
summary: '对接第三方要验签、用户口令不能明文入库、等保整改点名用国密——加密哈希的活又多又杂。这篇把站点 19 件加密与哈希工具分成对称加密、非对称与签名、口令哈希、校验与杂项四组，每件一句话。'
---

对接支付渠道要验签，用户注册的口令不能明文落库，等保整改通知点名要用国密——加密和哈希的活儿散在各个岗位，隔一阵不用就得现查，术语还特别容易混。站点的加密哈希工具攒到 19 件，这篇按「对称加密、非对称与签名、口令哈希、校验与杂项」四组理一遍，用的时候按图索骥。

## 对称加密：一把钥匙管两头

配置文件里的 API 密钥要落盘，先交给{{< tool id="aes-encrypt" >}}AES加密{{< /tool >}}包一层，再放对象存储才踏实。拿到同事发来的密文，用{{< tool id="aes-decrypt" >}}AES解密{{< /tool >}}配上同一把钥匙还原原文，交接文档不用口口相传。移动端性能紧张又要带认证的加密，{{< tool id="chacha20-poly1305" >}}ChaCha20-Poly1305加密{{< /tool >}}是 TLS 1.3 里的常客，低端设备跑它不费劲。等保合规点名国密，{{< tool id="gmsm-tools" >}}国密算法工具{{< /tool >}}把 SM2、SM3、SM4 一站测完。

## 非对称与签名：公钥锁、私钥开

接入开放平台前先造密钥，{{< tool id="rsa-generate" >}}RSA密钥生成{{< /tool >}}出一对 2048 位密钥，公钥上传平台、私钥本地收好。给合作方传敏感字段，用{{< tool id="rsa-encrypt" >}}RSA加密{{< /tool >}}拿对方公钥锁上再发。收到渠道回传的加密数据，{{< tool id="rsa-decrypt" >}}RSA解密{{< /tool >}}用自己的私钥打开。回调通知要防伪造，{{< tool id="rsa-sign-verify" >}}RSA签名验签工具{{< /tool >}}先验签再走业务，假回调拦在门外。对签名长度敏感的物联网设备，{{< tool id="ecdsa-tools" >}}ECDSA椭圆曲线签名{{< /tool >}}用更短的密钥达到同级强度。新式 SSH 密钥和现代协议首选{{< tool id="ed25519-tools" >}}Ed25519签名工具{{< /tool >}}，算得快还不容易用错。双方要在不安全信道上商量出同一把对称密钥，{{< tool id="diffie-hellman" >}}Diffie-Hellman密钥交换{{< /tool >}}就是干这个的老前辈。

## 口令哈希：库里只存摘要

新用户注册入库，{{< tool id="bcrypt-generate" >}}Bcrypt加密{{< /tool >}}自动加盐做慢哈希，拖慢暴力破解。登录时用{{< tool id="bcrypt-verify" >}}Bcrypt验证{{< /tool >}}比对哈希结果而不是比对明文，库里泄了也不裸奔。想让 GPU 也啃不动，{{< tool id="scrypt-generator" >}}Scrypt哈希生成器{{< /tool >}}用内存难度再加一堵墙。新项目可以直接上{{< tool id="argon2-hash" >}}Argon2哈希工具{{< /tool >}}，密码哈希竞赛的冠军方案。

## 校验与杂项：小件补齐缺口

固件升级包传完先核{{< tool id="crc-calculator" >}}CRC校验计算器{{< /tool >}}，确认传输没出错，刷机失败多半坏在这一步。一把主密钥要派生多把子密钥，{{< tool id="hkdf-generator" >}}HKDF密钥派生器{{< /tool >}}按标准流程走。嫌 MD5 太弱又想要速度，{{< tool id="blake2-hash" >}}BLAKE2哈希计算器{{< /tool >}}两头兼顾。对接比特币地址这类还在用老算法的协议，{{< tool id="ripemd160-hash" >}}RIPEMD-160哈希计算器{{< /tool >}}随时能补位。

19 件加密哈希工具全部在浏览器本地运行，密钥和明文都不出浏览器。加密只是防护的一道门，证书、响应头这些外围自查，收录在[隐私防护套装](/collections/privacy-shield/)专题里，值得配着一起看。
