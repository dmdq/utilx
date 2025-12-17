<template>
  <div class="max-w-8xl mx-auto">
    <!-- 头部 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-3">测试数据生成器</h1>
      <p class="text-muted-foreground mb-4">生成各种类型的测试数据，支持 JSON、CSV、SQL 等多种格式，可自定义数据规则和约束</p>
    </div>

    <!-- 工具容器 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 左侧配置 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 数据类型和格式选择 -->
        <div class="bg-card rounded-lg p-4">
          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium mb-2">输出格式</label>
              <select v-model="outputFormat" @change="updateOutputFormat" class="w-full px-3 py-2 border rounded-md">
                <option value="json">JSON</option>
                <option value="csv">CSV</option>
                <option value="sql">SQL</option>
                <option value="xml">XML</option>
                <option value="yaml">YAML</option>
                <option value="excel">Excel</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">数据量</label>
              <input
                v-model.number="dataCount"
                type="number"
                min="1"
                max="10000"
                @change="generateData"
                class="w-full px-3 py-2 border rounded-md"
              >
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">数据类型模板</label>
              <select v-model="selectedTemplate" @change="loadTemplate" class="w-full px-3 py-2 border rounded-md">
                <option value="">选择模板...</option>
                <option value="users">用户数据</option>
                <option value="products">商品数据</option>
                <option value="orders">订单数据</option>
                <option value="employees">员工数据</option>
                <option value="students">学生数据</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 字段配置 -->
        <div class="bg-card rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-lg font-semibold">字段配置</h3>
            <button
              @click="addField"
              class="px-3 py-1 bg-primary text-primary-foreground rounded text-sm"
            >
              添加字段
            </button>
          </div>

          <div class="space-y-3">
            <div
              v-for="(field, index) in fields"
              :key="index"
              class="border rounded-lg p-3"
            >
              <div class="grid grid-cols-4 gap-3 mb-2">
                <input
                  v-model="field.name"
                  @input="generateData"
                  placeholder="字段名"
                  class="px-2 py-1 border rounded text-sm"
                >
                <select
                  v-model="field.type"
                  @change="onFieldTypeChange(index)"
                  class="px-2 py-1 border rounded text-sm"
                >
                  <option value="string">文本</option>
                  <option value="number">数字</option>
                  <option value="email">邮箱</option>
                  <option value="phone">电话</option>
                  <option value="date">日期</option>
                  <option value="datetime">日期时间</option>
                  <option value="boolean">布尔值</option>
                  <option value="uuid">UUID</option>
                  <option value="url">URL</option>
                  <option value="address">地址</option>
                  <option value="name">姓名</option>
                  <option value="company">公司名</option>
                  <option value="select">选择项</option>
                  <option value="range">范围</option>
                </select>
                <input
                  v-model="field.pattern"
                  @input="generateData"
                  placeholder="模式/选项 (可选)"
                  class="px-2 py-1 border rounded text-sm"
                >
                <button
                  @click="removeField(index)"
                  class="px-2 py-1 bg-destructive text-destructive-foreground rounded text-sm"
                >
                  删除
                </button>
              </div>

              <!-- 字段选项 -->
              <div v-if="field.type === 'select'" class="grid grid-cols-2 gap-2">
                <input
                  v-model="field.options"
                  @input="generateData"
                  placeholder="选项1,选项2,选项3"
                  class="px-2 py-1 border rounded text-sm"
                >
                <select v-model="field.selectType" @change="generateData" class="px-2 py-1 border rounded text-sm">
                  <option value="random">随机选择</option>
                  <option value="sequential">顺序选择</option>
                </select>
              </div>

              <div v-else-if="field.type === 'range'" class="grid grid-cols-3 gap-2">
                <input
                  v-model.number="field.min"
                  @input="generateData"
                  type="number"
                  placeholder="最小值"
                  class="px-2 py-1 border rounded text-sm"
                >
                <input
                  v-model.number="field.max"
                  @input="generateData"
                  type="number"
                  placeholder="最大值"
                  class="px-2 py-1 border rounded text-sm"
                >
                <select v-model="field.decimals" @change="generateData" class="px-2 py-1 border rounded text-sm">
                  <option :value="0">整数</option>
                  <option :value="1">1位小数</option>
                  <option :value="2">2位小数</option>
                  <option :value="3">3位小数</option>
                </select>
              </div>

              <div v-else-if="field.type === 'string'" class="grid grid-cols-3 gap-2">
                <input
                  v-model.number="field.minLength"
                  @input="generateData"
                  type="number"
                  placeholder="最小长度"
                  class="px-2 py-1 border rounded text-sm"
                >
                <input
                  v-model.number="field.maxLength"
                  @input="generateData"
                  type="number"
                  placeholder="最大长度"
                  class="px-2 py-1 border rounded text-sm"
                >
                <select v-model="field.stringType" @change="generateData" class="px-2 py-1 border rounded text-sm">
                  <option value="random">随机字符</option>
                  <option value="words">随机单词</option>
                  <option value="sentences">随机句子</option>
                  <option value="lorem">Lorem Ipsum</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- 生成的数据预览 -->
        <div class="bg-card rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-lg font-semibold">生成的数据</h3>
            <div class="flex gap-2">
              <button
                @click="regenerateData"
                class="px-3 py-1 bg-secondary hover:bg-secondary/80 rounded text-sm"
              >
                重新生成
              </button>
              <button
                @click="exportData"
                class="px-3 py-1 bg-primary text-primary-foreground rounded text-sm"
              >
                导出数据
              </button>
            </div>
          </div>

          <!-- 数据统计 -->
          <div class="grid grid-cols-4 gap-4 mb-4">
            <div class="text-center p-2 bg-muted rounded">
              <div class="text-lg font-bold">{{ generatedData.length }}</div>
              <div class="text-xs text-muted-foreground">总记录数</div>
            </div>
            <div class="text-center p-2 bg-muted rounded">
              <div class="text-lg font-bold">{{ fields.length }}</div>
              <div class="text-xs text-muted-foreground">字段数</div>
            </div>
            <div class="text-center p-2 bg-muted rounded">
              <div class="text-lg font-bold">{{ dataCount }}</div>
              <div class="text-xs text-muted-foreground">目标数量</div>
            </div>
            <div class="text-center p-2 bg-muted rounded">
              <div class="text-lg font-bold">{{ outputFormat.toUpperCase() }}</div>
              <div class="text-xs text-muted-foreground">输出格式</div>
            </div>
          </div>

          <!-- 数据显示区 -->
          <div class="border rounded-lg overflow-hidden">
            <div v-if="outputFormat === 'json'" class="max-h-96 overflow-auto">
              <pre class="p-4 text-sm overflow-x-auto"><code>{{ JSON.stringify(generatedData, null, 2) }}</code></pre>
            </div>
            <div v-else-if="outputFormat === 'csv'" class="max-h-96 overflow-auto">
              <pre class="p-4  text-sm overflow-x-auto"><code>{{ csvOutput }}</code></pre>
            </div>
            <div v-else-if="outputFormat === 'sql'" class="max-h-96 overflow-auto">
              <pre class="p-4  text-sm overflow-x-auto"><code>{{ sqlOutput }}</code></pre>
            </div>
            <div v-else-if="outputFormat === 'xml'" class="max-h-96 overflow-auto">
              <pre class="p-4  text-sm overflow-x-auto"><code>{{ xmlOutput }}</code></pre>
            </div>
            <div v-else-if="outputFormat === 'yaml'" class="max-h-96 overflow-auto">
              <pre class="p-4  text-sm overflow-x-auto"><code>{{ yamlOutput }}</code></pre>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧工具和选项 -->
      <div class="space-y-6">
        <!-- 数据约束 -->
        <div class="bg-card rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">数据约束</h3>
          <div class="space-y-3">
            <div>
              <label class="block text-sm font-medium mb-1">唯一性约束</label>
              <select v-model="constraints.unique" @change="generateData" class="w-full px-2 py-1 border rounded text-sm">
                <option value="">无约束</option>
                <option v-for="field in fields" :key="field.name" :value="field.name">
                  {{ field.name }} 唯一
                </option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">空值比例</label>
              <input
                v-model.number="constraints.nullRatio"
                @input="generateData"
                type="range"
                min="0"
                max="100"
                class="w-full"
              >
              <span class="text-xs text-muted-foreground">{{ constraints.nullRatio }}%</span>
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">本地化</label>
              <select v-model="constraints.locale" @change="generateData" class="w-full px-2 py-1 border rounded text-sm">
                <option value="zh-CN">中文</option>
                <option value="en-US">英文</option>
                <option value="ja-JP">日文</option>
                <option value="ko-KR">韩文</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 关联规则 -->
        <div class="bg-card rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">关联规则</h3>
          <div class="space-y-3">
            <div
              v-for="(rule, index) in relationships"
              :key="index"
              class="p-2 border rounded"
            >
              <div class="grid grid-cols-2 gap-2 mb-2">
                <select v-model="rule.from" @change="generateData" class="px-2 py-1 border rounded text-sm">
                  <option value="">源字段</option>
                  <option v-for="field in fields" :key="field.name" :value="field.name">
                    {{ field.name }}
                  </option>
                </select>
                <select v-model="rule.to" @change="generateData" class="px-2 py-1 border rounded text-sm">
                  <option value="">目标字段</option>
                  <option v-for="field in fields" :key="field.name" :value="field.name">
                    {{ field.name }}
                  </option>
                </select>
              </div>
              <select v-model="rule.type" @change="generateData" class="w-full px-2 py-1 border rounded text-sm">
                <option value="equal">相等</option>
                <option value="pattern">模式匹配</option>
                <option value="conditional">条件关联</option>
              </select>
              <button
                @click="removeRelationship(index)"
                class="mt-2 w-full px-2 py-1 bg-destructive text-destructive-foreground rounded text-sm"
              >
                删除规则
              </button>
            </div>
            <button
              @click="addRelationship"
              class="w-full px-3 py-2 bg-secondary hover:bg-secondary/80 rounded text-sm"
            >
              添加关联
            </button>
          </div>
        </div>

        <!-- 数据质量检查 -->
        <div class="bg-card rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">数据质量</h3>
          <div class="space-y-2">
            <div class="flex justify-between items-center">
              <span class="text-sm">重复率</span>
              <span class="text-sm font-medium">{{ qualityStats.duplicateRate }}%</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm">空值率</span>
              <span class="text-sm font-medium">{{ qualityStats.nullRate }}%</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm">格式正确率</span>
              <span class="text-sm font-medium">{{ qualityStats.validFormatRate }}%</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm">关联完整性</span>
              <span class="text-sm font-medium">{{ qualityStats.relationshipIntegrity }}%</span>
            </div>
          </div>
        </div>

        <!-- 快速模板 -->
        <div class="bg-card rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">快速模板</h3>
          <div class="space-y-2">
            <button
              v-for="template in quickTemplates"
              :key="template.name"
              @click="loadQuickTemplate(template)"
              class="w-full px-3 py-2 bg-secondary hover:bg-secondary/80 rounded text-sm text-left"
            >
              <div class="font-medium">{{ template.name }}</div>
              <div class="text-xs text-muted-foreground">{{ template.description }}</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useSEO } from '~/composables/useSEO'

