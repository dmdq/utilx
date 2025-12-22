---
title: "前端工程化实践指南：从零搭建现代化的前端项目"
slug: "frontend-engineering-practices"
date: 2025-12-17T18:00:00+08:00
draft: false
tags: ['前端工程化', 'Webpack', 'Vite', '自动化', '项目架构']
categories: ['前端开发']
author: 'util.cn Team'
summary: '深入探讨前端工程化的核心理念和实践方法，包括项目脚手架、构建优化、自动化测试、代码质量保证等，帮助团队建立规范的前端开发流程'
---

# 前端工程化实践指南：从零搭建现代化的前端项目

随着前端应用规模的不断扩大，工程化已成为现代前端开发的必备技能。本文将深入探讨前端工程化的核心理念和实践方法，帮助团队建立规范、高效的前端开发流程。

## 前端工程化概述

### 1. 什么是前端工程化

前端工程化是指运用工程化方法和工具来规范前端开发流程、提高代码质量、优化开发效率的一系列活动。它包括：

**核心理念**：
- **规范化**：制定统一的编码规范和项目结构
- **自动化**：自动化构建、测试、部署等重复性工作
- **模块化**：将应用拆分为可复用的模块
- **组件化**：构建可复用的UI组件库
- **工程化工具链**：构建工具、脚手架、自动化工具

### 2. 工程化的价值

```javascript
// 传统开发方式的问题
// 1. 代码组织混乱
├── index.html
├── style.css
├── script.js
└── lib.js

// 2. 缺乏模块化，全局变量污染
var userData = {};
var utils = {};

// 3. 手动管理依赖
<script src="jquery.js"></script>
<script src="bootstrap.js"></script>
<script src="app.js"></script>

// 工程化后的项目结构
├── src/
│   ├── components/     # 可复用组件
│   ├── views/         # 页面组件
│   ├── utils/         # 工具函数
│   ├── api/           # API接口
│   ├── assets/        # 静态资源
│   └── styles/        # 样式文件
├── public/            # 公共资源
├── tests/             # 测试文件
├── docs/              # 文档
├── build/             # 构建配置
└── dist/              # 构建输出
```

## 项目脚手架搭建

### 1. 技术栈选择

```javascript
// 技术栈决策矩阵
const techStack = {
  framework: {
    options: ['React', 'Vue', 'Angular', 'Svelte'],
    factors: ['团队熟悉度', '项目复杂度', '生态支持', '学习成本']
  },
  language: {
    options: ['JavaScript', 'TypeScript'],
    recommendation: 'TypeScript（类型安全、大型项目友好）'
  },
  buildTool: {
    options: ['Webpack', 'Vite', 'Rollup', 'Parcel'],
    recommendation: 'Vite（开发体验好、构建速度快）'
  },
  cssSolution: {
    options: ['CSS Modules', 'CSS-in-JS', 'Tailwind CSS', 'Sass/Less'],
    recommendation: '根据项目需求选择'
  }
}

// 技术选型示例
const projectTechStack = {
  framework: 'Vue 3',
  language: 'TypeScript',
  buildTool: 'Vite',
  cssSolution: 'Tailwind CSS + CSS Modules',
  stateManagement: 'Pinia',
  routing: 'Vue Router',
  http: 'Axios',
  testing: 'Vitest + Vue Test Utils'
}
```

### 2. 项目初始化

```bash
# 使用官方脚手架
npm create vue@latest my-vue-app

# 或使用Vite创建项目
npm create vite@latest my-vue-app -- --template vue-ts

# 项目配置选择
✔ Project name: my-vue-app
✔ Add TypeScript? Yes
✔ Add JSX Support? No
✔ Add Vue Router for Single Page Application development? Yes
✔ Add Pinia for state management? Yes
✔ Add Vitest for Unit testing? Yes
✔ Add an End-to-End Testing Solution? No
✔ Add ESLint for code quality? Yes
✔ Add Prettier for code formatting? Yes
```

### 3. 项目结构规范

