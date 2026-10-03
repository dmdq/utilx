<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Network class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">IP子网计算器</h1>
          <p class="text-sm text-muted-foreground mt-1">CIDR 解析、网段范围、可用主机数与子网划分</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        输入 CIDR（如 192.168.1.0/24）或 IP + 掩码位数，即时计算网络地址、广播地址、可用主机范围、掩码与通配符，并支持把网段按前缀长度或数量划分子网。纯位运算本地计算，常用于网络规划与防火墙配置。
      </p>
    </div>

    <div class="space-y-6 mb-8">
      <!-- 输入 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <div class="flex flex-col md:flex-row gap-3">
          <input
            v-model="input"
            type="text"
            placeholder="192.168.1.0/24 或 10.0.0.5/8"
            class="flex-1 px-4 py-3 bg-background border border-input rounded-lg text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            spellcheck="false"
          />
          <div class="flex gap-2">
            <button
              v-for="eg in ['192.168.1.0/24', '10.0.0.0/8', '172.16.4.23/20']"
              :key="eg"
              @click="input = eg"
              class="bg-muted hover:bg-muted/80 text-muted-foreground px-3 py-2 rounded-lg text-xs font-mono transition-all"
            >{{ eg }}</button>
          </div>
        </div>
        <p v-if="error" class="text-xs text-destructive mt-3">{{ error }}</p>
      </div>

      <!-- 结果 -->
      <div v-if="result" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <Info class="w-5 h-5 mr-2 text-primary" /> 网段信息
          </h2>
          <div class="space-y-2 text-sm">
            <div v-for="row in infoRows" :key="row.label" class="flex justify-between py-2 border-b border-border/50 last:border-0">
              <span class="text-muted-foreground">{{ row.label }}</span>
              <span class="font-mono text-foreground">{{ row.value }}</span>
            </div>
          </div>
          <div class="mt-4 flex flex-wrap gap-2">
            <span class="text-xs px-2 py-1 rounded-full" :class="result.isPrivate ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500'">
              {{ result.isPrivate ? '私有地址段' : '公网地址段' }}
            </span>
            <span class="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">可用主机 {{ result.usable.toLocaleString() }} 个</span>
          </div>
        </div>

        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <Binary class="w-5 h-5 mr-2 text-primary" /> 二进制视图
          </h2>
          <div class="space-y-2.5 text-xs font-mono">
            <div>
              <p class="text-muted-foreground mb-1">网络地址（{{ result.network }}）</p>
              <p class="text-foreground break-all">{{ result.networkBin }}</p>
            </div>
            <div>
              <p class="text-muted-foreground mb-1">子网掩码（{{ result.mask }}）</p>
              <p class="text-foreground break-all">{{ result.maskBin }}</p>
            </div>
            <div>
              <p class="text-muted-foreground mb-1">通配符（{{ result.wildcard }}）</p>
              <p class="text-foreground break-all">{{ result.wildcardBin }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 子网划分 -->
      <div v-if="result" class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4 flex items-center">
          <Scissors class="w-5 h-5 mr-2 text-primary" /> 子网划分
        </h2>
        <div class="flex flex-wrap items-center gap-3 mb-4">
          <label class="text-sm text-muted-foreground">按新前缀</label>
          <select v-model.number="splitPrefix" class="px-3 py-2 bg-background border border-input rounded-lg text-sm">
            <option v-for="p in prefixOptions" :key="p" :value="p">/{{ p }}（每个 {{ subnetsHostCount(p).toLocaleString() }} 可用主机）</option>
          </select>
          <span class="text-sm text-muted-foreground">共 {{ subnetCount.toLocaleString() }} 个子网，预览前 16 个：</span>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div v-for="sn in subnetPreview" :key="sn.cidr" class="flex items-center justify-between bg-muted/50 rounded-lg px-3.5 py-2">
            <span class="font-mono text-sm text-foreground">{{ sn.cidr }}</span>
            <span class="text-xs text-muted-foreground font-mono">{{ sn.range }}</span>
          </div>
        </div>
        <p v-if="subnetCount > 16" class="text-xs text-muted-foreground mt-3">仅显示前 16 个子网，完整清单请缩小划分比例。</p>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative">
      <button @click="toggleSeoContent" class="absolute top-4 right-4 text-muted-foreground hover:text-foreground" aria-label="展开或收起说明">
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>
      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4"><span class="text-primary mr-2">#</span>关于 CIDR 与子网划分</h2>
        <div class="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>CIDR（无类别域间路由）用「IP/前缀长度」表示一个网段，如 192.168.1.0/24 表示前 24 位是网络位、后 8 位是主机位，共 256 个地址（可用 254 个）。子网计算是网络规划、防火墙规则、K8s 网络配置的基础技能。</p>
          <h3 class="text-lg font-semibold text-foreground">常用前缀速记</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li>/24 = 256 个地址（254 可用），最常用的部门/网段粒度</li>
            <li>/16 = 65536 个地址，常用作 VPC 或园区网</li>
            <li>/30 = 4 个地址（2 可用），点对点链路经典配置</li>
            <li>/32 = 单个主机地址，常用于精确放行规则</li>
          </ul>
          <h3 class="text-lg font-semibold text-foreground">常见问题</h3>
          <ul class="list-disc pl-5 space-y-1.5">
            <li><span class="text-foreground font-medium">为什么可用主机要减 2？</span>网络地址（全 0 主机位）与广播地址（全 1 主机位）不可分配给设备。</li>
            <li><span class="text-foreground font-medium">输入非网络地址（如 172.16.4.23/20）可以吗？</span>可以，工具会自动对齐到所在网段的网络地址并标注。</li>
          </ul>
        </div>
      </div>
    </div>

    <RelatedTools :currentToolId="'ip-subnet-calculator'" :category="'network'" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import {
  Network, Info, Binary, Scissors, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { useSeoMeta } from '#app'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

useSeoMeta({
  title: 'IP子网计算器 - CIDR网段划分与掩码计算',
  description: '在线IP子网计算器，输入CIDR即时计算网络地址、广播地址、可用主机范围、子网掩码与通配符，支持子网划分预览，纯本地计算',
  keywords: '子网计算器, cidr计算, 子网掩码, 网段计算, ip地址计算, 网络规划, 划分子网',
  author: 'Util工具箱',
  ogTitle: 'IP子网计算器 - 有条工具',
  ogDescription: 'CIDR 解析、网段范围、可用主机数与子网划分',
  ogUrl: 'https://www.util.cn/tools/ip-subnet-calculator',
  ogType: 'website',
  twitterCard: 'summary_large_image'
})

useHead({
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'WebApplication', name: 'IP子网计算器', url: 'https://www.util.cn/tools/ip-subnet-calculator', applicationCategory: 'DeveloperApplication', operatingSystem: 'Any', offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' }, featureList: ['CIDR解析', '子网划分', '二进制视图', '私有地址识别'] },
        { '@type': 'BreadcrumbList', itemListElement: [
          { '@type': 'ListItem', position: 1, name: '首页', item: 'https://www.util.cn/' },
          { '@type': 'ListItem', position: 2, name: '网络工具', item: 'https://www.util.cn/network/' },
          { '@type': 'ListItem', position: 3, name: 'IP子网计算器', item: 'https://www.util.cn/tools/ip-subnet-calculator/' }
        ] }
      ]
    })
  }]
})

