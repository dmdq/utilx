<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" /> -->

    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">Base64 解码器</h1>
      <p class="text-muted-foreground">将 Base64 编码数据解码还原为原始内容，支持文本和图片解码</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 输入区域 -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">Base64 输入</h2>
          <div class="flex gap-2">
            <button
              @click="clearInput"
              class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              清空
            </button>
            <button
              @click="pasteFromClipboard"
              class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              粘贴
            </button>
          </div>
        </div>

        <!-- 输入框 -->
        <div class="relative">
          <textarea
            v-model="inputText"
            placeholder="请输入要解码的 Base64 字符串..."
            class="w-full h-64 p-4 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
          ></textarea>

          <!-- 字符统计 -->
          <div
            v-if="inputText"
            class="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background px-2 py-1 rounded"
          >
            {{ inputText.length }} 字符
          </div>
        </div>

        <!-- 解码选项 -->
        <div class="space-y-3">
          <label class="flex items-center gap-2">
            <input
              type="checkbox"
              v-model="options.urlSafe"
              class="rounded"
            />
            <span class="text-sm">URL 安全解码（替换 - 和 _）</span>
          </label>
          <label class="flex items-center gap-2">
            <input
              type="checkbox"
              v-model="options.strict"
              class="rounded"
            />
            <span class="text-sm">严格模式（仅允许 Base64 字符）</span>
          </label>
        </div>
      </div>

      <!-- 输出区域 -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">解码结果</h2>
          <div class="flex gap-2">
            <button
              v-if="outputText || outputType === 'image'"
              @click="copyOutput"
              class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {{ copied ? '已复制' : '复制' }}
            </button>
            <button
              v-if="outputText && outputType === 'text'"
              @click="downloadOutput"
              class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              下载
            </button>
            <button
              v-if="outputType === 'image'"
              @click="downloadImage"
              class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              下载图片
            </button>
          </div>
        </div>

        <!-- 文本输出 -->
        <div
          v-if="outputType === 'text'"
          class="relative"
        >
          <pre
            v-if="outputText"
            class="w-full h-64 p-4 bg-muted rounded-lg overflow-auto text-sm whitespace-pre-wrap break-all"
          >{{ outputText }}</pre>
          <div
            v-else
            class="w-full h-64 p-4 bg-muted rounded-lg flex items-center justify-center text-muted-foreground"
          >
            解码结果将显示在这里
          </div>
        </div>

        <!-- 图片输出 -->
        <div
          v-if="outputType === 'image'"
          class="w-full min-h-64 p-4 bg-muted rounded-lg flex items-center justify-center"
        >
          <div v-if="imageData" class="text-center">
            <img
              :src="imageData"
              alt="Decoded image"
              class="max-w-full max-h-64 rounded-lg shadow-lg"
            />
            <p class="text-sm text-muted-foreground mt-2">
              图片尺寸: {{ imageInfo.width }} x {{ imageInfo.height }}
            </p>
          </div>
          <p v-else class="text-muted-foreground">
            无法识别为图片数据
          </p>
        </div>

        <!-- 错误信息 -->
        <div
          v-if="error"
          class="w-full p-4 bg-destructive/10 border border-destructive/20 rounded-lg"
        >
          <p class="text-sm text-destructive">{{ error }}</p>
        </div>
      </div>
    </div>

    <!-- Base64 格式说明 -->
    <div class="mt-12 space-y-6">
      <div class="bg-card  rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText class="w-5 h-5 text-primary" />
          支持的 Base64 格式
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-3">
            <h4 class="font-medium">标准 Base64：</h4>
            <div class="p-3 bg-muted rounded-lg">
              <code class="text-xs">aGVsbG8gd29ybGQ=</code>
            </div>
          </div>
          <div class="space-y-3">
            <h4 class="font-medium">Data URL (图片)：</h4>
            <div class="p-3 bg-muted rounded-lg">
              <code class="text-xs block truncate">data:image/png;base64,iVBORw0KGgoAAAANSUhEUgA...</code>
            </div>
          </div>
          <div class="space-y-3">
            <h4 class="font-medium">带换行的 Base64：</h4>
            <div class="p-3 bg-muted rounded-lg">
              <code class="text-xs">YWJjZGVmZ2hpams=</code>
            </div>
          </div>
          <div class="space-y-3">
            <h4 class="font-medium">URL 安全 Base64：</h4>
            <div class="p-3 bg-muted rounded-lg">
              <code class="text-xs">aGVsbG8gd29ybGQ-</code>
            </div>
          </div>
        </div>
      </div>

      <!-- 解码说明 -->
      <div class="bg-card  rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">使用说明</h3>
        <div class="space-y-2 text-sm text-muted-foreground">
          <p>• 支持标准 Base64、URL 安全 Base64、带换行的 Base64 格式</p>
          <p>• 自动检测图片数据并显示预览</p>
          <p>• 严格模式下只允许 Base64 字符集，否则会报错</p>
          <p>• 支持从剪贴板直接粘贴 Base64 数据</p>
        </div>
      </div>

      <!-- 相关工具 -->
      <div class="bg-card  rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">相关工具</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NuxtLink
            to="/tools/base64-encode"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Hash class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">Base64 编码</p>
              <p class="text-xs text-muted-foreground">文本/图片转 Base64</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
          <NuxtLink
            to="/tools/url-decode"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Link class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">URL 解码</p>
              <p class="text-xs text-muted-foreground">URL 百分比解码</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
          <NuxtLink
            to="/tools/hex-convert"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Hash class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">十六进制转换</p>
              <p class="text-xs text-muted-foreground">文本与十六进制互转</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { FileText, Hash, Link, ArrowRight } from 'lucide-vue-next'
