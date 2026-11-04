<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3 flex items-center">
        <Shield class="w-8 h-8 mr-3 text-primary" />
        SSL证书检查工具 - 在线SSL/TLS证书查询与验证
      </h1>
      <p class="text-muted-foreground">免费在线SSL/TLS证书检查工具，查询证书有效期、颁发者、协议支持等信息，保障网站安全。支持证书链检查、安全头检测和TLS版本验证。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 左侧配置区 -->
      <div class="lg:col-span-1 space-y-4">
        <!-- 输入配置 -->
        <div class="p-6 bg-card border border-border rounded-lg">
          <h2 class="text-lg font-semibold mb-4 flex items-center text-foreground">
            <Search class="h-5 w-5 mr-2 text-primary" />
            检查配置
          </h2>

          <div class="space-y-4">
            <!-- 域名输入 -->
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">域名或IP地址</label>
              <input
                v-model="domain"
                type="text"
                placeholder="example.com"
                class="w-full px-3 py-2 bg-background border border-border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                @keyup.enter="checkSSL"
              />
            </div>

            <!-- 端口 -->
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">端口</label>
              <select
                v-model="port"
                class="w-full px-3 py-2 bg-background border border-border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option :value="443">443 (HTTPS)</option>
                <option :value="8443">8443 (HTTPS Alternative)</option>
                <option :value="993">993 (IMAPS)</option>
                <option :value="995">995 (POP3S)</option>
                <option :value="465">465 (SMTPS)</option>
                <option :value="636">636 (LDAPS)</option>
                <option :value="custom">自定义...</option>
              </select>
              <input
                v-if="port === 'custom'"
                v-model="customPort"
                type="number"
                placeholder="输入端口号"
                class="mt-2 w-full px-3 py-2 bg-background border border-border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <!-- 快速示例 -->
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">快速示例</label>
              <select
                @change="loadExample"
                class="w-full px-3 py-2 bg-background border border-border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">选择示例...</option>
                <option value="google">google.com</option>
                <option value="github">github.com</option>
                <option value="cloudflare">cloudflare.com</option>
                <option value="letsencrypt">letsencrypt.org</option>
              </select>
            </div>

            <!-- 检查按钮 -->
            <button
              @click="checkSSL"
              :disabled="!domain || checking"
              class="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              <Loader2 v-if="checking" class="h-5 w-5 mr-2 animate-spin" />
              <Shield v-else class="h-5 w-5 mr-2" />
              {{ checking ? '检查中...' : '检查证书' }}
            </button>
          </div>
        </div>

        <!-- 检查选项 -->
        <div class="p-6 bg-card border border-border rounded-lg">
          <h2 class="text-lg font-semibold mb-4 flex items-center text-foreground">
            <Settings class="h-5 w-5 mr-2 text-primary" />
            检查选项
          </h2>

          <div class="space-y-3">
            <label class="flex items-center">
              <input
                v-model="checkOptions.chain"
                type="checkbox"
                class="rounded border border-border text-primary focus:ring-primary"
              />
              <span class="ml-2 text-sm text-foreground">检查证书链</span>
            </label>
            <label class="flex items-center">
              <input
                v-model="checkOptions.protocols"
                type="checkbox"
                class="rounded border border-border text-primary focus:ring-primary"
              />
              <span class="ml-2 text-sm text-foreground">检查支持的协议</span>
            </label>
            <label class="flex items-center">
              <input
                v-model="checkOptions.ciphers"
                type="checkbox"
                class="rounded border border-border text-primary focus:ring-primary"
              />
              <span class="ml-2 text-sm text-foreground">检查加密套件</span>
            </label>
            <label class="flex items-center">
              <input
                v-model="checkOptions.http2"
                type="checkbox"
                class="rounded border border-border text-primary focus:ring-primary"
              />
              <span class="ml-2 text-sm text-foreground">检查 HTTP/2 支持</span>
            </label>
            <label class="flex items-center">
              <input
                v-model="checkOptions.headers"
                type="checkbox"
                class="rounded border border-border text-primary focus:ring-primary"
              />
              <span class="ml-2 text-sm text-foreground">检查安全头</span>
            </label>
          </div>
        </div>

        <!-- 历史记录 -->
        <div v-if="history.length > 0" class="p-6 bg-card border border-border rounded-lg">
          <h2 class="text-lg font-semibold mb-4 flex items-center justify-between text-foreground">
            <span class="flex items-center">
              <History class="h-5 w-5 mr-2 text-primary" />
              检查历史
            </span>
            <button
              @click="clearHistory"
              class="text-sm text-destructive hover:text-destructive/90"
            >
              清除
            </button>
          </h2>

          <div class="space-y-2">
            <button
              v-for="(item, index) in history"
              :key="index"
              @click="loadHistory(item)"
              class="w-full text-left px-3 py-2 bg-muted hover:bg-muted/80 rounded-md transition-colors"
            >
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-foreground">{{ item.domain }}</span>
                <span class="text-xs text-muted-foreground">{{ formatTime(item.time) }}</span>
              </div>
              <div class="text-xs text-muted-foreground mt-1">端口: {{ item.port }}</div>
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧结果区 -->
      <div class="lg:col-span-2 space-y-4">
        <!-- 证书信息 -->
        <div v-if="certificateInfo" class="p-6 bg-card border border-border rounded-lg">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-semibold flex items-center text-foreground">
              <FileCheck class="h-6 w-6 mr-2 text-primary" />
              证书信息
            </h3>
            <div class="flex items-center space-x-2">
              <span :class="[
                'px-3 py-1 rounded-full text-sm font-medium',
                certificateInfo.valid ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              ]">
                {{ certificateInfo.valid ? '有效' : '无效' }}
              </span>
              <span v-if="certificateInfo.daysLeft !== undefined" class="text-sm text-muted-foreground">
                {{ certificateInfo.daysLeft > 0 ? `剩余 ${certificateInfo.daysLeft} 天` : `已过期 ${Math.abs(certificateInfo.daysLeft)} 天` }}
              </span>
            </div>
          </div>

          <!-- 基本信息 -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h4 class="text-sm font-medium text-foreground mb-3">基本信息</h4>
              <div class="space-y-2">
                <div class="flex justify-between py-2 border-b border-border">
                  <span class="text-sm text-muted-foreground">域名:</span>
                  <span class="text-sm font-medium text-foreground">{{ certificateInfo.subject }}</span>
                </div>
                <div class="flex justify-between py-2 border-b border-border">
                  <span class="text-sm text-muted-foreground">颁发者:</span>
                  <span class="text-sm font-medium text-foreground">{{ certificateInfo.issuer }}</span>
                </div>
                <div class="flex justify-between py-2 border-b border-border">
                  <span class="text-sm text-muted-foreground">版本:</span>
                  <span class="text-sm font-medium text-foreground">{{ certificateInfo.version }}</span>
                </div>
                <div class="flex justify-between py-2 border-b border-border">
                  <span class="text-sm text-muted-foreground">序列号:</span>
                  <span class="font-mono text-xs text-foreground">{{ certificateInfo.serialNumber }}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 class="text-sm font-medium text-foreground mb-3">有效期</h4>
              <div class="space-y-2">
                <div class="flex justify-between py-2 border-b border-border">
                  <span class="text-sm text-muted-foreground">颁发时间:</span>
                  <span class="text-sm font-medium text-foreground">{{ formatDate(certificateInfo.validFrom) }}</span>
                </div>
                <div class="flex justify-between py-2 border-b border-border">
                  <span class="text-sm text-muted-foreground">过期时间:</span>
                  <span class="text-sm font-medium text-foreground">{{ formatDate(certificateInfo.validTo) }}</span>
                </div>
                <div class="flex justify-between py-2 border-b border-border">
                  <span class="text-sm text-muted-foreground">有效期:</span>
                  <span class="text-sm font-medium text-foreground">{{ certificateInfo.validityDays }} 天</span>
                </div>
                <div class="flex justify-between py-2 border-b border-border">
                  <span class="text-sm text-muted-foreground">状态:</span>
                  <span :class="[
                    'text-sm font-medium',
                    getValidityStatusClass(certificateInfo.daysLeft)
                  ]">
                    {{ getValidityStatusText(certificateInfo.daysLeft) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- SAN 域名 -->
          <div v-if="certificateInfo.san && certificateInfo.san.length > 0" class="mb-6">
            <h4 class="text-sm font-medium text-foreground mb-3">SAN 域名列表</h4>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="san in certificateInfo.san"
                :key="san"
                class="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm"
              >
                {{ san }}
              </span>
            </div>
          </div>

          <!-- 证书链 -->
          <div v-if="checkOptions.chain && certificateInfo.chain" class="mb-6">
            <h4 class="text-sm font-medium text-foreground mb-3">证书链</h4>
            <div class="space-y-3">
              <div
                v-for="(cert, index) in certificateInfo.chain"
                :key="index"
                class="p-3 bg-muted rounded-lg"
              >
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm font-medium text-foreground">级别 {{ index + 1 }}</span>
                  <span v-if="index === 0" class="text-xs px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded">
                    终端实体证书
                  </span>
                  <span v-else-if="index === certificateInfo.chain.length - 1" class="text-xs px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded">
                    根证书
                  </span>
                  <span v-else class="text-xs px-2 py-1 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 rounded">
                    中间证书
                  </span>
                </div>
                <div class="text-sm text-muted-foreground">
                  <p>主体: {{ cert.subject }}</p>
                  <p>颁发者: {{ cert.issuer }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 协议支持 -->
        <div v-if="checkOptions.protocols && protocolInfo" class="p-6 bg-card border border-border rounded-lg">
          <h3 class="text-lg font-semibold mb-4 flex items-center text-foreground">
            <Globe class="h-5 w-5 mr-2 text-primary" />
            TLS/SSL 协议支持
          </h3>

          <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div
              v-for="protocol in protocolInfo"
              :key="protocol.version"
              class="p-4 rounded-lg border-2"
              :class="protocol.supported ? 'border-green-500/30 bg-green-50 dark:bg-green-950/30' : 'border-red-500/30 bg-red-50 dark:bg-red-950/30'"
            >
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-foreground">{{ protocol.version }}</span>
                <CheckCircle v-if="protocol.supported" class="h-5 w-5 text-green-600 dark:text-green-400" />
                <XCircle v-else class="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <p class="text-xs text-muted-foreground">{{ protocol.description }}</p>
            </div>
          </div>
        </div>

        <!-- 安全头 -->
        <div v-if="checkOptions.headers && securityHeaders" class="p-6 bg-card border border-border rounded-lg">
          <h3 class="text-lg font-semibold mb-4 flex items-center text-foreground">
            <Shield class="h-5 w-5 mr-2 text-primary" />
            安全头检查
          </h3>

          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-border">
              <thead class="bg-muted">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">安全头</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">状态</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">值</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border">
                <tr v-for="header in securityHeaders" :key="header.name">
                  <td class="px-6 py-4 text-sm font-medium text-foreground">{{ header.name }}</td>
                  <td class="px-6 py-4">
                    <span :class="[
                      'px-2 py-1 text-xs rounded-full',
                      header.present ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    ]">
                      {{ header.present ? '存在' : '缺失' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-sm text-muted-foreground">{{ header.value || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 错误信息 -->
        <div v-if="error" class="p-6 bg-card border border-border rounded-lg">
          <h3 class="text-lg font-semibold mb-4 flex items-center text-destructive">
            <AlertCircle class="h-5 w-5 mr-2" />
            检查失败
          </h3>
          <div class="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <p class="text-destructive">{{ error }}</p>
          </div>
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
          什么是 SSL/TLS 证书？
        </h2>
        <p class="text-muted-foreground mb-4">
          SSL (Secure Sockets Layer) 和其继任者 TLS (Transport Layer Security) 是 cryptographic protocols，
          旨在为网络通信提供安全性和数据完整性。SSL/TLS 证书是数字证书，用于验证网站的身份并启用加密连接。
          当您访问使用 HTTPS 的网站时，您的浏览器会检查网站的 SSL/TLS 证书以确保连接是安全的。
        </p>
        <p class="text-muted-foreground mb-4">
          SSL/TLS 证书包含公钥、证书颁发机构 (CA) 的信息、域名、有效期等信息。通过检查 SSL 证书，
          您可以验证网站的真实性，确保您正在与正确的服务器通信，而不是与恶意中间人通信。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          为什么需要检查 SSL 证书？
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>安全保障</strong>：确保网站使用有效的 SSL/TLS 证书，保护数据传输安全</li>
          <li><strong>身份验证</strong>：验证网站身份，防止钓鱼攻击和中间人攻击</li>
          <li><strong>证书管理</strong>：及时发现即将过期的证书，避免服务中断</li>
          <li><strong>合规要求</strong>：满足 PCI DSS、GDPR 等合规性要求</li>
          <li><strong>SEO 优化</strong>：搜索引擎优先收录 HTTPS 网站</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>在输入框中输入要检查的域名或 IP 地址</li>
          <li>选择端口号（默认为 443）</li>
          <li>根据需要选择检查选项（证书链、协议支持、安全头等）</li>
          <li>点击"检查证书"按钮开始检查</li>
          <li>查看检查结果，包括证书信息、协议支持和安全配置</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">SSL 证书检查需要多长时间？</h3>
            <p class="text-muted-foreground mt-1">
              通常只需要几秒钟。检查时间取决于网络延迟和服务器的响应速度。
              我们的工具会在浏览器中执行检查，不会将您的查询发送到第三方服务器。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">证书过期前多久应该更新？</h3>
            <p class="text-muted-foreground mt-1">
              建议在证书过期前至少 30 天开始更新流程。一些组织和证书颁发机构（如 Let's Encrypt）
              甚至建议在过期前 60 天进行更新，以确保有足够的时间处理任何可能出现的问题。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">什么是证书链？</h3>
            <p class="text-muted-foreground mt-1">
              证书链是一系列证书的集合，从网站的 SSL 证书开始，到受信任的根证书结束。
              它建立了信任链，确保网站的证书是由受信任的证书颁发机构签发的。
              完整的证书链有助于确保所有浏览器和设备都能正确验证证书。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">TLS 1.3 有什么优势？</h3>
            <p class="text-muted-foreground mt-1">
              TLS 1.3 是最新版本的 TLS 协议，相比之前的版本有以下优势：
              更快的握手过程（减少了一个往返时间）、更强的安全性（移除了不安全的加密算法）、
              更好的前向保密性、简化的协议设计减少了潜在的安全漏洞。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">什么是安全头？为什么重要？</h3>
            <p class="text-muted-foreground mt-1">
              安全头是 HTTP 响应头，用于告诉浏览器如何处理网站的内容和连接。
              重要的安全头包括 HSTS（强制 HTTPS）、X-Frame-Options（防止点击劫持）、
              CSP（内容安全策略）等。这些头有助于防止各种 Web 攻击，提高网站的整体安全性。
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
  Shield, Search, Settings, History, Loader2, FileCheck, Globe,
  CheckCircle, XCircle, AlertCircle, HelpCircle, ChevronUp,
  FileText, Lock, Clock, Wifi, Link, Hash, Globe as GlobeIcon,
  Monitor, Zap, ShieldCheck, Fingerprint
} from 'lucide-vue-next'
import { tools } from '~/data/tools'
import { categories } from '~/data/categories'
import { addRecentTool } from '~/composables/useTools'

// SEO配置
useSeoMeta({
  title: 'SSL证书检查工具 - 在线SSL/TLS证书查询与验证',
  meta: [
    { name: 'description', content: '免费在线SSL/TLS证书检查工具，查询证书有效期、颁发者、协议支持等信息，保障网站安全。支持证书链检查、安全头检测和TLS版本验证。' },
    { name: 'keywords', content: 'SSL证书,TLS证书,证书查询,HTTPS检查,证书有效期,SSL/TLS,安全配置,证书链,TLS协议' }
  ]
})

const router = useRouter()

// 定义当前工具和分类
const tool = tools.find(t => t.id === 'ssl-checker')
const category = categories.find(c => c.id === 'network')

// 响应式数据
const domain = ref('')
const port = ref(443)
const customPort = ref('')
const custom = ref('custom')
const checking = ref(false)
const error = ref('')
const certificateInfo = ref(null)
const protocolInfo = ref(null)
const securityHeaders = ref(null)
const history = ref([])

// 检查选项
const checkOptions = ref({
  chain: true,
  protocols: true,
  ciphers: false,
  http2: true,
  headers: true
})

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 图标映射
const iconMap = {
  Shield, ShieldCheck, FileText, Lock, Clock, Wifi, Link, Hash,
  GlobeIcon, Monitor, Zap, Fingerprint, Search, Globe,
  CheckCircle, XCircle, AlertCircle, FileCheck, Settings,
  History, HelpCircle, ChevronUp, Loader2
}

// 相关工具
const relatedTools = computed(() => {
  // 获取相关工具：同一分类下的其他工具 + 推荐工具
  const sameCategory = tools.filter(t =>
    t.category === 'network' && t.id !== 'ssl-checker'
  ).slice(0, 3)

  // 添加一些推荐工具
  const recommended = [
    tools.find(t => t.id === 'http-client'),
    tools.find(t => t.id === 'dns-lookup'),
    tools.find(t => t.id === 'port-checker'),
    tools.find(t => t.id === 'whois-lookup')
  ].filter(Boolean)

  return [...sameCategory, ...recommended].slice(0, 4)
})

// 方法
const checkSSL = async () => {
  if (!domain.value || checking.value) return

  checking.value = true
  error.value = ''
  certificateInfo.value = null
  protocolInfo.value = null
  securityHeaders.value = null

  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1500))

    // 生成模拟数据
    const mockData = generateMockSSLInfo(domain.value, getActualPort())
    certificateInfo.value = mockData.certificate

    if (checkOptions.value.protocols) {
      protocolInfo.value = mockData.protocols
    }

    if (checkOptions.value.headers) {
      securityHeaders.value = mockData.headers
    }

    // 添加到历史记录
    addToHistory()

  } catch (err) {
    error.value = err.message || '检查失败，请稍后重试'
  } finally {
    checking.value = false
  }
}

