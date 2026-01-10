<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">HKDF密钥派生器 - HMAC密钥派生函数工具</h1>
      <p class="text-muted-foreground">基于RFC 5869标准的HMAC密钥派生函数，支持SHA-1/256/384/512哈希算法。纯本地计算，数据安全可靠。</p>
    </div>

    <!-- Browser Compatibility Warning -->
    <div v-if="!hkdfSupported" class="mb-6 p-4 bg-destructive/20 border border-destructive rounded-lg">
      <div class="flex items-start gap-3">
        <AlertTriangle class="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
        <div>
          <p class="font-medium text-destructive">浏览器不支持HKDF</p>
          <p class="text-sm text-destructive/80 mt-1">请使用最新版本的Chrome、Firefox、Safari或Edge浏览器。</p>
        </div>
      </div>
    </div>

    <!-- 工具交互区 -->
    <div class="grid lg:grid-cols-2 gap-6 mb-8">
      <!-- Input Configuration -->
      <div class="bg-card border border-border rounded-xl p-6">
        <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
          <Settings class="w-5 h-5 text-primary" />
          配置参数
        </h2>

        <!-- Hash Algorithm -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-foreground mb-2">哈希算法</label>
          <select v-model="hashAlgorithm" class="w-full px-4 py-2 border border-border rounded-lg bg-muted">
            <option value="SHA-1">SHA-1 (160位)</option>
            <option value="SHA-256">SHA-256 (256位) - 推荐</option>
            <option value="SHA-384">SHA-384 (384位)</option>
            <option value="SHA-512">SHA-512 (512位)</option>
          </select>
        </div>

        <!-- Input Keying Material (IKM) -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-foreground mb-2">输入密钥材料 (IKM)</label>
          <textarea
            v-model="ikmInput"
            rows="3"
            class="w-full px-4 py-2 border border-border rounded-lg bg-muted font-mono text-sm"
            placeholder="输入密钥材料，可以是密码、共享密钥等..."
          ></textarea>
          <div class="flex gap-2 mt-2">
            <button
              @click="ikmFormat = 'utf8'"
              :class="['px-3 py-1 text-sm rounded', ikmFormat === 'utf8' ? 'bg-primary text-primary-foreground' : 'bg-muted']"
            >
              UTF-8
            </button>
            <button
              @click="ikmFormat = 'hex'"
              :class="['px-3 py-1 text-sm rounded', ikmFormat === 'hex' ? 'bg-primary text-primary-foreground' : 'bg-muted']"
            >
              Hex
            </button>
            <button
              @click="ikmFormat = 'base64'"
              :class="['px-3 py-1 text-sm rounded', ikmFormat === 'base64' ? 'bg-primary text-primary-foreground' : 'bg-muted']"
            >
              Base64
            </button>
            <button
              @click="generateRandomIKM"
              class="ml-auto px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
            >
              <RefreshCw class="w-4 h-4 inline mr-1" />
              随机生成
            </button>
          </div>
        </div>

        <!-- Salt -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-foreground mb-2">
            盐值 (Salt)
            <span class="text-muted-foreground font-normal">- 可选</span>
          </label>
          <textarea
            v-model="saltInput"
            rows="2"
            class="w-full px-4 py-2 border border-border rounded-lg bg-muted font-mono text-sm"
            placeholder="可选盐值，建议使用随机值"
          ></textarea>
          <div class="flex gap-2 mt-2">
            <button
              @click="saltFormat = 'utf8'"
              :class="['px-3 py-1 text-sm rounded', saltFormat === 'utf8' ? 'bg-primary text-primary-foreground' : 'bg-muted']"
            >
              UTF-8
            </button>
            <button
              @click="saltFormat = 'hex'"
              :class="['px-3 py-1 text-sm rounded', saltFormat === 'hex' ? 'bg-primary text-primary-foreground' : 'bg-muted']"
            >
              Hex
            </button>
            <button
              @click="saltFormat = 'base64'"
              :class="['px-3 py-1 text-sm rounded', saltFormat === 'base64' ? 'bg-primary text-primary-foreground' : 'bg-muted']"
            >
              Base64
            </button>
            <button
              @click="generateRandomSalt"
              class="ml-auto px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
            >
              <RefreshCw class="w-4 h-4 inline mr-1" />
              随机生成
            </button>
          </div>
          <p class="text-xs text-muted-foreground mt-1">如果不提供盐值，将使用哈希算法输出的全零数组作为盐值</p>
        </div>

        <!-- Info -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-foreground mb-2">
            上下文信息 (Info)
            <span class="text-muted-foreground font-normal">- 可选</span>
          </label>
          <textarea
            v-model="infoInput"
            rows="2"
            class="w-full px-4 py-2 border border-border rounded-lg bg-muted font-mono text-sm"
            placeholder="可选的上下文信息，用于绑定密钥到特定应用场景"
          ></textarea>
          <div class="flex gap-2 mt-2">
            <button
              @click="infoFormat = 'utf8'"
              :class="['px-3 py-1 text-sm rounded', infoFormat === 'utf8' ? 'bg-primary text-primary-foreground' : 'bg-muted']"
            >
              UTF-8
            </button>
            <button
              @click="infoFormat = 'hex'"
              :class="['px-3 py-1 text-sm rounded', infoFormat === 'hex' ? 'bg-primary text-primary-foreground' : 'bg-muted']"
            >
              Hex
            </button>
            <button
              @click="infoFormat = 'base64'"
              :class="['px-3 py-1 text-sm rounded', infoFormat === 'base64' ? 'bg-primary text-primary-foreground' : 'bg-muted']"
            >
              Base64
            </button>
          </div>
        </div>

        <!-- Output Length -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-foreground mb-2">
            输出密钥长度: {{ outputLength }} 字节
          </label>
          <input
            v-model.number="outputLength"
            type="range"
            min="16"
            max="64"
            class="w-full"
          >
          <div class="flex justify-between text-xs text-muted-foreground">
            <span>16字节 (128位)</span>
            <span>64字节 (512位)</span>
          </div>
        </div>

        <!-- Output Format -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-foreground mb-2">输出格式</label>
          <div class="flex gap-2">
            <button
              @click="outputFormat = 'hex'"
              :class="['px-3 py-1 text-sm rounded', outputFormat === 'hex' ? 'bg-primary text-primary-foreground' : 'bg-muted']"
            >
              Hex
            </button>
            <button
              @click="outputFormat = 'base64'"
              :class="['px-3 py-1 text-sm rounded', outputFormat === 'base64' ? 'bg-primary text-primary-foreground' : 'bg-muted']"
            >
              Base64
            </button>
          </div>
        </div>

        <!-- Derive Button -->
        <button
          @click="deriveKey"
          :disabled="!hkdfSupported || deriving || !ikmInput"
          class="w-full py-3 bg-primary hover:bg-primary/90 disabled:bg-muted text-primary-foreground disabled:text-muted-foreground font-medium rounded-lg flex items-center justify-center gap-2"
        >
          <RefreshCw v-if="deriving" class="w-5 h-5 animate-spin" />
          <Key class="w-5 h-5" v-else />
          {{ deriving ? '派生中...' : '派生密钥' }}
        </button>
      </div>

      <!-- Result Output -->
      <div class="bg-card border border-border rounded-xl p-6">
        <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
          <Key class="w-5 h-5 text-green-600" />
          派生结果
        </h2>

        <div v-if="result" class="space-y-4">
          <!-- Derived Key -->
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">派生密钥 (OKM)</label>
            <div class="relative">
              <pre class="bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono break-all">{{ result.outputKey }}</pre>
              <button
                @click="copyResult(result.outputKey)"
                class="absolute top-2 right-2 p-2 bg-muted hover:bg-muted/80 rounded"
                title="复制"
              >
                <Copy class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- PRK (Extract result) -->
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">伪随机密钥 (PRK) - Extract阶段输出</label>
            <div class="relative">
              <pre class="bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono break-all">{{ result.prk }}</pre>
              <button
                @click="copyResult(result.prk)"
                class="absolute top-2 right-2 p-2 bg-muted hover:bg-muted/80 rounded"
                title="复制"
              >
                <Copy class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Result Info -->
          <div class="bg-primary/10 rounded-lg p-4">
            <h3 class="font-medium text-primary mb-2">派生信息</h3>
            <div class="text-sm text-foreground space-y-1">
              <p>哈希算法: {{ hashAlgorithm }}</p>
              <p>IKM长度: {{ result.ikmLength }} 字节</p>
              <p>Salt长度: {{ result.saltLength }} 字节</p>
              <p>Info长度: {{ result.infoLength }} 字节</p>
              <p>输出长度: {{ outputLength }} 字节 ({{ outputLength * 8 }} 位)</p>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-12 text-muted-foreground">
          <Key class="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>配置参数后点击"派生密钥"按钮</p>
        </div>
      </div>
    </div>

    <!-- Batch Derivation -->
    <div class="bg-card border border-border rounded-xl p-6 mb-8">
      <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
        <List class="w-5 h-5 text-purple-600" />
        批量派生
      </h2>
      <p class="text-sm text-muted-foreground mb-4">从同一密钥材料派生多个不同的密钥（使用不同的Info值）</p>

      <div class="grid md:grid-cols-2 gap-4 mb-4">
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">基础IKM</label>
          <textarea
            v-model="batchIkm"
            rows="2"
            class="w-full px-4 py-2 border border-border rounded-lg bg-muted font-mono text-sm"
            placeholder="主密钥材料"
          ></textarea>
        </div>
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">Info前缀（每行一个）</label>
          <textarea
            v-model="batchInfo"
            rows="2"
            class="w-full px-4 py-2 border border-border rounded-lg bg-muted font-mono text-sm"
            placeholder="encryption_key&#10;authentication_key&#10;encryption_key"
          ></textarea>
        </div>
      </div>

      <button
        @click="batchDerive"
        :disabled="!hkdfSupported || batchDeriving || !batchIkm || !batchInfo"
        class="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-muted text-white disabled:text-muted-foreground rounded-lg mb-4"
      >
        {{ batchDeriving ? '派生中...' : '批量派生' }}
      </button>

      <div v-if="batchResults.length > 0" class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-muted">
            <tr>
              <th class="px-4 py-2 text-left text-foreground">Info</th>
              <th class="px-4 py-2 text-left text-foreground">派生密钥 (Hex)</th>
              <th class="px-4 py-2 text-left text-foreground">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in batchResults" :key="index" class="border-t border-border">
              <td class="px-4 py-2 font-mono text-xs">{{ item.info }}</td>
              <td class="px-4 py-2 font-mono text-xs break-all">{{ item.key }}</td>
              <td class="px-4 py-2">
                <button @click="copyResult(item.key)" class="text-primary hover:text-primary/80">
                  <Copy class="w-4 h-4" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
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
          什么是HKDF?
        </h2>
        <p class="text-muted-foreground mb-4">
          HKDF (HMAC-based Key Derivation Function) 是基于HMAC的密钥派生函数，由Hugo Krawczyk提出，定义在RFC 5869中。
          它从不安全或不够安全的输入密钥材料(IKM)派生出加密安全的密钥，广泛应用于TLS 1.3、IPsec、SSH等安全协议中。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          HKDF的两个阶段
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>Extract:</strong> 从IKM和可选的salt派生一个固定长度的伪随机密钥(PRK)</li>
          <li><strong>Expand:</strong> 从PRK和可选的info派生任意长度的输出密钥材料(OKM)</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          典型用途
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li>TLS 1.3中的密钥派生</li>
          <li>从共享密钥派生多个密钥（加密密钥、MAC密钥、IV等）</li>
          <li>IPsec中的密钥派生</li>
          <li>Signal协议的Double Ratchet</li>
          <li>SSH密钥交换</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          安全建议
        </h2>
        <div class="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
          <ul class="text-sm text-muted-foreground space-y-1">
            <li>• 始终使用随机salt值</li>
            <li>• 使用SHA-256或更强的哈希算法</li>
            <li>• Info参数应该是应用特定的且唯一</li>
            <li>• 输出长度不应超过255×哈希输出长度</li>
          </ul>
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
import { ref, onMounted } from 'vue'
import {
  Settings,
  Key,
  RefreshCw,
  Copy,
  List,
  AlertTriangle,
  Shield,
  FileSignature,
  HelpCircle,
  ChevronUp
} from 'lucide-vue-next'
import { tools } from '~/data/tools'

