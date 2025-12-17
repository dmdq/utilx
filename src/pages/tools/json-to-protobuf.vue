<template>
  <div class="max-w-8xl mx-auto">
    <!-- 头部 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-3">JSON转Protobuf</h1>
      <p class="text-muted-foreground mb-4">将JSON数据转换为Protobuf定义文件，支持protobuf v2和v3版本</p>
    </div>

    <!-- 工具容器 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧输入和配置 -->
      <div class="space-y-6">
        <!-- Protobuf版本选择 -->
        <div class="bg-card rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">Protobuf配置</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">Protobuf版本</label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  v-for="version in protobufVersions"
                  :key="version.value"
                  @click="protobufVersion = version.value"
                  :class="[
                    'px-4 py-2 rounded-lg border transition-colors',
                    protobufVersion === version.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:bg-muted'
                  ]"
                >
                  <div class="font-medium">{{ version.name }}</div>
                  <div class="text-xs text-muted-foreground">{{ version.description }}</div>
                </button>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">包名 (Package)</label>
              <input
                v-model="packageName"
                @input="generateProtobuf"
                placeholder="example.package"
                class="w-full px-3 py-2 border rounded-md"
              >
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">消息名前缀</label>
              <input
                v-model="messagePrefix"
                @input="generateProtobuf"
                placeholder="Auto"
                class="w-full px-3 py-2 border rounded-md"
              >
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">选项</label>
              <div class="space-y-2">
                <label class="flex items-center gap-2">
                  <input
                    v-model="options.optimizeFor"
                    type="checkbox"
                    class="rounded"
                  >
                  <span class="text-sm">添加优化选项</span>
                </label>
                <label class="flex items-center gap-2">
                  <input
                    v-model="options.javaMultipleFiles"
                    type="checkbox"
                    class="rounded"
                  >
                  <span class="text-sm">Java多文件支持</span>
                </label>
                <label class="flex items-center gap-2">
                  <input
                    v-model="options.goPackage"
                    type="checkbox"
                    class="rounded"
                >
                  <span class="text-sm">Go包选项</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- JSON输入 -->
        <div class="bg-card rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-lg font-semibold">JSON输入</h3>
            <div class="flex gap-2">
              <button
                @click="loadSample"
                class="px-3 py-1 bg-secondary hover:bg-secondary/80 rounded text-sm"
              >
                加载示例
              </button>
              <button
                @click="clearJson"
                class="px-3 py-1 bg-destructive text-destructive-foreground rounded text-sm"
              >
                清空
              </button>
            </div>
          </div>

          <div class="mb-3">
            <div class="flex gap-2 mb-2">
              <button
                v-for="sample in samples"
                :key="sample.name"
                @click="loadSampleData(sample)"
                class="px-2 py-1 bg-muted hover:bg-muted/80 rounded text-xs"
              >
                {{ sample.name }}
              </button>
            </div>
          </div>

          <textarea
            v-model="jsonInput"
            @input="generateProtobuf"
            class="w-full h-80 p-3 font-mono text-sm border rounded-md resize-none"
            placeholder="输入JSON数据..."
          ></textarea>

          <div class="mt-2 text-sm text-muted-foreground">
            <div v-if="jsonError" class="text-destructive">{{ jsonError }}</div>
            <div v-else-if="parsedJson">
              对象数: {{ getObjectCount(parsedJson) }} | 数组数: {{ getArrayCount(parsedJson) }} |
              字段数: {{ getFieldCount(parsedJson) }}
            </div>
          </div>
        </div>

        <!-- 类型映射配置 -->
        <div class="bg-card rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">类型映射</h3>
          <div class="space-y-3">
            <div class="text-sm text-muted-foreground mb-2">
              配置JSON类型到Protobuf类型的映射规则
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium mb-1">字符串类型</label>
                <select v-model="typeMapping.string" class="w-full px-2 py-1 text-sm border rounded">
                  <option value="string">string</option>
                  <option value="bytes">bytes</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-medium mb-1">整数类型</label>
                <select v-model="typeMapping.integer" class="w-full px-2 py-1 text-sm border rounded">
                  <option value="int32">int32</option>
                  <option value="int64">int64</option>
                  <option value="uint32">uint32</option>
                  <option value="uint64">uint64</option>
                  <option value="sint32">sint32</option>
                  <option value="sint64">sint64</option>
                  <option value="fixed32">fixed32</option>
                  <option value="fixed64">fixed64</option>
                  <option value="sfixed32">sfixed32</option>
                  <option value="sfixed64">sfixed64</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-medium mb-1">浮点类型</label>
                <select v-model="typeMapping.float" class="w-full px-2 py-1 text-sm border rounded">
                  <option value="float">float</option>
                  <option value="double">double</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-medium mb-1">布尔类型</label>
                <select v-model="typeMapping.boolean" class="w-full px-2 py-1 text-sm border rounded">
                  <option value="bool">bool</option>
                </select>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <input
                v-model="typeMapping.useOptional"
                type="checkbox"
                class="rounded"
              >
              <span class="text-sm">使用optional字段 (仅proto3)</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧结果输出 -->
      <div class="space-y-6">
        <!-- Protobuf输出 -->
        <div class="bg-card rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-lg font-semibold">Protobuf定义</h3>
            <div class="flex gap-2">
              <button
                @click="copyProtobuf"
                class="px-3 py-1 bg-primary text-primary-foreground rounded text-sm"
              >
                复制
              </button>
              <button
                @click="downloadProtobuf"
                class="px-3 py-1 bg-secondary hover:bg-secondary/80 rounded text-sm"
              >
                下载
              </button>
            </div>
          </div>

          <div class="border rounded-md overflow-hidden">
            <div class="bg-muted px-3 py-2 text-sm font-medium flex items-center justify-between">
              <span>{{ protobufVersion.toUpperCase() }} 定义</span>
              <span v-if="protobufOutput" class="text-xs text-muted-foreground">
                {{ protobufOutput.split('\n').length }} 行
              </span>
            </div>
            <pre class="p-3 text-sm overflow-x-auto max-h-96 overflow-y-auto bg-white font-mono">{{ protobufOutput || '等待生成Protobuf定义...' }}</pre>
          </div>
        </div>

        <!-- 转换统计 -->
        <div class="bg-card rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">转换统计</h3>
          <div class="grid grid-cols-2 gap-4">
            <div class="text-center p-3 bg-muted rounded">
              <div class="text-2xl font-bold text-primary">{{ messageStats.messages }}</div>
              <div class="text-xs text-muted-foreground">消息定义</div>
            </div>
            <div class="text-center p-3 bg-muted rounded">
              <div class="text-2xl font-bold text-success">{{ messageStats.fields }}</div>
              <div class="text-xs text-muted-foreground">字段定义</div>
            </div>
            <div class="text-center p-3 bg-muted rounded">
              <div class="text-2xl font-bold text-warning">{{ messageStats.enums }}</div>
              <div class="text-xs text-muted-foreground">枚举定义</div>
            </div>
            <div class="text-center p-3 bg-muted rounded">
              <div class="text-2xl font-bold text-info">{{ messageStats.nested }}</div>
              <div class="text-xs text-muted-foreground">嵌套消息</div>
            </div>
          </div>
        </div>

        <!-- 使用说明 -->
        <div class="bg-card rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">使用说明</h3>
          <div class="space-y-3 text-sm text-muted-foreground">
            <div class="p-3 bg-blue-50 rounded border border-blue-200">
              <strong class="text-blue-800">📝 版本差异：</strong>
              <ul class="mt-1 space-y-1 text-xs">
                <li>• Proto2: 使用required/optional关键字，默认值必须显式设置</li>
                <li>• Proto3: 移除required关键字，字段默认optional，移除默认值设置</li>
                <li>• Proto3支持新特性如maps、oneof、JSON映射等</li>
              </ul>
            </div>

            <div class="p-3 bg-green-50 rounded border border-green-200">
              <strong class="text-green-800">💡 转换规则：</strong>
              <ul class="mt-1 space-y-1 text-xs">
                <li>• JSON对象转换为Protobuf消息</li>
                <li>• JSON数组转换为repeated字段</li>
                <li>• 嵌套对象转换为嵌套消息</li>
                <li>• 字段名自动转换为snake_case</li>
                <li>• 支持自定义类型映射</li>
              </ul>
            </div>

            <div class="p-3 bg-yellow-50 rounded border border-yellow-200">
              <strong class="text-yellow-800">⚠️ 注意事项：</strong>
              <ul class="mt-1 space-y-1 text-xs">
                <li>• Protobuf不支持null值，会转换为对应类型的零值</li>
                <li>• 日期时间建议使用string格式或int64时间戳</li>
                <li>• 大数字建议使用string类型避免精度丢失</li>
                <li>• 枚举值需要手动定义和映射</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useSEO } from '~/composables/useSEO'

