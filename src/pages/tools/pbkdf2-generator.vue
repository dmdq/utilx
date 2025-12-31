<template>
  <div class="max-w-8xl mx-auto">
    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">PBKDF2密钥派生器</h1>
      <p class="text-muted-foreground max-w-3xl">
        基于RFC 2898标准的PBKDF2密钥派生函数，用于安全存储密码和生成加密密钥。
        支持SHA-1/SHA-256/SHA-512哈希算法，可自定义迭代次数和盐值。
      </p>
    </div>

    <!-- 主要功能区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 输入区域 -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <label class="text-lg font-semibold">密码/输入数据</label>
          <button
            @click="clearInput"
            class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            清空
          </button>
        </div>
        <textarea
          v-model="inputText"
          type="password"
          placeholder="请输入要派生密钥的密码..."
          class="w-full h-32 p-4 border border-border rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary font-mono"
        ></textarea>

        <!-- 参数配置 -->
        <div class="space-y-4 p-4 border border-border rounded-lg bg-muted/30">
          <h3 class="font-semibold mb-3">参数配置</h3>

          <!-- 哈希算法选择 -->
          <div class="space-y-2">
            <label class="text-sm font-medium">哈希算法</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="algo in hashAlgorithms"
                :key="algo.value"
                @click="hashAlgorithm = algo.value"
                :class="[
                  'px-3 py-1.5 text-sm rounded-md transition-colors',
                  hashAlgorithm === algo.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/70'
                ]"
              >
                {{ algo.label }}
              </button>
            </div>
          </div>

          <!-- 迭代次数 -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label class="text-sm font-medium">迭代次数</label>
              <span class="text-xs text-muted-foreground">{{ iterations }} 次</span>
            </div>
            <input
              v-model.number="iterations"
              type="range"
              min="1000"
              max="1000000"
              step="1000"
              class="w-full"
            >
            <div class="flex gap-2">
              <button
                v-for="preset in iterationPresets"
                :key="preset"
                @click="iterations = preset"
                class="px-3 py-1 text-xs bg-muted rounded-md hover:bg-muted/70 transition-colors"
              >
                {{ formatNumber(preset) }}
              </button>
            </div>
          </div>

          <!-- 密钥长度 -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label class="text-sm font-medium">密钥长度</label>
              <span class="text-xs text-muted-foreground">{{ keyLength }} 字节</span>
            </div>
            <input
              v-model.number="keyLength"
              type="range"
              min="16"
              max="64"
              step="16"
              class="w-full"
            >
            <div class="flex gap-2">
              <button
                v-for="len in [16, 32, 48, 64]"
                :key="len"
                @click="keyLength = len"
                class="px-3 py-1 text-xs bg-muted rounded-md hover:bg-muted/70 transition-colors"
              >
                {{ len * 8 }} bit
              </button>
            </div>
          </div>

          <!-- 盐值配置 -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label class="text-sm font-medium">盐值 (Salt)</label>
              <button
                @click="generateRandomSalt"
                class="px-3 py-1 text-xs bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors"
              >
                生成随机盐值
              </button>
            </div>
            <textarea
              v-model="salt"
              placeholder="留空则自动生成随机盐值..."
              class="w-full h-20 p-3 border border-border rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
            ></textarea>
          </div>
        </div>
      </div>

      <!-- 输出区域 -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <label class="text-lg font-semibold">派生密钥</label>
          <div class="flex items-center gap-2">
            <select
              v-model="outputFormat"
              class="px-3 py-1 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="hex">Hex格式</option>
              <option value="base64">Base64格式</option>
            </select>
            <button
              @click="copyToClipboard(outputText)"
              class="px-3 py-1 text-sm bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors"
            >
              {{ copyButtonText }}
            </button>
          </div>
        </div>
        <div class="w-full h-48 p-4 border border-border rounded-lg bg-muted/50">
          <div class="font-mono text-sm break-all">
            {{ outputText || '派生密钥将显示在这里...' }}
          </div>
        </div>

        <!-- 计算信息 -->
        <div v-if="calculationTime" class="p-4 border border-border rounded-lg bg-muted/30">
          <h4 class="font-semibold text-sm mb-2">计算信息</h4>
          <div class="space-y-1 text-sm">
            <div class="flex justify-between">
              <span class="text-muted-foreground">计算时间:</span>
              <span class="font-mono">{{ calculationTime }} ms</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">密钥长度:</span>
              <span class="font-mono">{{ outputText.length }} 字符</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">安全等级:</span>
              <span :class="securityLevelClass">{{ securityLevel }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="flex flex-wrap gap-4 mb-8">
      <button
        @click="deriveKey"
        :disabled="!inputText || isCalculating"
        class="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ isCalculating ? '计算中...' : '派生密钥' }}
      </button>
      <button
        @click="deriveKeyWithRandomSalt"
        :disabled="!inputText || isCalculating"
        class="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        派生密钥（随机盐值）
      </button>
      <button
        @click="showVerifyModal = true"
        class="px-6 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
      >
        验证密码
      </button>
    </div>

    <!-- 验证对话框 -->
    <div v-if="showVerifyModal" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div class="bg-background rounded-lg border border-border max-w-md w-full">
        <div class="p-6">
          <h3 class="text-lg font-semibold mb-4">验证密码</h3>
          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium mb-1 block">原始密码</label>
              <input
                v-model="verifyPassword"
                type="password"
                placeholder="输入原始密码..."
                class="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
            </div>
            <div>
              <label class="text-sm font-medium mb-1 block">存储的派生密钥</label>
              <input
                v-model="verifyHash"
                placeholder="输入存储的派生密钥..."
                class="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
              >
            </div>
            <div>
              <label class="text-sm font-medium mb-1 block">盐值</label>
              <input
                v-model="verifySalt"
                placeholder="输入盐值..."
                class="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
              >
            </div>
            <div v-if="verifyResult" class="p-3 rounded-lg" :class="verifyResult.valid ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'">
              {{ verifyResult.valid ? '✅ 密码验证成功！' : '❌ 密码验证失败！' }}
            </div>
          </div>
          <div class="flex justify-end gap-2 mt-6">
            <button
              @click="showVerifyModal = false; verifyResult = null"
              class="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              关闭
            </button>
            <button
              @click="verifyPasswordHash"
              class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              验证
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 批量处理 -->
    <div class="border border-border rounded-lg p-6 mb-8">
      <h3 class="text-lg font-semibold mb-4">批量处理</h3>
      <p class="text-sm text-muted-foreground mb-4">每行一个密码，批量生成PBKDF2派生密钥</p>
      <div class="space-y-4">
        <textarea
          v-model="batchInput"
          placeholder="每行输入一个密码..."
          class="w-full h-32 p-4 border border-border rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
        ></textarea>
        <div class="flex gap-4">
          <button
            @click="processBatch"
            class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            批量处理
          </button>
          <button
            v-if="batchResults.length > 0"
            @click="downloadBatchResults"
            class="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
          >
            下载结果
          </button>
        </div>
      </div>
    </div>

    <!-- 批量处理结果 -->
    <div v-if="batchResults.length > 0" class="border border-border rounded-lg p-6 mb-8">
      <h3 class="text-lg font-semibold mb-4">批量处理结果 ({{ batchResults.length }} 条)</h3>
      <div class="overflow-x-auto max-h-96 overflow-y-auto">
        <table class="w-full text-sm">
          <thead class="sticky top-0 bg-background">
            <tr class="border-b border-border">
              <th class="text-left py-2">序号</th>
              <th class="text-left py-2">派生密钥 ({{ outputFormat.toUpperCase() }})</th>
              <th class="text-left py-2">盐值 (Hex)</th>
              <th class="text-left py-2">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(result, index) in batchResults" :key="index" class="border-b border-border">
              <td class="py-2">{{ index + 1 }}</td>
              <td class="py-2 font-mono text-xs max-w-md truncate">{{ result.derivedKey }}</td>
              <td class="py-2 font-mono text-xs max-w-xs truncate">{{ result.salt }}</td>
              <td class="py-2">
                <button
                  @click="copyToClipboard(result.derivedKey)"
                  class="text-primary hover:text-primary/80 transition-colors"
                >
                  复制
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- PBKDF2算法说明 -->
    <div class="border border-border rounded-lg p-6 mb-8">
      <h3 class="text-lg font-semibold mb-4">关于PBKDF2算法</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 class="font-semibold text-primary mb-2">算法特性</h4>
          <ul class="space-y-1 text-sm">
            <li>• RFC 2898 / PKCS #5 标准</li>
            <li>• 密钥拉伸：增加暴力破解成本</li>
            <li>• 可配置迭代次数，平衡性能与安全</li>
            <li>• 使用盐值防止彩虹表攻击</li>
            <li>• 支持多种哈希算法（SHA-1/256/512）</li>
          </ul>
        </div>
        <div>
          <h4 class="font-semibold text-primary mb-2">参数建议</h4>
          <ul class="space-y-1 text-sm">
            <li>• 迭代次数：至少100,000次（2024年）</li>
            <li>• 盐值长度：至少16字节（128位）</li>
            <li>• 密钥长度：32字节（256位）或更长</li>
            <li>• 哈希算法：优先选择SHA-256或SHA-512</li>
            <li>• 每个密码使用唯一的随机盐值</li>
          </ul>
        </div>
      </div>
      <div class="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
        <h4 class="font-semibold text-yellow-600 mb-2">安全提示</h4>
        <ul class="space-y-1 text-sm text-yellow-700">
          <li>• PBKDF2虽然比直接哈希安全，但Argon2和Scrypt是更现代的选择</li>
          <li>• 迭代次数应逐年增加以对抗硬件性能提升</li>
          <li>• 盐值不需要保密，但必须唯一且随机</li>
          <li>• 敏感应用建议使用专门的密码哈希库</li>
        </ul>
      </div>
    </div>

    <!-- 使用场景 -->
    <div class="border border-border rounded-lg p-6 mb-8">
      <h3 class="text-lg font-semibold mb-4">典型应用场景</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="p-4 border border-border rounded-lg">
          <h4 class="font-semibold mb-2">密码存储</h4>
          <p class="text-sm text-muted-foreground">将用户密码转换为安全的派生密钥存储，即使数据库泄露也无法还原原始密码</p>
        </div>
        <div class="p-4 border border-border rounded-lg">
          <h4 class="font-semibold mb-2">加密密钥派生</h4>
          <p class="text-sm text-muted-foreground">从用户密码或主密钥派生出用于加密的对称密钥</p>
        </div>
        <div class="p-4 border border-border rounded-lg">
          <h4 class="font-semibold mb-2">身份验证</h4>
          <p class="text-sm text-muted-foreground">生成用于API密钥、访问令牌的安全随机字符串</p>
        </div>
      </div>
    </div>

    <!-- 相关工具 -->
    <div class="space-y-4">
      <h3 class="text-lg font-semibold">相关工具</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ToolCard
          v-for="tool in relatedTools"
          :key="tool.id"
          :tool="tool"
          :title="tool.name"
          :description="tool.description"
          :category="tool.category"
          :usage-count="formatViewCount(tool.viewCount)"
          :icon="tool.icon"
          @select="handleToolSelect"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { categories } from '~/data/categories'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import ToolCard from '~/components/ToolCard.vue'

const category = categories.find(c => c.id === 'crypto')

// 响应式数据
const inputText = ref('')
const outputText = ref('')
const salt = ref('')
const iterations = ref(100000)
const keyLength = ref(32)
const hashAlgorithm = ref('SHA-256')
const outputFormat = ref('hex')
const isCalculating = ref(false)
const calculationTime = ref(null)
const copyButtonText = ref('复制')
const showVerifyModal = ref(false)

// 验证相关
const verifyPassword = ref('')
const verifyHash = ref('')
const verifySalt = ref('')
const verifyResult = ref(null)

// 批量处理
const batchInput = ref('')
const batchResults = ref([])

// 配置选项
const hashAlgorithms = [
  { value: 'SHA-1', label: 'SHA-1' },
  { value: 'SHA-256', label: 'SHA-256' },
  { value: 'SHA-384', label: 'SHA-384' },
  { value: 'SHA-512', label: 'SHA-512' }
]

const iterationPresets = [10000, 100000, 350000, 600000]

// 相关工具
const relatedTools = computed(() => {
  return tools.filter(tool =>
    tool.category === 'crypto' &&
    tool.id !== 'pbkdf2-generator'
  ).slice(0, 4)
})

// 格式化数字
const formatNumber = (num) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(0)}K`
  return num
}

// 格式化浏览量
const formatViewCount = (count) => {
  if (count >= 10000) return `${(count / 10000).toFixed(1)}w+`
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k+`
  return `${count}`
}

