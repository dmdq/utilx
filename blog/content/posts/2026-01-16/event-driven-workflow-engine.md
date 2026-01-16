---
title: "事件驱动工作流引擎：构建灵活的游戏后台系统"
slug: "event-driven-workflow-engine"
date: 2026-01-16T16:00:00+08:00
draft: false
tags: ['事件驱动', '工作流引擎', 'EDA', '消息队列', '架构设计']
categories: ['系统架构']
author: '有条工具团队'
summary: '深入探讨事件驱动工作流引擎的设计与实现，包括事件总线、工作流编排、状态管理等'
---

## 前言

事件驱动架构(EDA)是现代分布式系统的主流架构模式。通过事件驱动的工作流引擎，我们可以构建灵活、可扩展的游戏后台系统。本文将深入探讨事件驱动工作流引擎的设计与实现。

## 事件总线系统

### 1. 消息总线架构

```typescript
// services/eventbus/EventBus.ts
interface EventBus {
    publish(event: DomainEvent): Promise<void>;
    subscribe(eventType: string, handler: EventHandler): Unsubscribe;
    publishBatch(events: DomainEvent[]): Promise<void>;
}

interface DomainEvent {
    id: string;
    type: string;
    version: number;
    timestamp: number;
    source: string;
    data: any;
    metadata?: EventMetadata;
}

interface EventMetadata {
    correlationId?: string;
    causationId?: string;
    userId?: string;
    tenantId?: string;
}

interface EventHandler {
    handle(event: DomainEvent): Promise<void> | void;
}

class KafkaEventBus implements EventBus {
    private producer: Producer;
    private consumers = new Map<string, Consumer>();
    private subscriptions = new Map<string, Set<EventHandler>>();

    async publish(event: DomainEvent): Promise<void> {
        // 序列化事件
        const message = this.serializeEvent(event);

        // 发送到 Kafka
        await this.producer.send({
            topic: this.getTopic(event.type),
            messages: [{
                key: event.id,
                value: message,
                headers: {
                    'event-type': event.type,
                    'event-version': event.version.toString(),
                    'correlation-id': event.metadata?.correlationId || event.id,
                    'causation-id': event.metadata?.causation || event.id,
                    'user-id': event.metadata?.userId || '',
                    'tenant-id': event.metadata?.tenantId || ''
                }
            }]
        });

        // 本地通知（用于同进程订阅）
        this.notifyLocal(event);
    }

    async publishBatch(events: DomainEvent[]): Promise<void> {
        // 按事件类型分组
        const grouped = new Map<string, DomainEvent[]>();

        for (const event of events) {
            const topic = this.getTopic(event.type);

            if (!grouped.has(topic)) {
                grouped.set(topic, []);
            }

            grouped.get(topic)!.push(event);
        }

        // 批量发送
        for (const [topic, events] of grouped) {
            const messages = events.map(event => ({
                key: event.id,
                value: this.serializeEvent(event),
                headers: {
                    'event-type': event.type,
                    'event-version': event.version.toString()
                }
            }));

            await this.producer.send({
                topic,
                messages
            });
        }

        // 本地通知
        for (const event of events) {
            this.notifyLocal(event);
        }
    }

    subscribe(eventType: string, handler: EventHandler): Unsubscribe {
        if (!this.subscriptions.has(eventType)) {
            this.subscriptions.set(eventType, new Set());

            // 为未订阅的类型创建消费者
            this.createConsumer(eventType);
        }

        this.subscriptions.get(eventType)!.add(handler);

        // 返回取消订阅函数
        return () => {
            const handlers = this.subscriptions.get(eventType);
            if (handlers) {
                handlers.delete(handler);

                if (handlers.size === 0) {
                    this.subscriptions.delete(eventType);
                    this.stopConsumer(eventType);
                }
            }
        };
    }

    private async createConsumer(eventType: string): Promise<void> {
        const topic = this.getTopic(eventType);

        const consumer = await this.consumerGroup.connect({
            groupId: 'workflow-engine',
            topics: [topic],
            fromBeginning: false
        });

        this.consumers.set(eventType, consumer);

        // 开始消费
        this.runConsumer(eventType, consumer);
    }

    private async runConsumer(eventType: string, consumer: Consumer): Promise<void> {
        await consumer.run({
            eachMessage: async ({ message }) => {
                try {
                    // 解析事件
                    const event = this.deserializeEvent(message.value);

                    // 调用本地处理器
                    const handlers = this.subscriptions.get(eventType);
                    if (handlers) {
                        for (const handler of handlers) {
                            await handler.handle(event);
                        }
                    }

                } catch (error) {
                    console.error(`Error processing message:`, error);
                    // 发送到死信队列
                    await this.sendToDLQ(eventType, message, error);
                }
            }
        });
    }

    private getTopic(eventType: string): string {
        // 将事件类型映射到 Kafka topic
        // 例如: user.created -> user-events
        const parts = eventType.split('.');
        return `${parts[0]}-events`;
    }

    private notifyLocal(event: DomainEvent): void {
        // 通知同进程内的订阅者
        const handlers = this.subscriptions.get(event.type);
        if (handlers) {
            for (const handler of handlers) {
                // 异步执行，避免阻塞
                handler.handle(event).catch(error => {
                    console.error(`Handler error for ${event.type}:`, error);
                });
            }
        }
    }
}
```

