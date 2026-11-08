---
title: "JSON、XML、TOML 互转：20 件格式化与转换工具按场景分组"
slug: "format-convert-roundup"
date: 2026-11-08T22:05:00+08:00
draft: false
tags: ['格式转换', 'JSON', 'XML', '工具合集']
categories: ['效率工具']
author: '有条工具团队'
summary: '后端给 XML、前端要 JSON、运维甩来 TOML——这篇把 20 件格式化与转换工具分成结构化互转与编码小工具两组，从互转、排版到拆包解码一次理清。'
---

联调时数据格式从来不止一种：接口吐 XML，页面要 JSON，配置又是 TOML，抓包里的表单体还是另一套语言。更磨人的是排错——一个本该层次分明的文件被压成一行，检查时全靠眼睛数括号。格式之间的翻译活占掉的时间不比写逻辑少，这篇把站点 20 件格式化与转换工具分成两组：先转对格式，再排整齐，剩下的拆包解码归进杂活一组。

## 结构化格式互转：先转对，再排好

对接老系统，{{< tool id="json-to-xml" >}}JSON转XML{{< /tool >}}把 JSON 报文转成对方认的 XML，字段逐一对应，省去手写模板；拿到 XML 配置想在 JS 里用，{{< tool id="xml-to-json" >}}XML转JSON{{< /tool >}}反向一转就是对象，节点层级原样保留。网页文章要存进笔记库，{{< tool id="html-to-markdown" >}}HTML转Markdown{{< /tool >}}抽成干净的 Markdown，贴进笔记不用再清标签；笔记要发邮件或贴网页，{{< tool id="markdown-to-html" >}}Markdown转HTML{{< /tool >}}再转回去，标题和代码块样式齐全。接手 PHP 老项目，配置是一大坨数组，{{< tool id="json-php-converter" >}}JSON与PHP数组转换{{< /tool >}}两种写法互改，嵌套结构不乱。Rust 或 Python 项目用 TOML 写配置，要给程序读就靠{{< tool id="toml-to-json" >}}TOML与JSON互转{{< /tool >}}转成 JSON，数组嵌套表也对应得上。GraphQL 的 query 压成一行没法读，{{< tool id="graphql-formatter" >}}GraphQL格式化器{{< /tool >}}排成缩进清晰的层次，选了哪些字段一目了然。Java 的 properties、Windows 的 ini 键值挤作一团，{{< tool id="properties-ini-formatter" >}}Properties/INI格式化器{{< /tool >}}对齐键值，注释和空行也归置妥当。

转对了还要排好才能读：接口返回的 XML 没有换行，{{< tool id="xml-formatter" >}}XML格式化{{< /tool >}}一秒排开嵌套节点，再深也不迷路；模板源码压成一行，{{< tool id="html-formatter" >}}HTML格式化{{< /tool >}}补齐缩进，标签配没配对顺手看出；导出的 CSV 列位错乱，{{< tool id="csv-formatter" >}}CSV格式化{{< /tool >}}按分隔符对齐，带引号转义的列也不错位；手改过的 TOML 缩进乱了，{{< tool id="toml-formatter" >}}TOML格式化{{< /tool >}}恢复规范格式。这组的习惯用法是两步连做：先互转成目标格式，再用对应的格式化器排整齐，文件才好进下一步。

## 编码与小工具：拆包解码的杂活

防火墙规则要写网段，{{< tool id="ip-address-convert" >}}IP地址转换{{< /tool >}}在点分十进制、整数、十六进制间互转，写 ACL 时用得上。查字符码位，{{< tool id="ascii-convert" >}}ASCII编码转换{{< /tool >}}字符与码值互查，排查编码问题先对码位。回调 URL 长到换三行，{{< tool id="query-string-parser" >}}Query String解析{{< /tool >}}拆成键值表逐个核对，哪些参数被编码过一眼见底。文件打不开先看头，{{< tool id="binary-viewer" >}}二进制查看器{{< /tool >}}按十六进制读魔数验明正身，开头几个字节就够判断。老论坛的剧透用 ROT13 写着，{{< tool id="rot13" >}}ROT13 加密工具{{< /tool >}}一解就还原，再转一次回到原样；CTF 题目要试偏移，{{< tool id="caesar-cipher" >}}凯撒密码工具{{< /tool >}}穷举位移找通顺的那句，不用手抄二十五遍。抓包里的 form 表单体不好读，{{< tool id="form-data-converter" >}}FormData 转换工具{{< /tool >}}转成 JSON 再看字段，排查对接少猜一半。想在文本里留隐形水印，或者排查复制粘贴多出来的怪东西，{{< tool id="zero-width-encoder" >}}零宽字符编码器{{< /tool >}}编码解码都能做。

20 件全部在浏览器本地运行，报文和配置不出门。下次遇到天书先别慌，多半是某一层编码或格式在作怪，顺着这两组找下去，通常两三件工具就能解开。格式转完常要落到文件上——压缩、加密、批量清理，接着逛[文件处理流水线](/collections/file-ops-pipeline/)专题，把整条链路一次配齐。
