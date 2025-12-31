---
title: "现代前端工程化体系搭建：从零构建企业级前端项目架构"
description: "全面讲解现代前端工程化的各个方面，包括项目架构、代码规范、构建优化、测试策略、CI/CD流程、监控告警等，帮助团队建立完善的前端工程化体系。"
author: "有条工具团队"
date: 2025-12-24T17:00:00+08:00
categories:
  - 前端工程化
  - 项目架构
tags:
  - 前端工程化
  - 项目架构
  - CI/CD
  - 代码规范
  - 自动化测试
keywords:
  - 前端工程化
  - 项目脚手架
  - 代码规范
  - ESLint配置
  - Git工作流
  - 前端测试
  - 自动化部署
series:
  - 前端工程实践
draft: false
---

## 引言

前端工程化是提升团队开发效率和代码质量的关键。一个完善的工程化体系包括项目架构、开发规范、构建工具、测试策略、CI/CD流程等多个方面。本文将从零开始，搭建一套完整的企业级前端工程化体系。

## 一、项目架构设计

### 1.1 单体仓库（Monorepo）

```bash
# 项目结构
my-project/
├── packages/
│   ├── shared/           # 共享代码
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── ui/              # UI组件库
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── web/             # Web应用
│   │   ├── src/
│   │   ├── package.json
│   │   └── vite.config.ts
│   └── admin/           # 管理后台
│       ├── src/
│       ├── package.json
│       └── vite.config.ts
├── apps/
│   └── mobile/          # 移动应用
├── .gitignore
├── pnpm-workspace.yaml  # pnpm workspace配置
├── package.json
├── nx.json              # Nx配置
└── tsconfig.base.json
```

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

```json
// package.json
{
  "name": "my-monorepo",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "format": "prettier --write \"**/*.{ts,tsx,json,md}\"",
    "changeset": "changeset",
    "version": "changeset version",
    "release": "turbo run build && changeset publish"
  },
  "devDependencies": {
    "@changesets/cli": "^2.27.0",
    "prettier": "^3.1.0",
    "turbo": "^1.11.0",
    "typescript": "^5.3.0"
  }
}
```

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "outputs": []
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": [],
      "inputs": ["src/**/*.tsx", "src/**/*.ts", "test/**/*.ts", "test/**/*.tsx"]
    }
  }
}
```

### 1.2 分层架构

```typescript
// 分层架构设计
src/
├── main/                  # 主入口层
│   ├── index.ts
│   └── App.vue
├── presentation/          # 展示层（页面、组件）
│   ├── pages/
│   │   ├── home/
│   │   ├── about/
│   │   └── dashboard/
│   └── components/
│       ├── common/
│       └── features/
├── application/          # 应用层（业务逻辑）
│   ├── useCases/
│   │   ├── auth/
│   │   ├── user/
│   │   └── product/
│   └── services/
│       └── api/
├── domain/               # 领域层（核心业务）
│   ├── entities/
│   ├── valueObjects/
│   └── repositories/
├── infrastructure/       # 基础设施层
│   ├── api/
│   ├── storage/
│   └── config/
└── shared/               # 共享代码
    ├── utils/
    ├── constants/
    ├── types/
    └── validators/
```

```typescript
// 领域实体示例
// domain/entities/User.ts
export class User {
  constructor(
    private readonly _id: string,
    private _name: string,
    private _email: string,
    private _role: UserRole
  ) {}

  get id(): string {
    return this._id
  }

  get name(): string {
    return this._name
  }

  get email(): string {
    return this._email
  }

  get role(): UserRole {
    return this._role
  }

  changeName(name: string): void {
    if (name.length < 2) {
      throw new Error('Name too short')
    }
    this._name = name
  }

  hasRole(role: UserRole): boolean {
    return this._role === role
  }
}

enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  GUEST = 'GUEST'
}
```

## 二、代码规范

### 2.1 ESLint配置

```javascript
// .eslintrc.cjs
module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:vue/vue3-recommended',
    'prettier'
  ],
  parser: 'vue-eslint-parser',
  parserOptions: {
    ecmaVersion: 'latest',
    parser: '@typescript-eslint/parser',
    sourceType: 'module'
  },
  plugins: ['@typescript-eslint', 'vue', 'import'],
  rules: {
    // TypeScript规则
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-non-null-assertion': 'warn',

    // Vue规则
    'vue/multi-word-component-names': 'off',
    'vue/no-v-html': 'warn',
    'vue/require-default-prop': 'error',
    'vue/require-prop-types': 'error',
    'vue/component-name-in-template-casing': ['error', 'PascalCase'],

    // Import规则
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index'
        ],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true
        }
      }
    ],
    'import/no-unresolved': 'error',
    'import/no-cycle': 'warn',

    // 通用规则
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off'
  },
  globals: {
    defineProps: 'readonly',
    defineEmits: 'readonly',
    defineExpose: 'readonly',
    withDefaults: 'readonly'
  }
}
```

### 2.2 Prettier配置

```json
// .prettierrc
{
  "semi": false,
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "trailingComma": "es5",
  "arrowParens": "avoid",
  "endOfLine": "lf",
  "vueIndentScriptAndStyle": false
}
```

```json
// .prettierignore
node_modules
dist
build
coverage
*.min.js
*.min.css
package-lock.json
pnpm-lock.yaml
```

### 2.3 Git提交规范

```javascript
// .commitlintrc.cjs
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // 新功能
        'fix',      // 修复bug
        'docs',     // 文档更新
        'style',    // 代码格式调整
        'refactor', // 重构
        'perf',     // 性能优化
        'test',     // 测试相关
        'build',    // 构建系统
        'ci',       // CI配置
        'chore',    // 其他杂项
        'revert'    // 回退提交
      ]
    ],
    'scope-case': [2, 'always', 'kebab-case'],
    'subject-case': [0],
    'subject-empty': [2, 'never'],
    'subject-max-length': [2, 'always', 100],
    'type-empty': [2, 'never'],
    'scope-empty': [1, 'never']
  }
}
```

```bash
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

pnpm lint-staged
```

```bash
# .husky/commit-msg
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

pnpm commitlint --edit $1
```

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx,vue}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,yml,yaml}": [
      "prettier --write"
    ]
  }
}
```

## 三、构建优化

### 3.1 Vite配置

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],

  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@shared': resolve(__dirname, '../shared/src')
    }
  },

  build: {
    target: 'es2015',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',

    rollupOptions: {
      output: {
        // 手动分包
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          'ui-library': ['element-plus'],
          'utils': ['lodash-es', 'axios', 'dayjs']
        },
        // 文件命名
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: '[ext]/[name]-[hash].[ext]'
      }
    },

    // Terser配置
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log']
      }
    },

    // chunk大小警告阈值
    chunkSizeWarningLimit: 1000
  },

  server: {
    port: 3000,
    host: true,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },

  // CSS配置
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/styles/variables" as *;`
      }
    },
    modules: {
      localsConvention: 'camelCase'
    }
  },

  // 依赖优化
  optimizeDeps: {
    include: ['vue', 'vue-router', 'pinia', 'axios'],
    exclude: []
  }
})
```

### 3.2 环境变量管理

```bash
# .env.development
VITE_APP_TITLE=MyApp (Development)
VITE_API_BASE_URL=http://localhost:8080/api
VITE_ENABLE_MOCK=true
VITE_APP_MOCK_PORT=3001
```

```bash
# .env.production
VITE_APP_TITLE=MyApp
VITE_API_BASE_URL=https://api.example.com
VITE_ENABLE_MOCK=false
```

```typescript
// src/config/env.ts
interface EnvConfig {
  appTitle: string
  apiBaseUrl: string
  enableMock: boolean
  mockPort?: number
}

export const env: EnvConfig = {
  appTitle: import.meta.env.VITE_APP_TITLE || 'MyApp',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
  enableMock: import.meta.env.VITE_ENABLE_MOCK === 'true',
  mockPort: import.meta.env.VITE_APP_MOCK_PORT
    ? parseInt(import.meta.env.VITE_APP_MOCK_PORT)
    : undefined
}
```

## 四、测试策略

### 4.1 单元测试

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'src/main.ts'
      ]
    }
  }
})
```

```typescript
// test/utils.test.ts
import { describe, it, expect } from 'vitest'
import { formatDate, calculateAge } from '@/utils/date'

describe('Date Utils', () => {
  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2025-01-01')
      expect(formatDate(date, 'YYYY-MM-DD')).toBe('2025-01-01')
    })

    it('should handle invalid date', () => {
      expect(formatDate(null, 'YYYY-MM-DD')).toBe('')
    })
  })

  describe('calculateAge', () => {
    it('should calculate age correctly', () => {
      const birthDate = new Date('1990-01-01')
      const currentDate = new Date('2025-01-01')
      expect(calculateAge(birthDate, currentDate)).toBe(35)
    })
  })
})
```

### 4.2 组件测试

