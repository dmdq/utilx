---
title: "实时数据架构：从流处理到智能决策"
slug: "real-time-data-architecture"
date: 2026-01-15T15:00:00+08:00
draft: false
tags: ['实时数据', '流处理', '事件驱动', '数据管道', 'CQRS']
categories: ['数据架构']
author: '有条工具团队'
summary: '深入探讨实时数据架构设计，包括流处理、事件溯源、CQRS模式等核心技术'
---

## 前言

在数据驱动决策的时代，实时数据处理已成为企业的核心能力。从实时监控到智能推荐，从风险控制到自动化运营，实时数据架构正在改变业务处理的方式。本文将深入探讨实时数据架构的设计和实现。

## 流处理架构

### 1. 流处理框架

```python
# Apache Flink 流处理
from pyflink.datastream import StreamExecutionEnvironment
from pyflink.common.typeinfo import Types
from pyflink.datastream.functions import MapFunction, FilterFunction, KeyedProcessFunction
from pyflink.datastream.connectors import FlinkKafkaConsumer, FlinkKafkaProducer
from pyflink.common.serialization import SimpleStringSchema
from pyflink.datastream.state import ValueStateDescriptor

# 创建执行环境
env = StreamExecutionEnvironment.get_execution_environment()
env.set_parallelism(4)

# Kafka 消费者配置
kafka_props = {
    'bootstrap.servers': 'localhost:9092',
    'group.id': 'real-time-processor'
}

# 创建数据源
kafka_consumer = FlinkKafkaConsumer(
    topics='events',
    deserialization_schema=SimpleStringSchema(),
    properties=kafka_props
)

# 从 Kafka 读取事件流
events = env.add_source(kafka_consumer)

# 事件解析
class EventParser(MapFunction):
    def map(self, value):
        import json
        return json.loads(value)

parsed_events = events.map(EventParser(), output_type=Types.PICKLED_BYTE_ARRAY())

# 事件过滤
class EventFilter(FilterFunction):
    def filter(self, event):
        # 只处理有效事件
        return event.get('valid', False)

filtered_events = parsed_events.filter(EventFilter())

# 窗口聚合
class EventAggregator(KeyedProcessFunction):
    def open(self, runtime_context):
        # 初始化状态
        self.count_state = runtime_context.get_state(
            ValueStateDescriptor('count', Types.LONG())
        )
        self.sum_state = runtime_context.get_state(
            ValueStateDescriptor('sum', Types.FLOAT())
        )

    def process_element(self, event, ctx):
        # 获取当前状态
        count = self.count_state.value() or 0
        total = self.sum_state.value() or 0.0

        # 更新状态
        count += 1
        total += event.get('value', 0)

        self.count_state.update(count)
        self.sum_state.update(total)

        # 输出聚合结果
        yield {
            'window_start': ctx.timer_service().current_processing_time(),
            'count': count,
            'average': total / count if count > 0 else 0
        }

# 按事件类型分组并聚合
aggregated = (filtered_events
    .key_by(lambda e: e['type'], key_type=Types.STRING())
    .process(EventAggregator(), output_type=Types.PICKLED_BYTE_ARRAY()))

# 输出到 Kafka
kafka_producer = FlinkKafkaProducer(
    topic='aggregated_events',
    serialization_schema=SimpleStringSchema(),
    producer_config=kafka_props
)

aggregated.map(str).add_sink(kafka_producer)

# 执行作业
env.execute('Real-time Event Processing')
```

### 2. 流式 ETL