// 设置SEO
const { setPageTitle } = useSEO()
setPageTitle('JSON转Protobuf - JSON数据转Protobuf定义文件')

// 数据
const protobufVersion = ref('proto3')
const packageName = ref('example.package')
const messagePrefix = ref('AutoMessage')
const jsonInput = ref('')
const protobufOutput = ref('')
const jsonError = ref('')

const typeMapping = ref({
  string: 'string',
  integer: 'int64',
  float: 'double',
  boolean: 'bool',
  useOptional: true
})

const options = ref({
  optimizeFor: true,
  javaMultipleFiles: false,
  goPackage: false
})

const protobufVersions = [
  {
    value: 'proto2',
    name: 'Protocol Buffers v2',
    description: '传统版本，支持required/optional'
  },
  {
    value: 'proto3',
    name: 'Protocol Buffers v3',
    description: '现代版本，简化语法，更多特性'
  }
]

const samples = [
  { name: '用户信息', data: 'user' },
  { name: '订单数据', data: 'order' },
  { name: '配置文件', data: 'config' },
  { name: 'API响应', data: 'api' }
]

const sampleData = {
  user: {
    "id": 12345,
    "name": "张三",
    "email": "zhangsan@example.com",
    "age": 25,
    "avatar": "https://example.com/avatar.jpg",
    "verified": true,
    "address": {
      "street": "北京市朝阳区建国路88号",
      "city": "北京",
      "country": "中国",
      "postal_code": "100020"
    },
    "phones": ["13800138000", "13900139000"],
    "tags": ["VIP", " developer"],
    "created_at": "2024-01-15T10:30:00Z",
    "preferences": {
      "language": "zh-CN",
      "timezone": "Asia/Shanghai",
      "notifications": {
        "email": true,
        "sms": false,
        "push": true
      }
    }
  },
  order: {
    "order_id": "ORD_20240115_001",
    "customer_id": "CUST_12345",
    "items": [
      {
        "product_id": "PROD_001",
        "name": "iPhone 15 Pro",
        "quantity": 1,
        "price": 7999.00,
        "category": "electronics"
      },
      {
        "product_id": "PROD_002",
        "name": "AirPods Pro",
        "quantity": 1,
        "price": 1999.00,
        "category": "accessories"
      }
    ],
    "total_amount": 9998.00,
    "currency": "CNY",
    "shipping_address": {
      "recipient_name": "张三",
      "phone": "13800138000",
      "address": "北京市朝阳区建国路88号SOHO现代城A座1001室",
      "postal_code": "100020"
    },
    "status": "pending",
    "payment_method": "alipay",
    "created_at": "2024-01-15T14:30:00Z"
  },
  config: {
    "app_name": "MyApplication",
    "version": "1.0.0",
    "debug": false,
    "database": {
      "host": "localhost",
      "port": 3306,
      "name": "myapp",
      "username": "root",
      "password": "password",
      "pool_size": 10,
      "timeout": 30000
    },
    "redis": {
      "host": "localhost",
      "port": 6379,
      "db": 0,
      "password": null
    },
    "jwt": {
      "secret": "your-secret-key",
      "expiry": "24h",
      "issuer": "myapp"
    },
    "cors": {
      "allowed_origins": ["http://localhost:3000", "https://example.com"],
      "allowed_methods": ["GET", "POST", "PUT", "DELETE"],
      "allowed_headers": ["Content-Type", "Authorization"]
    }
  },
  api: {
    "success": true,
    "code": 200,
    "message": "操作成功",
    "data": {
      "users": [
        {
          "id": 1,
          "username": "admin",
          "email": "admin@example.com",
          "role": "administrator",
          "last_login": "2024-01-15T09:00:00Z"
        },
        {
          "id": 2,
          "username": "user1",
          "email": "user1@example.com",
          "role": "user",
          "last_login": "2024-01-14T16:30:00Z"
        }
      ],
      "pagination": {
        "page": 1,
        "page_size": 10,
        "total": 2,
        "total_pages": 1
      }
    },
    "timestamp": "2024-01-15T10:30:00Z"
  }
}