### 2. 事件存储

```typescript
// services/eventstore/EventStore.ts
interface EventStore {
    append(stream: string, events: DomainEvent[], expectedVersion?: number): Promise<number>;
    read(stream: string, fromVersion?: number, count?: number): Promise<DomainEvent[]>;
    readAll(stream: string): Promise<DomainEvent[]>;
}

class PostgreSQLEventStore implements EventStore {
    private db: Database;

    async append(stream: string, events: DomainEvent[], expectedVersion?: number): Promise<number> {
        const client = await this.db.connect();

        try {
            await client.query('BEGIN');

            // 检查版本（乐观并发控制）
            if (expectedVersion !== undefined) {
                const result = await client.query(
                    'SELECT version FROM event_streams WHERE stream_id = $1',
                    [stream]
                );

                if (result.rows.length === 0) {
                    throw new Error(`Stream not found: ${stream}`);
                }

                const currentVersion = result.rows[0].version;

                if (currentVersion !== expectedVersion) {
                    throw new ConcurrencyError(
                        `Expected version ${expectedVersion}, but got ${currentVersion}`
                    );
                }
            }

            // 保存事件
            let newVersion = expectedVersion || 0;

            for (const event of events) {
                newVersion++;

                await client.query(
                    `INSERT INTO events (stream_id, version, event_id, event_type, data, metadata, created_at)
                     VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
                    [stream, newVersion, event.id, event.type, JSON.stringify(event.data), JSON.stringify(event.metadata)]
                );
            }

            // 更新流版本
            await client.query(
                `INSERT INTO event_streams (stream_id, version)
                 VALUES ($1, $2)
                 ON CONFLICT (stream_id) DO UPDATE SET version = $2`,
                [stream, newVersion]
            );

            await client.query('COMMIT');

            return newVersion;

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async read(stream: string, fromVersion?: number, count?: number): Promise<DomainEvent[]> {
        const query = `
            SELECT event_id, event_type, version, data, metadata, created_at
            FROM events
            WHERE stream_id = $1
            ${fromVersion ? 'AND version >= $2' : ''}
            ORDER BY version
            ${count ? 'LIMIT $3' : ''}
        `;

        const params = [stream];
        if (fromVersion !== undefined) params.push(fromVersion);
        if (count !== undefined) params.push(count);

        const result = await this.db.query(query, params);

        return result.rows.map(row => ({
            id: row.event_id,
            type: row.event_type,
            version: row.version,
            timestamp: row.created_at.getTime(),
            data: row.data,
            metadata: row.metadata
        }));
    }

    async readAll(stream: string): Promise<DomainEvent[]> {
        return this.read(stream);
    }
}
```

## 工作流引擎

### 1. 工作流定义

```typescript
// services/workflow/WorkflowEngine.ts
interface WorkflowDefinition {
    id: string;
    name: string;
    version: string;
    description: string;
    startEvent: string;
    states: WorkflowState[];
    timeouts?: TimeoutConfig;
}

