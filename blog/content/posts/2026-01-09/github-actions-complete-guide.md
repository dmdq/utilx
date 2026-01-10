---
title: "GitHub Actions 实战指南：从入门到精通的完整CI/CD流水线"
summary: "深入讲解GitHub Actions的核心概念、工作流语法和最佳实践，帮助你构建高效的自动化CI/CD流水线。"
date: 2026-01-09T08:00:00+08:00
draft: false
tags: ["CI/CD", "GitHub Actions", "DevOps", "自动化", "持续集成"]
categories: ["DevOps"]
author: "有条工具团队"
---

GitHub Actions是GitHub提供的CI/CD平台，它让开发者能够直接在仓库中定义自动化工作流。本文将带你从零开始，构建一个完整的生产级CI/CD流水线。

## 一、核心概念

### 1.1 基本架构

```yaml
# .github/workflows/ci.yml
name: CI Pipeline  # 工作流名称

on:  # 触发条件
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:  # 作业定义
  build:
    runs-on: ubuntu-latest  # 运行环境

    steps:  # 步骤
      - name: Checkout代码
        uses: actions/checkout@v4

      - name: 设置Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: 安装依赖
        run: npm ci

      - name: 运行测试
        run: npm test

      - name: 构建项目
        run: npm run build
```

### 1.2 关键术语

- **Workflow（工作流）**：完整的自动化流程，包含多个Job
- **Job（作业）**：工作流中的独立任务，运行在指定的Runner上
- **Step（步骤）**：Job中的最小执行单元
- **Action（动作）**：可复用的Step，如checkout、setup-node
- **Runner（运行器）**：执行Job的服务器（GitHub托管或自托管）

## 二、构建多环境流水线

### 2.1 矩阵构建策略

```yaml
name: Multi-Environment Build

on:
  push:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x, 21.x]
        os: [ubuntu-latest, windows-latest, macos-latest]

    steps:
      - uses: actions/checkout@v4
      - name: 设置Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
      - run: npm ci
      - run: npm test

  build:
    needs: test
    runs-on: ubuntu-latest

    strategy:
      matrix:
        environment: [development, staging, production]

    steps:
      - uses: actions/checkout@v4
      - name: 构建Docker镜像
        run: |
          docker build -t myapp:${{ matrix.environment }} .
          docker tag myapp:${{ matrix.environment }} registry.example.com/myapp:${{ matrix.environment }}

      - name: 推送镜像
        if: matrix.environment == 'production'
        run: docker push registry.example.com/myapp:production
```

### 2.2 环境变量管理

```yaml
name: Environment Variables Demo

on: [push]

env:
  GLOBAL_VAR: "全局变量"
  NODE_ENV: production

jobs:
  deploy-dev:
    runs-on: ubuntu-latest
    env:
      ENVIRONMENT: development
      API_URL: https://dev-api.example.com

    steps:
      - name: 使用环境变量
        env:
          STEP_VAR: "步骤级别变量"
        run: |
          echo "全局: $GLOBAL_VAR"
          echo "作业级: $ENVIRONMENT"
          echo "步骤级: $STEP_VAR"
          echo "Secret: ${{ secrets.API_KEY }}"
```

## 三、Docker和Kubernetes部署

### 3.1 Docker镜像构建与推送

```yaml
name: Docker Build and Push

on:
  push:
    tags:
      - 'v*.*.*'

jobs:
  docker:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: 设置Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: 登录Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: 提取元数据
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: myorg/myapp
          tags: |
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha

      - name: 构建并推送
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

### 3.2 Kubernetes部署

```yaml
name: Deploy to Kubernetes

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: 配置kubectl
        uses: azure/k8s-set-context@v4
        with:
          method: kubeconfig
          kubeconfig: ${{ secrets.KUBE_CONFIG }}

      - name: 部署到Kubernetes
        uses: azure/k8s-deploy@v5
        with:
          manifests: |
            k8s/deployment.yaml
            k8s/service.yaml
          images: |
            myorg/myapp:${{ github.sha }}
          kubectl-version: 'latest'
```

## 四、自动化测试集成

### 4.1 单元测试和覆盖率

```yaml
name: Test with Coverage

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: 安装依赖
        run: npm ci

      - name: 运行测试并生成覆盖率
        run: npm run test:coverage

      - name: 上传覆盖率到Codecov
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella

      - name: 检查覆盖率阈值
        run: |
          COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
          if (( $(echo "$COVERAGE < 80" | bc -l) )); then
            echo "覆盖率不足80%"
            exit 1
          fi
```

### 4.2 E2E测试

```yaml
name: E2E Tests

on:
  push:
    branches: [main]
  schedule:
    - cron: '0 2 * * *'  # 每天凌晨2点运行

jobs:
  e2e:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    container:
      image: mcr.microsoft.com/playwright:v1.40.0

    steps:
      - uses: actions/checkout@v4

      - name: 安装依赖
        run: npm ci

      - name: 安装Playwright浏览器
        run: npx playwright install --with-deps

      - name: 运行E2E测试
        run: npm run test:e2e

      - name: 上传测试报告
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

