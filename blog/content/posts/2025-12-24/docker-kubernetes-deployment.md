---
title: "Docker与Kubernetes容器化部署：从零搭建生产级容器化系统"
description: "全面讲解Docker容器技术和Kubernetes编排系统，包括镜像构建、容器编排、服务发现、负载均衡、自动扩缩容以及CI/CD集成，帮助构建高可用的容器化部署方案。"
author: "有条工具团队"
date: 2025-12-24T15:00:00+08:00
categories:
  - DevOps
  - 容器技术
tags:
  - Docker
  - Kubernetes
  - 容器化
  - K8s部署
  - DevOps
keywords:
  - Docker容器化
  - Kubernetes部署
  - K8s集群
  - 容器编排
  - Docker镜像
  - K8s服务发现
  - 容器自动扩缩容
series:
  - DevOps实战
draft: false
---

## 引言

容器化技术彻底改变了应用的部署和运维方式。Docker提供了轻量级的容器化解决方案，而Kubernetes（K8s）则提供了强大的容器编排能力。本文将从零开始，深入讲解如何使用Docker和Kubernetes构建生产级的容器化系统。

## 一、Docker基础

### 1.1 Docker核心概念

```bash
# Docker三大核心概念
# 1. 镜像（Image）：应用的只读模板
# 2. 容器（Container）：镜像的运行实例
# 3. 仓库（Registry）：存储和分发镜像

# 查看Docker版本
docker --version
docker info

# 运行第一个容器
docker run hello-world

# 交互式运行容器
docker run -it ubuntu bash
```

### 1.2 Dockerfile最佳实践

```dockerfile
# 1. 选择合适的基础镜像
# 生产环境推荐使用alpine或distroless
FROM node:20-alpine AS builder

# 2. 设置工作目录
WORKDIR /app

# 3. 优化依赖安装（利用Docker缓存）
# 先复制package文件，安装依赖后再复制源代码
COPY package*.json ./
RUN npm ci --only=production

# 4. 复制源代码
COPY . .

# 5. 构建应用
RUN npm run build

# 6. 生产镜像（多阶段构建）
FROM node:20-alpine

# 7. 创建非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# 8. 只复制必要文件
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./

# 9. 切换到非root用户
USER nodejs

# 10. 暴露端口
EXPOSE 3000

# 11. 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js || exit 1

# 12. 启动命令
CMD ["node", "dist/index.js"]
```

### 1.3 Docker Compose本地开发

```yaml
# docker-compose.yml
version: '3.8'

services:
  # 前端应用
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      target: development
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - API_URL=http://api:4000
    depends_on:
      - api

  # 后端API
  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:password@db:5432/myapp
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    volumes:
      - ./backend:/app
      - /app/node_modules

  # PostgreSQL数据库
  db:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=myapp
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql

  # Redis缓存
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

  # Nginx反向代理
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - frontend
      - api

volumes:
  postgres_data:
  redis_data:
```

## 二、Kubernetes核心概念

### 2.1 Pod与容器

```yaml
# pod.yaml - 最小部署单元
apiVersion: v1
kind: Pod
metadata:
  name: nginx-pod
  labels:
    app: nginx
spec:
  containers:
  - name: nginx
    image: nginx:1.25-alpine
    ports:
    - containerPort: 80
    resources:
      requests:
        memory: "64Mi"
        cpu: "250m"
      limits:
        memory: "128Mi"
        cpu: "500m"
    livenessProbe:
      httpGet:
        path: /
        port: 80
      initialDelaySeconds: 30
      periodSeconds: 10
    readinessProbe:
      httpGet:
        path: /
        port: 80
      initialDelaySeconds: 5
      periodSeconds: 5
    volumeMounts:
    - name: config
      mountPath: /etc/nginx/conf.d
  volumes:
  - name: config
    configMap:
      name: nginx-config
```

### 2.2 Deployment部署

```yaml
# deployment.yaml - 声明式部署
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
  labels:
    app: web
spec:
  # 期望的副本数
  replicas: 3

  # 选择器
  selector:
    matchLabels:
      app: web

  # Pod模板
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
      - name: web
        image: myregistry/web-app:v1.0.0
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5

  # 更新策略
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1        # 最多多1个Pod
      maxUnavailable: 0  # 不允许不可用Pod

  # 历史版本限制
  revisionHistoryLimit: 10
```

### 2.3 Service服务发现