interface WorkflowState {
    id: string;
    name: string;
    type: 'task' | 'parallel' | 'choice' | 'wait' | 'event' | 'fork' | 'join';
    next?: string | string[];
    end?: boolean;
    inputPath?: string;
    outputPath?: string;
    resource?: string;
    timeout?: number;
    retry?: RetryPolicy;
    catch?: CatchConfig;
}

interface RetryPolicy {
    maxAttempts: number;
    backoff: {
        type: 'fixed' | 'exponential';
        delay: number;
    };
}

interface CatchConfig {
    errors: string[];
    next: string;
}

class WorkflowEngine {
    private eventBus: EventBus;
    private eventStore: EventStore;
    private workflows = new Map<string, WorkflowDefinition>();
    private instances = new Map<string, WorkflowInstance>();

    // 启动工作流实例
    async startWorkflow(workflowId: string, input: any, metadata?: WorkflowMetadata): Promise<string> {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) {
            throw new Error(`Workflow not found: ${workflowId}`);
        }

        // 创建工作流实例
        const instance: WorkflowInstance = {
            id: this.generateId(),
            workflowId,
            version: workflow.version,
            currentState: workflow.startEvent,
            history: [],
            input,
            output: {},
            status: 'running',
            startedAt: Date.now(),
            metadata
        };

        this.instances.set(instance.id, instance);

        // 保存实例
        await this.eventStore.append(`workflow:${instance.id}`, [{
            id: this.generateId(),
            type: 'workflow.started',
            version: 1,
            timestamp: Date.now(),
            source: 'workflow-engine',
            data: { instanceId: instance.id, workflowId, input }
        }]);

        // 执行第一个状态
        await this.executeState(instance, workflow.startEvent);

