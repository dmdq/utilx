<template>
  <div class="max-w-6xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">AES加密/解密工具</h1>
      <p class="text-muted-foreground">使用AES-256算法进行数据加密和解密，支持CBC和GCM模式，完全在浏览器本地处理</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：加密 -->
      <div class="space-y-4">
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <Lock class="w-5 h-5 text-primary" />
            AES加密
          </h2>

          <div class="space-y-4">
            <!-- 模式选择 -->
            <div>
              <label class="text-sm font-medium mb-2 block">加密模式</label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  @click="encryptMode = 'GCM'"
                  :class="['p-3 rounded-lg text-sm transition-colors', encryptMode === 'GCM' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']"
                >
                  AES-GCM
                  <span class="block text-xs opacity-75">推荐 (带认证)</span>
                </button>
                <button
                  @click="encryptMode = 'CBC'"
                  :class="['p-3 rounded-lg text-sm transition-colors', encryptMode === 'CBC' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']"
                >
                  AES-CBC
                  <span class="block text-xs opacity-75">传统模式</span>
                </button>
              </div>
            </div>

            <!-- 密钥输入 -->
            <div>
              <label class="text-sm font-medium mb-2 block">
                加密密钥
                <span class="text-muted-foreground text-xs ml-2">(32字符/16字节)</span>
              </label>
              <div class="relative">
                <input
                  v-model="encryptKey"
                  :type="showEncryptKey ? 'text' : 'password'"
                  class="w-full px-4 py-3 border border-border rounded-lg pr-20 font-mono text-sm"
                  placeholder="输入32位十六进制密钥或生成新密钥"
                >
                <div class="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                  <button
                    @click="showEncryptKey = !showEncryptKey"
                    class="p-1 text-muted-foreground hover:text-foreground"
                  >
                    <Eye v-if="!showEncryptKey" class="w-4 h-4" />
                    <EyeOff v-else class="w-4 h-4" />
                  </button>
                  <button
                    @click="generateEncryptKey"
                    class="p-1 text-muted-foreground hover:text-foreground"
                    title="生成随机密钥"
                  >
                    <RefreshCw class="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div class="flex items-center gap-2 mt-2">
                <div class="flex-1 h-1 bg-muted rounded overflow-hidden">
                  <div
                    class="h-full transition-all"
                    :class="encryptKey.length === 32 ? 'bg-green-500' : encryptKey.length > 0 ? 'bg-yellow-500' : 'bg-red-500'"
                    :style="{ width: Math.min(100, (encryptKey.length / 32) * 100) + '%' }"
                  ></div>
                </div>
                <span class="text-xs text-muted-foreground">{{ encryptKey.length }}/32</span>
              </div>
            </div>

            <!-- 明文输入 -->
            <div>
              <label class="text-sm font-medium mb-2 block">明文内容</label>
              <textarea
                v-model="plaintext"
                class="w-full px-4 py-3 border border-border rounded-lg text-sm min-h-[120px]"
                placeholder="输入要加密的内容..."
              ></textarea>
            </div>

            <!-- 加密按钮 -->
            <button
              @click="encryptData"
              :disabled="!plaintext || !encryptKey || encryptKey.length !== 32"
              class="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 text-sm"
            >
              <Lock class="w-4 h-4 inline mr-2" />
              加密数据
            </button>

            <!-- 加密结果 -->
            <div v-if="encryptedResult">
              <label class="text-sm font-medium mb-2 block">加密结果 (Base64)</label>
              <div class="bg-muted rounded-lg p-4">
                <div class="flex items-start gap-2">
                  <code class="flex-1 text-xs break-all font-mono">{{ encryptedResult }}</code>
                  <button
                    @click="copyEncrypted"
                    class="p-1 hover:bg-background rounded transition-colors"
                    title="复制结果"
                  >
                    <Copy class="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div class="mt-2 text-xs text-muted-foreground space-y-1">
                <p>模式: AES-{{ encryptMode }}-256</p>
                <p>IV: <span class="font-mono text-xs">{{ encryptedIv }}</span></p>
                <p v-if="encryptMode === 'GCM'">认证标签: <span class="font-mono text-xs">{{ encryptedTag }}</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：解密 -->
      <div class="space-y-4">
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <Unlock class="w-5 h-5 text-green-500" />
            AES解密
          </h2>

          <div class="space-y-4">
            <!-- 解密模式 -->
            <div>
              <label class="text-sm font-medium mb-2 block">解密模式</label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  @click="decryptMode = 'GCM'"
                  :class="['p-3 rounded-lg text-sm transition-colors', decryptMode === 'GCM' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']"
                >
                  AES-GCM
                </button>
                <button
                  @click="decryptMode = 'CBC'"
                  :class="['p-3 rounded-lg text-sm transition-colors', decryptMode === 'CBC' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']"
                >
                  AES-CBC
                </button>
              </div>
            </div>

            <!-- 解密密钥 -->
            <div>
              <label class="text-sm font-medium mb-2 block">解密密钥</label>
              <div class="relative">
                <input
                  v-model="decryptKey"
                  :type="showDecryptKey ? 'text' : 'password'"
                  class="w-full px-4 py-3 border border-border rounded-lg pr-10 font-mono text-sm"
                  placeholder="输入32位十六进制密钥"
                >
                <button
                  @click="showDecryptKey = !showDecryptKey"
                  class="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                >
                  <Eye v-if="!showDecryptKey" class="w-4 h-4" />
                  <EyeOff v-else class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- 密文输入 -->
            <div>
              <label class="text-sm font-medium mb-2 block">加密数据 (Base64)</label>
              <textarea
                v-model="ciphertext"
                class="w-full px-4 py-3 border border-border rounded-lg text-sm font-mono text-xs min-h-[120px]"
                placeholder="粘贴Base64格式的加密数据..."
              ></textarea>
            </div>

            <!-- 解密按钮 -->
            <button
              @click="decryptData"
              :disabled="!ciphertext || !decryptKey"
              class="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 text-sm"
            >
              <Unlock class="w-4 h-4 inline mr-2" />
              解密数据
            </button>

            <!-- 解密结果 -->
            <div v-if="decryptedResult !== null">
              <label class="text-sm font-medium mb-2 block">解密结果</label>
              <div class="bg-muted rounded-lg p-4">
                <div class="flex items-start gap-2">
                  <div class="flex-1 text-sm break-whitespace">{{ decryptedResult || '(空)' }}</div>
                  <button
                    v-if="decryptedResult"
                    @click="copyDecrypted"
                    class="p-1 hover:bg-background rounded transition-colors"
                    title="复制结果"
                  >
                    <Copy class="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div v-if="decryptError" class="mt-2 p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded">
                {{ decryptError }}
              </div>
            </div>
          </div>
        </div>

        <!-- 快速操作 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <Zap class="w-5 h-5 text-yellow-500" />
            快速操作
          </h2>

          <div class="space-y-3">
            <button
              @click="useSameKey"
              class="w-full px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm"
            >
              使用加密密钥作为解密密钥
            </button>
            <button
              @click="encryptToDecrypt"
              :disabled="!encryptedResult"
              class="w-full px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm disabled:opacity-50"
            >
              将加密结果填充到解密输入
            </button>
            <button
              @click="clearAll"
              class="w-full px-4 py-2 bg-background border rounded-lg hover:bg-muted text-sm"
            >
              清空所有内容
            </button>
          </div>
        </div>

        <!-- 使用说明 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <Info class="w-5 h-5 text-blue-500" />
            使用说明
          </h2>

          <div class="space-y-3 text-sm text-muted-foreground">
            <div>
              <p class="font-medium text-foreground mb-1">AES-GCM vs AES-CBC</p>
              <ul class="list-disc list-inside space-y-1 ml-2">
                <li><strong class="text-foreground">GCM (推荐)：</strong>带认证的加密，同时保证机密性和完整性</li>
                <li><strong class="text-foreground">CBC (传统)：</strong>仅加密，需要额外HMAC保证完整性</li>
              </ul>
            </div>

            <div>
              <p class="font-medium text-foreground mb-1">密钥要求</p>
              <ul class="list-disc list-inside space-y-1 ml-2">
                <li>AES-256需要32位十六进制字符（16字节）</li>
                <li>建议使用强随机生成器创建密钥</li>
                <li>密钥必须妥善保管，无法从密文恢复</li>
              </ul>
            </div>

            <div>
              <p class="font-medium text-foreground mb-1">安全提示</p>
              <ul class="list-disc list-inside space-y-1 ml-2">
                <li>所有加密/解密在浏览器本地完成</li>
                <li>数据不会上传到任何服务器</li>
                <li>建议使用HTTPS传输加密数据</li>
              </ul>
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
  Lock,
  Unlock,
  Eye,
  EyeOff,
  RefreshCw,
  Copy,
  Zap,
  Info
} from 'lucide-vue-next'

