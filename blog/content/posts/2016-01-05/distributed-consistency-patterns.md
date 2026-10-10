---
title: "分布式系统一致性保障方案设计：从理论到落地的完整指南"
slug: "distributed-consistency-patterns"
date: 2026-01-05
draft: false
description: "深入分析分布式系统中的一致性问题，对比 CAP 理论的实践取舍，介绍 Saga、TCC、2PC/3PC、本地消息表等主流方案的实现细节与适用场景"
tags: ["分布式系统", "一致性", "架构设计", "CAP理论", "分布式事务"]
categories: ["架构设计"]
author: "技术团队"
---

## 引言：一致性难题的本质

在单体应用中，数据库事务（ACID）为我们提供了强大的一致性保证。但在分布式系统中，**网络分区、节点故障、时钟漂移**等不确定性因素，使得强一致性成为奢侈的选择。

如何在不同业务场景下选择合适的一致性方案？本文将从理论出发，结合实际代码，系统地介绍分布式一致性的工程实践。

## 一、理论基石：理解 CAP 与 BASE

### 1.1 CAP 定理的实践解读

```
    一致性 (Consistency)
         ↗  ↖
      /     \
    /         \
  可用性    分区容错性
(Availability) (Partition Tolerance)
```

**核心认知**：在分布式系统中，**P（分区容错）是客观存在的**。我们真正选择的是在发生分区时，是选择 C（一致性）还是 A（可用性）。

**场景分类**：

| 业务场景 | 一性性要求 | 可用性要求 | 典型方案 |
|---------|-----------|-----------|---------|
| 金融转账 | 强一致性 | 可降级 | 2PC/TCC + 冲突等待 |
| 订单支付 | 最终一致性 | 高可用 | Saga + 本地消息表 |
| 社交点赞 | 最终一致性 | 高可用 | 异步复制 + 冲突处理 |
| 库存扣减 | 强一致性 | 可降级 | 分布式锁 + Redis |

### 1.2 BASE 理论的工程实践

BASE（Basically Available, Soft state, Eventually consistent）是对 CAP 中 AP 场景的补充：

```go
// 软状态示例：订单创建后，进入"处理中"状态
type Order struct {
    ID        string
    Status    OrderStatus  // 软状态：pending -> confirmed -> shipped
    CreatedAt time.Time
    UpdatedAt time.Time    // 状态会持续变化
}

type OrderStatus int

const (
    StatusPending   OrderStatus = iota  // 初始状态
    StatusConfirmed                     // 中间状态（软状态）
    StatusShipped                       // 最终状态
)

// 最终一致性：经过一段时间后，所有副本的状态会收敛
func (s *OrderService) ConfirmOrder(id string) error {
    // 1. 更新订单状态（立即返回）
    if err := s.repo.UpdateStatus(id, StatusConfirmed); err != nil {
        return err
    }

    // 2. 异步触发后续流程（最终一致性）
    go func() {
        s.inventoryClient.Deduct(id)      // 可能失败，重试
        s.shippingClient Arrange(id)      // 可能失败，重试
        s.notificationClient.Notify(id)   // 可能失败，重试
    }()

    return nil
}
```

## 二、强一致性方案：2PC 与 3PC

### 2.1 两阶段提交（2PC）详解

**架构**：
```
        ┌─────────┐
        │ 协调者   │
        └────┬────┘
             │
    ┌────────┴────────┐
    │                 │
┌───▼────┐      ┌────▼───┐
│参与者 A │      │参与者 B │
└─────────┘      └─────────┘
```

**实现细节**：

```go
type TwoPhaseCoordinator struct {
    participants []*Participant
    timeout      time.Duration
}

type Participant struct {
    ID        string
    Prepare   func(ctx context.Context) error
    Commit    func(ctx context.Context) error
    Rollback  func(ctx context.Context) error
}

func (c *TwoPhaseCoordinator) Execute(ctx context.Context) error {
    // 阶段1：准备阶段（Prepare Phase）
    preparedParticipants := []int{}

    for i, p := range c.participants {
        // 发送 Prepare 请求
        if err := p.Prepare(ctx); err != nil {
            // 任一参与者失败，回滚所有已准备的事务
            for j := i - 1; j >= 0; j-- {
                c.participants[j].Rollback(ctx)
            }
            return fmt.Errorf("participant %d prepare failed: %w", i, err)
        }
        preparedParticipants = append(preparedParticipants, i)
    }

    // 阶段2：提交阶段（Commit Phase）
    for _, i := range preparedParticipants {
        if err := c.participants[i].Commit(ctx); err != nil {
            // 提交失败，记录日志（需要人工介入）
            log.Printf("participant %d commit failed: %v", i, err)
            return err
        }
    }

    return nil
}
```

