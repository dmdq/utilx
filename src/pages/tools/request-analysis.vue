<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <div class="flex items-center gap-4 mb-4">
        <div class="p-3 bg-primary/10 rounded-lg">
          <SearchCode class="h-8 w-8 text-primary" />
        </div>
        <h1 class="text-3xl font-bold text-foreground">HTTP请求分析器 - 在线HTTP请求解析与分析工具</h1>
      </div>
      <p class="text-muted-foreground">
        免费在线HTTP请求分析工具，解析HTTP请求头、参数、cookies等，支持cURL导入、安全分析和多种格式导出。纯本地处理，数据安全可靠。
      </p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 左侧输入区域 -->
      <div class="flex flex-col h-full space-y-6">
        <!-- 请求输入 -->
        <div class="flex flex-col h-full">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <Edit class="h-5 w-5 text-primary" />
              <h2 class="text-lg font-semibold text-foreground">输入 HTTP 请求</h2>
            </div>
            <div class="flex gap-2">
              <button
                class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
                @click="clearInput"
              >
                清空
              </button>
              <button
                class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
                @click="pasteFromClipboard"
              >
                粘贴
              </button>
            </div>
          </div>

          <div class="flex-1 flex flex-col space-y-4">
            <!-- 输入方式选择 -->
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">输入方式</label>
              <div class="flex space-x-4">
                <label class="flex items-center">
                  <input
                    v-model="inputMode"
                    type="radio"
                    value="raw"
                    class="mr-2 border border-border text-primary focus:ring-primary"
                  />
                  <span class="text-sm text-foreground">原始请求</span>
                </label>
                <label class="flex items-center">
                  <input
                    v-model="inputMode"
                    type="radio"
                    value="url"
                    class="mr-2 border border-border text-primary focus:ring-primary"
                  />
                  <span class="text-sm text-foreground">URL 请求</span>
                </label>
              </div>
            </div>

            <!-- 原始请求输入 -->
            <div v-if="inputMode === 'raw'" class="flex-1 flex flex-col">
              <label class="block text-sm font-medium text-foreground mb-2">原始 HTTP 请求</label>
              <textarea
                v-model="rawRequest"
                placeholder="GET /api/users?page=1&limit=10 HTTP/1.1&#10;Host: api.example.com&#10;User-Agent: Mozilla/5.0&#10;Authorization: Bearer token123&#10;Content-Type: application/json"
                class="flex-1 w-full p-4 bg-muted border border-border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono text-sm"
                @input="parseRequest"
              ></textarea>
            </div>

            <!-- URL 请求输入 -->
            <div v-else class="flex-1 flex flex-col space-y-3">
              <div>
                <label class="block text-sm font-medium text-foreground mb-2">请求方法</label>
                <select
                  v-model="urlRequest.method"
                  class="w-full px-3 py-2 bg-background border border-border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
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
                <label class="block text-sm font-medium text-foreground mb-2">URL</label>
                <input
                  v-model="urlRequest.url"
                  type="text"
                  placeholder="https://api.example.com/users?page=1&limit=10"
                  class="w-full px-3 py-2 bg-background border border-border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  @input="parseRequest"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-foreground mb-2">请求头 (每行一个)</label>
                <textarea
                  v-model="urlRequest.headers"
                  placeholder="Content-Type: application/json&#10;Authorization: Bearer token123"
                  class="w-full px-3 py-2 bg-background border border-border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                  rows="4"
                  @input="parseRequest"
                ></textarea>
              </div>
              <div>
                <label class="block text-sm font-medium text-foreground mb-2">请求体 (可选)</label>
                <textarea
                  v-model="urlRequest.body"
                  placeholder="请求体内容"
                  class="w-full px-3 py-2 bg-background border border-border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                  rows="4"
                  @input="parseRequest"
                ></textarea>
              </div>
            </div>

            <!-- 快速示例 -->
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">快速示例</label>
              <select
                @change="loadExample"
                class="w-full px-3 py-2 bg-background border border-border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">选择示例...</option>
                <option value="get">GET 请求示例</option>
                <option value="post">POST 请求示例</option>
                <option value="put">PUT 请求示例</option>
                <option value="auth">带认证的请求</option>
                <option value="upload">文件上传请求</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 导入功能 -->
        <div class="p-4 bg-card border border-border rounded-lg">
          <div class="flex items-center gap-2 mb-3">
            <Upload class="h-5 w-5 text-primary" />
            <h2 class="text-lg font-semibold text-foreground">导入请求</h2>
          </div>

          <div class="space-y-3">
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">从浏览器开发者工具导入</label>
              <p class="text-sm text-muted-foreground">在浏览器中右键请求 → Copy → Copy as cURL，然后粘贴到上方输入框</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-foreground mb-2">从 Postman 导入</label>
              <p class="text-sm text-muted-foreground">在 Postman 中点击 Code → cURL，然后复制到上方输入框</p>
            </div>
          </div>
      </div>

      <!-- 右侧分析结果 -->
      <div class="flex flex-col h-full space-y-4 overflow-y-auto">
        <!-- 基本信息 -->
        <div v-if="parsedInfo" class="p-4 bg-card border border-border rounded-lg">
          <div class="flex items-center gap-2 mb-3">
            <Info class="h-5 w-5 text-primary" />
            <h2 class="text-lg font-semibold text-foreground">基本信息</h2>
          </div>

            <div class="space-y-3">
            <div class="flex justify-between py-2 border-b border-border">
              <span class="text-sm text-muted-foreground">请求方法</span>
              <span class="px-2 py-1 bg-primary/10 text-primary rounded text-sm font-medium">{{ parsedInfo.method }}</span>
            </div>
            <div class="flex justify-between py-2 border-b border-border">
              <span class="text-sm text-muted-foreground">协议版本</span>
              <span class="text-sm font-medium text-foreground">{{ parsedInfo.protocol || 'HTTP/1.1' }}</span>
            </div>
            <div class="flex justify-between py-2 border-b border-border">
              <span class="text-sm text-muted-foreground">主机</span>
              <span class="text-sm font-medium text-foreground">{{ parsedInfo.host }}</span>
            </div>
            <div class="flex justify-between py-2 border-b border-border">
              <span class="text-sm text-muted-foreground">路径</span>
              <span class="text-sm font-mono text-foreground">{{ parsedInfo.path }}</span>
            </div>
          </div>
        </div>

        <!-- URL 参数 -->
        <div v-if="parsedInfo && parsedInfo.queryParams && Object.keys(parsedInfo.queryParams).length > 0" class="p-4 bg-card border border-border rounded-lg">
          <div class="flex items-center gap-2 mb-3">
            <Link class="h-5 w-5 text-primary" />
            <h2 class="text-lg font-semibold text-foreground">URL 参数</h2>
          </div>

          <div class="space-y-2">
            <div
              v-for="(value, key) in parsedInfo.queryParams"
              :key="key"
              class="flex items-center justify-between p-2 bg-muted rounded"
            >
              <span class="text-sm font-medium text-foreground">{{ key }}</span>
              <span class="text-sm text-muted-foreground">{{ value }}</span>
            </div>
          </div>
        </div>

        <!-- 请求头 -->
        <div v-if="parsedInfo && parsedInfo.headers && Object.keys(parsedInfo.headers).length > 0" class="p-4 bg-card border border-border rounded-lg">
          <div class="flex items-center gap-2 mb-3">
            <FileText class="h-5 w-5 text-primary" />
            <h2 class="text-lg font-semibold text-foreground">请求头</h2>
          </div>

          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-border">
              <thead class="bg-muted">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">名称</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">值</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">说明</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border">
                <tr v-for="(value, key) in parsedInfo.headers" :key="key">
                  <td class="px-4 py-3 text-sm font-medium text-foreground">{{ key }}</td>
                  <td class="px-4 py-3 text-sm text-muted-foreground break-all">{{ value }}</td>
                  <td class="px-4 py-3 text-sm text-muted-foreground">{{ getHeaderDescription(key) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Cookies -->
        <div v-if="parsedInfo && parsedInfo.cookies && parsedInfo.cookies.length > 0" class="p-4 bg-card border border-border rounded-lg">
          <div class="flex items-center gap-2 mb-3">
            <Cookie class="h-5 w-5 text-primary" />
            <h2 class="text-lg font-semibold text-foreground">Cookies</h2>
          </div>

          <div class="space-y-2">
            <div
              v-for="cookie in parsedInfo.cookies"
              :key="cookie.name"
              class="p-3 bg-muted rounded-lg"
            >
              <div class="flex items-center justify-between mb-1">
                <span class="text-sm font-medium text-foreground">{{ cookie.name }}</span>
                <div class="flex items-center gap-2">
                  <span v-if="cookie.secure" class="text-xs px-2 py-1 bg-green-500/10 text-green-600 rounded">Secure</span>
                  <span v-if="cookie.httpOnly" class="text-xs px-2 py-1 bg-blue-500/10 text-blue-600 rounded">HttpOnly</span>
                </div>
              </div>
              <div class="text-sm text-muted-foreground">值: {{ cookie.value }}</div>
              <div v-if="cookie.domain" class="text-xs text-muted-foreground">域: {{ cookie.domain }}</div>
              <div v-if="cookie.path" class="text-xs text-muted-foreground">路径: {{ cookie.path }}</div>
            </div>
          </div>
        </div>

        <!-- 请求体 -->
        <div v-if="parsedInfo && parsedInfo.body" class="p-4 bg-card border border-border rounded-lg">
          <div class="flex items-center gap-2 mb-3">
            <FileCode class="h-5 w-5 text-primary" />
            <h2 class="text-lg font-semibold text-foreground">请求体</h2>
          </div>

          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm text-muted-foreground">内容类型: {{ parsedInfo.contentType || '未知' }}</span>
              <button
                v-if="isJsonBody(parsedInfo.body)"
                @click="formatBody"
                class="text-sm text-primary hover:text-primary/80"
              >
                格式化
              </button>
            </div>
            <pre class="bg-muted p-4 rounded-lg overflow-x-auto text-sm">{{ formattedBody }}</pre>
          </div>
        </div>

        <!-- 表单数据 -->
        <div v-if="parsedInfo && parsedInfo.formData && Object.keys(parsedInfo.formData).length > 0" class="p-4 bg-card border border-border rounded-lg">
          <div class="flex items-center gap-2 mb-3">
            <FileInput class="h-5 w-5 text-primary" />
            <h2 class="text-lg font-semibold text-foreground">表单数据</h2>
          </div>

          <div class="space-y-2">
            <div
              v-for="(value, key) in parsedInfo.formData"
              :key="key"
              class="flex items-center justify-between p-2 bg-muted rounded"
            >
              <span class="text-sm font-medium text-foreground">{{ key }}</span>
              <span class="text-sm text-muted-foreground">{{ value }}</span>
            </div>
          </div>
        </div>

        <!-- 安全分析 -->
        <div v-if="parsedInfo" class="p-4 bg-card border border-border rounded-lg">
          <div class="flex items-center gap-2 mb-3">
            <Shield class="h-5 w-5 text-primary" />
            <h2 class="text-lg font-semibold text-foreground">安全分析</h2>
          </div>

          <div class="space-y-3">
            <div
              v-for="issue in securityIssues"
              :key="issue.type"
              class="p-3 rounded-lg"
              :class="issue.severity === 'high' ? 'bg-destructive/10' : issue.severity === 'medium' ? 'bg-yellow-500/10' : 'bg-blue-500/10'"
            >
              <div class="flex items-center">
                <component :is="getSecurityIcon(issue.severity)" :class="[
                  'h-5 w-5 mr-2',
                  issue.severity === 'high' ? 'text-destructive' : issue.severity === 'medium' ? 'text-yellow-600' : 'text-blue-600'
                ]" />
                <span class="font-medium text-sm text-foreground">{{ issue.title }}</span>
              </div>
              <p class="text-sm text-muted-foreground mt-1">{{ issue.description }}</p>
            </div>
          </div>
        </div>

        <!-- 导出功能 -->
        <div v-if="parsedInfo" class="p-4 bg-card border border-border rounded-lg">
          <div class="flex items-center gap-2 mb-3">
            <Download class="h-5 w-5 text-primary" />
            <h2 class="text-lg font-semibold text-foreground">导出选项</h2>
          </div>

          <div class="flex flex-wrap gap-2">
            <button
              @click="exportAsCurl"
              class="px-3 py-2 bg-muted hover:bg-muted/80 rounded text-sm text-foreground transition-colors"
            >
              导出为 cURL
            </button>
            <button
              @click="exportAsHar"
              class="px-3 py-2 bg-muted hover:bg-muted/80 rounded text-sm text-foreground transition-colors"
            >
              导出为 HAR
            </button>
            <button
              @click="exportAsJson"
              class="px-3 py-2 bg-muted hover:bg-muted/80 rounded text-sm text-foreground transition-colors"
            >
              导出为 JSON
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>

    <!-- SEO 内容长尾区 -->
    <div class="p-6 mb-12 relative">
      <!-- 折叠按钮 -->
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        :title="isSeoContentVisible ? '折叠内容' : '展开内容'"
      >
        <HelpCircle v-if="!isSeoContentVisible" class="w-5 h-5" />
        <ChevronUp v-else class="w-5 h-5" />
      </button>

      <!-- 内容区域 -->
      <div v-show="isSeoContentVisible">
        <h2 class="text-2xl font-bold text-foreground mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          什么是 HTTP 请求分析？
        </h2>
        <p class="text-muted-foreground mb-4">
          HTTP 请求分析是指对 HTTP 协议的请求进行解析、检查和理解的过程。HTTP 协议是互联网上应用最为广泛的一种网络协议，
          所有的 WWW 文件都必须遵守这个标准。通过分析 HTTP 请求，开发者可以了解客户端与服务器之间的通信细节，
          包括请求方法、请求头、请求体、参数等信息。
        </p>
        <p class="text-muted-foreground mb-6">
          HTTP 请求分析工具可以帮助开发者和测试人员快速定位问题、优化性能、调试 API 接口。
          它能够将复杂的 HTTP 请求信息以结构化的方式展示出来，让用户能够清晰地了解请求的各个组成部分。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>选择输入方式：可以输入原始 HTTP 请求文本，或通过 URL 构建器构建请求</li>
          <li>输入 HTTP 请求内容：粘贴或输入请求信息，工具会实时解析</li>
          <li>查看分析结果：在右侧查看解析出的请求头、参数、cookies 等信息</li>
          <li>安全分析：工具会自动检查请求中的安全问题</li>
          <li>导出结果：可以将分析结果导出为 cURL、HAR 或 JSON 格式</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          核心功能特性
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>多种输入方式</strong>：支持原始请求文本输入和 URL 构建器两种方式</li>
          <li><strong>实时解析</strong>：输入内容时自动解析，无需手动触发</li>
          <li><strong>全面的请求分析</strong>：解析请求方法、URL、参数、请求头、cookies、请求体等</li>
          <li><strong>安全检查</strong>：自动检测请求中的安全隐患</li>
          <li><strong>多种导出格式</strong>：支持导出为 cURL 命令、HAR 文件和 JSON 格式</li>
          <li><strong>本地处理</strong>：所有处理都在浏览器本地完成，保护数据隐私</li>
          <li><strong>快速示例</strong>：提供多种常用请求的示例，方便快速上手</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">HTTP 请求分析工具安全吗？</h3>
            <p class="text-muted-foreground mt-1">
              完全安全。本工具采用纯前端技术实现，所有 HTTP 请求解析都在您的浏览器本地完成，
              请求数据不会发送到任何服务器。您可以放心分析包含敏感信息的 HTTP 请求。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">支持哪些 HTTP 方法？</h3>
            <p class="text-muted-foreground mt-1">
              本工具支持所有标准的 HTTP 方法，包括 GET、POST、PUT、DELETE、PATCH、HEAD、OPTIONS 等。
              同时也支持自定义的 HTTP 方法。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何从浏览器复制 HTTP 请求？</h3>
            <p class="text-muted-foreground mt-1">
              在 Chrome、Firefox 等现代浏览器的开发者工具中：
              1. 打开开发者工具（F12）
              2. 切换到 Network（网络）标签
              3. 找到要分析的请求
              4. 右键点击请求 → Copy → Copy as cURL
              5. 将复制的内容粘贴到本工具的输入框
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">什么是 HAR 格式？</h3>
            <p class="text-muted-foreground mt-1">
              HAR（HTTP Archive）是一个用来记录 HTTP 请求信息的标准格式，被广泛用于性能分析、
              调试和测试。HAR 文件包含了请求的详细信息，包括 URL、方法、请求头、响应头、时间戳等。
            </p>
          </div>
        </div>
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
              :is="iconMap[relatedTool.icon]"
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

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  SearchCode, Edit, Upload, Info, Link, FileText, Cookie,
  FileCode, FileInput, Shield, Download, AlertTriangle,
  AlertCircle, HelpCircle, ChevronUp, ChevronDown,
  Globe, Wifi, Lock, Terminal, Code, FileJson
} from 'lucide-vue-next'
import { useSeoMeta } from 'nuxt/app'
import { tools } from '~/data/tools'
import { categories } from '~/data/categories'
import { addRecentTool } from '~/composables/useTools'



