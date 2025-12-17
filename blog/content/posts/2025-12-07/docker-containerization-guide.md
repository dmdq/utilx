---
title: "Docker 容器化部署完全指南"
slug: "docker-containerization-guide"
date: 2025-12-07T10:00:00+08:00
draft: false
tags: ['Docker', '容器化', 'DevOps', '部署']
categories: ['DevOps']
author: '有条工具团队'
summary: '全面介绍 Docker 容器化的最佳实践，从基础概念到生产部署'
---

## 前言

Docker 已经成为现代软件开发和部署的标准工具。通过容器化，我们可以实现环境一致性、简化部署流程、提高资源利用率。本指南将带你从基础到进阶，全面掌握 Docker 的使用。

## Docker 基础概念

### 1. 核心组件

```bash
# Docker 引擎：运行和管理容器的核心
docker version  # 查看 Docker 版本信息
docker info     # 查看系统信息和资源使用

# 镜像（Image）：应用程序的静态模板
docker images           # 查看本地镜像
docker pull ubuntu:20.04 # 拉取镜像
docker search nginx     # 搜索镜像

# 容器（Container）：镜像的运行实例
docker ps               # 查看运行的容器
docker ps -a            # 查看所有容器
docker run nginx        # 运行容器

# 仓库（Repository）：存储和分发镜像的服务
docker login            # 登录镜像仓库
docker push myapp:1.0   # 推送镜像
```

### 2. Dockerfile 基础

```dockerfile
# 基础镜像
FROM node:16-alpine

# 维护者信息
LABEL maintainer="your-email@example.com"

# 设置工作目录
WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 暴露端口
EXPOSE 3000

# 环境变量
ENV NODE_ENV=production

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 更改文件所有权
RUN chown -R nodejs:nodejs /app
USER nodejs

# 启动命令
CMD ["node", "app.js"]

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:3000/health || exit 1
```

## 构建优化

### 1. 多阶段构建

```dockerfile
# 构建阶段
FROM node:16-alpine AS builder

WORKDIR /app

# 复制依赖文件
COPY package*.json ./

# 安装所有依赖（包括开发依赖）
RUN npm ci

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 生产阶段
FROM node:16-alpine AS production

WORKDIR /app

# 只复制生产依赖
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# 从构建阶段复制构建产物
COPY --from=builder /app/dist ./dist

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

EXPOSE 3000

CMD ["node", "dist/app.js"]
```

### 2. 层缓存优化

```dockerfile
# Dockerfile
FROM node:16-alpine

WORKDIR /app

# 先复制依赖文件，利用缓存
COPY package.json package-lock.json ./

# 安装依赖（这一层变化频率低）
RUN npm ci --only=production

# 再复制源代码（变化频率高）
COPY . .

# 构建或启动应用
RUN npm run build
CMD ["npm", "start"]
```

### 3. .dockerignore 文件

```dockerignore
# 排除不需要的文件和目录
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.nyc_output
coverage
.coverage
dist
build
*.log
.DS_Store
.vscode
.idea
```

## Docker Compose

### 1. 基础配置

```yaml
# docker-compose.yml
version: '3.8'

services:
  # 应用服务
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: myapp
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:password@db:5432/myapp
    depends_on:
      - db
      - redis
    volumes:
      - ./logs:/app/logs
    networks:
      - app-network

  # 数据库服务
  db:
    image: postgres:13-alpine
    container_name: myapp-db
    restart: unless-stopped
    environment:
      - POSTGRES_DB=myapp
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - app-network

  # Redis 服务
  redis:
    image: redis:6-alpine
    container_name: myapp-redis
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    networks:
      - app-network

  # Nginx 反向代理
  nginx:
    image: nginx:alpine
    container_name: myapp-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    networks:
      - app-network

volumes:
  postgres_data:
  redis_data:

networks:
  app-network:
    driver: bridge
```

### 2. 环境变量配置

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
    env_file:
      - .env.production

# docker-compose.dev.yml
version: '3.8'

services:
  app:
    environment:
      - NODE_ENV=development
      - PORT=3000
    volumes:
      - .:/app  # 开发时挂载源代码
    command: npm run dev
```

## 生产部署

### 1. 生产环境 Dockerfile

```dockerfile
# Dockerfile.prod
FROM node:16-alpine AS deps

WORKDIR /app

# 复制依赖文件
COPY package.json package-lock.json ./

# 安装依赖
RUN npm ci --only=production

# 生产镜像
FROM node:16-alpine

RUN apk add --no-cache dumb-init

WORKDIR /app

# 复制依赖
COPY --from=deps /app/node_modules ./node_modules

# 复制应用代码
COPY . .

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# 使用 dumb-init
ENTRYPOINT ["dumb-init", "--"]

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s \
  CMD node healthcheck.js

CMD ["node", "app.js"]
```

### 2. 安全配置

```dockerfile
# 安全最佳实践
FROM node:16-alpine

