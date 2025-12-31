<template>
  <div class="max-w-6xl mx-auto p-6">
    <!-- 工具标题 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">文本分割合并工具</h1>
      <p class="text-gray-600 dark:text-gray-400">按行、字符、自定义分隔符分割或合并文本，支持批量处理</p>
    </div>

    <!-- 输入区域 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold flex items-center gap-2">
          <FileText class="w-5 h-5 text-blue-500" />
          输入文本
        </h2>
        <div class="flex gap-2">
          <button
            @click="inputText = ''; process()"
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
          <button
            @click="loadSample"
            class="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
          >
            示例
          </button>
        </div>
      </div>

      <textarea
        v-model="inputText"
        class="w-full h-48 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 resize-none font-mono text-sm"
        placeholder="在此输入需要处理的文本..."
        @input="process"
      ></textarea>

      <div class="mt-4 text-sm text-gray-500">
        输入: {{ inputText.length }} 字符 | {{ inputText.split('\n').length }} 行
      </div>
    </div>

    <!-- 模式切换 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
      <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
        <Settings class="w-5 h-5 text-purple-500" />
        操作模式
      </h2>

      <div class="flex flex-wrap gap-2 mb-6">
        <button
          v-for="mode in modes"
          :key="mode.id"
          @click="currentMode = mode.id; process()"
          :class="[
            'px-4 py-2 rounded font-medium',
            currentMode === mode.id
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300'
          ]"
        >
          <component :is="mode.icon" class="w-4 h-4 inline mr-1" />
          {{ mode.name }}
        </button>
      </div>

      <!-- 分割模式选项 -->
      <div v-if="['split-char', 'split-custom'].includes(currentMode)" class="grid md:grid-cols-2 gap-6">
        <div>
          <label class="block text-sm font-medium mb-2">分割方式</label>
          <select
            v-if="currentMode === 'split-char'"
            v-model="splitOptions.by"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            @change="process"
          >
            <option value="char">按字符分割</option>
            <option value="line">按行分割</option>
            <option value="word">按单词分割</option>
            <option value="sentence">按句子分割</option>
          </select>
          <div v-else class="flex gap-2">
            <input
              v-model="splitOptions.customDelimiter"
              type="text"
              class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 font-mono"
              placeholder="输入分隔符"
              @input="process"
            >
            <button
              v-for="preset in ['\n', '\t', ',', ';', ' ']"
              :key="preset"
              @click="splitOptions.customDelimiter = preset; process()"
              class="px-3 py-2 bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 text-sm font-mono"
              :title="preset === '\n' ? '换行符' : preset === '\t' ? 'Tab' : preset === ' ' ? '空格' : preset"
            >
              {{ preset === '\n' ? '⏎' : preset === '\t' ? '⇥' : preset === ' ' ? '␣' : preset }}
            </button>
          </div>
        </div>

        <div v-if="currentMode === 'split-char'" class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">每段字符数</label>
            <input
              v-model.number="splitOptions.chunkSize"
              type="number"
              min="1"
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              @input="process"
            >
          </div>
          <label class="flex items-center gap-2 text-sm">
            <input type="checkbox" v-model="splitOptions.preserveDelimiters" @change="process" class="rounded">
            <span>保留分隔符</span>
          </label>
        </div>
      </div>

      <!-- 合并模式选项 -->
      <div v-if="currentMode === 'merge'" class="grid md:grid-cols-2 gap-6">
        <div>
          <label class="block text-sm font-medium mb-2">合并分隔符</label>
          <div class="flex gap-2">
            <input
              v-model="mergeOptions.delimiter"
              type="text"
              class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 font-mono"
              placeholder="输入分隔符"
              @input="process"
            >
            <button
              v-for="preset in ['\n', ' ', '', ',']"
              :key="preset"
              @click="mergeOptions.delimiter = preset; process()"
              class="px-3 py-2 bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 text-sm font-mono"
              :title="preset === '\n' ? '换行符' : preset === '' ? '无' : preset"
            >
              {{ preset === '\n' ? '⏎' : preset === '' ? '无' : preset === ' ' ? '␣' : preset }}
            </button>
          </div>
        </div>

        <div class="space-y-4">
          <label class="flex items-center gap-2 text-sm">
            <input type="checkbox" v-model="mergeOptions.trim" @change="process" class="rounded">
            <span>去除每段首尾空白</span>
          </label>
          <label class="flex items-center gap-2 text-sm">
            <input type="checkbox" v-model="mergeOptions.skipEmpty" @change="process" class="rounded">
            <span>跳过空行</span>
          </label>
        </div>
      </div>

      <!-- 提取模式选项 -->
      <div v-if="currentMode === 'extract'" class="grid md:grid-cols-2 gap-6">
        <div>
          <label class="block text-sm font-medium mb-2">提取类型</label>
          <select
            v-model="extractOptions.type"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            @change="process"
          >
            <option value="lines">指定行</option>
            <option value="range">行范围</option>
            <option value="regex">正则匹配</option>
            <option value="contains">包含文本</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">参数</label>
          <input
            v-if="extractOptions.type === 'lines'"
            v-model="extractOptions.lines"
            type="text"
            placeholder="例如: 1,3,5-10"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            @input="process"
          >
          <input
            v-else-if="extractOptions.type === 'range'"
            v-model="extractOptions.range"
            type="text"
            placeholder="例如: 5-10"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            @input="process"
          >
          <input
            v-else-if="extractOptions.type === 'regex'"
            v-model="extractOptions.pattern"
            type="text"
            placeholder="正则表达式"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 font-mono"
            @input="process"
          >
          <input
            v-else
            v-model="extractOptions.contains"
            type="text"
            placeholder="包含的文本"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            @input="process"
          >
        </div>
      </div>
    </div>

    <!-- 输出区域 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold flex items-center gap-2">
          <Sparkles class="w-5 h-5 text-green-500" />
          输出结果
        </h2>
        <div class="flex gap-2">
          <button
            v-if="currentMode === 'split-char' || currentMode === 'split-custom'"
            @click="outputAsArray = !outputAsArray"
            class="px-3 py-1 text-sm bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            {{ outputAsArray ? '文本视图' : '数组视图' }}
          </button>
          <button
            @click="copyResult"
            class="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
          >
            复制
          </button>
        </div>
      </div>

      <!-- 数组视图 -->
      <div v-if="outputAsArray && splittedText.length > 0" class="space-y-2 max-h-96 overflow-y-auto">
        <div
          v-for="(item, index) in splittedText"
          :key="index"
          class="flex gap-2 p-2 bg-gray-100 dark:bg-gray-700 rounded font-mono text-sm"
        >
          <span class="text-gray-500 w-12 flex-shrink-0">[{{ index }}]</span>
          <span class="flex-1 break-all">{{ item || '(空)' }}</span>
          <span class="text-gray-500 w-16 flex-shrink-0 text-right">{{ item.length }}字</span>
        </div>
      </div>

      <!-- 文本视图 -->
      <textarea
        v-else
        v-model="outputText"
        class="w-full h-64 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 resize-none font-mono text-sm"
        readonly
      ></textarea>

      <div class="mt-4 grid grid-cols-3 gap-4 text-sm">
        <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
          <span class="text-gray-600 dark:text-gray-400">输出字符:</span>
          <span class="font-bold ml-2">{{ outputText.length }}</span>
        </div>
        <div class="p-3 bg-green-50 dark:bg-green-900/20 rounded">
          <span class="text-gray-600 dark:text-gray-400">输出行数:</span>
          <span class="font-bold ml-2">{{ outputText.split('\n').length }}</span>
        </div>
        <div v-if="splittedText.length > 0" class="p-3 bg-purple-50 dark:bg-purple-900/20 rounded">
          <span class="text-gray-600 dark:text-gray-400">分段数:</span>
          <span class="font-bold ml-2">{{ splittedText.length }}</span>
        </div>
      </div>
    </div>

    <!-- 使用说明 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">使用说明</h2>

      <div class="grid md:grid-cols-2 gap-6 text-sm">
        <div>
          <h3 class="font-medium mb-2">分割模式</h3>
          <ul class="space-y-1 text-gray-600 dark:text-gray-400">
            <li>• <strong>按字符:</strong> 指定每段字符数分割</li>
            <li>• <strong>按行:</strong> 每行作为独立段落</li>
            <li>• <strong>按单词:</strong> 按空格分词后分割</li>
            <li>• <strong>按句子:</strong> 按句号等标点分割</li>
            <li>• <strong>自定义:</strong> 使用任意分隔符</li>
          </ul>
        </div>
        <div>
          <h3 class="font-medium mb-2">合并模式</h3>
          <ul class="space-y-1 text-gray-600 dark:text-gray-400">
            <li>• 选择合并后的分隔符</li>
            <li>• 可选去除每段首尾空白</li>
            <li>• 可选跳过空行</li>
            <li>• 支持自定义分隔符</li>
          </ul>
        </div>
        <div>
          <h3 class="font-medium mb-2">提取模式</h3>
          <ul class="space-y-1 text-gray-600 dark:text-gray-400">
            <li>• <strong>指定行:</strong> 1,3,5-10</li>
            <li>• <strong>行范围:</strong> 5-10</li>
            <li>• <strong>正则:</strong> 匹配正则的行</li>
            <li>• <strong>包含:</strong> 包含指定文本的行</li>
          </ul>
        </div>
        <div>
          <h3 class="font-medium mb-2">其他模式</h3>
          <ul class="space-y-1 text-gray-600 dark:text-gray-400">
            <li>• <strong>去重:</strong> 删除重复行</li>
            <li>• <strong>排序:</strong> 按字母/数字/长度排序</li>
            <li>• <strong>反转:</strong> 倒序文本</li>
            <li>• <strong>编号:</strong> 为每行添加序号</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  FileText,
  Settings,
  Sparkles,
  Scissors,
  Merge,
  Filter,
  ArrowUpDown,
  HashIcon,
  RefreshCw
} from 'lucide-vue-next'

