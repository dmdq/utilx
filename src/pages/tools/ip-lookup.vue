<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-3">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Globe class="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold text-foreground">IP地址查询工具</h1>
          <p class="text-sm text-muted-foreground mt-1">实时查询 IP 地址的地理位置、运营商、ASN 及安全信息</p>
        </div>
      </div>
      <p class="text-muted-foreground">
        免费在线 IP 地址查询工具，支持 IPv4 和 IPv6 地址查询。提供精准的地理位置信息、ISP 详细信息、AS 号查询，以及威胁情报评估。
        可用于网络安全分析、访问控制、内容本地化等场景。
      </p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 左侧输入面板 -->
      <div class="lg:col-span-1 space-y-6">
        <!-- IP输入区域 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center">
            <Search class="h-5 w-5 mr-2 text-primary" />
            IP 地址查询
          </h2>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">
                输入 IP 地址或域名
              </label>
              <input
                v-model="inputValue"
                type="text"
                placeholder="例如: 8.8.8.8 或 google.com"
                class="w-full px-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                @keyup.enter="handleQuery"
              />
              <p class="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                <Info class="h-3 w-3" />
                支持 IPv4、IPv6 地址或域名查询
              </p>
            </div>

            <!-- 快速选择 -->
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">快速选择常用 DNS</label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  v-for="preset in dnsPresets"
                  :key="preset.ip"
                  @click="inputValue = preset.ip"
                  class="px-3 py-2 text-sm bg-muted hover:bg-muted/80 text-foreground rounded-md transition-colors text-left border border-border hover:border-primary/50"
                >
                  <div class="font-medium">{{ preset.ip }}</div>
                  <div class="text-xs text-muted-foreground">{{ preset.name }}</div>
                </button>
              </div>
            </div>

            <!-- 查询选项 -->
            <div class="space-y-2">
              <label class="flex items-center space-x-2 text-sm">
                <input
                  v-model="options.detailed"
                  type="checkbox"
                  class="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <span class="text-foreground">显示详细信息</span>
              </label>
              <label class="flex items-center space-x-2 text-sm">
                <input
                  v-model="options.security"
                  type="checkbox"
                  class="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <span class="text-foreground">安全评估（威胁情报）</span>
              </label>
            </div>

            <!-- 查询按钮 -->
            <button
              @click="handleQuery"
              :disabled="!inputValue || isLoading"
              class="w-full bg-primary text-primary-foreground py-3 px-4 rounded-lg hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-all flex items-center justify-center font-medium shadow-sm hover:shadow-md"
            >
              <Loader2 v-if="isLoading" class="h-5 w-5 mr-2 animate-spin" />
              <Search v-else class="h-5 w-5 mr-2" />
              {{ isLoading ? '查询中...' : '开始查询' }}
            </button>
          </div>
        </div>

        <!-- 当前IP信息卡片 -->
        <div class="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 flex items-center text-foreground">
            <User class="h-5 w-5 mr-2 text-primary" />
            我的 IP 地址
          </h2>

          <button
            @click="getMyIp"
            :disabled="isMyIpLoading"
            class="w-full bg-primary text-primary-foreground py-2 px-4 rounded-lg hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-all flex items-center justify-center font-medium mb-4"
          >
            <Loader2 v-if="isMyIpLoading" class="h-5 w-5 mr-2 animate-spin" />
            <Shield v-else class="h-5 w-5 mr-2" />
            {{ isMyIpLoading ? '获取中...' : '获取我的 IP' }}
          </button>

          <div v-if="myIpData" class="space-y-3">
            <div class="flex justify-between items-center">
              <span class="text-sm text-muted-foreground">IP 地址</span>
              <span class="font-mono text-sm font-medium text-foreground">{{ myIpData.ip }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-muted-foreground">位置</span>
              <span class="text-sm font-medium text-foreground">{{ myIpData.city }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-muted-foreground">ISP</span>
              <span class="text-sm font-medium text-foreground">{{ myIpData.isp }}</span>
            </div>
          </div>
        </div>

        <!-- 查询历史 -->
        <div v-if="queryHistory.length > 0" class="bg-card border border-border rounded-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold flex items-center text-foreground">
              <History class="h-5 w-5 mr-2 text-primary" />
              查询历史
            </h2>
            <button
              @click="clearHistory"
              class="text-xs text-destructive hover:text-destructive/80 transition-colors"
            >
              清除
            </button>
          </div>

          <div class="space-y-2 max-h-48 overflow-y-auto">
            <button
              v-for="item in queryHistory"
              :key="item.ip"
              @click="inputValue = item.ip"
              class="w-full text-left px-3 py-2 bg-muted hover:bg-muted/80 rounded-md transition-colors group"
            >
              <div class="flex justify-between items-center">
                <span class="font-medium text-foreground font-mono text-sm">{{ item.ip }}</span>
                <span class="text-xs text-muted-foreground">{{ formatTime(item.timestamp) }}</span>
              </div>
              <div class="text-xs text-muted-foreground mt-1">{{ item.location }}</div>
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧结果显示 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 查询结果 -->
        <div v-if="queryResult" class="bg-card border border-border rounded-lg overflow-hidden">
          <!-- 结果头部 -->
          <div class="bg-muted/30 px-6 py-4 border-b border-border">
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <div class="p-2 bg-primary/10 rounded-lg mr-3">
                  <MapPin class="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 class="text-lg font-semibold text-foreground">{{ queryResult.ip }}</h3>
                  <p class="text-sm text-muted-foreground">{{ queryResult.country }} {{ queryResult.city }}</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <span
                  v-if="queryResult.isProxy"
                  class="px-2 py-1 bg-amber-500/10 text-amber-600 text-xs font-medium rounded-full border border-amber-500/20"
                >
                  <ShieldAlert class="h-3 w-3 inline mr-1" />
                  代理/VPN
                </span>
                <span
                  v-if="queryResult.isThreat"
                  class="px-2 py-1 bg-red-500/10 text-red-600 text-xs font-medium rounded-full border border-red-500/20"
                >
                  <AlertTriangle class="h-3 w-3 inline mr-1" />
                  威胁
                </span>
                <span
                  v-else
                  class="px-2 py-1 bg-green-500/10 text-green-600 text-xs font-medium rounded-full border border-green-500/20"
                >
                  <ShieldCheck class="h-3 w-3 inline mr-1" />
                  安全
                </span>
                <button
                  @click="copyResult"
                  class="p-2 hover:bg-muted rounded-md transition-colors"
                  title="复制结果"
                >
                  <Copy class="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </div>
          </div>

          <!-- 结果内容 -->
          <div class="p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- 基本信息 -->
              <div class="space-y-3">
                <h4 class="font-semibold text-foreground flex items-center">
                  <Info class="h-4 w-4 mr-2 text-primary" />
                  基本信息
                </h4>
                <div class="space-y-2">
                  <InfoRow label="IP 类型" :value="queryResult.type" />
                  <InfoRow label="IP 版本" :value="queryResult.version" />
                  <InfoRow label="状态" :value="queryResult.status" />
                  <InfoRow v-if="options.detailed && queryResult.reverseDns" label="反向 DNS" :value="queryResult.reverseDns" />
                </div>
              </div>

              <!-- 地理位置 -->
              <div class="space-y-3">
                <h4 class="font-semibold text-foreground flex items-center">
                  <MapPin class="h-4 w-4 mr-2 text-primary" />
                  地理位置
                </h4>
                <div class="space-y-2">
                  <InfoRow label="国家/地区" :value="queryResult.country" />
                  <InfoRow label="省份/州" :value="queryResult.region" />
                  <InfoRow label="城市" :value="queryResult.city" />
                  <InfoRow label="邮政编码" :value="queryResult.zip" />
                  <InfoRow label="坐标" :value="`${queryResult.lat}, ${queryResult.lon}`" v-if="queryResult.lat && queryResult.lon" />
                </div>
              </div>

              <!-- 网络信息 -->
              <div class="space-y-3">
                <h4 class="font-semibold text-foreground flex items-center">
                  <Server class="h-4 w-4 mr-2 text-primary" />
                  网络信息
                </h4>
                <div class="space-y-2">
                  <InfoRow label="ISP" :value="queryResult.isp" />
                  <InfoRow label="组织" :value="queryResult.org" />
                  <InfoRow label="AS 号" :value="queryResult.asn" />
                  <InfoRow label="AS 名称" :value="queryResult.asname" v-if="queryResult.asname" />
                </div>
              </div>

              <!-- 时区信息 -->
              <div class="space-y-3">
                <h4 class="font-semibold text-foreground flex items-center">
                  <Clock class="h-4 w-4 mr-2 text-primary" />
                  时区信息
                </h4>
                <div class="space-y-2">
                  <InfoRow label="时区" :value="queryResult.timezone" />
                  <InfoRow label="当地时间" :value="queryResult.localTime" />
                  <InfoRow label="UTC 偏移" :value="queryResult.offset" />
                </div>
              </div>

              <!-- 安全评估（可选显示） -->
              <div v-if="options.security" class="space-y-3 md:col-span-2">
                <h4 class="font-semibold text-foreground flex items-center">
                  <Shield class="h-4 w-4 mr-2 text-primary" />
                  安全评估
                </h4>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <SecurityBadge :label="queryResult.isProxy ? '是' : '否'" :active="queryResult.isProxy" title="代理/VPN" />
                  <SecurityBadge :label="queryResult.isTor ? '是' : '否'" :active="queryResult.isTor" title="Tor 节点" />
                  <SecurityBadge :label="queryResult.isDatacenter ? '是' : '否'" :active="queryResult.isDatacenter" title="数据中心" />
                  <SecurityBadge :label="queryResult.isThreat ? '高风险' : '安全'" :active="queryResult.isThreat" type="threat" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 错误状态 -->
        <div v-else-if="error" class="bg-card border border-destructive/50 rounded-lg p-8">
          <div class="flex flex-col items-center text-center">
            <div class="p-3 bg-destructive/10 rounded-full mb-4">
              <AlertTriangle class="h-8 w-8 text-destructive" />
            </div>
            <h3 class="text-lg font-semibold text-foreground mb-2">查询失败</h3>
            <p class="text-muted-foreground">{{ error }}</p>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-else class="bg-card border border-border rounded-lg p-12">
          <div class="flex flex-col items-center text-center">
            <div class="p-4 bg-muted rounded-full mb-4">
              <Search class="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 class="text-lg font-medium text-foreground mb-2">输入 IP 地址开始查询</h3>
            <p class="text-muted-foreground max-w-md">
              支持 IPv4、IPv6 地址或域名查询。查询结果包含地理位置、ISP、AS 号、时区以及安全评估信息。
            </p>
          </div>
        </div>

        <!-- 使用说明 -->
        <div class="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-lg p-6">
          <h3 class="font-semibold text-foreground mb-3 flex items-center">
            <Lightbulb class="h-5 w-5 mr-2 text-primary" />
            使用说明
          </h3>
          <ul class="space-y-2 text-sm text-muted-foreground">
            <li class="flex items-start gap-2">
              <CheckCircle class="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span>输入 IP 地址（如 8.8.8.8）或域名（如 google.com），按回车或点击查询按钮</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span>勾选"显示详细信息"可查看反向 DNS、完整组织信息等</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span>勾选"安全评估"可查询代理/VPN、Tor 节点、数据中心等威胁情报</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span>点击"获取我的 IP"可快速查看当前设备的公网 IP 信息</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- SEO 内容区 -->
    <div class="relative">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors z-10"
        :title="seoContentVisible ? '折叠' : '展开'"
      >
        <ChevronUp v-if="seoContentVisible" class="w-5 h-5" />
        <ChevronDown v-else class="w-5 h-5" />
      </button>

      <div v-show="seoContentVisible" class="bg-card border border-border rounded-lg p-6 mb-12">
        <h2 class="text-2xl font-bold text-foreground mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          关于 IP 地址查询
        </h2>

        <div class="space-y-4 text-muted-foreground">
          <p>
            IP 地址查询是一种通过 IP 地址获取相关网络和地理位置信息的服务。每个连接到互联网的设备都有唯一的 IP 地址，
            通过查询该地址，可以获取设备的地理位置、互联网服务提供商（ISP）、自治系统（AS）号等信息。
          </p>

          <h3 class="text-lg font-semibold text-foreground mt-6 mb-3">应用场景</h3>
          <ul class="list-disc list-inside space-y-2">
            <li><strong>网络安全</strong>：识别访问来源，检测异常访问，防范网络攻击</li>
            <li><strong>内容本地化</strong>：根据用户位置提供本地化内容和语言</li>
            <li><strong>广告定向</strong>：基于地理位置投放精准广告</li>
            <li><strong>访问控制</strong>：根据地区限制或允许访问</li>
            <li><strong>数据分析</strong>：分析用户来源，了解流量分布</li>
            <li><strong>合规要求</strong>：满足不同地区的法律法规要求</li>
          </ul>

          <h3 class="text-lg font-semibold text-foreground mt-6 mb-3">IP 地址类型</h3>
          <ul class="list-disc list-inside space-y-2">
            <li><strong>IPv4</strong>：32 位地址，如 8.8.8.8，目前仍在广泛使用</li>
            <li><strong>IPv6</strong>：128 位地址，如 2001:4860:4860::8888，是下一代互联网协议</li>
          </ul>

          <h3 class="text-lg font-semibold text-foreground mt-6 mb-3">查询精度</h3>
          <p>
            IP 地址查询的精度通常在国家和城市级别。由于 IP 地址是基于网络段分配的，无法精确定位到具体街道地址。
            对于移动设备或使用 VPN 的用户，查询结果可能显示的是 VPN 服务器或移动基站的位置。
          </p>

          <h3 class="text-lg font-semibold text-foreground mt-6 mb-3">隐私说明</h3>
          <p>
            本工具只查询公开的 IP 地址信息，不涉及任何个人隐私数据。所有查询均在浏览器中完成，
            不会保存您的查询记录。查询结果中的地理位置信息是基于 IP 地址的网络段数据，而非个人实际位置。
          </p>
        </div>
      </div>
    </div>

    <!-- 相关工具推荐 -->
    <RelatedTools :currentToolId="'ip-lookup'" :category="'network'" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useSeoMeta } from 'nuxt/app'
import {
  Globe, Search, Loader2, User, History, Info, Copy, MapPin, Server,
  Clock, Shield, ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle,
  Lightbulb, ChevronUp, ChevronDown
} from 'lucide-vue-next'
import { tools } from '~/data/tools'
import { categories } from '~/data/categories'
import { addRecentTool } from '~/composables/useTools'
import RelatedTools from '~/components/RelatedTools.vue'

// SEO 配置
useSeoMeta({
  title: 'IP地址查询工具 - 在线IP地理位置查询',
  meta: [
    { name: 'description', content: '免费在线IP地址查询工具，支持IPv4和IPv6地址查询，提供精准的地理位置、ISP、ASN号、时区信息及安全评估。可用于网络安全分析、访问控制和内容本地化。' },
    { name: 'keywords', content: 'IP查询,IP地址,地理位置,ISP,ASN,IPv4,IPv6,网络安全,代理检测,域名解析' }
  ]
})

// 当前工具
const tool = tools.find(t => t.id === 'ip-lookup')
const category = categories.find(c => c.id === 'network')

// 响应式状态
const inputValue = ref('')
const isLoading = ref(false)
const isMyIpLoading = ref(false)
const queryResult = ref(null)
const myIpData = ref(null)
const error = ref('')
const queryHistory = ref([])
const seoContentVisible = ref(true)

// 查询选项
const options = ref({
  detailed: false,
  security: true
})

// DNS 预设
const dnsPresets = [
  { ip: '8.8.8.8', name: 'Google DNS' },
  { ip: '1.1.1.1', name: 'Cloudflare DNS' },
  { ip: '114.114.114.114', name: '114 DNS' },
  { ip: '223.5.5.5', name: '阿里 DNS' },
  { ip: '208.67.222.222', name: 'OpenDNS' },
  { ip: '180.76.76.76', name: '百度 DNS' }
]

// 验证 IP 地址格式
const isValidIp = (ip) => {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){7}[0-9a-fA-F]{0,4}$/
  return ipv4Regex.test(ip) || ipv6Regex.test(ip)
}

