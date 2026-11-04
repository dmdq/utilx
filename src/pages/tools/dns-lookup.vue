<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <div class="flex items-center gap-4 mb-4">
        <div class="p-3 bg-primary/10 rounded-lg">
          <Wifi class="h-8 w-8 text-primary" />
        </div>
        <h1 class="text-3xl font-bold text-foreground">DNS查询 - 在线DNS记录查询工具</h1>
      </div>
      <p class="text-muted-foreground">
        免费在线DNS查询工具，支持A、AAAA、CNAME、MX、TXT等多种DNS记录类型查询。可自定义DNS服务器，提供详细的DNS解析结果，帮助您诊断域名解析问题。
      </p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 左侧查询面板 -->
      <div class="lg:col-span-1 space-y-6">
        <!-- DNS查询表单 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold text-foreground mb-4 flex items-center">
            <Search class="h-5 w-5 mr-2 text-primary" />
            DNS查询
          </h2>

          <div class="space-y-4">
            <!-- 域名输入 -->
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">域名</label>
              <input
                v-model="domain"
                type="text"
                placeholder="例如: google.com"
                class="w-full px-4 py-2 bg-background border border-border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                @keyup.enter="queryDns"
              />
            </div>

            <!-- 记录类型 -->
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">记录类型</label>
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="type in recordTypes"
                  :key="type.value"
                  @click="selectRecordType(type.value)"
                  :class="[
                    'px-3 py-2 text-sm rounded-md border transition-colors',
                    selectedTypes.includes(type.value)
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-background border-border text-foreground hover:bg-muted'
                  ]"
                >
                  {{ type.label }}
                </button>
              </div>
            </div>

            <!-- DNS服务器 -->
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">DNS服务器</label>
              <select
                v-model="dnsServer"
                class="w-full px-3 py-2 bg-background border border-border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="system">系统默认</option>
                <option value="8.8.8.8">Google (8.8.8.8)</option>
                <option value="1.1.1.1">Cloudflare (1.1.1.1)</option>
                <option value="208.67.222.222">OpenDNS (208.67.222.222)</option>
                <option value="114.114.114.114">114DNS (114.114.114.114)</option>
                <option value="223.5.5.5">阿里DNS (223.5.5.5)</option>
              </select>
            </div>

            <!-- 高级选项 -->
            <div>
              <button
                @click="showAdvanced = !showAdvanced"
                class="w-full text-left px-3 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-colors text-sm flex items-center justify-between"
              >
                <span>高级选项</span>
                <ChevronDown
                  :class="['h-4 w-4 transition-transform', showAdvanced ? 'rotate-180' : '']"
                />
              </button>

              <div v-if="showAdvanced" class="mt-3 space-y-3">
                <div>
                  <label class="block text-xs text-muted-foreground mb-1">超时时间 (秒)</label>
                  <input
                    v-model.number="timeout"
                    type="number"
                    min="1"
                    max="30"
                    class="w-full px-3 py-2 bg-background border border-border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <label class="flex items-center">
                  <input
                    v-model="options.traceRoute"
                    type="checkbox"
                    class="mr-2 rounded"
                  />
                  <span class="text-sm text-foreground">追踪解析路径</span>
                </label>
                <label class="flex items-center">
                  <input
                    v-model="options.includeDetails"
                    type="checkbox"
                    class="mr-2 rounded"
                  />
                  <span class="text-sm text-foreground">显示详细信息</span>
                </label>
              </div>
            </div>

            <!-- 查询按钮 -->
            <button
              @click="queryDns"
              :disabled="!domain || selectedTypes.length === 0 || loading"
              class="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              <Loader2 v-if="loading" class="h-5 w-5 mr-2 animate-spin" />
              <Search v-else class="h-5 w-5 mr-2" />
              {{ loading ? '查询中...' : '查询DNS' }}
            </button>
          </div>
        </div>

        <!-- 快速查询 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold text-foreground mb-4 flex items-center">
            <Zap class="h-5 w-5 mr-2 text-primary" />
            快速查询
          </h2>

          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="preset in quickPresets"
              :key="preset.domain"
              @click="quickQuery(preset)"
              class="px-3 py-2 text-sm bg-muted text-foreground rounded-md hover:bg-muted/80 transition-colors"
            >
              {{ preset.domain }}
            </button>
          </div>
        </div>

        <!-- 查询历史 -->
        <div v-if="history.length > 0" class="bg-card border border-border rounded-lg p-6">
          <h2 class="text-lg font-semibold text-foreground mb-4 flex items-center justify-between">
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
              :key="item.id"
              @click="loadHistory(item)"
              class="w-full text-left px-3 py-2 bg-muted rounded-md hover:bg-muted/80 transition-colors"
            >
              <div class="font-medium text-foreground">{{ item.domain }}</div>
              <div class="text-xs text-muted-foreground">{{ item.types.join(', ') }} • {{ formatTime(item.time) }}</div>
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧结果显示 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 查询结果 -->
        <div v-if="dnsResults.length > 0" class="bg-card border border-border rounded-lg p-6">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-semibold text-foreground flex items-center">
              <Server class="h-6 w-6 mr-2 text-primary" />
              DNS记录 - {{ domain }}
            </h3>
            <div class="flex space-x-2">
              <button
                @click="exportResults"
                class="px-4 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-colors flex items-center text-sm"
              >
                <Download class="h-4 w-4 mr-1" />
                导出
              </button>
              <button
                @click="copyResults"
                class="px-4 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-colors flex items-center text-sm"
              >
                <Copy class="h-4 w-4 mr-1" />
                复制
              </button>
            </div>
          </div>

          <!-- 标签页 -->
          <div class="border-b border-border">
            <nav class="-mb-px flex space-x-8">
              <button
                v-for="(type, index) in Object.keys(groupedResults)"
                :key="type"
                @click="activeTab = type"
                :class="[
                  'py-2 px-1 border-b-2 font-medium text-sm',
                  activeTab === type
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                ]"
              >
                {{ type.toUpperCase() }}
                <span class="ml-2 bg-muted text-muted-foreground py-0.5 px-2 rounded-full text-xs">
                  {{ groupedResults[type].length }}
                </span>
              </button>
            </nav>
          </div>

          <!-- 记录列表 -->
          <div class="mt-6">
            <div v-for="record in groupedResults[activeTab]" :key="record.id" class="mb-4 p-4 bg-muted rounded-lg">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center space-x-4 mb-2">
                    <span class="px-2 py-1 bg-primary/10 text-primary text-xs rounded font-medium">
                      {{ record.type }}
                    </span>
                    <span class="text-sm text-muted-foreground">TTL: {{ record.ttl }}</span>
                    <span v-if="record.priority" class="text-sm text-muted-foreground">优先级: {{ record.priority }}</span>
                  </div>
                  <div class="font-mono text-sm text-foreground break-all">
                    {{ record.value }}
                  </div>
                </div>
                <button
                  @click="copyRecord(record)"
                  class="ml-4 p-2 text-muted-foreground hover:text-foreground"
                >
                  <Copy class="h-4 w-4" />
                </button>
              </div>

              <!-- 详细信息 -->
              <div v-if="options.includeDetails && record.details" class="mt-3 pt-3 border-t border-border">
                <div class="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span class="text-muted-foreground">查询服务器:</span>
                    <span class="ml-2 text-foreground">{{ record.server }}</span>
                  </div>
                  <div>
                    <span class="text-muted-foreground">响应时间:</span>
                    <span class="ml-2 text-foreground">{{ record.responseTime }}ms</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 追踪路径 -->
          <div v-if="options.traceRoute && traceRoute.length > 0" class="mt-6 pt-6 border-t border-border">
            <h4 class="font-medium text-foreground mb-4 flex items-center">
              <GitBranch class="h-4 w-4 mr-2 text-primary" />
              解析路径
            </h4>
            <div class="space-y-2">
              <div
                v-for="(step, index) in traceRoute"
                :key="index"
                class="flex items-center space-x-3 p-2 bg-muted rounded"
              >
                <div class="flex-shrink-0 w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-medium">
                  {{ index + 1 }}
                </div>
                <div class="flex-1">
                  <div class="text-sm font-medium text-foreground">{{ step.server }}</div>
                  <div class="text-xs text-muted-foreground">{{ step.ip }} • {{ step.time }}ms</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- DNS记录类型说明 -->
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-lg font-semibold text-foreground mb-4 flex items-center">
            <HelpCircle class="h-5 w-5 mr-2 text-primary" />
            DNS记录类型说明
          </h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div v-for="type in recordTypesInfo" :key="type.value" class="p-4 bg-muted rounded-lg">
              <h4 class="font-medium text-foreground mb-1">{{ type.label }} ({{ type.value }})</h4>
              <p class="text-sm text-muted-foreground">{{ type.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- SEO 内容长尾区 -->
    <div class="p-6 mb-12 bg-card border border-border rounded-lg relative">
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
          什么是 DNS 查询？
        </h2>
        <p class="text-muted-foreground mb-4">
          DNS (Domain Name System) 是互联网的电话簿，它将易于记忆的域名转换为计算机使用的 IP 地址。
          当您在浏览器中输入网址时，DNS 服务器会查找对应的 IP 地址，然后将您连接到正确的网站。
          DNS 查询工具可以帮助您诊断域名解析问题，查看域名的各种 DNS 记录。
        </p>
        <p class="text-muted-foreground">
          通过 DNS 查询，您可以获取域名的 A 记录（IPv4 地址）、AAAA 记录（IPv6 地址）、CNAME 记录（别名）、
          MX 记录（邮件服务器）、TXT 记录（文本信息）等多种类型的 DNS 记录。这些信息对于网站管理员、
          开发者和网络故障排查人员来说都非常重要。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用 DNS 查询工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>在输入框中输入要查询的域名（如 google.com）</li>
          <li>选择要查询的 DNS 记录类型（可多选）</li>
          <li>选择使用的 DNS 服务器（默认使用系统 DNS）</li>
          <li>点击"查询DNS"按钮或按回车键开始查询</li>
          <li>查看查询结果，包括记录值、TTL、优先级等信息</li>
          <li>可以导出或复制查询结果，便于后续分析</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          DNS 记录类型详解
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>A 记录</strong>: 将域名指向 IPv4 地址，是最常见的记录类型</li>
          <li><strong>AAAA 记录</strong>: 将域名指向 IPv6 地址，用于 IPv6 网络</li>
          <li><strong>CNAME 记录</strong>: 将域名指向另一个域名（别名记录）</li>
          <li><strong>MX 记录</strong>: 指定邮件服务器，包含优先级设置</li>
          <li><strong>TXT 记录</strong>: 存储文本信息，常用于域名验证、SPF 记录等</li>
          <li><strong>NS 记录</strong>: 指定域名的权威 DNS 服务器</li>
          <li><strong>SOA 记录</strong>: 起始授权机构记录，包含域名的管理信息</li>
          <li><strong>PTR 记录</strong>: 反向 DNS 解析，将 IP 地址解析为域名</li>
          <li><strong>SRV 记录</strong>: 服务定位记录，指定服务的位置和端口</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">DNS 查询失败的可能原因是什么？</h3>
            <p class="text-muted-foreground mt-1">
              DNS 查询失败可能由多种原因导致：域名不存在、域名未正确配置、DNS 服务器故障、
              网络连接问题、防火墙阻止 DNS 查询等。建议使用不同的 DNS 服务器重试，
              或使用 whois 工具检查域名的注册状态。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">什么是 TTL？</h3>
            <p class="text-muted-foreground mt-1">
              TTL (Time To Live) 是 DNS 记录的生存时间，以秒为单位。它决定了 DNS 记录在
              本地缓存中的保存时间。较短的 TTL 可以让更改更快生效，但会增加 DNS 查询的负载；
              较长的 TTL 可以减少查询次数，但更改生效会较慢。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">为什么要选择不同的 DNS 服务器？</h3>
            <p class="text-muted-foreground mt-1">
              不同的 DNS 服务器可能返回不同的结果，特别是在使用了 CDN 或地理负载均衡的情况下。
              使用多个 DNS 服务器可以帮助您验证 DNS 配置的正确性，诊断 DNS 传播问题。
              一些 DNS 服务器还提供额外的功能，如恶意网站过滤、家长控制等。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">DNS 查询和 Ping 有什么区别？</h3>
            <p class="text-muted-foreground mt-1">
              DNS 查询是获取域名对应的 IP 地址，而 Ping 是测试与目标主机的网络连接性。
              DNS 查询只进行域名解析，不发送数据包到目标主机；Ping 则会发送 ICMP 数据包
              测试网络延迟和连通性。通常先进行 DNS 查询获取 IP 地址，然后再使用 Ping 测试连接。
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSeoMeta } from 'nuxt/app'
import {
  Wifi, Search, ChevronDown, Loader2, Server, Copy, Download,
  GitBranch, HelpCircle, Zap, History, FileText, Lock, Shield, Clock, Type,
  Image, Code, FileJson, Database, Link, Hash, Timer, Regex, FileDiff,
  Globe, FolderOpen, ChevronUp
} from 'lucide-vue-next'
import { tools } from '~/data/tools'
import { categories } from '~/data/categories'
import { addRecentTool } from '~/composables/useTools'



const router = useRouter()

// SEO配置
useSeoMeta({
  title: 'DNS查询 - 在线DNS记录查询工具',
  meta: [
    { name: 'description', content: '免费在线DNS查询工具，支持A、AAAA、CNAME、MX、TXT等多种DNS记录类型查询，可自定义DNS服务器。' },
    { name: 'keywords', content: 'DNS查询,DNS记录,A记录,AAAA记录,CNAME记录,MX记录,TXT记录,NS记录' }
  ]
})

// 定义当前工具和分类
const tool = tools.find(t => t.id === 'dns-lookup')
const category = categories.find(c => c.id === 'network')

// 响应式数据
const domain = ref('')
const dnsServer = ref('system')
const selectedTypes = ref(['A', 'AAAA', 'MX', 'NS'])
const loading = ref(false)
const dnsResults = ref([])
const traceRoute = ref([])
const history = ref([])
const activeTab = ref('A')
const showAdvanced = ref(false)
const timeout = ref(5)
const isSeoContentVisible = ref(true)

// 查询选项
const options = ref({
  traceRoute: false,
  includeDetails: false
})

// 记录类型
const recordTypes = [
  { label: 'A', value: 'A' },
  { label: 'AAAA', value: 'AAAA' },
  { label: 'CNAME', value: 'CNAME' },
  { label: 'MX', value: 'MX' },
  { label: 'TXT', value: 'TXT' },
  { label: 'NS', value: 'NS' },
  { label: 'SOA', value: 'SOA' },
  { label: 'PTR', value: 'PTR' },
  { label: 'SRV', value: 'SRV' }
]

// 记录类型信息
const recordTypesInfo = [
  {
    label: 'A记录',
    value: 'A',
    description: '将域名指向IPv4地址'
  },
  {
    label: 'AAAA记录',
    value: 'AAAA',
    description: '将域名指向IPv6地址'
  },
  {
    label: 'CNAME记录',
    value: 'CNAME',
    description: '将域名指向另一个域名'
  },
  {
    label: 'MX记录',
    value: 'MX',
    description: '指定邮件服务器'
  },
  {
    label: 'TXT记录',
    value: 'TXT',
    description: '存储文本信息，常用于验证'
  },
  {
    label: 'NS记录',
    value: 'NS',
    description: '指定域名服务器'
  },
  {
    label: 'SOA记录',
    value: 'SOA',
    description: '起始授权机构记录'
  },
  {
    label: 'PTR记录',
    value: 'PTR',
    description: '反向DNS解析'
  },
  {
    label: 'SRV记录',
    value: 'SRV',
    description: '服务定位记录'
  }
]

// 快速预设
const quickPresets = [
  { domain: 'google.com', types: ['A', 'AAAA'] },
  { domain: 'github.com', types: ['A', 'CNAME'] },
  { domain: 'cloudflare.com', types: ['A', 'AAAA', 'NS'] }
]

// 图标映射
const iconMap = {
  FileText,
  Lock,
  Shield,
  Clock,
  Type,
  Wifi,
  Image,
  Code,
  FileJson,
  Database,
  Link,
  Hash,
  Timer,
  Regex,
  FileDiff,
  Globe,
  FolderOpen,
  GitBranch
}

// ChevronUp needs to be separately defined for use in SEO content
const ChevronUpIcon = ChevronUp

// 相关工具
const relatedTools = computed(() => {
  // 获取相关工具：同一分类下的其他工具 + 推荐工具
  const sameCategory = tools.filter(t =>
    t.category === 'network' && t.id !== 'dns-lookup'
  ).slice(0, 3)

  // 添加一些推荐工具
  const recommended = [
    tools.find(t => t.id === 'whois-lookup'),
    tools.find(t => t.id === 'http-client'),
    tools.find(t => t.id === 'ip-info'),
    tools.find(t => t.id === 'ssl-checker')
  ].filter(Boolean)

  return [...sameCategory, ...recommended].slice(0, 4)
})

// 计算属性
const groupedResults = computed(() => {
  const grouped = {}
  dnsResults.value.forEach(record => {
    if (!grouped[record.type]) {
      grouped[record.type] = []
    }
    grouped[record.type].push(record)
  })
  return grouped
})

// 方法
const selectRecordType = (type) => {
  const index = selectedTypes.value.indexOf(type)
  if (index >= 0) {
    selectedTypes.value.splice(index, 1)
  } else {
    selectedTypes.value.push(type)
  }
}

const queryDns = async () => {
  if (!domain.value || selectedTypes.value.length === 0) return

  loading.value = true
  dnsResults.value = []
  traceRoute.value = []

  try {
    // 模拟API调用
    for (const type of selectedTypes.value) {
      await new Promise(resolve => setTimeout(resolve, 300))

      // 模拟返回数据
      const mockRecords = generateMockRecords(domain.value, type)
      dnsResults.value.push(...mockRecords)

      // 设置第一个激活的标签
      if (dnsResults.value.length === mockRecords.length) {
        activeTab.value = type
      }
    }

    // 模拟追踪路径
    if (options.value.traceRoute) {
      traceRoute.value = [
        { server: 'Root DNS Server', ip: '198.41.0.4', time: 23 },
        { server: 'TLD DNS Server', ip: '192.12.94.30', time: 45 },
        { server: 'Authoritative DNS', ip: '216.239.32.10', time: 12 }
      ]
    }

    // 添加到历史记录
    addToHistory()
  } catch (error) {
    console.error('查询失败:', error)
  } finally {
    loading.value = false
  }
}

const generateMockRecords = (domain, type) => {
  const baseRecord = {
    id: Math.random().toString(36).substr(2, 9),
    type,
    ttl: 300,
    server: dnsServer.value === 'system' ? 'System DNS' : dnsServer.value,
    responseTime: Math.floor(Math.random() * 100) + 10,
    details: options.value.includeDetails
  }

  switch (type) {
    case 'A':
      return [
        { ...baseRecord, value: '142.250.191.14' },
        { ...baseRecord, value: '142.250.191.78' }
      ]
    case 'AAAA':
      return [
        { ...baseRecord, value: '2607:f8b0:4009:812::200e' }
      ]
    case 'CNAME':
      return [
        { ...baseRecord, value: 'domains.google.com.' }
      ]
    case 'MX':
      return [
        { ...baseRecord, value: 'aspmx.l.google.com.', priority: 10 },
        { ...baseRecord, value: 'alt1.aspmx.l.google.com.', priority: 20 }
      ]
    case 'TXT':
      return [
        { ...baseRecord, value: 'v=spf1 include:_spf.google.com ~all' }
      ]
    case 'NS':
      return [
        { ...baseRecord, value: 'ns1.google.com.' },
        { ...baseRecord, value: 'ns2.google.com.' }
      ]
    default:
      return [baseRecord]
  }
}

const quickQuery = async (preset) => {
  domain.value = preset.domain
  selectedTypes.value = preset.types
  await queryDns()
}

const addToHistory = () => {
  const item = {
    id: Date.now(),
    domain: domain.value,
    types: [...selectedTypes.value],
    time: new Date()
  }

  const existing = history.value.findIndex(h => h.domain === item.domain)
  if (existing >= 0) {
    history.value.splice(existing, 1)
  }

  history.value.unshift(item)

  if (history.value.length > 10) {
    history.value = history.value.slice(0, 10)
  }

  saveHistory()
}

const loadHistory = (item) => {
  domain.value = item.domain
  selectedTypes.value = [...item.types]
  queryDns()
}

const clearHistory = () => {
  history.value = []
  saveHistory()
}

const saveHistory = () => {
  if (process.client) {
    localStorage.setItem('dns-query-history', JSON.stringify(history.value))
  }
}

const loadHistoryFromStorage = () => {
  if (process.client) {
    const saved = localStorage.getItem('dns-query-history')
    if (saved) {
      history.value = JSON.parse(saved)
    }
  }
}

const copyRecord = (record) => {
  navigator.clipboard.writeText(record.value).then(() => {
    // 可以添加提示
  })
}

const copyResults = () => {
  const text = dnsResults.value.map(r =>
    `${r.type}\t${r.value}\tTTL:${r.ttl}`
  ).join('\n')

  navigator.clipboard.writeText(text).then(() => {
    alert('DNS记录已复制到剪贴板')
  })
}

const exportResults = () => {
  const dataStr = JSON.stringify({
    domain: domain.value,
    server: dnsServer.value,
    results: dnsResults.value,
    traceRoute: traceRoute.value
  }, null, 2)

  const blob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.download = `${domain.value}-dns-${Date.now()}.json`
  link.href = url
  link.click()

  URL.revokeObjectURL(url)
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
  loadHistoryFromStorage()
})
</script>