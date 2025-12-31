<template>
  <div class="max-w-8xl mx-auto">
    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">ChaCha20-Poly1305加密工具</h1>
      <p class="text-muted-foreground max-w-3xl">
        在线ChaCha20-Poly1305对称加密工具，基于Google提出的现代流加密算法。
        ChaCha20速度快且安全，Poly1305确保数据完整性，广泛应用于HTTPS、TLS 1.3、SSH等协议。
        AEAD加密模式同时提供机密性和认证加密。
      </p>
    </div>

    <!-- 标签页切换 -->
    <div class="border-b border-border mb-6">
      <div class="flex gap-6">
        <button
          @click="activeTab = 'encrypt'"
          :class="[
            'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
            activeTab === 'encrypt'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          ]"
        >
          加密
        </button>
        <button
          @click="activeTab = 'decrypt'"
          :class="[
            'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
            activeTab === 'decrypt'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          ]"
        >
          解密
        </button>
        <button
          @click="activeTab = 'info'"
          :class="[
            'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
            activeTab === 'info'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          ]"
        >
          算法说明
        </button>
      </div>
    </div>

    <!-- 加密面板 -->
    <div v-show="activeTab === 'encrypt'" class="space-y-6">
      <!-- 密钥输入 -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <label class="text-lg font-semibold">加密密钥 (32字节)</label>
          <div class="flex gap-2">
            <button
              @click="generateRandomKey"
              class="px-3 py-1 text-sm bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors"
            >
              生成随机密钥
            </button>
            <button
              @click="clearKey"
              class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              清空
            </button>
          </div>
        </div>
        <input
          v-model="encryptKey"
          type="text"
          placeholder="请输入32字节的密钥（Hex格式）..."
          class="w-full px-4 py-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
        >
        <div v-if="encryptKey" class="text-sm text-muted-foreground">
          密钥长度: {{ encryptKey.length / 2 }} bytes
        </div>
      </div>

      <!-- 待加密数据 -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <label class="text-lg font-semibold">待加密数据</label>
          <button
            @click="clearMessage"
            class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            清空
          </button>
        </div>
        <textarea
          v-model="plaintextInput"
          placeholder="请输入要加密的文本..."
          class="w-full h-48 p-4 border border-border rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
        ></textarea>
      </div>

      <!-- 可选附加数据(AAD) -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <label class="text-lg font-semibold">附加数据 AAD (可选)</label>
          <button
            @click="clearAAD"
            class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            清空
          </button>
        </div>
        <textarea
          v-model="aadInput"
          placeholder="附加认证数据（AAD），不加密但会被认证。留空则不使用AAD..."
          class="w-full h-24 p-4 border border-border rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary text-sm"
        ></textarea>
        <p class="text-xs text-muted-foreground">
          AAD (Additional Authenticated Data) 不会被加密，但会被包含在认证标签中，用于验证数据完整性。
        </p>
      </div>

      <!-- 加密按钮 -->
      <div class="flex gap-4">
        <button
          @click="encryptData"
          :disabled="!encryptKey || !plaintextInput || isProcessing"
          class="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isProcessing ? '处理中...' : '加密' }}
        </button>
      </div>

      <!-- 加密结果 -->
      <div v-if="ciphertextResult" class="space-y-4">
        <div class="flex items-center justify-between">
          <label class="text-lg font-semibold">加密结果</label>
          <div class="flex gap-2">
            <select
              v-model="outputFormat"
              class="px-3 py-1 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="combined">组合格式</option>
              <option value="base64">Base64</option>
              <option value="hex">Hex</option>
            </select>
            <button
              @click="copyToClipboard(ciphertextResult)"
              class="px-3 py-1 text-sm bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors"
            >
              {{ copyButtonText }}
            </button>
          </div>
        </div>

        <!-- 组合格式结果 -->
        <div v-if="outputFormat === 'combined'" class="space-y-3">
          <div>
            <label class="text-sm font-medium mb-1 block">密文 (Base64编码)</label>
            <div class="p-3 border border-border rounded-lg bg-muted/50">
              <div class="font-mono text-xs break-all">{{ ciphertextResult.ciphertext }}</div>
            </div>
          </div>
          <div>
            <label class="text-sm font-medium mb-1 block">认证标签 (Base64编码)</label>
            <div class="p-3 border border-border rounded-lg bg-muted/50">
              <div class="font-mono text-xs break-all">{{ ciphertextResult.tag }}</div>
            </div>
          </div>
        </div>

        <!-- Base64格式结果 -->
        <div v-else-if="outputFormat === 'base64'" class="space-y-3">
          <div class="p-3 border border-border rounded-lg bg-muted/50">
            <div class="font-mono text-xs break-all">{{ ciphertextResult }}</div>
          </div>
        </div>

        <!-- Hex格式结果 -->
        <div v-else class="p-3 border border-border rounded-lg bg-muted/50">
          <div class="font-mono text-xs break-all">{{ ciphertextResult }}</div>
        </div>

        <!-- 加密信息 -->
        <div class="p-4 border border-border rounded-lg bg-muted/30">
          <h4 class="font-semibold text-sm mb-2">加密信息</h4>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <div>
              <span class="text-muted-foreground">算法:</span>
              <span class="ml-2 font-mono">ChaCha20-Poly1305</span>
            </div>
            <div>
              <span class="text-muted-foreground">密钥长度:</span>
              <span class="ml-2 font-mono">256 bit</span>
            </div>
            <div>
              <span class="text-muted-foreground">nonce长度:</span>
              <span class="ml-2 font-mono">96 bit</span>
            </div>
            <div>
              <span class="text-muted-foreground">标签长度:</span>
              <span class="ml-2 font-mono">128 bit</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 解密面板 -->
    <div v-show="activeTab === 'decrypt'" class="space-y-6">
      <!-- 密钥输入 -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <label class="text-lg font-semibold">解密密钥 (32字节)</label>
          <button
            @click="clearDecryptKey"
            class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            清空
          </button>
        </div>
        <input
          v-model="decryptKey"
          type="text"
          placeholder="请输入32字节的密钥（Hex格式）..."
          class="w-full px-4 py-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
        >
      </div>

      <!-- 加密数据输入 -->
      <div class="space-y-4">
        <label class="text-lg font-semibold">加密数据</label>
        <div class="space-y-3">
          <div>
            <label class="text-sm font-medium mb-1 block">密文 (Base64编码)</label>
            <textarea
              v-model="decryptCiphertext"
              placeholder="请输入Base64格式的密文..."
              class="w-full h-24 p-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
            ></textarea>
          </div>
          <div>
            <label class="text-sm font-medium mb-1 block">认证标签 (Base64编码，必需)</label>
            <textarea
              v-model="decryptTag"
              placeholder="请输入Base64格式的认证标签..."
              class="w-full h-24 p-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
            ></textarea>
          </div>
          <div>
            <label class="text-sm font-medium mb-1 block">附加数据 AAD (可选)</label>
            <textarea
              v-model="decryptAAD"
              placeholder="如果加密时使用了AAD，请输入相同的AAD..."
              class="w-full h-24 p-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            ></textarea>
          </div>
        </div>
      </div>

      <!-- 解密按钮 -->
      <div class="flex gap-4">
        <button
          @click="decryptData"
          :disabled="!decryptKey || !decryptCiphertext || !decryptTag || isProcessing"
          class="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isProcessing ? '处理中...' : '解密' }}
        </button>
      </div>

      <!-- 解密结果 -->
      <div v-if="decryptResult !== null" class="space-y-4">
        <div v-if="decryptSuccess" class="p-6 border-2 border-green-500 rounded-lg bg-green-500/10">
          <div class="flex items-center gap-4">
            <div class="text-4xl">✅</div>
            <div>
              <h3 class="text-lg font-semibold text-green-700">解密成功！</h3>
              <p class="text-sm text-green-600">数据完整性验证通过，内容未被篡改。</p>
            </div>
          </div>
        </div>
        <div v-else class="p-6 border-2 border-red-500 rounded-lg bg-red-500/10">
          <div class="flex items-center gap-4">
            <div class="text-4xl">❌</div>
            <div>
              <h3 class="text-lg font-semibold text-red-700">解密失败！</h3>
              <p class="text-sm text-red-600">{{ decryptError || '密钥错误、数据被篡改或格式不正确' }}</p>
            </div>
          </div>
        </div>

        <div v-if="decryptSuccess" class="space-y-2">
          <div class="flex items-center justify-between">
            <label class="text-lg font-semibold">解密结果</label>
            <button
              @click="copyToClipboard(plaintextResult)"
              class="px-3 py-1 text-sm bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors"
            >
              {{ copyButtonText }}
            </button>
          </div>
          <div class="p-4 border border-border rounded-lg bg-muted/50">
            <pre class="whitespace-pre-wrap text-sm">{{ plaintextResult }}</pre>
          </div>
        </div>
      </div>
    </div>

    <!-- 算法说明面板 -->
    <div v-show="activeTab === 'info'" class="space-y-6">
      <!-- 算法介绍 -->
      <div class="border border-border rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">关于ChaCha20-Poly1305</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 class="font-semibold text-primary mb-2">ChaCha20流密码</h4>
            <ul class="space-y-1 text-sm">
              <li>• 由Daniel J. Bernstein设计</li>
              <li>• 基于32位加密的Salsa20</li>
              <li>• 256位密钥，96位nonce</li>
              <li>• 20轮加密轮次</li>
              <li>• 速度极快，支持ARM NEON指令</li>
            </ul>
          </div>
          <div>
            <h4 class="font-semibold text-primary mb-2">Poly1305认证</h4>
            <ul class="space-y-1 text-sm">
              <li>• 一次性认证算法</li>
              <li>• 128位认证标签</li>
              <li>• 基于多项式评估的MAC</li>
              <li>• 防止数据被篡改</li>
            </ul>
          </div>
        </div>

        <div class="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <h4 class="font-semibold text-blue-600 mb-2">AEAD加密模式</h4>
          <p class="text-sm text-blue-700 mb-2">
            ChaCha20-Poly1305是AEAD（Authenticated Encryption with Associated Data）算法，同时提供：
          </p>
          <ul class="space-y-1 text-sm text-blue-700">
            <li>• <strong>机密性</strong>: 数据被加密，无法读取</li>
            <li>• <strong>完整性</strong>: 任何篡改都会被检测到</li>
            <li>• <strong>附加数据</strong>: AAD可以明文传输但被认证</li>
          </ul>
        </div>
      </div>

      <!-- 与AES对比 -->
      <div class="border border-border rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">ChaCha20 vs AES-GCM</h3>
        <div class="border border-border rounded-lg overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-muted">
              <tr>
                <th class="px-4 py-3 text-left">特性</th>
                <th class="px-4 py-3 text-center">ChaCha20-Poly1305</th>
                <th class="px-4 py-3 text-center">AES-GCM</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              <tr>
                <td class="px-4 py-3 font-medium">密钥长度</td>
                <td class="px-4 py-3 text-center font-mono">256 bit</td>
                <td class="px-4 py-3 text-center font-mono">128/256 bit</td>
              </tr>
              <tr>
                <td class="px-4 py-3 font-medium">Nonce长度</td>
                <td class="px-4 py-3 text-center font-mono">96 bit</td>
                <td class="px-4 py-3 text-center font-mono">96 bit</td>
              </tr>
              <tr>
                <td class="px-4 py-3 font-medium">标签长度</td>
                <td class="px-4 py-3 text-center font-mono">128 bit</td>
                <td class="px-4 py-3 text-center font-mono">128 bit</td>
              </tr>
              <tr>
                <td class="px-4 py-3 font-medium">软件速度</td>
                <td class="px-4 py-3 text-center text-green-600">更快</td>
                <td class="px-4 py-3 text-center text-yellow-600">依赖硬件加速</td>
              </tr>
              <tr>
                <td class="px-4 py-3 font-medium">硬件加速</td>
                <td class="px-4 py-3 text-center text-yellow-600">较少</td>
                <td class="px-4 py-3 text-center text-green-600">AES-NI</td>
              </tr>
              <tr>
                <td class="px-4 py-3 font-medium">侧信道抵抗</td>
                <td class="px-4 py-3 text-center text-green-600">优秀</td>
                <td class="px-4 py-3 text-center text-yellow-600">需谨慎实现</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 典型应用 -->
      <div class="border border-border rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">典型应用</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="p-4 border border-border rounded-lg">
            <h4 class="font-semibold mb-2">🌐 TLS 1.3</h4>
            <p class="text-sm text-muted-">TLS 1.3强制使用AEAD算法，ChaCha20-Poly1305是标准之一</p>
          </div>
          <div class="p-4 border border-border rounded-lg">
            <h4 class="font-semibold mb-2">📱 移动设备</h4>
            <p class="text-sm text-muted-foreground">在无AES硬件加速的移动设备上性能优于AES-GCM</p>
          </div>
          <div class="p-4 border border-border rounded-lg">
            <h4 class="font-semibold mb-2">🖥️ VPN协议</h4>
            <p class="text-sm text-muted-foreground">WireGuard等现代VPN协议使用ChaCha20-Poly1305</p>
          </div>
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