// SEO配置
useHead({
  title: '文本分割合并工具 - 按行/字符/分隔符分割合并文本',
  meta: [
    {
      name: 'description',
      content: '在线文本分割合并工具，支持按行、字符、自定义分隔符分割或合并文本，适用于批量处理、数据整理、日志分析。'
    },
    {
      name: 'keywords',
      content: '文本分割,文本合并,按行分割,批量处理,数据整理,文本处理,字符串分割'
    }
  ]
})

// 模式定义
const modes = [
  { id: 'split-char', name: '按字符分割', icon: Scissors },
  { id: 'split-custom', name: '按分隔符分割', icon: Scissors },
  { id: 'merge', name: '合并文本', icon: Merge },
  { id: 'extract', name: '提取行', icon: Filter },
  { id: 'dedupe', name: '去重', icon: HashIcon },
  { id: 'sort', name: '排序', icon: ArrowUpDown },
  { id: 'reverse', name: '反转', icon: RefreshCw },
  { id: 'number', name: '添加编号', icon: HashIcon }
]

// State
const inputText = ref('')
const outputText = ref('')
const currentMode = ref('split-char')
const outputAsArray = ref(false)

const splitOptions = ref({
  by: 'line',
  chunkSize: 100,
  preserveDelimiters: false,
  customDelimiter: ''
})

