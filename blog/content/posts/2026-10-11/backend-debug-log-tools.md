---
title: "后端排查三件套：MyBatis 日志还原、堆栈定位与连接串核对"
slug: "backend-debug-log-tools"
date: 2026-10-11T09:30:00+08:00
draft: false
tags: ['后端', 'MyBatis', '日志排查', '异常堆栈']
categories: ['效率工具']
author: '有条工具团队'
summary: '日志里的 SQL 满屏问号、堆栈一层包一层、连接串参数数不清——后端三类高频排查场景各有固定套路，这篇文章把原理和坑讲透，配上浏览器本地运行、数据不出本机的工具。'
---

## 排查的时间，都花在"对不上号"上

复盘后端排障记录会发现，真正读代码的时间往往不多，大头花在三类"对不上号"上：**日志里的 SQL 满屏问号，参数另起一行，没法直接拿去复现**；**异常堆栈一层包一层，看了十分钟还在框架代码里打转**；**连接串几十个参数，谁也说不清最终生效的是哪个值**。这三类问题都有固定解法，逐个拆开讲。

## 日志参数还原：把问号变回真实值

先讲原理。MyBatis 默认走 PreparedStatement，**SQL 模板和参数是分两次发给数据库的**，所以日志长这样：

```sql
==>  Preparing: SELECT id, amount FROM orders WHERE user_id = ? AND status = ? AND created_at > ?
==> Parameters: 10086(String), PAID(String), 2026-09-01 00:00:00(Timestamp)
```

两行分开打印是给开发者看参数用的，**不能直接复制执行**。手工还原有三个经典坑：

1. **字符串参数忘了加引号**。把 10086 裸着贴回去，MySQL 会做隐式类型转换，user_id 是 varchar 时**索引直接失效**——本来毫秒级的查询手跑要 4 秒，还以为自己发现了性能问题
2. **参数和问号对不上**。动态 SQL（`<if>` 标签）让不同入参走不同分支；多并发时 Preparing 和 Parameters 两行还会被其他请求的日志从中间打断，数问号能数到怀疑人生
3. **NULL 写成 `= null`**。日志里显示 null，还原成 `status = null` 永远查不到数据，得改写成 `IS NULL`

