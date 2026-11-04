<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" /> -->

    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">API 文档生成器</h1>
      <p class="text-muted-foreground">根据 API 描述自动生成格式化的 API 文档，支持多种输出格式</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：输入区域 -->
      <div class="space-y-4">
        <!-- 输入方式选择 -->
        <div class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">输入方式</h2>
          <div class="flex gap-2 mb-4">
            <button
              v-for="mode in inputModes"
              :key="mode.value"
              @click="inputMode = mode.value"
              :class="[
                'px-4 py-2 rounded-md transition-colors text-sm',
                inputMode === mode.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              ]"
            >
              {{ mode.name }}
            </button>
          </div>

          <!-- 基本信息输入 -->
          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium">API 名称</label>
              <input
                v-model="apiInfo.name"
                type="text"
                placeholder="例如：用户管理 API"
                class="mt-2 w-full px-3 py-2 border border-border rounded-md text-sm"
              />
            </div>
            <div>
              <label class="text-sm font-medium">API 版本</label>
              <input
                v-model="apiInfo.version"
                type="text"
                placeholder="例如：v1.0.0"
                class="mt-2 w-full px-3 py-2 border border-border rounded-md text-sm"
              />
            </div>
            <div>
              <label class="text-sm font-medium">Base URL</label>
              <input
                v-model="apiInfo.baseUrl"
                type="text"
                placeholder="例如：https://api.example.com"
                class="mt-2 w-full px-3 py-2 border border-border rounded-md text-sm"
              />
            </div>
          </div>
        </div>

        <!-- API 端点配置 -->
        <div class="bg-card   rounded-lg p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-semibold">API 端点</h2>
            <button
              @click="addEndpoint"
              class="px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors"
            >
              添加端点
            </button>
          </div>

          <div class="space-y-4">
            <div
              v-for="(endpoint, index) in endpoints"
              :key="index"
              class="p-4 border rounded-lg space-y-3"
            >
              <div class="flex justify-between items-center">
                <span class="text-sm font-medium">端点 {{ index + 1 }}</span>
                <button
                  @click="removeEndpoint(index)"
                  class="text-red-500 hover:text-red-700 transition-colors"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="text-xs text-muted-foreground">请求方法</label>
                  <select v-model="endpoint.method" class="mt-1 w-full px-2 py-1 border border-border rounded text-sm">
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                    <option value="PATCH">PATCH</option>
                  </select>
                </div>
                <div>
                  <label class="text-xs text-muted-foreground">路径</label>
                  <input
                    v-model="endpoint.path"
                    type="text"
                    placeholder="/users/{id}"
                    class="mt-1 w-full px-2 py-1 border border-border rounded text-sm"
                  />
                </div>
              </div>

              <div>
                <label class="text-xs text-muted-foreground">描述</label>
                <input
                  v-model="endpoint.description"
                  type="text"
                  placeholder="获取用户信息"
                  class="mt-1 w-full px-2 py-1 border border-border rounded text-sm"
                />
              </div>

              <!-- 参数配置 -->
              <div>
                <label class="text-xs text-muted-foreground">参数</label>
                <div class="mt-2 space-y-2">
                  <div
                    v-for="(param, pIndex) in endpoint.parameters"
                    :key="pIndex"
                    class="flex gap-2 items-center"
                  >
                    <input
                      v-model="param.name"
                      type="text"
                      placeholder="参数名"
                      class="flex-1 px-2 py-1 border border-border rounded text-sm"
                    />
                    <select v-model="param.type" class="px-2 py-1 border border-border rounded text-sm">
                      <option value="string">string</option>
                      <option value="number">number</option>
                      <option value="boolean">boolean</option>
                      <option value="object">object</option>
                    </select>
                    <select v-model="param.location" class="px-2 py-1 border border-border rounded text-sm">
                      <option value="path">Path</option>
                      <option value="query">Query</option>
                      <option value="body">Body</option>
                    </select>
                    <button
                      @click="removeParameter(index, pIndex)"
                      class="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <X class="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    @click="addParameter(index)"
                    class="text-sm text-primary hover:text-primary/80 transition-colors"
                  >
                    + 添加参数
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：预览和导出 -->
      <div class="space-y-4">
        <!-- 输出格式选择 -->
        <div class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">输出格式</h2>
          <div class="grid grid-cols-2 gap-3">
            <button
              v-for="format in outputFormats"
              :key="format.value"
              @click="outputFormat = format.value"
              :class="[
                'px-4 py-3 rounded-md transition-colors text-left',
                outputFormat === format.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              ]"
            >
              <div class="font-medium">{{ format.name }}</div>
              <div class="text-xs opacity-80">{{ format.description }}</div>
            </button>
          </div>
        </div>

        <!-- 文档预览 -->
        <div class="bg-card   rounded-lg p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-semibold">文档预览</h2>
            <div class="flex gap-2">
              <button
                @click="copyDocumentation"
                class="px-3 py-1 text-sm border border-primary text-primary rounded-md hover:bg-primary/5 transition-colors"
              >
                {{ copied ? '已复制' : '复制' }}
              </button>
              <button
                @click="downloadDocumentation"
                class="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                下载
              </button>
            </div>
          </div>

          <div class="border rounded-lg p-4 bg-muted/30 min-h-[400px] max-h-[600px] overflow-auto">
            <pre v-if="generatedDoc" class="text-sm whitespace-pre-wrap">{{ generatedDoc }}</pre>
            <div v-else class="text-center text-muted-foreground py-8">
              请配置 API 信息后生成文档
            </div>
          </div>
        </div>

        <!-- 快速模板 -->
        <div class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">快速模板</h2>
          <div class="grid grid-cols-2 gap-3">
            <button
              v-for="template in templates"
              :key="template.name"
              @click="applyTemplate(template)"
              class="p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors text-left"
            >
              <div class="font-medium text-sm">{{ template.name }}</div>
              <div class="text-xs text-muted-foreground">{{ template.description }}</div>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 使用说明 -->
    <div class="mt-12 space-y-6">
      <div class="bg-card   rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
          <Info class="w-5 h-5 text-primary" />
          使用说明
        </h3>
        <div class="space-y-4 text-sm text-muted-foreground">
          <div>
            <h4 class="font-medium text-foreground mb-2">1. 配置基本信息</h4>
            <p>填写 API 名称、版本和 Base URL 等基本信息。</p>
          </div>
          <div>
            <h4 class="font-medium text-foreground mb-2">2. 添加 API 端点</h4>
            <p>点击"添加端点"按钮，配置每个端点的请求方法、路径、参数等信息。</p>
          </div>
          <div>
            <h4 class="font-medium text-foreground mb-2">3. 选择输出格式</h4>
            <p>支持 Markdown、HTML、PDF 等多种文档格式。</p>
          </div>
          <div>
            <h4 class="font-medium text-foreground mb-2">4. 生成和导出</h4>
            <p>实时预览生成的文档，支持复制或下载导出。</p>
          </div>
        </div>
      </div>

      <!-- 相关工具 -->
      <div class="bg-card   rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">相关工具</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NuxtLink
            to="/tools/swagger-viewer"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <FileText class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">Swagger 查看器</p>
              <p class="text-xs text-muted-foreground">查看和测试 API 文档</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
          <NuxtLink
            to="/tools/http-client"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Globe class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">HTTP 客户端</p>
              <p class="text-xs text-muted-foreground">测试 API 请求</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
          <NuxtLink
            to="/tools/json-formatter"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Code class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">JSON 格式化</p>
              <p class="text-xs text-muted-foreground">格式化 JSON 数据</p>
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
import { Info, Trash2, X, FileText, Globe, Code, ArrowRight } from 'lucide-vue-next'
import Breadcrumb from '~/components/Breadcrumb.vue'