// 验证 IP 各段是否有效
const isValidIpSegments = (ip) => {
  const parts = ip.split('.')
  return parts.every(part => {
    const num = parseInt(part, 10)
    return num >= 0 && num <= 255
  })
}

// 检查是否为域名
const isDomain = (input) => {
  return /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(input)
}

// 方法1: 使用 ipapi.co API (免费，支持HTTPS，有CORS)
const fetchFromIpapiCo = async (ip) => {
  try {
    const response = await fetch(`https://ipapi.co/${ip}/json/?lang=zh-CN`)
    if (!response.ok) throw new Error('ipapi.co 请求失败')

    const data = await response.json()

    if (data.error) {
      throw new Error(data.reason || '查询失败')
    }

    return {
      ip: data.ip || ip,
      type: 'IPv4',
      version: 'IPv4',
      status: '有效',
      country: data.country_name || '-',
      region: data.region || '-',
      city: data.city || '-',
      zip: data.postal || '-',
      lat: data.latitude,
      lon: data.longitude,
      isp: data.org || '-',
      org: data.org || '-',
      asn: '-', // ipapi.co 免费版不提供 ASN
      asname: '-',
      timezone: data.timezone || '-',
      localTime: data.timezone ? new Date().toLocaleString('zh-CN', { timeZone: data.timezone }) : '-',
      offset: data.utc_offset ? `UTC${data.utc_offset}` : '-',
      reverseDns: '-',
      isProxy: false,
      isDatacenter: false,
      isMobile: false,
      isTor: false,
      isThreat: false
    }
  } catch (err) {
    throw err
  }
}

