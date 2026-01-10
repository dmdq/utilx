---
title: "端到端自动化测试实战：从Cypress到Playwright的完整测试方案"
summary: "深入探讨E2E测试的最佳实践，对比Cypress和Playwright两大框架，提供完整的测试策略、数据管理和CI/CD集成方案。"
date: 2026-01-09T12:00:00+08:00
draft: false
tags: ["E2E测试", "Cypress", "Playwright", "自动化测试", "测试策略"]
categories: ["测试开发"]
author: "有条工具团队"
---

端到端测试是保证Web应用质量的关键环节。本文将详细介绍如何构建可靠、快速、易维护的E2E测试体系。

## 一、E2E测试基础

### 1.1 为什么需要E2E测试

```typescript
// 测试金字塔
/*
         /\
        /E2E\      10% - 慢但全面
       /------\
      / 集成  \    30% - 适中
     /----------\
    /   单元测试   \ 60% - 快但局限
   /--------------\
*/

// E2E测试的价值
✅ 验证用户场景
✅ 测试系统集成
✅ 发现集成问题
✅ 提供用户视角

// E2E测试的挑战
❌ 执行慢
❌ 维护成本高
❌ 容易flaky（不稳定）
❌ 调试困难
```

### 1.2 测试策略

```typescript
// 何时编写E2E测试
const testStrategy = {
  // ✅ 应该测试
  criticalUserPaths: [
    '用户注册流程',
    '购物车结算',
    '支付流程',
    '核心业务功能'
  ],

  // ❌ 不应该测试
  avoid: [
    'UI样式细节',      // 应该用视觉测试
    '第三方功能',       // 应该mock
    '边界情况',         // 应该用单元测试
    '性能测试'          // 应该用性能工具
  ]
}
```

## 二、框架对比

### 2.1 Cypress vs Playwright

| 特性 | Cypress | Playwright |
|------|---------|------------|
| 性能 | 较慢 | 更快 |
| 浏览器支持 | Chrome家族 | Chrome、Firefox、Safari、Edge |
| 并行执行 | 需付费 | 内置免费 |
| 多标签页 | 不支持 | 原生支持 |
| 移动测试 | 有限 | 支持 |
| 学习曲线 | 陡峭 | 平缓 |
| 调试体验 | 优秀 | 良好 |
| 社区生态 | 成熟 | 快速成长 |

### 2.2 快速入门

```typescript
// Cypress安装
npm install -D cypress

// cypress.config.ts
import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: false,
    video: false,
    screenshotOnRunFailure: true
  }
})

// cypress/e2e/example.cy.ts
describe('登录测试', () => {
  it('成功登录', () => {
    cy.visit('/login')
    cy.get('[data-testid="email"]').type('user@example.com')
    cy.get('[data-testid="password"]').type('password123')
    cy.get('[data-testid="submit"]').click()

    cy.url().should('include', '/dashboard')
    cy.contains('欢迎回来')
  })
})

// Playwright安装
npm install -D @playwright/test

// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],
})

// e2e/example.spec.ts
import { test, expect } from '@playwright/test'

test('成功登录', async ({ page }) => {
  await page.goto('/login')
  await page.fill('[data-testid="email"]', 'user@example.com')
  await page.fill('[data-testid="password"]', 'password123')
  await page.click('[data-testid="submit"]')

  await expect(page).toHaveURL(/.*dashboard/)
  await expect(page.locator('text=欢迎回来')).toBeVisible()
})
```

## 三、测试设计模式

### 3.1 Page Object Model

```typescript
// pages/LoginPage.ts (Playwright)
export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/login')
  }

  async login(email: string, password: string) {
    await this.page.fill('[data-testid="email"]', email)
    await this.page.fill('[data-testid="password"]', password)
    await this.page.click('[data-testid="submit"]')
  }

  async expectDashboard() {
    await expect(this.page).toHaveURL(/.*dashboard/)
  }

  async getErrorMessage() {
    return await this.page.textContent('[data-testid="error"]')
  }
}

// 使用POM编写测试
import { test } from '@playwright/test'
import { LoginPage } from './pages/LoginPage'

test('登录流程', async ({ page }) => {
  const loginPage = new LoginPage(page)

  await loginPage.goto()
  await loginPage.login('user@example.com', 'wrongpass')

  const error = await loginPage.getErrorMessage()
  expect(error).toContain('密码错误')
})
```

### 3.2 测试数据管理

