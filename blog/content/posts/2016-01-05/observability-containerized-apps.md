---
title: "容器化应用的可观测性架构设计：Metrics、Tracing、Logging 的完整实践"
slug: "observability-containerized-apps"
date: 2026-01-05
draft: false
description: "深入探讨云原生时代的可观测性体系，详细介绍 Prometheus + Grafana + Jaeger + Loki 的组合使用，以及如何在 Kubernetes 环境下构建完整的监控体系"
tags: ["可观测性", "监控", "Prometheus", "Kubernetes", "Logging"]
categories: ["架构设计"]
author: "技术团队"
---

## 引言：从监控到可观测性

传统的监控系统（如 Nagios、Zabbix）专注于**基础设施监控**：CPU、内存、磁盘、网络。但在容器化和微服务架构下，这些远远不够。

可观测性（Observability）的三大支柱：

1. **Metrics（指标）**：数值化的时间序列数据，告警基础
2. **Tracing（追踪）**：请求在分布式系统中的完整路径
3. **Logging（日志）**：离散事件的记录，问题诊断

本文将介绍如何在 Kubernetes 环境下构建完整的可观测性体系。

## 一、Metrics：从黑盒到白盒

### 1.1 四大黄金指标

1. **Latency（延迟）**：请求的响应时间
2. **Traffic（流量）**：每秒请求数（QPS）
3. **Errors（错误率）**：失败请求的百分比
4. **Saturation（饱和度）**：资源使用率

### 1.2 Prometheus + Grafana 监控架构

```
┌────────────────────────────────────────────────────────┐
│                    Grafana                           │
│             （统一可视化大盘）                           │
└────────────────────────────────────────────────────────┘
                          ↑
                          │
┌────────────────────────────────────────────────────────┐
│                   Prometheus                          │
│              （指标采集 + 存储 + 告警）                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │ Service A   │  │ Service B   │  │ Service C   │   │
│  │  /metrics   │  │  /metrics   │  │  /metrics   │   │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘   │
└─────────┼────────────────┼────────────────┼───────────┘
          │                │                │
          └────────────────┴────────────────┘
                         ↓
                  ┌──────────┐
                  │ AlertManager │
                  │  （告警路由）  │
                  └──────────┘
```

### 1.3 自定义 Metrics：Go + Prometheus

**依赖**：

```bash
go get github.com/prometheus/client_golang/prometheus
go get github.com/prometheus/client_golang/prometheus/promhttp
```

**实现**：

```go
import (
    "github.com/prometheus/client_golang/prometheus"
    "github.com/prometheus/client_golang/prometheus/promhttp"
)

var (
    // Counter：只增不减的计数器
    requestsTotal = prometheus.NewCounterVec(
        prometheus.CounterOpts{
            Name: "http_requests_total",
            Help: "Total number of HTTP requests",
        },
        []string{"method", "endpoint", "status"},
    )

    // Histogram：分布统计（延迟、请求大小）
    requestDuration = prometheus.NewHistogramVec(
        prometheus.HistogramOpts{
            Name:    "http_request_duration_seconds",
            Help:    "HTTP request latency distributions",
            Buckets: []float64{0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10},
        },
        []string{"method", "endpoint"},
    )

    // Gauge：可增可减的数值（当前连接数、队列长度）
    activeConnections = prometheus.NewGauge(
        prometheus.GaugeOpts{
            Name: "http_active_connections",
            Help: "Current number of active connections",
        },
    )

    // Summary：类似 Histogram，但客户端计算分位数
    responseSize = prometheus.NewSummaryVec(
        prometheus.SummaryOpts{
            Name:       "http_response_size_bytes",
            Help:       "HTTP response size distributions",
            Objectives: map[float64]float64{0.5: 0.05, 0.9: 0.01, 0.99: 0.001},
        },
        []string{"method", "endpoint"},
    )
)

func init() {
    // 注册指标
    prometheus.MustRegister(requestsTotal)
    prometheus.MustRegister(requestDuration)
    prometheus.MustRegister(activeConnections)
    prometheus.MustRegister(responseSize)
}

// HTTP 中间件
func PrometheusMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()

        // 包装 ResponseWriter 以获取状态码
        rw := &responseWriter{ResponseWriter: w, statusCode: 200}

        // 处理请求
        next.ServeHTTP(rw, r)

        // 记录指标
        duration := time.Since(start).Seconds()
        requestsTotal.WithLabelValues(r.Method, r.URL.Path, strconv.Itoa(rw.statusCode)).Inc()
        requestDuration.WithLabelValues(r.Method, r.URL.Path).Observe(duration)
    })
}

// 业务指标示例
type OrderService struct {
    ordersCreated prometheus.Counter
    orderAmount   prometheus.Histogram
}

func (s *OrderService) CreateOrder(order *Order) error {
    start := time.Now()

    // 业务逻辑
    if err := s.repo.Create(order); err != nil {
        return err
    }

    // 记录业务指标
    s.ordersCreated.Inc()
    s.orderAmount.Observe(order.Amount)

    // 记录处理时间
    duration := time.Since(start).Seconds()
    orderProcessingDuration.Observe(duration)

    return nil
}
```

