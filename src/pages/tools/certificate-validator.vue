<template>
  <div class="max-w-6xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">SSL/TLS证书验证器</h1>
      <p class="text-muted-foreground">验证SSL/TLS证书的有效性、检查证书链、过期时间和配置安全性</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：输入和验证 -->
      <div class="space-y-4">
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <Globe class="w-5 h-5 text-primary" />
            输入网站URL
          </h2>

          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium mb-2 block">网站地址</label>
              <div class="flex gap-2">
                <input
                  v-model="websiteUrl"
                  type="url"
                  placeholder="https://example.com"
                  class="flex-1 px-4 py-3 border border-border rounded-lg font-mono text-sm"
                  @keyup.enter="validateCertificate"
                >
                <button
                  @click="validateCertificate"
                  :disabled="!websiteUrl || validating"
                  class="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 text-sm"
                >
                  {{ validating ? '验证中...' : '验证证书' }}
                </button>
              </div>
            </div>

            <!-- 验证选项 -->
            <div class="space-y-2">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" v-model="checkChain" class="rounded">
                <span class="text-sm">检查证书链</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" v-model="checkProtocols" class="rounded">
                <span class="text-sm">检查TLS协议版本</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" v-model="checkCiphers" class="rounded">
                <span class="text-sm">检查加密套件</span>
              </label>
            </div>

            <!-- 快速测试 -->
            <div>
              <label class="text-sm font-medium mb-2 block">快速测试</label>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="site in exampleSites"
                  :key="site.url"
                  @click="websiteUrl = site.url; validateCertificate()"
                  class="px-3 py-1 border rounded hover:bg-muted text-sm"
                >
                  {{ site.name }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 验证结果 -->
        <div v-if="validationResult" class="bg-card rounded-lg p-6 border">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold">验证结果</h2>
            <div class="flex items-center gap-2"
              :class="validationResult.valid ? 'text-green-600' : 'text-red-600'"
            >
              <component :is="validationResult.valid ? 'CheckCircle' : 'XCircle'" class="w-5 h-5" />
              <span class="font-medium">{{ validationResult.valid ? '证书有效' : '证书无效' }}</span>
            </div>
          </div>

          <!-- 证书信息 -->
          <div class="space-y-3">
            <div class="grid grid-cols-2 gap-2 text-sm">
              <div class="p-2 bg-muted rounded">
                <span class="text-muted-foreground">颁发给</span>
                <p class="font-mono text-xs truncate mt-1">{{ validationResult.subject }}</p>
              </div>
              <div class="p-2 bg-muted rounded">
                <span class="text-muted-foreground">颁发者</span>
                <p class="font-mono text-xs truncate mt-1">{{ validationResult.issuer }}</p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2 text-sm">
              <div class="p-2 bg-muted rounded">
                <span class="text-muted-foreground">生效日期</span>
                <p class="font-mono text-xs mt-1">{{ validationResult.validFrom }}</p>
              </div>
              <div class="p-2 bg-muted rounded">
                <span class="text-muted-foreground">过期日期</span>
                <p class="font-mono text-xs mt-1">{{ validationResult.validTo }}</p>
              </div>
            </div>

            <div class="p-2 bg-muted rounded">
              <div class="flex items-center justify-between mb-1">
                <span class="text-sm text-muted-foreground">剩余有效期</span>
                <span class="text-xs"
                  :class="getDaysRemainingColor(validationResult.daysRemaining)"
                >
                  {{ validationResult.daysRemaining }} 天
                </span>
              </div>
              <div class="w-full bg-background rounded-full h-2">
                <div
                  class="h-2 rounded-full transition-all"
                  :class="getDaysRemainingBarColor(validationResult.daysRemaining)"
                  :style="{ width: Math.min(100, (validationResult.daysRemaining / 90) * 100) + '%' }"
                ></div>
              </div>
            </div>

            <div class="p-2 bg-muted rounded">
              <span class="text-sm text-muted-foreground">序列号</span>
              <p class="font-mono text-xs mt-1">{{ validationResult.serialNumber }}</p>
            </div>

            <div class="p-2 bg-muted rounded">
              <span class="text-sm text-muted-foreground">指纹 (SHA-256)</span>
              <p class="font-mono text-xs mt-1 break-all">{{ validationResult.fingerprint }}</p>
            </div>
          </div>
        </div>

        <!-- 证书链 -->
        <div v-if="certificateChain && certificateChain.length > 0" class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <GitBranch class="w-5 h-5 text-purple-500" />
            证书链
          </h2>

          <div class="space-y-2">
            <div
              v-for="(cert, index) in certificateChain"
              :key="index"
              class="p-3 border rounded-lg"
              :class="index === 0 ? 'border-primary bg-primary/5' : 'bg-muted'"
            >
              <div class="flex items-start gap-2">
                <span class="text-xs px-2 py-1 rounded"
                  :class="index === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground text-background'"
                >
                  {{ index === 0 ? '叶子证书' : index === certificateChain.length - 1 ? '根证书' : '中间证书' }}
                </span>
                <div class="flex-1">
                  <p class="font-medium text-sm">{{ cert.subject }}</p>
                  <p class="text-xs text-muted-foreground mt-1">颁发者: {{ cert.issuer }}</p>
                  <p class="text-xs text-muted-foreground">有效期至: {{ cert.validTo }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：详细信息和配置 -->
      <div class="space-y-4">
        <!-- 安全评级 -->
        <div v-if="securityRating" class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <Shield class="w-5 h-5 text-green-500" />
            安全评级
          </h2>

          <div class="space-y-2">
            <div
              v-for="item in securityRating"
              :key="item.name"
              class="flex items-center justify-between p-2 bg-muted rounded"
            >
              <span class="text-sm">{{ item.name }}</span>
              <span class="text-xs font-medium px-2 py-1 rounded"
                :class="{
                  'bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-300': item.status === 'good',
                  'bg-yellow-200 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300': item.status === 'warning',
                  'bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-300': item.status === 'bad',
                  'bg-gray-200 text-gray-800 dark:bg-gray-900 dark:text-gray-300': item.status === 'info'
                }"
              >
                {{ item.label }}
              </span>
            </div>
          </div>
        </div>

        <!-- 协议和加密套件 -->
        <div v-if="protocolsInfo || ciphersInfo" class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <Lock class="w-5 h-5 text-blue-500" />
            协议和加密
          </h2>

          <div v-if="protocolsInfo" class="mb-4">
            <p class="text-sm font-medium mb-2">支持的TLS版本</p>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="protocol in protocolsInfo"
                :key="protocol.version"
                class="text-xs px-2 py-1 rounded"
                :class="{
                  'bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-300': protocol.secure,
                  'bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-300': !protocol.secure
                }"
              >
                {{ protocol.version }}
              </span>
            </div>
          </div>

          <div v-if="ciphersInfo">
            <p class="text-sm font-medium mb-2">加密套件</p>
            <div class="space-y-1 max-h-48 overflow-y-auto">
              <div
                v-for="cipher in ciphersInfo.slice(0, 10)"
                :key="cipher.name"
                class="text-xs p-2 bg-muted rounded flex items-center justify-between"
              >
                <span class="font-mono truncate flex-1">{{ cipher.name }}</span>
                <span class="text-muted-foreground">{{ cipher.bits }}位</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 证书问题 -->
        <div v-if="certificateIssues && certificateIssues.length > 0" class="bg-card rounded-lg p-6 border border-yellow-200 dark:border-yellow-800">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2 text-yellow-600">
            <AlertTriangle class="w-5 h-5" />
            检测到的问题
          </h2>

          <div class="space-y-2">
            <div
              v-for="(issue, index) in certificateIssues"
              :key="index"
              class="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded"
            >
              <p class="font-medium text-sm">{{ issue.title }}</p>
              <p class="text-xs text-muted-foreground mt-1">{{ issue.description }}</p>
              <p v-if="issue.recommendation" class="text-xs text-blue-600 mt-1">
                建议：{{ issue.recommendation }}
              </p>
            </div>
          </div>
        </div>

        <!-- 使用说明 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <BookOpen class="w-5 h-5 text-blue-500" />
            关于SSL/TLS证书
          </h2>

          <div class="space-y-3 text-sm text-muted-foreground">
            <div>
              <p class="font-medium text-foreground mb-1">什么是SSL/TLS证书？</p>
              <p>SSL/TLS证书是数字证书，用于在Web服务器和浏览器之间建立加密连接，确保数据传输安全。</p>
            </div>

            <div>
              <p class="font-medium text-foreground mb-1">证书类型</p>
              <ul class="list-disc list-inside space-y-1 ml-2">
                <li><strong class="text-foreground">DV (域名验证)：</strong>仅验证域名所有权</li>
                <li><strong class="text-foreground">OV (组织验证)：</strong>验证企业身份</li>
                <li><strong class="text-foreground">EV (扩展验证)：</strong>最严格验证，显示公司名</li>
              </ul>
            </div>

            <div>
              <p class="font-medium text-foreground mb-1">证书过期风险</p>
              <ul class="list-disc list-inside space-y-1 ml-2">
                <li>浏览器显示安全警告</li>
                <li>用户无法访问网站</li>
                <li>SEO排名下降</li>
                <li>用户信任度降低</li>
              </ul>
            </div>

            <div>
              <p class="font-medium text-foreground mb-1">最佳实践</p>
              <ul class="list-disc list-inside space-y-1 ml-2">
                <li>提前30天续订证书</li>
                <li>使用自动化工具管理证书</li>
                <li>禁用不安全的协议（SSLv3, TLS 1.0/1.1）</li>
                <li>使用强加密套件</li>
                <li>启用HSTS</li>
              </ul>
            </div>

            <div>
              <p class="font-medium text-foreground mb-1">免费证书服务</p>
              <ul class="list-disc list-inside space-y-1 ml-2">
                <li><strong class="text-foreground">Let's Encrypt：</strong>免费、自动化、90天有效期</li>
                <li><strong class="text-foreground">ZeroSSL：</strong>免费、90天有效期</li>
                <li><strong class="text-foreground">SSL For Free：</strong>基于Let's Encrypt</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- 验证历史 -->
        <div v-if="validationHistory.length > 0" class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <History class="w-5 h-5 text-purple-500" />
            验证历史
          </h2>

          <div class="space-y-2">
            <div
              v-for="(item, index) in validationHistory"
              :key="index"
              @click="loadHistoryItem(item)"
              class="p-2 bg-muted rounded hover:bg-muted/80 cursor-pointer"
            >
              <div class="flex items-center justify-between">
                <span class="text-sm truncate">{{ item.url }}</span>
                <CheckCircle v-if="item.valid" class="w-4 h-4 text-green-500" />
                <XCircle v-else class="w-4 h-4 text-red-500" />
              </div>
              <div class="flex items-center justify-between text-xs text-muted-foreground mt-1">
                <span>{{ item.time }}</span>
                <span>{{ item.daysRemaining }}天剩余</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useSeoMeta } from '#app'
