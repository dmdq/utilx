<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">多编码转换工具</h1>
      <p class="text-gray-600 dark:text-gray-400">支持Base32、Base58、Base62等多种编码格式的相互转换</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6 mb-8">
      <!-- Input -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
          <FileText class="w-5 h-5 text-blue-500" />
          输入
        </h2>

        <!-- Input Encoding -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">输入编码格式</label>
          <select v-model="inputEncoding" class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
            <option value="utf8">UTF-8 文本</option>
            <option value="base16">Base16 (Hex)</option>
            <option value="base32">Base32</option>
            <option value="base58">Base58 (Bitcoin)</option>
            <option value="base62">Base62</option>
            <option value="base64">Base64</option>
          </select>
        </div>

        <!-- Input Text -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">输入内容</label>
          <textarea
            v-model="inputText"
            rows="8"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 font-mono text-sm"
            placeholder="输入要转换的内容..."
          ></textarea>
          <div class="flex justify-between mt-2">
            <span class="text-sm text-gray-500">长度: {{ inputLength }} 字节</span>
            <div class="flex gap-2">
              <button
                @click="pasteFromClipboard"
                class="text-sm text-blue-500 hover:text-blue-700"
              >
                粘贴
              </button>
              <button
                @click="inputText = ''; convert()"
                class="text-sm text-red-500 hover:text-red-700"
              >
                清空
              </button>
            </div>
          </div>
        </div>

        <!-- Convert Button -->
        <button
          @click="convert"
          :disabled="!inputText"
          class="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium rounded-lg flex items-center justify-center gap-2"
        >
          <RefreshCw class="w-5 h-5" />
          转换
        </button>
      </div>

      <!-- Output -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
          <FileOutput class="w-5 h-5 text-green-500" />
          输出
        </h2>

        <!-- Output Encoding -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">输出编码格式</label>
          <select v-model="outputEncoding" class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
            <option value="utf8">UTF-8 文本</option>
            <option value="base16">Base16 (Hex)</option>
            <option value="base32">Base32</option>
            <option value="base58">Base58 (Bitcoin)</option>
            <option value="base62">Base62</option>
            <option value="base64">Base64</option>
          </select>
        </div>

        <!-- Output Result -->
        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">转换结果</label>
          <div class="relative">
            <pre v-if="outputText" class="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm font-mono break-all whitespace-pre-wrap max-h-64 overflow-y-auto">{{ outputText }}</pre>
            <div v-else class="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-gray-500 text-center">
              转换结果将显示在这里
            </div>
            <button
              v-if="outputText"
              @click="copyResult"
              class="absolute top-2 right-2 p-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
              title="复制结果"
            >
              <Copy class="w-4 h-4" />
            </button>
          </div>
          <div class="flex justify-between mt-2">
            <span class="text-sm text-gray-500">输出长度: {{ outputLength }} 字节</span>
          </div>
        </div>

        <!-- Quick Convert Buttons -->
        <div class="flex flex-wrap gap-2">
          <button
            v-for="enc in encodings"
            :key="enc.value"
            @click="outputEncoding = enc.value; convert()"
            :class="['px-3 py-1 text-sm rounded', outputEncoding === enc.value ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-600']"
          >
            {{ enc.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- Encoding Info -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
      <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
        <Info class="w-5 h-5 text-indigo-500" />
        编码说明
      </h2>

      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <!-- Base16/Hex -->
        <div class="border dark:border-gray-700 rounded-lg p-4">
          <h3 class="font-medium mb-2">Base16 (Hex)</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
            使用0-9和A-F表示数据，每个字节用2个字符表示
          </p>
          <div class="text-xs font-mono bg-gray-100 dark:bg-gray-900 p-2 rounded">
            示例: "48656C6C6F" = "Hello"
          </div>
        </div>

        <!-- Base32 -->
        <div class="border dark:border-gray-700 rounded-lg p-4">
          <h3 class="font-medium mb-2">Base32</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
            使用A-Z和2-7表示数据，不区分大小写，常用于OTP密钥
          </p>
          <div class="text-xs font-mono bg-gray-100 dark:bg-gray-900 p-2 rounded">
            示例: "JBSWY3DPEBLW64TMMQ" = "Hello"
          </div>
        </div>

        <!-- Base58 -->
        <div class="border dark:border-gray-700 rounded-lg p-4">
          <h3 class="font-medium mb-2">Base58</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
            排除0OIl等易混淆字符，用于比特币地址
          </p>
          <div class="text-xs font-mono bg-gray-100 dark:bg-gray-900 p-2 rounded">
            字符集: 123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz
          </div>
        </div>

        <!-- Base62 -->
        <div class="border dark:border-gray-700 rounded-lg p-4">
          <h3 class="font-medium mb-2">Base62</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
            使用0-9、A-Z、a-z，用于URL短链、ID编码
          </p>
          <div class="text-xs font-mono bg-gray-100 dark:bg-gray-900 p-2 rounded">
            示例: "t8DgcJ" = 123456789
          </div>
        </div>

        <!-- Base64 -->
        <div class="border dark:border-gray-700 rounded-lg p-4">
          <h3 class="font-medium mb-2">Base64</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
            使用A-Z、a-z、0-9和+/，用于电子邮件、MIME
          </p>
          <div class="text-xs font-mono bg-gray-100 dark:bg-gray-900 p-2 rounded">
            示例: "SGVsbG8=" = "Hello"
          </div>
        </div>

        <!-- UTF-8 -->
        <div class="border dark:border-gray-700 rounded-lg p-4">
          <h3 class="font-medium mb-2">UTF-8</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
            通用字符编码，支持多语言文本
          </p>
          <div class="text-xs font-mono bg-gray-100 dark:bg-gray-900 p-2 rounded">
            示例: "你好" = E4BDA0E5A5BD
          </div>
        </div>
      </div>
    </div>

    <!-- Use Cases -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
      <h2 class="text-xl font-semibold mb-4">应用场景</h2>
      <div class="grid md:grid-cols-2 gap-4 text-sm">
        <div>
          <h3 class="font-medium mb-2">Base16/Hex</h3>
          <ul class="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">
            <li>显示二进制数据</li>
            <li>颜色值 (RGB)</li>
            <li>MAC地址</li>
            <li>内存地址</li>
          </ul>
        </div>
        <div>
          <h3 class="font-medium mb-2">Base32</h3>
          <ul class="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">
            <li>TOTP/HOTP密钥</li>
            <li>Google Authenticator</li>
            <li>DNSSEC</li>
            <li>不区分大小写的场景</li>
          </ul>
        </div>
        <div>
          <h3 class="font-medium mb-2">Base58</h3>
          <ul class="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">
            <li>比特币地址</li>
            <li>IPFS CID</li>
            <li>避免视觉混淆</li>
          </ul>
        </div>
        <div>
          <h3 class="font-medium mb-2">Base62</h3>
          <ul class="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">
            <li>URL短链</li>
            <li>YouTube视频ID</li>
            <li>数据库ID编码</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Related Tools -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">相关工具</h2>
      <div class="grid md:grid-cols-4 gap-4">
        <NuxtLink to="/base64-encode" class="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <Hash class="w-8 h-8 text-blue-500 mb-2" />
          <h3 class="font-medium">Base64编码</h3>
          <p class="text-sm text-gray-500">Base64编码/解码</p>
        </NuxtLink>
        <NuxtLink to="/hex-convert" class="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <Hash class="w-8 h-8 text-green-500 mb-2" />
          <h3 class="font-medium">十六进制</h3>
          <p class="text-sm text-gray-500">Hex转换</p>
        </NuxtLink>
        <NuxtLink to="/url-encode" class="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <Link class="w-8 h-8 text-purple-500 mb-2" />
          <h3 class="font-medium">URL编码</h3>
          <p class="text-sm text-gray-500">URL编码/解码</p>
        </NuxtLink>
        <NuxtLink to="/otp-generator" class="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <Clock class="w-8 h-8 text-red-500 mb-2" />
          <h3 class="font-medium">OTP生成器</h3>
          <p class="text-sm text-gray-500">动态口令</p>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  FileText,
  FileOutput,
  RefreshCw,
  Copy,
  Info,
  Hash,
  Link,
  Clock
} from 'lucide-vue-next'

// SEO配置
useHead({
  title: '多编码转换工具 - 在线Base32/Base58/Base62编码转换',
  meta: [
    {
      name: 'description',
      content: '在线多编码转换工具，支持Base32、Base58、Base62与Hex、Base64、UTF-8等多种编码格式互转。适用于比特币地址、URL短链、OTP密钥等场景。'
    },
    {
      name: 'keywords',
      content: 'Base32编码,Base58编码,Base62编码,编码转换,比特币编码,URL短链,在线编码工具,Base58解码'
    }
  ]
})

// State
const inputEncoding = ref('utf8')
const outputEncoding = ref('base64')
const inputText = ref('')
const outputText = ref('')

// Encodings list
const encodings = [
  { value: 'utf8', label: 'UTF-8' },
  { value: 'base16', label: 'Hex' },
  { value: 'base32', label: 'Base32' },
  { value: 'base58', label: 'Base58' },
  { value: 'base62', label: 'Base62' },
  { value: 'base64', label: 'Base64' }
]

// Base32 charset
const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

// Base58 charset (Bitcoin style)
const BASE58_CHARS = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

// Base62 charset
const BASE62_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

// Computed
const inputLength = computed(() => {
  if (!inputText.value) return 0
  try {
    const bytes = decodeToBytes(inputText.value, inputEncoding.value)
    return bytes.length
  } catch {
    return 0
  }
})

const outputLength = computed(() => {
  if (!outputText.value) return 0
  return new TextEncoder().encode(outputText.value).length
})

// Decode input to bytes based on encoding
function decodeToBytes(input: string, encoding: string): Uint8Array {
  if (!input) return new Uint8Array(0)

  switch (encoding) {
    case 'utf8':
      return new TextEncoder().encode(input)

    case 'base16':
    case 'hex':
      const cleanHex = input.replace(/\s/g, '')
      return new Uint8Array(
        cleanHex.match(/[\da-fA-F]{2}/g)?.map(byte => parseInt(byte, 16)) || []
      )

    case 'base32':
      return base32Decode(input)

    case 'base58':
      return base58Decode(input)

    case 'base62':
      return base62Decode(input)

    case 'base64':
      const binaryString = atob(input.replace(/[\s\r\n]/g, ''))
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      return bytes

    default:
      return new TextEncoder().encode(input)
  }
}

// Encode bytes to output based on encoding
function encodeFromBytes(bytes: Uint8Array, encoding: string): string {
  switch (encoding) {
    case 'utf8':
      return new TextDecoder().decode(bytes)

    case 'base16':
    case 'hex':
      return Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')

    case 'base32':
      return base32Encode(bytes)

    case 'base58':
      return base58Encode(bytes)

    case 'base62':
      return base62Encode(bytes)

    case 'base64':
      return btoa(String.fromCharCode(...bytes))

    default:
      return new TextDecoder().decode(bytes)
  }
}

// Base32 encode
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

// Base32 decode
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

// Base58 encode (Bitcoin style)
function base58Encode(buffer: Uint8Array): string {
  const digits = [0]
  for (let i = 0; i < buffer.length; i++) {
    let carry = buffer[i]
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8
      digits[j] = carry % 58
      carry = (carry / 58) | 0
    }
    while (carry) {
      digits.push(carry % 58)
      carry = (carry / 58) | 0
    }
  }

  let result = ''
  for (let i = 0; i < buffer.length && buffer[i] === 0; i++) {
    result += '1'
  }

  for (let i = digits.length - 1; i >= 0; i--) {
    result += BASE58_CHARS[digits[i]]
  }

  return result
}