// 计算属性
const parsedJson = computed(() => {
  if (!jsonInput.value.trim()) return null
  if (jsonError.value) return null

  try {
    return JSON.parse(jsonInput.value)
  } catch (e) {
    jsonError.value = `JSON解析错误: ${e.message}`
    return null
  }
})

const messageStats = computed(() => {
  if (!protobufOutput.value) {
    return { messages: 0, fields: 0, enums: 0, nested: 0 }
  }

  const lines = protobufOutput.value.split('\n')
  return {
    messages: lines.filter(line => line.trim().startsWith('message ')).length,
    fields: lines.filter(line => /\s+\w+\s+\w+\s*=/.test(line)).length,
    enums: lines.filter(line => line.trim().startsWith('enum ')).length,
    nested: lines.filter(line => /^\s{2,}message /.test(line)).length
  }
})

// 方法
const loadSample = () => {
  loadSampleData(samples[0])
}

const loadSampleData = (sample) => {
  const data = sampleData[sample.data]
  jsonInput.value = JSON.stringify(data, null, 2)
  generateProtobuf()
}

const clearJson = () => {
  jsonInput.value = ''
  protobufOutput.value = ''
  jsonError.value = ''
}

const generateProtobuf = () => {
  jsonError.value = ''

  if (!jsonInput.value.trim()) {
    protobufOutput.value = ''
    return
  }

  try {
    const data = JSON.parse(jsonInput.value)
    protobufOutput.value = convertToProtobuf(data)
  } catch (e) {
    jsonError.value = `JSON解析错误: ${e.message}`
    protobufOutput.value = ''
  }
}