```typescript
// test/components/Button.test.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Button from '@/components/common/Button.vue'

describe('Button Component', () => {
  it('renders properly', () => {
    const wrapper = mount(Button, {
      props: {
        text: 'Click me',
        type: 'primary'
      }
    })

    expect(wrapper.text()).toContain('Click me')
    expect(wrapper.classes()).toContain('btn-primary')
  })

  it('emits click event', async () => {
    const wrapper = mount(Button, {
      props: {
        text: 'Click me'
      }
    })

    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeTruthy()
  })

  it('disables button when loading', () => {
    const wrapper = mount(Button, {
      props: {
        text: 'Submit',
        loading: true
      }
    })

    const button = wrapper.find('button')
    expect(button.attributes('disabled')).toBeDefined()
  })
})
```

### 4.3 E2E测试

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000')
  })

  test('should login with valid credentials', async ({ page }) => {
    await page.click('text=Login')
    await page.fill('[name="email"]', 'user@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL(/.*dashboard/)
    await expect(page.locator('text=Welcome')).toBeVisible()
  })

  test('should show error with invalid credentials', async ({ page }) => {
    await page.click('text=Login')
    await page.fill('[name="email"]', 'invalid@example.com')
    await page.fill('[name="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')

    await expect(page.locator('text=Invalid credentials')).toBeVisible()
  })
})
```

## 五、CI/CD流程

### 5.1 GitHub Actions配置

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run ESLint
        run: pnpm lint

      - name: Run TypeScript check
        run: pnpm typecheck

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run unit tests
        run: pnpm test:unit

      - name: Run component tests
        run: pnpm test:component

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  build:
    needs: [lint, test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build
        run: pnpm build

      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist
```

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build
        run: pnpm build
        env:
          NODE_ENV: production

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## 六、监控与日志

### 6.1 错误监控

```typescript
// src/monitoring/sentry.ts
import * as Sentry from '@sentry/vue'

export function setupSentry(app: any) {
  if (import.meta.env.PROD) {
    Sentry.init({
      app,
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.MODE,
      release: import.meta.env.VITE_APP_VERSION,

      // 性能监控
      integrations: [
        new Sentry.BrowserTracing({
          tracePropagationTargets: ['localhost', 'example.com']
        }),
        new Sentry.Replay()
      ],

      // 采样率
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,

      // 过滤敏感信息
      beforeSend(event) {
        // 移除敏感数据
        if (event.request?.headers) {
          delete event.request.headers['authorization']
        }
        return event
      }
    })
  }
}
```

### 6.2 性能监控

```typescript
// src/monitoring/analytics.ts
export class Analytics {
  private queue: any[] = []
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
    this.init()
  }

  private init() {
    // 页面加载性能
    window.addEventListener('load', () => {
      setTimeout(() => {
        this.trackPageLoad()
      }, 0)
    })

    // 定期发送队列数据
    setInterval(() => {
      this.flush()
    }, 5000)
  }

  private trackPageLoad() {
    const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming

    this.track('page_load', {
      // DNS查询时间
      dns: perfData.domainLookupEnd - perfData.domainLookupStart,

      // TCP连接时间
      tcp: perfData.connectEnd - perfData.connectStart,

      // 请求响应时间
      request: perfData.responseEnd - perfData.requestStart,

      // DOM解析时间
      domParse: perfData.domComplete - perfData.domInteractive,

      // 首次绘制
      firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime,

      // 首次内容绘制
      firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime
    })
  }

  track(eventName: string, data?: any) {
    this.queue.push({
      event: eventName,
      data,
      timestamp: Date.now(),
      url: location.href,
      userAgent: navigator.userAgent
    })
  }

  private flush() {
    if (this.queue.length === 0) return

    const data = [...this.queue]
    this.queue = []

    fetch('/api/analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey
      },
      body: JSON.stringify({ events: data }),
      keepalive: true
    }).catch(err => {
      // 失败时重新加入队列
      this.queue.unshift(...data)
    })
  }
}

export const analytics = new Analytics(import.meta.env.VITE_ANALYTICS_API_KEY)
```

## 总结

前端工程化是一个系统性的工作：

1. **项目架构** - 清晰的代码组织和分层
2. **代码规范** - 统一的编码风格和提交规范
3. **构建优化** - 高效的构建和打包配置
4. **测试策略** - 完善的单元、组件、E2E测试
5. **CI/CD** - 自动化的构建和部署流程
6. **监控告警** - 错误追踪和性能监控

建立完善的工程化体系需要持续投入和迭代，但回报是开发效率和代码质量的显著提升。

> **相关工具推荐**
> - [JSON格式化工具](https://www.util.cn/tools/json-formatter/) - JSON数据处理
> - [Base64编码工具](https://www.util.cn/tools/base64-encode/) - 编码转换
> - [URL编码工具](https://www.util.cn/tools/url-encode/) - URL参数处理
