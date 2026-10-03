<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Network class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">hosts片段生成器</h1>
          <p class="text-sm text-muted-foreground mt-1">本地域名映射与广告屏蔽 hosts 片段，一键生成复制</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        构建本地开发域名映射（如把 api.example.com 指到 127.0.0.1），或把广告域名列表转为 0.0.0.0 屏蔽片段。自动去重、校验域名格式，生成带注释的 hosts 文本供复制粘贴到系统 hosts 文件。浏览器无法直接修改系统文件，粘贴步骤见下方说明。
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 本地域名映射 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4 flex items-center">
          <MapPin class="w-5 h-5 mr-2 text-primary" /> 本地域名映射
        </h2>
        <div class="space-y-2 mb-3">
          <div v-for="(row, idx) in mappings" :key="idx" class="flex items-center gap-2">
            <input v-model="row.ip" type="text" placeholder="127.0.0.1"
              class="w-28 px-2.5 py-2 bg-background border border-input rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring" />
            <input v-model="row.domain" type="text" placeholder="dev.example.com"
              class="flex-1 px-2.5 py-2 bg-background border border-input rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring" />
            <button @click="mappings.splice(idx, 1)" class="p-2 text-muted-foreground hover:text-destructive transition-colors">
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>
        <button @click="mappings.push({ ip: '127.0.0.1', domain: '' })"
          class="w-full border border-dashed border-border rounded-lg py-2 text-sm text-muted-foreground hover:border-primary/50 hover:text-primary transition-all flex items-center justify-center gap-1.5">
          <Plus class="w-4 h-4" /> 添加映射
        </button>
      </div>

      <!-- 批量屏蔽 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4 flex items-center">
          <Shield class="w-5 h-5 mr-2 text-primary" /> 批量屏蔽域名
        </h2>
        <textarea
          v-model="blockInput"
          class="w-full h-40 px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-xs font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
          placeholder="每行一个域名，例如：&#10;ads.example.com&#10;tracker.example.net&#10;&#10;也可粘贴空白分隔的批量域名"
          spellcheck="false"
        ></textarea>
        <div class="flex items-center gap-3 mt-3">
          <label class="text-sm text-muted-foreground whitespace-nowrap">指向 IP</label>
          <select v-model="blockIp" class="px-3 py-2 bg-background border border-input rounded-lg text-sm">
            <option value="0.0.0.0">0.0.0.0（推荐，直接丢弃）</option>
            <option value="127.0.0.1">127.0.0.1</option>
          </select>
          <span class="text-xs text-muted-foreground">已识别 {{ blockDomains.length }} 个有效域名</span>
        </div>
      </div>
    </div>

    <!-- 输出 -->
    <div class="bg-card border border-border rounded-lg mb-8">
      <div class="flex items-center justify-between px-6 py-4 border-b border-border">
        <h2 class="text-lg font-semibold text-foreground flex items-center">
          <FileText class="w-5 h-5 mr-2 text-primary" /> hosts 片段（{{ outputLineCount }} 行）
        </h2>
        <div class="flex items-center gap-2">
          <label class="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
            <input type="checkbox" v-model="grouped" class="accent-primary" /> 去重合并
          </label>
          <button @click="copyOutput" :disabled="!outputText"
            class="bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground px-3 py-1.5 rounded text-sm transition-all flex items-center gap-1.5">
            <Copy class="w-3.5 h-3.5" /> 复制片段
          </button>
        </div>
      </div>
      <div class="p-6">
        <pre v-if="outputText" class="text-xs font-mono text-foreground bg-muted/30 rounded-lg p-4 max-h-96 overflow-auto whitespace-pre">{{ outputText }}</pre>
        <div v-else class="py-14 text-center">
          <Network class="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
          <p class="text-sm text-muted-foreground">添加映射或粘贴域名后，这里显示 hosts 片段</p>
        </div>
      </div>
    </div>

    <!-- 使用说明 -->
    <div class="bg-card border border-border rounded-lg p-6 mb-8">
      <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center">
        <Info class="w-4 h-4 mr-2 text-primary" /> 如何应用 hosts 片段
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-muted-foreground">
        <div class="bg-muted/50 rounded-lg p-3">
          <p class="text-foreground font-medium mb-1.5">macOS / Linux</p>
          <p class="leading-relaxed">1. <code class="font-mono">sudo nano /etc/hosts</code><br>2. 粘贴片段保存<br>3. 刷新缓存：<code class="font-mono">sudo dscacheutil -flushcache</code></p>
        </div>
        <div class="bg-muted/50 rounded-lg p-3">
          <p class="text-foreground font-medium mb-1.5">Windows</p>
          <p class="leading-relaxed">1. 以管理员打开记事本<br>2. 编辑 <code class="font-mono break-all">C:\Windows\System32\drivers\etc\hosts</code><br>3. 刷新缓存：<code class="font-mono">ipconfig /flushdns</code></p>
        </div>
        <div class="bg-muted/50 rounded-lg p-3">
          <p class="text-foreground font-medium mb-1.5">验证生效</p>
          <p class="leading-relaxed">终端执行 <code class="font-mono">ping 你的域名</code>，若返回映射的 IP 即生效；浏览器建议同时清空 DNS 缓存（chrome://net-internals/#dns）。</p>
        </div>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative">
      <button @click="toggleSeoContent" class="absolute top-4 right-4 text-muted-foreground hover:text-foreground" aria-label="展开或收起说明">
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于 hosts 文件</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>hosts 是操作系统里优先级最高的域名解析表：在 DNS 查询之前，系统会先查 hosts 文件。利用这一点可以实现本地开发域名映射（本地服务用真实域名调试，规避 Cookie/跨域问题）与广告域名屏蔽（把广告域名指向 0.0.0.0 直接丢弃请求）。</p>
          <h3 class="text-lg font-semibold text-foreground">典型应用场景</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>本地联调：把 api.example.com 指到 127.0.0.1，前端用真实域名调本地服务</li>
            <li>预发环境切换：把预发域名临时指到指定内网 IP</li>
            <li>屏蔽广告/追踪域名：配合公开的广告域名列表批量生成 0.0.0.0 片段</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">改了不生效？</span>浏览器有独立 DNS 缓存，Chrome 需在 chrome://net-internals/#dns 清空；系统层面按上方命令刷新。</li>
            <li><span class="text-foreground font-medium">域名格式校验规则？</span>支持字母数字、连字符与多级点号；通配符（*.example.com）hosts 不支持。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'hosts-generator'" :category="'network'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Network, MapPin, Shield, Trash2, Plus, FileText, Copy, Info, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

