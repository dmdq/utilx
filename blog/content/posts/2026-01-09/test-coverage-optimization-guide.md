---
title: '2025年测试覆盖率优化完全指南：从0%到100%的实践路径与工具配置'
description: '深入探讨测试覆盖率优化的完整路径，从理解覆盖率指标、选择合适的测试策略、配置主流测试工具，到实施TDD/BDD方法论，结合实际案例展示如何从0%到100%提升测试覆盖率，构建高质量的测试体系。'
publishedTime: '2025-01-09T17:00:00.000Z'
authors:
  - name: 'Util Team'
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Util'
  - name: 'Claude'
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Claude'
category: '自动化测试'
categorySlug: 'automated-testing'
tags:
  - '测试覆盖率'
  - '单元测试'
  - '集成测试'
  - 'TDD'
  - 'BDD'
  - 'Vitest'
  - 'Jest'
  - 'Cypress'
  - '代码质量'
---

## 前言

测试覆盖率是衡量代码质量的重要指标，但追求高覆盖率不应该成为目标本身。真正的目标是构建可靠、可维护的测试体系，既能保证代码质量，又不会成为开发负担。

本文将带您从零开始，系统性地构建完整的测试体系，从理解测试金字塔到配置工具，从编写有效测试到优化覆盖率策略。

## 一、理解测试覆盖率

### 1.1 覆盖率类型

#### 语句覆盖率（Statement Coverage）

```typescript
function calculateDiscount(price: number, isMember: boolean): number {
  let discount = 0

  if (isMember) {        // 语句1
    discount = 0.1       // 语句2
  }

  if (price > 1000) {     // 语句3
    discount += 0.05     // 语句4
  }

  return price * (1 - discount)  // 语句5
}

// 测试用例1: isMember=true, price=500
// 执行语句: 1, 2, 3, 5
// 语句覆盖率: 4/5 = 80% (语句4未执行)
```

#### 分支覆盖率（Branch Coverage）

```typescript
function validateInput(value: string | null): boolean {
  if (value === null) {      // 分支1
    return false
  }

  if (value.length > 0) {    // 分支2
    return true
  } else {                   // 分支3
    return false
  }
}

// 分支总数: 3
// 需要的测试用例:
// 1. value = null  → 覆盖分支1
// 2. value = "test" → 覆盖分支2 (true)
// 3. value = ""  → 覆盖分支3 (false)
```

#### 函数覆盖率（Function Coverage）

```typescript
export class UserService {
  create(user: User) { /* ... */ }
  update(id: string, user: User) { /* ... */ }
  delete(id: string) { /* ... */ }
  findById(id: string) { /* ... */ }
}

// 测试只调用了 create 和 findById
// 函数覆盖率: 2/4 = 50%
```

#### 行覆盖率（Line Coverage）

```typescript
function processData(data: number[]) {
  const result = data
    .filter(x => x > 0)     // 行1
    .map(x => x * 2)        // 行2
    .reduce((a, b) => a + b, 0)  // 行3

  return result              // 行4
}

// 如果测试输入: [1, 2, 3]
// 执行行: 1, 2, 3, 4
// 行覆盖率: 100%
```

### 1.2 覆盖率指标解读

```json
{
  "percent": 85.5,
  "covered": "342",
  "total": "400",
  "statements": { "pct": 85.5, "covered": 342, "total": 400 },
  "branches": { "pct": 78.2, "covered": 120, "total": 153 },
  "functions": { "pct": 92.1, "covered": 47, "total": 51 },
  "lines": { "pct": 84.8, "covered": 335, "total": 395 }
}
```

**指标分析：**
- **整体覆盖率 85.5%**：良好水平
- **分支覆盖率 78.2%**：需要关注，存在未测试的条件分支
- **函数覆盖率 92.1%**：优秀，大部分函数都有测试
- **行覆盖率 84.8%**：与语句覆盖率接近，正常

### 1.3 合理的覆盖率目标

| 项目类型 | 推荐覆盖率 | 说明 |
|---------|----------|------|
| 核心业务逻辑 | 90-100% | 关键路径必须充分测试 |
| 工具库/框架 | 95-100% | 高质量要求 |
| Web 应用 | 80-90% | 平衡质量和效率 |
| 原型项目 | 60-70% | 快速迭代为主 |
| 遗留系统 | 70-80% | 逐步提升 |

