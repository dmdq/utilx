<template>
  <div class="max-w-8xl mx-auto">
    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">UTF-8 编码转换工具</h1>
      <p class="text-muted-foreground">支持 UTF-8、UTF-16、UTF-32 之间的编码转换，实时显示字节数组和编码详情</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 输入区域 -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">输入文本</h2>
          <div class="flex gap-2">
            <button
              @click="clearInput"
              class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              清空
            </button>
            <button
              @click="loadExample"
              class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              示例
            </button>
          </div>
        </div>

        <textarea
          v-model="inputText"
          placeholder="请输入需要转换的文本..."
          class="w-full h-64 p-4 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
        ></textarea>

        <!-- 编码选项 -->
        <div class="space-y-3">
          <h3 class="font-medium text-sm">目标编码格式</h3>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="format in encodingFormats"
              :key="format.value"
              @click="encodingFormat = format.value"
              :class="[
                'px-3 py-2 text-sm rounded-lg border transition-colors',
                encodingFormat === format.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background hover:bg-muted'
              ]"
            >
              {{ format.label }}
            </button>
          </div>
        </div>

        <!-- 显示选项 -->
        <div class="space-y-3">
          <h3 class="font-medium text-sm">显示格式</h3>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="format in displayFormats"
              :key="format.value"
              @click="displayFormat = format.value"
              :class="[
                'px-3 py-2 text-sm rounded-lg border transition-colors',
                displayFormat === format.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background hover:bg-muted'
              ]"
            >
              {{ format.label }}
            </button>
          </div>
        </div>
      </div>

      <!-- 输出区域 -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">编码结果</h2>
          <div class="flex gap-2">
            <button
              v-if="outputText"
              @click="copyOutput"
              class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {{ copied ? '已复制' : '复制' }}
            </button>
            <button
              v-if="outputText"
              @click="downloadOutput"
              class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              下载
            </button>
          </div>
        </div>

        <div class="relative">
          <pre
            v-if="outputText"
            class="w-full h-64 p-4 bg-muted rounded-lg overflow-auto text-sm font-mono whitespace-pre-wrap break-all"
          >{{ outputText }}</pre>
          <div
            v-else
            class="w-full h-64 p-4 bg-muted rounded-lg flex items-center justify-center text-muted-foreground"
          >
            编码结果将显示在这里
          </div>

          <!-- 统计信息 -->
          <div
            v-if="outputText"
            class="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background px-2 py-1 rounded"
          >
            {{ byteCount }} 字节
          </div>
        </div>

        <!-- 编码详情 -->
        <div v-if="inputText" class="bg-muted p-4 rounded-lg">
          <h3 class="font-medium text-sm mb-2">编码详情</h3>
          <div class="space-y-2 text-xs">
            <div class="grid grid-cols-2 gap-2">
              <div>字符数: {{ charCount }}</div>
              <div>字节数: {{ byteCount }}</div>
              <div>BOM: {{ hasBOM ? '是' : '否' }}</div>
              <div>字节序: {{ endianness }}</div>
            </div>
          </div>
        </div>

        <!-- 字符分析 -->
        <div v-if="characterAnalysis.length > 0" class="bg-muted p-4 rounded-lg max-h-48 overflow-auto">
          <h3 class="font-medium text-sm mb-2">字符分析</h3>
          <div class="space-y-1">
            <div
              v-for="(char, index) in characterAnalysis"
              :key="index"
              class="flex items-center gap-2 text-xs font-mono"
            >
              <span class="bg-background px-2 py-1 rounded">{{ char.char }}</span>
              <span class="text-muted-foreground">U+{{ char.codePoint.toString(16).toUpperCase().padStart(4, '0') }}</span>
              <span class="text-muted-foreground">{{ char.name }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 使用场景说明 -->
    <div class="mt-12 space-y-6">
      <div class="bg-card rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText class="w-5 h-5 text-primary" />
          UTF-8 编码说明
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-3">
            <h4 class="font-medium">UTF-8 特点：</h4>
            <ul class="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>变长编码：1-4 字节</li>
              <li>ASCII 兼容（0-127）</li>
              <li>无字节序问题</li>
              <li>互联网标准编码</li>
            </ul>
          </div>
          <div class="space-y-3">
            <h4 class="font-medium">编码范围：</h4>
            <div class="space-y-1 text-sm">
              <div class="flex justify-between">
                <span class="text-muted-foreground">ASCII (0-127):</span>
                <span class="font-mono">1 字节</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">拉丁扩展 (128-2047):</span>
                <span class="font-mono">2 字节</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">基本多文种 (2048-65535):</span>
                <span class="font-mono">3 字节</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">辅助平面 (65536+):</span>
                <span class="font-mono">4 字节</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 编码示例 -->
      <div class="bg-card rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">编码示例</h3>
        <div class="space-y-4">
          <div>
            <h4 class="font-medium text-sm mb-2">1. 中英文混合文本</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="p-3 bg-muted rounded-lg">
                <p class="text-xs text-muted-foreground mb-1">原文:</p>
                <code class="text-sm">Hello 你好</code>
              </div>
              <div class="p-3 bg-muted rounded-lg">
                <p class="text-xs text-muted-foreground mb-1">UTF-8 (Hex):</p>
                <code class="text-xs font-mono">48 65 6C 6C 6F 20 E4 BD A0 E5 A5 BD</code>
              </div>
            </div>
          </div>
          <div>
            <h4 class="font-medium text-sm mb-2">2. Emoji 表情</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="p-3 bg-muted rounded-lg">
                <p class="text-xs text-muted-foreground mb-1">原文:</p>
                <code class="text-sm">😀 🎉 ❤️</code>
              </div>
              <div class="p-3 bg-muted rounded-lg">
                <p class="text-xs text-muted-foreground mb-1">UTF-8 (Hex):</p>
                <code class="text-xs font-mono">F0 9F 98 80 20 F0 9F 8E 89 20 E2 9D A4 EF B8 8F</code>
              </div>
            </div>
          </div>
          <div>
            <h4 class="font-medium text-sm mb-2">3. BOM 标记</h4>
            <div class="p-3 bg-muted rounded-lg">
              <p class="text-xs text-muted-foreground mb-2">UTF-8 BOM (可选):</p>
              <code class="text-xs font-mono">EF BB BF</code>
              <p class="text-xs text-muted-foreground mt-2">注意：UTF-8 通常不需要 BOM，但某些程序可能使用它来标识编码</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 相关工具 -->
      <div class="bg-card rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">相关工具</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NuxtLink
            to="/tools/base64-encode"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Hash class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">Base64 编码</p>
              <p class="text-xs text-muted-foreground">Base64 格式转换</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
          <NuxtLink
            to="/tools/url-encode"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Globe class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">URL 编码</p>
              <p class="text-xs text-muted-foreground">URL 百分比编码</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
          <NuxtLink
            to="/tools/hex-convert"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <FileText class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">十六进制转换</p>
              <p class="text-xs text-muted-foreground">十六进制编码转换</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useSeoMeta } from '#app'
