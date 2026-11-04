<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" /> -->

    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">行操作工具</h1>
      <p class="text-muted-foreground">对文本行进行排序、去重、过滤等批量操作</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="space-y-6">
      <!-- 操作选项 -->
      <div class="bg-card   rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">操作选项</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <!-- 排序选项 -->
          <div class="space-y-2">
            <h3 class="font-medium text-sm">排序</h3>
            <div class="space-y-1">
              <button
                @click="sortLines('asc')"
                class="w-full px-3 py-2 text-sm bg-muted hover:bg-muted/80 rounded transition-colors text-left"
              >
                <SortAsc class="w-4 h-4 inline mr-2" />
                升序排序
              </button>
              <button
                @click="sortLines('desc')"
                class="w-full px-3 py-2 text-sm bg-muted hover:bg-muted/80 rounded transition-colors text-left"
              >
                <SortDesc class="w-4 h-4 inline mr-2" />
                降序排序
              </button>
              <button
                @click="sortLines('length')"
                class="w-full px-3 py-2 text-sm bg-muted hover:bg-muted/80 rounded transition-colors text-left"
              >
                <ArrowUpDown class="w-4 h-4 inline mr-2" />
                按长度排序
              </button>
              <button
                @click="sortLines('random')"
                class="w-full px-3 py-2 text-sm bg-muted hover:bg-muted/80 rounded transition-colors text-left"
              >
                <Shuffle class="w-4 h-4 inline mr-2" />
                随机排序
              </button>
            </div>
          </div>

          <!-- 去重选项 -->
          <div class="space-y-2">
            <h3 class="font-medium text-sm">去重</h3>
            <div class="space-y-1">
              <button
                @click="dedupeLines()"
                class="w-full px-3 py-2 text-sm bg-muted hover:bg-muted/80 rounded transition-colors text-left"
              >
                <Filter class="w-4 h-4 inline mr-2" />
                删除重复行
              </button>
              <button
                @click="dedupeLines(true)"
                class="w-full px-3 py-2 text-sm bg-muted hover:bg-muted/80 rounded transition-colors text-left"
              >
                <Filter class="w-4 h-4 inline mr-2" />
                忽略大小写去重
              </button>
              <button
                @click="dedupeLines(false, true)"
                class="w-full px-3 py-2 text-sm bg-muted hover:bg-muted/80 rounded transition-colors text-left"
              >
                <Filter class="w-4 h-4 inline mr-2" />
                去除空格后去重
              </button>
              <button
                @click="keepUniqueLines()"
                class="w-full px-3 py-2 text-sm bg-muted hover:bg-muted/80 rounded transition-colors text-left"
              >
                <Hash class="w-4 h-4 inline mr-2" />
                只保留唯一行
              </button>
            </div>
          </div>

          <!-- 过滤选项 -->
          <div class="space-y-2">
            <h3 class="font-medium text-sm">过滤</h3>
            <div class="space-y-1">
              <button
                @click="filterEmptyLines()"
                class="w-full px-3 py-2 text-sm bg-muted hover:bg-muted/80 rounded transition-colors text-left"
              >
                <MinusCircle class="w-4 h-4 inline mr-2" />
                删除空行
              </button>
              <button
                @click="filterWhitespaceLines()"
                class="w-full px-3 py-2 text-sm bg-muted hover:bg-muted/80 rounded transition-colors text-left"
              >
                <MinusCircle class="w-4 h-4 inline mr-2" />
                删除空白行
              </button>
              <button
                @click="showFilterDialog"
                class="w-full px-3 py-2 text-sm bg-muted hover:bg-muted/80 rounded transition-colors text-left"
              >
                <Search class="w-4 h-4 inline mr-2" />
                按内容过滤
              </button>
              <button
                @click="reverseLines()"
                class="w-full px-3 py-2 text-sm bg-muted hover:bg-muted/80 rounded transition-colors text-left"
              >
                <ArrowUpDown class="w-4 h-4 inline mr-2" />
                反转行顺序
              </button>
            </div>
          </div>
        </div>

        <!-- 其他操作 -->
        <div class="mt-4 pt-4 border-t">
          <h3 class="font-medium text-sm mb-2">其他操作</h3>
          <div class="flex flex-wrap gap-2">
            <button
              @click="addLineNumbers()"
              class="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded transition-colors"
            >
              添加行号
            </button>
            <button
              @click="removeLineNumbers()"
              class="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded transition-colors"
            >
              移除行号
            </button>
            <button
              @click="addPrefix()"
              class="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded transition-colors"
            >
              添加前缀
            </button>
            <button
              @click="addSuffix()"
              class="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded transition-colors"
            >
              添加后缀
            </button>
            <button
              @click="trimLines()"
              class="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded transition-colors"
            >
              去除首尾空格
            </button>
            <button
              @click="joinLines()"
              class="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded transition-colors"
            >
              合并为一行
            </button>
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
            placeholder="请输入要处理的文本，每行一个条目..."
            class="w-full h-64 p-4 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
          ></textarea>

          <div class="text-sm text-muted-foreground">
            <span>{{ lineCount }} 行</span>
            <span class="mx-2">·</span>
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
            placeholder="处理结果将显示在这里..."
            class="w-full h-64 p-4 bg-muted rounded-lg resize-none font-mono text-sm"
          ></textarea>

          <div class="text-sm text-muted-foreground">
            <span>{{ outputLineCount }} 行</span>
            <span class="mx-2">·</span>
            <span>{{ outputText.length }} 个字符</span>
            <span v-if="outputText && lineCount !== outputLineCount" class="ml-2 text-primary">
              ({{ outputLineCount > lineCount ? '+' : '' }}{{ outputLineCount - lineCount }} 行)
            </span>
          </div>
        </div>
      </div>

      <!-- 操作历史 -->
      <div v-if="operationHistory.length > 0" class="bg-card   rounded-lg p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold">操作历史</h2>
          <button
            @click="undoLastOperation"
            :disabled="!canUndo"
            class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            撤销
          </button>
        </div>

        <div class="space-y-2">
          <div
            v-for="(item, index) in operationHistory"
            :key="index"
            class="flex items-center justify-between text-sm p-2 bg-muted rounded"
          >
            <span>{{ item.name }}</span>
            <span class="text-muted-foreground">{{ item.time }}</span>
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
              <p class="text-xs text-muted-foreground">批量查找替换</p>
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
            to="/tools/text-diff"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <FileDiff class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">文本对比</p>
              <p class="text-xs text-muted-foreground">比较文本差异</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- 过滤对话框 -->
    <div v-if="showFilter" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-background rounded-lg p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold mb-4">过滤选项</h3>

        <div class="space-y-4">
          <div>
            <label class="text-sm font-medium mb-2 block">过滤模式</label>
            <select v-model="filterMode" class="w-full p-2 border border-border rounded">
              <option value="include">包含</option>
              <option value="exclude">不包含</option>
              <option value="startsWith">开头是</option>
              <option value="endsWith">结尾是</option>
              <option value="regex">正则表达式</option>
            </select>
          </div>

          <div>
            <label class="text-sm font-medium mb-2 block">过滤内容</label>
            <input
              v-model="filterContent"
              type="text"
              placeholder="请输入过滤内容..."
              class="w-full p-2 border border-border rounded"
            />
          </div>

          <div class="flex justify-end gap-2">
            <button
              @click="closeFilterDialog"
              class="px-4 py-2 text-sm border border-border rounded hover:bg-muted transition-colors"
            >
              取消
            </button>
            <button
              @click="applyFilter"
              class="px-4 py-2 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
            >
              应用
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  SortAsc, SortDesc, ArrowUpDown, Shuffle, Filter,
  MinusCircle, Search, Hash, FileText, FileDiff,
  ArrowRight
} from 'lucide-vue-next'
import Breadcrumb from '~/components/Breadcrumb.vue'

