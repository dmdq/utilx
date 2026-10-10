---
title: "数据库分库分表架构设计指南：从单表到百亿级数据的演进之路"
slug: "database-sharding-guide"
date: 2026-01-05
draft: false
description: "深入剖析数据库水平拆分的完整方案，详细介绍分库分表的路由策略、数据迁移、扩容方案，以及 ShardingSphere、Vitess 等中间件的实战应用"
tags: ["分库分表", "数据库", "架构设计", "ShardingSphere", "数据迁移"]
categories: ["架构设计"]
author: "技术团队"
---

## 引言：为什么需要分库分表？

MySQL 单表性能瓶颈：
- **数据量**：单表超过 1000 万行，查询性能显著下降
- **索引大小**：索引树高度增加，磁盘 I/O 增多
- **锁竞争**：高并发下锁等待严重
- **备份恢复**：单表过大，备份耗时长

分库分表是突破单机数据库瓶颈的有效手段，但它也带来了复杂的路由逻辑和运维成本。本文将系统地介绍分库分表的实践方案。

## 一、垂直拆分 vs 水平拆分

### 1.1 垂直拆分（按业务维度）

```
单体数据库：
┌─────────────────────────────────────────┐
│         single_database                │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │ user    │ │ order   │ │ product │   │
│  └─────────┘ └─────────┘ └─────────┘   │
└─────────────────────────────────────────┘
              ↓ 垂直拆分
┌─────────┐  ┌─────────┐  ┌─────────┐
│user_db  │  │order_db │  │product_db│
│         │  │         │  │         │
│ user    │  │ order   │  │ product │
│ profile │  │ payment │  │ inventory│
└─────────┘  └─────────┘  └─────────┘
```

**优点**：
- 拆分简单，无需修改代码
- 单库性能提升明显
- 便于业务解耦

**缺点**：
- 单表数据量继续增长后仍需水平拆分

### 1.2 水平拆分（按数据量）

```
order_db (5000 万行)
      ↓ 水平拆分
┌────────────┬────────────┬────────────┬────────────┐
│ order_db_0 │ order_db_1 │ order_db_2 │ order_db_3 │
│  1250万   │  1250万   │  1250万   │  1250万   │
└────────────┴────────────┴────────────┴────────────┘
```

## 二、分片策略设计

### 2.1 哈希分片

**优点**：数据均匀分布
**缺点**：扩容困难（需要重新哈希）

```go
type HashShardingStrategy struct {
    shardCount int
}

func (s *HashShardingStrategy) GetShard(key string) int {
    // 使用 FNV-1a 哈希算法
    hash := fnv.New32a()
    hash.Write([]byte(key))
    return int(hash.Sum32()) % s.shardCount
}

// 改进：一致性哈希（解决扩容问题）
type ConsistentHash struct {
    ring    map[uint32]int  // hash -> shard
    sorted  []uint32        // 排序后的 hash 值
}

func NewConsistentHash(shards []int) *ConsistentHash {
    ch := &ConsistentHash{
        ring:   make(map[uint32]int),
        sorted: []uint32{},
    }

    // 每个分片分配 150 个虚拟节点
    for _, shard := range shards {
        for i := 0; i < 150; i++ {
            hash := md5Hash(fmt.Sprintf("%d-%d", shard, i))
            ch.ring[hash] = shard
            ch.sorted = append(ch.sorted, hash)
        }
    }

    sort.Slice(ch.sorted, func(i, j int) bool {
        return ch.sorted[i] < ch.sorted[j]
    })

    return ch
}

func (ch *ConsistentHash) GetShard(key string) int {
    hash := md5Hash(key)

    // 二分查找第一个大于等于 hash 的节点
    idx := sort.Search(len(ch.sorted), func(i int) bool {
        return ch.sorted[i] >= hash
    })

    if idx == len(ch.sorted) {
        idx = 0  // 环形
    }

    return ch.ring[ch.sorted[idx]]
}
```

### 2.2 范围分片

**优点**：范围查询高效，扩容简单
**缺点**：数据分布不均，热点问题

```go
type RangeShardingStrategy struct {
    shards []RangeShard
}

type RangeShard struct {
    ShardID   int
    MinKey    string
    MaxKey    string
    TimeRange struct {
        Start time.Time
        End   time.Time
    }
}

func (s *RangeShardingStrategy) GetShard(key string) int {
    // 按时间范围分片（适用于订单、日志等时序数据）
    // key 格式：order_20260105_123456
    parts := strings.Split(key, "_")
    dateStr := parts[1]

    date, _ := time.Parse("20060102", dateStr)

    for _, shard := range s.shards {
        if date.After(shard.TimeRange.Start) && date.Before(shard.TimeRange.End) {
            return shard.ShardID
        }
    }

    return s.shards[len(s.shards)-1].ShardID
}
```

### 2.3 地理位置/用户ID 分片

