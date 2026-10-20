---
title: "开发者的浏览器工具箱（二）：调试排障与数据转换"
slug: "dev-toolbox-part2"
date: 2026-10-20T10:05:00+08:00
draft: false
tags: ['调试', '日志分析', '数据转换', '正则', 'LLM']
categories: ['技术教程']
author: '有条工具团队'
summary: '排障和转换是开发里最费时间的两类小事：日志贴错地方、JSON 转不出类名、正则看不懂别人写的。这篇收录站内 25 款浏览器工具，覆盖日志与堆栈分析、结构转换、编码转义、正则与公式、LLM 成本与 Prompt 版本管理，全部本地处理，敏感日志不出本机。'
---

## 为什么这页值得收藏

线上出事、格式对不上，时间按分钟计。这 25 款浏览器工具专治排障与转换，粘贴即出结果，敏感日志不出本机。

上一篇讲"把配置背下来"，这一篇讲"把现场查明白"。调试与转换工具有一个共同要求：**快，且安全**——日志里全是 IP、Token、用户数据，能本地处理就绝不上传。站内这批工具全部在浏览器内运行，按场景过一遍。

## 日志、补丁与异常：先看懂，再动手

- [Nginx日志速析](https://www.util.cn/tools/nginx-log-analyzer/)：粘贴 access.log 本地解析，状态码分布、Top IP、热门 URL、流量占比一目了然，5xx 突增先来看一眼再决定往哪查。
- [ANSI转义码预览](https://www.util.cn/tools/ansi-preview/)：CI 里抓回来的日志满屏 `^[[31m`？贴进来还原终端颜色，支持 16/256 色，还能导出为 HTML 存档。
- [Java堆栈异常解析器](https://www.util.cn/tools/java-stack-analyzer/)：粘贴异常堆栈，自动折叠框架帧、高亮业务代码行、理清 Caused by 异常链，百行堆栈三秒定位第一现场。
- [Patch补丁应用器](https://www.util.cn/tools/patch-applier/)：上传 `.patch`/`.diff` 与源文件，本地预览改动并尝试应用，失败时定位到具体代码块，不再"打补丁全靠猜"。

日志排查的系统方法，可配合站内[《后端日志排障工具链》](https://www.util.cn/blog/articles/backend-debug-log-tools/)一起看。

## ID、Token 与 Cookie：请求链路上的身份件

- [雪花ID解码器](https://www.util.cn/tools/snowflake-id-decoder/)：拆解 64 位雪花 ID 的符号位/时间戳/数据中心/机器/序列号，支持自定义 epoch 反推 ID 的生成时刻，排查乱序问题利器。
- [JWT调试器](https://www.util.cn/tools/jwt-debugger/)：解码 Header 与 Payload、验证签名，Token 过期与签发者不匹配这类问题一眼看穿。
- [Cookie编辑器](https://www.util.cn/tools/cookie-editor/)：解析、编辑、生成 Cookie 字符串，SameSite、Expires 各种格式互转，联调登录态时省掉一半 DevTools 操作。

## 结构转换：JSON、XML、SQL 与类定义之间的往返

- [JSON转Model类](https://www.util.cn/tools/json-to-model/)：一段 JSON 生成多语言 Model 定义，接口联调第一步。
- [XML转Model类](https://www.util.cn/tools/xml-to-model/)：同理解析 XML，对接老系统 SOAP 接口必备。
- [SQL转Model类](https://www.util.cn/tools/sql-to-model/)：建表语句直接变成实体类，字段与注释都不丢。
- [JSON转Protobuf](https://www.util.cn/tools/json-to-protobuf/)：JSON 数据反推 `.proto` 定义，支持 v2/v3，微服务迁移时省大量手工活。
- [XML与JSON互转](https://www.util.cn/tools/xml-json-converter/)：双向转换并处理属性与命名空间，对接遗留系统的日常需求。
- [JSON/XML验证器](https://www.util.cn/tools/json-xml-validator/)：校验格式并精确定位错误位置、给出详细报错，比"Parse error at line 1"友好得多。
- [代码格式化工具](https://www.util.cn/tools/dev-code-formatter/)：面向开发者的多语言格式化，语法高亮加实时预览。
- [JSONPath测试器](https://www.util.cn/tools/json-path-tester/)：边写表达式边看命中结果，从大报文里取字段不再靠肉眼数层级。
- [代码片段转换](https://www.util.cn/tools/code-snippet-converter/)：Python 与 JavaScript 等语言间互转代码片段，跨栈协作的快速参考。
- [Markdown表格生成器](https://www.util.cn/tools/markdown-table-generator/)：可视化生成表格，支持对齐，写文档时把 CSV 与手工数据一键变规整表格。

## 编码与转义：三处最易翻车的位置

- [字符集转换](https://www.util.cn/tools/charset-convert/)：GBK/UTF-8 等字符集互转，老系统乱码数据的急救站，详见[《中文乱码修复指南》](https://www.util.cn/blog/articles/chinese-mojibake-fix-guide/)。
- [文件Base64转换器](https://www.util.cn/tools/base64-file-converter/)：图片、字体转 Base64 并生成 CSS/HTML Data URI，小资源内联减少请求。
- [HTML实体编码器](https://www.util.cn/tools/html-entities-encoder/)：编码/解码 HTML 特殊字符，防 XSS 的第一道手工检查。

## 正则、公式与图：看不懂的东西变直观

- [正则备忘单](https://www.util.cn/tools/regex-cheatsheet/)：元字符、断言、修饰符速查表，写正则时的常驻副屏，配合正则实战类教程阅读更佳。
- [LaTeX公式渲染](https://www.util.cn/tools/latex-formula-render/)：输入 LaTeX 即时渲染（KaTeX 本地运行），支持复制图片与导出 PNG，文档与幻灯片直接贴图。
- [DDL转ER图](https://www.util.cn/tools/ddl-to-er-diagram/)：粘贴建表语句自动生成 mermaid ER 图并导出 PNG，接手陌生库的第一步。

## LLM 与 Prompt：成本与版本都要算

- [大模型API价格对比](https://www.util.cn/tools/llm-pricing-compare/)：内置主流大模型输入/输出单价静态表，按价格与上下文长度排序辅助选型，标注更新日期。
- [Prompt版本对比](https://www.util.cn/tools/prompt-diff-checker/)：两版提示词逐字对比高亮增删，附字符/行/估算 token 差异统计——改了标点就回归？先看 diff。

## 常见问题

### 日志里有用户手机号和 IP，用这些工具安全吗？

本页工具全部在浏览器本地解析，粘贴的日志、Token、文件不经过任何服务器，关闭页面即无痕。这也是选择此类工具的首要标准：先看是否本地处理，再看功能。

### Token 价格表会不会过期？

会。价格对比工具是带更新日期的静态表，选型时先核对表上日期，签约与预算以官方最新报价为准；它的价值在于横向排序和上下文规格的直观对比。

## 小结

排障线：日志速析、ANSI 还原、堆栈折叠、补丁预演，加上雪花 ID、JWT、Cookie 三个身份件；转换线：Model/Protobuf/XML/JSONPath 等十款结构工具，加字符集、Base64、HTML 实体三处转义；再加上正则备忘、LaTeX 渲染、DDL 出图与 LLM 价格、Prompt 对比。25 款工具与上一篇的 25 款配置工具合起来，正好覆盖开发日常"写配置"与"查现场"两大半壁江山。