// 分类信息
const category = { id: 'text', name: '文本处理', description: '文本处理工具集合' }

// 状态管理
const inputText = ref('')
const outputText = ref('')
const copied = ref(false)
const operationHistory = ref([])
const historyStack = ref([])

// 过滤对话框状态
const showFilter = ref(false)
const filterMode = ref('include')
const filterContent = ref('')

// 计算属性
const lineCount = computed(() => {
  if (!inputText.value) return 0
  return inputText.value.split('\n').length
})

const outputLineCount = computed(() => {
  if (!outputText.value) return 0
  return outputText.value.split('\n').length
})

const canUndo = computed(() => {
  return operationHistory.value.length > 0
})

// 保存到历史记录
const saveToHistory = (operationName) => {
  operationHistory.value.unshift({
    name: operationName,
    time: new Date().toLocaleTimeString()
  })

  // 保存当前状态到撤销栈
  historyStack.value.unshift({
    input: inputText.value,
    output: outputText.value
  })

  // 限制历史记录数量
  if (operationHistory.value.length > 20) {
    operationHistory.value = operationHistory.value.slice(0, 20)
  }
  if (historyStack.value.length > 10) {
    historyStack.value = historyStack.value.slice(0, 10)
  }
}

// 获取行数组
const getLines = (text) => {
  return text ? text.split('\n') : []
}

