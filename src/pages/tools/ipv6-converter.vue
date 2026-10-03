<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Globe class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">IPv6地址转换工具</h1>
          <p class="text-sm text-muted-foreground mt-1">IPv6 压缩 / 展开、v4 映射识别、反向解析名生成</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        输入任意合法写法的 IPv6 地址，即时获得完整展开形式、RFC 5952 推荐压缩形式、二进制视图、v4 映射识别与 PTR 反向解析域名。纯本地解析，适用于防火墙规则、DNS 配置与日志分析。
      </p>
    </div>

    <div class="space-y-6 mb-8">
      <div class="bg-card border border-border rounded-lg p-6">
        <div class="flex flex-col md:flex-row gap-3">
          <input
            v-model="input"
            type="text"
            placeholder="2001:db8::8a2e:370:7334 或 ::ffff:192.168.1.1"
            class="flex-1 px-4 py-3 bg-background border border-input rounded-lg text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            spellcheck="false"
          />
          <button
            @click="input = '2001:0db8:0000:0000:0000:8a2e:0370:7334'"
            class="bg-muted hover:bg-muted/80 text-muted-foreground px-3 py-2 rounded-lg text-xs font-mono transition-all whitespace-nowrap"
          >完整示例</button>
        </div>
        <p v-if="error" class="text-xs text-destructive mt-3">{{ error }}</p>
      </div>

      <div v-if="result" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <Info class="w-5 h-5 mr-2 text-primary" /> 转换结果
          </h2>
          <div class="space-y-2 text-sm">
            <div v-for="row in rows" :key="row.label" class="py-2 border-b border-border/50 last:border-0">
              <p class="text-muted-foreground text-xs mb-1">{{ row.label }}</p>
              <p class="font-mono text-foreground break-all">{{ row.value }}</p>
            </div>
          </div>
        </div>

        <div class="space-y-6">
          <div v-if="result.isV4Mapped" class="bg-card border border-blue-500/40 rounded-lg p-6">
            <h3 class="text-base font-semibold text-foreground mb-2 flex items-center">
              <CheckCircle class="w-4 h-4 mr-2 text-blue-500" /> IPv4 映射地址
            </h3>
            <p class="text-sm text-muted-foreground">该地址是 IPv4-mapped IPv6（::ffff:0:0/96），对应的 IPv4 地址为：</p>
            <p class="font-mono text-lg text-foreground mt-2">{{ result.embeddedV4 }}</p>
          </div>

          <div class="bg-card border border-border rounded-lg p-6">
            <h3 class="text-base font-semibold text-foreground mb-3">地址类型</h3>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="t in result.types"
                :key="t"
                class="text-xs px-2.5 py-1 rounded-full"
                :class="t.includes('公网') || t.includes('单播') ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'"
              >{{ t }}</span>
            </div>
            <div class="mt-4 text-xs text-muted-foreground leading-relaxed space-y-1.5">
              <p>• <span class="text-foreground">2000::/3</span> 全球单播（公网）</p>
              <p>• <span class="text-foreground">fc00::/7</span> ULA 私有地址，<span class="text-foreground">fe80::/10</span> 链路本地</p>
              <p>• <span class="text-foreground">::1</span> 回环，<span class="text-foreground">::</span> 未指定地址</p>
            </div>
          </div>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于 IPv6 地址表示</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>IPv6 地址为 128 位，标准写法是 8 组 4 位十六进制数。规则允许省略前导零，且整串零只能用一次双冒号（::）压缩——因此同一地址有多种写法，日志与防火墙配置中经常需要归一化处理。</p>
          <h3 class="text-lg font-semibold text-foreground">本工具能做什么</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>展开：把压缩写法还原为 8 组完整形式</li>
            <li>压缩：按 RFC 5952 生成最规范的短写法（最长零段压缩、小写）</li>
            <li>识别 ::ffff:x.x.x.x 形式的 IPv4 映射地址并提取 IPv4</li>
            <li>生成 ip6.arpa 反向解析域名（PTR 记录用）</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">:: 出现两次合法吗？</span>不合法，只能压缩一段连续零；工具会报错提示。</li>
            <li><span class="text-foreground font-medium">为什么要小写？</span>RFC 5952 推荐统一小写，避免日志比对时因大小写不一致误判。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'ipv6-converter'" :category="'network'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Globe, Info, CheckCircle, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