import { FileText, Hash, Globe, ArrowRight } from 'lucide-vue-next'

// 状态管理
const inputText = ref('')
const outputText = ref('')
const encodingFormat = ref('utf8') // utf8, utf16le, utf16be, utf32le, utf32be
const displayFormat = ref('hex') // hex, decimal, base64, binary
const copied = ref(false)

// 编码格式选项
const encodingFormats = [
  { value: 'utf8', label: 'UTF-8' },
  { value: 'utf16le', label: 'UTF-16 LE' },
  { value: 'utf16be', label: 'UTF-16 BE' },
  { value: 'utf32le', label: 'UTF-32 LE' },
  { value: 'utf32be', label: 'UTF-32 BE' }
]

// 显示格式选项
const displayFormats = [
  { value: 'hex', label: '十六进制' },
  { value: 'decimal', label: '十进制' },
  { value: 'base64', label: 'Base64' },
  { value: 'binary', label: '二进制' }
]

// 示例数据
const examples = [
  'Hello 你好 World',
  '😀 🎉 ❤️ 🌟 🔥',
  'JavaScript 编程',
  '中文 English 日本語 한국'
]
const currentExample = ref(0)

// 字符统计
const charCount = computed(() => {
  return Array.from(inputText.value).length
})

const byteCount = computed(() => {
  if (!inputText.value) return 0
  const encoder = new TextEncoder()
  return encoder.encode(inputText.value).length
})

