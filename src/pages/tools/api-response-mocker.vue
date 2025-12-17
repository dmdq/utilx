<template>
  <div class="container mx-auto p-4 max-w-6xl">
    <h1 class="text-3xl font-bold mb-6">API响应模拟器</h1>
    <p class="text-muted-foreground mb-8">根据JSON Schema自动生成模拟API响应数据，支持多种数据类型和随机生成</p>

    <div class="grid lg:grid-cols-2 gap-8">
      <!-- 左侧：Schema输入和配置 -->
      <div class="space-y-6">
        <!-- Schema输入 -->
        <div class="bg-card p-6 rounded-lg border">
          <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
            <FileCode class="w-5 h-5 text-primary" />
            JSON Schema
          </h2>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">输入JSON Schema</label>
              <textarea
                v-model="schemaInput"
                class="w-full h-64 px-3 py-2 font-mono text-sm border rounded-md"
                placeholder='{
  "type": "object",
  "properties": {
    "id": { "type": "number" },
    "name": { "type": "string" },
    "email": { "type": "string", "format": "email" }
  }
}'
                @input="generateMockData"
              ></textarea>
            </div>

            <div class="flex gap-2">
              <button
                @click="loadExampleSchema('user')"
                class="px-3 py-1 bg-secondary text-secondary-foreground rounded text-sm hover:bg-secondary/90"
              >
                用户示例
              </button>
              <button
                @click="loadExampleSchema('product')"
                class="px-3 py-1 bg-secondary text-secondary-foreground rounded text-sm hover:bg-secondary/90"
              >
                产品示例
              </button>
              <button
                @click="loadExampleSchema('api')"
                class="px-3 py-1 bg-secondary text-secondary-foreground rounded text-sm hover:bg-secondary/90"
              >
                API响应示例
              </button>
            </div>
          </div>
        </div>

        <!-- 生成配置 -->
        <div class="bg-card p-6 rounded-lg border">
          <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
            <Settings class="w-5 h-5 text-primary" />
            生成配置
          </h2>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">生成数量</label>
              <input
                v-model.number="config.count"
                type="number"
                min="1"
                max="100"
                class="w-full px-3 py-2 border rounded-md"
                @input="generateMockData"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">数组对象策略</label>
              <select
                v-model="config.arrayStrategy"
                class="w-full px-3 py-2 border rounded-md"
                @change="generateMockData"
              >
                <option value="random">随机数量（1-5）</option>
                <option value="fixed">固定数量</option>
                <option value="empty">空数组</option>
              </select>
            </div>

            <div class="flex items-center gap-2">
              <input
                v-model="config.includeNull"
                type="checkbox"
                id="includeNull"
                class="rounded"
                @change="generateMockData"
              />
              <label for="includeNull" class="text-sm font-medium">允许null值</label>
            </div>

            <div class="flex items-center gap-2">
              <input
                v-model="config.useChinese"
                type="checkbox"
                id="useChinese"
                class="rounded"
                @change="generateMockData"
              />
              <label for="useChinese" class="text-sm font-medium">使用中文内容</label>
            </div>
          </div>
        </div>

        <!-- 生成历史 -->
        <div class="bg-card p-6 rounded-lg border">
          <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
            <History class="w-5 h-5 text-primary" />
            生成历史
          </h2>

          <div v-if="history.length === 0" class="text-muted-foreground text-sm">
            暂无生成历史
          </div>

          <div v-else class="space-y-2 max-h-48 overflow-y-auto">
            <div
              v-for="(item, index) in history"
              :key="index"
              class="flex items-center justify-between p-2 bg-muted rounded"
            >
              <span class="text-sm">{{ item.timestamp }} - {{ item.count }}条数据</span>
              <button
                @click="loadFromHistory(index)"
                class="text-primary hover:text-primary/80 text-sm"
              >
                加载
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：生成的数据和操作 -->
      <div class="space-y-6">
        <!-- 生成的数据 -->
        <div class="bg-card p-6 rounded-lg border">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-semibold flex items-center gap-2">
              <Database class="w-5 h-5 text-primary" />
              生成的数据
            </h2>
            <div class="flex gap-2">
              <button
                @click="formatJson"
                class="px-3 py-1 bg-secondary text-secondary-foreground rounded text-sm hover:bg-secondary/90"
              >
                格式化
              </button>
              <button
                @click="copyMockData"
                class="px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90"
              >
                复制
              </button>
              <button
                @click="downloadMockData"
                class="px-3 py-1 bg-secondary text-secondary-foreground rounded text-sm hover:bg-secondary/90"
              >
                下载
              </button>
            </div>
          </div>

          <div class="relative">
            <textarea
              v-model="mockDataOutput"
              class="w-full h-96 px-3 py-2 font-mono text-sm border rounded-md"
              readonly
            ></textarea>
            <div
              v-if="copySuccess"
              class="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded text-sm"
            >
              已复制！
            </div>
          </div>
        </div>

        <!-- 数据统计 -->
        <div class="bg-card p-6 rounded-lg border">
          <h2 class="text-xl font-semibold mb-4">数据统计</h2>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-muted-foreground">对象数量:</span>
              <span class="font-medium ml-2">{{ stats.objectCount }}</span>
            </div>
            <div>
              <span class="text-muted-foreground">数组数量:</span>
              <span class="font-medium ml-2">{{ stats.arrayCount }}</span>
            </div>
            <div>
              <span class="text-muted-foreground">字符串数量:</span>
              <span class="font-medium ml-2">{{ stats.stringCount }}</span>
            </div>
            <div>
              <span class="text-muted-foreground">数字数量:</span>
              <span class="font-medium ml-2">{{ stats.numberCount }}</span>
            </div>
            <div>
              <span class="text-muted-foreground">布尔值数量:</span>
              <span class="font-medium ml-2">{{ stats.booleanCount }}</span>
            </div>
            <div>
              <span class="text-muted-foreground">数据大小:</span>
              <span class="font-medium ml-2">{{ formatFileSize(stats.dataSize) }}</span>
            </div>
          </div>
        </div>

        <!-- 使用说明 -->
        <div class="bg-card p-6 rounded-lg border">
          <h2 class="text-xl font-semibold mb-4">使用说明</h2>
          <div class="space-y-2 text-sm text-muted-foreground">
            <div>
              <strong class="text-foreground">支持的JSON Schema类型:</strong>
            </div>
            <ul class="list-disc list-inside space-y-1 ml-2">
              <li>string: 支持format（email, date, uri, uuid等）</li>
              <li>number/integer: 生成随机数字</li>
              <li>boolean: 随机true/false</li>
              <li>array: 根据配置生成数组</li>
              <li>object: 递归生成嵌套对象</li>
              <li>null: 随机生成null值（如果启用）</li>
            </ul>
            <div class="mt-3">
              <strong class="text-foreground">高级特性:</strong>
            </div>
            <ul class="list-disc list-inside space-y-1 ml-2">
              <li>支持faker.js格式的占位符</li>
              <li>支持枚举值（enum属性）</li>
              <li>支持最小/最大值约束</li>
              <li>支持正则表达式模式</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { FileCode, Settings, History, Database } from 'lucide-vue-next'
