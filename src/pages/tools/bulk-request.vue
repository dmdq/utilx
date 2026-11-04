<script setup>
import { ref, computed } from 'vue'
import { Zap, Play, Pause, RotateCcw, Trash2, Plus, Copy, CheckCircle2, XCircle, Clock, ChevronUp, HelpCircle } from 'lucide-vue-next'
import { tools } from '~/data/tools'

// SEO配置
useSeoMeta({
  title: '批量请求工具 - 在线批量HTTP请求测试 | 并发API测试',
  description: '免费在线批量HTTP请求工具，支持并发请求、自定义Headers、延迟控制，可批量测试API接口，支持GET/POST等方法，适用于开发和测试场景。',
  keywords: '批量请求,HTTP请求,API测试,并发测试,批量测试,接口测试,在线请求',
  author: 'Util工具箱',
  ogTitle: '批量请求工具 - 免费在线批量HTTP请求测试',
  ogDescription: '专业的批量HTTP请求工具，支持并发请求、自定义Headers、延迟控制。',
  ogType: 'website'
})

// 请求配置
const requestConfig = ref({
  method: 'GET',
  url: '',
  headers: '',
  body: '',
  concurrency: 5,
  requestCount: 10,
  delay: 0
})

// 请求状态
const isRunning = ref(false)
const shouldStop = ref(false)
const completedCount = ref(0)
const results = ref([])

// 添加的请求列表
const requestList = ref([])

// 单个请求编辑
const singleRequest = ref({
  id: Date.now(),
  url: '',
  method: 'GET',
  headers: '',
  body: ''
})

// HTTP方法
const httpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']

// 统计数据
const stats = computed(() => {
  const total = results.value.length
  const success = results.value.filter(r => r.success).length
  const failed = total - success
  const totalDuration = results.value.reduce((sum, r) => sum + r.duration, 0)
  const avgDuration = total > 0 ? Math.round(totalDuration / total) : 0
  const minDuration = total > 0 ? Math.min(...results.value.map(r => r.duration)) : 0
  const maxDuration = total > 0 ? Math.max(...results.value.map(r => r.duration)) : 0

  return { total, success, failed, avgDuration, minDuration, maxDuration }
})

// 成功率
const successRate = computed(() => {
  if (stats.value.total === 0) return 0
  return Math.round((stats.value.success / stats.value.total) * 100)
})

// 添加请求到列表
const addRequestToList = () => {
  if (!singleRequest.value.url.trim()) {
    alert('请输入URL')
    return
  }

  requestList.value.push({
    ...singleRequest.value,
    id: Date.now()
  })

  singleRequest.value = {
    id: Date.now(),
    url: '',
    method: 'GET',
    headers: '',
    body: ''
  }
}

// 从列表删除请求
const removeFromList = (id) => {
  requestList.value = requestList.value.filter(r => r.id !== id)
}

// 清空列表
const clearList = () => {
  if (requestList.value.length === 0) return
  if (confirm('确定要清空请求列表吗？')) {
    requestList.value = []
  }
}

// 解析Headers
const parseHeaders = (headersStr) => {
  const headers = {}
  if (!headersStr.trim()) return headers

  const lines = headersStr.split('\n')
  lines.forEach(line => {
    const colonIndex = line.indexOf(':')
    if (colonIndex > -1) {
      const name = line.substring(0, colonIndex).trim()
      const value = line.substring(colonIndex + 1).trim()
      if (name) {
        headers[name] = value
      }
    }
  })

  return headers
}

// 执行单个请求
const executeRequest = async (request) => {
  const startTime = Date.now()

  try {
    const options = {
      method: request.method,
      headers: parseHeaders(request.headers || '')
    }

    if (request.body && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
      options.body = request.body
    }

    const response = await fetch(request.url, options)
    const duration = Date.now() - startTime

    const result = {
      id: Date.now() + Math.random(),
      url: request.url,
      method: request.method,
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      duration,
      timestamp: new Date().toISOString()
    }

    try {
      result.data = await response.text()
      // 尝试解析JSON
      try {
        result.json = JSON.parse(result.data)
      } catch {
        result.json = null
      }
    } catch {
      result.data = null
    }

    return result
  } catch (error) {
    const duration = Date.now() - startTime
    return {
      id: Date.now() + Math.random(),
      url: request.url,
      method: request.method,
      success: false,
      status: 0,
      statusText: error.message,
      duration,
      timestamp: new Date().toISOString(),
      error: error.message
    }
  }
}