const convertToProtobuf = (data, rootMessage = null) => {
  const version = protobufVersion.value
  let result = []

  // 添加syntax和package声明
  if (version === 'proto3') {
    result.push('syntax = "proto3";')
  } else {
    result.push('syntax = "proto2";')
  }
  result.push('')

  // package声明
  if (packageName.value) {
    result.push(`package ${packageName.value};`)
    result.push('')
  }

  // 选项
  if (options.value.optimizeFor) {
    result.push('option optimize_for = SPEED;')
  }
  if (options.value.javaMultipleFiles) {
    result.push('option java_multiple_files = true;')
  }
  if (options.value.goPackage) {
    result.push('option go_package = "' + packageName.value.replace(/\./g, '/') + '";')
  }
  if (options.value.optimizeFor || options.value.javaMultipleFiles || options.value.goPackage) {
    result.push('')
  }

  // 生成消息定义
  const messageName = rootMessage || messagePrefix.value
  const messages = generateMessages(data, messageName)
  result.push(messages)

  return result.join('\n')
}

const generateMessages = (data, messageName, indent = 0) => {
  const indentStr = '  '.repeat(indent)
  let result = []

  if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
    // 生成消息定义
    result.push(`${indentStr}message ${messageName} {`)

    const entries = Object.entries(data)
    entries.forEach(([key, value], index) => {
      const fieldNumber = index + 1
      const fieldName = toSnakeCase(key)
      const fieldType = getFieldType(value, fieldName, `${messageName}_${fieldName}`)

      if (protobufVersion.value === 'proto2') {
        // proto2语法
        const required = Array.isArray(value) ? 'repeated' : 'optional'
        result.push(`${indentStr}  ${required} ${fieldType} ${fieldName} = ${fieldNumber};`)
      } else {
        // proto3语法
        if (Array.isArray(value)) {
          result.push(`${indentStr}  repeated ${fieldType} ${fieldName} = ${fieldNumber};`)
        } else {
          const optional = typeMapping.value.useOptional ? 'optional ' : ''
          result.push(`${indentStr}  ${optional}${fieldType} ${fieldName} = ${fieldNumber};`)
        }
      }
    })

    result.push(`${indentStr}}`)
    result.push('')

    // 为嵌套对象生成独立的消息
    entries.forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const nestedMessageName = messageName + '_' + toPascalCase(key)
        const nestedMessages = generateMessages(value, nestedMessageName, indent)
        result.push(nestedMessages)
      }
    })
  }

  return result.join('\n')
}

