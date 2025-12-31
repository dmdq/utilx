<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">Postman集合转换器</h1>
      <p class="text-gray-600 dark:text-gray-400">将Postman Collection转换为其他格式：cURL、HTTP Archive、OpenAPI</p>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
      <div class="flex flex-wrap gap-4 mb-4">
        <button
          v-for="format in formats"
          :key="format.id"
          @click="selectedFormat = format.id"
          :class="['px-4 py-2 rounded', selectedFormat === format.id ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600']"
        >
          {{ format.name }}
        </button>
      </div>

      <div class="mb-4">
        <label class="block text-sm font-medium mb-2">输入Postman Collection JSON</label>
        <textarea
          v-model="inputJSON"
          class="w-full h-48 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 resize-none font-mono text-sm"
          placeholder='粘贴Postman Collection JSON... {"info": {...}, "item": [...]}'
          @input="convert"
        ></textarea>
      </div>

      <div class="flex gap-2">
        <button @click="loadSample" class="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded">加载示例</button>
        <button @click="clearAll" class="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded">清空</button>
      </div>
    </div>

    <!-- 转换结果 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold">{{ formats.find(f => f.id === selectedFormat)?.name }}结果</h2>
        <div class="flex gap-2">
          <button @click="copyResult" class="px-3 py-1 text-sm bg-green-500 text-white rounded" :disabled="!outputResult">复制</button>
          <button v-if="selectedFormat === 'openapi'" @click="downloadResult" class="px-3 py-1 text-sm bg-blue-500 text-white rounded" :disabled="!outputResult">下载</button>
        </div>
      </div>
      <textarea
        v-model="outputResult"
        class="w-full h-96 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 resize-none font-mono text-sm"
        readonly
      ></textarea>
    </div>

    <!-- 请求列表 -->
    <div v-if="requests.length > 0" class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">检测到的请求 ({{ requests.length }})</h2>
      <div class="space-y-2 max-h-64 overflow-y-auto">
        <div v-for="(req, index) in requests" :key="index" class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded">
          <span class="px-2 py-1 text-xs font-medium rounded" :class="getMethodColor(req.method)">{{ req.method }}</span>
          <span class="flex-1 font-mono text-sm truncate">{{ req.name || req.url }}</span>
          <span class="text-xs text-gray-500 truncate max-w-xs">{{ req.url }}</span>
        </div>
      </div>
    </div>

    <!-- 格式说明 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">格式说明</h2>
      <div class="grid md:grid-cols-2 gap-6 text-sm text-gray-600 dark:text-gray-400">
        <div>
          <h3 class="font-medium mb-2 text-gray-800 dark:text-gray-200">cURL</h3>
          <p>生成可在终端直接执行的cURL命令，用于快速测试API。</p>
        </div>
        <div>
          <h3 class="font-medium mb-2 text-gray-800 dark:text-gray-200">HTTP Archive (HAR)</h3>
          <p>浏览器网络请求的标准格式，可用于性能分析和测试。</p>
        </div>
        <div>
          <h3 class="font-medium mb-2 text-gray-800 dark:text-gray-200">OpenAPI/Swagger</h3>
          <p>生成OpenAPI 3.0规范文档，可用于API文档生成和SDK生成。</p>
        </div>
        <div>
          <h3 class="font-medium mb-2 text-gray-800 dark:text-gray-200">Markdown</h3>
          <p>生成可读的API文档，便于团队分享和存档。</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

useHead({
  title: 'Postman集合转换器 - Postman导出cURL/OpenAPI',
  meta: [{ name: 'description', content: '在线Postman Collection转换工具，支持转换为cURL命令、HAR格式、OpenAPI规范和Markdown文档。' }],
  keywords: ['Postman转换', 'Postman导出', 'cURL生成', 'OpenAPI生成', 'API文档']
})

const inputJSON = ref('')
const outputResult = ref('')
const selectedFormat = ref('curl')
const requests = ref<any[]>([])

const formats = [
  { id: 'curl', name: 'cURL命令' },
  { id: 'har', name: 'HAR格式' },
  { id: 'openapi', name: 'OpenAPI 3.0' },
  { id: 'markdown', name: 'Markdown文档' }
]