// 排序行
const sortLines = (mode) => {
  const lines = getLines(inputText.value)
  if (lines.length === 0) return

  let sorted = [...lines]

  switch (mode) {
    case 'asc':
      sorted.sort((a, b) => a.localeCompare(b))
      break
    case 'desc':
      sorted.sort((a, b) => b.localeCompare(a))
      break
    case 'length':
      sorted.sort((a, b) => a.length - b.length)
      break
    case 'random':
      sorted.sort(() => Math.random() - 0.5)
      break
  }

  outputText.value = sorted.join('\n')
  saveToHistory(`${mode === 'asc' ? '升序' : mode === 'desc' ? '降序' : mode === 'length' ? '按长度' : '随机'}排序`)
}

// 去重
const dedupeLines = (ignoreCase = false, trimSpace = false) => {
  const lines = getLines(inputText.value)
  if (lines.length === 0) return

  const seen = new Set()
  const result = []

  for (let line of lines) {
    let key = line
    if (trimSpace) key = key.trim()
    if (ignoreCase) key = key.toLowerCase()

    if (!seen.has(key)) {
      seen.add(key)
      result.push(line)
    }
  }

  outputText.value = result.join('\n')
  saveToHistory(`删除重复行${ignoreCase ? '(忽略大小写)' : ''}${trimSpace ? '(去除空格)' : ''}`)
}

// 只保留唯一行
const keepUniqueLines = () => {
  const lines = getLines(inputText.value)
  if (lines.length === 0) return

  const counts = {}
  const result = []

  // 统计每行出现次数
  for (let line of lines) {
    counts[line] = (counts[line] || 0) + 1
  }

  // 只保留出现一次的行
  for (let line of lines) {
    if (counts[line] === 1 && !result.includes(line)) {
      result.push(line)
    }
  }

  outputText.value = result.join('\n')
  saveToHistory('只保留唯一行')
}

// 过滤空行
const filterEmptyLines = () => {
  const lines = getLines(inputText.value)
  if (lines.length === 0) return

  const result = lines.filter(line => line.length > 0)
  outputText.value = result.join('\n')
  saveToHistory('删除空行')
}

// 过滤空白行
const filterWhitespaceLines = () => {
  const lines = getLines(inputText.value)
  if (lines.length === 0) return

  const result = lines.filter(line => line.trim().length > 0)
  outputText.value = result.join('\n')
  saveToHistory('删除空白行')
}