const getFieldType = (value, fieldName, messageName) => {
  if (Array.isArray(value)) {
    if (value.length === 0) return 'string' // 默认类型
    return getFieldType(value[0], fieldName, messageName)
  }

  if (typeof value === 'object' && value !== null) {
    // 嵌套对象 - 使用消息类型
    return toPascalCase(fieldName)
  }

  if (typeof value === 'string') {
    // 检查是否是日期时间字符串
    if (value.includes('T') || value.includes('-')) {
      return typeMapping.value.string
    }
    return typeMapping.value.string
  }

  if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      return typeMapping.value.integer
    } else {
      return typeMapping.value.float
    }
  }

  if (typeof value === 'boolean') {
    return typeMapping.value.boolean
  }

  if (value === null) {
    return typeMapping.value.string
  }

  return 'string' // 默认类型
}

const toSnakeCase = (str) => {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
            .replace(/^_/, '')
            .replace(/_+/g, '_')
}

const toPascalCase = (str) => {
  return str.replace(/(^|_)([a-z])/g, (match, underscore, letter) => letter.toUpperCase())
            .replace(/_/g, '')
}

const getObjectCount = (obj) => {
  if (!obj || typeof obj !== 'object') return 0
  let count = 0

  Object.values(obj).forEach(value => {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      count++
      count += getObjectCount(value)
    }
  })

  return count
}

const getArrayCount = (obj) => {
  if (!obj || typeof obj !== 'object') return 0
  let count = 0

  Object.values(obj).forEach(value => {
    if (Array.isArray(value)) {
      count++
      value.forEach(item => {
        count += getArrayCount(item)
      })
    } else if (typeof value === 'object' && value !== null) {
      count += getArrayCount(value)
    }
  })

  return count
}

const getFieldCount = (obj) => {
  if (!obj || typeof obj !== 'object') return 0
  let count = 0

  Object.values(obj).forEach(value => {
    if (Array.isArray(value)) {
      value.forEach(item => {
        count += getFieldCount(item)
      })
    } else if (typeof value === 'object' && value !== null) {
      count += Object.keys(value).length
      count += getFieldCount(value)
    }
  })

  return count + Object.keys(obj).length
}

const copyProtobuf = async () => {
  try {
    await navigator.clipboard.writeText(protobufOutput.value)
  } catch (err) {
    console.error('复制失败:', err)
  }
}

const downloadProtobuf = () => {
  const content = protobufOutput.value
  const filename = `${messagePrefix.value.toLowerCase()}.proto`

  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// 初始化
generateProtobuf()
</script>