// Base58 decode
function base58Decode(input: string): Uint8Array {
  const cleanInput = input.replace(/[^1-9A-HJ-NP-Za-km-z]/g, '')
  const bytes = [0]

  for (let i = 0; i < cleanInput.length; i++) {
    const charIndex = BASE58_CHARS.indexOf(cleanInput[i])
    if (charIndex === -1) continue

    let carry = charIndex
    for (let j = 0; j < bytes.length; j++) {
      carry += bytes[j] * 58
      bytes[j] = carry & 0xff
      carry >>= 8
    }
    while (carry) {
      bytes.push(carry & 0xff)
      carry >>= 8
    }
  }

  let leadingZeros = 0
  for (let i = 0; i < cleanInput.length && cleanInput[i] === '1'; i++) {
    leadingZeros++
  }

  const result = new Uint8Array(bytes.length + leadingZeros)
  for (let i = 0; i < bytes.length; i++) {
    result[i + leadingZeros] = bytes[bytes.length - 1 - i]
  }

  return result
}

// Base62 encode
function base62Encode(buffer: Uint8Array): string {
  const digits = [0]
  for (let i = 0; i < buffer.length; i++) {
    let carry = buffer[i]
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8
      digits[j] = carry % 62
      carry = (carry / 62) | 0
    }
    while (carry) {
      digits.push(carry % 62)
      carry = (carry / 62) | 0
    }
  }

  let result = ''
  for (let i = 0; i < buffer.length && buffer[i] === 0; i++) {
    result += '0'
  }

  for (let i = digits.length - 1; i >= 0; i--) {
    result += BASE62_CHARS[digits[i]]
  }

  return result
}

