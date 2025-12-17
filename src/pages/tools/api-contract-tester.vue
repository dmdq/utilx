<template>
  <div class="max-w-8xl mx-auto">
    <!-- 头部 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-3">API契约测试器</h1>
      <p class="text-muted-foreground mb-4">测试和验证API契约，支持多种请求方法和认证方式，可进行压力测试和契约验证</p>
    </div>

    <!-- 工具容器 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧请求配置 -->
      <div class="space-y-6">
        <!-- 基础配置 -->
        <div class="bg-card rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">请求配置</h3>
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-sm font-medium mb-2">请求方法</label>
              <select v-model="requestConfig.method" class="w-full px-3 py-2 border rounded-md">
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="PATCH">PATCH</option>
                <option value="HEAD">HEAD</option>
                <option value="OPTIONS">OPTIONS</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">内容类型</label>
              <select v-model="requestConfig.contentType" class="w-full px-3 py-2 border rounded-md">
                <option value="application/json">application/json</option>
                <option value="application/x-www-form-urlencoded">application/x-www-form-urlencoded</option>
                <option value="multipart/form-data">multipart/form-data</option>
                <option value="text/plain">text/plain</option>
                <option value="application/xml">application/xml</option>
              </select>
            </div>
          </div>

          <div class="mb-4">
            <label class="block text-sm font-medium mb-2">请求URL</label>
            <input
              v-model="requestConfig.url"
              type="text"
              placeholder="https://api.example.com/users"
              class="w-full px-3 py-2 border rounded-md"
            >
          </div>

          <div class="flex gap-2">
            <button
              @click="loadExample"
              class="px-3 py-1 bg-secondary hover:bg-secondary/80 rounded text-sm"
            >
              加载示例
            </button>
            <button
              @click="sendRequest"
              :disabled="!requestConfig.url"
              class="px-3 py-1 bg-primary text-primary-foreground rounded text-sm disabled:opacity-50"
            >
              发送请求
            </button>
            <button
              @click="clearRequest"
              class="px-3 py-1 bg-destructive text-destructive-foreground rounded text-sm"
            >
              清空
            </button>
          </div>
        </div>

        <!-- 认证配置 -->
        <div class="bg-card rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">认证方式</h3>
          <select v-model="authType" @change="onAuthTypeChange" class="w-full px-3 py-2 border rounded-md mb-3">
            <option value="none">无认证</option>
            <option value="bearer">Bearer Token</option>
            <option value="basic">Basic Auth</option>
            <option value="api-key">API Key</option>
            <option value="oauth2">OAuth 2.0</option>
          </select>

          <!-- Bearer Token -->
          <div v-if="authType === 'bearer'" class="space-y-3">
            <input
              v-model="auth.bearer.token"
              type="text"
              placeholder="输入Bearer Token"
              class="w-full px-3 py-2 border rounded-md"
            >
          </div>

          <!-- Basic Auth -->
          <div v-else-if="authType === 'basic'" class="grid grid-cols-2 gap-3">
            <input
              v-model="auth.basic.username"
              type="text"
              placeholder="用户名"
              class="px-3 py-2 border rounded-md"
            >
            <input
              v-model="auth.basic.password"
              type="password"
              placeholder="密码"
              class="px-3 py-2 border rounded-md"
            >
          </div>

          <!-- API Key -->
          <div v-else-if="authType === 'api-key'" class="space-y-3">
            <input
              v-model="auth.apiKey.key"
              type="text"
              placeholder="Key名称"
              class="w-full px-3 py-2 border rounded-md"
            >
            <input
              v-model="auth.apiKey.value"
              type="text"
              placeholder="API Key值"
              class="w-full px-3 py-2 border rounded-md"
            >
            <select v-model="auth.apiKey.location" class="w-full px-3 py-2 border rounded-md">
              <option value="header">Header</option>
              <option value="query">Query Parameter</option>
            </select>
          </div>

          <!-- OAuth 2.0 -->
          <div v-else-if="authType === 'oauth2'" class="space-y-3">
            <input
              v-model="auth.oauth2.clientId"
              type="text"
              placeholder="Client ID"
              class="w-full px-3 py-2 border rounded-md"
            >
            <input
              v-model="auth.oauth2.clientSecret"
              type="password"
              placeholder="Client Secret"
              class="w-full px-3 py-2 border rounded-md"
            >
            <input
              v-model="auth.oauth2.tokenUrl"
              type="text"
              placeholder="Token URL"
              class="w-full px-3 py-2 border rounded-md"
            >
          </div>
        </div>

        <!-- 请求头 -->
        <div class="bg-card rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-lg font-semibold">请求头</h3>
            <button
              @click="addHeader"
              class="px-3 py-1 bg-primary text-primary-foreground rounded text-sm"
            >
              添加头
            </button>
          </div>

          <div class="space-y-2">
            <div
              v-for="(header, index) in requestConfig.headers"
              :key="index"
              class="flex gap-2"
            >
              <input
                v-model="header.key"
                placeholder="名称"
                class="flex-1 px-2 py-1 border rounded text-sm"
              >
              <input
                v-model="header.value"
                placeholder="值"
                class="flex-1 px-2 py-1 border rounded text-sm"
              >
              <button
                @click="removeHeader(index)"
                class="px-2 py-1 bg-destructive text-destructive-foreground rounded text-sm"
              >
                删除
              </button>
            </div>
          </div>
        </div>

        <!-- 请求体 -->
        <div v-if="['POST', 'PUT', 'PATCH'].includes(requestConfig.method)" class="bg-card rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">请求体</h3>
          <div class="mb-2">
            <select v-model="bodyType" @change="onBodyTypeChange" class="px-3 py-2 border rounded-md text-sm">
              <option value="json">JSON</option>
              <option value="form">Form Data</option>
              <option value="raw">Raw</option>
              <option value="binary">Binary</option>
            </select>
          </div>

          <div v-if="bodyType === 'json'">
            <textarea
              v-model="requestConfig.body"
              class="w-full h-48 p-3 font-mono text-sm border rounded-md resize-none"
              placeholder='{"key": "value"}'
            ></textarea>
          </div>

          <div v-else-if="bodyType === 'form'" class="space-y-2">
            <div
              v-for="(field, index) in formData"
              :key="index"
              class="flex gap-2"
            >
              <input
                v-model="field.key"
                placeholder="字段名"
                class="flex-1 px-2 py-1 border rounded text-sm"
              >
              <input
                v-model="field.value"
                placeholder="字段值"
                class="flex-1 px-2 py-1 border rounded text-sm"
              >
              <button
                @click="removeFormField(index)"
                class="px-2 py-1 bg-destructive text-destructive-foreground rounded text-sm"
              >
                删除
              </button>
            </div>
            <button
              @click="addFormField"
              class="w-full px-3 py-2 bg-secondary hover:bg-secondary/80 rounded text-sm"
            >
              添加字段
            </button>
          </div>

          <div v-else-if="bodyType === 'raw'">
            <textarea
              v-model="requestConfig.body"
              class="w-full h-48 p-3 font-mono text-sm border rounded-md resize-none"
              placeholder="原始请求体内容"
            ></textarea>
          </div>

          <div v-else-if="bodyType === 'binary'">
            <input
              type="file"
              @change="handleFileUpload"
              class="w-full px-3 py-2 border rounded-md text-sm"
            >
          </div>
        </div>
      </div>

      <!-- 右侧响应和测试 -->
      <div class="space-y-6">
        <!-- 响应结果 -->
        <div class="bg-card rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-lg font-semibold">响应结果</h3>
            <div v-if="response.status" class="flex items-center gap-2">
              <span class="px-2 py-1 rounded text-xs" :class="getStatusClass(response.status)">
                {{ response.status }}
              </span>
              <span class="text-sm text-muted-foreground">{{ response.time }}ms</span>
            </div>
          </div>

          <div v-if="!response.data && !response.error" class="text-center py-8 text-muted-foreground text-sm">
            发送请求后将在此显示响应结果
          </div>

          <div v-else-if="response.error" class="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div class="font-medium text-red-800 mb-2">请求失败</div>
            <div class="text-sm text-red-600">{{ response.error }}</div>
          </div>

          <div v-else class="space-y-3">
            <!-- 响应头 -->
            <div>
              <h4 class="font-medium text-sm mb-2">响应头</h4>
              <div class="max-h-32 overflow-auto bg-gray-50 p-2 rounded text-xs">
                <div v-for="(value, key) in response.headers" :key="key" class="mb-1">
                  <strong>{{ key }}:</strong> {{ value }}
                </div>
              </div>
            </div>

            <!-- 响应体 -->
            <div>
              <h4 class="font-medium text-sm mb-2">响应体</h4>
              <div class="max-h-64 overflow-auto">
                <pre class="bg-gray-50 p-3 rounded text-sm overflow-x-auto"><code>{{ formatResponse(response.data) }}</code></pre>
              </div>
            </div>
          </div>
        </div>

        <!-- 契约验证 -->
        <div class="bg-card rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">契约验证</h3>
          <div class="space-y-3">
            <div>
              <label class="block text-sm font-medium mb-2">验证规则</label>
              <textarea
                v-model="contractRules"
                class="w-full h-32 p-3 font-mono text-sm border rounded-md resize-none"
                placeholder="status: 200
