---
title: "编码解码全家桶：Base64 之外还有这 30+ 种"
slug: "encode-toolbox"
date: 2026-10-20T10:30:00+08:00
draft: false
tags: ['编码解码', 'Base64', '转义', '校验']
categories: ['效率工具']
author: '有条工具团队'
summary: '日常说的"编码"往往只剩 Base64 和 URL 编码，但真出问题时的对手多半不在这两个里：鉴权密钥是 Base32、邮件正文里的 =3D 是 Quoted-Printable、"看着一样却匹配不上"的文本里藏着零宽字符。这篇把站内编码家族的 30 多款工具按传输编码、加密入门、转义防注入、校验与底层四条线一次收齐，全部浏览器本地计算，数据不出本机。'
---

## 编码这件事，用到时才知道家族有多大

先说为什么要收藏这篇。写代码时最常被提起的编码是 Base64 和 URL 编码，但排查问题的现场远比这两个词汇丰富：登录器绑不上的密钥是一串 A-Z 加 2-7 的 Base32，老邮件客户端发出来的正文满屏 `=3D`，复制粘贴的文本看着一模一样程序却判了不等，证书里中文域名显示成 `xn--` 开头的乱码。编码家族在站内已经有 40 多款工具，多数只在深夜排障时才有存在感——按"传输、入门加密、转义、校验"四条线过一遍，遇到没见过的形态先回这里查归属，比临时搜到一堆带上传框的野站强。

## 传输编码：让数据安全穿过"只认字符"的关卡

编码家族存在的理由只有一个：很多通道（URL、邮件、XML）只允许有限的字符安全通过，二进制和特殊字符必须先"换装"。换装方案不同，膨胀率和适用场景也不同：

| 方案 | 字符集 | 体积膨胀 | 典型场景 |
| --- | --- | --- | --- |
| Base32 | A-Z、2-7，大小写不敏感 | 8/5 = 1.6 倍 | TOTP 密钥（验证器 App 显示的初始密钥就是它） |
| Base58 | 去掉了 0、O、I、l 的字母数字表 | 约 1.4 倍 | 比特币地址、短链——去掉易混字符防手抄出错 |
| Base62 | 0-9A-Za-z，无填充符 | 约 1.34 倍 | 短链接、URL 安全的 ID |
| Base85 | 更宽的可打印 ASCII | 5/4 = 1.25 倍 | 二进制内嵌文本，比 Base64 还省四分之一 |

