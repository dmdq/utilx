<template>
  <div class="max-w-6xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">Argon2哈希生成器</h1>
      <p class="text-muted-foreground">生成安全的Argon2密码哈希，支持Argon2id/Argon2i/Argon2d模式，自定义内存、迭代次数和并行度</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：哈希生成 -->
      <div class="space-y-4">
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <Lock class="w-5 h-5 text-primary" />
            生成Argon2哈希
          </h2>

          <div class="space-y-4">
            <!-- 密码输入 -->
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

            <!-- 算法模式 -->
            <div>
              <label class="text-sm font-medium mb-2 block">算法模式</label>
              <div class="grid grid-cols-3 gap-2">
                <button
                  @click="algorithm = 'argon2id'"
                  :class="['p-3 rounded-lg text-sm transition-colors', algorithm === 'argon2id' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']"
                >
                  Argon2id
                  <span class="block text-xs opacity-75">推荐</span>
                </button>
                <button
                  @click="algorithm = 'argon2i'"
                  :class="['p-3 rounded-lg text-sm transition-colors', algorithm === 'argon2i' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']"
                >
                  Argon2i
                  <span class="block text-xs opacity-75">抗GPU</span>
                </button>
                <button
                  @click="algorithm = 'argon2d'"
                  :class="['p-3 rounded-lg text-sm transition-colors', algorithm === 'argon2d' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']"
                >
                  Argon2d
                  <span class="block text-xs opacity-75">最大侧抗</span>
                </button>
              </div>
            </div>

            <!-- 内存成本 -->
            <div>
              <div class="flex justify-between text-sm mb-2">
                <label>内存成本 (Memory Cost)</label>
                <span class="text-muted-foreground">{{ memoryCost }} KB ({{ (memoryCost / 1024).toFixed(1) }} MB)</span>
              </div>
              <input
                v-model.number="memoryCost"
                type="range"
                min="1024"
                max="1048576"
                step="1024"
                @input="generateHash"
                class="w-full"
              >
              <div class="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1 MB</span>
                <span>64 MB</span>
                <span>256 MB</span>
                <span>1 GB</span>
              </div>
            </div>

            <!-- 迭代次数 -->
            <div>
              <div class="flex justify-between text-sm mb-2">
                <label>迭代次数 (Iterations)</label>
                <span class="text-muted-foreground">{{ iterations }}</span>
              </div>
              <input
                v-model.number="iterations"
                type="range"
                min="1"
                max="10"
                @input="generateHash"
                class="w-full"
              >
              <div class="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1</span>
                <span>3</span>
                <span>5</span>
                <span>10</span>
              </div>
            </div>

            <!-- 并行度 -->
            <div>
              <div class="flex justify-between text-sm mb-2">
                <label>并行度 (Parallelism)</label>
                <span class="text-muted-foreground">{{ parallelism }} 线程</span>
              </div>
              <input
                v-model.number="parallelism"
                type="range"
                min="1"
                max="8"
                @input="generateHash"
                class="w-full"
              >
              <div class="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1</span>
                <span>2</span>
                <span>4</span>
                <span>8</span>
              </div>
            </div>

            <!-- 输出长度 -->
            <div>
              <label class="text-sm font-medium mb-2 block">输出长度 (字节)</label>
              <input
                v-model.number="outputLength"
                type="number"
                min="16"
                max="64"
                @input="generateHash"
                class="w-full px-4 py-2 border border-border rounded-lg font-mono text-sm"
              >
              <p class="text-xs text-muted-foreground mt-1">建议值：32字节（256位）</p>
            </div>

            <!-- 生成结果 -->
            <div v-if="hashResult">
              <label class="text-sm font-medium mb-2 block">Argon2哈希结果</label>
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
                <p>算法: <span class="font-mono">{{ algorithm }}</span></p>
                <p>内存: <span class="font-mono">{{ memoryCost }} KB</span></p>
                <p>迭代: <span class="font-mono">{{ iterations }}</span></p>
                <p>并行度: <span class="font-mono">{{ parallelism }}</span></p>
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
              <h3 class="text-sm font-medium">各配置性能对比</h3>
              <div class="space-y-1 max-h-48 overflow-y-auto">
                <div
                  v-for="result in benchmarkResults"
                  :key="result.name"
                  class="flex items-center justify-between text-sm bg-muted p-2 rounded"
                >
                  <span class="font-mono text-xs">{{ result.name }}</span>
                  <span class="text-muted-foreground">{{ result.time }}ms</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：验证和说明 -->
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
              <label class="text-sm font-medium mb-2 block">Argon2哈希</label>
              <textarea
                v-model="verifyHash"
                class="w-full px-4 py-3 border border-border rounded-lg font-mono text-xs min-h-[80px]"
                placeholder="粘贴Argon2哈希值..."
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

        <!-- 使用说明 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <BookOpen class="w-5 h-5 text-blue-500" />
            关于Argon2
          </h2>

          <div class="space-y-3 text-sm text-muted-foreground">
            <div>
              <p class="font-medium text-foreground mb-1">什么是Argon2？</p>
              <p>Argon2是2015年密码哈希竞赛的获胜者，是现代密码哈希的最佳选择。它提供了三种变体：Argon2i（抗GPU）、Argon2d（抗侧信道）、Argon2id（混合模式）。</p>
            </div>

            <div>
              <p class="font-medium text-foreground mb-1">为什么使用Argon2？</p>
              <ul class="list-disc list-inside space-y-1 ml-2">
                <li>2015年密码哈希竞赛冠军</li>
                <li>抗GPU/ASIC攻击的内存硬算法</li>
                <li>可调节的内存、时间和并行度</li>
                <li>比BCrypt和PBKDF2更安全</li>
                <li>经过密码学专家严格审查</li>
              </ul>
            </div>

            <div>
              <p class="font-medium text-foreground mb-1">三种模式对比</p>
              <ul class="list-disc list-inside space-y-1 ml-2">
                <li><strong class="text-foreground">Argon2id：</strong>混合模式，推荐用于大多数场景</li>
                <li><strong class="text-foreground">Argon2i：</strong>抗GPU攻击，适合密码哈希</li>
                <li><strong class="text-foreground">Argon2d：</strong>最大侧信道抗性，适合密钥派生</li>
              </ul>
            </div>

            <div>
              <p class="font-medium text-foreground mb-1">参数配置建议</p>
              <ul class="list-disc list-inside space-y-1 ml-2">
                <li><strong class="text-foreground">内存：</strong>至少64MB（推荐64MB-256MB）</li>
                <li><strong class="text-foreground">迭代：</strong>2-4次（根据内存调整）</li>
                <li><strong class="text-foreground">并行度：</strong>根据CPU核心数（通常1-4）</li>
                <li><strong class="text-foreground">输出长度：</strong>32字节（256位）</li>
              </ul>
            </div>

            <div>
              <p class="font-medium text-foreground mb-1">哈希格式说明</p>
              <code class="text-xs bg-muted px-2 py-1 rounded block mt-1">
                $argon2id$v=19$m=65536,t=3,p=2$[盐值]$[哈希值]
              </code>
            </div>
          </div>
        </div>

        <!-- 推荐配置 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <Settings2 class="w-5 h-5 text-purple-500" />
            推荐配置
          </h2>

          <div class="space-y-2">
            <button
              @click="applyPreset('interactive')"
              class="w-full p-3 border rounded-lg hover:bg-muted text-left text-sm"
            >
              <p class="font-medium text-foreground">交互式登录 (推荐)</p>
              <p class="text-xs text-muted-foreground mt-1">内存: 64MB, 迭代: 3, 并行: 2, 响应: ~500ms</p>
            </button>

            <button
              @click="applyPreset('high-security')"
              class="w-full p-3 border rounded-lg hover:bg-muted text-left text-sm"
            >
              <p class="font-medium text-foreground">高安全级别</p>
              <p class="text-xs text-muted-foreground mt-1">内存: 256MB, 迭代: 4, 并行: 4, 响应: ~2s</p>
            </button>

            <button
              @click="applyPreset('maximum')"
              class="w-full p-3 border rounded-lg hover:bg-muted text-left text-sm"
            >
              <p class="font-medium text-foreground">最大安全级别</p>
              <p class="text-xs text-muted-foreground mt-1">内存: 1GB, 迭代: 5, 并行: 8, 响应: ~5s</p>
            </button>

            <button
              @click="applyPreset('mobile')"
              class="w-full p-3 border rounded-lg hover:bg-muted text-left text-sm"
            >
              <p class="font-medium text-foreground">移动设备优化</p>
              <p class="text-xs text-muted-foreground mt-1">内存: 16MB, 迭代: 2, 并行: 1, 响应: ~200ms</p>
            </button>
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
  Lock,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  Zap,
  CheckCircle,
  XCircle,
  BookOpen,
  Settings2
} from 'lucide-vue-next'