// SEO配置
useSeoMeta({
  title: 'HTTP请求分析器 - 在线HTTP请求解析工具',
  meta: [
    { name: 'description', content: '免费在线HTTP请求分析工具，解析HTTP请求头、参数、cookies等，支持多种格式的请求导入和导出。' },
    { name: 'keywords', content: 'HTTP请求分析,请求解析,HTTP头分析,URL参数解析,cookie分析,请求体分析' }
  ]
})

const router = useRouter()

// 定义当前工具和分类
const tool = tools.find(t => t.id === 'request-analysis')
const category = categories.find(c => c.id === 'network')

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 图标映射
const iconMap = {
  SearchCode, Edit, Upload, Info, Link, FileText, Cookie,
  FileCode, FileInput, Shield, Download, AlertTriangle,
  AlertCircle, HelpCircle, ChevronUp, ChevronDown,
  Globe, Wifi, Lock, Terminal, Code, FileJson
}

// 相关工具
const relatedTools = computed(() => {
  // 获取相关工具：同一分类下的其他工具 + 推荐工具
  const sameCategory = tools.filter(t =>
    t.category === 'network' && t.id !== 'request-analysis'
  ).slice(0, 2)

  // 添加一些推荐工具
  const recommended = [
    tools.find(t => t.id === 'curl-to-code'),
    tools.find(t => t.id === 'base64-encode'),
    tools.find(t => t.id === 'url-encode'),
    tools.find(t => t.id === 'jwt-decode')
  ].filter(Boolean)

  return [...sameCategory, ...recommended].slice(0, 4)
})

