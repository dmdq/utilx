<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <FileText class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">Nginx日志速析</h1>
          <p class="text-sm text-muted-foreground mt-1">粘贴 access.log 本地解析：状态码分布 / Top IP / 热门 URL / 按小时流量一目了然</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        支持标准 combined 格式（<code class="font-mono text-xs">IP - - [日期] "方法 路径 协议" 状态 字节 "referer" "UA"</code>），正则做了容错：缺 referer、缺 UA、字节为 - 的行照样能解析核心字段，彻底解析不了的行计入「未解析」并可展开逐条查看。输出总量、状态码 2xx~5xx 占比条、Top10 来源 IP、Top10 请求 URL、按小时请求量柱状图与总流量。全程浏览器本地计算，日志不出机器。
      </p>
    </div>

    <!-- 概览卡片 -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-card border border-border rounded-lg p-4 text-center">
        <p class="text-xs text-muted-foreground mb-1">日志行数</p>
        <p class="text-2xl font-bold text-foreground">{{ stats.total }}</p>
      </div>
      <div class="bg-card border border-border rounded-lg p-4 text-center">
        <p class="text-xs text-muted-foreground mb-1">解析成功</p>
        <p class="text-2xl font-bold text-green-600 dark:text-green-400">{{ stats.entries.length }}</p>
      </div>
      <div class="bg-card border border-border rounded-lg p-4 text-center">
        <p class="text-xs text-muted-foreground mb-1">未解析</p>
        <p class="text-2xl font-bold" :class="stats.unparsed.length > 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'">{{ stats.unparsed.length }}</p>
      </div>
      <div class="bg-card border border-border rounded-lg p-4 text-center">
        <p class="text-xs text-muted-foreground mb-1">总流量</p>
        <p class="text-2xl font-bold text-primary">{{ fmtBytes(totalBytes) }}</p>
      </div>
    </div>

    <!-- 工具主体 -->
    <div class="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
      <!-- 输入 -->
      <div class="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-4">
        <h2 class="text-lg font-semibold text-foreground flex items-center">
          <Upload class="w-5 h-5 mr-2 text-primary" /> 粘贴 access.log
        </h2>
        <textarea
          v-model="logText"
          class="w-full h-[28rem] px-3 py-2.5 bg-background border border-input rounded-lg text-foreground text-xs font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
          placeholder="粘贴多行 Nginx access.log，例如：&#10;192.168.1.10 - - [10/Oct/2023:13:55:36 +0800] &quot;GET /index.html HTTP/1.1&quot; 200 612 &quot;-&quot; &quot;Mozilla/5.0 ...&quot;"
          spellcheck="false"
        ></textarea>
        <div class="flex gap-2">
          <button @click="fillSample" class="flex-1 bg-muted hover:bg-muted/80 text-muted-foreground py-2 rounded-lg text-sm transition-all">填入示例</button>
          <button @click="logText = ''" class="flex-1 bg-muted hover:bg-muted/80 text-muted-foreground py-2 rounded-lg text-sm transition-all">清空</button>
        </div>

        <!-- 未解析行 -->
        <div v-if="stats.unparsed.length > 0" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 rounded-lg p-3">
          <button @click="showUnparsed = !showUnparsed" class="w-full flex items-center justify-between text-sm text-red-700 dark:text-red-300 font-medium">
            <span>
              <AlertTriangle class="w-4 h-4 inline mr-1" />
              {{ stats.unparsed.length }} 行未能解析（不计入统计）
            </span>
            <ChevronDown v-if="!showUnparsed" class="w-4 h-4" />
            <ChevronUp v-else class="w-4 h-4" />
          </button>
          <div v-show="showUnparsed" class="mt-2 max-h-40 overflow-y-auto space-y-1">
            <p v-for="(u, ui) in stats.unparsed.slice(0, 50)" :key="ui" class="text-xs font-mono text-red-600 dark:text-red-400 break-all">
              第 {{ u.no }} 行：{{ u.line }}
            </p>
            <p v-if="stats.unparsed.length > 50" class="text-xs text-muted-foreground">……仅展示前 50 行</p>
          </div>
        </div>
      </div>

      <!-- 统计输出 -->
      <div class="lg:col-span-3 space-y-6">
        <!-- 状态码分布 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold text-foreground flex items-center mb-4">
            <BarChart3 class="w-5 h-5 mr-2 text-primary" /> 状态码分布
          </h2>
          <div v-if="stats.entries.length > 0" class="space-y-2.5">
            <div v-for="d in statusDist" :key="d.bucket" class="flex items-center gap-3">
              <span class="w-10 text-sm font-mono font-semibold" :class="d.textClass">{{ d.bucket }}</span>
              <div class="flex-1 h-5 bg-muted/60 rounded-full overflow-hidden">
                <div class="h-full rounded-full transition-all" :class="d.barClass" :style="{ width: d.pct + '%' }"></div>
              </div>
              <span class="w-28 text-right text-sm text-muted-foreground">{{ d.count }} 次 · {{ d.pct }}%</span>
            </div>
            <div class="flex flex-wrap gap-1.5 pt-2">
              <span v-for="c in statusCodes" :key="c.code" class="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground font-mono">{{ c.code }} × {{ c.count }}</span>
            </div>
          </div>
          <p v-else class="text-sm text-muted-foreground">暂无可解析的日志行</p>
        </div>

        <!-- Top IP / Top URL -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="bg-card border border-border rounded-lg p-6">
            <h2 class="text-lg font-semibold text-foreground flex items-center mb-3">
              <Globe class="w-5 h-5 mr-2 text-primary" /> Top10 IP
            </h2>
            <ol v-if="topIps.length > 0" class="space-y-1.5">
              <li v-for="(t, ti) in topIps" :key="t.key" class="flex items-center justify-between text-sm">
                <span class="font-mono text-foreground truncate mr-2">
                  <span class="text-muted-foreground mr-1">{{ ti + 1 }}.</span>{{ t.key }}
                </span>
                <span class="text-muted-foreground whitespace-nowrap">{{ t.count }} 次</span>
              </li>
            </ol>
            <p v-else class="text-sm text-muted-foreground">—</p>
          </div>
          <div class="bg-card border border-border rounded-lg p-6">
            <h2 class="text-lg font-semibold text-foreground flex items-center mb-3">
              <Link2 class="w-5 h-5 mr-2 text-primary" /> Top10 URL
            </h2>
            <ol v-if="topUrls.length > 0" class="space-y-1.5">
              <li v-for="(t, ti) in topUrls" :key="t.key" class="flex items-center justify-between text-sm">
                <span class="font-mono text-foreground truncate mr-2" :title="t.key">
                  <span class="text-muted-foreground mr-1">{{ ti + 1 }}.</span>{{ t.key }}
                </span>
                <span class="text-muted-foreground whitespace-nowrap">{{ t.count }} 次</span>
              </li>
            </ol>
            <p v-else class="text-sm text-muted-foreground">—</p>
          </div>
        </div>

        <!-- 按小时请求量 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold text-foreground flex items-center mb-4">
            <Clock class="w-5 h-5 mr-2 text-primary" /> 按小时请求量
          </h2>
          <div v-if="stats.entries.length > 0" class="flex items-end gap-1 h-32">
            <div v-for="h in hourBuckets" :key="h.hour" class="flex-1 flex flex-col items-center justify-end h-full" :title="String(h.hour).padStart(2, '0') + ':00 — ' + h.count + ' 次'">
              <span v-if="h.count > 0 && h.pct > 60" class="text-[10px] text-muted-foreground mb-0.5">{{ h.count }}</span>
              <div
                class="w-full bg-primary/70 hover:bg-primary rounded-t transition-colors"
                :style="{ height: h.count === 0 ? '2px' : Math.max(4, h.pct) + '%' }"
              ></div>
              <span v-if="h.hour % 3 === 0" class="text-[10px] text-muted-foreground mt-1">{{ String(h.hour).padStart(2, '0') }}</span>
              <span v-else class="mt-1 text-[10px] leading-none">&nbsp;</span>
            </div>
          </div>
          <p v-else class="text-sm text-muted-foreground">—</p>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于 Nginx 日志速析</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            线上排查最常做的事就是对着 access.log 数状态码、找刷接口的 IP、看哪个 URL 最热。与其 grep + awk 摆弄半天，不如把当天日志（或 <code class="font-mono">tail -n 5000 access.log</code> 的片段）直接粘进来：本工具用容错正则逐行提取 IP、时间、方法、路径、状态码与字节数，几秒钟给出分布图与榜单。
          </p>
          <h3 class="text-lg font-semibold text-foreground">combined 格式说明</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>Nginx 默认 <code class="font-mono">log_format combined</code>：远程IP - 认证用户 [时区时间] "请求行" 状态码 响应字节 "Referer" "User-Agent"，本工具即按此解析。</li>
            <li>字节数为 <code class="font-mono">-</code> 时按 0 处理；请求行只含方法、或 referer/UA 整体缺失（common 格式）也能解析核心字段。</li>
            <li>时间戳直接取日志内小时（含 <code class="font-mono">+0800</code> 之类偏移时以日志书写小时为准），按小时聚合不换算时区。</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">自定义 log_format 怎么办</h3>
          <p>
            若你的 nginx.conf 使用了自定义格式（如加入 <code class="font-mono">$request_time</code>、<code class="font-mono">$upstream_addr</code>、JSON escape 后的 <code class="font-mono">main</code> 格式），只要前五个字段（IP、identd、用户、[时间]、"请求行"）与状态码、字节仍然符合 <code class="font-mono">IP - - [time] "req" status bytes</code> 顺序，本工具就能解析并忽略尾部附加字段；若字段顺序被改动导致大量「未解析」，建议临时切回 combined 格式记录一份再分析。
          </p>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">日志会上传服务器吗？</span>不会。解析与统计全部在浏览器本地用 JavaScript 完成，页面不发起任何网络请求，适合含内网 IP、token 回调地址的敏感日志。</li>
            <li><span class="text-foreground font-medium">为什么部分行解析失败？</span>多行日志（UA 里含换行）、被 CDN/WAF 改写的格式、或带 gzip 前缀的二进制内容都可能不匹配正则；展开「未解析」列表即可逐条核对原文。</li>
            <li><span class="text-foreground font-medium">一次能粘多少行？</span>建议几万行以内；数据量过大时浏览器会卡顿，可先用 <code class="font-mono">tail -n 50000</code> 抽样，代表性通常已足够。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'nginx-log-analyzer'" :category="'dev'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  FileText, Upload, AlertTriangle, BarChart3, Globe, Link2, Clock,
  ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO
useSeoMeta({
  title: 'Nginx日志速析 - access.log在线分析状态码/TopIP/流量',
  description: '在线 Nginx 日志分析器，粘贴 access.log 即本地解析：状态码 2xx/3xx/4xx/5xx 分布、Top10 IP、Top10 URL、按小时请求量与总流量统计，支持 combined 格式容错解析，纯本地处理不上传',
  keywords: 'nginx日志分析, access.log解析, 状态码统计, top ip, 日志可视化, combined格式, 网站访问日志',
  author: 'Util工具箱',
  ogTitle: 'Nginx日志速析 - 有条工具',
  ogDescription: '粘贴 access.log 本地解析，状态码分布/Top IP/热门URL/流量一目了然',
  ogUrl: 'https://www.util.cn/tools/nginx-log-analyzer',
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
          name: 'Nginx日志速析',
          url: 'https://www.util.cn/tools/nginx-log-analyzer',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Any',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          featureList: ['combined 格式容错解析', '状态码分布占比条', 'Top10 IP/URL', '按小时请求量柱状图', '未解析行展开查看']
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
            { '@type': 'ListItem', position: 2, name: '开发工具', item: 'https://www.util.cn/dev/' },
            { '@type': 'ListItem', position: 3, name: 'Nginx日志速析', item: 'https://www.util.cn/tools/nginx-log-analyzer/' }
          ]
        },
        {
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: '日志会上传服务器吗？',
              acceptedAnswer: { '@type': 'Answer', text: '不会。解析与统计全部在浏览器本地完成，页面不发起任何网络请求，适合含内网 IP 与回调地址的敏感日志。' }
            },
            {
              '@type': 'Question',
              name: '为什么部分行解析失败？',
              acceptedAnswer: { '@type': 'Answer', text: '多行日志（UA 含换行）、被 CDN/WAF 改写的格式或字段顺序不同的自定义 log_format 都可能不匹配，展开未解析列表即可逐条核对。' }
            },
            {
              '@type': 'Question',
              name: '自定义 log_format 能解析吗？',
              acceptedAnswer: { '@type': 'Answer', text: '只要开头仍是「IP - 用户 [时间] "请求行" 状态 字节」顺序即可解析并忽略尾部附加字段；字段顺序被改动时建议临时切回 combined 格式。' }
            }
          ]
        }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'nginx-log-analyzer')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