// SEO配置
useSeoMeta({
  title: 'HKDF密钥派生器 - 在线HMAC密钥派生函数工具',
  description: '在线HKDF密钥派生工具，基于RFC 5869标准的HMAC密钥派生函数。支持SHA-1/256/384/512，Extract和Expand两阶段派生，适用于TLS 1.3、密钥材料派生等场景。',
  keywords: 'HKDF,密钥派生,HMAC,RFC 5869,TLS 1.3,Extract,Expand,在线工具,密钥派生函数',
  author: 'Util工具箱',
  ogTitle: 'HKDF密钥派生器 - 在线HMAC密钥派生工具',
  ogDescription: '基于RFC 5869标准的HKDF密钥派生工具，支持SHA-1/256/384/512，纯本地计算，数据安全可靠。',
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
            name: 'HKDF密钥派生器',
            description: '基于RFC 5869的在线HMAC密钥派生工具',
            url: 'https://www.util.cn/tools/hkdf-generator',
            applicationCategory: 'SecurityApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              'HKDF密钥派生',
              'SHA-1/256/384/512支持',
              'Extract和Expand阶段',
              '批量密钥派生',
              '本地安全处理',
              '多种输入输出格式'
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
                name: 'HKDF密钥派生器',
                item: 'https://www.util.cn/tools/hkdf-generator'
              }
            ]
          }
        ]
      })
    }
  ]
})