```
my-vue-app/
├── .env                    # 环境变量
├── .env.development        # 开发环境变量
├── .env.production         # 生产环境变量
├── .github/                # GitHub Actions配置
├── .vscode/                # VS Code配置
├── public/                 # 公共资源
│   ├── favicon.ico
│   └── index.html
├── src/
│   ├── api/                # API接口
│   │   ├── index.ts
│   │   ├── user.ts
│   │   └── types.ts
│   ├── assets/             # 静态资源
│   │   ├── images/
│   │   ├── icons/
│   │   └── fonts/
│   ├── components/         # 公共组件
│   │   ├── common/         # 通用组件
│   │   ├── business/       # 业务组件
│   │   └── index.ts
│   ├── composables/        # 组合式函数
│   ├── constants/          # 常量定义
│   ├── hooks/              # 自定义Hook
│   ├── layouts/            # 布局组件
│   ├── router/             # 路由配置
│   ├── stores/             # 状态管理
│   ├── styles/             # 样式文件
│   ├── types/              # 类型定义
│   ├── utils/              # 工具函数
│   ├── views/              # 页面组件
│   ├── App.vue
│   └── main.ts
├── tests/                  # 测试文件
│   ├── unit/
│   └── e2e/
├── docs/                   # 项目文档
├── scripts/                # 构建脚本
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── .eslintrc.cjs
├── .prettierrc
└── README.md
```

## 构建配置优化

### 1. Vite配置优化

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig(({ command, mode }) => {
  const isProduction = mode === 'production'

  return {
    plugins: [
      vue(),
      // 生产环境打包分析
      isProduction && visualizer({
        filename: 'dist/stats.html',
        open: true,
        gzipSize: true
      })
    ].filter(Boolean),

    // 路径别名
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '@/components': resolve(__dirname, 'src/components'),
        '@/utils': resolve(__dirname, 'src/utils'),
        '@/api': resolve(__dirname, 'src/api')
      }
    },

    // 开发服务器配置
    server: {
      port: 3000,
      open: true,
      cors: true,
      proxy: {
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    },

    // 构建配置
    build: {
      target: 'es2015',
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: !isProduction,
      minify: isProduction ? 'terser' : false,
      terserOptions: {
        compress: {
          drop_console: isProduction,
          drop_debugger: isProduction
        }
      },
      rollupOptions: {
        output: {
          // 手动分包
          manualChunks: {
            vendor: ['vue', 'vue-router', 'pinia'],
            ui: ['element-plus', '@element-plus/icons-vue'],
            utils: ['axios', 'dayjs', 'lodash-es']
          },
          // 文件命名
          chunkFileNames: 'js/[name]-[hash].js',
          entryFileNames: 'js/[name]-[hash].js',
          assetFileNames: '[ext]/[name]-[hash].[ext]'
        }
      },
      // 资源内联阈值
      assetsInlineLimit: 4096
    },

    // 环境变量配置
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version)
    },

    // CSS配置
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@import "@/styles/variables.scss";`
        }
      },
      modules: {
        localsConvention: 'camelCase'
      }
    }
  }
})
```

### 2. 环境变量管理

```typescript
// .env.development
VITE_APP_TITLE=MyApp Development
VITE_API_BASE_URL=http://localhost:8080/api
VITE_ENABLE_MOCK=true
VITE_ENABLE_DEVTOOLS=true

// .env.production
VITE_APP_TITLE=MyApp
VITE_API_BASE_URL=https://api.example.com
VITE_ENABLE_MOCK=false
VITE_ENABLE_DEVTOOLS=false

// 环境变量类型定义
// src/env.d.ts
interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_ENABLE_MOCK: string
  readonly VITE_ENABLE_DEVTOOLS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// 使用环境变量
// src/config/index.ts
export const config = {
  appTitle: import.meta.env.VITE_APP_TITLE,
  apiUrl: import.meta.env.VITE_API_BASE_URL,
  isDev: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  enableMock: import.meta.env.VITE_ENABLE_MOCK === 'true'
}
```

## 代码规范与质量保证

### 1. ESLint配置

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
    'plugin:vue/vue3-essential',
    'plugin:@typescript-eslint/recommended',
    'plugin:vue/vue3-strongly-recommended',
    '@vue/eslint-config-typescript',
    '@vue/eslint-config-prettier/skip-formatting'
  ],
  parser: 'vue-eslint-parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    parser: '@typescript-eslint/parser'
  },
  rules: {
    // Vue规则
    'vue/multi-word-component-names': 'off',
    'vue/component-tags-order': ['error', {
      order: ['template', 'script', 'style']
    }],
    'vue/component-definition-name-casing': ['error', 'PascalCase'],
    'vue/custom-event-name-casing': ['error', 'camelCase'],
    'vue/no-multiple-template-root': 'off',

    // TypeScript规则
    '@typescript-eslint/no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/prefer-const': 'error',

    // 通用规则
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error'
  },
  overrides: [
    {
      files: ['*.vue'],
      rules: {
        'indent': 'off'
      }
    }
  ]
}
```

### 2. Prettier配置

```json
// .prettierrc
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf",
  "vueIndentScriptAndStyle": false
}
```

### 3. Git Hooks配置

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
    }
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{vue}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{css,scss,less}": [
      "prettier --write"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  },
  "commitlint": {
    "extends": ["@commitlint/config-conventional"]
  }
}
```

