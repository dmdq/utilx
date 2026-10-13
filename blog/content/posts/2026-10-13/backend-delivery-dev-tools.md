---
title: "后端交付与运维小件：数据字典、正则图解、IN 拼串与访问口令"
slug: "backend-delivery-dev-tools"
date: 2026-10-13T20:00:00+08:00
draft: false
tags: ['后端', '运维', '数据字典', 'htpasswd', '正则']
categories: ['效率工具']
author: '有条工具团队'
summary: '交付文档、正则评审、ID 拼串、目录加锁——后端和运维手里那些琐碎但高频的小活儿，各有顺手的小工具：DDL 直出数据字典、正则分段图解、IN 条件自动转义分组、htpasswd 条目与 nginx 配置一次生成，全部浏览器本地完成。'
---

## 交付与运维，输在小活儿上

盘点上线前一周的活儿清单：给客户补数据库交付文档、陪评审过一遍祖传正则、把 Excel 里一千五百个 ID 拼进查询条件、给测试环境的报告目录加道访问口令。每件都不大，每件都烦：文档靠手抄、正则靠口念、拼串靠细心、口令靠命令行。这次上线四款小工具，正好一件对一件，逐个说用法。

## 数据库交付文档，还手抄吗

交付要带数据字典：表名、字段、类型、注释，一张表都不能少。手抄流程是 `SHOW CREATE TABLE` 一张张复制，再往 Word 里对格式——二十张表的库就是一下午，还容易漏字段。Java 阵营的老方案 Screw 文档质量不错，但要装 JDK、引依赖或跑命令，非 Java 同事和临时借用的环境里门槛不小。