/* ==== 纯函数（node 自测提取区）begin ==== */
// 解析单行 combined/common 日志，容错缺字段；失败返回 null
function parseNginxLine(line) {
  const s = String(line == null ? '' : line).trim()
  if (!s) return null
  const m = s.match(/^(\S+)\s+\S+\s+\S+\s+\[([^\]]*)\]\s+"([^"]*)"\s+(\d{3})\s+(\d+|-)/)
  if (!m) return null
  const reqParts = m[3].split(/\s+/)
  let referer = '-'
  let ua = '-'
  const rest = s.slice(m[0].length)
  const rm = rest.match(/^\s*"([^"]*)"(?:\s+"([^"]*)")?/)
  if (rm) {
    referer = rm[1] === undefined ? '-' : rm[1]
    ua = rm[2] === undefined ? '-' : rm[2]
  }
  return {
    ip: m[1],
    timeRaw: m[2],
    method: reqParts[0] || '-',
    path: reqParts[1] || '-',
    proto: reqParts[2] || '-',
    status: Number(m[4]),
    bytes: m[5] === '-' ? 0 : Number(m[5]),
    referer: referer || '-',
    ua: ua || '-'
  }
}

// 状态码归类
function statusBucket(code) {
  const c = Number(code)
  if (!Number.isFinite(c) || c < 100 || c > 599) return 'other'
  const first = Math.floor(c / 100)
  return first + 'xx'
}

