---
title: "数据库优化与分布式存储：构建高性能数据架构"
description: "深入探讨数据库优化技巧和分布式存储架构，涵盖索引优化、查询优化、分库分表、分布式数据库、缓存策略等核心主题。"
author: "有条工具团队"
date: 2025-12-30T15:00:00+08:00
categories:
  - 数据库
  - 分布式系统
tags:
  - 数据库优化
  - 分布式存储
  - 索引优化
  - 查询优化
  - 分库分表
keywords:
  - 数据库性能优化
  - SQL查询优化
  - 索引设计
  - 分布式数据库
  - 分库分表
  - 缓存策略
  - 数据一致性
series:
  - 数据库架构进阶
draft: false
---

## 引言

数据是现代应用的核心资产。随着数据量的爆炸式增长，数据库性能和可扩展性成为系统设计的关键挑战。本文将深入探讨数据库优化技巧和分布式存储架构，帮助读者构建高性能的数据架构。

## 一、数据库性能优化

### 1.1 索引优化策略

```sql
-- ========== 索引基础 ==========

-- 1. B-Tree索引（最常用）
-- 适合：等值查询、范围查询、排序
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_order_created ON orders(created_at);

-- 2. 复合索引
-- 注意：最左前缀原则
CREATE INDEX idx_user_status_created ON users(status, created_at);

-- 有效的查询（能使用索引）
SELECT * FROM users WHERE status = 1 AND created_at > '2024-01-01';
SELECT * FROM users WHERE status = 1;

-- 无效的查询（不能使用索引）
SELECT * FROM users WHERE created_at > '2024-01-01';

-- 3. 覆盖索引
-- 包含查询所需的所有字段，避免回表
CREATE INDEX idx_user_cover ON users(status, created_at, id, name);

-- 4. 唯一索引
CREATE UNIQUE INDEX idx_user_username ON users(username);

-- ========== 索引设计原则 ==========

/*
1. 选择性高的字段适合建索引
   - 高选择性：唯一值多（如用户ID、邮箱）
   - 低选择性：重复值多（如性别、状态）

2. WHERE、JOIN、ORDER BY子句的字段

3. 小字段优先
   - 整数 > 日期 > 短字符串 > 长字符串

4. 联合索引的顺序
   - 最常查询的字段放前面
   - 范围查询字段放后面

5. 避免过多索引
   - 降低写入性能
   - 占用存储空间
*/

-- ========== 索引优化案例 ==========

-- 问题：查询慢
-- 耗时：2.5秒
SELECT *
FROM orders o
LEFT JOIN users u ON o.user_id = u.id
WHERE o.status = 'pending'
  AND o.created_at > '2024-01-01'
ORDER BY o.created_at DESC
LIMIT 20;

-- 优化1：添加合适索引
CREATE INDEX idx_orders_status_created ON orders(status, created_at DESC);
CREATE INDEX idx_orders_user_id ON orders(user_id);

-- 耗时：0.3秒

-- 优化2：只查询需要的字段
SELECT o.id, o.order_no, o.total_amount, u.username
FROM orders o
LEFT JOIN users u ON o.user_id = u.id
WHERE o.status = 'pending'
  AND o.created_at > '2024-01-01'
ORDER BY o.created_at DESC
LIMIT 20;

-- 耗时：0.1秒

-- 优化3：使用覆盖索引
CREATE INDEX idx_orders_cover ON orders(
    status,
    created_at DESC,
    id,
    order_no,
    total_amount,
    user_id
);

-- 耗时：0.05秒
```