```go
type GeoShardingStrategy struct {
    regionMap map[string]int  // region -> shard
}

func (s *GeoShardingStrategy) GetShard(userID string) int {
    // 提取用户归属地（如手机号前缀）
    prefix := userID[:3]

    // 号段归属地
    regionMap := map[string]string{
        "130": "beijing",
        "131": "beijing",
        "132": "shanghai",
        "133": "guangzhou",
        // ...
    }

    region := regionMap[prefix]
    return s.regionMap[region]
}
```

## 三、分库分表中间件选型

| 中间件 | 语言 | 特点 | 适用场景 |
|--------|------|------|---------|
| ShardingSphere | Java | 功能全面，社区活跃 | 复杂分片场景 |
| Vitess | Go | YouTube 背书，强一致 | 大规模 MySQL 集群 |
| Cobar | Java | 阿里开源 | 简单分片场景 |
| DBProxy | Go | 性能优秀 | 高并发场景 |

### 3.1 ShardingSphere 实战

**配置示例（分库分表）**：

```yaml
# sharding.yaml
mode:
  type: Standalone

dataSources:
  ds0:
    dataSourceClassName: com.zaxxer.hikari.HikariDataSource
    driverClassName: com.mysql.cj.jdbc.Driver
    jdbcUrl: jdbc:mysql://localhost:3306/ds0
    username: root
    password: password
  ds1:
    dataSourceClassName: com.zaxxer.hikari.HikariDataSource
    driverClassName: com.mysql.cj.jdbc.Driver
    jdbcUrl: jdbc:mysql://localhost:3306/ds1
    username: root
    password: password

rules:
  - !SHARDING
    tables:
      t_order:
        actualDataNodes: ds${0..1}.t_order${0..1}
        databaseStrategy:
          standard:
            shardingColumn: user_id
            shardingAlgorithmName: db_inline
        tableStrategy:
          standard:
            shardingColumn: order_id
            shardingAlgorithmName: table_inline
    shardingAlgorithms:
      db_inline:
        type: INLINE
        props:
          algorithm-expression: ds${user_id % 2}
      table_inline:
        type: INLINE
        props:
          algorithm-expression: t_order${order_id % 2}
```

### 3.2 自研分片路由（Go 实现）

```go
type ShardingRouter struct {
    config   ShardingConfig
    connections map[int]*sql.DB
}

type ShardingConfig struct {
    DatabaseCount int
    TableCount    int
    ShardingKey  string
}

func NewShardingRouter(config ShardingConfig) *ShardingRouter {
    router := &ShardingRouter{
        config:      config,
        connections: make(map[int]*sql.DB),
    }

    // 初始化数据库连接
    for i := 0; i < config.DatabaseCount; i++ {
        dsn := fmt.Sprintf("user:password@tcp(localhost:3306)/db_%d", i)
        conn, _ := sql.Open("mysql", dsn)
        router.connections[i] = conn
    }

    return router
}

func (r *ShardingRouter) Route(shardingKeyValue string) (db *sql.DB, table string) {
    // 计算数据库索引
    hash := fnvHash(shardingKeyValue)
    dbIndex := hash % r.config.DatabaseCount
    tableIndex := (hash / r.config.DatabaseCount) % r.config.TableCount

    table := fmt.Sprintf("table_%d", tableIndex)

    return r.connections[dbIndex], table
}

// 使用示例
type OrderRepository struct {
    router *ShardingRouter
}

func (r *OrderRepository) Save(order *Order) error {
    // 路由到目标数据库和表
    db, table := r.router.Route(order.UserID)

    // 执行 SQL
    _, err := db.Exec(
        fmt.Sprintf("INSERT INTO %s (id, user_id, amount) VALUES (?, ?, ?)", table),
        order.ID, order.UserID, order.Amount,
    )

    return err
}
```

## 四、数据迁移方案

### 4.1 双写方案

```go
type DataMigrator struct {
    oldDB *sql.DB
    newDB *sql.DB
}

// 写入时双写
func (m *DataMigrator) Insert(order *Order) error {
    // 1. 写入旧库
    if err := m.oldDB.Insert(order); err != nil {
        return err
    }

    // 2. 异步写入新库
    go func() {
        if err := m.newDB.Insert(order); err != nil {
            // 失败记录，后续补偿
            m.recordFailure(order.ID, err)
        }
    }()

    return nil
}

// 批量迁移历史数据
func (m *DataMigrator) MigrateBatch(offset, limit int) error {
    // 1. 从旧库读取
    rows, err := m.oldDB.Query(`
        SELECT * FROM orders LIMIT ? OFFSET ?
    `, limit, offset)
    if err != nil {
        return err
    }
    defer rows.Close()

    // 2. 批量写入新库
    tx := m.newDB.Begin()
    for rows.Next() {
        var order Order
        rows.Scan(&order.ID, &order.UserID, &order.Amount)

        db, table := m.router.Route(order.UserID)
        db.Exec(fmt.Sprintf("INSERT INTO %s VALUES (?, ?, ?)", table),
            order.ID, order.UserID, order.Amount)
    }
    tx.Commit()

    return nil
}
```