        return instance.id;
    }

    // 执行工作流状态
    private async executeState(instance: WorkflowInstance, stateId: string): Promise<void> {
        const workflow = this.workflows.get(instance.workflowId)!;
        const state = workflow.states.find(s => s.id === stateId);

        if (!state) {
            throw new Error(`State not found: ${stateId}`);
        }

        try {
            let result: StateResult;

            switch (state.type) {
                case 'task':
                    result = await this.executeTaskState(instance, state);
                    break;

                case 'parallel':
                    result = await this.executeParallelState(instance, state);
                    break;

                case 'choice':
                    result = await this.executeChoiceState(instance, state);
                    break;

                case 'wait':
                    result = await this.executeWaitState(instance, state);
                    break;

                case 'event':
                    result = await this.executeEventState(instance, state);
                    break;

                case 'fork':
                    result = await this.executeForkState(instance, state);
                    break;

                case 'join':
                    result = await this.executeJoinState(instance, state);
                    break;

                default:
                    throw new Error(`Unknown state type: ${state.type}`);
            }

            // 记录历史
            instance.history.push({
                state: stateId,
                result,
                timestamp: Date.now()
            });

            // 更新实例
            instance.currentState = state.next || '';
            instance.output = { ...instance.output, ...result.output };

            // 检查是否结束
            if (state.end || !state.next) {
                instance.status = 'completed';
                instance.completedAt = Date.now();
                await this.completeWorkflow(instance);
            } else {
                // 继续下一个状态
                if (Array.isArray(state.next)) {
                    // 多个下一个状态（并行）
                    for (const nextState of state.next) {
                        await this.executeState(instance, nextState);
                    }
                } else {
                    await this.executeState(instance, state.next);
                }
            }

        } catch (error) {
            // 错误处理
            await this.handleStateError(instance, state, error);
        }
    }

    // 任务状态执行
    private async executeTaskState(instance: WorkflowInstance, state: WorkflowState): Promise<StateResult> {
        const taskInput = state.inputPath
            ? this.extractPath(instance.output, state.inputPath)
            : instance.input;

        // 执行任务（可能带重试）
        const taskOutput = await this.executeWithRetry(state, async () => {
            return await this.executeTask(state.resource!, taskInput);
        });

        return {
            output: state.outputPath
                ? { [state.outputPath]: taskOutput }
                : taskOutput
        };
    }

    // 带重试的执行
    private async executeWithRetry<T>(state: WorkflowState, fn: () => Promise<T>): Promise<T> {
        const retry = state.retry;

        if (!retry) {
            return await fn();
        }

        let lastError: Error;
        const delay = retry.backoff.type === 'fixed'
            ? retry.backoff.delay
            : retry.backoff.delay * Math.pow(2, 0);

        for (let attempt = 0; attempt < retry.maxAttempts; attempt++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;

                if (attempt < retry.maxAttempts - 1) {
                    await this.sleep(delay);
                }
            }
        }

        throw lastError!;
    }

    // 并行状态执行
    private async executeParallelState(instance: WorkflowInstance, state: WorkflowState): Promise<StateResult> {
        const branches = state.next as string[];
        const input = state.inputPath
            ? this.extractPath(instance.output, state.inputPath)
            : instance.input;

        // 并行执行所有分支
        const results = await Promise.all(
            branches.map(async (branchId) => {
                const branchState = this.getState(instance.workflowId, branchId);
                return await this.executeTaskState(instance, branchState);
            })
        );

        // 合并结果
        const output = results.reduce((merged, result) => ({
            ...merged,
            ...result.output
        }), {});

        return { output };
    }

    // 选择状态执行
    private async executeChoiceState(instance: WorkflowInstance, state: WorkflowState): Promise<StateResult> {
        const input = state.inputPath
            ? this.extractPath(instance.output, state.inputPath)
            : instance.input;

        // 评估条件
        const choice = this.evaluateChoice(state, input);

        return {
            output: { chosenPath: choice }
        };
    }

    // 等待状态执行
    private async executeWaitState(instance: WorkflowInstance, state: WorkflowState): Promise<StateResult> {
        const seconds = state.timeout || 0;

        if (seconds > 0) {
            await this.sleep(seconds * 1000);
        }

        return { output: {} };
    }

    // 事件状态执行
    private async executeEventState(instance: WorkflowInstance, state: WorkflowState): Promise<StateResult> {
        // 等待特定事件
        const eventType = state.resource;
        const timeout = state.timeout || 30000;

        const event = await this.waitForEvent(eventType, timeout);

        return {
            output: { event }
        };
    }
}
```

### 2. Saga 编排

```typescript
// services/saga/SagaOrchestrator.ts
interface SagaDefinition {
    id: string;
    name: string;
    steps: SagaStep[];
    compensation?: SagaStep[];
}

interface SagaStep {
    action: string;
    compensateAction?: string;
    timeout?: number;
    retry?: RetryPolicy;
}

class SagaOrchestrator {
    private eventBus: EventBus;
    private sagas = new Map<string, SagaDefinition>();
    private executingInstances = new Map<string, SagaExecution>();