const tool = tools.find(t => t.id === 'ip-subnet-calculator')
onMounted(() => {
  if (tool) addRecentTool(tool.id)
})

const input = ref('192.168.1.0/24')
const error = ref('')
const splitPrefix = ref(25)
const seoContentVisible = ref(true)

const toggleSeoContent = () => { seoContentVisible.value = !seoContentVisible.value }

// ---------- IPv4 位运算 ----------
const ipToInt = (ip) => {
  const parts = ip.split('.')
  if (parts.length !== 4) return null
  let n = 0
  for (const p of parts) {
    const v = parseInt(p, 10)
    if (String(v) !== p || v < 0 || v > 255) return null
    n = n * 256 + v
  }
  return n >>> 0
}

const intToIp = (n) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.')
const toBin32 = (n) => ((n >>> 0).toString(2)).padStart(32, '0').replace(/(.{8})(?=.)/g, '$1.')

const result = computed(() => {
  error.value = ''
  const raw = input.value.trim()
  if (!raw) return null
  const m = raw.match(/^(\d{1,3}(?:\.\d{1,3}){3})(?:\/(\d{1,2}))?$/)
  if (!m) {
    error.value = '格式不正确，请使用如 192.168.1.0/24 的 CIDR 格式'
    return null
  }
  const ipInt = ipToInt(m[1])
  const prefix = m[2] !== undefined ? parseInt(m[2], 10) : 24
  if (ipInt === null || prefix < 0 || prefix > 32) {
    error.value = 'IP 或前缀长度超出范围'
    return null
  }

  const maskInt = prefix === 0 ? 0 : (0xFFFFFFFF << (32 - prefix)) >>> 0
  const networkInt = (ipInt & maskInt) >>> 0
  const broadcastInt = (networkInt | (~maskInt >>> 0)) >>> 0
  const hostBits = 32 - prefix
  const total = Math.pow(2, hostBits)
  const usable = hostBits === 0 ? 0 : total - 2
  const firstHost = hostBits === 0 ? networkInt : networkInt + 1
  const lastHost = hostBits === 0 ? networkInt : broadcastInt - 1

  // RFC1918 + 常见保留段
  const isPrivate =
    (ipInt >>> 24) === 10 ||
    ((ipInt >>> 20) & 0xFFF) === 0xAC1 || // 172.16.0.0/12
    ((ipInt >>> 16) & 0xFFFF) === 0xC0A8 || // 192.168.0.0/16
    (ipInt >>> 24) === 127

  return {
    input: raw,
    network: intToIp(networkInt),
    broadcast: intToIp(broadcastInt),
    mask: intToIp(maskInt),
    wildcard: intToIp(~maskInt >>> 0),
    firstHost: intToIp(firstHost),
    lastHost: intToIp(lastHost),
    total,
    usable,
    networkBin: toBin32(networkInt),
    maskBin: toBin32(maskInt),
    wildcardBin: toBin32(~maskInt >>> 0),
    isPrivate,
    prefix,
    networkInt
  }
})