**HTTP 暴露**：

```go
func main() {
    // 注册 /metrics 端点
    http.Handle("/metrics", promhttp.Handler())

    // 启动服务
    http.ListenAndServe(":8080", nil)
}
```

### 1.4 Kubernetes ServiceMonitor

```yaml
# ServiceMonitor: 告诉 Prometheus 抓取目标
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: my-app
  namespace: monitoring
spec:
  selector:
    matchLabels:
      app: my-app
  endpoints:
  - port: web
    path: /metrics
    interval: 15s
    scrapeTimeout: 10s
```

### 1.5 Grafana 大盘配置

```json
{
  "dashboard": {
    "title": "服务监控大盘",
    "panels": [
      {
        "title": "QPS",
        "targets": [
          {
            "expr": "rate(http_requests_total[1m])"
          }
        ],
        "type": "graph"
      },
      {
        "title": "P95 延迟",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))"
          }
        ],
        "type": "graph"
      },
      {
        "title": "错误率",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total{status=~\"5..\"}[5m])) / sum(rate(http_requests_total[5m]))"
          }
        ],
        "type": "graph"
      }
    ]
  }
}
```

### 1.6 告警规则

```yaml
# prometheus-rules.yaml
groups:
  - name: alert.rules
    rules:
      # P95 延迟告警
      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 0.5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "P95 延迟过高"
          description: "P95 延迟 {{ $value }}s 超过 500ms"

      # 错误率告警
      - alert: HighErrorRate
        expr: sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "错误率过高"
          description: "错误率 {{ $value | humanizePercentage }} 超过 5%"

      # Pod 重启告警
      - alert: PodRestarting
        expr: increase(kube_pod_status_phase{phase="Failed"}[15m]) > 3
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Pod 频繁重启"
          description: "Pod {{ $labels.pod }} 15分钟内重启 {{ $value }} 次"
```

## 二、Distributed Tracing：分布式追踪

### 2.1 OpenTelemetry Tracing

```
请求链路：
用户 → API Gateway → 订单服务 → 库存服务
      ↓              ↓           ↓
   Web Shop      支付服务    数据库
```

### 2.2 Go + OpenTelemetry 实现

**依赖**：

```bash
go get go.opentelemetry.io/otel
go get go.opentelemetry.io/otel/exporters/jaeger
go get go.opentelemetry.io/otel/sdk
go get go.opentelemetry.io/otel/sdk/resource
go get go.opentelemetry.io/otel/semconv/v1.4.0
```

**初始化 Tracer**：

