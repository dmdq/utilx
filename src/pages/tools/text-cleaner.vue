<template>
  <div class="max-w-6xl mx-auto p-6">
    <!-- 工具标题 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">文本清洗工具</h1>
      <p class="text-gray-600 dark:text-gray-400">去除特殊字符、多余空白、不可见字符，适用于日志处理、数据清洗</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6 mb-8">
      <!-- 输入区域 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold flex items-center gap-2">
            <FileText class="w-5 h-5 text-blue-500" />
            输入文本
          </h2>
          <div class="flex gap-2">
            <button
              @click="inputText = ''"
              class="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300"
            >
              清空
            </button>
            <button
              @click="pasteText"
              class="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              粘贴
            </button>
          </div>
        </div>

        <textarea
          v-model="inputText"
          class="w-full h-64 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 resize-none font-mono text-sm"
          placeholder="在此输入需要清洗的文本..."
          @input="cleanText"
        ></textarea>

        <div class="mt-4 text-sm text-gray-500">
          字符数: {{ inputText.length }} | 行数: {{ inputText.split('\n').length }}
        </div>
      </div>

      <!-- 输出区域 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold flex items-center gap-2">
            <Sparkles class="w-5 h-5 text-green-500" />
            清洗结果
          </h2>
          <div class="flex gap-2">
            <button
              @click="copyResult"
              class="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
            >
              复制
            </button>
          </div>
        </div>

        <textarea
          v-model="outputText"
          class="w-full h-64 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 resize-none font-mono text-sm"
          placeholder="清洗后的文本将显示在这里..."
          readonly
        ></textarea>

        <div class="mt-4 text-sm text-gray-500">
          字符数: {{ outputText.length }} | 减少: {{ inputText.length - outputText.length }} 字符
        </div>
      </div>
    </div>

    <!-- 清洗选项 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
      <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
        <Settings class="w-5 h-5 text-purple-500" />
        清洗选项
      </h2>

      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <!-- 空白字符处理 -->
        <div class="p-4 border dark:border-gray-700 rounded-lg">
          <h3 class="font-medium mb-3 text-blue-600">空白字符处理</h3>
          <div class="space-y-2">
            <label class="flex items-center gap-2 text-sm">
              <input type="checkbox" v-model="options.removeExtraSpaces" @change="cleanText" class="rounded">
              <span>去除多余空格</span>
            </label>
            <label class="flex items-center gap-2 text-sm">
              <input type="checkbox" v-model="options.removeExtraLines" @change="cleanText" class="rounded">
              <span>去除多余空行</span>
            </label>
            <label class="flex items-center gap-2 text-sm">
              <input type="checkbox" v-model="options.trimLines" @change="cleanText" class="rounded">
              <span>去除每行首尾空白</span>
            </label>
            <label class="flex items-center gap-2 text-sm">
              <input type="checkbox" v-model="options.removeTabs" @change="cleanText" class="rounded">
              <span>将Tab转空格</span>
            </label>
          </div>
        </div>

        <!-- 特殊字符处理 -->
        <div class="p-4 border dark:border-gray-700 rounded-lg">
          <h3 class="font-medium mb-3 text-green-600">特殊字符处理</h3>
          <div class="space-y-2">
            <label class="flex items-center gap-2 text-sm">
              <input type="checkbox" v-model="options.removePunctuation" @change="cleanText" class="rounded">
              <span>去除标点符号</span>
            </label>
            <label class="flex items-center gap-2 text-sm">
              <input type="checkbox" v-model="options.removeSpecialChars" @change="cleanText" class="rounded">
              <span>去除特殊符号</span>
            </label>
            <label class="flex items-center gap-2 text-sm">
              <input type="checkbox" v-model="options.removeInvisible" @change="cleanText" class="rounded">
              <span>去除不可见字符</span>
            </label>
            <label class="flex items-center gap-2 text-sm">
              <input type="checkbox" v-model="options.removeControlChars" @change="cleanText" class="rounded">
              <span>去除控制字符</span>
            </label>
          </div>
        </div>

        <!-- 内容处理 -->
        <div class="p-4 border dark:border-gray-700 rounded-lg">
          <h3 class="font-medium mb-3 text-purple-600">内容处理</h3>
          <div class="space-y-2">
            <label class="flex items-center gap-2 text-sm">
              <input type="checkbox" v-model="options.removeNumbers" @change="cleanText" class="rounded">
              <span>去除数字</span>
            </label>
            <label class="flex items-center gap-2 text-sm">
              <input type="checkbox" v-model="options.removeLetters" @change="cleanText" class="rounded">
              <span>去除字母</span>
            </label>
            <label class="flex items-center gap-2 text-sm">
              <input type="checkbox" v-model="options.removeChinese" @change="cleanText" class="rounded">
              <span>去除中文</span>
            </label>
            <label class="flex items-center gap-2 text-sm">
              <input type="checkbox" v-model="options.KeepOnlyChinese" @change="cleanText" class="rounded">
              <span>仅保留中文</span>
            </label>
          </div>
        </div>
      </div>

      <!-- 快捷预设 -->
      <div class="mt-6">
        <h3 class="font-medium mb-3">快捷预设</h3>
        <div class="flex flex-wrap gap-2">
          <button
            @click="applyPreset('clean')"
            class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            标准清洗
          </button>
          <button
            @click="applyPreset('log')"
            class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            日志清洗
          </button>
          <button
            @click="applyPreset('code')"
            class="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            代码清洗
          </button>
          <button
            @click="applyPreset('data')"
            class="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            数据清洗
          </button>
          <button
            @click="applyPreset('minimal')"
            class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            重置选项
          </button>
        </div>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
      <h2 class="text-xl font-semibold mb-4">统计信息</h2>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
          <div class="text-2xl font-bold text-blue-600">{{ stats.originalChars }}</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">原始字符</div>
        </div>
        <div class="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
          <div class="text-2xl font-bold text-green-600">{{ stats.cleanedChars }}</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">清洗后字符</div>
        </div>
        <div class="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
          <div class="text-2xl font-bold text-purple-600">{{ stats.removedChars }}</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">移除字符</div>
        </div>
        <div class="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-center">
          <div class="text-2xl font-bold text-orange-600">{{ stats.reductionRate }}%</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">减少比例</div>
        </div>
      </div>
    </div>

    <!-- 使用说明 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
      <h2 class="text-xl font-semibold mb-4">使用说明</h2>
      <div class="grid md:grid-cols-2 gap-6 text-sm text-gray-600 dark:text-gray-400">
        <div>
          <h3 class="font-medium mb-2 text-gray-800 dark:text-gray-200">空白字符处理</h3>
          <ul class="space-y-1 list-disc list-inside">
            <li><strong>多余空格:</strong> 将连续多个空格合并为一个</li>
            <li><strong>多余空行:</strong> 删除连续的空行，只保留一行</li>
            <li><strong>首尾空白:</strong> 去除每行开头和结尾的空白</li>
            <li><strong>Tab转空格:</strong> 将制表符转换为4个空格</li>
          </ul>
        </div>
        <div>
          <h3 class="font-medium mb-2 text-gray-800 dark:text-gray-200">特殊字符处理</h3>
          <ul class="space-y-1 list-disc list-inside">
            <li><strong>标点符号:</strong> 去除中英文标点符号</li>
            <li><strong>特殊符号:</strong> 去除@#$%^&*等特殊符号</li>
            <li><strong>不可见字符:</strong> 去除零宽字符等</li>
            <li><strong>控制字符:</strong> 去除换行符、回车符外的控制字符</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 相关工具 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">相关工具</h2>
      <div class="grid md:grid-cols-4 gap-4">
        <NuxtLink to="/tools/text-counter" class="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <FileText class="w-8 h-8 text-blue-500 mb-2" />
          <h3 class="font-medium">字数统计</h3>
          <p class="text-sm text-gray-500">统计字数、字符数</p>
        </NuxtLink>
        <NuxtLink to="/tools/text-statistics" class="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <BarChart3 class="w-8 h-8 text-green-500 mb-2" />
          <h3 class="font-medium">文本统计</h3>
          <p class="text-sm text-gray-500">词频统计分析</p>
        </NuxtLink>
        <NuxtLink to="/tools/text-replace" class="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <Replace class="w-8 h-8 text-purple-500 mb-2" />
          <h3 class="font-medium">文本替换</h3>
          <p class="text-sm text-gray-500">批量查找替换</p>
        </NuxtLink>
        <NuxtLink to="/tools/case-converter" class="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <Type class="w-8 h-8 text-orange-500 mb-2" />
          <h3 class="font-medium">大小写转换</h3>
          <p class="text-sm text-gray-500">文本大小写转换</p>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  FileText,
  Sparkles,
  Settings,
  BarChart3,
  Replace,
  Type
} from 'lucide-vue-next'