// 分类信息
const category = { id: 'dev', name: '开发辅助', description: '开发辅助工具集合' }

// 状态管理
const inputMode = ref('manual')
const outputFormat = ref('markdown')
const copied = ref(false)

// API 基本信息
const apiInfo = ref({
  name: '',
  version: 'v1.0.0',
  baseUrl: '',
  description: ''
})

// API 端点列表
const endpoints = ref([])

// 输入模式
const inputModes = [
  { value: 'manual', name: '手动配置' },
  { value: 'swagger', name: '导入 Swagger' },
  { value: 'postman', name: '导入 Postman' }
]

// 输出格式
const outputFormats = [
  { value: 'markdown', name: 'Markdown', description: '适用于文档编写' },
  { value: 'html', name: 'HTML', description: '适用于网页展示' },
  { value: 'pdf', name: 'PDF', description: '适用于打印分享' },
  { value: 'openapi', name: 'OpenAPI', description: '标准 API 规范' }
]

// 快速模板
const templates = [
  {
    name: 'REST API',
    description: '标准 RESTful API',
    data: {
      name: '示例 API',
      version: 'v1.0.0',
      baseUrl: 'https://api.example.com',
      endpoints: [
        {
          method: 'GET',
          path: '/users',
          description: '获取用户列表',
          parameters: []
        },
        {
          method: 'POST',
          path: '/users',
          description: '创建新用户',
          parameters: [
            { name: 'name', type: 'string', location: 'body' },
            { name: 'email', type: 'string', location: 'body' }
          ]
        }
      ]
    }
  },
  {
    name: '博客 API',
    description: '博客系统 API',
    data: {
      name: '博客 API',
      version: 'v1.0.0',
      baseUrl: 'https://blog-api.example.com',
      endpoints: [
        {
          method: 'GET',
          path: '/posts',
          description: '获取文章列表',
          parameters: [
            { name: 'page', type: 'number', location: 'query' },
            { name: 'limit', type: 'number', location: 'query' }
          ]
        },
        {
          method: 'GET',
          path: '/posts/{id}',
          description: '获取文章详情',
          parameters: [
            { name: 'id', type: 'string', location: 'path' }
          ]
        }
      ]
    }
  }
]