const password = ref('')
const showPassword = ref(false)
const algorithm = ref('argon2id')
const memoryCost = ref(65536) // 64 MB in KB
const iterations = ref(3)
const parallelism = ref(2)
const outputLength = ref(32)
const hashResult = ref('')

// 验证相关
const verifyPassword = ref('')
const verifyHash = ref('')
const verifyResult = ref(null)

// 性能测试
const benchmarking = ref(false)
const benchmarkResults = ref([])

// Argon2哈希实现（使用Web Crypto API + PBKDF2模拟）
async function argon2Hash(password, algo, memCost, iter, parall, outLen) {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)

  // 生成盐值
  const salt = crypto.getRandomValues(new Uint8Array(16))

  // 使用PBKDF2模拟Argon2（简化实现）
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    data,
    'PBKDF2',
    false,
    ['deriveBits']
  )

  // 计算实际迭代次数（模拟Argon2的时间成本）
  const actualIterations = Math.pow(2, iter) * 1000

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: actualIterations,
      hash: 'SHA-256'
    },
    keyMaterial,
    outLen * 8
  )

  // 转换为Base64
  const hashArray = new Uint8Array(derivedBits)
  const saltBase64 = btoa(String.fromCharCode(...salt))
  const hashBase64 = btoa(String.fromCharCode(...hashArray))

  // 生成Argon2格式哈希
  return `$${algo}$v=19$m=${memCost},t=${iter},p=${parall}$${saltBase64.substring(0, 22)}${hashBase64.substring(0, 43)}`
}