// 安全等级评估
const securityLevel = computed(() => {
  const iter = iterations.value
  const len = keyLength.value

  if (iter >= 600000 && len >= 32) return '高'
  if (iter >= 100000 && len >= 32) return '中高'
  if (iter >= 10000 && len >= 24) return '中'
  return '低'
})

const securityLevelClass = computed(() => {
  const level = securityLevel.value
  if (level === '高') return 'font-mono text-green-500'
  if (level === '中高') return 'font-mono text-blue-500'
  if (level === '中') return 'font-mono text-yellow-500'
  return 'font-mono text-red-500'
})

// 生成随机盐值
const generateRandomSalt = () => {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  salt.value = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// 将字符串转换为ArrayBuffer
const stringToArrayBuffer = (str) => {
  const encoder = new TextEncoder()
  return encoder.encode(str)
}

// 将ArrayBuffer转换为Hex
const arrayBufferToHex = (buffer) => {
  return Array.from(new Uint8Array(buffer), byte => byte.toString(16).padStart(2, '0')).join('')
}

// 将ArrayBuffer转换为Base64
const arrayBufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

// Hex字符串转ArrayBuffer
const hexToArrayBuffer = (hex) => {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16)
  }
  return bytes.buffer
}

// PBKDF2密钥派生
const deriveKey = async () => {
  if (!inputText.value) return

  isCalculating.value = true
  const startTime = performance.now()

  try {
    const passwordBuffer = stringToArrayBuffer(inputText.value)
    const saltBuffer = salt.value
      ? hexToArrayBuffer(salt.value)
      : crypto.getRandomValues(new Uint8Array(16))

    const importedKey = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    )

    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: saltBuffer,
        iterations: iterations.value,
        hash: hashAlgorithm.value
      },
      importedKey,
      { name: 'AES-GCM', length: keyLength.value * 8 },
      true,
      ['encrypt', 'decrypt']
    )

    const keyBuffer = await crypto.subtle.exportKey('raw', derivedKey)

    if (outputFormat.value === 'hex') {
      outputText.value = arrayBufferToHex(keyBuffer)
    } else {
      outputText.value = arrayBufferToBase64(keyBuffer)
    }

    // 如果没有提供盐值，保存生成的盐值
    if (!salt.value) {
      salt.value = arrayBufferToHex(saltBuffer)
    }

    const endTime = performance.now()
    calculationTime.value = (endTime - startTime).toFixed(2)
  } catch (error) {
    console.error('PBKDF2派生失败:', error)
    outputText.value = '派生失败: ' + error.message
  } finally {
    isCalculating.value = false
  }
}

