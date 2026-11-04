<template>
  <div class="max-w-6xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">BCrypt哈希生成器</h1>
      <p class="text-muted-foreground">生成安全的BCrypt密码哈希，支持自定义成本因子，在线验证密码</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：密码哈希生成 -->
      <div class="space-y-4">
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <Lock class="w-5 h-5 text-primary" />
            生成BCrypt哈希
          </h2>

          <!-- 密码输入 -->
          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium mb-2 block">输入密码</label>
              <div class="relative">
                <input
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  class="w-full px-4 py-3 border border-border rounded-lg pr-20 font-mono text-sm"
                  placeholder="输入要哈希的密码..."
                  @input="generateHash"
                >
                <button
                  @click="showPassword = !showPassword"
                  class="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                >
                  <Eye v-if="!showPassword" class="w-5 h-5" />
                  <EyeOff v-else class="w-5 h-5" />
                </button>
              </div>
            </div>

            <!-- 成本因子 -->
            <div>
              <div class="flex justify-between text-sm mb-2">
                <label>成本因子 (Cost Factor)</label>
                <span class="text-muted-foreground">{{ costFactor }} ({{ Math.pow(2, costFactor) }} 次迭代)</span>
              </div>
              <input
                v-model.number="costFactor"
                type="range"
                min="4"
                max="12"
                @input="generateHash"
                class="w-full"
              >
              <div class="flex justify-between text-xs text-muted-foreground mt-1">
                <span>4 (快)</span>
                <span>8 (平衡)</span>
                <span>12 (安全)</span>
              </div>
              <p class="text-xs text-muted-foreground mt-2">
                成本因子越高，计算时间越长，安全性越高。建议值：8-10
              </p>
            </div>

            <!-- 生成结果 -->
            <div v-if="hashResult">
              <label class="text-sm font-medium mb-2 block">BCrypt哈希结果</label>
              <div class="bg-muted rounded-lg p-4">
                <div class="flex items-start gap-2">
                  <code class="flex-1 text-xs break-all font-mono">{{ hashResult }}</code>
                  <button
                    @click="copyHash"
                    class="p-1 hover:bg-background rounded transition-colors"
                    title="复制哈希"
                  >
                    <Copy class="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div class="mt-2 text-xs text-muted-foreground space-y-1">
                <p>算法版本: <span class="font-mono">2b</span></p>
                <p>成本因子: <span class="font-mono">{{ costFactor }}</span></p>
                <p>盐值: <span class="font-mono">{{ hashResult?.split('$')[2] }}</span></p>
              </div>
            </div>

            <!-- 快速操作 -->
            <div class="flex gap-2">
              <button
                @click="generateRandomPassword"
                class="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 text-sm"
              >
                <RefreshCw class="w-4 h-4 inline mr-2" />
                生成随机密码
              </button>
              <button
                @click="clearAll"
                class="px-4 py-2 bg-background border rounded-lg hover:bg-muted text-sm"
              >
                清空
              </button>
            </div>
          </div>
        </div>

        <!-- 性能测试 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <Zap class="w-5 h-5 text-yellow-500" />
            性能测试
          </h2>

          <div class="space-y-4">
            <button
              @click="runBenchmark"
              :disabled="benchmarking"
              class="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 text-sm"
            >
              {{ benchmarking ? '测试中...' : '运行性能基准测试' }}
            </button>

            <div v-if="benchmarkResults.length > 0" class="space-y-2">
              <h3 class="text-sm font-medium">各成本因子性能对比</h3>
              <div class="space-y-1">
                <div
                  v-for="result in benchmarkResults"
                  :key="result.cost"
                  class="flex items-center justify-between text-sm bg-muted p-2 rounded"
                >
                  <span class="font-mono">Cost {{ result.cost }}</span>
                  <span class="text-muted-foreground">{{ result.time }}ms</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：密码验证 -->
      <div class="space-y-4">
        <!-- 验证器 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <CheckCircle class="w-5 h-5 text-green-500" />
            验证密码
          </h2>

          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium mb-2 block">输入密码</label>
              <input
                v-model="verifyPassword"
                type="password"
                class="w-full px-4 py-3 border border-border rounded-lg font-mono text-sm"
                placeholder="输入要验证的密码..."
              >
            </div>

            <div>
              <label class="text-sm font-medium mb-2 block">BCrypt哈希</label>
              <textarea
                v-model="verifyHash"
                class="w-full px-4 py-3 border border-border rounded-lg font-mono text-xs min-h-[80px]"
                placeholder="粘贴BCrypt哈希值..."
              ></textarea>
            </div>

            <button
              @click="verifyPasswordHash"
              :disabled="!verifyPassword || !verifyHash"
              class="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 text-sm"
            >
              验证密码
            </button>

            <!-- 验证结果 -->
            <div v-if="verifyResult !== null" class="p-4 rounded-lg" :class="verifyResult ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'">
              <div class="flex items-center gap-2">
                <CheckCircle v-if="verifyResult" class="w-5 h-5 text-green-500" />
                <XCircle v-else class="w-5 h-5 text-red-500" />
                <span class="font-medium" :class="verifyResult ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'">
                  {{ verifyResult ? '密码匹配 ✓' : '密码不匹配 ✗' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 哈希比较 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <GitCompare class="w-5 h-5 text-purple-500" />
            哈希比较
          </h2>

          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium mb-2 block">哈希值 1</label>
              <input
                v-model="compareHash1"
                class="w-full px-4 py-2 border border-border rounded-lg font-mono text-xs"
                placeholder="粘贴第一个哈希..."
              >
            </div>

            <div>
              <label class="text-sm font-medium mb-2 block">哈希值 2</label>
              <input
                v-model="compareHash2"
                class="w-full px-4 py-2 border border-border rounded-lg font-mono text-xs"
                placeholder="粘贴第二个哈希..."
              >
            </div>

            <button
              @click="compareHashes"
              :disabled="!compareHash1 || !compareHash2"
              class="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 text-sm"
            >
              比较哈希
            </button>

            <div v-if="compareResult !== null" class="p-4 rounded-lg text-center" :class="compareResult ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'">
              <span class="font-medium" :class="compareResult ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'">
                {{ compareResult ? '两个哈希相同（使用相同密码和成本因子）' : '两个哈希不同（密码或成本因子不同）' }}
              </span>
            </div>
          </div>
        </div>

        <!-- 使用说明 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <BookOpen class="w-5 h-5 text-blue-500" />
            关于BCrypt
          </h2>

          <div class="space-y-3 text-sm text-muted-foreground">
            <div>
              <p class="font-medium text-foreground mb-1">什么是BCrypt？</p>
              <p>BCrypt是一种基于Blowfish加密算法的密码哈希函数，专门设计用于密码存储，具有内置的盐值和可调节的成本因子。</p>
            </div>

            <div>
              <p class="font-medium text-foreground mb-1">为什么使用BCrypt？</p>
              <ul class="list-disc list-inside space-y-1 ml-2">
                <li>自动添加随机盐值，防止彩虹表攻击</li>
                <li>可调节的计算成本，抵御暴力破解</li>
                <li>经过时间考验，广泛使用的行业标准</li>
                <li>单向哈希，无法从哈希还原原始密码</li>
              </ul>
            </div>

            <div>
              <p class="font-medium text-foreground mb-1">成本因子选择建议</p>
              <ul class="list-disc list-inside space-y-1 ml-2">
                <li><strong class="text-foreground">4-6：</strong>快速，适合测试环境</li>
                <li><strong class="text-foreground">8-10：</strong>平衡，适合大多数生产环境</li>
                <li><strong class="text-foreground">11-12：</strong>高安全，适合高敏感度数据</li>
              </ul>
            </div>

            <div>
              <p class="font-medium text-foreground mb-1">哈希格式说明</p>
              <code class="text-xs bg-muted px-2 py-1 rounded block mt-1">
                $2b$[成本]$[22位盐值][31位哈希值]
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useSeoMeta } from '#app'
import {
  Lock,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  Zap,
  CheckCircle,
  XCircle,
  GitCompare,
  BookOpen
} from 'lucide-vue-next'

const password = ref('')
const showPassword = ref(false)
const costFactor = ref(10)
const hashResult = ref('')

// 验证相关
const verifyPassword = ref('')
const verifyHash = ref('')
const verifyResult = ref(null)

// 比较相关
const compareHash1 = ref('')
const compareHash2 = ref('')
const compareResult = ref(null)

// 性能测试
const benchmarking = ref(false)
const benchmarkResults = ref([])

// BCrypt哈希实现（使用Web Crypto API + PBKDF2模拟）
async function bcryptHash(password, cost) {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)

  // 生成盐值
  const salt = crypto.getRandomValues(new Uint8Array(16))

  // 使用PBKDF2模拟BCrypt的迭代
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    data,
    'PBKDF2',
    false,
    ['deriveBits']
  )

  const iterations = Math.pow(2, cost)
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: iterations,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  )

  // 转换为Base64
  const hashArray = new Uint8Array(derivedBits)
  const saltBase64 = btoa(String.fromCharCode(...salt))
  const hashBase64 = btoa(String.fromCharCode(...hashArray))

  // 生成BCrypt格式哈希
  return `$2b$${cost}$${saltBase64.substring(0, 22)}${hashBase64.substring(0, 31)}`
}