### 4.2 停机迁移（适用于维护窗口）

```
步骤1：停止应用写入
步骤2：全量同步数据
步骤3：校验数据一致性
步骤4：切换到新库
步骤5：启动应用
```

### 4.3 在线迁移（不停机）

```
阶段1：双写（新库异步）
阶段2：历史数据迁移
阶段3：校验与补偿
阶段4：读流量切换
阶段5：停写旧库
```

## 五、分库分表后的挑战

### 5.1 分布式事务

```go
// Saga 模式处理跨库事务
type CrossDBTransaction struct {
    steps []TransactionStep
}

type TransactionStep struct {
    DB    *sql.DB
    SQL   string
    Args  []interface{}
    CompensateSQL string
}

func (t *CrossDBTransaction) Execute() error {
    executedSteps := []int{}

    // 执行所有步骤
    for i, step := range t.steps {
        if _, err := step.DB.Exec(step.SQL, step.Args...); err != nil {
            // 失败，执行补偿
            for j := i - 1; j >= 0; j-- {
                t.steps[j].DB.Exec(t.steps[j].CompensateSQL)
            }
            return err
        }
        executedSteps = append(executedSteps, i)
    }

    return nil
}
```

### 5.2 跨库 JOIN

**方案1：应用层 JOIN**

```go
func (r *OrderRepository) GetOrderWithUser(orderID string) (*OrderWithUser, error) {
    // 1. 查询订单
    db, table := r.router.Route(orderID)
    order := &Order{}
    db.QueryRow(fmt.Sprintf("SELECT * FROM %s WHERE id = ?", table), orderID).Scan(order)

    // 2. 根据订单的 user_id 查询用户
    userDB, userTable := r.userRouter.Route(order.UserID)
    user := &User{}
    userDB.QueryRow(fmt.Sprintf("SELECT * FROM %s WHERE id = ?", userTable), order.UserID).Scan(user)

    return &OrderWithUser{Order: order, User: user}, nil
}
```

**方案2：数据冗余（反范式化）**

```sql
-- 订单表冗余用户基本信息
CREATE TABLE t_order_0 (
    id BIGINT,
    user_id BIGINT,
    user_name VARCHAR(50),  -- 冗余字段
    amount DECIMAL(10, 2),
    PRIMARY KEY (id),
    INDEX idx_user_id (user_id)
);
```

### 5.3 全局唯一 ID

```go
type SnowflakeIDGenerator struct {
    mutex        sync.Mutex
    machineID    int64
    sequence     int64
    lastTime     int64
}

func (g *SnowflakeIDGenerator) NextID() int64 {
    g.mutex.Lock()
    defer g.mutex.Unlock()

    now := time.Now().UnixNano() / 1e6  // 毫秒

    if now == g.lastTime {
        g.sequence = (g.sequence + 1) & 0xFFF
        if g.sequence == 0 {
            // 序列号溢出，等待下一毫秒
            for now <= g.lastTime {
                now = time.Now().UnixNano() / 1e6
            }
        }
    } else {
        g.sequence = 0
    }

    g.lastTime = now

    // ID 组成：时间戳(41位) + 机器ID(10位) + 序列号(12位)
    id := (now << 22) | (g.machineID << 12) | g.sequence

    return id
}
```

## 六、扩容方案

### 6.1 翻倍扩容

**原理**：数据量翻倍触发扩容，扩容后数据只需迁移一半

```
2 库 → 4 库：
┌─────┬─────┐          ┌─────┬─────┬─────┬─────┐
│ db0 │ db1 │   →     │ db0 │ db1 │ db2 │ db3 │
└─────┴─────┘          └─────┴─────┴─────┴─────┘
```

**迁移脚本**：

```python
# 迁移 db0 的一半数据到 db2
# 迁移 db1 的一半数据到 db3

def migrate_half_data():
    for table in tables:
        # db0 的数据按 hash % 4 == 0 或 2 的迁移到 db2
        for record in db0.query(f"SELECT * FROM {table}"):
            if hash(record.id) % 4 in [0, 2]:
                db2.insert(record)

        # db1 的数据按 hash % 4 == 1 或 3 的迁移到 db3
        for record in db1.query(f"SELECT * FROM {table}"):
            if hash(record.id) % 4 in [1, 3]:
                db3.insert(record)
```

## 七、最佳实践

1. **选择合适的分片键**：查询频繁、分布均匀
2. **避免跨库事务**：通过 Saga 或最终一致性
3. **冗余热点数据**：避免跨库 JOIN
4. **渐进式迁移**：双写 + 历史迁移 + 校验
5. **做好监控**：每个分片的 QPS、延迟、慢查询

---

> 分库分表是"不得不"的选择，而非"首选"方案。在达到瓶颈前，优先考虑读写分离、缓存优化。
