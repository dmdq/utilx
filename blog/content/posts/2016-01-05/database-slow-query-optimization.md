---
title: "数据库慢查询优化的方法论与实践：从索引到SQL重写的完整指南"
slug: "database-slow-query-optimization"
date: 2026-01-05
draft: false
description: "深入剖析数据库慢查询的成因与优化方法，详细介绍执行计划分析、索引优化策略、SQL重写技巧，以及MySQL/PostgreSQL的实战案例"
tags: ["数据库", "慢查询优化", "索引", "SQL优化", "性能调优"]
categories: ["性能优化"]
author: "技术团队"
---

## 引言：慢查询是性能优化的核心战场

数据库慢查询是影响系统性能的首要因素。一个未优化的查询可能导致：

- **响应时间长**：用户等待数秒甚至数十秒
- **资源占用高**：CPU、磁盘I/O、内存被耗尽
- **并发能力下降**：数据库连接池被占满
- **级联影响**：拖累整个应用系统

本文将建立一套完整的慢查询优化方法论，从发现、分析、到解决，提供可落地的实战方案。

## 一、慢查询的发现与监控

### 1.1 MySQL 慢查询配置

```sql
-- 开启慢查询日志
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1;  -- 超过1秒的查询记录
SET GLOBAL log_queries_not_using_indexes = 'ON';  -- 记录未使用索引的查询

-- 查看慢查询配置
SHOW VARIABLES LIKE '%slow_query%';
SHOW VARIABLES LIKE 'long_query_time%';
```

### 1.2 PostgreSQL 慢查询配置

```sql
-- postgresql.conf
log_min_duration_statement = 1000  -- 毫秒
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '

-- 或通过ALTER DATABASE配置
ALTER DATABASE mydb SET log_min_duration_statement = 1000;
```

### 1.3 慢查询日志分析工具

**pt-query-digest（Percona Toolkit）**：

```bash
# 分析慢查询日志
pt-query-digest /var/log/mysql/slow-query.log

# 输出TOP 10慢查询
pt-query-digest --limit 10 /var/log/mysql/slow-query.log

# 按时间范围筛选
pt-query-digest --since '2026-01-05 00:00:00' --until '2026-01-05 23:59:59' slow-query.log

# 筛选特定数据库
pt-query-digest --filter '($db =~ /mydb/)' slow-query.log
```

**pgBadger（PostgreSQL）**：

```bash
# 生成HTML报告
pgbadger /var/log/postgresql/postgresql-*.log -o report.html

# 分析最近24小时
pgbadger --since '24 hours ago' /var/log/postgresql/postgresql.log
```

### 1.4 实时监控

**MySQL 实时慢查询监控**：

```sql
-- MySQL 5.7+ Performance Schema
SELECT
    schema_name,
    digest_text,
    count_star AS exec_count,
    round(avg_timer_wait/1000000000, 2) AS avg_latency_ms,
    round(sum_timer_wait/1000000000, 2) AS total_latency_ms
FROM performance_schema.events_statements_summary_by_digest
WHERE schema_name NOT IN ('mysql', 'information_schema', 'performance_schema')
ORDER BY total_latency_ms DESC
LIMIT 10;
```

**PostgreSQL 实时监控**：

```sql
-- 查询当前正在执行的慢查询
SELECT
    pid,
    now() - query_start AS duration,
    state,
    query
FROM pg_stat_activity
WHERE state != 'idle'
AND now() - query_start > interval '1 second'
ORDER BY duration DESC;
```

## 二、执行计划分析

### 2.1 MySQL 执行计划解读

```sql
EXPLAIN SELECT * FROM orders WHERE user_id = 123 AND status = 'pending';

+----+-------------+--------+------+---------------+---------+---------+-------+------+-------------+
| id | select_type | table  | type | possible_keys | key     | key_len | ref   | rows | Extra       |
+----+-------------+--------+------+---------------+---------+---------+-------+------+-------------+
|  1 | SIMPLE      | orders | ref  | idx_user_id   | idx_user_id | 4     | const |  100 | Using where |
+----+-------------+--------+------+---------------+---------+---------+-------+------+-------------+
```