```python
# ========== 索引分析与维护 ==========

import pymysql
from typing import List, Dict, Tuple

class IndexAnalyzer:
    """索引分析器"""

    def __init__(self, connection_config: dict):
        self.conn = pymysql.connect(**connection_config)

    def analyze_table_indexes(self, table_name: str) -> List[Dict]:
        """分析表的索引使用情况"""

        with self.conn.cursor() as cursor:
            # 查询索引信息
            sql = """
                SHOW INDEX FROM %s
            """ % table_name

            cursor.execute(sql)
            indexes = cursor.fetchall()

            # 查询索引使用统计
            sql = """
                SELECT
                    table_name,
                    index_name,
                    cardinality,
                    column_name,
                    seq_in_index
                FROM information_schema.statistics
                WHERE table_schema = DATABASE()
                  AND table_name = %s
                ORDER BY index_name, seq_in_index
            """

            cursor.execute(sql, (table_name,))
            stats = cursor.fetchall()

            return {
                'indexes': indexes,
                'statistics': stats
            }

    def find_unused_indexes(self) -> List[Dict]:
        """查找未使用的索引"""

        with self.conn.cursor() as cursor:
            # MySQL 5.7+ 使用performance_schema
            sql = """
                SELECT
                    object_schema AS table_schema,
                    object_name AS table_name,
                    index_name
                FROM performance_schema.table_io_waits_summary_by_index_usage
                WHERE index_name IS NOT NULL
                  AND count_star = 0
                  AND index_name != 'PRIMARY'
                ORDER BY object_schema, object_name
            """

            cursor.execute(sql)
            return cursor.fetchall()

    def find_duplicate_indexes(self, table_name: str) -> List[Tuple]:
        """查找冗余索引"""

        with self.conn.cursor() as cursor:
            # 查询索引及其列
            sql = """
                SELECT
                    index_name,
                    GROUP_CONCAT(column_name ORDER BY seq_in_index) as columns
                FROM information_schema.statistics
                WHERE table_schema = DATABASE()
                  AND table_name = %s
                GROUP BY index_name
                HAVING COUNT(*) > 1
            """

            cursor.execute(sql, (table_name,))
            indexes = cursor.fetchall()

            # 查找冗余索引
            duplicates = []

            for i, idx1 in enumerate(indexes):
                for idx2 in indexes[i+1:]:
                    # 检查是否包含关系
                    if idx2[1].startswith(idx1[1]):
                        duplicates.append((idx1[0], idx2[0]))

            return duplicates

    def suggest_indexes(self, table_name: str) -> List[Dict]:
        """推荐索引"""

        with self.conn.cursor() as cursor:
            # 分析慢查询日志
            sql = """
                SELECT
                    sql_text,
                    count(*) as frequency
                FROM mysql.slow_log
                WHERE sql_text LIKE %s
                GROUP BY sql_text
                ORDER BY frequency DESC
                LIMIT 10
            """

            cursor.execute(sql, (f'%{table_name}%',))
            slow_queries = cursor.fetchall()

            suggestions = []

            for query, freq in slow_queries:
                # 提取WHERE条件字段
                # 这里简化处理，实际需要解析SQL
                # ...

                suggestions.append({
                    'query': query,
                    'frequency': freq,
                    'suggested_index': '建议基于WHERE子句创建索引'
                })

            return suggestions
```

### 1.2 查询优化

```sql
-- ========== SQL查询优化 ==========

-- 1. 避免SELECT *
-- 不推荐
SELECT * FROM users WHERE id = 1;

-- 推荐
SELECT id, username, email FROM users WHERE id = 1;

-- 2. 使用LIMIT限制结果集
SELECT * FROM orders WHERE status = 'pending' LIMIT 100;

-- 3. 优化JOIN
-- 小表驱动大表
SELECT *
FROM small_table s
JOIN large_table l ON s.id = l.small_id;

-- 4. 子查询优化
-- 不推荐
SELECT * FROM users
WHERE id IN (SELECT user_id FROM orders WHERE amount > 1000);

-- 推荐
SELECT DISTINCT u.* FROM users u
INNER JOIN orders o ON u.id = o.user_id
WHERE o.amount > 1000;

-- 5. EXISTS vs IN
-- 小表用IN，大表用EXISTS
-- 小表
SELECT * FROM users WHERE id IN (1, 2, 3);

-- 大表
SELECT * FROM users u
WHERE EXISTS (
    SELECT 1 FROM orders o
    WHERE o.user_id = u.id AND o.status = 'pending'
);

-- 6. 避免在WHERE子句中使用函数
-- 不推荐
SELECT * FROM orders WHERE DATE(created_at) = '2024-01-01';

-- 推荐
SELECT * FROM orders
WHERE created_at >= '2024-01-01'
  AND created_at < '2024-01-02';

-- 7. 使用UNION ALL代替UNION
-- 不推荐（去重开销大）
SELECT user_id FROM orders_2024
UNION
SELECT user_id FROM orders_2023;

-- 推荐
SELECT user_id FROM orders_2024
UNION ALL
SELECT user_id FROM orders_2023;

-- 8. 批量操作
-- 不推荐（多次单条插入）
INSERT INTO logs (message) VALUES ('log1');
INSERT INTO logs (message) VALUES ('log2');
INSERT INTO logs (message) VALUES ('log3');

-- 推荐
INSERT INTO logs (message) VALUES
    ('log1'),
    ('log2'),
    ('log3');
```