```typescript
// fixtures/test-data.ts
export const testUsers = {
  validUser: {
    email: 'test@example.com',
    password: 'Test123!',
    name: 'Test User'
  },
  adminUser: {
    email: 'admin@example.com',
    password: 'Admin123!',
    name: 'Admin User'
  }
}

export const testProducts = [
  { id: 1, name: '商品A', price: 100 },
  { id: 2, name: '商品B', price: 200 }
]

// 使用工厂模式
class UserFactory {
  static create(overrides = {}) {
    return {
      email: `test${Date.now()}@example.com`,
      password: 'Test123!',
      name: 'Test User',
      ...overrides
    }
  }

  static createAdmin(overrides = {}) {
    return this.create({
      email: 'admin@example.com',
      role: 'admin',
      ...overrides
    })
  }
}

// 测试中使用
import { test } from '@playwright/test'
import { UserFactory } from './fixtures/UserFactory'

test('用户注册', async ({ page }) => {
  const user = UserFactory.create()

  await page.goto('/register')
  await page.fill('[name="email"]', user.email)
  await page.fill('[name="password"]', user.password)
  await page.click('[type="submit"]')

  await expect(page).toHaveURL(/.*login/)
})
```

### 3.3 测试隔离

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  use: {
    // 每个测试独立的存储
    storageState: `auth-state.json`,
  },
})

// 测试级别隔离
import { test as base } from '@playwright/test'

// 认证fixture
export const test = base.extend<{
  authenticatedPage: Page
}>({
  authenticatedPage: async ({ page }, use) => {
    // 每次测试前登录
    await page.goto('/login')
    await page.fill('[data-testid="email"]', 'test@example.com')
    await page.fill('[data-testid="password"]', 'password123')
    await page.click('[data-testid="submit"]')

    await page.waitForURL('/dashboard')
    await use(page)

    // 测试后清理
    await page.context().clearCookies()
  }
})

// 使用
test('测试需要认证的功能', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/profile')
  await expect(authenticatedPage.locator('[data-testid="username"]'))
    .toHaveText('test@example.com')
})
```

## 四、高级测试场景

### 4.1 API测试

```typescript
// e2e/api/api.spec.ts
import { test, expect } from '@playwright/test'

test('GET /api/users', async ({ request }) => {
  const response = await request.get('/api/users')

  expect(response.status()).toBe(200)

  const body = await response.json()
  expect(body).toHaveProperty('users')
  expect(body.users).toBeInstanceOf(Array)
})

test('POST /api/users - 创建用户', async ({ request }) => {
  const userData = {
    email: 'test@example.com',
    password: 'Test123!',
    name: 'Test User'
  }

  const response = await request.post('/api/users', {
    data: userData
  })

  expect(response.status()).toBe(201)

  const body = await response.json()
  expect(body).toMatchObject({
    user: {
      email: userData.email,
      name: userData.name
    }
  })
})

test('API错误处理', async ({ request }) => {
  const response = await request.post('/api/users', {
    data: {
      email: 'invalid-email',
      password: '123'
    }
  })

  expect(response.status()).toBe(400)

  const body = await response.json()
  expect(body).toHaveProperty('error')
})
```

### 4.2 文件上传测试

```typescript
// e2e/upload.spec.ts
import { test, expect } from '@playwright/test'

test('图片上传', async ({ page }) => {
  await page.goto('/upload')

  // 创建测试文件
  const file = new File(['test content'], 'test.png', {
    type: 'image/png'
  })

  // 上传文件
  const input = page.locator('input[type="file"]')
  await input.setInputFiles({
    name: 'file',
    mimeType: 'image/png',
    buffer: await file.arrayBuffer()
  })

  // 验证上传
  await expect(page.locator('.upload-success')).toBeVisible()

  // 验证文件内容
  const uploadedContent = await page.locator('.file-content').textContent()
  expect(uploadedContent).toBe('test content')
})

test('多文件上传', async ({ page }) => {
  await page.goto('/upload')

  const files = [
    new File(['file1'], 'file1.txt', { type: 'text/plain' }),
    new File(['file2'], 'file2.txt', { type: 'text/plain' })
  ]

  await page.locator('input[type="file"][multiple]')
    .setInputFiles(
      files.map(f => ({
        name: f.name,
        mimeType: f.type,
        buffer: f.arrayBuffer()
      }))
    )

  // 验证多个文件都上传成功
  await expect(page.locator('.file-list .file-item'))
    .toHaveCount(2)
})
```

### 4.3 WebSocket测试

```typescript
// e2e/websocket.spec.ts
import { test, expect } from '@playwright/test'

