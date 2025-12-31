<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">OTP动态口令生成器</h1>
      <p class="text-gray-600 dark:text-gray-400">生成TOTP/HOTP一次性密码，兼容Google Authenticator、Authy等验证器应用</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6 mb-8">
      <!-- Secret Configuration -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
          <Settings class="w-5 h-5 text-blue-500" />
          密钥配置
        </h2>

        <!-- OTP Type -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">OTP类型</label>
          <div class="flex gap-2">
            <button
              @click="otpType = 'TOTP'"
              :class="['px-4 py-2 rounded-lg font-medium flex-1', otpType === 'TOTP' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600']"
            >
              TOTP (基于时间)
            </button>
            <button
              @click="otpType = 'HOTP'"
              :class="['px-4 py-2 rounded-lg font-medium flex-1', otpType === 'HOTP' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600']"
            >
              HOTP (基于计数)
            </button>
          </div>
          <p class="text-xs text-gray-500 mt-2">
            TOTP: 每隔固定时间变化 (推荐，如Google Authenticator)<br>
            HOTP: 每次使用后计数器增加
          </p>
        </div>

        <!-- Secret Key -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">密钥 (Secret Key)</label>
          <div class="flex gap-2">
            <input
              v-model="secretKey"
              type="text"
              class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 font-mono text-sm"
              placeholder="Base32编码的密钥"
            >
            <button
              @click="generateSecret"
              class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg"
              title="生成新密钥"
            >
              <RefreshCw class="w-5 h-5" />
            </button>
          </div>
          <p class="text-xs text-gray-500 mt-1">点击生成按钮创建新的随机密钥</p>
        </div>

        <!-- Digits -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">
            密码位数: {{ digits }} 位
          </label>
          <select v-model="digits" class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
            <option :value="6">6 位 (最常用)</option>
            <option :value="7">7 位</option>
            <option :value="8">8 位</option>
          </select>
        </div>

        <!-- Algorithm -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">哈希算法</label>
          <select v-model="algorithm" class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
            <option value="SHA1">SHA-1 (默认，兼容性最好)</option>
            <option value="SHA256">SHA-256 (更安全)</option>
            <option value="SHA512">SHA-512 (最安全)</option>
          </select>
        </div>

        <!-- TOTP: Period -->
        <div v-if="otpType === 'TOTP'" class="mb-4">
          <label class="block text-sm font-medium mb-2">
            时间步长: {{ period }} 秒
          </label>
          <input
            v-model.number="period"
            type="range"
            min="15"
            max="60"
            step="15"
            class="w-full"
          >
          <div class="flex justify-between text-xs text-gray-500">
            <span>15秒</span>
            <span>30秒 (推荐)</span>
            <span>60秒</span>
          </div>
        </div>

        <!-- HOTP: Counter -->
        <div v-else class="mb-4">
          <label class="block text-sm font-medium mb-2">计数器 (Counter)</label>
          <div class="flex gap-2 items-center">
            <input
              v-model.number="hotpCounter"
              type="number"
              min="0"
              class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            >
            <button
              @click="hotpCounter++"
              class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
            >
              +1
            </button>
          </div>
        </div>

        <!-- Issuer -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">服务名称 (Issuer)</label>
          <input
            v-model="issuer"
            type="text"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            placeholder="例如: Google, GitHub, AWS"
          >
        </div>

        <!-- Account Name -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">账户名称</label>
          <input
            v-model="accountName"
            type="text"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            placeholder="例如: user@example.com"
          >
        </div>
      </div>

      <!-- OTP Result -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
          <Clock class="w-5 h-5 text-green-500" />
          动态密码
        </h2>

        <div v-if="secretKey" class="space-y-4">
          <!-- Current OTP -->
          <div class="text-center">
            <div class="mb-4">
              <div class="text-5xl font-mono font-bold tracking-wider" :class="otpTimeRemaining < 5 ? 'text-red-500 animate-pulse' : 'text-gray-900 dark:text-gray-100'">
                {{ formatOTP(currentOTP) }}
              </div>
            </div>

            <!-- TOTP Countdown -->
            <div v-if="otpType === 'TOTP'" class="mb-4">
              <div class="flex items-center justify-center gap-2 mb-2">
                <Timer class="w-5 h-5 text-blue-500" />
                <span class="text-lg font-medium">{{ otpTimeRemaining }} 秒后更新</span>
              </div>
              <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                <div
                  class="bg-blue-500 h-full transition-all duration-1000 ease-linear"
                  :style="{ width: `${(otpTimeRemaining / period) * 100}%` }"
                ></div>
              </div>
            </div>

            <div class="flex gap-2 justify-center">
              <button
                @click="copyOTP(currentOTP)"
                class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center gap-2"
              >
                <Copy class="w-4 h-4" />
                复制密码
              </button>
              <button
                v-if="otpType === 'HOTP'"
                @click="hotpCounter++; generateOTP()"
                class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center gap-2"
              >
                <RefreshCw class="w-4 h-4" />
                下一个
              </button>
            </div>
          </div>

          <!-- QR Code (OTP URI) -->
          <div class="border-t pt-4">
            <h3 class="font-medium mb-3 text-center">添加到验证器应用</h3>
            <div class="flex justify-center mb-4">
              <div class="p-4 bg-white rounded-lg inline-block">
                <!-- Simple QR code placeholder - in production use a QR library -->
                <div class="w-48 h-48 bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-center">
                  <div class="text-sm text-gray-500">
                    <QrCode class="w-16 h-16 mx-auto mb-2" />
                    <p>QR Code</p>
                    <p class="text-xs mt-2">扫描下方URI添加</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- OTP URI -->
            <div>
              <label class="block text-sm font-medium mb-2">OTP URI</label>
              <div class="relative">
                <pre class="bg-gray-100 dark:bg-gray-900 p-3 rounded-lg text-xs font-mono break-all whitespace-pre-wrap">{{ otpUri }}</pre>
                <button
                  @click="copyToClipboard(otpUri)"
                  class="absolute top-2 right-2 p-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300"
                  title="复制URI"
                >
                  <Copy class="w-3 h-3" />
                </button>
              </div>
              <p class="text-xs text-gray-500 mt-2">
                将此URI添加到Google Authenticator、Authy、Microsoft Authenticator等应用
              </p>
            </div>
          </div>

          <!-- OTP Info -->
          <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h3 class="font-medium text-blue-800 dark:text-blue-300 mb-2">配置信息</h3>
            <div class="text-sm text-blue-700 dark:text-blue-400 space-y-1">
              <p>类型: {{ otpType }}</p>
              <p>密钥: {{ secretKey }}</p>
              <p>算法: {{ algorithm }}</p>
              <p>位数: {{ digits }}</p>
              <p v-if="otpType === 'TOTP'">步长: {{ period }}秒</p>
              <p v-else>计数器: {{ hotpCounter }}</p>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-12 text-gray-500">
          <Clock class="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>生成或输入密钥后显示动态密码</p>
        </div>
      </div>
    </div>

    <!-- OTP History -->
    <div v-if="otpHistory.length > 0" class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
      <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
        <History class="w-5 h-5 text-purple-500" />
        历史记录
      </h2>
      <div class="grid grid-cols-5 md:grid-cols-10 gap-2">
        <div
          v-for="(otp, index) in otpHistory"
          :key="index"
          class="bg-gray-100 dark:bg-gray-900 p-2 rounded text-center font-mono text-sm"
        >
          {{ formatOTP(otp) }}
        </div>
      </div>
      <button
        @click="otpHistory = []"
        class="mt-4 text-sm text-red-500 hover:text-red-700"
      >
        清空历史
      </button>
    </div>

    <!-- OTP Guide -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
      <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
        <Book class="w-5 h-5 text-indigo-500" />
        使用指南
      </h2>

      <div class="grid md:grid-cols-2 gap-6">
        <!-- How to Setup -->
        <div>
          <h3 class="font-medium mb-3">如何设置</h3>
          <ol class="list-decimal list-inside space-y-2 text-sm">
            <li>生成一个新的密钥，或从服务获取现有密钥</li>
            <li>使用验证器应用扫描二维码或手动输入密钥</li>
            <li>应用将开始生成动态密码</li>
            <li>在登录时输入当前显示的6位数字</li>
          </ol>
        </div>

        <!-- Popular Apps -->
        <div>
          <h3 class="font-medium mb-3">推荐验证器应用</h3>
          <div class="space-y-2 text-sm">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">🔐</div>
              <div>
                <p class="font-medium">Google Authenticator</p>
                <p class="text-xs text-gray-500">Android, iOS</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">🛡️</div>
              <div>
                <p class="font-medium">Authy</p>
                <p class="text-xs text-gray-500">Android, iOS, Desktop</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 bg-green-100 rounded flex items-center justify-center">🔑</div>
              <div>
                <p class="font-medium">Microsoft Authenticator</p>
                <p class="text-xs text-gray-500">Android, iOS</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 bg-purple-100 rounded flex items-center justify-center">⚡</div>
              <div>
                <p class="font-medium">Authenticator Pro</p>
                <p class="text-xs text-gray-500">开源，支持备份</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Security Tips -->
      <div class="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <h3 class="font-medium text-yellow-800 dark:text-yellow-300 mb-2">安全提示</h3>
        <ul class="text-sm text-yellow-700 dark:text-yellow-400 space-y-1">
          <li>• 密钥必须妥善保管，泄露后任何人都能生成你的OTP</li>
          <li>• 建议将密钥保存在安全的地方，以备设备丢失时恢复</li>
          <li>• 不要截屏分享包含密钥的二维码</li>
          <li>• 启用账号的其他安全措施（如备用码）</li>
        </ul>
      </div>
    </div>

    <!-- Related Tools -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">相关工具</h2>
      <div class="grid md:grid-cols-3 gap-4">
        <NuxtLink to="/tools/uuid-generator" class="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <Hash class="w-8 h-8 text-blue-500 mb-2" />
          <h3 class="font-medium">UUID生成器</h3>
          <p class="text-sm text-gray-500">生成唯一标识符</p>
        </NuxtLink>
        <NuxtLink to="/tools/password-generator" class="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <Shield class="w-8 h-8 text-green-500 mb-2" />
          <h3 class="font-medium">密码生成器</h3>
          <p class="text-sm text-gray-500">生成强密码</p>
        </NuxtLink>
        <NuxtLink to="/tools/hmac-generator" class="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <FileSignature class="w-8 h-8 text-purple-500 mb-2" />
          <h3 class="font-medium">HMAC生成器</h3>
          <p class="text-sm text-gray-500">消息认证码</p>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import {
  Settings,
  Clock,
  Timer,
  RefreshCw,
  Copy,
  QrCode,
  History,
  Book,
  Hash,
  Shield,
  FileSignature
} from 'lucide-vue-next'

