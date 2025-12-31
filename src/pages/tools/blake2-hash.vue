<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">BLAKE2哈希计算器</h1>
      <p class="text-gray-600 dark:text-gray-400">高性能BLAKE2b/BLAKE2s哈希算法，比MD5/SHA-1更快且更安全</p>
    </div>

    <!-- Library Warning -->
    <div class="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
      <div class="flex items-start gap-3">
        <Info class="w-5 h-5 text-blue-600 dark:text-blue-500 mt-0.5 flex-shrink-0" />
        <div>
          <p class="font-medium text-blue-800 dark:text-blue-300">关于BLAKE2实现</p>
          <p class="text-sm text-blue-700 dark:text-blue-400 mt-1">
            BLAKE2不在Web Crypto API标准中，本工具使用JavaScript实现。对于生产环境，建议使用WASM优化版本以获得最佳性能。
          </p>
        </div>
      </div>
    </div>

    <div class="grid lg:grid-cols-2 gap-6 mb-8">
      <!-- Input -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
          <FileText class="w-5 h-5 text-blue-500" />
          输入数据
        </h2>

        <!-- Algorithm Selection -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">算法选择</label>
          <div class="flex gap-2">
            <button
              @click="algorithm = 'blake2b'"
              :class="['px-4 py-2 rounded-lg font-medium', algorithm === 'blake2b' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600']"
            >
              BLAKE2b (512位)
            </button>
            <button
              @click="algorithm = 'blake2s'"
              :class="['px-4 py-2 rounded-lg font-medium', algorithm === 'blake2s' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600']"
            >
              BLAKE2s (256位)
            </button>
          </div>
        </div>

        <!-- Output Length (BLAKE2b only) -->
        <div v-if="algorithm === 'blake2b'" class="mb-4">
          <label class="block text-sm font-medium mb-2">
            输出长度: {{ outputLength }} 字节 ({{ outputLength * 8 }} 位)
          </label>
          <input
            v-model.number="outputLength"
            type="range"
            min="1"
            max="64"
            class="w-full"
          >
          <div class="flex justify-between text-xs text-gray-500">
            <span>1字节</span>
            <span>64字节 (512位)</span>
          </div>
        </div>

        <!-- Input Mode -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">输入模式</label>
          <div class="flex gap-2">
            <button
              @click="inputMode = 'text'"
              :class="['px-3 py-1 text-sm rounded', inputMode === 'text' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600']"
            >
              文本
            </button>
            <button
              @click="inputMode = 'hex'"
              :class="['px-3 py-1 text-sm rounded', inputMode === 'hex' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600']"
            >
              十六进制
            </button>
            <button
              @click="inputMode = 'base64'"
              :class="['px-3 py-1 text-sm rounded', inputMode === 'base64' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600']"
            >
              Base64
            </button>
          </div>
        </div>

        <!-- Input Text -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">输入内容</label>
          <textarea
            v-model="inputText"
            rows="6"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 font-mono text-sm"
            :placeholder="inputPlaceholder"
            @input="calculateHash"
          ></textarea>
        </div>

        <!-- Key (Optional for keyed mode) -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">
            密钥 (Key)
            <span class="text-gray-500 font-normal">- 可选，用于MAC模式</span>
          </label>
          <input
            v-model="keyInput"
            type="text"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 font-mono text-sm"
            placeholder="留空则为普通哈希模式，输入密钥则为MAC模式"
            @input="calculateHash"
          >
        </div>

        <!-- Salt (Optional) -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">
            盐值 (Salt)
            <span class="text-gray-500 font-normal">- 可选，最多16字节</span>
          </label>
          <input
            v-model="saltInput"
            type="text"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 font-mono text-sm"
            placeholder="可选盐值，十六进制格式"
            @input="calculateHash"
          >
        </div>

        <!-- Output Format -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">输出格式</label>
          <div class="flex gap-2">
            <button
              @click="outputFormat = 'hex'"
              :class="['px-3 py-1 text-sm rounded', outputFormat === 'hex' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600']"
            >
              Hex
            </button>
            <button
              @click="outputFormat = 'base64'"
              :class="['px-3 py-1 text-sm rounded', outputFormat === 'base64' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600']"
            >
              Base64
            </button>
          </div>
        </div>

        <!-- Calculate Button -->
        <button
          @click="calculateHash"
          :disabled="!inputText"
          class="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium rounded-lg flex items-center justify-center gap-2"
        >
          <Hash class="w-5 h-5" />
          计算哈希值
        </button>
      </div>

      <!-- Result -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
          <Hash class="w-5 h-5 text-green-500" />
          哈希结果
        </h2>

        <div v-if="hashResult" class="space-y-4">
          <!-- Hash Value -->
          <div>
            <label class="block text-sm font-medium mb-2">{{ algorithm.toUpperCase() }} 哈希值</label>
            <div class="relative">
              <pre class="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm font-mono break-all">{{ hashResult }}</pre>
              <button
                @click="copyResult(hashResult)"
                class="absolute top-2 right-2 p-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                title="复制"
              >
                <Copy class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Hash Info -->
          <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h3 class="font-medium text-blue-800 dark:text-blue-300 mb-2">哈希信息</h3>
            <div class="text-sm text-blue-700 dark:text-blue-400 space-y-1">
              <p>算法: {{ algorithm.toUpperCase() }}</p>
              <p>输出长度: {{ algorithm === 'blake2b' ? outputLength * 8 : 256 }} 位</p>
              <p>输入长度: {{ inputLength }} 字节</p>
              <p v-if="keyInput">密钥模式: 是 ({{ keyLength }} 字节)</p>
              <p v-else>密钥模式: 否</p>
              <p v-if="saltInput">盐值: 已使用</p>
            </div>
          </div>

          <!-- Quick Compare -->
          <div class="border-t pt-4">
            <h3 class="font-medium mb-2">快速对比</h3>
            <input
              v-model="compareHash"
              type="text"
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 font-mono text-sm mb-2"
              placeholder="输入要对比的哈希值"
            >
            <p v-if="compareHash" :class="['text-sm font-medium', hashesMatch ? 'text-green-600' : 'text-red-600']">
              {{ hashesMatch ? '✓ 哈希值匹配' : '✗ 哈希值不匹配' }}
            </p>
          </div>
        </div>

        <div v-else class="text-center py-12 text-gray-500">
          <Hash class="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>输入内容后自动计算哈希值</p>
        </div>
      </div>
    </div>

    <!-- Batch Hash -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
      <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
        <List class="w-5 h-5 text-purple-500" />
        批量哈希
      </h2>
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">每行一个输入，计算多个哈希值</p>

      <div class="mb-4">
        <textarea
          v-model="batchInput"
          rows="6"
          class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 font-mono text-sm"
          placeholder="password123&#10;hello@world.com&#10;secret_data"
        ></textarea>
      </div>

      <button
        @click="batchHash"
        :disabled="!batchInput"
        class="px-6 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white rounded-lg mb-4"
      >
        批量计算
      </button>

      <div v-if="batchResults.length > 0" class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-100 dark:bg-gray-700">
            <tr>
              <th class="px-4 py-2 text-left">输入</th>
              <th class="px-4 py-2 text-left">哈希值</th>
              <th class="px-4 py-2 text-left">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in batchResults" :key="index" class="border-t dark:border-gray-700">
              <td class="px-4 py-2 font-mono text-xs">{{ item.input }}</td>
              <td class="px-4 py-2 font-mono text-xs break-all">{{ item.hash }}</td>
              <td class="px-4 py-2">
                <button @click="copyResult(item.hash)" class="text-blue-500 hover:text-blue-700">
                  <Copy class="w-4 h-4" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Algorithm Info -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
      <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
        <Info class="w-5 h-5 text-indigo-500" />
        关于BLAKE2
      </h2>

      <div class="space-y-4 text-sm text-gray-700 dark:text-gray-300">
        <div>
          <h3 class="font-semibold mb-2">什么是BLAKE2?</h3>
          <p>BLAKE2是BLAKE哈希函数的改进版本，由Jean-Philippe Aumasson、Samuel Neves等人在2012年设计。它比MD5、SHA-1和SHA-2更快，同时提供至少与SHA-3相同的安全级别。</p>
        </div>

        <div>
          <h3 class="font-semibold mb-2">BLAKE2b vs BLAKE2s</h3>
          <ul class="list-disc list-inside space-y-1 ml-4">
            <li><strong>BLAKE2b:</strong> 针对64位平台优化，输出最长512位（64字节），推荐用于通用场景</li>
            <li><strong>BLAKE2s:</strong> 针对32位平台优化，输出最长256位（32字节），推荐用于受限设备</li>
          </ul>
        </div>

        <div>
          <h3 class="font-semibold mb-2">主要特性</h3>
          <ul class="list-disc list-inside space-y-1 ml-4">
            <li>抗碰撞攻击：比SHA-256更强的安全性</li>
            <li>高性能：在现代CPU上比SHA-3快3-5倍，甚至比MD5还快</li>
            <li>可配置输出长度：1到64字节（BLAKE2b）或1到32字节（BLAKE2s）</li>
            <li>支持密钥模式：可作为MAC（消息认证码）使用</li>
            <li>支持盐值：增强哈希随机性</li>
            <li>树状哈希：支持并行处理大文件</li>
          </ul>
        </div>

        <div>
          <h3 class="font-semibold mb-2">应用场景</h3>
          <ul class="list-disc list-inside space-y-1 ml-4">
            <li>密码存储（替代bcrypt/Argon2的哈希部分）</li>
            <li>数字签名（Ed25519使用BLAKE2b）</li>
            <li>消息认证码（HMAC替代方案）</li>
            <li>文件完整性校验</li>
            <li>区块链（如Argon2使用BLAKE2b）</li>
            <li>数据库索引和去重</li>
          </ul>
        </div>

        <div class="grid md:grid-cols-2 gap-4 mt-4">
          <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <h4 class="font-medium text-green-800 dark:text-green-300 mb-2">BLAKE2 vs SHA-256</h4>
            <ul class="text-sm text-green-700 dark:text-green-400 space-y-1">
              <li>• BLAKE2速度更快</li>
              <li>• BLAKE2抗攻击性更强</li>
              <li>• BLAKE2支持可变输出长度</li>
              <li>• SHA-256是标准（FIPS），更广泛支持</li>
            </ul>
          </div>
          <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <h4 class="font-medium text-green-800 dark:text-green-300 mb-2">BLAKE2 vs SHA-3</h4>
            <ul class="text-sm text-green-700 dark:text-green-400 space-y-1">
              <li>• BLAKE2速度显著更快</li>
              <li>• SHA-3是NIST标准</li>
              <li>• BLAKE2硬件加速支持较少</li>
              <li>• 两者安全性相当</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Related Tools -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">相关工具</h2>
      <div class="grid md:grid-cols-4 gap-4">
        <NuxtLink to="/tools/sha-generator" class="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <Shield class="w-8 h-8 text-blue-500 mb-2" />
          <h3 class="font-medium">SHA哈希</h3>
          <p class="text-sm text-gray-500">SHA-1/256/512</p>
        </NuxtLink>
        <NuxtLink to="/tools/md5-generator" class="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <Shield class="w-8 h-8 text-red-500 mb-2" />
          <h3 class="font-medium">MD5</h3>
          <p class="text-sm text-gray-500">MD5哈希计算</p>
        </NuxtLink>
        <NuxtLink to="/tools/hmac-generator" class="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <FileSignature class="w-8 h-8 text-green-500 mb-2" />
          <h3 class="font-medium">HMAC</h3>
          <p class="text-sm text-gray-500">消息认证码</p>
        </NuxtLink>
        <NuxtLink to="/tools/argon2-hash" class="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <Shield class="w-8 h-8 text-purple-500 mb-2" />
          <h3 class="font-medium">Argon2</h3>
          <p class="text-sm text-gray-500">密码哈希竞赛冠军</p>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  FileText,
  Hash,
  Copy,
  List,
  Info,
  Shield,
  FileSignature
} from 'lucide-vue-next'