**问题与优化**：

1. **阻塞问题**：协调者故障，所有参与者阻塞
2. **单点故障**：协调者成为瓶颈
3. **数据锁定**：准备阶段锁定资源，降低并发

**优化方案：引入超时机制**

```go
func (p *Participant) PrepareWithTimeout(ctx context.Context) error {
    ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
    defer cancel()

    done := make(chan error, 1)
    go func() {
        done <- p.Prepare(ctx)
    }()

    select {
    case err := <-done:
        return err
    case <-ctx.Done():
        return ctx.Err()  // 超时自动回滚
    }
}
```

### 2.2 三阶段提交（3PC）与改进

3PC 在 2PC 基础上增加了 CanCommit 阶段，降低了阻塞时间：

```go
func (c *ThreePhaseCoordinator) Execute(ctx context.Context) error {
    // 阶段0：CanCommit（询问是否可以提交）
    canCommit := true
    for _, p := range c.participants {
        if !p.CanCommit(ctx) {
            canCommit = false
            break
        }
    }

    if !canCommit {
        return ErrCannotCommit
    }

    // 阶段1：PreCommit（预提交）
    // 阶段2：DoCommit（正式提交）
    // ...
}
```

**生产建议**：2PC/3PC 适用于**强一致性要求高、并发量不大**的场景（如金融核心系统）。对于高并发场景，建议使用 Saga 模式。

## 三、最终一致性方案：Saga 模式

### 3.1 Saga 模式的核心思想

将长事务拆分为多个本地短事务，通过补偿机制保证最终一致性：

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  创建订单    │ -> │  扣减库存    │ -> │  处理支付    │
└─────────────┘    └─────────────┘    └─────────────┘
      │                   │                   │
      ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ 取消订单     │ <- │ 恢复库存     │ <- │ 退款        │
└─────────────┘    └─────────────┘    └─────────────┘
```

### 3.2 Saga 的两种实现方式

#### 方式1：编排式（Choreography）- 基于事件

```go
// 订单服务
func (s *OrderService) CreateOrder(ctx context.Context, req *CreateOrderRequest) error {
    order := &Order{
        ID:     generateID(),
        Amount: req.Amount,
        Status: "pending",
    }

    if err := s.repo.Create(order); err != nil {
        return err
    }

    // 发布订单创建事件
    s.eventBus.Publish("order.created", OrderCreatedEvent{
        OrderID: order.ID,
        Amount:  order.Amount,
    })

    return nil
}

// 订阅订单创建事件，扣减库存
func (s *InventoryService) OnOrderCreated(event OrderCreatedEvent) error {
    if err := s.inventory.Deduct(event.OrderID, event.ProductID, event.Quantity); err != nil {
        // 库存不足，发布失败事件
        s.eventBus.Publish("order.failed", OrderFailedEvent{
            OrderID: event.OrderID,
            Reason:  "inventory_insufficient",
        })
        return err
    }

    // 库存扣减成功，发布事件触发支付
    s.eventBus.Publish("inventory.deducted", InventoryDeductedEvent{
        OrderID: event.OrderID,
    })

    return nil
}

// 订阅库存扣减事件，处理支付
func (s *PaymentService) OnInventoryDeducted(event InventoryDeductedEvent) error {
    if err := s.payment.Process(event.OrderID); err != nil {
        // 支付失败，触发补偿
        s.eventBus.Publish("payment.failed", PaymentFailedEvent{
            OrderID: event.OrderID,
        })
        return err
    }

    s.eventBus.Publish("order.completed", OrderCompletedEvent{
        OrderID: event.OrderID,
    })

    return nil
}
```

**事件溯源模式**：记录所有状态变更事件

```go
type EventStore interface {
    Save(aggregateID string, events []Event) error
    GetEvents(aggregateID string) ([]Event, error)
}

type OrderAggregate struct {
    id      string
    version int
    events  []Event
}

func (a *OrderAggregate) Apply(event Event) {
    a.events = append(a.events, event)
    a.version++

    switch e := event.(type) {
    case *OrderCreatedEvent:
        a.status = "pending"
    case *InventoryDeductedEvent:
        a.status = "confirmed"
    case *PaymentCompletedEvent:
        a.status = "completed"
    }
}