```python
# ========== 查询优化器 ==========

import re
from typing import List, Dict, Tuple

class SQLQueryOptimizer:
    """SQL查询优化器"""

    def __init__(self):
        self.rules = {
            'select_star': self._check_select_star,
            'missing_where': self._check_missing_where,
            'function_in_where': self._check_function_in_where,
            'subquery': self._check_subquery,
            'nplus1': self._check_nplus1
        }

    def optimize(self, sql: str) -> Dict:
        """优化SQL"""

        issues = []
        suggestions = []

        for rule_name, rule_func in self.rules.items():
            result = rule_func(sql)
            if result:
                issues.append(result['issue'])
                suggestions.append(result['suggestion'])

        return {
            'original_sql': sql,
            'issues': issues,
            'suggestions': suggestions
        }

    def _check_select_star(self, sql: str) -> Dict:
        """检查SELECT ***"""
        if re.search(r'SELECT\s+\*\s+FROM', sql, re.IGNORECASE):
            return {
                'issue': '使用SELECT *',
                'suggestion': '只查询需要的列，减少数据传输'
            }
        return None

    def _check_missing_where(self, sql: str) -> Dict:
        """检查缺少WHERE条件"""
        if re.search(r'(DELETE|UPDATE)\s+\w+\s+(?!WHERE)', sql, re.IGNORECASE):
            return {
                'issue': 'DELETE/UPDATE缺少WHERE条件',
                'suggestion': '添加WHERE条件，避免全表操作'
            }
        return None

    def _check_function_in_where(self, sql: str) -> Dict:
        """检查WHERE子句中使用函数"""
        if re.search(
            r'WHERE\s+.*(?:DATE|YEAR|MONTH|DAY)\(',
            sql,
            re.IGNORECASE
        ):
            return {
                'issue': 'WHERE子句中使用函数',
                'suggestion': '将函数作用到比较值上，而非字段'
            }
        return None

    def _check_subquery(self, sql: str) -> Dict:
        """检查子查询"""
        if 'IN (SELECT' in sql.upper():
            return {
                'issue': '使用IN子查询',
                'suggestion': '考虑改用JOIN或EXISTS'
            }
        return None

    def _check_nplus1(self, sql: str) -> Dict:
        """检查N+1查询"""
        # 这里简化处理，实际需要分析执行模式
        return None

class QueryExecutionAnalyzer:
    """查询执行分析器"""

    def __init__(self, connection):
        self.conn = connection

    def explain_query(self, sql: str) -> Dict:
        """分析查询执行计划"""

        with self.conn.cursor() as cursor:
            # 执行EXPLAIN
            explain_sql = f"EXPLAIN {sql}"
            cursor.execute(explain_sql)
            result = cursor.fetchall()

            analysis = {
                'type': [],
                'table': [],
                'possible_keys': [],
                'key': [],
                'rows': [],
                'filtered': [],
                'extra': []
            }

            for row in result:
                analysis['type'].append(row['type'])
                analysis['table'].append(row['table'])
                analysis['possible_keys'].append(row['possible_keys'])
                analysis['key'].append(row['key'])
                analysis['rows'].append(row['rows'])
                analysis['filtered'].append(row['filtered'])
                analysis['extra'].append(row['Extra'])

            # 分析结果
            suggestions = []

            # 检查是否全表扫描
            if 'ALL' in analysis['type']:
                suggestions.append(
                    '警告：存在全表扫描，考虑添加索引'
                )

            # 检查是否使用了索引
            if None in analysis['key']:
                suggestions.append(
                    '部分查询没有使用索引，检查索引设计'
                )

            # 检查扫描行数
            if analysis['rows'] and sum(analysis['rows']) > 10000:
                suggestions.append(
                    '扫描行数较多，考虑优化查询或索引'
                )

            return {
                'explain_plan': result,
                'suggestions': suggestions
            }

    def profile_query(self, sql: str) -> Dict:
        """分析查询性能"""

        with self.conn.cursor() as cursor:
            # 开启profiling
            cursor.execute("SET profiling = 1")

            # 执行查询
            cursor.execute(sql)

            # 获取profiling结果
            cursor.execute("SHOW PROFILE")
            profile = cursor.fetchall()

            # 获取查询统计
            cursor.execute("SHOW PROFILE FOR QUERY 1")
            stats = cursor.fetchall()

            return {
                'profile': profile,
                'statistics': stats
            }
```

## 二、分库分表策略

### 2.1 水平分表

