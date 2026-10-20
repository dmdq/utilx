---
title: "SQL格式化与查询优化完全指南"
slug: "sql-formatting-optimization"
date: 2026-01-03T17:00:00+08:00
draft: false
tags: ['SQL', '格式化', '性能优化', '数据库', '查询优化']
categories: ['技术教程']
author: 'util.cn Team'
summary: '深入讲解SQL格式化的最佳实践和查询优化技巧，帮助开发者编写高效、可读的SQL代码'
layout: "single"
ShowToc: true
---

# SQL格式化与查询优化完全指南

SQL是数据操作的通用语言，但编写清晰、高效的SQL并非易事。本文将介绍SQL格式化的最佳实践和查询优化技巧。

## SQL格式化规范

### 基本原则

1. **关键字大写**：SQL关键字使用大写，提高可读性
2. **合理缩进**：使用缩进展示嵌套结构
3. **换行对齐**：将子句、字段等分别换行并对齐
4. **注释说明**：复杂查询添加注释说明

### 格式化示例

```sql
-- ❌ 不好：全部挤在一行
SELECT u.id, u.name, o.order_id, o.total FROM users u INNER JOIN orders o ON u.id = o.user_id WHERE u.status = 'active' ORDER BY o.created_at DESC LIMIT 10;

-- ✅ 好：结构清晰
SELECT
    u.id,
    u.name,
    o.order_id,
    o.total
FROM users u
INNER JOIN orders o ON u.id = o.user_id
WHERE u.status = 'active'
ORDER BY o.created_at DESC
LIMIT 10;
```

### SELECT子句格式化

```sql
-- 字段列表每个字段一行
SELECT
    id,
    username,
    email,
    created_at
FROM users;

-- 使用表别名前缀（多表查询时）
SELECT
    u.id,
    u.username AS name,
    u.email,
    COUNT(o.id) AS order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id, u.username, u.email;
```

### JOIN子句格式化

```sql
-- JOIN语句独占一行，条件清晰
SELECT
    u.username,
    p.title,
    o.quantity
FROM users u
INNER JOIN orders o ON u.id = o.user_id
INNER JOIN products p ON o.product_id = p.id
WHERE o.status = 'completed'
ORDER BY o.created_at DESC;

-- 多个JOIN条件使用括号
SELECT *
FROM orders o
INNER JOIN order_items oi ON (
    o.id = oi.order_id
    AND oi.status = 'active'
);
```

### WHERE子句格式化

```sql
-- 复杂条件使用缩进和括号
SELECT *
FROM products
WHERE (
    category = 'electronics'
    OR category = 'computers'
)
AND price BETWEEN 100 AND 1000
AND stock > 0
AND status = 'available'
ORDER BY price ASC;

-- IN子句多行格式
SELECT *
FROM orders
WHERE status IN (
    'pending',
    'processing',
    'completed'
);
```

### 子查询格式化

```sql
-- 子查询缩进对齐
SELECT
    u.username,
    u.email,
    (
        SELECT COUNT(*)
        FROM orders
        WHERE user_id = u.id
    ) AS order_count
FROM users u
WHERE u.status = 'active'
ORDER BY order_count DESC;

-- FROM子句中的子查询
SELECT *
FROM (
    SELECT
        user_id,
        COUNT(*) AS order_count,
        SUM(total) AS total_amount
    FROM orders
    GROUP BY user_id
) AS user_stats
WHERE order_count > 10
ORDER BY total_amount DESC;
```

## SQL查询优化

### 1. 索引优化

#### 创建合适的索引

```sql
-- 单列索引
CREATE INDEX idx_user_email ON users(email);

-- 复合索引（注意列顺序）
CREATE INDEX idx_orders_user_date ON orders(user_id, created_at);

-- 唯一索引
CREATE UNIQUE INDEX idx_user_username ON users(username);

-- 全文索引（搜索优化）
CREATE FULLTEXT INDEX idx_product_title ON products(title, description);
```

#### 索引使用原则

```sql
-- ✅ 使用索引的查询
SELECT * FROM users WHERE email = 'user@example.com';

-- ✅ 复合索引最左前缀
-- 索引：idx_orders_user_date (user_id, created_at)
SELECT * FROM orders WHERE user_id = 123;
SELECT * FROM orders WHERE user_id = 123 AND created_at > '2026-01-01';

-- ❌ 跳过索引前导列（无法使用索引）
SELECT * FROM orders WHERE created_at > '2026-01-01';

-- ❌ 使用函数（索引失效）
SELECT * FROM users WHERE LOWER(email) = 'user@example.com';

-- ✅ 使用函数索引
CREATE INDEX idx_user_email_lower ON users(LOWER(email));
```