// 设置SEO
const { setPageTitle } = useSEO()
setPageTitle('测试数据生成器 - 多格式测试数据生成工具')

// 数据
const outputFormat = ref('json')
const dataCount = ref(100)
const selectedTemplate = ref('')
const generatedData = ref([])
const fields = ref([
  { name: 'id', type: 'uuid', pattern: '' },
  { name: 'name', type: 'name', pattern: '', minLength: 2, maxLength: 20, stringType: 'words' },
  { name: 'email', type: 'email', pattern: '' }
])
const constraints = ref({
  unique: '',
  nullRatio: 0,
  locale: 'zh-CN'
})
const relationships = ref([])

// 模板数据
const templates = {
  users: [
    { name: 'id', type: 'uuid', pattern: '' },
    { name: 'username', type: 'string', pattern: '', minLength: 3, maxLength: 20, stringType: 'words' },
    { name: 'email', type: 'email', pattern: '' },
    { name: 'phone', type: 'phone', pattern: '' },
    { name: 'age', type: 'range', min: 18, max: 80, decimals: 0 },
    { name: 'gender', type: 'select', options: '男,女', selectType: 'random' },
    { name: 'address', type: 'address', pattern: '' },
    { name: 'created_at', type: 'datetime', pattern: '' }
  ],
  products: [
    { name: 'id', type: 'uuid', pattern: '' },
    { name: 'name', type: 'string', pattern: '', minLength: 5, maxLength: 50, stringType: 'words' },
    { name: 'category', type: 'select', options: '电子产品,服装,食品,图书,家居', selectType: 'random' },
    { name: 'price', type: 'range', min: 10, max: 1000, decimals: 2 },
    { name: 'stock', type: 'range', min: 0, max: 1000, decimals: 0 },
    { name: 'description', type: 'string', pattern: '', minLength: 20, maxLength: 200, stringType: 'sentences' },
    { name: 'sku', type: 'string', pattern: 'SKU-{####}', minLength: 8, maxLength: 15, stringType: 'random' },
    { name: 'is_active', type: 'boolean', pattern: '' }
  ],
  orders: [
    { name: 'order_id', type: 'uuid', pattern: '' },
    { name: 'user_id', type: 'uuid', pattern: '' },
    { name: 'product_id', type: 'uuid', pattern: '' },
    { name: 'quantity', type: 'range', min: 1, max: 10, decimals: 0 },
    { name: 'unit_price', type: 'range', min: 10, max: 1000, decimals: 2 },
    { name: 'total_amount', type: 'range', min: 10, max: 5000, decimals: 2 },
    { name: 'status', type: 'select', options: 'pending,processing,shipped,delivered,cancelled', selectType: 'random' },
    { name: 'order_date', type: 'date', pattern: '' },
    { name: 'shipping_address', type: 'address', pattern: '' }
  ],
  employees: [
    { name: 'id', type: 'uuid', pattern: '' },
    { name: 'employee_id', type: 'string', pattern: 'EMP-{####}', minLength: 8, maxLength: 10, stringType: 'random' },
    { name: 'first_name', type: 'name', pattern: '' },
    { name: 'last_name', type: 'name', pattern: '' },
    { name: 'email', type: 'email', pattern: '' },
    { name: 'phone', type: 'phone', pattern: '' },
    { name: 'department', type: 'select', options: 'IT,HR,Finance,Marketing,Sales,Operations', selectType: 'random' },
    { name: 'position', type: 'select', options: 'Manager,Developer,Designer,Analyst,Coordinator', selectType: 'random' },
    { name: 'salary', type: 'range', min: 30000, max: 150000, decimals: 0 },
    { name: 'hire_date', type: 'date', pattern: '' },
    { name: 'is_active', type: 'boolean', pattern: '' }
  ],
  students: [
    { name: 'id', type: 'uuid', pattern: '' },
    { name: 'student_id', type: 'string', pattern: 'STU-{####}', minLength: 8, maxLength: 10, stringType: 'random' },
    { name: 'name', type: 'name', pattern: '' },
    { name: 'gender', type: 'select', options: '男,女', selectType: 'random' },
    { name: 'age', type: 'range', min: 16, max: 30, decimals: 0 },
    { name: 'grade', type: 'select', options: '大一,大二,大三,大四,研究生', selectType: 'random' },
    { name: 'major', type: 'select', options: '计算机科学,软件工程,电子工程,机械工程,商科', selectType: 'random' },
    { name: 'gpa', type: 'range', min: 2.0, max: 4.0, decimals: 2 },
    { name: 'email', type: 'email', pattern: '' },
    { name: 'phone', type: 'phone', pattern: '' }
  ]
}