// Base62 decode
function base62Decode(input: string): Uint8Array {
  const cleanInput = input.replace(/[^0-9A-Za-z]/g, '')
  const bytes = [0]

  for (let i = 0; i < cleanInput.length; i++) {
    const charIndex = BASE62_CHARS.indexOf(cleanInput[i])
    if (charIndex === -1) continue

    let carry = charIndex
    for (let j = 0; j < bytes.length; j++) {
      carry += bytes[j] * 62
      bytes[j] = carry & 0xff
      carry >>= 8
    }
    while (carry) {
      bytes.push(carry & 0xff)
      carry >>= 8
    }
  }

  let leadingZeros = 0
  for (let i = 0; i < cleanInput.length && cleanInput[i] === '0'; i++) {
    leadingZeros++
  }

  const result = new Uint8Array(bytes.length + leadingZeros)
  for (let i = 0; i < bytes.length; i++) {
    result[i + leadingZeros] = bytes[bytes.length - 1 - i]
  }

  return result
}

// Convert
function convert() {
  if (!inputText.value) {
    outputText.value = ''
    return
  }

  try {
    const bytes = decodeToBytes(inputText.value, inputEncoding.value)
    outputText.value = encodeFromBytes(bytes, outputEncoding.value)
  } catch (e: any) {
    outputText.value = '转换失败: ' + e.message
  }
}

// Paste from clipboard
async function pasteFromClipboard() {
  try {
    const text = await navigator.clipboard.readText()
    inputText.value = text
    convert()
  } catch (e) {
    alert('无法访问剪贴板，请手动粘贴')
  }
}

// Copy result
function copyResult() {
  navigator.clipboard.writeText(outputText.value)
}
</script>