// State
const hashAlgorithm = ref('SHA-256')
const ikmInput = ref('')
const ikmFormat = ref('utf8')
const saltInput = ref('')
const saltFormat = ref('hex')
const infoInput = ref('')
const infoFormat = ref('utf8')
const outputLength = ref(32)
const outputFormat = ref('hex')
const deriving = ref(false)
const result = ref(null)
const hkdfSupported = ref(true)

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// Batch derivation state
const batchIkm = ref('')
const batchInfo = ref('')
const batchDeriving = ref(false)
const batchResults = ref([])

// Check browser support
onMounted(() => {
  hkdfSupported.value = !!crypto.subtle.deriveBits
})

// 图标映射
const iconMap = {
  Shield, FileSignature
}

// 相关工具
const relatedTools = [
  tools.find(t => t.id === 'pbkdf2-generator'),
  tools.find(t => t.id === 'scrypt-generator'),
  tools.find(t => t.id === 'hmac-generator'),
  tools.find(t => t.id === 'aes-encrypt')
].filter(Boolean)

// Convert input string to bytes based on format
function inputToBytes(input, format) {
  if (!input) return new Uint8Array(0)

  switch (format) {
    case 'hex':
      return new Uint8Array(
        input.match(/[\da-fA-F]{2}/g)?.map(byte => parseInt(byte, 16)) || []
      )
    case 'base64':
      const binaryString = atob(input)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      return bytes
    default: // utf8
      return new TextEncoder().encode(input)
  }
}

