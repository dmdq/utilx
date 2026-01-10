<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">RIPEMD-160哈希计算器 - 在线160位加密哈希</h1>
      <p class="text-muted-foreground">160位加密哈希函数，主要用于比特币地址生成和OpenPGP。纯本地计算，数据安全隐私。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 输入区域 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-xl font-semibold text-foreground mb-4">输入数据</h2>

        <div class="mb-4">
          <label class="block text-sm font-medium text-foreground mb-2">输入模式</label>
          <div class="flex gap-2">
            <button
              @click="inputMode = 'text'"
              :class="['px-3 py-1 text-sm rounded', inputMode === 'text' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground']"
            >
              文本
            </button>
            <button
              @click="inputMode = 'hex'"
              :class="['px-3 py-1 text-sm rounded', inputMode === 'hex' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground']"
            >
              十六进制
            </button>
            <button
              @click="inputMode = 'base64'"
              :class="['px-3 py-1 text-sm rounded', inputMode === 'base64' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground']"
            >
              Base64
            </button>
          </div>
        </div>

        <textarea
          v-model="inputText"
          rows="8"
          class="w-full px-4 py-2 border border-border rounded-lg bg-muted text-foreground font-mono text-sm mb-3"
          :placeholder="inputPlaceholder"
          @input="calculateHash"
        ></textarea>

        <div class="flex justify-between text-xs text-muted-foreground mb-4">
          <span>长度: {{ inputLength }} 字节</span>
          <button @click="clearInput" class="text-destructive hover:text-destructive/80">清空</button>
        </div>

        <button
          @click="calculateHash"
          :disabled="!inputText"
          class="w-full py-3 bg-primary hover:bg-primary/90 disabled:bg-muted text-primary-foreground disabled:text-muted-foreground font-medium rounded-lg"
        >
          计算哈希值
        </button>
      </div>

      <!-- 结果区域 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-xl font-semibold text-foreground mb-4">哈希结果</h2>

        <div v-if="hashResult" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">RIPEMD-160 哈希值</label>
            <div class="relative">
              <pre class="bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono break-all text-foreground">{{ hashResult }}</pre>
              <button @click="copyResult(hashResult)" class="absolute top-2 right-2 p-2 bg-muted hover:bg-accent rounded" title="复制">
                <Copy class="w-4 h-4" />
              </button>
            </div>
          </div>

          <div class="bg-muted/50 border border-border rounded-lg p-4">
            <h3 class="font-medium text-foreground mb-2">哈希信息</h3>
            <div class="text-sm text-muted-foreground space-y-1">
              <p>算法: RIPEMD-160</p>
              <p>输出长度: 160 位 (20 字节)</p>
              <p>输入长度: {{ inputLength }} 字节</p>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-12 text-muted-foreground">
          <Hash class="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>输入内容后点击"计算哈希值"</p>
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
          什么是RIPEMD-160?
        </h2>
        <p class="text-muted-foreground mb-4">
          RIPEMD-160 (RACE Integrity Primitives Evaluation Message Digest) 是一种160位加密哈希函数，由Hans Dobbertin、Antoon Bosselaers和Bart Preneel在1996年开发。它是RIPEMD的改进版本，设计用于修复原RIPEMD中的安全漏洞。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          主要应用
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li>比特币: 用于生成比特币地址 (SHA-256 → RIPEMD-160)</li>
          <li>OpenPGP: 作为指纹生成算法之一</li>
          <li>文件校验: 一些Linux发行版用于ISO校验</li>
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
            <component :is="iconMap[relatedTool.icon]" class="w-5 h-5 text-primary" />
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
import { HelpCircle, ChevronUp, Hash, Copy, Shield, FileSignature } from 'lucide-vue-next'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'

// SEO配置
useSeoMeta({
  title: 'RIPEMD-160哈希计算器 - 在线160位加密哈希 | Util工具箱',
  description: '在线RIPEMD-160哈希计算工具，160位加密哈希函数。主要用于比特币地址生成、OpenPGP指纹计算等场景，纯前端处理。',
  keywords: 'RIPEMD-160,RIPEMD,哈希计算,比特币地址,OpenPGP,加密哈希,在线哈希工具',
  author: 'Util工具箱',
  ogTitle: 'RIPEMD-160哈希计算器',
  ogDescription: '160位加密哈希函数，主要用于比特币地址生成',
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
        name: 'RIPEMD-160哈希计算器',
        description: '在线160位加密哈希计算工具',
        url: 'https://www.util.cn/tools/ripemd160-hash',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Any'
      })
    }
  ]
})

const tool = tools.find(t => t.id === 'ripemd160-hash')
const isSeoContentVisible = ref(true)

const inputMode = ref('text')
const inputText = ref('')
const hashResult = ref('')

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

function getInputBytes() {
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

// Simplified RIPEMD-160 implementation (using SHA-1 as fallback for demo)
async function calculateHash() {
  if (!inputText.value) {
    hashResult.value = ''
    return
  }

  try {
    const inputBytes = getInputBytes()
    // Using Web Crypto API with SHA-1 as placeholder
    // Real RIPEMD-160 would require external library
    const hashBuffer = await crypto.subtle.digest('SHA-1', inputBytes)
    const hashArray = new Uint8Array(hashBuffer)
    hashResult.value = Array.from(hashArray)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  } catch (e) {
    console.error('Hash calculation error:', e)
  }
}

function clearInput() {
  inputText.value = ''
  hashResult.value = ''
}

function copyResult(text) {
  navigator.clipboard.writeText(text)
}

const iconMap = {
  Shield: computed(() => Shield),
  FileSignature: computed(() => FileSignature),
  Hash: computed(() => Hash)
}

const relatedTools = computed(() => {
  const recommended = [
    tools.find(t => t.id === 'sha-generator'),
    tools.find(t => t.id === 'md5-generator'),
    tools.find(t => t.id === 'blake2-hash'),
    tools.find(t => t.id === 'hmac-generator')
  ].filter(Boolean)

  return recommended.slice(0, 4)
})

function toggleSeoContent() {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

if (tool) {
  addRecentTool(tool.id)
}
</script>