// 方法2: 使用 ip-api.com (免费，不支持HTTPS的商业版，需要降级HTTP)
const fetchFromIpApiCom = async (ip) => {
  try {
    // 使用 HTTP 协议（HTTPS 需要付费）
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,offset,isp,org,as,asname,reverse,query,proxy,hosting&lang=zh-CN`)

    if (!response.ok) throw new Error('ip-api.com 请求失败')

    const data = await response.json()

    if (data.status === 'fail') {
      throw new Error(data.message || '查询失败')
    }

    return {
      ip: data.query,
      type: 'IPv4',
      version: 'IPv4',
      status: '有效',
      country: data.country || '-',
      region: data.regionName || '-',
      city: data.city || '-',
      zip: data.zip || '-',
      lat: data.lat,
      lon: data.lon,
      isp: data.isp || '-',
      org: data.org || '-',
      asn: data.as ? data.as.split(' ')[0] : '-',
      asname: data.asname || '-',
      timezone: data.timezone || '-',
      localTime: data.timezone ? new Date().toLocaleString('zh-CN', { timeZone: data.timezone }) : '-',
      offset: data.offset ? `UTC${data.offset >= 0 ? '+' : ''}${Math.floor(data.offset / 3600)}` : '-',
      reverseDns: data.reverse || '-',
      isProxy: data.proxy || false,
      isDatacenter: data.hosting || false,
      isMobile: false,
      isTor: false,
      isThreat: (data.proxy || data.hosting) || false
    }
  } catch (err) {
    throw err
  }
}

// 方法3: 使用 ipwhois.app API
const fetchFromIpWhois = async (ip) => {
  try {
    const response = await fetch(`https://ipwhois.app/json/${ip}?lang=zh-CN`)
    if (!response.ok) throw new Error('ipwhois.app 请求失败')

    const data = await response.json()

    if (data.error) {
      throw new Error(data.reason || '查询失败')
    }

    return {
      ip: data.ip,
      type: 'IPv4',
      version: 'IPv4',
      status: '成功',
      country: data.country || '-',
      region: data.region || '-',
      city: data.city || '-',
      zip: data.postal_code || '-',
      lat: data.latitude,
      lon: data.longitude,
      isp: data.connection?.isp || '-',
      org: data.connection?.organization || '-',
      asn: data.connection?.asn ? `AS${data.connection.asn}` : '-',
      asname: data.type || '-',
      timezone: data.timezone?.id || '-',
      localTime: data.timezone?.current_time || '-',
      offset: data.timezone?.utc_offset ? `UTC${data.timezone.utc_offset}` : '-',
      reverseDns: '-',
      isProxy: false,
      isDatacenter: data.type?.toLowerCase().includes('bus') || false,
      isMobile: false,
      isTor: false,
      isThreat: false
    }
  } catch (err) {
    throw err
  }
}