useSeoMeta({
  title: 'hosts片段生成器 - 本地域名映射与广告屏蔽hosts生成',
  description: '在线生成hosts文件片段，支持本地开发域名映射与批量广告域名屏蔽，自动去重校验域名格式，附各系统hosts文件路径与DNS刷新命令',
  keywords: 'hosts文件, hosts生成, 域名映射, 本地解析, 广告屏蔽hosts, hosts修改, dns优先级',
  author: 'Util工具箱',
  ogTitle: 'hosts片段生成器 - 有条工具',
  ogDescription: '本地域名映射与广告屏蔽 hosts 片段，一键生成复制',
  ogUrl: 'https://www.util.cn/tools/hosts-generator',
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'WebApplication', name: 'hosts片段生成器', url: 'https://www.util.cn/tools/hosts-generator', applicationCategory: 'DeveloperApplication', operatingSystem: 'Any', offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' }, featureList: ['本地域名映射', '批量域名屏蔽', '域名格式校验', '去重合并'] },
        { '@type': 'BreadcrumbList', itemListElement: [
          { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
          { '@type': 'ListItem', position: 2, name: '网络工具', item: 'https://www.util.cn/network/' },
          { '@type': 'ListItem', position: 3, name: 'hosts片段生成器', item: 'https://www.util.cn/tools/hosts-generator/' }
        ] }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'hosts-generator')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

// ---------- 状态 ----------
const mappings = ref([
  { ip: '127.0.0.1', domain: 'dev.example.com' }
])
const blockInput = ref('')
const blockIp = ref('0.0.0.0')
const grouped = ref(true)
const seoContentVisible = ref(true)

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const DOMAIN_RE = /^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i
const IP_RE = /^(\d{1,3}\.){3}\d{1,3}$/

const validMappings = computed(() => {
  return mappings.value
    .filter(m => m.domain.trim() && DOMAIN_RE.test(m.domain.trim()) && IP_RE.test(m.ip.trim()))
    .map(m => ({ ip: m.ip.trim(), domain: m.domain.trim().toLowerCase() }))
})

const blockDomains = computed(() => {
  const tokens = blockInput.value.split(/[\s,;]+/).map(s => s.trim().toLowerCase()).filter(Boolean)
  return [...new Set(tokens.filter(d => DOMAIN_RE.test(d)))]
})

const outputLineCount = computed(() => {
  const lines = []
  if (validMappings.value.length) lines.push(...validMappings.value)
  if (blockDomains.value.length) lines.push(...blockDomains.value.map(d => ({ ip: blockIp.value, domain: d })))
  return lines.length
})

const outputText = computed(() => {
  const sections = []
  if (validMappings.value.length) {
    const lines = validMappings.value.map(m => grouped.value
      ? `${m.ip.padEnd(16)} ${m.domain}`
      : `${m.ip} ${m.domain}`)
    sections.push('# ===== 本地域名映射 =====\n' + lines.join('\n'))
  }
  if (blockDomains.value.length) {
    const lines = blockDomains.value.map(d => grouped.value
      ? `${blockIp.value.padEnd(16)} ${d}`
      : `${blockIp.value} ${d}`)
    sections.push(`# ===== 屏蔽域名（${blockIp.value}）=====\n` + lines.join('\n'))
  }
  if (sections.length === 0) return ''
  const header = `# hosts 片段 - 由 Util.cn 有条工具生成\n# ${new Date().toLocaleString('zh-CN')}\n`
  return header + sections.join('\n\n') + '\n'
})

// ---------- 交互 ----------
const copyOutput = async () => {
  if (!outputText.value) return
  try {
    await navigator.clipboard.writeText(outputText.value)
    alert('hosts 片段已复制')
  } catch (err) {
    const ta = document.createElement('textarea')
    ta.value = outputText.value
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    alert('hosts 片段已复制')
  }
}
</script>