function loadSample() {
  inputJSON.value = JSON.stringify({
    info: { name: 'Sample API', schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json' },
    item: [
      {
        name: 'Get User',
        request: {
          method: 'GET',
          url: { raw: 'https://api.example.com/users/123', host: ['api', 'example', 'com'], path: ['users', '123'] },
          header: [{ key: 'Authorization', value: 'Bearer token123' }]
        }
      },
      {
        name: 'Create User',
        request: {
          method: 'POST',
          url: { raw: 'https://api.example.com/users', host: ['api', 'example', 'com'], path: ['users'] },
          header: [{ key: 'Content-Type', value: 'application/json' }],
          body: { mode: 'raw', raw: '{"name":"John","email":"john@example.com"}' }
        }
      }
    ]
  }, null, 2)
  convert()
}

function clearAll() {
  inputJSON.value = ''
  outputResult.value = ''
  requests.value = []
}

function convert() {
  if (!inputJSON.value) {
    outputResult.value = ''
    requests.value = []
    return
  }

  try {
    const collection = JSON.parse(inputJSON.value)
    const items = collection.item || []

    // 提取请求
    requests.value = extractRequests(items)

    // 根据格式转换
    switch (selectedFormat.value) {
      case 'curl':
        outputResult.value = convertToCurl(requests.value)
        break
      case 'har':
        outputResult.value = convertToHAR(collection, requests.value)
        break
      case 'openapi':
        outputResult.value = convertToOpenAPI(collection, requests.value)
        break
      case 'markdown':
        outputResult.value = convertToMarkdown(requests.value)
        break
    }
  } catch (e) {
    outputResult.value = '错误: 无效的JSON格式\n' + (e as Error).message
  }
}

function extractRequests(items: any[], prefix = ''): any[] {
  const requests: any[] = []

  for (const item of items) {
    if (item.item) {
      // 文件夹
      requests.push(...extractRequests(item.item, prefix + item.name + '/'))
    } else if (item.request) {
      const req = item.request
      requests.push({
        name: prefix + item.name,
        method: req.method,
        url: typeof req.url === 'string' ? req.url : req.url?.raw || '',
        headers: req.header || [],
        body: req.body?.raw || ''
      })
    }
  }

  return requests
}

function convertToCurl(requests: any[]): string {
  return requests.map(req => {
    let curl = `# ${req.name}\n`
    curl += `curl -X ${req.method}`

    // 添加headers
    if (req.headers) {
      for (const header of req.headers) {
        if (header.key && header.value) {
          curl += ` \\\n  -H "${header.key}: ${header.value}"`
        }
      }
    }

    // 添加body
    if (req.body) {
      curl += ` \\\n  -d '${req.body}'`
    }

    curl += ` \\\n  "${req.url}"`

    return curl
  }).join('\n\n')
}

function convertToHAR(collection: any, requests: any[]): string {
  return JSON.stringify({
    log: {
      version: '1.2',
      creator: { name: 'Postman Converter', version: '1.0' },
      entries: requests.map(req => ({
        request: {
          method: req.method,
          url: req.url,
          headers: req.headers.map((h: any) => ({ name: h.key, value: h.value })),
          postData: req.body ? { text: req.body, mimeType: 'application/json' } : undefined
        }
      }))
    }
  }, null, 2)
}

function convertToOpenAPI(collection: any, requests: any[]): string {
  const paths: any = {}

  for (const req of requests) {
    const urlPath = req.url.replace(/^https?:\/\/[^\/]+/, '')
    const method = (req.method || 'GET').toLowerCase()

    if (!paths[urlPath]) paths[urlPath] = {}
    paths[urlPath][method] = {
      summary: req.name,
      responses: {
        '200': { description: 'Success' }
      }
    }

    if (req.body) {
      paths[urlPath][method].requestBody = {
        content: {
          'application/json': {
            schema: { type: 'object' }
          }
        }
      }
    }
  }

  return JSON.stringify({
    openapi: '3.0.0',
    info: {
      title: collection.info?.name || 'API',
      version: '1.0.0'
    },
    paths
  }, null, 2)
}

function convertToMarkdown(requests: any[]): string {
  let md = `# API 文档\n\n`

  for (const req of requests) {
    md += `## ${req.name}\n\n`
    md += `**${req.method}** \`${req.url}\`\n\n`

    if (req.headers && req.headers.length > 0) {
      md += `### 请求头\n\n`
      for (const header of req.headers) {
        md += `- ${header.key}: ${header.value}\n`
      }
      md += '\n'
    }

    if (req.body) {
      md += `### 请求体\n\n`
      md += '```json\n' + req.body + '\n```\n\n'
    }

    md += '---\n\n'
  }

  return md
}

function getMethodColor(method: string): string {
  const colors: Record<string, string> = {
    GET: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    POST: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    PUT: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    PATCH: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
  }
  return colors[method] || 'bg-gray-100 text-gray-700'
}

async function copyResult() {
  try {
    await navigator.clipboard.writeText(outputResult.value)
    alert('已复制')
  } catch {}
}

function downloadResult() {
  const blob = new Blob([outputResult.value], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'openapi.json'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
</script>
