<template>
  <div class="max-w-8xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">DNS 缓存刷新工具</h1>
      <p class="text-muted-foreground">检测DNS缓存状态，提供清除DNS缓存的命令和指导，支持Windows、Mac、Linux系统</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 左侧主要内容 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 操作系统检测 -->
        <div class="bg-card border rounded-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-semibold">您的操作系统</h2>
            <div class="flex items-center gap-2 text-sm text-muted-foreground">
              <span v-if="detectedOS" class="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                {{ detectedOS.name }}
              </span>
              <button @click="detectOS" class="px-3 py-1 text-primary hover:underline">重新检测</button>
            </div>
          </div>

          <div v-if="detectedOS" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="p-4 bg-muted rounded-lg">
                <p class="text-sm text-muted-foreground mb-1">操作系统</p>
                <p class="font-medium">{{ detectedOS.name }}</p>
              </div>
              <div class="p-4 bg-muted rounded-lg">
                <p class="text-sm text-muted-foreground mb-1">浏览器</p>
                <p class="font-medium">{{ detectedOS.browser }}</p>
              </div>
            </div>

            <div class="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p class="text-sm text-blue-800 dark:text-blue-200">
                <strong>检测完成：</strong>已为您生成适用于 {{ detectedOS.name }} 的DNS缓存清除命令
              </p>
            </div>
          </div>

          <div v-else class="text-center py-8 text-muted-foreground">
            <p>正在检测您的操作系统...</p>
          </div>
        </div>

        <!-- 清除命令 -->
        <div class="bg-card border rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-4">DNS 缓存清除命令</h3>

          <div class="space-y-4">
            <!-- Windows -->
            <div class="border rounded-lg overflow-hidden">
              <button @click="toggleSection('windows')" class="w-full p-4 flex items-center justify-between bg-muted hover:bg-muted/80 transition-colors">
                <div class="flex items-center gap-3">
                  <span class="text-2xl">🪟</span>
                  <span class="font-medium">Windows</span>
                </div>
                <svg :class="['w-5 h-5 transition-transform', openSections.windows ? 'rotate-180' : '']" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>
              <div v-if="openSections.windows" class="p-4 space-y-3">
                <div>
                  <p class="text-sm text-muted-foreground mb-2">命令提示符 (CMD):</p>
                  <div class="relative">
                    <code class="block p-3 bg-background border rounded text-sm font-mono">ipconfig /flushdns</code>
                    <button @click="copyCommand('ipconfig /flushdns')" class="absolute top-2 right-2 px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:opacity-90">
                      {{ copiedCommands.includes('ipconfig /flushdns') ? '已复制' : '复制' }}
                    </button>
                  </div>
                </div>
                <div>
                  <p class="text-sm text-muted-foreground mb-2">PowerShell:</p>
                  <div class="relative">
                    <code class="block p-3 bg-background border rounded text-sm font-mono">Clear-DnsClientCache</code>
                    <button @click="copyCommand('Clear-DnsClientCache')" class="absolute top-2 right-2 px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:opacity-90">
                      {{ copiedCommands.includes('Clear-DnsClientCache') ? '已复制' : '复制' }}
                    </button>
                  </div>
                </div>
                <p class="text-xs text-muted-foreground">💡 提示：以管理员身份运行命令提示符或PowerShell</p>
              </div>
            </div>

            <!-- macOS -->
            <div class="border rounded-lg overflow-hidden">
              <button @click="toggleSection('macos')" class="w-full p-4 flex items-center justify-between bg-muted hover:bg-muted/80 transition-colors">
                <div class="flex items-center gap-3">
                  <span class="text-2xl">🍎</span>
                  <span class="font-medium">macOS</span>
                </div>
                <svg :class="['w-5 h-5 transition-transform', openSections.macos ? 'rotate-180' : '']" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>
              <div v-if="openSections.macos" class="p-4 space-y-3">
                <div>
                  <p class="text-sm text-muted-foreground mb-2">macOS Catalina 及更高版本:</p>
                  <div class="relative">
                    <code class="block p-3 bg-background border rounded text-sm font-mono">sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder</code>
                    <button @click="copyCommand('sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder')" class="absolute top-2 right-2 px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:opacity-90">
                      {{ copiedCommands.includes('macos-modern') ? '已复制' : '复制' }}
                    </button>
                  </div>
                </div>
                <div>
                  <p class="text-sm text-muted-foreground mb-2">macOS Mojave 及更早版本:</p>
                  <div class="relative">
                    <code class="block p-3 bg-background border rounded text-sm font-mono">sudo killall -HUP mDNSResponder</code>
                    <button @click="copyCommand('sudo killall -HUP mDNSResponder')" class="absolute top-2 right-2 px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:opacity-90">
                      {{ copiedCommands.includes('sudo killall -HUP mDNSResponder') ? '已复制' : '复制' }}
                    </button>
                  </div>
                </div>
                <p class="text-xs text-muted-foreground">💡 提示：需要输入管理员密码</p>
              </div>
            </div>

            <!-- Linux -->
            <div class="border rounded-lg overflow-hidden">
              <button @click="toggleSection('linux')" class="w-full p-4 flex items-center justify-between bg-muted hover:bg-muted/80 transition-colors">
                <div class="flex items-center gap-3">
                  <span class="text-2xl">🐧</span>
                  <span class="font-medium">Linux</span>
                </div>
                <svg :class="['w-5 h-5 transition-transform', openSections.linux ? 'rotate-180' : '']" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>
              <div v-if="openSections.linux" class="p-4 space-y-3">
                <div>
                  <p class="text-sm text-muted-foreground mb-2">使用 systemd-resolved:</p>
                    <code class="block p-3 bg-background border rounded text-sm font-mono">sudo systemd-resolve --flush-caches</code>
                </div>
                <div>
                  <p class="text-sm text-muted-foreground mb-2">使用 nscd:</p>
                    <code class="block p-3 bg-background border rounded text-sm font-mono">sudo /etc/init.d/nscd restart</code>
                </div>
                <div>
                  <p class="text-sm text-muted-foreground mb-2">使用 dnsmasq:</p>
                    <code class="block p-3 bg-background border rounded text-sm font-mono">sudo systemctl restart dnsmasq</code>
                </div>
                <p class="text-xs text-muted-foreground">💡 提示：Linux系统使用的DNS服务可能不同，根据实际情况选择命令</p>
              </div>
            </div>
          </div>
        </div>

        <!-- DNS查询测试 -->
        <div class="bg-card border rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-4">DNS 缓存验证</h3>
          <p class="text-sm text-muted-foreground mb-4">查询域名以验证DNS缓存是否已刷新</p>

          <div class="flex gap-2 mb-4">
            <input
              v-model="testDomain"
              type="text"
              placeholder="example.com"
              class="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
            >
            <button @click="testDNS" :disabled="testingDNS" class="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">
              {{ testingDNS ? '查询中...' : '查询DNS' }}
            </button>
          </div>

          <div v-if="dnsResult" class="space-y-3">
            <div class="p-4 bg-muted rounded-lg">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm text-muted-foreground">域名:</span>
                <span class="font-medium">{{ dnsResult.domain }}</span>
              </div>
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm text-muted-foreground">IP地址:</span>
                <span class="font-mono">{{ dnsResult.ip }}</span>
              </div>
              <div v-if="dnsResult.ttl" class="flex items-center justify-between">
                <span class="text-sm text-muted-foreground">TTL:</span>
                <span>{{ dnsResult.ttl }}秒</span>
              </div>
            </div>

            <div class="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p class="text-sm text-green-800 dark:text-green-200">
                ✓ DNS查询成功！如果IP地址已更新，说明缓存已刷新
              </p>
            </div>
          </div>

          <div v-if="dnsError" class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p class="text-sm text-red-800 dark:text-red-200">✗ {{ dnsError }}</p>
          </div>
        </div>

        <!-- TTL查询 -->
        <div class="bg-card border rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-4">TTL 查询与传播估算</h3>

          <div class="flex gap-2 mb-4">
            <input
              v-model="ttlDomain"
              type="text"
              placeholder="example.com"
              class="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
            >
            <button @click="queryTTL" :disabled="queryingTTL" class="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">
              {{ queryingTTL ? '查询中...' : '查询TTL' }}
            </button>
          </div>

          <div v-if="ttlResult" class="space-y-3">
            <div class="p-4 bg-muted rounded-lg">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm text-muted-foreground">TTL值:</span>
                <span class="font-medium">{{ ttlResult.ttl }}秒 (约{{ Math.round(ttlResult.ttl / 60) }}分钟)</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-muted-foreground">预计传播时间:</span>
                <span class="font-medium">0-{{ ttlResult.ttl }}秒</span>
              </div>
            </div>

            <div class="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p class="text-sm text-blue-800 dark:text-blue-200">
                <strong>说明：</strong>TTL(Time To Live)决定了DNS记录在缓存中的保存时间。更改DNS后，最长需要等待TTL时间才能全球生效。
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧边栏 -->
      <div class="space-y-6">
        <!-- 浏览器DNS清除 -->
        <div class="bg-card border rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-4">浏览器DNS清除</h3>
          <div class="space-y-3 text-sm">
            <details class="group">
              <summary class="cursor-pointer font-medium hover:text-primary">Chrome/Edge</summary>
              <div class="mt-2 text-muted-foreground space-y-2">
                <p>1. 地址栏输入: <code class="bg-muted px-1 rounded">chrome://net-internals/#dns</code></p>
                <p>2. 点击 "Clear host cache"</p>
                <p>或: 清除浏览器缓存数据</p>
              </div>
            </details>
            <details class="group">
              <summary class="cursor-pointer font-medium hover:text-primary">Firefox</summary>
              <div class="mt-2 text-muted-foreground">
                <p>清除浏览器缓存和Cookie</p>
              </div>
            </details>
            <details class="group">
              <summary class="cursor-pointer font-medium hover:text-primary">Safari</summary>
              <div class="mt-2 text-muted-foreground">
                <p>菜单 → 清除历史记录 → 勾选"清除缓存"</p>
              </div>
            </details>
          </div>
        </div>

        <!-- 路由器DNS清除 -->
        <div class="bg-card border rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-4">路由器DNS清除</h3>
          <div class="space-y-3 text-sm text-muted-foreground">
            <p>如果清除设备DNS缓存后仍无法解决，可能需要清除路由器的DNS缓存：</p>
            <ol class="list-decimal list-inside space-y-1">
              <li>登录路由器管理界面</li>
              <li>找到DNS设置或DHCP设置</li>
              <li>更改DNS服务器地址</li>
              <li>重启路由器</li>
            </ol>
            <p class="text-xs">💡 公共DNS: Google (8.8.8.8), Cloudflare (1.1.1.1)</p>
          </div>
        </div>

        <!-- 常见问题 -->
        <div class="bg-card border rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-4">常见问题</h3>
          <div class="space-y-3 text-sm">
            <details class="group">
              <summary class="cursor-pointer font-medium hover:text-primary">为什么需要清除DNS缓存？</summary>
              <p class="mt-2 text-muted-foreground">
                当网站更换服务器或迁移域名时，DNS缓存可能导致访问到旧地址。清除缓存可以立即更新到新地址。
              </p>
            </details>
            <details class="group">
              <summary class="cursor-pointer font-medium hover:text-primary">清除DNS缓存安全吗？</summary>
              <p class="mt-2 text-muted-foreground">
                完全安全。清除DNS缓存只是删除临时数据，不会影响系统功能，下次访问时会自动重新获取。
              </p>
            </details>
            <details class="group">
              <summary class="cursor-pointer font-medium hover:text-primary">多久需要清除一次？</summary>
              <p class="mt-2 text-muted-foreground">
                通常不需要定期清除。只在遇到网站无法访问、DNS解析错误或网站迁移后需要立即生效时才需要清除。
              </p>
            </details>
          </div>
        </div>

        <!-- 快速操作 -->
        <div class="bg-card border rounded-lg p-6">
          <h3 class="text-lg font-semibold mb-4">快速操作</h3>
          <div class="space-y-2">
            <button @click="flushMyDNS" class="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-sm">
              为我生成清除命令
            </button>
            <button @click="showAllCommands" class="w-full px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors text-sm">
              查看所有命令
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 相关工具 -->
    <div class="mt-8 p-6 bg-muted rounded-lg">
      <h3 class="text-lg font-semibold mb-4">相关工具</h3>
      <div class="flex flex-wrap gap-2">
        <NuxtLink to="/tools/dns-lookup" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">DNS查询</NuxtLink>
        <NuxtLink to="/tools/whois-lookup" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">Whois查询</NuxtLink>
        <NuxtLink to="/tools/ssl-checker" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">SSL证书检查</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useSeoMeta } from '#app'