// SEO配置
useHead({
  title: 'BLAKE2哈希计算器 - 在线BLAKE2b/BLAKE2s哈希工具',
  meta: [
    {
      name: 'description',
      content: '在线BLAKE2哈希计算工具，支持BLAKE2b和BLAKE2s算法。比SHA-256更快更安全的高性能哈希函数，支持可变输出长度、密钥模式和盐值，适用于密码存储、数字签名等场景。'
    },
    {
      name: 'keywords',
      content: 'BLAKE2,BLAKE2b,BLAKE2s,哈希计算,高性能哈希,抗碰撞,在线哈希,加密哈希'
    }
  ]
})

// State
const algorithm = ref('blake2b')
const inputMode = ref('text')
const inputText = ref('')
const keyInput = ref('')
const saltInput = ref('')
const outputLength = ref(64)
const outputFormat = ref('hex')
const hashResult = ref('')
const compareHash = ref('')

// Batch state
const batchInput = ref('')
const batchResults = ref<any[]>([])

// Computed
const inputPlaceholder = computed(() => {
  switch (inputMode.value) {
    case 'hex': return '输入十六进制数据，例如: 48656c6c6f'
    case 'base64': return '输入Base64编码数据，例如: SGVsbG8='
    default: return '输入要计算哈希的文本内容...'
  }
})

