---
title: "Jest vs Vitest：现代前端测试框架的全面对比与迁移指南"
summary: "深入对比Jest和Vitest的性能、功能、生态系统，提供完整的迁移方案和最佳实践，帮助团队选择最适合的测试框架。"
date: 2026-01-09T11:00:00+08:00
draft: false
tags: ["测试", "Jest", "Vitest", "前端测试", "单元测试"]
categories: ["前端开发"]
author: "有条工具团队"
---

随着Vitest的崛起，前端开发者面临一个新的选择：是继续使用成熟的Jest，还是迁移到性能更优的Vitest？本文将全面对比这两个测试框架。

## 一、框架概述

### 1.1 Jest

```bash
# Jest由Facebook开发，2014年发布
# 专为React应用设计，但适用于所有JS框架

# 特点
- ✅ 零配置体验
- ✅ 内置断言库
- ✅ 内置Mock功能
- ✅ 并行测试执行
- ✅ 快照测试
- ✅ 覆盖率报告
- ✅ 庞大的生态系统

# 适用场景
- React项目（官方推荐）
- 需要丰富插件的复杂项目
- 团队熟悉Jest生态
```

### 1.2 Vitest

```bash
# Vitest由Vue/Vite团队开发，2022年发布
# 基于Vite构建，专为现代前端打造

# 特点
- ✅ 极快的测试执行（10-100倍）
- ✅ 与Vite生态无缝集成
- ✅ ESM优先支持
- ✅ 兼容Jest API
- ✅ 内置TypeScript支持
- ✅ 原生E2E测试支持
- ✅ Watch模式性能优异

# 适用场景
- Vite项目
- 追求极致测试速度
- ESM项目
- 需要快速反馈的开发环境
```

## 二、性能对比

### 2.1 执行速度

```javascript
// 测试场景：1000个单元测试

// Jest
jest  v29.x
Time: 45.2s
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 100%

// Vitest
vitest v1.0.0
Time: 4.8s
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 100%

// 速度对比
// Vitest快约9.4倍！

// 性能提升原因
// 1. 使用Vite的即时编译
// 2. Worker threads并行执行
// 3. 增量测试执行
// 4. 更优的依赖图分析
```

### 2.2 Watch模式性能

```javascript
// Jest Watch模式
$ jest --watch

// 文件变化后
Watch Usage
 › Press p to filter by a filename regex pattern.
 › Press t to filter by a test name regex pattern.
 › Press q to quit watch mode.
 › Press Enter to trigger a test run.

# 重新执行时间：8-15秒

// Vitest Watch模式
$ vitest --watch

# 文件变化后
❯ src/utils/math.test.ts (3 + 2)
  ✓ add (2) 381ms
  ✓ subtract (2) 261ms

# 重新执行时间：200-500ms

// Watch模式性能差异
// Vitest快约20-40倍！
```

## 三、API对比

### 3.1 测试定义

```typescript
// Jest
describe('MathUtils', () => {
  describe('add', () => {
    test('should add two numbers', () => {
      expect(add(1, 2)).toBe(3)
    })

    it('should handle negative numbers', () => {
      expect(add(-1, -2)).toBe(-3)
    })
  })
})

// Vitest - 完全相同的API！
describe('MathUtils', () => {
  describe('add', () => {
    test('should add two numbers', () => {
      expect(add(1, 2)).toBe(3)
    })

    it('should handle negative numbers', () => {
      expect(add(-1, -2)).toBe(-3)
    })
  })
})

// 结论：100%兼容，无需重写测试代码
```

### 3.2 断言库

```typescript
// 两个框架使用相同的断言API

test('matcher examples', () => {
  // 相等性断言
  expect(1 + 1).toBe(2)
  expect({ a: 1 }).toEqual({ a: 1 })
  expect('hello').toContain('ell')

  // 真值断言
  expect(true).toBeTruthy()
  expect(null).toBeNull()
  expect(undefined).toBeUndefined()

  // 数字断言
  expect(10).toBeGreaterThan(5)
  expect(10).toBeLessThan(20)
  expect(10.5).toBeCloseTo(10.4, 1)

  // 异步断言
  await expect(Promise.resolve(123)).resolves.toBe(123)
  await expect(Promise.reject(new Error()))\
    .rejects.toThrow('Error')

  // 快照断言
  expect(component).toMatchSnapshot()
})

// Vitest独有的追加断言
import { expect } from 'vitest'

test('vitest-only matchers', () => {
  // 软断言（失败不影响测试结果）
  expect.soft(1 + 1).toBe(3)

  // 断言回调
  expect(1 + 1).toBe(2) && expect(2 + 2).toBe(4)

  // 条件断言
  expect(1 + 1).toBe(2).or.toBe(3)
})
```