```go
import (
    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/exporters/jaeger"
    "go.opentelemetry.io/otel/sdk/resource"
    tracesdk "go.opentelemetry.io/otel/sdk/trace"
    semconv "go.opentelemetry.io/otel/semconv/v1.4.0"
)

func InitTracer(serviceName, jaegerEndpoint string) (*tracesdk.TracerProvider, error) {
    // 创建 Resource
    res, err := resource.New(
        context.Background(),
        resource.WithAttributes(
            semconv.ServiceNameKey.String(serviceName),
            semconv.DeploymentEnvironmentKey.String("production"),
        ),
    )
    if err != nil {
        return nil, err
    }

    // 创建 Jaeger Exporter
    exporter, err := jaeger.New(jaeger.WithCollectorEndpoint(
        jaeger.WithEndpoint(jaegerEndpoint),
    ))
    if err != nil {
        return nil, err
    }

    // 创建 TracerProvider
    tp := tracesdk.NewTracerProvider(
        tracesdk.WithBatcher(exporter),
        tracesdk.WithResource(res),
        tracesdk.WithSampler(tracesdk.TraceIDRatioBased(0.1)),  // 10% 采样
    )

    // 注册为全局 TracerProvider
    otel.SetTracerProvider(tp)

    return tp, nil
}
```

**使用 Tracer**：

```go
import (
    "go.opentelemetry.io/otel/trace"
)

type OrderService struct {
    tracer trace.Tracer
}

func (s *OrderService) CreateOrder(ctx context.Context, req *CreateOrderRequest) error {
    // 创建 Span
    ctx, span := s.tracer.Start(ctx, "CreateOrder")
    defer span.End()

    span.SetAttributes(
        attribute.String("user.id", req.UserID),
        attribute.String("product.id", req.ProductID),
        attribute.Float64("order.amount", req.Amount),
    )

    // 调用库存服务
    inventory, err := s.inventoryClient.CheckStock(ctx, req.ProductID)
    if err != nil {
        span.RecordError(err)
        span.SetStatus(codes.Error, err.Error())
        return err
    }

    // 创建订单
    order := &Order{
        ID:        generateID(),
        UserID:    req.UserID,
        ProductID: req.ProductID,
        Amount:    req.Amount,
    }

    if err := s.repo.Create(ctx, order); err != nil {
        span.RecordError(err)
        return err
    }

    span.SetStatus(codes.Ok, "Order created")

    return nil
}
```

### 2.3 Jaeger 部署（Kubernetes）

```yaml
# jaeger-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: jaeger
spec:
  replicas: 1
  selector:
    matchLabels:
      app: jaeger
  template:
    metadata:
      labels:
        app: jaeger
    spec:
      containers:
      - name: jaeger
        image: jaegertracing/all-in-one:1.50
        ports:
        - containerPort: 5775  // acceptor
          name: acceptor
        - containerPort: 16686  // query
          name: query
        env:
        - name: COLLECTOR_ZIPKIN_HOST_PORT
          value: ":9411"
        - name: SPAN_STORAGE_TYPE
          value: elasticsearch
        - name: ES_SERVER_URLS
          value: http://elasticsearch:9200
---
apiVersion: v1
kind: Service
metadata:
  name: jaeger
spec:
  selector:
    app: jaeger
  ports:
  - port: 5775
    name: acceptor
  - port: 16686
    name: query
```

## 三、Logging：集中式日志管理

### 3.1 日志架构演进

```
阶段1：日志散落在各容器
┌──────┐ ┌──────┐ ┌──────┐
│ Pod1 │ │ Pod2 │ │ Pod3 │
└──┬───┘ └──┬───┘ └──┬───┘
   │        │        │
   └────────┴────────┘
        ↓
    kubectl logs (手动查看)

阶段2：EFK（Elasticsearch + Fluentd + Kibana）
┌──────┐ ┌──────┐ ┌──────┐
│ Pod1 │ │ Pod2 │ │ Pod3 │
└──┬───┘ └──┬───┘ └──┬───┘
   │        │        │
   └────────┴────────┘
         ↓
    Fluentd (日志收集)
         ↓
   Elasticsearch (存储)
         ↓
     Kibana (可视化)

阶段3：PLG（Promtail + Loki + Grafana）
┌──────┐ ┌──────┐ ┌──────┐
│ Pod1 │ │ Pod2 │ │ Pod3 │
└──┬───┘ └──┬───┘ └──┬───┘
   │        │        │
   └────────┴────────┘
         ↓
    Promtail (日志代理)
         ↓
       Loki (存储)
         ↓
     Grafana (可视化)
```

