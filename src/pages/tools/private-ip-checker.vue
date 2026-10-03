<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Shield class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">私有IP检测器</h1>
          <p class="text-sm text-muted-foreground mt-1">判断 IP 属于私网 / 公网 / 保留段，附 NAT 说明</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        输入 IPv4 或 IPv6 地址，按 RFC 1918、RFC 4193 等标准判定其属于私有地址、链路本地、CGNAT、组播、回环还是公网地址，并给出对应的网络场景解释。纯规则匹配本地完成，适合排查「为什么连不上」「日志里这个 IP 是谁」类问题。
      </p>
    </div>

    <div class="space-y-6 mb-8">
      <div class="bg-card border border-border rounded-lg p-6">
        <div class="flex flex-col md:flex-row gap-3">
          <input
            v-model="input"
            type="text"
            placeholder="10.0.0.5 / 172.16.3.8 / 192.168.1.100 / fd00::1234"
            class="flex-1 px-4 py-3 bg-background border border-input rounded-lg text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            spellcheck="false"
          />
          <div class="flex gap-2 flex-wrap">
            <button v-for="eg in examples" :key="eg" @click="input = eg"
              class="bg-muted hover:bg-muted/80 text-muted-foreground px-3 py-2 rounded-lg text-xs font-mono transition-all">{{ eg }}</button>
          </div>
        </div>
        <p v-if="error" class="text-xs text-destructive mt-3">{{ error }}</p>
      </div>

      <div v-if="result" class="bg-card border rounded-lg p-6" :class="result.isPublic ? 'border-green-500/40' : 'border-border'">
        <div class="flex items-start gap-4">
          <div class="p-3 rounded-xl flex-shrink-0" :class="result.isPublic ? 'bg-green-500/10' : 'bg-primary/10'">
            <Globe v-if="result.isPublic" class="w-6 h-6 text-green-500" />
            <Home v-else class="w-6 h-6 text-primary" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2.5 flex-wrap mb-1.5">
              <h2 class="text-xl font-bold text-foreground">{{ result.verdict }}</h2>
              <span class="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{{ result.version === 6 ? 'IPv6' : 'IPv4' }}</span>
            </div>
            <p class="text-sm text-muted-foreground leading-relaxed">{{ result.explain }}</p>
            <p class="text-xs text-muted-foreground mt-2 font-mono">{{ result.matchedRange }}</p>
          </div>
        </div>
      </div>

      <!-- 常用保留段速查 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h3 class="text-base font-semibold text-foreground mb-4 flex items-center">
          <Info class="w-4 h-4 mr-2 text-primary" /> IPv4 保留段速查表
        </h3>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-xs text-muted-foreground border-b border-border">
                <th class="py-2 pr-4 font-medium">网段</th>
                <th class="py-2 pr-4 font-medium">名称</th>
                <th class="py-2 font-medium">说明</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border/50">
              <tr v-for="row in rangesTable" :key="row.range">
                <td class="py-2.5 pr-4 font-mono text-foreground whitespace-nowrap">{{ row.range }}</td>
                <td class="py-2.5 pr-4 text-foreground whitespace-nowrap">{{ row.name }}</td>
                <td class="py-2.5 text-muted-foreground">{{ row.desc }}</td>
              </tr>
            </tbody>
          </table>
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
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>公网 IP 与私有 IP 的区别</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>私有地址段（RFC 1918）专门留给内网使用，不会在公网路由：10.0.0.0/8、172.16.0.0/12、192.168.0.0/16。家里路由器分配的 192.168.x.x、公司内网的 10.x.x.x 都属此类，需经 NAT（网络地址转换）共享公网 IP 上网，因此「查到的本机 IP」和「网站看到的 IP」经常不同。</p>
          <h3 class="text-lg font-semibold text-foreground">什么场景需要这个检测</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>排查连通性：目标地址是 169.254.x.x 说明 DHCP 失败了</li>
            <li>看日志：100.64.x.x 是运营商 CGNAT，不是你被封了</li>
            <li>安全配置：确认防火墙规则针对的是私网还是公网段</li>
            <li>容器/K8s：判断 Service 网段规划是否与办公网冲突</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">为什么公网 IP 也会显示保留？</span>240.0.0.0/4、255.255.255.255 等按标准不可分配，虽然数学上在公网范围，实际是保留段。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'private-ip-checker'" :category="'network'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Shield, Globe, Home, Info, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