**关键字段解读**：

- **type（访问类型）**：从最优到最差
  - `system`：表只有一行
  - `const`：主键或唯一索引查询（最多一行）
  - `eq_ref`：唯一索引扫描（JOIN时使用）
  - `ref`：非唯一索引扫描
  - `range`：范围扫描（`>`、`<`、`BETWEEN`）
  - `index`：索引全扫描
  - `ALL`：全表扫描（⚠️ 需要优化）

- **Extra**：
  - `Using index`：覆盖索引，最优
  - `Using where`：WHERE过滤
  - `Using temporary`：使用临时表（⚠️ 性能问题）
  - `Using filesort`：文件排序（⚠️ 性能问题）

### 2.2 PostgreSQL 执行计划解读

```sql
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT * FROM orders WHERE user_id = 123 AND status = 'pending';

QUERY PLAN
--------------------------------------------------------------------------------
Index Scan using idx_user_id on orders  (cost=0.42..1234.56 rows=100 width=256)
  Index Cond: (user_id = 123)
  Filter: (status = 'pending'::text)
  Rows Removed by Filter: 500
  Buffers: shared hit=50 read=10
```

**关键指标**：

- **cost**：估算成本（越低越好）
- **rows**：估算扫描行数
- **actual time**：实际执行时间
- **Buffers**：
  - `shared hit`：缓存命中
  - `shared read`：磁盘读取
- **Seq Scan** vs **Index Scan**：优先选择索引扫描

### 2.3 执行计划可视化

**MySQL 可视化**：

```bash
# 使用 MySQL Workbench
# 使用 pt-visual-explain
pt-visual-explain <(mysql -e "EXPLAIN SELECT * FROM orders WHERE user_id = 123")
```

**PostgreSQL 可视化**：

```bash
# 使用 explain.depesz.com
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM orders WHERE user_id = 123;

# 复制输出结果到 https://explain.depesz.com/
```

## 三、索引优化策略

### 3.1 索引设计原则

**1. 选择性高的列优先建索引**

```sql
-- 高选择性列（适合建索引）
SELECT COUNT(DISTINCT email) / COUNT(*) FROM users;  -- 接近 1.0

-- 低选择性列（不适合建索引）
SELECT COUNT(DISTINCT gender) / COUNT(*) FROM users;  -- 低于 0.01
```

**2. 最左前缀原则（联合索引）**

```sql
-- 联合索引：(user_id, status, created_at)
CREATE INDEX idx_user_status_time ON orders(user_id, status, created_at);

-- ✅ 能使用索引
WHERE user_id = 123
WHERE user_id = 123 AND status = 'pending'
WHERE user_id = 123 AND status = 'pending' AND created_at > '2026-01-01'

-- ❌ 不能使用索引
WHERE status = 'pending'  -- 跳过了最左列
WHERE created_at > '2026-01-01'  -- 跳过了最左列
```

**3. 覆盖索引优化**

```sql
-- 创建覆盖索引
CREATE INDEX idx_user_covering ON orders(user_id, status, amount);

-- ✅ 只查询索引列，无需回表
SELECT status, amount FROM orders WHERE user_id = 123;

-- ❌ 需要回表
SELECT * FROM orders WHERE user_id = 123;
```

### 3.2 索引失效场景

```sql
-- 1. 隐式转换导致索引失效
-- ❌ 索引失效（phone是VARCHAR类型）
SELECT * FROM users WHERE phone = 13800138000;

-- ✅ 使用字符串
SELECT * FROM users WHERE phone = '13800138000';

-- 2. 函数计算导致索引失效
-- ❌ 索引失效
SELECT * FROM orders WHERE DATE(created_at) = '2026-01-05';

-- ✅ 使用范围查询
SELECT * FROM orders WHERE created_at >= '2026-01-05' AND created_at < '2026-01-06';

-- 3. 前缀模糊查询导致索引失效
-- ❌ 索引失效
SELECT * FROM users WHERE name LIKE '%张%';

-- ✅ 使用前缀查询
SELECT * FROM users WHERE name LIKE '张%';

-- 4. OR连接未全部建索引的列
-- ❌ 索引失效
SELECT * FROM orders WHERE user_id = 123 OR status = 'pending';

-- ✅ 使用UNION
SELECT * FROM orders WHERE user_id = 123
UNION
SELECT * FROM orders WHERE status = 'pending';
```

