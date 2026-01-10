<template>
  <div class="max-w-8xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">IPv6 地址转换器</h1>
      <p class="text-muted-foreground">在线 IPv6 地址格式转换、压缩展开、前缀计算和 IPv4 映射转换工具</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">输入 IPv6 地址</h2>
          <div class="flex gap-2">
            <button @click="clearInput" class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground">清空</button>
            <button @click="loadExample" class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground">示例</button>
          </div>
        </div>

        <textarea v-model="inputText" placeholder="2001:0db8:85a3:0000:0000:8a2e:0370:7334" class="w-full h-40 p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm bg-card"></textarea>

        <div class="bg-muted p-4 rounded-lg">
          <h3 class="font-medium text-sm mb-2">转换选项</h3>
          <div class="flex flex-wrap gap-2">
            <button v-for="option in options" :key="option.value" @click="selectedOption = option.value" :class="['px-3 py-2 text-sm rounded-lg border transition-colors', selectedOption === option.value ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted']">{{ option.label }}</button>
          </div>
        </div>

        <div v-if="selectedOption === 'prefix'" class="bg-muted p-4 rounded-lg">
          <h3 class="font-medium text-sm mb-2">前缀长度 (CIDR)</h3>
          <div class="flex gap-2 items-center">
            <input v-model.number="prefixLength" type="number" min="1" max="128" placeholder="例如: 64" class="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background">
            <span class="text-sm text-muted-foreground">/</span>
          </div>
        </div>
      </div>

      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">转换结果</h2>
          <button v-if="hasResults" @click="copyResults" class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground">{{ copied ? '已复制' : '复制全部' }}</button>
        </div>

        <div class="space-y-3">
          <div v-if="validation.isValid" class="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p class="text-sm font-medium text-green-800 dark:text-green-200">✓ 有效的 IPv6 地址</p>
          </div>

          <div v-if="validation.error" class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p class="text-sm font-medium text-red-800 dark:text-red-200">✗ {{ validation.error }}</p>
          </div>

          <div v-if="results.expanded" class="p-3 bg-muted rounded-lg">
            <div class="flex items-center justify-between mb-1">
              <p class="text-xs text-muted-foreground">完整格式 (展开):</p>
              <button @click="copyText(results.expanded)" class="px-2 py-1 text-xs text-muted-foreground hover:text-foreground">复制</button>
            </div>
            <code class="text-sm font-mono break-all">{{ results.expanded }}</code>
          </div>

          <div v-if="results.compressed" class="p-3 bg-muted rounded-lg">
            <div class="flex items-center justify-between mb-1">
              <p class="text-xs text-muted-foreground">压缩格式 (标准):</p>
              <button @click="copyText(results.compressed)" class="px-2 py-1 text-xs text-muted-foreground hover:text-foreground">复制</button>
            </div>
            <code class="text-sm font-mono break-all">{{ results.compressed }}</code>
          </div>

          <div v-if="prefixInfo.network" class="p-3 bg-muted rounded-lg">
            <p class="text-xs text-muted-foreground mb-2">前缀信息 (/{{ prefixLength }}):</p>
            <div class="space-y-1 text-sm font-mono">
              <p><span class="text-muted-foreground">网络前缀:</span> {{ prefixInfo.network }}</p>
              <p><span class="text-muted-foreground">起始地址:</span> {{ prefixInfo.start }}</p>
              <p><span class="text-muted-foreground">结束地址:</span> {{ prefixInfo.end }}</p>
              <p><span class="text-muted-foreground">地址总数:</span> {{ prefixInfo.total }}</p>
            </div>
          </div>

          <div v-if="results.ipv4Mapped" class="p-3 bg-muted rounded-lg">
            <div class="flex items-center justify-between mb-1">
              <p class="text-xs text-muted-foreground">IPv4 映射地址:</p>
              <button @click="copyText(results.ipv4Mapped)" class="px-2 py-1 text-xs text-muted-foreground hover:text-foreground">复制</button>
            </div>
            <code class="text-sm font-mono">{{ results.ipv4Mapped }}</code>
          </div>

          <div v-if="results.type" class="p-3 bg-muted rounded-lg">
            <p class="text-xs text-muted-foreground mb-1">地址类型:</p>
            <code class="text-sm">{{ results.type }}</code>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-8 p-6 bg-muted rounded-lg">
      <h3 class="text-lg font-semibold mb-4">关于 IPv6 地址转换</h3>
      <div class="space-y-4 text-sm text-muted-foreground">
        <div>
          <h4 class="font-medium text-foreground mb-2">IPv6 地址格式</h4>
          <ul class="list-disc list-inside space-y-1">
            <li><strong>完整格式:</strong> 8组4位十六进制数，用冒号分隔 (如 2001:0db8:85a3:0000:0000:8a2e:0370:7334)</li>
            <li><strong>压缩格式:</strong> 使用 :: 替代连续的零 (如 2001:db8:85a3::8a2e:370:7334)</li>
            <li><strong>前缀表示:</strong> 使用 CIDR 表示法 (如 2001:db8::/32)</li>
          </ul>
        </div>
        <div>
          <h4 class="font-medium text-foreground mb-2">常见 IPv6 地址类型</h4>
          <ul class="list-disc list-inside space-y-1">
            <li><strong>::1/128</strong> - 本地环回地址 (相当于 IPv4 的 127.0.0.1)</li>
            <li><strong>::/128</strong> - 未指定地址 (相当于 IPv4 的 0.0.0.0)</li>
            <li><strong>fe80::/10</strong> - 链路本地地址</li>
            <li><strong>fc00::/7</strong> - 唯一本地地址 (私有地址)</li>
            <li><strong>64:ff9b::/96</strong> - IPv4 翻译地址</li>
          </ul>
        </div>
        <div>
          <h4 class="font-medium text-foreground mb-2">使用场景</h4>
          <ul class="list-disc list-inside space-y-1">
            <li>网络配置和故障排查</li>
            <li>防火墙规则配置</li>
            <li>地址规划和分配</li>
            <li>日志分析和安全审计</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="mt-6 p-6 bg-muted rounded-lg">
      <h3 class="text-lg font-semibold mb-4">相关工具</h3>
      <div class="flex flex-wrap gap-2">
        <NuxtLink to="/tools/ip-address-convert" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">IP 地址转换</NuxtLink>
        <NuxtLink to="/tools/subnet-calculator" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">子网计算器</NuxtLink>
        <NuxtLink to="/tools/ip-info" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">IP 信息查询</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useSeoMeta } from '#app'

