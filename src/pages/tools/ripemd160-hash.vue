<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">RIPEMD-160哈希计算器</h1>
      <p class="text-gray-600 dark:text-gray-400">160位加密哈希函数，主要用于比特币地址生成和OpenPGP</p>
    </div>

    <!-- Implementation Warning -->
    <div class="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
      <div class="flex items-start gap-3">
        <Info class="w-5 h-5 text-blue-600 dark:text-blue-500 mt-0.5 flex-shrink-0" />
        <div>
          <p class="font-medium text-blue-800 dark:text-blue-300">关于RIPEMD-160实现</p>
          <p class="text-sm text-blue-700 dark:text-blue-400 mt-1">
            RIPEMD-160不在Web Crypto API标准中，本工具使用JavaScript纯实现。
            本工具主要用于教育目的和兼容性需求，新项目建议使用SHA-256或BLAKE2。
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
            rows="8"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 font-mono text-sm"
            :placeholder="inputPlaceholder"
            @input="calculateHash"
          ></textarea>
          <div class="mt-2 flex justify-between">
            <span class="text-sm text-gray-500">长度: {{ inputLength }} 字节</span>
            <button
              @click="clearInput"
              class="text-sm text-red-500 hover:text-red-700"
            >
              清空
            </button>
          </div>
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
          :disabled="!inputText || calculating"
          class="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium rounded-lg flex items-center justify-center gap-2"
        >
          <RefreshCw v-if="calculating" class="w-5 h-5 animate-spin" />
          <Hash class="w-5 h-5" v-else />
          {{ calculating ? '计算中...' : '计算哈希值' }}
        </button>

        <!-- Sample Inputs -->
        <div class="mt-4 pt-4 border-t">
          <p class="text-sm font-medium mb-2">示例输入：</p>
          <div class="flex flex-wrap gap-2">
            <button
              @click="inputText = 'Hello, World!'; calculateHash()"
              class="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
            >
              Hello, World!
            </button>
            <button
              @click="inputText = 'The quick brown fox jumps over the lazy dog'; calculateHash()"
              class="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
            >
              英文测试
            </button>
            <button
              @click="inputText = 'RIPEMD-160哈希测试'; calculateHash()"
              class="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
            >
              中文测试
            </button>
            <button
              @click="inputText = ''; calculateHash()"
              class="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
            >
              空字符串
            </button>
          </div>
        </div>
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
            <label class="block text-sm font-medium mb-2">RIPEMD-160 哈希值</label>
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
              <p>算法: RIPEMD-160</p>
              <p>输出长度: 160 位 (20 字节)</p>
              <p>输入长度: {{ inputLength }} 字节</p>
            </div>
          </div>

          <!-- Quick Compare -->
          <div class="border-t pt-4">
            <h3 class="font-medium mb-2">哈希对比</h3>
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

          <!-- File Hash -->
          <div class="border-t pt-4">
            <h3 class="font-medium mb-2">文件哈希</h3>
            <input
              type="file"
              @change="handleFile"
              class="hidden"
              ref="fileInput"
            >
            <button
              @click="selectFile"
              class="w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition"
            >
              <Upload class="w-5 h-5 inline mr-2" />
              选择文件计算哈希
            </button>
            <p v-if="fileName" class="text-sm text-gray-500 mt-2">
              文件: {{ fileName }} ({{ fileSize }} 字节)
            </p>
          </div>
        </div>

        <div v-else class="text-center py-12 text-gray-500">
          <Hash class="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>输入内容后点击"计算哈希值"</p>
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
        :disabled="!batchInput || batchProcessing"
        class="px-6 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white rounded-lg mb-4"
      >
        {{ batchProcessing ? '计算中...' : '批量计算' }}
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
        关于RIPEMD-160
      </h2>

      <div class="space-y-4 text-sm text-gray-700 dark:text-gray-300">
        <div>
          <h3 class="font-semibold mb-2">什么是RIPEMD-160?</h3>
          <p>RIPEMD-160 (RACE Integrity Primitives Evaluation Message Digest) 是一种160位加密哈希函数，由Hans Dobbertin、Antoon Bosselaers和Bart Preneel在1996年开发。它是RIPEMD的改进版本，设计用于修复原RIPEMD中的安全漏洞。</p>
        </div>

        <div>
          <h3 class="font-semibold mb-2">技术特点</h3>
          <ul class="list-disc list-inside space-y-1 ml-4">
            <li><strong>输出长度:</strong> 160位 (20字节)</li>
            <li><strong>块大小:</strong> 512位 (64字节)</li>
            <li><strong>结构:</strong> 双分支并行结构，不同于MD5/SHA-1的单分支</li>
            <li><strong>轮数:</strong> 5轮，每轮16步</li>
            <li><strong>速度:</strong> 比SHA-256稍慢，但比SHA-1快</li>
          </ul>
        </div>

        <div>
          <h3 class="font-semibold mb-2">主要应用</h3>
          <ul class="list-disc list-inside space-y-1 ml-4">
            <li><strong>比特币:</strong> 用于生成比特币地址 (SHA-256 → RIPEMD-160)</li>
            <li><strong>OpenPGP:</strong> 作为指纹生成算法之一</li>
            <li><strong>文件校验:</strong> 一些Linux发行版用于ISO校验</li>
            <li><strong>密码存储:</strong> 某些旧系统使用</li>
          </ul>
        </div>

        <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p class="font-medium text-yellow-800 dark:text-yellow-300 mb-2">安全建议</p>
          <ul class="text-sm text-yellow-700 dark:text-yellow-400 space-y-1">
            <li>• RIPEMD-160被认为比SHA-1更安全，但不如SHA-256</li>
            <li>• 新项目不建议使用，首选SHA-256或BLAKE2</li>
            <li>• 比特币等特定系统需要RIPEMD-160兼容性</li>
            <li>• RIPEMD-160目前没有已知的实际碰撞攻击</li>
          </ul>
        </div>

        <div>
          <h3 class="font-semibold mb-2">RIPEMD-160 vs 其他哈希算法</h3>
          <div class="overflow-x-auto">
            <table class="w-full text-xs">
              <thead class="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th class="px-4 py-2 text-left">算法</th>
                  <th class="px-4 py-2 text-left">输出长度</th>
                  <th class="px-4 py-2 text-left">安全性</th>
                  <th class="px-4 py-2 text-left">速度</th>
                  <th class="px-4 py-2 text-left">状态</th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-t dark:border-gray-700">
                  <td class="px-4 py-2">RIPEMD-160</td>
                  <td class="px-4 py-2">160位</td>
                  <td class="px-4 py-2">中等</td>
                  <td class="px-4 py-2">中</td>
                  <td class="px-4 py-2">安全但过时</td>
                </tr>
                <tr class="border-t dark:border-gray-700">
                  <td class="px-4 py-2">SHA-1</td>
                  <td class="px-4 py-2">160位</td>
                  <td class="px-4 py-2">低</td>
                  <td class="px-4 py-2">快</td>
                  <td class="px-4 py-2 text-red-500">已破解</td>
                </tr>
                <tr class="border-t dark:border-gray-700">
                  <td class="px-4 py-2">SHA-256</td>
                  <td class="px-4 py-2">256位</td>
                  <td class="px-4 py-2">高</td>
                  <td class="px-4 py-2">快</td>
                  <td class="px-4 py-2 text-green-500">推荐</td>
                </tr>
                <tr class="border-t dark:border-gray-700">
                  <td class="px-4 py-2">BLAKE2b</td>
                  <td class="px-4 py-2">512位</td>
                  <td class="px-4 py-2">很高</td>
                  <td class="px-4 py-2">很快</td>
                  <td class="px-4 py-2 text-green-500">推荐</td>
                </tr>
              </tbody>
            </table>
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
        <NuxtLink to="/tools/blake2-hash" class="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <Hash class="w-8 h-8 text-green-500 mb-2" />
          <h3 class="font-medium">BLAKE2</h3>
          <p class="text-sm text-gray-500">高性能哈希</p>
        </NuxtLink>
        <NuxtLink to="/tools/hmac-generator" class="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <FileSignature class="w-8 h-8 text-purple-500 mb-2" />
          <h3 class="font-medium">HMAC</h3>
          <p class="text-sm text-gray-500">消息认证码</p>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  FileText,
  Hash,
  Copy,
  List,
  Info,
  Shield,
  FileSignature,
  RefreshCw,
  Upload
} from 'lucide-vue-next'

