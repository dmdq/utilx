<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">文本转表格工具</h1>
      <p class="text-gray-600 dark:text-gray-400">将分隔符分隔的文本转换为表格或Markdown表格</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6 mb-8">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">文本输入</h2>
        <textarea
          v-model="inputText"
          class="w-full h-80 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 resize-none font-mono text-sm"
          placeholder="输入文本，每行一条记录，字段用分隔符分开..."
          @input="convert"
        ></textarea>
        <div class="mt-4 flex gap-2">
          <button @click="inputText = ''; convert()" class="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded">清空</button>
          <button @click="pasteText" class="px-3 py-1 text-sm bg-blue-500 text-white rounded">粘贴</button>
          <button @click="loadSample" class="px-3 py-1 text-sm bg-green-500 text-white rounded">示例</button>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">表格预览</h2>
        <div class="overflow-auto max-h-80 border border-gray-300 dark:border-gray-600 rounded-lg">
          <table class="w-full text-sm">
            <thead class="bg-gray-100 dark:bg-gray-700 sticky top-0">
              <tr>
                <th v-for="(header, i) in headers" :key="i" class="px-4 py-2 text-left border-b border-gray-300 dark:border-gray-600">
                  {{ header }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, ri) in rows" :key="ri" class="border-b border-gray-200 dark:border-gray-700">
                <td v-for="(cell, ci) in row" :key="ci" class="px-4 py-2">
                  {{ cell }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
      <h2 class="text-xl font-semibold mb-4">输出格式</h2>
      <div class="flex flex-wrap gap-2 mb-4">
        <button
          v-for="format in formats"
          :key="format.id"
          @click="outputFormat = format.id; updateOutput()"
          :class="['px-4 py-2 rounded', outputFormat === format.id ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600']"
        >
          {{ format.name }}
        </button>
      </div>
      <textarea
        v-model="outputText"
        class="w-full h-48 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 resize-none font-mono text-sm"
        readonly
      ></textarea>
      <div class="mt-4 flex gap-2">
        <button @click="copyResult" class="px-3 py-1 text-sm bg-green-500 text-white rounded">复制</button>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">设置</h2>
      <div class="grid md:grid-cols-2 gap-6">
        <div>
          <label class="block text-sm font-medium mb-2">分隔符</label>
          <div class="flex gap-2 flex-wrap">
            <button
              v-for="delim in delimiters"
              :key="delim.char"
              @click="delimiter = delim.char; convert()"
              :class="['px-3 py-1 text-sm rounded', delimiter === delim.char ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600']"
            >
              {{ delim.name }}
            </button>
          </div>
          <div class="mt-2">
            <input
              v-model="customDelimiter"
              type="text"
              class="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm"
              placeholder="自定义"
              @input="delimiter = customDelimiter; convert()"
            >
          </div>
        </div>

        <div>
          <label class="flex items-center gap-2 text-sm mb-2">
            <input type="checkbox" v-model="options.hasHeader" @change="convert" class="rounded">
            <span>第一行是表头</span>
          </label>
          <label class="flex items-center gap-2 text-sm mb-2">
            <input type="checkbox" v-model="options.trimWhitespace" @change="convert" class="rounded">
            <span>去除字段空白</span>
          </label>
          <label class="flex items-center gap-2 text-sm">
            <input type="checkbox" v-model="options.skipEmpty" @change="convert" class="rounded">
            <span>跳过空行</span>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

useHead({
  title: '文本转表格工具 - CSV/TSV转表格Markdown',
  meta: [{ name: 'description', content: '在线文本转表格工具，将逗号、制表符等分隔的文本转换为HTML表格或Markdown表格格式。' }],
  keywords: ['文本转表格', 'csv转表格', 'tsv转表格', 'markdown表格', '表格生成器']
})

const inputText = ref('')
const outputText = ref('')
const outputFormat = ref('markdown')
const delimiter = ref(',')
const customDelimiter = ref('')

const options = ref({
  hasHeader: true,
  trimWhitespace: true,
  skipEmpty: true
})

const delimiters = [
  { char: ',', name: '逗号 (,)' },
  { char: '\t', name: '制表符 (Tab)' },
  { char: ';', name: '分号 (;)' },
  { char: '|', name: '竖线 (|)' },
  { char: ' ', name: '空格' }
]

const formats = [
  { id: 'markdown', name: 'Markdown表格' },
  { id: 'html', name: 'HTML表格' },
  { id: 'csv', name: 'CSV' },
  { id: 'json', name: 'JSON数组' }
]

const headers = ref<string[]>([])
const rows = ref<string[][]>([])

function convert() {
  const text = inputText.value
  const lines = text.split('\n').filter(line => {
    if (!options.value.skipEmpty) return true
    return line.trim() !== ''
  })

  if (lines.length === 0) {
    headers.value = []
    rows.value = []
    updateOutput()
    return
  }

  // 解析每一行
  const parsed = lines.map(line => {
    const parts = line.split(delimiter.value)
    return options.value.trimWhitespace ? parts.map(p => p.trim()) : parts
  })

  // 分离表头和数据
  if (options.value.hasHeader && parsed.length > 0) {
    headers.value = parsed[0]
    rows.value = parsed.slice(1)
  } else {
    if (parsed.length > 0) {
      headers.value = parsed[0].map((_, i) => `列${i + 1}`)
      rows.value = parsed
    } else {
      headers.value = []
      rows.value = []
    }
  }

  updateOutput()
}

function updateOutput() {
  if (headers.value.length === 0) {
    outputText.value = ''
    return
  }

  switch (outputFormat.value) {
    case 'markdown':
      outputText.value = toMarkdown()
      break
    case 'html':
      outputText.value = toHTML()
      break
    case 'csv':
      outputText.value = toCSV()
      break
    case 'json':
      outputText.value = toJSON()
      break
  }
}

function toMarkdown(): string {
  let result = '| ' + headers.value.join(' | ') + ' |\n'
  result += '| ' + headers.value.map(() => '---').join(' | ') + ' |\n'

  for (const row of rows.value) {
    result += '| ' + row.join(' | ') + ' |\n'
  }

  return result.trim()
}

function toHTML(): string {
  let result = '<table>\n'
  result += '  <thead>\n    <tr>\n'
  for (const h of headers.value) {
    result += `      <th>${h}</th>\n`
  }
  result += '    </tr>\n  </thead>\n'
  result += '  <tbody>\n'

  for (const row of rows.value) {
    result += '    <tr>\n'
    for (const cell of row) {
      result += `      <td>${cell}</td>\n`
    }
    result += '    </tr>\n'
  }

  result += '  </tbody>\n</table>'
  return result
}

function toCSV(): string {
  let result = headers.value.join(',') + '\n'
  for (const row of rows.value) {
    result += row.join(',') + '\n'
  }
  return result.trim()
}

function toJSON(): string {
  const data = rows.value.map(row => {
    const obj: Record<string, string> = {}
    headers.value.forEach((h, i) => {
      obj[h] = row[i] || ''
    })
    return obj
  })
  return JSON.stringify(data, null, 2)
}

async function pasteText() {
  try {
    inputText.value = await navigator.clipboard.readText()
    convert()
  } catch {}
}

async function copyResult() {
  try {
    await navigator.clipboard.writeText(outputText.value)
    alert('已复制')
  } catch {}
}

function loadSample() {
  inputText.value = `姓名,年龄,城市,职业
张三,25,北京,工程师
李四,30,上海,设计师
王五,28,深圳,产品经理`
  convert()
}

loadSample()
</script>