useSeoMeta({
  title: '私有IP检测器 - 判断IP是公网还是内网地址',
  description: '在线IP地址类型检测，判断IPv4/IPv6属于私有地址、公网、CGNAT、链路本地、回环还是保留段，附RFC标准与NAT说明，纯本地判定',
  keywords: '私有ip, 公网ip, ip类型检测, 内网地址, rfc1918, cgnat, nat, ip归属判断',
  author: 'Util工具箱',
  ogTitle: '私有IP检测器 - 有条工具',
  ogDescription: '判断 IP 属于私网 / 公网 / 保留段，附 NAT 说明',
  ogUrl: 'https://www.util.cn/tools/private-ip-checker',
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'WebApplication', name: '私有IP检测器', url: 'https://www.util.cn/tools/private-ip-checker', applicationCategory: 'DeveloperApplication', operatingSystem: 'Any', offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' }, featureList: ['IPv4/IPv6类型判定', 'RFC保留段识别', 'NAT场景说明'] },
        { '@type': 'BreadcrumbList', itemListElement: [
          { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
          { '@type': 'ListItem', position: 2, name: '网络工具', item: 'https://www.util.cn/network/' },
          { '@type': 'ListItem', position: 3, name: '私有IP检测器', item: 'https://www.util.cn/tools/private-ip-checker/' }
        ] }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'private-ip-checker')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

const examples = ['10.0.0.5', '172.20.1.8', '100.64.2.7', '169.254.3.2', 'fd00::1234', '8.8.8.8']
const input = ref('192.168.1.100')
const error = ref('')
const seoContentVisible = ref(true)

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

const rangesTable = [
  { range: '10.0.0.0/8', name: '私有（RFC 1918）', desc: '企业内网经典段' },
  { range: '172.16.0.0/12', name: '私有（RFC 1918）', desc: '中型内网、Docker 默认' },
  { range: '192.168.0.0/16', name: '私有（RFC 1918）', desc: '家用路由器默认段' },
  { range: '100.64.0.0/10', name: 'CGNAT（RFC 6598）', desc: '运营商级 NAT，手机流量常见' },
  { range: '169.254.0.0/16', name: '链路本地', desc: 'DHCP 失败时的自分配地址' },
  { range: '127.0.0.0/8', name: '回环', desc: '本机自身（localhost）' },
  { range: '224.0.0.0/4', name: '组播', desc: '多播流量，不可分配给主机' },
  { range: '240.0.0.0/4', name: '保留', desc: '实验与保留用途' },
  { range: '0.0.0.0/8', name: '本网络', desc: '代表未指定/默认路由' }
]

// ---------- 判定 ----------
const ipToInt = (ip) => {
  const parts = ip.split('.')
  if (parts.length !== 4) return null
  let n = 0
  for (const p of parts) {
    if (!/^\d{1,3}$/.test(p)) return null
    const v = parseInt(p, 10)
    if (v > 255) return null
    n = n * 256 + v
  }
  return n >>> 0
}

const inRange = (ipInt, cidr) => {
  const [base, bitsStr] = cidr.split('/')
  const bits = parseInt(bitsStr, 10)
  const baseInt = ipToInt(base)
  if (baseInt === null) return false
  const mask = bits === 0 ? 0 : (0xFFFFFFFF << (32 - bits)) >>> 0
  return ((ipInt & mask) >>> 0) === ((baseInt & mask) >>> 0)
}

const V4_RULES = [
  { range: '0.0.0.0/8', name: '本网络段', public: false, explain: '0.x.x.x 用作默认路由与未指定地址，不会分配给真实设备。' },
  { range: '10.0.0.0/8', name: '私有地址（RFC 1918）', public: false, explain: '这是内网私有地址，通常出现在企业网络中，经过 NAT 后才能访问公网。' },
  { range: '100.64.0.0/10', name: '运营商级 CGNAT（RFC 6598）', public: false, explain: '这是运营商 NAT 段：你与公网之间隔了运营商的地址转换，同一 IP 可能被大量用户共享。' },
  { range: '127.0.0.0/8', name: '回环地址（localhost）', public: false, explain: '这是本机回环地址，流量不会离开设备。' },
  { range: '169.254.0.0/16', name: '链路本地地址', public: false, explain: '这是 DHCP 失败后的自动配置地址——出现它通常说明没拿到有效 IP，请检查 DHCP 或网线。' },
  { range: '172.16.0.0/12', name: '私有地址（RFC 1918）', public: false, explain: '这是内网私有地址，常见于中型企业网络与容器网络（Docker 默认 172.17.x.x）。' },
  { range: '192.168.0.0/16', name: '私有地址（RFC 1918）', public: false, explain: '这是家用路由器最常用的私有网段，仅在内网有效，公网无法直接访问。' },
  { range: '224.0.0.0/4', name: '组播地址', public: false, explain: '这是组播（多播）地址段，用于一对多传输，不能分配给单台主机。' },
  { range: '240.0.0.0/4', name: '保留地址段', public: false, explain: '这是 IANA 保留段（含广播地址 255.255.255.255），不可在公网使用。' },
  { range: '192.0.2.0/24', name: '文档示例段（TEST-NET-1）', public: false, explain: '这是专门留给文档示例的地址段，不会出现在真实网络中。' },
  { range: '198.51.100.0/24', name: '文档示例段（TEST-NET-2）', public: false, explain: '这是专门留给文档示例的地址段。' },
  { range: '203.0.113.0/24', name: '文档示例段（TEST-NET-3）', public: false, explain: '这是专门留给文档示例的地址段。' },
  { range: '198.18.0.0/15', name: '基准测试保留段', public: false, explain: '这是网络设备性能测试保留段。' }
]

const parseIPv6Groups = (str) => {
  let s = str.trim().toLowerCase()
  if (!s.includes(':')) return null
  const v4Match = s.match(/^(.*:)(\d{1,3}(\.\d{1,3}){3})$/)
  if (v4Match) {
    const parts = v4Match[2].split('.').map(Number)
    if (parts.some(p => p > 255)) return null
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
  if (groups.length > 8 || groups.some(g => !/^[0-9a-f]{1,4}$/.test(g))) return null
  const missing = 8 - groups.length
  return [...headParts, ...Array(Math.max(0, missing)).fill('0'), ...tail].map(g => parseInt(g, 16))
}

const result = computed(() => {
  error.value = ''
  const raw = input.value.trim()
  if (!raw) return null

  // IPv4
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(raw)) {
    const n = ipToInt(raw)
    if (n === null) {
      error.value = '无效的 IPv4 地址'
      return null
    }
    for (const rule of V4_RULES) {
      if (inRange(n, rule.range)) {
        return { version: 4, verdict: rule.name, explain: rule.explain, matchedRange: `匹配范围：${rule.range}`, isPublic: false }
      }
    }
    return {
      version: 4,
      verdict: '公网地址',
      explain: '这是可在互联网路由的公网地址。若这是你查到的"本机 IP"，说明它经过了 NAT 转换，属于出口 IP。',
      matchedRange: '不属于任何保留/私有段（unicast global）',
      isPublic: true
    }
  }

  // IPv6
  const groups = parseIPv6Groups(raw)
  if (!groups) {
    error.value = '无效的 IP 地址（既不是合法 IPv4 也不是 IPv6）'
    return null
  }
  const first = groups[0]
  let verdict, explain, matchedRange, isPublic = false
  if (groups.every(g => g === 0)) {
    verdict = '未指定地址 ::'
    explain = '全零地址表示"没有地址"，用于特殊协议场景（如 DHCPv6 初始请求）。'
    matchedRange = '::/128'
  } else if (groups[7] === 1 && groups.slice(0, 7).every(g => g === 0)) {
    verdict = '回环地址 ::1'
    explain = 'IPv6 的 localhost，流量不会离开本机。'
    matchedRange = '::1/128'
  } else if ((first & 0xffc0) === 0xfe80) {
    verdict = '链路本地地址 fe80::/10'
    explain = '链路本地地址由设备自动生成，仅同一物理链路内有效，路由器不会转发。'
    matchedRange = 'fe80::/10'
  } else if ((first & 0xfe00) === 0xfc00) {
    verdict = 'ULA 私有地址 fc00::/7'
    explain = 'IPv6 的"私网地址"（Unique Local Address），类似 IPv4 的 192.168.x.x，仅内网路由。'
    matchedRange = 'fc00::/7'
  } else if ((first & 0xff00) === 0xff00) {
    verdict = '组播地址 ff00::/8'
    explain = 'IPv6 组播段，用于一对多分发，不分配给单台设备。'
    matchedRange = 'ff00::/8'
  } else if (groups.slice(0, 5).every(g => g === 0) && groups[5] === 0xffff) {
    verdict = 'IPv4 映射地址 ::ffff:0:0/96'
    explain = '用于在 IPv6 结构中表示 IPv4 地址，常见于双栈服务的日志中。'
    matchedRange = '::ffff:0:0/96'
  } else if ((first & 0xe000) === 0x2000) {
    verdict = '全球单播（公网）'
    explain = '这是可全球路由的 IPv6 公网地址（2000::/3）。'
    matchedRange = '2000::/3'
    isPublic = true
  } else {
    verdict = '保留/特殊地址'
    explain = '该地址属于 IANA 保留或特殊用途范围。'
    matchedRange = '其他保留段'
  }
  return { version: 6, verdict, explain, matchedRange, isPublic }
})
</script>