```typescript
// commitlint.config.js
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
        'style',    // 代码格式
        'refactor', // 重构
        'perf',     // 性能优化
        'test',     // 测试
        'chore',    // 构建过程或辅助工具的变动
        'revert'    // 回滚
      ]
    ],
    'subject-max-length': [2, 'always', 50],
    'body-max-line-length': [2, 'always', 72]
  }
}
```

## 组件开发规范

### 1. 组件命名和组织

```typescript
// 组件命名规范
// 1. 使用PascalCase
// 2. 语义化命名
// 3. 避免缩写

// 例子：Good
UserProfileCard.tsx
DataTableWithPagination.tsx
ModalDialog.tsx

// 例子：Bad
UserProfCard.tsx
DataTable.tsx
Modal.tsx

// 组件目录结构
components/
├── common/                 # 通用组件
│   ├── Button/
│   │   ├── index.vue
│   │   ├── types.ts
│   │   └── README.md
│   ├── Input/
│   └── Modal/
├── business/              # 业务组件
│   ├── UserCard/
│   ├── ProductList/
│   └── OrderForm/
└── index.ts               # 导出入口

// 导出统一管理
// components/index.ts
export { default as Button } from './common/Button'
export { default as Input } from './common/Input'
export { default as UserCard } from './business/UserCard'
```

### 2. 组件设计原则

```vue
<!-- BaseButton.vue -->
<template>
  <button
    :class="[
      'base-button',
      `base-button--${type}`,
      `base-button--${size}`,
      { 'base-button--disabled': disabled }
    ]"
    :disabled="disabled"
    @click="handleClick"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
interface Props {
  type?: 'primary' | 'secondary' | 'danger'
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
  loading?: boolean
}

interface Emits {
  click: [event: MouseEvent]
}

const props = withDefaults(defineProps<Props>(), {
  type: 'primary',
  size: 'medium',
  disabled: false,
  loading: false
})

const emit = defineEmits<Emits>()

const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>

<style scoped lang="scss">
.base-button {
  // 基础样式
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;

  // 类型变体
  &--primary {
    background-color: var(--color-primary);
    color: white;

    &:hover {
      background-color: var(--color-primary-dark);
    }
  }

  &--secondary {
    background-color: var(--color-secondary);
    color: var(--color-text);

    &:hover {
      background-color: var(--color-secondary-dark);
    }
  }

  // 尺寸变体
  &--small {
    padding: 4px 8px;
    font-size: 12px;
  }

  &--large {
    padding: 12px 24px;
    font-size: 16px;
  }

  // 状态
  &--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
</style>
```

### 3. 组件文档规范

```typescript
// Button.tsx 组件文档示例
/**
 * Button组件
 *
 * @example
 * ```tsx
 * <Button
 *   type="primary"
 *   size="large"
 *   onClick={handleClick}
 *   loading={isLoading}
 * >
 *   Submit
 * </Button>
 * ```
 */
export interface ButtonProps {
  /** 按钮类型 */
  type?: 'primary' | 'secondary' | 'danger'
  /** 按钮尺寸 */
  size?: 'small' | 'medium' | 'large'
  /** 是否禁用 */
  disabled?: boolean
  /** 是否加载中 */
  loading?: boolean
  /** 点击事件处理函数 */
  onClick?: (event: MouseEvent) => void
  /** 自定义类名 */
  className?: string
  /** 子元素 */
  children?: React.ReactNode
}
```

## 状态管理最佳实践

### 1. Pinia状态管理