    // 执行 Saga
    async executeSaga(sagaId: string, input: any): Promise<SagaResult> {
        const saga = this.sagas.get(sagaId);
        if (!saga) {
            throw new Error(`Saga not found: ${sagaId}`);
        }

        const execution: SagaExecution = {
            id: this.generateId(),
            sagaId,
            status: 'running',
            completedSteps: [],
            input,
            output: {}
        };

        this.executingInstances.set(execution.id, execution);

        try {
            // 执行所有步骤
            for (let i = 0; i < saga.steps.length; i++) {
                const step = saga.steps[i];

                // 执行步骤
                const result = await this.executeStep(step, input);

                execution.completedSteps.push({
                    stepIndex: i,
                    action: step.action,
                    result
                });

                execution.output[step.action] = result;
            }

            execution.status = 'completed';

            return {
                executionId: execution.id,
                status: 'completed',
                output: execution.output
            };

        } catch (error) {
            // 执行补偿
            await this.compensate(execution);

            execution.status = 'failed';
            execution.error = error.message;

            throw error;
        }
    }

    // 执行补偿
    private async compensate(execution: SagaExecution): Promise<void> {
        const saga = this.sagas.get(execution.sagaId)!;

        // 逆序执行补偿动作
        for (let i = execution.completedSteps.length - 1; i >= 0; i--) {
            const completedStep = execution.completedSteps[i];
            const step = saga.steps[i];

            if (step.compensateAction) {
                try {
                    await this.executeStep({
                        action: step.compensateAction
                    }, execution.input);

                    execution.completedSteps[i].compensated = true;

                } catch (error) {
                    console.error(`Compensation failed for ${step.compensateAction}:`, error);
                }
            }
        }
    }

    // 订单处理 Saga 示例
    createOrderSaga(): SagaDefinition {
        return {
            id: 'order_processing',
            name: '订单处理',
            steps: [
                {
                    action: 'reserve_inventory',
                    compensateAction: 'release_inventory',
                    timeout: 5000
                },
                {
                    action: 'process_payment',
                    compensateAction: 'refund_payment',
                    timeout: 10000,
                    retry: {
                        maxAttempts: 3,
                        backoff: { type: 'exponential', delay: 1000 }
                    }
                },
                {
                    action: 'confirm_order',
                    compensateAction: 'cancel_order',
                    timeout: 5000
                },
                {
                    action: 'ship_order',
                    compensateAction: 'return_order',
                    timeout: 30000
                }
            ]
        };
    }
}
```

## 状态管理

### 1. 工作流持久化

```typescript
// services/workflow/WorkflowPersistence.ts
class WorkflowPersistence {
    private db: Database;
    private cache: Cache;

    // 保存实例
    async saveInstance(instance: WorkflowInstance): Promise<void> {
        // 保存到数据库
        await this.db.workflowInstances.upsert({
            id: instance.id,
            workflowId: instance.workflowId,
            version: instance.version,
            currentState: instance.currentState,
            status: instance.status,
            input: JSON.stringify(instance.input),
            output: JSON.stringify(instance.output),
            history: JSON.stringify(instance.history),
            startedAt: new Date(instance.startedAt),
            completedAt: instance.completedAt ? new Date(instance.completedAt) : null,
            metadata: JSON.stringify(instance.metadata)
        });

        // 缓存活跃实例
        if (instance.status === 'running') {
            await this.cache.set(`workflow:${instance.id}`, instance, {
                ttl: 3600 // 1小时
            });
        } else {
            await this.cache.del(`workflow:${instance.id}`);
        }
    }

    // 加载实例
    async loadInstance(instanceId: string): Promise<WorkflowInstance | null> {
        // 先从缓存加载
        const cached = await this.cache.get<WorkflowInstance>(`workflow:${instanceId}`);
        if (cached) {
            return cached;
        }

        // 从数据库加载
        const result = await this.db.workflowInstances.findOne({ id: instanceId });

        if (!result) {
            return null;
        }

        return {
            id: result.id,
            workflowId: result.workflowId,
            version: result.version,
            currentState: result.currentState,
            status: result.status,
            input: JSON.parse(result.input),
            output: JSON.parse(result.output),
            history: JSON.parse(result.history),
            startedAt: result.startedAt.getTime(),
            completedAt: result.completedAt?.getTime(),
            metadata: JSON.parse(result.metadata || '{}')
        };
    }