```python
# 实时 ETL 管道
from datetime import datetime, timedelta
import json

class StreamingETL:
    def __init__(self, config):
        self.config = config
        self.validators = []
        self.transformers = []
        self.enrichers = []

    def add_validator(self, validator):
        """添加数据验证器"""
        self.validators.append(validator)
        return self

    def add_transformer(self, transformer):
        """添加数据转换器"""
        self.transformers.append(transformer)
        return self

    def add_enricher(self, enricher):
        """添加数据增强器"""
        self.enrichers.append(enricher)
        return self

    async def process_stream(self, stream):
        """处理数据流"""
        async for batch in stream:
            # 验证
            valid_batch = await self.validate(batch)

            # 转换
            transformed_batch = await self.transform(valid_batch)

            # 增强
            enriched_batch = await self.enrich(transformed_batch)

            # 输出
            yield enriched_batch

    async def validate(self, batch):
        """验证数据批次"""
        valid_records = []

        for record in batch:
            is_valid = True
            errors = []

            for validator in self.validators:
                result = await validator.validate(record)
                if not result.is_valid:
                    is_valid = False
                    errors.extend(result.errors)

            if is_valid:
                valid_records.append(record)
            else:
                # 记录无效数据
                await self.handle_invalid_record(record, errors)

        return valid_records

    async def transform(self, batch):
        """转换数据批次"""
        transformed = batch

        for transformer in self.transformers:
            transformed = await transformer.transform(transformed)

        return transformed

    async def enrich(self, batch):
        """增强数据批次"""
        enriched = []

        for record in batch:
            enriched_record = record.copy()

            for enricher in self.enrichers:
                enriched_record = await enricher.enrich(enriched_record)

            enriched.append(enriched_record)

        return enriched

    async def handle_invalid_record(self, record, errors):
        """处理无效记录"""
        error_record = {
            'original_record': record,
            'errors': errors,
            'timestamp': datetime.utcnow().isoformat(),
            'status': 'validation_failed'
        }

        # 发送到错误主题
        await self.send_to_dlq(error_record)

    async def send_to_dlq(self, record):
        """发送到死信队列"""
        # 实现死信队列逻辑
        pass

# 数据验证器
class SchemaValidator:
    def __init__(self, schema):
        self.schema = schema

    async def validate(self, record):
        """验证记录是否符合 schema"""
        errors = []

        for field, rules in self.schema.items():
            if field not in record:
                if rules.get('required', False):
                    errors.append(f"Missing required field: {field}")
            else:
                value = record[field]

                # 类型检查
                if 'type' in rules:
                    if not isinstance(value, rules['type']):
                        errors.append(f"Field {field} has wrong type")

                # 范围检查
                if 'min' in rules and value < rules['min']:
                    errors.append(f"Field {field} below minimum")

                if 'max' in rules and value > rules['max']:
                    errors.append(f"Field {field} above maximum")

        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors
        )

# 数据转换器
class DataTransformer:
    async def transform(self, batch):
        """转换数据批次"""
        transformed = []

        for record in batch:
            transformed_record = {
                'user_id': self.normalize_user_id(record.get('user_id')),
                'timestamp': self.parse_timestamp(record.get('timestamp')),
                'value': self.convert_value(record.get('value')),
                'metadata': self.extract_metadata(record)
            }
            transformed.append(transformed_record)

        return transformed

    def normalize_user_id(self, user_id):
        """标准化用户 ID"""
        if isinstance(user_id, str):
            return user_id.strip().lower()
        return str(user_id)

    def parse_timestamp(self, timestamp):
        """解析时间戳"""
        if isinstance(timestamp, (int, float)):
            return datetime.fromtimestamp(timestamp)
        elif isinstance(timestamp, str):
            return datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
        return datetime.utcnow()

    def convert_value(self, value):
        """转换数值"""
        try:
            return float(value)
        except (TypeError, ValueError):
            return 0.0

    def extract_metadata(self, record):
        """提取元数据"""
        return {
            'source': record.get('source', 'unknown'),
            'version': record.get('version', '1.0'),
            'processed_at': datetime.utcnow().isoformat()
        }

class ValidationResult:
    def __init__(self, is_valid, errors):
        self.is_valid = is_valid
        self.errors = errors
```

## 事件溯源与 CQRS

### 1. 事件存储