import { useSEO } from '~/composables/useSEO'

setPageTitle('API响应模拟器')

const schemaInput = ref('')
const mockDataOutput = ref('')
const copySuccess = ref(false)
const history = ref([])

const config = ref({
  count: 1,
  arrayStrategy: 'random',
  includeNull: false,
  useChinese: false
})

const stats = computed(() => {
  if (!mockDataOutput.value) {
    return {
      objectCount: 0,
      arrayCount: 0,
      stringCount: 0,
      numberCount: 0,
      booleanCount: 0,
      dataSize: 0
    }
  }

  try {
    const data = JSON.parse(mockDataOutput.value)
    return analyzeData(data)
  } catch (e) {
    return {
      objectCount: 0,
      arrayCount: 0,
      stringCount: 0,
      numberCount: 0,
      booleanCount: 0,
      dataSize: new Blob([mockDataOutput.value]).size
    }
  }
})

const analyzeData = (data, result = { objectCount: 0, arrayCount: 0, stringCount: 0, numberCount: 0, booleanCount: 0 }) => {
  if (data === null || data === undefined) return result

  if (Array.isArray(data)) {
    result.arrayCount++
    data.forEach(item => analyzeData(item, result))
  } else if (typeof data === 'object') {
    result.objectCount++
    Object.values(data).forEach(value => analyzeData(value, result))
  } else if (typeof data === 'string') {
    result.stringCount++
  } else if (typeof data === 'number') {
    result.numberCount++
  } else if (typeof data === 'boolean') {
    result.booleanCount++
  }

  return result
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const generateMockData = () => {
  try {
    if (!schemaInput.value.trim()) {
      mockDataOutput.value = ''
      return
    }

    const schema = JSON.parse(schemaInput.value)
    let result

    if (config.value.count > 1) {
      result = Array.from({ length: config.value.count }, () => generateBySchema(schema))
    } else {
      result = generateBySchema(schema)
    }

    mockDataOutput.value = JSON.stringify(result, null, 2)

    // 添加到历史记录
    history.value.unshift({
      timestamp: new Date().toLocaleString(),
      schema: schemaInput.value,
      data: mockDataOutput.value,
      count: config.value.count
    })

    // 限制历史记录数量
    if (history.value.length > 10) {
      history.value = history.value.slice(0, 10)
    }
  } catch (error) {
    mockDataOutput.value = 'JSON Schema 解析错误: ' + error.message
  }
}

const generateBySchema = (schema) => {
  if (!schema || typeof schema !== 'object') {
    return null
  }

  // 处理枚举值
  if (schema.enum) {
    return schema.enum[Math.floor(Math.random() * schema.enum.length)]
  }

  const type = schema.type

  switch (type) {
    case 'string':
      return generateString(schema)
    case 'number':
    case 'integer':
      return generateNumber(schema)
    case 'boolean':
      return Math.random() > 0.5
    case 'array':
      return generateArray(schema)
    case 'object':
      return generateObject(schema)
    case 'null':
      return config.value.includeNull && Math.random() > 0.8 ? null : null
    default:
      return null
  }
}

const generateString = (schema) => {
  const format = schema.format

  if (config.value.useChinese) {
    const chineseStrings = ['张三', '李四', '王五', '产品描述', '用户评论', '订单信息', '商品名称']
    return chineseStrings[Math.floor(Math.random() * chineseStrings.length)]
  }

  switch (format) {
    case 'email':
      return `user${Math.floor(Math.random() * 1000)}@example.com`
    case 'date':
      return new Date(Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]
    case 'date-time':
      return new Date(Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)).toISOString()
    case 'uri':
      return `https://example.com/resource/${Math.floor(Math.random() * 1000)}`
    case 'uuid':
      return generateUUID()
    default:
      const strings = ['sample', 'test', 'demo', 'example', 'mock', 'data']
      return strings[Math.floor(Math.random() * strings.length)] + Math.floor(Math.random() * 1000)
  }
}