// 响应式数据
const inputMode = ref('raw')
const rawRequest = ref('')
const urlRequest = ref({
  method: 'GET',
  url: '',
  headers: '',
  body: ''
})
const parsedInfo = ref(null)

// 计算属性
const formattedBody = computed(() => {
  if (!parsedInfo.value?.body) return ''

  try {
    const parsed = JSON.parse(parsedInfo.value.body)
    return JSON.stringify(parsed, null, 2)
  } catch {
    return parsedInfo.value.body
  }
})

const securityIssues = computed(() => {
  if (!parsedInfo.value) return []

  const issues = []

  // 检查是否使用 HTTPS
  if (parsedInfo.value.url && !parsedInfo.value.url.startsWith('https://')) {
    issues.push({
      type: 'http',
      severity: 'high',
      title: '使用 HTTP 协议',
      description: '请求使用 HTTP 协议传输，数据未加密，可能被窃听'
    })
  }

  // 检查是否包含敏感信息
  const body = parsedInfo.value.body || ''
  if (body.includes('password') || body.includes('token') || body.includes('secret')) {
    issues.push({
      type: 'sensitive-data',
      severity: 'high',
      title: '请求体包含敏感信息',
      description: '请求体中可能包含密码、令牌等敏感信息'
    })
  }

  // 检查认证头
  const headers = parsedInfo.value.headers || {}
  if (headers['Authorization'] && headers['Authorization'].startsWith('Basic ')) {
    issues.push({
      type: 'basic-auth',
      severity: 'medium',
      title: '使用 Basic 认证',
      description: 'Basic 认证将凭据以 Base64 编码传输，容易被解码'
    })
  }

  // 检查安全头
  const securityHeaders = ['Content-Security-Policy', 'X-Frame-Options', 'X-Content-Type-Options']
  const missingSecurityHeaders = securityHeaders.filter(header => !headers[header])
  if (missingSecurityHeaders.length > 0) {
    issues.push({
      type: 'missing-headers',
      severity: 'low',
      title: '缺少安全头',
      description: `建议添加安全头: ${missingSecurityHeaders.join(', ')}`
    })
  }

  return issues
})

