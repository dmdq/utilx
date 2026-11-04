<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" /> -->

    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">JSON Schema 生成器</h1>
      <p class="text-muted-foreground">根据 JSON 数据自动生成 JSON Schema，支持数据验证和类型定义</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：输入区域 -->
      <div class="space-y-4">
        <!-- 输入方式选择 -->
        <div class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">输入选项</h2>
          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium">Schema 版本</label>
              <select v-model="schemaVersion" class="mt-2 w-full px-3 py-2 border border-border rounded-md text-sm">
                <option value="draft-07">Draft 07</option>
                <option value="draft-06">Draft 06</option>
                <option value="draft-04">Draft 04</option>
                <option value="2019-09">2019-09</option>
                <option value="2020-12">2020-12</option>
              </select>
            </div>
            <div>
              <label class="text-sm font-medium">Schema 标题（可选）</label>
              <input
                v-model="schemaTitle"
                type="text"
                placeholder="User Schema"
                class="mt-2 w-full px-3 py-2 border border-border rounded-md text-sm"
              />
            </div>
            <div>
              <label class="text-sm font-medium">Schema 描述（可选）</label>
              <input
                v-model="schemaDescription"
                type="text"
                placeholder="用户数据结构定义"
                class="mt-2 w-full px-3 py-2 border border-border rounded-md text-sm"
              />
            </div>
            <div class="flex items-center gap-3">
              <input
                v-model="options.strictType"
                type="checkbox"
                id="strictType"
                class="rounded text-primary focus:ring-primary"
              />
              <label for="strictType" class="text-sm">严格类型推断</label>
            </div>
            <div class="flex items-center gap-3">
              <input
                v-model="options.addExamples"
                type="checkbox"
                id="addExamples"
                class="rounded text-primary focus:ring-primary"
              />
              <label for="addExamples" class="text-sm">添加示例值</label>
            </div>
            <div class="flex items-center gap-3">
              <input
                v-model="options.addRequired"
                type="checkbox"
                id="addRequired"
                class="rounded text-primary focus:ring-primary"
              />
              <label for="addRequired" class="text-sm">自动标记必填字段</label>
            </div>
          </div>
        </div>

        <!-- JSON 输入 -->
        <div class="bg-card   rounded-lg p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-semibold">JSON 数据</h2>
            <div class="flex gap-2">
              <button
                @click="loadExample"
                class="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                加载示例
              </button>
              <button
                @click="clearJson"
                class="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                清空
              </button>
              <button
                @click="formatJson"
                :disabled="!jsonInput"
                class="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                格式化
              </button>
            </div>
          </div>

          <textarea
            v-model="jsonInput"
            placeholder="输入 JSON 数据..."
            class="w-full h-80 px-4 py-3 border border-border rounded-md font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          ></textarea>
        </div>
      </div>

      <!-- 右侧：输出区域 -->
      <div class="space-y-4">
        <!-- 生成的 Schema -->
        <div class="bg-card   rounded-lg p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-semibold">生成的 Schema</h2>
            <div class="flex gap-2">
              <button
                @click="copySchema"
                :disabled="!generatedSchema"
                class="px-3 py-1 text-sm border border-primary text-primary rounded-md hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ copied ? '已复制' : '复制' }}
              </button>
              <button
                @click="downloadSchema"
                :disabled="!generatedSchema"
                class="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下载
              </button>
              <button
                @click="validateSchema"
                :disabled="!generatedSchema || !jsonInput"
                class="px-3 py-1 text-sm border border-primary text-primary rounded-md hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                验证
              </button>
            </div>
          </div>

          <div class="border rounded-lg p-4 bg-muted/30 min-h-[400px] max-h-[500px] overflow-auto">
            <pre v-if="generatedSchema" class="text-sm whitespace-pre-wrap font-mono"><code>{{ generatedSchema }}</code></pre>
            <div v-else class="text-center text-muted-foreground py-12">
              <FileJson class="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>输入 JSON 数据后生成 Schema</p>
            </div>
          </div>
        </div>

        <!-- 验证结果 -->
        <div v-if="validationResult" class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">验证结果</h2>
          <div class="p-4 rounded-lg" :class="validationResult.valid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'">
            <div class="flex items-center gap-2 mb-2">
              <span :class="validationResult.valid ? 'text-green-600' : 'text-red-600'">
                {{ validationResult.valid ? '✓ 验证通过' : '✗ 验证失败' }}
              </span>
            </div>
            <div v-if="!validationResult.valid && validationResult.errors" class="space-y-1">
              <div
                v-for="(error, index) in validationResult.errors"
                :key="index"
                class="text-sm text-red-600"
              >
                • {{ error }}
              </div>
            </div>
          </div>
        </div>

        <!-- Schema 统计 -->
        <div v-if="schemaStats" class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">Schema 统计</h2>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-muted-foreground">属性总数：</span>
              <span class="font-medium">{{ schemaStats.properties }}</span>
            </div>
            <div>
              <span class="text-muted-foreground">必填字段：</span>
              <span class="font-medium">{{ schemaStats.required }}</span>
            </div>
            <div>
              <span class="text-muted-foreground">嵌套对象：</span>
              <span class="font-medium">{{ schemaStats.objects }}</span>
            </div>
            <div>
              <span class="text-muted-foreground">数组字段：</span>
              <span class="font-medium">{{ schemaStats.arrays }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 使用指南 -->
    <div class="mt-12 space-y-6">
      <div class="bg-card   rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
          <Info class="w-5 h-5 text-primary" />
          JSON Schema 使用指南
        </h3>
        <div class="space-y-4 text-sm text-muted-foreground">
          <div>
            <h4 class="font-medium text-foreground mb-2">什么是 JSON Schema？</h4>
            <p>JSON Schema 是一种用于描述 JSON 数据结构的规范，它可以定义数据的类型、格式、约束条件等，用于数据验证、文档生成和代码生成。</p>
          </div>
          <div>
            <h4 class="font-medium text-foreground mb-2">常用关键字说明</h4>
            <ul class="list-disc list-inside space-y-1">
              <li><code>$schema</code> - 指定使用的 Draft 版本</li>
              <li><code>type</code> - 数据类型（string, number, object, array, boolean, null）</li>
              <li><code>properties</code> - 对象属性定义</li>
              <li><code>required</code> - 必需属性列表</li>
              <li><code>format</code> - 字符串格式（email, date-time, uri 等）</li>
              <li><code>pattern</code> - 正则表达式约束</li>
              <li><code>minimum/maximum</code> - 数值范围</li>
              <li><code>minLength/maxLength</code> - 字符串长度</li>
              <li><code>items</code> - 数组元素定义</li>
              <li><code>additionalProperties</code> - 额外属性控制</li>
            </ul>
          </div>
          <div>
            <h4 class="font-medium text-foreground mb-2">应用场景</h4>
            <ul class="list-disc list-inside space-y-1">
              <li>API 接口数据验证</li>
              <li>配置文件格式定义</li>
              <li>数据库文档生成</li>
              <li>表单自动生成</li>
              <li>代码生成和类型定义</li>
            </ul>
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
            <Code class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">JSON 格式化</p>
              <p class="text-xs text-muted-foreground">格式化和美化 JSON</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
          <NuxtLink
            to="/tools/json-to-model"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <FileText class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">JSON 转 Model</p>
              <p class="text-xs text-muted-foreground">生成数据模型类</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
          <NuxtLink
            to="/tools/json-path"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Search class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">JSONPath</p>
              <p class="text-xs text-muted-foreground">JSON 数据查询</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Info, FileJson, Code, Search, ArrowRight } from 'lucide-vue-next'