// 生成文档
const generatedDoc = computed(() => {
  if (!apiInfo.value.name || endpoints.value.length === 0) return ''

  switch (outputFormat.value) {
    case 'markdown':
      return generateMarkdown()
    case 'html':
      return generateHTML()
    case 'openapi':
      return generateOpenAPI()
    default:
      return generateMarkdown()
  }
})

// 生成 Markdown 文档
const generateMarkdown = () => {
  let doc = `# ${apiInfo.value.name} API 文档\n\n`
  doc += `**版本：** ${apiInfo.value.version}\n\n`
  doc += `**Base URL：** \`${apiInfo.value.baseUrl}\`\n\n`

  if (apiInfo.value.description) {
    doc += `## 简介\n\n${apiInfo.value.description}\n\n`
  }

  doc += `## API 端点\n\n`

  endpoints.value.forEach((endpoint, index) => {
    doc += `### ${endpoint.method} ${endpoint.path}\n\n`

    if (endpoint.description) {
      doc += `${endpoint.description}\n\n`
    }

    if (endpoint.parameters && endpoint.parameters.length > 0) {
      doc += `#### 参数\n\n`
      doc += `| 参数名 | 类型 | 位置 | 必填 | 说明 |\n`
      doc += `|--------|------|------|------|------|\n`

      endpoint.parameters.forEach(param => {
        doc += `| ${param.name} | ${param.type} | ${param.location} | 是 | - |\n`
      })

      doc += `\n`
    }

    doc += `#### 请求示例\n\n`
    doc += `\`\`\`bash\n`

    if (endpoint.method === 'GET') {
      let url = `${apiInfo.value.baseUrl}${endpoint.path}`
      const queryParams = endpoint.parameters?.filter(p => p.location === 'query')
      if (queryParams && queryParams.length > 0) {
        url += '?' + queryParams.map(p => `${p.name}=xxx`).join('&')
      }
      doc += `curl -X GET "${url}"\n`
    } else if (endpoint.method === 'POST') {
      doc += `curl -X POST "${apiInfo.value.baseUrl}${endpoint.path}" \\\n`
      doc += `  -H "Content-Type: application/json" \\\n`
      const bodyParams = endpoint.parameters?.filter(p => p.location === 'body')
      if (bodyParams && bodyParams.length > 0) {
        const body = bodyParams.reduce((obj, param) => {
          obj[param.name] = `xxx`
          return obj
        }, {})
        doc += `  -d '${JSON.stringify(body, null, 2)}'\n`
      }
    }

    doc += `\`\`\`\n\n`

    doc += `#### 响应示例\n\n`
    doc += `\`\`\`json\n`
    doc += `{\n`
    doc += `  "code": 200,\n`
    doc += `  "message": "success",\n`
    doc += `  "data": {}\n`
    doc += `}\n`
    doc += `\`\`\`\n\n`
  })

  return doc
}

