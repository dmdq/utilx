<template>
  <div class="max-w-6xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">加密伪随机数生成器</h1>
      <p class="text-muted-foreground">使用Web Crypto API生成密码学安全的随机数，支持多种格式和长度，适用于密钥生成、令牌创建等场景</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：随机数生成 -->
      <div class="space-y-4">
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <RefreshCw class="w-5 h-5 text-primary" />
            生成随机数
          </h2>

          <div class="space-y-4">
            <!-- 随机数类型 -->
            <div>
              <label class="text-sm font-medium mb-2 block">随机数类型</label>
              <div class="grid grid-cols-3 gap-2">
                <button
                  @click="randomType = 'bytes'"
                  :class="['p-3 rounded-lg text-sm transition-colors', randomType === 'bytes' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']"
                >
                  随机字节
                  <span class="block text-xs opacity-75">原始二进制</span>
                </button>
                <button
                  @click="randomType = 'integer'"
                  :class="['p-3 rounded-lg text-sm transition-colors', randomType === 'integer' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']"
                >
                  随机整数
                  <span class="block text-xs opacity-75">指定范围</span>
                </button>
                <button
                  @click="randomType = 'password'"
                  :class="['p-3 rounded-lg text-sm transition-colors', randomType === 'password' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']"
                >
                  随机密码
                  <span class="block text-xs opacity-75">可定制字符</span>
                </button>
              </div>
            </div>

            <!-- 随机字节选项 -->
            <div v-if="randomType === 'bytes'">
              <label class="text-sm font-medium mb-2 block">字节长度</label>
              <div class="flex gap-2">
                <input
                  v-model.number="bytesLength"
                  type="number"
                  min="1"
                  max="4096"
                  class="flex-1 px-4 py-2 border border-border rounded-lg font-mono text-sm"
                >
                <select v-model="bytesFormat" class="px-4 py-2 border border-border rounded-lg text-sm">
                  <option value="hex">十六进制</option>
                  <option value="base64">Base64</option>
                  <option value="base64url">Base64URL</option>
                  <option value="binary">二进制字符串</option>
                </select>
              </div>
              <p class="text-xs text-muted-foreground mt-1">建议长度：16字节（128位）、32字节（256位）</p>
            </div>

            <!-- 随机整数选项 -->
            <div v-if="randomType === 'integer'">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="text-sm font-medium mb-2 block">最小值</label>
                  <input
                    v-model.number="minValue"
                    type="number"
                    class="w-full px-4 py-2 border border-border rounded-lg font-mono text-sm"
                  >
                </div>
                <div>
                  <label class="text-sm font-medium mb-2 block">最大值</label>
                  <input
                    v-model.number="maxValue"
                    type="number"
                    class="w-full px-4 py-2 border border-border rounded-lg font-mono text-sm"
                  >
                </div>
              </div>
              <p class="text-xs text-muted-foreground mt-1">生成范围：[最小值, 最大值)</p>
            </div>

            <!-- 随机密码选项 -->
            <div v-if="randomType === 'password'">
              <div class="grid grid-cols-2 gap-4 mb-2">
                <div>
                  <label class="text-sm font-medium mb-2 block">密码长度</label>
                  <input
                    v-model.number="passwordLength"
                    type="number"
                    min="4"
                    max="128"
                    class="w-full px-4 py-2 border border-border rounded-lg font-mono text-sm"
                  >
                </div>
              </div>

              <label class="text-sm font-medium mb-2 block">字符集</label>
              <div class="space-y-2">
                <label class="flex items-center gap-2 cursor-pointer p-2 border rounded hover:bg-muted/50">
                  <input type="checkbox" v-model="useUppercase" class="rounded">
                  <span class="text-sm">大写字母 (A-Z)</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer p-2 border rounded hover:bg-muted/50">
                  <input type="checkbox" v-model="useLowercase" class="rounded">
                  <span class="text-sm">小写字母 (a-z)</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer p-2 border rounded hover:bg-muted/50">
                  <input type="checkbox" v-model="useNumbers" class="rounded">
                  <span class="text-sm">数字 (0-9)</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer p-2 border rounded hover:bg-muted/50">
                  <input type="checkbox" v-model="useSymbols" class="rounded">
                  <span class="text-sm">特殊字符 (!@#$%^&*)</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer p-2 border rounded hover:bg-muted/50">
                  <input type="checkbox" v-model="excludeAmbiguous" class="rounded">
                  <span class="text-sm">排除易混淆字符 (0OIl1)</span>
                </label>
              </div>
            </div>

            <!-- 生成按钮 -->
            <button
              @click="generateRandom"
              class="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 text-sm"
            >
              <RefreshCw class="w-4 h-4 inline mr-2" />
              生成随机数
            </button>

            <!-- 生成结果 -->
            <div v-if="generatedResult" class="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4 border-2 border-primary/20">
              <div class="flex items-start justify-between gap-2">
                <div class="flex-1">
                  <p class="text-sm text-muted-foreground mb-2">生成结果</p>
                  <pre class="text-xs font-mono break-all whitespace-pre-wrap">{{ generatedResult }}</pre>
                </div>
                <button
                  @click="copyResult"
                  class="p-1 hover:bg-background rounded transition-colors"
                  title="复制结果"
                >
                  <Copy class="w-4 h-4" />
                </button>
              </div>
              <div class="mt-2 text-xs text-muted-foreground">
                <p>长度: {{ generatedResult.length }} 字符</p>
                <p v-if="randomType === 'bytes'">熵值: {{ bytesLength * 8 }} 位</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 批量生成 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <List class="w-5 h-5 text-purple-500" />
            批量生成
          </h2>

          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium mb-2 block">生成数量</label>
              <input
                v-model.number="batchCount"
                type="number"
                min="1"
                max="100"
                class="w-full px-4 py-2 border border-border rounded-lg font-mono text-sm"
              >
            </div>

            <button
              @click="generateBatch"
              :disabled="batchCount < 1"
              class="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 text-sm"
            >
              批量生成
            </button>

            <div v-if="batchResults.length > 0" class="space-y-2">
              <div class="flex items-center justify-between">
                <p class="text-sm font-medium">生成结果 ({{ batchResults.length }}条)</p>
                <button
                  @click="copyBatch"
                  class="text-xs text-primary hover:underline"
                >
                  复制全部
                </button>
              </div>
              <div class="max-h-64 overflow-y-auto space-y-1">
                <div
                  v-for="(result, index) in batchResults"
                  :key="index"
                  class="flex items-center gap-2 p-2 bg-muted rounded text-sm"
                >
                  <span class="text-muted-foreground text-xs w-6">{{ index + 1 }}.</span>
                  <code class="flex-1 text-xs font-mono truncate">{{ result }}</code>
                  <button
                    @click="copySingle(result)"
                    class="text-xs text-primary hover:underline"
                  >
                    复制
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：说明和工具 -->
      <div class="space-y-4">
        <!-- 快速预设 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <Zap class="w-5 h-5 text-yellow-500" />
            快速预设
          </h2>

          <div class="space-y-2">
            <button
              @click="applyPreset('api-key')"
              class="w-full p-3 border rounded-lg hover:bg-muted text-left"
            >
              <p class="font-medium text-sm">API密钥 (32字节)</p>
              <p class="text-xs text-muted-foreground">Base64URL编码，适合API密钥</p>
            </button>

            <button
              @click="applyPreset('session-token')"
              class="w-full p-3 border rounded-lg hover:bg-muted text-left"
            >
              <p class="font-medium text-sm">会话令牌 (24字节)</p>
              <p class="text-xs text-muted-foreground">十六进制，适合会话ID</p>
            </button>

            <button
              @click="applyPreset('password-strong')"
              class="w-full p-3 border rounded-lg hover:bg-muted text-left"
            >
              <p class="font-medium text-sm">强密码 (16字符)</p>
              <p class="text-xs text-muted-foreground">包含大小写字母、数字、符号</p>
            </button>

            <button
              @click="applyPreset('otp-secret')"
              class="w-full p-3 border rounded-lg hover:bg-muted text-left"
            >
              <p class="font-medium text-sm">OTP密钥 (20字节)</p>
              <p class="text-xs text-muted-foreground">Base32，适合2FA应用</p>
            </button>

            <button
              @click="applyPreset('uuid-v4')"
              class="w-full p-3 border rounded-lg hover:bg-muted text-left"
            >
              <p class="font-medium text-sm">UUID v4</p>
              <p class="text-xs text-muted-foreground">标准UUID格式</p>
            </button>
          </div>
        </div>

        <!-- 技术说明 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <BookOpen class="w-5 h-5 text-blue-500" />
            关于加密随机数
          </h2>

          <div class="space-y-3 text-sm text-muted-foreground">
            <div>
              <p class="font-medium text-foreground mb-1">什么是CSPRNG？</p>
              <p>密码学安全伪随机数生成器（CSPRNG）是一种随机数生成器，其输出具有密码学意义上的不可预测性。</p>
            </div>

            <div>
              <p class="font-medium text-foreground mb-1">Web Crypto API</p>
              <p>本工具使用浏览器的Web Crypto API，该API利用操作系统提供的安全随机源（如/dev/urandom、CryptGenRandom）。</p>
            </div>

            <div>
              <p class="font-medium text-foreground mb-1">与Math.random()的区别</p>
              <ul class="list-disc list-inside space-y-1 ml-2">
                <li><strong class="text-foreground">CSPRNG：</strong>密码学安全，不可预测</li>
                <li><strong class="text-foreground">Math.random()：</strong>不安全，可预测</li>
                <li>永远不要用Math.random()生成密钥或密码</li>
              </ul>
            </div>

            <div>
              <p class="font-medium text-foreground mb-1">应用场景</p>
              <ul class="list-disc list-inside space-y-1 ml-2">
                <li>API密钥和访问令牌</li>
                <li>会话ID和CSRF令牌</li>
                <li>密码重置令牌</li>
                <li>加密密钥和初始化向量(IV)</li>
                <li>盐值(Salt)生成</li>
                <li>一次性密码(OTP)</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- 格式说明 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileCode class="w-5 h-5 text-orange-500" />
            输出格式说明
          </h2>

          <div class="space-y-3 text-sm">
            <div class="p-3 bg-muted rounded">
              <p class="font-medium text-foreground">十六进制 (Hex)</p>
              <p class="text-xs text-muted-foreground mt-1">每字节2个字符，如: a1b2c3d4...</p>
              <p class="text-xs text-primary mt-1">长度 = 字节数 × 2</p>
            </div>

            <div class="p-3 bg-muted rounded">
              <p class="font-medium text-foreground">Base64</p>
              <p class="text-xs text-muted-foreground mt-1">标准Base64编码，包含+/=</p>
              <p class="text-xs text-primary mt-1">长度 ≈ 字节数 × 1.33</p>
            </div>

            <div class="p-3 bg-muted rounded">
              <p class="font-medium text-foreground">Base64URL</p>
              <p class="text-xs text-muted-foreground mt-1">URL安全版本，替换+/为-_</p>
              <p class="text-xs text-primary mt-1">适合URL和JSON</p>
            </div>

            <div class="p-3 bg-muted rounded">
              <p class="font-medium text-foreground">Base32</p>
              <p class="text-xs text-muted-foreground mt-1">使用A-Z和2-7，适合人工输入</p>
              <p class="text-xs text-primary mt-1">长度 ≈ 字节数 × 1.6</p>
            </div>
          </div>
        </div>

        <!-- 安全建议 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <Shield class="w-5 h-5 text-green-500" />
            安全建议
          </h2>

          <div class="space-y-2 text-sm text-muted-foreground">
            <div class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <p>密钥长度至少128位（16字节），推荐256位（32字节）</p>
            </div>
            <div class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <p>生成后立即保存到安全位置，不要通过网络传输</p>
            </div>
            <div class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <p>使用密码管理器存储生成的随机密码</p>
            </div>
            <div class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <p>定期轮换API密钥和访问令牌</p>
            </div>
            <div class="flex items-start gap-2">
              <CheckCircle class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <p>不要使用相同的随机值用于不同目的</p>
            </div>
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
  RefreshCw,
  Copy,
  List,
  Zap,
  BookOpen,
  FileCode,
  Shield,
  CheckCircle
} from 'lucide-vue-next'

