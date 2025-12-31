---
title: "分布式事务处理：从理论到实践的完整指南"
summary: "深入解析分布式事务的挑战、解决方案和最佳实践，包括2PC、3PC、Saga、TCC等模式，帮助你在微服务架构中实现数据一致性。"
date: 2025-12-25T15:00:00+08:00
draft: false
tags: ["分布式事务", "后端开发", "微服务", "数据一致性", "Saga"]
categories: ["后端开发"]
author: "有条工具团队"
---

在单体应用中，数据库事务（ACID）保证了一致性。但在微服务架构中，数据分散在多个独立的服务中，传统的ACID事务不再适用。如何保证跨服务的数据一致性，是分布式系统设计的核心挑战。

## 分布式事务的挑战

### CAP定理与BASE理论

```
CAP定理：
┌─────────────────────────────────────┐
│  一致性 (Consistency)               │
│  - 所有节点同时看到相同数据          │
│  - 强一致性牺牲可用性                │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  可用性 (Availability)              │
│  - 每个请求都能得到响应              │
│  - 高可用可能牺牲一致性              │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  分区容错性 (Partition Tolerance)   │
│  - 网络分区时系统仍能运行            │
└─────────────────────────────────────┘

现实：只能同时满足两个特性
```

**BASE理论**：基本可用（Basically Available）、软状态（Soft State）、最终一致（Eventual Consistency）

### 分布式事务的问题

```typescript
// 单体应用中的本地事务
class OrderService {
  async createOrder(order: Order): Promise<void> {
    await this.db.transaction(async (tx) => {
      // 1. 创建订单
      await tx.insert('orders', order);

      // 2. 扣减库存
      await tx.update(
        'inventory',
        { quantity: raw('quantity - ?', order.items.length) },
        { product_id: order.productId }
      );

      // 3. 创建支付记录
      await tx.insert('payments', {
        order_id: order.id,
        amount: order.total
      });

      // 要么全部成功，要么全部回滚
    });
  }
}

// 微服务架构中的分布式事务问题
class OrderService {
  async createOrder(order: Order): Promise<void> {
    // 1. 本地创建订单 ✓
    await this.db.insert('orders', order);

    // 2. 调用库存服务 - 可能失败 ✗
    await this.inventoryService.reserve(order);

    // 3. 调用支付服务 - 可能超时 ✗
    await this.paymentService.charge(order);

    // 如何保证一致性？
  }
}
```

## 解决方案

### 1. 两阶段提交（2PC）

```typescript
// 协调者
class TwoPhaseCoordinator {
  private participants: Participant[] = [];

  async executeTransaction(
    operations: Operation[]
  ): Promise<void> {
    // 阶段1：准备阶段（投票）
    const prepareResults = await Promise.allSettled(
      this.participants.map(p =>
        p.prepare(operations)
      )
    );

    // 检查是否所有参与者都同意
    const allPrepared = prepareResults.every(
      r => r.status === 'fulfilled'
    );

    if (allPrepared) {
      // 阶段2：提交阶段
      await Promise.all(
        this.participants.map(p => p.commit())
      );
    } else {
      // 任一参与者拒绝，全部回滚
      await Promise.all(
        this.participants.map(p => p.rollback())
      );
      throw new TransactionError('Transaction aborted');
    }
  }
}

// 参与者
class Participant {
  private preparedData: any[] = [];
  private lock = new Lock();

  async prepare(operations: Operation[]): Promise<boolean> {
    // 获取锁
    await this.lock.acquire();

    try {
      // 执行操作但不提交
      for (const op of operations) {
        const result = await this.execute(op);
        this.preparedData.push(result);
      }

      // 投票同意
      return true;
    } catch (error) {
      // 投票拒绝
      await this.rollback();
      return false;
    }
  }

  async commit(): Promise<void> {
    // 提交所有准备的数据
    for (const data of this.preparedData) {
      await this.db.commit(data);
    }
    this.lock.release();
  }

  async rollback(): Promise<void> {
    // 回滚所有准备的数据
    for (const data of this.preparedData) {
      await this.db.rollback(data);
    }
    this.preparedData = [];
    this.lock.release();
  }
}
```

**2PC的问题**：
- 同步阻塞，性能差
- 单点故障（协调者）
- 可能产生数据不一致（部分提交成功后协调者故障）

### 2. Saga模式（推荐）

Saga将长事务拆分为多个本地事务，每个本地事务都有对应的补偿操作。