# 更新系统包
RUN apk update && \
    apk upgrade && \
    apk add --no-cache \
    dumb-init \
    && rm -rf /var/cache/apk/*

# 创建用户
RUN addgroup -g 1001 -S appuser && \
    adduser -S appuser -u 1001

WORKDIR /app

# 复制并设置权限
COPY --chown=appuser:appuser . .

USER appuser

# 使用最小权限运行
USER 1001:1001

# 使用 tini 初始化系统
ENTRYPOINT ["tini", "--"]

# CMD 执行
CMD ["node", "app.js"]
```

## 网络配置

### 1. 自定义网络

```yaml
# docker-compose.networks.yml
version: '3.8'

services:
  web:
    image: nginx
    networks:
      - frontend
      - backend

  db:
    image: postgres
    networks:
      - backend

networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true  # 内部网络，不能访问外部
```

### 2. 网络隔离

```bash
# 创建自定义网络
docker network create --driver bridge myapp-network
docker network create --driver bridge db-network --internal

# 运行容器并连接到网络
docker run -d --name web --network myapp-network nginx
docker run -d --name db --network db-network postgres

# 连接容器到多个网络
docker network connect myapp-network db
```

## 数据持久化

### 1. 数据卷

```yaml
# docker-compose.volumes.yml
version: '3.8'

services:
  db:
    image: postgres:13
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups

  app:
    image: myapp
    volumes:
      - ./logs:/app/logs
      - uploads:/app/uploads

volumes:
  postgres_data:
    driver: local
  uploads:
    driver: local
```

### 2. 备份和恢复

```bash
# 数据库备份脚本
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$DATE.sql"

# 创建备份
docker exec postgres_container pg_dump -U postgres myapp > $BACKUP_FILE

# 压缩备份
gzip $BACKUP_FILE

# 删除7天前的备份
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE.gz"

# 数据库恢复脚本
#!/bin/bash
# restore.sh

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file>"
    exit 1
fi

# 解压备份
gunzip -c $BACKUP_FILE | docker exec -i postgres_container psql -U postgres -d myapp

echo "Database restored from $BACKUP_FILE"
```

## 监控和日志

### 1. 日志配置

```yaml
# docker-compose.logging.yml
version: '3.8'

services:
  app:
    image: myapp
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    labels:
      - "logging=enabled"

  # 日志收集服务
  fluentd:
    image: fluent/fluentd:v1.14-debian
    volumes:
      - ./fluentd.conf:/fluentd/etc/fluent.conf
      - /var/lib/docker/containers:/var/lib/docker/containers
```

### 2. 监控集成

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  # Prometheus
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  # Grafana
  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana

  # cAdvisor
  cadvisor:
    image: gcr.io/cadvisor/cadvisor
    ports:
      - "8080:8080"
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro

volumes:
  grafana_data:
```

## CI/CD 集成

### 1. GitHub Actions

```yaml
# .github/workflows/docker.yml
name: Build and Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v2

    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v1

    - name: Login to DockerHub
      if: github.event_name == 'push'
      uses: docker/login-action@v1
      with:
        username: ${{ secrets.DOCKERHUB_USERNAME }}
        password: ${{ secrets.DOCKERHUB_TOKEN }}

    - name: Build and push
      uses: docker/build-push-action@v2
      with:
        context: .
        file: ./Dockerfile.prod
        push: ${{ github.event_name == 'push' }}
        tags: |
          yourusername/myapp:latest
          yourusername/myapp:${{ github.sha }}
        cache-from: type=gha
        cache-to: type=gha,mode=max

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.event_name == 'push'

    steps:
    - name: Deploy to production
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /path/to/your/app
          docker-compose pull
          docker-compose up -d
          docker system prune -f
```

### 2. 自动化脚本

```bash
#!/bin/bash
# deploy.sh

set -e

echo "Starting deployment..."

# 拉取最新镜像
docker-compose pull

# 停止旧容器
docker-compose down

# 启动新容器
docker-compose up -d

# 等待服务启动
sleep 30

# 健康检查
if curl -f http://localhost:3000/health; then
    echo "Deployment successful!"
else
    echo "Deployment failed, rolling back..."
    docker-compose down
    docker-compose up -d --scale app=0
    exit 1
fi

# 清理未使用的镜像
docker image prune -f

echo "Deployment completed successfully!"
```

## 性能优化

### 1. 镜像大小优化

```dockerfile
# 使用 Alpine 基础镜像
FROM node:16-alpine

# 多阶段构建减少最终镜像大小
FROM node:16-alpine AS builder
# ... 构建过程 ...

FROM node:16-alpine AS runtime
COPY --from=builder /app/dist ./dist

# 清理不必要的包
RUN apk del .build-deps && \
    rm -rf /var/cache/apk/* && \
    npm cache clean --force

# 使用 .dockerignore 排除不必要文件
# 合理使用多阶段构建和层缓存
```

### 2. 资源限制

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    image: myapp
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
    restart: unless-stopped
    ulimits:
      nofile:
        soft: 65536
        hard: 65536
```

## 故障排除

### 1. 常用调试命令

```bash
# 查看容器日志
docker logs -f container_name
docker logs --tail=100 container_name

# 进入容器调试
docker exec -it container_name /bin/sh

# 查看容器资源使用
docker stats

# 查看容器详细信息
docker inspect container_name

# 查看镜像历史
docker history image_name

# 清理 Docker 资源
docker system prune -a
docker volume prune
```

### 2. 健康检查

```dockerfile
# 应用健康检查脚本
# healthcheck.js
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/health',
  method: 'GET',
  timeout: 2000
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

req.on('error', () => {
  process.exit(1);
});

req.on('timeout', () => {
  req.destroy();
  process.exit(1);
});

req.end();
```

## 总结

Docker 容器化的最佳实践：

1. **镜像优化**：使用多阶段构建、层缓存、Alpine 镜像
2. **安全配置**：非 root 用户、最小权限、定期更新
3. **资源管理**：合理设置资源限制、监控使用情况
4. **数据持久化**：使用数据卷、定期备份
5. **网络配置**：自定义网络、网络隔离
6. **CI/CD 集成**：自动化构建和部署
7. **监控日志**：完善的监控和日志系统

通过遵循这些最佳实践，你可以构建出高效、安全、可维护的容器化应用。

---

**相关工具：**
- [Docker 官方文档](https://docs.docker.com/)
- [容器编排工具](https://www.util.cn/tools/container-orchestrator/)
- [Docker 配置生成器](https://www.util.cn/tools/docker-config/)