// 方法
const parseRequest = () => {
  let requestText = ''

  if (inputMode.value === 'raw') {
    requestText = rawRequest.value
  } else {
    // 构建请求文本
    requestText = urlRequest.value.method + ' '

    if (urlRequest.value.url) {
      const url = new URL(urlRequest.value.url)
      requestText += url.pathname + (url.search || '')
    }

    requestText += ' HTTP/1.1\r\n'

    if (urlRequest.value.url) {
      const url = new URL(urlRequest.value.url)
      requestText += `Host: ${url.host}\r\n`
    }

    // 添加请求头
    if (urlRequest.value.headers) {
      const headers = urlRequest.value.headers.split('\n')
      for (const header of headers) {
        if (header.trim()) {
          requestText += header + '\r\n'
        }
      }
    }

    // 添加空行分隔请求头和请求体
    if (urlRequest.value.body) {
      requestText += '\r\n' + urlRequest.value.body
    }
  }

  if (!requestText.trim()) {
    parsedInfo.value = null
    return
  }

  try {
    // 解析请求
    const lines = requestText.split('\n')
    const firstLine = lines[0].trim()

    // 解析请求行
    const [, path, protocol] = firstLine.split(' ')
    const [method] = firstLine.split(' ')

    // 解析请求头
    const headers = {}
    const headerEndIndex = lines.findIndex(line => line.trim() === '')

    for (let i = 1; i < lines.length && i < headerEndIndex; i++) {
      const line = lines[i].trim()
      if (line) {
        const colonIndex = line.indexOf(':')
        if (colonIndex > 0) {
          const key = line.substring(0, colonIndex).trim()
          const value = line.substring(colonIndex + 1).trim()
          headers[key] = value
        }
      }
    }

    // 解析请求体
    let body = ''
    if (headerEndIndex !== -1 && headerEndIndex < lines.length - 1) {
      body = lines.slice(headerEndIndex + 1).join('\n')
    }

    // 解析 URL
    let url = ''
    let host = headers['Host'] || headers['host'] || ''

    if (urlRequest.value.url) {
      url = urlRequest.value.url
    } else if (host) {
      url = `http://${host}${path}`
    }

    // 解析查询参数
    let queryParams = {}
    let formData = {}
    let cookies = []

    if (url) {
      const urlObj = new URL(url)
      urlObj.searchParams.forEach((value, key) => {
        queryParams[key] = value
      })
    }

    // 解析表单数据
    const contentType = headers['Content-Type'] || headers['content-type'] || ''
    if (contentType.includes('application/x-www-form-urlencoded') && body) {
      const params = new URLSearchParams(body)
      params.forEach((value, key) => {
        formData[key] = value
      })
    }

    // 解析 Cookies
    const cookieHeader = headers['Cookie'] || headers['cookie'] || ''
    if (cookieHeader) {
      cookies = cookieHeader.split(';').map(cookie => {
        const [name, value] = cookie.trim().split('=')
        return { name, value }
      })
    }

    parsedInfo.value = {
      method: method || 'GET',
      protocol: protocol || 'HTTP/1.1',
      path,
      url,
      host,
      headers,
      body,
      contentType,
      queryParams,
      formData,
      cookies
    }
  } catch (error) {
    console.error('解析请求失败:', error)
    parsedInfo.value = null
  }
}

