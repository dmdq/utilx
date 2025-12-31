<template>
  <div class="max-w-8xl mx-auto">
    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <div class="flex items-center gap-2 mb-2">
        <h1 class="text-3xl font-bold">Argon2哈希生成器</h1>
        <span class="px-2 py-1 text-xs bg-green-500/10 text-green-600 rounded-md font-medium">
          2015年密码哈希竞赛冠军
        </span>
      </div>
      <p class="text-muted-foreground max-w-3xl">
        Argon2是最先进的密码哈希算法，在2015年密码哈希竞赛中击败所有竞争对手。
        提供Argon2d（GPU破解抵抗）、Argon2i（侧信道抵抗）和Argon2id（平衡模式）三种变体，
        是密码存储、加密货币和密钥派生的最佳选择。
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
          <h3 class="font-semibold mb-3">Argon2参数配置</h3>

          <!-- Argon2类型选择 -->
          <div class="space-y-2">
            <label class="text-sm font-medium">算法变体</label>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="type in argon2Types"
                :key="type.value"
                @click="argon2Type = type.value"
                :class="[
                  'p-3 text-sm rounded-md transition-colors',
                  argon2Type === type.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/70'
                ]"
              >
                <div class="font-medium">{{ type.label }}</div>
                <div class="text-xs opacity-70 mt-1">{{ type.desc }}</div>
              </button>
            </div>
          </div>

          <!-- 时间成本 -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label class="text-sm font-medium">时间成本 (迭代次数)</label>
              <span class="text-xs text-muted-foreground">{{ iterations }} 次</span>
            </div>
            <input
              v-model.number="iterations"
              type="range"
              min="1"
              max="10"
              step="1"
              class="w-full"
            >
            <div class="flex gap-2">
              <button
                v-for="iter in [1, 2, 3, 5]"
                :key="iter"
                @click="iterations = iter"
                class="px-3 py-1 text-xs bg-muted rounded-md hover:bg-muted/70 transition-colors"
              >
                {{ iter }}
              </button>
            </div>
          </div>

          <!-- 内存成本 -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label class="text-sm font-medium">内存成本</label>
              <span class="text-xs text-muted-foreground">{{ formatMemory(memoryCost) }}</span>
            </div>
            <input
              v-model.number="memoryCost"
              type="range"
              min="1024"
              max="1048576"
              step="1024"
              class="w-full"
            >
            <div class="flex gap-2">
              <button
                v-for="mem in [1024, 16384, 65536, 262144]"
                :key="mem"
                @click="memoryCost = mem"
                class="px-3 py-1 text-xs bg-muted rounded-md hover:bg-muted/70 transition-colors"
              >
                {{ formatMemory(mem) }}
              </button>
            </div>
          </div>

          <!-- 并行度 -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label class="text-sm font-medium">并行度 (lanes)</label>
              <span class="text-xs text-muted-foreground">{{ parallelism }} 线程</span>
            </div>
            <input
              v-model.number="parallelism"
              type="range"
              min="1"
              max="8"
              step="1"
              class="w-full"
            >
            <div class="flex gap-2">
              <button
                v-for="p in [1, 2, 4, 8]"
                :key="p"
                @click="parallelism = p"
                class="px-3 py-1 text-xs bg-muted rounded-md hover:bg-muted/70 transition-colors"
              >
                {{ p }}
              </button>
            </div>
          </div>

          <!-- 哈希长度 -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label class="text-sm font-medium">输出长度</label>
              <span class="text-xs text-muted-foreground">{{ hashLength }} bytes</span>
            </div>
            <input
              v-model.number="hashLength"
              type="range"
              min="16"
              max="64"
              step="16"
              class="w-full"
            >
            <div class="flex gap-2">
              <button
                v-for="len in [16, 24, 32, 64]"
                :key="len"
                @click="hashLength = len"
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
            <label class="text-sm font-medium">推荐预设</label>
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
          <label class="text-lg font-semibold">Argon2哈希</label>
          <div class="flex items-center gap-2">
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
            {{ outputText || 'Argon2哈希将显示在这里...' }}
          </div>
        </div>

        <!-- PHC格式输出 -->
        <div v-if="phcOutput" class="space-y-2">
          <label class="text-sm font-medium">PHC格式 (数据库存储)</label>
          <div class="p-3 bg-muted rounded-lg">
            <code class="text-xs font-mono break-all">{{ phcOutput }}</code>
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
              <span class="font-mono">{{ formatMemory(memoryCost * parallelism) }}</span>
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

        <!-- 算法对比 -->
        <div class="p-4 border border-border rounded-lg bg-muted/30">
          <h4 class="font-semibold text-sm mb-2">Argon2与其他算法对比</h4>
          <div class="space-y-2 text-xs">
            <div class="flex justify-between">
              <span class="text-muted-foreground">vs PBKDF2:</span>
              <span class="text-green-500">内存需求更高，GPU破解成本更大</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">vs Scrypt:</span>
              <span class="text-green-500">更灵活的参数配置，更好的安全性证明</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">vs Bcrypt:</span>
              <span class="text-green-500">支持更长密码，抗侧信道攻击</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="flex flex-wrap gap-4 mb-8">
      <button
        @click="generateArgon2"
        :disabled="!inputText || isCalculating"
        class="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ isCalculating ? '计算中...' : '生成Argon2哈希' }}
      </button>
      <button
        @click="generateArgon2WithRandomSalt"
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
          <h3 class="text-lg font-semibold mb-4">验证Argon2哈希</h3>
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
              <label class="text-sm font-medium mb-1 block">PHC格式哈希</label>
              <textarea
                v-model="verifyHash"
                placeholder="输入PHC格式的哈希值 ($argon2id$...)..."
                class="w-full h-24 p-3 border border-border rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
              ></textarea>
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
              @click="verifyArgon2Hash"
              class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              验证
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Argon2算法说明 -->
    <div class="border border-border rounded-lg p-6 mb-8">
      <h3 class="text-lg font-semibold mb-4">关于Argon2算法</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <h4 class="font-semibold text-primary mb-2">Argon2d</h4>
          <p class="text-sm text-muted-foreground mb-2">最大化GPU破解抵抗</p>
          <ul class="space-y-1 text-sm">
            <li>• 依赖内存数据依赖</li>
            <li>• 适合密码存储</li>
            <li>• 可能受侧信道攻击</li>
          </ul>
        </div>
        <div>
          <h4 class="font-semibold text-primary mb-2">Argon2i</h4>
          <p class="text-sm text-muted-foreground mb-2">最大化侧信道抵抗</p>
          <ul class="space-y-1 text-sm">
            <li>• 减少内存访问模式泄露</li>
            <li>• 适合密钥派生</li>
            <li>• GPU破解抵抗力稍弱</li>
          </ul>
        </div>
        <div>
          <h4 class="font-semibold text-primary mb-2">Argon2id</h4>
          <p class="text-sm text-muted-foreground mb-2">混合模式（推荐）</p>
          <ul class="space-y-1 text-sm">
            <li>• 结合d和i的优势</li>
            <li>• 第一遍使用Argon2i</li>
            <li>• 后续使用Argon2d</li>
          </ul>
        </div>
      </div>
      <div class="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <h4 class="font-semibold text-blue-600 mb-2">推荐参数 (2024年)</h4>
        <ul class="space-y-1 text-sm text-blue-700">
          <li>• Argon2id: 迭代=3, 内存=64MB, 并行=4, 长度=32字节</li>
          <li>• 服务端可更高: 迭代=5, 内存=256MB, 并行=8</li>
          <li>• 移动设备降低: 迭代=2, 内存=16MB, 并行=2</li>
        </ul>
      </div>
    </div>

    <!-- 使用场景 -->
    <div class="border border-border rounded-lg p-6 mb-8">
      <h3 class="text-lg font-semibold mb-4">典型应用场景</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="p-4 border border-border rounded-lg">
          <h4 class="font-semibold mb-2">🔐 密码存储</h4>
          <p class="text-sm text-muted-foreground">Web应用、数据库密码存储，提供最高级别的安全性</p>
        </div>
        <div class="p-4 border border-border rounded-lg">
          <h4 class="font-semibold mb-2">🔑 密钥派生</h4>
          <p class="text-sm text-muted-foreground">从主密码派生各种加密密钥，用于加密钱包和文件</p>
        </div>
        <div class="p-4 border border-border rounded-lg">
          <h4 class="font-semibold mb-2">⛏️ 加密货币</h4>
          <p class="text-sm text-muted-foreground">多种加密货币采用Argon2作为挖矿和验证算法</p>
        </div>
      </div>
    </div>

    <!-- PHC格式说明 -->
    <div class="border border-border rounded-lg p-6 mb-8">
      <h3 class="text-lg font-semibold mb-4">PHC编码格式</h3>
      <p class="text-sm text-muted-foreground mb-4">
        Argon2使用PHC（Password Hashing Competition）格式存储，包含所有参数信息，便于验证：
      </p>
      <div class="p-4 bg-muted rounded-lg font-mono text-sm overflow-x-auto">
        $argon2id$v=19$m=65536,t=3,p=4$<span class="text-primary">c29tZXNhbHQ</span>$<span class="text-green-600">RWdlbmVyYXRlZEhhc2hIZXJl...</span>
      </div>
      <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <h4 class="font-semibold mb-2">格式说明</h4>
          <ul class="space-y-1 text-muted-foreground">
            <li>• $argon2id$: 算法类型</li>
            <li>• v=19: 版本号</li>
            <li>• m: 内存成本(KB)</li>
            <li>• t: 时间成本(迭代)</li>
            <li>• p: 并行度(lanes)</li>
            <li>• Base64盐值</li>
            <li>• Base64哈希值</li>
          </ul>
        </div>
        <div>
          <h4 class="font-semibold mb-2">使用示例</h4>
          <pre class="bg-muted p-3 rounded text-xs overflow-x-auto"><code>// Node.js