// 批量执行请求
const executeBulkRequests = async () => {
  if (requestList.value.length === 0) {
    alert('请先添加请求到列表')
    return
  }

  isRunning.value = true
  shouldStop.value = false
  completedCount.value = 0
  results.value = []

  const concurrency = requestConfig.value.concurrency
  const delay = requestConfig.value.delay

  // 并发执行
  const chunks = []
  for (let i = 0; i < requestList.value.length; i += concurrency) {
    chunks.push(requestList.value.slice(i, i + concurrency))
  }

  for (const chunk of chunks) {
    if (shouldStop.value) break

    await Promise.all(
      chunk.map(async (request) => {
        for (let j = 0; j < requestConfig.value.requestCount; j++) {
          if (shouldStop.value) return

          const result = await executeRequest(request)
          results.value.push(result)
          completedCount.value++
        }

        if (delay > 0) {
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      })
    )
  }

  isRunning.value = false
}

// 停止执行
const stopExecution = () => {
  shouldStop.value = true
}

// 重置
const reset = () => {
  if (isRunning.value) return
  results.value = []
  completedCount.value = 0
}

// 加载示例
const loadSample = () => {
  requestList.value = [
    {
      id: 1,
      url: 'https://httpbin.org/get',
      method: 'GET',
      headers: 'Accept: application/json\nUser-Agent: BulkRequest/1.0',
      body: ''
    },
    {
      id: 2,
      url: 'https://httpbin.org/status/200',
      method: 'GET',
      headers: '',
      body: ''
    },
    {
      id: 3,
      url: 'https://httpbin.org/delay/1',
      method: 'GET',
      headers: '',
      body: ''
    }
  ]
}

// 导出结果
const exportResults = () => {
  if (results.value.length === 0) {
    alert('暂无结果可导出')
    return
  }

  const data = results.value.map(r => ({
    URL: r.url,
    Method: r.method,
    Status: r.status,
    Success: r.success ? 'Yes' : 'No',
    Duration: `${r.duration}ms`,
    Timestamp: r.timestamp
  }))

  const csv = [
    Object.keys(data[0]).join(','),
    ...data.map(row => Object.values(row).join(','))
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `批量请求结果_${new Date().toLocaleDateString('zh-CN')}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

// 获取状态背景色
const getStatusBgColor = (result) => {
  if (result.success) {
    return result.status >= 200 && result.status < 300 ? 'bg-green-50' : 'bg-yellow-50'
  }
  return 'bg-red-50'
}

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 切换SEO内容显示状态
const toggleSeoContent = () => {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

// 相关工具
const relatedTools = [
  tools.find(t => t.id === 'headers-viewer'),
  tools.find(t => t.id === 'cookies-manager'),
  tools.find(t => t.id === 'api-tester'),
  tools.find(t => t.id === 'websocket-test')
].filter(Boolean)
</script>

<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">批量请求工具 - 在线批量HTTP请求测试</h1>
      <p class="text-muted-foreground">免费在线批量HTTP请求工具，支持并发请求、自定义Headers、延迟控制，可批量测试API接口，支持GET/POST等方法，适用于开发和测试场景。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 左侧：请求配置和列表 -->
      <div class="space-y-4">
        <!-- 添加请求 -->
        <div class="bg-card border border-border rounded-lg p-4">
          <h3 class="font-semibold text-foreground mb-4">添加请求</h3>
          <div class="space-y-3">
            <div>
              <label class="text-xs text-muted-foreground mb-1 block">HTTP方法</label>
              <select
                v-model="singleRequest.method"
                class="w-full px-3 py-2 bg-muted border border-border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              >
                <option v-for="method in httpMethods" :key="method" :value="method">
                  {{ method }}
                </option>
              </select>
            </div>
            <div>
              <label class="text-xs text-muted-foreground mb-1 block">URL *</label>
              <input
                v-model="singleRequest.url"
                type="text"
                class="w-full px-3 py-2 bg-muted border border-border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                placeholder="https://api.example.com/endpoint"
              />
            </div>
            <div>
              <label class="text-xs text-muted-foreground mb-1 block">Headers (可选)</label>
              <textarea
                v-model="singleRequest.headers"
                class="w-full h-20 px-3 py-2 bg-muted border border-border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm font-mono resize-none"
                placeholder="Content-Type: application/json&#10;Authorization: Bearer token"
              ></textarea>
            </div>
            <div v-if="['POST', 'PUT', 'PATCH'].includes(singleRequest.method)">
              <label class="text-xs text-muted-foreground mb-1 block">Body (可选)</label>
              <textarea
                v-model="singleRequest.body"
                class="w-full h-20 px-3 py-2 bg-muted border border-border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm font-mono resize-none"
                placeholder='{"key": "value"}'
              ></textarea>
            </div>
            <button
              @click="addRequestToList"
              class="w-full px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition flex items-center justify-center gap-2"
            >
              <Plus :size="18" />
              添加到列表
            </button>
          </div>
        </div>

        <!-- 请求列表 -->
        <div class="bg-card border border-border rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-semibold text-foreground">请求列表 ({{ requestList.length }})</h3>
            <button
              v-if="requestList.length > 0"
              @click="clearList"
              class="text-destructive hover:text-destructive/80 text-sm transition"
            >
              清空
            </button>
          </div>
          <div v-if="requestList.length > 0" class="space-y-2 max-h-64 overflow-y-auto">
            <div
              v-for="req in requestList"
              :key="req.id"
              class="bg-muted rounded-lg p-3 text-sm group"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <span
                      class="px-2 py-0.5 rounded font-bold text-xs"
                      :class="{
                        'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300': req.method === 'GET',
                        'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300': req.method === 'POST',
                        'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300': req.method === 'PUT',
                        'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300': req.method === 'DELETE',
                        'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300': !['GET', 'POST', 'PUT', 'DELETE'].includes(req.method)
                      }"
                    >
                      {{ req.method }}
                    </span>
                    <span class="font-mono text-foreground truncate">{{ req.url }}</span>
                  </div>
                </div>
                <button
                  @click="removeFromList(req.id)"
                  class="ml-2 text-destructive hover:text-destructive/80 opacity-0 group-hover:opacity-100 transition"
                >
                  <Trash2 :size="14" />
                </button>
              </div>
            </div>
          </div>
          <div v-else class="text-center text-muted-foreground py-8">
            <p class="text-sm">暂无请求</p>
            <p class="text-xs mt-1">添加请求到列表后开始测试</p>
          </div>
        </div>

        <!-- 批量配置 -->
        <div class="bg-card border border-border rounded-lg p-4">
          <h3 class="font-semibold text-foreground mb-4">批量配置</h3>
          <div class="space-y-3">
            <div>
              <label class="text-xs text-muted-foreground mb-1 block">并发数: {{ requestConfig.concurrency }}</label>
              <input
                v-model.number="requestConfig.concurrency"
                type="range"
                min="1"
                max="20"
                class="w-full"
              />
            </div>
            <div>
              <label class="text-xs text-muted-foreground mb-1 block">每个请求重复次数: {{ requestConfig.requestCount }}</label>
              <input
                v-model.number="requestConfig.requestCount"
                type="range"
                min="1"
                max="100"
                class="w-full"
              />
            </div>
            <div>
              <label class="text-xs text-muted-foreground mb-1 block">请求间隔(毫秒): {{ requestConfig.delay }}</label>
              <input
                v-model.number="requestConfig.delay"
                type="range"
                min="0"
                max="5000"
                step="100"
                class="w-full"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：执行和结果 -->
      <div class="lg:col-span-2 space-y-4">
        <!-- 执行控制 -->
        <div class="bg-card border border-border rounded-lg p-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="font-semibold text-foreground mb-1">执行控制</h3>
              <p v-if="isRunning" class="text-sm text-primary">
                正在执行... {{ completedCount }}/{{ requestList.length * requestConfig.requestCount }}
              </p>
              <p v-else class="text-sm text-muted-foreground">
                {{ requestList.length }} 个请求 × {{ requestConfig.requestCount }} 次 = {{ requestList.length * requestConfig.requestCount }} 次请求
              </p>
            </div>
            <div class="flex gap-2">
              <button
                v-if="!isRunning"
                @click="executeBulkRequests"
                :disabled="requestList.length === 0"
                class="px-6 py-3 bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground rounded-lg transition flex items-center gap-2"
              >
                <Play :size="20" />
                开始执行
              </button>
              <button
                v-else
                @click="stopExecution"
                class="px-6 py-3 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-lg transition flex items-center gap-2"
              >
                <Pause :size="20" />
                停止
              </button>
              <button
                v-if="!isRunning && results.length > 0"
                @click="reset"
                class="px-4 py-3 bg-muted hover:bg-muted/80 text-muted-foreground rounded-lg transition flex items-center gap-1"
              >
                <RotateCcw :size="20" />
                重置
              </button>
            </div>
          </div>
        </div>

        <!-- 统计概览 -->
        <div v-if="results.length > 0" class="bg-card border border-border rounded-lg p-4">
          <h3 class="font-semibold text-foreground mb-4">统计概览</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="bg-muted rounded-lg p-4 text-center">
              <div class="text-3xl font-bold text-primary">{{ stats.total }}</div>
              <div class="text-sm text-muted-foreground">总请求数</div>
            </div>
            <div class="bg-muted rounded-lg p-4 text-center">
              <div class="text-3xl font-bold text-green-600 dark:text-green-400">{{ stats.success }}</div>
              <div class="text-sm text-muted-foreground">成功</div>
            </div>
            <div class="bg-muted rounded-lg p-4 text-center">
              <div class="text-3xl font-bold text-destructive">{{ stats.failed }}</div>
              <div class="text-sm text-muted-foreground">失败</div>
            </div>
            <div class="bg-muted rounded-lg p-4 text-center">
              <div class="text-3xl font-bold text-purple-600 dark:text-purple-400">{{ successRate }}%</div>
              <div class="text-sm text-muted-foreground">成功率</div>
            </div>
          </div>
          <div class="grid grid-cols-3 gap-4 mt-4">
            <div class="bg-muted rounded-lg p-3 text-center">
              <div class="text-lg font-bold text-foreground">{{ stats.avgDuration }}ms</div>
              <div class="text-xs text-muted-foreground">平均耗时</div>
            </div>
            <div class="bg-muted rounded-lg p-3 text-center">
              <div class="text-lg font-bold text-foreground">{{ stats.minDuration }}ms</div>
              <div class="text-xs text-muted-foreground">最小耗时</div>
            </div>
            <div class="bg-muted rounded-lg p-3 text-center">
              <div class="text-lg font-bold text-foreground">{{ stats.maxDuration }}ms</div>
              <div class="text-xs text-muted-foreground">最大耗时</div>
            </div>
          </div>
        </div>

        <!-- 结果列表 -->
        <div class="bg-card border border-border rounded-lg overflow-hidden">
          <div class="px-4 py-3 border-b border-border flex items-center justify-between">
            <h3 class="text-sm font-medium text-foreground">
              请求结果
              <span v-if="results.length > 0" class="text-sm text-muted-foreground ml-2">
                ({{ results.length }} 条)
              </span>
            </h3>
            <div class="flex gap-2">
              <button
                @click="loadSample"
                class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              >
                加载示例
              </button>
              <button
                @click="exportResults"
                :disabled="results.length === 0"
                class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 disabled:bg-muted disabled:text-muted-foreground rounded text-muted-foreground flex items-center gap-1"
              >
                <Copy :size="14" />
                导出
              </button>
            </div>
          </div>

          <div v-if="results.length > 0" class="divide-y divide-border max-h-[500px] overflow-y-auto">
            <div
              v-for="result in results"
              :key="result.id"
              :class="['p-4 hover:bg-muted transition', getStatusBgColor(result)]"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-2">
                    <span
                      class="px-2 py-0.5 rounded font-bold text-xs"
                      :class="{
                        'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300': result.method === 'GET',
                        'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300': result.method === 'POST',
                        'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300': result.method === 'PUT',
                        'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300': result.method === 'DELETE',
                        'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300': !['GET', 'POST', 'PUT', 'DELETE'].includes(result.method)
                      }"
                    >
                      {{ result.method }}
                    </span>
                    <span
                      class="px-2 py-0.5 rounded text-xs font-bold"
                      :class="result.success ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-destructive text-destructive-foreground'"
                    >
                      {{ result.status }}
                    </span>
                    <span class="font-mono text-sm text-foreground truncate">{{ result.url }}</span>
                  </div>
                  <div class="flex items-center gap-3 text-xs text-muted-foreground">
                    <span class="flex items-center gap-1">
                      <Clock :size="12" />
                      {{ result.duration }}ms
                    </span>
                    <span>{{ new Date(result.timestamp).toLocaleTimeString('zh-CN') }}</span>
                  </div>
                  <div v-if="result.error" class="text-xs text-destructive mt-1">
                    {{ result.error }}
                  </div>
                </div>
                <div :class="[result.success ? 'text-green-600 dark:text-green-400' : 'text-destructive']">
                  <CheckCircle2 v-if="result.success" :size="20" />
                  <XCircle v-else :size="20" />
                </div>
              </div>
            </div>
          </div>

          <!-- 空状态 -->
          <div
            v-else
            class="p-12 text-center text-muted-foreground"
          >
            <Zap :size="48" class="mx-auto mb-3 opacity-50" />
            <p>暂无请求结果</p>
            <p class="text-sm mt-1">点击"开始执行"按钮开始测试</p>
          </div>
        </div>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="p-6 mb-12 relative">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        :title="isSeoContentVisible ? '折叠内容' : '展开内容'"
      >
        <HelpCircle v-if="!isSeoContentVisible" class="w-5 h-5" />
        <ChevronUp v-else class="w-5 h-5" />
      </button>

      <div v-show="isSeoContentVisible">
        <h2 class="text-2xl font-bold text-foreground mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          什么是批量请求？
        </h2>
        <p class="text-muted-foreground mb-4">
          批量请求是一种同时发送多个HTTP请求的技术，常用于API测试、压力测试和接口验证。
          通过批量请求工具，您可以快速测试多个接口的性能和稳定性，发现潜在的问题，
          提高开发和测试效率。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>添加请求：选择HTTP方法，输入URL，可选添加Headers和Body</li>
          <li>配置批量参数：设置并发数、重复次数、请求间隔</li>
          <li>点击"开始执行"按钮，工具将并发执行所有请求</li>
          <li>查看统计概览和详细结果，可导出为CSV文件</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          核心功能特性
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>并发请求</strong>：支持自定义并发数，同时执行多个请求</li>
          <li><strong>批量配置</strong>：可设置每个请求的重复次数和请求间隔</li>
          <li><strong>实时统计</strong>：显示成功率、平均耗时、最小/最大耗时等统计信息</li>
          <li><strong>结果导出</strong>：支持将测试结果导出为CSV文件</li>
          <li><strong>多种方法</strong>：支持GET、POST、PUT、DELETE、PATCH等HTTP方法</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          注意事项
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground">
          <li>请遵守目标API的使用条款和限制</li>
          <li>高并发请求可能被服务器限流，请谨慎使用</li>
          <li>建议先用少量请求测试，确认无误后再进行批量测试</li>
          <li>生产环境请谨慎使用，避免对正常业务造成影响</li>
        </ul>
      </div>
    </div>

    <!-- 相关推荐区 -->
    <section class="mb-12">
      <h2 class="text-2xl font-bold text-foreground mb-4">您可能还需要...</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <NuxtLink
          v-for="relatedTool in relatedTools"
          :key="relatedTool.id"
          :to="`/tools/${relatedTool.id}`"
          class="block p-4 bg-card border border-border rounded-lg hover:bg-accent transition-colors"
        >
          <div class="flex items-center gap-2 mb-2">
            <component
              :is="relatedTool.icon"
              class="w-5 h-5 text-primary"
            />
            <span class="font-medium text-foreground">{{ relatedTool.name }}</span>
          </div>
          <p class="text-sm text-muted-foreground line-clamp-2">{{ relatedTool.description }}</p>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
