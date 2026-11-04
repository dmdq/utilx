<template>
  <div class="max-w-6xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">敏感信息扫描器</h1>
      <p class="text-muted-foreground">扫描代码中的敏感信息，包括API密钥、密码、令牌等，防止密钥泄露造成的安全风险</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 左侧：输入区域 -->
      <div class="lg:col-span-2 space-y-4">
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <Search class="w-5 h-5 text-primary" />
            输入代码或文本
          </h2>

          <div class="space-y-4">
            <!-- 输入方式选择 -->
            <div class="flex gap-2">
              <button
                @click="inputMode = 'text'"
                :class="['px-4 py-2 rounded-lg text-sm transition-colors', inputMode === 'text' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']"
              >
                粘贴文本
              </button>
              <label class="px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm cursor-pointer">
                <input type="file" @change="handleFileUpload" accept=".js,.ts,.jsx,.tsx,.py,.java,.go,.rs" class="hidden">
                上传文件
              </label>
            </div>

            <!-- 文本输入 -->
            <div v-if="inputMode === 'text'">
              <textarea
                v-model="inputText"
                class="w-full px-4 py-3 border border-border rounded-lg font-mono text-sm min-h-[300px]"
                placeholder="粘贴代码或文本内容..."
              ></textarea>
            </div>

            <!-- 文件信息 -->
            <div v-if="uploadedFile" class="bg-muted p-3 rounded-lg">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <FileCode class="w-4 h-4" />
                  <span class="text-sm font-medium">{{ uploadedFile.name }}</span>
                  <span class="text-xs text-muted-foreground">({{ formatFileSize(uploadedFile.size) }})</span>
                </div>
                <button @click="clearFile" class="p-1 hover:bg-background rounded">
                  <X class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- 扫描选项 -->
            <div>
              <label class="text-sm font-medium mb-2 block">扫描模式</label>
              <div class="grid grid-cols-2 gap-2">
                <label
                  v-for="option in scanOptions"
                  :key="option.id"
                  class="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                  :class="{ 'border-primary bg-primary/5': selectedOptions.has(option.id) }"
                >
                  <input type="checkbox" :value="option.id" v-model="selectedOptionsArray" class="rounded">
                  <span class="text-sm">{{ option.name }}</span>
                </label>
              </div>
            </div>

            <!-- 扫描按钮 -->
            <button
              @click="scanSecrets"
              :disabled="!hasContent"
              class="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 text-sm"
            >
              <Search class="w-4 h-4 inline mr-2" />
              开始扫描
            </button>
          </div>
        </div>

        <!-- 扫描结果 -->
        <div v-if="scanResults.length > 0" class="bg-card rounded-lg p-6 border">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle class="w-5 h-5 text-yellow-500" />
              扫描结果
            </h2>
            <div class="text-sm text-muted-foreground">
              发现 {{ scanResults.length }} 个潜在敏感信息
            </div>
          </div>

          <div class="space-y-3">
            <div
              v-for="(result, index) in scanResults"
              :key="index"
              class="p-4 rounded-lg border"
              :class="{
                'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800': result.severity === 'high',
                'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800': result.severity === 'medium',
                'border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800': result.severity === 'low'
              }"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="text-xs font-medium px-2 py-0.5 rounded"
                      :class="{
                        'bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-300': result.severity === 'high',
                        'bg-yellow-200 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300': result.severity === 'medium',
                        'bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-300': result.severity === 'low'
                      }"
                    >
                      {{ result.type }}
                    </span>
                    <span class="text-xs text-muted-foreground">
                      行 {{ result.line }}:{{ result.column }}
                    </span>
                  </div>
                  <pre class="text-xs font-mono bg-white dark:bg-black/50 p-2 rounded overflow-x-auto">{{ result.match }}</pre>
                  <p class="text-sm text-muted-foreground mt-2">{{ result.description }}</p>
                </div>
                <button
                  @click="removeResult(index)"
                  class="p-1 hover:bg-white dark:hover:bg-black/50 rounded"
                  title="移除此结果"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <!-- 汇总信息 -->
          <div v-if="scanResults.length > 0" class="mt-4 p-4 bg-muted rounded-lg">
            <h3 class="font-medium text-sm mb-2">风险汇总</h3>
            <div class="grid grid-cols-3 gap-4 text-center">
              <div>
                <div class="text-2xl font-bold text-red-600">{{ highRiskCount }}</div>
                <div class="text-xs text-muted-foreground">高风险</div>
              </div>
              <div>
                <div class="text-2xl font-bold text-yellow-600">{{ mediumRiskCount }}</div>
                <div class="text-xs text-muted-foreground">中风险</div>
              </div>
              <div>
                <div class="text-2xl font-bold text-blue-600">{{ lowRiskCount }}</div>
                <div class="text-xs text-muted-foreground">低风险</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 无结果 -->
        <div v-else-if="scanned && scanResults.length === 0" class="bg-card rounded-lg p-6 border">
          <div class="text-center py-8">
            <CheckCircle class="w-12 h-12 mx-auto mb-3 text-green-500" />
            <h3 class="text-lg font-medium mb-2">未发现敏感信息</h3>
            <p class="text-sm text-muted-foreground">扫描完成，未检测到明显的敏感信息泄露</p>
          </div>
        </div>
      </div>

      <!-- 右侧：说明和统计 -->
      <div class="space-y-4">
        <!-- 支持的检测模式 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">支持的检测模式</h2>

          <div class="space-y-3 text-sm">
            <div v-for="option in scanOptions" :key="option.id" class="p-3 bg-muted rounded">
              <p class="font-medium text-foreground">{{ option.name }}</p>
              <p class="text-xs text-muted-foreground mt-1">{{ option.desc }}</p>
            </div>
          </div>
        </div>

        <!-- 常见泄露模式 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">常见泄露模式</h2>

          <div class="space-y-2 text-xs font-mono bg-muted p-3 rounded">
            <div class="text-yellow-600 dark:text-yellow-400">API_KEY = "sk_live_..."</div>
            <div class="text-red-600 dark:text-red-400">password = "12345678"</div>
            <div class="text-red-600 dark:text-red-400">const SECRET = "abc123..."</div>
            <div class="text-yellow-600 dark:text-yellow-400">export default "eyJhbGciOi..."</div>
            <div class="text-blue-600 dark:text-blue-400">mysql://user:pass@host</div>
          </div>
        </div>

        <!-- 安全建议 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">安全建议</h2>

          <div class="space-y-3 text-sm text-muted-foreground">
            <div class="flex items-start gap-2">
              <Shield class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <p>使用环境变量存储敏感信息，不要硬编码在代码中</p>
            </div>
            <div class="flex items-start gap-2">
              <Shield class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <p>使用 .env 文件并添加到 .gitignore</p>
            </div>
            <div class="flex items-start gap-2">
              <Shield class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <p>使用 git-secrets 或类似工具防止提交敏感信息</p>
            </div>
            <div class="flex items-start gap-2">
              <Shield class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <p>定期扫描代码仓库，检查已提交的敏感信息</p>
            </div>
            <div class="flex items-start gap-2">
              <Shield class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <p>发现泄露后立即撤销并更换密钥/令牌</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useSeoMeta, useHead } from '#app'