```typescript
// Saga执行器
class SagaOrchestrator {
  private sagaLog: SagaLog;

  async execute(
    sagaDef: SagaDefinition,
    initialState: any
  ): Promise<any> {
    let state = initialState;
    const executedSteps: SagaStep[] = [];

    try {
      // 正向执行所有步骤
      for (const step of sagaDef.steps) {
        const result = await this.executeStep(step, state);
        state = { ...state, ...result };

        // 记录已执行的步骤
        await this.sagaLog.saveStep({
          sagaId: sagaDef.id,
          stepName: step.name,
          status: 'completed',
          result
        });

        executedSteps.push(step);
      }

      return state;
    } catch (error) {
      // 发生错误，执行补偿
      await this.compensate(executedSteps.reverse());
      throw error;
    }
  }

  private async compensate(steps: SagaStep[]): Promise<void> {
    for (const step of steps) {
      try {
        if (step.compensate) {
          await step.compensate();
          await this.sagaLog.updateStep(
            step.name,
            'compensated'
          );
        }
      } catch (error) {
        console.error(
          `Compensation failed for ${step.name}:`,
          error
        );
        // 继续执行其他补偿
      }
    }
  }
}

// 订单处理Saga示例
class OrderSaga {
  private orchestrator = new SagaOrchestrator();

  async processOrder(orderDto: OrderDTO): Promise<Order> {
    const sagaDefinition: SagaDefinition = {
      id: uuidv4(),
      name: 'order-processing',
      steps: [
        {
          name: 'create-order',
          action: async () => {
            return await this.orderService.create(orderDto);
          },
          compensate: async (order) => {
            await this.orderService.cancel(order.id);
          }
        },
        {
          name: 'reserve-inventory',
          action: async (state) => {
            return await this.inventoryService.reserve({
              orderId: state.order.id,
              items: orderDto.items
            });
          },
          compensate: async (state) => {
            await this.inventoryService.release(
              state.order.id
            );
          }
        },
        {
          name: 'process-payment',
          action: async (state) => {
            return await this.paymentService.charge({
              orderId: state.order.id,
              amount: state.order.total,
              method: orderDto.paymentMethod
            });
          },
          compensate: async (state) => {
            await this.paymentService.refund(
              state.payment.id
            );
          }
        },
        {
          name: 'confirm-order',
          action: async (state) => {
            return await this.orderService.confirm(
              state.order.id
            );
          }
          // 最后一步无需补偿
        }
      ]
    };

    return await this.orchestrator.execute(
      sagaDefinition,
      {}
    );
  }
}
```

### 3. TCC模式

TCC（Try-Confirm-Cancel）要求每个接口实现三个方法。

```typescript
// TCC事务接口
interface TCCTransaction<T> {
  try: (data: T) => Promise<void>;
  confirm: (data: T) => Promise<void>;
  cancel: (data: T) => Promise<void>;
}

// 库存服务TCC实现
class InventoryServiceTCC {
  private reserved = new Map<string, number>();

  // Try阶段：预留资源
  async try(request: ReserveRequest): Promise<void> {
    const { orderId, items } = request;

    // 检查库存是否充足
    for (const item of items) {
      const available = await this.getAvailableStock(
        item.productId
      );

      if (available < item.quantity) {
        throw new Error('Insufficient stock');
      }
    }

    // 预留库存（冻结）
    for (const item of items) {
      await this.freezeStock(
        item.productId,
        item.quantity
      );
    }

    // 记录预留
    this.reserved.set(
      orderId,
      items.reduce((sum, i) => sum + i.quantity, 0)
    );
  }

  // Confirm阶段：确认扣减
  async confirm(request: ReserveRequest): Promise<void> {
    const { orderId, items } = request;

    // 实际扣减库存
    for (const item of items) {
      await this.deductStock(
        item.productId,
        item.quantity
      );
    }

    // 清除预留记录
    this.reserved.delete(orderId);
  }

  // Cancel阶段：取消预留
  async cancel(request: ReserveRequest): Promise<void> {
    const { orderId, items } = request;

    // 释放冻结的库存
    for (const item of items) {
      await this.unfreezeStock(
        item.productId,
        item.quantity
      );
    }

    // 清除预留记录
    this.reserved.delete(orderId);
  }
}

// TCC协调器
class TCCCoordinator {
  async execute<T>(
    transactions: Array<{
      service: TCCTransaction<T>;
      data: T;
    }>
  ): Promise<void> {
    const executed: Array<{ service: TCCTransaction<T>; data: T }> = [];

    try {
      // Try阶段
      for (const { service, data } of transactions) {
        await service.try(data);
        executed.push({ service, data });
      }

      // Confirm阶段
      for (const { service, data } of executed) {
        await service.confirm(data);
      }
    } catch (error) {
      // Cancel阶段
      for (const { service, data } of executed.reverse()) {
        try {
          await service.cancel(data);
        } catch (cancelError) {
          console.error('Cancel failed:', cancelError);
        }
      }
      throw error;
    }
  }
}
```

### 4. 本地消息表

