<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">OTP动态口令生成器 - 在线TOTP/HOTP双因素认证</h1>
      <p class="text-muted-foreground">生成TOTP/HOTP一次性密码，兼容Google Authenticator、Authy等验证器应用。纯本地计算，数据安全隐私。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 密钥配置 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-xl font-semibold text-foreground mb-4">密钥配置</h2>

        <div class="mb-4">
          <label class="block text-sm font-medium text-foreground mb-2">OTP类型</label>
          <div class="flex gap-2">
            <button
              @click="otpType = 'TOTP'"
              :class="['px-4 py-2 rounded-lg font-medium flex-1', otpType === 'TOTP' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground']"
            >
              TOTP (基于时间)
            </button>
            <button
              @click="otpType = 'HOTP'"
              :class="['px-4 py-2 rounded-lg font-medium flex-1', otpType === 'HOTP' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground']"
            >
              HOTP (基于计数)
            </button>
          </div>
        </div>

        <div class="mb-4">
          <label class="block text-sm font-medium text-foreground mb-2">密钥 (Secret Key)</label>
          <div class="flex gap-2">
            <input
              v-model="secretKey"
              type="text"
              class="flex-1 px-4 py-2 border border-border rounded-lg bg-muted text-foreground font-mono text-sm"
              placeholder="Base32编码的密钥"
            >
            <button
              @click="generateSecret"
              class="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
              title="生成新密钥"
            >
              生成
            </button>
          </div>
        </div>

        <div class="mb-4">
          <label class="block text-sm font-medium text-foreground mb-2">密码位数: {{ digits }} 位</label>
          <select v-model="digits" class="w-full px-4 py-2 border border-border rounded-lg bg-muted text-foreground">
            <option :value="6">6 位 (最常用)</option>
            <option :value="7">7 位</option>
            <option :value="8">8 位</option>
          </select>
        </div>

        <div v-if="otpType === 'TOTP'" class="mb-4">
          <label class="block text-sm font-medium text-foreground mb-2">时间步长: {{ period }} 秒</label>
          <input
            v-model.number="period"
            type="range"
            min="15"
            max="60"
            step="15"
            class="w-full"
          >
        </div>

        <div v-else class="mb-4">
          <label class="block text-sm font-medium text-foreground mb-2">计数器 (Counter)</label>
          <div class="flex gap-2 items-center">
            <input
              v-model.number="hotpCounter"
              type="number"
              min="0"
              class="flex-1 px-4 py-2 border border-border rounded-lg bg-muted text-foreground"
            >
            <button
              @click="hotpCounter++"
              class="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
            >
              +1
            </button>
          </div>
        </div>
      </div>

      <!-- 动态密码 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-xl font-semibold text-foreground mb-4">动态密码</h2>

        <div v-if="secretKey" class="space-y-4">
          <div class="text-center">
            <div class="mb-4">
              <div class="text-5xl font-mono font-bold tracking-wider text-foreground">
                {{ formatOTP(currentOTP) }}
              </div>
            </div>

            <div v-if="otpType === 'TOTP'" class="mb-4">
              <div class="flex items-center justify-center gap-2 mb-2">
                <Timer class="w-5 h-5 text-primary" />
                <span class="text-lg font-medium text-foreground">{{ otpTimeRemaining }} 秒后更新</span>
              </div>
              <div class="w-full bg-muted rounded-full h-3 overflow-hidden">
                <div
                  class="bg-primary h-full transition-all duration-1000 ease-linear"
                  :style="{ width: `${(otpTimeRemaining / period) * 100}%` }"
                ></div>
              </div>
            </div>

            <div class="flex gap-2 justify-center">
              <button
                @click="copyOTP(currentOTP)"
                class="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
              >
                复制密码
              </button>
              <button
                v-if="otpType === 'HOTP'"
                @click="hotpCounter++; generateOTP()"
                class="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
              >
                下一个
              </button>
            </div>
          </div>

          <!-- QR Code -->
          <div class="border-t border-border pt-4">
            <h3 class="font-medium text-foreground mb-3 text-center">添加到验证器应用</h3>
            <div class="flex justify-center mb-4">
              <div class="p-4 bg-card rounded-lg inline-block">
                <canvas ref="qrCanvas" class="w-48 h-48"></canvas>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-foreground mb-2">OTP URI</label>
              <div class="relative">
                <pre class="bg-muted p-3 rounded-lg text-xs font-mono break-all whitespace-pre-wrap text-foreground">{{ otpUri }}</pre>
                <button
                  @click="copyToClipboard(otpUri)"
                  class="absolute top-2 right-2 p-1 bg-muted hover:bg-accent rounded"
                  title="复制URI"
                >
                  <Copy class="w-3 h-3 text-foreground" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-12 text-muted-foreground">
          <Clock class="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>生成或输入密钥后显示动态密码</p>
        </div>
      </div>
    </div>

    <!-- SEO 内容长尾区 -->
    <div class="p-6 mb-12 relative">
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        :title="isSeoContentVisible ? '折叠内容' : '展开内容'"
      >
        <HelpCircle v-if="!isSeoContentVisible" class="w-5 h-5" />
        <ChevronUp v-else class="w-5 h-5" />
      </button>

      <div v-show="isSeoContentVisible">
        <h2 class="text-2xl font-bold text-foreground mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          什么是OTP动态口令？
        </h2>
        <p class="text-muted-foreground mb-4">
          OTP（One-Time Password）是一次性密码，每次使用后都会变化。TOTP基于时间生成密码，通常每30秒变化一次；HOTP基于计数器生成密码，每次使用后计数器增加。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>生成一个新的密钥，或从服务获取现有密钥</li>
          <li>使用验证器应用扫描二维码或手动输入密钥</li>
          <li>应用将开始生成动态密码</li>
          <li>在登录时输入当前显示的数字</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          安全提示
        </h2>
        <ul class="text-sm text-muted-foreground space-y-1">
          <li>密钥必须妥善保管，泄露后任何人都能生成你的OTP</li>
          <li>建议将密钥保存在安全的地方，以备设备丢失时恢复</li>
          <li>不要截屏分享包含密钥的二维码</li>
        </ul>
      </div>
    </div>

    <!-- 相关推荐区 -->
    <section class="mb-12">
      <h2 class="text-2xl font-bold text-foreground mb-4">您可能还需要...</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <NuxtLink
          v-for="relatedTool in relatedTools"
          :key="relatedTool.id"
          :to="`/tools/${relatedTool.id}`"
          class="block p-4 bg-card border border-border rounded-lg hover:bg-accent transition-colors"
        >
          <div class="flex items-center gap-2 mb-2">
            <component
              :is="iconMap[relatedTool.icon]"
              class="w-5 h-5 text-primary"
            />
            <span class="font-medium text-foreground">{{ relatedTool.name }}</span>
          </div>
          <p class="text-sm text-muted-foreground line-clamp-2">{{ relatedTool.description }}</p>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick, watchEffect } from 'vue'