headers:
  content-type: application/json
body:
  type: object
  required: [id, name]
  properties:
    id:
      type: number
    name:
      type: string"
              ></textarea>
            </div>
            <button
              @click="validateContract"
              :disabled="!response.data"
              class="w-full px-3 py-2 bg-primary text-primary-foreground rounded text-sm disabled:opacity-50"
            >
              验证契约
            </button>

            <div v-if="validationResult" class="space-y-2">
              <div
                v-for="(result, index) in validationResult"
                :key="index"
                class="p-3 border rounded"
                :class="result.passed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'"
              >
                <div class="flex items-start gap-2">
                  <div class="flex-shrink-0 mt-1">
                    <div
                      class="w-2 h-2 rounded-full"
                      :class="result.passed ? 'bg-green-500' : 'bg-red-500'"
                    ></div>
                  </div>
                  <div class="flex-1">
                    <div class="font-medium text-sm">{{ result.field }}</div>
                    <div class="text-xs text-muted-foreground mt-1">{{ result.message }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 压力测试 -->
        <div class="bg-card rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">压力测试</h3>
          <div class="grid grid-cols-3 gap-3 mb-3">
            <div>
              <label class="block text-sm font-medium mb-1">并发数</label>
              <input
                v-model.number="stressTest.concurrency"
                type="number"
                min="1"
                max="100"
                class="w-full px-2 py-1 border rounded text-sm"
              >
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">持续时间</label>
              <input
                v-model.number="stressTest.duration"
                type="number"
                min="1"
                max="60"
                class="w-full px-2 py-1 border rounded text-sm"
              >
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">间隔(ms)</label>
              <input
                v-model.number="stressTest.interval"
                type="number"
                min="0"
                max="1000"
                class="w-full px-2 py-1 border rounded text-sm"
              >
            </div>
          </div>

          <button
            @click="runStressTest"
            :disabled="!requestConfig.url || stressTest.running"
            class="w-full px-3 py-2 bg-primary text-primary-foreground rounded text-sm disabled:opacity-50"
          >
            {{ stressTest.running ? '测试中...' : '开始压力测试' }}
          </button>

          <div v-if="stressTest.results" class="mt-3 space-y-2">
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div class="p-2 bg-muted rounded">
                <div class="font-medium">{{ stressTest.results.totalRequests }}</div>
                <div class="text-xs text-muted-foreground">总请求数</div>
              </div>
              <div class="p-2 bg-muted rounded">
                <div class="font-medium">{{ stressTest.results.successRate }}%</div>
                <div class="text-xs text-muted-foreground">成功率</div>
              </div>
              <div class="p-2 bg-muted rounded">
                <div class="font-medium">{{ stressTest.results.avgResponseTime }}ms</div>
                <div class="text-xs text-muted-foreground">平均响应时间</div>
              </div>
              <div class="p-2 bg-muted rounded">
                <div class="font-medium">{{ stressTest.results.requestsPerSecond }}</div>
                <div class="text-xs text-muted-foreground">请求/秒</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 请求历史 -->
        <div class="bg-card rounded-lg p-4">
          <h3 class="text-lg font-semibold mb-3">请求历史</h3>
          <div class="space-y-2 max-h-48 overflow-auto">
            <div
              v-for="(history, index) in requestHistory"
              :key="index"
              @click="loadFromHistory(history)"
              class="p-2 border rounded cursor-pointer hover:bg-muted"
            >
              <div class="flex justify-between items-center">
                <span class="font-mono text-sm">{{ history.method }} {{ history.url }}</span>
                <span class="text-xs text-muted-foreground">{{ history.timestamp.toLocaleTimeString() }}</span>
              </div>
              <div class="text-xs text-muted-foreground mt-1">
                状态: {{ history.status || 'N/A' }} | 响应时间: {{ history.responseTime || 'N/A' }}ms
              </div>
            </div>
            <div v-if="requestHistory.length === 0" class="text-center py-4 text-muted-foreground text-sm">
              暂无请求历史
            </div>
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
setPageTitle('API契约测试器 - HTTP请求和契约验证工具')

// 数据
const requestConfig = ref({
  method: 'GET',
  url: '',
  headers: [],
  body: '',
  contentType: 'application/json'
})

const authType = ref('none')
const auth = ref({
  bearer: { token: '' },
  basic: { username: '', password: '' },
  apiKey: { key: 'X-API-Key', value: '', location: 'header' },
  oauth2: { clientId: '', clientSecret: '', tokenUrl: '' }
})

const bodyType = ref('json')
const formData = ref([])

const response = ref({
  status: null,
  headers: {},
  data: null,
  error: null,
  time: 0
})

const contractRules = ref('')
const validationResult = ref([])

const stressTest = ref({
  running: false,
  concurrency: 10,
  duration: 5,
  interval: 100,
  results: null
})

const requestHistory = ref([])

// 示例请求
const exampleRequests = [
  {
    method: 'GET',
    url: 'https://jsonplaceholder.typicode.com/users',
    headers: [],
    body: ''
  },
  {
    method: 'POST',
    url: 'https://jsonplaceholder.typicode.com/posts',
    headers: [{ key: 'Content-Type', value: 'application/json' }],
    body: JSON.stringify({
      title: 'foo',
      body: 'bar',
      userId: 1
    }, null, 2)
  },
  {
    method: 'PUT',
    url: 'https://jsonplaceholder.typicode.com/posts/1',
    headers: [{ key: 'Content-Type', value: 'application/json' }],
    body: JSON.stringify({
      id: 1,
      title: 'foo',
      body: 'bar',
      userId: 1
    }, null, 2)
  }
]

// 计算属性
const getStatusClass = (status) => {
  if (status >= 200 && status < 300) return 'bg-green-100 text-green-800'
  if (status >= 300 && status < 400) return 'bg-yellow-100 text-yellow-800'
  if (status >= 400) return 'bg-red-100 text-red-800'
  return 'bg-gray-100 text-gray-800'
}

// 方法
const loadExample = () => {
  const example = exampleRequests[Math.floor(Math.random() * exampleRequests.length)]
  requestConfig.value = { ...requestConfig.value, ...example }
  bodyType.value = example.method === 'GET' ? 'raw' : 'json'
}

const clearRequest = () => {
  requestConfig.value = {
    method: 'GET',
    url: '',
    headers: [],
    body: '',
    contentType: 'application/json'
  }
  response.value = {
    status: null,
    headers: {},
    data: null,
    error: null,
    time: 0
  }
  validationResult.value = []
}

const onAuthTypeChange = () => {
  // 重置认证配置
  Object.keys(auth.value).forEach(key => {
    if (typeof auth.value[key] === 'object') {
      Object.keys(auth.value[key]).forEach(subKey => {
        auth.value[key][subKey] = ''
      })
    }
  })
}

const onBodyTypeChange = () => {
  if (bodyType.value === 'form' && formData.value.length === 0) {
    formData.value = [{ key: '', value: '' }]
  }
}

const addHeader = () => {
  requestConfig.value.headers.push({ key: '', value: '' })
}

const removeHeader = (index) => {
  requestConfig.value.headers.splice(index, 1)
}

const addFormField = () => {
  formData.value.push({ key: '', value: '' })
}

const removeFormField = (index) => {
  formData.value.splice(index, 1)
}

const handleFileUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    // 这里可以处理文件上传逻辑
    console.log('File selected:', file.name)
  }
}