```python
# 事件存储实现
from typing import List, Optional
from datetime import datetime
import uuid

class EventStore:
    def __init__(self, db_connection):
        self.db = db_connection

    async def append_events(
        self,
        stream_id: str,
        events: List[Event],
        expected_version: Optional[int] = None
    ) -> int:
        """追加事件到流"""
        # 检查版本一致性（乐观并发控制）
        if expected_version is not None:
            current_version = await self.get_stream_version(stream_id)
            if current_version != expected_version:
                raise ConcurrencyError(
                    f"Expected version {expected_version}, "
                    f"but got {current_version}"
                )

        # 存储事件
        event_records = []
        for event in events:
            event_record = {
                'id': str(uuid.uuid4()),
                'stream_id': stream_id,
                'event_type': event.event_type,
                'data': event.data,
                'metadata': event.metadata,
                'timestamp': datetime.utcnow(),
                'version': expected_version + len(event_records) + 1 if expected_version else None
            }
            event_records.append(event_record)

        # 批量插入
        await self.db.events.insert_many(event_records)

        return event_records[-1]['version']

    async def get_events(
        self,
        stream_id: str,
        from_version: Optional[int] = None,
        to_version: Optional[int] = None
    ) -> List[Event]:
        """从流中读取事件"""
        query = {'stream_id': stream_id}

        if from_version is not None or to_version is not None:
            query['version'] = {}
            if from_version is not None:
                query['version']['$gte'] = from_version
            if to_version is not None:
                query['version']['$lte'] = to_version

        cursor = self.db.events.find(query).sort('version', 1)
        event_records = await cursor.to_list(length=None)

        return [
            Event(
                event_type=record['event_type'],
                data=record['data'],
                metadata=record.get('metadata', {})
            )
            for record in event_records
        ]

    async def get_stream_version(self, stream_id: str) -> int:
        """获取流的当前版本"""
        latest_event = await self.db.events.find_one(
            {'stream_id': stream_id},
            sort=[('version', -1)]
        )
        return latest_event['version'] if latest_event else 0

    async def replay_stream(self, stream_id: str) -> Any:
        """重放事件流以重建聚合状态"""
        events = await self.get_events(stream_id)

        # 创建新的聚合实例
        aggregate = self.create_aggregate(stream_id)

        # 应用所有事件
        for event in events:
            aggregate.apply_event(event)

        return aggregate

# 聚合根
class AggregateRoot:
    def __init__(self, id: str):
        self.id = id
        self._version = 0
        self._uncommitted_events = []

    def get_uncommitted_events(self) -> List[Event]:
        """获取未提交的事件"""
        return self._uncommitted_events

    def mark_events_as_committed(self):
        """标记事件为已提交"""
        self._uncommitted_events.clear()

    def _raise_event(self, event: Event):
        """引发事件"""
        # 应用事件到聚合
        self.apply_event(event)

        # 添加到未提交事件列表
        self._uncommitted_events.append(event)

    def apply_event(self, event: Event):
        """应用事件到聚合状态"""
        # 子类实现具体的事件应用逻辑
        handler_name = f'apply_{event.event_type}'
        handler = getattr(self, handler_name, None)
        if handler:
            handler(event)
        self._version += 1

# 订单聚合示例
class Order(AggregateRoot):
    def __init__(self, id: str, customer_id: str):
        super().__init__(id)
        self.customer_id = customer_id
        self.status = 'pending'
        self.items = []
        self.total_amount = 0

    @classmethod
    def create(cls, order_data: dict) -> 'Order':
        """创建新订单"""
        order = cls(
            id=str(uuid.uuid4()),
            customer_id=order_data['customer_id']
        )
        order._raise_event(Event(
            event_type='OrderCreated',
            data=order_data
        ))
        return order

    def add_item(self, item_data: dict):
        """添加订单项"""
        if self.status != 'pending':
            raise ValueError('Cannot add items to non-pending order')

        self._raise_event(Event(
            event_type='OrderItemAdded',
            data=item_data
        ))

    def confirm(self):
        """确认订单"""
        if self.status != 'pending':
            raise ValueError('Order is not pending')

        self._raise_event(Event(
            event_type='OrderConfirmed',
            data={'order_id': self.id}
        ))

    def apply_OrderCreated(self, event: Event):
        """应用订单创建事件"""
        self.customer_id = event.data['customer_id']
        self.status = 'pending'

    def apply_OrderItemAdded(self, event: Event):
        """应用添加项事件"""
        self.items.append({
            'product_id': event.data['product_id'],
            'quantity': event.data['quantity'],
            'price': event.data['price']
        })
        self.total_amount += event.data['quantity'] * event.data['price']

    def apply_OrderConfirmed(self, event: Event):
        """应用确认事件"""
        self.status = 'confirmed'
```

### 2. CQRS 实现