// 使用随机盐值派生密钥
const deriveKeyWithRandomSalt = async () => {
  salt.value = ''
  await deriveKey()
}

// 验证密码
const verifyPasswordHash = async () => {
  if (!verifyPassword.value || !verifyHash.value || !verifySalt.value) {
    alert('请填写所有验证信息')
    return
  }

  try {
    const passwordBuffer = stringToArrayBuffer(verifyPassword.value)
    const saltBuffer = hexToArrayBuffer(verifySalt.value)

    // 需要从原始存储信息中提取参数
    const importedKey = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    )

    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: saltBuffer,
        iterations: iterations.value,
        hash: hashAlgorithm.value
      },
      importedKey,
      { name: 'AES-GCM', length: keyLength.value * 8 },
      true,
      ['encrypt', 'decrypt']
    )

    const keyBuffer = await crypto.subtle.exportKey('raw', derivedKey)
    const derivedHash = outputFormat.value === 'hex'
      ? arrayBufferToHex(keyBuffer)
      : arrayBufferToBase64(keyBuffer)

    verifyResult.value = {
      valid: derivedHash.toLowerCase() === verifyHash.value.toLowerCase()
    }
  } catch (error) {
    console.error('验证失败:', error)
    verifyResult.value = { valid: false }
  }
}