```typescript
// stores/user.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, UserRole } from '@/types/user'
import { userApi } from '@/api/user'

export const useUserStore = defineStore('user', () => {
  // State
  const currentUser = ref<User | null>(null)
  const users = ref<User[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const isLoggedIn = computed(() => !!currentUser.value)
  const isAdmin = computed(() =>
    currentUser.value?.role === UserRole.ADMIN
  )
  const activeUsers = computed(() =>
    users.value.filter(user => user.isActive)
  )

  // Actions
  const fetchUser = async (id: string) => {
    try {
      loading.value = true
      error.value = null
      const user = await userApi.getById(id)
      currentUser.value = user
      return user
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateUser = async (userData: Partial<User>) => {
    if (!currentUser.value) return

    try {
      const updatedUser = await userApi.update(
        currentUser.value.id,
        userData
      )
      currentUser.value = updatedUser
      return updatedUser
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Update failed'
      throw err
    }
  }

  const logout = () => {
    currentUser.value = null
    users.value = []
    error.value = null
  }

  return {
    // State
    currentUser,
    users,
    loading,
    error,

    // Getters
    isLoggedIn,
    isAdmin,
    activeUsers,

    // Actions
    fetchUser,
    updateUser,
    logout
  }
})
```

### 2. 响应式数据管理

```typescript
// composables/useApi.ts
import { ref, type Ref } from 'vue'
import type { ApiResponse } from '@/types/api'

export function useApi<T>(
  apiCall: () => Promise<ApiResponse<T>>
) {
  const data = ref<T | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const execute = async () => {
    try {
      loading.value = true
      error.value = null
      const response = await apiCall()
      data.value = response.data
      return response
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'API Error'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    data: data as Ref<T | null>,
    loading,
    error,
    execute,
    reset: () => {
      data.value = null
      error.value = null
      loading.value = false
    }
  }
}

// 使用示例
const { data: user, loading, error, execute } = useApi(() =>
  userApi.getById('123')
)
```

## 自动化测试

### 1. 单元测试配置

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
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'c8',
      reporter: ['text', 'html', 'json'],
      exclude: [
        'node_modules/',
        'tests/',
        'dist/',
        '**/*.d.ts'
      ]
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})

// tests/setup.ts
import { config } from '@vue/test-utils'
import { vi } from 'vitest'

// 全局配置
config.global.stubs = {
  'font-awesome-icon': true,
  'router-link': true,
  'router-view': true
}

// Mock全局对象
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
    dispatchEvent: vi.fn(),
  })),
})
```

### 2. 组件测试示例

```typescript
// tests/unit/components/Button.spec.ts
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseButton from '@/components/common/BaseButton.vue'

describe('BaseButton', () => {
  it('renders correctly with default props', () => {
    const wrapper = mount(BaseButton, {
      slots: {
        default: 'Click me'
      }
    })

    expect(wrapper.find('button').exists()).toBe(true)
    expect(wrapper.text()).toBe('Click me')
    expect(wrapper.classes()).toContain('base-button')
    expect(wrapper.classes()).toContain('base-button--primary')
    expect(wrapper.classes()).toContain('base-button--medium')
  })

  it('applies correct type classes', () => {
    const wrapper = mount(BaseButton, {
      props: { type: 'danger' }
    })

    expect(wrapper.classes()).toContain('base-button--danger')
  })

  it('emits click event when clicked', async () => {
    const wrapper = mount(BaseButton)
    await wrapper.find('button').trigger('click')

    expect(wrapper.emitted()).toHaveProperty('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('does not emit click when disabled', async () => {
    const wrapper = mount(BaseButton, {
      props: { disabled: true }
    })
    await wrapper.find('button').trigger('click')

    expect(wrapper.emitted('click')).toBeUndefined()
  })

  it('applies disabled state correctly', () => {
    const wrapper = mount(BaseButton, {
      props: { disabled: true }
    })

    const button = wrapper.find('button')
    expect(button.attributes('disabled')).toBeDefined()
    expect(button.classes()).toContain('base-button--disabled')
  })
})
```

### 3. API测试示例

```typescript
// tests/unit/api/user.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { userApi } from '@/api/user'
import { httpClient } from '@/utils/http'

vi.mock('@/utils/http')

describe('User API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch user by ID', async () => {
    const mockUser = {
      id: '123',
      name: 'John Doe',
      email: 'john@example.com'
    }

    vi.mocked(httpClient.get).mockResolvedValue({
      data: mockUser
    })

    const result = await userApi.getById('123')

    expect(httpClient.get).toHaveBeenCalledWith('/users/123')
    expect(result).toEqual(mockUser)
  })

  it('should handle API errors', async () => {
    const error = new Error('User not found')
    vi.mocked(httpClient.get).mockRejectedValue(error)

    await expect(userApi.getById('999')).rejects.toThrow('User not found')
  })
})
```

## CI/CD集成

### 1. GitHub Actions配置

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Lint
      run: npm run lint

    - name: Type check
      run: npm run type-check

    - name: Run tests
      run: npm run test:unit

    - name: Run E2E tests
      run: npm run test:e2e

    - name: Build
      run: npm run build

    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20.x'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Build for production
      run: npm run build

    - name: Deploy to production
      run: |
        # 部署脚本
        echo "Deploying to production..."
```