```python
# CQRS 命令端
from typing import Protocol

class CommandHandler(Protocol):
    async def handle(self, command: Command) -> CommandResult:
        """处理命令"""
        ...

class CommandBus:
    def __init__(self):
        self.handlers = {}

    def register(self, command_type: type, handler: CommandHandler):
        """注册命令处理器"""
        self.handlers[command_type] = handler

    async def dispatch(self, command: Command) -> CommandResult:
        """分发命令"""
        handler = self.handlers.get(type(command))
        if not handler:
            raise ValueError(f"No handler for command: {type(command)}")

        return await handler.handle(command)

# 命令定义
class CreateOrderCommand(Command):
    def __init__(self, customer_id: str, items: List[dict]):
        self.customer_id = customer_id
        self.items = items

class ConfirmOrderCommand(Command):
    def __init__(self, order_id: str):
        self.order_id = order_id

# 命令处理器
class CreateOrderHandler:
    def __init__(self, event_store: EventStore, command_bus: CommandBus):
        self.event_store = event_store
        self.command_bus = command_bus

    async def handle(self, command: CreateOrderCommand) -> CommandResult:
        # 创建订单聚合
        order = Order.create({
            'customer_id': command.customer_id
        })

        # 添加订单项
        for item in command.items:
            order.add_item(item)

        # 保存事件
        await self.event_store.append_events(
            order.id,
            order.get_uncommitted_events()
        )

        order.mark_events_as_committed()

        return CommandResult(
            success=True,
            aggregate_id=order.id,
            version=order._version
        )

# CQRS 查询端
class QueryBus:
    def __init__(self):
        self.handlers = {}

    def register(self, query_type: type, handler: QueryHandler):
        """注册查询处理器"""
        self.handlers[query_type] = handler

    async def execute(self, query: Query) -> QueryResult:
        """执行查询"""
        handler = self.handlers.get(type(query))
        if not handler:
            raise ValueError(f"No handler for query: {type(query)}")

        return await handler.execute(query)

# 查询处理器
class GetOrderQueryHandler:
    def __init__(self, read_db):
        self.read_db = read_db

    async def execute(self, query: GetOrderQuery) -> OrderDto:
        """从读模型获取订单"""
        order_doc = await self.read_db.orders.find_one({
            'order_id': query.order_id
        })

        if not order_doc:
            raise ValueError(f"Order not found: {query.order_id}")

        return OrderDto(
            order_id=order_doc['order_id'],
            customer_id=order_doc['customer_id'],
            status=order_doc['status'],
            items=order_doc['items'],
            total_amount=order_doc['total_amount']
        )

# 投影器（更新读模型）
class OrderProjector:
    def __init__(self, event_store: EventStore, read_db):
        self.event_store = event_store
        self.read_db = read_db
        self.last_processed_position = 0

    async def project(self):
        """投影事件到读模型"""
        events = await self.event_store.get_events_after(
            self.last_processed_position
        )

        for event in events:
            await self.handle_event(event)
            self.last_processed_position = event.position

    async def handle_event(self, event: Event):
        """处理单个事件"""
        handler_name = f'project_{event.event_type}'
        handler = getattr(self, handler_name, None)

        if handler:
            await handler(event)

    async def project_OrderCreated(self, event: Event):
        """投影订单创建事件"""
        await self.read_db.orders.insert_one({
            'order_id': event.stream_id,
            'customer_id': event.data['customer_id'],
            'status': 'pending',
            'items': [],
            'total_amount': 0,
            'created_at': event.timestamp
        })

    async def project_OrderItemAdded(self, event: Event):
        """投影添加项事件"""
        await self.read_db.orders.update_one(
            {'order_id': event.stream_id},
            {
                '$push': {
                    'items': {
                        'product_id': event.data['product_id'],
                        'quantity': event.data['quantity'],
                        'price': event.data['price']
                    }
                },
                '$inc': {
                    'total_amount': event.data['quantity'] * event.data['price']
                }
            }
        )

    async def project_OrderConfirmed(self, event: Event):
        """投影确认事件"""
        await self.read_db.orders.update_one(
            {'order_id': event.stream_id},
            {'$set': {'status': 'confirmed'}}
        )
```

## 实时数据集成

### 1. CDC（变更数据捕获）

