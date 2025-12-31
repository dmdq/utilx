<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">文本缩进格式化工具</h1>
      <p class="text-gray-600 dark:text-gray-400">调整文本缩进，支持空格和Tab互转</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6 mb-8">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">输入文本</h2>
        <textarea
          v-model="inputText"
          class="w-full h-80 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 resize-none font-mono text-sm"
          placeholder="输入需要调整缩进的代码或文本..."
          @input="process"
        ></textarea>
        <div class="mt-4 flex gap-2">
          <button @click="inputText = ''; process()" class="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded">清空</button>
          <button @click="pasteText" class="px-3 py-1 text-sm bg-blue-500 text-white rounded">粘贴</button>
          <button @click="loadSample" class="px-3 py-1 text-sm bg-green-500 text-white rounded">示例</button>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">输出结果</h2>
        <textarea
          v-model="outputText"
          class="w-full h-80 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 resize-none font-mono text-sm"
          readonly
        ></textarea>
        <div class="mt-4 flex gap-2">
          <button @click="copyResult" class="px-3 py-1 text-sm bg-green-500 text-white rounded">复制</button>
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">缩进操作</h2>

      <div class="grid md:grid-cols-2 gap-6">
        <div>
          <label class="block text-sm font-medium mb-2">操作类型</label>
          <div class="flex flex-wrap gap-2">
            <button
              @click="operation = 'add'; process()"
              :class="['px-4 py-2 rounded', operation === 'add' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600']"
            >
              添加缩进
            </button>
            <button
              @click="operation = 'remove'; process()"
              :class="['px-4 py-2 rounded', operation === 'remove' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600']"
            >
              移除缩进
            </button>
            <button
              @click="operation = 'tab2space'; process()"
              :class="['px-4 py-2 rounded', operation === 'tab2space' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600']"
            >
              Tab转空格
            </button>
            <button
              @click="operation = 'space2tab'; process()"
              :class="['px-4 py-2 rounded', operation === 'space2tab' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600']"
            >
              空格转Tab
            </button>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">缩进单位</label>
          <div class="flex gap-2 flex-wrap">
            <button
              v-for="size in [2, 4, 8]"
              :key="size"
              @click="indentSize = size; process()"
              :class="['px-3 py-1 text-sm rounded', indentSize === size ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600']"
            >
              {{ size }} 空格
            </button>
          </div>
        </div>
      </div>

      <div class="mt-4 grid md:grid-cols-2 gap-4">
        <label class="flex items-center gap-2 text-sm">
          <input type="checkbox" v-model="options.preserveEmptyLines" @change="process" class="rounded">
          <span>保留空行</span>
        </label>
        <label class="flex items-center gap-2 text-sm">
          <input type="checkbox" v-model="options.trimTrailing" @change="process" class="rounded">
          <span>去除行尾空白</span>
        </label>
      </div>

      <div class="mt-4">
        <label class="block text-sm font-medium mb-2">缩进级别</label>
        <input
          v-model.number="indentLevel"
          type="number"
          min="0"
          max="20"
          class="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
          @input="operation === 'add' ? process() : null"
        >
        <span class="ml-2 text-sm text-gray-600 dark:text-gray-400">级别（用于添加/移除缩进）</span>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">统计信息</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div class="text-2xl font-bold text-blue-600">{{ stats.lines }}</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">总行数</div>
        </div>
        <div class="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div class="text-2xl font-bold text-green-600">{{ stats.emptyLines }}</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">空行数</div>
        </div>
        <div class="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <div class="text-2xl font-bold text-purple-600">{{ stats.maxIndent }}</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">最大缩进</div>
        </div>
        <div class="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
          <div class="text-2xl font-bold text-orange-600">{{ stats.tabLines }}</div>
          <div class="text-sm text-gray-600 dark:text-gray-400">包含Tab的行</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

useHead({
  title: '文本缩进格式化工具 - 调整代码缩进',
  meta: [{ name: 'description', content: '在线文本缩进格式化工具，支持添加/移除缩进、Tab与空格互转、代码格式化。' }],
  keywords: ['缩进格式化', '代码格式化', 'tab转空格', '空格转tab', '缩进调整']
})

const inputText = ref('')
const outputText = ref('')
const operation = ref('add')
const indentSize = ref(4)
const indentLevel = ref(1)

const options = ref({
  preserveEmptyLines: true,
  trimTrailing: false
})

const stats = ref({
  lines: 0,
  emptyLines: 0,
  maxIndent: 0,
  tabLines: 0
})

function process() {
  const text = inputText.value
  const lines = text.split('\n')
  const indentStr = ' '.repeat(indentSize.value)

  let result: string[] = []
  let maxIndent = 0
  let tabLines = 0
  let emptyLines = 0

  for (const line of lines) {
    // 统计信息
    if (line.trim() === '') {
      emptyLines++
    }
    if (line.includes('\t')) {
      tabLines++
    }
    const currentIndent = line.search(/\S/)
    if (currentIndent > maxIndent) {
      maxIndent = currentIndent
    }

    // 处理空行
    if (line.trim() === '') {
      if (options.value.preserveEmptyLines) {
        result.push(options.value.trimTrailing ? '' : line)
      }
      continue
    }

    let processedLine = line

    switch (operation.value) {
      case 'add':
        // 添加缩进
        for (let i = 0; i < indentLevel.value; i++) {
          processedLine = indentStr + processedLine
        }
        break

      case 'remove':
        // 移除缩进
        for (let i = 0; i < indentLevel.value; i++) {
          if (processedLine.startsWith(indentStr)) {
            processedLine = processedLine.substring(indentStr.length)
          } else if (processedLine.startsWith('\t')) {
            processedLine = processedLine.substring(1)
          } else if (processedLine.startsWith(' ')) {
            processedLine = processedLine.trimStart()
          }
        }
        break

      case 'tab2space':
        // Tab转空格
        let col = 0
        let newLine = ''
        for (let i = 0; i < processedLine.length; i++) {
          const char = processedLine[i]
          if (char === '\t') {
            const spaces = indentSize.value - (col % indentSize.value)
            newLine += ' '.repeat(spaces)
            col += spaces
          } else {
            newLine += char
            col++
          }
        }
        processedLine = newLine
        break

      case 'space2tab':
        // 空格转Tab（仅处理行首）
        const leadingSpaces = processedLine.match(/^ +/)
        if (leadingSpaces) {
          const spaceCount = leadingSpaces[0].length
          const tabCount = Math.floor(spaceCount / indentSize.value)
          const remainingSpaces = spaceCount % indentSize.value
          processedLine = '\t'.repeat(tabCount) + ' '.repeat(remainingSpaces) + processedLine.substring(spaceCount)
        }
        break
    }

    // 去除行尾空白
    if (options.value.trimTrailing) {
      processedLine = processedLine.trimEnd()
    }

    result.push(processedLine)
  }

  // 更新统计
  stats.value = {
    lines: lines.length,
    emptyLines,
    maxIndent,
    tabLines
  }

  outputText.value = result.join('\n')
}

async function pasteText() {
  try {
    inputText.value = await navigator.clipboard.readText()
    process()
  } catch {}
}

async function copyResult() {
  try {
    await navigator.clipboard.writeText(outputText.value)
    alert('已复制')
  } catch {}
}

function loadSample() {
  inputText.value = `function example() {
    const data = {
        name: 'test',
        value: 123
    }
    return data
}`
  process()
}

loadSample()
</script>