// SEO配置
useHead({
  title: 'RIPEMD-160哈希计算器 - 在线160位加密哈希工具',
  meta: [
    {
      name: 'description',
      content: '在线RIPEMD-160哈希计算工具，160位加密哈希函数。主要用于比特币地址生成、OpenPGP指纹计算等场景，比SHA-1更安全但不如SHA-256。'
    },
    {
      name: 'keywords',
      content: 'RIPEMD-160,RIPEMD,哈希计算,比特币地址,OpenPGP,加密哈希,在线哈希工具'
    }
  ]
})

// State
const inputMode = ref('text')
const inputText = ref('')
const outputFormat = ref('hex')
const hashResult = ref('')
const calculating = ref(false)
const compareHash = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const fileName = ref('')
const fileSize = ref(0)

// Batch state
const batchInput = ref('')
const batchProcessing = ref(false)
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

// Simple RIPEMD-160 implementation
// This is a JavaScript implementation of RIPEMD-160
function ripemd160(data: Uint8Array): Uint8Array {
  // RIPEMD-160 implementation
  // Based on the algorithm specification

  // Convert to 32-bit words (little-endian)
  const words: number[] = []
  for (let i = 0; i < data.length; i += 4) {
    const word =
      (data[i] || 0) |
      ((data[i + 1] || 0) << 8) |
      ((data[i + 2] || 0) << 16) |
      ((data[i + 3] || 0) << 24)
    words.push(word >>> 0)
  }

  // Padding
  const msgLen = data.length * 8
  words.push(0x80) // Append 1 bit

  // Pad with zeros
  while ((words.length % 16) !== 14) {
    words.push(0)
  }

  // Append length (in bits)
  words.push(msgLen >>> 0)
  words.push((msgLen / 0x100000000) >>> 0)

  // Initial values
  let h0 = 0x67452301
  let h1 = 0xEFCDAB89
  let h2 = 0x98BADCFE
  let h3 = 0x10325476
  let h4 = 0xC3D2E1F0

  // Process message in 16-word blocks
  for (let i = 0; i < words.length; i += 16) {
    const block = words.slice(i, i + 16)

    // Left branch
    let al = h0, bl = h1, cl = h2, dl = h3, el = h4
    // Right branch
    let ar = h0, br = h1, cr = h2, dr = h3, er = h4

    // Round functions and constants
    const f = (x: number, y: number, z: number) => x ^ y ^ z
    const g = (x: number, y: number, z: number) => (x & y) | (~x & z)
    const h = (x: number, y: number, z: number) => (x | ~y) ^ z
    const i_ = (x: number, y: number, z: number) => (x & z) | (y & ~z)
    const j = (x: number, y: number, z: number) => x ^ (y | ~z)

    // Left rounds
    const rl = [
      [0, 11, 0], [1, 14, 0], [2, 15, 0], [3, 12, 0], [4, 5, 0], [5, 8, 0], [6, 7, 0], [7, 9, 0],
      [8, 11, 1], [9, 14, 1], [10, 15, 1], [11, 12, 1], [12, 5, 1], [13, 8, 1], [14, 7, 1], [15, 9, 1],
      [7, 7, 2], [4, 6, 2], [13, 8, 2], [1, 13, 2], [10, 11, 2], [6, 9, 2], [15, 7, 2], [3, 15, 2],
      [12, 7, 3], [1, 6, 3], [14, 8, 3], [6, 13, 3], [11, 11, 3], [5, 9, 3], [0, 7, 3], [15, 15, 3],
      [5, 9, 4], [0, 7, 4], [14, 15, 4], [7, 11, 4], [10, 8, 4], [12, 6, 4], [1, 13, 4], [3, 11, 4]
    ]

    // Right rounds
    const rr = [
      [5, 8, 0], [14, 9, 0], [7, 9, 0], [0, 11, 0], [9, 13, 0], [2, 15, 0], [11, 15, 0], [4, 5, 0],
      [13, 7, 1], [6, 7, 1], [1, 8, 1], [10, 11, 1], [3, 14, 1], [12, 14, 1], [15, 12, 1], [9, 6, 1],
      [11, 9, 2], [8, 13, 2], [12, 15, 2], [0, 7, 2], [5, 11, 2], [2, 7, 2], [15, 12, 2], [13, 7, 2],
      [1, 11, 3], [14, 13, 3], [3, 6, 3], [7, 7, 3], [9, 14, 3], [5, 9, 3], [10, 9, 3], [12, 13, 3],
      [4, 15, 4], [0, 12, 4], [15, 5, 4], [8, 8, 4], [6, 8, 4], [2, 8, 4], [13, 11, 4], [11, 6, 4]
    ]

    const kl = [0x00000000, 0x5A827999, 0x6ED9EBA1, 0x8F1BBCDC, 0xA953FD4E]
    const kr = [0x50A28BE6, 0x5C4DD124, 0x6D703EF3, 0x7A6D76E9, 0x00000000]

    for (let r = 0; r < 80; r++) {
      let wl: number, wr: number

      if (r < 16) {
        const [idx, s, _] = rl[r]
        const temp = (al + f(bl, cl, dl) + block[idx] + kl[0]) >>> 0
        wl = (rotateLeft(temp, s) + el) >>> 0
        al = el; el = dl; dl = rotateLeft(cl, 10); cl = bl; bl = wl

        const [ridx, rs, __] = rr[r]
        const rtemp = (ar + i_(br, cr, dr) + block[ridx] + kr[0]) >>> 0
        wr = (rotateLeft(rtemp, rs) + er) >>> 0
        ar = er; er = dr; dr = rotateLeft(cr, 10); cr = br; br = wr
      } else if (r < 32) {
        const [idx, s, _] = rl[r]
        const temp = (al + g(bl, cl, dl) + block[idx] + kl[1]) >>> 0
        wl = (rotateLeft(temp, s) + el) >>> 0
        al = el; el = dl; dl = rotateLeft(cl, 10); cl = bl; bl = wl

        const [ridx, rs, __] = rr[r]
        const rtemp = (ar + h(br, cr, dr) + block[ridx] + kr[1]) >>> 0
        wr = (rotateLeft(rtemp, rs) + er) >>> 0
        ar = er; er = dr; dr = rotateLeft(cr, 10); cr = br; br = wr
      } else if (r < 48) {
        const [idx, s, _] = rl[r]
        const temp = (al + h(bl, cl, dl) + block[idx] + kl[2]) >>> 0
        wl = (rotateLeft(temp, s) + el) >>> 0
        al = el; el = dl; dl = rotateLeft(cl, 10); cl = bl; bl = wl

        const [ridx, rs, __] = rr[r]
        const rtemp = (ar + g(br, cr, dr) + block[ridx] + kr[2]) >>> 0
        wr = (rotateLeft(rtemp, rs) + er) >>> 0
        ar = er; er = dr; dr = rotateLeft(cr, 10); cr = br; br = wr
      } else if (r < 64) {
        const [idx, s, _] = rl[r]
        const temp = (al + i_(bl, cl, dl) + block[idx] + kl[3]) >>> 0
        wl = (rotateLeft(temp, s) + el) >>> 0
        al = el; el = dl; dl = rotateLeft(cl, 10); cl = bl; bl = wl

        const [ridx, rs, __] = rr[r]
        const rtemp = (ar + f(br, cr, dr) + block[ridx] + kr[3]) >>> 0
        wr = (rotateLeft(rtemp, rs) + er) >>> 0
        ar = er; er = dr; dr = rotateLeft(cr, 10); cr = br; br = wr
      } else {
        const [idx, s, _] = rl[r]
        const temp = (al + j(bl, cl, dl) + block[idx] + kl[4]) >>> 0
        wl = (rotateLeft(temp, s) + el) >>> 0
        al = el; el = dl; dl = rotateLeft(cl, 10); cl = bl; bl = wl

        const [ridx, rs, __] = rr[r]
        const rtemp = (ar + j(br, cr, dr) + block[ridx] + kr[4]) >>> 0
        wr = (rotateLeft(rtemp, rs) + er) >>> 0
        ar = er; er = dr; dr = rotateLeft(cr, 10); cr = br; br = wr
      }
    }

    // Combine left and right branches
    const t = (h1 + cl + dr) >>> 0
    h1 = (h2 + dl + er) >>> 0
    h2 = (h3 + el + ar) >>> 0
    h3 = (h4 + al + br) >>> 0
    h4 = (h0 + bl + cr) >>> 0
    h0 = t
  }

  // Output as little-endian bytes
  const result = new Uint8Array(20)
  const values = [h0, h1, h2, h3, h4]
  for (let i = 0; i < 5; i++) {
    result[i * 4] = values[i] & 0xff
    result[i * 4 + 1] = (values[i] >> 8) & 0xff
    result[i * 4 + 2] = (values[i] >> 16) & 0xff
    result[i * 4 + 3] = (values[i] >> 24) & 0xff
  }

  return result
}