### 2. 查询重写优化

#### 避免SELECT *

```sql
-- ❌ 不好：获取所有列
SELECT * FROM users WHERE id = 1;

-- ✅ 好：只查询需要的列
SELECT id, username, email FROM users WHERE id = 1;
```

#### 使用LIMIT限制结果

```sql
-- ❌ 可能返回大量数据
SELECT * FROM orders ORDER BY created_at DESC;

-- ✅ 限制结果数量
SELECT * FROM orders ORDER BY created_at DESC LIMIT 20;
```

#### 避免在WHERE中使用OR

```sql
-- ❌ 可能导致索引失效
SELECT * FROM products
WHERE category = 'electronics' OR price > 1000;

-- ✅ 使用UNION
SELECT * FROM products WHERE category = 'electronics'
UNION
SELECT * FROM products WHERE price > 1000;

-- ✅ 或使用IN
SELECT * FROM products
WHERE category IN ('electronics', 'computers');
```

### 3. JOIN优化

#### 选择合适的JOIN类型

```sql
-- INNER JOIN：只返回匹配的行
SELECT u.username, o.order_id
FROM users u
INNER JOIN orders o ON u.id = o.user_id;

-- LEFT JOIN：返回左表所有行
SELECT u.username, o.order_id
FROM users u
LEFT JOIN orders o ON u.id = o.user_id;

-- 优先使用INNER JOIN（性能更好）
-- 只有确实需要左表所有行时才使用LEFT JOIN
```

#### 避免过多JOIN

```sql
-- ❌ 不好：过多JOIN
SELECT *
FROM table1 t1
JOIN table2 t2 ON t1.id = t2.t1_id
JOIN table3 t3 ON t2.id = t3.t2_id
JOIN table4 t4 ON t3.id = t4.t3_id
JOIN table5 t5 ON t4.id = t5.t4_id;

-- ✅ 好：分解查询或重新设计
-- 考虑是否真的需要所有数据
-- 可以使用子查询或应用层聚合
```

### 4. 分页优化

#### 传统分页性能问题

```sql
-- ❌ OFFSET越大，性能越差
SELECT * FROM orders
ORDER BY created_at DESC
LIMIT 20 OFFSET 10000;
```

#### 使用游标分页

```sql
-- ✅ 基于上一页最后一条记录的分页
-- 第一页
SELECT * FROM orders
ORDER BY created_at DESC
LIMIT 20;

-- 下一页（假设上一页最后一条记录的created_at是'2026-01-01 10:00:00'）
SELECT * FROM orders
WHERE created_at < '2026-01-01 10:00:00'
ORDER BY created_at DESC
LIMIT 20;
```

### 5. 聚合查询优化

#### 使用索引加速聚合

```sql
-- 为GROUP BY创建索引
CREATE INDEX idx_orders_user_status ON orders(user_id, status);

-- 优化后的查询
SELECT user_id, status, COUNT(*) AS count, SUM(total) AS sum
FROM orders
GROUP BY user_id, status;
```

#### 使用WITH ROLLUP

```sql
-- 生成汇总行
SELECT
    category,
    product,
    SUM(quantity) AS total_quantity
FROM sales
GROUP BY category, product WITH ROLLUP;

-- 结果包含小计和总计
```

### 6. 使用EXPLAIN分析查询

```sql
-- 分析查询执行计划
EXPLAIN SELECT * FROM users WHERE email = 'user@example.com';

-- 详细执行计划
EXPLAIN ANALYZE SELECT * FROM orders
WHERE user_id = 123
ORDER BY created_at DESC;

-- 查看索引使用情况
SHOW INDEX FROM users;
```

## 高级优化技巧

### 1. 使用窗口函数

```sql
-- 计算排名
SELECT
    username,
    score,
    RANK() OVER (ORDER BY score DESC) AS rank
FROM users;

-- 计算移动平均
SELECT
    date,
    sales,
    AVG(sales) OVER (
        ORDER BY date
        ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
    ) AS moving_avg
FROM daily_sales;

-- 窗口函数比自连接更高效
```

### 2. 使用CTE（公共表表达式）

