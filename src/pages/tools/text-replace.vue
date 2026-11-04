<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" /> -->

    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">文本替换工具</h1>
      <p class="text-muted-foreground">支持普通文本和正则表达式的批量文本查找替换功能</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="space-y-6">
      <!-- 替换配置 -->
      <div class="bg-card   rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">替换配置</h2>

        <div class="space-y-4">
          <!-- 替换模式 -->
          <div>
            <label class="text-sm font-medium mb-2 block">替换模式</label>
            <div class="flex gap-4">
              <label class="flex items-center">
                <input
                  type="radio"
                  v-model="replaceMode"
                  value="text"
                  class="mr-2"
                />
                <span>普通文本</span>
              </label>
              <label class="flex items-center">
                <input
                  type="radio"
                  v-model="replaceMode"
                  value="regex"
                  class="mr-2"
                />
                <span>正则表达式</span>
              </label>
            </div>
          </div>

          <!-- 查找和替换输入 -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium mb-2 block">查找内容</label>
              <div class="relative">
                <input
                  v-model="searchText"
                  @keyup.enter="performReplace"
                  placeholder="请输入要查找的内容..."
                  class="w-full p-3 pr-10 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  v-if="searchText"
                  @click="searchText = ''"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label class="text-sm font-medium mb-2 block">替换内容</label>
              <input
                v-model="replaceText"
                @keyup.enter="performReplace"
                placeholder="请输入替换内容..."
                class="w-full p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <!-- 正则选项 -->
          <div v-if="replaceMode === 'regex'" class="flex flex-wrap gap-4">
            <label class="flex items-center">
              <input
                type="checkbox"
                v-model="regexOptions.global"
                class="mr-2"
              />
              <span>全局匹配 (g)</span>
            </label>
            <label class="flex items-center">
              <input
                type="checkbox"
                v-model="regexOptions.ignoreCase"
                class="mr-2"
              />
              <span>忽略大小写 (i)</span>
            </label>
            <label class="flex items-center">
              <input
                type="checkbox"
                v-model="regexOptions.multiline"
                class="mr-2"
              />
              <span>多行模式 (m)</span>
            </label>
          </div>

          <!-- 预设替换规则 -->
          <div>
            <label class="text-sm font-medium mb-2 block">预设规则</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="preset in presetRules"
                :key="preset.name"
                @click="applyPreset(preset)"
                class="px-3 py-1 text-sm bg-muted hover:bg-muted/80 rounded transition-colors"
              >
                {{ preset.name }}
              </button>
            </div>
          </div>
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
            placeholder="请输入要处理的文本..."
            class="w-full h-64 p-4 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          ></textarea>

          <div class="text-sm text-muted-foreground">
            <span>{{ inputText.length }} 个字符</span>
          </div>
        </div>

        <!-- 输出区域 -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold">输出结果</h2>
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
            placeholder="替换结果将显示在这里..."
            class="w-full h-64 p-4 bg-muted rounded-lg resize-none"
          ></textarea>

          <div class="text-sm text-muted-foreground">
            <span>{{ outputText.length }} 个字符</span>
            <span v-if="replaceCount > 0" class="ml-2 text-primary">
              （已替换 {{ replaceCount }} 处）
            </span>
          </div>
        </div>
      </div>

      <!-- 执行按钮 -->
      <div class="flex justify-center gap-4">
        <button
          @click="performReplace"
          :disabled="!inputText || !searchText"
          class="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          执行替换
        </button>
        <button
          @click="resetAll"
          class="px-6 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
        >
          重置
        </button>
      </div>

      <!-- 替换历史 -->
      <div v-if="replaceHistory.length > 0" class="bg-card   rounded-lg p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold">替换历史</h2>
          <button
            @click="clearHistory"
            class="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            清空历史
          </button>
        </div>

        <div class="space-y-2">
          <div
            v-for="(item, index) in replaceHistory"
            :key="index"
            class="p-3 bg-muted rounded-lg text-sm"
          >
            <div class="flex items-center justify-between mb-1">
              <span class="font-medium">{{ item.mode === 'regex' ? '正则' : '文本' }}替换</span>
              <span class="text-muted-foreground text-xs">{{ item.time }}</span>
            </div>
            <div class="font-mono text-xs">
              "{{ item.search }}" → "{{ item.replace }}"
            </div>
            <div class="text-muted-foreground text-xs mt-1">
              替换了 {{ item.count }} 处
            </div>
          </div>
        </div>
      </div>

      <!-- 常用正则表达式 -->
      <div class="bg-card   rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">常用正则表达式</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div
            v-for="regex in commonRegex"
            :key="regex.name"
            class="flex items-center justify-between p-3 bg-muted rounded-lg"
          >
            <div>
              <div class="font-medium text-sm">{{ regex.name }}</div>
              <div class="font-mono text-xs text-muted-foreground mt-1">{{ regex.pattern }}</div>
            </div>
            <button
              @click="useRegex(regex)"
              class="px-3 py-1 text-sm bg-background hover:bg-background/80 rounded transition-colors"
            >
              使用
            </button>
          </div>
        </div>
      </div>

      <!-- 相关工具 -->
      <div class="bg-card   rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">相关工具</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NuxtLink
            to="/tools/regex-tester"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Regex class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">正则表达式测试</p>
              <p class="text-xs text-muted-foreground">测试正则表达式</p>
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
              <p class="text-xs text-muted-foreground">统计文本信息</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
          <NuxtLink
            to="/tools/case-converter"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Type class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">大小写转换</p>
              <p class="text-xs text-muted-foreground">转换文本格式</p>
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
import { X, Regex, FileText, Type, ArrowRight } from 'lucide-vue-next'
import Breadcrumb from '~/components/Breadcrumb.vue'