const loadExample = (event) => {
  const examples = {
    get: {
      raw: `GET /api/users?page=1&limit=10 HTTP/1.1
Host: api.example.com
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36
Accept: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`,
      url: {
        method: 'GET',
        url: 'https://api.example.com/api/users?page=1&limit=10',
        headers: `User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36
Accept: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`,
        body: ''
      }
    },
    post: {
      raw: `POST /api/users HTTP/1.1
Host: api.example.com
Content-Type: application/json
Accept: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "age": 30
}`,
      url: {
        method: 'POST',
        url: 'https://api.example.com/api/users',
        headers: 'Content-Type: application/json\nAccept: application/json',
        body: '{\n  "name": "John Doe",\n  "email": "john@example.com",\n  "age": 30\n}'
      }
    },
    put: {
      raw: `PUT /api/users/123 HTTP/1.1
Host: api.example.com
Content-Type: application/json
Authorization: Bearer token123

{
  "name": "John Smith",
  "email": "john.smith@example.com"
}`,
      url: {
        method: 'PUT',
        url: 'https://api.example.com/api/users/123',
        headers: 'Content-Type: application/json\nAuthorization: Bearer token123',
        body: '{\n  "name": "John Smith",\n  "email": "john.smith@example.com"\n}'
      }
    },
    auth: {
      raw: `GET /api/protected HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ
X-API-Key: abc123def456`,
      url: {
        method: 'GET',
        url: 'https://api.example.com/api/protected',
        headers: 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ\nX-API-Key: abc123def456',
        body: ''
      }
    },
    upload: {
      raw: `POST /api/upload HTTP/1.1
Host: api.example.com
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Length: 238

------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="file"; filename="test.txt"
Content-Type: text/plain

File content here
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="description"

Test file upload
------WebKitFormBoundary7MA4YWxkTrZu0gW--`,
      url: {
        method: 'POST',
        url: 'https://api.example.com/api/upload',
        headers: 'Content-Type: multipart/form-data',
        body: '------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name="file"; filename="test.txt"\r\nContent-Type: text/plain\r\n\r\nFile content here\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name="description"\r\n\r\nTest file upload\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW--'
      }
    }
  }

  const example = examples[event.target.value]
  if (example) {
    if (inputMode.value === 'raw') {
      rawRequest.value = example.raw
    } else {
      urlRequest.value = example.url
    }
    parseRequest()
  }
  event.target.value = ''
}