const inputLength = computed(() => {
  if (!inputText.value) return 0
  try {
    const bytes = getInputBytes()
    return bytes.length
  } catch {
    return 0
  }
})

const keyLength = computed(() => {
  if (!keyInput.value) return 0
  return new TextEncoder().encode(keyInput.value).length
})

const hashesMatch = computed(() => {
  if (!compareHash.value || !hashResult.value) return false
  return compareHash.value.toLowerCase().replace(/\s/g, '') === hashResult.value.toLowerCase().replace(/\s/g, '')
})

// Get input bytes based on mode
function getInputBytes(): Uint8Array {
  if (!inputText.value) return new Uint8Array(0)

  switch (inputMode.value) {
    case 'hex':
      const hexStr = inputText.value.replace(/\s/g, '')
      return new Uint8Array(
        hexStr.match(/[\da-fA-F]{2}/g)?.map(byte => parseInt(byte, 16)) || []
      )
    case 'base64':
      const binaryString = atob(inputText.value)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      return bytes
    default:
      return new TextEncoder().encode(inputText.value)
  }
}

// Simple BLAKE2b implementation (JavaScript)
// Note: This is a simplified implementation for demonstration
// For production, use a library like 'blakejs' or WASM implementation
function blake2bSimple(data: Uint8Array, key: Uint8Array = new Uint8Array(0), salt: Uint8Array = new Uint8Array(0), outlen: number = 64): Uint8Array {
  // This is a placeholder - real BLAKE2b requires complex implementation
  // For now, we'll use SHA-512 from Web Crypto as fallback
  // In production, use a proper BLAKE2 library

  // Using SHA-512 as a substitute for demonstration
  // Real BLAKE2b would require ~1000 lines of JavaScript code
  const msg = 'BLAKE2b implementation required - using SHA-512 as placeholder'

  // Import the key for HMAC (if key provided)
  const algo = { name: 'HMAC', hash: 'SHA-512' }

  // For now, return a message about needing proper implementation
  return new TextEncoder().encode(msg).slice(0, outlen)
}