### 3.2 结构化日志

**日志格式**：

```json
{
  "timestamp": "2026-01-05T12:34:56.789Z",
  "level": "info",
  "service": "order-service",
  "trace_id": "7f8a9b6c",
  "span_id": "1a2b3c4d",
  "user_id": "12345",
  "message": "Order created successfully",
  "order": {
    "id": "ord_12345",
    "amount": 99.99,
    "product_id": "prod_67890"
  }
}
```

**Go + zap 结构化日志**：

```go
import (
    "go.uber.org/zap"
    "go.uber.org/zap/zapcore"
)

func NewLogger(serviceName string) *zap.Logger {
    config := zap.NewProductionConfig()
    config.InitialFields = map[string]interface{}{
        "service": serviceName,
        "pod":     os.Getenv("POD_NAME"),
    }

    logger, _ := config.Build(
        zap.AddCallerSkip(2),  // 跳过包装层
        zap.Wrap(func(zapcore.Core) zapcore.Core {
          // 注入 trace_id 和 span_id
          return &TraceIDCore{Core: zapcore.New(zapcore.NewJSONEncoder())}
        }),
    )

    return logger
}

type TraceIDCore struct {
    zapcore.Core
}

func (c *TraceIDCore) With(fields []zapcore.Field) zapcore.Core {
    // 从 OpenTelemetry Context 提取 trace_id 和 span_id
    ctx := context.Background()
    if span := trace.SpanFromContext(ctx); span.SpanContext().IsValid() {
        fields = append(fields,
            zap.String("trace_id", span.SpanContext().TraceID().String()),
            zap.String("span_id", span.SpanContext().SpanID().String()),
        )
    }

    return c.Core.With(fields)
}
```

**使用示例**：

```go
var logger *zap.Logger

func (s *OrderService) CreateOrder(ctx context.Context, req *CreateOrderRequest) error {
    logger.Info("Creating order",
        zap.String("user_id", req.UserID),
        zap.String("product_id", req.ProductID),
        zap.Float64("amount", req.Amount),
    )

    order := &Order{...}
    if err := s.repo.Create(order); err != nil {
        logger.Error("Failed to create order",
            zap.String("order_id", order.ID),
            zap.Error(err),
        )
        return err
    }

    logger.Info("Order created successfully",
        zap.String("order_id", order.ID),
    )

    return nil
}
```

### 3.3 Promtail 配置

```yaml
# promtail-config.yaml
server:
  http_listen_port: 9080

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: pods
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels:
          - __meta_kubernetes_pod_name
          - __meta_kubernetes_namespace
          - __meta_kubernetes_pod_label_app
        target_label: filename
        replacement: /var/log/pods/*$1*/*.log
```

### 3.4 Loki 查询语法

```
# 查询所有错误日志
{level="error"}

# 查询特定服务的日志
{service="order-service"}

# 时间范围查询
{service="order-service"} |= "Order created" | line_format "{{.timestamp}} {{.message}}"
```

## 四、完整可观测性架构

### 4.1 架构图

