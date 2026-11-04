<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">HTTP客户端 - 在线API测试工具</h1>
      <p class="text-muted-foreground">强大的在线HTTP客户端，支持发送GET、POST、PUT、DELETE等HTTP请求，自定义请求头和请求体，测试REST API接口。纯前端实现，数据安全可靠。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
      <!-- 左侧请求配置 -->
      <div class="lg:col-span-1 space-y-6">
        <!-- 请求配置 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center text-foreground">
            <Settings class="h-5 w-5 mr-2 text-primary" />
            请求配置
          </h2>

          <div class="space-y-4">
            <!-- HTTP方法 -->
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">HTTP方法</label>
              <select
                v-model="request.method"
                class="w-full px-3 py-2 bg-background border border-border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              >
                <option v-for="method in httpMethods" :key="method" :value="method">
                  {{ method }}
                </option>
              </select>
            </div>

            <!-- URL -->
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">请求URL</label>
              <input
                v-model="request.url"
                type="url"
                placeholder="https://api.example.com/endpoint"
                class="w-full px-3 py-2 bg-background border border-border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              />
            </div>

            <!-- 快速示例 -->
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">快速示例</label>
              <select
                @change="loadExample"
                class="w-full px-3 py-2 bg-background border border-border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              >
                <option value="">选择示例...</option>
                <option value="jsonplaceholder">JSONPlaceholder API</option>
                <option value="github">GitHub API</option>
                <option value="weather">天气API</option>
              </select>
            </div>

            <!-- 发送按钮 -->
            <button
              @click="sendRequest"
              :disabled="!request.url || sending"
              class="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              <Loader2 v-if="sending" class="h-5 w-5 mr-2 animate-spin" />
              <Send v-else class="h-5 w-5 mr-2" />
              {{ sending ? '发送中...' : '发送请求' }}
            </button>
          </div>
        </div>

        <!-- 请求头 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold flex items-center text-foreground">
              <FileText class="h-5 w-5 mr-2 text-primary" />
              请求头
            </h2>
            <button
              @click="addHeader"
              class="text-sm text-primary hover:text-primary/80"
            >
              添加
            </button>
          </div>

          <div class="space-y-2">
            <div
              v-for="(header, index) in request.headers"
              :key="index"
              class="flex space-x-2"
            >
              <input
                v-model="header.key"
                type="text"
                placeholder="名称"
                class="flex-1 px-3 py-2 bg-background border border-border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm text-foreground"
              />
              <input
                v-model="header.value"
                type="text"
                placeholder="值"
                class="flex-1 px-3 py-2 bg-background border border-border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm text-foreground"
              />
              <button
                @click="removeHeader(index)"
                class="p-2 text-destructive hover:bg-destructive/10 rounded-md"
              >
                <X class="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <!-- 请求体 -->
        <div v-if="showBody" class="bg-card border border-border rounded-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold flex items-center text-foreground">
              <FileCode class="h-5 w-5 mr-2 text-primary" />
              请求体
            </h2>
            <select
              v-model="bodyType"
              class="text-sm px-3 py-1 bg-background border border-border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
            >
              <option value="json">JSON</option>
              <option value="form">表单</option>
              <option value="raw">原始</option>
            </select>
          </div>

          <!-- JSON编辑器 -->
          <div v-if="bodyType === 'json'">
            <div class="mb-2">
              <button
                @click="formatJson"
                class="text-sm text-primary hover:text-primary/80"
              >
                格式化JSON
              </button>
            </div>
            <textarea
              v-model="request.body"
              placeholder='{"key": "value"}'
              class="w-full px-3 py-2 bg-background border border-border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm text-foreground"
              rows="8"
            ></textarea>
          </div>

          <!-- 表单编辑器 -->
          <div v-else-if="bodyType === 'form'" class="space-y-2">
            <div
              v-for="(field, index) in formData"
              :key="index"
              class="flex space-x-2"
            >
              <input
                v-model="field.key"
                type="text"
                placeholder="字段名"
                class="flex-1 px-3 py-2 bg-background border border-border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm text-foreground"
              />
              <input
                v-model="field.value"
                type="text"
                placeholder="字段值"
                class="flex-1 px-3 py-2 bg-background border border-border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm text-foreground"
              />
              <button
                @click="removeFormField(index)"
                class="p-2 text-destructive hover:bg-destructive/10 rounded-md"
              >
                <X class="h-4 w-4" />
              </button>
            </div>
            <button
              @click="addFormField"
              class="w-full py-2 text-sm text-primary hover:bg-primary/10 rounded-md transition-colors"
            >
              添加字段
            </button>
          </div>

          <!-- 原始编辑器 -->
          <textarea
            v-else
            v-model="request.body"
            placeholder="原始请求体"
            class="w-full px-3 py-2 bg-background border border-border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm text-foreground"
            rows="8"
          ></textarea>
        </div>

        <!-- 请求历史 -->
        <div v-if="history.length > 0" class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center justify-between text-foreground">
            <span class="flex items-center">
              <History class="h-5 w-5 mr-2 text-primary" />
              请求历史
            </span>
            <button
              @click="clearHistory"
              class="text-sm text-destructive hover:text-destructive/80"
            >
              清除
            </button>
          </h2>

          <div class="space-y-2">
            <button
              v-for="item in history"
              :key="item.id"
              @click="loadHistory(item)"
              class="w-full text-left px-3 py-2 bg-muted rounded-md hover:bg-muted/80 transition-colors"
            >
              <div class="flex items-center justify-between">
                <span class="px-2 py-1 bg-muted-foreground/20 text-muted-foreground text-xs rounded font-medium">
                  {{ item.method }}
                </span>
                <span class="text-xs text-muted-foreground">{{ formatTime(item.time) }}</span>
              </div>
              <div class="text-sm font-medium truncate mt-1 text-foreground">{{ item.url || '' }}</div>
              <div class="text-xs text-muted-foreground">{{ item.status || '' }} {{ item.statusText || '' }}</div>
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧响应结果 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 响应信息 -->
        <div v-if="response" class="bg-card border border-border rounded-lg p-6">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-semibold flex items-center text-foreground">
              <Info class="h-6 w-6 mr-2" :class="getStatusColorClass(response.status)" />
              响应结果
            </h3>
            <div class="flex items-center space-x-2">
              <span class="px-3 py-1 rounded-full text-sm font-medium"
                :class="getStatusBadgeClass(response.status)">
                {{ response.status }} {{ response.statusText }}
              </span>
              <span class="text-sm text-muted-foreground">{{ response.time }}ms</span>
            </div>
          </div>

          <!-- 响应概览 -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div class="bg-muted rounded-lg p-3">
              <div class="text-xs text-muted-foreground">状态码</div>
              <div class="font-semibold text-foreground">{{ response.status }}</div>
            </div>
            <div class="bg-muted rounded-lg p-3">
              <div class="text-xs text-muted-foreground">大小</div>
              <div class="font-semibold text-foreground">{{ formatSize(response.size) }}</div>
            </div>
            <div class="bg-muted rounded-lg p-3">
              <div class="text-xs text-muted-foreground">耗时</div>
              <div class="font-semibold text-foreground">{{ response.time }}ms</div>
            </div>
            <div class="bg-muted rounded-lg p-3">
              <div class="text-xs text-muted-foreground">类型</div>
              <div class="font-semibold text-foreground">{{ response.contentType }}</div>
            </div>
          </div>

          <!-- 响应标签页 -->
          <div class="border-b border-border">
            <nav class="-mb-px flex space-x-8">
              <button
                v-for="tab in responseTabs"
                :key="tab.key"
                @click="activeResponseTab = tab.key"
                :class="[
                  'py-2 px-1 border-b-2 font-medium text-sm transition-colors',
                  activeResponseTab === tab.key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                ]"
              >
                {{ tab.label }}
              </button>
            </nav>
          </div>

          <!-- 响应体 -->
          <div v-if="activeResponseTab === 'body'" class="mt-6">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm text-muted-foreground">响应体</span>
              <div class="flex space-x-2">
                <button
                  v-if="isJsonResponse"
                  @click="formatResponse"
                  class="text-sm text-primary hover:text-primary/80"
                >
                  格式化
                </button>
                <button
                  @click="copyResponse"
                  class="text-sm text-muted-foreground hover:text-foreground"
                >
                  复制
                </button>
                <button
                  @click="downloadResponse"
                  class="text-sm text-muted-foreground hover:text-foreground"
                >
                  下载
                </button>
              </div>
            </div>
            <pre class="bg-muted p-4 rounded-lg overflow-x-auto text-sm text-foreground">{{ formattedResponse }}</pre>
          </div>

          <!-- 响应头 -->
          <div v-if="activeResponseTab === 'headers'" class="mt-6">
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-border">
                <thead class="bg-muted">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">名称</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">值</th>
                  </tr>
                </thead>
                <tbody class="bg-card divide-y divide-border">
                  <tr v-for="(value, key) in response.headers" :key="key">
                    <td class="px-6 py-4 text-sm font-medium text-foreground">{{ key }}</td>
                    <td class="px-6 py-4 text-sm text-muted-foreground">{{ value }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- 请求信息 -->
          <div v-if="activeResponseTab === 'request'" class="mt-6">
            <div class="space-y-4">
              <div>
                <h4 class="font-medium text-foreground mb-2">请求URL</h4>
                <code class="block bg-muted p-3 rounded-lg text-sm break-all text-foreground">{{ response.request.url }}</code>
              </div>
              <div>
                <h4 class="font-medium text-foreground mb-2">请求方法</h4>
                <code class="block bg-muted p-3 rounded-lg text-sm text-foreground">{{ response.request.method }}</code>
              </div>
              <div>
                <h4 class="font-medium text-foreground mb-2">请求头</h4>
                <table class="min-w-full divide-y divide-border">
                  <thead class="bg-muted">
                    <tr>
                      <th class="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">名称</th>
                      <th class="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">值</th>
                    </tr>
                  </thead>
                  <tbody class="bg-card divide-y divide-border">
                    <tr v-for="(value, key) in response.request.headers" :key="key">
                      <td class="px-4 py-2 text-sm font-medium text-foreground">{{ key }}</td>
                      <td class="px-4 py-2 text-sm text-muted-foreground">{{ value }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- 错误信息 -->
        <div v-if="error" class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-4 flex items-center text-destructive">
            <AlertCircle class="h-5 w-5 mr-2" />
            请求失败
          </h3>
          <div class="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <p class="text-destructive">{{ error }}</p>
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
          什么是 HTTP 客户端？
        </h2>
        <p class="text-muted-foreground mb-4">
          HTTP客户端是一种用于发送HTTP请求并接收响应的工具。它是Web开发、API测试和调试过程中必不可少的工具。
          通过HTTP客户端，开发者可以模拟浏览器或其他应用程序的行为，向服务器发送各种类型的HTTP请求，
          包括GET、POST、PUT、DELETE等方法，并查看服务器的响应内容。
        </p>
        <p class="text-muted-foreground mb-4">
          我们的在线HTTP客户端工具提供了完整的REST API测试功能，支持自定义请求头、请求体、认证等功能。
          无需安装任何软件，直接在浏览器中使用，所有请求都在本地处理，确保数据安全和隐私。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          核心功能特性
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>支持所有HTTP方法</strong>：GET、POST、PUT、DELETE、PATCH、HEAD、OPTIONS等常用方法</li>
          <li><strong>自定义请求头</strong>：灵活添加、删除和修改HTTP请求头，支持Content-Type、Authorization等</li>
          <li><strong>多种请求体格式</strong>：支持JSON、表单数据和原始文本格式</li>
          <li><strong>响应数据查看</strong>：清晰的响应展示，包括响应体、响应头和请求详情</li>
          <li><strong>请求历史记录</strong>：自动保存最近20条请求历史，方便重复测试</li>
          <li><strong>快速示例</strong>：内置常用API示例，快速上手</li>
          <li><strong>纯本地处理</strong>：所有请求在浏览器本地处理，保护数据隐私</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          使用场景
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>API开发和测试</strong>：开发和调试REST API时发送测试请求</li>
          <li><strong>接口集成</strong>：测试第三方API接口，验证数据格式和响应</li>
          <li><strong>问题排查</strong>：当出现API调用问题时，使用HTTP客户端定位问题</li>
          <li><strong>性能测试</strong>：测试API响应时间和性能指标</li>
          <li><strong>学习HTTP协议</strong>：了解HTTP请求和响应的结构</li>
          <li><strong>自动化测试</strong>：配合脚本进行自动化API测试</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">在线HTTP客户端安全吗？</h3>
            <p class="text-muted-foreground mt-1">
              非常安全。我们的HTTP客户端完全在浏览器本地运行，不会将您的请求数据发送到任何第三方服务器。
              所有请求都直接发送到您指定的目标服务器，确保您的API密钥、认证信息和测试数据的隐私安全。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">为什么选择在线HTTP客户端而不是Postman？</h3>
            <p class="text-muted-foreground mt-1">
              在线HTTP客户端具有无需安装、即开即用、跨平台等优势。它特别适合临时测试、快速验证API、
              在不同设备上使用等场景。虽然功能可能不如桌面软件丰富，但对于大部分API测试需求已经足够。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">支持CORS跨域请求吗？</h3>
            <p class="text-muted-foreground mt-1">
              出于安全考虑，浏览器默认阻止跨域请求。如果要测试的API服务器没有配置正确的CORS头，
              请求可能会失败。您可以使用浏览器插件临时允许跨域，或使用服务器端代理来解决这个问题。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何发送带认证的请求？</h3>
            <p class="text-muted-foreground mt-1">
              您可以在请求头中添加认证信息，例如Bearer Token（Authorization: Bearer your-token）、
              API Key（X-API-Key: your-key）或Basic Auth（Authorization: Basic base64-encoded-credentials）等。
              只需在请求头部分添加相应的键值对即可。
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
import { ref, computed, onMounted, watch } from 'vue'
import { useSeoMeta } from 'nuxt/app'
import {
  Settings, Send, Loader2, FileText, X, FileCode, History,
  Info, AlertCircle, HelpCircle, ChevronUp, Wifi, Globe, Shield,
  Code, FileJson, Hash, Lock, Database, Link, Key, FileSignature,
  Check, FileCode as JWTIcon, Users, Activity, Package, Terminal,
  Regex, List, Calendar, Calculator, Clock, Timer, Type, Image,
  Palette, FileDiff, Copy, Download, RotateCcw, FileText as LockText,
  Shield as ShieldIcon, Lock as LockIcon, Clock as ClockIcon, Type as TypeIcon,
  Wifi as WifiIcon, Image as ImageIcon, Code as CodeIcon, Database as DatabaseIcon,
  Link as LinkIcon, Hash as HashIcon, Timer as TimerIcon, Regex as RegexIcon,
  FileDiff as FileDiffIcon, Globe as GlobeIcon, FileText as FolderOpenIcon,
  GitBranch as GitBranchIcon
} from 'lucide-vue-next'
import { tools } from '~/data/tools'
import { categories } from '~/data/categories'
import { addRecentTool } from '~/composables/useTools'

// SEO配置
useSeoMeta({
  title: 'HTTP客户端 - 在线API测试工具',
  meta: [
    { name: 'description', content: '免费在线HTTP客户端工具，支持GET、POST、PUT、DELETE等方法，测试REST API接口，自定义请求头和请求体。' },
    { name: 'keywords', content: 'HTTP客户端,API测试,REST,POSTMAN,GET,POST,PUT,DELETE' }
  ]
})

// 定义当前工具和分类
const tool = tools.find(t => t.id === 'http-client')
const category = categories.find(c => c.id === 'network')

// 面包屑导航
const breadcrumbItems = [
  { name: '首页', path: '/' },
  { name: '网络工具', path: '/network' },
  { name: 'HTTP客户端', path: '/tools/http-client' }
]

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 响应式数据
const sending = ref(false)
const response = ref(null)
const error = ref('')
const activeResponseTab = ref('body')
const bodyType = ref('json')
const history = ref([])
const formData = ref([])

// 请求配置
const request = ref({
  method: 'GET',
  url: '',
  headers: [
    { key: 'Content-Type', value: 'application/json' },
    { key: 'Accept', value: 'application/json' }
  ],
  body: ''
})

// HTTP方法
const httpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']

// 响应标签页
const responseTabs = [
  { key: 'body', label: '响应体' },
  { key: 'headers', label: '响应头' },
  { key: 'request', label: '请求信息' }
]

// 图标映射
const iconMap = {
  FileText, Lock, Shield, Clock, Type, Wifi, Image, Code,
  FileJson, Database, Link, Hash, Timer, Regex, FileDiff,
  Globe, FolderOpenIcon, GitBranchIcon, Key, Calendar, Calculator,
  Users, Activity, Package, Terminal, List, Palette, FileSignature,
  Check, JWTIcon
}

// 相关工具
const relatedTools = computed(() => {
  // 获取相关工具：同一分类下的其他工具 + 推荐工具
  const sameCategory = tools.filter(t =>
    t.category === 'network' && t.id !== 'http-client'
  ).slice(0, 2)

  // 添加一些推荐工具
  const recommended = [
    tools.find(t => t.id === 'json-formatter'),
    tools.find(t => t.id === 'base64-encode'),
    tools.find(t => t.id === 'jwt-decode'),
    tools.find(t => t.id === 'curl-to-code')
  ].filter(Boolean)

  return [...sameCategory, ...recommended].slice(0, 4)
})

// 计算属性
const showBody = computed(() => {
  return ['POST', 'PUT', 'PATCH'].includes(request.value.method)
})

const formattedResponse = computed(() => {
  if (!response.value?.data) return ''

  try {
    const parsed = JSON.parse(response.value.data)
    return JSON.stringify(parsed, null, 2)
  } catch {
    return response.value.data
  }
})

const isJsonResponse = computed(() => {
  return response.value?.contentType?.includes('json')
})

// 监听body类型变化
watch(bodyType, (newType) => {
  if (newType === 'form' && formData.value.length === 0) {
    formData.value = [{ key: '', value: '' }]
  }
})

// 方法
const sendRequest = async () => {
  if (!request.value.url) return

  sending.value = true
  response.value = null
  error.value = ''

  try {
    // 准备请求配置
    const config = {
      method: request.value.method,
      headers: {}
    }

    // 添加请求头
    request.value.headers.forEach(header => {
      if (header.key && header.value) {
        config.headers[header.key] = header.value
      }
    })

    // 添加请求体
    if (showBody.value) {
      if (bodyType.value === 'json') {
        config.body = request.value.body
        config.headers['Content-Type'] = 'application/json'
      } else if (bodyType.value === 'form') {
        const form = new FormData()
        formData.value.forEach(field => {
          if (field.key && field.value) {
            form.append(field.key, field.value)
          }
        })
        config.body = form
        delete config.headers['Content-Type'] // 让浏览器自动设置
      } else {
        config.body = request.value.body
      }
    }

    // 模拟API调用
    const startTime = Date.now()
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 模拟响应数据
    const mockResponse = await generateMockResponse(request.value, config)
    const endTime = Date.now()

    response.value = {
      status: mockResponse.status,
      statusText: mockResponse.statusText,
      headers: mockResponse.headers,
      data: mockResponse.data,
      size: JSON.stringify(mockResponse.data).length,
      time: endTime - startTime,
      contentType: mockResponse.headers['content-type']?.split(';')[0] || 'unknown',
      request: {
        url: request.value.url,
        method: request.value.method,
        headers: config.headers
      }
    }

    // 添加到历史记录
    addToHistory()
  } catch (err) {
    error.value = err.message || '请求失败'
  } finally {
    sending.value = false
  }
}

const generateMockResponse = async (req, config) => {
  // 根据URL和请求生成模拟响应
  if (req.url.includes('jsonplaceholder')) {
    return {
      status: 200,
      statusText: 'OK',
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'access-control-allow-origin': '*'
      },
      data: JSON.stringify([
        { id: 1, title: 'Test Post 1', body: 'This is a test post' },
        { id: 2, title: 'Test Post 2', body: 'This is another test post' }
      ], null, 2)
    }
  } else if (req.url.includes('github')) {
    return {
      status: 200,
      statusText: 'OK',
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'x-ratelimit-limit': '60',
        'x-ratelimit-remaining': '59'
      },
      data: JSON.stringify({
        login: 'octocat',
        id: 1,
        public_repos: 85,
        followers: 3000
      }, null, 2)
    }
  } else {
    // 默认响应
    return {
      status: req.method === 'POST' ? 201 : 200,
      statusText: 'OK',
      headers: {
        'content-type': 'application/json',
        'server': 'nginx/1.18.0'
      },
      data: JSON.stringify({
        message: 'Success',
        method: req.method,
        url: req.url,
        timestamp: new Date().toISOString()
      }, null, 2)
    }
  }
}

