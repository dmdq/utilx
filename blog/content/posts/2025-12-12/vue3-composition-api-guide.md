---
title: "Vue 3 Composition API 完全指南"
slug: "vue3-composition-api-guide"
date: 2025-12-12T16:00:00+08:00
draft: false
tags: ['Vue3', 'Composition API', '前端框架', '组件开发']
categories: ['前端开发']
author: '有条工具团队'
summary: '全面介绍 Vue 3 Composition API 的使用方法和最佳实践'
---

## 前言

Vue 3 引入的 Composition API 是一个革命性的特性，它提供了一种更灵活、更强大的组件逻辑组织方式。相比 Options API，Composition API 具有更好的类型推导、逻辑复用和代码组织能力。

## 为什么需要 Composition API？

### Options API 的局限性

```javascript
// Options API - 逻辑分散
export default {
  data() {
    return {
      count: 0,
      loading: false,
      items: []
    }
  },
  methods: {
    increment() {
      this.count++
    },
    async fetchItems() {
      this.loading = true
      try {
        this.items = await api.getItems()
      } finally {
        this.loading = false
      }
    }
  },
  mounted() {
    this.fetchItems()
  }
}
```

### Composition API 的优势

```javascript
// Composition API - 逻辑集中
import { ref, onMounted } from 'vue'

export default {
  setup() {
    // 计数器逻辑
    const count = ref(0)
    const increment = () => count.value++

    // 数据获取逻辑
    const loading = ref(false)
    const items = ref([])
    const fetchItems = async () => {
      loading.value = true
      try {
        items.value = await api.getItems()
      } finally {
        loading.value = false
      }
    }

    onMounted(fetchItems)

    return {
      count,
      increment,
      loading,
      items,
      fetchItems
    }
  }
}
```

## 核心 API 详解

### 1. ref 和 reactive

```javascript
import { ref, reactive, isRef, unref } from 'vue'

// ref - 适用于基本类型
const count = ref(0)
const message = ref('Hello')

// 访问值需要 .value
console.log(count.value) // 0
count.value = 1

// reactive - 适用于对象
const state = reactive({
  count: 0,
  user: {
    name: 'John',
    age: 30
  }
})

// 直接访问属性，无需 .value
console.log(state.count) // 0
state.user.name = 'Jane'

// 类型检查
if (isRef(count)) {
  console.log('这是一个 ref')
}

// 获取 ref 的原始值
const rawValue = unref(count)
```

### 2. computed 和 watch

```javascript
import { ref, computed, watch, watchEffect } from 'vue'

export default {
  setup() {
    const firstName = ref('John')
    const lastName = ref('Doe')

    // 计算属性
    const fullName = computed(() => `${firstName.value} ${lastName.value}`)

    // 可写的计算属性
    const fullNameWritable = computed({
      get: () => `${firstName.value} ${lastName.value}`,
      set: (value) => {
        const names = value.split(' ')
        firstName.value = names[0]
        lastName.value = names[1]
      }
    })

    // 监听单个 ref
    watch(firstName, (newVal, oldVal) => {
      console.log(`firstName changed from ${oldVal} to ${newVal}`)
    })

    // 监听多个源
    watch(
      [firstName, lastName],
      ([newFirst, newLast], [oldFirst, oldLast]) => {
        console.log('Names changed:', { newFirst, newLast })
      }
    )

    // 深度监听对象
    const user = reactive({ name: 'John', details: { age: 30 } })
    watch(
      user,
      (newUser, oldUser) => {
        console.log('User changed:', newUser)
      },
      { deep: true }
    )

    // 立即执行的 watch
    watchEffect(() => {
      console.log(`Current full name: ${fullName.value}`)
    })

    return {
      firstName,
      lastName,
      fullName,
      fullNameWritable
    }
  }
}
```

### 3. 生命周期钩子