const mergeOptions = ref({
  delimiter: '\n',
  trim: false,
  skipEmpty: true
})

const extractOptions = ref({
  type: 'lines',
  lines: '1,3,5',
  range: '1-10',
  pattern: '',
  contains: ''
})

const splittedText = ref<string[]>([])

// 处理文本
function process() {
  const text = inputText.value

  switch (currentMode.value) {
    case 'split-char':
      handleSplitByChar(text)
      break
    case 'split-custom':
      handleSplitByCustom(text)
      break
    case 'merge':
      handleMerge(text)
      break
    case 'extract':
      handleExtract(text)
      break
    case 'dedupe':
      handleDedupe(text)
      break
    case 'sort':
      handleSort(text)
      break
    case 'reverse':
      handleReverse(text)
      break
    case 'number':
      handleNumber(text)
      break
  }
}

// 按字符分割
function handleSplitByChar(text: string) {
  let parts: string[] = []

  switch (splitOptions.value.by) {
    case 'char':
      const size = splitOptions.value.chunkSize || 100
      for (let i = 0; i < text.length; i += size) {
        parts.push(text.slice(i, i + size))
      }
      break
    case 'line':
      parts = text.split('\n')
      break
    case 'word':
      parts = text.split(/\s+/)
      break
    case 'sentence':
      parts = text.split(/[。！？.!?]+/)
      break
  }

  if (splitOptions.value.preserveDelimiters && splitOptions.value.by === 'char') {
    outputText.value = parts.join('\n---分---\n')
  } else {
    outputText.value = parts.join('\n')
  }

  splittedText.value = parts
}