### 3.3 Mock功能

```typescript
// Jest Mock
const mockFn = jest.fn()
mockFn.mockReturnValue(42)
mockFn.mockResolvedValue('data')
mockFn.mockImplementation((a, b) => a + b)

// Vitest Mock - 完全相同！
import { vi } from 'vitest'

const mockFn = vi.fn()
mockFn.mockReturnValue(42)
mockFn.mockResolvedValue('data')
mockFn.mockImplementation((a, b) => a + b)

// 模块Mock
// Jest
jest.mock('./api', () => ({
  fetchUser: jest.fn(() => ({ id: 1 }))
}))

// Vitest
vi.mock('./api', () => ({
  fetchUser: vi.fn(() => ({ id: 1 }))
}))
```

### 3.4 快照测试

```typescript
// Jest快照
test('component snapshot', () => {
  const tree = renderer.create(<MyComponent />).toJSON()
  expect(tree).toMatchSnapshot()
})

// 内联快照
test('inline snapshot', () => {
  const data = { foo: 'bar' }
  expect(data).toMatchInlineSnapshot(`
    {
      "foo": "bar"
    }
  `)
})

// Vitest快照 - 完全相同！
test('component snapshot', () => {
  const tree = renderer.create(<MyComponent />).toJSON()
  expect(tree).toMatchSnapshot()
})

// Vitest优势：支持多种快照格式
import { expect } from 'vitest'

test('html snapshot', () => {
  const html = '<div class="test">content</div>'
  expect(html).toMatchFileSnapshot('./test.html')
})
```

## 四、配置对比

### 4.1 Jest配置

```javascript
// jest.config.js
module.exports = {
  // 测试环境
  testEnvironment: 'jsdom',

  // 转换器
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
    '^.+\\.vue$': '@vue/vue3-jest'
  },

  // 模块路径
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1'
  },

  // setup文件
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // 覆盖率
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.*'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },

  // 并行
  maxWorkers: '50%'
}
```

### 4.2 Vitest配置

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],

  test: {
    // 测试环境
    environment: 'jsdom',

    // 全局配置
    globals: true,
    setupFiles: ['./test/setup.ts'],

    // 覆盖率
    coverage: {
      provider: 'v8', // v8或istanbul
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{js,jsx,ts,tsx}'],
      exclude: ['src/**/*.d.ts', 'src/**/*.stories.*'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80
      }
    },

    // include/exclude
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],

    // 并行
    threads: true,
    maxThreads: 4,
    minThreads: 1
  },

  // 解析配置（继承自vite）
  resolve: {
    alias: {
      '@': '/src',
      '@/components': '/src/components'
    }
  }
})
```

### 4.3 TypeScript支持

```typescript
// Jest TypeScript支持
// 需要安装额外依赖
// @types/jest
// ts-jest
// @types/react-test-renderer

// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
}

// package.json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "jest": {
    "preset": "ts-jest"
  }
}

// Vitest TypeScript支持
// 开箱即用，无需额外配置！

// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true
    // TypeScript自动处理
  }
})

// tsconfig.json
{
  "compilerOptions": {
    "types": ["vitest/globals"]
  }
}
```

## 五、Vitest独有功能

### 5.1 内置UI

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    // 启用UI界面
    ui: true
  }
})

// 启动命令
$ npx vitest --ui

// 自动打开浏览器
// http://localhost:51204/__vitest__/

// 功能
// - 可视化测试结果
// - 交互式测试文件导航
// - 覆盖率热力图
// - 代码覆盖率详情
// - 测试时长统计
// - 实时重新运行
```

### 5.2 Workspace支持

```typescript
// Monorepo配置
// vitest.workspace.ts
import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  // packages目录
  'packages/*',

  // 特定配置
  {
    test: {
      name: 'unit',
      include: ['**/*.unit.test.ts']
    }
  },
  {
    test: {
      name: 'integration',
      include: ['**/*.integration.test.ts']
    }
  }
])

// 在不同workspace中运行测试
$ npx vitest --workspace=@packages/my-lib
```

### 5.3 Benchmark基准测试

```typescript
// benchmark.test.ts
import { bench, describe } from 'vitest'

describe('string operations', () => {
  bench('split', () => {
    'hello world'.split(' ')
  })

  bench('slice', () => {
    'hello world'.slice(0, 5)
  })
})

// 运行benchmark
$ npx vitest bench

// 输出
// string_operations
//   ✓ split 1,234,567 ops/s
//   ✓ slice 2,345,678 ops/s
```

### 5.4 内置E2E支持

