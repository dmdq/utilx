<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">OpenAPI规范生成器</h1>
      <p class="text-gray-600 dark:text-gray-400">生成OpenAPI 3.0规范文档，支持导出JSON/YAML格式</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6 mb-6">
      <!-- API信息配置 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">API信息</h2>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">API标题</label>
            <input v-model="apiInfo.title" @input="generateSpec" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm" placeholder="My API">
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">版本</label>
            <input v-model="apiInfo.version" @input="generateSpec" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm" placeholder="1.0.0">
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">描述</label>
            <textarea v-model="apiInfo.description" @input="generateSpec" rows="2" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm" placeholder="API描述..."></textarea>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-sm font-medium mb-1">服务器URL</label>
              <input v-model="apiInfo.server" @input="generateSpec" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm" placeholder="https://api.example.com">
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">基础路径</label>
              <input v-model="apiInfo.basePath" @input="generateSpec" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm" placeholder="/v1">
            </div>
          </div>
        </div>
      </div>

      <!-- 端点配置 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">API端点</h2>
          <button @click="addEndpoint" class="px-3 py-1 text-sm bg-green-500 text-white rounded">+ 添加</button>
        </div>

        <div class="space-y-3 max-h-80 overflow-y-auto">
          <div v-for="(endpoint, index) in endpoints" :key="index" class="p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <div class="grid grid-cols-12 gap-2 mb-2">
              <select v-model="endpoint.method" @input="generateSpec" class="col-span-3 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm">
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="PATCH">PATCH</option>
              </select>
              <input v-model="endpoint.path" @input="generateSpec" class="col-span-7 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm" placeholder="/users">
              <button @click="removeEndpoint(index)" class="col-span-2 text-red-500 hover:text-red-700">×</button>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <input v-model="endpoint.summary" @input="generateSpec" class="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-xs" placeholder="摘要">
              <input v-model="endpoint.description" @input="generateSpec" class="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-xs" placeholder="描述">
            </div>
          </div>
        </div>

        <div v-if="endpoints.length === 0" class="text-center py-8 text-gray-400 text-sm">
          点击"添加"按钮创建API端点
        </div>
      </div>
    </div>

    <!-- 快捷模板 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">快捷模板</h2>
      <div class="flex flex-wrap gap-2">
        <button @click="loadTemplate('crud')" class="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded">CRUD API</button>
        <button @click="loadTemplate('rest')" class="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-600 rounded">RESTful API</button>
        <button @click="loadTemplate('auth')" class="px-4 py-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded">认证API</button>
      </div>
    </div>

    <!-- 生成结果 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold">OpenAPI规范</h2>
        <div class="flex gap-2">
          <button @click="outputFormat = 'json'" :class="['px-3 py-1 text-sm rounded', outputFormat === 'json' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600']">JSON</button>
          <button @click="outputFormat = 'yaml'" :class="['px-3 py-1 text-sm rounded', outputFormat === 'yaml' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600']">YAML</button>
          <button @click="copySpec" class="px-3 py-1 text-sm bg-green-500 text-white rounded" :disabled="!generatedSpec">复制</button>
          <button @click="downloadSpec" class="px-3 py-1 text-sm bg-blue-500 text-white rounded" :disabled="!generatedSpec">下载</button>
        </div>
      </div>
      <textarea
        :value="generatedSpec"
        class="w-full h-80 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 resize-none font-mono text-sm"
        readonly
      ></textarea>
    </div>

    <!-- OpenAPI说明 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">OpenAPI规范说明</h2>
      <div class="grid md:grid-cols-3 gap-4 text-sm">
        <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded">
          <h3 class="font-medium mb-2 text-blue-700 dark:text-blue-400">Info</h3>
          <p class="text-gray-600 dark:text-gray-400">API的元数据信息，包括标题、版本、描述、联系人等。</p>
        </div>
        <div class="p-4 bg-green-50 dark:bg-green-900/20 rounded">
          <h3 class="font-medium mb-2 text-green-700 dark:text-green-400">Paths</h3>
          <p class="text-gray-600 dark:text-gray-400">定义API端点和操作，每个路径可以包含多个HTTP方法。</p>
        </div>
        <div class="p-4 bg-orange-50 dark:bg-orange-900/20 rounded">
          <h3 class="font-medium mb-2 text-orange-700 dark:text-orange-400">Components</h3>
          <p class="text-gray-600 dark:text-gray-400">可重用的数据模型、安全方案、参数等定义。</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

useHead({
  title: 'OpenAPI规范生成器 - 在线Swagger文档生成',
  meta: [{ name: 'description', content: '在线OpenAPI 3.0规范生成工具，可视化创建API文档，支持JSON和YAML格式导出。' }],
  keywords: ['OpenAPI', 'Swagger', 'API文档', 'OpenAPI 3.0', 'REST API']
})

