<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Settings class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">MCP 配置生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">表单生成 Cursor / Claude Desktop / Claude Code 的 mcpServers 配置与路径说明</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        手写 MCP 服务器配置容易在 JSON 结构、文件路径上踩坑。本工具按表单生成三大客户端的配置 JSON：Cursor（<code class="px-1 bg-muted rounded text-sm">~/.cursor/mcp.json</code>）、Claude Desktop（<code class="px-1 bg-muted rounded text-sm">claude_desktop_config.json</code>）、Claude Code（项目根 <code class="px-1 bg-muted rounded text-sm">.mcp.json</code>，附等效命令行），支持 stdio / HTTP / SSE 三种传输类型。纯表单拼接、本地生成，不收集任何信息。
      </p>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- 左侧：表单 -->
      <div class="bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold flex items-center">
          <Settings class="w-5 h-5 mr-2 text-primary" /> 服务器信息
        </h2>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">服务器名称</label>
          <input
            v-model="serverName"
            type="text"
            class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="如 filesystem"
          >
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">传输类型</label>
          <div class="grid grid-cols-3 gap-1.5">
            <button
              v-for="t in TRANSPORTS"
              :key="t.value"
              @click="transport = t.value"
              :class="transport === t.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'"
              class="py-2 rounded-lg text-xs font-medium transition-all"
            >{{ t.label }}</button>
          </div>
        </div>

        <template v-if="transport === 'stdio'">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">启动命令</label>
            <input
              v-model="command"
              type="text"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="如 npx / uvx / node / python"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">参数（每行一个）</label>
            <textarea
              v-model="argsText"
              rows="4"
              spellcheck="false"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="-y&#10;@modelcontextprotocol/server-filesystem&#10;/tmp"
            ></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">环境变量（每行 KEY=value，可选）</label>
            <textarea
              v-model="envText"
              rows="3"
              spellcheck="false"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="API_KEY=sk-xxx&#10;NODE_ENV=production"
            ></textarea>
          </div>
        </template>

        <template v-else>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">服务器 URL</label>
            <input
              v-model="url"
              type="text"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="https://example.com/mcp"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">请求头（每行 Key: value 或 Key=value，可选）</label>
            <textarea
              v-model="headersText"
              rows="3"
              spellcheck="false"
              class="w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Authorization: Bearer sk-xxx"
            ></textarea>
          </div>
        </template>

        <div>
          <label class="block text-sm font-medium text-foreground mb-2">目标客户端（可多选）</label>
          <div class="space-y-2">
            <label
              v-for="(meta, key) in CLIENT_META"
              :key="key"
              class="flex items-start gap-2 p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <input
                v-model="selectedClients"
                type="checkbox"
                :value="key"
                class="mt-0.5 w-4 h-4 rounded border-border"
              >
              <span>
                <span class="text-sm font-medium text-foreground">{{ meta.label }}</span>
                <span class="block text-xs text-muted-foreground mt-0.5">{{ meta.file }}</span>
              </span>
            </label>
          </div>
        </div>
      </div>

      <!-- 右侧：输出 -->
      <div class="space-y-4">
        <div
          v-for="client in selectedClients"
          :key="client"
          class="bg-card border border-border rounded-lg p-5 space-y-3"
        >
          <div class="flex items-center justify-between">
            <h3 class="font-semibold text-foreground flex items-center gap-2">
              <Server class="w-4 h-4 text-primary" />
              {{ CLIENT_META[client].label }}
              <span class="text-xs font-normal text-muted-foreground">{{ CLIENT_META[client].file }}</span>
            </h3>
            <button
              @click="copyText(clientOutputs[client].json, client)"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-lg text-xs text-foreground transition-colors"
            >
              <Check v-if="copiedKey === client" class="w-3.5 h-3.5 text-green-600" />
              <Copy v-else class="w-3.5 h-3.5" />
              {{ copiedKey === client ? '已复制' : '复制 JSON' }}
            </button>
          </div>

          <div class="relative border border-border rounded-lg overflow-hidden">
            <pre class="overflow-auto p-4 bg-muted/30 text-xs font-mono leading-relaxed max-h-72"><code v-html="clientOutputs[client].html"></code></pre>
          </div>

          <p class="text-xs text-muted-foreground leading-relaxed">{{ CLIENT_META[client].pathDesc }}</p>
          <p class="text-xs text-muted-foreground leading-relaxed">{{ CLIENT_META[client].note }}</p>

          <div v-if="client === 'claude-code'" class="border border-border rounded-lg p-3">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Terminal class="w-3.5 h-3.5 text-primary" /> 等效命令行（claude mcp add）
              </span>
              <button
                @click="copyText(cliCommand, client + '-cli')"
                class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-muted hover:bg-muted/80 rounded text-xs text-foreground transition-colors"
              >
                <Check v-if="copiedKey === client + '-cli'" class="w-3 h-3 text-green-600" />
                <Copy v-else class="w-3 h-3" />
                {{ copiedKey === client + '-cli' ? '已复制' : '复制' }}
              </button>
            </div>
            <pre class="overflow-auto text-xs font-mono bg-muted/30 rounded p-2.5 text-foreground">{{ cliCommand }}</pre>
          </div>
        </div>

        <div
          v-if="!selectedClients.length"
          class="bg-card border border-dashed border-border rounded-lg p-10 text-center text-muted-foreground"
        >
          在左侧勾选目标客户端后，这里会生成对应配置
        </div>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        aria-label="展开或收起说明"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于 MCP 配置生成器</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            MCP（Model Context Protocol）是连接 AI 客户端与外部工具/数据源的开放协议。接入一个 MCP 服务器，本质上就是在客户端的配置文件里写一段正确的 JSON——但三个客户端的文件名、路径、字段细节各不相同，远程服务器（HTTP/SSE）的写法还随版本演进。本工具把差异封装成表单：填一次服务器信息，同时拿到三份配置与路径说明，全部在浏览器本地生成。
          </p>

          <h3 class="text-lg font-semibold text-foreground">三个客户端的配置文件在哪</h3>
          <p>
            Cursor 读取 <code class="px-1 bg-muted rounded">~/.cursor/mcp.json</code>（全局）或项目根 <code class="px-1 bg-muted rounded">.cursor/mcp.json</code>（项目级）；Claude Desktop 读取 macOS 的 <code class="px-1 bg-muted rounded">~/Library/Application Support/Claude/claude_desktop_config.json</code> 或 Windows 的 <code class="px-1 bg-muted rounded">%APPDATA%\Claude\claude_desktop_config.json</code>；Claude Code 支持项目根 <code class="px-1 bg-muted rounded">.mcp.json</code>（可提交仓库团队共享），也可以直接用 <code class="px-1 bg-muted rounded">claude mcp add</code> 命令行添加。三者的配置主体都是 <code class="px-1 bg-muted rounded">mcpServers</code> 对象。
          </p>

          <h3 class="text-lg font-semibold text-foreground">stdio 与 HTTP/SSE 的写法差异</h3>
          <p>
            stdio 类型由客户端负责拉起子进程，配置为 <code class="px-1 bg-muted rounded">command + args + env</code>，最常见的组合是 <code class="px-1 bg-muted rounded">npx -y 包名</code> 或 <code class="px-1 bg-muted rounded">uvx 包名</code>；HTTP/SSE 类型连接已运行的远程服务，配置为 <code class="px-1 bg-muted rounded">type + url</code>（Claude Code 还支持 headers 传鉴权）。远程类型的字段在不同客户端、不同版本间存在差异，生成结果中已注明「以官方文档为准」，接入前建议核对一遍。
          </p>

          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">生成的配置安全吗？</span>生成过程纯本地完成，环境变量里的 API Key 只在你的浏览器内拼进 JSON，不会上传。</li>
            <li><span class="text-foreground font-medium">改完配置不生效？</span>Cursor 需要重启或在设置里刷新 MCP；Claude Desktop 需要完全退出后重开；Claude Code 的 .mcp.json 在下次会话生效，或用 claude mcp list 检查。</li>
            <li><span class="text-foreground font-medium">npx 找不到命令？</span>Windows 下 command 建议写成 cmd /c npx，或直接指向 npx.cmd 的完整路径，args 保持不变。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'mcp-config-generator'" :category="'dev'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Settings, Server, Terminal, Copy, Check, ChevronUp, ChevronDown } from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: 'MCP 配置生成器 - Cursor / Claude Desktop / Claude Code 一键生成',
  description: '在线 MCP 配置生成器：表单填写服务器名称、stdio/HTTP/SSE 传输类型，一键生成 Cursor mcp.json、Claude Desktop claude_desktop_config.json 与 Claude Code .mcp.json 配置及等效命令行，纯本地生成',
  keywords: 'mcp配置生成, cursor mcp, claude mcp配置, mcp.json, mcp服务器配置, claude_desktop_config',
  author: 'Util工具箱',
  ogTitle: 'MCP 配置生成器 - 有条工具',
  ogDescription: '表单生成 Cursor / Claude Desktop / Claude Code 的 MCP 服务器配置 JSON 与路径',
  ogUrl: 'https://www.util.cn/tools/mcp-config-generator',
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