// 分类信息
const category = { id: 'text', name: '文本处理', description: '文本处理工具集合' }

// 状态管理
const inputText = ref('')
const outputText = ref('')
const searchText = ref('')
const replaceText = ref('')
const replaceMode = ref('text')
const replaceCount = ref(0)
const copied = ref(false)
const replaceHistory = ref([])

// 正则选项
const regexOptions = ref({
  global: true,
  ignoreCase: false,
  multiline: false
})

// 预设替换规则
const presetRules = [
  {
    name: '移除多余空格',
    mode: 'regex',
    search: '\\s+',
    replace: ' ',
    options: { global: true }
  },
  {
    name: '移除空行',
    mode: 'regex',
    search: '^\\s*$\\n',
    replace: '',
    options: { global: true, multiline: true }
  },
  {
    name: '首字母大写',
    mode: 'regex',
    search: '\\b\\w',
    replace: (match) => match.toUpperCase(),
    options: { global: true }
  },
  {
    name: '添加逗号',
    mode: 'text',
    search: '\n',
    replace: ',\n',
    options: {}
  },
  {
    name: '移除所有数字',
    mode: 'regex',
    search: '\\d',
    replace: '',
    options: { global: true }
  }
]

// 常用正则表达式
const commonRegex = [
  { name: '邮箱地址', pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}' },
  { name: '手机号', pattern: '1[3-9]\\d{9}' },
  { name: 'URL链接', pattern: 'https?://[^\\s]+' },
  { name: 'IP地址', pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b' },
  { name: '日期', pattern: '\\d{4}-\\d{2}-\\d{2}' },
  { name: '中文字符', pattern: '[\\u4e00-\\u9fa5]+' }
]

// 执行替换
const performReplace = () => {
  if (!inputText.value || !searchText.value) return

  try {
    let result = inputText.value
    let count = 0

    if (replaceMode.value === 'regex') {
      // 构建正则表达式
      const flags = []
      if (regexOptions.value.global) flags.push('g')
      if (regexOptions.value.ignoreCase) flags.push('i')
      if (regexOptions.value.multiline) flags.push('m')

      const regex = new RegExp(searchText.value, flags.join(''))
      const matches = result.match(regex)
      count = matches ? matches.length : 0

      result = result.replace(regex, replaceText.value)
    } else {
      // 普通文本替换
      if (regexOptions.value.global || regexOptions.value.ignoreCase) {
        // 全局替换
        const search = regexOptions.value.ignoreCase
          ? new RegExp(searchText.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
          : new RegExp(searchText.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
        const matches = result.match(search)
        count = matches ? matches.length : 0
        result = result.replace(search, replaceText.value)
      } else {
        // 仅替换第一个
        const index = result.indexOf(searchText.value)
        if (index !== -1) {
          count = 1
          result = result.substring(0, index) + replaceText.value + result.substring(index + searchText.value.length)
        }
      }
    }

    outputText.value = result
    replaceCount.value = count

    // 添加到历史记录
    if (count > 0) {
      replaceHistory.value.unshift({
        mode: replaceMode.value,
        search: searchText.value,
        replace: replaceText.value,
        count: count,
        time: new Date().toLocaleTimeString()
      })

      // 限制历史记录数量
      if (replaceHistory.value.length > 10) {
        replaceHistory.value = replaceHistory.value.slice(0, 10)
      }
    }
  } catch (error) {
    outputText.value = '替换失败：' + error.message
    replaceCount.value = 0
  }
}

// 应用预设规则
const applyPreset = (preset) => {
  replaceMode.value = preset.mode
  searchText.value = preset.search
  replaceText.value = typeof preset.replace === 'function' ? '' : preset.replace

  if (preset.mode === 'regex' && preset.options) {
    Object.assign(regexOptions.value, preset.options)
  }

  if (typeof preset.replace === 'function') {
    // 对于需要函数的预设，直接执行
    outputText.value = inputText.value.replace(
      new RegExp(preset.search, 'g'),
      preset.replace
    )
  }
}

// 使用正则表达式
const useRegex = (regex) => {
  replaceMode.value = 'regex'
  searchText.value = regex.pattern
  regexOptions.value.global = true
}

// 从剪贴板粘贴
const pasteFromClipboard = async () => {
  try {
    const text = await navigator.clipboard.readText()
    inputText.value = text
  } catch (error) {
    console.error('粘贴失败:', error)
  }
}

// 清空输入
const clearInput = () => {
  inputText.value = ''
  outputText.value = ''
  replaceCount.value = 0
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
  a.download = 'replaced-text.txt'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// 重置所有
const resetAll = () => {
  inputText.value = ''
  outputText.value = ''
  searchText.value = ''
  replaceText.value = ''
  replaceCount.value = 0
  replaceMode.value = 'text'
}

// 清空历史
const clearHistory = () => {
  replaceHistory.value = []
}

// SEO配置
useSeoMeta({
  title: '文本替换工具 - 在线批量查找替换文本',
  description: '免费在线文本替换工具，支持普通文本和正则表达式的批量查找替换，提供预设规则和常用正则表达式。',
  keywords: ['文本替换', '查找替换', '正则表达式', '批量替换', '在线工具']
})


</script>