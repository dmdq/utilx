<template>
  <div class="max-w-6xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">PII信息检测器</h1>
      <p class="text-muted-foreground">扫描文本中的个人身份信息（PII），包括身份证号、手机号、邮箱、银行卡号等敏感信息</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 左侧：输入和扫描 -->
      <div class="lg:col-span-2 space-y-4">
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <Search class="w-5 h-5 text-primary" />
            输入文本
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
                <input type="file" @change="handleFileUpload" accept=".txt,.csv,.json,.log" class="hidden">
                上传文件
              </label>
            </div>

            <!-- 文本输入 -->
            <div v-if="inputMode === 'text'">
              <textarea
                v-model="inputText"
                class="w-full px-4 py-3 border border-border rounded-lg font-mono text-sm min-h-[300px]"
                placeholder="粘贴或输入要扫描的文本内容..."
              ></textarea>
            </div>

            <!-- 文件信息 -->
            <div v-if="uploadedFile" class="bg-muted p-3 rounded-lg">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <FileText class="w-4 h-4" />
                  <span class="text-sm font-medium">{{ uploadedFile.name }}</span>
                  <span class="text-xs text-muted-foreground">({{ formatFileSize(uploadedFile.size) }})</span>
                </div>
                <button @click="clearFile" class="p-1 hover:bg-background rounded">
                  <X class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- 检测选项 -->
            <div>
              <label class="text-sm font-medium mb-2 block">检测类型</label>
              <div class="grid grid-cols-2 gap-2">
                <label
                  v-for="option in piiOptions"
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
              @click="scanPII"
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
              发现 {{ scanResults.length }} 个潜在PII信息
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
                      位置 {{ result.position }}
                    </span>
                  </div>
                  <pre class="text-xs font-mono bg-white dark:bg-black/50 p-2 rounded overflow-x-auto">{{ maskSensitiveData(result.match, result.type) }}</pre>
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
            <h3 class="font-medium text-sm mb-2">检测汇总</h3>
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
            <h3 class="text-lg font-medium mb-2">未检测到PII信息</h3>
            <p class="text-sm text-muted-foreground">扫描完成，未检测到明显的个人身份信息</p>
          </div>
        </div>
      </div>

      <!-- 右侧：说明和统计 -->
      <div class="space-y-4">
        <!-- 支持的检测类型 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">支持的检测类型</h2>

          <div class="space-y-3 text-sm">
            <div v-for="option in piiOptions" :key="option.id" class="p-3 bg-muted rounded">
              <p class="font-medium text-foreground">{{ option.name }}</p>
              <p class="text-xs text-muted-foreground mt-1">{{ option.desc }}</p>
            </div>
          </div>
        </div>

        <!-- 常见PII模式 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">常见PII模式</h2>

          <div class="space-y-2 text-xs font-mono bg-muted p-3 rounded">
            <div class="text-red-600 dark:text-red-400">张三 110101199001011234 北京</div>
            <div class="text-red-600 dark:text-red-400">手机号：13812345678</div>
            <div class="text-yellow-600 dark:text-yellow-400">邮箱：user@example.com</div>
            <div class="text-red-600 dark:text-red-400">银行卡：6222021234567890123</div>
            <div class="text-blue-600 dark:text-blue-400">IP：192.168.1.1</div>
            <div class="text-yellow-600 dark:text-yellow-400">车牌：京A12345</div>
          </div>
        </div>

        <!-- 数据脱敏说明 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">数据脱敏说明</h2>

          <div class="space-y-2 text-sm text-muted-foreground">
            <p>为保护隐私，检测结果显示时会自动脱敏：</p>
            <ul class="list-disc list-inside space-y-1 ml-2">
              <li>身份证号：保留前6后4位</li>
              <li>手机号：保留前3后4位</li>
              <li>银行卡号：保留前4后4位</li>
              <li>邮箱：保留首字母和域名</li>
            </ul>
          </div>
        </div>

        <!-- 合规建议 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">合规建议</h2>

          <div class="space-y-3 text-sm text-muted-foreground">
            <div class="flex items-start gap-2">
              <Shield class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <p>遵守《个人信息保护法》，不得非法收集、使用个人信息</p>
            </div>
            <div class="flex items-start gap-2">
              <Shield class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <p>敏感信息应加密存储，并采取访问控制措施</p>
            </div>
            <div class="flex items-start gap-2">
              <Shield class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <p>定期扫描日志和数据库，及时清理或脱敏PII数据</p>
            </div>
            <div class="flex items-start gap-2">
              <Shield class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <p>建立数据分类分级制度，标记敏感信息</p>
            </div>
          </div>
        </div>

        <!-- 风险等级说明 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4">风险等级说明</h2>

          <div class="space-y-2">
            <div class="flex items-center gap-2 p-2 border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20 rounded">
              <span class="text-xs px-2 py-1 rounded bg-red-200 text-red-800">高风险</span>
              <span class="text-sm">身份证、银行卡等可直接身份识别的信息</span>
            </div>
            <div class="flex items-center gap-2 p-2 border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 rounded">
              <span class="text-xs px-2 py-1 rounded bg-yellow-200 text-yellow-800">中风险</span>
              <span class="text-sm">手机号、邮箱等联系方式</span>
            </div>
            <div class="flex items-center gap-2 p-2 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded">
              <span class="text-xs px-2 py-1 rounded bg-blue-200 text-blue-800">低风险</span>
              <span class="text-sm">IP地址、地址等辅助信息</span>
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
  FileText,
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