```typescript
// e2e/basic.test.ts
import { test, expect } from 'vitest'
import { page } from '@vitest/browser'

test('basic e2e', async () => {
  await page.goto('https://example.com')

  const title = await page.title()
  expect(title).toBe('Example Domain')

  await page.screenshot()
})

// vitest.config.ts
export default defineConfig({
  test: {
    browser: {
      enabled: true,
      name: 'chromium',
      provider: 'playwright'
    }
  }
})
```

## 六、迁移指南

### 6.1 从Jest迁移到Vitest

```bash
# 1. 安装Vitest
npm install -D vitest @vitest/ui

# 2. 更新配置文件
# jest.config.js → vitest.config.ts

# 3. 更新package.json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}

# 4. 更新导入
# jest.mock → vi.mock
# jest.fn → vi.fn
# jest.spyOn → vi.spyOn

# 5. 全局配置
# tsconfig.json
{
  "compilerOptions": {
    "types": ["vitest/globals"]
  }
}

# 6. 运行测试
npm test
```

### 6.2 兼容性处理

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // 兼容Jest的全局变量
    globals: true,
    environment: 'jsdom',

    // 使用Jest的兼容层
    // (逐步迁移时使用)
    include: ['**/*.test.ts'],
    exclude: ['node_modules/**'],

    // coverage设置
    coverage: {
      provider: 'istanbul' // 使用Istanbul（与Jest一致）
    }
  }
})

// tsconfig.json
{
  "compilerOptions": {
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  }
}
```

### 6.3 常见问题

```typescript
// 问题1：jest.mock()不工作
// ❌ 错误
jest.mock('./api')

// ✅ 正确
vi.mock('./api')

// 问题2：测试文件名不匹配
// Jest: *.test.js, *.spec.js
// Vitest: *.test.ts, *.spec.ts

// 解决方案
// vitest.config.ts
export default defineConfig({
  test: {
    include: [
      '**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ]
  }
})

// 问题3：enzyme不兼容
// Vitest不支持React Testing Library
// 解决方案：使用@testing-library/react

// 问题4：快照不匹配
// Jest快照格式与Vitest略有不同
// 解决方案：删除快照，重新生成
rm -rf __snapshots__
npm test
```

## 七、性能优化技巧

### 7.1 Vitest优化

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    // 并行执行
    threads: true,
    maxThreads: 4,
    minThreads: 1,

    // 文件级并发
    fileParallelism: true,

    // 隔离测试环境
    isolate: true,

    // 覆盖率优化
    coverage: {
      provider: 'v8', // 比Istanbul快
      all: true,
      include: ['src/**/*.{js,ts}'],
      exclude: ['src/**/*.test.{js,ts}', 'src/**/*.spec.{js,ts}']
    },

    // 监听模式优化
    watch: true,
    // 忽略node_modules变化
    ignore: ['**/node_modules/**', '**/dist/**']
  }
})

// 性能对比
// 优化前: 1000 tests in 15s
// 优化后: 1000 tests in 3s
```

### 7.2 Jest优化

```javascript
// jest.config.js
module.exports = {
  // 并行执行
  maxWorkers: '50%',

  // 缓存
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',

  // 覆盖率
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.*'
  ],

  // 性能优化
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // 只运行变更的测试
  testPathIgnorePatterns: [
    '/node_modules/'
  ]
}

// 性能对比
// 优化前: 1000 tests in 45s
// 优化后: 1000 tests in 20s
```

## 八、选择建议

### 8.1 选择Vitest的场景

```yaml
✅ 推荐使用Vitest:
  项目特点:
    - Vite项目
    - 使用ES模块
    - 追求极致测试速度
    - 大量测试文件（>500）

  团队特点:
    - 愿意尝试新技术
    - 需要快速反馈循环
    - 使用TypeScript

  性能需求:
    - Watch模式响应时间 < 1s
    - 测试执行时间 < 5s
```

### 8.2 选择Jest的场景

```yaml
✅ 推荐使用Jest:
  项目特点:
    - React项目（Create React App）
    - 使用CommonJS
    - 复杂的Mock需求
    - 依赖Jest插件

  团队特点:
    - 团队熟悉Jest
    - 需要成熟稳定的方案
    - 不想改变现有流程

  生态需求:
    - 需要特定的Jest插件
    - 使用React Native
    - 需要丰富的社区支持
```

## 总结

| 维度 | Jest | Vitest |
|------|------|--------|
| 性能 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 兼容性 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| 生态 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| 学习曲线 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 维护性 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 创新性 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

**最终建议**：
- 新项目优先选择Vitest
- Vite项目直接用Vitest
- Create React App项目保持Jest
- 需要极致性能选择Vitest
- 保守团队可继续使用Jest

无论选择哪个，重要的是建立完善的测试文化！
