<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" :tool="tool" /> -->

    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">WHOIS查询 - 在线域名WHOIS信息查询工具</h1>
      <p class="text-muted-foreground">免费在线WHOIS查询工具，查询域名的注册信息、注册商、DNS服务器、到期时间等详细信息。支持批量查询，数据本地处理，安全可靠。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 左侧查询面板 -->
      <div class="lg:col-span-1 space-y-6">
        <!-- 域名输入 -->
        <div class="bg-card p-6 rounded-lg border border-border">
          <h2 class="text-lg font-semibold mb-4 flex items-center text-foreground">
            <Icon name="lucide:search" class="h-5 w-5 mr-2 text-primary" />
            域名查询
          </h2>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">输入域名</label>
              <input
                v-model="domain"
                type="text"
                placeholder="例如: google.com"
                class="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                @keyup.enter="queryWhois"
              />
              <p class="mt-1 text-xs text-muted-foreground">
                请输入完整的域名（如：google.com）
              </p>
            </div>

            <!-- 快速选择 -->
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">热门域名</label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  v-for="preset in domainPresets"
                  :key="preset.domain"
                  @click="domain = preset.domain"
                  class="px-3 py-2 text-sm bg-muted hover:bg-muted/80 text-muted-foreground rounded-md transition-colors"
                >
                  {{ preset.domain }}
                </button>
              </div>
            </div>

            <!-- 查询选项 -->
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">查询选项</label>
              <div class="space-y-2">
                <label class="flex items-center">
                  <input
                    v-model="options.includeRaw"
                    type="checkbox"
                    class="mr-2 rounded"
                  />
                  <span class="text-sm text-muted-foreground">显示原始数据</span>
                </label>
                <label class="flex items-center">
                  <input
                    v-model="options.includeHistory"
                    type="checkbox"
                    class="mr-2 rounded"
                  />
                  <span class="text-sm text-muted-foreground">包含历史记录</span>
                </label>
              </div>
            </div>

            <!-- 查询按钮 -->
            <button
              @click="queryWhois"
              :disabled="!domain || loading"
              class="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors flex items-center justify-center font-medium"
            >
              <Icon v-if="loading" name="lucide:loader-2" class="h-5 w-5 mr-2 animate-spin" />
              <Icon v-else name="lucide:search" class="h-5 w-5 mr-2" />
              {{ loading ? '查询中...' : '查询WHOIS' }}
            </button>
          </div>
        </div>

        <!-- 批量查询 -->
        <div class="bg-card p-6 rounded-lg border border-border">
          <h2 class="text-lg font-semibold mb-4 flex items-center text-foreground">
            <Icon name="lucide:list" class="h-5 w-5 mr-2 text-primary" />
            批量查询
          </h2>

          <textarea
            v-model="batchDomains"
            placeholder="每行一个域名，最多支持10个域名&#10;example.com&#10;test.org&#10;demo.net"
            class="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none"
            rows="4"
          ></textarea>

          <button
            @click="batchQuery"
            :disabled="!batchDomains || batchLoading"
            class="w-full mt-3 bg-secondary text-secondary-foreground py-2 px-4 rounded-md hover:bg-secondary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors flex items-center justify-center font-medium"
          >
            <Icon v-if="batchLoading" name="lucide:loader-2" class="h-5 w-5 mr-2 animate-spin" />
            <Icon v-else name="lucide:layers" class="h-5 w-5 mr-2" />
            {{ batchLoading ? '查询中...' : '批量查询' }}
          </button>
        </div>

        <!-- 查询历史 -->
        <div v-if="history.length > 0" class="bg-card p-6 rounded-lg border border-border">
          <h2 class="text-lg font-semibold mb-4 flex items-center justify-between text-foreground">
            <span class="flex items-center">
              <Icon name="lucide:history" class="h-5 w-5 mr-2 text-primary" />
              查询历史
            </span>
            <button
              @click="clearHistory"
              class="text-sm text-destructive hover:text-destructive/90 transition-colors"
            >
              清除
            </button>
          </h2>

          <div class="space-y-2">
            <button
              v-for="item in history"
              :key="item.domain"
              @click="domain = item.domain"
              class="w-full text-left px-3 py-2 bg-muted hover:bg-muted/80 rounded-md transition-colors"
            >
              <div class="font-medium text-foreground">{{ item.domain }}</div>
              <div class="text-xs text-muted-foreground">{{ item.registrar }} • {{ formatTime(item.time) }}</div>
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧结果显示 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 查询结果 -->
        <div v-if="whoisData" class="bg-card p-6 rounded-lg border border-border">
          <!-- 错误信息显示 -->
          <div v-if="whoisData.error" class="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div class="flex items-center">
              <AlertCircle class="h-5 w-5 text-destructive mr-2" />
              <div>
                <h4 class="font-semibold text-foreground">查询失败</h4>
                <p class="text-sm text-muted-foreground mt-1">{{ whoisData.error }}</p>
              </div>
            </div>
          </div>

          <div v-else class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-semibold flex items-center text-foreground">
              <Icon name="lucide:info" class="h-6 w-6 mr-2 text-primary" />
              WHOIS信息 - {{ whoisData.domain }}
            </h3>
            <div class="flex space-x-2">
              <button
                @click="exportJson"
                class="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors flex items-center text-sm"
              >
                <Icon name="lucide:download" class="h-4 w-4 mr-1" />
                导出JSON
              </button>
              <button
                @click="copyInfo"
                class="px-4 py-2 bg-muted hover:bg-muted/80 text-muted-foreground rounded-md transition-colors flex items-center text-sm"
              >
                <Icon name="lucide:copy" class="h-4 w-4 mr-1" />
                复制
              </button>
            </div>
          </div>

          <!-- 基本信息 -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div class="space-y-4">
              <h4 class="font-medium text-foreground flex items-center">
                <Icon name="lucide:globe" class="h-4 w-4 mr-2 text-primary" />
                基本信息
              </h4>

              <div class="space-y-2">
                <div class="flex justify-between py-2 border-b border-border">
                  <span class="text-muted-foreground">域名</span>
                  <span class="font-medium text-foreground">{{ whoisData.domain }}</span>
                </div>
                <div class="flex justify-between py-2 border-b border-border">
                  <span class="text-muted-foreground">状态</span>
                  <span class="font-medium px-2 py-1 rounded text-xs" :class="getStatusClass(whoisData.status)">
                    {{ whoisData.status }}
                  </span>
                </div>
                <div class="flex justify-between py-2 border-b border-border">
                  <span class="text-muted-foreground">注册时间</span>
                  <span class="font-medium text-foreground">{{ whoisData.createdDate }}</span>
                </div>
                <div class="flex justify-between py-2 border-b border-border">
                  <span class="text-muted-foreground">到期时间</span>
                  <span class="font-medium text-foreground">{{ whoisData.expiryDate }}</span>
                </div>
              </div>
            </div>

            <div class="space-y-4">
              <h4 class="font-medium text-foreground flex items-center">
                <Icon name="lucide:building" class="h-4 w-4 mr-2 text-primary" />
                注册商信息
              </h4>

              <div class="space-y-2">
                <div class="flex justify-between py-2 border-b border-border">
                  <span class="text-muted-foreground">注册商</span>
                  <span class="font-medium text-foreground">{{ whoisData.registrar }}</span>
                </div>
                <div class="flex justify-between py-2 border-b border-border">
                  <span class="text-muted-foreground">注册商URL</span>
                  <a :href="whoisData.registrarUrl" target="_blank" class="font-medium text-primary hover:underline">
                    {{ whoisData.registrarUrl }}
                  </a>
                </div>
                <div class="flex justify-between py-2 border-b border-border">
                  <span class="text-muted-foreground">WHOIS服务器</span>
                  <span class="font-medium text-foreground">{{ whoisData.whoisServer }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 联系信息 -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div class="space-y-4">
              <h4 class="font-medium text-foreground flex items-center">
                <Icon name="lucide:user" class="h-4 w-4 mr-2 text-primary" />
                注册人信息
              </h4>

              <div class="space-y-2">
                <div class="flex justify-between py-2 border-b border-border">
                  <span class="text-muted-foreground">姓名</span>
                  <span class="font-medium text-foreground">{{ whoisData.registrant.name || '隐私保护' }}</span>
                </div>
                <div v-if="whoisData.registrant.organization && whoisData.registrant.organization !== '-'" class="flex justify-between py-2 border-b border-border">
                  <span class="text-muted-foreground">组织</span>
                  <span class="font-medium text-foreground">{{ whoisData.registrant.organization }}</span>
                </div>
                <div v-if="whoisData.registrant.email && whoisData.registrant.email !== '-'" class="flex justify-between py-2 border-b border-border">
                  <span class="text-muted-foreground">邮箱</span>
                  <span class="font-medium text-foreground">{{ whoisData.registrant.email }}</span>
                </div>
                <div v-if="whoisData.registrant.country && whoisData.registrant.country !== '-'" class="flex justify-between py-2 border-b border-border">
                  <span class="text-muted-foreground">国家</span>
                  <span class="font-medium text-foreground">{{ whoisData.registrant.country }}</span>
                </div>
              </div>
            </div>

            <div class="space-y-4">
              <h4 class="font-medium text-foreground flex items-center">
                <Icon name="lucide:server" class="h-4 w-4 mr-2 text-primary" />
                DNS服务器
              </h4>

              <div class="space-y-2">
                <div v-for="(ns, index) in whoisData.nameServers" :key="index" class="flex justify-between py-2 border-b border-border">
                  <span class="text-muted-foreground">NS{{ index + 1 }}</span>
                  <span class="font-medium text-foreground">{{ ns }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 原始数据 -->
          <div v-if="options.includeRaw && whoisData.rawData">
            <h4 class="font-medium text-foreground mb-4 flex items-center">
              <Icon name="lucide:file-text" class="h-4 w-4 mr-2 text-primary" />
              原始WHOIS数据
            </h4>
            <pre class="bg-muted p-4 rounded-lg text-sm overflow-x-auto text-muted-foreground">{{ whoisData.rawData }}</pre>
          </div>
        </div>

        <!-- 批量查询结果 -->
        <div v-if="batchResults.length > 0" class="bg-card p-6 rounded-lg border border-border">
          <h3 class="text-xl font-semibold mb-4 flex items-center text-foreground">
            <Icon name="lucide:layers" class="h-6 w-6 mr-2 text-primary" />
            批量查询结果
          </h3>

          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-border">
              <thead class="bg-muted">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    域名
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    状态
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    注册商
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    到期时间
                  </th>
                </tr>
              </thead>
              <tbody class="bg-card divide-y divide-border">
                <tr v-for="result in batchResults" :key="result.domain">
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                    {{ result.domain }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                      :class="getStatusClass(result.status)">
                      {{ result.status }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {{ result.registrar || '-' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {{ result.expiryDate || '-' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <button
            @click="exportBatchResults"
            class="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors flex items-center font-medium"
          >
            <Icon name="lucide:download" class="h-4 w-4 mr-2" />
            导出结果
          </button>
        </div>
      </div>
    </div>

    <!-- SEO 内容长尾区 -->
    <div class="p-6 mb-12 bg-card rounded-lg border border-border relative">
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
          什么是 WHOIS 查询？
        </h2>
        <p class="text-muted-foreground mb-4">
          WHOIS 是一种用于查询域名注册信息的协议和服务。通过 WHOIS 查询，您可以获取域名的详细信息，
          包括域名注册人、注册商、注册日期、到期日期、DNS 服务器等重要信息。这些信息对于网络安全、
          域名交易、品牌保护等方面都有着重要的作用。
        </p>
        <p class="text-muted-foreground mb-4">
          WHOIS 数据由互联网域名管理机构（ICANN）统一管理，各个域名注册商负责维护其注册域名的 WHOIS 信息。
          当您注册一个域名时，您的信息会被记录在 WHOIS 数据库中，除非您启用了隐私保护服务。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>在左侧输入框中输入要查询的域名（如 google.com）</li>
          <li>可选择顶级域名或直接输入完整域名</li>
          <li>点击"查询WHOIS"按钮或按 Enter 键开始查询</li>
          <li>查看右侧显示的域名详细信息</li>
          <li>如需批量查询，可在批量查询框中输入多个域名（每行一个）</li>
          <li>可以导出查询结果为 JSON 格式以便进一步分析</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          WHOIS 信息包含哪些内容？
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>域名基本信息</strong>：域名名称、注册状态、注册日期、到期日期、最后更新日期等</li>
          <li><strong>注册商信息</strong>：域名注册商名称、网站地址、WHOIS 服务器、联系方式等</li>
          <li><strong>注册人信息</strong>：域名所有者的姓名、组织、邮箱、电话、地址等（可能受隐私保护）</li>
          <li><strong>技术联系人</strong>：技术负责人的联系方式和相关信息</li>
          <li><strong>DNS 服务器</strong>：域名使用的名称服务器列表</li>
          <li><strong>域名状态</strong>：如 clientDeleteProhibited、clientTransferProhibited 等状态标记</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">为什么有些域名的 WHOIS 信息不完整？</h3>
            <p class="text-muted-foreground mt-1">
              这通常是由于域名启用了隐私保护服务（Whois Privacy Protection）。注册商为了保护域名所有者的隐私，
              会在 WHOIS 数据库中显示代理信息而不是真实的注册人信息。这是 ICANN 允许的合法做法。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">WHOIS 查询准确吗？</h3>
            <p class="text-muted-foreground mt-1">
              WHOIS 信息通常由域名注册商实时更新，但可能存在一定的延迟。一些域名信息可能需要 24-48 小时才能同步更新。
              另外，不同注册商的 WHOIS 服务器可能返回不同格式的信息。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">可以查询所有域名后缀吗？</h3>
            <p class="text-muted-foreground mt-1">
              我们的工具支持查询大多数主流的通用顶级域名（gTLD）和国家代码顶级域名（ccTLD）。
              但某些特殊的域名后缀可能需要通过专门的 WHOIS 服务器查询。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">WHOIS 查询是否合法？</h3>
            <p class="text-muted-foreground mt-1">
              WHOIS 查询是完全合法的，这是互联网基础设施的一部分。但使用 WHOIS 信息进行垃圾邮件发送、
              欺诈或其他非法活动是违法的。请合理使用查询到的信息。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">域名状态标识是什么意思？</h3>
            <p class="text-muted-foreground mt-1">
              域名状态标识表示域名当前的锁定状态：
              <br>• clientDeleteProhibited - 禁止删除
              <br>• clientTransferProhibited - 禁止转移
              <br>• clientUpdateProhibited - 禁止更新
              <br>• serverTransferProhibited - 服务器端禁止转移
              这些状态通常是为了保护域名安全而设置的。
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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Globe, Search, List, History, Download, Copy, Info,
  Building, User, Server, FileText, Layers, HelpCircle, ChevronUp,
  Wifi, Shield, Lock, Clock, Globe2, Link2, MapPin, Mail,
  Phone, Calendar, AlertCircle, CheckCircle, XCircle
} from 'lucide-vue-next'
import { tools } from '~/data/tools'
import { categories } from '~/data/categories'
import { addRecentTool } from '~/composables/useTools'

definePageMeta({
  layout: 'default'
})

// SEO配置
useSeoMeta({
  title: 'WHOIS查询 - 在线域名WHOIS信息查询工具',
  meta: [
    { name: 'description', content: '免费在线WHOIS查询工具，查询域名的注册信息、注册商、DNS服务器、到期时间等详细信息。支持批量查询，数据本地处理，安全可靠。' },
    { name: 'keywords', content: 'WHOIS,域名查询,域名信息,注册商,DNS,域名到期,批量查询,域名WHOIS' }
  ]
})

const router = useRouter()

// 定义当前工具和分类
const tool = tools.find(t => t.id === 'whois-lookup')
const category = categories.find(c => c.id === 'network')

// 响应式数据
const domain = ref('')
const loading = ref(false)
const whoisData = ref(null)
const batchDomains = ref('')
const batchLoading = ref(false)
const batchResults = ref([])
const history = ref([])

// 查询选项
const options = ref({
  includeRaw: false,
  includeHistory: false
})

// 域名预设
const domainPresets = [
  { domain: 'google.com' },
  { domain: 'github.com' },
  { domain: 'stackoverflow.com' },
  { domain: 'wikipedia.org' }
]

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 图标映射
const iconMap = {
  Globe, Search, List, History, Download, Copy, Info,
  Building, User, Server, FileText, Layers, HelpCircle,
  Wifi, Shield, Lock, Clock, Globe2, Link2, MapPin,
  Mail, Phone, Calendar, AlertCircle, CheckCircle, XCircle
}

// 相关工具
const relatedTools = [
  {
    id: 'dns-lookup',
    name: 'DNS查询',
    description: '查询域名的DNS记录，包括A、MX、NS、CNAME等记录类型',
    icon: 'Wifi'
  },
  {
    id: 'ip-info',
    name: 'IP地址查询',
    description: '查询IP地址的地理位置、运营商、网络类型等信息',
    icon: 'Globe2'
  },
  {
    id: 'ssl-checker',
    name: 'SSL证书查询',
    description: '检查网站的SSL证书状态、有效期、颁发机构等信息',
    icon: 'Shield'
  },
  {
    id: 'port-checker',
    name: '端口扫描',
    description: '扫描指定主机的端口开放状态，支持常见端口和自定义端口',
    icon: 'Link2'
  }
]

// 方法
const queryWhois = async () => {
  if (!domain.value) return

  loading.value = true
  whoisData.value = null

  try {
    // 直接使用输入的完整域名
    const fullDomain = domain.value.trim()

    // 调用真实API
    const response = await fetch(`https://v2.xxapi.cn/api/whois?domain=${encodeURIComponent(fullDomain)}`)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()

    if (result.code !== 200) {
      throw new Error(result.msg || '查询失败')
    }

    // 解析API返回的数据
    const data = result.data
    const formattedData = {
      domain: data['Domain Name'] || data.data?.domain_name || fullDomain,
      status: parseDomainStatus(data.domain_status || data.data?.domain_status),
      createdDate: formatDate(data['Registration Time'] || data.data?.registration_time),
      expiryDate: formatDate(data['Expiration Time'] || data.data?.expiration_time),
      updatedDate: formatDate(data['Updated Time'] || data.data?.updated_time),
      registrar: data['Sponsoring Registrar'] || data['Registrar URL']?.replace(/https?:\/\//, '').replace(/\/$/, '') || '-',
      registrarUrl: data['Registrar URL'] || '#',
      whoisServer: '-',
      registrant: {
        name: data.Registrant || data.data?.registrant || '隐私保护',
        organization: data.data?.registrant_organization || '-',
        country: data.data?.registrant_country || '-',
        email: data['Registrant Contact Email'] || data.data?.registrant_contact_email || '-'
      },
      nameServers: data['DNS Serve'] || data.data?.dns_serve || [],
      rawData: options.value.includeRaw ? JSON.stringify(data, null, 2) : null
    }

    whoisData.value = formattedData

    // 添加到历史记录
    addToHistory(fullDomain, formattedData.registrar)

  } catch (error) {
    console.error('查询失败:', error)
    const fullDomain = domain.value.trim()
    whoisData.value = {
      domain: fullDomain,
      error: error.message || '域名无效或查询失败'
    }
  } finally {
    loading.value = false
  }
}

const batchQuery = async () => {
  if (!batchDomains.value) return

  batchLoading.value = true
  batchResults.value = []

  const domains = batchDomains.value.split('\n').filter(d => d.trim())

  // 限制批量查询数量，避免请求过多
  const maxBatchSize = 10
  const limitedDomains = domains.slice(0, maxBatchSize)

  for (const d of limitedDomains) {
    try {
      // 调用真实API
      const response = await fetch(`https://v2.xxapi.cn/api/whois?domain=${encodeURIComponent(d.trim())}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.code === 200) {
        const data = result.data
        batchResults.value.push({
          domain: data['Domain Name'] || data.data?.domain_name || d.trim(),
          status: parseDomainStatus(data.domain_status || data.data?.domain_status),
          registrar: data['Sponsoring Registrar'] || data['Registrar URL']?.replace(/https?:\/\//, '').replace(/\/$/, '') || '-',
          expiryDate: formatDate(data['Expiration Time'] || data.data?.expiration_time)
        })
      } else {
        throw new Error(result.msg || '查询失败')
      }

      // 添加延迟避免请求过快
      await new Promise(resolve => setTimeout(resolve, 500))

    } catch (error) {
      batchResults.value.push({
        domain: d.trim(),
        status: '查询失败',
        registrar: null,
        expiryDate: null
      })
    }
  }

  batchLoading.value = false
}

const parseDomainStatus = (status) => {
  if (!status) return '未知'

  // 解析域名状态
  if (status.includes('clientDeleteProhibited') || status.includes('serverDeleteProhibited')) {
    return '已注册 (锁定)'
  } else if (status.includes('clientTransferProhibited') || status.includes('serverTransferProhibited')) {
    return '已注册 (转移锁定)'
  } else if (status.includes('clientUpdateProhibited') || status.includes('serverUpdateProhibited')) {
    return '已注册 (更新锁定)'
  } else if (status.includes('OK')) {
    return '已注册'
  } else {
    return '已注册'
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'

  try {
    // 处理ISO格式的日期
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) {
      return dateStr // 如果无法解析，返回原始字符串
    }
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  } catch (e) {
    return dateStr
  }
}

const getStatusClass = (status) => {
  switch (status) {
    case '已注册':
    case '已注册 (锁定)':
    case '已注册 (转移锁定)':
    case '已注册 (更新锁定)':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    case '可注册':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    case '查询失败':
    case '未知':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
  }
}

const addToHistory = (domain, registrar) => {
  const existing = history.value.findIndex(item => item.domain === domain)
  if (existing >= 0) {
    history.value.splice(existing, 1)
  }

  history.value.unshift({
    domain,
    registrar,
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
    localStorage.setItem('whois-query-history', JSON.stringify(history.value))
  }
}

const loadHistory = () => {
  if (process.client) {
    const saved = localStorage.getItem('whois-query-history')
    if (saved) {
      history.value = JSON.parse(saved)
    }
  }
}

const copyInfo = () => {
  if (!whoisData.value) return

  const text = `域名: ${whoisData.value.domain}
状态: ${whoisData.value.status}
注册商: ${whoisData.value.registrar}
注册时间: ${whoisData.value.createdDate}
到期时间: ${whoisData.value.expiryDate}`

  navigator.clipboard.writeText(text).then(() => {
    // 这里可以添加复制成功的提示
  })
}

const exportJson = () => {
  if (!whoisData.value) return

  const dataStr = JSON.stringify(whoisData.value, null, 2)
  const blob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.download = `${whoisData.value.domain}-whois.json`
  link.href = url
  link.click()

  URL.revokeObjectURL(url)
}

const exportBatchResults = () => {
  if (batchResults.value.length === 0) return

  const dataStr = JSON.stringify(batchResults.value, null, 2)
  const blob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.download = `batch-whois-${Date.now()}.json`
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

// 生命周期
onMounted(() => {
  loadHistory()
  // 添加到最近使用
  if (tool) {
    addRecentTool(tool.id)
  }
})
</script>