```typescript
// 本地消息表实现
class OutboxPattern {
  private db: Database;

  async executeInTransaction(
    operation: () => Promise<any>,
    events: Event[]
  ): Promise<void> {
    await this.db.transaction(async (tx) => {
      // 1. 执行业务操作
      const result = await operation();

      // 2. 将事件写入本地消息表
      for (const event of events) {
        await tx.insert('outbox', {
          id: uuidv4(),
          aggregate_type: event.aggregateType,
          aggregate_id: event.aggregateId,
          event_type: event.type,
          payload: JSON.stringify(event.data),
          status: 'pending',
          created_at: new Date()
        });
      }

      // 3. 提交事务（业务和消息表原子性）
    });

    // 4. 后台任务发送消息
    await this.publishPendingEvents();
  }

  // 后台发布任务
  async publishPendingEvents(): Promise<void> {
    const events = await this.db.query(
      `SELECT * FROM outbox
       WHERE status = 'pending'
       ORDER BY created_at ASC
       LIMIT 100`
    );

    for (const event of events) {
      try {
        // 发布到消息队列
        await this.messageBus.publish(
          event.event_type,
          JSON.parse(event.payload)
        );

        // 标记为已发送
        await this.db.update(
          'outbox',
          { status: 'sent', sent_at: new Date() },
          { id: event.id }
        );
      } catch (error) {
        console.error(
          `Failed to publish event ${event.id}:`,
          error
        );
        // 下次重试
      }
    }

    // 清理已发送的旧消息
    await this.cleanupSentEvents();
  }

  private async cleanupSentEvents(): Promise<void> {
    await this.db.query(
      `DELETE FROM outbox
       WHERE status = 'sent'
       AND sent_at < NOW() - INTERVAL '7 days'`
    );
  }
}
```

## 实战建议

### 选择合适的方案

| 场景 | 推荐方案 | 理由 |
|------|----------|------|
| 强一致性要求 | 2PC/3PC | 金融交易等必须保证一致性 |
| 高并发、最终一致 | Saga | 性能好，补偿机制完善 |
| 需要精确控制 | TCC | 业务逻辑清晰，资源预留明确 |
| 简单场景 | 本地消息表 | 实现简单，可靠 |

### Saga模式最佳实践

```typescript
// 可靠的Saga执行器
class ReliableSagaExecutor {
  async execute(
    saga: SagaDefinition
  ): Promise<SagaResult> {
    // 1. 持久化Saga状态
    const sagaInstance = await this.sagaStore.create({
      id: uuidv4(),
      definition: saga.name,
      status: 'started',
      currentStep: 0,
      state: {}
    });

    try {
      // 2. 执行步骤
      for (let i = 0; i < saga.steps.length; i++) {
        const step = saga.steps[i];

        // 更新状态
        await this.sagaStore.update(sagaInstance.id, {
          currentStep: i,
          status: 'executing'
        });

        // 执行步骤
        const result = await this.executeStep(step, sagaInstance.state);

        // 保存结果
        sagaInstance.state = {
          ...sagaInstance.state,
          ...result
        };

        await this.sagaStore.update(sagaInstance.id, {
          state: sagaInstance.state
        });
      }

      // 完成Saga
      await this.sagaStore.update(sagaInstance.id, {
        status: 'completed'
      });

      return { success: true, state: sagaInstance.state };
    } catch (error) {
      // 失败时执行补偿
      await this.compensate(sagaInstance);
      throw error;
    }
  }

  // 定时任务检查超时Saga
  async checkTimeouts(): Promise<void> {
    const timeoutSagas = await this.sagaStore.findTimeoutSagas();

    for (const saga of timeoutSagas) {
      // 标记为超时
      await this.sagaStore.update(saga.id, {
        status: 'timeout'
      });

      // 执行补偿
      await this.compensate(saga);
    }
  }
}
```

### 幂等性设计

```typescript
// 幂等性处理器
class IdempotentHandler {
  private processedCache: Redis;

  async handle(
    command: Command,
    handler: () => Promise<any>
  ): Promise<any> {
    const idempotencyKey = command.idempotencyKey;

    if (!idempotencyKey) {
      return await handler();
    }

    // 检查是否已处理
    const cached = await this.processedCache.get(
      idempotencyKey
    );

    if (cached) {
      console.log('Returning cached result');
      return JSON.parse(cached);
    }

    // 执行处理
    const result = await handler();

    // 缓存结果
    await this.processedCache.set(
      idempotencyKey,
      JSON.stringify(result),
      { EX: 3600 } // 1小时过期
    );

    return result;
  }
}
```

## 总结

分布式事务没有银弹，需要根据业务场景选择：

1. **2PC/3PC**：强一致性场景，性能较差
2. **Saga**：最常用，补偿机制灵活
3. **TCC**：需要精确资源控制的场景
4. **本地消息表**：简单可靠，适合事件驱动架构

关键原则：
- 优先设计成不需要分布式事务
- 接受最终一致性
- 实现完善的补偿机制
- 保证幂等性
- 建立完整的监控和日志