const randomType = ref('bytes')
const bytesLength = ref(32)
const bytesFormat = ref('hex')
const minValue = ref(0)
const maxValue = ref(100)
const passwordLength = ref(16)
const useUppercase = ref(true)
const useLowercase = ref(true)
const useNumbers = ref(true)
const useSymbols = ref(true)
const excludeAmbiguous = ref(false)

const batchCount = ref(5)
const generatedResult = ref('')
const batchResults = ref([])

// Base32字符集（不含易混淆字符）
const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

// 生成随机数
async function generateRandom() {
  try {
    switch (randomType.value) {
      case 'bytes':
        await generateRandomBytes()
        break
      case 'integer':
        await generateRandomInteger()
        break
      case 'password':
        await generateRandomPassword()
        break
    }
  } catch (error) {
    console.error('Random generation error:', error)
    alert('生成失败：' + error.message)
  }
}

// 生成随机字节
async function generateRandomBytes() {
  const array = new Uint8Array(bytesLength.value)
  crypto.getRandomValues(array)

  switch (bytesFormat.value) {
    case 'hex':
      generatedResult.value = Array.from(array, b => b.toString(16).padStart(2, '0')).join('')
      break
    case 'base64':
      generatedResult.value = btoa(String.fromCharCode(...array))
      break
    case 'base64url':
      const base64 = btoa(String.fromCharCode(...array))
      generatedResult.value = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
      break
    case 'binary':
      generatedResult.value = String.fromCharCode(...array)
      break
  }
}