```python
# Debezium CDC 集成
from typing import AsyncIterator
import json

class CDCConsumer:
    def __init__(self, kafka_config,Debezium connector config):
        self.consumer = self.create_consumer(kafka_config)
        self.connectors = connectors

    def create_consumer(self, config):
        """创建 Kafka 消费者"""
        from kafka import KafkaConsumer

        return KafkaConsumer(
            *self.connectors,
            bootstrap_servers=config['bootstrap.servers'],
            group_id=config['group.id'],
            value_deserializer=lambda m: json.loads(m.decode('utf-8'))
        )

    async def consume_changes(self) -> AsyncIterator[ChangeEvent]:
        """消费数据变更"""
        for message in self.consumer:
            change = ChangeEvent.from_debezium(message.value)
            yield change

    async def process_changes(self):
        """处理数据变更"""
        async for change in self.consume_changes():
            # 根据变更类型处理
            if change.operation == 'create':
                await self.handle_create(change)
            elif change.operation == 'update':
                await self.handle_update(change)
            elif change.operation == 'delete':
                await self.handle_delete(change)

    async def handle_create(self, change: ChangeEvent):
        """处理创建操作"""
        # 提取变更数据
        entity = change.after

        # 转换为目标格式
        transformed = await self.transform_entity(entity)

        # 发送到下游系统
        await self.publish_to_downstream('create', transformed)

    async def handle_update(self, change: ChangeEvent):
        """处理更新操作"""
        before = change.before
        after = change.after

        # 计算变更差异
        diff = self.calculate_diff(before, after)

        # 发送变更通知
        await self.publish_change_notification(
            entity_id=change.id,
            changes=diff
        )

    async def handle_delete(self, change: ChangeEvent):
        """处理删除操作"""
        await self.publish_to_downstream('delete', {
            'entity_id': change.id,
            'deleted_at': change.timestamp
        })

# ChangeEvent 数据结构
@dataclass
class ChangeEvent:
    operation: str  # create, read, update, delete
    source: str  # 数据源信息
    table: str  # 表名
    before: dict  # 变更前数据
    after: dict  # 变更后数据
    timestamp: datetime
    id: str  # 实体 ID

    @classmethod
    def from_debezium(cls, debezium_event: dict) -> 'ChangeEvent':
        """从 Debezium 事件创建"""
        payload = debezium_event['payload']

        return cls(
            operation=payload['op'],
            source=payload['source'],
            table=payload['source']['table'],
            before=payload.get('before'),
            after=payload.get('after'),
            timestamp=datetime.fromtimestamp(payload['ts_ms'] / 1000),
            id=payload['id']
        )
```

### 2. 实时数据同步

```python
# 多数据源同步
class RealTimeDataSync:
    def __init__(self):
        self.sources = {}
        self.destinations = {}
        self.transformers = {}

    def register_source(self, name: str, source: DataSource):
        """注册数据源"""
        self.sources[name] = source

    def register_destination(self, name: str, dest: DataDestination):
        """注册目标"""
        self.destinations[name] = dest

    def register_transformer(
        self,
        source_type: str,
        dest_type: str,
        transformer: Transformer
    ):
        """注册数据转换器"""
        key = f"{source_type}:{dest_type}"
        self.transformers[key] = transformer

    async def sync(self, config: SyncConfig):
        """执行数据同步"""
        # 获取数据源
        source = self.sources[config.source_name]
        destination = self.destinations[config.destination_name]

        # 获取转换器
        transformer_key = f"{source.type}:{destination.type}"
        transformer = self.transformers.get(transformer_key)

        # 消费源数据变更
        async for change in source.consume_changes():
            # 转换数据
            if transformer:
                transformed = await transformer.transform(change)
            else:
                transformed = change

            # 写入目标
            await destination.write(transformed)

            # 更新同步状态
            await self.update_sync_status(
                config.sync_id,
                change.position
            )

# 数据源抽象
class DataSource(ABC):
    @abstractmethod
    async def consume_changes(self) -> AsyncIterator[DataChange]:
        """消费数据变更"""
        pass

# 目标抽象
class DataDestination(ABC):
    @abstractmethod
    async def write(self, data: DataChange):
        """写入数据"""
        pass

# MySQL 数据源
class MySQLSource(DataSource):
    def __init__(self, connection_string: str):
        self.connection_string = connection_string

    async def consume_changes(self) -> AsyncIterator[DataChange]:
        """通过 CDC 消费 MySQL 变更"""
        cdc = CDCConsumer(
            kafka_config=self.get_kafka_config(),
            connectors=['mysql-cdc-connector']
        )

        async for change in cdc.consume_changes():
            if change.source == 'mysql':
                yield DataChange(
                    source_type='mysql',
                    operation=change.operation,
                    data=change.after or change.before,
                    metadata={
                        'table': change.table,
                        'timestamp': change.timestamp
                    }
                )

# Elasticsearch 目标
class ElasticsearchDestination(DataDestination):
    def __init__(self, hosts: list):
        from elasticsearch import AsyncElasticsearch
        self.client = AsyncElasticsearch(hosts)

    async def write(self, data: DataChange):
        """写入 Elasticsearch"""
        index_name = f"{data.metadata['table']}_index"

        if data.operation == 'delete':
            await self.client.delete(
                index=index_name,
                id=data.data['id']
            )
        else:
            await self.client.index(
                index=index_name,
                id=data.data.get('id'),
                body=data.data
            )
```