import Breadcrumb from '~/components/Breadcrumb.vue'

// 分类信息
const category = { id: 'dev', name: '开发辅助', description: '开发辅助工具集合' }

// 状态管理
const schemaVersion = ref('2020-12')
const schemaTitle = ref('')
const schemaDescription = ref('')
const jsonInput = ref('')
const copied = ref(false)
const validationResult = ref(null)

// 配置选项
const options = ref({
  strictType: true,
  addExamples: true,
  addRequired: true
})

// 示例 JSON
const exampleJson = {
  id: 1,
  name: "John Doe",
  email: "john@example.com",
  age: 30,
  isActive: true,
  balance: 1250.50,
  address: {
    street: "123 Main St",
    city: "New York",
    country: "USA",
    zipCode: "10001"
  },
  phoneNumbers: [
    {
      type: "home",
      number: "212-555-1234"
    },
    {
      type: "work",
      number: "646-555-4567"
    }
  ],
  registeredAt: "2024-01-15T10:30:00Z",
  tags: ["premium", "verified", "active"]
}

// Schema 统计
const schemaStats = ref(null)

// 生成 Schema
const generatedSchema = computed(() => {
  if (!jsonInput.value) return ''

  try {
    const data = JSON.parse(jsonInput.value)
    const schema = generateSchemaFromData(data)
    schemaStats.value = calculateStats(schema)
    return JSON.stringify(schema, null, 2)
  } catch (error) {
    return ''
  }
})

