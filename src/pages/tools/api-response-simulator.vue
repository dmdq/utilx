<template>
  <div class="max-w-8xl mx-auto">
    <!-- 头部 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-3">API响应模拟器</h1>
      <p class="text-muted-foreground mb-4">模拟API响应数据，支持多种数据格式和动态生成规则</p>
    </div>

    <!-- 工具容器 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧配置 -->
      <div class="space-y-6">
        <!-- 基础配置 -->
        <div class="bg-card rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">基础配置</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">HTTP状态码</label>
              <select v-model="responseConfig.statusCode" class="w-full px-3 py-2 border rounded-md">
                <option value="200">200 OK</option>
                <option value="201">201 Created</option>
                <option value="400">400 Bad Request</option>
                <option value="401">401 Unauthorized</option>
                <option value="403">403 Forbidden</option>
                <option value="404">404 Not Found</option>
                <option value="500">500 Internal Server Error</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">Content-Type</label>
              <select v-model="responseConfig.contentType" class="w-full px-3 py-2 border rounded-md">
                <option value="application/json">application/json</option>
                <option value="application/xml">application/xml</option>
                <option value="text/html">text/html</option>
                <option value="text/plain">text/plain</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">响应延迟 (毫秒)</label>
              <input
                v-model.number="responseConfig.delay"
                type="range"
                min="0"
                max="5000"
                step="100"
                class="w-full"
              >
              <div class="text-sm text-muted-foreground">{{ responseConfig.delay }}ms</div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">响应头</label>
              <div class="space-y-2">
                <div
                  v-for="(header, index) in responseConfig.headers"
                  :key="index"
                  class="flex gap-2"
                >
                  <input
                    v-model="header.key"
                    placeholder="Header名称"
                    class="flex-1 px-2 py-1 text-sm border rounded"
                  >
                  <input
                    v-model="header.value"
                    placeholder="Header值"
                    class="flex-1 px-2 py-1 text-sm border rounded"
                  >
                  <button
                    @click="removeHeader(index)"
                    class="px-2 py-1 bg-destructive text-destructive-foreground rounded text-sm"
                  >
                    删除
                  </button>
                </div>
                <button
                  @click="addHeader"
                  class="w-full px-2 py-1 bg-secondary hover:bg-secondary/80 rounded text-sm"
                >
                  添加Header
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 数据模板 -->
        <div class="bg-card rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-lg font-semibold">数据模板</h3>
            <div class="flex gap-2">
              <button
                @click="loadTemplate"
                class="px-3 py-1 bg-secondary hover:bg-secondary/80 rounded text-sm"
              >
                加载模板
              </button>
              <button
                @click="validateTemplate"
                class="px-3 py-1 bg-primary text-primary-foreground rounded text-sm"
              >
                验证
              </button>
            </div>
          </div>

          <div class="mb-3">
            <label class="block text-sm font-medium mb-2">模板类型</label>
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="type in templateTypes"
                :key="type.id"
                @click="templateType = type.id"
                :class="[
                  'px-3 py-2 rounded text-sm',
                  templateType === type.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary hover:bg-secondary/80'
                ]"
              >
                {{ type.name }}
              </button>
            </div>
          </div>

          <div v-if="templateType === 'json'" class="mb-3">
            <label class="block text-sm font-medium mb-2">JSON模板</label>
            <div class="flex gap-2 mb-2">
              <button
                v-for="helper in jsonHelpers"
                :key="helper.name"
                @click="insertJsonHelper(helper)"
                class="px-2 py-1 bg-muted hover:bg-muted/80 rounded text-xs"
                :title="helper.description"
              >
                {{ helper.name }}
              </button>
            </div>
            <textarea
              v-model="jsonTemplate"
              @input="generateResponse"
              class="w-full h-64 p-3 font-mono text-sm border rounded-md resize-none"
              placeholder='{
  "success": true,
  "data": [],
  "message": "操作成功"
}'
            ></textarea>
          </div>

          <div v-if="templateType === 'xml'" class="mb-3">
            <label class="block text-sm font-medium mb-2">XML模板</label>
            <textarea
              v-model="xmlTemplate"
              @input="generateResponse"
              class="w-full h-64 p-3 font-mono text-sm border rounded-md resize-none"
              placeholder="&lt;?xml version=&quot;1.0&quot; encoding=&quot;UTF-8&quot;?&gt;