```sql
-- CTE提高可读性和性能
WITH user_orders AS (
    SELECT
        user_id,
        COUNT(*) AS order_count,
        SUM(total) AS total_amount
    FROM orders
    WHERE status = 'completed'
    GROUP BY user_id
),
user_info AS (
    SELECT id, username, email
    FROM users
    WHERE status = 'active'
)
SELECT
    ui.username,
    ui.email,
    uo.order_count,
    uo.total_amount
FROM user_info ui
JOIN user_orders uo ON ui.id = uo.user_id
ORDER BY uo.total_amount DESC;
```

### 3. 批量操作

```sql
-- ❌ 不好：逐条插入
INSERT INTO logs (message) VALUES ('log1');
INSERT INTO logs (message) VALUES ('log2');
INSERT INTO logs (message) VALUES ('log3');

-- ✅ 好：批量插入
INSERT INTO logs (message) VALUES
    ('log1'),
    ('log2'),
    ('log3');

-- 批量更新
UPDATE products
SET price = CASE id
    WHEN 1 THEN 100
    WHEN 2 THEN 200
    WHEN 3 THEN 300
END
WHERE id IN (1, 2, 3);
```

### 4. 使用物化视图

```sql
-- 创建物化视图（PostgreSQL）
CREATE MATERIALIZED VIEW user_order_summary AS
SELECT
    u.id,
    u.username,
    COUNT(o.id) AS order_count,
    COALESCE(SUM(o.total), 0) AS total_amount
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id, u.username;

-- 定期刷新
REFRESH MATERIALIZED VIEW user_order_summary;

-- 查询物化视图（快速）
SELECT * FROM user_order_summary WHERE order_count > 10;
```

## SQL性能监控

### 慢查询日志

```sql
-- 启用慢查询日志（MySQL）
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2; -- 超过2秒的查询记录

-- 查看慢查询
SHOW VARIABLES LIKE 'slow_query_log%';
```

### 查询统计

```sql
-- 查看最慢的查询（PostgreSQL）
SELECT
    query,
    calls,
    mean_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- 查看表访问统计
SELECT
    schemaname,
    tablename,
    seq_scan,
    idx_scan,
    n_tup_ins,
    n_tup_upd,
    n_tup_del
FROM pg_stat_user_tables;
```

## 最佳实践总结

### 编写规范

1. **关键字大写**：提高可读性
2. **合理换行**：每个子句单独一行
3. **统一缩进**：使用2-4个空格
4. **表别名**：多表查询时使用简短别名
5. **注释**：复杂查询添加说明

### 性能优化

1. **创建合适的索引**：但不要过度索引
2. **避免SELECT ***：只查询需要的列
3. **使用LIMIT**：限制结果集大小
4. **优化JOIN**：选择合适的JOIN类型
5. **使用EXPLAIN**：分析查询执行计划
6. **定期维护**：更新表统计信息，重建索引

### 安全建议

1. **使用参数化查询**：防止SQL注入
2. **最小权限原则**：限制数据库用户权限
3. **敏感数据加密**：密码等敏感信息加密存储
4. **定期备份**：确保数据安全

## 总结

编写高质量的SQL既需要良好的格式化习惯，也需要深入理解查询优化。记住这些要点：

- 格式化提高代码可读性和可维护性
- 索引是查询优化的关键
- 使用EXPLAIN分析查询性能
- 定期监控和优化慢查询
- 在性能和可读性之间找平衡

好的SQL不仅要正确，还要高效、易读、易维护。

## 🧰 本章配套工具箱

边读边练：以下工具均在浏览器本地运行，数据不上传，可直接打开使用。

- [SQL格式化](https://www.util.cn/tools/sql-formatter/)：一键把乱排 SQL 按文中规范美化
- [SQL查询优化器](https://www.util.cn/tools/sql-query-optimizer/)：分析慢查询给出优化改写建议
- [SQL IN条件格式化](https://www.util.cn/tools/sql-in-formatter/)：粘贴 ID 列拼长 IN 条件查询
- [MyBatis日志还原SQL](https://www.util.cn/tools/mybatis-sql-restore/)：日志占位符回填可执行完整 SQL
- [DDL转ER图](https://www.util.cn/tools/ddl-to-er-diagram/)：建表语句生成 ER 图梳理关系
- [CSV转SQL工具](https://www.util.cn/tools/csv-to-sql/)：数据表转 INSERT 灌测试库