## 二、测试金字塔策略

### 2.1 理解测试金字塔

```
              /\
             /  \
            / E2E\       少量端到端测试
           /------\      (10%) - 慢但真实
          /        \
         /Integration\   中量集成测试
        /------------\   (30%) - 中等速度
       /              \
      /   Unit Tests   \  大量单元测试
     /------------------\ (60%) - 快速隔离
```

### 2.2 各层测试的特点

#### 单元测试（Unit Tests）

```typescript
// 示例：测试纯函数
import { describe, it, expect } from 'vitest'

function calculateTax(price: number, rate: number): number {
  return price * rate
}

describe('calculateTax', () => {
  it('should calculate tax correctly for positive values', () => {
    expect(calculateTax(100, 0.1)).toBe(10)
  })

  it('should handle zero price', () => {
    expect(calculateTax(0, 0.1)).toBe(0)
  })

  it('should handle zero rate', () => {
    expect(calculateTax(100, 0)).toBe(0)
  })

  it('should round to 2 decimal places', () => {
    expect(calculateTax(100, 0.123)).toBeCloseTo(12.3, 1)
  })
})
```

**特点：**
- ✅ 快速执行（毫秒级）
- ✅ 易于调试
- ✅ 隔离性好
- ❌ 不能测试集成问题

#### 集成测试（Integration Tests）

```typescript
// 示例：测试组件与API的集成
import { render, screen, waitFor } from '@testing-library/vue'
import { describe, it, expect, vi } from 'vitest'
import UserList from '@/components/UserList.vue'

describe('UserList Integration', () => {
  it('should fetch and display users', async () => {
    // Mock API
    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve([
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' }
        ])
      })
    ) as any

    render(UserList)

    // 等待API调用完成
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument()
      expect(screen.getByText('Bob')).toBeInTheDocument()
    })

    expect(global.fetch).toHaveBeenCalledWith('/api/users')
  })
})
```

**特点：**
- ✅ 测试组件集成
- ✅ 发现接口问题
- ⚠️ 较慢（秒级）
- ⚠️ 调试较困难

#### E2E测试（End-to-End Tests）

```typescript
// 示例：Cypress E2E测试
describe('User Registration Flow', () => {
  it('should allow user to register', () => {
    cy.visit('/register')

    cy.get('input[name="email"]').type('test@example.com')
    cy.get('input[name="password"]').type('password123')
    cy.get('button[type="submit"]').click()

    // 验证跳转到dashboard
    cy.url().should('include', '/dashboard')

    // 验证成功消息
    cy.contains('注册成功').should('be.visible')
  })
})
```

**特点：**
- ✅ 测试完整流程
- ✅ 用户视角验证
- ❌ 非常慢（分钟级）
- ❌ 维护成本高
- ❌ 调试困难

### 2.3 测试策略分配

```typescript
// 假设100个测试用例的分配

const testStrategy = {
  unit: {
    count: 60,
    executionTime: '100ms',        // 6秒总计
    examples: [
      '纯函数测试',
      '工具函数测试',
      '组件逻辑测试',
      '数据转换测试'
    ]
  },
  integration: {
    count: 30,
    executionTime: '1s',           // 30秒总计
    examples: [
      '组件集成测试',
      'API集成测试',
      '状态管理测试',
      '路由测试'
    ]
  },
  e2e: {
    count: 10,
    executionTime: '30s',          // 5分钟总计
    examples: [
      '用户注册流程',
      '购物车流程',
      '支付流程',
      '关键业务流程'
    ]
  }
}
```

## 三、工具配置与使用

### 3.1 Vitest 配置（推荐）

#### 安装

```bash
npm install -D vitest @vitest/ui @vitest/coverage-v8
```

#### 配置文件

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{js,ts,vue}'],
      exclude: [
        'node_modules/',
        'src/types/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'src/main.ts'
      ],
      // 覆盖率阈值
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
      // 所有文件都检查覆盖率
      all: true,
      // 覆盖率输出目录
      reportsDirectory: './coverage'
    },
    setupFiles: ['./test/setup.ts']
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
})
```

#### 测试设置文件

```typescript
// test/setup.ts
import { vi } from 'vitest'
import { config } from '@testing-library/vue'