&lt;response&gt;
  &lt;success&gt;true&lt;/success&gt;
  &lt;data&gt;&lt;/data&gt;
  &lt;message&gt;操作成功&lt;/message&gt;
&lt;/response&gt;"
            ></textarea>
          </div>

          <div v-if="templateType === 'text'" class="mb-3">
            <label class="block text-sm font-medium mb-2">文本模板</label>
            <div class="flex gap-2 mb-2">
              <button
                v-for="placeholder in textPlaceholders"
                :key="placeholder"
                @click="insertTextPlaceholder(placeholder)"
                class="px-2 py-1 bg-muted hover:bg-muted/80 rounded text-xs"
              >
                {{ placeholder }}
              </button>
            </div>
            <textarea
              v-model="textTemplate"
              @input="generateResponse"
              class="w-full h-64 p-3 font-mono text-sm border rounded-md resize-none"
              placeholder="欢迎使用API模拟器！

当前时间：{{timestamp}}
随机数字：{{random}}
用户ID：{{uuid}}
"
            ></textarea>
          </div>

          <!-- 验证结果 -->
          <div v-if="validationResult" class="p-3 rounded-md" :class="validationResult.valid ? 'bg-success/10 border border-success/20' : 'bg-destructive/10 border border-destructive/20'">
            <div class="text-sm font-medium" :class="validationResult.valid ? 'text-success' : 'text-destructive'">
              {{ validationResult.valid ? '✓ 模板有效' : '✗ 模板有误' }}
            </div>
            <div v-if="!validationResult.valid" class="text-sm text-destructive mt-1">
              {{ validationResult.error }}
            </div>
          </div>
        </div>

        <!-- 生成规则 -->
        <div class="bg-card rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">生成规则</h3>
          <div class="space-y-3">
            <div
              v-for="(rule, index) in generationRules"
              :key="index"
              class="border rounded-lg p-3 space-y-2"
            >
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium">规则 {{ index + 1 }}</span>
                <button
                  @click="removeRule(index)"
                  class="px-2 py-1 bg-destructive text-destructive-foreground rounded text-xs"
                >
                  删除
                </button>
              </div>

              <div class="grid grid-cols-2 gap-2">
                <select v-model="rule.type" class="px-2 py-1 text-sm border rounded">
                  <option value="count">数量</option>
                  <option value="random">随机值</option>
                  <option value="range">范围</option>
                  <option value="enum">枚举</option>
                  <option value="pattern">模式</option>
                </select>

                <input
                  v-model="rule.path"
                  placeholder="数据路径 (如: data.items)"
                  class="px-2 py-1 text-sm border rounded"
                >
              </div>

              <div v-if="rule.type === 'count'">
                <input
                  v-model.number="rule.value"
                  type="number"
                  placeholder="生成数量"
                  class="w-full px-2 py-1 text-sm border rounded"
                >
              </div>

              <div v-if="rule.type === 'random'">
                <select v-model="rule.dataType" class="w-full px-2 py-1 text-sm border rounded">
                  <option value="number">数字</option>
                  <option value="string">字符串</option>
                  <option value="boolean">布尔值</option>
                  <option value="email">邮箱</option>
                  <option value="phone">手机号</option>
                  <option value="date">日期</option>
                </select>
              </div>

              <div v-if="rule.type === 'range'">
                <div class="flex gap-2">
                  <input
                    v-model="rule.min"
                    placeholder="最小值"
                    class="flex-1 px-2 py-1 text-sm border rounded"
                  >
                  <input
                    v-model="rule.max"
                    placeholder="最大值"
                    class="flex-1 px-2 py-1 text-sm border rounded"
                  >
                </div>
              </div>

              <div v-if="rule.type === 'enum'">
                <input
                  v-model="rule.values"
                  placeholder="枚举值 (逗号分隔)"
                  class="w-full px-2 py-1 text-sm border rounded"
                >
              </div>

              <div v-if="rule.type === 'pattern'">
                <input
                  v-model="rule.pattern"
                  placeholder="正则模式"
                  class="w-full px-2 py-1 text-sm border rounded"
                >
              </div>
            </div>

            <button
              @click="addRule"
              class="w-full px-3 py-2 bg-primary text-primary-foreground rounded text-sm"
            >
              添加规则
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧预览和结果 -->
      <div class="space-y-6">
        <!-- 响应预览 -->
        <div class="bg-card rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-lg font-semibold">响应预览</h3>
            <div class="flex gap-2">
              <button
                @click="simulateRequest"
                :disabled="isSimulating"
                class="px-3 py-1 bg-primary text-primary-foreground rounded text-sm disabled:opacity-50"
              >
                {{ isSimulating ? '模拟中...' : '模拟请求' }}
              </button>
              <button
                @click="copyResponse"
                class="px-3 py-1 bg-secondary hover:bg-secondary/80 rounded text-sm"
              >
                复制响应
              </button>
              <button
                @click="downloadResponse"
                class="px-3 py-1 bg-secondary hover:bg-secondary/80 rounded text-sm"
              >
                下载
              </button>
            </div>
          </div>

          <!-- 模拟进度 -->
          <div v-if="isSimulating" class="mb-4">
            <div class="flex items-center justify-between text-sm mb-1">
              <span>模拟请求中...</span>
              <span>{{ simulationProgress }}%</span>
            </div>
            <div class="w-full bg-muted rounded-full h-2">
              <div
                class="bg-primary h-2 rounded-full transition-all duration-300"
                :style="{ width: simulationProgress + '%' }"
              ></div>
            </div>
          </div>

          <!-- HTTP状态信息 -->
          <div class="mb-4 p-3 bg-muted rounded-md">
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="font-medium">状态码:</span>
                <span :class="getStatusCodeClass(responseConfig.statusCode)">{{ responseConfig.statusCode }}</span>
              </div>
              <div>
                <span class="font-medium">Content-Type:</span> {{ responseConfig.contentType }}
              </div>
              <div>
                <span class="font-medium">响应大小:</span> {{ getResponseSize() }} 字节
              </div>
              <div>
                <span class="font-medium">响应时间:</span> {{ responseConfig.delay }}ms
              </div>
            </div>
          </div>

          <!-- 响应内容 -->
          <div class="border rounded-md overflow-hidden">
            <div class="bg-muted px-3 py-2 text-sm font-medium">
              响应体
            </div>
            <pre class="p-3 text-sm overflow-x-auto max-h-96 overflow-y-auto bg-muted text-foreground">{{ simulatedResponse || '点击"模拟请求"生成响应数据' }}</pre>
          </div>
        </div>

        <!-- 响应头 -->
        <div class="bg-card rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">响应头</h3>
          <div class="space-y-2">
            <div class="text-sm font-mono border-b pb-2">
              <div>Content-Type: {{ responseConfig.contentType }}</div>
              <div>Content-Length: {{ getResponseSize() }}</div>
              <div>X-Simulator: api-response-simulator</div>
              <div v-for="header in responseConfig.headers" :key="header.key" v-if="header.key">
                {{ header.key }}: {{ header.value }}
              </div>
            </div>
          </div>
        </div>

        <!-- 历史记录 -->
        <div class="bg-card rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-lg font-semibold">历史记录</h3>
            <button
              @click="clearHistory"
              class="px-3 py-1 bg-destructive text-destructive-foreground rounded text-sm"
            >
              清空
            </button>
          </div>

          <div class="space-y-2 max-h-64 overflow-y-auto">
            <div
              v-for="(record, index) in history"
              :key="index"
              class="p-2 border rounded cursor-pointer hover:bg-muted"
              @click="loadFromHistory(record)"
            >
              <div class="flex items-center justify-between text-sm">
                <span>{{ record.timestamp.toLocaleTimeString() }}</span>
                <span :class="getStatusCodeClass(record.statusCode)">{{ record.statusCode }}</span>
              </div>
              <div class="text-xs text-muted-foreground">
                {{ record.contentType }} | {{ record.size }} 字节
              </div>
            </div>
          </div>

          <div v-if="history.length === 0" class="text-center py-4 text-muted-foreground text-sm">
            暂无历史记录
          </div>
        </div>

        <!-- 使用说明 -->
        <div class="bg-card rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">使用说明</h3>
          <div class="space-y-2 text-sm text-muted-foreground">
            <div>• 配置HTTP状态码、响应头和延迟时间</div>
            <div>• 选择模板类型并编辑响应模板</div>
            <div>• 使用占位符动态生成数据</div>
            <div>• 添加生成规则控制数据生成逻辑</div>
            <div>• 点击"模拟请求"生成最终响应</div>
            <div class="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200" v-html="getPlaceholderInfo()"></div>
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
setPageTitle('API响应模拟器 - 在线API响应数据生成工具')