// 生成随机整数
async function generateRandomInteger() {
  const range = maxValue.value - minValue.value
  const bytesNeeded = Math.ceil(Math.log2(range) / 8)
  const cutoff = Math.floor(256 ** bytesNeeded / range) * range

  let value
  do {
    const array = new Uint8Array(bytesNeeded)
    crypto.getRandomValues(array)
    value = 0
    for (let i = 0; i < bytesNeeded; i++) {
      value = value * 256 + array[i]
    }
  } while (value >= cutoff)

  generatedResult.value = (minValue.value + (value % range)).toString()
}

// 生成随机密码
async function generateRandomPassword() {
  let charset = ''
  if (useUppercase.value) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  if (useLowercase.value) charset += 'abcdefghijklmnopqrstuvwxyz'
  if (useNumbers.value) charset += '0123456789'
  if (useSymbols.value) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?'

  if (excludeAmbiguous.value) {
    const ambiguous = '0OIl1'
    charset = charset.split('').filter(c => !ambiguous.includes(c)).join('')
  }

  if (charset.length === 0) {
    alert('请至少选择一种字符类型')
    return
  }

  const array = new Uint8Array(passwordLength.value)
  crypto.getRandomValues(array)

  generatedResult.value = Array.from(array, b => charset[b % charset.length]).join('')
}