import {
  Search,
  FileCode,
  X,
  AlertTriangle,
  CheckCircle,
  Shield
} from 'lucide-vue-next'

const inputMode = ref('text')
const inputText = ref('')
const uploadedFile = ref(null)
const scanned = ref(false)
const scanResults = ref([])

const scanOptions = [
  { id: 'apiKey', name: 'API密钥', desc: '检测各种API密钥格式' },
  { id: 'jwt', name: 'JWT令牌', desc: '检测JSON Web Token' },
  { id: 'password', name: '密码', desc: '检测常见的密码变量' },
  { id: 'database', name: '数据库连接', desc: '检测数据库连接字符串' },
  { id: 'awsKey', name: 'AWS密钥', desc: '检测AWS访问密钥' },
  { id: 'privateKey', name: '私钥', desc: '检测RSA/PEM格式私钥' }
]

const selectedOptionsArray = ref(['apiKey', 'jwt', 'password', 'database'])

// Convert array to Set for easier checking
const selectedOptions = computed(() => new Set(selectedOptionsArray.value))

const hasContent = computed(() => inputText.value.trim() || uploadedFile.value)

// 风险等级统计
const highRiskCount = computed(() => scanResults.value.filter(r => r.severity === 'high').length)
const mediumRiskCount = computed(() => scanResults.value.filter(r => r.severity === 'medium').length)
const lowRiskCount = computed(() => scanResults.value.filter(r => r.severity === 'low').length)