const loadExample = (event) => {
  const examples = {
    jsonplaceholder: {
      url: 'https://jsonplaceholder.typicode.com/posts',
      method: 'GET'
    },
    github: {
      url: 'https://api.github.com/users/octocat',
      method: 'GET',
      headers: [
        { key: 'Accept', value: 'application/vnd.github.v3+json' },
        { key: 'User-Agent', value: 'HTTP-Client' }
      ]
    },
    weather: {
      url: 'https://api.openweathermap.org/data/2.5/weather?q=Beijing&appid=YOUR_API_KEY',
      method: 'GET'
    }
  }

  const example = examples[event.target.value]
  if (example) {
    request.value.url = example.url
    request.value.method = example.method
    if (example.headers) {
      request.value.headers = example.headers
    }
  }
  event.target.value = ''
}

const addHeader = () => {
  request.value.headers.push({ key: '', value: '' })
}

const removeHeader = (index) => {
  request.value.headers.splice(index, 1)
}

const addFormField = () => {
  formData.value.push({ key: '', value: '' })
}

const removeFormField = (index) => {
  formData.value.splice(index, 1)
}

const formatJson = () => {
  try {
    const parsed = JSON.parse(request.value.body)
    request.value.body = JSON.stringify(parsed, null, 2)
  } catch {
    // JSON格式错误
  }
}

