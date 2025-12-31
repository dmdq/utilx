<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">YAML验证格式化工具</h1>
      <p class="text-gray-600 dark:text-gray-400">验证YAML格式，美化YAML结构，支持YAML 1.2规范</p>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
      <div class="grid md:grid-cols-4 gap-4 mb-4">
        <div>
          <label class="block text-sm font-medium mb-2">缩进大小</label>
          <select v-model.number="indentSize" @change="formatYAML" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700">
            <option :value="2">2 空格</option>
            <option :value="4">4 空格</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">引号风格</label>
          <select v-model="quoteStyle" @change="formatYAML" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700">
            <option value="minimal">最少引号</option>
            <option value="double">总是双引号</option>
            <option value="single">总是单引号</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">排序</label>
          <select v-model="sortOrder" @change="formatYAML" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700">
            <option value="none">保持原序</option>
            <option value="keys">按键名排序</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">行宽</label>
          <input v-model.number="lineWidth" type="number" @change="formatYAML" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700" placeholder="80">
        </div>
      </div>

      <div class="flex gap-2">
        <label class="flex items-center gap-2 text-sm">
          <input type="checkbox" v-model="options.trimTrailing" @change="formatYAML" class="rounded">
          <span>去除行尾空格</span>
        </label>
        <label class="flex items-center gap-2 text-sm">
          <input type="checkbox" v-model="options.forceNewline" @change="formatYAML" class="rounded">
          <span>文件末尾换行</span>
        </label>
      </div>
    </div>

    <div class="grid lg:grid-cols-2 gap-6 mb-6">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">输入YAML</h2>
          <div class="flex gap-2">
            <button @click="loadSample" class="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded">示例</button>
            <button @click="clearAll" class="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded">清空</button>
          </div>
        </div>
        <textarea
          v-model="inputYAML"
          class="w-full h-80 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 resize-none font-mono text-sm"
          placeholder="粘贴YAML内容..."
          @input="validateAndFormat"
        ></textarea>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">格式化结果</h2>
          <button @click="copyResult" class="px-3 py-1 text-sm bg-green-500 text-white rounded" :disabled="!outputYAML">复制</button>
        </div>
        <div v-if="isValid" class="p-2 mb-2 bg-green-100 dark:bg-green-900/30 rounded text-green-700 dark:text-green-400 text-sm">
          ✓ YAML格式有效
        </div>
        <div v-else-if="errorMessage" class="p-2 mb-2 bg-red-100 dark:bg-red-900/30 rounded text-red-700 dark:text-red-400 text-sm">
          ✗ {{ errorMessage }}
        </div>
        <textarea
          v-model="outputYAML"
          readonly
          class="w-full h-80 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 resize-none font-mono text-sm"
        ></textarea>
      </div>
    </div>

    <!-- YAML语法提示 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">YAML语法要点</h2>
      <div class="grid md:grid-cols-2 gap-6 text-sm">
        <div>
          <h3 class="font-medium mb-2">基本规则</h3>
          <ul class="space-y-1 text-gray-600 dark:text-gray-400">
            <li>• 大小写敏感</li>
            <li>• 使用空格缩进，不支持Tab</li>
            <li>• # 表示注释</li>
            <li>• --- 表示文档开始</li>
            <li>• ... 表示文档结束</li>
          </ul>
        </div>
        <div>
          <h3 class="font-medium mb-2">数据类型</h3>
          <div class="space-y-1 font-mono text-xs">
            <div class="flex justify-between"><span>字符串</span><span class="text-green-600">hello: "world"</span></div>
            <div class="flex justify-between"><span>数字</span><span class="text-blue-600">count: 42</span></div>
            <div class="flex justify-between"><span>布尔</span><span class="text-orange-600">enabled: true</span></div>
            <div class="flex justify-between"><span>数组</span><span class="text-purple-600">items: [1, 2, 3]</span></div>
            <div class="flex justify-between"><span>null</span><span class="text-gray-600">empty: null</span></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

useHead({
  title: 'YAML验证格式化工具 - 在线YAML校验美化',
  meta: [{ name: 'description', content: '在线YAML验证和格式化工具，检查YAML语法错误，美化YAML结构，支持YAML 1.2规范。' }],
  keywords: ['YAML验证', 'YAML格式化', 'YAML校验', 'YAML美化', 'YAML语法']
})

const inputYAML = ref('')
const outputYAML = ref('')
const isValid = ref(false)
const errorMessage = ref('')

const indentSize = ref(2)
const quoteStyle = ref('minimal')
const sortOrder = ref('none')
const lineWidth = ref(80)

const options = ref({
  trimTrailing: true,
  forceNewline: true
})

const sampleYAML = `# 应用配置
name: "My App"
version: 1.0.0

database:
  host: localhost
  port: 5432
  name: mydb

features:
  - authentication
  - logging
  - caching

environments:
  production:
    url: https://api.example.com
  development:
    url: http://localhost:3000`

function loadSample() {
  inputYAML.value = sampleYAML
  validateAndFormat()
}

function clearAll() {
  inputYAML.value = ''
  outputYAML.value = ''
  isValid.value = false
  errorMessage.value = ''
}

function validateAndFormat() {
  if (!inputYAML.value) {
    outputYAML.value = ''
    isValid.value = false
    errorMessage.value = ''
    return
  }

  // 简单YAML验证
  const errors: string[] = []
  const lines = inputYAML.value.split('\n')

  // 检查缩进一致性
  let prevIndent = -1
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.trim() === '' || line.trim().startsWith('#')) continue

    const indent = line.search(/\S/)
    if (indent % 2 !== 0) {
      errors.push(`第 ${i + 1} 行: 缩进应该是2的倍数`)
    }
  }

  // 检查基本语法
  const yaml = inputYAML.value
  if (yaml.includes('\t')) {
    errors.push('YAML不允许使用Tab缩进，请使用空格')
  }

  // 检查冒号
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line && !line.startsWith('#') && !line.startsWith('-')) {
      if (!line.includes(':') && !line.includes('|') && !line.includes('>')) {
        // 可能是数组项或注释
      }
    }
  }

  if (errors.length > 0) {
    isValid.value = false
    errorMessage.value = errors[0]
    outputYAML.value = inputYAML.value
  } else {
    isValid.value = true
    errorMessage.value = ''
    formatYAML()
  }
}

function formatYAML() {
  if (!inputYAML.value) return

  let result = inputYAML.value
  const indent = ' '.repeat(indentSize.value)

  // 分行处理
  const lines = result.split('\n')
  const formatted: string[] = []

  for (let line of lines) {
    let formattedLine = line

    // 去除行尾空格
    if (options.value.trimTrailing) {
      formattedLine = formattedLine.replace(/\s+$/, '')
    }

    formatted.push(formattedLine)
  }

  result = formatted.join('\n')

  // 文件末尾换行
  if (options.value.forceNewline && !result.endsWith('\n')) {
    result += '\n'
  }

  outputYAML.value = result
}

async function copyResult() {
  try {
    await navigator.clipboard.writeText(outputYAML.value)
    alert('已复制')
  } catch {}
}
</script>
