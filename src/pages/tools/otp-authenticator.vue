<template>
  <div class="max-w-6xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">OTP认证器</h1>
      <p class="text-muted-foreground">生成和验证TOTP/HOTP一次性密码，支持Google Authenticator等认证器应用</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：TOTP生成 -->
      <div class="space-y-4">
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock class="w-5 h-5 text-primary" />
            TOTP生成器 (基于时间)
          </h2>

          <div class="space-y-4">
            <!-- 密钥输入 -->
            <div>
              <label class="text-sm font-medium mb-2 block">密钥 (Secret Key)</label>
              <div class="relative">
                <input
                  v-model="totpSecret"
                  :type="showTotpSecret ? 'text' : 'password'"
                  class="w-full px-4 py-3 border border-border rounded-lg pr-20 font-mono text-sm"
                  placeholder="输入Base32格式的密钥..."
                >
                <div class="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                  <button
                    @click="showTotpSecret = !showTotpSecret"
                    class="p-1 text-muted-foreground hover:text-foreground"
                  >
                    <Eye v-if="!showTotpSecret" class="w-4 h-4" />
                    <EyeOff v-else class="w-4 h-4" />
                  </button>
                  <button
                    @click="generateTotpSecret"
                    class="p-1 text-muted-foreground hover:text-foreground"
                    title="生成随机密钥"
                  >
                    <RefreshCw class="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p class="text-xs text-muted-foreground mt-1">Base32格式，通常由服务提供</p>
            </div>

            <!-- 算法和位数 -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-sm font-medium mb-2 block">哈希算法</label>
                <select v-model="totpAlgorithm" class="w-full px-4 py-2 border border-border rounded-lg text-sm">
                  <option value="SHA1">SHA1</option>
                  <option value="SHA256">SHA256</option>
                  <option value="SHA512">SHA512</option>
                </select>
              </div>
              <div>
                <label class="text-sm font-medium mb-2 block">数字位数</label>
                <select v-model="totpDigits" class="w-full px-4 py-2 border border-border rounded-lg text-sm">
                  <option :value="6">6位数字</option>
                  <option :value="8">8位数字</option>
                </select>
              </div>
            </div>

            <!-- 时间步长 -->
            <div>
              <label class="text-sm font-medium mb-2 block">时间步长 (秒)</label>
              <select v-model="totpPeriod" class="w-full px-4 py-2 border border-border rounded-lg text-sm">
                <option :value="30">30秒 (标准)</option>
                <option :value="60">60秒</option>
              </select>
            </div>

            <!-- TOTP结果 -->
            <div v-if="totpCode" class="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6 border-2 border-primary/20">
              <div class="text-center">
                <p class="text-sm text-muted-foreground mb-2">当前TOTP代码</p>
                <div class="flex items-center justify-center gap-3 mb-3">
                  <code class="text-4xl font-mono font-bold tracking-widest">{{ formatTotpCode(totpCode) }}</code>
                  <button
                    @click="copyTotp"
                    class="p-2 hover:bg-primary/20 rounded-lg transition-colors"
                    title="复制代码"
                  >
                    <Copy class="w-5 h-5 text-primary" />
                  </button>
                </div>
                <div class="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                  <div class="flex items-center gap-2">
                    <Timer class="w-4 h-4" />
                    <span>剩余: {{ totpRemaining }}秒</span>
                  </div>
                  <div class="w-px h-4 bg-border"></div>
                  <div>{{ totpAlgorithm }}</div>
                </div>
                <!-- 倒计时进度条 -->
                <div class="mt-3">
                  <div class="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      class="bg-primary h-2 rounded-full transition-all duration-1000"
                      :style="{ width: (totpRemaining / totpPeriod * 100) + '%' }"
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- TOTP说明 -->
            <div class="bg-muted p-3 rounded-lg text-xs space-y-1">
              <p class="font-medium text-foreground mb-1">使用说明</p>
              <ul class="list-disc list-inside space-y-1 text-muted-foreground">
                <li>在网站启用两步验证时获取密钥</li>
                <li>将密钥输入Google Authenticator等应用</li>
                <li>应用会生成与这里相同的代码</li>
                <li>代码每{{ totpPeriod }}秒变化一次</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- QR码生成 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <QrCode class="w-5 h-5 text-purple-500" />
            QR码生成
          </h2>

          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium mb-2 block">服务名称</label>
              <input
                v-model="qrService"
                class="w-full px-4 py-2 border border-border rounded-lg text-sm"
                placeholder="例如: Google, GitHub, Amazon..."
              >
            </div>

            <div>
              <label class="text-sm font-medium mb-2 block">账户名称</label>
              <input
                v-model="qrAccount"
                class="w-full px-4 py-2 border border-border rounded-lg text-sm"
                placeholder="例如: user@example.com"
              >
            </div>

            <div>
              <label class="text-sm font-medium mb-2 block">密钥</label>
              <input
                v-model="totpSecret"
                class="w-full px-4 py-2 border border-border rounded-lg font-mono text-sm"
                placeholder="输入或生成密钥..."
              >
            </div>

            <button
              @click="generateQR"
              :disabled="!qrService || !qrAccount || !totpSecret"
              class="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 text-sm"
            >
              <QrCode class="w-4 h-4 inline mr-2" />
              生成QR码
            </button>

            <div v-if="qrCodeUrl" class="text-center space-y-3">
              <img :src="qrCodeUrl" alt="TOTP QR Code" class="mx-auto w-48 h-48 rounded-lg border">
              <p class="text-xs text-muted-foreground">使用认证器应用扫描此QR码</p>
              <div class="bg-muted p-2 rounded text-xs font-mono break-all">{{ otpAuthUrl }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：验证和说明 -->
      <div class="space-y-4">
        <!-- OTP验证 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <CheckCircle class="w-5 h-5 text-green-500" />
            验证OTP代码
          </h2>

          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium mb-2 block">密钥</label>
              <input
                v-model="verifySecret"
                type="password"
                class="w-full px-4 py-3 border border-border rounded-lg font-mono text-sm"
                placeholder="输入用于验证的密钥..."
              >
            </div>

            <div>
              <label class="text-sm font-medium mb-2 block">OTP代码</label>
              <input
                v-model="verifyCode"
                type="text"
                maxlength="8"
                class="w-full px-4 py-3 border border-border rounded-lg font-mono text-center text-xl tracking-widest"
                placeholder="输入6或8位代码"
              >
            </div>

            <button
              @click="verifyOtpCode"
              :disabled="!verifySecret || !verifyCode"
              class="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 text-sm"
            >
              验证代码
            </button>

            <!-- 验证结果 -->
            <div v-if="verifyResult !== null" class="p-4 rounded-lg text-center" :class="verifyResult ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'">
              <div class="flex items-center justify-center gap-2">
                <CheckCircle v-if="verifyResult" class="w-6 h-6 text-green-500" />
                <XCircle v-else class="w-6 h-6 text-red-500" />
                <span class="font-medium text-lg" :class="verifyResult ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'">
                  {{ verifyResult ? '验证成功 ✓' : '验证失败 ✗' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- HOTP生成器 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <Hash class="w-5 h-5 text-orange-500" />
            HOTP生成器 (基于计数器)
          </h2>

          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium mb-2 block">密钥</label>
              <div class="relative">
                <input
                  v-model="hotpSecret"
                  :type="showHotpSecret ? 'text' : 'password'"
                  class="w-full px-4 py-3 border border-border rounded-lg pr-10 font-mono text-sm"
                  placeholder="输入Base32格式密钥..."
                >
                <button
                  @click="showHotpSecret = !showHotpSecret"
                  class="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                >
                  <Eye v-if="!showHotpSecret" class="w-4 h-4" />
                  <EyeOff v-else class="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label class="text-sm font-medium mb-2 block">计数器 (Counter)</label>
              <div class="flex gap-2">
                <input
                  v-model.number="hotpCounter"
                  type="number"
                  min="0"
                  class="flex-1 px-4 py-2 border border-border rounded-lg font-mono text-sm"
                >
                <button
                  @click="hotpCounter++"
                  class="px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm"
                >
                  +1
                </button>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-sm font-medium mb-2 block">算法</label>
                <select v-model="hotpAlgorithm" class="w-full px-4 py-2 border border-border rounded-lg text-sm">
                  <option value="SHA1">SHA1</option>
                  <option value="SHA256">SHA256</option>
                  <option value="SHA512">SHA512</option>
                </select>
              </div>
              <div>
                <label class="text-sm font-medium mb-2 block">位数</label>
                <select v-model="hotpDigits" class="w-full px-4 py-2 border border-border rounded-lg text-sm">
                  <option :value="6">6位</option>
                  <option :value="8">8位</option>
                </select>
              </div>
            </div>

            <button
              @click="generateHotp"
              :disabled="!hotpSecret"
              class="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 text-sm"
            >
              <Hash class="w-4 h-4 inline mr-2" />
              生成HOTP代码
            </button>

            <div v-if="hotpCode" class="bg-muted p-4 rounded-lg text-center">
              <p class="text-xs text-muted-foreground mb-1">计数器 {{ hotpCounter }}</p>
              <code class="text-3xl font-mono font-bold tracking-widest">{{ formatTotpCode(hotpCode) }}</code>
            </div>
          </div>
        </div>

        <!-- 使用说明 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <BookOpen class="w-5 h-5 text-blue-500" />
            关于OTP
          </h2>

          <div class="space-y-3 text-sm text-muted-foreground">
            <div>
              <p class="font-medium text-foreground mb-1">什么是OTP？</p>
              <p>OTP（One-Time Password）是一次性密码，每次使用后都会变化，提供额外的安全层。</p>
            </div>

            <div>
              <p class="font-medium text-foreground mb-1">TOTP vs HOTP</p>
              <ul class="list-disc list-inside space-y-1 ml-2">
                <li><strong class="text-foreground">TOTP：</strong>基于时间，每30/60秒变化</li>
                <li><strong class="text-foreground">HOTP：</strong>基于计数器，每次使用后递增</li>
                <li>TOTP更常用，HOTP适合离线场景</li>
              </ul>
            </div>

            <div>
              <p class="font-medium text-foreground mb-1">支持的认证器应用</p>
              <ul class="list-disc list-inside space-y-1 ml-2">
                <li>Google Authenticator</li>
                <li>Authy</li>
                <li>Microsoft Authenticator</li>
                <li>1Password</li>
                <li>Bitwarden</li>
                <li>YubiKey</li>
              </ul>
            </div>

            <div>
              <p class="font-medium text-foreground mb-1">安全建议</p>
              <ul class="list-disc list-inside space-y-1 ml-2">
                <li>妥善保管密钥，不要分享给他人</li>
                <li>密钥丢失后无法找回</li>
                <li>建议保存备份码</li>
                <li>使用硬件密钥获得更高安全性</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useSeoMeta } from '#app'
import {
  Clock,
  Eye,
  EyeOff,
  RefreshCw,
  Copy,
  CheckCircle,
  XCircle,
  QrCode,
  Hash,
  BookOpen,
  Timer
} from 'lucide-vue-next'

// TOTP相关
const totpSecret = ref('')
const showTotpSecret = ref(false)
const totpAlgorithm = ref('SHA1')
const totpDigits = ref(6)
const totpPeriod = ref(30)
const totpCode = ref('')
const totpRemaining = ref(30)
let totpTimer = null

// QR码相关
const qrService = ref('MyService')
const qrAccount = ref('user@example.com')
const qrCodeUrl = ref('')
const otpAuthUrl = ref('')

// 验证相关
const verifySecret = ref('')
const verifyCode = ref('')
const verifyResult = ref(null)

// HOTP相关
const hotpSecret = ref('')
const showHotpSecret = ref(false)
const hotpCounter = ref(0)
const hotpAlgorithm = ref('SHA1')
const hotpDigits = ref(6)
const hotpCode = ref('')

// Base32字符集
const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

// 生成随机密钥
function generateTotpSecret() {
  const bytes = new Uint8Array(20) // 160 bits
  crypto.getRandomValues(bytes)
  totpSecret.value = base32Encode(bytes)
  generateTotp()
}

// Base32编码
function base32Encode(bytes) {
  let bits = 0
  let value = 0
  let output = ''

  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i]
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

// Base32解码
function base32Decode(str) {
  let bits = 0
  let value = 0
  let output = new Uint8Array((str.length * 5 / 8) | 0)
  let index = 0

  for (let i = 0; i < str.length; i++) {
    const char = str.charAt(i).toUpperCase()
    const val = BASE32_CHARS.indexOf(char)

    if (val === -1) continue

    value = (value << 5) | val
    bits += 5

    if (bits >= 8) {
      output[index++] = (value >>> (bits - 8)) & 255
      bits -= 8
    }
  }

  return output
}

// HMAC-SHA1/256/512
async function hmacSha(key, message, algorithm = 'SHA-1') {
  const encoder = new TextEncoder()
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: { name: algorithm } },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message))
  return new Uint8Array(signature)
}