```python
# ========== 分表策略 ==========

class ShardingStrategy:
    """分片策略"""

    def __init__(self, shard_count: int):
        self.shard_count = shard_count

    def hash_sharding(self, key: str) -> int:
        """哈希分片"""
        hash_value = hash(key)
        return hash_value % self.shard_count

    def range_sharding(self, key: int) -> int:
        """范围分片"""
        # 假设key是自增ID
        shard_size = 1000000  # 每个分片100万条
        return key // shard_size

    def modulo_sharding(self, key: int) -> int:
        """取模分片"""
        return key % self.shard_count

    def consistent_hash_sharding(self, key: str) -> int:
        """一致性哈希分片"""
        import hashlib

        hash_value = int(hashlib.md5(key.encode()).hexdigest(), 16)
        return hash_value % self.shard_count

class ShardingManager:
    """分片管理器"""

    def __init__(self, shard_configs: List[dict]):
        self.shards = {}
        for config in shard_configs:
            shard_id = config['id']
            self.shards[shard_id] = {
                'connection': self._create_connection(config),
                'config': config
            }

        self.strategy = ShardingStrategy(len(shard_configs))

    def _create_connection(self, config: dict):
        """创建数据库连接"""
        import pymysql

        return pymysql.connect(
            host=config['host'],
            port=config['port'],
            user=config['user'],
            password=config['password'],
            database=config['database']
        )

    def get_shard(self, shard_key: str, sharding_type: str = 'hash'):
        """获取分片连接"""

        if sharding_type == 'hash':
            shard_id = self.strategy.hash_sharding(shard_key)
        elif sharding_type == 'consistent':
            shard_id = self.strategy.consistent_hash_sharding(shard_key)
        elif sharding_type == 'modulo':
            shard_id = self.strategy.modulo_sharding(int(shard_key))
        else:
            raise ValueError(f"Unknown sharding type: {sharding_type}")

        return self.shards[shard_id]['connection']

    def execute_on_shard(self, shard_key: str, sql: str, params=None):
        """在指定分片执行SQL"""

        conn = self.get_shard(shard_key)

        with conn.cursor() as cursor:
            cursor.execute(sql, params or ())
            return cursor.fetchall()

    def query_all_shards(self, sql: str, params=None):
        """查询所有分片"""

        results = []

        for shard_id, shard in self.shards.items():
            conn = shard['connection']

            with conn.cursor() as cursor:
                cursor.execute(sql, params or ())
                shard_results = cursor.fetchall()

                # 添加分片标识
                for row in shard_results:
                    if isinstance(row, dict):
                        row['_shard_id'] = shard_id

                results.extend(shard_results)

        return results

    def broadcast_write(self, sql: str, params=None):
        """广播写入所有分片"""

        results = []

        for shard_id, shard in self.shards.items():
            conn = shard['connection']

            with conn.cursor() as cursor:
                cursor.execute(sql, params or ())
                conn.commit()

                results.append({
                    'shard_id': shard_id,
                    'affected_rows': cursor.rowcount
                })

        return results

# ========== 分表路由 ==========

class TableRouter:
    """表路由"""

    def __init__(self, sharding_manager: ShardingManager):
        self.manager = sharding_manager
        self.table_rules = {}

    def add_rule(self, table_name: str, sharding_key: str, sharding_type: str):
        """添加分表规则"""
        self.table_rules[table_name] = {
            'sharding_key': sharding_key,
            'sharding_type': sharding_type
        }

    def get_table_name(self, original_table: str, shard_key: str) -> str:
        """获取实际表名"""

        rule = self.table_rules.get(original_table)

        if not rule:
            return original_table

        # 计算分片ID
        if rule['sharding_type'] == 'hash':
            shard_id = hash(shard_key) % self.manager.strategy.shard_count
        elif rule['sharding_type'] == 'modulo':
            shard_id = int(shard_key) % self.manager.strategy.shard_count
        else:
            shard_id = 0

        return f"{original_table}_{shard_id:04d}"

    def execute_query(self, table_name: str, query_template: str, **kwargs):
        """执行分表查询"""

        # 获取分片键值
        rule = self.table_rules.get(table_name)

        if not rule:
            # 不分表，直接执行
            return self.manager.execute_on_shard('0', query_template, kwargs)

        shard_key_value = kwargs.get(rule['sharding_key'])

        if not shard_key_value:
            raise ValueError(f"Missing sharding key: {rule['sharding_key']}")

        # 获取实际表名
        actual_table = self.get_table_name(table_name, str(shard_key_value))

        # 替换表名
        actual_query = query_template.replace(f'FROM {table_name}', f'FROM {actual_table}')

        return self.manager.execute_on_shard(str(shard_key_value), actual_query, kwargs)

# 使用示例
shard_configs = [
    {
        'id': 0,
        'host': 'db0.example.com',
        'port': 3306,
        'user': 'root',
        'password': 'password',
        'database': 'app_db_0'
    },
    {
        'id': 1,
        'host': 'db1.example.com',
        'port': 3306,
        'user': 'root',
        'password': 'password',
        'database': 'app_db_1'
    },
    {
        'id': 2,
        'host': 'db2.example.com',
        'port': 3306,
        'user': 'root',
        'password': 'password',
        'database': 'app_db_2'
    },
    {
        'id': 3,
        'host': 'db3.example.com',
        'port': 3306,
        'user': 'root',
        'password': 'password',
        'database': 'app_db_3'
    }
]

sharding_manager = ShardingManager(shard_configs)
table_router = TableRouter(sharding_manager)

# 配置orders表按user_id分表
table_router.add_rule('orders', 'user_id', 'modulo')

# 插入订单（自动路由到正确的分片）
table_router.execute_query(
    'orders',
    "INSERT INTO orders (user_id, order_no, total_amount) VALUES (:user_id, :order_no, :total_amount)",
    user_id=12345,
    order_no='ORD2024010112345',
    total_amount=9999.99
)

# 查询订单（自动路由到正确的分片）
results = table_router.execute_query(
    'orders',
    "SELECT * FROM orders WHERE user_id = :user_id",
    user_id=12345
)
```

### 2.2 垂直分库