// 重建聚合根状态
func (a *OrderAggregate) Rebuild() {
    for _, event := range a.events {
        a.Apply(event)
    }
}
```

#### 方式2：协调式（Orchestration）- 中央协调器

```go
type OrderSaga struct {
    orderRepo       OrderRepository
    inventoryClient InventoryClient
    paymentClient   PaymentClient
    eventStore      EventStore
}

func (s *OrderSaga) Execute(ctx context.Context, req *CreateOrderRequest) error {
    sagaID := generateSagaID()

    // 步骤1：创建订单
    order := &Order{ID: generateID(), Status: "pending"}
    if err := s.orderRepo.Create(order); err != nil {
        return err
    }
    s.eventStore.Save(sagaID, []Event{&OrderCreatedEvent{OrderID: order.ID}})

    // 步骤2：扣减库存
    inventoryResult := make(chan error, 1)
    go func() {
        inventoryResult <- s.inventoryClient.Deduct(order.ID, req.ProductID, req.Quantity)
    }()

    select {
    case err := <-inventoryResult:
        if err != nil {
            return s.compensate(ctx, sagaID, order)
        }
        s.eventStore.Save(sagaID, []Event{&InventoryDeductedEvent{OrderID: order.ID}})
    case <-ctx.Done():
        return ctx.Err()
    }

    // 步骤3：处理支付
    paymentResult := make(chan error, 1)
    go func() {
        paymentResult <- s.paymentClient.Process(order.ID, req.Amount)
    }()

    select {
    case err := <-paymentResult:
        if err != nil {
            return s.compensate(ctx, sagaID, order)
        }
        s.eventStore.Save(sagaID, []Event{&PaymentCompletedEvent{OrderID: order.ID}})
    case <-ctx.Done():
        return s.compensate(ctx, sagaID, order)
    }

    return nil
}

func (s *OrderSaga) compensate(ctx context.Context, sagaID string, order *Order) error {
    // 获取已执行的事件
    events, _ := s.eventStore.GetEvents(sagaID)

    // 逆序执行补偿操作
    for i := len(events) - 1; i >= 0; i-- {
        switch event := events[i].(type) {
        case *InventoryDeductedEvent:
            s.inventoryClient.Restore(event.OrderID)
        case *PaymentCompletedEvent:
            s.paymentClient.Refund(event.OrderID)
        }
    }

    // 取消订单
    s.orderRepo.UpdateStatus(order.ID, "cancelled")

    return nil
}
```

### 3.3 Saga 模式的问题与解决方案

**问题1：缺少隔离性**

并发 Saga 可能导致脏读：

```
时间线：
T1: Saga A 扣减库存（100 -> 80）
T2: Saga B 读取库存（80）
T1: Saga A 失败回滚（库存恢复为 100）
T2: Saga B 基于80进行决策，但实际库存是100
```

**解决方案：悲观锁 + 版本号**

```go
type Inventory struct {
    ProductID string
    Quantity  int
    Version   int  // 乐观锁版本号
}

func (r *InventoryRepository) DeductWithLock(productID string, quantity int) error {
    // 使用 SELECT FOR UPDATE 行锁
    inventory, err := r.db.QueryRow(`
        SELECT product_id, quantity, version
        FROM inventory
        WHERE product_id = ? FOR UPDATE
    `, productID)

    if err != nil {
        return err
    }

    // 检查版本号
    result, err := r.db.Exec(`
        UPDATE inventory
        SET quantity = quantity - ?, version = version + 1
        WHERE product_id = ? AND version = ?
    `, quantity, productID, inventory.Version)

    if affected, _ := result.RowsAffected(); affected == 0 {
        return ErrOptimisticLockFailed  // 版本冲突
    }

    return nil
}
```

**问题2：Saga 日志膨胀**

**解决方案：定期压缩**

```go
func (s *EventStore) Compact(sagaID string) error {
    // 1. 获取所有事件
    events, err := s.GetEvents(sagaID)
    if err != nil {
        return err
    }

    // 2. 检查 Saga 是否完成（有补偿事件或成功事件）
    isCompleted := false
    for _, event := range events {
        if _, ok := event.(*SagaCompletedEvent); ok {
            isCompleted = true
            break
        }
        if _, ok := event.(*SagaCompensatedEvent); ok {
            isCompleted = true
            break
        }
    }

    // 3. 已完成的 Saga，创建快照并删除旧事件
    if isCompleted {
        snapshot := &SagaSnapshot{
            SagaID:    sagaID,
            FinalState: deriveState(events),
            CreatedAt: time.Now(),
        }
        s.db.Create(snapshot)
        s.db.Where("saga_id = ?", sagaID).Delete(&Event{})
    }

    return nil
}
```

## 四、本地消息表方案

### 4.1 架构设计

核心思想：将业务操作和消息发送放在同一本地事务中，保证原子性：

```go
type LocalMessage struct {
    ID        string
    Topic     string
    Payload   []byte
    Status    string  // pending/sent/failed
    CreatedAt time.Time
    SentAt    *time.Time
}

