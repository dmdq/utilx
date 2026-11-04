<template>
  <div class="max-w-7xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" /> -->

    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">Swagger 查看器</h1>
      <p class="text-muted-foreground">在线查看和测试 Swagger/OpenAPI 文档，支持 API 调试和接口测试</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 左侧：文档输入 -->
      <div class="lg:col-span-1 space-y-4">
        <!-- 输入方式选择 -->
        <div class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">文档来源</h2>
          <div class="space-y-3">
            <button
              @click="inputMode = 'url'"
              :class="[
                'w-full px-4 py-3 rounded-md transition-colors text-left',
                inputMode === 'url'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              ]"
            >
              <div class="font-medium">URL 导入</div>
              <div class="text-xs opacity-80">从 URL 加载 Swagger 文档</div>
            </button>
            <button
              @click="inputMode = 'json'"
              :class="[
                'w-full px-4 py-3 rounded-md transition-colors text-left',
                inputMode === 'json'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              ]"
            >
              <div class="font-medium">JSON 输入</div>
              <div class="text-xs opacity-80">直接输入 JSON/YAML 内容</div>
            </button>
            <button
              @click="loadExample"
              class="w-full px-4 py-3 bg-muted rounded-md hover:bg-muted/80 transition-colors text-left"
            >
              <div class="font-medium">加载示例</div>
              <div class="text-xs opacity-80">查看示例 API 文档</div>
            </button>
          </div>
        </div>

        <!-- URL 输入 -->
        <div v-if="inputMode === 'url'" class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">Swagger URL</h2>
          <div class="space-y-3">
            <input
              v-model="swaggerUrl"
              type="url"
              placeholder="https://api.example.com/swagger.json"
              class="w-full px-3 py-2 border border-border rounded-md text-sm"
            />
            <button
              @click="loadFromUrl"
              :disabled="!swaggerUrl || loading"
              class="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ loading ? '加载中...' : '加载文档' }}
            </button>
          </div>
        </div>

        <!-- JSON/YAML 输入 -->
        <div v-if="inputMode === 'json'" class="bg-card   rounded-lg p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-semibold">文档内容</h2>
            <div class="flex gap-2">
              <button
                @click="formatDocument"
                class="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                格式化
              </button>
              <button
                @click="clearDocument"
                class="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                清空
              </button>
            </div>
          </div>
          <textarea
            v-model="documentContent"
            placeholder="粘贴 JSON/YAML 格式的 Swagger 文档..."
            class="w-full h-64 px-3 py-2 border border-border rounded-md font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          ></textarea>
          <button
            @click="parseDocument"
            :disabled="!documentContent"
            class="w-full mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            解析文档
          </button>
        </div>
      </div>

      <!-- 右侧：API 文档展示 -->
      <div class="lg:col-span-2 space-y-4">
        <!-- API 信息概览 -->
        <div v-if="swaggerDoc" class="bg-card   rounded-lg p-6">
          <div class="flex items-start justify-between mb-4">
            <div>
              <h2 class="text-2xl font-bold mb-2">{{ swaggerDoc.info?.title || 'API Documentation' }}</h2>
              <p class="text-muted-foreground mb-2">{{ swaggerDoc.info?.description }}</p>
              <div class="flex gap-4 text-sm text-muted-foreground">
                <span>版本：{{ swaggerDoc.info?.version }}</span>
                <span v-if="swaggerDoc.info?.contact">联系：{{ swaggerDoc.info.contact.email || swaggerDoc.info.contact.name }}</span>
              </div>
            </div>
            <div v-if="swaggerDoc.servers && swaggerDoc.servers.length > 0" class="text-right">
              <div class="text-sm text-muted-foreground mb-1">服务器地址</div>
              <div class="font-mono text-sm">{{ swaggerDoc.servers[0].url }}</div>
            </div>
          </div>

          <!-- 认证信息 -->
          <div v-if="swaggerDoc.components?.securitySchemes" class="mt-4 p-4 bg-muted/50 rounded-lg">
            <h3 class="font-medium mb-2">认证方式</h3>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="(scheme, name) in swaggerDoc.components.securitySchemes"
                :key="name"
                class="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
              >
                {{ scheme.type }} ({{ name }})
              </span>
            </div>
          </div>
        </div>

        <!-- API 列表 -->
        <div v-if="swaggerDoc" class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">API 接口</h2>
          <div class="space-y-4">
            <div
              v-for="(path, pathName) in swaggerDoc.paths"
              :key="pathName"
              class="border rounded-lg overflow-hidden"
            >
              <div class="bg-muted/50 px-4 py-3">
                <code class="font-mono">{{ pathName }}</code>
              </div>
              <div class="divide-y">
                <div
                  v-for="(method, methodName) in path"
                  :key="methodName"
                  class="p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                  @click="selectEndpoint(pathName, methodName, method)"
                >
                  <div class="flex items-center gap-3 mb-2">
                    <span
                      :class="[
                        'px-2 py-1 text-xs font-medium rounded',
                        getMethodColor(methodName)
                      ]"
                    >
                      {{ methodName.toUpperCase() }}
                    </span>
                    <span class="font-medium">{{ method.summary || method.operationId }}</span>
                  </div>
                  <p class="text-sm text-muted-foreground">{{ method.description }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- API 测试面板 -->
        <div v-if="selectedEndpoint" class="bg-card   rounded-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold">测试 API</h2>
            <button
              @click="closeTestPanel"
              class="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <div class="space-y-4">
            <!-- 请求 URL -->
            <div>
              <label class="text-sm font-medium">请求 URL</label>
              <div class="mt-2 flex gap-2">
                <input
                  v-model="testUrl"
                  type="text"
                  readonly
                  class="flex-1 px-3 py-2 border border-border rounded-md bg-muted font-mono text-sm"
                />
                <button
                  @click="sendRequest"
                  :disabled="loading"
                  class="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {{ loading ? '发送中...' : '发送请求' }}
                </button>
              </div>
            </div>

            <!-- 路径参数 -->
            <div v-if="pathParams.length > 0">
              <label class="text-sm font-medium">路径参数</label>
              <div class="mt-2 grid grid-cols-2 gap-2">
                <div
                  v-for="param in pathParams"
                  :key="param.name"
                  class="flex gap-2 items-center"
                >
                  <span class="text-sm font-mono">{{ param.name }}</span>
                  <input
                    v-model="param.value"
                    type="text"
                    :placeholder="param.example || '输入值'"
                    class="flex-1 px-2 py-1 border border-border rounded text-sm"
                  />
                </div>
              </div>
            </div>

            <!-- 查询参数 -->
            <div v-if="queryParams.length > 0">
              <label class="text-sm font-medium">查询参数</label>
              <div class="mt-2 space-y-2">
                <div
                  v-for="param in queryParams"
                  :key="param.name"
                  class="flex gap-2 items-center"
                >
                  <span class="text-sm font-mono w-24">{{ param.name }}</span>
                  <input
                    v-model="param.value"
                    type="text"
                    :placeholder="param.example || param.description || '输入值'"
                    class="flex-1 px-2 py-1 border border-border rounded text-sm"
                  />
                  <span class="text-xs text-muted-foreground">{{ param.type }}</span>
                </div>
              </div>
            </div>

            <!-- 请求体 -->
            <div v-if="requestBody">
              <label class="text-sm font-medium">请求体</label>
              <div class="mt-2">
                <textarea
                  v-model="requestBodyContent"
                  placeholder='{"key": "value"}'
                  class="w-full h-32 px-3 py-2 border border-border rounded-md font-mono text-sm resize-none"
                ></textarea>
              </div>
            </div>

            <!-- 响应结果 -->
            <div v-if="response" class="space-y-2">
              <div class="flex items-center gap-2">
                <label class="text-sm font-medium">响应结果</label>
                <span
                  :class="[
                    'px-2 py-1 text-xs rounded',
                    response.status < 400 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  ]"
                >
                  {{ response.status }}
                </span>
              </div>
              <div class="border rounded-lg p-4 bg-muted/30 max-h-64 overflow-auto">
                <pre class="text-sm whitespace-pre-wrap font-mono">{{ response.data }}</pre>
              </div>
            </div>
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
            <h4 class="font-medium text-foreground mb-2">1. 加载文档</h4>
            <p>支持通过 URL 或直接粘贴 JSON/YAML 内容的方式加载 Swagger/OpenAPI 文档。</p>
          </div>
          <div>
            <h4 class="font-medium text-foreground mb-2">2. 查看接口</h4>
            <p>浏览所有 API 接口，查看请求方法、路径、参数和响应格式。</p>
          </div>
          <div>
            <h4 class="font-medium text-foreground mb-2">3. 测试接口</h4>
            <p>直接在线测试 API 接口，支持参数配置和查看响应结果。</p>
          </div>
          <div>
            <h4 class="font-medium text-foreground mb-2">支持的版本</h4>
            <p>支持 Swagger 2.0 和 OpenAPI 3.0/3.1 规范。</p>
          </div>
        </div>
      </div>

      <!-- 相关工具 -->
      <div class="bg-card   rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">相关工具</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NuxtLink
            to="/tools/api-doc"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <FileText class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">API 文档生成</p>
              <p class="text-xs text-muted-foreground">生成 API 文档</p>
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
              <p class="text-xs text-muted-foreground">发送 HTTP 请求</p>
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
import { Info, FileText, Globe, Code, ArrowRight, X } from 'lucide-vue-next'
import Breadcrumb from '~/components/Breadcrumb.vue'