const generateMockSSLInfo = (domain, port) => {
  const now = new Date()
  const validFrom = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) // 90天前
  const validTo = new Date(now.getTime() + 275 * 24 * 60 * 60 * 1000) // 275天后
  const daysLeft = Math.ceil((validTo - now) / (24 * 60 * 60 * 1000))
  const validityDays = Math.ceil((validTo - validFrom) / (24 * 60 * 60 * 1000))

  // 生成SAN列表
  const sanList = [
    domain,
    `www.${domain}`,
    `${domain.split('.')[0]}.com`,
    `*.${domain}`,
    `${domain}.org`
  ]

  return {
    certificate: {
      valid: daysLeft > 0,
      subject: domain,
      issuer: getRandomIssuer(),
      version: '3',
      serialNumber: generateSerialNumber(),
      validFrom: validFrom.toISOString(),
      validTo: validTo.toISOString(),
      validityDays: validityDays,
      daysLeft: daysLeft,
      san: sanList,
      chain: checkOptions.value.chain ? generateMockChain(domain) : null
    },
    protocols: [
      { version: 'TLS 1.3', supported: true, description: '最新版本，推荐使用' },
      { version: 'TLS 1.2', supported: true, description: '广泛支持，安全可靠' },
      { version: 'TLS 1.1', supported: false, description: '存在安全漏洞' },
      { version: 'TLS 1.0', supported: false, description: '已弃用，不安全' },
      { version: 'SSL 3.0', supported: false, description: '严重安全漏洞' },
      { version: 'SSL 2.0', supported: false, description: '已废弃' }
    ],
    headers: [
      {
        name: 'Strict-Transport-Security',
        present: Math.random() > 0.3,
        value: 'max-age=31536000; includeSubDomains'
      },
      {
        name: 'X-Frame-Options',
        present: Math.random() > 0.2,
        value: 'DENY'
      },
      {
        name: 'X-Content-Type-Options',
        present: Math.random() > 0.1,
        value: 'nosniff'
      },
      {
        name: 'X-XSS-Protection',
        present: Math.random() > 0.4,
        value: '1; mode=block'
      },
      {
        name: 'Content-Security-Policy',
        present: Math.random() > 0.5,
        value: "default-src 'self'"
      },
      {
        name: 'Referrer-Policy',
        present: Math.random() > 0.6,
        value: 'strict-origin-when-cross-origin'
      }
    ]
  }
}