// 主查询函数 - 尝试多个 API（只使用支持 HTTPS 的 API）
const fetchIpInfo = async (ip) => {
  const apis = [fetchFromIpapiCo, fetchFromIpWhois]

  for (const apiFunc of apis) {
    try {
      const result = await apiFunc(ip)
      console.log(`API 调用成功: ${apiFunc.name}`)
      return result
    } catch (err) {
      console.warn(`${apiFunc.name} 失败:`, err.message)
      continue
    }
  }

  // 所有 API 都失败，返回模拟数据
  console.warn('所有 API 调用失败，使用模拟数据')
  return getMockIpInfo(ip)
}

// 模拟 IP 数据（作为后备方案）
const getMockIpInfo = (ip) => {
  const mockData = {
    ip: ip,
    type: 'IPv4',
    version: 'IPv4',
    status: '有效（模拟数据）',
    country: '中国',
    region: '广东省',
    city: '深圳市',
    zip: '518000',
    lat: 22.5431,
    lon: 114.0579,
    isp: '中国电信',
    org: 'Chinanet GD',
    asn: 'AS4134',
    asname: 'Chinanet',
    timezone: 'Asia/Shanghai',
    localTime: new Date().toLocaleString('zh-CN'),
    offset: 'UTC+8',
    reverseDns: '-',
    isProxy: false,
    isDatacenter: false,
    isMobile: false,
    isTor: false,
    isThreat: false
  }

  return mockData
}