// 批量生成
async function generateBatch() {
  batchResults.value = []
  for (let i = 0; i < Math.min(batchCount.value, 100); i++) {
    await generateRandom()
    batchResults.value.push(generatedResult.value)
  }
}

// 复制结果
function copyResult() {
  navigator.clipboard.writeText(generatedResult.value)
}

function copySingle(result) {
  navigator.clipboard.writeText(result)
}

function copyBatch() {
  navigator.clipboard.writeText(batchResults.value.join('\n'))
}

// 应用预设
async function applyPreset(preset) {
  switch (preset) {
    case 'api-key':
      randomType.value = 'bytes'
      bytesLength.value = 32
      bytesFormat.value = 'base64url'
      break
    case 'session-token':
      randomType.value = 'bytes'
      bytesLength.value = 24
      bytesFormat.value = 'hex'
      break
    case 'password-strong':
      randomType.value = 'password'
      passwordLength.value = 16
      useUppercase.value = true
      useLowercase.value = true
      useNumbers.value = true
      useSymbols.value = true
      excludeAmbiguous.value = true
      break
    case 'otp-secret':
      randomType.value = 'bytes'
      bytesLength.value = 20
      bytesFormat.value = 'base64url'
      break
    case 'uuid-v4':
      const array = new Uint8Array(16)
      crypto.getRandomValues(array)
      array[6] = (array[6] & 0x0f) | 0x40 // version 4
      array[8] = (array[8] & 0x3f) | 0x80 // variant
      const hex = Array.from(array, b => b.toString(16).padStart(2, '0')).join('')
      generatedResult.value = [
        hex.substring(0, 8),
        hex.substring(8, 12),
        hex.substring(12, 16),
        hex.substring(16, 20),
        hex.substring(20, 32)
      ].join('-')
      return
  }
  await generateRandom()
}

useSeoMeta({
  title: '加密伪随机数生成器 - 在线CSPRNG工具',
  description: '免费在线加密伪随机数生成器，使用Web Crypto API生成密码学安全的随机数，支持多种格式，适用于密钥生成、令牌创建。',
  keywords: ['随机数', 'csprng', '随机密码', 'api密钥', '随机生成', '加密安全', 'web crypto', '在线工具']
})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('加密伪随机数生成器')
</script>