interface Endpoint {
  method: string
  path: string
  summary: string
  description: string
}

const apiInfo = ref({
  title: 'My API',
  version: '1.0.0',
  description: 'API Description',
  server: 'https://api.example.com',
  basePath: '/v1'
})

const endpoints = ref<Endpoint[]>([
  { method: 'GET', path: '/users', summary: 'List users', description: 'Get all users' },
  { method: 'POST', path: '/users', summary: 'Create user', description: 'Create a new user' },
  { method: 'GET', path: '/users/{id}', summary: 'Get user', description: 'Get user by ID' }
])

const outputFormat = ref<'json' | 'yaml'>('json')

const generatedSpec = computed(() => {
  const spec = {
    openapi: '3.0.0',
    info: {
      title: apiInfo.value.title,
      version: apiInfo.value.version,
      description: apiInfo.value.description
    },
    servers: apiInfo.value.server ? [{ url: apiInfo.value.server + apiInfo.value.basePath }] : [],
    paths: {} as any
  }

  // 生成路径
  for (const endpoint of endpoints.value) {
    if (!spec.paths[endpoint.path]) {
      spec.paths[endpoint.path] = {}
    }

    spec.paths[endpoint.path][endpoint.method.toLowerCase()] = {
      summary: endpoint.summary,
      description: endpoint.description,
      responses: {
        '200': {
          description: 'Success'
        }
      }
    }
  }

  if (outputFormat.value === 'json') {
    return JSON.stringify(spec, null, 2)
  } else {
    return jsonToYaml(spec)
  }
})

function generateSpec() {
  // 触发computed重新计算
}

function addEndpoint() {
  endpoints.value.push({ method: 'GET', path: '', summary: '', description: '' })
}

function removeEndpoint(index: number) {
  endpoints.value.splice(index, 1)
}

function loadTemplate(type: string) {
  switch (type) {
    case 'crud':
      apiInfo.value = { ...apiInfo, title: 'User Management API', basePath: '/api/v1' }
      endpoints.value = [
        { method: 'GET', path: '/users', summary: 'List all users', description: 'Returns a list of users' },
        { method: 'POST', path: '/users', summary: 'Create user', description: 'Creates a new user' },
        { method: 'GET', path: '/users/{id}', summary: 'Get user', description: 'Returns a single user' },
        { method: 'PUT', path: '/users/{id}', summary: 'Update user', description: 'Updates an existing user' },
        { method: 'DELETE', path: '/users/{id}', summary: 'Delete user', description: 'Deletes a user' }
      ]
      break
    case 'rest':
      apiInfo.value = { ...apiInfo, title: 'REST API', basePath: '/api' }
      endpoints.value = [
        { method: 'GET', path: '/items', summary: 'List items', description: 'List all items' },
        { method: 'POST', path: '/items', summary: 'Create item', description: 'Create a new item' },
        { method: 'GET', path: '/items/{id}', summary: 'Get item', description: 'Get item by ID' },
        { method: 'PATCH', path: '/items/{id}', summary: 'Update item', description: 'Partially update an item' },
        { method: 'DELETE', path: '/items/{id}', summary: 'Delete item', description: 'Delete an item' }
      ]
      break
    case 'auth':
      apiInfo.value = { ...apiInfo, title: 'Authentication API', basePath: '/auth' }
      endpoints.value = [
        { method: 'POST', path: '/register', summary: 'Register', description: 'Register a new user' },
        { method: 'POST', path: '/login', summary: 'Login', description: 'Authenticate user' },
        { method: 'POST', path: '/logout', summary: 'Logout', description: 'Logout user' },
        { method: 'POST', path: '/refresh', summary: 'Refresh token', description: 'Refresh access token' }
      ]
      break
  }
}

function jsonToYaml(obj: any, indent = 0): string {
  const spaces = '  '.repeat(indent)
  let result = ''

  for (const [key, value] of Object.entries(obj)) {
    if (value === null) {
      result += `${spaces}${key}: null\n`
    } else if (typeof value === 'object') {
      result += `${spaces}${key}:\n`
      result += jsonToYaml(value, indent + 1)
    } else if (typeof value === 'string') {
      result += `${spaces}${key}: "${value}"\n`
    } else {
      result += `${spaces}${key}: ${value}\n`
    }
  }

  return result
}

async function copySpec() {
  try {
    await navigator.clipboard.writeText(generatedSpec.value)
    alert('已复制')
  } catch {}
}

function downloadSpec() {
  const blob = new Blob([generatedSpec.value], { type: outputFormat.value === 'json' ? 'application/json' : 'text/yaml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `openapi${outputFormat.value === 'json' ? '.json' : '.yaml'}`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

onMounted(() => {
  generateSpec()
})
</script>
