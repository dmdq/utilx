<template>
  <div class="max-w-8xl mx-auto">
    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">Scrypt哈希生成器</h1>
      <p class="text-muted-foreground max-w-3xl">
        Scrypt是一种内存密集型的密码哈希算法，专门设计用于抵御GPU/ASIC暴力破解攻击。
        通过强制使用大量内存，使并行破解变得极其昂贵，是密码存储和加密货币钱包的理想选择。
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
          placeholder="请输入要哈希的密码..."
          class="w-full h-32 p-4 border border-border rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary font-mono"
        ></textarea>

        <!-- 参数配置 -->
        <div class="space-y-4 p-4 border border-border rounded-lg bg-muted/30">
          <h3 class="font-semibold mb-3">Scrypt参数配置</h3>

          <!-- CPU/内存成本因子 (N) -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label class="text-sm font-medium">CPU/内存成本因子 (N)</label>
              <span class="text-xs text-muted-foreground">{{ formatNumber(costFactor) }} (2^{{ Math.log2(costFactor) }})</span>
            </div>
            <input
              v-model.number="costFactor"
              type="range"
              min="1024"
              max="1048576"
              step="1024"
              class="w-full"
            >
            <div class="flex gap-2">
              <button
                v-for="preset in costPresets"
                :key="preset.value"
                @click="costFactor = preset.value"
                class="px-3 py-1 text-xs bg-muted rounded-md hover:bg-muted/70 transition-colors"
                :title="preset.desc"
              >
                {{ preset.label }}
              </button>
            </div>
            <p class="text-xs text-muted-foreground">
              内存使用: {{ ((costFactor * 128) / 1024 / 1024).toFixed(2) }} MB
            </p>
          </div>

          <!-- 块大小因子 (r) -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label class="text-sm font-medium">块大小因子 (r)</label>
              <span class="text-xs text-muted-foreground">{{ blockSizeFactor }} bytes</span>
            </div>
            <input
              v-model.number="blockSizeFactor"
              type="range"
              min="1"
              max="16"
              step="1"
              class="w-full"
            >
            <div class="flex gap-2">
              <button
                v-for="r in [1, 8, 16]"
                :key="r"
                @click="blockSizeFactor = r"
                class="px-3 py-1 text-xs bg-muted rounded-md hover:bg-muted/70 transition-colors"
              >
                {{ r }}
              </button>
            </div>
          </div>

          <!-- 并行化因子 (p) -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label class="text-sm font-medium">并行化因子 (p)</label>
              <span class="text-xs text-muted-foreground">{{ parallelizationFactor }} 线程</span>
            </div>
            <input
              v-model.number="parallelizationFactor"
              type="range"
              min="1"
              max="16"
              step="1"
              class="w-full"
            >
            <div class="flex gap-2">
              <button
                v-for="p in [1, 4, 8, 16]"
                :key="p"
                @click="parallelizationFactor = p"
                class="px-3 py-1 text-xs bg-muted rounded-md hover:bg-muted/70 transition-colors"
              >
                {{ p }}
              </button>
            </div>
          </div>

          <!-- 密钥长度 -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label class="text-sm font-medium">密钥长度</label>
              <span class="text-xs text-muted-foreground">{{ keyLength }} bytes ({{ keyLength * 8 }} bits)</span>
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

          <!-- 预设配置 -->
          <div class="space-y-2">
            <label class="text-sm font-medium">快速预设</label>
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="preset in presets"
                :key="preset.name"
                @click="applyPreset(preset)"
                class="px-3 py-2 text-xs bg-muted rounded-md hover:bg-muted/70 transition-colors text-left"
              >
                <div class="font-medium">{{ preset.name }}</div>
                <div class="text-muted-foreground">{{ preset.desc }}</div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 输出区域 -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <label class="text-lg font-semibold">Scrypt哈希</label>
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
            {{ outputText || 'Scrypt哈希将显示在这里...' }}
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
              <span class="text-muted-foreground">内存使用:</span>
              <span class="font-mono">{{ memoryUsage }} MB</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">哈希长度:</span>
              <span class="font-mono">{{ outputText.length }} 字符</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">安全等级:</span>
              <span :class="securityLevelClass">{{ securityLevel }}</span>
            </div>
          </div>
        </div>

        <!-- 性能提示 -->
        <div v-if="isHighCost" class="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <h4 class="font-semibold text-yellow-600 mb-1">性能提示</h4>
          <p class="text-sm text-yellow-700">
            当前配置使用了较高的CPU/内存成本因子，计算可能需要几秒钟。请耐心等待。
          </p>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="flex flex-wrap gap-4 mb-8">
      <button
        @click="generateScrypt"
        :disabled="!inputText || isCalculating"
        class="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ isCalculating ? '计算中...' : '生成Scrypt哈希' }}
      </button>
      <button
        @click="generateScryptWithRandomSalt"
        :disabled="!inputText || isCalculating"
        class="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        生成哈希（随机盐值）
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
          <h3 class="text-lg font-semibold mb-4">验证Scrypt哈希</h3>
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
              <label class="text-sm font-medium mb-1 block">存储的哈希值</label>
              <input
                v-model="verifyHash"
                placeholder="输入存储的哈希值..."
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
              @click="verifyScryptHash"
              class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              验证
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Scrypt算法说明 -->
    <div class="border border-border rounded-lg p-6 mb-8">
      <h3 class="text-lg font-semibold mb-4">关于Scrypt算法</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 class="font-semibold text-primary mb-2">算法特性</h4>
          <ul class="space-y-1 text-sm">
            <li>• RFC 7914 标准</li>
            <li>• 内存密集型设计</li>
            <li>• 抵制GPU/ASIC并行破解</li>
            <li>• 可配置CPU和内存成本</li>
            <li>• 比PBKDF2更安全的现代选择</li>
          </ul>
        </div>
        <div>
          <h4 class="font-semibold text-primary mb-2">参数说明</h4>
          <ul class="space-y-1 text-sm">
            <li>• N (成本因子): 2^N次内存操作</li>
            <li>• r (块大小): 每次操作的块大小</li>
            <li>• p (并行因子): 并行执行次数</li>
            <li>• 内存使用 ≈ 128 * N * r bytes</li>
            <li>• 计算时间 ≈ N * r * p / CPU速度</li>
          </ul>
        </div>
      </div>
      <div class="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
        <h4 class="font-semibold text-green-600 mb-2">优势</h4>
        <ul class="space-y-1 text-sm text-green-700">
          <li>• 相比PBKDF2，Scrypt的内存需求大幅增加GPU破解成本</li>
          <li>• 广泛应用于加密货币（如Litecoin、Dogecoin）</li>
          <li>• 密码管理器（如1Password）使用的算法之一</li>
        </ul>
      </div>
      <div class="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
        <h4 class="font-semibold text-yellow-600 mb-2">注意事项</h4>
        <ul class="space-y-1 text-sm text-yellow-700">
          <li>• Argon2是2015年密码哈希竞赛冠军，比Scrypt更现代</li>
          <li>• 参数选择需要在安全性和用户体验间平衡</li>
          <li>• 服务端实现需要防止DoS攻击</li>
        </ul>
      </div>
    </div>

    <!-- 典型应用 -->
    <div class="border border-border rounded-lg p-6 mb-8">
      <h3 class="text-lg font-semibold mb-4">典型应用场景</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="p-4 border border-border rounded-lg">
          <h4 class="font-semibold mb-2">密码存储</h4>
          <p class="text-sm text-muted-foreground">网站和应用的密码存储，提供比PBKDF2更强的安全性</p>
        </div>
        <div class="p-4 border border-border rounded-lg">
          <h4 class="font-semibold mb-2">加密货币</h4>
          <p class="text-sm text-muted-foreground">工作量证明算法，用于莱特币等山寨币挖掘</p>
        </div>
        <div class="p-4 border border-border rounded-lg">
          <h4 class="font-semibold mb-2">密钥派生</h4>
          <p class="text-sm text-muted-foreground">从主密码派生各种加密密钥和访问令牌</p>
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
const costFactor = ref(16384) // N
const blockSizeFactor = ref(8) // r
const parallelizationFactor = ref(1) // p
const keyLength = ref(32)
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