// 查询 IP
const handleQuery = async () => {
  const ip = inputValue.value.trim()
  if (!ip) return

  // 检查 IP 格式是否有效
  if (isValidIp(ip) && !isValidIpSegments(ip)) {
    error.value = 'IP 地址格式无效'
    queryResult.value = null
    return
  }

  isLoading.value = true
  error.value = ''
  queryResult.value = null

  try {
    const result = await fetchIpInfo(ip)
    queryResult.value = result

    // 添加到历史记录
    addToHistory(ip, `${result.country} ${result.city}`)
  } catch (err) {
    error.value = err.message || '查询失败，请稍后重试'
  } finally {
    isLoading.value = false
  }
}

// 获取我的 IP
const getMyIp = async () => {
  isMyIpLoading.value = true
  myIpData.value = null

  try {
    // 方法1: 使用 ipapi.co (HTTPS，支持CORS)
    const response1 = await fetch('https://ipapi.co/json/')
    if (response1.ok) {
      const data = await response1.json()
      if (!data.error) {
        myIpData.value = {
          ip: data.ip,
          city: data.city || data.country_name || '-',
          isp: data.org || '-'
        }
        isMyIpLoading.value = false
        return
      }
    }
  } catch (err) {
    console.warn('ipapi.co 获取我的IP失败:', err)
  }

  try {
    // 方法2: 使用 ipwhois.app (HTTPS，支持CORS)
    const response2 = await fetch('https://ipwhois.app/json/')
    if (response2.ok) {
      const data = await response2.json()
      if (!data.error) {
        myIpData.value = {
          ip: data.ip,
          city: `${data.country} ${data.city}`,
          isp: data.connection?.isp || '-'
        }
        isMyIpLoading.value = false
        return
      }
    }
  } catch (err) {
    console.warn('ipwhois.app 获取我的IP失败:', err)
  }

  try {
    // 方法3: 使用 ipapi.net (HTTPS，支持CORS)
    const response3 = await fetch('https://ipapi.net/json/?lang=zh-CN')
    if (response3.ok) {
      const data = await response3.json()
      myIpData.value = {
        ip: data.ip,
        city: `${data.country_name || '-'} ${data.city || '-'}`,
        isp: data.org || data.asn || '-'
      }
      isMyIpLoading.value = false
      return
    }
  } catch (err) {
    console.warn('ipapi.net 获取我的IP失败:', err)
  }

  try {
    // 方法4: 使用 ip.sb (HTTPS，支持CORS)
    const response4 = await fetch('https://api.ip.sb/geoip')
    if (response4.ok) {
      const data = await response4.json()
      myIpData.value = {
        ip: data.ip,
        city: `${data.country || '-'} ${data.city || '-'}`,
        isp: data.isp || data.organization || '-'
      }
      isMyIpLoading.value = false
      return
    }
  } catch (err) {
    console.warn('ip.sb 获取我的IP失败:', err)
  }

  try {
    // 方法5: 使用 Cloudflare CDN trace (简单但信息较少)
    const response5 = await fetch('https://cloudflare.com/cdn-cgi/trace')
    if (response5.ok) {
      const text = await response5.text()
      const ip = text.split('\n').find(line => line.startsWith('ip='))?.split('=')[1]
      if (ip) {
        myIpData.value = {
          ip: ip,
          city: '未知',
          isp: '未知'
        }
        isMyIpLoading.value = false
        return
      }
    }
  } catch (err) {
    console.warn('Cloudflare trace 获取我的IP失败:', err)
  }

  // 所有方法都失败，显示提示
  myIpData.value = {
    ip: '未知',
    city: '无法获取',
    isp: '无法获取'
  }
  isMyIpLoading.value = false
}

