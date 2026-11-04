<template>
  <div class="max-w-6xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">CSP策略生成器</h1>
      <p class="text-muted-foreground">生成Content-Security-Policy策略，防止XSS攻击和数据注入，保护Web应用安全</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：策略配置 -->
      <div class="space-y-4">
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <Shield class="w-5 h-5 text-primary" />
            CSP策略配置
          </h2>

          <div class="space-y-4">
            <!-- default-src -->
            <div class="p-4 bg-muted rounded-lg">
              <div class="flex items-center justify-between mb-2">
                <label class="text-sm font-medium">default-src</label>
                <span class="text-xs text-muted-foreground">默认策略</span>
              </div>
              <div class="space-y-2">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" v-model="directives['default-src'].self" class="rounded">
                  <span class="text-sm">'self'</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" v-model="directives['default-src'].none" class="rounded">
                  <span class="text-sm">'none' (最严格)</span>
                </label>
                <input
                  v-model="directives['default-src'].custom"
                  type="text"
                  placeholder="自定义源"
                  class="w-full px-3 py-2 border border-border rounded text-sm"
                >
              </div>
            </div>

            <!-- script-src -->
            <div class="p-4 bg-muted rounded-lg">
              <div class="flex items-center justify-between mb-2">
                <label class="text-sm font-medium">script-src</label>
                <span class="text-xs text-muted-foreground">JavaScript脚本</span>
              </div>
              <div class="space-y-2">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" v-model="directives['script-src'].self" class="rounded">
                  <span class="text-sm">'self'</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" v-model="directives['script-src'].unsafeInline" class="rounded">
                  <span class="text-sm">'unsafe-inline' (不推荐)</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" v-model="directives['script-src'].unsafeEval" class="rounded">
                  <span class="text-sm">'unsafe-eval' (不推荐)</span>
                </label>
                <input
                  v-model="directives['script-src'].custom"
                  type="text"
                  placeholder="例如: https://cdn.example.com"
                  class="w-full px-3 py-2 border border-border rounded text-sm"
                >
              </div>
            </div>

            <!-- style-src -->
            <div class="p-4 bg-muted rounded-lg">
              <div class="flex items-center justify-between mb-2">
                <label class="text-sm font-medium">style-src</label>
                <span class="text-xs text-muted-foreground">CSS样式</span>
              </div>
              <div class="space-y-2">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" v-model="directives['style-src'].self" class="rounded">
                  <span class="text-sm">'self'</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" v-model="directives['style-src'].unsafeInline" class="rounded">
                  <span class="text-sm">'unsafe-inline'</span>
                </label>
                <input
                  v-model="directives['style-src'].custom"
                  type="text"
                  placeholder="自定义源"
                  class="w-full px-3 py-2 border border-border rounded text-sm"
                >
              </div>
            </div>

            <!-- img-src -->
            <div class="p-4 bg-muted rounded-lg">
              <div class="flex items-center justify-between mb-2">
                <label class="text-sm font-medium">img-src</label>
                <span class="text-xs text-muted-foreground">图片资源</span>
              </div>
              <div class="space-y-2">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" v-model="directives['img-src'].self" class="rounded">
                  <span class="text-sm">'self'</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" v-model="directives['img-src'].data" class="rounded">
                  <span class="text-sm">'data:' (data URI)</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" v-model="directives['img-src'].https" class="rounded">
                  <span class="text-sm">'https:' (HTTPS)</span>
                </label>
                <input
                  v-model="directives['img-src'].custom"
                  type="text"
                  placeholder="自定义源"
                  class="w-full px-3 py-2 border border-border rounded text-sm"
                >
              </div>
            </div>

            <!-- connect-src -->
            <div class="p-4 bg-muted rounded-lg">
              <div class="flex items-center justify-between mb-2">
                <label class="text-sm font-medium">connect-src</label>
                <span class="text-xs text-muted-foreground">网络请求(AJAX/WebSocket)</span>
              </div>
              <div class="space-y-2">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" v-model="directives['connect-src'].self" class="rounded">
                  <span class="text-sm">'self'</span>
                </label>
                <input
                  v-model="directives['connect-src'].custom"
                  type="text"
                  placeholder="例如: https://api.example.com wss://example.com"
                  class="w-full px-3 py-2 border border-border rounded text-sm"
                >
              </div>
            </div>

            <!-- font-src -->
            <div class="p-4 bg-muted rounded-lg">
              <div class="flex items-center justify-between mb-2">
                <label class="text-sm font-medium">font-src</label>
                <span class="text-xs text-muted-foreground">Web字体</span>
              </div>
              <div class="space-y-2">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" v-model="directives['font-src'].self" class="rounded">
                  <span class="text-sm">'self'</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" v-model="directives['font-src'].data" class="rounded">
                  <span class="text-sm">'data:' (data URI)</span>
                </label>
                <input
                  v-model="directives['font-src'].custom"
                  type="text"
                  placeholder="例如: https://fonts.gstatic.com"
                  class="w-full px-3 py-2 border border-border rounded text-sm"
                >
              </div>
            </div>

            <!-- frame-src -->
            <div class="p-4 bg-muted rounded-lg">
              <div class="flex items-center justify-between mb-2">
                <label class="text-sm font-medium">frame-src / frame-ancestors</label>
                <span class="text-xs text-muted-foreground">iframe/嵌入页面</span>
              </div>
              <div class="space-y-2">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" v-model="directives['frame-src'].self" class="rounded">
                  <span class="text-sm">'self'</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" v-model="directives['frame-src'].none" class="rounded">
                  <span class="text-sm">'none' (禁止iframe)</span>
                </label>
                <input
                  v-model="directives['frame-src'].custom"
                  type="text"
                  placeholder="允许的iframe来源"
                  class="w-full px-3 py-2 border border-border rounded text-sm"
                >
              </div>
            </div>

            <!-- media-src -->
            <div class="p-4 bg-muted rounded-lg">
              <div class="flex items-center justify-between mb-2">
                <label class="text-sm font-medium">media-src</label>
                <span class="text-xs text-muted-foreground">音频/视频</span>
              </div>
              <div class="space-y-2">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" v-model="directives['media-src'].self" class="rounded">
                  <span class="text-sm">'self'</span>
                </label>
                <input
                  v-model="directives['media-src'].custom"
                  type="text"
                  placeholder="媒体资源来源"
                  class="w-full px-3 py-2 border border-border rounded text-sm"
                >
              </div>
            </div>

            <!-- object-src -->
            <div class="p-4 bg-muted rounded-lg">
              <div class="flex items-center justify-between mb-2">
                <label class="text-sm font-medium">object-src / embed-src</label>
                <span class="text-xs text-muted-foreground">插件/嵌入内容</span>
              </div>
              <div class="space-y-2">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" v-model="directives['object-src'].none" class="rounded">
                  <span class="text-sm">'none' (禁止插件)</span>
                </label>
              </div>
            </div>

            <!-- 其他指令 -->
            <div class="p-4 bg-muted rounded-lg">
              <div class="flex items-center justify-between mb-2">
                <label class="text-sm font-medium">其他指令</label>
              </div>
              <div class="space-y-2">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" v-model="directives.other.baseURI" class="rounded">
                  <span class="text-sm">base-uri (基础URI)</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" v-model="directives.other.formAction" class="rounded">
                  <span class="text-sm">form-action (表单提交)</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" v-model="directives.other.upgradeInsecureRequests" class="rounded">
                  <span class="text-sm">upgrade-insecure-requests (升级不安全请求)</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" v-model="directives.other.blockAllMixedContent" class="rounded">
                  <span class="text-sm">block-all-mixed-content (阻止混合内容)</span>
                </label>
              </div>
            </div>

            <!-- 快速预设 -->
            <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h3 class="text-sm font-medium mb-3">快速预设</h3>
              <div class="grid grid-cols-3 gap-2">
                <button
                  @click="applyPreset('strict')"
                  class="px-3 py-2 bg-background border rounded hover:bg-muted text-xs"
                >
                  严格模式
                </button>
                <button
                  @click="applyPreset('balanced')"
                  class="px-3 py-2 bg-background border rounded hover:bg-muted text-xs"
                >
                  平衡模式
                </button>
                <button
                  @click="applyPreset('development')"
                  class="px-3 py-2 bg-background border rounded hover:bg-muted text-xs"
                >
                  开发模式
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：生成的策略 -->
      <div class="space-y-4">
        <!-- HTTP头格式 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <Code class="w-5 h-5 text-green-500" />
            生成的CSP策略
          </h2>

          <div class="space-y-4">
            <!-- Meta标签格式 -->
            <div>
              <label class="text-sm font-medium mb-2 block">HTML Meta 标签</label>
              <div class="bg-muted rounded-lg p-4">
                <div class="flex items-start justify-between">
                  <code class="flex-1 text-xs break-all">{{ metaTag }}</code>
                  <button
                    @click="copyMeta"
                    class="p-1 hover:bg-background rounded transition-colors ml-2"
                    title="复制"
                  >
                    <Copy class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <!-- HTTP头格式 -->
            <div>
              <label class="text-sm font-medium mb-2 block">HTTP 响应头</label>
              <div class="bg-muted rounded-lg p-4">
                <div class="flex items-start justify-between">
                  <code class="flex-1 text-xs break-all whitespace-pre-wrap">{{ httpHeader }}</code>
                  <button
                    @click="copyHeader"
                    class="p-1 hover:bg-background rounded transition-colors ml-2"
                    title="复制"
                  >
                    <Copy class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <!-- Nuxt配置 -->
            <div>
              <label class="text-sm font-medium mb-2 block">Nuxt 3 配置</label>
              <div class="bg-muted rounded-lg p-4">
                <div class="flex items-start justify-between">
                  <pre class="flex-1 text-xs">{{ nuxtConfig }}</pre>
                  <button
                    @click="copyNuxt"
                    class="p-1 hover:bg-background rounded transition-colors ml-2"
                    title="复制"
                  >
                    <Copy class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <!-- 策略预览 -->
            <div>
              <label class="text-sm font-medium mb-2 block">策略解析预览</label>
              <div class="bg-muted rounded-lg p-4 text-xs space-y-2">
                <div v-for="(value, key) in parsedPolicy" :key="key" class="flex justify-between">
                  <span class="font-medium">{{ key }}:</span>
                  <span class="font-mono break-all ml-4">{{ value || '(未设置)' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 使用说明 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <BookOpen class="w-5 h-5 text-blue-500" />
            使用说明
          </h2>

          <div class="space-y-3 text-sm text-muted-foreground">
            <div>
              <p class="font-medium text-foreground mb-1">什么是CSP？</p>
              <p>Content Security Policy (CSP) 是HTTP响应头，用于控制浏览器可以加载哪些资源，是防止XSS和数据注入攻击的重要安全措施。</p>
            </div>

            <div>
              <p class="font-medium text-foreground mb-1">指令说明</p>
              <ul class="list-disc list-inside space-y-1 ml-2">
                <li><code class="text-xs">default-src</code> - 默认策略，所有其他指令的fallback</li>
                <li><code class="text-xs">script-src</code> - JavaScript脚本源</li>
                <li><code class="text-xs">style-src</code> - CSS样式源</li>
                <li><code class="text-xs">img-src</code> - 图片源</li>
                <li><code class="text-xs">connect-src</code> - AJAX、WebSocket连接</li>
                <li><code class="text-xs">font-src</code> - Web字体源</li>
                <li><code class="text-xs">frame-src</code> - iframe源</li>
                <li><code class="text-xs">media-src</code> - 音视频源</li>
              </ul>
            </div>

            <div>
              <p class="font-medium text-foreground mb-1">源值说明</p>
              <ul class="list-disc list-inside space-y-1 ml-2">
                <li><code class="text-xs">'self'</code> - 同源(相同域名、协议、端口)</li>
                <li><code class="text-xs">'none'</code> - 禁止加载</li>
                <li><code class="text-xs">'unsafe-inline'</code> - 允许内联脚本/样式</li>
                <li><code class="text-xs">'unsafe-eval'</code> - 允许eval()</li>
                <li><code class="text-xs">'data:'</code> - 允许data URI</li>
              </ul>
            </div>

            <div>
              <p class="font-medium text-foreground mb-1">实施建议</p>
              <ul class="list-disc list-inside space-y-1 ml-2">
                <li>从<code class="text-xs">'self'</code>开始，逐步添加需要的源</li>
                <li>使用<a href="#">Report-URI</a>收集违规报告</li>
                <li>在测试环境先启用report-only模式</li>
                <li>定期审查和更新CSP策略</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- 常见问题 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <HelpCircle class="w-5 h-5 text-orange-500" />
            常见问题
          </h2>

          <div class="space-y-3 text-sm">
            <div>
              <p class="font-medium text-foreground">为什么启用CSP后页面无法正常工作？</p>
              <p class="text-muted-foreground">CSP策略可能过于严格，检查浏览器控制台的CSP违规报告，添加缺失的源。</p>
            </div>

            <div>
              <p class="font-medium text-foreground">如何允许第三方脚本？</p>
              <p class="text-muted-foreground">在对应的src指令中添加第三方域名，如: <code class="text-xs">script-src 'self' https://cdn.example.com</code></p>
            </div>

            <div>
              <p class="font-medium text-foreground">inline脚本不工作了怎么办？</p>
              <p class="text-muted-foreground">避免使用内联脚本和样式，将代码移到外部文件，或使用nonce或hash。</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useSeoMeta, useHead } from '#app'
import {
  Shield,
  Code,
  Copy,
  BookOpen,
  HelpCircle
} from 'lucide-vue-next'

// CSP指令配置
const directives = ref({
  'default-src': {
    self: true,
    none: false,
    custom: ''
  },
  'script-src': {
    self: true,
    unsafeInline: false,
    unsafeEval: false,
    custom: ''
  },
  'style-src': {
    self: true,
    unsafeInline: false,
    custom: ''
  },
  'img-src': {
    self: true,
    data: true,
    https: false,
    custom: ''
  },
  'connect-src': {
    self: true,
    custom: ''
  },
  'font-src': {
    self: true,
    data: true,
    custom: ''
  },
  'frame-src': {
    self: false,
    none: true,
    custom: ''
  },
  'media-src': {
    self: true,
    custom: ''
  },
  'object-src': {
    none: true
  },
  'embed-src': {
    none: true
  },
  other: {
    baseURI: false,
    formAction: false,
    upgradeInsecureRequests: false,
    blockAllMixedContent: false
  }
})

// 生成CSP策略
const policy = computed(() => {
  const parts = []

  // default-src
  if (directives.value['default-src'].none) {
    parts.push("default-src 'none'")
  } else {
    const defaultSrc = buildDirective('default-src', directives.value['default-src'])
    if (defaultSrc) parts.push(defaultSrc)
  }

  // script-src
  const scriptSrc = buildDirective('script-src', directives.value['script-src'])
  if (scriptSrc) parts.push(scriptSrc)

  // style-src
  const styleSrc = buildDirective('style-src', directives.value['style-src'])
  if (styleSrc) parts.push(styleSrc)

  // img-src
  const imgSrc = buildDirective('img-src', directives.value['img-src'])
  if (imgSrc) parts.push(imgSrc)

  // connect-src
  const connectSrc = buildDirective('connect-src', directives.value['connect-src'])
  if (connectSrc) parts.push(connectSrc)

  // font-src
  const fontSrc = buildDirective('font-src', directives.value['font-src'])
  if (fontSrc) parts.push(fontSrc)

  // frame-src
  if (directives.value['frame-src'].none) {
    parts.push("frame-src 'none'; frame-ancestors 'none'")
  } else {
    const frameSrc = buildDirective('frame-src', directives.value['frame-src'])
    if (frameSrc) parts.push(frameSrc + "; frame-ancestors " + frameSrc)
  }

  // object-src & embed-src
  if (directives.value['object-src'].none) {
    parts.push("object-src 'none'; embed-src 'none'")
  }

  // media-src
  const mediaSrc = buildDirective('media-src', directives.value['media-src'])
  if (mediaSrc) parts.push(mediaSrc)

  // 其他指令
  if (directives.value.other.baseURI) parts.push("base-uri 'self'")
  if (directives.value.other.formAction) parts.push("form-action 'self'")
  if (directives.value.other.upgradeInsecureRequests) parts.push("upgrade-insecure-requests")
  if (directives.value.other.blockAllMixedContent) parts.push("block-all-mixed-content")

  return parts.join('; ')
})

// 构建单个指令
function buildDirective(name, config) {
  const sources = []

  if (config.self) sources.push("'self'")
  if (config.none) sources.push("'none'")
  if (config.unsafeInline) sources.push("'unsafe-inline'")
  if (config.unsafeEval) sources.push("'unsafe-eval'")
  if (config.data) sources.push("data:")
  if (config.https) sources.push("https:")
  if (config.custom) sources.push(config.custom)

  return sources.length > 0 ? `${name} ${sources.join(' ')}` : ''
}

// 格式化输出
const metaTag = computed(() => {
  return `<meta http-equiv="Content-Security-Policy" content="${policy.value}">`
})

const httpHeader = computed(() => {
  return `Content-Security-Policy: ${policy.value}`
})

const nuxtConfig = computed(() => {
  return `export default defineNuxtConfig({
  app: {
    head: {
      meta: [
        {
          'http-equiv': 'Content-Security-Policy',
          content: '${policy.value}'
        }
      ]
    }
  }
})`
})

// 解析的策略预览
const parsedPolicy = computed(() => {
  const result = {
    'default-src': [],
    'script-src': [],
    'style-src': [],
    'img-src': [],
    'connect-src': [],
    'font-src': [],
    'frame-src': [],
    'media-src': []
  }

  // 简化的解析逻辑
  const parts = policy.value.split(';').map(p => p.trim())
  parts.forEach(part => {
    const [directive, ...sources] = part.split(/\s+/)
    if (result[directive]) {
      result[directive] = sources.join(' ')
    }
  })

  return result
})

// 快速预设
function applyPreset(type) {
  // 重置所有配置
  Object.keys(directives.value).forEach(key => {
    if (key === 'other') {
      directives.value[key] = {
        baseURI: false,
        formAction: false,
        upgradeInsecureRequests: false,
        blockAllMixedContent: false
      }
    } else if (typeof directives.value[key] === 'object') {
      directives.value[key] = {
        self: false,
        none: false,
        unsafeInline: false,
        unsafeEval: false,
        data: false,
        https: false,
        custom: ''
      }
    }
  })

  switch (type) {
    case 'strict':
      directives.value['default-src'].self = true
      directives.value['script-src'].self = true
      directives.value['style-src'].self = true
      directives.value['img-src'] = { self: true, data: true, custom: '', https: false }
      directives.value['connect-src'].self = true
      directives.value['font-src'] = { self: true, data: true, custom: '' }
      directives.value['frame-src'] = { self: false, none: true, custom: '' }
      directives.value['media-src'].self = true
      directives.value.other.upgradeInsecureRequests = true
      break

    case 'balanced':
      directives.value['default-src'].self = true
      directives.value['script-src'] = { self: true, unsafeInline: true, unsafeEval: false, custom: '' }
      directives.value['style-src'] = { self: true, unsafeInline: true, custom: '' }
      directives.value['img-src'] = { self: true, data: true, custom: '' }
      directives.value['connect-src'].self = true
      directives.value['font-src'] = { self: true, data: true, custom: 'https://fonts.gstatic.com' }
      directives.value['frame-src'] = { self: false, none: true, custom: '' }
      directives.value['media-src'].self = true
      directives.value.other.upgradeInsecureRequests = true
      break

    case 'development':
      directives.value['default-src'].self = true
      directives.value['script-src'] = { self: true, unsafeInline: true, unsafeEval: true, custom: '' }
      directives.value['style-src'] = { self: true, unsafeInline: true, custom: '' }
      directives.value['img-src'] = { self: true, data: true, custom: '' }
      directives.value['connect-src'] = { self: true, custom: 'http://localhost:* https://localhost:*' }
      directives.value['font-src'] = { self: true, data: true, custom: '' }
      directives.value['frame-src'] = { self: true, custom: '' }
      directives.value['media-src'].self = true
      break
  }
}

// 复制功能
function copyMeta() {
  navigator.clipboard.writeText(metaTag.value)
}

function copyHeader() {
  navigator.clipboard.writeText(httpHeader.value)
}

function copyNuxt() {
  navigator.clipboard.writeText(nuxtConfig.value)
}

useSeoMeta({
  title: 'CSP策略生成器 - Content Security Policy配置工具',
  description: '免费在线CSP策略生成器，可视化配置Content-Security-Policy，生成HTTP头和meta标签，防止XSS攻击和数据注入。',
  keywords: ['csp', 'content security policy', 'xss防护', '安全头', 'http header', 'security header', 'web安全', 'content-security-policy']
})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('CSP策略生成器')
</script>