### 3.3 索引优化实战案例

**案例1：分页查询优化**

```sql
-- ❌ 深分页性能差
SELECT * FROM orders ORDER BY id LIMIT 1000000, 10;

-- ✅ 使用延迟关联
SELECT * FROM orders o
INNER JOIN (
    SELECT id FROM orders ORDER BY id LIMIT 1000000, 10
) AS t ON o.id = t.id;

-- ✅ 使用游标分页（推荐）
SELECT * FROM orders WHERE id > last_seen_id ORDER BY id LIMIT 10;
```

**案例2：ORDER BY 优化**

```sql
-- ❌ 文件排序
SELECT * FROM orders WHERE user_id = 123 ORDER BY status;

-- ✅ 创建索引覆盖排序
CREATE INDEX idx_user_status ON orders(user_id, status);
```

**案例3：COUNT 优化**

```sql
-- ❌ 慢（COUNT需要扫描）
SELECT COUNT(*) FROM orders WHERE status = 'pending';

-- ✅ 使用计数器表
CREATE TABLE order_stats (
    status VARCHAR(20) PRIMARY KEY,
    count INT
);

-- 更新计数器
UPDATE order_stats SET count = count + 1 WHERE status = 'pending';
INSERT INTO order_stats VALUES ('pending', 1)
ON DUPLICATE KEY UPDATE count = count + 1;

-- 查询
SELECT count FROM order_stats WHERE status = 'pending';
```

## 四、SQL 重写技巧

### 4.1 避免SELECT *

```sql
-- ❌ SELECT *
SELECT * FROM users WHERE id = 123;

-- ✅ 只查询需要的列
SELECT id, name, email FROM users WHERE id = 123;
```

### 4.2 避免子查询，使用JOIN

```sql
-- ❌ 子查询（MySQL 5.6以下性能差）
SELECT * FROM orders WHERE user_id IN (
    SELECT id FROM users WHERE status = 'active'
);

-- ✅ 使用JOIN
SELECT o.* FROM orders o
INNER JOIN users u ON o.user_id = u.id
WHERE u.status = 'active';
```

### 4.3 避免DISTINCT，使用EXISTS

```sql
-- ❌ DISTINCT需要排序去重
SELECT DISTINCT o.user_id FROM orders o;

-- ✅ 使用EXISTS或GROUP BY
SELECT user_id FROM orders GROUP BY user_id;
```

### 4.4 批量插入优化

```sql
-- ❌ 逐条插入（慢）
INSERT INTO logs (message) VALUES ('log1');
INSERT INTO logs (message) VALUES ('log2');
INSERT INTO logs (message) VALUES ('log3');

-- ✅ 批量插入
INSERT INTO logs (message) VALUES
    ('log1'),
    ('log2'),
    ('log3');

-- ✅ 使用LOAD DATA（更快）
LOAD DATA INFILE '/tmp/logs.csv'
INTO TABLE logs
FIELDS TERMINATED BY ','
LINES TERMINATED BY '\n'
(message);
```

### 4.5 避免在WHERE子句中使用OR

```sql
-- ❌ OR可能无法使用索引
SELECT * FROM orders WHERE user_id = 123 OR status = 'pending';

-- ✅ 使用UNION
SELECT * FROM orders WHERE user_id = 123
UNION ALL
SELECT * FROM orders WHERE status = 'pending' AND user_id != 123;
```

### 4.6 使用UNION ALL代替UNION