// 按自定义分隔符分割
function handleSplitByCustom(text: string) {
  const delimiter = splitOptions.value.customDelimiter
  if (!delimiter) {
    splittedText.value = [text]
    outputText.value = text
    return
  }

  const parts = text.split(delimiter)
  splittedText.value = parts
  outputText.value = parts.join('\n')
}

// 合并文本
function handleMerge(text: string) {
  let lines = text.split('\n')

  if (mergeOptions.value.trim) {
    lines = lines.map(line => line.trim())
  }

  if (mergeOptions.value.skipEmpty) {
    lines = lines.filter(line => line.length > 0)
  }

  outputText.value = lines.join(mergeOptions.value.delimiter)
  splittedText.value = lines
}

// 提取行
function handleExtract(text: string) {
  const lines = text.split('\n')
  let result: string[] = []

  switch (extractOptions.value.type) {
    case 'lines':
      const lineNums = extractOptions.value.lines.split(',')
        .map(s => s.trim())
        .flatMap(s => {
          if (s.includes('-')) {
            const [start, end] = s.split('-').map(Number)
            return Array.from({ length: end - start + 1 }, (_, i) => start + i)
          }
          return [Number(s)]
        })
      result = lineNums.filter(n => n > 0 && n <= lines.length).map(n => lines[n - 1])
      break

    case 'range':
      const [start, end] = extractOptions.value.range.split('-').map(Number)
      result = lines.slice(start - 1, end)
      break

    case 'regex':
      try {
        const regex = new RegExp(extractOptions.value.pattern, 'i')
        result = lines.filter(line => regex.test(line))
      } catch (e) {
        result = []
      }
      break

    case 'contains':
      result = lines.filter(line => line.includes(extractOptions.value.contains))
      break
  }

  outputText.value = result.join('\n')
  splittedText.value = result
}

// 去重
function handleDedupe(text: string) {
  const lines = text.split('\n')
  const unique = [...new Set(lines)]
  outputText.value = unique.join('\n')
  splittedText.value = unique
}

// 排序
function handleSort(text: string) {
  const lines = text.split('\n')
  const sorted = [...lines].sort((a, b) => a.localeCompare(b, 'zh-CN'))
  outputText.value = sorted.join('\n')
  splittedText.value = sorted
}

// 反转
function handleReverse(text: string) {
  const lines = text.split('\n').reverse()
  outputText.value = lines.join('\n')
  splittedText.value = lines
}

// 添加编号
function handleNumber(text: string) {
  const lines = text.split('\n')
  const numbered = lines.map((line, i) => `${i + 1}. ${line}`)
  outputText.value = numbered.join('\n')
  splittedText.value = numbered
}

// 粘贴文本
async function pasteText() {
  try {
    const text = await navigator.clipboard.readText()
    inputText.value = text
    process()
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

// 加载示例
function loadSample() {
  inputText.value = `这是第一行文本
这是第二行文本
这是第三行文本
这是第四行文本
这是第五行文本
这是第六行文本
这是第七行文本
这是第八行文本
这是第九行文本
这是第十行文本`
  process()
}

// 初始化
loadSample()
</script>