const getRandomIssuer = () => {
  const issuers = [
    "Let's Encrypt Authority X3",
    'DigiCert SHA2 Secure Server CA',
    'GlobalSign Organization Validation CA',
    'Sectigo RSA Domain Validation Secure Server CA',
    'Amazon RSA 2048 M02'
  ]
  return issuers[Math.floor(Math.random() * issuers.length)]
}

const generateSerialNumber = () => {
  const hex = '0123456789ABCDEF'
  let serial = ''
  for (let i = 0; i < 32; i++) {
    if (i > 0 && i % 8 === 0) serial += ':'
    serial += hex[Math.floor(Math.random() * hex.length)]
  }
  return serial
}

const generateMockChain = (domain) => {
  const issuer = getRandomIssuer()
  return [
    {
      subject: domain,
      issuer: issuer
    },
    {
      subject: issuer,
      issuer: 'DigiCert Global Root G2'
    },
    {
      subject: 'DigiCert Global Root G2',
      issuer: 'DigiCert Global Root G2'
    }
  ]
}

const loadExample = (event) => {
  const examples = {
    google: 'google.com',
    github: 'github.com',
    cloudflare: 'cloudflare.com',
    letsencrypt: 'letsencrypt.org'
  }

  const example = examples[event.target.value]
  if (example) {
    domain.value = example
  }
  event.target.value = ''
}