test('WebSocket连接', async ({ page }) => {
  // 监听WebSocket消息
  const wsMessages: string[] = []

  page.on('websocket', ws => {
    ws.on('framereceived', frame => {
      wsMessages.push(frame.payload())
    })
  })

  await page.goto('/chat')

  // 发送消息
  await page.fill('[data-testid="message"]', 'Hello WebSocket')
  await page.click('[data-testid="send"]')

  // 验证收到响应
  await page.waitForTimeout(1000)
  expect(wsMessages).toContain('Message received: Hello WebSocket')
})

test('实时更新测试', async ({ page }) => {
  // 连接WebSocket
  const ws = page.waitForWebSocket('ws://localhost:8080')

  // 监听服务器推送
  page.on('websocket', ws => {
    ws.on('framereceived', async frame => {
      const data = JSON.parse(frame.payload())

      // 更新UI
      await page.evaluate((data) => {
        window.updateUI(data)
      }, data)
    })
  })

  await page.goto('/dashboard')

  // 模拟服务器推送
  const client = await ws
  client.send(JSON.stringify({
    type: 'update',
    data: { status: 'active' }
  }))

  // 验证UI更新
  await expect(page.locator('[data-testid="status"]'))
    .toHaveText('active')
})
```

### 4.4 网络拦截和Mock

```typescript
// e2e/network-mock.spec.ts
import { test, expect } from '@playwright/test'

test('Mock API响应', async ({ page }) => {
  // 拦截API请求
  await page.route('**/api/users', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        users: [
          { id: 1, name: 'Mock User 1' },
          { id: 2, name: 'Mock User 2' }
        ]
      })
    })
  })

  await page.goto('/users')

  // 验证使用了mock数据
  await expect(page.locator('.user-item')).toHaveCount(2)
  await expect(page.locator('.user-item').first)
    .toContainText('Mock User 1')
})

test('测试错误场景', async ({ page }) => {
  // Mock API错误
  await page.route('**/api/users', route => {
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({
        error: 'Internal Server Error'
      })
    })
  })

  await page.goto('/users')

  // 验证错误处理
  await expect(page.locator('.error-message'))
    .toContainText('服务器错误，请稍后重试')
})

test('慢速网络模拟', async ({ page }) => {
  // 模拟3G网络
  await page.context().setOffline(false)
  await page.route('**/*', route => {
    return route.continue({
      // 延迟500ms
      latency: 500,
      // 下载速度100KB/s
      downloadSpeed: 100 * 1024
    })
  })

  await page.goto('/')

  // 验证加载状态
  await expect(page.locator('.loading-spinner')).toBeVisible()

  await expect(page.locator('.content'))
    .toBeVisible({ timeout: 10000 })
})
```

## 五、视觉回归测试

### 5.1 截图对比

```typescript
// e2e/visual.spec.ts
import { test, expect } from '@playwright/test'

test('首页视觉回归', async ({ page }) => {
  await page.goto('/')

  // 截图对比
  await expect(page).toHaveScreenshot('homepage.png', {
    maxDiffPixels: 100,
    threshold: 0.2
  })
})

test('组件视觉测试', async ({ page }) => {
  await page.goto('/components/button')

  const button = page.locator('[data-testid="primary-button"]')

  // 组件截图
  await expect(button).toHaveScreenshot('button-primary.png', {
    animations: 'disabled'
  })
})

test('多设备视觉测试', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 }) // iPhone
  await page.goto('/')
  await expect(page).toHaveScreenshot('homepage-mobile.png')

  await page.setViewportSize({ width: 1920, height: 1080 }) // Desktop
  await expect(page).toHaveScreenshot('homepage-desktop.png')
})
```

### 5.2 Storybook集成

```typescript
// test/storybook.test.ts
import { test, expect } from '@playwright/test'
import { composeStories } from '@storybook/testing-vue'
import * as stories from '../components/Button.stories'

const { Default, Large, Small } = composeStories(stories)

test('Button视觉测试', async ({ page }) => {
  await page.goto('/iframe.html?id=button--default')

  await expect(page.locator('#root')).toHaveScreenshot('button-default.png')
})

test('Button状态测试', async ({ page }) => {
  await page.goto('/iframe.html?id=button--default')

  const button = page.locator('#root button')

  // hover状态
  await button.hover()
  await expect(page.locator('#root')).toHaveScreenshot('button-hover.png')

  // active状态
  await button.click()
  await expect(page.locator('#root')).toHaveScreenshot('button-active.png')
})
```

## 六、性能测试

### 6.1 页面加载性能

```typescript
// e2e/performance.spec.ts
import { test, expect } from '@playwright/test'