function rotateLeft(x: number, n: number): number {
  return ((x << n) | (x >>> (32 - n))) >>> 0
}

// Calculate hash
async function calculateHash() {
  if (!inputText.value) {
    hashResult.value = ''
    return
  }

  calculating.value = true

  try {
    // Small delay for UI
    await new Promise(resolve => setTimeout(resolve, 10))

    const inputBytes = getInputBytes()
    const hashBytes = ripemd160(inputBytes)

    if (outputFormat.value === 'hex') {
      hashResult.value = Array.from(hashBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
    } else {
      hashResult.value = btoa(String.fromCharCode(...hashBytes))
    }
  } catch (e: any) {
    console.error('Hash calculation error:', e)
  } finally {
    calculating.value = false
  }
}

// Batch hash calculation
async function batchHash() {
  if (!batchInput.value) return

  batchProcessing.value = true
  batchResults.value = []

  const lines = batchInput.value.split('\n').filter(line => line.trim())

  for (const line of lines) {
    try {
      const inputBytes = new TextEncoder().encode(line)
      const hashBytes = ripemd160(inputBytes)
      const hashHex = Array.from(hashBytes)
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

  batchProcessing.value = false
}

// File handling
function selectFile() {
  fileInput.value?.click()
}

async function handleFile(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  fileName.value = file.name
  fileSize.value = file.size

  calculating.value = true
  try {
    const buffer = await file.arrayBuffer()
    const inputBytes = new Uint8Array(buffer)
    const hashBytes = ripemd160(inputBytes)

    if (outputFormat.value === 'hex') {
      hashResult.value = Array.from(hashBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
    } else {
      hashResult.value = btoa(String.fromCharCode(...hashBytes))
    }
  } catch (e) {
    console.error('File hash error:', e)
  } finally {
    calculating.value = false
  }
}

function clearInput() {
  inputText.value = ''
  hashResult.value = ''
}

// Copy result
function copyResult(text: string) {
  navigator.clipboard.writeText(text)
}
</script>