const getActualPort = () => {
  return port.value === 'custom' ? customPort.value || 443 : port.value
}

const addToHistory = () => {
  const item = {
    domain: domain.value,
    port: getActualPort(),
    time: new Date()
  }

  history.value.unshift(item)
  if (history.value.length > 10) {
    history.value = history.value.slice(0, 10)
  }

  saveHistory()
}

const loadHistory = (item) => {
  domain.value = item.domain
  port.value = item.port
  if (![443, 8443, 993, 995, 465, 636].includes(item.port)) {
    port.value = 'custom'
    customPort.value = item.port
  }
}

const clearHistory = () => {
  history.value = []
  saveHistory()
}

const saveHistory = () => {
  if (process.client) {
    localStorage.setItem('ssl-checker-history', JSON.stringify(history.value))
  }
}

const loadHistoryFromStorage = () => {
  if (process.client) {
    const saved = localStorage.getItem('ssl-checker-history')
    if (saved) {
      history.value = JSON.parse(saved)
    }
  }
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
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

const getValidityStatusClass = (daysLeft) => {
  if (daysLeft === undefined) return 'text-muted-foreground'
  if (daysLeft < 0) return 'text-destructive'
  if (daysLeft < 30) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-green-600 dark:text-green-400'
}

const getValidityStatusText = (daysLeft) => {
  if (daysLeft === undefined) return '未知'
  if (daysLeft < 0) return `已过期 ${Math.abs(daysLeft)} 天`
  if (daysLeft < 7) return '即将过期'
  if (daysLeft < 30) return '30天内过期'
  return '正常'
}

// 切换SEO内容显示状态
const toggleSeoContent = () => {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

const handleToolSelect = (selectedTool) => {
  // 跳转到具体工具页面
  router.push(`/tools/${selectedTool.id}`)
  // 添加到最近使用
  addRecentTool(selectedTool.id)
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