// SEO配置
useHead({
  title: 'OTP动态口令生成器 - 在线TOTP/HOTP双因素认证工具',
  meta: [
    {
      name: 'description',
      content: '在线OTP动态口令生成器，支持TOTP和HOTP算法。兼容Google Authenticator、Authy、Microsoft Authenticator等验证器应用，生成6/7/8位动态密码，适用于双因素认证2FA。'
    },
    {
      name: 'keywords',
      content: 'OTP,TOTP,HOTP,动态口令,双因素认证,2FA,Google Authenticator,验证器,在线OTP生成'
    }
  ]
})

// State
const otpType = ref<'TOTP' | 'HOTP'>('TOTP')
const secretKey = ref('')
const digits = ref(6)
const algorithm = ref('SHA1')
const period = ref(30)
const hotpCounter = ref(0)
const issuer = ref('MyService')
const accountName = ref('user@example.com')

// Current OTP
const currentOTP = ref('')
const otpTimeRemaining = ref(30)
const otpHistory = ref<string[]>([])

let otpInterval: any = null
let countdownInterval: any = null

// Base32 encoding/decoding
const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

function base32Encode(buffer: Uint8Array): string {
  let bits = 0
  let value = 0
  let output = ''

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i]
    bits += 8

    while (bits >= 5) {
      output += BASE32_CHARS[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }

  if (bits > 0) {
    output += BASE32_CHARS[(value << (5 - bits)) & 31]
  }

  return output
}