func (s *OrderService) CreateOrderWithMessage(ctx context.Context, req *CreateOrderRequest) error {
    tx := s.db.Begin()
    defer tx.Rollback()

    // 1. 创建订单（本地操作）
    order := &Order{ID: generateID(), Amount: req.Amount}
    if err := tx.Create(order); err != nil {
        return err
    }

    // 2. 保存消息到本地消息表（同一事务）
    message := &LocalMessage{
        ID:      generateID(),
        Topic:   "order.created",
        Payload: json.Marshal(OrderCreatedEvent{OrderID: order.ID}),
        Status:  "pending",
    }
    if err := tx.Create(message); err != nil {
        return err
    }

    // 3. 提交事务
    if err := tx.Commit(); err != nil {
        return err
    }

    return nil
}
```

### 4.2 消息投递器

定时扫描本地消息表，投递消息：

```go
type MessageRelay struct {
    db         *sql.DB
    mq         MessageQueue
    batchSize  int
    maxRetries int
}

func (r *MessageRelay) Start(ctx context.Context) {
    ticker := time.NewTicker(1 * time.Second)
    defer ticker.Stop()

    for {
        select {
        case <-ticker.C:
            r.scanAndSend(ctx)
        case <-ctx.Done():
            return
        }
    }
}

func (r *MessageRelay) scanAndSend(ctx context.Context) {
    // 1. 查询待发送消息
    messages := []LocalMessage{}
    r.db.Where("status = ? AND retry_count < ?",
        "pending", r.maxRetries).
        Limit(r.batchSize).
        Find(&messages)

    // 2. 发送消息
    for _, msg := range messages {
        if err := r.mq.Send(msg.Topic, msg.Payload); err != nil {
            // 发送失败，增加重试计数
            r.db.Model(&msg).
                Updates(map[string]interface{}{
                    "retry_count": gorm.Expr("retry_count + 1"),
                    "error":       err.Error(),
                })
        } else {
            // 发送成功，标记状态
            r.db.Model(&msg).
                Updates(map[string]interface{}{
                    "status":  "sent",
                    "sent_at": time.Now(),
                })
        }
    }
}
```

### 4.3 幂等性保证

消息可能重复投递，消费端需要保证幂等：

```go
type PaymentService struct {
    idempotencyStore IdempotencyStore
}

func (s *PaymentService) ProcessPayment(event OrderCreatedEvent) error {
    // 幂等键
    idempotencyKey := fmt.Sprintf("payment:%s", event.OrderID)

    // 检查是否已处理
    if processed, _ := s.idempotencyStore.Exists(idempotencyKey); processed {
        log.Printf("Order %s already processed, skip", event.OrderID)
        return nil
    }

    // 处理业务逻辑
    if err := s.payment.Process(event.OrderID, event.Amount); err != nil {
        return err
    }

    // 标记已处理
    s.idempotencyStore.Set(idempotencyKey, true, 24*time.Hour)

    return nil
}
```

## 五、TCC（Try-Confirm-Cancel）模式

### 5.1 TCC 与 Saga 的区别

| 特性 | Saga | TCC |
|------|------|-----|
| 事务粒度 | 业务操作 | 资源预留 |
| 补偿方式 | 逆向操作 | 释放预留 |
| 并发控制 | 悲观锁 | 资源锁定 |
| 适用场景 | 长事务 | 高并发短事务 |

### 5.2 TCC 实现

```go
type InventoryTCCService struct {
    db *sql.DB
}

// Try 阶段：预留资源
func (s *InventoryTCCService) Try(orderID string, productID string, quantity int) error {
    tx := s.db.Begin()
    defer tx.Rollback()

    // 1. 创建预留记录
    reservation := &Reservation{
        OrderID:   orderID,
        ProductID: productID,
        Quantity:  quantity,
        Status:    "reserved",
        ExpireAt:  time.Now().Add(5 * time.Minute),  // 5分钟过期
    }

    if err := tx.Create(reservation); err != nil {
        return err
    }

    // 2. 冻结库存（预扣减）
    result, err := tx.Exec(`
        UPDATE inventory
        SET frozen_quantity = frozen_quantity + ?,
            available_quantity = available_quantity - ?
        WHERE product_id = ? AND available_quantity >= ?
    `, quantity, quantity, productID, quantity)

    if affected, _ := result.RowsAffected(); affected == 0 {
        return ErrInsufficientInventory
    }

    return tx.Commit()
}

