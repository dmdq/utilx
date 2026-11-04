<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" /> -->

    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">Base64 编码器</h1>
      <p class="text-muted-foreground">将文本或图片转换为 Base64 编码格式，支持拖拽上传文件</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 输入区域 -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">输入内容</h2>
          <div class="flex gap-2">
            <button
              @click="clearInput"
              class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              清空
            </button>
          </div>
        </div>

        <!-- 输入方式切换 -->
        <div class="flex gap-2 p-1 bg-muted rounded-lg">
          <button
            @click="inputMode = 'text'"
            :class="inputMode === 'text' ? 'bg-background shadow-sm' : ''"
            class="flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors"
          >
            文本输入
          </button>
          <button
            @click="inputMode = 'file'"
            :class="inputMode === 'file' ? 'bg-background shadow-sm' : ''"
            class="flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors"
          >
            文件上传
          </button>
        </div>

        <!-- 文本输入 -->
        <textarea
          v-if="inputMode === 'text'"
          v-model="inputText"
          placeholder="请输入要编码的文本..."
          class="w-full h-64 p-4 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
        ></textarea>

        <!-- 文件上传 -->
        <div
          v-if="inputMode === 'file'"
          @drop="handleDrop"
          @dragover.prevent
          @dragenter.prevent
          class="w-full h-64 border-2 border-dashed border-muted-foreground/25 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
          @click="$refs.fileInput?.click()"
        >
          <input
            ref="fileInput"
            type="file"
            class="hidden"
            @change="handleFileSelect"
            accept="image/*,.txt,.json,.xml,.csv"
          />
          <Upload class="w-12 h-12 text-muted-foreground mb-2" />
          <p class="text-sm text-muted-foreground mb-1">拖拽文件到此处或点击上传</p>
          <p class="text-xs text-muted-foreground">支持图片和文本文件</p>
          <p v-if="selectedFile" class="text-sm text-primary mt-2">{{ selectedFile.name }}</p>
        </div>

        <!-- 编码选项 -->
        <div class="space-y-3">
          <label class="flex items-center gap-2">
            <input
              type="checkbox"
              v-model="options.urlSafe"
              class="rounded"
            />
            <span class="text-sm">URL 安全编码（替换 + 和 /）</span>
          </label>
          <label class="flex items-center gap-2">
            <input
              type="checkbox"
              v-model="options.lineBreaks"
              class="rounded"
            />
            <span class="text-sm">每 76 个字符换行</span>
          </label>
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

          <!-- 字符统计 -->
          <div
            v-if="outputText"
            class="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background px-2 py-1 rounded"
          >
            {{ outputText.length }} 字符
          </div>
        </div>
      </div>
    </div>

    <!-- 信息说明 -->
    <div class="mt-12 space-y-6">
      <div class="bg-card  rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
          <Info class="w-5 h-5 text-primary" />
          关于 Base64 编码
        </h3>
        <div class="space-y-3 text-sm text-muted-foreground">
          <p>Base64 是一种基于 64 个可打印字符来表示二进制数据的编码方法。它常用于在处理文本数据的场合，表示、传输和存储一些二进制数据。</p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <h4 class="font-medium text-foreground mb-2">常见用途：</h4>
              <ul class="list-disc list-inside space-y-1">
                <li>邮件附件编码</li>
                <li>URL 参数传递</li>
                <li>图片内嵌到 HTML/CSS</li>
                <li>配置文件存储</li>
              </ul>
            </div>
            <div>
              <h4 class="font-medium text-foreground mb-2">编码字符集：</h4>
              <ul class="list-disc list-inside space-y-1">
                <li>大写字母 A-Z (26个)</li>
                <li>小写字母 a-z (26个)</li>
                <li>数字 0-9 (10个)</li>
                <li>加号 + 和斜杠 / (2个)</li>
                <li>等号 = 作为填充字符</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- 相关工具 -->
      <div class="bg-card  rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">相关工具</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NuxtLink
            to="/tools/base64-decode"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Hash class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">Base64 解码</p>
              <p class="text-xs text-muted-foreground">解码 Base64 字符串</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
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
import { Upload, Info, Hash, Link, ArrowRight } from 'lucide-vue-next'
import Breadcrumb from '~/components/Breadcrumb.vue'

// 分类信息
const category = { id: 'encode', name: '编码解码', description: '编码解码工具集合' }

// 状态管理
const inputMode = ref('text')
const inputText = ref('')
const outputText = ref('')
const selectedFile = ref(null)
const copied = ref(false)

// 编码选项
const options = ref({
  urlSafe: false,
  lineBreaks: false
})

// Base64 编码函数
const encodeBase64 = (text) => {
  try {
    let encoded = btoa(unescape(encodeURIComponent(text)))

    if (options.value.urlSafe) {
      encoded = encoded.replace(/\+/g, '-').replace(/\//g, '_')
    }

    if (options.value.lineBreaks) {
      const lines = []
      for (let i = 0; i < encoded.length; i += 76) {
        lines.push(encoded.substring(i, i + 76))
      }
      encoded = lines.join('\n')
    }

    return encoded
  } catch (error) {
    return '编码失败：' + error.message
  }
}

// 文件读取并编码
const readFileAsBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const result = e.target.result
      if (typeof result === 'string') {
        // 获取 Base64 部分（移除 data:image/...;base64, 前缀）
        const base64 = result.split(',')[1] || result
        resolve(base64)
      } else {
        resolve('')
      }
    }

    reader.onerror = () => reject(new Error('文件读取失败'))

    if (file.type.startsWith('image/')) {
      reader.readAsDataURL(file)
    } else {
      reader.readAsText(file)
      reader.onload = (e) => {
        try {
          const base64 = btoa(e.target.result)
          resolve(base64)
        } catch (error) {
          reject(error)
        }
      }
    }
  })
}

// 处理文件选择
const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    selectedFile.value = file
    processFile(file)
  }
}

// 处理拖拽
const handleDrop = (event) => {
  event.preventDefault()
  const file = event.dataTransfer.files[0]
  if (file) {
    selectedFile.value = file
    processFile(file)
  }
}

// 处理文件
const processFile = async (file) => {
  try {
    const base64 = await readFileAsBase64(file)
    outputText.value = base64
  } catch (error) {
    outputText.value = '文件处理失败：' + error.message
  }
}

// 监听输入变化
watch(inputText, (newText) => {
  if (newText) {
    outputText.value = encodeBase64(newText)
  } else {
    outputText.value = ''
  }
})

// 监听选项变化
watch(options, () => {
  if (inputText.value || selectedFile.value) {
    if (inputText.value) {
      outputText.value = encodeBase64(inputText.value)
    }
  }
}, { deep: true })

// 清空输入
const clearInput = () => {
  inputText.value = ''
  outputText.value = ''
  selectedFile.value = null
  if (inputMode.value === 'file') {
    const fileInput = document.querySelector('input[type="file"]')
    if (fileInput) fileInput.value = ''
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
  a.download = 'base64-encoded.txt'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// SEO配置
useSeoMeta({
  title: 'Base64编码器 - 在线Base64编码工具',
  description: '免费在线Base64编码工具，支持文本和图片编码，可拖拽上传文件，提供多种编码选项。',
  keywords: ['base64', '编码', 'encoder', '在线工具', '图片编码', '文件编码']
})


</script>

<style scoped>
input[type="checkbox"]:checked {
  background-color: hsl(var(--primary));
  border-color: hsl(var(--primary));
}
</style>