// 生成TOTP
async function generateTotp() {
  if (!totpSecret.value) return

  try {
    const key = base32Decode(totpSecret.value)
    const time = Math.floor(Date.now() / 1000 / totpPeriod.value)
    const timeBytes = new ArrayBuffer(8)
    const view = new DataView(timeBytes)
    view.setUint32(4, time, false)
    view.setUint32(0, 0, false)

    const hmac = await hmacSha(
      key,
      new Uint8Array(timeBytes),
      totpAlgorithm.value
    )

    const offset = hmac[hmac.length - 1] & 0x0f
    const code = (
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff)
    ) % Math.pow(10, totpDigits.value)

    totpCode.value = code.toString().padStart(totpDigits.value, '0')
  } catch (error) {
    console.error('TOTP generation error:', error)
  }
}

// 更新倒计时
function updateTotpRemaining() {
  const now = Math.floor(Date.now() / 1000)
  totpRemaining.value = totpPeriod.value - (now % totpPeriod.value)
}

// 格式化TOTP代码显示
function formatTotpCode(code) {
  if (code.length === 6) {
    return code.slice(0, 3) + ' ' + code.slice(3)
  }
  return code
}

// 复制TOTP
function copyTotp() {
  navigator.clipboard.writeText(totpCode.value)
}