function base32Decode(input: string): Uint8Array {
  const cleanInput = input.toUpperCase().replace(/[^A-Z2-7]/g, '')
  const output = new Uint8Array((Math.ceil(cleanInput.length * 5 / 8)))

  let bits = 0
  let value = 0
  let index = 0

  for (let i = 0; i < cleanInput.length; i++) {
    const charIndex = BASE32_CHARS.indexOf(cleanInput[i])
    if (charIndex === -1) continue

    value = (value << 5) | charIndex
    bits += 5

    if (bits >= 8) {
      output[index++] = (value >>> (bits - 8)) & 255
      bits -= 8
    }
  }

  return output
}

// Generate random secret
function generateSecret() {
  const secretBytes = new Uint8Array(20) // 160 bits
  crypto.getRandomValues(secretBytes)
  secretKey.value = base32Encode(secretBytes)
  generateOTP()
}

// Calculate TOTP
async function calculateTOTP(secret: string, time: number): Promise<string> {
  try {
    const secretBytes = base32Decode(secret)
    const timeBuffer = new ArrayBuffer(8)
    const timeView = new DataView(timeBuffer)
    timeView.setUint32(4, Math.floor(time / period.value), false) // Big-endian

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      secretBytes,
      { name: 'HMAC', hash: algorithm.value },
      false,
      ['sign']
    )

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, new Uint8Array(timeBuffer))
    const hmac = new Uint8Array(signature)

    const offset = hmac[hmac.length - 1] & 0x0f
    const code =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff)

    const otp = (code % Math.pow(10, digits.value)).toString().padStart(digits.value, '0')
    return otp
  } catch (e) {
    console.error('TOTP calculation error:', e)
    return 'ERROR'
  }
}