// 数据
const responseConfig = ref({
  statusCode: 200,
  contentType: 'application/json',
  delay: 0,
  headers: []
})

const templateType = ref('json')
const jsonTemplate = ref(`{
  "success": true,
  "data": {
    "items": [],
    "total": 0,
    "page": 1
  },
  "message": "操作成功",
  "timestamp": "{{timestamp}}"
}`)

const xmlTemplate = ref(`<?xml version="1.0" encoding="UTF-8"?>
<response>
  <success>true</success>
  <data>
    <items></items>
    <total>0</total>
    <page>1</page>
  </data>
  <message>操作成功</message>
  <timestamp>{{timestamp}}</timestamp>
</response>`)

const textTemplate = ref(`API响应模拟器

时间: {{timestamp}}
随机数: {{random}}
用户ID: {{uuid}}
姓名: {{name}}
邮箱: {{email}}

感谢使用！`)

const simulatedResponse = ref('')
const isSimulating = ref(false)
const simulationProgress = ref(0)
const validationResult = ref(null)
const history = ref([])

// 生成规则
const generationRules = ref([])

// 配置数据
const templateTypes = [
  { id: 'json', name: 'JSON' },
  { id: 'xml', name: 'XML' },
  { id: 'text', name: 'Text' }
]

const jsonHelpers = [
  { name: '数组', template: '[]', description: '生成空数组' },
  { name: '对象', template: '{}', description: '生成空对象' },
  { name: '随机数', template: '{{random}}', description: '生成随机数字' },
  { name: 'UUID', template: '{{uuid}}', description: '生成唯一标识符' },
  { name: '时间戳', template: '{{timestamp}}', description: '生成当前时间戳' }
]