用 [MyBatis SQL 还原工具](https://www.util.cn/tools/mybatis-sql-restore/)把两行日志原样贴进去，自动按声明的类型回填——字符串补引号、Timestamp 转标准格式，几十个问号的 SQL 也能一次拼完整。还原之后先做一件事：**把 UPDATE、DELETE 包一层 SELECT 确认影响范围**，别拿生产库直接试。SQL 本身就慢的，再丢进[SQL 查询优化器](https://www.util.cn/tools/sql-query-optimizer/)看索引和写法建议，很多"偶现超时"就是还原出来的这条 SQL 走错了索引。

偶现问题还有一招：把正常请求和出错请求的日志参数各取一份，贴进[JSON 对比工具](https://www.util.cn/tools/json-diff-compare/)，差异字段直接高亮——**"偶现"九成是某几个参数的组合触发的**，对比五分钟胜过盲读一小时代码。

## 堆栈定位：从 Caused by 里找真凶

堆栈的阅读顺序是固定的：**第一行是异常类型和抛出位置，往下是调用链，最后一个 Caused by 往往才是根因**。看一个真实的例子：

```java
org.springframework.dao.DataAccessResourceFailureException: ...
    at org.springframework.jdbc.support.JdbcUtils.convertSQLExceptions(...)
    at com.demo.order.OrderMapper.selectList(OrderMapper.java:42)
Caused by: com.mysql.cj.exceptions.CJCommunicationsException: Communications link failure
Caused by: java.net.SocketTimeoutException: Read timed out
```

顶层是 Spring 包装过的数据访问异常，一层剥到底才发现是 **socket 读超时**——问题根本不在业务代码。手工看堆栈有三个坑：

1. **只看第一行**。NullPointerException 只告诉你第 58 行空了，不知道是哪个变量；Java 14+ 的 helpful NPE 会补一句"因为 xxx 是 null"，但大量服务还跑在 Java 8 上
2. **行号对不上**。本地 checkout 的是 master，线上跑的是 release 分支，同一个方法行号差十几行，改错地方的都遇到过
3. **堆栈被吞了**。catch 里只打 `e.getMessage()`，日志只剩"连接失败"四个字，调用链全丢

把整段堆栈贴进[Java 堆栈分析器](https://www.util.cn/tools/java-stack-analyzer/)，它会自动剥出 Caused by 异常链、**过滤 JDK 和框架帧、只标出业务代码所在的那几帧**，根因和首个业务帧两步定位，不用再逐行人肉过滤框架类名。

## 连接串核对：一个参数差出 8 小时

连接串是排查里最容易被跳过的一环——大家默认"能连上就是对的"，但**能连上和连得对是两回事**。一条典型的生产连接串：

```
jdbc:mysql://rm-xxx.mysql.rds.aliyuncs.com:3306/order_db?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai&connectTimeout=3000
```

四个高频坑：

1. **serverTimezone 没配**：驱动按 UTC 解释时间，**刚插入的数据读出来差 8 小时**，按本地时间筛日志还筛不到那条记录
2. **只有 connectTimeout 没有 socketTimeout**：前者只管建连那 3 秒，后者管读写等待。不配 socketTimeout，网络一旦抖动，连接**永久挂起**，连接池被占满，整个服务雪崩——很多"突然全挂"的事故根子在这
3. **密码带 @、#、/ 没转义**：URL 解析直接错位，报错信息还特别隐晦
4. **多环境 profile 叠加**：application.yml、application-prod.yml、启动参数各配一遍，最终生效值靠猜

用[数据库连接串解析工具](https://www.util.cn/tools/db-connection-parser/)把连接串贴进去，逐项列出每个参数的含义与当前值，**缺失的风险项（比如 socketTimeout）会直接标出来**。核对测试环境和生产配置时，把两份连接串解析结果和前文的 JSON 对比组合着用，生效差异一目了然。

## 两个高频小问题速查

**定时任务"没跑"或"跑疯"**：先核对 cron 表达式语义。想"每天 2:10 跑"写成 `0 10 2 * * ?` 没问题；一旦把秒位写成 `*`（如 `* 10 2 * * ?`），就变成 2:10 那一分钟**每秒触发一次**，60 倍执行量还可能锁表。拿不准就用[Cron 表达式调试器](https://www.util.cn/tools/cron-expression-debugger/)，直接列出最近几次触发时间，语义和预期对不对一眼便知。

**从几百行日志里捞堆栈**：按 traceId 关联、用 `grep -A 30 "NullPointerException"` 截取上下文是基本功；模式复杂一点（多关键词、按行首时间戳锚定）就先在[正则表达式测试工具](https://www.util.cn/tools/regex-tester/)里把模式调通再拿去 grep，**别在实时日志上试正则**。

排查侧的套路讲完了。如果你是前端，联调那三类"卡住半小时"的问题（Mock、CORS、JWT 失效）在[《前端联调提速：Mock、CORS、JWT 的调试套路》](https://www.util.cn/blog/articles/frontend-api-debugging/)里有对应的一套打法，两边配合着看，整条排障链路就完整了。

## 常见问题

### 还原出来的 SQL 能直接在生产执行吗？

SELECT 可以低峰期执行，UPDATE 和 DELETE 千万不要——先改写成 SELECT 确认命中行数，再走变更工单。还原工具的产出是"排查用的等价查询"，不是"可执行的变更语句"。

### 堆栈里全是框架类名，怎么快速过滤？

看两个位置就够：异常链最底层的 Caused by，以及堆栈里第一个自己公司的包名（如 com.demo）。堆栈分析器会自动标出这两处，其余框架帧默认折叠。

### 连接串到底该配哪几个参数？

connectTimeout（建连超时，3-5 秒）、socketTimeout（读写超时，按最慢 SQL 定，如 60 秒）、serverTimezone（明确指定，别留默认）、连接池 maxLifetime 小于数据库 wait_timeout——这四项配对，能避开九成连接类事故。


## 顺带一提：团队里其他角色也有专属工具

排查之外，两条相邻需求也值得收藏。做小程序的前端同事常常要在 px 和 rpx 之间来回折算，[rpx/px 换算器](https://www.util.cn/tools/rpx-px-converter/)支持按机型宽度双向换算，整段样式还能批量替换；负责官网与 SEO 的同事要给页面加结构化数据，[JSON-LD 结构化数据生成器](https://www.util.cn/tools/json-ld-generator/)把 FAQ、面包屑、文章、商品五种 Schema 做成了中文表单，填完即出带校验的代码，不用再去翻英文文档对照字段。

## 小结

后端排查的三个场景固定成三步：**日志还原成可执行 SQL → 堆栈剥到根因 Caused by → 连接串逐项核对风险参数**。本文用到的 MyBatis SQL 还原、Java 堆栈分析器、数据库连接串解析，加上 SQL 查询优化器、JSON 对比、Cron 调试器、正则测试，全部在浏览器本地运行——排查过程本身，也不该把生产数据传到别处。