    // 查询待恢复实例
    async findInstancesToRecover(): Promise<WorkflowInstance[]> {
        const results = await this.db.workflowInstances.find({
            status: 'running',
            startedAt: {
                $lt: new Date(Date.now() - 300000) // 5分钟前
            }
        });

        const instances: WorkflowInstance[] = [];

        for (const result of results) {
            const instance = await this.loadInstance(result.id);
            if (instance) {
                instances.push(instance);
            }
        }

        return instances;
    }
}
```

### 2. 超时处理

```typescript
// services/timeout/TimeoutManager.ts
class WorkflowTimeoutManager {
    private scheduler: TaskScheduler;
    private timeouts = new Map<string, TimeoutHandle>();

    // 设置超时
    async scheduleTimeout(
        instanceId: string,
        stateId: string,
        timeout: number
    ): Promise<void> {
        const timeoutId = `${instanceId}:${stateId}`;

        // 调度超时任务
        const handle = await this.scheduler.schedule({
            id: timeoutId,
            executeAt: Date.now() + timeout,
            handler: async () => {
                await this.handleTimeout(instanceId, stateId);
            }
        });

        this.timeouts.set(timeoutId, handle);
    }

    // 清除超时
    async clearTimeout(instanceId: string, stateId: string): Promise<void> {
        const timeoutId = `${instanceId}:${stateId}`;
        const handle = this.timeouts.get(timeoutId);

        if (handle) {
            await this.scheduler.cancel(handle.id);
            this.timeouts.delete(timeoutId);
        }
    }

    // 处理超时
    private async handleTimeout(instanceId: string, stateId: string): Promise<void> {
        const persistence = new WorkflowPersistence();
        const instance = await persistence.loadInstance(instanceId);

        if (!instance || instance.status !== 'running') {
            return;
        }

        // 标记超时
        instance.status = 'timed_out';
        instance.timeoutState = stateId;

        // 保存实例状态
        await persistence.saveInstance(instance);

        // 触发超时事件
        await this.eventBus.publish({
            id: this.generateId(),
            type: 'workflow.timed_out',
            version: 1,
            timestamp: Date.now(),
            source: 'workflow-timeout-manager',
            data: {
                instanceId,
                stateId
            }
        });

        // 执行超时处理流程
        const workflow = this.workflows.get(instance.workflowId)!;
        const state = workflow.states.find(s => s.id === stateId);

        if (state?.catch) {
            // 执行 catch 配置
            await this.executeCatchConfig(instance, state.catch);
        }
    }

    // 恢复超时的实例
    async recoverTimedOutInstance(instanceId: string): Promise<void> {
        const persistence = new WorkflowPersistence();
        const instance = await persistence.loadInstance(instanceId);

        if (!instance || instance.status !== 'timed_out') {
            return;
        }

        // 从超时状态恢复
        await this.resumeFromTimeout(instance);
    }

    private async resumeFromTimeout(instance: WorkflowInstance): Promise<void> {
        // 重置状态为运行
        instance.status = 'running';
        delete instance.timeoutState;

        await this.persistence.saveInstance(instance);

        // 继续执行工作流
        await this.engine.executeState(instance, instance.currentState);
    }
}
```

## 监控与可视化

### 1. 工作流监控

```typescript
// services/monitoring/WorkflowMonitor.ts
class WorkflowMonitor {
    private metrics = new Map<string, WorkflowMetrics>();
    private alertRules = new Map<string, AlertRule>();