```
┌────────────────────────────────────────────────────────────┐
│                        Grafana                           │
│       ┌──────────────┬──────────────┬──────────────┐        │
│       │  Metrics     │   Tracing    │   Logging    │        │
│       │  (Prometheus)│  (Jaeger)    │    (Loki)    │        │
│       └──────────────┴──────────────┴──────────────┘        │
└────────────────────────────────────────────────────────────┘
            ↑                ↑               ↑
            │                │               │
┌───────────┴──────────┬─────────┴───────┬──────────┴─────┐
│                                                          │
│               Kubernetes Cluster                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Pod A     │  │   Pod B     │  │   Pod C     │         │
│  │ ┌─────────┐ │  │ ┌─────────┐ │  │ ┌─────────┐ │         │
│  │ │ App     │ │  │ │ App     │ │  │ │ App     │ │         │
│  │ │         │ │  │ │         │ │  │ │         │ │         │
│  │ │ /metrics│ │  │ │ /metrics│ │  │ │ /metrics│ │         │
│  │ │ /tracing│ │  │ │ /tracing│ │  │ │ /tracing│ │         │
│  │ │ /logs   │ │  │ │ /logs   │ │  │ │ /logs   │ │         │
│  │ └─────────┘ │  │ └─────────┘ │  │ └─────────┘ │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                          │
│  ┌──────────────────────────────────────────────────────┐ │
│  │            Operator (自动运维)                      │ │
│  └──────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

### 4.2 统一 Dashboard

```json
{
  "dashboard": {
    "title": "可观测性统一大盘",
    "panels": [
      {
        "title": "QPS",
        "type": "graph",
        "gridPos": {"x": 0, "y": 0, "w": 12, "h": 8},
        "targets": [{"expr": "sum(rate(http_requests_total{namespace=~\"prod\"}[5m]))"}]
      },
      {
        "title": "P95 延迟",
        "type": "graph",
        "gridPos": {"x": 12, "y": 0, "w": 12, "h": 8},
        "targets": [{"expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))"}]
      },
      {
        "title": "错误日志",
        "type": "logs",
        "gridPos": {"x": 0, "y": 8, "w": 12, "h": 8},
        "targets": [{"expr": "{level=\"error\"}"}]
      },
      {
        "title": "Trace 搜索",
        "type": "tracejaeger",
        "gridPos": {"x": 12, "y": 8, "w": 12, "h": 8}
      }
    ]
  }
}
```

## 五、最佳实践

### 5.1 RED 方法告警

```yaml
groups:
  - name: red-method
    rules:
      # Rate: 请求速率
      - alert: LowRequestRate
        expr: sum(rate(http_requests_total[5m])) < 100
        for: 5m
        labels:
          severity: warning

      # Errors: 错误率
      - alert: HighErrorRate
        expr: sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) > 0.01
        for: 5m
        labels:
          severity: critical

      # Duration: 持续时间（P99）
      - alert: HighP99Latency
        expr: histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 5m
        labels:
          severity: warning
```

### 5.2 日志分级与采样

```go
// 根据日志级别采样
type SamplingLogger struct {
    base   *zap.Logger
    sample map[zapcore.Level]float64
}

func (l *SamplingLogger) Debug(msg string, fields ...zap.Field) {
    if rand.Float64() > l.sample[zap.DebugLevel] {
        return  // 跳过
    }
    l.base.Debug(msg, fields...)
}

func (l *SamplingLogger) Error(msg string, fields ...zap.Field) {
    // 错误日志不采样
    l.base.Error(msg, fields...)
}
```

### 5.3 Trace 与 Log 的关联

```go
func (s *OrderService) CreateOrder(ctx context.Context, req *CreateOrderRequest) error {
    span := trace.SpanFromContext(ctx)

    logger := logger.With(
        zap.String("trace_id", span.SpanContext().TraceID().String()),
        zap.String("span_id", span.SpanContext().SpanID().String()),
    )

    logger.Info("Creating order", ...)

    return nil
}
```

## 六、总结

可观测性是云原生系统的必备能力。通过：

1. **Metrics**：监控资源使用和业务指标
2. **Tracing**：追踪分布式请求链路
3. **Logging**：记录离散事件和错误信息

构建完整的可观测性体系，让系统的运行状态一目了然。

---

> 可观测性不是事后诸葛亮，而是架构设计的一等公民。在设计系统时，就要考虑如何观察它。