// 全局测试配置
config.global.mocks = {
  $t: (key: string) => key
}

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
})
```

#### package.json 脚本

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

### 3.2 Jest 配置（传统方案）

#### 配置文件

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.test.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ],
  transform: {
    '^.+\\.vue$': '@vue/vue3-jest',
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  collectCoverageFrom: [
    'src/**/*.{js,ts,vue}',
    '!src/**/*.d.ts',
    '!src/main.ts',
    '!src/types/**',
    '!src/**/*.spec.ts',
    '!src/**/*.test.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/src/$1'
  }
}
```

### 3.3 Cypress 配置（E2E测试）

#### 配置文件

```typescript
// cypress.config.ts
import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    video: false,
    screenshotOnRunFailure: true,
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 10000,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    }
  }
})
```

#### 自定义命令

```typescript
// cypress/support/commands.ts
declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>
      getByDataTestId(selector: string): Chainable<JQuery<HTMLElement>>
    }
  }
}

Cypress.Commands.add('login', (email, password) => {
  cy.request('/api/login', {
    method: 'POST',
    body: { email, password }
  }).then(({ body }) => {
    window.localStorage.setItem('token', body.token)
  })
})

Cypress.Commands.add('getByDataTestId', (selector) => {
  return cy.get(`[data-testid="${selector}"]`)
})
```

## 四、编写有效测试

### 4.1 AAA模式（Arrange-Act-Assert）

```typescript
describe('ShoppingCart', () => {
  it('should calculate total with discount', () => {
    // Arrange（准备）
    const cart = new ShoppingCart()
    const item = { id: 1, price: 100, quantity: 2 }
    const discount = 0.1

    // Act（执行）
    cart.addItem(item)
    const total = cart.calculateTotal(discount)

    // Assert（断言）
    expect(total).toBe(180) // (100 * 2) * 0.9
  })
})
```

### 4.2 Given-When-Then模式

```typescript
describe('User Authentication', () => {
  it('should allow login with valid credentials', () => {
    // Given（给定）
    const credentials = {
      email: 'test@example.com',
      password: 'password123'
    }

    // When（当）
    const result = await authService.login(credentials)

    // Then（那么）
    expect(result.success).toBe(true)
    expect(result.token).toBeDefined()
  })
})
```

### 4.3 测试命名规范

```typescript
// ✅ 好的测试命名
describe('UserService', () => {
  describe('createUser', () => {
    it('should create user with valid data')
    it('should throw error with duplicate email')
    it('should hash password before saving')
    it('should return user object with id')
  })
})

// ❌ 差的测试命名
describe('UserService', () => {
  it('test 1')
  it('test user')
  it('works')
})
```

### 4.4 边界条件测试

```typescript
describe('ArrayUtils', () => {
  describe('binarySearch', () => {
    it('should find element at first position')
    it('should find element at last position')
    it('should find element at middle position')
    it('should return -1 for empty array')
    it('should return -1 when element not found')
    it('should handle array with single element')
    it('should handle array with two elements')
  })
})
```

## 五、提升覆盖率的策略

### 5.1 从关键路径开始

```typescript
// 第一步：测试核心业务逻辑
describe('OrderService', () => {
  it('should calculate order total correctly')
  it('should apply discount code')
  it('should handle out of stock items')
  it('should send confirmation email')
})

// 第二步：测试辅助功能
describe('ValidationUtils', () => {
  it('should validate email format')
  it('should validate phone number')
  it('should validate postal code')
})

// 第三步：测试边界情况
describe('DateUtils', () => {
  it('should handle leap years')
  it('should handle timezone conversion')
  it('should handle date boundaries')
})
```

### 5.2 使用覆盖率报告

```bash
# 生成覆盖率报告
npm run test:coverage

# 查看HTML报告
open coverage/index.html
```

**报告分析重点：**

1. **识别未覆盖文件**
   - 优先级高的文件：先补充测试
   - 优先级低的文件：考虑是否需要测试