const quickTemplates = [
  {
    name: '用户数据集',
    description: '包含用户基本信息的数据集',
    fields: [
      { name: 'user_id', type: 'uuid', pattern: '' },
      { name: 'username', type: 'string', pattern: '', minLength: 5, maxLength: 15, stringType: 'words' },
      { name: 'email', type: 'email', pattern: '' }
    ]
  },
  {
    name: '电商商品',
    description: '电商平台的商品信息',
    fields: [
      { name: 'product_id', type: 'uuid', pattern: '' },
      { name: 'name', type: 'string', pattern: '', minLength: 5, maxLength: 50, stringType: 'words' },
      { name: 'price', type: 'range', min: 10, max: 1000, decimals: 2 }
    ]
  },
  {
    name: '时间序列',
    description: '带时间戳的序列数据',
    fields: [
      { name: 'timestamp', type: 'datetime', pattern: '' },
      { name: 'value', type: 'range', min: 0, max: 100, decimals: 2 },
      { name: 'metric', type: 'select', options: 'CPU,Memory,Network,Disk', selectType: 'random' }
    ]
  },
  {
    name: '地理位置',
    description: '包含地址和坐标的数据',
    fields: [
      { name: 'address', type: 'address', pattern: '' },
      { name: 'latitude', type: 'range', min: -90, max: 90, decimals: 6 },
      { name: 'longitude', type: 'range', min: -180, max: 180, decimals: 6 }
    ]
  }
]