// JSON-LD 结构化数据
useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebApplication',
          name: 'MCP 配置生成器',
          url: 'https://www.util.cn/tools/mcp-config-generator',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['Cursor mcp.json 生成', 'Claude Desktop 配置生成', 'Claude Code .mcp.json 生成', 'claude mcp add 命令行', 'stdio/HTTP/SSE 三种传输', '配置路径说明']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '开发辅助', item: 'https://www.util.cn/dev/' },
            { '@type': 'ListItem', position: 3, name: 'MCP 配置生成器', item: 'https://www.util.cn/tools/mcp-config-generator/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'MCP 配置文件分别放在哪里？',
              acceptedAnswer: { '@type': 'Answer', text: 'Cursor 在 ~/.cursor/mcp.json，Claude Desktop 在 macOS 的 ~/Library/Application Support/Claude/ 或 Windows 的 %APPDATA%\\Claude\\ 下的 claude_desktop_config.json，Claude Code 在项目根 .mcp.json。' }
            },
            {
              '@type': 'Question',
              name: 'stdio 和 HTTP/SSE 配置有什么区别？',
              acceptedAnswer: { '@type': 'Answer', text: 'stdio 由客户端拉起子进程，配置 command + args + env；HTTP/SSE 连接远程服务，配置 type + url（部分客户端支持 headers 鉴权），字段细节以各客户端官方文档为准。' }
            },
            {
              '@type': 'Question',
              name: '填写的 API Key 会被上传吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。配置纯本地生成，环境变量与请求头里的密钥只在你的浏览器内拼进 JSON 文本，页面没有网络请求。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'mcp-config-generator')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ===== [PURE-START] 配置生成纯函数（可独立提取测试） =====
const CLIENT_META = {
  cursor: {
    label: 'Cursor',
    file: '~/.cursor/mcp.json',
    pathDesc: '全局配置：~/.cursor/mcp.json（Windows: %USERPROFILE%\\.cursor\\mcp.json）；也可在项目根放置 .cursor/mcp.json 仅对当前项目生效。修改后重启 Cursor 或在设置 → MCP 中刷新。',
    note: '注：远程服务器按 type: "http" / "sse" + url 的写法生成，具体字段以 Cursor 官方文档为准。'
  },
  'claude-desktop': {
    label: 'Claude Desktop',
    file: 'claude_desktop_config.json',
    pathDesc: 'macOS: ~/Library/Application Support/Claude/claude_desktop_config.json；Windows: %APPDATA%\\Claude\\claude_desktop_config.json。修改后需完全退出并重启 Claude。',
    note: '注：远程（HTTP/SSE）服务器的支持因客户端版本而异，具体字段以 Anthropic 官方文档为准。'
  },
  'claude-code': {
    label: 'Claude Code',
    file: '.mcp.json（项目根）',
    pathDesc: '项目根目录 .mcp.json（可提交仓库团队共享）；也可使用下方等效命令行添加（默认 local 作用域，仅当前项目当前用户可见）。',
    note: '注：远程服务器使用 type + url + headers 的写法，具体字段以 Claude Code 官方文档为准。'
  }
}

// 解析多行文本为非空行数组
function parseLines(text) {
  return String(text || '')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0)
}