对照表里四行各有各的工具：[Base32编码](https://www.util.cn/tools/base32-encode/)编解码双向支持，RFC 4648 标准字符集；[Base58编码](https://www.util.cn/tools/base58-encode/)和[Base62编码](https://www.util.cn/tools/base62-encode/)面向短链接和地址类场景；[Base85编码转换](https://www.util.cn/tools/base85-encoder/)兼容 Ascii85，Git 二进制补丁里用的就是这一族，UTF-8 中文直接可用。

邮件是编码家族的老战场，三款经典方案站内齐了：[MIME 编码工具](https://www.util.cn/tools/mime-encode/)处理附件和 HTTP 表单的标准 Base64 换装；[Quoted-Printable编码](https://www.util.cn/tools/quoted-printable/)走的是另一思路——可打印字符原样保留，只把特殊字符写成 `=3D` 这类十六进制，正文以 ASCII 为主时几乎不膨胀、肉眼还能读；[UUEncode 编码工具](https://www.util.cn/tools/uuencode/)则是 MIME 之前的上古方案，翻旧存档、老 BBS 导出文件时认得出 `begin/end` 结构就不慌。

字符与域名层的两款：[Unicode编码转换](https://www.util.cn/tools/unicode-convert/)负责文本和 `\uXXXX` 转义序列互转，中文和 Emoji（代理对）都覆盖；含中文的国际化域名在 DNS 层其实是 `xn--` 开头的 ASCII，[Punycode编码转换](https://www.util.cn/tools/punycode-convert/)把中文域名和 Punycode 原形双向转出来，排查证书、防仿冒域名时看的是这个。网络层还有两位常客的补位：[URL解码](https://www.util.cn/tools/url-decode/)还原 `%E4%BD%A0` 这类转义，[HTML编码](https://www.util.cn/tools/html-encode/)把 `<`、`>`、`&` 转成实体——往博客里贴代码不被当成标签吞掉就靠它，反向还原用站内已有的 HTML 解码页。

## 加密入门：三位"不算加密"的经典

这一组严格说都不是加密——替换类密码学的安全性约等于无，但它们是理解密码学的第一课，而且各有真实用途。[ROT13 加密工具](https://www.util.cn/tools/rot13/)把字母表对折，A 换 N、N 换 A，自己就是自己的逆操作，论坛遮剧透的传统艺能；[凯撒密码工具](https://www.util.cn/tools/caesar-cipher/)支持自定义偏移量，1 到 25 种可能——也正因为只有 25 种，穷举一秒破，理解了这个就理解了"密钥空间"。[摩尔斯电码工具](https://www.util.cn/tools/morse-code/)做文本与点划互译还能播放声音，SOS 的三短三长三短可以自己听一遍。

最实用的是[零宽字符编码器](https://www.util.cn/tools/zero-width-encoder/)：把信息编进不可见的零宽字符，藏进一段正常文本里做水印溯源——员工手册、内部文档外传时，文本看不出差别，解出水印就知道出处。它同样提供检测和清理，怀疑被"种"了水印的文本（招聘圈真发生过简历隐形标记的事件）先丢进去照个原形。

## 转义防注入：五类字符，五种通道

转义和编码解决的是同一类问题——特殊字符会被通道"误读"——只是通道不同，规则不同：[SQL转义](https://www.util.cn/tools/sql-escape/)处理引号和反斜杠，防 SQL 注入；要提醒一句，**转义是应急和排查手段，正式写代码请优先参数化查询**。[正则转义](https://www.util.cn/tools/regex-escape/)把用户输入里的 `.`、`*`、`(` 等元字符降级为字面量，做搜索框功能时少写一个 bug。[CSS转义](https://www.util.cn/tools/css-escape/)对付以数字开头、带点的选择器和中文类名；[JS字符串转义](https://www.util.cn/tools/js-string-escape/)支持单引号、双引号、模板字符串三种格式的转义与反转义，把一段 HTML 塞进 JS 字符串时最见功力。多语言混排的转义需求，XML 通道也有对应的转义工具。

## 校验与底层：数字、位和字节

最后一组是"看穿数据本体"的工具。传输检错看[纵向冗余校验 LRC](https://www.util.cn/tools/lrc-check/)——把数据字节逐位求和得一个校验字节，简单但弱，成对错误会漏网；[CRC 校验工具](https://www.util.cn/tools/crc-check/)用多项式除法，CRC32 就是文件校验的常见档，支持多种标准对照。[位运算计算器](https://www.util.cn/tools/bit-calculator/)把 AND、OR、XOR、NOT、左右移摆在一个界面里，画 IP 掩码、拆协议字段时比心算可靠。网络标识换算交给两位专才：[IP地址转换](https://www.util.cn/tools/ip-address-convert/)在 IPv4 与十进制、十六进制、二进制之间互转（192.168.0.1 的十进制是 3232235521），[MAC地址转换](https://www.util.cn/tools/mac-address-convert/)统一冒号、横杠、Cisco 点分三种写法。拿到一个"后缀不对"的文件，用[二进制查看器](https://www.util.cn/tools/binary-viewer/)按十六进制+ASCII 打开看文件头最诚实：`89 50 4E 47` 是 PNG、`FF D8` 是 JPEG、`25 50 44 46` 是 PDF，改后缀骗不了魔数。顺带一提，如果是 GBK/UTF-8 互相咬成乱码，那是字符集问题不是编码问题，看[《中文乱码终结指南》](https://www.util.cn/blog/articles/chinese-mojibake-fix-guide/)。

## 常见问题

### Base64 能当加密用吗？敏感数据编一下敢放前端？

不能。Base64 是可逆编码，拿到密文等于拿到原文，任何语言一行代码就能解回。它的作用只是让二进制安全穿过只认字符的通道。要保密请走真正的加密和鉴权，编码这一步谁都可以脱。

### 一段文本看着完全正常，程序却判"不相等"，怎么回事？

先怀疑不可见字符：零宽空格、全角空格、组合符号。把两段都丢进零宽字符编码器的检测功能照一遍，再用清理功能还原成"裸文本"再比较，多数玄学差异到这一步就现形了。

## 小结

四条线各归各位：**传输编码**认 Base32/58/62/85 的膨胀率表、邮件三件套（MIME、Quoted-Printable、UUEncode）、Punycode 与 Unicode；**入门加密**看 ROT13、凯撒、摩尔斯，实战用零宽水印；**转义防注入**按通道选 SQL/正则/CSS/JS；**校验与底层**用 LRC/CRC、位运算、IP/MAC 换算和二进制查看器收尾。和站内其他工具一样，这批工具全部在浏览器本地计算、内容不上传服务器——密钥、Token、内部文档这些最敏感的输入，本来就不该离开本机。