const textPlaceholders = [
  '{{timestamp}}',
  '{{random}}',
  '{{uuid}}',
  '{{name}}',
  '{{email}}',
  '{{phone}}',
  '{{date}}'
]

// 方法
const addHeader = () => {
  responseConfig.value.headers.push({ key: '', value: '' })
}

const removeHeader = (index) => {
  responseConfig.value.headers.splice(index, 1)
}

const addRule = () => {
  generationRules.value.push({
    type: 'count',
    path: '',
    value: 5,
    dataType: 'string',
    min: 0,
    max: 100,
    values: '',
    pattern: ''
  })
}

const removeRule = (index) => {
  generationRules.value.splice(index, 1)
}

const insertJsonHelper = (helper) => {
  const textarea = document.querySelector('textarea')
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const text = jsonTemplate.value

  jsonTemplate.value = text.substring(0, start) + helper.template + text.substring(end)

  // 重新设置光标位置
  setTimeout(() => {
    textarea.selectionStart = textarea.selectionEnd = start + helper.template.length
    textarea.focus()
  }, 0)
}

const insertTextPlaceholder = (placeholder) => {
  const textarea = document.querySelector('textarea')
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const text = textTemplate.value

  textTemplate.value = text.substring(0, start) + placeholder + text.substring(end)

  setTimeout(() => {
    textarea.selectionStart = textarea.selectionEnd = start + placeholder.length
    textarea.focus()
  }, 0)
}