// Convert bytes to output format
function bytesToOutput(bytes, format) {
  switch (format) {
    case 'hex':
      return Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
    case 'base64':
      return btoa(String.fromCharCode(...bytes))
    default:
      return new TextDecoder().decode(bytes)
  }
}

// Generate random IKM
function generateRandomIKM() {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  ikmInput.value = bytesToOutput(bytes, 'hex')
  ikmFormat.value = 'hex'
}

// Generate random salt
function generateRandomSalt() {
  const hashLength = { 'SHA-1': 20, 'SHA-256': 32, 'SHA-384': 48, 'SHA-512': 64 }
  const bytes = new Uint8Array(hashLength[hashAlgorithm.value])
  crypto.getRandomValues(bytes)
  saltInput.value = bytesToOutput(bytes, 'hex')
  saltFormat.value = 'hex'
}

// Main derive function
async function deriveKey() {
  if (!hkdfSupported.value || !ikmInput.value) return

  deriving.value = true
  result.value = null

  try {
    const ikm = inputToBytes(ikmInput.value, ikmFormat.value)
    let salt = inputToBytes(saltInput.value, saltFormat.value)
    const info = inputToBytes(infoInput.value, infoFormat.value)

    // If no salt provided, use zero bytes of hash length
    const hashLength = { 'SHA-1': 20, 'SHA-256': 32, 'SHA-384': 48, 'SHA-512': 64 }
    if (salt.length === 0) {
      salt = new Uint8Array(hashLength[hashAlgorithm.value])
    }

    // Import IKM as a key
    const baseKey = await crypto.subtle.importKey(
      'raw',
      ikm,
      'HKDF',
      false,
      ['deriveBits']
    )

    // Derive the key material
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'HKDF',
        hash: hashAlgorithm.value,
        salt: salt,
        info: info
      },
      baseKey,
      outputLength.value * 8
    )

    const okm = new Uint8Array(derivedBits)

    // Calculate PRK separately (Extract phase)
    const saltKey = await crypto.subtle.importKey(
      'raw',
      salt,
      { name: 'HMAC', hash: hashAlgorithm.value },
      false,
      ['sign']
    )
    const prkBits = await crypto.subtle.sign('HMAC', saltKey, ikm)
    const prk = new Uint8Array(prkBits)

    result.value = {
      outputKey: bytesToOutput(okm, outputFormat.value),
      prk: bytesToOutput(prk, 'hex'),
      ikmLength: ikm.length,
      saltLength: salt.length,
      infoLength: info.length
    }
  } catch (e) {
    alert('派生失败: ' + e.message)
  } finally {
    deriving.value = false
  }
}