// SEO配置
useHead({
  title: '文本清洗工具 - 在线去除特殊字符、空白字符、控制字符',
  meta: [
    {
      name: 'description',
      content: '在线文本清洗工具，支持去除特殊字符、多余空白、不可见字符、控制字符，适用于日志处理、数据清洗、文本格式化。'
    },
    {
      name: 'keywords',
      content: '文本清洗,去除特殊字符,去除空白字符,数据清洗,日志处理,文本格式化,去除控制字符'
    }
  ]
})

// State
const inputText = ref('')
const outputText = ref('')

const options = ref({
  removeExtraSpaces: false,
  removeExtraLines: false,
  trimLines: false,
  removeTabs: false,
  removePunctuation: false,
  removeSpecialChars: false,
  removeInvisible: false,
  removeControlChars: false,
  removeNumbers: false,
  removeLetters: false,
  removeChinese: false,
  KeepOnlyChinese: false
})

// 统计信息
const stats = computed(() => {
  const original = inputText.value.length
  const cleaned = outputText.value.length
  const removed = original - cleaned
  const reductionRate = original > 0 ? ((removed / original) * 100).toFixed(1) : '0.0'

  return {
    originalChars: original,
    cleanedChars: cleaned,
    removedChars: removed,
    reductionRate
  }
})