```sql
-- ❌ UNION会去重（需要排序）
SELECT user_id FROM orders WHERE status = 'pending'
UNION
SELECT user_id FROM orders WHERE status = 'confirmed';

-- ✅ 如果确定无重复，使用UNION ALL
SELECT user_id FROM orders WHERE status = 'pending'
UNION ALL
SELECT user_id FROM orders WHERE status = 'confirmed';
```

## 五、数据库配置优化

### 5.1 MySQL 配置优化

```ini
# my.cnf

# InnoDB缓冲池大小（建议为物理内存的50-70%）
innodb_buffer_pool_size = 4G

# InnoDB日志文件大小
innodb_log_file_size = 256M

# InnoDB刷新策略（1:O_DIRECT, 0:fdatasync）
innodb_flush_method = O_DIRECT

# 最大连接数
max_connections = 500

# 查询缓存（MySQL 8.0已移除）
# query_cache_size = 0

# 临时表大小
tmp_table_size = 64M
max_heap_table_size = 64M

# 排序缓冲区
sort_buffer_size = 2M

# 连接缓冲区
join_buffer_size = 2M
```

### 5.2 PostgreSQL 配置优化

```conf
# postgresql.conf

# 共享缓冲区（建议为物理内存的25%）
shared_buffers = 1GB

# 有效缓存大小（共享缓冲区 + 文件系统缓存）
effective_cache_size = 4GB

# 工作内存（每个排序/哈希操作）
work_mem = 16MB

# 维护工作内存（VACUUM、CREATE INDEX）
maintenance_work_mem = 256MB

# 检查点间隔
checkpoint_completion_target = 0.9

# 随机页面代价（SSD降低此值）
random_page_cost = 1.1

# 最大连接数
max_connections = 100
```

## 六、实战案例剖析

### 6.1 案例1：订单列表查询优化

**问题**：订单列表查询耗时 5 秒

```sql
-- 原始SQL（慢）
SELECT
    o.*,
    u.name AS user_name,
    p.name AS product_name
FROM orders o
LEFT JOIN users u ON o.user_id = u.id
LEFT JOIN products p ON o.product_id = p.id
WHERE o.status = 'pending'
ORDER BY o.created_at DESC
LIMIT 20 OFFSET 0;
```

**执行计划**：

```
+----+-------------+-------+------+---------------+------+---------+------+--------+-------------+
| id | select_type | table | type | possible_keys | key  | key_len | ref  | rows   | Extra       |
+----+-------------+-------+------+---------------+------+---------+------+--------+-------------+
|  1 | SIMPLE      | o     | ALL  | NULL          | NULL | NULL    | NULL | 500000 | Using where |
|  1 | SIMPLE      | u     | eq_ref| PRIMARY     | PRIMARY| 4     | o.user_id | 1 | NULL        |
|  1 | SIMPLE      | p     | eq_ref| PRIMARY     | PRIMARY| 4     | o.product_id | 1 | NULL        |
+----+-------------+-------+------+---------------+------+---------+------+--------+-------------+
```

**优化方案**：

1. **添加索引**：

```sql
-- 为status和created_at创建联合索引
CREATE INDEX idx_status_created ON orders(status, created_at);
```

2. **使用覆盖索引**：

```sql
-- 创建覆盖索引
CREATE INDEX idx_status_covering ON orders(status, created_at, user_id, product_id, amount);
```

3. **优化后的SQL**：

```sql
-- 优化后（500ms）
SELECT
    o.id,
    o.user_id,
    o.product_id,
    o.amount,
    o.created_at,
    u.name AS user_name,
    p.name AS product_name
FROM (
    SELECT
        id, user_id, product_id, amount, created_at
    FROM orders
    WHERE status = 'pending'
    ORDER BY created_at DESC
    LIMIT 20
) o
LEFT JOIN users u ON o.user_id = u.id
LEFT JOIN products p ON o.product_id = p.id;
```

### 6.2 案例2：用户消息查询优化

**问题**：消息查询耗时 10 秒