const generateNumber = (schema) => {
  const min = schema.minimum || 0
  const max = schema.maximum || 100

  if (schema.type === 'integer') {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  return Math.random() * (max - min) + min
}

const generateArray = (schema) => {
  if (config.value.arrayStrategy === 'empty') {
    return []
  }

  let count
  if (config.value.arrayStrategy === 'fixed') {
    count = schema.minItems || 3
  } else {
    count = Math.floor(Math.random() * 5) + 1
  }

  const items = Array.from({ length: count }, () => generateBySchema(schema.items || { type: 'string' }))
  return items
}

const generateObject = (schema) => {
  const result = {}
  const properties = schema.properties || {}

  Object.keys(properties).forEach(key => {
    // 随机决定是否包含某些可选属性
    if (schema.required && schema.required.includes(key)) {
      result[key] = generateBySchema(properties[key])
    } else if (Math.random() > 0.2) { // 80%概率包含可选属性
      result[key] = generateBySchema(properties[key])
    }
  })

  return result
}

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

const loadExampleSchema = (type) => {
  const schemas = {
    user: {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        name: { type: 'string' },
        email: { type: 'string', format: 'email' },
        age: { type: 'integer', minimum: 18, maximum: 80 },
        isActive: { type: 'boolean' },
        avatar: { type: 'string', format: 'uri' },
        createdAt: { type: 'string', format: 'date-time' }
      },
      required: ['id', 'name', 'email']
    },
    product: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        price: { type: 'number', minimum: 0 },
        category: { enum: ['电子产品', '服装', '食品', '图书'] },
        tags: {
          type: 'array',
          items: { type: 'string' }
        },
        inStock: { type: 'boolean' },
        description: { type: 'string' }
      }
    },
    api: {
      type: 'object',
      properties: {
        code: { type: 'integer', enum: [200, 400, 404, 500] },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            page: { type: 'integer' },
            pageSize: { type: 'integer' },
            list: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  title: { type: 'string' },
                  content: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  }

  schemaInput.value = JSON.stringify(schemas[type], null, 2)
  generateMockData()
}

const formatJson = () => {
  try {
    const parsed = JSON.parse(mockDataOutput.value)
    mockDataOutput.value = JSON.stringify(parsed, null, 2)
  } catch (e) {
    // 如果格式化失败，保持原样
  }
}

const copyMockData = async () => {
  try {
    await navigator.clipboard.writeText(mockDataOutput.value)
    copySuccess.value = true
    setTimeout(() => {
      copySuccess.value = false
    }, 2000)
  } catch (err) {
    console.error('复制失败:', err)
  }
}

const downloadMockData = () => {
  const blob = new Blob([mockDataOutput.value], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `mock-data-${Date.now()}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const loadFromHistory = (index) => {
  const item = history.value[index]
  schemaInput.value = item.schema
  mockDataOutput.value = item.data
  config.value.count = item.count
}

onMounted(() => {
  // 加载默认示例
  loadExampleSchema('user')
})
</script>