// 批量处理
const processBatch = async () => {
  const lines = batchInput.value.split('\n').filter(line => line.trim())
  if (lines.length === 0) return

  batchResults.value = []
  const originalSalt = salt.value

  for (let i = 0; i < lines.length; i++) {
    const password = lines[i].trim()
    if (!password) continue

    // 为每个密码生成独立的盐值
    const saltArray = new Uint8Array(16)
    crypto.getRandomValues(saltArray)
    const currentSalt = Array.from(saltArray, byte => byte.toString(16).padStart(2, '0')).join('')

    const passwordBuffer = stringToArrayBuffer(password)
    const saltBuffer = hexToArrayBuffer(currentSalt)

    const importedKey = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    )

    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: saltBuffer,
        iterations: iterations.value,
        hash: hashAlgorithm.value
      },
      importedKey,
      { name: 'AES-GCM', length: keyLength.value * 8 },
      true,
      ['encrypt', 'decrypt']
    )

    const keyBuffer = await crypto.subtle.exportKey('raw', derivedKey)
    const derivedKeyHex = outputFormat.value === 'hex'
      ? arrayBufferToHex(keyBuffer)
      : arrayBufferToBase64(keyBuffer)

    batchResults.value.push({
      derivedKey: derivedKeyHex,
      salt: currentSalt
    })
  }

  salt.value = originalSalt
}

