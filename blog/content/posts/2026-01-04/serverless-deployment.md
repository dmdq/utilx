---
title: "Serverless架构与前端部署：现代化部署策略"
slug: "serverless-deployment"
date: 2026-01-04T19:00:00+08:00
draft: false
author: "技术团队"
description: "深入探讨Serverless架构在前端部署中的应用，包括Vercel、Netlify、Cloudflare等平台的使用实践，以及CI/CD流程的配置"
tags: ["Serverless", "前端部署", "CI/CD", "Vercel", "Netlify"]
categories: ["前端技术", "部署"]
---

## Serverless架构概述

Serverless架构让开发者无需管理服务器即可部署应用，主要优势包括：

1. **按需付费** - 只为实际使用的资源付费
2. **自动扩展** - 根据流量自动调整
3. **零运维** - 无需管理服务器
4. **全球CDN** - 内容分发网络加速

## Vercel部署

### 项目配置

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".output/public",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nuxt",
  "regions": ["hkg1", "sin1"],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/:path*"
    }
  ]
}
```

### 环境变量

```bash
# 在Vercel控制台设置环境变量
# 或通过vercel CLI
vercel env add DATABASE_URL production
vercel env add API_KEY production
```

### Serverless函数

```javascript
// api/hello.js
export default function handler(req, res) {
  const { name } = req.query

  res.status(200).json({
    message: `Hello ${name || 'World'}!`,
    timestamp: Date.now()
  })
}

// api/users/[id].js
export default function handler(req, res) {
  const { id } = req.query

  switch (req.method) {
    case 'GET':
      res.status(200).json({ id, name: `User ${id}` })
      break
    case 'PUT':
      res.status(200).json({ id, ...req.body })
      break
    default:
      res.setHeader('Allow', ['GET', 'PUT'])
      res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
```

## Netlify部署

### netlify.toml配置

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[functions]
  directory = "netlify/functions"

[[plugins]]
  package = "@netlify/plugin-lighthouse"
```

### Netlify Functions

```javascript
// netlify/functions/hello.js
exports.handler = async (event, context) => {
  const { name } = event.queryStringParameters || {}

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: `Hello ${name || 'World'}!`
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  }
}

// netlify/functions/users/[id].js
exports.handler = async (event, context) => {
  const { id } = event.pathParameters

  switch (event.httpMethod) {
    case 'GET':
      return {
        statusCode: 200,
        body: JSON.stringify({ id, name: `User ${id}` })
      }
    default:
      return {
        statusCode: 405,
        body: 'Method Not Allowed'
      }
  }
}
```

## Cloudflare Workers

### Worker配置

```javascript
// worker.js
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)

    // API路由
    if (url.pathname.startsWith('/api/')) {
      return handleAPI(request, env)
    }

    // 静态资源
    return env.ASSETS.fetch(request)
  }
}

async function handleAPI(request, env) {
  const url = new URL(request.url)
  const path = url.pathname.replace('/api/', '')

  switch (path) {
    case 'hello':
      return new Response(JSON.stringify({
        message: 'Hello from Cloudflare!'
      }), {
        headers: { 'Content-Type': 'application/json' }
      })
    default:
      return new Response('Not Found', { status: 404 })
  }
}
```

### wrangler.toml配置

```toml
name = "my-worker"
main = "worker.js"
compatibility_date = "2024-01-01"

[env.production]
routes = [
  { pattern = "https://example.com/api/*", zone_name = "example.com" }
]

[env.production.vars]
ENVIRONMENT = "production"
API_URL = "https://api.example.com"

[[env.production.kv_namespaces]]
binding = "KV"
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

## CI/CD配置

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

  deploy-vercel:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'

  deploy-netlify:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Netlify
        uses: nwtgck/actions-netlify@v1.2
        with:
          publish-dir: './dist'
          production-branch: main
          github-token: ${{ secrets.GITHUB_TOKEN }}
          deploy-message: "Deploy from GitHub Actions"
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

### GitLab CI

```yaml
# .gitlab-ci.yml
stages:
  - test
  - build
  - deploy

test:
  stage: test
  image: node:18
  script:
    - npm ci
    - npm test

build:
  stage: build
  image: node:18
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist

deploy:
  stage: deploy
  image: node:18
  script:
    - npm install -g vercel
    - vercel --prod --token=$VERCEL_TOKEN
  only:
    - main
```

## Docker部署

### Dockerfile

```dockerfile
# 多阶段构建
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# 生产镜像
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY --from=builder /app/.output ./.output

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
```

## 性能优化

### CDN配置

```javascript
// nuxt.config.ts
export default defineNuxtConfig({
  app: {
    cdnURL: 'https://cdn.example.com'
  },
  nitro: {
    routeRules: {
      '/': { cache: { maxAge: 3600 } },
      '/api/**': { cache: { maxAge: 60 } },
      '/_nuxt/**': { cache: { maxAge: 31536000 } }
    }
  }
})
```

### 图片优化

```vue
<script setup>
// 使用Nuxt Image组件
import { NuxtImg } from '#components'
</script>

<template>
  <NuxtImg
    src="/image.jpg"
    width="500"
    height="300"
    format="webp"
    loading="lazy"
    placeholder
  />
</template>
```

## 监控和日志

### 性能监控

```javascript
// 服务端性能追踪
export default defineEventHandler(async (event) => {
  const start = Date.now()

  // 处理请求
  const result = await fetchData()

  const duration = Date.now() - start

  // 上报性能数据
  $fetch('/api/analytics', {
    method: 'POST',
    body: {
      path: event.path,
      duration,
      timestamp: Date.now()
    }
  })

  return result
})
```

### 错误追踪

```javascript
// 集成Sentry
import * as Sentry from '@sentry/node'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.2
})

export default defineEventHandler(async (event) => {
  try {
    return await fetchData()
  } catch (error) {
    Sentry.captureException(error)
    throw error
  }
})
```

## 最佳实践

1. **自动化部署** - 使用CI/CD自动部署
2. **环境隔离** - 区分开发、测试、生产环境
3. **监控告警** - 设置性能和错误监控
4. **备份策略** - 定期备份重要数据
5. **灾难恢复** - 准备回滚方案

## 总结

Serverless架构为前端部署提供了灵活、高效的解决方案。通过合理选择平台和配置CI/CD流程，可以显著提升部署效率和应用的稳定性。