const buildRequest = () => {
  const requestOptions = {
    method: requestConfig.value.method,
    headers: {}
  }

  // 添加基础请求头
  if (requestConfig.value.contentType && ['POST', 'PUT', 'PATCH'].includes(requestConfig.value.method)) {
    requestOptions.headers['Content-Type'] = requestConfig.value.contentType
  }

  // 添加自定义请求头
  requestConfig.value.headers.forEach(header => {
    if (header.key && header.value) {
      requestOptions.headers[header.key] = header.value
    }
  })

  // 添加认证
  if (authType.value === 'bearer' && auth.value.bearer.token) {
    requestOptions.headers['Authorization'] = `Bearer ${auth.value.bearer.token}`
  } else if (authType.value === 'basic' && auth.value.basic.username) {
    const credentials = btoa(`${auth.value.basic.username}:${auth.value.basic.password}`)
    requestOptions.headers['Authorization'] = `Basic ${credentials}`
  } else if (authType.value === 'api-key' && auth.value.apiKey.value) {
    if (auth.value.apiKey.location === 'header') {
      requestOptions.headers[auth.value.apiKey.key] = auth.value.apiKey.value
    } else {
      // Query parameter
      const separator = requestConfig.value.url.includes('?') ? '&' : '?'
      requestConfig.value.url += `${separator}${auth.value.apiKey.key}=${auth.value.apiKey.value}`
    }
  }

  // 处理请求体
  if (['POST', 'PUT', 'PATCH'].includes(requestConfig.value.method)) {
    if (bodyType.value === 'json' && requestConfig.value.body) {
      try {
        requestOptions.body = JSON.parse(requestConfig.value.body)
      } catch (e) {
        requestOptions.body = requestConfig.value.body
      }
    } else if (bodyType.value === 'form') {
      const formBody = new FormData()
      formData.value.forEach(field => {
        if (field.key && field.value) {
          formBody.append(field.key, field.value)
        }
      })
      requestOptions.body = formBody
      delete requestOptions.headers['Content-Type'] // 让浏览器自动设置
    } else if (requestConfig.value.body) {
      requestOptions.body = requestConfig.value.body
    }
  }

  return requestOptions
}