import Breadcrumb from '~/components/Breadcrumb.vue'

// 分类信息
const category = { id: 'encode', name: '编码解码', description: '编码解码工具集合' }

// 状态管理
const inputText = ref('')
const outputText = ref('')
const outputType = ref('text') // 'text' | 'image' | 'error'
const imageData = ref('')
const imageInfo = ref({ width: 0, height: 0 })
const error = ref('')
const copied = ref(false)

// 解码选项
const options = ref({
  urlSafe: false,
  strict: false
})

// Base64 解码函数
const decodeBase64 = (base64) => {
  try {
    // 清理输入
    let cleanBase64 = base64.trim()

    // 处理 Data URL 格式
    if (cleanBase64.startsWith('data:')) {
      const parts = cleanBase64.split(',')
      if (parts.length < 2) {
        throw new Error('无效的 Data URL 格式')
      }
      cleanBase64 = parts[1]

      // 检测是否是图片
      const mimeMatch = parts[0].match(/data:image\/(\w+);base64/)
      if (mimeMatch) {
        outputType.value = 'image'
        return cleanBase64
      }
    }

    // URL 安全处理
    if (options.value.urlSafe) {
      cleanBase64 = cleanBase64.replace(/-/g, '+').replace(/_/g, '/')
    }

    // 移除换行符
    cleanBase64 = cleanBase64.replace(/\s/g, '')

    // 严格模式检查
    if (options.value.strict) {
      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/
      if (!base64Regex.test(cleanBase64)) {
        throw new Error('输入包含非 Base64 字符')
      }
    }

    // 补齐填充
    const padLength = 4 - (cleanBase64.length % 4)
    if (padLength < 4) {
      cleanBase64 += '='.repeat(padLength)
    }

    // 解码
    outputType.value = 'text'
    return atob(cleanBase64)
  } catch (err) {
    error.value = '解码失败：' + err.message
    outputType.value = 'error'
    return ''
  }
}

// 处理图片加载
const loadImage = (base64) => {
  const img = new Image()
  img.onload = () => {
    imageInfo.value = {
      width: img.width,
      height: img.height
    }
  }
  img.onerror = () => {
    error.value = '图片加载失败'
  }
  img.src = `data:image/png;base64,${base64}`
}

// 监听输入变化
watch(inputText, (newText) => {
  if (newText) {
    error.value = ''
    outputText.value = ''
    imageData.value = ''

    const decoded = decodeBase64(newText)
    if (decoded && outputType.value === 'text') {
      outputText.value = decodeURIComponent(escape(decoded))
    } else if (decoded && outputType.value === 'image') {
      imageData.value = `data:image/png;base64,${decoded}`
      loadImage(decoded)
    }
  } else {
    outputText.value = ''
    imageData.value = ''
    imageInfo.value = { width: 0, height: 0 }
    error.value = ''
    outputType.value = 'text'
  }
})

// 监听选项变化
watch(options, () => {
  if (inputText.value) {
    inputText.value = inputText.value // 触发重新解码
  }
}, { deep: true })

// 清空输入
const clearInput = () => {
  inputText.value = ''
  outputText.value = ''
  imageData.value = ''
  imageInfo.value = { width: 0, height: 0 }
  error.value = ''
  outputType.value = 'text'
}

// 从剪贴板粘贴
const pasteFromClipboard = async () => {
  try {
    const text = await navigator.clipboard.readText()
    inputText.value = text
  } catch (error) {
    // 降级方案
    const textarea = document.createElement('textarea')
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('paste')
    inputText.value = textarea.value || ''
    document.body.removeChild(textarea)
  }
}

// 复制输出
const copyOutput = async () => {
  try {
    const textToCopy = outputType.value === 'text' ? outputText.value : imageData.value
    await navigator.clipboard.writeText(textToCopy)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (error) {
    // 降级方案
    const textarea = document.createElement('textarea')
    textarea.value = outputType.value === 'text' ? outputText.value : imageData.value
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

// 下载文本
const downloadOutput = () => {
  const blob = new Blob([outputText.value], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'decoded.txt'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// 下载图片
const downloadImage = () => {
  const a = document.createElement('a')
  a.href = imageData.value
  a.download = 'decoded-image.png'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

// SEO配置
useSeoMeta({
  title: 'Base64解码器 - 在线Base64解码工具',
  description: '免费在线Base64解码工具，支持文本和图片解码，自动识别图片格式，提供多种解码选项。',
  keywords: ['base64', '解码', 'decoder', '在线工具', '图片解码', '文本解码']
})


</script>

<style scoped>
input[type="checkbox"]:checked {
  background-color: hsl(var(--primary));
  border-color: hsl(var(--primary));
}
</style>