// 扫描规则
const patterns = {
  apiKey: [
    { pattern: /(sk_(live|test)_[a-zA-Z0-9]{32,})/g, severity: 'high', type: 'Stripe API Key', description: 'Stripe支付平台API密钥' },
    { pattern: /(AKIA[0-9A-Z]{16})/g, severity: 'high', type: 'AWS Access Key', description: 'AWS访问密钥ID' },
    { pattern: /['"`]?(api[_-]?key|apikey|access[_-]?token)['"`]?\s*[:=]\s*['"`]([a-zA-Z0-9_\-]{20,})['"`]/gi, severity: 'medium', type: 'API Key', description: '通用API密钥' },
    { pattern: /(github|gitlab|bitbucket)_token['"`]?\s*[:=]\s*['"`]([a-zA-Z0-9]{20,})['"`]/gi, severity: 'medium', type: 'Git Token', description: 'Git平台访问令牌' },
    { pattern: /(discord|slack|telegram)_token['"`]?\s*[:=]\s*['"`]([a-zA-Z0-9_\-]{20,})['"`]/gi, severity: 'medium', type: 'Service Token', description: '第三方服务令牌' }
  ],
  jwt: [
    { pattern: /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, severity: 'medium', type: 'JWT Token', description: 'JSON Web Token' }
  ],
  password: [
    { pattern: /['"`]?(password|passwd|pwd|secret)['"`]?\s*[:=]\s*['"`]([^\s'"`]{4,})['"`]/gi, severity: 'high', type: 'Password', description: '密码字段' },
    { pattern: /['"`]?(db[_-]?password|dbpass)['"`]?\s*[:=]\s*['"`]([^\s'"`]{4,})['"`]/gi, severity: 'high', type: 'Database Password', description: '数据库密码' }
  ],
  database: [
    { pattern: /(mysql|postgresql|mongodb|redis):\/\/[^\s'"`]+:[^\s'"`]+@/gi, severity: 'high', type: 'Database URL', description: '数据库连接字符串' },
    { pattern: /mongodb\+srv:\/\/[^\s'"`]+/gi, severity: 'medium', type: 'MongoDB Atlas', description: 'MongoDB Atlas连接' }
  ],
  awsKey: [
    { pattern: /aws[_-]?secret[_-]?access[_-]?key['"`]?\s*[:=]\s*['"`]([A-Za-z0-9/+=]{40})['"`]/gi, severity: 'high', type: 'AWS Secret Key', description: 'AWS秘密访问密钥' },
    { pattern: /aws_session_token['"`]?\s*[:=]\s*['"`]([A-Za-z0-9/+=]{100,})['"`]/gi, severity: 'medium', type: 'AWS Session Token', description: 'AWS会话令牌' }
  ],
  privateKey: [
    { pattern: /-----BEGIN [A-Z]+ PRIVATE KEY-----/g, severity: 'high', type: 'Private Key', description: 'PEM格式私钥' },
    { pattern: /-----BEGIN RSA PRIVATE KEY-----/g, severity: 'high', type: 'RSA Private Key', description: 'RSA私钥' }
  ]
}

// 文件上传处理
function handleFileUpload(event) {
  const file = event.target.files?.[0]
  if (!file) return

  uploadedFile.value = file
  inputMode.value = 'file'

  const reader = new FileReader()
  reader.onload = (e) => {
    inputText.value = e.target.result
  }
  reader.readAsText(file)
}

function clearFile() {
  uploadedFile.value = null
  inputText.value = ''
}

// 扫描敏感信息
function scanSecrets() {
  scanned.value = false
  scanResults.value = []

  const text = inputText.value
  if (!text) return

  const lines = text.split('\n')

  lines.forEach((line, lineIndex) => {
    selectedOptionsArray.value.forEach(optionId => {
      const optionPatterns = patterns[optionId]
      if (!optionPatterns) return

      optionPatterns.forEach(rule => {
        const matches = line.matchAll(rule.pattern)
        for (const match of matches) {
          const matchedText = match[0] || match.input
          const startPos = match.index || 0

          scanResults.value.push({
            type: rule.type,
            severity: rule.severity,
            match: matchedText,
            line: lineIndex + 1,
            column: startPos + 1,
            description: rule.description
          })
        }
      })
    })
  })

  // 去重并排序
  scanResults.value = Array.from(
    new Map(scanResults.value.map(r => [`${r.line}-${r.column}-${r.type}`, r])).values()
  ).sort((a, b) => {
    const severityOrder = { high: 0, medium: 1, low: 2 }
    return severityOrder[a.severity] - severityOrder[b.severity]
  })

  scanned.value = true
}

function removeResult(index) {
  scanResults.value.splice(index, 1)
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

useSeoMeta({
  title: '敏感信息扫描器 - 代码密钥泄露检测工具',
  description: '免费在线敏感信息扫描器，检测代码中的API密钥、密码、JWT令牌等敏感信息，防止密钥泄露造成的安全风险。',
  keywords: ['敏感信息', '密钥扫描', 'secret scanner', 'api key', '密码检测', '代码安全', '泄露检测', 'git secrets', '安全工具']
})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('敏感信息扫描器')
</script>