const detectedOS = ref(null)
const openSections = ref({
  windows: false,
  macos: false,
  linux: false
})
const copiedCommands = ref([])

const testDomain = ref('')
const testingDNS = ref(false)
const dnsResult = ref(null)
const dnsError = ref('')

const ttlDomain = ref('')
const queryingTTL = ref(false)
const ttlResult = ref(null)

// 检测操作系统
const detectOS = () => {
  const userAgent = navigator.userAgent
  const platform = navigator.platform

  let osName = 'Unknown'
  let browser = 'Unknown'

  // 检测操作系统
  if (platform.indexOf('Win') !== -1) {
    osName = 'Windows'
    if (userAgent.indexOf('Windows NT 10.0') !== -1) osName = 'Windows 10/11'
    else if (userAgent.indexOf('Windows NT 6.3') !== -1) osName = 'Windows 8.1'
    else if (userAgent.indexOf('Windows NT 6.2') !== -1) osName = 'Windows 8'
    else if (userAgent.indexOf('Windows NT 6.1') !== -1) osName = 'Windows 7'
  } else if (platform.indexOf('Mac') !== -1) {
    osName = 'macOS'
  } else if (platform.indexOf('Linux') !== -1) {
    osName = 'Linux'
  } else if (userAgent.indexOf('Android') !== -1) {
    osName = 'Android'
  } else if (userAgent.indexOf('iPhone') !== -1 || userAgent.indexOf('iPad') !== -1) {
    osName = 'iOS'
  }

  // 检测浏览器
  if (userAgent.indexOf('Chrome') !== -1 && userAgent.indexOf('Edg') === -1) {
    browser = 'Chrome'
  } else if (userAgent.indexOf('Safari') !== -1 && userAgent.indexOf('Chrome') === -1) {
    browser = 'Safari'
  } else if (userAgent.indexOf('Firefox') !== -1) {
    browser = 'Firefox'
  } else if (userAgent.indexOf('Edg') !== -1) {
    browser = 'Edge'
  } else if (userAgent.indexOf('Opera') !== -1 || userAgent.indexOf('OPR') !== -1) {
    browser = 'Opera'
  }

  detectedOS.value = { name: osName, browser: browser }

  // 自动展开对应系统
  if (osName.includes('Windows')) {
    openSections.value.windows = true
  } else if (osName.includes('macOS') || osName.includes('iOS')) {
    openSections.value.macos = true
  } else if (osName.includes('Linux') || osName.includes('Android')) {
    openSections.value.linux = true
  }
}