```sql
-- 原始SQL（慢）
SELECT * FROM messages
WHERE receiver_id = 123
AND is_read = 0
ORDER BY created_at DESC;
```

**优化方案**：

1. **分区表**：

```sql
-- 按月分区
ALTER TABLE messages
PARTITION BY RANGE (YEAR(created_at) * 100 + MONTH(created_at)) (
    PARTITION p202601 VALUES LESS THAN (202602),
    PARTITION p202602 VALUES LESS THAN (202603),
    -- ...
    PARTITION pmax VALUES LESS THAN MAXVALUE
);
```

2. **归档历史数据**：

```sql
-- 归档3个月前的数据
INSERT INTO messages_archive
SELECT * FROM messages WHERE created_at < DATE_SUB(NOW(), INTERVAL 3 MONTH);

DELETE FROM messages WHERE created_at < DATE_SUB(NOW(), INTERVAL 3 MONTH);
```

### 6.3 案例3：统计查询优化

**问题**：日报统计查询耗时 30 秒

```sql
-- 原始SQL（慢）
SELECT
    DATE(created_at) AS date,
    COUNT(*) AS total_orders,
    SUM(amount) AS total_amount
FROM orders
WHERE created_at >= '2026-01-01'
AND created_at < '2026-02-01'
GROUP BY DATE(created_at);
```

**优化方案**：

1. **使用物化视图/汇总表**：

```sql
-- 创建日统计表
CREATE TABLE order_daily_stats (
    stat_date DATE PRIMARY KEY,
    total_orders INT,
    total_amount DECIMAL(15, 2),
    updated_at TIMESTAMP
);

-- 定时更新存储过程
CREATE PROCEDURE update_daily_stats()
BEGIN
    INSERT INTO order_daily_stats (stat_date, total_orders, total_amount)
    SELECT
        DATE(created_at),
        COUNT(*),
        SUM(amount)
    FROM orders
    WHERE created_at >= CURDATE() - INTERVAL 7 DAY
    GROUP BY DATE(created_at)
    ON DUPLICATE KEY UPDATE
        total_orders = VALUES(total_orders),
        total_amount = VALUES(total_amount),
        updated_at = NOW();
END;

-- 查询（毫秒级）
SELECT * FROM order_daily_stats
WHERE stat_date >= '2026-01-01' AND stat_date < '2026-02-01';
```

## 七、优化方法论总结

### 7.1 慢查询优化流程

```
1. 发现慢查询
   ├── 慢查询日志
   ├── 实时监控
   └── 用户反馈

2. 分析执行计划
   ├── 查看访问类型（type）
   ├── 检查扫描行数（rows）
   └── 关注Extra信息

3. 优化策略
   ├── 添加/优化索引
   ├── 重写SQL语句
   ├── 优化表结构
   └── 调整数据库配置

4. 验证效果
   ├── 对比执行时间
   ├── 查看执行计划变化
   └── 监控资源使用
```

### 7.2 索引优化检查清单

- [ ] 是否为查询条件（WHERE、JOIN）添加索引
- [ ] 联合索引是否遵循最左前缀原则
- [ ] 是否存在隐式转换导致索引失效
- [ ] 是否使用了函数计算导致索引失效
- [ ] 索引的选择性是否足够高
- [ ] 是否存在冗余索引
- [ ] 是否定期分析表（ANALYZE TABLE）

### 7.3 SQL编写规范

1. **避免SELECT ***，只查询需要的列
2. **避免在WHERE中使用函数**，改用范围查询
3. **避免隐式转换**，确保类型匹配
4. **合理使用LIMIT**，避免大结果集
5. **批量操作**使用批量INSERT/UPDATE
6. **使用UNION ALL**替代UNION（如果无重复）
7. **合理使用JOIN**，避免子查询
8. **使用EXPLAIN**分析执行计划

---

> 慢查询优化是数据库性能优化的核心。掌握执行计划分析、索引优化、SQL重写三大法宝，90%的慢查询问题都可以得到解决。