// 从 "10/Oct/2023:13:55:36 +0800" 取小时；失败返回 null
function hourOf(timeRaw) {
  const m = String(timeRaw).match(/:(\d{2}):\d{2}:\d{2}/)
  return m ? Number(m[1]) : null
}

function fmtBytes(n) {
  let x = Number(n)
  if (!Number.isFinite(x) || x < 0) x = 0
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  while (x >= 1024 && i < units.length - 1) { x /= 1024; i++ }
  return (i === 0 ? x.toFixed(0) : x.toFixed(2)) + ' ' + units[i]
}

// Map -> [{key,count}] 取前 n
function topN(map, n) {
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))
    .slice(0, n)
    .map(e => ({ key: e[0], count: e[1] }))
}

function analyzeNginxLog(text) {
  const lines = String(text == null ? '' : text).split(/\r?\n/)
  const entries = []
  const unparsed = []
  let total = 0
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim()) continue
    total++
    const e = parseNginxLine(line)
    if (e) {
      e.no = i + 1
      entries.push(e)
    } else {
      unparsed.push({ no: i + 1, line: line.trim() })
    }
  }
  return { total, entries, unparsed }
}
/* ==== 纯函数（node 自测提取区）end ==== */

// ---------- 状态 ----------
const logText = ref('')
const showUnparsed = ref(false)
const seoContentVisible = ref(true)

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const stats = computed(() => analyzeNginxLog(logText.value))