const infoRows = computed(() => {
  const r = result.value
  if (!r) return []
  return [
    { label: '输入', value: r.input },
    { label: '网络地址', value: `${r.network}/${r.prefix}` },
    { label: '广播地址', value: r.broadcast },
    { label: '子网掩码', value: r.mask },
    { label: '通配符', value: r.wildcard },
    { label: '第一个可用主机', value: r.firstHost },
    { label: '最后一个可用主机', value: r.lastHost },
    { label: '总地址数', value: r.total.toLocaleString() }
  ]
})

// ---------- 子网划分 ----------
const prefixOptions = computed(() => {
  const r = result.value
  if (!r) return [25]
  return Array.from({ length: Math.min(32, r.prefix + 8) - Math.max(r.prefix + 1, 1) + 1 }, (_, i) => r.prefix + 1 + i)
})

watch(result, (r) => {
  if (r) splitPrefix.value = Math.min(r.prefix + 1, 32)
})

const subnetCount = computed(() => {
  const r = result.value
  if (!r) return 0
  const bits = splitPrefix.value - r.prefix
  return bits <= 0 || bits > 20 ? 0 : Math.pow(2, bits)
})

const subnetsHostCount = (p) => {
  const hostBits = 32 - p
  return hostBits === 0 ? 1 : Math.pow(2, hostBits) - 2
}

const subnetPreview = computed(() => {
  const r = result.value
  if (!r || subnetCount.value === 0) return []
  const block = Math.pow(2, 32 - splitPrefix.value)
  const list = []
  const n = Math.min(16, subnetCount.value)
  for (let i = 0; i < n; i++) {
    const start = (r.networkInt + i * block) >>> 0
    list.push({
      cidr: `${intToIp(start)}/${splitPrefix.value}`,
      range: `${intToIp(start + 1)} ~ ${intToIp((start + block - 2) >>> 0)}`
    })
  }
  return list
})
</script>