import { HelpCircle, ChevronUp, Timer, Clock, Copy, Hash, Shield, FileSignature } from 'lucide-vue-next'
import QRCode from 'qrcode'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'

// SEO配置
useSeoMeta({
  title: 'OTP动态口令生成器 - 在线TOTP/HOTP双因素认证 | Util工具箱',
  description: '在线OTP动态口令生成器，支持TOTP和HOTP算法。兼容Google Authenticator、Authy、Microsoft Authenticator等验证器应用，纯本地计算。',
  keywords: 'OTP,TOTP,HOTP,动态口令,双因素认证,2FA,Google Authenticator,验证器,在线OTP生成',
  author: 'Util工具箱',
  ogTitle: 'OTP动态口令生成器 - TOTP/HOTP',
  ogDescription: '生成TOTP/HOTP一次性密码，兼容主流验证器应用',
  ogType: 'website'
})

// JSON-LD
useHead({
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'OTP动态口令生成器',
        description: '在线TOTP/HOTP双因素认证工具',
        url: 'https://www.util.cn/tools/otp-generator',
        applicationCategory: 'SecurityApplication',
        operatingSystem: 'Any'
      })
    }
  ]
})

const tool = tools.find(t => t.id === 'otp-generator')
const isSeoContentVisible = ref(true)