const BUCKET_META = {
  '2xx': { bar: 'bg-green-500', text: 'text-green-600 dark:text-green-400' },
  '3xx': { bar: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400' },
  '4xx': { bar: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' },
  '5xx': { bar: 'bg-red-500', text: 'text-red-600 dark:text-red-400' },
  '1xx': { bar: 'bg-gray-400', text: 'text-muted-foreground' },
  'other': { bar: 'bg-gray-400', text: 'text-muted-foreground' }
}

const statusDist = computed(() => {
  const counts = {}
  for (const e of stats.value.entries) {
    const b = statusBucket(e.status)
    counts[b] = (counts[b] || 0) + 1
  }
  const total = stats.value.entries.length || 1
  return ['2xx', '3xx', '4xx', '5xx', '1xx', 'other']
    .filter(b => counts[b])
    .map(b => ({
      bucket: b,
      count: counts[b],
      pct: Math.round((counts[b] / total) * 1000) / 10,
      barClass: BUCKET_META[b].bar,
      textClass: BUCKET_META[b].text
    }))
})

const statusCodes = computed(() => {
  const m = new Map()
  for (const e of stats.value.entries) {
    const k = String(e.status)
    m.set(k, (m.get(k) || 0) + 1)
  }
  return topN(m, 20)
})

const topIps = computed(() => {
  const m = new Map()
  for (const e of stats.value.entries) m.set(e.ip, (m.get(e.ip) || 0) + 1)
  return topN(m, 10)
})

const topUrls = computed(() => {
  const m = new Map()
  for (const e of stats.value.entries) {
    if (e.path && e.path !== '-') m.set(e.path, (m.get(e.path) || 0) + 1)
  }
  return topN(m, 10)
})

const hourBuckets = computed(() => {
  const counts = new Array(24).fill(0)
  for (const e of stats.value.entries) {
    const h = hourOf(e.timeRaw)
    if (h !== null && h >= 0 && h < 24) counts[h]++
  }
  const max = Math.max(1, ...counts)
  return counts.map((c, i) => ({ hour: i, count: c, pct: Math.round((c / max) * 100) }))
})

const totalBytes = computed(() => {
  let sum = 0
  for (const e of stats.value.entries) sum += Number(e.bytes) || 0
  return sum
})

const fillSample = () => {
  logText.value = [
    '192.168.1.10 - - [10/Oct/2023:09:15:22 +0800] "GET /index.html HTTP/1.1" 200 6120 "https://www.google.com/" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/118.0"',
    '192.168.1.10 - - [10/Oct/2023:09:16:01 +0800] "GET /static/app.js HTTP/1.1" 200 82310 "-" "Mozilla/5.0 (Macintosh) Chrome/118.0"',
    '10.0.0.5 - admin [10/Oct/2023:09:20:13 +0800] "POST /api/login HTTP/1.0" 302 0 "https://example.com/login" "curl/8.1.2"',
    '203.0.113.77 - - [10/Oct/2023:10:01:44 +0800] "GET /admin/.env HTTP/1.1" 404 162 "-" "sqlmap/1.7"',
    '203.0.113.77 - - [10/Oct/2023:10:01:45 +0800] "GET /wp-login.php HTTP/1.1" 404 162 "-" "sqlmap/1.7"',
    '203.0.113.77 - - [10/Oct/2023:10:02:10 +0800] "GET /phpmyadmin/ HTTP/1.1" 403 153 "-" "python-requests/2.31"',
    '198.51.100.9 - - [10/Oct/2023:14:30:00 +0800] "GET /download/big.iso HTTP/1.1" 206 524288000 "https://example.com/dl" "aria2/1.36.0"',
    '192.168.1.21 - - [10/Oct/2023:14:31:02 +0800] "GET /api/orders?page=2 HTTP/1.1" 200 4213 "https://example.com/orders" "Mozilla/5.0 (iPhone) Safari/605"',
    '192.168.1.21 - - [10/Oct/2023:14:31:05 +0800] "GET /api/orders?page=3 HTTP/1.1" 200 4201 "https://example.com/orders" "Mozilla/5.0 (iPhone) Safari/605"',
    '10.0.0.9 - - [10/Oct/2023:23:59:59 +0800] "GET /health HTTP/1.1" 200 2',
    '10.0.0.9 - - [10/Oct/2023:23:59:58 +0800] "HEAD / HTTP/1.1" 500 - "internal-monitor" "kube-probe/1.28"',
    '这是一行完全不符合格式的内容',
    '192.168.1.10 - - [10/Oct/2023:09:17:30 +0800] "GET /favicon.ico HTTP/1.1" 404 0'
  ].join('\n')
}
</script>
