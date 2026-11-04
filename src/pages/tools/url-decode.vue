<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" /> -->

    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">URL 解码器</h1>
      <p class="text-muted-foreground">将百分比编码的 URL 解码还原为原始格式，支持批量解码</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 输入区域 -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">URL 输入</h2>
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

        <textarea
          v-model="inputText"
          placeholder="请输入要解码的 URL（每行一个）..."
          class="w-full h-64 p-4 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
        ></textarea>

        <!-- 解码选项 -->
        <div class="space-y-3">
          <h3 class="font-medium text-sm">解码选项</h3>
          <label class="flex items-center gap-2">
            <input
              type="checkbox"
              v-model="options.decodeEachLine"
              class="rounded"
            />
            <span class="text-sm">逐行解码（每行独立解码）</span>
          </label>
          <label class="flex items-center gap-2">
            <input
              type="checkbox"
              v-model="options.showOriginal"
              class="rounded"
            />
            <span class="text-sm">显示原始文本对比</span>
          </label>
        </div>

        <!-- 常见解码参考 -->
        <div class="bg-muted p-4 rounded-lg">
          <h3 class="font-medium text-sm mb-2">常见编码对照</h3>
          <div class="grid grid-cols-2 gap-2 text-xs font-mono">
            <div>%20 → 空格</div>
            <div>%21 → !</div>
            <div>%22 → "</div>
            <div>%23 → #</div>
            <div>%24 → $</div>
            <div>%25 → %</div>
            <div>%26 → &</div>
            <div>%2B → +</div>
            <div>%2F → /</div>
            <div>%3F → ?</div>
            <div>%3D → =</div>
          </div>
        </div>
      </div>

      <!-- 输出区域 -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">解码结果</h2>
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

        <!-- 原始文本对比 -->
        <div
          v-if="options.showOriginal && inputText"
          class="grid grid-cols-1 md:grid-cols-2 gap-2"
        >
          <div class="p-3 bg-muted rounded-lg">
            <p class="text-xs text-muted-foreground mb-1">编码文本:</p>
            <pre class="text-xs overflow-auto max-h-32">{{ inputText }}</pre>
          </div>
          <div class="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
            <p class="text-xs text-muted-foreground mb-1">解码文本:</p>
            <pre class="text-xs overflow-auto max-h-32">{{ outputText }}</pre>
          </div>
        </div>

        <!-- 解码结果 -->
        <div v-else class="relative">
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

          <!-- 字符统计 -->
          <div
            v-if="outputText"
            class="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background px-2 py-1 rounded"
          >
            {{ outputText.length }} 字符
          </div>
        </div>

        <!-- 解码统计 -->
        <div v-if="inputText" class="bg-muted p-4 rounded-lg">
          <h3 class="font-medium text-sm mb-2">解码统计</h3>
          <div class="grid grid-cols-2 gap-2 text-xs">
            <div>原始长度: {{ inputText.length }}</div>
            <div>解码长度: {{ outputText.length }}</div>
            <div>节省字符: {{ inputText.length - outputText.length }}</div>
            <div>压缩率: {{ ((inputText.length - outputText.length) / inputText.length * 100).toFixed(1) }}%</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 使用技巧 -->
    <div class="mt-12 space-y-6">
      <div class="bg-card  rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
          <Zap class="w-5 h-5 text-primary" />
          使用技巧
        </h3>
        <div class="space-y-3 text-sm text-muted-foreground">
          <p>• 可以一次输入多个 URL，每行一个，工具会自动解码</p>
          <p>• 支持拖拽文本文件进行批量解码</p>
          <p>• 解码时会自动处理常见的编码错误</p>
          <p>• 可以使用"显示原始文本对比"功能查看解码前后的区别</p>
        </div>
      </div>

      <!-- 解码示例 -->
      <div class="bg-card  rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">解码示例</h3>
        <div class="space-y-4">
          <div>
            <h4 class="font-medium text-sm mb-1">1. 搜索参数解码</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="p-3 bg-muted rounded-lg">
                <p class="text-xs text-muted-foreground mb-1">编码:</p>
                <code class="text-xs">search%3Fq%3Dhello%20world%26lang%3Den</code>
              </div>
              <div class="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                <p class="text-xs text-muted-foreground mb-1">解码:</p>
                <code class="text-xs">search?q=hello world&lang=en</code>
              </div>
            </div>
          </div>
          <div>
            <h4 class="font-medium text-sm mb-1">2. 中文内容解码</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="p-3 bg-muted rounded-lg">
                <p class="text-xs text-muted-foreground mb-1">编码:</p>
                <code class="text-xs">%E4%B8%AD%E6%96%87</code>
              </div>
              <div class="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                <p class="text-xs text-muted-foreground mb-1">解码:</p>
                <code class="text-xs">中文</code>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 相关工具 -->
      <div class="bg-card  rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">相关工具</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NuxtLink
            to="/tools/url-encode"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Link class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">URL 编码</p>
              <p class="text-xs text-muted-foreground">URL 百分比编码</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
          <NuxtLink
            to="/tools/html-decode"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <FileText class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">HTML 解码</p>
              <p class="text-xs text-muted-foreground">HTML 实体解码</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
          <NuxtLink
            to="/tools/base64-decode"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Hash class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">Base64 解码</p>
              <p class="text-xs text-muted-foreground">Base64 格式解码</p>
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
import { Zap, FileText, Hash, Link, ArrowRight } from 'lucide-vue-next'
import Breadcrumb from '~/components/Breadcrumb.vue'

// 分类信息
const category = { id: 'encode', name: '编码解码', description: '编码解码工具集合' }

// 状态管理
const inputText = ref('')
const outputText = ref('')
const copied = ref(false)

// 解码选项
const options = ref({
  decodeEachLine: true,
  showOriginal: false
})

// URL 解码函数
const decodeURL = (text, decodeEachLine) => {
  if (decodeEachLine) {
    // 逐行解码
    return text.split('\n').map(line => {
      try {
        return decodeURIComponent(line)
      } catch (error) {
        return `解码失败: ${line}`
      }
    }).join('\n')
  } else {
    // 整体解码
    try {
      return decodeURIComponent(text)
    } catch (error) {
      return '解码失败：' + error.message
    }
  }
}

// 监听输入变化
watch(inputText, (newText) => {
  if (newText) {
    outputText.value = decodeURL(newText, options.value.decodeEachLine)
  } else {
    outputText.value = ''
  }
})

// 监听选项变化
watch(options, () => {
  if (inputText.value) {
    outputText.value = decodeURL(inputText.value, options.value.decodeEachLine)
  }
}, { deep: true })

// 清空输入
const clearInput = () => {
  inputText.value = ''
  outputText.value = ''
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
    await navigator.clipboard.writeText(outputText.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (error) {
    // 降级方案
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
  a.download = 'url-decoded.txt'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// SEO配置
useSeoMeta({
  title: 'URL解码器 - 在线URL百分比解码工具',
  description: '免费在线URL解码工具，支持批量解码，显示原始文本对比，提供实时解码预览。',
  keywords: ['url', '解码', 'decoder', 'percent-encoding', 'urldecode', '在线工具', '批量解码']
})


</script>

<style scoped>
input[type="checkbox"]:checked {
  background-color: hsl(var(--primary));
  border-color: hsl(var(--primary));
}
</style>