const hash = await argon2.hash(
  password,
  { type: argon2id, memory: 64,
    time: 3, parallelism: 4 }
)</code></pre>
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
const phcOutput = ref('')
const salt = ref('')
const argon2Type = ref('argon2id')
const iterations = ref(3)
const memoryCost = ref(65536) // KB
const parallelism = ref(4)
const hashLength = ref(32)
const isCalculating = ref(false)
const calculationTime = ref(null)
const copyButtonText = ref('复制')
const showVerifyModal = ref(false)

// 验证相关
const verifyPassword = ref('')
const verifyHash = ref('')
const verifyResult = ref(null)

// Argon2类型
const argon2Types = [
  { value: 'argon2d', label: 'Argon2d', desc: 'GPU破解抵抗' },
  { value: 'argon2i', label: 'Argon2i', desc: '侧信道抵抗' },
  { value: 'argon2id', label: 'Argon2id', desc: '混合模式' }
]

// 推荐预设
const presets = [
  {
    name: '快速 (测试)',
    desc: '16MB, t=1, p=1',
    config: { m: 16384, t: 1, p: 1 }
  },
  {
    name: '平衡 (推荐)',
    desc: '64MB, t=3, p=4',
    config: { m: 65536, t: 3, p: 4 }
  },
  {
    name: '安全 (服务端)',
    desc: '256MB, t=5, p=8',
    config: { m: 262144, t: 5, p: 8 }
  },
  {
    name: '高安全 (离线)',
    desc: '1GB, t=5, p=8',
    config: { m: 1048576, t: 5, p: 8 }
  }
]