// 生成 HTML 文档
const generateHTML = () => {
  let html = `<!DOCTYPE html>
<html>
<head>
  <title>${apiInfo.value.name} API 文档</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; }
    h2 { color: #666; border-bottom: 1px solid #eee; padding-bottom: 10px; }
    .endpoint { margin: 20px 0; padding: 15px; background: #f9f9f9; border-radius: 5px; }
    .method { display: inline-block; padding: 3px 8px; border-radius: 3px; color: white; font-size: 12px; }
    .get { background: #61affe; }
    .post { background: #49cc90; }
    .put { background: #fca130; }
    .delete { background: #f93e3e; }
    code { background: #f0f0f0; padding: 2px 5px; border-radius: 3px; }
    pre { background: #f0f0f0; padding: 10px; border-radius: 5px; overflow-x: auto; }
  </style>
</head>
<body>
  <h1>${apiInfo.value.name} API 文档</h1>
  <p><strong>版本：</strong>${apiInfo.value.version}</p>
  <p><strong>Base URL：</strong><code>${apiInfo.value.baseUrl}</code></p>

  <h2>API 端点</h2>`

  endpoints.value.forEach(endpoint => {
    const methodClass = endpoint.method.toLowerCase()
    html += `
  <div class="endpoint">
    <h3><span class="method ${methodClass}">${endpoint.method}</span> ${endpoint.path}</h3>
    <p>${endpoint.description || ''}</p>`

    if (endpoint.parameters && endpoint.parameters.length > 0) {
      html += `
    <h4>参数</h4>
    <table>
      <tr><th>参数名</th><th>类型</th><th>位置</th><th>必填</th></tr>`
      endpoint.parameters.forEach(param => {
        html += `
      <tr>
        <td>${param.name}</td>
        <td>${param.type}</td>
        <td>${param.location}</td>
        <td>是</td>
      </tr>`
      })
      html += `
    </table>`
    }

    html += `
  </div>`
  })

  html += `
</body>
</html>`

  return html
}

// 生成 OpenAPI 规范
const generateOpenAPI = () => {
  const openapi = {
    openapi: '3.0.0',
    info: {
      title: apiInfo.value.name,
      version: apiInfo.value.version,
      description: apiInfo.value.description
    },
    servers: [
      {
        url: apiInfo.value.baseUrl
      }
    ],
    paths: {}
  }

  endpoints.value.forEach(endpoint => {
    const pathItem = {
      [endpoint.method.toLowerCase()]: {
        summary: endpoint.description,
        parameters: []
      }
    }

    if (endpoint.parameters) {
      endpoint.parameters.forEach(param => {
        if (param.location === 'path') {
          pathItem[endpoint.method.toLowerCase()].parameters.push({
            name: param.name,
            in: 'path',
            required: true,
            schema: { type: param.type }
          })
        } else if (param.location === 'query') {
          pathItem[endpoint.method.toLowerCase()].parameters.push({
            name: param.name,
            in: 'query',
            schema: { type: param.type }
          })
        }
      })
    }

    openapi.paths[endpoint.path] = pathItem
  })

  return JSON.stringify(openapi, null, 2)
}

// 添加端点
const addEndpoint = () => {
  endpoints.value.push({
    method: 'GET',
    path: '',
    description: '',
    parameters: []
  })
}

// 移除端点
const removeEndpoint = (index) => {
  endpoints.value.splice(index, 1)
}

// 添加参数
const addParameter = (endpointIndex) => {
  endpoints.value[endpointIndex].parameters.push({
    name: '',
    type: 'string',
    location: 'query'
  })
}

// 移除参数
const removeParameter = (endpointIndex, paramIndex) => {
  endpoints.value[endpointIndex].parameters.splice(paramIndex, 1)
}

// 应用模板
const applyTemplate = (template) => {
  apiInfo.value = { ...template.data }
  endpoints.value = [...template.data.endpoints]
}

// 复制文档
const copyDocumentation = async () => {
  try {
    await navigator.clipboard.writeText(generatedDoc.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (error) {
    console.error('复制失败', error)
  }
}

// 下载文档
const downloadDocumentation = () => {
  const content = generatedDoc.value
  let filename = `${apiInfo.value.name || 'api'}-doc`
  let mimeType = 'text/plain'

  switch (outputFormat.value) {
    case 'markdown':
      filename += '.md'
      mimeType = 'text/markdown'
      break
    case 'html':
      filename += '.html'
      mimeType = 'text/html'
      break
    case 'openapi':
      filename += '.json'
      mimeType = 'application/json'
      break
    default:
      filename += '.txt'
  }

  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// SEO配置
useSeoMeta({
  title: 'API 文档生成器 - 在线 API 文档生成工具',
  description: '免费的在线 API 文档生成工具，根据 API 描述自动生成格式化的文档，支持 Markdown、HTML、PDF 等多种输出格式。',
  keywords: ['api', '文档生成', 'openapi', 'swagger', 'rest api', '文档工具']
})


</script>