## 实时监控与告警

### 1. 指标收集

```python
# Prometheus 指标收集
from prometheus_client import Counter, Gauge, Histogram, start_http_server

# 定义指标
request_count = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

request_duration = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration',
    ['method', 'endpoint']
)

active_connections = Gauge(
    'active_connections',
    'Number of active connections'
)

error_rate = Gauge(
    'error_rate',
    'Current error rate'
)

# 指标中间件
class MetricsMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope['type'] == 'http':
            # 记录开始时间
            start_time = time.time()

            # 增加活跃连接数
            active_connections.inc()

            # 包装 send 以捕获响应状态
            status_code = None

            async def send_wrapper(message):
                nonlocal status_code
                if message['type'] == 'http.response.start':
                    status_code = message['status']
                await send(message)

            try:
                await self.app(scope, receive, send_wrapper)
            finally:
                # 记录指标
                duration = time.time() - start_time
                method = scope['method']
                path = scope['path']

                request_count.labels(
                    method=method,
                    endpoint=path,
                    status=status_code or 500
                ).inc()

                request_duration.labels(
                    method=method,
                    endpoint=path
                ).observe(duration)

                # 减少活跃连接数
                active_connections.dec()

        else:
            await self.app(scope, receive, send)
```

### 2. 实时告警

```python
# 告警引擎
class AlertEngine:
    def __init__(self):
        self.rules = []
        self.notifiers = []

    def add_rule(self, rule: AlertRule):
        """添加告警规则"""
        self.rules.append(rule)

    def add_notifier(self, notifier: AlertNotifier):
        """添加通知器"""
        self.notifiers.append(notifier)

    async def evaluate_rules(self, metrics: Metrics):
        """评估告警规则"""
        for rule in self.rules:
            if await rule.should_alert(metrics):
                await self.send_alert(rule, metrics)

    async def send_alert(self, rule: AlertRule, metrics: Metrics):
        """发送告警"""
        alert = Alert(
            rule_id=rule.id,
            rule_name=rule.name,
            severity=rule.severity,
            message=rule.format_message(metrics),
            metrics=metrics,
            timestamp=datetime.utcnow()
        )

        for notifier in self.notifiers:
            await notifier.send(alert)

# 告警规则
class AlertRule:
    def __init__(
        self,
        id: str,
        name: str,
        condition: Callable[[Metrics], bool],
        severity: str = 'warning'
    ):
        self.id = id
        self.name = name
        self.condition = condition
        self.severity = severity

    async def should_alert(self, metrics: Metrics) -> bool:
        """检查是否应该触发告警"""
        return self.condition(metrics)

    def format_message(self, metrics: Metrics) -> str:
        """格式化告警消息"""
        return f"Alert {self.name} triggered at {datetime.utcnow()}"

# 告警通知器
class SlackNotifier(AlertNotifier):
    def __init__(self, webhook_url: str):
        self.webhook_url = webhook_url

    async def send(self, alert: Alert):
        """发送 Slack 通知"""
        import aiohttp

        message = {
            'text': f'Alert: {alert.rule_name}',
            'attachments': [{
                'color': self.get_color(alert.severity),
                'fields': [
                    {'title': 'Severity', 'value': alert.severity},
                    {'title': 'Message', 'value': alert.message},
                    {'title': 'Time', 'value': alert.timestamp.isoformat()}
                ]
            }]
        }

        async with aiohttp.ClientSession() as session:
            await session.post(self.webhook_url, json=message)

    def get_color(self, severity: str) -> str:
        """获取告警颜色"""
        colors = {
            'critical': 'danger',
            'warning': 'warning',
            'info': 'good'
        }
        return colors.get(severity, 'warning')
```

## 总结

实时数据架构的核心要点：

1. **流处理**：使用 Flink/Kafka Streams 处理实时数据
2. **事件溯源**：完整的事件历史记录
3. **CQRS**：读写分离优化性能
4. **CDC**：实时数据变更捕获
5. **监控告警**：及时的异常检测和响应
6. **弹性设计**：处理数据积压和故障恢复

实时数据架构是现代数据驱动业务的基础设施。

---

**相关工具：**
- [JSON 解析工具](https://www.util.cn/tools/json-parser/)
- [时间戳转换](https://www.util.cn/tools/timestamp/)