const sendRequest = async () => {
  try {
    const startTime = Date.now()
    const requestOptions = buildRequest()

    // 使用fetch发送请求（注意：这里使用CORS代理或需要服务器配置CORS）
    const proxyUrl = 'https://cors-anywhere.herokuapp.com/' // 仅用于演示，生产环境不推荐
    const finalUrl = requestConfig.value.url.startsWith('http')
      ? requestConfig.value.url
      : `https://${requestConfig.value.url}`

    const res = await fetch(proxyUrl + finalUrl, requestOptions)
    const endTime = Date.now()

    // 解析响应
    let responseData
    const contentType = res.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      responseData = await res.json()
    } else {
      responseData = await res.text()
    }

    // 更新响应
    response.value = {
      status: res.status,
      headers: Object.fromEntries(res.headers.entries()),
      data: responseData,
      error: null,
      time: endTime - startTime
    }

    // 添加到历史记录
    requestHistory.value.unshift({
      method: requestConfig.value.method,
      url: requestConfig.value.url,
      status: res.status,
      responseTime: response.value.time,
      timestamp: new Date()
    })

    // 限制历史记录数量
    if (requestHistory.value.length > 20) {
      requestHistory.value = requestHistory.value.slice(0, 20)
    }

  } catch (error) {
    response.value = {
      status: null,
      headers: {},
      data: null,
      error: error.message,
      time: 0
    }
  }
}

