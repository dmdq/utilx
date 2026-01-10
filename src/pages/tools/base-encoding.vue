<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">多编码转换工具 - Base32/Base58/Base62编码转换</h1>
      <p class="text-muted-foreground">支持Base32、Base58、Base62等多种编码格式的相互转换。适用于比特币地址、URL短链、OTP密钥等场景，纯本地计算，数据安全隐私。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 输入区域 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">输入</label>
          <div class="flex gap-2">
            <button
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              @click="pasteFromClipboard"
            >
              粘贴
            </button>
            <button
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              @click="inputText = ''; convert()"
            >
              清空
            </button>
          </div>
        </div>
        <div class="mb-3">
          <label class="text-xs text-muted-foreground">输入编码格式</label>
          <select v-model="inputEncoding" class="w-full px-3 py-2 bg-muted border border-border rounded text-sm mt-1">
            <option value="utf8">UTF-8 文本</option>
            <option value="base16">Base16 (Hex)</option>
            <option value="base32">Base32</option>
            <option value="base58">Base58 (Bitcoin)</option>
            <option value="base62">Base62</option>
            <option value="base64">Base64</option>
          </select>
        </div>
        <textarea
          v-model="inputText"
          class="flex-1 w-full min-h-[300px] p-4 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono text-sm"
          placeholder="输入要转换的内容..."
          @input="convert"
        ></textarea>
        <div class="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>长度: {{ inputLength }} 字节</span>
        </div>
      </div>

      <!-- 输出区域 -->
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-foreground">输出</label>
          <div class="flex gap-2">
            <button
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
              @click="copyResult"
            >
              复制
            </button>
          </div>
        </div>
        <div class="mb-3">
          <label class="text-xs text-muted-foreground">输出编码格式</label>
          <select v-model="outputEncoding" class="w-full px-3 py-2 bg-muted border border-border rounded text-sm mt-1">
            <option value="utf8">UTF-8 文本</option>
            <option value="base16">Base16 (Hex)</option>
            <option value="base32">Base32</option>
            <option value="base58">Base58 (Bitcoin)</option>
            <option value="base62">Base62</option>
            <option value="base64">Base64</option>
          </select>
        </div>
        <div class="flex-1 w-full min-h-[300px] p-4 bg-muted border border-border rounded-lg overflow-auto">
          <pre v-if="outputText" class="font-mono text-sm whitespace-pre-wrap break-all">{{ outputText }}</pre>
          <div v-else class="text-muted-foreground text-center">转换结果将显示在这里</div>
        </div>
        <div class="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>输出长度: {{ outputLength }} 字节</span>
        </div>
      </div>
    </div>

    <!-- 快速转换按钮 -->
    <div class="flex justify-center gap-2 mb-12 flex-wrap">
      <button
        v-for="enc in encodings"
        :key="enc.value"
        @click="outputEncoding = enc.value; convert()"
        :class="['px-4 py-2 text-sm rounded', outputEncoding === enc.value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground']"
      >
        转换为 {{ enc.label }}
      </button>
    </div>

    <!-- SEO 内容长尾区 -->
    <div class="p-6 mb-12 relative">
      <!-- 折叠按钮 -->
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        :title="isSeoContentVisible ? '折叠内容' : '展开内容'"
      >
        <HelpCircle v-if="!isSeoContentVisible" class="w-5 h-5" />
        <ChevronUp v-else class="w-5 h-5" />
      </button>

      <!-- 内容区域 -->
      <div v-show="isSeoContentVisible">
        <h2 class="text-2xl font-bold text-foreground mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          编码说明
        </h2>

        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div class="border border-border rounded-lg p-4 bg-card">
            <h3 class="font-medium text-foreground mb-2">Base16 (Hex)</h3>
            <p class="text-sm text-muted-foreground mb-2">使用0-9和A-F表示数据，每个字节用2个字符表示</p>
            <div class="text-xs font-mono bg-muted p-2 rounded">示例: "48656C6C6F" = "Hello"</div>
          </div>
          <div class="border border-border rounded-lg p-4 bg-card">
            <h3 class="font-medium text-foreground mb-2">Base32</h3>
            <p class="text-sm text-muted-foreground mb-2">使用A-Z和2-7表示数据，不区分大小写，常用于OTP密钥</p>
            <div class="text-xs font-mono bg-muted p-2 rounded">示例: "JBSWY3DPEBLW64TMMQ" = "Hello"</div>
          </div>
          <div class="border border-border rounded-lg p-4 bg-card">
            <h3 class="font-medium text-foreground mb-2">Base58</h3>
            <p class="text-sm text-muted-foreground mb-2">排除0OIl等易混淆字符，用于比特币地址</p>
            <div class="text-xs font-mono bg-muted p-2 rounded">字符集: 123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz</div>
          </div>
          <div class="border border-border rounded-lg p-4 bg-card">
            <h3 class="font-medium text-foreground mb-2">Base62</h3>
            <p class="text-sm text-muted-foreground mb-2">使用0-9、A-Z、a-z，用于URL短链、ID编码</p>
            <div class="text-xs font-mono bg-muted p-2 rounded">示例: "t8DgcJ" = 123456789</div>
          </div>
          <div class="border border-border rounded-lg p-4 bg-card">
            <h3 class="font-medium text-foreground mb-2">Base64</h3>
            <p class="text-sm text-muted-foreground mb-2">使用A-Z、a-z、0-9和+/，用于电子邮件、MIME</p>
            <div class="text-xs font-mono bg-muted p-2 rounded">示例: "SGVsbG8=" = "Hello"</div>
          </div>
          <div class="border border-border rounded-lg p-4 bg-card">
            <h3 class="font-medium text-foreground mb-2">UTF-8</h3>
            <p class="text-sm text-muted-foreground mb-2">通用字符编码，支持多语言文本</p>
            <div class="text-xs font-mono bg-muted p-2 rounded">示例: "你好" = E4BDA0E5A5BD</div>
          </div>
        </div>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          应用场景
        </h2>
        <div class="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground mb-6">
          <div>
            <h3 class="font-medium text-foreground mb-2">Base16/Hex</h3>
            <ul class="list-disc list-inside space-y-1">
              <li>显示二进制数据</li>
              <li>颜色值 (RGB)</li>
              <li>MAC地址</li>
              <li>内存地址</li>
            </ul>
          </div>
          <div>
            <h3 class="font-medium text-foreground mb-2">Base32</h3>
            <ul class="list-disc list-inside space-y-1">
              <li>TOTP/HOTP密钥</li>
              <li>Google Authenticator</li>
              <li>DNSSEC</li>
              <li>不区分大小写的场景</li>
            </ul>
          </div>
          <div>
            <h3 class="font-medium text-foreground mb-2">Base58</h3>
            <ul class="list-disc list-inside space-y-1">
              <li>比特币地址</li>
              <li>IPFS CID</li>
              <li>避免视觉混淆</li>
            </ul>
          </div>
          <div>
            <h3 class="font-medium text-foreground mb-2">Base62</h3>
            <ul class="list-disc list-inside space-y-1">
              <li>URL短链</li>
              <li>YouTube视频ID</li>
              <li>数据库ID编码</li>
            </ul>
          </div>
        </div>
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
import { ref, computed } from 'vue'
import { HelpCircle, ChevronUp } from 'lucide-vue-next'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'