2. **识别未覆盖分支**
   ```typescript
   function processPayment(amount: number, method: 'card' | 'paypal'): boolean {
     if (method === 'card') {      // 分支1
       return processCard(amount)
     } else if (method === 'paypal') {  // 分支2
       return processPaypal(amount)
     } else {
       throw new Error('Invalid method')  // 分支3 - 可能未测试
     }
   }
   ```

3. **识别未覆盖行**
   - 异常处理代码
   - 默认情况
   - 错误路径

### 5.3 渐进式提升策略

#### 阶段1：基础覆盖（60%）

```typescript
// 只测试正常情况
describe('API', () => {
  it('should return data on success', async () => {
    const data = await fetchData()
    expect(data).toBeDefined()
  })
})
```

#### 阶段2：完善覆盖（80%）

```typescript
// 测试正常和异常情况
describe('API', () => {
  it('should return data on success', async () => {
    const data = await fetchData()
    expect(data).toBeDefined()
  })

  it('should handle network error', async () => {
    await expect(fetchData()).rejects.toThrow('Network error')
  })

  it('should handle empty response', async () => {
    const data = await fetchData()
    expect(data).toEqual([])
  })
})
```

#### 阶段3：全面覆盖（90%+）

```typescript
// 测试所有分支和边界
describe('API', () => {
  // 正常情况
  it('should return data on success')
  it('should handle pagination')
  it('should handle filters')

  // 异常情况
  it('should handle network error')
  it('should handle timeout')
  it('should handle invalid response')

  // 边界情况
  it('should handle empty response')
  it('should handle large dataset')
  it('should handle special characters')
})
```

## 六、TDD/BDD实践

### 6.1 Test-Driven Development流程

```
1. Red（红）
   → 编写失败的测试

2. Green（绿）
   → 编写最小代码使测试通过

3. Refactor（重构）
   → 优化代码，保持测试通过

4. Repeat（重复）
   → 继续下一个功能
```

### 6.2 TDD实战示例

#### 第一步：Red - 编写失败的测试

```typescript
// calc.test.ts
import { describe, it, expect } from 'vitest'
import { Calculator } from './calc'

describe('Calculator', () => {
  it('should add two numbers', () => {
    const calc = new Calculator()
    expect(calc.add(2, 3)).toBe(5)
  })
})
```

运行测试：❌ 失败（Calculator还不存在）

#### 第二步：Green - 最小实现

```typescript
// calc.ts
export class Calculator {
  add(a: number, b: number): number {
    return a + b
  }
}
```

运行测试：✅ 通过

#### 第三步：Refactor - 优化代码

```typescript
// calc.ts（如果需要优化）
export class Calculator {
  // 如果发现可以优化的地方，进行重构
  add(a: number, b: number): number {
    return a + b
  }
}
```

运行测试：✅ 仍然通过

### 6.3 BDD风格测试

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'

describe('User Management', () => {
  let database: Database

  beforeAll(async () => {
    // Given: 设置测试环境
    database = await connectToTestDatabase()
  })

  afterAll(async () => {
    // 清理测试环境
    await database.disconnect()
  })

  describe('When user registers', () => {
    it('Then should create user account', async () => {
      // When: 执行操作
      const user = await registerUser({
        email: 'test@example.com',
        password: 'secure123'
      })

      // Then: 验证结果
      expect(user.id).toBeDefined()
      expect(user.email).toBe('test@example.com')
      expect(user.passwordHash).toBeDefined()
      expect(user.password).toBeUndefined() // 密码不应返回
    })

    it('Then should send welcome email', async () => {
      const emailSpy = vi.spyOn(emailService, 'send')

      await registerUser({
        email: 'test@example.com',
        password: 'secure123'
      })

      expect(emailSpy).toHaveBeenCalledWith(
        'test@example.com',
        'Welcome!'
      )
    })
  })
})
```

## 七、CI/CD集成

### 7.1 GitHub Actions配置

```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:run

      - name: Generate coverage report
        run: npm run test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
          flags: unittests
          name: codecov-umbrella

      - name: Check coverage threshold
        run: |
          COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
          if (( $(echo "$COVERAGE < 80" | bc -l) )); then
            echo "Coverage $COVERAGE% is below 80%"
            exit 1
          fi

      - name: Run E2E tests
        run: npm run test:e2e