// 解析 KEY=value 或 KEY: value 多行文本为对象
function parseKeyValueLines(text) {
  const out = {}
  for (const line of parseLines(text)) {
    const m = line.match(/^([^=:]+)[=:](.*)$/)
    if (m) {
      const key = m[1].trim()
      const val = m[2].trim()
      if (key) out[key] = val
    }
  }
  return out
}

// 构建单个 MCP 服务器的配置对象
function buildServerConfig(opts) {
  const transport = opts.transport || 'stdio'
  if (transport === 'stdio') {
    const conf = {}
    conf.command = opts.command || ''
    const args = opts.args || []
    if (args.length) conf.args = args
    if (opts.env && Object.keys(opts.env).length) conf.env = opts.env
    return conf
  }
  const conf = { type: transport, url: opts.url || '' }
  if (opts.headers && Object.keys(opts.headers).length) conf.headers = opts.headers
  return conf
}

// 生成 { mcpServers: {...} } 格式的配置 JSON 字符串
function buildConfigJson(serverName, serverConf) {
  const wrapper = { mcpServers: {} }
  wrapper.mcpServers[serverName || 'my-server'] = serverConf
  return JSON.stringify(wrapper, null, 2)
}

// shell 参数转义（含空格或特殊字符时加单引号）
function shellQuote(s) {
  const str = String(s)
  return /[\s"'`$\\]/.test(str) ? "'" + str.replace(/'/g, "'\\''") + "'" : str
}