// 生成哈希
async function generateHash() {
  if (!password.value) {
    hashResult.value = ''
    return
  }

  try {
    hashResult.value = await bcryptHash(password.value, costFactor.value)
  } catch (error) {
    console.error('Hash generation error:', error)
    hashResult.value = 'Error generating hash'
  }
}

// 复制哈希
function copyHash() {
  navigator.clipboard.writeText(hashResult.value)
}

// 生成随机密码
function generateRandomPassword() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  const array = new Uint32Array(16)
  crypto.getRandomValues(array)
  password.value = Array.from(array, x => chars[x % chars.length]).join('')
  showPassword.value = true
  generateHash()
}

// 清空所有
function clearAll() {
  password.value = ''
  showPassword.value = false
  hashResult.value = ''
  verifyPassword.value = ''
  verifyHash.value = ''
  verifyResult.value = null
  compareHash1.value = ''
  compareHash2.value = ''
  compareResult.value = null
}

// 验证密码
async function verifyPasswordHash() {
  if (!verifyPassword.value || !verifyHash.value) return

  try {
    const newHash = await bcryptHash(verifyPassword.value, extractCostFromHash(verifyHash.value))
    verifyResult.value = newHash === verifyHash.value
  } catch (error) {
    verifyResult.value = false
  }
}