// SEO配置
useSeoMeta({
  title: '多编码转换工具 - 在线Base32/Base58/Base62编码转换 | Util工具箱',
  description: '在线多编码转换工具，支持Base32、Base58、Base62与Hex、Base64、UTF-8等多种编码格式互转。适用于比特币地址、URL短链、OTP密钥等场景，纯前端处理。',
  keywords: 'Base32编码,Base58编码,Base62编码,编码转换,比特币编码,URL短链,在线编码工具,Base58解码',
  author: 'Util工具箱',
  ogTitle: '多编码转换工具 - Base32/Base58/Base62',
  ogDescription: '支持Base32、Base58、Base62等多种编码格式的相互转换',
  ogType: 'website'
})

// JSON-LD 结构化数据
useHead({
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebApplication',
            name: '多编码转换工具',
            description: '在线Base32/Base58/Base62编码转换工具',
            url: 'https://www.util.cn/tools/base-encoding',
            applicationCategory: 'DeveloperApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              'Base32编码转换',
              'Base58编码转换',
              'Base62编码转换',
              'Base16/Hex转换',
              'Base64编码转换',
              'UTF-8文本转换',
              '批量转换'
            ]
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: '首页',
                item: 'https://www.util.cn'
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: '工具',
                item: 'https://www.util.cn/tools'
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: '多编码转换',
                item: 'https://www.util.cn/tools/base-encoding'
              }
            ]
          }
        ]
      })
    }
  ]
})

// 定义当前工具
const tool = tools.find(t => t.id === 'base-encoding')

// State
const inputEncoding = ref('utf8')
const outputEncoding = ref('base64')
const inputText = ref('')
const outputText = ref('')

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

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

// 图标映射
const iconMap = {
  Hash: computed(() => Hash),
  Link: computed(() => Link),
  Clock: computed(() => Clock)
}

// 相关工具
const relatedTools = computed(() => {
  const recommended = [
    tools.find(t => t.id === 'base64-encode'),
    tools.find(t => t.id === 'hex-convert'),
    tools.find(t => t.id === 'url-encode'),
    tools.find(t => t.id === 'otp-generator')
  ].filter(Boolean)

  return recommended.slice(0, 4)
})

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
function decodeToBytes(input, encoding) {
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
function encodeFromBytes(bytes, encoding) {
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

// Base32 decode
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

// Base58 encode (Bitcoin style)
function base58Encode(buffer) {
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
function base58Decode(input) {
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
function base62Encode(buffer) {
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
function base62Decode(input) {
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
  } catch (e) {
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
  if (!outputText.value) return
  navigator.clipboard.writeText(outputText.value)
}

// 切换SEO内容显示状态
function toggleSeoContent() {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

// 添加到最近使用
if (tool) {
  addRecentTool(tool.id)
}
</script>