```javascript
import {
  onMounted,
  onUnmounted,
  onBeforeMount,
  onBeforeUnmount,
  onUpdated,
  onBeforeUpdate,
  onErrorCaptured
} from 'vue'

export default {
  setup() {
    // 组件挂载前
    onBeforeMount(() => {
      console.log('Component is about to mount')
    })

    // 组件挂载后
    onMounted(() => {
      console.log('Component mounted')
      // DOM 操作、API 调用等
    })

    // 组件更新前
    onBeforeUpdate(() => {
      console.log('Component is about to update')
    })

    // 组件更新后
    onUpdated(() => {
      console.log('Component updated')
    })

    // 组件卸载前
    onBeforeUnmount(() => {
      console.log('Component is about to unmount')
    })

    // 组件卸载后
    onUnmounted(() => {
      console.log('Component unmounted')
      // 清理定时器、事件监听器等
    })

    // 错误捕获
    onErrorCaptured((err, instance, info) => {
      console.error('Error captured:', err)
      return false // 阻止错误继续向上传播
    })
  }
}
```

## 自定义 Hooks

### 1. 创建可复用的逻辑

```javascript
// composables/useCounter.js
import { ref, computed } from 'vue'

export function useCounter(initialValue = 0) {
  const count = ref(initialValue)

  const increment = (delta = 1) => {
    count.value += delta
  }

  const decrement = (delta = 1) => {
    count.value -= delta
  }

  const reset = () => {
    count.value = initialValue
  }

  const isEven = computed(() => count.value % 2 === 0)
  const isOdd = computed(() => !isEven.value)

  return {
    count,
    increment,
    decrement,
    reset,
    isEven,
    isOdd
  }
}

// 使用自定义 Hook
import { useCounter } from '@/composables/useCounter'

export default {
  setup() {
    const { count, increment, decrement, isEven } = useCounter(10)

    return {
      count,
      increment,
      decrement,
      isEven
    }
  }
}
```

### 2. 数据获取 Hook

```javascript
// composables/useFetch.js
import { ref, onMounted, onUnmounted } from 'vue'

export function useFetch(url, options = {}) {
  const data = ref(null)
  const error = ref(null)
  const loading = ref(false)

  let controller = null

  const execute = async (requestUrl = url, requestOptions = options) => {
    loading.value = true
    error.value = null

    try {
      // 取消之前的请求
      if (controller) {
        controller.abort()
      }

      controller = new AbortController()

      const response = await fetch(requestUrl, {
        ...requestOptions,
        signal: controller.signal
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      data.value = await response.json()
    } catch (err) {
      if (err.name !== 'AbortError') {
        error.value = err.message
      }
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    execute()
  })

  onUnmounted(() => {
    if (controller) {
      controller.abort()
    }
  })

  return {
    data,
    error,
    loading,
    execute
  }
}

// 使用数据获取 Hook
import { useFetch } from '@/composables/useFetch'

export default {
  setup() {
    const { data: users, loading, error } = useFetch('/api/users')

    return {
      users,
      loading,
      error
    }
  }
}
```

### 3. 本地存储 Hook

```javascript
// composables/useLocalStorage.js
import { ref, watch } from 'vue'

export function useLocalStorage(key, defaultValue) {
  const storedValue = localStorage.getItem(key)
  const value = ref(storedValue ? JSON.parse(storedValue) : defaultValue)

  // 监听值的变化，同步到 localStorage
  watch(
    value,
    (newValue) => {
      if (newValue === null || newValue === undefined) {
        localStorage.removeItem(key)
      } else {
        localStorage.setItem(key, JSON.stringify(newValue))
      }
    },
    { deep: true }
  )

  return value
}

// 使用示例
export default {
  setup() {
    const theme = useLocalStorage('theme', 'light')
    const userPreferences = useLocalStorage('preferences', {
      language: 'zh-CN',
      fontSize: 16
    })

    return {
      theme,
      userPreferences
    }
  }
}
```

## 与 TypeScript 的完美结合

### 1. 类型定义

```typescript
import { ref, reactive, computed, Ref } from 'vue'

// 定义接口
interface User {
  id: number
  name: string
  email: string
  avatar?: string
}

interface Post {
  id: number
  title: string
  content: string
  authorId: number
  createdAt: Date
}

// 使用类型注解
export default {
  setup() {
    const user: Ref<User | null> = ref(null)
    const users = ref<User[]>([])

    const currentUser = computed((): User | null => {
      return user.value
    })

    const state = reactive<{
      loading: boolean
      error: string | null
      selectedUserId: number | null
    }>({
      loading: false,
      error: null,
      selectedUserId: null
    })

    return {
      user,
      users,
      currentUser,
      state
    }
  }
}
```