// Confirm 阶段：确认扣减
func (s *InventoryTCCService) Confirm(orderID string) error {
    tx := s.db.Begin()
    defer tx.Rollback()

    // 1. 获取预留记录
    reservation := &Reservation{}
    if err := tx.Where("order_id = ? AND status = ?", orderID, "reserved").
        First(reservation).Error; err != nil {
        return err
    }

    // 2. 实际扣减库存
    if _, err := tx.Exec(`
        UPDATE inventory
        SET quantity = quantity - ?,
            frozen_quantity = frozen_quantity - ?
        WHERE product_id = ?
    `, reservation.Quantity, reservation.Quantity, reservation.ProductID); err != nil {
        return err
    }

    // 3. 更新预留状态
    tx.Model(reservation).Update("status", "confirmed")

    return tx.Commit()
}

// Cancel 阶段：释放预留
func (s *InventoryTCCService) Cancel(orderID string) error {
    tx := s.db.Begin()
    defer tx.Rollback()

    // 1. 获取预留记录
    reservation := &Reservation{}
    if err := tx.Where("order_id = ? AND status = ?", orderID, "reserved").
        First(reservation).Error; err != nil {
        return err
    }

    // 2. 释放冻结库存
    if _, err := tx.Exec(`
        UPDATE inventory
        SET frozen_quantity = frozen_quantity - ?,
            available_quantity = available_quantity + ?
        WHERE product_id = ?
    `, reservation.Quantity, reservation.Quantity, reservation.ProductID); err != nil {
        return err
    }

    // 3. 更新预留状态
    tx.Model(reservation).Update("status", "cancelled")

    return tx.Commit()
}
```

### 5.3 空回滚与悬挂处理

**空回滚**：Cancel 执行时，Try 还未执行

```go
func (s *InventoryTCCService) Cancel(orderID string) error {
    // 1. 检查是否存在预留记录
    reservation := &Reservation{}
    err := s.db.Where("order_id = ?", orderID).First(reservation).Error

    if errors.Is(err, gorm.ErrRecordNotFound) {
        // 空回滚：插入记录，标记为 cancelled
        reservation := &Reservation{
            OrderID:   orderID,
            Status:    "cancelled",
            IsNullRollback: true,
        }
        s.db.Create(reservation)
        return nil
    }

    // 正常 Cancel 逻辑
    return s.doCancel(orderID)
}
```

**悬挂处理**：Cancel 先于 Try 执行

```go
func (s *InventoryTCCService) Try(orderID string, productID string, quantity int) error {
    // 1. 检查是否已取消
    reservation := &Reservation{}
    err := s.db.Where("order_id = ?", orderID).First(reservation).Error

    if err == nil && reservation.Status == "cancelled" {
        // 悬挂：已取消，不允许 Try
        return ErrTransactionCancelled
    }

    // 正常 Try 逻辑
    return s.doTry(orderID, productID, quantity)
}
```

## 六、方案选型决策树

```
是否需要强一致性？
├─ 是 → 并发量是否 < 1000 TPS？
│       ├─ 是 → 2PC/TCC
│       └─ 否 → 分布式锁 + 乐观锁 + 重试
└─ 否 → 是否允许短暂不一致？
        ├─ 是 → Saga（事件驱动）
        └─ 否 → 本地消息表 + 定时任务
```

## 七、总结

| 方案 | 一致性 | 复杂度 | 性能 | 适用场景 |
|------|-------|--------|------|---------|
| 2PC/3PC | 强 | 高 | 低 | 金融核心系统 |
| TCC | 强 | 高 | 中 | 库存、账户类 |
| Saga | 最终 | 中 | 高 | 订单、工作流 |
| 本地消息表 | 最终 | 低 | 中 | 异步解耦 |

**核心建议**：
1. 优先考虑最终一致性，只有业务明确要求时才选择强一致性
2. Saga + 事件溯源是性价比最高的方案
3. 本地消息表适合作为兜底方案
4. 无论选择哪种方案，都要建立完善的监控和告警

---

> 一致性是分布式系统的核心挑战，没有银弹。理解业务需求，选择合适的方案，比追求"最强一致性"更重要。