```

### 7.2 GitLab CI配置

```yaml
# .gitlab-ci.yml
stages:
  - test
  - coverage

unit-tests:
  stage: test
  image: node:18
  script:
    - npm ci
    - npm run test:run
  coverage: '/All files[^|]*\|[^|]*\s+([\d\.]+)/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml

coverage-report:
  stage: coverage
  image: node:18
  script:
    - npm ci
    - npm run test:coverage
  artifacts:
    paths:
      - coverage/
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
  only:
    - main
    - develop
```

## 八、常见陷阱和解决方案

### 8.1 过度Mock

```typescript
// ❌ 过度Mock
describe('UserService', () => {
  it('should create user', async () => {
    const mockDB = {
      user: {
        create: vi.fn().mockResolvedValue({ id: 1 })
      }
    }
    const mockEmail = {
      send: vi.fn().mockResolvedValue(true)
    }
    const mockHash = {
      hash: vi.fn().mockResolvedValue('hashed')
    }

    // 所有依赖都被Mock，测试失去了意义
    const service = new UserService(mockDB, mockEmail, mockHash)
    await service.createUser({ email: 'test@test.com' })

    expect(mockDB.user.create).toHaveBeenCalled()
  })
})

// ✅ 合理Mock - 只Mock外部依赖
describe('UserService', () => {
  it('should create user with hashed password', async () => {
    // 只Mock外部API
    vi.mock('@/lib/email', () => ({
      sendEmail: vi.fn().mockResolvedValue(true)
    }))

    const service = new UserService(realDB, emailService)
    const user = await service.createUser({
      email: 'test@test.com',
      password: 'password123'
    })

    // 验证密码被哈希
    expect(user.passwordHash).not.toBe('password123')
    expect(user.passwordHash).toHaveLength(60) // bcrypt hash length
  })
})
```

### 8.2 测试脆弱性

```typescript
// ❌ 脆弱的测试 - 依赖实现细节
describe('UserComponent', () => {
  it('should render user info', () => {
    const { container } = render(UserComponent, {
      props: { user: { name: 'Alice' } }
    })

    // 依赖具体DOM结构，容易断裂
    expect(container.querySelector('div > div > p').textContent).toBe('Alice')
  })
})

// ✅ 稳健的测试 - 测试行为
describe('UserComponent', () => {
  it('should render user info', () => {
    render(UserComponent, {
      props: { user: { name: 'Alice' } }
    })

    // 使用用户可感知的方式
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Alice' })).toBeInTheDocument()
  })
})
```

### 8.3 覆盖率数字游戏

```typescript
// ❌ 为了覆盖率写无效测试
describe('Coverage Hack', () => {
  it('should increase coverage', () => {
    // 没有断言的测试
    const result = someFunction()
    expect(result).toBeDefined() // 总是通过
  })

  it('should pass with empty assert', () => {
    // 测试什么都不做
    expect(true).toBe(true)
  })
})

// ✅ 有意义的测试
describe('Feature', () => {
  it('should handle edge case', () => {
    const result = processInput(null)
    expect(result).toBe('default')
  })
})
```

## 九、监控和维护

### 9.1 覆盖率趋势跟踪

```typescript
// scripts/coverage-trend.ts
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

interface CoverageData {
  date: string
  coverage: number
  files: number
}

const historyFile = join(__dirname, '../coverage-history.json')

function updateTrend() {
  const coverage = JSON.parse(
    readFileSync(join(__dirname, '../coverage/coverage-summary.json'), 'utf-8')
  )

  const currentCoverage = coverage.total.lines.pct
  const totalFiles = coverage.total.lines.total

  const history: CoverageData[] = JSON.parse(
    readFileSync(historyFile, 'utf-8')
  )

  history.push({
    date: new Date().toISOString(),
    coverage: currentCoverage,
    files: totalFiles
  })

  writeFileSync(historyFile, JSON.stringify(history, null, 2))

  // 检查趋势
  if (history.length > 1) {
    const lastCoverage = history[history.length - 2].coverage
    const diff = currentCoverage - lastCoverage

    if (diff < 0) {
      console.warn(`⚠️  覆盖率下降 ${diff.toFixed(2)}%`)
    } else if (diff > 0) {
      console.log(`✅ 覆盖率提升 ${diff.toFixed(2)}%`)
    }
  }
}