    // 记录工作流指标
    async recordMetrics(instanceId: string, metrics: WorkflowMetricsData): Promise<void> {
        const key = `workflow:${instanceId}`;

        if (!this.metrics.has(key)) {
            this.metrics.set(key, {
                instanceId,
                executions: 0,
                successes: 0,
                failures: 0,
                timeouts: 0,
                avgDuration: 0,
                maxDuration: 0,
                minDuration: Infinity
            });
        }

        const workflowMetrics = this.metrics.get(key)!;

        workflowMetrics.executions++;
        if (metrics.status === 'completed') workflowMetrics.successes++;
        if (metrics.status === 'failed') workflowMetrics.failures++;
        if (metrics.status === 'timed_out') workflowMetrics.timeouts++;

        // 更新持续时间
        const duration = metrics.completedAt! - metrics.startedAt;
        const count = workflowMetrics.executions;

        workflowMetrics.avgDuration =
            (workflowMetrics.avgDuration * (count - 1) + duration) / count;
        workflowMetrics.maxDuration = Math.max(workflowMetrics.maxDuration, duration);
        workflowMetrics.minDuration = Math.min(workflowMetrics.minDuration, duration);

        // 保存到时序数据库
        await this.timeseries.write({
            metric: 'workflow.duration',
            tags: {
                instanceId,
                workflowId: metrics.workflowId,
                status: metrics.status
            },
            value: duration,
            timestamp: metrics.completedAt
        });

        // 检查告警规则
        await this.checkAlerts(workflowMetrics);
    }

    // 获取工作流统计
    async getWorkflowStats(workflowId: string, timeRange: TimeRange): Promise<WorkflowStats> {
        // 从时序数据库查询
        const query = {
            metric: 'workflow.duration',
            tags: { workflowId },
            timeRange
        };

        const data = await this.timeseries.query(query);

        return {
            workflowId,
            timeRange,
            totalExecutions: data.length,
            successRate: this.calculateSuccessRate(data),
            avgDuration: this.average(data.map(d => d.value)),
            p50Duration: this.percentile(data.map(d => d.value), 0.5),
            p95Duration: this.percentile(data.map(d => d.value), 0.95),
            p99Duration: this.percentile(data.map(d => d.value), 0.99)
        };
    }

    // 工作流可视化数据
    async getVisualizationData(instanceId: string): Promise<VisualizationData> {
        const persistence = new WorkflowPersistence();
        const instance = await persistence.loadInstance(instanceId);

        if (!instance) {
            throw new Error(`Instance not found: ${instanceId}`);
        }

        const workflow = this.workflows.get(instance.workflowId)!;

        // 构建执行图
        const nodes = workflow.states.map(state => ({
            id: state.id,
            label: state.name,
            type: state.type,
            status: this.getStateStatus(instance, state.id)
        }));

        const edges = workflow.states
            .filter(state => state.next)
            .map(state => ({
                from: state.id,
                to: Array.isArray(state.next) ? state.next : [state.next],
                label: ''
            }));

        return {
            instanceId,
            workflowId: instance.workflowId,
            status: instance.status,
            nodes,
            edges,
            history: instance.history,
            metrics: await this.getInstanceMetrics(instanceId)
        };
    }

    private getStateStatus(instance: WorkflowInstance, stateId: string): 'pending' | 'running' | 'completed' | 'failed' {
        const historyEntry = instance.history.find(h => h.state === stateId);

        if (!historyEntry) {
            return instance.currentState === stateId ? 'running' : 'pending';
        }

        if (historyEntry.result?.error) {
            return 'failed';
        }

        return 'completed';
    }
}
```

## 总结

事件驱动工作流引擎的核心要点：

1. **事件总线**：高吞吐量、可靠消息传递
2. **工作流引擎**：状态机编排、补偿机制
3. **事件存储**：事件溯源、重放能力
4. **持久化**：实例状态保存与恢复
5. **超时处理**：自动超时检测与处理
6. **监控可视化**：实时监控、执行可视化

事件驱动工作流引擎是构建复杂后台系统的核心基础设施。

---

**相关工具：**
- [UUID 生成器](https://www.util.cn/tools/uuid-generator/)
- [Base64 编码解码](https://www.util.cn/tools/base64/)