// 生成QR码
async function generateQR() {
  if (!qrService.value || !qrAccount.value || !totpSecret.value) return

  const issuer = encodeURIComponent(qrService.value)
  const account = encodeURIComponent(qrAccount.value)
  const secret = encodeURIComponent(totpSecret.value)
  const algorithm = totpAlgorithm.value.replace('-', '').toLowerCase()
  const digits = totpDigits.value
  const period = totpPeriod.value

  otpAuthUrl.value = `otpauth://totp/${issuer}:${account}?secret=${secret}&issuer=${issuer}&algorithm=${algorithm}&digits=${digits}&period=${period}`

  // 使用公共API生成QR码
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpAuthUrl.value)}`
  qrCodeUrl.value = qrApiUrl
}

// 验证OTP
async function verifyOtpCode() {
  if (!verifySecret.value || !verifyCode.value) return

  try {
    const key = base32Decode(verifySecret.value)
    const time = Math.floor(Date.now() / 1000 / 30)
    const timeBytes = new ArrayBuffer(8)
    const view = new DataView(timeBytes)
    view.setUint32(4, time, false)
    view.setUint32(0, 0, false)

    const hmac = await hmacSha(key, new Uint8Array(timeBytes))
    const offset = hmac[hmac.length - 1] & 0x0f
    const code = (
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff)
    ) % Math.pow(10, 6)

    const expectedCode = code.toString().padStart(6, '0')
    verifyResult.value = expectedCode === verifyCode.value

    // 检查前后一个时间窗口
    if (!verifyResult.value) {
      for (let offset of [-1, 1]) {
        const adjustedTime = time + offset
        view.setUint32(4, adjustedTime, false)
        const adjustedHmac = await hmacSha(key, new Uint8Array(timeBytes))
        const adjustedOffset = adjustedHmac[adjustedHmac.length - 1] & 0x0f
        const adjustedCode = (
          ((adjustedHmac[adjustedOffset] & 0x7f) << 24) |
          ((adjustedHmac[adjustedOffset + 1] & 0xff) << 16) |
          ((adjustedHmac[adjustedOffset + 2] & 0xff) << 8) |
          (adjustedHmac[adjustedOffset + 3] & 0xff)
        ) % Math.pow(10, 6)
        const adjustedExpectedCode = adjustedCode.toString().padStart(6, '0')
        if (adjustedExpectedCode === verifyCode.value) {
          verifyResult.value = true
          break
        }
      }
    }
  } catch (error) {
    console.error('OTP verification error:', error)
    verifyResult.value = false
  }
}

// 生成HOTP
async function generateHotp() {
  if (!hotpSecret.value) return

  try {
    const key = base32Decode(hotpSecret.value)
    const counterBytes = new ArrayBuffer(8)
    const view = new DataView(counterBytes)
    view.setUint32(4, hotpCounter.value, false)
    view.setUint32(0, 0, false)

    const hmac = await hmacSha(
      key,
      new Uint8Array(counterBytes),
      hotpAlgorithm.value
    )

    const offset = hmac[hmac.length - 1] & 0x0f
    const code = (
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff)
    ) % Math.pow(10, hotpDigits.value)

    hotpCode.value = code.toString().padStart(hotpDigits.value, '0')
  } catch (error) {
    console.error('HOTP generation error:', error)
  }
}

// 启动TOTP定时器
function startTotpTimer() {
  totpTimer = setInterval(() => {
    updateTotpRemaining()
    if (totpRemaining.value === totpPeriod.value) {
      generateTotp()
    }
  }, 1000)
}

// 监听设置变化
watch([totpSecret, totpAlgorithm, totpDigits, totpPeriod], () => {
  generateTotp()
})

onMounted(() => {
  generateTotpSecret()
  startTotpTimer()
})

onUnmounted(() => {
  if (totpTimer) {
    clearInterval(totpTimer)
  }
})

useSeoMeta({
  title: 'OTP认证器 - 在线TOTP/HOTP生成器',
  description: '免费在线OTP认证器，生成和验证TOTP/HOTP一次性密码，支持Google Authenticator，生成QR码。',
  keywords: ['otp', 'totp', 'hotp', '两步验证', '2fa', 'google authenticator', '一次性密码', '认证器', '在线工具']
})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('OTP认证器')
</script>