// 清洗文本
function cleanText() {
  let text = inputText.value

  // 空白字符处理
  if (options.value.removeExtraSpaces) {
    text = text.replace(/[ \u3000]+/g, ' ')
  }
  if (options.value.removeExtraLines) {
    text = text.replace(/\n{3,}/g, '\n\n')
  }
  if (options.value.trimLines) {
    text = text.split('\n').map(line => line.trim()).join('\n')
  }
  if (options.value.removeTabs) {
    text = text.replace(/\t/g, '    ')
  }

  // 特殊字符处理
  if (options.value.removePunctuation) {
    text = text.replace(/[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~，。！？；：""''（）【】《》、]/g, '')
  }
  if (options.value.removeSpecialChars) {
    text = text.replace(/[~`!@#$%^&*()\-_=+[\]{}|\\;:'",<.>/?]/g, '')
  }
  if (options.value.removeInvisible) {
    text = text.replace(/[\u200B-\u200D\uFEFF]/g, '')
  }
  if (options.value.removeControlChars) {
    text = text.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '')
  }

  // 内容处理
  if (options.value.removeNumbers) {
    text = text.replace(/\d/g, '')
  }
  if (options.value.removeLetters) {
    text = text.replace(/[a-zA-Z]/g, '')
  }
  if (options.value.removeChinese) {
    text = text.replace(/[\u4e00-\u9fa5]/g, '')
  }
  if (options.value.KeepOnlyChinese) {
    text = text.replace(/[^\u4e00-\u9fa5\n]/g, '')
  }

  outputText.value = text
}

// 应用预设
function applyPreset(type: string) {
  // 重置所有选项
  Object.keys(options.value).forEach(key => {
    options.value[key] = false
  })

  switch (type) {
    case 'clean':
      options.value.removeExtraSpaces = true
      options.value.removeExtraLines = true
      options.value.trimLines = true
      break
    case 'log':
      options.value.removeExtraSpaces = true
      options.value.trimLines = true
      options.value.removeInvisible = true
      options.value.removeControlChars = true
      break
    case 'code':
      options.value.removeExtraSpaces = false
      options.value.trimLines = true
      options.value.removeTabs = true
      options.value.removeExtraLines = true
      break
    case 'data':
      options.value.removeExtraSpaces = true
      options.value.removeExtraLines = true
      options.value.trimLines = true
      options.value.removeInvisible = true
      options.value.removeControlChars = true
      break
    case 'minimal':
      // 已重置
      break
  }

  cleanText()
}

// 粘贴文本
async function pasteText() {
  try {
    const text = await navigator.clipboard.readText()
    inputText.value = text
    cleanText()
  } catch (err) {
    console.error('Failed to paste:', err)
  }
}

// 复制结果
async function copyResult() {
  try {
    await navigator.clipboard.writeText(outputText.value)
    alert('已复制到剪贴板')
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}

// 初始化示例
inputText.value = `  这是一段  包含  多余空格  的文本




还有多余空行


\t包含Tab字符\t\t
特殊符号: @#$%^&*
不可见字符: ​‌‍
控制字符: `

cleanText()
</script>