```yaml
# service.yaml - 服务暴露
apiVersion: v1
kind: Service
metadata:
  name: web-service
spec:
  # ClusterIP: 集群内部访问（默认）
  # NodePort: 通过节点IP:端口访问
  # LoadBalancer: 云服务商负载均衡器
  type: ClusterIP

  # 选择器
  selector:
    app: web

  # 端口配置
  ports:
  - name: http
    protocol: TCP
    port: 80        # Service端口
    targetPort: 3000  # Pod端口

  # Session保持（可选）
  sessionAffinity: ClientIP
  sessionAffinityConfig:
    clientIP:
      timeoutSeconds: 10800
```

```yaml
# ingress.yaml - HTTP路由
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: web-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - example.com
    secretName: web-tls
  rules:
  - host: example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: web-service
            port:
              number: 80
```

## 三、Kubernetes高级配置

### 3.1 ConfigMap配置管理

```yaml
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  # 键值对配置
  NODE_ENV: "production"
  LOG_LEVEL: "info"

  # 文件配置
  app.json: |
    {
      "port": 3000,
      "database": {
        "host": "postgres.default.svc.cluster.local",
        "port": 5432
      }
    }

  nginx.conf: |
    server {
      listen 80;
      location / {
        proxy_pass http://web-service:3000;
      }
    }
```

```yaml
# 使用ConfigMap
apiVersion: v1
kind: Pod
metadata:
  name: app-pod
spec:
  containers:
  - name: app
    image: myapp:latest
    env:
    # 从ConfigMap读取环境变量
    - name: NODE_ENV
      valueFrom:
        configMapKeyRef:
          name: app-config
          key: NODE_ENV
    volumeMounts:
    # 挂载文件
    - name: config
      mountPath: /etc/app
      readOnly: true
  volumes:
  - name: config
    configMap:
      name: app-config
      items:
      - key: app.json
        path: config.json
      - key: nginx.conf
        path: nginx.conf
```

### 3.2 Secret密钥管理

```yaml
# 创建Secret
apiVersion: v1
kind: Secret
metadata:
  name: db-secret
type: Opaque
data:
  # Base64编码的值
  username: cG9zdGdyZXM=
  password: cGFzc3dvcmQ=
  url: cG9zdGdyZXNxbDovL3Bvc3RncmVzOnBhc3N3b3JkQGRiOjU0MzIvbXlhcHA=
```

```bash
# 从命令行创建Secret
kubectl create secret generic db-secret \
  --from-literal=username=postgres \
  --from-literal=password=password \
  --from-file=cert=./tls.crt

# 从文件创建
kubectl create secret tls web-tls \
  --cert=path/to/tls.cert \
  --key=path/to/tls.key
```

### 3.3 PersistentVolume持久化存储

```yaml
# persistent-volume.yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: pv-data
spec:
  capacity:
    storage: 10Gi
  accessModes:
    - ReadWriteOnce  # RWO, RWX, ROX
  persistentVolumeReclaimPolicy: Retain  # Retain, Delete, Recycle
  storageClassName: standard
  hostPath:
    path: /data/volume
```

```yaml
# persistent-volume-claim.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: pvc-data
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
  storageClassName: standard
```

```yaml
# 使用PVC
apiVersion: v1
kind: Pod
metadata:
  name: app-pod
spec:
  containers:
  - name: app
    image: myapp:latest
    volumeMounts:
    - name: data
      mountPath: /app/data
  volumes:
  - name: data
    persistentVolumeClaim:
      claimName: pvc-data
```

## 四、自动扩缩容

### 4.1 Horizontal Pod Autoscaler

```yaml
# hpa.yaml - 水平Pod自动扩缩容
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: web-hpa
spec:
  # 扩缩容目标
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-app

  # 最小和最大副本数
  minReplicas: 2
  maxReplicas: 10

  # 指标配置
  metrics:
  # CPU使用率
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70

  # 内存使用量
  - type: Resource
    resource:
      name: memory
      target:
        type: AverageValue
        averageValue: 512Mi

  # 自定义指标
  - type: Pods
    pods:
      metric:
        name: http_requests_per_second
      target:
        type: AverageValue
        averageValue: "100"

  # 行为配置
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
      - type: Pods
        value: 2
        periodSeconds: 15
      selectPolicy: Max
```

### 4.2 Vertical Pod Autoscaler