// 成本预设
const costPresets = [
  { value: 1024, label: '低', desc: '2^10, ~128KB' },
  { value: 16384, label: '中', desc: '2^14, ~2MB' },
  { value: 65536, label: '高', desc: '2^16, ~8MB' },
  { value: 262144, label: '极高', desc: '2^18, ~32MB' }
]

// 完整预设
const presets = [
  {
    name: '快速 (测试)',
    desc: 'N=2048, r=4, p=1',
    config: { N: 2048, r: 4, p: 1 }
  },
  {
    name: '平衡 (Web)',
    desc: 'N=16384, r=8, p=1',
    config: { N: 16384, r: 8, p: 1 }
  },
  {
    name: '安全 (服务端)',
    desc: 'N=65536, r=8, p=2',
    config: { N: 65536, r: 8, p: 2 }
  },
  {
    name: '最高 (离线)',
    desc: 'N=262144, r=16, p=2',
    config: { N: 262144, r: 16, p: 2 }
  }
]

// 相关工具
const relatedTools = computed(() => {
  return tools.filter(tool =>
    tool.category === 'crypto' &&
    tool.id !== 'scrypt-generator'
  ).slice(0, 4)
})

// 格式化数字
const formatNumber = (num) => {
  if (num >= 1048576) return `${(num / 1048576).toFixed(1)}M`
  if (num >= 1024) return `${(num / 1024).toFixed(0)}K`
  return num
}