const formatResponse = (data) => {
  if (typeof data === 'object') {
    return JSON.stringify(data, null, 2)
  }
  return data
}

const validateContract = () => {
  if (!response.value.data) {
    return
  }

  const rules = {}
  try {
    // 简单的YAML解析（实际项目建议使用YAML解析库）
    const lines = contractRules.value.split('\n')
    let currentSection = null
    let currentObject = null

    lines.forEach(line => {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) return

      if (trimmed === 'headers:') {
        currentSection = 'headers'
        rules.headers = {}
      } else if (trimmed === 'body:') {
        currentSection = 'body'
        rules.body = {}
      } else if (trimmed.includes(':')) {
        const [key, value] = trimmed.split(':').map(s => s.trim())

        if (currentSection && currentSection !== 'body') {
          rules[currentSection][key] = value
        } else if (!currentSection) {
          rules[key] = value
        }
      }
    })

    // 执行验证
    const results = []

    // 验证状态码
    if (rules.status && rules.status !== response.value.status.toString()) {
      results.push({
        field: 'status',
        passed: false,
        message: `期望状态码 ${rules.status}，实际 ${response.value.status}`
      })
    } else {
      results.push({
        field: 'status',
        passed: true,
        message: '状态码验证通过'
      })
    }

    // 验证响应头
    if (rules.headers) {
      Object.entries(rules.headers).forEach(([key, expectedValue]) => {
        const actualValue = response.value.headers[key.toLowerCase()]
        if (actualValue) {
          if (actualValue.includes(expectedValue)) {
            results.push({
              field: `header.${key}`,
              passed: true,
              message: `响应头 ${key} 验证通过`
            })
          } else {
            results.push({
              field: `header.${key}`,
              passed: false,
              message: `响应头 ${key} 值不匹配，期望包含 ${expectedValue}，实际 ${actualValue}`
            })
          }
        } else {
          results.push({
            field: `header.${key}`,
            passed: false,
            message: `缺少响应头 ${key}`
          })
        }
      })
    }

    // 验证响应体
    if (rules.body && typeof response.value.data === 'object') {
      // 简化验证逻辑
      if (rules.body.type && rules.body.type === 'object' && typeof response.value.data === 'object') {
        results.push({
          field: 'body.type',
          passed: true,
          message: '响应体类型验证通过'
        })

        // 验证必需字段
        if (rules.body.required) {
          rules.body.required.forEach(field => {
            if (response.value.data[field] !== undefined) {
              results.push({
                field: `body.${field}`,
                passed: true,
                message: `必需字段 ${field} 存在`
              })
            } else {
              results.push({
                field: `body.${field}`,
                passed: false,
                message: `缺少必需字段 ${field}`
              })
            }
          })
        }
      }
    }

    validationResult.value = results

  } catch (error) {
    validationResult.value = [{
      field: 'parsing',
      passed: false,
      message: '契约规则解析失败: ' + error.message
    }]
  }
}