updateTrend()
```

### 9.2 测试债务管理

```typescript
// 定义测试债务追踪
interface TestDebt {
  file: string
  reason: string
  priority: 'high' | 'medium' | 'low'
  estimatedEffort: string
}

const testDebtList: TestDebt[] = [
  {
    file: 'src/utils/legacy.ts',
    reason: '复杂逻辑，需要重构',
    priority: 'high',
    estimatedEffort: '4小时'
  },
  {
    file: 'src/components/Obsolete.vue',
    reason: '即将废弃',
    priority: 'low',
    estimatedEffort: '1小时'
  }
]
```

## 十、实战案例

### 10.1 从0%到100%的改造

#### 初始状态（0%覆盖率）

```typescript
// src/utils/currency.ts
export function formatCurrency(amount: number, currency: string): string {
  if (currency === 'USD') {
    return `$${amount.toFixed(2)}`
  } else if (currency === 'EUR') {
    return `€${amount.toFixed(2)}`
  } else if (currency === 'CNY') {
    return `¥${amount.toFixed(2)}`
  } else {
    return `${amount.toFixed(2)} ${currency}`
  }
}
```

#### 第一阶段：基础测试（40%）

```typescript
// src/utils/currency.test.ts
import { describe, it, expect } from 'vitest'
import { formatCurrency } from './currency'

describe('formatCurrency', () => {
  it('should format USD', () => {
    expect(formatCurrency(100, 'USD')).toBe('$100.00')
  })

  it('should format EUR', () => {
    expect(formatCurrency(100, 'EUR')).toBe('€100.00')
  })
})
```

#### 第二阶段：完善测试（80%）

```typescript
describe('formatCurrency', () => {
  it('should format USD', () => {
    expect(formatCurrency(100, 'USD')).toBe('$100.00')
  })

  it('should format EUR', () => {
    expect(formatCurrency(100, 'EUR')).toBe('€100.00')
  })

  it('should format CNY', () => {
    expect(formatCurrency(100, 'CNY')).toBe('¥100.00')
  })

  it('should handle unknown currency', () => {
    expect(formatCurrency(100, 'GBP')).toBe('100.00 GBP')
  })

  it('should handle decimal places', () => {
    expect(formatCurrency(99.9, 'USD')).toBe('$99.90')
  })
})
```

#### 第三阶段：全面测试（100%）

```typescript
describe('formatCurrency', () => {
  describe('standard currencies', () => {
    it('should format USD')
    it('should format EUR')
    it('should format CNY')
  })

  describe('unknown currencies', () => {
    it('should use code as suffix')
  })

  describe('decimal handling', () => {
    it('should round to 2 decimals')
    it('should pad with zeros')
    it('should handle integers')
  })

  describe('edge cases', () => {
    it('should handle zero')
    it('should handle negative amounts')
    it('should handle very large numbers')
    it('should handle very small decimals')
  })
})
```

## 结语

测试覆盖率优化是一个循序渐进的过程。关键要点：

1. **理解目标**：覆盖率是手段，不是目的
2. **遵循金字塔**：大量单元测试 + 少量集成测试 + 最少E2E测试
3. **渐进式提升**：从60%到80%，再到90%+
4. **关注质量**：有效测试 > 高覆盖率
5. **持续改进**：监控趋势，管理技术债务

**立即行动：**
- 配置测试工具
- 为新功能编写测试
- 逐步覆盖关键路径
- 建立CI/CD流程

记住：**好的测试体系是质量的基石，而不是开发的负担。**

---

**延伸阅读：**
- [Jest vs Vitest全方位对比：从性能基准测试到迁移指南](./jest-vs-vitest-comparison.md)
- [E2E测试完全指南：Cypress vs Playwright实战对比](./e2e-testing-complete-guide.md)
- [AI代码审查最佳实践与工具配置完整指南](./ai-code-review-best-practices.md)