```python
# ========== 垂直分库策略 ==========

class VerticalSharding:
    """垂直分库"""

    def __init__(self):
        self.databases = {
            'user_db': None,      # 用户相关表
            'order_db': None,     # 订单相关表
            'product_db': None,   # 商品相关表
            'log_db': None        # 日志相关表
        }

    def route_by_module(self, table_name: str):
        """按模块路由"""

        module_mapping = {
            # 用户模块
            'users': 'user_db',
            'user_profiles': 'user_db',
            'user_addresses': 'user_db',
            'user_preferences': 'user_db',

            # 订单模块
            'orders': 'order_db',
            'order_items': 'order_db',
            'order_payments': 'order_db',
            'order_shippings': 'order_db',

            # 商品模块
            'products': 'product_db',
            'categories': 'product_db',
            'product_skus': 'product_db',
            'inventory': 'product_db',

            # 日志模块
            'operation_logs': 'log_db',
            'access_logs': 'log_db',
            'error_logs': 'log_db'
        }

        return self.databases.get(module_mapping.get(table_name))

    def cross_database_query(self, queries: List[dict]):
        """跨库查询"""

        results = {}

        for query_info in queries:
            db_name = query_info['database']
            sql = query_info['sql']
            params = query_info.get('params', {})

            conn = self.databases[db_name]

            with conn.cursor() as cursor:
                cursor.execute(sql, params)
                results[db_name] = cursor.fetchall()

        # 在应用层合并结果
        return self._merge_results(results)

    def _merge_results(self, results: dict) -> List[dict]:
        """合并跨库查询结果"""

        # 根据业务逻辑合并结果
        # 这里是简化示例
        merged = []

        # 从user_db获取用户信息
        users = results.get('user_db', [])

        # 从order_db获取订单信息
        orders = results.get('order_db', [])

        # 合并数据
        user_dict = {user['id']: user for user in users}

        for order in orders:
            user_id = order['user_id']
            if user_id in user_dict:
                merged.append({
                    **user_dict[user_id],
                    'order': order
                })

        return merged

# ========== 分布式事务（Saga模式） ==========

class DistributedTransaction:
    """分布式事务管理器"""

    def __init__(self):
        self.participants = []
        self.compensations = []

    def add_participant(self, database: str, operation: str, compensation: str):
        """添加事务参与者"""

        self.participants.append({
            'database': database,
            'operation': operation
        })

        self.compensations.append({
            'database': database,
            'operation': compensation
        })

    async def execute(self) -> bool:
        """执行分布式事务"""

        executed = []

        try:
            # 顺序执行各分库操作
            for participant in self.participants:
                conn = self.databases[participant['database']]

                with conn.cursor() as cursor:
                    cursor.execute(participant['operation'])
                    conn.commit()

                    executed.append(participant)

            return True

        except Exception as e:
            # 执行补偿操作
            for i in range(len(executed) - 1, -1, -1):
                compensation = self.compensations[i]

                try:
                    conn = self.databases[compensation['database']]

                    with conn.cursor() as cursor:
                        cursor.execute(compensation['operation'])
                        conn.commit()

                except Exception as ce:
                    # 补偿失败，记录日志
                    print(f"Compensation failed: {ce}")

            return False
```

## 三、分布式数据库

### 3.1 NewSQL数据库

```python
# ========== TiDB集成示例 ==========

import MySQLdb

class TiDBClient:
    """TiDB客户端"""

    def __init__(self, host: str, port: int, user: str, password: str, database: str):
        self.conn = MySQLdb.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            database=database,
            charset='utf8mb4'
        )

    def insert_batch(self, table: str, records: List[dict]) -> int:
        """批量插入"""

        if not records:
            return 0

        # 构建批量插入SQL
        columns = list(records[0].keys())
        placeholders = ', '.join(['%s'] * len(columns))

        sql = f"""
            INSERT INTO {table} ({', '.join(columns)})
            VALUES ({placeholders})
        """

        values = [
            tuple(record[col] for col in columns)
            for record in records
        ]

        with self.conn.cursor() as cursor:
            cursor.executemany(sql, values)
            self.conn.commit()

            return cursor.rowcount

    def select_with_pagination(
        self,
        table: str,
        where: str = None,
        order_by: str = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[dict]:
        """分页查询"""

        sql = f"SELECT * FROM {table}"

        if where:
            sql += f" WHERE {where}"

        if order_by:
            sql += f" ORDER BY {order_by}"

        sql += f" LIMIT {limit} OFFSET {offset}"

        with self.conn.cursor(MySQLdb.cursors.DictCursor) as cursor:
            cursor.execute(sql)
            return cursor.fetchall()

    def get_transaction_info(self) -> dict:
        """获取事务信息"""

        with self.conn.cursor() as cursor:
            # 查询当前事务信息
            cursor.execute("SELECT @@txn_version as version")
            version = cursor.fetchone()

            cursor.execute("SELECT @@autocommit as autocommit")
            autocommit = cursor.fetchone()

            return {
                'version': version[0] if version else None,
                'autocommit': autocommit[0] if autocommit else None
            }

# ========== 分布式事务使用 ==========

class DistributedOrderService:
    """分布式订单服务"""

    def __init__(self, tidb_client: TiDBClient):
        self.tidb = tidb_client

    async def create_order(self, order_data: dict, items: List[dict]) -> str:
        """创建订单（分布式事务）"""

        try:
            # 开启事务
            with self.tidb.conn as cursor:
                # 1. 创建订单
                order_sql = """
                    INSERT INTO orders (user_id, order_no, total_amount, status)
                    VALUES (%s, %s, %s, %s)
                """
                cursor.execute(order_sql, (
                    order_data['user_id'],
                    order_data['order_no'],
                    order_data['total_amount'],
                    'pending'
                ))

                order_id = cursor.lastrowid

                # 2. 创建订单明细
                for item in items:
                    item_sql = """
                        INSERT INTO order_items (
                            order_id, product_id, quantity, price
                        ) VALUES (%s, %s, %s, %s)
                    """
                    cursor.execute(item_sql, (
                        order_id,
                        item['product_id'],
                        item['quantity'],
                        item['price']
                    ))

                # 3. 扣减库存
                for item in items:
                    inventory_sql = """
                        UPDATE inventory
                        SET stock = stock - %s
                        WHERE product_id = %s AND stock >= %s
                    """
                    affected = cursor.execute(inventory_sql, (
                        item['quantity'],
                        item['product_id'],
                        item['quantity']
                    ))

                    if affected == 0:
                        # 库存不足，回滚事务
                        raise Exception(f"Insufficient stock for product {item['product_id']}")

                # 4. 创建支付记录
                payment_sql = """
                    INSERT INTO payments (
                        order_id, amount, status, payment_method
                    ) VALUES (%s, %s, %s, %s)
                """
                cursor.execute(payment_sql, (
                    order_id,
                    order_data['total_amount'],
                    'pending',
                    order_data['payment_method']
                ))

                # 提交事务
                self.tidb.conn.commit()

                return order_id

        except Exception as e:
            # 回滚事务
            self.tidb.conn.rollback()
            raise e
```