const loadTemplate = () => {
  if (templateType.value === 'json') {
    jsonTemplate.value = `{
  "success": true,
  "data": {
    "users": [
      {
        "id": "{{uuid}}",
        "name": "{{name}}",
        "email": "{{email}}",
        "phone": "{{phone}}",
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed={{random}}",
        "createdAt": "{{date}}"
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 10
  },
  "message": "获取用户列表成功",
  "timestamp": "{{timestamp}}"
}`
  } else if (templateType.value === 'xml') {
    xmlTemplate.value = `<?xml version="1.0" encoding="UTF-8"?>
<response>
  <success>true</success>
  <data>
    <users>
      <user>
        <id>{{uuid}}</id>
        <name>{{name}}</name>
        <email>{{email}}</email>
        <phone>{{phone}}</phone>
        <createdAt>{{date}}</createdAt>
      </user>
    </users>
    <total>1</total>
    <page>1</page>
    <pageSize>10</pageSize>
  </data>
  <message>获取用户列表成功</message>
  <timestamp>{{timestamp}}</timestamp>
</response>`
  } else if (templateType.value === 'text') {
    textTemplate.value = `用户信息报告
================

生成时间: {{timestamp}}
报告编号: {{uuid}}

用户详情:
姓名: {{name}}
邮箱: {{email}}
电话: {{phone}}
注册日期: {{date}}

随机验证码: {{random}}

感谢使用本系统！`
  }

  generateResponse()
}

const validateTemplate = () => {
  try {
    if (templateType.value === 'json') {
      // 替换占位符进行验证
      const testJson = jsonTemplate.value.replace(/\{\{[^}]+\}\}/g, 'test')
      JSON.parse(testJson)
      validationResult.value = { valid: true }
    } else {
      validationResult.value = { valid: true }
    }
  } catch (e) {
    validationResult.value = {
      valid: false,
      error: e.message
    }
  }
}

const generateResponse = () => {
  // 实时生成预览
  let template = ''

  if (templateType.value === 'json') {
    template = jsonTemplate.value
  } else if (templateType.value === 'xml') {
    template = xmlTemplate.value
  } else if (templateType.value === 'text') {
    template = textTemplate.value
  }

  // 替换占位符
  let response = template
    .replace(/\{\{timestamp\}\}/g, new Date().toISOString())
    .replace(/\{\{random\}\}/g, Math.floor(Math.random() * 10000))
    .replace(/\{\{uuid\}\}/g, generateUUID())
    .replace(/\{\{name\}\}/g, generateRandomName())
    .replace(/\{\{email\}\}/g, generateRandomEmail())
    .replace(/\{\{phone\}\}/g, generateRandomPhone())
    .replace(/\{\{date\}\}/g, new Date().toLocaleDateString())

  // 应用生成规则
  generationRules.value.forEach(rule => {
    if (rule.path && rule.type) {
      response = applyGenerationRule(response, rule)
    }
  })

  simulatedResponse.value = response
}

const applyGenerationRule = (response, rule) => {
  try {
    if (templateType.value === 'json') {
      const jsonObj = JSON.parse(response)
      applyRuleToObject(jsonObj, rule.path.split('.'), rule)
      return JSON.stringify(jsonObj, null, 2)
    }
  } catch (e) {
    console.error('规则应用失败:', e)
  }
  return response
}

const applyRuleToObject = (obj, path, rule) => {
  if (path.length === 0) return

  const key = path[0]
  if (path.length === 1) {
    if (rule.type === 'count' && Array.isArray(obj[key])) {
      const newItem = generateItemByRule(rule)
      for (let i = 0; i < rule.value; i++) {
        obj[key].push({ ...newItem })
      }
    } else {
      obj[key] = generateItemByRule(rule)
    }
  } else if (obj[key] && typeof obj[key] === 'object') {
    applyRuleToObject(obj[key], path.slice(1), rule)
  }
}

const generateItemByRule = (rule) => {
  switch (rule.type) {
    case 'random':
      return generateRandomValue(rule.dataType)
    case 'range':
      return Math.floor(Math.random() * (rule.max - rule.min + 1)) + rule.min
    case 'enum':
      const values = rule.values.split(',').map(v => v.trim())
      return values[Math.floor(Math.random() * values.length)]
    case 'pattern':
      return generateByPattern(rule.pattern)
    default:
      return ''
  }
}