## 五、高级技巧

### 5.1 缓存优化

```yaml
jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      # 缓存npm依赖
      - name: 缓存node_modules
        uses: actions/cache@v4
        id: npm-cache
        with:
          path: node_modules
          key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
          restore-keys: |
            ${{ runner.os }}-node-

      - name: 安装依赖
        if: steps.npm-cache.outputs.cache-hit != 'true'
        run: npm ci

      # 缓存Docker层
      - name: 缓存Docker层
        uses: actions/cache@v4
        with:
          path: /tmp/.buildx-cache
          key: ${{ runner.os }}-buildx-${{ github.sha }}
          restore-keys: |
            ${{ runner.os }}-buildx-
```

### 5.2 并行作业管理

```yaml
jobs:
  # 并行运行独立任务
  lint:
    runs-on: ubuntu-latest
    steps:
      - run: npm run lint

  type-check:
    runs-on: ubuntu-latest
    steps:
      - run: npm run type-check

  unit-test:
    runs-on: ubuntu-latest
    steps:
      - run: npm run test:unit

  # 等待所有任务完成后部署
  deploy:
    needs: [lint, type-check, unit-test]
    runs-on: ubuntu-latest
    if: success()
    steps:
      - run: npm run deploy
```

### 5.3 复杂条件控制

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    if: |
      github.event_name == 'push' &&
      github.ref == 'refs/heads/main' &&
      !contains(github.event.head_commit.message, '[skip-ci]')

    steps:
      - name: 部署条件检查
        run: |
          echo "事件名: ${{ github.event_name }}"
          echo "分支: ${{ github.ref }}"
          echo "提交信息: ${{ github.event.head_commit.message }}"

      # 仅在特定文件变化时执行
      - name: 检查源码变化
        id: changes
        uses: dorny/paths-filter@v2
        with:
          filters: |
            src:
              - 'src/**'
              - 'package.json'

      - name: 部署
        if: steps.changes.outputs.src == 'true'
        run: npm run deploy
```

## 六、安全最佳实践

### 6.1 Secret管理

```yaml
# ❌ 错误：直接在日志中暴露Secret
- name: 不安全的操作
  run: echo "API_KEY=${{ secrets.API_KEY }}"

# ✅ 正确：使用环境变量
- name: 安全的操作
  env:
    API_KEY: ${{ secrets.API_KEY }}
  run: |
    node script.js
    # 脚本内部读取process.env.API_KEY

# ✅ 使用GitHub Secrets存储敏感信息
# Settings → Secrets and variables → Actions → New repository secret
```

### 6.2 依赖扫描

```yaml
name: Security Scan

on:
  push:
    branches: [main]
  schedule:
    - cron: '0 0 * * 0'  # 每周日扫描

jobs:
  security:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      # npm audit
      - name: 运行npm audit
        run: npm audit --audit-level=moderate
        continue-on-error: true

      # Snyk安全扫描
      - name: Snyk安全测试
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

      # CodeQL分析
      - name: 初始化CodeQL
        uses: github/codeql-action/init@v3
        with:
          languages: javascript, typescript

      - name: 执行CodeQL分析
        uses: github/codeql-action/analyze@v3
```

## 七、性能优化

### 7.1 工作流优化技巧

```yaml
# 使用GITHUB_TOKEN替代个人访问令牌
- name: 配置Git
  run: |
    git config user.name "GitHub Actions Bot"
    git config user.email "bot@github.com"

# 使用actions/github-script进行API调用
- name: 创建Release
  uses: actions/github-script@v7
  with:
    script: |
      github.rest.repos.createRelease({
        owner: context.repo.owner,
        repo: context.repo.repo,
        tag_name: 'v${{ github.run_number }}',
        name: 'Release ${{ github.run_number }}',
        body: ' Automated release',
        draft: false,
        prerelease: false
      })

# 并行矩阵策略
strategy:
  fail-fast: false  # 一个失败不影响其他
  matrix:
    node: [18, 20]
    os: [ubuntu-latest]
  max-parallel: 4  # 最多并行4个job
```

## 八、监控和通知

### 8.1 Slack通知

```yaml
name: Deploy with Notification

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: 部署应用
        id: deploy
        run: |
          npm run deploy
          echo "status=success" >> $GITHUB_OUTPUT

      - name: Slack通知
        if: always()
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "部署${{ job.status }}",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*部署通知*\n*状态:* ${{ job.status }}\n*分支:* ${{ github.ref }}\n*提交:* ${{ github.sha }}\n*作者:* ${{ github.actor }}"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

## 总结

GitHub Actions提供了强大而灵活的CI/CD能力：

1. **核心价值**：与GitHub深度集成，配置简单，功能强大
2. **最佳实践**：使用矩阵策略、缓存优化、并行作业提升性能
3. **安全第一**：正确管理Secrets，定期进行安全扫描
4. **持续改进**：收集构建数据，不断优化流水线

通过合理使用GitHub Actions，你可以将重复性工作自动化，让团队更专注于核心业务逻辑的开发。