const formatResponse = () => {
  // 响应已经格式化
}

const copyResponse = () => {
  if (!response.value?.data) return

  navigator.clipboard.writeText(response.value.data).then(() => {
    alert('响应已复制到剪贴板')
  })
}

const downloadResponse = () => {
  if (!response.value?.data) return

  const blob = new Blob([response.value.data], {
    type: response.value.contentType || 'text/plain'
  })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.download = `response-${Date.now()}.json`
  link.href = url
  link.click()

  URL.revokeObjectURL(url)
}

const getStatusColorClass = (status) => {
  if (status >= 200 && status < 300) return 'text-green-600'
  if (status >= 300 && status < 400) return 'text-yellow-600'
  if (status >= 400) return 'text-red-600'
  return 'text-muted-foreground'
}

const getStatusBadgeClass = (status) => {
  if (status >= 200 && status < 300) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
  if (status >= 300 && status < 400) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
  if (status >= 400) return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
  return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
}

const formatSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const addToHistory = () => {
  const item = {
    id: Date.now(),
    method: request.value.method,
    url: request.value.url,
    status: response.value.status,
    statusText: response.value.statusText,
    time: new Date()
  }

  history.value.unshift(item)
  if (history.value.length > 20) {
    history.value = history.value.slice(0, 20)
  }

  saveHistory()
}