### 3.2 分布式缓存

```python
# ========== Redis集群 ==========

import redis
from rediscluster import RedisCluster

class RedisClusterClient:
    """Redis集群客户端"""

    def __init__(self, startup_nodes: List[dict]):
        """
        startup_nodes: [
            {'host': 'redis1.example.com', 'port': 7000},
            {'host': 'redis2.example.com', 'port': 7001},
            {'host': 'redis3.example.com', 'port': 7002}
        ]
        """
        self.client = RedisCluster(
            startup_nodes=startup_nodes,
            decode_responses=True,
            skip_full_coverage_check=True,
            max_connections=32
        )

    def set(self, key: str, value: str, expire: int = None):
        """设置键值"""
        return self.client.set(key, value, ex=expire)

    def get(self, key: str) -> str:
        """获取值"""
        return self.client.get(key)

    def mget(self, keys: List[str]) -> List[str]:
        """批量获取"""
        return self.client.mget(keys)

    def delete(self, *keys: str):
        """删除键"""
        return self.client.delete(*keys)

    def exists(self, *keys: str) -> int:
        """检查键是否存在"""
        return self.client.exists(*keys)

    def expire(self, key: str, seconds: int):
        """设置过期时间"""
        return self.client.expire(key, seconds)

    def incr(self, key: str, amount: int = 1) -> int:
        """递增"""
        return self.client.incrby(key, amount)

    def decr(self, key: str, amount: int = 1) -> int:
        """递减"""
        return self.client.decrby(key, amount)

    def hset(self, name: str, key: str, value: str):
        """哈希表设置"""
        return self.client.hset(name, key, value)

    def hget(self, name: str, key: str) -> str:
        """哈希表获取"""
        return self.client.hget(name, key)

    def hgetall(self, name: str) -> dict:
        """获取整个哈希表"""
        return self.client.hgetall(name)

# ========== 缓存策略 ==========

class CacheStrategy:
    """缓存策略"""

    def __init__(self, redis_client: RedisClusterClient):
        self.redis = redis_client

    def cache_aside(self, key: str, load_func, expire: int = 3600):
        """Cache-Aside模式"""

        # 先查缓存
        value = self.redis.get(key)

        if value is not None:
            return value

        # 缓存未命中，加载数据
        value = load_func()

        # 写入缓存
        self.redis.set(key, value, expire)

        return value

    def invalidate(self, *keys: str):
        """使缓存失效"""
        self.redis.delete(*keys)

    def warm_up(self, data: dict, expire: int = 3600):
        """缓存预热"""

        pipe = self.redis.client.pipeline()

        for key, value in data.items():
            pipe.set(key, value, expire)

        pipe.execute()

    def update(self, key: str, value: str, expire: int = 3600):
        """更新缓存"""

        self.redis.set(key, value, expire)

# ========== 分布式锁 ==========

class DistributedLock:
    """分布式锁"""

    def __init__(self, redis_client: RedisClusterClient):
        self.redis = redis_client

    def acquire(
        self,
        lock_name: str,
        acquire_timeout: int = 10,
        lock_timeout: int = 30
    ) -> bool:
        """获取锁"""

        import time

        lock_key = f"lock:{lock_name}"
        lock_value = f"{time.time()}"

        end_time = time.time() + acquire_timeout

        while time.time() < end_time:
            # 尝试获取锁
            if self.redis.client.set(
                lock_key,
                lock_value,
                nx=True,
                ex=lock_timeout
            ):
                return True

            time.sleep(0.001)

        return False

    def release(self, lock_name: str):
        """释放锁"""

        lock_key = f"lock:{lock_name}"

        # 使用Lua脚本确保只释放自己的锁
        lua_script = """
            if redis.call("get", KEYS[1]) == ARGV[1] then
                return redis.call("del", KEYS[1])
            else
                return 0
            end
        """

        self.redis.client.eval(
            lua_script,
            1,
            lock_key,
            self.redis.get(lock_key)
        )

# ========== 限流器 ==========

class RateLimiter:
    """分布式限流器"""

    def __init__(self, redis_client: RedisClusterClient):
        self.redis = redis_client

    def is_allowed(
        self,
        key: str,
        limit: int,
        window: int
    ) -> bool:
        """
        滑动窗口限流

        key: 限流键（如用户ID、IP等）
        limit: 时间窗口内最大请求数
        window: 时间窗口（秒）
        """

        import time

        now = time.time()
        window_start = now - window

        pipe = self.redis.client.pipeline()

        # 移除时间窗口外的记录
        pipe.zremrangebyscore(key, 0, window_start)

        # 获取当前计数
        pipe.zcard(key)

        # 添加当前请求
        pipe.zadd(key, {str(now): now})

        # 设置过期时间
        pipe.expire(key, window + 1)

        results = pipe.execute()

        current_count = results[1]

        return current_count < limit
```