const piiOptions = [
  { id: 'idCard', name: '身份证号', desc: '18位中国居民身份证号码' },
  { id: 'phone', name: '手机号', desc: '中国大陆手机号码' },
  { id: 'email', name: '邮箱地址', desc: '电子邮件地址' },
  { id: 'bankCard', name: '银行卡号', desc: '银行卡号（16-19位）' },
  { id: 'ipAddress', name: 'IP地址', desc: 'IPv4和IPv6地址' },
  { id: 'address', name: '地址', desc: '中国地址格式' },
  { id: 'licensePlate', name: '车牌号', desc: '中国车牌号' },
  { id: 'passport', name: '护照号', desc: '护照号码' }
]

const selectedOptionsArray = ref(['idCard', 'phone', 'email', 'bankCard'])

// Convert array to Set for easier checking
const selectedOptions = computed(() => new Set(selectedOptionsArray.value))

const hasContent = computed(() => inputText.value.trim() || uploadedFile.value)

// 风险等级统计
const highRiskCount = computed(() => scanResults.value.filter(r => r.severity === 'high').length)
const mediumRiskCount = computed(() => scanResults.value.filter(r => r.severity === 'medium').length)
const lowRiskCount = computed(() => scanResults.value.filter(r => r.severity === 'low').length)

// PII检测模式
const patterns = {
  idCard: [
    {
      pattern: /[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]/g,
      severity: 'high',
      type: '身份证号',
      description: '18位中国居民身份证号码'
    }
  ],
  phone: [
    {
      pattern: /1[3-9]\d{9}/g,
      severity: 'medium',
      type: '手机号',
      description: '中国大陆手机号码'
    }
  ],
  email: [
    {
      pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      severity: 'medium',
      type: '邮箱地址',
      description: '电子邮件地址'
    }
  ],
  bankCard: [
    {
      pattern: /\b(?:\d[ -]*?){13,16}\b/g,
      severity: 'high',
      type: '银行卡号',
      description: '银行卡号（16-19位）'
    }
  ],
  ipAddress: [
    {
      pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
      severity: 'low',
      type: 'IP地址',
      description: 'IPv4地址'
    },
    {
      pattern: /([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}/g,
      severity: 'low',
      type: 'IPv6地址',
      description: 'IPv6地址'
    }
  ],
  address: [
    {
      pattern: /(北京|天津|上海|重庆|河北|山西|辽宁|吉林|黑龙江|江苏|浙江|安徽|福建|江西|山东|河南|湖北|湖南|广东|海南|四川|贵州|云南|陕西|甘肃|青海|台湾|内蒙古|广西|西藏|宁夏|新疆|香港|澳门)(省|市|自治区|特别行政区)?(.*?市|.*?区|.*?县)/g,
      severity: 'low',
      type: '地址',
      description: '中国地址格式'
    }
  ],
  licensePlate: [
    {
      pattern: /[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][A-HJ-NP-Z0-9]{5,6}/g,
      severity: 'medium',
      type: '车牌号',
      description: '中国车牌号'
    }
  ],
  passport: [
    {
      pattern: /[GE]\d{8}/g,
      severity: 'high',
      type: '护照号',
      description: '中国护照号码（G开头普通护照，E开头外交护照）'
    }
  ]
}

// 扫描PII信息
function scanPII() {
  scanned.value = false
  scanResults.value = []

  const text = inputText.value
  if (!text) return

  selectedOptionsArray.value.forEach(optionId => {
    const optionPatterns = patterns[optionId]
    if (!optionPatterns) return

    optionPatterns.forEach(rule => {
      const matches = text.matchAll(rule.pattern)
      for (const match of matches) {
        const matchedText = match[0]
        const startPos = match.index || 0

        scanResults.value.push({
          type: rule.type,
          severity: rule.severity,
          match: matchedText,
          position: startPos,
          description: rule.description
        })
      }
    })
  })

  // 去重并排序
  scanResults.value = Array.from(
    new Map(scanResults.value.map(r => [`${r.position}-${r.type}`, r])).values()
  ).sort((a, b) => {
    const severityOrder = { high: 0, medium: 1, low: 2 }
    return severityOrder[a.severity] - severityOrder[b.severity]
  })

  scanned.value = true
}

// 脱敏敏感数据
function maskSensitiveData(data, type) {
  if (!data) return ''

  switch (type) {
    case '身份证号':
      return data.length >= 14 ? data.substring(0, 6) + '********' + data.substring(14) : data
    case '手机号':
      return data.length >= 7 ? data.substring(0, 3) + '****' + data.substring(7) : data
    case '银行卡号':
      return data.length >= 8 ? data.substring(0, 4) + '****' + data.substring(data.length - 4) : data
    case '邮箱地址':
      const parts = data.split('@')
      if (parts.length === 2 && parts[0].length > 2) {
        return parts[0].substring(0, 1) + '***@' + parts[1]
      }
      return data
    default:
      return data.length > 8 ? data.substring(0, 4) + '****' : data
  }
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

function removeResult(index) {
  scanResults.value.splice(index, 1)
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

useSeoMeta({
  title: 'PII信息检测器 - 在线个人身份信息扫描工具',
  description: '免费在线PII信息检测器，扫描身份证号、手机号、邮箱、银行卡号等个人身份信息，支持自动脱敏显示。',
  keywords: ['pii', '个人身份信息', '身份证号', '手机号', '邮箱检测', '银行卡号', '数据脱敏', '隐私保护', '在线工具']
})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('PII信息检测器')
</script>