// 分类信息
const category = { id: 'dev', name: '开发辅助', description: '开发辅助工具集合' }

// 状态管理
const inputMode = ref('url')
const swaggerUrl = ref('')
const documentContent = ref('')
const swaggerDoc = ref(null)
const loading = ref(false)
const selectedEndpoint = ref(null)
const response = ref(null)

// 测试相关
const testUrl = ref('')
const pathParams = ref([])
const queryParams = ref([])
const requestBody = ref(null)
const requestBodyContent = ref('{}')

// 示例 Swagger 文档
const exampleSwagger = {
  openapi: "3.0.0",
  info: {
    title: "示例 API",
    version: "1.0.0",
    description: "这是一个示例 API 文档"
  },
  servers: [
    {
      url: "https://api.example.com/v1"
    }
  ],
  paths: {
    "/users": {
      get: {
        summary: "获取用户列表",
        description: "获取所有用户的列表",
        parameters: [
          {
            name: "page",
            in: "query",
            description: "页码",
            schema: { type: "integer", default: 1 }
          },
          {
            name: "limit",
            in: "query",
            description: "每页数量",
            schema: { type: "integer", default: 10 }
          }
        ],
        responses: {
          200: {
            description: "成功",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/User" }
                    }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        summary: "创建用户",
        description: "创建新用户",
        requestBody: {
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/User" }
            }
          }
        },
        responses: {
          201: {
            description: "创建成功",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/User" }
              }
            }
          }
        }
      }
    },
    "/users/{id}": {
      get: {
        summary: "获取用户详情",
        description: "根据 ID 获取用户信息",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "用户 ID",
            schema: { type: "integer" }
          }
        ],
        responses: {
          200: {
            description: "成功",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/User" }
              }
            }
          }
        }
      }
    }
  },
  components: {
    schemas: {
      User: {
        type: "object",
        properties: {
          id: { type: "integer" },
          name: { type: "string" },
          email: { type: "string" }
        }
      }
    }
  }
}