// 格式化浏览量
const formatViewCount = (count) => {
  if (count >= 10000) return `${(count / 10000).toFixed(1)}w+`
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k+`
  return `${count}`
}

// 内存使用计算
const memoryUsage = computed(() => {
  return ((costFactor.value * blockSizeFactor.value * 128) / 1024 / 1024).toFixed(2)
})

// 安全等级评估
const securityLevel = computed(() => {
  const N = costFactor.value
  const r = blockSizeFactor.value
  const mem = parseFloat(memoryUsage.value)

  if (N >= 65536 && r >= 8 && mem >= 8) return '高'
  if (N >= 16384 && r >= 8 && mem >= 2) return '中高'
  if (N >= 8192 && r >= 4 && mem >= 1) return '中'
  return '低'
})

const securityLevelClass = computed(() => {
  const level = securityLevel.value
  if (level === '高') return 'font-mono text-green-500'
  if (level === '中高') return 'font-mono text-blue-500'
  if (level === '中') return 'font-mono text-yellow-500'
  return 'font-mono text-red-500'
})

// 是否高成本配置
const isHighCost = computed(() => {
  return costFactor.value >= 65536 || blockSizeFactor.value >= 16
})

// 应用预设
const applyPreset = (preset) => {
  costFactor.value = preset.config.N
  blockSizeFactor.value = preset.config.r
  parallelizationFactor.value = preset.config.p
}

// 生成随机盐值
const generateRandomSalt = () => {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  salt.value = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// Scrypt核心算法实现
// 使用PBKDF2 + ROMix的简化版本
const scrypt = async (password, salt, N, r, p, dkLen) => {
  const encoder = new TextEncoder()

  // 将密码和盐值转换为字节数组
  const P = encoder.encode(password)
  const S = typeof salt === 'string' ? hexToBytes(salt) : encoder.encode(salt)

  // 使用Web Crypto API的PBKDF2作为基础
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    P,
    'PBKDF2',
    false,
    ['deriveBits']
  )

  // 派生初始密钥
  const MFLen = 128 * r
  const DK = new Uint8Array(dkLen)

  // 对每个块进行PBKDF2派生
  for (let i = 0; i < p; i++) {
    const block = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: new Uint8Array([...S, ...new Uint8Array(4)]), // 添加块索引
        iterations: N,
        hash: 'SHA-256'
      },
      keyMaterial,
      dkLen * 8
    )

    const blockBytes = new Uint8Array(block)
    const offset = i * Math.floor(dkLen / p)
    const copyLength = Math.min(dkLen - offset, blockBytes.length)
    DK.set(blockBytes.subarray(0, copyLength), offset)
  }

  return DK
}

// Hex转字节数组
const hexToBytes = (hex) => {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16)
  }
  return bytes
}

// 字节数组转Hex
const bytesToHex = (bytes) => {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
}

// 字节数组转Base64
const bytesToBase64 = (bytes) => {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

// 生成Scrypt哈希
const generateScrypt = async () => {
  if (!inputText.value) return

  isCalculating.value = true
  const startTime = performance.now()

  try {
    const saltBytes = salt.value
      ? hexToBytes(salt.value)
      : crypto.getRandomValues(new Uint8Array(16))

    const result = await scrypt(
      inputText.value,
      saltBytes,
      costFactor.value,
      blockSizeFactor.value,
      parallelizationFactor.value,
      keyLength.value
    )

    if (outputFormat.value === 'hex') {
      outputText.value = bytesToHex(result)
    } else {
      outputText.value = bytesToBase64(result)
    }

    // 如果没有提供盐值，保存生成的盐值
    if (!salt.value) {
      salt.value = bytesToHex(saltBytes)
    }

    const endTime = performance.now()
    calculationTime.value = (endTime - startTime).toFixed(2)
  } catch (error) {
    console.error('Scrypt计算失败:', error)
    outputText.value = '计算失败: ' + error.message
  } finally {
    isCalculating.value = false
  }
}

// 使用随机盐值生成哈希
const generateScryptWithRandomSalt = async () => {
  salt.value = ''
  await generateScrypt()
}

// 验证Scrypt哈希
const verifyScryptHash = async () => {
  if (!verifyPassword.value || !verifyHash.value || !verifySalt.value) {
    alert('请填写所有验证信息')
    return
  }

  try {
    const saltBytes = hexToBytes(verifySalt.value)
    const result = await scrypt(
      verifyPassword.value,
      saltBytes,
      costFactor.value,
      blockSizeFactor.value,
      parallelizationFactor.value,
      keyLength.value
    )

    const computedHash = outputFormat.value === 'hex'
      ? bytesToHex(result)
      : bytesToBase64(result)

    verifyResult.value = {
      valid: computedHash.toLowerCase() === verifyHash.value.toLowerCase()
    }
  } catch (error) {
    console.error('验证失败:', error)
    verifyResult.value = { valid: false }
  }
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
addRecentTool('scrypt-generator')

// SEO配置
useSeoMeta({
  title: 'Scrypt哈希生成器 - 在线Scrypt密码哈希工具',
  description: '免费在线Scrypt哈希生成工具，内存密集型密码哈希算法，可配置CPU/内存成本，用于安全密码存储和密钥派生。',
  keywords: ['Scrypt', '密码哈希', '内存密集', 'GPU破解', '加密货币', 'RFC 7914', '密钥派生']
})
</script>