## 四、数据库监控与运维

### 4.1 性能监控

```python
# ========== 数据库监控 ==========

class DatabaseMonitor:
    """数据库监控"""

    def __init__(self, connection):
        self.conn = connection

    def get_connection_stats(self) -> dict:
        """获取连接统计"""

        with self.conn.cursor() as cursor:
            cursor.execute("""
                SHOW STATUS LIKE 'Threads%'
            """)

            stats = cursor.fetchall()

            return {
                'threads_connected': next(
                    (s[1] for s in stats if s[0] == 'Threads_connected'),
                    0
                ),
                'threads_running': next(
                    (s[1] for s in stats if s[0] == 'Threads_running'),
                    0
                )
            }

    def get_query_stats(self) -> dict:
        """获取查询统计"""

        with self.conn.cursor() as cursor:
            # 慢查询统计
            cursor.execute("""
                SELECT
                    COUNT(*) as slow_query_count,
                    AVG(query_time) as avg_query_time,
                    MAX(query_time) as max_query_time
                FROM mysql.slow_log
                WHERE start_time > DATE_SUB(NOW(), INTERVAL 1 HOUR)
            """)

            slow_stats = cursor.fetchone()

            # QPS/TPS统计
            cursor.execute("""
                SHOW STATUS LIKE 'Questions'
            """)
            questions = cursor.fetchone()

            cursor.execute("""
                SHOW STATUS LIKE 'Uptime'
            """)
            uptime = cursor.fetchone()

            qps = questions[1] / uptime[1] if uptime[1] > 0 else 0

            return {
                'slow_query_count': slow_stats[0],
                'avg_query_time': float(slow_stats[1]) if slow_stats[1] else 0,
                'max_query_time': float(slow_stats[2]) if slow_stats[2] else 0,
                'qps': round(qps, 2)
            }

    def get_replication_lag(self) -> int:
        """获取主从延迟"""

        with self.conn.cursor() as cursor:
            cursor.execute("SHOW SLAVE STATUS")
            status = cursor.fetchone()

            if status:
                return status['Seconds_Behind_Master']

            return 0

    def get_innodb_stats(self) -> dict:
        """获取InnoDB统计"""

        with self.conn.cursor() as cursor:
            cursor.execute("""
                SHOW STATUS LIKE 'Innodb_%'
            """)

            stats = cursor.fetchall()

            return {
                'row_lock_waits': next(
                    (s[1] for s in stats if s[0] == 'Innodb_row_lock_current_waits'),
                    0
                ),
                'deadlocks': next(
                    (s[1] for s in stats if s[0] == 'Innodb_deadlocks'),
                    0
                ),
                'buffer_pool_hit_rate': self._calculate_hit_rate(stats)
            }

    def _calculate_hit_rate(self, stats: list) -> float:
        """计算缓冲池命中率"""

        reads = next(
            (s[1] for s in stats if s[0] == 'Innodb_buffer_pool_reads'),
            0
        )

        read_requests = next(
            (s[1] for s in stats if s[0] == 'Innodb_buffer_pool_read_requests'),
            1
        )

        if read_requests == 0:
            return 100.0

        hit_rate = (1 - reads / read_requests) * 100
        return round(hit_rate, 2)

# ========== 慢查询分析 ==========

class SlowQueryAnalyzer:
    """慢查询分析器"""

    def __init__(self, connection):
        self.conn = connection

    def get_slow_queries(self, limit: int = 100) -> List[dict]:
        """获取慢查询"""

        with self.conn.cursor() as cursor:
            sql = """
                SELECT
                    query_time,
                    lock_time,
                    rows_sent,
                    rows_examined,
                    sql_text
                FROM mysql.slow_log
                ORDER BY query_time DESC
                LIMIT %s
            """

            cursor.execute(sql, (limit,))
            return cursor.fetchall()

    def analyze_slow_query(self, query: str) -> dict:
        """分析慢查询"""

        analyzer = SQLQueryOptimizer()
        return analyzer.optimize(query)

    def suggest_indexes(self, query: str) -> List[str]:
        """推荐索引"""

        # 提取WHERE、JOIN、ORDER BY子句中的字段
        # 这里简化处理
        import re

        # 提取表名
        tables = re.findall(r'FROM\s+(\w+)', query, re.IGNORECASE)
        tables += re.findall(r'JOIN\s+(\w+)', query, re.IGNORECASE)

        # 提取WHERE条件字段
        where_fields = re.findall(
            r'WHERE\s+(\w+)\.\w+\s*=',
            query,
            re.IGNORECASE
        )

        suggestions = []

        for table in set(tables):
            for field in set(where_fields):
                suggestions.append(
                    f"CREATE INDEX idx_{table}_{field} ON {table}({field})"
                )

        return suggestions
```