// 反转行顺序
const reverseLines = () => {
  const lines = getLines(inputText.value)
  if (lines.length === 0) return

  const result = lines.reverse()
  outputText.value = result.join('\n')
  saveToHistory('反转行顺序')
}

// 添加行号
const addLineNumbers = () => {
  const lines = getLines(inputText.value)
  if (lines.length === 0) return

  const result = lines.map((line, index) => `${index + 1}. ${line}`)
  outputText.value = result.join('\n')
  saveToHistory('添加行号')
}

// 移除行号
const removeLineNumbers = () => {
  const lines = getLines(inputText.value)
  if (lines.length === 0) return

  const result = lines.map(line => line.replace(/^\d+\.\s*/, ''))
  outputText.value = result.join('\n')
  saveToHistory('移除行号')
}

// 添加前缀
const addPrefix = () => {
  const prefix = prompt('请输入要添加的前缀：')
  if (!prefix) return

  const lines = getLines(inputText.value)
  if (lines.length === 0) return

  const result = lines.map(line => prefix + line)
  outputText.value = result.join('\n')
  saveToHistory('添加前缀')
}

// 添加后缀
const addSuffix = () => {
  const suffix = prompt('请输入要添加的后缀：')
  if (!suffix) return

  const lines = getLines(inputText.value)
  if (lines.length === 0) return

  const result = lines.map(line => line + suffix)
  outputText.value = result.join('\n')
  saveToHistory('添加后缀')
}

// 去除首尾空格
const trimLines = () => {
  const lines = getLines(inputText.value)
  if (lines.length === 0) return

  const result = lines.map(line => line.trim())
  outputText.value = result.join('\n')
  saveToHistory('去除首尾空格')
}

// 合并为一行
const joinLines = () => {
  const separator = prompt('请输入分隔符（默认为空格）：', ' ')
  const sep = separator || ' '

  const lines = getLines(inputText.value)
  if (lines.length === 0) return

  outputText.value = lines.join(sep)
  saveToHistory('合并为一行')
}

// 显示过滤对话框
const showFilterDialog = () => {
  showFilter.value = true
}

// 关闭过滤对话框
const closeFilterDialog = () => {
  showFilter.value = false
  filterContent.value = ''
}

// 应用过滤
const applyFilter = () => {
  if (!filterContent.value) return

  const lines = getLines(inputText.value)
  if (lines.length === 0) return

  let result = []

  switch (filterMode.value) {
    case 'include':
      result = lines.filter(line => line.includes(filterContent.value))
      break
    case 'exclude':
      result = lines.filter(line => !line.includes(filterContent.value))
      break
    case 'startsWith':
      result = lines.filter(line => line.startsWith(filterContent.value))
      break
    case 'endsWith':
      result = lines.filter(line => line.endsWith(filterContent.value))
      break
    case 'regex':
      try {
        const regex = new RegExp(filterContent.value)
        result = lines.filter(line => regex.test(line))
      } catch (error) {
        alert('正则表达式错误：' + error.message)
        return
      }
      break
  }

  outputText.value = result.join('\n')
  saveToHistory(`过滤行（${filterMode.value}: ${filterContent.value}）`)
  closeFilterDialog()
}

// 撤销最后一个操作
const undoLastOperation = () => {
  if (historyStack.value.length > 0) {
    const lastState = historyStack.value.shift()
    inputText.value = lastState.input
    outputText.value = lastState.output
    operationHistory.value.shift()
  }
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
  a.download = `processed-lines-${Date.now()}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// SEO配置
useSeoMeta({
  title: '行操作工具 - 在线文本行排序去重过滤',
  description: '免费在线文本行操作工具，支持行排序、去重、过滤、添加行号等功能，批量处理文本行。',
  keywords: ['行操作', '文本排序', '去重', '过滤', '批量处理', '在线工具']
})


</script>