test('页面性能指标', async ({ page }) => {
  // 开始性能追踪
  await page.goto('/')

  const metrics = await page.evaluate(() => {
    const timing = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming

    return {
      // DNS查询时间
      dns: timing.domainLookupEnd - timing.domainLookupStart,

      // TCP连接时间
      tcp: timing.connectEnd - timing.connectStart,

      // 请求响应时间
      ttfb: timing.responseStart - timing.requestStart,

      // DOM解析时间
      domParse: timing.domContentLoadedEventEnd - timing.responseEnd,

      // 完整加载时间
      load: timing.loadEventEnd - timing.navigationStart
    }
  })

  // 验证性能指标
  expect(metrics.ttfb).toBeLessThan(600) // 首字节时间<600ms
  expect(metrics.domParse).toBeLessThan(2000) // DOM解析<2s
  expect(metrics.load).toBeLessThan(3000) // 完整加载<3s
})

test('Core Web Vitals', async ({ page }) => {
  await page.goto('/')

  // 使用Web Vitals库
  const vitals = await page.evaluate(async () => {
    const { getCLS, getFID, getFCP, getLCP, getTTFB } = await import('web-vitals')

    return new Promise((resolve) => {
      const results = {}

      getCLS((metric) => { results.cls = metric.value })
      getFID((metric) => { results.fid = metric.value })
      getFCP((metric) => { results.fcp = metric.value })
      getLCP((metric) => { results.lcp = metric.value })
      getTTFB((metric) => { results.ttfb = metric.value })

      setTimeout(() => resolve(results), 5000)
    })
  })

  // 验证Core Web Vitals
  expect(vitals.fid).toBeLessThan(100) // 首次输入延迟<100ms
  expect(vitals.cls).toBeLessThan(0.1) // 累积布局偏移<0.1
})
```

### 6.2 资源加载分析

```typescript
test('资源优化验证', async ({ page, context }) => {
  // 监控所有资源
  const resources: any[] = []

  page.on('response', async (response) => {
    const url = response.url()
    const status = response.status()

    if (url.startsWith('http')) {
      resources.push({
        url,
        status,
        type: response.request().resourceType(),
        size: (await response.body()).length
      })
    }
  })

  await page.goto('/')

  // 验证资源
  const images = resources.filter(r => r.type === 'image')
  const scripts = resources.filter(r => r.type === 'script')
  const stylesheets = resources.filter(r => r.type === 'stylesheet')

  // 检查图片优化
  for (const img of images) {
    expect(img.size).toBeLessThan(200 * 1024) // <200KB
  }

  // 检查脚本压缩
  for (const script of scripts) {
    expect(script.url).toMatch(/\.min\.js$/)
  }

  // 检查资源总数
  expect(resources.length).toBeLessThan(50)
})
```

## 七、CI/CD集成

### 7.1 GitHub Actions配置

```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on:
  push:
    branches: [main]
  pull_request:
  schedule:
    - cron: '0 2 * * *'  # 每天凌晨2点

jobs:
  e2e:
    timeout-minutes: 60
    runs-on: ubuntu-latest

    strategy:
      fail-fast: false
      matrix:
        shard: [1, 2, 3, 4]
        project: [chromium, firefox]

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps ${{ matrix.project }}

      - name: Build application
        run: npm run build

      - name: Run E2E tests
        run: npx playwright test --project=${{ matrix.project }} --shard=${{ matrix.shard }}/4

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report-${{ matrix.project }}-{{ matrix.shard }}
          path: playwright-report/
          retention-days: 30

      - name: Upload screenshots
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: screenshots-${{ matrix.project }}-{{ matrix.shard }}
          path: test-results/
          retention-days: 7
```

### 7.2 GitLab CI配置

```yaml
# .gitlab-ci.yml
e2e-tests:
  stage: test
  image: mcr.microsoft.com/playwright:v1.40.0

  variables:
    PLAYWRIGHT_BROWSERS_PATH: /ms-playwright

  cache:
    key: ${CI_COMMIT_REF_SLUG}
    paths:
      - node_modules/
      - .cache/ms-playwright

  before_script:
    - npm ci
    - npx playwright install --with-deps

  script:
    - npm run build
    - npx playwright test

  artifacts:
    when: always
    paths:
      - playwright-report/
      - test-results/
    expire_in: 30 days

  parallel:
    matrix:
      - SHARD: 1
      - SHARD: 2
      - SHARD: 3
      - SHARD: 4
  script:
    - npx playwright test --shard=$SHARD/4

  rules:
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'
    - if: '$CI_COMMIT_BRANCH == "main"'