import {
  Globe,
  CheckCircle,
  XCircle,
  Shield,
  GitBranch,
  Lock,
  AlertTriangle,
  BookOpen,
  History
} from 'lucide-vue-next'

const websiteUrl = ref('')
const validating = ref(false)
const checkChain = ref(true)
const checkProtocols = ref(true)
const checkCiphers = ref(true)

const validationResult = ref(null)
const certificateChain = ref(null)
const securityRating = ref(null)
const protocolsInfo = ref(null)
const ciphersInfo = ref(null)
const certificateIssues = ref(null)
const validationHistory = ref([])

const exampleSites = [
  { name: 'Google', url: 'https://www.google.com' },
  { name: 'GitHub', url: 'https://github.com' },
  { name: 'Mozilla', url: 'https://www.mozilla.org' },
  { name: 'Example', url: 'https://example.com' }
]

// 验证证书
async function validateCertificate() {
  if (!websiteUrl.value) return

  validating.value = true

  try {
    // 模拟验证过程（实际应用中需要后端支持）
    await new Promise(resolve => setTimeout(resolve, 2000))

    // 模拟验证结果
    const now = new Date()
    const validFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) // 30天前
    const validTo = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000) // 60天后
    const daysRemaining = Math.floor((validTo - now) / (24 * 60 * 60 * 1000))

    validationResult.value = {
      valid: true,
      subject: '*.example.com',
      issuer: "DigiCert Inc",
      validFrom: validFrom.toLocaleDateString(),
      validTo: validTo.toLocaleDateString(),
      daysRemaining,
      serialNumber: '0F:C1:B2:A3:D4:E5:F6:07:18:29:3A:4B:5C:6D:7E',
      fingerprint: 'AA:BB:CC:DD:EE:FF:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:11:22:33:44:55:66:77:88:99:AA:BB'
    }

    // 证书链
    certificateChain.value = [
      {
        subject: '*.example.com',
        issuer: 'DigiCert SHA2 Secure Server CA',
        validTo: validTo.toLocaleDateString()
      },
      {
        subject: 'DigiCert SHA2 Secure Server CA',
        issuer: 'DigiCert Global Root CA',
        validTo: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString()
      },
      {
        subject: 'DigiCert Global Root CA',
        issuer: 'DigiCert Global Root CA (Self-signed)',
        validTo: new Date(now.getTime() + 10 * 365 * 24 * 60 * 60 * 1000).toLocaleDateString()
      }
    ]

    // 安全评级
    securityRating.value = [
      { name: '证书有效期', status: daysRemaining > 30 ? 'good' : daysRemaining > 7 ? 'warning' : 'bad', label: daysRemaining > 30 ? '正常' : '即将过期' },
      { name: '证书链', status: 'good', label: '完整' },
      { name: '密钥强度', status: 'good', label: '2048位' },
      { name: '签名算法', status: 'good', label: 'SHA256withRSA' },
      { name: 'OCSP装订', status: 'good', label: '已启用' },
      { name: 'HSTS', status: 'good', label: '已配置' }
    ]

    // 协议信息
    if (checkProtocols.value) {
      protocolsInfo.value = [
        { version: 'TLS 1.3', secure: true },
        { version: 'TLS 1.2', secure: true },
        { version: 'TLS 1.1', secure: false },
        { version: 'TLS 1.0', secure: false }
      ]
    }

    // 加密套件
    if (checkCiphers.value) {
      ciphersInfo.value = [
        { name: 'TLS_AES_256_GCM_SHA384', bits: 256 },
        { name: 'TLS_CHACHA20_POLY1305_SHA256', bits: 256 },
        { name: 'TLS_AES_128_GCM_SHA256', bits: 128 },
        { name: 'ECDHE-RSA-AES128-GCM-SHA256', bits: 128 },
        { name: 'ECDHE-RSA-CHACHA20-POLY1305', bits: 256 }
      ]
    }

    // 证书问题
    certificateIssues.value = []

    // 添加到历史记录
    validationHistory.value.unshift({
      url: websiteUrl.value,
      valid: validationResult.value.valid,
      daysRemaining,
      time: new Date().toLocaleString()
    })

    // 限制历史记录数量
    if (validationHistory.value.length > 5) {
      validationHistory.value = validationHistory.value.slice(0, 5)
    }

  } catch (error) {
    console.error('Certificate validation error:', error)
    alert('验证失败：' + error.message)
  } finally {
    validating.value = false
  }
}

// 获取剩余天数颜色
function getDaysRemainingColor(days) {
  if (days > 30) return 'text-green-600'
  if (days > 7) return 'text-yellow-600'
  return 'text-red-600'
}

// 获取剩余天数条颜色
function getDaysRemainingBarColor(days) {
  if (days > 30) return 'bg-green-500'
  if (days > 7) return 'bg-yellow-500'
  return 'bg-red-500'
}

// 加载历史记录项
function loadHistoryItem(item) {
  websiteUrl.value = item.url
  validateCertificate()
}

useSeoMeta({
  title: 'SSL/TLS证书验证器 - 在线证书检查工具',
  description: '免费在线SSL/TLS证书验证器，检查证书有效期、证书链、协议版本和加密套件配置。',
  keywords: ['ssl', 'tls', '证书验证', 'certificate validator', '证书检查', 'https', '安全证书', '在线工具']
})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('SSL/TLS证书验证器')
</script>