const inputText = ref('')
const selectedOption = ref('format')
const prefixLength = ref(64)
const copied = ref(false)

const options = [
  { value: 'format', label: '格式转换' },
  { value: 'prefix', label: '前缀计算' },
  { value: 'validate', label: '地址验证' },
  { value: 'ipv4map', label: 'IPv4 映射' }
]

const results = ref({
  expanded: '',
  compressed: '',
  ipv4Mapped: '',
  type: ''
})

const validation = ref({
  isValid: false,
  error: ''
})

const prefixInfo = ref({
  network: '',
  start: '',
  end: '',
  total: ''
})

const examples = [
  '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
  '2001:db8::1',
  'fe80::1',
  '::1',
  '2001:db8:85a3::8a2e:370:7334'
]
const currentExample = ref(0)

const hasResults = computed(() => {
  return results.value.expanded || results.value.compressed || results.value.ipv4Mapped || results.value.type
})

// IPv6 地址验证
const validateIPv6 = (ip) => {
  // 移除前缀部分
  const addr = ip.split('/')[0]

  // 检查基本格式
  const ipv6Pattern = /^([0-9a-fA-F]{0,4}:){0,7}[0-9a-fA-F]{0,4}$/
  if (!ipv6Pattern.test(addr)) {
    return { isValid: false, error: '无效的 IPv6 地址格式' }
  }

  // 检查 :: 只能出现一次
  const doubleColonMatches = (addr.match(/::/g) || []).length
  if (doubleColonMatches > 1) {
    return { isValid: false, error: ':: 只能出现一次' }
  }

  // 检查段数
  const segments = addr.split(':')
  const validSegments = segments.filter(s => s !== '')
  if (validSegments.length > 8) {
    return { isValid: false, error: '地址段数超过8个' }
  }

  // 检查每段是否为有效的十六进制
  for (const seg of validSegments) {
    if (seg.length > 4 || !/^[0-9a-fA-F]+$/.test(seg)) {
      return { isValid: false, error: `无效的地址段: ${seg}` }
    }
  }

  return { isValid: true, error: '' }
}

