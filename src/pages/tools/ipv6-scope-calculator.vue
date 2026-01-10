<template>
  <div class="max-w-8xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">IPv6 地址范围计算器</h1>
      <p class="text-muted-foreground">计算IPv6前缀范围、地址数量和网络规划，支持SLAAC和EUI-64</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="space-y-6">
        <!-- 前缀输入 -->
        <div class="bg-card border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">IPv6 前缀</h2>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">IPv6 地址/前缀</label>
              <input
                v-model="prefix"
                type="text"
                placeholder="2001:db8::/32"
                @input="calculateRange"
                class="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background font-mono"
              >
            </div>

            <div class="flex gap-2">
              <button @click="loadExample" class="px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors">
                示例
              </button>
              <button @click="clearInput" class="px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors">
                清空
              </button>
            </div>
          </div>
        </div>

        <!-- 计算结果 -->
        <div v-if="result" class="bg-card border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">计算结果</h2>

          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="p-3 bg-muted rounded-lg">
                <p class="text-xs text-muted-foreground mb-1">网络前缀</p>
                <code class="text-sm font-mono">{{ result.networkPrefix }}</code>
              </div>
              <div class="p-3 bg-muted rounded-lg">
                <p class="text-xs text-muted-foreground mb-1">前缀长度</p>
                <code class="text-sm font-mono">/{{ result.prefixLength }}</code>
              </div>
            </div>

            <div class="p-4 bg-muted rounded-lg">
              <p class="text-sm text-muted-foreground mb-2">地址范围</p>
              <div class="space-y-2 font-mono text-sm">
                <div>
                  <span class="text-muted-foreground">起始:</span>
                  <span class="ml-2">{{ result.startAddress }}</span>
                </div>
                <div>
                  <span class="text-muted-foreground">结束:</span>
                  <span class="ml-2">{{ result.endAddress }}</span>
                </div>
              </div>
            </div>

            <div class="p-4 bg-muted rounded-lg">
              <p class="text-sm text-muted-foreground mb-1">总地址数</p>
              <p class="text-lg font-bold">{{ result.totalAddresses }}</p>
            </div>

            <div class="p-4 bg-muted rounded-lg">
              <p class="text-sm text-muted-foreground mb-1">可用主机数</p>
              <p class="text-lg font-bold">{{ result.usableAddresses }}</p>
            </div>

            <div class="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p class="text-sm text-blue-800 dark:text-blue-200">
                <strong>掩码表示:</strong> {{ result.netmask }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-6">
        <!-- SLAAC计算 -->
        <div class="bg-card border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">SLAAC 地址生成</h2>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">前缀</label>
              <input
                v-model="slaac.prefix"
                type="text"
                placeholder="2001:db8::/64"
                class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background font-mono text-sm"
              >
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">MAC地址</label>
              <input
                v-model="slaac.mac"
                type="text"
                placeholder="00:11:22:33:44:55"
                @input="generateSLAAC"
                class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background font-mono text-sm"
              >
            </div>

            <div v-if="slaac.result" class="p-4 bg-muted rounded-lg">
              <p class="text-sm text-muted-foreground mb-1">SLAAC 地址 (EUI-64)</p>
              <code class="text-sm font-mono break-all">{{ slaac.result }}</code>
            </div>
          </div>
        </div>

        <!-- EUI-64转换 -->
        <div class="bg-card border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">EUI-64 转换</h2>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">MAC地址</label>
              <input
                v-model="eui64.mac"
                type="text"
                placeholder="00:11:22:33:44:55"
                @input="convertEUI64"
                class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background font-mono text-sm"
              >
            </div>

            <div v-if="eui64.result" class="space-y-2">
              <div class="p-3 bg-muted rounded-lg">
                <p class="text-xs text-muted-foreground mb-1">EUI-64 接口标识符</p>
                <code class="text-sm font-mono">{{ eui64.result }}</code>
              </div>
              <div class="p-3 bg-muted rounded-lg">
                <p class="text-xs text-muted-foreground mb-1">反转 EUI-64</p>
                <code class="text-sm font-mono">{{ eui64.inverted }}</code>
              </div>
            </div>
          </div>
        </div>

        <!-- 前缀规划 -->
        <div class="bg-card border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">子网划分</h2>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">父前缀</label>
              <input
                v-model="subnetting.parentPrefix"
                type="text"
                placeholder="2001:db8::/48"
                class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background font-mono text-sm"
              >
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">子网前缀长度</label>
              <input
                v-model.number="subnetting.subnetPrefixLength"
                type="number"
                min="49"
                max="128"
                placeholder="64"
                class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
              >
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">子网数量</label>
              <input
                v-model.number="subnetting.count"
                type="number"
                min="1"
                max="65536"
                placeholder="4"
                class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
              >
            </div>

            <button @click="generateSubnets" class="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
              生成子网
            </button>

            <div v-if="subnetting.results.length > 0" class="space-y-2">
              <div v-for="(subnet, index) in subnetting.results" :key="index" class="p-3 bg-muted rounded-lg">
                <p class="text-sm font-medium">子网 {{ index + 1 }}</p>
                <code class="text-xs font-mono">{{ subnet }}</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 相关工具 -->
    <div class="mt-8 p-6 bg-muted rounded-lg">
      <h3 class="text-lg font-semibold mb-4">相关工具</h3>
      <div class="flex flex-wrap gap-2">
        <NuxtLink to="/tools/ipv6-address-converter" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">IPv6地址转换器</NuxtLink>
        <NuxtLink to="/tools/subnet-calculator" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">子网计算器</NuxtLink>
        <NuxtLink to="/tools/ip-address-convert" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">IP地址转换</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useSeoMeta } from '#app'

const prefix = ref('')
const result = ref(null)

const slaac = ref({
  prefix: '2001:db8::/64',
  mac: '',
  result: ''
})

const eui64 = ref({
  mac: '',
  result: '',
  inverted: ''
})

const subnetting = ref({
  parentPrefix: '2001:db8::/48',
  subnetPrefixLength: 64,
  count: 4,
  results: []
})

const examples = [
  '2001:db8::/32',
  '2001:db8:1234::/48',
  'fe80::/10',
  'fc00::/7'
]
const currentExample = ref(0)

const calculateRange = () => {
  if (!prefix.value.trim()) {
    result.value = null
    return
  }

  try {
    const [addr, prefixLength] = prefix.value.split('/')
    const pl = parseInt(prefixLength) || 64

    // 简化计算（实际中需要完整的IPv6地址计算）
    const result_data = {
      networkPrefix: addr,
      prefixLength: pl,
      startAddress: expandIPv6(addr),
      endAddress: calculateEndAddress(addr, pl),
      totalAddresses: calculateTotalAddresses(pl),
      usableAddresses: calculateUsableAddresses(pl),
      netmask: calculateNetmask(pl)
    }

    result.value = result_data
  } catch (e) {
    console.error('计算失败:', e)
  }
}

const expandIPv6 = (addr) => {
  // 简化的IPv6展开
  return addr.replace('::', ':0000:').replace(/^:|:$/g, '')
}

const calculateEndAddress = (addr, pl) => {
  // 简化计算
  const parts = addr.split(':').filter(p => p)
  while (parts.length < 8) parts.push('0')

  const hostBits = 128 - pl
  const maxValue = BigInt(2) ** BigInt(hostBits) - 1n

  const parts_num = parts.map(p => parseInt(p || '0', 16))

  let value = 0n
  for (let i = 0; i < 8; i++) {
    value = (value << 16n) + BigInt(parts_num[i] || 0n)
  }

  const endValue = value | maxValue

  const endParts = []
  for (let i = 7; i >= 0; i--) {
    endParts.unshift(((endValue >> (BigInt(i) * 16n)) & 0xFFFFn).toString(16))
  }

  return endParts.join(':')
}

const calculateTotalAddresses = (pl) => {
  if (pl >= 128) return '1'
  const hostBits = 128 - pl
  if (hostBits > 80) {
    return `2^${hostBits}`
  }
  return (2n ** BigInt(hostBits)).toString()
}

const calculateUsableAddresses = (pl) => {
  const total = calculateTotalAddresses(pl)
  if (typeof total === 'string') return total
  if (total === '1') return '0'
  return (BigInt(total) - 2n).toString()
}

const calculateNetmask = (pl) => {
  const mask = []
  for (let i = 0; i < pl; i += 4) {
    const remaining = Math.min(4, pl - i)
    const value = (0xF << (4 - remaining)) & 0xF
    mask.push(value.toString(16))
  }
  while (mask.length < 32) mask.push('0')

  const groups = []
  for (let i = 0; i < 32; i += 4) {
    groups.push(mask.slice(i, i + 4).join(''))
  }

  return groups.join(':')
}

const generateSLAAC = () => {
  if (!slaac.value.mac) {
    slaac.value.result = ''
    return
  }

  const mac = slaac.value.mac.replace(/[:-]/g, '')
  if (mac.length !== 12) {
    slaac.value.result = '无效的MAC地址'
    return
  }

  const first = mac.substring(0, 6)
  const second = mac.substring(6, 12)
  const fffe = 'fffe'

  const interfaceId = first + fffe + second

  const prefixBase = slaac.value.prefix.split('/')[0]
  slaac.value.result = prefixBase + ':' + formatInterfaceId(interfaceId)
}

const formatInterfaceId = (id) => {
  let result = ''
  for (let i = 0; i < id.length; i += 4) {
    if (i > 0) result += ':'
    result += id.substring(i, i + 4)
  }
  return result
}

const convertEUI64 = () => {
  if (!eui64.value.mac) {
    eui64.value.result = ''
    eui64.value.inverted = ''
    return
  }

  const mac = eui64.value.mac.replace(/[:-]/g, '')
  if (mac.length !== 12) {
    eui64.value.result = '无效的MAC地址'
    return
  }

  const first = mac.substring(0, 6)
  const second = mac.substring(6, 12)
  const fffe = 'fffe'

  const interfaceId = first + fffe + second

  // 反转U/L位
  const inverted = interfaceId.split('')
  inverted[0] = (parseInt(inverted[0], 16) ^ 0x02).toString(16)

  eui64.value.result = formatInterfaceId(interfaceId)
  eui64.value.inverted = formatInterfaceId(inverted.join(''))
}

const generateSubnets = () => {
  if (!subnetting.value.parentPrefix) {
    alert('请输入父前缀')
    return
  }

  const parentParts = subnetting.value.parentPrefix.split('/')[0].split(':').filter(p => p)
  const parentPL = parseInt(subnetting.value.parentPrefix.split('/')[1])
  const subnetPL = subnetting.value.subnetPrefixLength
  const count = subnetting.value.count

  if (subnetPL <= parentPL) {
    alert('子网前缀长度必须大于父前缀长度')
    return
  }

  const subnets = []
  const maxSubnets = 2 ** (subnetPL - parentPL)

  for (let i = 0; i < Math.min(count, maxSubnets); i++) {
    const subnetValue = i.toString(16).padStart(4, '0')
    const subnetParts = [...parentParts]

    let remaining = subnetPL - parentParts.length * 16
    let pos = parentParts.length

    while (remaining > 0) {
      if (remaining >= 16) {
        subnetParts[pos] = '0'
        pos++
        remaining -= 16
      } else {
        subnetParts[pos] = subnetValue.substring(0, 4)
        break
      }
    }

    const result = subnetParts.join(':') + '::/' + subnetPL
    subnets.push(result)
  }

  subnetting.value.results = subnets
}

const loadExample = () => {
  prefix.value = examples[currentExample.value]
  currentExample.value = (currentExample.value + 1) % examples.length
  calculateRange()
}

const clearInput = () => {
  prefix.value = ''
  result.value = null
}

// SEO
useSeoMeta({
  title: 'IPv6地址范围计算器 - 在线IPv6子网规划',
  description: '免费在线IPv6地址范围计算器，支持IPv6前缀计算、子网划分、SLAAC地址生成和EUI-64转换。',
  keywords: [
    'ipv6计算器',
    'ipv6前缀',
    'ipv6范围',
    'ipv6子网',
    'slaac',
    'eui-64',
    'ipv6规划',
    'ipv6地址',
    '网络规划'
  ],
  ogTitle: 'IPv6地址范围计算器 - 在线IPv6子网规划',
  ogDescription: '计算IPv6前缀范围、子网划分和SLAAC地址生成',
  ogType: 'website'
})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('IPv6地址范围计算器')

// JSON-LD
useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'IPv6地址范围计算器',
        description: '在线IPv6地址范围计算器，支持前缀计算、子网划分、SLAAC和EUI-64',
        url: 'https://www.util.cn/tools/ipv6-scope-calculator',
        applicationCategory: 'UtilityApplication',
        operatingSystem: 'Any',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'CNY'
        },
        featureList: [
          'IPv6前缀计算',
          '地址范围计算',
          '子网划分',
          'SLAAC地址生成',
          'EUI-64转换',
          '接口标识符生成'
        ]
      })
    }
  ]
})
</script>