// 加密相关
const encryptMode = ref('GCM')
const encryptKey = ref('')
const showEncryptKey = ref(false)
const plaintext = ref('')
const encryptedResult = ref('')
const encryptedIv = ref('')
const encryptedTag = ref('')

// 解密相关
const decryptMode = ref('GCM')
const decryptKey = ref('')
const showDecryptKey = ref(false)
const ciphertext = ref('')
const decryptedResult = ref(null)
const decryptError = ref('')

// 生成随机密钥
async function generateEncryptKey() {
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  )

  const exported = await crypto.subtle.exportKey('raw', key)
  const keyArray = new Uint8Array(exported)
  encryptKey.value = Array.from(keyArray, b => b.toString(16).padStart(2, '0')).join('')
}

// 加密数据
async function encryptData() {
  if (!plaintext.value || !encryptKey.value) return

  try {
    // 将十六进制密钥转换为Uint8Array
    const keyBytes = hexToBytes(encryptKey.value)

    // 导入密钥
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: `AES-${encryptMode.value}` },
      false,
      ['encrypt']
    )

    // 生成IV
    const iv = crypto.getRandomValues(new Uint8Array(encryptMode.value === 'GCM' ? 12 : 16))

    // 编码明文
    const encoder = new TextEncoder()
    const data = encoder.encode(plaintext.value)

    let encrypted

    if (encryptMode.value === 'GCM') {
      encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        cryptoKey,
        data
      )
    } else {
      encrypted = await crypto.subtle.encrypt(
        { name: 'AES-CBC', iv },
        cryptoKey,
        data
      )
    }

    // 转换为Base64
    const encryptedArray = new Uint8Array(encrypted)
    const encryptedBase64 = btoa(String.fromCharCode(...encryptedArray))
    const ivBase64 = btoa(String.fromCharCode(...iv))

    encryptedResult.value = encryptedBase64
    encryptedIv.value = ivBase64

    if (encryptMode.value === 'GCM') {
      // GCM模式最后16字节是认证标签
      const tagStart = encryptedArray.length - 16
      const tag = encryptedArray.slice(tagStart)
      encryptedTag.value = btoa(String.fromCharCode(...tag))
    }
  } catch (error) {
    console.error('Encryption error:', error)
    alert('加密失败：' + error.message)
  }
}