const generateRandomValue = (type) => {
  switch (type) {
    case 'number':
      return Math.floor(Math.random() * 1000)
    case 'string':
      return Math.random().toString(36).substring(7)
    case 'boolean':
      return Math.random() > 0.5
    case 'email':
      return generateRandomEmail()
    case 'phone':
      return generateRandomPhone()
    case 'date':
      return new Date().toISOString()
    default:
      return ''
  }
}

const simulateRequest = async () => {
  if (isSimulating.value) return

  isSimulating.value = true
  simulationProgress.value = 0

  // 模拟延迟
  if (responseConfig.value.delay > 0) {
    const steps = 20
    const stepDelay = responseConfig.value.delay / steps

    for (let i = 0; i <= steps; i++) {
      simulationProgress.value = (i / steps) * 100
      await new Promise(resolve => setTimeout(resolve, stepDelay))
    }
  } else {
    simulationProgress.value = 100
  }

  generateResponse()

  // 添加到历史记录
  history.value.unshift({
    timestamp: new Date(),
    statusCode: responseConfig.value.statusCode,
    contentType: responseConfig.value.contentType,
    size: getResponseSize(),
    response: simulatedResponse.value
  })

  // 限制历史记录数量
  if (history.value.length > 10) {
    history.value = history.value.slice(0, 10)
  }

  isSimulating.value = false
  simulationProgress.value = 0
}

const copyResponse = async () => {
  try {
    await navigator.clipboard.writeText(simulatedResponse.value)
  } catch (err) {
    console.error('复制失败:', err)
  }
}

const downloadResponse = () => {
  const contentType = responseConfig.value.contentType
  let filename = 'api-response'
  let content = simulatedResponse.value

  if (contentType.includes('json')) {
    filename += '.json'
  } else if (contentType.includes('xml')) {
    filename += '.xml'
  } else {
    filename += '.txt'
  }

  const blob = new Blob([content], { type: contentType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const loadFromHistory = (record) => {
  responseConfig.value.statusCode = record.statusCode
  responseConfig.value.contentType = record.contentType
  simulatedResponse.value = record.response
}

const clearHistory = () => {
  history.value = []
}

const getResponseSize = () => {
  return new Blob([simulatedResponse.value]).size
}

const getStatusCodeClass = (statusCode) => {
  if (statusCode >= 200 && statusCode < 300) return 'text-success'
  if (statusCode >= 300 && statusCode < 400) return 'text-warning'
  if (statusCode >= 400) return 'text-destructive'
  return ''
}

// 工具函数
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

const generateRandomName = () => {
  const surnames = ['张', '李', '王', '刘', '陈', '杨', '赵', '黄', '周', '吴']
  const names = ['伟', '芳', '娜', '敏', '静', '强', '磊', '洋', '艳', '勇']
  return surnames[Math.floor(Math.random() * surnames.length)] + names[Math.floor(Math.random() * names.length)]
}

const generateRandomEmail = () => {
  const domains = ['qq.com', '163.com', 'gmail.com', 'outlook.com', '126.com']
  const name = Math.random().toString(36).substring(7)
  const domain = domains[Math.floor(Math.random() * domains.length)]
  return `${name}@${domain}`
}

const generateRandomPhone = () => {
  const prefixes = ['138', '139', '150', '151', '186', '188', '189']
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  const suffix = Math.floor(Math.random() * 100000000).toString().padStart(8, '0')
  return prefix + suffix
}

const generateByPattern = (pattern) => {
  // 简单的模式生成器
  try {
    const regex = new RegExp(pattern.replace(/[{}]/g, ''))
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < 8; i++) {
      result += chars[Math.floor(Math.random() * chars.length)]
    }
    return result
  } catch (e) {
    return 'generated'
  }
}

const getPlaceholderInfo = () => {
  return `<strong>占位符说明:</strong><br>
              {'{timestamp}'} - 当前时间<br>
              {'{random}'} - 随机数字<br>
              {'{uuid}'} - 唯一标识符<br>
              {'{name}'} - 随机姓名<br>
              {'{email}'} - 随机邮箱`
}

// 初始化
generateResponse()
</script>