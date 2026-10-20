---
title: "数据格式化与互转：JSON/XML/YAML/TOML/SQL 一篇收齐"
slug: "format-toolbox"
date: 2026-10-20T10:45:00+08:00
draft: false
tags: ['JSON', 'YAML', '数据转换', '配置文件']
categories: ['效率工具']
author: '有条工具团队'
summary: '接口返回一坨 JSON 要看花、K8s 的 YAML 缩进对不齐、Rust 的 TOML 想读成 JSON、Postman 里一堆数据要导进数据库——数据格式的日常就是"互相不认识"。这篇把站内格式化与互转工具按格式化、互转矩阵、建模三条线收齐，浏览器本地处理，样本数据不出本机。'
---

## 格式工具为什么值得单独攒一篇

程序员和运营都会碰到同一类麻烦：**数据是好数据，格式不对付**。JSON 要读成 YAML、XML 要塞回数据库、CSV 要变成建表语句、Markdown 和 HTML 要来回搬。手工做这三件事又慢又容易引入错误，尤其涉及缩进和转义时。站内数据格式家族已经攒齐了两类工具——一类"把同一格式整理漂亮"，一类"在两种格式之间搬运"。这篇按三条线过：**格式化、互转矩阵、从数据到代码建模**，把平时想不起名字的那批摆出来。

## 格式化：每种配置文件都有专属整理师

最基础的"让它变好看"，各格式各有工具，别混用：

- [JSON 格式化](https://www.util.cn/tools/json-formatter/)：美化、压缩、校验三合一，接口调试的第一站。
- [XML 格式化](https://www.util.cn/tools/xml-formatter/)：把缩成一团的历史接口、POM 文件拉开成可读层级。
- [YAML 格式化](https://www.util.cn/tools/yaml-formatter/)：CI 配置、K8s 清单缩进敏感，它专治"改一行全报错"。
- [TOML 格式化](https://www.util.cn/tools/toml-formatter/)：Rust 的 Cargo.toml、Python 的 pyproject 都归它管。
- [SQL 格式化](https://www.util.cn/tools/sql-formatter/)：把一行到底的长查询拆成多行、关键字对齐，代码评审时救命。

还有两位冷门但专业：**[Properties/INI 格式化](https://www.util.cn/tools/properties-ini-formatter/)** 负责 Java 属性文件和老式 INI——等号对齐、按节排序、注释保留，配置迁移时最烦的"注释去哪了"它不会弄丢；**[GraphQL 格式化](https://www.util.cn/tools/graphql-formatter/)** 是字符串感知的缩进加注释保留，查询长到嵌套五六层时才显出价值。这一档的通用原则：**格式化不改内容、只改排版**，随便用都不丢数据，可以放心当"阅读模式"。

## 互转矩阵：JSON 当中转枢纽

真正容易出坑的是"搬家"。站内以 JSON 为中心搭了一套双向通道，方向不同、用途不同：

**JSON 出，其他格式进。** [JSON 转 XML](https://www.util.cn/tools/json-to-xml/)对接老 SOAP 接口和配置文件；[JSON 转 YAML](https://www.util.cn/tools/json-to-yaml/)把 API 返回变成可直接提交的 K8s、CI 配置；[JSON 转 CSV](https://www.util.cn/tools/json-to-csv/)是给 Excel 看的最短路径；[JSON 转 Protobuf](https://www.util.cn/tools/json-to-protobuf/)直接生成 `.proto` 定义，接口定型时省掉手写字段的功夫；[JSON 与 PHP 数组转换](https://www.util.cn/tools/json-php-converter/)是老 PHP 项目搬数据的刚需。

**反向与配置格式。** 反过来有 [XML 转 JSON](https://www.util.cn/tools/xml-to-json/)；[TOML 与 JSON 互转](https://www.util.cn/tools/toml-to-json/)双向可用，前端要读 TOML、或把 JSON 配置写回 TOML 都走它。[JSON 转 TypeScript 接口](https://www.util.cn/tools/json-to-typescript/)则把一段示例数据直接变成类型定义，前端接到新接口不用手写 interface。

**文档互转。** 从网页扒内容进笔记用 [HTML 转 Markdown](https://www.util.cn/tools/html-to-markdown/)，反过来发布用 [Markdown 转 HTML](https://www.util.cn/tools/markdown-to-html/)，支持扩展语法。

**数据管道。** 批量行数据先看 [JSONL/NDJSON 转换器](https://www.util.cn/tools/jsonl-converter/)，它在 JSONL 与 JSON、CSV 之间互转、逐行校验并标出错误行号——LLM 微调语料就是 JSONL 格式，清洗时靠它定位坏行。[CSV 转 SQL](https://www.util.cn/tools/csv-to-sql/)把表格直接生成 INSERT 与 CREATE TABLE，MySQL、PostgreSQL、SQLite 三种方言可选，导数据这一步不用手拼引号。

搬完还要核对和拼装，三款收尾：[JSON 对比工具](https://www.util.cn/tools/json-diff-compare/)高亮两份数据的新增、删除、修改，比对环境配置差异时最直观；[JSON 合并](https://www.util.cn/tools/json-merger/)做深度合并，数组可按替换、拼接、去重三种策略处理，冲突键还能先预览；[JSON Schema 生成](https://www.util.cn/tools/json-schema/)从样例反推出校验规则，接口契约就有了。参数与日志类的进阶用法在[《后端排查三件套》](https://www.util.cn/blog/articles/backend-debug-log-tools/)里另有实战。

## 从数据到代码：Model 三兄弟

这一组把"格式转换"往前推一步——直接产出代码骨架。[JSON 转 Model 类](https://www.util.cn/tools/json-to-model/)、[XML 转 Model 类](https://www.util.cn/tools/xml-to-model/)、[SQL 转 Model 类](https://www.util.cn/tools/sql-to-model/) 分别从接口返回、XML 结构、建表语句生成编程语言的数据模型。三条路覆盖三种起点：有接口样例走 JSON，摸到遗留 XML 走 XML，手上只有 schema 就走 SQL。要点都一样——生成的类只保证字段和类型对应，命名风格、嵌套结构、日期和枚举的处理还得按项目规范调整，**它是省掉样板代码，不是替你做完设计**。

## 常见问题

### JSON 和 YAML 互转会丢信息吗？

单向有风险，要看方向。JSON 本身不支持注释，也表达不了 YAML 的锚点引用、多行块、显式类型标签——把复杂 YAML 转成 JSON 时这些结构会丢失或变形，所以别把 YAML→JSON→YAML 当成无损往返来用。反过来 JSON→YAML 基本安全。需要严格校验结构时，转成 JSON Schema 比对最稳。

### CSV 转 SQL 生成的建表语句，能直接拿去执行吗？

不建议。CSV 没有类型和约束信息，工具只能按内容推断字段类型，主键、唯一性、外键、字符集都要人工补。稳妥流程是：生成后先审类型，再在生产库之外的库执行、导一批验证，最后改脚本。

## 小结

三条线各司其职：**格式化**按 JSON、XML、YAML、TOML、SQL、Properties/INI、GraphQL 各有专属整理师，只改排版不改内容；**互转矩阵**以 JSON 为枢纽向 XML、YAML、CSV、TS、Protobuf、PHP、JSONL、SQL 铺开，配对比、合并、Schema 校验收尾；**Model 三兄弟**直接从数据生成代码骨架。这批工具全部在浏览器本地运行、数据不上传服务器——接口返回、生产配置、样本数据这些内容，本来就不该交给第三方站点。