### 4.2 备份与恢复

```python
# ========== 数据库备份 ==========

import subprocess
import os
from datetime import datetime
from typing import List

class DatabaseBackup:
    """数据库备份"""

    def __init__(
        self,
        host: str,
        user: str,
        password: str,
        backup_dir: str = '/backup'
    ):
        self.host = host
        self.user = user
        self.password = password
        self.backup_dir = backup_dir

        os.makedirs(backup_dir, exist_ok=True)

    def backup_database(
        self,
        database: str,
        backup_type: str = 'full'
    ) -> str:
        """备份数据库"""

        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_file = os.path.join(
            self.backup_dir,
            f"{database}_{backup_type}_{timestamp}.sql"
        )

        # 使用mysqldump备份
        command = [
            'mysqldump',
            f'--host={self.host}',
            f'--user={self.user}',
            f'--password={self.password}',
            '--single-transaction',
            '--routines',
            '--triggers',
            '--events',
            '--quick',
            database
        ]

        with open(backup_file, 'w') as f:
            subprocess.run(
                command,
                stdout=f,
                stderr=subprocess.PIPE,
                check=True
            )

        # 压缩备份文件
        self._compress_file(backup_file)

        return f"{backup_file}.gz"

    def backup_all_databases(self) -> str:
        """备份所有数据库"""

        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_file = os.path.join(
            self.backup_dir,
            f"all_databases_{timestamp}.sql"
        )

        command = [
            'mysqldump',
            f'--host={self.host}',
            f'--user={self.user}',
            f'--password={self.password}',
            '--all-databases',
            '--single-transaction',
            '--routines',
            '--triggers',
            '--events'
        ]

        with open(backup_file, 'w') as f:
            subprocess.run(
                command,
                stdout=f,
                stderr=subprocess.PIPE,
                check=True
            )

        self._compress_file(backup_file)

        return f"{backup_file}.gz"

    def _compress_file(self, filepath: str):
        """压缩文件"""

        import gzip

        with open(filepath, 'rb') as f_in:
            with gzip.open(f"{filepath}.gz", 'wb') as f_out:
                f_out.writelines(f_in)

        os.remove(filepath)

    def restore_database(self, backup_file: str, database: str = None):
        """恢复数据库"""

        # 解压备份文件
        if backup_file.endswith('.gz'):
            import gzip

            temp_file = backup_file[:-3]

            with gzip.open(backup_file, 'rb') as f_in:
                with open(temp_file, 'wb') as f_out:
                    f_out.writelines(f_in)

            backup_file = temp_file

        # 恢复数据库
        command = [
            'mysql',
            f'--host={self.host}',
            f'--user={self.user}',
            f'--password={self.password}'
        ]

        if database:
            command.append(database)

        with open(backup_file, 'r') as f:
            subprocess.run(
                command,
                stdin=f,
                stderr=subprocess.PIPE,
                check=True
            )

        # 清理临时文件
        if backup_file.endswith('.sql'):
            os.remove(backup_file)

    def list_backups(self) -> List[dict]:
        """列出备份文件"""

        backups = []

        for filename in os.listdir(self.backup_dir):
            if filename.endswith('.sql.gz'):
                filepath = os.path.join(self.backup_dir, filename)

                stat = os.stat(filepath)

                backups.append({
                    'filename': filename,
                    'size': stat.st_size,
                    'created_at': datetime.fromtimestamp(stat.st_ctime)
                })

        return sorted(backups, key=lambda x: x['created_at'], reverse=True)

    def cleanup_old_backups(self, keep_days: int = 7):
        """清理旧备份"""

        from datetime import timedelta

        cutoff_time = datetime.now() - timedelta(days=keep_days)

        for filename in os.listdir(self.backup_dir):
            filepath = os.path.join(self.backup_dir, filename)

            stat = os.stat(filepath)

            if datetime.fromtimestamp(stat.st_ctime) < cutoff_time:
                os.remove(filepath)
                print(f"Removed old backup: {filename}")
```

## 总结

构建高性能的数据架构需要：

1. **索引优化**：合理设计索引，提升查询性能
2. **查询优化**：优化SQL语句，避免全表扫描
3. **分库分表**：按业务特点选择合适的分片策略
4. **分布式存储**：使用分布式数据库和缓存
5. **监控运维**：建立完善的监控和备份机制

> **相关工具推荐**
> - [SQL格式化工具](https://www.util.cn/tools/sql-formatter/) - SQL美化
> - [JSON格式化工具](https://www.util.cn/tools/json-formatter/) - JSON数据处理
> - [Base64编码工具](https://www.util.cn/tools/base64-encode/) - 编码转换