const otpType = ref('TOTP')
const secretKey = ref('')
const digits = ref(6)
const algorithm = ref('SHA1')
const period = ref(30)
const hotpCounter = ref(0)
const issuer = ref('MyService')
const accountName = ref('user@example.com')

const currentOTP = ref('')
const otpTimeRemaining = ref(30)
const qrCanvas = ref(null)

let countdownInterval = null

const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

function base32Encode(buffer) {
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

function base32Decode(input) {
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

function generateSecret() {
  const secretBytes = new Uint8Array(20)
  crypto.getRandomValues(secretBytes)
  secretKey.value = base32Encode(secretBytes)
  generateOTP()
}

async function calculateTOTP(secret, time) {
  try {
    const secretBytes = base32Decode(secret)
    const timeBuffer = new ArrayBuffer(8)
    const timeView = new DataView(timeBuffer)
    timeView.setUint32(4, Math.floor(time / period.value), false)

    const hashAlgorithm = algorithm.value === 'SHA1' ? 'SHA-1' : algorithm.value === 'SHA256' ? 'SHA-256' : 'SHA-512'

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      secretBytes,
      { name: 'HMAC', hash: hashAlgorithm },
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

async function calculateHOTP(secret, counter) {
  try {
    const secretBytes = base32Decode(secret)
    const counterBuffer = new ArrayBuffer(8)
    const counterView = new DataView(counterBuffer)
    counterView.setUint32(4, counter, false)

    const hashAlgorithm = algorithm.value === 'SHA1' ? 'SHA-1' : algorithm.value === 'SHA256' ? 'SHA-256' : 'SHA-512'

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      secretBytes,
      { name: 'HMAC', hash: hashAlgorithm },
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

function formatOTP(otp) {
  const mid = Math.floor(otp.length / 2)
  return otp.slice(0, mid) + ' ' + otp.slice(mid)
}

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

function copyOTP(otp) {
  navigator.clipboard.writeText(otp.replace(/\s/g, ''))
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text)
}

function startTOTPInterval() {
  stopTOTPInterval()

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

  generateOTP()
}

function stopTOTPInterval() {
  if (countdownInterval) {
    clearInterval(countdownInterval)
    countdownInterval = null
  }
}

watch([secretKey, otpType, digits, algorithm, period, hotpCounter], () => {
  generateOTP()
  if (otpType.value === 'TOTP') {
    startTOTPInterval()
  } else {
    stopTOTPInterval()
  }
})

watchEffect(async () => {
  if (otpUri.value && qrCanvas.value) {
    try {
      await QRCode.toCanvas(qrCanvas.value, otpUri.value, {
        width: 192,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
    } catch (error) {
      console.error('QR Code generation error:', error)
    }
  }
})

const iconMap = {
  Hash: computed(() => Hash),
  Shield: computed(() => Shield),
  FileSignature: computed(() => FileSignature)
}

const relatedTools = computed(() => {
  const recommended = [
    tools.find(t => t.id === 'uuid-generator'),
    tools.find(t => t.id === 'password-generator'),
    tools.find(t => t.id === 'hmac-generator'),
    tools.find(t => t.id === 'base-encoding')
  ].filter(Boolean)

  return recommended.slice(0, 4)
})

function toggleSeoContent() {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

onMounted(() => {
  generateSecret()
  startTOTPInterval()
  if (tool) {
    addRecentTool(tool.id)
  }
})

onUnmounted(() => {
  stopTOTPInterval()
})
</script>