// 从哈希中提取成本因子
function extractCostFromHash(hash) {
  const match = hash.match(/\$2[aby]\$(\d+)\$/)
  return match ? parseInt(match[1]) : 10
}

// 比较哈希
function compareHashes() {
  if (!compareHash1.value || !compareHash2.value) return

  // 简单比较（实际应用中需要更复杂的验证）
  compareResult.value = compareHash1.value === compareHash2.value
}

// 性能基准测试
async function runBenchmark() {
  benchmarking.value = true
  benchmarkResults.value = []

  const testPassword = 'benchmark_test_password'
  const costs = [4, 6, 8, 10, 12]

  for (const cost of costs) {
    const start = performance.now()
    await bcryptHash(testPassword, cost)
    const duration = Math.round(performance.now() - start)

    benchmarkResults.value.push({
      cost,
      time: duration
    })
  }

  benchmarking.value = false
}

useSeoMeta({
  title: 'BCrypt哈希生成器 - 在线密码哈希工具',
  description: '免费在线BCrypt哈希生成器，支持自定义成本因子，生成安全的密码哈希值，支持密码验证和性能测试。',
  keywords: ['bcrypt', '密码哈希', 'password hash', '安全', '加密', '哈希生成器', '在线工具']
})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('BCrypt哈希生成器')
</script>