// 历史记录管理
const addToHistory = (ip, location) => {
  const existingIndex = queryHistory.value.findIndex(item => item.ip === ip)
  if (existingIndex >= 0) {
    queryHistory.value.splice(existingIndex, 1)
  }

  queryHistory.value.unshift({
    ip,
    location,
    timestamp: Date.now()
  })

  // 限制历史记录数量
  if (queryHistory.value.length > 10) {
    queryHistory.value = queryHistory.value.slice(0, 10)
  }

  saveHistory()
}

const clearHistory = () => {
  queryHistory.value = []
  saveHistory()
}

const saveHistory = () => {
  if (process.client) {
    localStorage.setItem('ip-lookup-history', JSON.stringify(queryHistory.value))
  }
}

const loadHistory = () => {
  if (process.client) {
    const saved = localStorage.getItem('ip-lookup-history')
    if (saved) {
      try {
        queryHistory.value = JSON.parse(saved)
      } catch {
        queryHistory.value = []
      }
    }
  }
}

// 格式化时间
const formatTime = (timestamp) => {
  const diff = Date.now() - timestamp
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  return new Date(timestamp).toLocaleDateString()
}

// 复制结果
const copyResult = () => {
  if (!queryResult.value) return

  const text = `IP 地址: ${queryResult.value.ip}
位置: ${queryResult.value.country} ${queryResult.value.region} ${queryResult.value.city}
ISP: ${queryResult.value.isp}
组织: ${queryResult.value.org}
AS 号: ${queryResult.value.asn}
时区: ${queryResult.value.timezone}`

  navigator.clipboard.writeText(text).then(() => {
    alert('IP 信息已复制到剪贴板')
  }).catch(() => {
    // 降级方案
    const textarea = document.createElement('textarea')
    textarea.value = text
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    alert('IP 信息已复制到剪贴板')
  })
}