// 生成 claude mcp add 等效命令行
function buildClaudeCodeCli(opts) {
  const transport = opts.transport || 'stdio'
  const parts = ['claude', 'mcp', 'add']
  if (transport !== 'stdio') parts.push('--transport', transport)
  parts.push(opts.name || 'my-server')
  if (opts.env) {
    for (const k of Object.keys(opts.env)) parts.push('--env', shellQuote(`${k}=${opts.env[k]}`))
  }
  if (opts.headers) {
    for (const k of Object.keys(opts.headers)) parts.push('--header', shellQuote(`${k}: ${opts.headers[k]}`))
  }
  if (transport === 'stdio') {
    parts.push('--')
    parts.push(shellQuote(opts.command || ''))
    for (const a of opts.args || []) parts.push(shellQuote(a))
  } else {
    parts.push(shellQuote(opts.url || ''))
  }
  return parts.join(' ')
}

// 轻量 JSON 着色（返回 HTML，内容已转义）
function highlightJsonHtml(jsonStr) {
  const esc = String(jsonStr)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  return esc.replace(
    /("(?:\\.|[^"\\])*")(\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g,
    (m, str, colon) => {
      if (str) {
        if (colon) return `<span class="text-sky-600 dark:text-sky-300">${str}</span>${colon}`
        return `<span class="text-emerald-600 dark:text-emerald-300">${str}</span>`
      }
      if (m === 'true' || m === 'false' || m === 'null') {
        return `<span class="text-purple-600 dark:text-purple-300">${m}</span>`
      }
      return `<span class="text-amber-600 dark:text-amber-300">${m}</span>`
    }
  )
}
// ===== [PURE-END] =====

// ---------- 状态 ----------
const serverName = ref('filesystem')
const transport = ref('stdio')
const command = ref('npx')
const argsText = ref('-y\n@modelcontextprotocol/server-filesystem\n/tmp')
const envText = ref('')
const url = ref('https://mcp.example.com/mcp')
const headersText = ref('')
const selectedClients = ref(['cursor', 'claude-desktop', 'claude-code'])
const copiedKey = ref('')
const seoContentVisible = ref(true)

const TRANSPORTS = [
  { value: 'stdio', label: 'stdio（本地进程）' },
  { value: 'http', label: 'HTTP（远程）' },
  { value: 'sse', label: 'SSE（远程）' }
]

const serverOptions = computed(() => ({
  name: serverName.value.trim(),
  transport: transport.value,
  command: command.value.trim(),
  args: parseLines(argsText.value),
  env: parseKeyValueLines(envText.value),
  url: url.value.trim(),
  headers: parseKeyValueLines(headersText.value)
}))

const clientOutputs = computed(() => {
  const out = {}
  const opts = serverOptions.value
  const conf = buildServerConfig(opts)
  const json = buildConfigJson(opts.name, conf)
  for (const client of Object.keys(CLIENT_META)) {
    out[client] = { json, html: highlightJsonHtml(json) }
  }
  return out
})

const cliCommand = computed(() => buildClaudeCodeCli(serverOptions.value))

let copyTimer = null
const copyText = async (text, key) => {
  try {
    await navigator.clipboard.writeText(text)
    copiedKey.value = key
    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => {
      copiedKey.value = ''
    }, 1500)
  } catch (e) {
    // 剪贴板不可用时静默失败
  }
}

const toggleSeoContent = () => {
  seoContentVisible.value = !seoContentVisible.value
}
</script>