### 2. 泛型 Hooks

```typescript
// composables/useApi.ts
import { ref } from 'vue'

interface ApiResponse<T> {
  data: T
  message: string
  status: number
}

export function useApi<T>(url: string) {
  const data = ref<T | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const execute = async (): Promise<void> => {
    loading.value = true
    error.value = null

    try {
      const response = await fetch(url)
      const result: ApiResponse<T> = await response.json()

      if (result.status === 200) {
        data.value = result.data
      } else {
        error.value = result.message
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
    } finally {
      loading.value = false
    }
  }

  return {
    data,
    loading,
    error,
    execute
  }
}

// 使用泛型 Hook
interface Todo {
  id: number
  title: string
  completed: boolean
}

export default {
  setup() {
    const { data: todos, loading } = useApi<Todo[]>('/api/todos')

    return {
      todos,
      loading
    }
  }
}
```

## 性能优化技巧

### 1. 避免不必要的响应式

```javascript
import { ref, markRaw, shallowRef } from 'vue'

// 使用 markRaw 标记不需要响应式的对象
const bigStaticData = markRaw({
  // 大型静态数据，不需要响应式
  items: Array(10000).fill(0).map((_, i) => ({ id: i }))
})

// 使用 shallowRef 创建浅层响应式
const shallowState = shallowRef({
  count: 0,
  deep: { nested: 'value' }
})

// 只有整个对象的替换会触发更新
shallowState.value = { count: 1, deep: { nested: 'new' } }
// shallowState.value.count = 2 不会触发更新
```

### 2. 计算属性缓存

```javascript
import { computed } from 'vue'

export default {
  setup() {
    const items = ref([])
    const filter = ref('')

    // 缓存计算结果，只有依赖变化时重新计算
    const filteredItems = computed(() => {
      console.log('Filtering items...')
      return items.value.filter(item =>
        item.name.toLowerCase().includes(filter.value.toLowerCase())
      )
    })

    return {
      items,
      filter,
      filteredItems
    }
  }
}
```

### 3. 懒加载组件

```javascript
import { defineAsyncComponent } from 'vue'

// 异步组件
const AsyncComponent = defineAsyncComponent(() =>
  import('./HeavyComponent.vue')
)

// 带加载状态的异步组件
const AsyncComponentWithLoading = defineAsyncComponent({
  loader: () => import('./HeavyComponent.vue'),
  loadingComponent: LoadingComponent,
  errorComponent: ErrorComponent,
  delay: 200,
  timeout: 3000
})
```

## 最佳实践

### 1. 逻辑组织

```javascript
// 按功能组织代码
export default {
  setup() {
    // 用户相关逻辑
    const { user, login, logout } = useAuth()

    // 数据获取逻辑
    const { data: posts, loading, refresh } = useFetch('/api/posts')

    // UI 状态逻辑
    const { sidebarOpen, toggleSidebar } = useSidebar()

    // 工具函数
    const formatDate = (date) => new Date(date).toLocaleDateString()

    return {
      user,
      login,
      logout,
      posts,
      loading,
      refresh,
      sidebarOpen,
      toggleSidebar,
      formatDate
    }
  }
}
```

### 2. 状态管理

```javascript
// 使用 Pinia 进行状态管理
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  const isLoggedIn = computed(() => !!user.value)

  const login = async (credentials) => {
    try {
      user.value = await api.login(credentials)
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    user.value = null
  }

  return {
    user,
    isLoggedIn,
    login,
    logout
  }
})
```

## 总结

Vue 3 Composition API 提供了：

1. **更好的逻辑组织**：相关逻辑可以组织在一起
2. **优秀的 TypeScript 支持**：更好的类型推导和检查
3. **灵活的组合能力**：通过自定义 Hook 实现逻辑复用
4. **更小的包体积**：按需引入，Tree-shaking 友好
5. **更好的性能**：更精确的响应式跟踪

掌握 Composition API 是现代 Vue 开发的必备技能，它能帮助我们构建更清晰、更可维护的应用。

---

**相关资源：**
- [Vue 3 官方文档](https://v3.vuejs.org/)
- [Vue 3 迁移指南](https://v3-migration.vuejs.org/)