// 获取 HTTP 方法颜色
const getMethodColor = (method) => {
  const colors = {
    get: 'bg-green-100 text-green-800',
    post: 'bg-blue-100 text-blue-800',
    put: 'bg-yellow-100 text-yellow-800',
    delete: 'bg-red-100 text-red-800',
    patch: 'bg-purple-100 text-purple-800'
  }
  return colors[method] || 'bg-gray-100 text-gray-800'
}

// 从 URL 加载文档
const loadFromUrl = async () => {
  if (!swaggerUrl.value) return

  loading.value = true
  try {
    const response = await fetch(swaggerUrl.value)
    const data = await response.json()
    swaggerDoc.value = data
  } catch (error) {
    console.error('加载失败', error)
    alert('加载文档失败：' + error.message)
  } finally {
    loading.value = false
  }
}

// 解析文档
const parseDocument = () => {
  try {
    const doc = JSON.parse(documentContent.value)
    swaggerDoc.value = doc
  } catch (error) {
    console.error('解析失败', error)
    alert('解析文档失败：' + error.message)
  }
}

// 格式化文档
const formatDocument = () => {
  try {
    const doc = JSON.parse(documentContent.value)
    documentContent.value = JSON.stringify(doc, null, 2)
  } catch (error) {
    console.error('格式化失败', error)
  }
}