const getHeaderDescription = (headerName) => {
  const descriptions = {
    'Accept': '指定客户端能够接收的内容类型',
    'Accept-Encoding': '指定客户端支持的编码方式',
    'Accept-Language': '指定客户端偏好的语言',
    'Authorization': '包含认证信息',
    'Cache-Control': '指定缓存策略',
    'Connection': '控制连接是否保持活跃',
    'Content-Length': '请求体的字节长度',
    'Content-Type': '请求体的媒体类型',
    'Cookie': '包含客户端的 cookie 信息',
    'Host': '指定请求的服务器域名和端口',
    'If-Modified-Since': '条件请求，检查资源是否修改',
    'If-None-Match': '条件请求，检查 ETag 是否匹配',
    'Origin': '指示请求的来源',
    'Referer': '指示请求的来源页面',
    'User-Agent': '包含客户端信息',
    'X-Requested-With': '标识 XMLHttpRequest 请求'
  }

  return descriptions[headerName] || ''
}

const isJsonBody = (body) => {
  if (!body) return false
  try {
    JSON.parse(body)
    return true
  } catch {
    return false
  }
}

const formatBody = () => {
  // Body 已经通过计算属性格式化
}

const getSecurityIcon = (severity) => {
  switch (severity) {
    case 'high':
      return AlertTriangle
    case 'medium':
      return AlertCircle
    case 'low':
      return HelpCircle
    default:
      return HelpCircle
  }
}

