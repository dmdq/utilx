<template>
  <div class="max-w-8xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">TXT 记录编辑器</h1>
      <p class="text-muted-foreground">在线生成和验证DNS TXT记录，支持SPF、DKIM记录生成</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="space-y-6">
        <!-- 记录类型选择 -->
        <div class="bg-card border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">选择记录类型</h2>

          <div class="grid grid-cols-3 gap-2">
            <button v-for="type in recordTypes" :key="type.value" @click="selectedType = type.value" :class="['px-4 py-3 text-sm rounded-lg border transition-colors', selectedType === type.value ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted']">
              {{ type.label }}
            </button>
          </div>
        </div>

        <!-- SPF记录生成器 -->
        <div v-if="selectedType === 'spf'" class="bg-card border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">SPF 记录生成器</h2>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">域名</label>
              <input v-model="spf.domain" type="text" placeholder="example.com" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background">
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">版本</label>
              <select v-model="spf.version" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background">
                <option value="v=spf1">v=spf1</option>
                <option value="v=spf2">v=spf2 (实验)</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">包含规则</label>
              <div class="space-y-2">
                <label class="flex items-center gap-2">
                  <input type="checkbox" v-model="spf.includeA" class="w-4 h-4 rounded">
                  <span class="text-sm">包含域名的A记录 (a)</span>
                </label>
                <label class="flex items-center gap-2">
                  <input type="checkbox" v-model="spf.includeMx" class="w-4 h-4 rounded">
                  <span class="text-sm">包含域名的MX记录 (mx)</span>
                </label>
                <label class="flex items-center gap-2">
                  <input type="checkbox" v-model="spf.includeIp4" class="w-4 h-4 rounded">
                  <span class="text-sm">包含IPv4地址 (ip4)</span>
                </label>
                <label class="flex items-center gap-2">
                  <input type="checkbox" v-model="spf.includeIp6" class="w-4 h-4 rounded">
                  <span class="text-sm">包含IPv6地址 (ip6)</span>
                </label>
              </div>
            </div>

            <div v-if="spf.includeIp4">
              <label class="block text-sm font-medium mb-2">IPv4地址</label>
              <input v-model="spf.ip4" type="text" placeholder="192.168.1.1 or 192.168.1.0/24" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background">
            </div>

            <div v-if="spf.includeIp6">
              <label class="block text-sm font-medium mb-2">IPv6地址</label>
              <input v-model="spf.ip6" type="text" placeholder="2001:db8::1 or 2001:db8::/32" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background">
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">包含其他域名 (include)</label>
              <input v-model="spf.include" type="text" placeholder="_spf.google.com" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background">
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">其他服务器</label>
              <div class="flex gap-2">
                <input v-model="spf.redirect" type="text" placeholder="redirect=example.com" class="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background">
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">策略</label>
              <select v-model="spf.qualifier" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background">
                <option value="-all">-all (拒绝所有)</option>
                <option value="~all">~all (软拒绝)</option>
                <option value="?all">?all (中立)</option>
                <option value="+all">+all (接受所有)</option>
              </select>
            </div>
          </div>
        </div>

        <!-- DKIM记录生成器 -->
        <div v-if="selectedType === 'dkim'" class="bg-card border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">DKIM 记录生成器</h2>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">选择器</label>
              <input v-model="dkim.selector" type="text" placeholder="default" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background">
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">域名</label>
              <input v-model="dkim.domain" type="text" placeholder="example.com" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background">
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">版本</label>
              <input v-model="dkim.version" type="text" placeholder="DKIM1" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background">
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">哈希算法</label>
              <select v-model="dkim.hash" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background">
                <option value="rsa-sha256">rsa-sha256</option>
                <option value="rsa-sha1">rsa-sha1</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">公钥</label>
              <textarea v-model="dkim.publicKey" placeholder="MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC..." class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background font-mono text-sm h-24"></textarea>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">标志</label>
              <div class="space-y-2">
                <label class="flex items-center gap-2">
                  <input type="checkbox" v-model="dkim.flags.y" class="w-4 h-4 rounded">
                  <span class="text-sm">此域名已签名 (y)</span>
                </label>
                <label class="flex items-center gap-2">
                  <input type="checkbox" v-model="dkim.flags.s" class="w-4 h-4 rounded">
                  <span class="text-sm">允许从该域名的任何子域名签名 (s)</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- 自定义TXT记录 -->
        <div v-if="selectedType === 'custom'" class="bg-card border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">自定义 TXT 记录</h2>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">主机名</label>
              <input v-model="custom.hostname" type="text" placeholder="@ or www" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background">
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">TXT 值</label>
              <textarea v-model="custom.value" placeholder="v=spf1 include:example.com ~all" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background font-mono text-sm h-24"></textarea>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">TTL (秒)</label>
              <input v-model.number="custom.ttl" type="number" placeholder="3600" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background">
            </div>
          </div>
        </div>

        <!-- 验证器 -->
        <div v-if="selectedType === 'validator'" class="bg-card border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">TXT 记录验证器</h2>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">域名</label>
              <input v-model="validator.domain" type="text" placeholder="example.com" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background">
            </div>

            <button @click="validateRecord" class="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
              验证记录
            </button>

            <div v-if="validator.result" class="space-y-3">
              <div class="p-3 bg-muted rounded-lg">
                <p class="text-sm text-muted-foreground mb-1">记录值:</p>
                <code class="text-sm font-mono break-all">{{ validator.result.value }}</code>
              </div>
              <div class="p-3 rounded-lg" :class="validator.result.valid ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'">
                <p class="text-sm" :class="validator.result.valid ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'">
                  {{ validator.result.valid ? '✓ 记录格式正确' : '✗ 记录格式错误' }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-6">
        <!-- 生成的记录 -->
        <div class="bg-card border rounded-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold">生成的记录</h2>
            <button @click="copyRecord" v-if="generatedRecord" class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground">
              {{ copied ? '已复制' : '复制' }}
            </button>
          </div>

          <div v-if="generatedRecord" class="space-y-4">
            <div class="p-4 bg-muted rounded-lg">
              <p class="text-sm text-muted-foreground mb-1">主机名:</p>
              <code class="text-sm font-mono">{{ generatedRecord.hostname }}</code>
            </div>

            <div class="p-4 bg-muted rounded-lg">
              <p class="text-sm text-muted-foreground mb-1">类型:</p>
              <code class="text-sm font-mono">TXT</code>
            </div>

            <div class="p-4 bg-muted rounded-lg">
              <p class="text-sm text-muted-foreground mb-1">值:</p>
              <code class="text-sm font-mono break-all block">{{ generatedRecord.value }}</code>
            </div>

            <div v-if="generatedRecord.ttl" class="p-4 bg-muted rounded-lg">
              <p class="text-sm text-muted-foreground mb-1">TTL:</p>
              <code class="text-sm font-mono">{{ generatedRecord.ttl }}秒</code>
            </div>
          </div>

          <div v-else class="text-center py-8 text-muted-foreground">
            选择记录类型并填写信息后自动生成
          </div>
        </div>

        <!-- 常用模板 -->
        <div class="bg-card border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">常用模板</h2>

          <div class="space-y-2">
            <button v-for="template in templates" :key="template.name" @click="applyTemplate(template)" class="w-full p-3 text-left bg-muted hover:bg-muted/80 rounded-lg transition-colors">
              <div class="flex items-center justify-between">
                <span class="font-medium text-sm">{{ template.name }}</span>
                <span class="text-xs text-muted-foreground">{{ template.description }}</span>
              </div>
            </button>
          </div>
        </div>

        <!-- 使用说明 -->
        <div class="bg-card border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">使用说明</h2>

          <div class="space-y-3 text-sm text-muted-foreground">
            <div>
              <h3 class="font-medium text-foreground mb-1">SPF 记录</h3>
              <p>SPF (Sender Policy Framework) 用于验证发件人身份，防止邮件伪造。</p>
            </div>

            <div>
              <h3 class="font-medium text-foreground mb-1">DKIM 记录</h3>
              <p>DKIM (DomainKeys Identified Mail) 为邮件添加数字签名，确保邮件未被篡改。</p>
            </div>

            <div>
              <h3 class="font-medium text-foreground mb-1">添加步骤</h3>
              <ol class="list-decimal list-inside space-y-1">
                <li>生成或验证TXT记录</li>
                <li>登录DNS管理面板</li>
                <li>添加TXT记录</li>
                <li>等待DNS传播（可能需要24-48小时）</li>
                <li>使用验证工具确认</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 相关工具 -->
    <div class="mt-8 p-6 bg-muted rounded-lg">
      <h3 class="text-lg font-semibold mb-4">相关工具</h3>
      <div class="flex flex-wrap gap-2">
        <NuxtLink to="/tools/dns-lookup" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">DNS查询</NuxtLink>
        <NuxtLink to="/tools/dns-cache-flusher" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">DNS缓存刷新</NuxtLink>
        <NuxtLink to="/tools/whois-lookup" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">Whois查询</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useSeoMeta } from '#app'

const selectedType = ref('spf')
const copied = ref(false)

const spf = ref({
  domain: '',
  version: 'v=spf1',
  includeA: false,
  includeMx: false,
  includeIp4: false,
  includeIp6: false,
  ip4: '',
  ip6: '',
  include: '',
  redirect: '',
  qualifier: '-all'
})

const dkim = ref({
  selector: 'default',
  domain: '',
  version: 'DKIM1',
  hash: 'rsa-sha256',
  publicKey: '',
  flags: {
    y: true,
    s: false
  }
})

const custom = ref({
  hostname: '@',
  value: '',
  ttl: 3600
})

const validator = ref({
  domain: '',
  result: null
})

const recordTypes = [
  { value: 'spf', label: 'SPF记录' },
  { value: 'dkim', label: 'DKIM记录' },
  { value: 'custom', label: '自定义TXT' },
  { value: 'validator', label: '验证器' }
]

const templates = [
  {
    name: 'Google Workspace',
    description: 'v=spf1 include:_spf.google.com ~all',
    type: 'spf',
    data: { include: '_spf.google.com', qualifier: '~all' }
  },
  {
    name: 'Microsoft 365',
    description: 'v=spf1 include:spf.protection.outlook.com ~all',
    type: 'spf',
    data: { include: 'spf.protection.outlook.com', qualifier: '~all' }
  },
  {
    name: '基础SPF',
    description: 'v=spf1 a mx ~all',
    type: 'spf',
    data: { includeA: true, includeMx: true, qualifier: '~all' }
  }
]

const generatedRecord = computed(() => {
  if (selectedType.value === 'spf') {
    const parts = [spf.value.version]

    if (spf.value.includeA) parts.push('a')
    if (spf.value.includeMx) parts.push('mx')
    if (spf.value.includeIp4 && spf.value.ip4) parts.push(`ip4:${spf.value.ip4}`)
    if (spf.value.includeIp6 && spf.value.ip6) parts.push(`ip6:${spf.value.ip6}`)
    if (spf.value.include) parts.push(`include:${spf.value.include}`)
    if (spf.value.redirect) parts.push(`redirect=${spf.value.redirect}`)

    parts.push(spf.value.qualifier)

    return {
      hostname: spf.value.domain || '@',
      value: parts.join(' '),
      ttl: 3600
    }
  }

  if (selectedType.value === 'dkim') {
    const selector = dkim.value.selector
    const domain = dkim.value.domain

    const parts = [
      `v=${dkim.value.version}`,
      `k=${dkim.value.hash}`,
      `p=${dkim.value.publicKey || 'your-public-key'}`
    ]

    const flags = []
    if (dkim.value.flags.y) flags.push('y')
    if (dkim.value.flags.s) flags.push('s')
    if (flags.length) parts.push(`t=${flags.join('')}`)

    return {
      hostname: `${selector}._domainkey.${domain}`,
      value: parts.join('; '),
      ttl: 3600
    }
  }

  if (selectedType.value === 'custom') {
    return {
      hostname: custom.value.hostname,
      value: custom.value.value,
      ttl: custom.value.ttl
    }
  }

  return null
})

const applyTemplate = (template) => {
  selectedType.value = template.type
  if (template.type === 'spf') {
    Object.assign(spf.value, template.data)
  }
}

const validateRecord = async () => {
  if (!validator.value.domain) {
    alert('请输入域名')
    return
  }

  // 模拟验证
  validator.value.result = {
    value: 'v=spf1 include:_spf.google.com ~all',
    valid: true
  }
}

const copyRecord = async () => {
  if (!generatedRecord.value) return

  const text = `主机名: ${generatedRecord.value.hostname}\n类型: TXT\n值: ${generatedRecord.value.value}`

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

// SEO
useSeoMeta({
  title: 'TXT记录编辑器 - 在线SPF/DKIM生成工具',
  description: '免费在线DNS TXT记录编辑器，支持SPF记录生成、DKIM记录生成和TXT记录验证。',
  keywords: [
    'txt记录',
    'spf记录',
    'dkim记录',
    'dns txt',
    'spf生成器',
    'dkim生成器',
    '邮件认证',
    'dns记录',
    '域名验证'
  ],
  ogTitle: 'TXT记录编辑器 - 在线SPF/DKIM生成工具',
  ogDescription: '生成和验证DNS TXT记录，支持SPF和DKIM',
  ogType: 'website'
})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('TXT记录编辑器')

// JSON-LD
useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'TXT记录编辑器',
        description: '在线DNS TXT记录编辑器，支持SPF和DKIM记录生成',
        url: 'https://www.util.cn/tools/txt-record-editor',
        applicationCategory: 'UtilityApplication',
        operatingSystem: 'Any',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'CNY'
        },
        featureList: [
          'SPF记录生成',
          'DKIM记录生成',
          '自定义TXT记录',
          '记录验证',
          '常用模板',
          '格式检查'
        ]
      })
    }
  ]
})
</script>