[数据字典生成器](https://www.util.cn/tools/db-dictionary-generator/)把门槛降到"粘贴"：把建表 DDL 整段贴进来，自动解析表名、表注释、字段类型、可空、默认值与列注释，直接导出三种格式——**Word（.doc）作正式交付文档，CSV 用 Excel 打开按需美化，Markdown 进团队 Wiki**。它按 MySQL 风格的 CREATE TABLE 解析，兼容反引号标识符、表级与列级 COMMENT，解析前会剥离注释与字符串字面量，列注释里带逗号、括号也能正确切分；ALTER TABLE 增量暂不解析，粘建表语句即可。DDL 在浏览器本地解析，生产库的表结构不出本机——列注释里有时就藏着业务含义，属于不想外泄的信息。

## 评审同事的正则，看不懂就画出来

接手老系统最怕两样东西：没注释的正则和没文档的库。`^1[3-9]\d{9}$` 这种短的还能人肉拆，几十个字符的校验规则就只能"看起来没问题"地点了通过。读正则的困难在于它是给机器写的嵌套结构，人却只能从左到右线性扫描。

[正则可视化图解](https://www.util.cn/tools/regex-visualizer/)把表达式解析成分段结构图：字符类、量词、分组逐段展开，每段标出"这段匹配什么"，嵌套层级画出来而不是念出来；再配上匹配测试的高亮，拿真实样例喂进去，验证自己的理解和正则的行为是否一致。评审会上投屏讲图，五分钟讲完原来半小时说不清的规则；要改老正则，也先看图再动手，确认每一段职责后再下编辑器。

## 运维每日小件：把一列 ID 拼进 SQL

业务方发来 Excel 一列一千五百个订单号，要查这批单子的状态。手工拼串要加引号、加逗号、防漏防重，最容易翻车的是单引号。先看一个可复算的例子：姓名 o'brien 直接放进 IN 列表会截断语句，SQL 里单引号靠成对出现表示自身，转义后是 `'o''brien'`——一个引号的差别，轻则语法报错，重则注入风险。

[SQL IN条件格式化](https://www.util.cn/tools/sql-in-formatter/)把 Excel 直接粘进来就行，逗号、换行、空格、制表符混排都认，三个要点：

1. **引号模式**：自动识别数字与字符串，字符串自动包引号并做单引号转义，o'brien 这类脏数据不再炸语句
2. **保序去重**：Excel 里拖出来的列表常有重复值，去重后 IN 更短，执行计划也更干净
3. **Oracle 1000 项限制**：IN 列表最多 1000 项，超出直接报 ORA-01795。开启分组后按每组 N 个拆成 `IN (...) OR IN (...)`，语义等价——1500 个 ID 拆成 1000+500 两组正好跑通；MySQL 没有硬限制，超长列表同样建议分组

拼出来的 SQL 拿不准快慢的，丢进[SQL 查询优化器](https://www.util.cn/tools/sql-query-optimizer/)看索引与写法建议；超长 IN 的根治方案是落临时表再 JOIN，格式化工具先保证"能跑对"。

## 给服务器目录加道访问密码

测试环境的报告目录、内部文档站，不想裸奔在公网，又不值得上一套完整登录——Basic Auth 正合适。[htpasswd生成器](https://www.util.cn/tools/htpasswd-generator/)输入用户名密码，按官方 {SHA} 方案生成认证条目，支持多条账号批量生成、下载 .htpasswd 文件，并附 nginx 配置片段：

```nginx
location /reports/ {
    auth_basic "Restricted";
    auth_basic_user_file /etc/nginx/.htpasswd;
}
```

{SHA} 方案的算法完全可复算：**SHA-1(密码) 后做标准 Base64，规范格式去掉 = 填充**。经典向量：password 经 SHA-1 摘要再 Base64，正是 `W6ph5Mm5Pz8GgiULbPgzG37mj9g`，也就是说 `admin:{SHA}W6ph5Mm5Pz8GgiULbPgzG37mj9g` 这条记录对应的密码就是 password——与 `htpasswd -sb` 命令的产物等价。整个摘要在浏览器本地用 Web Crypto 算完，密码不经过网络。

两个提醒：**Basic Auth 明文传输凭据，务必配合 HTTPS**；{SHA} 用 SHA-1 是协议规范本身（Apache `htpasswd -s` 同款），挡泛流量扫描够用，管理后台这类高价值入口建议用站内[Bcrypt 加密工具](https://www.util.cn/tools/bcrypt-generate/)生成 `$2y$` 串替换进去，Nginx 与 Apache 的 htpasswd 都原生兼容 bcrypt。另外别用 Apache 的 `$apr1$` 条目——Nginx 不支持，会报 crypt_r() failed。

## 排查老三样，还是那套打法

交付和口令之外，日常排查仍然靠三件套：[MyBatis 日志还原 SQL](https://www.util.cn/tools/mybatis-sql-restore/)把 Preparing 和 Parameters 两行拼回可执行语句，[Java 堆栈分析器](https://www.util.cn/tools/java-stack-analyzer/)剥出 Caused by 异常链、定位首个业务帧，再配合前文的 SQL 查询优化器收尾。完整的排查套路在[《后端排查三件套：MyBatis 日志还原、堆栈定位与连接串核对》](https://www.util.cn/blog/articles/backend-debug-log-tools/)里已经讲透，两篇配合着看，交付侧和排查侧就都齐了。

## 常见问题

### 数据字典能带公式和样式导出吗？

Word 导出带边框表格样式，可直接盖章归档；CSV 是纯数据，用 Excel 打开后按需加样式，要精细排版选 CSV 自己调。

### {SHA} 和 bcrypt 怎么选？

看入口价值：内部文档站、测试目录这类低敏感入口，{SHA} 足够；管理后台、含个人信息的应用入口用 bcrypt（$2y$）。同一份 .htpasswd 里两种条目可以并存，按账号逐条选。

### IN 分组后性能会变差吗？

`IN (...) OR IN (...)` 语义等价，但多组 OR 的执行计划不如单组 IN 稳定。分组是让超长列表先能跑通，根本解法仍是落临时表 JOIN，或分批执行。


## 顺带一提：LBS 同学的坐标换算

做地图相关开发的同事还有一件天天碰的事：GPS 原始坐标（WGS-84）、国内地图的火星坐标（GCJ-02）和百度坐标（BD-09）三套体系互不通用，混用就会"定位漂移几百米"。[地图坐标转换器](https://www.util.cn/tools/gps-coordinate-converter/)内置三系互转算法并支持批量粘贴，调试定位类需求时比自己翻公式快得多。
## 小结

四件小活儿四个小工具：**数据字典（DDL 直出 Word/CSV/Markdown）、正则图解（分段结构加匹配高亮）、IN 拼串（转义、去重、Oracle 1000 分组）、htpasswd（{SHA} 条目加配置片段）**，加上日志还原、堆栈分析、SQL 优化老三样和 Bcrypt 生成，全部在浏览器本地运行——表结构、正则、口令和 SQL，本来就不该离开你自己的机器。