// 计算属性
const csvOutput = computed(() => {
  if (generatedData.value.length === 0) return ''

  const headers = Object.keys(generatedData.value[0])
  const rows = generatedData.value.map(item =>
    headers.map(header => {
      const value = item[header]
      return typeof value === 'string' && value.includes(',') ? `"${value}"` : value
    }).join(',')
  )

  return [headers.join(','), ...rows].join('\n')
})

const sqlOutput = computed(() => {
  if (generatedData.value.length === 0) return ''

  const tableName = 'test_data'
  const columns = Object.keys(generatedData.value[0])

  const createTable = `CREATE TABLE ${tableName} (\n  ${columns.map(col => {
    const sampleValue = generatedData.value[0][col]
    let type = 'TEXT'
    if (typeof sampleValue === 'number') {
      type = sampleValue % 1 === 0 ? 'INTEGER' : 'DECIMAL(10,2)'
    } else if (typeof sampleValue === 'boolean') {
      type = 'BOOLEAN'
    }
    return `  ${col} ${type}`
  }).join(',\n')}\n);`

  const insertStatements = generatedData.value.map(item => {
    const values = columns.map(col => {
      const value = item[col]
      if (value === null || value === undefined) return 'NULL'
      if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`
      if (typeof value === 'boolean') return value ? '1' : '0'
      return value
    })
    return `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});`
  })

  return `${createTable}\n\n${insertStatements.join('\n')}`
})

const xmlOutput = computed(() => {
  if (generatedData.value.length === 0) return ''

  const xmlItems = generatedData.value.map(item => {
    const xmlFields = Object.entries(item)
      .map(([key, value]) => `<${key}>${value !== null ? value : ''}</${key}>`)
      .join('\n    ')
    return `  <item>\n    ${xmlFields}\n  </item>`
  }).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>\n<root>\n${xmlItems}\n</root>`
})

const yamlOutput = computed(() => {
  if (generatedData.value.length === 0) return ''

  return generatedData.value.map(item => {
    const yamlFields = Object.entries(item)
      .map(([key, value]) => {
        if (value === null || value === undefined) return `${key}: null`
        if (typeof value === 'string') return `${key}: "${value}"`
        return `${key}: ${value}`
      })
      .join('\n  ')
    return `- ${yamlFields}`
  }).join('\n')
})

const qualityStats = computed(() => {
  if (generatedData.value.length === 0) {
    return {
      duplicateRate: 0,
      nullRate: 0,
      validFormatRate: 100,
      relationshipIntegrity: 100
    }
  }

  const total = generatedData.value.length
  const fieldCount = fields.value.length

  // 计算重复率
  const uniqueRecords = new Set(generatedData.value.map(item => JSON.stringify(item)))
  const duplicateRate = ((total - uniqueRecords.size) / total * 100).toFixed(1)

  // 计算空值率
  const totalValues = total * fieldCount
  const nullValues = generatedData.value.reduce((count, item) => {
    return count + Object.values(item).filter(val => val === null || val === undefined).length
  }, 0)
  const nullRate = (nullValues / totalValues * 100).toFixed(1)

  // 计算格式正确率（简化版）
  const validFormatRate = 95 // 实际应根据字段类型验证

  // 计算关联完整性
  const relationshipIntegrity = relationships.value.length > 0 ? 90 : 100

  return {
    duplicateRate: parseFloat(duplicateRate),
    nullRate: parseFloat(nullRate),
    validFormatRate,
    relationshipIntegrity
  }
})

// 方法
const updateOutputFormat = () => {
  // 格式改变时不需要特殊处理，计算属性会自动更新
}

const loadTemplate = () => {
  if (selectedTemplate.value && templates[selectedTemplate.value]) {
    fields.value = JSON.parse(JSON.stringify(templates[selectedTemplate.value]))
    generateData()
  }
}

const addField = () => {
  fields.value.push({
    name: '',
    type: 'string',
    pattern: '',
    minLength: 1,
    maxLength: 50,
    stringType: 'random'
  })
}

const removeField = (index) => {
  fields.value.splice(index, 1)
  generateData()
}

const onFieldTypeChange = (index) => {
  const field = fields.value[index]

  // 根据类型设置默认值
  if (field.type === 'range') {
    field.min = 0
    field.max = 100
    field.decimals = 0
  } else if (field.type === 'string') {
    field.minLength = 1
    field.maxLength = 50
    field.stringType = 'random'
  } else if (field.type === 'select') {
    field.options = '选项1,选项2,选项3'
    field.selectType = 'random'
  }

  generateData()
}

const generateValue = (field, index) => {
  const { type, pattern, minLength, maxLength, stringType, options, min, max, decimals, selectType } = field

  // 处理空值
  if (Math.random() * 100 < constraints.value.nullRatio) {
    return null
  }

  switch (type) {
    case 'string':
      return generateString(minLength || 1, maxLength || 50, stringType, pattern)

    case 'number':
      return generateNumber(min || 0, max || 100, decimals || 0)

    case 'email':
      return generateEmail()

    case 'phone':
      return generatePhone()

    case 'date':
      return generateDate()

    case 'datetime':
      return generateDateTime()

    case 'boolean':
      return Math.random() < 0.5

    case 'uuid':
      return generateUUID()

    case 'url':
      return generateURL()

    case 'address':
      return generateAddress()

    case 'name':
      return generateName()

    case 'company':
      return generateCompany()

    case 'select':
      return generateSelect(options, selectType, index)

    case 'range':
      return generateNumber(min || 0, max || 100, decimals || 0)

    default:
      return ''
  }
}

const generateString = (minLength, maxLength, stringType, pattern) => {
  if (pattern) {
    // 使用模式生成
    return pattern
      .replace(/{####}/g, Math.random().toString().substr(2, 4))
      .replace(/{##}/g, Math.random().toString().substr(2, 2))
      .replace(/{#}/g, Math.random().toString().substr(2, 1))
  }

  const length = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength

  switch (stringType) {
    case 'words':
      const words = ['Lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do', 'eiusmod']
      const wordCount = Math.ceil(length / 8)
      return Array.from({ length: wordCount }, () => words[Math.floor(Math.random() * words.length)])
        .join(' ')
        .substring(0, length)

    case 'sentences':
      const sentences = ['This is a sample sentence.', 'Another example text here.', 'Lorem ipsum dolor sit amet.']
      return sentences[Math.floor(Math.random() * sentences.length)]

    case 'lorem':
      return 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'.substring(0, length)

    default:
      return Array.from({ length }, () => String.fromCharCode(97 + Math.floor(Math.random() * 26))).join('')
  }
}

const generateNumber = (min, max, decimals) => {
  const num = Math.random() * (max - min) + min
  return decimals > 0 ? parseFloat(num.toFixed(decimals)) : Math.floor(num)
}

const generateEmail = () => {
  const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'example.com']
  const username = Math.random().toString(36).substring(2, 8)
  const domain = domains[Math.floor(Math.random() * domains.length)]
  return `${username}@${domain}`
}

const generatePhone = () => {
  const types = ['138', '139', '150', '151', '186', '188']
  const prefix = types[Math.floor(Math.random() * types.length)]
  const suffix = Math.random().toString().substring(2, 10)
  return `${prefix}${suffix}`
}

const generateDate = () => {
  const start = new Date(2020, 0, 1)
  const end = new Date()
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
  return date.toISOString().split('T')[0]
}

const generateDateTime = () => {
  const start = new Date(2020, 0, 1)
  const end = new Date()
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
  return date.toISOString().replace('T', ' ').substring(0, 19)
}

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

const generateURL = () => {
  const protocols = ['http', 'https']
  const domains = ['example.com', 'test.org', 'demo.net']
  const protocol = protocols[Math.floor(Math.random() * protocols.length)]
  const domain = domains[Math.floor(Math.random() * domains.length)]
  const path = Math.random().toString(36).substring(2, 8)
  return `${protocol}://${domain}/${path}`
}

const generateAddress = () => {
  const streets = ['Main St', 'Oak Ave', 'Park Rd', 'First St', 'Second Ave']
  const cities = ['Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Hangzhou']
  const street = streets[Math.floor(Math.random() * streets.length)]
  const number = Math.floor(Math.random() * 999) + 1
  const city = cities[Math.floor(Math.random() * cities.length)]
  return `${number} ${street}, ${city}`
}

const generateName = () => {
  const firstNames = ['张', '李', '王', '刘', '陈', '杨', '赵', '黄', '周', '吴']
  const lastNames = ['伟', '芳', '娜', '秀英', '敏', '静', '丽', '强', '磊', '洋']
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
  return `${firstName}${lastName}`
}

const generateCompany = () => {
  const prefixes = ['北京', '上海', '深圳', '广州', '杭州']
  const types = ['科技', '网络', '信息', '数据', '软件']
  const suffixes = ['有限公司', '科技股份', '信息技术', '网络科技']

  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  const type = types[Math.floor(Math.random() * types.length)]
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)]

  return `${prefix}${type}${suffix}`
}

const generateSelect = (options, selectType, index) => {
  if (!options) return ''

  const optionList = options.split(',')
  if (selectType === 'sequential') {
    return optionList[index % optionList.length]
  }
  return optionList[Math.floor(Math.random() * optionList.length)]
}

const generateData = () => {
  if (fields.value.length === 0) {
    generatedData.value = []
    return
  }

  const data = []
  const uniqueValues = new Set()

  for (let i = 0; i < dataCount.value; i++) {
    const item = {}

    fields.value.forEach(field => {
      if (!field.name) return

      let value = generateValue(field, i)

      // 处理唯一性约束
      if (constraints.value.unique === field.name) {
        while (uniqueValues.has(value)) {
          value = generateValue(field, i + 1000) // 确保生成不同的值
        }
        uniqueValues.add(value)
      }

      item[field.name] = value
    })

    data.push(item)
  }

  // 应用关联规则
  applyRelationships(data)

  generatedData.value = data
}

const applyRelationships = (data) => {
  relationships.value.forEach(rule => {
    if (!rule.from || !rule.to) return

    data.forEach(item => {
      const fromValue = item[rule.from]
      if (fromValue === null || fromValue === undefined) return

      switch (rule.type) {
        case 'equal':
          item[rule.to] = fromValue
          break
        case 'pattern':
          item[rule.to] = `${fromValue}_${rule.pattern || 'copy'}`
          break
        case 'conditional':
          // 简单的条件关联示例
          if (typeof fromValue === 'number') {
            item[rule.to] = fromValue > 50 ? 'high' : 'low'
          }
          break
      }
    })
  })
}

const regenerateData = () => {
  generateData()
}

const addRelationship = () => {
  relationships.value.push({
    from: '',
    to: '',
    type: 'equal'
  })
  generateData()
}

const removeRelationship = (index) => {
  relationships.value.splice(index, 1)
  generateData()
}

const loadQuickTemplate = (template) => {
  fields.value = JSON.parse(JSON.stringify(template.fields))
  generateData()
}

const exportData = () => {
  let content = ''
  let filename = `test_data.${outputFormat.value}`
  let mimeType = 'text/plain'

  switch (outputFormat.value) {
    case 'json':
      content = JSON.stringify(generatedData.value, null, 2)
      mimeType = 'application/json'
      break
    case 'csv':
      content = csvOutput.value
      filename = 'test_data.csv'
      break
    case 'sql':
      content = sqlOutput.value
      filename = 'test_data.sql'
      break
    case 'xml':
      content = xmlOutput.value
      filename = 'test_data.xml'
      break
    case 'yaml':
      content = yamlOutput.value
      filename = 'test_data.yaml'
      break
  }

  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// 初始化
onMounted(() => {
  loadTemplate()
})
</script>