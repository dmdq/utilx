<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" /> -->

    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">JSONPath 查询工具</h1>
      <p class="text-muted-foreground">使用 JSONPath 表达式查询和提取 JSON 数据</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="space-y-6">
      <!-- JSON 输入区 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- JSON 输入 -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold">JSON 数据</h2>
            <div class="flex gap-2">
              <button
                @click="loadSample"
                class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                加载示例
              </button>
              <button
                @click="formatJSON"
                class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                格式化
              </button>
              <button
                @click="clearJSON"
                class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                清空
              </button>
            </div>
          </div>

          <div class="relative">
            <textarea
              v-model="jsonInput"
              @input="validateJSON"
              placeholder="请输入 JSON 数据..."
              class="w-full h-96 p-4 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
              :class="{ 'border-red-500': jsonError }"
            ></textarea>

            <!-- 字符统计 -->
            <div class="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background px-2 py-1 rounded">
              {{ jsonInput.length }} 字符
            </div>
          </div>

          <!-- JSON 错误提示 -->
          <div v-if="jsonError" class="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {{ jsonError }}
          </div>
        </div>

        <!-- JSONPath 查询区 -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold">JSONPath 查询</h2>
            <div class="flex gap-2">
              <button
                @click="clearQuery"
                class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                清空
              </button>
            </div>
          </div>

          <!-- JSONPath 输入 -->
          <div class="space-y-2">
            <label class="text-sm font-medium">JSONPath 表达式</label>
            <div class="relative">
              <input
                v-model="jsonPath"
                @keyup.enter="executeQuery"
                placeholder="例如: $.store.book[*].author"
                class="w-full p-3 pr-10 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono"
              />
              <button
                v-if="jsonPath"
                @click="jsonPath = ''"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- 快捷示例 -->
          <div class="space-y-2">
            <label class="text-sm font-medium">快捷示例</label>
            <div class="grid grid-cols-1 gap-2">
              <button
                v-for="example in pathExamples"
                :key="example.path"
                @click="applyExample(example)"
                class="p-2 text-sm bg-muted hover:bg-muted/80 rounded text-left transition-colors"
              >
                <div class="font-mono text-primary">{{ example.path }}</div>
                <div class="text-xs text-muted-foreground">{{ example.description }}</div>
              </button>
            </div>
          </div>

          <!-- 执行按钮 -->
          <button
            @click="executeQuery"
            :disabled="!jsonData || !jsonPath"
            class="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            执行查询
          </button>

          <!-- 查询结果 -->
          <div v-if="queryResult !== null" class="space-y-2">
            <div class="flex items-center justify-between">
              <label class="text-sm font-medium">查询结果</label>
              <div class="flex gap-2">
                <button
                  @click="copyResult"
                  class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {{ copied ? '已复制' : '复制' }}
                </button>
              </div>
            </div>

            <div class="border rounded-lg overflow-hidden">
              <!-- 结果类型标签 -->
              <div class="px-3 py-2 bg-muted border-b flex items-center gap-2">
                <span class="text-sm font-medium">
                  {{ Array.isArray(queryResult) ? `数组 (${queryResult.length} 项)` : typeof queryResult }}
                </span>
              </div>

              <!-- 结果内容 -->
              <div class="max-h-64 overflow-auto p-4">
                <pre v-if="typeof queryResult === 'object'" class="text-sm">{{ JSON.stringify(queryResult, null, 2) }}</pre>
                <div v-else class="text-sm">{{ queryResult }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- JSONPath 语法说明 -->
      <div class="bg-card   rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">JSONPath 语法说明</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 class="font-medium mb-3">基础语法</h3>
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b">
                  <th class="text-left py-2">表达式</th>
                  <th class="text-left py-2">说明</th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-b">
                  <td class="py-2 font-mono text-primary">$</td>
                  <td class="py-2">根节点</td>
                </tr>
                <tr class="border-b">
                  <td class="py-2 font-mono text-primary">@</td>
                  <td class="py-2">当前节点</td>
                </tr>
                <tr class="border-b">
                  <td class="py-2 font-mono text-primary">. 或 []</td>
                  <td class="py-2">子节点操作符</td>
                </tr>
                <tr class="border-b">
                  <td class="py-2 font-mono text-primary">..</td>
                  <td class="py-2">递归下降（所有层级的子节点）</td>
                </tr>
                <tr>
                  <td class="py-2 font-mono text-primary">*</td>
                  <td class="py-2">通配符，匹配所有元素</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div>
            <h3 class="font-medium mb-3">高级语法</h3>
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b">
                  <th class="text-left py-2">表达式</th>
                  <th class="text-left py-2">说明</th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-b">
                  <td class="py-2 font-mono text-primary">[]</td>
                  <td class="py-2">迭代器（如 [0,1] 或 [1:10]）</td>
                </tr>
                <tr class="border-b">
                  <td class="py-2 font-mono text-primary">[start:end:step]</td>
                  <td class="py-2">数组切片（支持 Python 风格）</td>
                </tr>
                <tr class="border-b">
                  <td class="py-2 font-mono text-primary">?(expression)</td>
                  <td class="py-2">脚本表达式（过滤）</td>
                </tr>
                <tr class="border-b">
                  <td class="py-2 font-mono text-primary">(...)</td>
                  <td class="py-2">脚本表达式</td>
                </tr>
                <tr>
                  <td class="py-2 font-mono text-primary">''</td>
                  <td class="py-2">脚本表达式中的字符串</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 示例 -->
        <div class="mt-6">
          <h3 class="font-medium mb-3">常用示例</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 class="text-sm font-medium mb-2">基础查询</h4>
              <ul class="space-y-1 text-sm">
                <li><code class="bg-muted px-1 rounded">$.store.book[*].author</code> - 所有书籍的作者</li>
                <li><code class="bg-muted px-1 rounded">$..author</code> - 所有作者</li>
                <li><code class="bg-muted px-1 rounded">$.store.*</code> - store 下的所有子节点</li>
                <li><code class="bg-muted px-1 rounded">$..book[?(@.price<10)]</code> - 价格小于 10 的书</li>
              </ul>
            </div>
            <div>
              <h4 class="text-sm font-medium mb-2">高级查询</h4>
              <ul class="space-y-1 text-sm">
                <li><code class="bg-muted px-1 rounded">$..book[0,1]</code> - 前两本书</li>
                <li><code class="bg-muted px-1 rounded">$..book[-1]</code> - 最后一本书</li>
                <li><code class="bg-muted px-1 rounded">$..book[?(@.category=='fiction')]</code> - 小说类书籍</li>
                <li><code class="bg-muted px-1 rounded">$..[?(@.length>2)]</code> - 长度大于 2 的数组</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- 相关工具 -->
      <div class="bg-card   rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">相关工具</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NuxtLink
            to="/tools/json-formatter"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <FileJson class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">JSON格式化</p>
              <p class="text-xs text-muted-foreground">美化压缩JSON</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
          <NuxtLink
            to="/tools/xpath-tester"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <FileText class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">XPath测试器</p>
              <p class="text-xs text-muted-foreground">XML路径查询</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
          <NuxtLink
            to="/tools/jwt-decode"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <FileCode class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">JWT解析器</p>
              <p class="text-xs text-muted-foreground">解析JWT令牌</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { X, FileJson, FileText, FileCode, ArrowRight } from 'lucide-vue-next'
import Breadcrumb from '~/components/Breadcrumb.vue'

// 分类信息
const category = { id: 'text', name: '文本处理', description: '文本处理工具集合' }

// 状态管理
const jsonInput = ref('')
const jsonPath = ref('')
const jsonData = ref(null)
const jsonError = ref('')
const queryResult = ref(null)
const copied = ref(false)

// 示例 JSON
const sampleJSON = {
  "store": {
    "book": [
      {
        "category": "reference",
        "author": "Nigel Rees",
        "title": "Sayings of the Century",
        "price": 8.95
      },
      {
        "category": "fiction",
        "author": "Evelyn Waugh",
        "title": "Sword of Honour",
        "price": 12.99
      },
      {
        "category": "fiction",
        "author": "Herman Melville",
        "title": "Moby Dick",
        "isbn": "0-553-21311-3",
        "price": 8.99
      },
      {
        "category": "fiction",
        "author": "J. R. R. Tolkien",
        "title": "The Lord of the Rings",
        "isbn": "0-395-19395-8",
        "price": 22.99
      }
    ],
    "bicycle": {
      "color": "red",
      "price": 19.95
    }
  },
  "expensive": 10
}

// JSONPath 示例
const pathExamples = [
  {
    path: '$.store.book[*].author',
    description: '获取所有书籍的作者'
  },
  {
    path: '$..author',
    description: '获取所有作者（递归查找）'
  },
  {
    path: '$.store.*',
    description: '获取 store 下的所有子节点'
  },
  {
    path: '$..book[0]',
    description: '获取第一本书'
  },
  {
    path: '$..book[-1]',
    description: '获取最后一本书'
  },
  {
    path: '$..book[?(@.price<10)]',
    description: '获取价格小于 10 的书'
  },
  {
    path: '$..book[?(@.category=="fiction")]',
    description: '获取小说类书籍'
  },
  {
    path: '$..book[?(@.isbn)]',
    description: '获取有 ISBN 的书'
  }
]

// 验证 JSON
const validateJSON = () => {
  jsonError.value = ''
  jsonData.value = null

  if (!jsonInput.value.trim()) {
    return
  }

  try {
    jsonData.value = JSON.parse(jsonInput.value)
  } catch (error) {
    jsonError.value = 'JSON 解析错误: ' + error.message
  }
}

// 格式化 JSON
const formatJSON = () => {
  if (!jsonData.value) {
    validateJSON()
  }
  if (jsonData.value) {
    jsonInput.value = JSON.stringify(jsonData.value, null, 2)
  }
}

// 加载示例
const loadSample = () => {
  jsonInput.value = JSON.stringify(sampleJSON, null, 2)
  validateJSON()
}

// 清空 JSON
const clearJSON = () => {
  jsonInput.value = ''
  jsonData.value = null
  jsonError.value = ''
  queryResult.value = null
}

// 清空查询
const clearQuery = () => {
  jsonPath.value = ''
  queryResult.value = null
}

// 应用示例
const applyExample = (example) => {
  jsonPath.value = example.path
}

// 简化的 JSONPath 实现
const executeJSONPath = (obj, path) => {
  // 简单的 JSONPath 解析器
  // 注意：这是一个简化版本，不支持所有 JSONPath 特性

  if (path === '$') {
    return obj
  }

  // 移除开头的 $.
  if (path.startsWith('$.') || path === '$') {
    path = path.substring(2)
  } else if (path.startsWith('$')) {
    path = path.substring(1)
  }

  // 处理递归查找 ..
  if (path.includes('..')) {
    return handleRecursiveSearch(obj, path)
  }

  // 分割路径
  const parts = path.split('.')
  let current = obj

  for (let part of parts) {
    if (!part) continue

    // 处理数组索引
    if (part.includes('[') && part.includes(']')) {
      const [prop, indexStr] = part.split('[')
      const index = parseInt(indexStr.replace(']', ''))

      if (prop && current[prop] !== undefined) {
        current = current[prop][index]
      } else if (current && Array.isArray(current)) {
        current = current[index]
      }
    }
    // 处理通配符
    else if (part === '*') {
      if (Array.isArray(current)) {
        return current
      } else if (typeof current === 'object' && current !== null) {
        return Object.values(current)
      }
    }
    // 普通属性访问
    else {
      if (current && typeof current === 'object' && current[part] !== undefined) {
        current = current[part]
      } else {
        return undefined
      }
    }
  }

  return current
}

// 处理递归搜索
const handleRecursiveSearch = (obj, path) => {
  const [beforeRecursive, afterRecursive] = path.split('..', 2)
  const results = []

  function search(current) {
    if (Array.isArray(current)) {
      for (let item of current) {
        search(item)
      }
    } else if (current && typeof current === 'object') {
      // 检查是否匹配递归后的路径
      if (afterRecursive) {
        const value = executeJSONPath(current, afterRecursive)
        if (value !== undefined) {
          results.push(value)
        }
      }
      // 递归搜索所有子节点
      for (let key in current) {
        search(current[key])
      }
    }
  }

  // 从起始位置开始搜索
  let startNode = obj
  if (beforeRecursive) {
    startNode = executeJSONPath(obj, beforeRecursive)
  }

  if (startNode) {
    search(startNode)
  }

  return results.length === 1 ? results[0] : results
}

// 执行查询
const executeQuery = () => {
  if (!jsonData.value || !jsonPath.value) {
    return
  }

  try {
    queryResult.value = executeJSONPath(jsonData.value, jsonPath.value)
  } catch (error) {
    queryResult.value = '查询错误: ' + error.message
  }
}

// 复制结果
const copyResult = async () => {
  const text = typeof queryResult.value === 'object'
    ? JSON.stringify(queryResult.value, null, 2)
    : String(queryResult.value)

  try {
    await navigator.clipboard.writeText(text)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (error) {
    // 降级方案
    const textarea = document.createElement('textarea')
    textarea.value = text
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  }
}

// SEO配置
useSeoMeta({
  title: 'JSONPath查询工具 - 在线JSON路径表达式查询',
  description: '免费在线JSONPath查询工具，支持使用JSONPath表达式查询和提取JSON数据，提供语法说明和示例。',
  keywords: ['jsonpath', 'json', 'query', 'path', 'extract', '在线工具']
})


</script>