const toggleSection = (section) => {
  openSections.value[section] = !openSections.value[section]
}

const copyCommand = async (command) => {
  try {
    await navigator.clipboard.writeText(command)
    copiedCommands.value.push(command)
    setTimeout(() => {
      copiedCommands.value = copiedCommands.value.filter(c => c !== command)
    }, 2000)
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement('textarea')
    textarea.value = command
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    copiedCommands.value.push(command)
    setTimeout(() => {
      copiedCommands.value = copiedCommands.value.filter(c => c !== command)
    }, 2000)
  }
}

// DNS测试
const testDNS = async () => {
  if (!testDomain.value.trim()) {
    dnsError.value = '请输入域名'
    return
  }

  testingDNS.value = true
  dnsError.value = ''
  dnsResult.value = null

  try {
    // 使用DoH (DNS over HTTPS) 查询
    const domain = testDomain.value.trim().replace(/^https?:\/\//, '').split('/')[0]
    const response = await fetch(`https://cloudflare-dns.com/dns-query?name=${domain}&type=A`, {
      headers: {
        'Accept': 'application/dns-json'
      }
    })

    const data = await response.json()

    if (data.Answer && data.Answer.length > 0) {
      const answer = data.Answer.find(a => a.type === 1)
      if (answer) {
        dnsResult.value = {
          domain: domain,
          ip: answer.data,
          ttl: answer.TTL
        }
      } else {
        dnsError.value = '未找到A记录'
      }
    } else {
      dnsError.value = 'DNS查询失败，请检查域名是否正确'
    }
  } catch (e) {
    dnsError.value = '查询失败: ' + e.message
  } finally {
    testingDNS.value = false
  }
}

// TTL查询
const queryTTL = async () => {
  if (!ttlDomain.value.trim()) {
    return
  }

  queryingTTL.value = true

  try {
    const domain = ttlDomain.value.trim().replace(/^https?:\/\//, '').split('/')[0]
    const response = await fetch(`https://cloudflare-dns.com/dns-query?name=${domain}&type=A`, {
      headers: {
        'Accept': 'application/dns-json'
      }
    })

    const data = await response.json()

    if (data.Answer && data.Answer.length > 0) {
      const answer = data.Answer.find(a => a.type === 1)
      if (answer) {
        ttlResult.value = {
          domain: domain,
          ttl: answer.TTL
        }
      }
    }
  } catch (e) {
    console.error('TTL查询失败:', e)
  } finally {
    queryingTTL.value = false
  }
}

const flushMyDNS = () => {
  if (!detectedOS.value) {
    detectOS()
  }
  // 滚动到命令区域
  document.querySelector('.border.rounded-lg.overflow-hidden')?.scrollIntoView({ behavior: 'smooth' })
}

const showAllCommands = () => {
  openSections.value = {
    windows: true,
    macos: true,
    linux: true
  }
}

onMounted(() => {
  detectOS()
})

// SEO
useSeoMeta({
  title: 'DNS缓存刷新工具 - 在线DNS清除命令生成',
  description: '免费在线DNS缓存刷新工具，自动检测操作系统并提供Windows、Mac、Linux的DNS缓存清除命令。支持DNS缓存验证和TTL查询。',
  keywords: [
    'dns缓存刷新',
    '清除dns缓存',
    'flush dns',
    'dns清理',
    'windows dns',
    'mac dns',
    'linux dns',
    'dns命令',
    'dns传播',
    'ttl查询',
    '网络工具'
  ],
  ogTitle: 'DNS缓存刷新工具 - 在线DNS清除命令生成',
  ogDescription: '自动检测操作系统，提供DNS缓存清除命令和指导',
  ogType: 'website'
})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('DNS缓存刷新工具')

// JSON-LD
useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'DNS缓存刷新工具',
        description: '在线DNS缓存刷新工具，提供Windows、Mac、Linux的DNS清除命令和指导',
        url: 'https://www.util.cn/tools/dns-cache-flusher',
        applicationCategory: 'UtilityApplication',
        operatingSystem: 'Any',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'CNY'
        },
        featureList: [
          '自动检测操作系统',
          'Windows DNS清除命令',
          'macOS DNS清除命令',
          'Linux DNS清除命令',
          '浏览器DNS清除指导',
          '路由器DNS清除指导',
          'DNS缓存验证',
          'TTL查询'
        ]
      })
    }
  ]
})
</script>