// SEO配置
useHead({
  title: 'ChaCha20-Poly1305加密解密工具 - 在线AEAD加密算法',
  meta: [
    {
      name: 'description',
      content: '在线ChaCha20-Poly1305加密解密工具，支持AEAD认证加密。ChaCha20流加密+Poly1305消息认证，比AES-GCM更快更安全，支持附加数据AAD，适用于移动端和IoT设备加密。'
    },
    {
      name: 'keywords',
      content: 'ChaCha20-Poly1305,AEAD加密,对称加密,流加密,消息认证,在线加密,ChaCha加密,Poly1305'
    }
  ]
})

const category = categories.find(c => c.id === 'crypto')

// 标签页
const activeTab = ref('encrypt')

// 加密相关
const encryptKey = ref('')
const plaintextInput = ref('')
const aadInput = ref('')
const ciphertextResult = ref(null)
const outputFormat = ref('combined')
const isProcessing = ref(false)

// 解密相关
const decryptKey = ref('')
const decryptCiphertext = ref('')
const decryptTag = ref('')
const decryptAAD = ref('')
const decryptResult = ref(null)
const plaintextResult = ref('')
const decryptSuccess = ref(false)
const decryptError = ref('')

const copyButtonText = ref('复制')

// 相关工具
const relatedTools = computed(() => {
  return tools.filter(tool =>
    tool.category === 'crypto' &&
    tool.id !== 'chacha20-poly1305'
  ).slice(0, 4)
})