// 下载批量处理结果
const downloadBatchResults = () => {
  if (batchResults.value.length === 0) return

  const headers = ['序号', '派生密钥', '盐值', '算法', '迭代次数']
  const rows = batchResults.value.map((result, index) => [
    index + 1,
    result.derivedKey,
    result.salt,
    hashAlgorithm.value,
    iterations.value
  ])

  let csv = headers.join(',') + '\n'
  rows.forEach(row => {
    csv += row.join(',') + '\n'
  })

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `pbkdf2-batch-${Date.now()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// 复制到剪贴板
const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    copyButtonText.value = '已复制'
    setTimeout(() => {
      copyButtonText.value = '复制'
    }, 2000)
  } catch (error) {
    console.error('复制失败:', error)
  }
}

// 清空输入
const clearInput = () => {
  inputText.value = ''
  outputText.value = ''
  salt.value = ''
  calculationTime.value = null
}

// 工具选择处理
const handleToolSelect = (tool) => {
  const toolUrl = `/tools/${tool.id}/`
  navigateTo(toolUrl)
  addRecentTool(tool.id)
}

// 添加到最近使用
addRecentTool('pbkdf2-generator')

// SEO配置
useSeoMeta({
  title: 'PBKDF2密钥派生器 - 在线PBKDF2哈希生成工具',
  description: '免费在线PBKDF2密钥派生函数工具，支持SHA-1/256/512，可自定义迭代次数和盐值，用于安全密码存储和密钥派生。',
  keywords: ['PBKDF2', '密钥派生', '密码哈希', 'SHA-256', '加密', 'RFC 2898', 'PKCS5']
})
</script>