// 从数据生成 Schema
const generateSchemaFromData = (data, path = '') => {
  const schema = {
    $schema: `https://json-schema.org/draft/${getDraftVersion()}/schema#`
  }

  if (schemaTitle.value) {
    schema.title = schemaTitle.value
  }

  if (schemaDescription.value) {
    schema.description = schemaDescription.value
  }

  const result = analyzeValue(data)
  Object.assign(schema, result.schema)

  return schema
}

// 获取 Draft 版本号
const getDraftVersion = () => {
  const versionMap = {
    '2020-12': '2020-12',
    '2019-09': '2019-09',
    'draft-07': '07',
    'draft-06': '06',
    'draft-04': '04'
  }
  return versionMap[schemaVersion.value] || '07'
}

// 分析值
const analyzeValue = (value, path = '') => {
  const schema = {}
  const required = []

  if (value === null) {
    schema.type = ['null', 'object', 'string', 'number', 'boolean']
    return { schema, required }
  }

  if (Array.isArray(value)) {
    schema.type = 'array'
    if (value.length > 0) {
      const itemAnalysis = analyzeValue(value[0], `${path}[]`)
      schema.items = itemAnalysis.schema
      if (options.value.addExamples && value[0] !== null) {
        schema.examples = [value[0]]
      }
    } else {
      schema.items = {}
    }
    return { schema, required }
  }

  if (typeof value === 'object') {
    schema.type = 'object'
    schema.properties = {}

    Object.entries(value).forEach(([key, val]) => {
      const analysis = analyzeValue(val, `${path}.${key}`)
      schema.properties[key] = analysis.schema

      if (options.value.addRequired && analysis.required.includes(key)) {
        required.push(key)
      }

      // 默认将所有字段设为必填
      if (options.value.addRequired) {
        required.push(key)
      }
    })

    if (required.length > 0) {
      schema.required = required
    }

    return { schema, required }
  }

  // 基本类型
  if (typeof value === 'string') {
    schema.type = 'string'

    // 特殊格式检测
    if (value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
      schema.format = 'date-time'
    } else if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
      schema.format = 'date'
    } else if (value.match(/^https?:\/\//)) {
      schema.format = 'uri'
    } else if (value.match(/^[^@]+@[^@]+\.[^@]+$/)) {
      schema.format = 'email'
    }

    if (options.value.strictType) {
      schema.minLength = value.length
      schema.maxLength = value.length
    }

    if (options.value.addExamples) {
      schema.examples = [value]
    }
  } else if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      schema.type = 'integer'
    } else {
      schema.type = 'number'
    }

    if (options.value.strictType) {
      schema.minimum = value
      schema.maximum = value
    }

    if (options.value.addExamples) {
      schema.examples = [value]
    }
  } else if (typeof value === 'boolean') {
    schema.type = 'boolean'
    if (options.value.addExamples) {
      schema.examples = [value]
    }
  }

  return { schema, required }
}