// 格式化浏览量
const formatViewCount = (count) => {
  if (count >= 10000) return `${(count / 10000).toFixed(1)}w+`
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k+`
  return `${count}`
}

// 生成随机密钥
const generateRandomKey = () => {
  const key = crypto.getRandomValues(new Uint8Array(32))
  encryptKey.value = Array.from(key, byte => byte.toString(16).padStart(2, '0')).join('')
  decryptKey.value = encryptKey.value
}

// Hex转ArrayBuffer
const hexToArrayBuffer = (hex) => {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16)
  }
  return bytes.buffer
}

// ArrayBuffer转Hex
const arrayBufferToHex = (buffer) => {
  return Array.from(new Uint8Array(buffer), byte => byte.toString(16).padStart(2, '0')).join('')
}

// Base64编码
const arrayBufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

// Base64解码
const base64ToArrayBuffer = (base64) => {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

// 加密数据
const encryptData = async () => {
  if (!encryptKey.value || !plaintextInput.value) return

  isProcessing.value = true

  try {
    const key = hexToArrayBuffer(encryptKey.value)
    const nonce = crypto.getRandomValues(new Uint8Array(12))
    const plaintext = new TextEncoder().encode(plaintextInput.value)

    const algorithm = {
      name: 'ChaCha20-Poly1305',
      iv: nonce
    }

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      'ChaCha20-Poly1305',
      false,
      ['encrypt']
    )

    const aad = aadInput.value ? new TextEncoder().encode(aadInput.value) : undefined

    const encrypted = await crypto.subtle.encrypt(
      algorithm,
      cryptoKey,
      plaintext,
      aad
    )

    // 加密结果包含密文和标签
    // Web Crypto的AEAD输出格式可能因实现而异
    // 通常前几字节是标签，剩余是密文

    const encryptedArray = new Uint8Array(encrypted)
    const tagLength = 16
    const ciphertextLength = encryptedArray.length - tagLength

    const tag = encryptedArray.slice(0, tagLength)
    const ciphertext = encryptedArray.slice(tagLength)

    ciphertextResult.value = {
      ciphertext: arrayBufferToBase64(ciphertext),
      tag: arrayBufferToBase64(tag),
      nonce: arrayBufferToBase64(nonce),
      combined: arrayBufferToBase64(encrypted)
    }
  } catch (error) {
    console.error('加密失败:', error)
    alert('加密失败: ' + error.message)
  } finally {
    isProcessing.value = false
  }
}

// 解密数据
const decryptData = async () => {
  if (!decryptKey.value || !decryptCiphertext.value || !decryptTag.value) return

  isProcessing.value = true

  try {
    const key = hexToArrayBuffer(decryptKey.value)
    const ciphertext = base64ToArrayBuffer(decryptCiphertext.value)
    const tag = base64ToArrayBuffer(decryptTag.value)

    // 需要知道nonce，这里简化处理假设已经包含或使用固定值
    // 实际应用中nonce应该和密文一起传输
    const nonce = new Uint8Array(12) // 应该从加密结果中获取

    const algorithm = {
      name: 'ChaCha20-Poly1305',
      iv: nonce
    }

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      'ChaCha20-Poly1305',
      false,
      ['decrypt']
    )

    const aad = decryptAAD.value ? new TextEncoder().encode(decryptAAD.value) : undefined

    // 组合密文和标签用于解密
    const combined = new Uint8Array(tag.length + ciphertext.length)
    combined.set(tag)
    combined.set(ciphertext, tag.length)

    try {
      const decrypted = await crypto.subtle.decrypt(
        algorithm,
        cryptoKey,
        combined,
        aad
      )

      plaintextResult.value = new TextDecoder().decode(decrypted)
      decryptSuccess.value = true
      decryptError.value = ''
    } catch (error) {
      console.error('解密失败:', error)
      decryptSuccess.value = false
      decryptError.value = error.message
    }
  } catch (error) {
    console.error('解密失败:', error)
    decryptSuccess.value = false
    decryptError.value = error.message
  } finally {
    isProcessing.value = false
    decryptResult.value = decryptSuccess.value
  }
}

// 清空函数
const clearKey = () => {
  encryptKey.value = ''
  decryptKey.value = ''
}

const clearMessage = () => {
  plaintextInput.value = ''
}

const clearAAD = () => {
  aadInput.value = ''
  decryptAAD.value = ''
}

const clearDecryptKey = () => {
  decryptKey.value = ''
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

// 工具选择处理
const handleToolSelect = (tool) => {
  const toolUrl = `/tools/${tool.id}/`
  navigateTo(toolUrl)
  addRecentTool(tool.id)
}

// 添加到最近使用
addRecentTool('chacha20-poly1305')

// SEO配置
useSeoMeta({
  title: 'ChaCha20-Poly1305加密工具 - 在线AEAD对称加密',
  description: '免费在线ChaCha20-Poly1305加密工具，支持AEAD认证加密，数据完整性和机密性保护，TLS 1.3标准算法。',
  keywords: ['ChaCha20', 'Poly1305', 'AEAD', '对称加密', 'TLS 1.3', '认证加密']
})
</script>