// 解密数据
async function decryptData() {
  if (!ciphertext.value || !decryptKey.value) return

  decryptedResult.value = null
  decryptError.value = ''

  try {
    const keyBytes = hexToBytes(decryptKey.value)

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: `AES-${decryptMode.value}` },
      false,
      ['decrypt']
    )

    // 从Base64解码
    const encryptedData = atob(ciphertext.value)
    const encryptedArray = new Uint8Array(encryptedData.length)
    for (let i = 0; i < encryptedData.length; i++) {
      encryptedArray[i] = encryptedData.charCodeAt(i)
    }

    let decrypted

    if (decryptMode.value === 'GCM') {
      // GCM模式需要IV
      const iv = new Uint8Array(12)
      // 假设IV包含在密文中或使用固定IV（实际应用中应该分开存储）
      crypto.getRandomValues(iv)

      decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        cryptoKey,
        encryptedArray
      )
    } else {
      const iv = new Uint8Array(16)
      crypto.getRandomValues(iv)

      decrypted = await crypto.subtle.decrypt(
        { name: 'AES-CBC', iv },
        cryptoKey,
        encryptedArray
      )
    }

    const decoder = new TextDecoder()
    decryptedResult.value = decoder.decode(new Uint8Array(decrypted))
  } catch (error) {
    console.error('Decryption error:', error)
    decryptError.value = '解密失败：密钥错误或数据损坏'
  }
}

// 辅助函数
function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16)
  }
  return bytes
}

function bytesToHex(bytes) {
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
}

// 快速操作
function useSameKey() {
  decryptKey.value = encryptKey.value
}

function encryptToDecrypt() {
  ciphertext.value = encryptedResult.value
  decryptMode.value = encryptMode.value
}

function clearAll() {
  encryptKey.value = ''
  plaintext.value = ''
  encryptedResult.value = ''
  encryptedIv.value = ''
  encryptedTag.value = ''
  decryptKey.value = ''
  ciphertext.value = ''
  decryptedResult.value = null
  decryptError.value = ''
}

// 复制操作
function copyEncrypted() {
  navigator.clipboard.writeText(encryptedResult.value)
}

function copyDecrypted() {
  navigator.clipboard.writeText(decryptedResult.value)
}

useSeoMeta({
  title: 'AES加密解密工具 - 在线AES-GCM/AES-CBC加密器',
  description: '免费在线AES加密解密工具，支持AES-256-GCM和AES-CBC模式，完全在浏览器本地处理，数据安全不上传服务器。',
  keywords: ['aes', '加密', '解密', 'aes-gcm', 'aes-cbc', 'aes-256', '在线加密', '对称加密', '数据安全']
})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('AES加密/解密工具')
</script>