const loadHistory = (item) => {
  request.value.method = item.method
  request.value.url = item.url
}

const clearHistory = () => {
  history.value = []
  saveHistory()
}

const saveHistory = () => {
  if (process.client) {
    localStorage.setItem('http-client-history', JSON.stringify(history.value))
  }
}

const loadHistoryFromStorage = () => {
  if (process.client) {
    const saved = localStorage.getItem('http-client-history')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // 确保每个历史记录项都有必要的属性
        history.value = parsed.map(item => ({
          id: item.id || Date.now(),
          method: item.method || 'GET',
          url: item.url || '',
          status: item.status || 0,
          statusText: item.statusText || '',
          time: item.time || new Date()
        }))
      } catch (e) {
        console.error('Failed to parse history:', e)
        history.value = []
      }
    }
  }
}

const formatTime = (time) => {
  // 检查 time 是否有效
  if (!time) return ''
  
  const date = new Date(time)
  // 检查日期是否有效
  if (isNaN(date.getTime())) return ''
  
  const now = new Date()
  const diff = now - date

  if (diff < 0) return '' // 未来的时间
  
  if (diff < 60000) {
    return '刚刚'
  } else if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`
  } else if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}小时前`
  } else {
    return date.toLocaleDateString()
  }
}

// 切换SEO内容显示状态
const toggleSeoContent = () => {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

// 生命周期
onMounted(() => {
  loadHistoryFromStorage()
})

// 添加到最近使用
if (tool) {
  addRecentTool(tool.id)
}
</script>