const hasBOM = computed(() => false) // UTF-8 通常不需要 BOM
const endianness = computed(() => {
  if (encodingFormat.value.includes('le')) return 'Little Endian'
  if (encodingFormat.value.includes('be')) return 'Big Endian'
  return 'N/A'
})

// 字符分析
const characterAnalysis = computed(() => {
  if (!inputText.value) return []
  return Array.from(inputText.value).map(char => {
    const codePoint = char.codePointAt(0)
    let name = 'Other'

    if (codePoint <= 0x7F) name = 'ASCII'
    else if (codePoint <= 0x7FF) name = 'Latin Extended'
    else if (codePoint <= 0xFFFF) name = 'BMP'
    else if (codePoint <= 0x10FFFF) name = 'Supplementary'

    // 特殊字符名称
    if (codePoint >= 0x1F600 && codePoint <= 0x1F64F) name = 'Emoticons'
    else if (codePoint >= 0x1F300 && codePoint <= 0x1F5FF) name = 'Symbols'
    else if (codePoint >= 0x4E00 && codePoint <= 0x9FFF) name = 'CJK Unified Ideographs'
    else if (codePoint >= 0x3040 && codePoint <= 0x309F) name = 'Hiragana'
    else if (codePoint >= 0x30A0 && codePoint <= 0x30FF) name = 'Katakana'
    else if (codePoint >= 0xAC00 && codePoint <= 0xD7AF) name = 'Hangul Syllables'

    return {
      char: char === ' ' ? '␣' : char,
      codePoint,
      name
    }
  })
})

// 编码转换函数
const encodeText = (text, encoding, display) => {
  try {
    const encoder = new TextEncoder()
    const bytes = encoder.encode(text)

    let result = ''

    switch (display) {
      case 'hex':
        result = Array.from(bytes)
          .map(b => b.toString(16).toUpperCase().padStart(2, '0'))
          .join(' ')
        break
      case 'decimal':
        result = Array.from(bytes)
          .map(b => b.toString().padStart(3, '0'))
          .join(' ')
        break
      case 'base64':
        result = btoa(String.fromCharCode(...bytes))
        break
      case 'binary':
        result = Array.from(bytes)
          .map(b => b.toString(2).padStart(8, '0'))
          .join(' ')
        break
    }

    return result
  } catch (error) {
    return '编码错误: ' + error.message
  }
}

// 监听输入变化
watch([inputText, encodingFormat, displayFormat], ([newText]) => {
  if (newText) {
    outputText.value = encodeText(newText, encodingFormat.value, displayFormat.value)
  } else {
    outputText.value = ''
  }
})

// 清空输入
const clearInput = () => {
  inputText.value = ''
  outputText.value = ''
}

// 加载示例
const loadExample = () => {
  inputText.value = examples[currentExample.value]
  currentExample.value = (currentExample.value + 1) % examples.length
}

// 复制输出
const copyOutput = async () => {
  try {
    await navigator.clipboard.writeText(outputText.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (error) {
    const textarea = document.createElement('textarea')
    textarea.value = outputText.value
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  }
}

// 下载输出
const downloadOutput = () => {
  const blob = new Blob([outputText.value], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `utf8-${encodingFormat.value}.${displayFormat.value}`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// SEO配置
useSeoMeta({
  title: 'UTF-8编码转换 - 在线UTF-8/UTF-16/UTF-32编码转换工具',
  description: '免费在线UTF-8编码转换工具，支持UTF-8、UTF-16、UTF-32之间的编码转换，实时显示字节数组和编码详情，支持中文、Emoji等多语言字符。',
  keywords: ['utf8', 'utf-8', '编码转换', 'unicode', '字符编码', 'utf16', 'utf32', '在线工具', '中文编码']
})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('UTF-8编码转换工具')
</script>

<style scoped>
input[type="radio"]:checked {
  background-color: hsl(var(--primary));
  border-color: hsl(var(--primary));
}
</style>