```yaml
# vpa.yaml - 垂直Pod自动扩缩容
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: web-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-app

  updatePolicy:
    updateMode: Auto  # Off, Initial, Recreate, Auto

  resourcePolicy:
    containerPolicies:
    - containerName: '*'
      minAllowed:
        cpu: 100m
        memory: 128Mi
      maxAllowed:
        cpu: 1
        memory: 1Gi
      controlledResources: ["cpu", "memory"]
      controlledValues: RequestsAndLimits
```

## 五、CI/CD集成

### 5.1 GitHub Actions CI/CD

```yaml
# .github/workflows/deploy-k8s.yml
name: Build and Deploy to Kubernetes

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v3

    - name: Login to Container Registry
      uses: docker/login-action@v3
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}

    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v5
      with:
        images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
        tags: |
          type=ref,event=branch
          type=semver,pattern={{version}}
          type=semver,pattern={{major}}.{{minor}}
          type=sha,prefix={{branch}}-

    - name: Build and push Docker image
      uses: docker/build-push-action@v5
      with:
        context: .
        push: true
        tags: ${{ steps.meta.outputs.tags }}
        labels: ${{ steps.meta.outputs.labels }}
        cache-from: type=gha
        cache-to: type=gha,mode=max

    - name: Install kubectl
      uses: azure/setup-kubectl@v3
      with:
        version: 'latest'

    - name: Configure kubectl
      run: |
        echo "${{ secrets.KUBE_CONFIG }}" | base64 -d > kubeconfig
        export KUBECONFIG=kubeconfig

    - name: Deploy to Kubernetes
      run: |
        # 更新deployment中的镜像
        kubectl set image deployment/web-app \
          web=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}

        # 等待部署完成
        kubectl rollout status deployment/web-app

        # 验证部署
        kubectl get pods -l app=web
```

### 5.2 Helm Charts管理

```yaml
# Helm Chart values.yaml
replicaCount: 3

image:
  repository: ghcr.io/myorg/myapp
  pullPolicy: IfNotPresent
  tag: "v1.0.0"

imagePullSecrets: []

service:
  type: ClusterIP
  port: 80
  targetPort: 3000

ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
  hosts:
    - host: app.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: app-tls
      hosts:
        - app.example.com

resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
  limits:
    memory: "512Mi"
    cpu: "500m"

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80

database:
  host: postgres.default.svc.cluster.local
  port: 5432
  name: myapp
  existingSecret: db-secret
```

```bash
# 部署Helm Chart
helm upgrade --install myapp ./chart \
  --namespace production \
  --create-namespace \
  --values values.yaml \
  --set image.tag=${IMAGE_TAG} \
  --wait \
  --timeout 5m
```

## 六、监控与日志

### 6.1 Prometheus监控

```yaml
# ServiceMonitor for Prometheus Operator
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: web-app
  labels:
    app: web
spec:
  selector:
    matchLabels:
      app: web
  endpoints:
  - port: http
    path: /metrics
    interval: 30s
    scrapeTimeout: 10s
```

### 6.2 日志收集

```yaml
# Fluentd ConfigMap
apiVersion: v1
kind: ConfigMap
metadata:
  name: fluentd-config
data:
  fluent.conf: |
    <source>
      @type tail
      path /var/log/containers/*.log
      pos_file /var/log/fluentd-containers.log.pos
      tag kubernetes.*
      read_from_head true
      <parse>
        @type json
      </parse>
    </source>

    <filter kubernetes.**>
      @type kubernetes_metadata
    </filter>

    <match **>
      @type elasticsearch
      host elasticsearch.logging.svc.cluster.local
      port 9200
      logstash_format true
      logstash_prefix k8s
    </match>
```

## 总结

Docker和Kubernetes构建了现代容器化部署的基础：

1. **Docker容器化** - 统一应用运行环境，简化部署
2. **Kubernetes编排** - 自动化管理、扩缩容、服务发现
3. **配置管理** - ConfigMap和Secret分离配置和密钥
4. **自动扩缩容** - HPA和VPA实现资源动态调整
5. **CI/CD集成** - 自动化构建、测试、部署流程
6. **监控日志** - 完善的监控和日志收集体系

掌握这些技术，将帮助团队构建高可用、可扩展的容器化系统。

> **相关工具推荐**
> - [JSON格式化工具](https://www.util.cn/tools/json-formatter/) - JSON数据处理
> - [Base64编码工具](https://www.util.cn/tools/base64-encode/) - 编码转换（Secret常用）
> - [YAML格式化工具](https://www.util.cn/tools/yaml-formatter/) - YAML配置处理