// 展开 IPv6 地址
const expandIPv6 = (ip) => {
  const addr = ip.split('/')[0]

  if (addr.includes('::')) {
    const parts = addr.split('::')
    const leftSegments = parts[0].split(':').filter(s => s !== '')
    const rightSegments = parts[1] ? parts[1].split(':').filter(s => s !== '') : []
    const missing = 8 - leftSegments.length - rightSegments.length

    const expanded = [
      ...leftSegments,
      ...Array(missing).fill('0000'),
      ...rightSegments
    ]

    return expanded.map(s => s.padStart(4, '0')).join(':')
  }

  return addr.split(':').map(s => s.padStart(4, '0')).join(':')
}

// 压缩 IPv6 地址
const compressIPv6 = (expanded) => {
  const segments = expanded.split(':')

  // 找到最长的连续零序列
  let maxZeroStart = -1
  let maxZeroLength = 0
  let currentZeroStart = -1
  let currentZeroLength = 0

  for (let i = 0; i < segments.length; i++) {
    if (segments[i] === '0000') {
      if (currentZeroStart === -1) {
        currentZeroStart = i
      }
      currentZeroLength++
    } else {
      if (currentZeroLength > maxZeroLength) {
        maxZeroStart = currentZeroStart
        maxZeroLength = currentZeroLength
      }
      currentZeroStart = -1
      currentZeroLength = 0
    }
  }

  if (currentZeroLength > maxZeroLength) {
    maxZeroStart = currentZeroStart
    maxZeroLength = currentZeroLength
  }

  // 构建压缩地址
  if (maxZeroLength >= 2) {
    const compressed = []
    for (let i = 0; i < segments.length; i++) {
      if (i === maxZeroStart) {
        compressed.push('')
        i += maxZeroLength - 1
      } else if (i !== maxZeroStart + maxZeroLength) {
        // 移除前导零
        compressed.push(segments[i].replace(/^0+(?!$)/, ''))
      }
    }
    return compressed.join(':').replace(':::', '::')
  }

  // 如果没有足够长的零序列，只压缩每段的前导零
  return segments.map(s => s.replace(/^0+(?!$)/, '')).join(':')
}

// 获取 IPv6 地址类型
const getIPv6Type = (expanded) => {
  if (expanded === '0000:0000:0000:0000:0000:0000:0000:0001') return '本地环回地址 (::1)'
  if (expanded === '0000:0000:0000:0000:0000:0000:0000:0000') return '未指定地址 (::)'

  const first16 = parseInt(expanded.substring(0, 4), 16)

  if ((first16 & 0xffc0) === 0xfe80) return '链路本地地址 (fe80::/10)'
  if ((first16 & 0xfe00) === 0xfc00) return '唯一本地地址 (fc00::/7)'
  if ((first16 & 0xff00) === 0xff00) return '组播地址 (ff00::/8)'
  if ((first16 & 0xffff) === 0x2001) {
    const next32 = parseInt(expanded.substring(5, 21).replace(/:/g, ''), 16)
    if ((next32 & 0xffffffff) === 0x0db8) return '文档用途地址 (2001:db8::/32)'
  }

  return '全球单播地址'
}

// IPv4 映射的 IPv6 地址
const getIPv4Mapped = (expanded) => {
  // 检查是否是 IPv4 映射地址 (::ffff:x.x.x.x)
  if (expanded.substring(0, 30) === '0000:0000:0000:0000:0000:ffff:') {
    const last32 = expanded.substring(30)
    const octets = [
      parseInt(last32.substring(0, 4), 16),
      parseInt(last32.substring(4, 8), 16),
      parseInt(last32.substring(8, 12), 16),
      parseInt(last32.substring(12, 16), 16)
    ]
    return `IPv4: ${octets.join('.')}`
  }

  return ''
}

// 计算前缀信息
const calculatePrefix = (expanded, prefixLen) => {
  if (!expanded) return { network: '', start: '', end: '', total: '' }

  // 将地址转为二进制
  const binary = expanded.split(':').map(seg =>
    parseInt(seg, 16).toString(2).padStart(16, '0')
  ).join('')

  // 计算网络部分和主机部分
  const networkBits = binary.substring(0, prefixLen)
  const hostBits = binary.substring(prefixLen)

  // 网络地址
  const networkBinary = networkBits + '0'.repeat(128 - prefixLen)
  const networkHex = []
  for (let i = 0; i < 128; i += 16) {
    networkHex.push(parseInt(networkBinary.substring(i, i + 16), 2).toString(16).padStart(4, '0'))
  }
  const network = networkHex.join(':')

  // 起始地址（网络地址）
  const start = compressIPv6(network)

  // 结束地址
  const endBinary = networkBits + '1'.repeat(128 - prefixLen)
  const endHex = []
  for (let i = 0; i < 128; i += 16) {
    endHex.push(parseInt(endBinary.substring(i, i + 16), 2).toString(16).padStart(4, '0'))
  }
  const end = compressIPv6(endHex.join(':'))

  // 地址总数
  const hostBitsCount = 128 - prefixLen
  let total
  if (hostBitsCount <= 80) {
    const value = BigInt(2) ** BigInt(hostBitsCount)
    total = value.toString()
  } else {
    total = '2^' + hostBitsCount
  }

  return {
    network: compressIPv6(network) + '/' + prefixLen,
    start,
    end,
    total
  }
}

