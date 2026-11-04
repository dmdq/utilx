<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" /> -->

    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">大小写转换工具</h1>
      <p class="text-muted-foreground">快速转换文本大小写格式，支持多种转换模式</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="space-y-6">
      <!-- 转换选项 -->
      <div class="bg-card   rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">转换选项</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            v-for="option in convertOptions"
            :key="option.value"
            @click="convertCase(option.value)"
            :class="[
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              currentMode === option.value
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-muted hover:bg-muted/80'
            ]"
          >
            <component :is="option.icon" class="w-4 h-4 inline mr-2" />
            {{ option.label }}
          </button>
        </div>
      </div>

      <!-- 输入输出区域 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- 输入区域 -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold">输入文本</h2>
            <div class="flex gap-2">
              <button
                @click="pasteFromClipboard"
                class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                粘贴
              </button>
              <button
                @click="clearInput"
                class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                清空
              </button>
            </div>
          </div>

          <textarea
            v-model="inputText"
            @input="handleInput"
            placeholder="请输入要转换的文本..."
            class="w-full h-64 p-4 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          ></textarea>

          <div class="text-sm text-muted-foreground">
            <span>{{ inputText.length }} 个字符</span>
            <span class="mx-2">·</span>
            <span>{{ getWordCount(inputText) }} 个词</span>
          </div>
        </div>

        <!-- 输出区域 -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold">转换结果</h2>
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

          <textarea
            v-model="outputText"
            readonly
            placeholder="转换结果将显示在这里..."
            class="w-full h-64 p-4 bg-muted rounded-lg resize-none focus:outline-none"
          ></textarea>

          <div class="text-sm text-muted-foreground">
            <span>{{ outputText.length }} 个字符</span>
            <span class="mx-2">·</span>
            <span>{{ getWordCount(outputText) }} 个词</span>
          </div>
        </div>
      </div>

      <!-- 预览示例 -->
      <div class="bg-card   rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">转换预览</h2>
        <div class="space-y-3">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div v-for="option in convertOptions" :key="option.value" class="space-y-2">
              <h3 class="font-medium text-sm text-muted-foreground">{{ option.label }}</h3>
              <div class="p-3 bg-muted rounded-lg font-mono text-sm">
                {{ applyTransform(sampleText, option.value) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 相关工具 -->
      <div class="bg-card   rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">相关工具</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NuxtLink
            to="/tools/text-replace"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <FileText class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">文本替换</p>
              <p class="text-xs text-muted-foreground">批量查找替换文本</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
          <NuxtLink
            to="/tools/text-counter"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <FileText class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">字数统计</p>
              <p class="text-xs text-muted-foreground">统计文本字符词数</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
          <NuxtLink
            to="/tools/markdown-editor"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <FileText class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">Markdown编辑器</p>
              <p class="text-xs text-muted-foreground">实时预览编辑</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Type, FileText, ArrowRight } from 'lucide-vue-next'
import Breadcrumb from '~/components/Breadcrumb.vue'

// 分类信息
const category = { id: 'text', name: '文本处理', description: '文本处理工具集合' }

// 状态管理
const inputText = ref('')
const outputText = ref('')
const currentMode = ref('uppercase')
const copied = ref(false)

// 示例文本
const sampleText = 'hello world! this is a SAMPLE text for CASE conversion.'

// 转换选项
const convertOptions = [
  { value: 'uppercase', label: '转大写', icon: Type },
  { value: 'lowercase', label: '转小写', icon: Type },
  { value: 'capitalize', label: '首字母大写', icon: Type },
  { value: 'camelCase', label: '驼峰式', icon: Type },
  { value: 'pascalCase', label: '帕斯卡式', icon: Type },
  { value: 'snakeCase', label: '蛇形式', icon: Type },
  { value: 'kebabCase', label: '短横线式', icon: Type },
  { value: 'alternating', label: '交替大小写', icon: Type }
]

// 转换函数
const applyTransform = (text, mode) => {
  if (!text) return ''

  switch (mode) {
    case 'uppercase':
      return text.toUpperCase()

    case 'lowercase':
      return text.toLowerCase()

    case 'capitalize':
      return text.replace(/\b\w/g, char => char.toUpperCase())

    case 'camelCase':
      return text.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
        return index === 0 ? word.toLowerCase() : word.toUpperCase()
      }).replace(/\s+/g, '')

    case 'pascalCase':
      return text.replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => {
        return word.toUpperCase()
      }).replace(/\s+/g, '')

    case 'snakeCase':
      return text.replace(/\W+/g, ' ')
        .split(/ |\B(?=[A-Z])/)
        .map(word => word.toLowerCase())
        .join('_')

    case 'kebabCase':
      return text.replace(/\W+/g, ' ')
        .split(/ |\B(?=[A-Z])/)
        .map(word => word.toLowerCase())
        .join('-')

    case 'alternating':
      return text.split('').map((char, index) => {
        return index % 2 === 0 ? char.toLowerCase() : char.toUpperCase()
      }).join('')

    default:
      return text
  }
}

// 执行转换
const convertCase = (mode) => {
  currentMode.value = mode
  if (inputText.value) {
    outputText.value = applyTransform(inputText.value, mode)
  }
}

// 处理输入
const handleInput = () => {
  if (inputText.value) {
    outputText.value = applyTransform(inputText.value, currentMode.value)
  } else {
    outputText.value = ''
  }
}

// 获取词数
const getWordCount = (text) => {
  if (!text) return 0
  return text.trim().split(/\s+/).filter(word => word.length > 0).length
}

// 从剪贴板粘贴
const pasteFromClipboard = async () => {
  try {
    const text = await navigator.clipboard.readText()
    inputText.value = text
    handleInput()
  } catch (error) {
    console.error('粘贴失败:', error)
  }
}

// 清空输入
const clearInput = () => {
  inputText.value = ''
  outputText.value = ''
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
  a.download = `converted-${currentMode.value}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// SEO配置
useSeoMeta({
  title: '大小写转换工具 - 在线文本大小写格式转换',
  description: '免费在线文本大小写转换工具，支持大写、小写、首字母大写、驼峰式、蛇形、短横线式等多种格式转换。',
  keywords: ['大小写转换', '文本转换', '驼峰式', '蛇形', '在线工具']
})


</script>