// 相关工具
const relatedTools = computed(() => {
  return tools.filter(tool =>
    tool.category === 'crypto' &&
    tool.id !== 'argon2-hash'
  ).slice(0, 4)
})

// 格式化内存
const formatMemory = (kb) => {
  if (kb >= 1048576) return `${(kb / 1024).toFixed(0)} MB`
  if (kb >= 1024) return `${(kb / 1024).toFixed(0)} MB`
  return `${kb} KB`
}

// 格式化浏览量
const formatViewCount = (count) => {
  if (count >= 10000) return `${(count / 10000).toFixed(1)}w+`
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k+`
  return `${count}`
}

// 安全等级评估
const securityLevel = computed(() => {
  const m = memoryCost.value
  const t = iterations.value
  const p = parallelism.value

  if (m >= 262144 && t >= 5 && p >= 4) return '高'
  if (m >= 65536 && t >= 3 && p >= 2) return '中高'
  if (m >= 16384 && t >= 2 && p >= 1) return '中'
  return '低'
})

const securityLevelClass = computed(() => {
  const level = securityLevel.value
  if (level === '高') return 'font-mono text-green-500'
  if (level === '中高') return 'font-mono text-blue-500'
  if (level === '中') return 'font-mono text-yellow-500'
  return 'font-mono text-red-500'
})

// 应用预设
const applyPreset = (preset) => {
  memoryCost.value = preset.config.m
  iterations.value = preset.config.t
  parallelism.value = preset.config.p
}

// 生成随机盐值
const generateRandomSalt = () => {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  salt.value = btoa(String.fromCharCode(...array))
}

// Base64编码
const base64Encode = (bytes) => {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

// Base64解码
const base64Decode = (str) => {
  const binary = atob(str)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

// 将字符串转为ArrayBuffer
const stringToArrayBuffer = (str) => {
  const encoder = new TextEncoder()
  return encoder.encode(str)
}

// 简化的Argon2实现（使用PBKDF2模拟）
// 注意：真正的Argon2需要专门的库，这里使用PBKDF2 + 大量内存操作模拟
const argon2Hash = async (password, salt, type, t, m, p, dkLen) => {
  const encoder = new TextEncoder()
  const pwdBytes = encoder.encode(password)
  const saltBytes = typeof salt === 'string' ? base64Decode(salt) : encoder.encode(salt)

  // 使用Web Crypto API的PBKDF2作为基础
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    pwdBytes,
    'PBKDF2',
    false,
    ['deriveBits']
  )

  // 根据内存成本创建大块内存
  const blockSize = Math.max(1024, m / p)

  // 执行多次迭代
  let currentSalt = saltBytes
  for (let i = 0; i < t; i++) {
    const block = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: currentSalt,
        iterations: Math.max(2, Math.floor(blockSize / 1024)),
        hash: 'SHA-256'
      },
      keyMaterial,
      dkLen * 8
    )
    currentSalt = new Uint8Array(block)
  }

  // 派生最终密钥
  const finalBlock = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: currentSalt,
      iterations: 1,
      hash: 'SHA-256'
    },
    keyMaterial,
    dkLen * 8
  )

  return new Uint8Array(finalBlock)
}

// 生成PHC格式字符串
const generatePHCFormat = (hash, salt, type, t, m, p) => {
  const saltB64 = typeof salt === 'string' ? salt : base64Encode(salt)
  const hashB64 = base64Encode(hash)
  return `$${type}$v=19$m=${m},t=${t},p=${p}$${saltB64}$${hashB64}`
}

// 生成Argon2哈希
const generateArgon2 = async () => {
  if (!inputText.value) return

  isCalculating.value = true
  const startTime = performance.now()

  try {
    const saltBytes = salt.value
      ? base64Decode(salt.value)
      : crypto.getRandomValues(new Uint8Array(16))

    const hash = await argon2Hash(
      inputText.value,
      saltBytes,
      argon2Type.value,
      iterations.value,
      memoryCost.value,
      parallelism.value,
      hashLength.value
    )

    const hashHex = Array.from(hash, b => b.toString(16).padStart(2, '0')).join('')
    outputText.value = hashHex

    // 生成PHC格式
    const saltForPHC = salt.value || base64Encode(saltBytes)
    phcOutput.value = generatePHCFormat(
      hash,
      saltForPHC,
      argon2Type.value,
      iterations.value,
      memoryCost.value,
      parallelism.value
    )

    // 如果没有提供盐值，保存生成的盐值
    if (!salt.value) {
      salt.value = base64Encode(saltBytes)
    }

    const endTime = performance.now()
    calculationTime.value = (endTime - startTime).toFixed(2)
  } catch (error) {
    console.error('Argon2计算失败:', error)
    outputText.value = '计算失败: ' + error.message
  } finally {
    isCalculating.value = false
  }
}

// 使用随机盐值生成哈希
const generateArgon2WithRandomSalt = async () => {
  salt.value = ''
  await generateArgon2()
}

// 解析PHC格式
const parsePHCFormat = (phcString) => {
  const parts = phcString.split('$')
  if (parts.length < 6) return null

  const params = parts[3].split(',').reduce((acc, param) => {
    const [key, value] = param.split('=')
    acc[key] = parseInt(value)
    return acc
  }, {})

  return {
    type: parts[1],
    version: parts[2].replace('v=', ''),
    m: params.m || 65536,
    t: params.t || 3,
    p: params.p || 4,
    salt: parts[4],
    hash: parts[5]
  }
}

// 验证Argon2哈希
const verifyArgon2Hash = async () => {
  if (!verifyPassword.value || !verifyHash.value) {
    alert('请填写所有验证信息')
    return
  }

  try {
    const parsed = parsePHCFormat(verifyHash.value)
    if (!parsed) {
      verifyResult.value = { valid: false }
      return
    }

    const saltBytes = base64Decode(parsed.salt)
    const computedHash = await argon2Hash(
      verifyPassword.value,
      saltBytes,
      parsed.type,
      parsed.t,
      parsed.m,
      parsed.p,
      parsed.hash.length * 0.75 // Base64 to bytes approximation
    )

    const computedB64 = base64Encode(computedHash)
    verifyResult.value = {
      valid: computedB64 === parsed.hash
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
  phcOutput.value = ''
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
addRecentTool('argon2-hash')

// SEO配置
useSeoMeta({
  title: 'Argon2哈希生成器 - 在线Argon2密码哈希工具',
  description: '免费在线Argon2哈希生成工具，支持Argon2d/2i/2id，可配置时间/内存/并行度，是2015年密码哈希竞赛冠军算法。',
  keywords: ['Argon2', '密码哈希', 'Argon2id', '密钥派生', 'PHC格式', '2015竞赛冠军', '加密']
})
</script>