// 清空输入
const clearInput = () => {
  rawRequest.value = ''
  urlRequest.value = {
    method: 'GET',
    url: '',
    headers: '',
    body: ''
  }
  parsedInfo.value = null
}

// 粘贴剪贴板内容
const pasteFromClipboard = async () => {
  try {
    const text = await navigator.clipboard.readText()
    rawRequest.value = text
    parseRequest()
  } catch (error) {
    console.error('粘贴失败:', error)
  }
}

// 切换SEO内容显示状态
const toggleSeoContent = () => {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

const exportAsCurl = () => {
  if (!parsedInfo.value) return

  let curl = 'curl'

  // 添加请求方法
  if (parsedInfo.value.method !== 'GET') {
    curl += ` -X ${parsedInfo.value.method}`
  }

  // 添加 URL
  curl += ` "${parsedInfo.value.url}"`

  // 添加请求头
  for (const [key, value] of Object.entries(parsedInfo.value.headers)) {
    if (key.toLowerCase() !== 'host') {
      curl += ` \\\n  -H "${key}: ${value}"`
    }
  }

  // 添加请求体
  if (parsedInfo.value.body) {
    curl += ` \\\n  -d '${parsedInfo.value.body}'`
  }

  // 复制到剪贴板
  navigator.clipboard.writeText(curl).then(() => {
    alert('cURL 命令已复制到剪贴板')
  })
}

const exportAsHar = () => {
  if (!parsedInfo.value) return

  const har = {
    log: {
      version: '1.2',
      creator: {
        name: 'HTTP Request Analyzer',
        version: '1.0'
      },
      entries: [{
        request: {
          method: parsedInfo.value.method,
          url: parsedInfo.value.url,
          httpVersion: parsedInfo.value.protocol,
          headers: Object.entries(parsedInfo.value.headers).map(([name, value]) => ({ name, value })),
          queryString: Object.entries(parsedInfo.value.queryParams || {}).map(([name, value]) => ({ name, value })),
          postData: parsedInfo.value.body ? {
            mimeType: parsedInfo.value.contentType || 'application/octet-stream',
            text: parsedInfo.value.body
          } : undefined,
          headersSize: -1,
          bodySize: parsedInfo.value.body ? parsedInfo.value.body.length : 0
        },
        response: {
          status: 0,
          statusText: '',
          httpVersion: parsedInfo.value.protocol,
          headers: [],
          cookies: [],
          content: {},
          redirectURL: '',
          headersSize: -1,
          bodySize: 0
        },
        cache: {},
        timings: {
          send: 0,
          wait: 0,
          receive: 0
        }
      }]
    }
  }

  const blob = new Blob([JSON.stringify(har, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.download = `request-${Date.now()}.har`
  link.href = url
  link.click()
  URL.revokeObjectURL(url)
}

const exportAsJson = () => {
  if (!parsedInfo.value) return

  const json = JSON.stringify(parsedInfo.value, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.download = `request-${Date.now()}.json`
  link.href = url
  link.click()
  URL.revokeObjectURL(url)
}

// 生命周期
onMounted(() => {
  // 加载示例
  loadExample({ target: { value: 'get' } })

  // 添加到最近使用
  if (tool) {
    addRecentTool(tool.id)
  }
})
</script>