// Batch derive
async function batchDerive() {
  if (!hkdfSupported.value || !batchIkm.value || !batchInfo.value) return

  batchDeriving.value = true
  batchResults.value = []

  try {
    const ikm = inputToBytes(batchIkm.value, 'utf8')
    const infos = batchInfo.value.split('\n').filter(line => line.trim())

    // Generate random salt
    const hashLength = { 'SHA-1': 20, 'SHA-256': 32, 'SHA-384': 48, 'SHA-512': 64 }
    const salt = new Uint8Array(hashLength[hashAlgorithm.value])
    crypto.getRandomValues(salt)

    // Import IKM as a key
    const baseKey = await crypto.subtle.importKey(
      'raw',
      ikm,
      'HKDF',
      false,
      ['deriveBits']
    )

    for (const info of infos) {
      const infoBytes = new TextEncoder().encode(info)

      const derivedBits = await crypto.subtle.deriveBits(
        {
          name: 'HKDF',
          hash: hashAlgorithm.value,
          salt: salt,
          info: infoBytes
        },
        baseKey,
        32 * 8 // 32 bytes
      )

      const okm = new Uint8Array(derivedBits)
      batchResults.value.push({
        info: info,
        key: bytesToOutput(okm, 'hex')
      })
    }
  } catch (e) {
    alert('批量派生失败: ' + e.message)
  } finally {
    batchDeriving.value = false
  }
}

// Copy result to clipboard
function copyResult(text) {
  navigator.clipboard.writeText(text)
}

// 切换SEO内容显示状态
function toggleSeoContent() {
  isSeoContentVisible.value = !isSeoContentVisible.value
}
</script>