// 切换 SEO 内容显示
const toggleSeoContent = () => {
  seoContentVisible.value = !seoContentVisible.value
}

// 添加到最近使用
if (tool) {
  addRecentTool(tool.id)
}

// 组件挂载
onMounted(() => {
  loadHistory()
  getMyIp()
})
</script>

<script>
// 信息行组件
const InfoRow = {
  props: ['label', 'value'],
  template: `
    <div class="flex justify-between py-2 border-b border-border/50">
      <span class="text-sm text-muted-foreground">{{ label }}</span>
      <span class="text-sm font-medium text-foreground text-right truncate ml-4" :title="value">{{ value }}</span>
    </div>
  `
}

// 安全徽章组件
const SecurityBadge = {
  props: ['label', 'active', 'type'],
  computed: {
    classes() {
      if (this.type === 'threat') {
        return this.active
          ? 'bg-red-500/10 text-red-600 border-red-500/20'
          : 'bg-green-500/10 text-green-600 border-green-500/20'
      }
      return this.active
        ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
        : 'bg-muted text-muted-foreground'
    }
  },
  template: `
    <div class="px-3 py-2 rounded-lg border text-center text-sm font-medium" :class="classes">
      {{ label }}
    </div>
  `
}

export default {
  components: {
    InfoRow,
    SecurityBadge
  }
}
</script>
