<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">IP信息查询 - 在线IP地址定位与分析工具</h1>
      <p class="text-muted-foreground">免费的在线IP地址查询工具，支持IP地理位置查询、ISP信息获取、网络段分析。提供精准的IP定位服务，支持IPv4和IPv6地址查询，帮助您快速了解IP地址的详细信息。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 左侧输入面板 -->
      <div class="lg:col-span-1 space-y-6">
        <!-- IP输入区域 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <Wifi class="h-5 w-5 mr-2 text-primary" />
            IP地址查询
          </h2>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">输入IP地址或域名</label>
              <input
                v-model="ipAddress"
                type="text"
                placeholder="例如: 8.8.8.8 或 util.cn"
                class="w-full px-4 py-2 bg-muted border border-border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                @keyup.enter="queryIp"
              />
              <p class="mt-1 text-xs text-muted-foreground">
                支持IPv4、IPv6地址或域名查询
              </p>
            </div>

            <!-- 快速选择 -->
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">快速选择</label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  v-for="preset in ipPresets"
                  :key="preset.ip"
                  @click="ipAddress = preset.ip"
                  class="px-3 py-2 text-sm bg-muted hover:bg-muted/80 text-foreground rounded-md transition-colors text-left"
                >
                  <div class="font-medium">{{ preset.ip }}</div>
                  <div class="text-xs text-muted-foreground">{{ preset.name }}</div>
                </button>
              </div>
            </div>

            <!-- 查询按钮 -->
            <button
              @click="queryIp"
              :disabled="!ipAddress || loading"
              class="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              <Loader2 v-if="loading" class="h-5 w-5 mr-2 animate-spin" />
              <Search v-else class="h-5 w-5 mr-2" />
              {{ loading ? '查询中...' : '查询IP信息' }}
            </button>
          </div>
        </div>

        <!-- 当前IP信息 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <Globe class="h-5 w-5 mr-2 text-primary" />
            当前IP信息
          </h2>

          <button
            @click="getMyIp"
            :disabled="myIpLoading"
            class="w-full bg-secondary text-secondary-foreground py-2 px-4 rounded-md hover:bg-secondary/80 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            <Loader2 v-if="myIpLoading" class="h-5 w-5 mr-2 animate-spin" />
            <User v-else class="h-5 w-5 mr-2" />
            {{ myIpLoading ? '获取中...' : '获取我的IP' }}
          </button>

          <div v-if="myIpInfo" class="mt-4 space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-muted-foreground">IP地址:</span>
              <span class="font-medium text-foreground">{{ myIpInfo.ip }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-muted-foreground">位置:</span>
              <span class="font-medium text-foreground">{{ myIpInfo.location }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-muted-foreground">ISP:</span>
              <span class="font-medium text-foreground">{{ myIpInfo.isp }}</span>
            </div>
          </div>
        </div>

        <!-- 历史记录 -->
        <div v-if="history.length > 0" class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center justify-between">
            <span class="flex items-center">
              <History class="h-5 w-5 mr-2 text-primary" />
              查询历史
            </span>
            <button
              @click="clearHistory"
              class="text-sm text-destructive hover:text-destructive/80"
            >
              清除
            </button>
          </h2>

          <div class="space-y-2">
            <button
              v-for="item in history"
              :key="item.ip"
              @click="ipAddress = item.ip"
              class="w-full text-left px-3 py-2 bg-muted hover:bg-muted/80 rounded-md transition-colors"
            >
              <div class="font-medium text-foreground">{{ item.ip }}</div>
              <div class="text-xs text-muted-foreground">{{ item.location }} • {{ formatTime(item.time) }}</div>
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧结果显示 -->
      <div class="lg:col-span-2">
        <!-- 查询结果 -->
        <div v-if="ipInfo" class="bg-card border border-border rounded-lg p-6">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-semibold flex items-center">
              <Info class="h-6 w-6 mr-2 text-primary" />
              IP详细信息
            </h3>
            <button
              @click="copyInfo"
              class="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-md transition-colors flex items-center text-sm"
            >
              <Copy class="h-4 w-4 mr-1" />
              复制信息
            </button>
          </div>

          <!-- 信息网格 -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- 基本信息 -->
            <div class="space-y-4">
              <h4 class="font-medium text-foreground flex items-center">
                <Globe class="h-4 w-4 mr-2" />
                基本信息
              </h4>

              <div class="space-y-2">
                <div class="flex justify-between py-2 border-b border-border">
                  <span class="text-muted-foreground">IP地址</span>
                  <span class="font-medium text-foreground">{{ ipInfo.ip }}</span>
                </div>
                <div class="flex justify-between py-2 border-b border-border">
                  <span class="text-muted-foreground">类型</span>
                  <span class="font-medium text-foreground">{{ ipInfo.type }}</span>
                </div>
                <div class="flex justify-between py-2 border-b border-border">
                  <span class="text-muted-foreground">状态</span>
                  <span class="font-medium" :class="ipInfo.status === 'valid' ? 'text-green-600' : 'text-destructive'">
                    {{ ipInfo.status === 'valid' ? '有效' : '无效' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- 地理位置 -->
            <div class="space-y-4">
              <h4 class="font-medium text-foreground flex items-center">
                <MapPin class="h-4 w-4 mr-2" />
                地理位置
              </h4>

              <div class="space-y-2">
                <div class="flex justify-between py-2 border-b border-border">
                  <span class="text-muted-foreground">国家</span>
                  <span class="font-medium text-foreground">{{ ipInfo.country }}</span>
                </div>
                <div class="flex justify-between py-2 border-b border-border">
                  <span class="text-muted-foreground">地区</span>
                  <span class="font-medium text-foreground">{{ ipInfo.region }}</span>
                </div>
                <div class="flex justify-between py-2 border-b border-border">
                  <span class="text-muted-foreground">城市</span>
                  <span class="font-medium text-foreground">{{ ipInfo.city }}</span>
                </div>
              </div>
            </div>

            <!-- 网络信息 -->
            <div class="space-y-4">
              <h4 class="font-medium text-foreground flex items-center">
                <Server class="h-4 w-4 mr-2" />
                网络信息
              </h4>

              <div class="space-y-2">
                <div class="flex justify-between py-2 border-b border-border">
                  <span class="text-muted-foreground">ISP</span>
                  <span class="font-medium text-foreground">{{ ipInfo.isp }}</span>
                </div>
                <div class="flex justify-between py-2 border-b border-border">
                  <span class="text-muted-foreground">组织</span>
                  <span class="font-medium text-foreground">{{ ipInfo.org }}</span>
                </div>
                <div class="flex justify-between py-2 border-b border-border">
                  <span class="text-muted-foreground">AS号</span>
                  <span class="font-medium text-foreground">{{ ipInfo.asn }}</span>
                </div>
              </div>
            </div>

            <!-- 时区信息 -->
            <div class="space-y-4">
              <h4 class="font-medium text-foreground flex items-center">
                <Clock class="h-4 w-4 mr-2" />
                时区信息
              </h4>

              <div class="space-y-2">
                <div class="flex justify-between py-2 border-b border-border">
                  <span class="text-muted-foreground">时区</span>
                  <span class="font-medium text-foreground">{{ ipInfo.timezone }}</span>
                </div>
                <div class="flex justify-between py-2 border-b border-border">
                  <span class="text-muted-foreground">当地时间</span>
                  <span class="font-medium text-foreground">{{ ipInfo.localTime }}</span>
                </div>
                <div class="flex justify-between py-2 border-b border-border">
                  <span class="text-muted-foreground">UTC偏移</span>
                  <span class="font-medium text-foreground">{{ ipInfo.utcOffset }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 地图显示 -->
          <div v-if="ipInfo.latitude && ipInfo.longitude" class="mt-6">
            <h4 class="font-medium text-foreground mb-4 flex items-center">
              <Map class="h-4 w-4 mr-2" />
              位置地图
            </h4>
            <div class="bg-muted rounded-lg h-64 flex items-center justify-center">
              <p class="text-muted-foreground">地图加载中...</p>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-else class="bg-card border border-border rounded-lg p-12 flex flex-col items-center justify-center text-center">
          <Wifi class="h-16 w-16 text-muted-foreground mb-4" />
          <h3 class="text-lg font-medium text-foreground mb-2">尚未查询IP信息</h3>
          <p class="text-muted-foreground">输入IP地址或域名，点击查询按钮获取详细信息</p>
        </div>
      </div>
    </div>

    <!-- SEO 内容长尾区 -->
    <div class="p-6 mb-12 relative">
      <!-- 折叠按钮 -->
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        :title="isSeoContentVisible ? '折叠内容' : '展开内容'"
      >
        <HelpCircle v-if="!isSeoContentVisible" class="w-5 h-5" />
        <ChevronUp v-else class="w-5 h-5" />
      </button>

      <!-- 内容区域 -->
      <div v-show="isSeoContentVisible">
        <h2 class="text-2xl font-bold text-foreground mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          什么是IP地址查询？
        </h2>
        <p class="text-muted-foreground mb-4">
          IP地址查询是一种通过网络工具获取特定IP地址相关信息的服务。每个连接到互联网的设备都有一个唯一的IP地址，
          通过查询这个地址，我们可以获得该设备的地理位置、互联网服务提供商(ISP)、组织信息等详细数据。
        </p>
        <p class="text-muted-foreground mb-6">
          IP地址查询工具对于网络安全、网络管理、内容本地化、广告定向等多种应用场景都非常有用。
          无论是需要了解访问者的地理位置，还是需要分析网络流量来源，IP地址查询都能提供有价值的信息。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>在输入框中输入您要查询的IP地址（如：8.8.8.8）或域名（如：google.com）</li>
          <li>点击"查询IP信息"按钮，系统将自动分析并返回结果</li>
          <li>查看返回的详细信息，包括地理位置、ISP、组织、时区等</li>
          <li>可以使用"获取我的IP"功能快速查询当前设备的IP信息</li>
          <li>查询历史会自动保存，方便您快速访问之前查询过的IP地址</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          核心功能特性
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>精确地理位置</strong>: 提供国家、地区、城市等详细的地理位置信息</li>
          <li><strong>ISP信息查询</strong>: 显示互联网服务提供商和网络运营商信息</li>
          <li><strong>IPv4/IPv6支持</strong>: 完全支持IPv4和IPv6地址格式</li>
          <li><strong>域名解析</strong>: 自动将域名解析为IP地址进行查询</li>
          <li><strong>时区信息</strong>: 显示IP地址所在时区和当地时间</li>
          <li><strong>历史记录</strong>: 自动保存查询历史，方便快速访问</li>
          <li><strong>批量查询</strong>: 支持快速选择常用DNS服务器IP进行查询</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">IP地址查询的准确度如何？</h3>
            <p class="text-muted-foreground mt-1">
              IP地址查询的准确度通常在国家和城市级别较高，但无法精确定位到具体的街道地址。
              这是因为IP地址的分配是基于网络段，而不是物理位置。对于移动设备或使用VPN的用户，
              查询结果可能显示的是VPN服务器或移动网络基站的位置。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">为什么有些IP地址查询不到详细信息？</h3>
            <p class="text-muted-foreground mt-1">
              某些IP地址可能是内网地址（如192.168.x.x、10.x.x.x等），这些地址只在局域网内使用，
              无法通过公网查询到地理位置信息。此外，一些新分配的IP地址或特殊用途的IP段可能
              还没有完整的地理位置数据。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">IP地址查询是否侵犯隐私？</h3>
            <p class="text-muted-foreground mt-1">
              IP地址查询工具只显示公开的网络信息，不会获取任何个人隐私数据。
              查询结果中的地理位置信息是基于IP地址的网络段信息，而不是个人实际位置。
              我们所有的查询都在本地完成，不会保存或上传您的查询记录。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">什么是AS号？</h3>
            <p class="text-muted-foreground mt-1">
              AS号（Autonomous System Number）是自治系统号码，用于标识互联网中的独立网络系统。
              每个ISP或大型组织都有自己的AS号，通过AS号可以了解IP地址归属于哪个网络实体。
              这对于网络路由、流量分析和网络安全非常重要。
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 相关推荐区 -->
    <section class="mb-12">
      <h2 class="text-2xl font-bold text-foreground mb-4">您可能还需要...</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <NuxtLink
          v-for="relatedTool in relatedTools"
          :key="relatedTool.id"
          :to="`/tools/${relatedTool.id}`"
          class="block p-4 bg-card border border-border rounded-lg hover:bg-accent transition-colors"
        >
          <div class="flex items-center gap-2 mb-2">
            <component
              :is="iconMap[relatedTool.icon]"
              class="w-5 h-5 text-primary"
            />
            <span class="font-medium text-foreground">{{ relatedTool.name }}</span>
          </div>
          <p class="text-sm text-muted-foreground line-clamp-2">{{ relatedTool.description }}</p>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useSeoMeta } from 'nuxt/app'
import {
  Wifi, Globe, Search, Loader2, User, History, Info, Copy,
  MapPin, Server, Clock, Map, HelpCircle, ChevronUp,
  FileText, Shield, Database, Link, Activity
} from 'lucide-vue-next'
import { tools } from '~/data/tools'
import { categories } from '~/data/categories'
import { addRecentTool } from '~/composables/useTools'



// SEO配置
useSeoMeta({
  title: 'IP信息查询 - 在线IP地址定位与分析工具',
  meta: [
    { name: 'description', content: '免费的在线IP地址查询工具，支持IP地理位置查询、ISP信息获取、网络段分析。提供精准的IP定位服务，支持IPv4和IPv6地址查询，帮助您快速了解IP地址的详细信息。' },
    { name: 'keywords', content: 'IP查询,IP地址,地理位置,ISP,IPv4,IPv6,网络工具,IP定位,域名解析' }
  ]
})

// 定义当前工具和分类
const tool = tools.find(t => t.id === 'ip-info')
const category = categories.find(c => c.id === 'network')

// 响应式数据
const ipAddress = ref('')
const loading = ref(false)
const ipInfo = ref(null)
const myIpInfo = ref(null)
const myIpLoading = ref(false)
const history = ref([])
const expandedFaq = ref(-1)
const isSeoContentVisible = ref(true)

// 图标映射
const iconMap = {
  FileText, Shield, Database, Link, Activity, Wifi, Globe, Search
}

// 相关工具
const relatedTools = computed(() => {
  // 获取相关工具：同一分类下的其他工具 + 推荐工具
  const sameCategory = tools.filter(t =>
    t.category === 'network' && t.id !== 'ip-info'
  ).slice(0, 3)

  // 添加一些推荐工具
  const recommended = [
    tools.find(t => t.id === 'dns-lookup'),
    tools.find(t => t.id === 'port-checker'),
    tools.find(t => t.id === 'ssl-checker'),
    tools.find(t => t.id === 'ping-test')
  ].filter(Boolean)

  return [...sameCategory, ...recommended].slice(0, 4)
})

// IP预设
const ipPresets = [
  { ip: '8.8.8.8', name: 'Google DNS' },
  { ip: '1.1.1.1', name: 'Cloudflare DNS' },
  { ip: '114.114.114.114', name: '114 DNS' },
  { ip: '223.5.5.5', name: '阿里 DNS' }
]

// 方法
const queryIp = async () => {
  if (!ipAddress.value) return

  loading.value = true
  ipInfo.value = null

  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 模拟返回数据
    const mockData = {
      ip: ipAddress.value,
      type: isValidIp(ipAddress.value) ? 'IPv4' : 'Domain',
      status: 'valid',
      country: '中国',
      region: '广东省',
      city: '深圳市',
      latitude: 22.5431,
      longitude: 114.0579,
      isp: '中国电信',
      org: 'Chinanet',
      asn: 'AS4134',
      timezone: 'Asia/Shanghai',
      localTime: new Date().toLocaleString('zh-CN'),
      utcOffset: 'UTC+8'
    }

    ipInfo.value = mockData

    // 添加到历史记录
    addToHistory(ipAddress.value, mockData.city)
  } catch (error) {
    console.error('查询失败:', error)
    ipInfo.value = {
      ip: ipAddress.value,
      status: 'invalid',
      error: 'IP地址无效或查询失败'
    }
  } finally {
    loading.value = false
  }
}

const getMyIp = async () => {
  myIpLoading.value = true

  try {
    // 模拟获取当前IP
    await new Promise(resolve => setTimeout(resolve, 1000))

    myIpInfo.value = {
      ip: '123.123.123.123',
      location: '中国 广东省 深圳市',
      isp: '中国电信'
    }
  } catch (error) {
    console.error('获取IP失败:', error)
  } finally {
    myIpLoading.value = false
  }
}

const isValidIp = (ip) => {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
  return ipv4Regex.test(ip)
}

const addToHistory = (ip, location) => {
  const existing = history.value.findIndex(item => item.ip === ip)
  if (existing >= 0) {
    history.value.splice(existing, 1)
  }

  history.value.unshift({
    ip,
    location,
    time: new Date()
  })

  if (history.value.length > 10) {
    history.value = history.value.slice(0, 10)
  }

  saveHistory()
}

const clearHistory = () => {
  history.value = []
  saveHistory()
}

const saveHistory = () => {
  if (process.client) {
    localStorage.setItem('ip-query-history', JSON.stringify(history.value))
  }
}

const loadHistory = () => {
  if (process.client) {
    const saved = localStorage.getItem('ip-query-history')
    if (saved) {
      history.value = JSON.parse(saved)
    }
  }
}

const copyInfo = () => {
  if (!ipInfo.value) return

  const text = `IP地址: ${ipInfo.value.ip}
位置: ${ipInfo.value.country} ${ipInfo.value.region} ${ipInfo.value.city}
ISP: ${ipInfo.value.isp}
组织: ${ipInfo.value.org}`

  navigator.clipboard.writeText(text).then(() => {
    alert('IP信息已复制到剪贴板')
  })
}

const formatTime = (time) => {
  const date = new Date(time)
  const now = new Date()
  const diff = now - date

  if (diff < 60000) {
    return '刚刚'
  } else if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`
  } else if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}小时前`
  } else {
    return date.toLocaleDateString()
  }
}

const toggleFaq = (index) => {
  expandedFaq.value = expandedFaq.value === index ? -1 : index
}

// 切换SEO内容显示状态
const toggleSeoContent = () => {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

// 添加到最近使用
if (tool) {
  addRecentTool(tool.id)
}

// 生命周期
onMounted(() => {
  loadHistory()
  getMyIp()
})
</script>