// 计算 Schema 统计
const calculateStats = (schema) => {
  const stats = {
    properties: 0,
    required: 0,
    objects: 0,
    arrays: 0
  }

  const countProperties = (obj) => {
    if (obj.type === 'object' && obj.properties) {
      stats.objects++
      Object.values(obj.properties).forEach(prop => {
        stats.properties++
        if (obj.required && obj.required.includes(Object.keys(obj.properties).find(k => obj.properties[k] === prop))) {
          stats.required++
        }
        countProperties(prop)
      })
    }
    if (obj.type === 'array' && obj.items) {
      stats.arrays++
      countProperties(obj.items)
    }
  }

  countProperties(schema)
  return stats
}

// 加载示例
const loadExample = () => {
  jsonInput.value = JSON.stringify(exampleJson, null, 2)
}

// 清空 JSON
const clearJson = () => {
  jsonInput.value = ''
  validationResult.value = null
}

// 格式化 JSON
const formatJson = () => {
  try {
    const parsed = JSON.parse(jsonInput.value)
    jsonInput.value = JSON.stringify(parsed, null, 2)
  } catch (error) {
    console.error('JSON 格式错误', error)
  }
}

// 复制 Schema
const copySchema = async () => {
  try {
    await navigator.clipboard.writeText(generatedSchema.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (error) {
    console.error('复制失败', error)
  }
}

// 下载 Schema
const downloadSchema = () => {
  const content = generatedSchema.value
  const filename = `${schemaTitle.value || 'schema'}.json`
  const mimeType = 'application/json'

  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// 验证 Schema
const validateSchema = () => {
  try {
    const data = JSON.parse(jsonInput.value)
    const schema = JSON.parse(generatedSchema.value)

    // 简单验证逻辑
    // 实际应用中应该使用专门的 JSON Schema 验证库
    const isValid = validateData(data, schema)

    validationResult.value = {
      valid: isValid,
      errors: isValid ? [] : ['数据不符合 Schema 定义']
    }
  } catch (error) {
    validationResult.value = {
      valid: false,
      errors: [error.message]
    }
  }
}

// 验证数据
const validateData = (data, schema) => {
  // 这是一个简化的验证函数
  // 实际应该使用完整的 JSON Schema 验证实现

  if (schema.type) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type]
    const dataType = Array.isArray(data) ? 'array' : typeof data

    if (data === null && !types.includes('null')) {
      return false
    }

    if (!types.includes(dataType) && !(dataType === 'object' && types.includes('array') && !Array.isArray(data))) {
      return false
    }
  }

  if (schema.type === 'object' && schema.properties && typeof data === 'object' && data !== null) {
    if (schema.required) {
      for (const requiredProp of schema.required) {
        if (!(requiredProp in data)) {
          return false
        }
      }
    }

    for (const [key, value] of Object.entries(data)) {
      if (schema.properties[key]) {
        if (!validateData(value, schema.properties[key])) {
          return false
        }
      }
    }
  }

  if (schema.type === 'array' && schema.items && Array.isArray(data)) {
    for (const item of data) {
      if (!validateData(item, schema.items)) {
        return false
      }
    }
  }

  return true
}

// SEO配置
useSeoMeta({
  title: 'JSON Schema 生成器 - 在线 JSON Schema 生成工具',
  description: '免费的在线 JSON Schema 生成器，根据 JSON 数据自动生成 JSON Schema，支持数据验证和类型定义。',
  keywords: ['json schema', 'schema', 'json', '数据验证', '类型定义', 'api文档', '数据结构']
})


</script>