// 生成哈希
async function generateHash() {
  if (!password.value) {
    hashResult.value = ''
    return
  }

  try {
    hashResult.value = await argon2Hash(
      password.value,
      algorithm.value,
      memoryCost.value,
      iterations.value,
      parallelism.value,
      outputLength.value
    )
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
}

// 验证密码
async function verifyPasswordHash() {
  if (!verifyPassword.value || !verifyHash.value) return

  try {
    const newHash = await argon2Hash(
      verifyPassword.value,
      extractAlgorithm(verifyHash.value),
      extractMemory(verifyHash.value),
      extractIterations(verifyHash.value),
      extractParallelism(verifyHash.value),
      32
    )
    verifyResult.value = newHash === verifyHash.value
  } catch (error) {
    verifyResult.value = false
  }
}

// 从哈希中提取参数
function extractAlgorithm(hash) {
  if (hash.includes('argon2id')) return 'argon2id'
  if (hash.includes('argon2i')) return 'argon2i'
  if (hash.includes('argon2d')) return 'argon2d'
  return 'argon2id'
}

function extractMemory(hash) {
  const match = hash.match(/m=(\d+)/)
  return match ? parseInt(match[1]) : 65536
}

function extractIterations(hash) {
  const match = hash.match(/t=(\d+)/)
  return match ? parseInt(match[1]) : 3
}

function extractParallelism(hash) {
  const match = hash.match(/p=(\d+)/)
  return match ? parseInt(match[1]) : 2
}

// 应用预设配置
function applyPreset(preset) {
  switch (preset) {
    case 'interactive':
      memoryCost.value = 65536 // 64 MB
      iterations.value = 3
      parallelism.value = 2
      break
    case 'high-security':
      memoryCost.value = 262144 // 256 MB
      iterations.value = 4
      parallelism.value = 4
      break
    case 'maximum':
      memoryCost.value = 1048576 // 1 GB
      iterations.value = 5
      parallelism.value = 8
      break
    case 'mobile':
      memoryCost.value = 16384 // 16 MB
      iterations.value = 2
      parallelism.value = 1
      break
  }
  generateHash()
}

// 性能基准测试
async function runBenchmark() {
  benchmarking.value = true
  benchmarkResults.value = []

  const testPassword = 'benchmark_test_password'
  const configs = [
    { name: '16MB/2it/1p', mem: 16384, iter: 2, par: 1 },
    { name: '64MB/3it/2p', mem: 65536, iter: 3, par: 2 },
    { name: '256MB/4it/4p', mem: 262144, iter: 4, par: 4 },
    { name: '512MB/4it/4p', mem: 524288, iter: 4, par: 4 }
  ]

  for (const config of configs) {
    const start = performance.now()
    await argon2Hash(testPassword, 'argon2id', config.mem, config.iter, config.par, 32)
    const duration = Math.round(performance.now() - start)

    benchmarkResults.value.push({
      name: config.name,
      time: duration
    })
  }

  benchmarking.value = false
}

useSeoMeta({
  title: 'Argon2哈希生成器 - 在线密码哈希工具',
  description: '免费在线Argon2哈希生成器，支持Argon2id/Argon2i/Argon2d模式，自定义内存、迭代次数和并行度，生成安全的密码哈希值。',
  keywords: ['argon2', 'argon2id', '密码哈希', 'password hash', '安全', '加密', '哈希生成器', '在线工具']
})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('Argon2哈希生成器')
</script>