```

## 八、最佳实践

### 8.1 编写可靠测试

```typescript
// ✅ 好的实践
test('可靠的登录测试', async ({ page }) => {
  // 1. 使用data-testid选择器
  await page.goto('/login')

  // 2. 等待元素可见
  await page.waitForSelector('[data-testid="email"]')

  // 3. 逐步填充表单
  await page.fill('[data-testid="email"]', 'test@example.com')
  await page.fill('[data-testid="password"]', 'password123')

  // 4. 点击提交
  await page.click('[data-testid="submit"]')

  // 5. 等待结果（使用明确的断言）
  await page.waitForURL(/.*dashboard/)

  // 6. 验证多个条件
  await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
  await expect(page.locator('text=欢迎回来')).toBeVisible()
})

// ❌ 避免的做法
test('脆弱的登录测试', async ({ page }) => {
  // ❌ 不要使用CSS选择器
  await page.click('.btn-primary')  // 容易随样式变化

  // ❌ 不要使用固定的timeout
  await page.waitForTimeout(3000)  // 浪费时间，不可靠

  // ❌ 不要链式调用（难以调试）
  await page.goto('/login')
    .then(() => page.fill('#email', 'test'))
    .then(() => page.click('#submit'))

  // ❌ 不要假设页面状态
  await expect(page.locator('.success')).toBeVisible()  // 可能还没渲染
})
```

### 8.2 减少测试脆弱性

```typescript
// playwright.config.ts
export default defineConfig({
  use: {
    // 增加默认超时
    actionTimeout: 10000,
    navigationTimeout: 30000,

    // 等待网络稳定
    waitUntil: 'networkidle',

    // 追踪失败
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  }
})

// 测试中使用重试
import { test, expect } from '@playwright/test'

test('带有重试的测试', async ({ page }) => {
  test.setTimeout(60000)  // 增加测试超时

  // 使用可重试的定位器
  await expect(async () => {
    const element = await page.locator('.dynamic-content').first()
    await element.waitFor({ state: 'visible' })
    await expect(element).toContainText('Expected text')
  }).toPass({
    intervals: [1000, 2000, 5000],  // 重试间隔
    timeout: 10000  // 总超时时间
  })
})
```

### 8.3 测试组织

```typescript
// 使用测试套件组织
import { test, describe } from '@playwright/test'

describe('购物车功能', () => {
  describe('添加商品', () => {
    test.beforeEach(async ({ page }) => {
      // 每个测试前清空购物车
      await page.goto('/cart')
      await page.click('[data-testid="clear-cart"]')
    })

    test('添加单个商品', async ({ page }) => {
      await page.goto('/product/1')
      await page.click('[data-testid="add-to-cart"]')

      await page.goto('/cart')
      await expect(page.locator('[data-testid="cart-count"]'))
        .toHaveText('1')
    })

    test('添加多个商品', async ({ page }) => {
      const products = [1, 2, 3]

      for (const id of products) {
        await page.goto(`/product/${id}`)
        await page.click('[data-testid="add-to-cart"]')
      }

      await page.goto('/cart')
      await expect(page.locator('[data-testid="cart-count"]'))
        .toHaveText('3')
    })
  })

  describe('结算流程', () => {
    test('完整结算', async ({ page }) => {
      await page.goto('/product/1')
      await page.click('[data-testid="add-to-cart"]')
      await page.goto('/cart')
      await page.click('[data-testid="checkout"]')

      // 填写结算信息
      await page.fill('[name="name"]', 'Test User')
      await page.fill('[name="address"]', 'Test Address')
      await page.fill('[name="card"]', '4111111111111111')

      await page.click('[data-testid="place-order"]')

      // 验证订单成功
      await expect(page.locator('[data-testid="order-success"]'))
        .toBeVisible()
    })
  })
})
```

## 总结

构建可靠的E2E测试体系需要注意：

1. **测试策略**：聚焦核心用户路径
2. **框架选择**：Cypress或Playwright
3. **测试设计**：POM、数据管理、隔离
4. **高级场景**：API、文件、WebSocket
5. **视觉回归**：截图对比、Storybook
6. **性能监控**：Core Web Vitals
7. **CI/CD集成**：自动化运行
8. **最佳实践**：减少脆弱性、良好组织

记住：E2E测试应该是测试金字塔的顶端，数量虽少但价值巨大！