// 清空文档
const clearDocument = () => {
  documentContent.value = ''
  swaggerDoc.value = null
}

// 加载示例
const loadExample = () => {
  swaggerDoc.value = exampleSwagger
  documentContent.value = JSON.stringify(exampleSwagger, null, 2)
}

// 选择接口端点
const selectEndpoint = (pathName, methodName, method) => {
  selectedEndpoint.value = {
    path: pathName,
    method: methodName,
    ...method
  }

  // 构建 URL
  const baseUrl = swaggerDoc.value.servers?.[0]?.url || ''
  testUrl.value = `${baseUrl}${pathName}`

  // 解析路径参数
  pathParams.value = []
  const pathParamMatches = pathName.match(/\{(\w+)\}/g)
  if (pathParamMatches) {
    pathParamMatches.forEach(match => {
      const paramName = match.slice(1, -1)
      const param = method.parameters?.find(p => p.name === paramName && p.in === 'path')
      pathParams.value.push({
        name: paramName,
        value: '',
        type: param?.schema?.type || 'string',
        example: param?.example
      })
    })
  }

  // 解析查询参数
  queryParams.value = []
  if (method.parameters) {
    method.parameters.forEach(param => {
      if (param.in === 'query') {
        queryParams.value.push({
          name: param.name,
          value: '',
          type: param.schema?.type || 'string',
          description: param.description,
          example: param.example || param.schema?.default
        })
      }
    })
  }

  // 处理请求体
  requestBody.value = method.requestBody
  if (requestBody.value?.content?.['application/json']?.schema) {
    const schema = requestBody.value.content['application/json'].schema
    if (schema.example) {
      requestBodyContent.value = JSON.stringify(schema.example, null, 2)
    }
  }

  response.value = null
}

// 关闭测试面板
const closeTestPanel = () => {
  selectedEndpoint.value = null
  response.value = null
}

// 发送请求
const sendRequest = async () => {
  loading.value = true
  response.value = null

  try {
    // 构建最终 URL
    let url = testUrl.value

    // 替换路径参数
    pathParams.value.forEach(param => {
      if (param.value) {
        url = url.replace(`{${param.name}}`, param.value)
      }
    })

    // 添加查询参数
    const searchParams = new URLSearchParams()
    queryParams.value.forEach(param => {
      if (param.value) {
        searchParams.append(param.name, param.value)
      }
    })

    if (searchParams.toString()) {
      url += (url.includes('?') ? '&' : '?') + searchParams.toString()
    }

    // 配置请求选项
    const options = {
      method: selectedEndpoint.value.method.toUpperCase(),
      headers: {
        'Content-Type': 'application/json'
      }
    }

    // 添加请求体
    if (['POST', 'PUT', 'PATCH'].includes(selectedEndpoint.value.method.toUpperCase()) && requestBodyContent.value) {
      options.body = requestBodyContent.value
    }

    // 发送请求（由于 CORS 限制，这里仅作演示）
    console.log('模拟请求:', { url, options })

    // 模拟响应
    await new Promise(resolve => setTimeout(resolve, 1000))

    response.value = {
      status: 200,
      statusText: 'OK',
      data: JSON.stringify({
        message: "这是一个模拟响应（实际请求可能因 CORS 限制失败）",
        url,
        method: options.method,
        timestamp: new Date().toISOString()
      }, null, 2)
    }
  } catch (error) {
    response.value = {
      status: 500,
      statusText: 'Error',
      data: JSON.stringify({
        error: error.message,
        message: "请求失败，可能是由于 CORS 限制或网络错误"
      }, null, 2)
    }
  } finally {
    loading.value = false
  }
}

// SEO配置
useSeoMeta({
  title: 'Swagger 查看器 - 在线 API 文档查看测试工具',
  description: '免费的在线 Swagger/OpenAPI 文档查看和测试工具，支持 API 接口调试、参数配置和响应查看。',
  keywords: ['swagger', 'openapi', 'api', '文档查看', '接口测试', 'api调试', 'rest api']
})


</script>