const runStressTest = async () => {
  if (!requestConfig.value.url) return

  stressTest.value.running = true
  const startTime = Date.now()
  const endTime = startTime + stressTest.value.duration * 1000

  const results = {
    totalRequests: 0,
    successCount: 0,
    errorCount: 0,
    totalResponseTime: 0,
    responseTimes: []
  }

  const makeRequest = async () => {
    const requestStart = Date.now()
    try {
      const requestOptions = buildRequest()
      const res = await fetch(requestConfig.value.url, requestOptions)
      const requestEnd = Date.now()

      results.totalRequests++
      results.totalResponseTime += (requestEnd - requestStart)
      results.responseTimes.push(requestEnd - requestStart)

      if (res.status >= 200 && res.status < 400) {
        results.successCount++
      } else {
        results.errorCount++
      }
    } catch (error) {
      results.totalRequests++
      results.errorCount++
    }
  }

  // 并发请求
  const promises = []
  for (let i = 0; i < stressTest.value.concurrency; i++) {
    const requestPromise = async () => {
      while (Date.now() < endTime) {
        await makeRequest()
        if (stressTest.value.interval > 0) {
          await new Promise(resolve => setTimeout(resolve, stressTest.value.interval))
        }
      }
    }
    promises.push(requestPromise())
  }

  await Promise.all(promises)

  // 计算统计结果
  const totalDuration = (Date.now() - startTime) / 1000
  stressTest.value.results = {
    totalRequests: results.totalRequests,
    successRate: Math.round((results.successCount / results.totalRequests) * 100),
    avgResponseTime: Math.round(results.totalResponseTime / results.totalRequests),
    requestsPerSecond: Math.round(results.totalRequests / totalDuration)
  }

  stressTest.value.running = false
}

const loadFromHistory = (history) => {
  requestConfig.value.method = history.method
  requestConfig.value.url = history.url
  response.value.status = history.status
  response.value.time = history.responseTime
}

// 初始化
onMounted(() => {
  loadExample()
})
</script>