// Calculate HOTP
async function calculateHOTP(secret: string, counter: number): Promise<string> {
  try {
    const secretBytes = base32Decode(secret)
    const counterBuffer = new ArrayBuffer(8)
    const counterView = new DataView(counterBuffer)
    counterView.setUint32(4, counter, false) // Big-endian

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      secretBytes,
      { name: 'HMAC', hash: algorithm.value },
      false,
      ['sign']
    )

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, new Uint8Array(counterBuffer))
    const hmac = new Uint8Array(signature)

    const offset = hmac[hmac.length - 1] & 0x0f
    const code =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff)

    const otp = (code % Math.pow(10, digits.value)).toString().padStart(digits.value, '0')
    return otp
  } catch (e) {
    console.error('HOTP calculation error:', e)
    return 'ERROR'
  }
}

// Generate OTP
async function generateOTP() {
  if (!secretKey.value) return

  if (otpType.value === 'TOTP') {
    const now = Math.floor(Date.now() / 1000)
    currentOTP.value = await calculateTOTP(secretKey.value, now)
    otpTimeRemaining.value = period.value - (now % period.value)
  } else {
    currentOTP.value = await calculateHOTP(secretKey.value, hotpCounter.value)
  }
}

// Format OTP for display
function formatOTP(otp: string): string {
  const mid = Math.floor(otp.length / 2)
  return otp.slice(0, mid) + ' ' + otp.slice(mid)
}

// OTP URI
const otpUri = computed(() => {
  if (!secretKey.value) return ''

  const type = otpType.value.toLowerCase()
  const params = new URLSearchParams({
    secret: secretKey.value,
    digits: digits.value.toString(),
    algorithm: algorithm.value
  })

  if (issuer.value) {
    params.set('issuer', issuer.value)
  }

  if (otpType.value === 'TOTP') {
    params.set('period', period.value.toString())
  } else {
    params.set('counter', hotpCounter.value.toString())
  }

  const label = accountName.value
    ? `${issuer.value}:${accountName.value}`
    : issuer.value || 'OTP'

  return `otpauth://${type}/${encodeURIComponent(label)}?${params.toString()}`
})

// Copy functions
function copyOTP(otp: string) {
  navigator.clipboard.writeText(otp.replace(/\s/g, ''))
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text)
}

// Start intervals for TOTP
function startTOTPInterval() {
  stopTOTPInterval()

  // Update OTP every second (for countdown)
  countdownInterval = setInterval(() => {
    const now = Math.floor(Date.now() / 1000)
    const remaining = period.value - (now % period.value)

    if (remaining !== otpTimeRemaining.value) {
      otpTimeRemaining.value = remaining
      if (remaining === period.value) {
        generateOTP()
      }
    }
  }, 1000)

  // Generate initial OTP
  generateOTP()
}

function stopTOTPInterval() {
  if (countdownInterval) {
    clearInterval(countdownInterval)
    countdownInterval = null
  }
}

// Watch for changes
watch([secretKey, otpType, digits, algorithm, period, hotpCounter], () => {
  generateOTP()
  if (otpType.value === 'TOTP') {
    startTOTPInterval()
  } else {
    stopTOTPInterval()
  }
})

// Lifecycle
onMounted(() => {
  generateSecret()
  startTOTPInterval()
})

onUnmounted(() => {
  stopTOTPInterval()
})
</script>
