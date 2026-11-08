---
title: "HTML 实体、Base85、摩斯电码：22 件编码转换工具一次理清"
slug: "encoding-conversion-roundup"
date: 2026-11-08T19:05:00+08:00
draft: false
tags: ['编码转换', 'Base64', '字符转义', '开发者工具']
categories: ['效率工具']
author: '有条工具团队'
summary: '调试时收到一串天书不知道怎么解？这篇把站点里 22 件编码转换工具按场景分成四组：Web 转义三件套、代码转义、Base 家族，以及从二进制到摩斯电码的字符与古典编码。'
---

调试接口时收到一串 `%E4%BD%A0%E5%A5%BD`，翻邮件源码又见 `=E4=BD=A0`，网页里还冒出一堆 `&#20320;`——看着是三种乱码，其实是同一种病：字符被编了码。站点的编码转换工具攒到 22 件，散在各处不好找，这篇按四组理一遍，下次遇到天书直接对号入座。

## Web 三件套：网页和 URL 的乱码

网页上看到 `&lt;div&gt;`，交给{{< tool id="html-decode" >}}HTML解码{{< /tool >}}还原成真实字符；反过来要把用户输入安全地嵌进页面，先过一遍{{< tool id="html-encode" >}}HTML编码{{< /tool >}}，尖括号和引号统统变实体，注入风险也一并挡掉。地址栏里那串百分号乱码用{{< tool id="url-decode" >}}URL解码{{< /tool >}}一解，中文参数立刻现形。想把整段配置塞进链接分享，{{< tool id="json-url-encode" >}}JSON URL编码{{< /tool >}}会压缩转义后放进 query 参数，贴在哪都不断行。

## 代码转义：写进字符串之前先逃一遍

把文本拼进 JS 字符串字面量，{{< tool id="js-string-escape" >}}JS字符串转义{{< /tool >}}自动给换行和引号补上反斜杠。手写 SQL 拼查询，{{< tool id="sql-escape" >}}SQL转义{{< /tool >}}先把单引号安顿好，语句不至于被一个 O'Brien 截断。用户输入要进正则，先让{{< tool id="regex-escape" >}}正则转义{{< /tool >}}把元字符降级，再拼进 pattern 不怕爆炸。类名带中文或特殊符号时，{{< tool id="css-escape" >}}CSS转义{{< /tool >}}转成合法选择器；参数要传给 shell，{{< tool id="bash-escape" >}}Bash命令转义{{< /tool >}}替空格和引号站岗。写 RSS 或 XML 配置，{{< tool id="xml-escape" >}}XML转义{{< /tool >}}把尖括号和 `&` 变成安全实体，文档结构不塌。

## Base 家族：从 64 排到 85

接口返回、data URI、邮件附件里最常见的乱码串，贴进{{< tool id="base64-decode" >}}Base64解码{{< /tool >}}就出原文。需要口头转述、大小写不敏感的凭证串，{{< tool id="base32-encode" >}}Base32编码{{< /tool >}}更抗抄错。区块链地址和短标识偏爱{{< tool id="base58-encode" >}}Base58编码{{< /tool >}}，去掉了易混淆的 0、O、I、l；短链服务压 ID 常用{{< tool id="base62-encode" >}}Base62编码{{< /tool >}}，大数字秒变六位短串。追求更省空间可以试试{{< tool id="base85-encoder" >}}Base85编码转换{{< /tool >}}，PDF 内嵌数据用的就是它。邮件标题里的 `=?UTF-8?B?...?=` 归{{< tool id="mime-encode" >}}MIME 编码工具{{< /tool >}}管；翻老论坛和新闻组的旧资料，附件编码还得请出{{< tool id="uuencode" >}}UUEncode 编码工具{{< /tool >}}。

## 字符与古典：从 0101 到点划线

想弄明白字符的底层表示，{{< tool id="binary-convert" >}}二进制转换{{< /tool >}}让文本和 0101 互转，敲门砖一块。对不上字符时翻{{< tool id="ascii-table" >}}ASCII码表{{< /tool >}}，控制字符一目了然。中文域名背后那串 `xn--` 开头的码，{{< tool id="punycode-convert" >}}Punycode编码转换{{< /tool >}}负责互转。电报时代的字母表也没失传，{{< tool id="morse-code" >}}摩尔斯电码工具{{< /tool >}}让文本和点划互译，SOS 随时能拍。邮件正文里成片的 `=E4=BD=A0`，交给{{< tool id="quoted-printable" >}}Quoted-Printable编码{{< /tool >}}处理就恢复可读。

22 件工具全部在浏览器本地运行，数据不出门。编码转换常常只是处理文件的一环——转完之后还要压缩、加密、去重，可以接着逛[文件处理流水线](/collections/file-ops-pipeline/)专题，把整条链路一次配齐。