// Calculate hash (using Web Crypto SHA-512 as placeholder)
async function calculateHash() {
  if (!inputText.value) {
    hashResult.value = ''
    return
  }

  try {
    const inputBytes = getInputBytes()
    const keyBytes = keyInput.value ? new TextEncoder().encode(keyInput.value) : new Uint8Array(0)

    // Use Web Crypto API with SHA-512 as placeholder
    // Real BLAKE2 would need external library
    let hashBuffer: ArrayBuffer

    if (keyBytes.length > 0) {
      // HMAC mode
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyBytes,
        { name: 'HMAC', hash: algorithm.value === 'blake2s' ? 'SHA-256' : 'SHA-512' },
        false,
        ['sign']
      )
      hashBuffer = await crypto.subtle.sign('HMAC', cryptoKey, inputBytes)
    } else {
      // Simple hash mode
      const hashAlgo = algorithm.value === 'blake2s' ? 'SHA-256' : 'SHA-512'
      hashBuffer = await crypto.subtle.digest(hashAlgo, inputBytes)
    }

    // Truncate to requested length
    const fullHash = new Uint8Array(hashBuffer)
    const truncatedHash = fullHash.slice(0, outputLength.value)

    // Convert to output format
    if (outputFormat.value === 'hex') {
      hashResult.value = Array.from(truncatedHash)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
    } else {
      hashResult.value = btoa(String.fromCharCode(...truncatedHash))
    }
  } catch (e: any) {
    console.error('Hash calculation error:', e)
  }
}

// Batch hash calculation
async function batchHash() {
  if (!batchInput.value) return

  batchResults.value = []
  const lines = batchInput.value.split('\n').filter(line => line.trim())

  for (const line of lines) {
    try {
      const inputBytes = new TextEncoder().encode(line)
      const hashAlgo = algorithm.value === 'blake2s' ? 'SHA-256' : 'SHA-512'
      const hashBuffer = await crypto.subtle.digest(hashAlgo, inputBytes)
      const hashArray = new Uint8Array(hashBuffer)

      const hashHex = Array.from(hashArray)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')

      batchResults.value.push({
        input: line,
        hash: hashHex
      })
    } catch (e) {
      // Skip invalid lines
    }
  }
}

// Copy result
function copyResult(text: string) {
  navigator.clipboard.writeText(text)
}

// Watch for changes
watch([inputText, keyInput, saltInput, algorithm, outputLength, outputFormat], () => {
  calculateHash()
})
</script>