### 2. 代码质量检查

```yaml
# .github/workflows/quality.yml
name: Code Quality

on:
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      with:
        fetch-depth: 0

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20.x'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: ESLint
      run: npm run lint

    - name: Prettier check
      run: npm run format:check

    - name: TypeScript check
      run: npm run type-check

    - name: Bundle size check
      run: |
        npm run build
        npx bundlesize

    - name: Security audit
      run: npm audit --audit-level high
```

## 性能优化

### 1. 构建优化

```typescript
// vite.config.ts 生产环境优化
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production'

  return {
    build: {
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: isProduction,
          drop_debugger: isProduction,
          pure_funcs: isProduction ? ['console.log'] : []
        }
      },
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['vue', 'vue-router', 'pinia'],
            utils: ['axios', 'dayjs', 'lodash-es']
          }
        }
      },
      chunkSizeWarningLimit: 1000
    }
  }
})
```

### 2. 运行时性能优化

```typescript
// composables/useLazyLoad.ts
import { ref, onMounted, onUnmounted } from 'vue'

export function useLazyLoad(
  callback: () => void,
  options?: IntersectionObserverInit
) {
  const target = ref<HTMLElement>()
  const observer = ref<IntersectionObserver>()

  onMounted(() => {
    if ('IntersectionObserver' in window) {
      observer.value = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              callback()
              observer.value?.unobserve(entry.target)
            }
          })
        },
        {
          threshold: 0.1,
          ...options
        }
      )

      if (target.value) {
        observer.value.observe(target.value)
      }
    } else {
      // 降级处理
      callback()
    }
  })

  onUnmounted(() => {
    observer.value?.disconnect()
  })

  return { target }
}

// 图片懒加载组件
// components/LazyImage.vue
<template>
  <div ref="target" class="lazy-image-container">
    <img
      v-if="isVisible"
      :src="src"
      :alt="alt"
      :class="imageClass"
      @load="onLoad"
      @error="onError"
    />
    <div v-else class="lazy-image-placeholder">
      <slot name="placeholder">
        <div class="loading-spinner">Loading...</div>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useLazyLoad } from '@/composables/useLazyLoad'

interface Props {
  src: string
  alt: string
  imageClass?: string
}

const props = defineProps<Props>()
const isVisible = ref(false)
const { target } = useLazyLoad(() => {
  isVisible.value = true
})

const onLoad = () => {
  // 图片加载完成
}

const onError = () => {
  // 图片加载失败
}
</script>
```

## 监控和错误处理

### 1. 错误监控集成

```typescript
// utils/monitoring.ts
import * as Sentry from '@sentry/vue'
import { BrowserTracing } from '@sentry/tracing'

export function initMonitoring(app: App) {
  if (import.meta.env.PROD) {
    Sentry.init({
      app,
      dsn: import.meta.env.VITE_SENTRY_DSN,
      integrations: [
        new BrowserTracing({
          routingInstrumentation: Sentry.vueRouterInstrumentation(
            app.config.globalProperties.$router
          )
        })
      ],
      tracesSampleRate: 0.1,
      environment: import.meta.env.MODE
    })
  }
}

// 错误边界组件
// components/ErrorBoundary.vue
<template>
  <div v-if="hasError" class="error-boundary">
    <h2>Something went wrong</h2>
    <p>{{ error?.message }}</p>
    <button @click="retry">Retry</button>
  </div>
  <slot v-else />
</template>

<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'
import { captureException } from '@sentry/vue'

const hasError = ref(false)
const error = ref<Error | null>(null)

onErrorCaptured((err: Error) => {
  hasError.value = true
  error.value = err
  captureException(err)
  return false
})

const retry = () => {
  hasError.value = false
  error.value = null
}
</script>
```

## 总结

前端工程化是一个持续改进的过程，需要团队共同努力。通过实施本文介绍的最佳实践，你的团队可以：

1. **提升开发效率**：统一的代码规范和自动化流程
2. **保证代码质量**：自动化测试和代码审查
3. **优化用户体验**：性能监控和错误处理
4. **简化部署流程**：CI/CD自动化
5. **促进团队协作**：规范的项目结构和文档

记住，工程化的最终目标是让开发者更专注于业务逻辑，而不是被工具和流程所束缚。选择适合团队的工具和流程，并持续优化和改进。

---