watch([inputText, selectedOption, prefixLength], () => {
  const ip = inputText.value.trim()

  if (!ip) {
    results.value = { expanded: '', compressed: '', ipv4Mapped: '', type: '' }
    validation.value = { isValid: false, error: '' }
    prefixInfo.value = { network: '', start: '', end: '', total: '' }
    return
  }

  // 验证地址
  const valid = validateIPv6(ip)
  validation.value = valid

  if (!valid.isValid) {
    results.value = { expanded: '', compressed: '', ipv4Mapped: '', type: '' }
    prefixInfo.value = { network: '', start: '', end: '', total: '' }
    return
  }

  // 展开地址
  const expanded = expandIPv6(ip)
  results.value.expanded = expanded

  // 压缩地址
  const compressed = compressIPv6(expanded)
  results.value.compressed = compressed

  // 获取地址类型
  results.value.type = getIPv6Type(expanded)

  // IPv4 映射
  results.value.ipv4Mapped = getIPv4Mapped(expanded)

  // 前缀计算
  if (selectedOption.value === 'prefix') {
    const prefix = calculatePrefix(expanded, prefixLength.value)
    prefixInfo.value = prefix
  } else {
    prefixInfo.value = { network: '', start: '', end: '', total: '' }
  }
})

const clearInput = () => {
  inputText.value = ''
  results.value = { expanded: '', compressed: '', ipv4Mapped: '', type: '' }
  validation.value = { isValid: false, error: '' }
  prefixInfo.value = { network: '', start: '', end: '', total: '' }
}

const loadExample = () => {
  inputText.value = examples[currentExample.value]
  currentExample.value = (currentExample.value + 1) % examples.length
}

const copyText = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    copied.value = true
    setTimeout(() => copied.value = false, 2000)
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = text
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    copied.value = true
    setTimeout(() => copied.value = false, 2000)
  }
}

const copyResults = async () => {
  const allResults = [
    results.value.expanded && `完整格式: ${results.value.expanded}`,
    results.value.compressed && `压缩格式: ${results.value.compressed}`,
    results.value.ipv4Mapped && `IPv4 映射: ${results.value.ipv4Mapped}`,
    results.value.type && `地址类型: ${results.value.type}`,
    prefixInfo.value.network && `网络前缀: ${prefixInfo.value.network}`
  ].filter(Boolean).join('\n')

  await copyText(allResults)
}

// SEO 优化
useSeoMeta({
  title: 'IPv6地址转换器 - 在线IPv6格式转换工具',
  description: '免费在线IPv6地址转换工具，支持IPv6地址格式转换（压缩/展开）、前缀计算、地址验证和IPv4映射转换。适用于网络配置、防火墙规则和地址规划。',
  keywords: [
    'ipv6',
    'ipv6转换器',
    'ipv6地址压缩',
    'ipv6地址展开',
    'ipv6前缀计算',
    'ipv6验证',
    'cidr',
    '网络工具',
    '在线工具'
  ],
  ogTitle: 'IPv6地址转换器 - 在线IPv6格式转换工具',
  ogDescription: '支持IPv6地址格式转换、压缩展开、前缀计算和IPv4映射转换的专业网络工具',
  ogType: 'website'
})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('IPv6地址转换器')

// JSON-LD 结构化数据
useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'IPv6地址转换器',
        description: '在线IPv6地址格式转换工具，支持IPv6地址压缩展开、前缀计算、地址验证和IPv4映射转换',
        url: 'https://www.util.cn/tools/ipv6-address-converter',
        applicationCategory: 'UtilityApplication',
        operatingSystem: 'Any',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'CNY'
        },
        featureList: [
          'IPv6地址格式转换（压缩↔展开）',
          'IPv6前缀计算（CIDR）',
          'IPv6地址验证',
          'IPv4映射地址转换',
          '地址类型识别'
        ]
      })
    }
  ]
})
</script>