useSeoMeta({
  title: 'IPv6地址转换工具 - IPv6压缩展开与v4映射识别',
  description: '在线IPv6地址转换工具，支持IPv6完整展开、RFC5952压缩规范、IPv4映射地址识别、ip6.arpa反向解析域名生成，纯本地解析',
  keywords: 'ipv6转换, ipv6压缩, ipv6展开, ipv6格式化, ipv4映射, ip6.arpa, 反向解析',
  author: 'Util工具箱',
  ogTitle: 'IPv6地址转换工具 - 有条工具',
  ogDescription: 'IPv6 压缩 / 展开、v4 映射识别、反向解析名生成',
  ogUrl: 'https://www.util.cn/tools/ipv6-converter',
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'WebApplication', name: 'IPv6地址转换工具', url: 'https://www.util.cn/tools/ipv6-converter', applicationCategory: 'DeveloperApplication', operatingSystem: 'Any', offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' }, featureList: ['IPv6展开压缩', 'RFC5952规范', 'v4映射识别', 'PTR反向解析名'] },
        { '@type': 'BreadcrumbList', itemListElement: [
          { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
          { '@type': 'ListItem', position: 2, name: '网络工具', item: 'https://www.util.cn/network/' },
          { '@type': 'ListItem', position: 3, name: 'IPv6地址转换工具', item: 'https://www.util.cn/tools/ipv6-converter/' }
        ] }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'ipv6-converter')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

const input = ref('2001:db8::8a2e:370:7334')
const error = ref('')
const seoContentVisible = ref(true)

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- IPv6 解析为 8 组 16-bit ----------
const parseIPv6 = (str) => {
  let s = str.trim().toLowerCase()
  if (!s.includes(':')) return null

  // 内嵌 IPv4 尾部
  let v4 = null
  const v4Match = s.match(/^(.*:)(\d{1,3}(\.\d{1,3}){3})$/)
  if (v4Match) {
    const parts = v4Match[2].split('.').map(Number)
    if (parts.some(p => p > 255)) return null
    v4 = parts
    s = v4Match[1] + (((parts[0] << 8) | parts[1]).toString(16)) + ':' + (((parts[2] << 8) | parts[3]).toString(16))
  }

  if ((s.match(/::/g) || []).length > 1) return null

  let head = s, tail = []
  if (s.includes('::')) {
    const [h, t] = s.split('::')
    head = h
    tail = t ? t.split(':') : []
  }
  const headParts = head ? head.split(':').filter(Boolean) : []
  const groups = [...headParts, ...tail]

  if (groups.length > 8) return null
  for (const g of groups) {
    if (!/^[0-9a-f]{1,4}$/.test(g)) return null
  }

  let filled
  if (s.includes('::')) {
    const missing = 8 - groups.length
    if (missing < 0) return null
    filled = [...headParts, ...Array(missing).fill('0'), ...tail]
  } else {
    if (groups.length !== 8) return null
    filled = groups
  }

  return filled.map(g => parseInt(g, 16))
}

const groupHex = (g) => g.toString(16).padStart(4, '0')

// RFC 5952 压缩
const compress = (groups) => {
  // 找最长全零段（≥2 才压缩，取最左）
  let bestStart = -1, bestLen = 0, curStart = -1, curLen = 0
  groups.forEach((g, i) => {
    if (g === 0) {
      if (curStart === -1) { curStart = i; curLen = 1 } else curLen++
      if (curLen > bestLen) { bestLen = curLen; bestStart = curStart }
    } else {
      curStart = -1; curLen = 0
    }
  })

  const hex = groups.map(groupHex)
  if (bestLen < 2) return hex.join(':')

  const headPart = hex.slice(0, bestStart).join(':')
  const tailPart = hex.slice(bestStart + bestLen).join(':')
  return headPart + '::' + tailPart
}

const result = computed(() => {
  error.value = ''
  const raw = input.value.trim()
  if (!raw) return null
  const groups = parseIPv6(raw)
  if (!groups) {
    error.value = '无效的 IPv6 地址（检查是否出现多个 :: 或非法字符）'
    return null
  }

  const expanded = groups.map(groupHex).join(':')
  const compressed = compress(groups)
  const isV4Mapped = groups.slice(0, 5).every(g => g === 0) && groups[5] === 0xffff
  const embeddedV4 = isV4Mapped
    ? `${(groups[6] >> 8) & 255}.${groups[6] & 255}.${(groups[7] >> 8) & 255}.${groups[7] & 255}`
    : null

  const types = []
  const first = groups[0]
  if (groups.every(g => g === 0)) types.push('未指定地址 ::')
  else if (groups[0] === 0 && groups[1] === 0 && groups[2] === 0 && groups[3] === 0 && groups[4] === 0 && groups[5] === 0 && groups[6] === 0 && groups[7] === 1) types.push('回环地址 ::1')
  else {
    if ((first & 0xe000) === 0x2000) types.push('全球单播（公网）')
    if ((first & 0xfe00) === 0xfc00) types.push('ULA 私有地址 fc00::/7')
    if ((first & 0xffc0) === 0xfe80) types.push('链路本地 fe80::/10')
    if ((first & 0xff00) === 0xff00) types.push('组播 ff00::/8')
    if (isV4Mapped) types.push('IPv4 映射 ::ffff:0:0/96')
    if (types.length === 0) types.push('保留/特殊用途')
  }

  const nibbles = groups.flatMap(g => g.toString(16).padStart(4, '0').split(''))
  const ptr = [...nibbles].reverse().join('.') + '.ip6.arpa'

  return { expanded, compressed, isV4Mapped, embeddedV4, types, ptr, binary: groups.map(g => g.toString(2).padStart(16, '0')).join(' ').replace(/(.{16})(?=.)/g, '$1 ') }
})

const rows = computed(() => {
  const r = result.value
  if (!r) return []
  return [
    { label: '完整展开形式', value: r.expanded },
    { label: 'RFC 5952 推荐压缩', value: r.compressed },
    { label: 'PTR 反向解析域名', value: r.ptr },
    { label: '二进制（按 16 位分组）', value: r.binary }
  ]
})
</script>
