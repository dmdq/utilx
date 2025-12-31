<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">JSON/XML验证器</h1>
      <p class="text-gray-600 dark:text-gray-400">验证JSON/XML格式，定位错误位置，查看详细错误信息</p>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
      <div class="flex gap-4 mb-4">
        <button
          @click="format = 'json'"
          :class="['px-4 py-2 rounded', format === 'json' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600']"
        >
          JSON验证
        </button>
        <button
          @click="format = 'xml'"
          :class="['px-4 py-2 rounded', format === 'xml' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600']"
        >
          XML验证
        </button>
      </div>
    </div>

    <div class="grid lg:grid-cols-2 gap-6 mb-6">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">输入{{ format.toUpperCase() }}</h2>
          <div class="flex gap-2">
            <button @click="loadSample" class="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded">示例</button>
            <button @click="clearAll" class="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded">清空</button>
          </div>
        </div>
        <textarea
          v-model="inputData"
          class="w-full h-80 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 resize-none font-mono text-sm"
          :placeholder="format === 'json' ? '粘贴JSON...' : '粘贴XML...'"
          @input="validate"
        ></textarea>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">验证结果</h2>
        <div v-if="isValid" class="p-4 bg-green-100 dark:bg-green-900/30 rounded-lg">
          <div class="flex items-center gap-2 text-green-700 dark:text-green-400">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span class="font-medium">{{ format.toUpperCase() }}格式有效</span>
          </div>
        </div>
        <div v-else-if="errorMessage" class="p-4 bg-red-100 dark:bg-red-900/30 rounded-lg">
          <div class="flex items-start gap-2 text-red-700 dark:text-red-400">
            <svg class="w-6 h-6 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
            <div>
              <p class="font-medium mb-1">{{ format.toUpperCase() }}格式无效</p>
              <p class="text-sm">{{ errorMessage }}</p>
              <p v-if="errorLine" class="text-sm mt-1">错误位置: 第 {{ errorLine }} 行, 第 {{ errorColumn }} 列</p>
            </div>
          </div>
        </div>
        <div v-else class="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-500">
          请输入{{ format.toUpperCase() }}数据进行验证
        </div>

        <!-- 格式化后的数据 -->
        <div v-if="formattedData" class="mt-4">
          <h3 class="text-sm font-medium mb-2">格式化预览</h3>
          <textarea
            v-model="formattedData"
            readonly
            class="w-full h-48 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 resize-none font-mono text-sm"
          ></textarea>
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">常见错误与解决</h2>
      <div class="grid md:grid-cols-2 gap-4 text-sm">
        <div class="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <h3 class="font-medium text-red-700 dark:text-red-400 mb-2">JSON常见错误</h3>
          <ul class="space-y-1 text-gray-600 dark:text-gray-400">
            <li>• 缺少逗号或多余逗号</li>
            <li>• 属性名必须使用双引号</li>
            <li>• 未转义的特殊字符</li>
            <li>• 尾部多余逗号</li>
          </ul>
        </div>
        <div class="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
          <h3 class="font-medium text-orange-700 dark:text-orange-400 mb-2">XML常见错误</h3>
          <ul class="space-y-1 text-gray-600 dark:text-gray-400">
            <li>• 标签未正确闭合</li>
            <li>• 特殊字符未转义 (& < >)</li>
            <li>• 属性值未使用引号</li>
            <li>• 声明格式错误</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

useHead({
  title: 'JSON/XML验证器 - 在线格式验证与错误定位',
  meta: [{ name: 'description', content: '在线验证JSON/XML格式，精确定位错误位置，显示详细错误信息和修复建议。' }],
  keywords: ['JSON验证', 'XML验证', 'JSON校验', 'XML校验', '格式检查', '错误定位']
})

const format = ref('json')
const inputData = ref('')
const formattedData = ref('')
const isValid = ref(false)
const errorMessage = ref('')
const errorLine = ref(0)
const errorColumn = ref(0)

const sampleJSON = `{"name":"测试","age":25,"hobbies":["阅读","旅游"]}`
const sampleXML = `<?xml version="1.0" encoding="UTF-8"?><root><user><name>张三</name><age>25</age></user></root>`

function loadSample() {
  if (format.value === 'json') {
    inputData.value = sampleJSON
  } else {
    inputData.value = sampleXML
  }
  validate()
}

function clearAll() {
  inputData.value = ''
  formattedData.value = ''
  isValid.value = false
  errorMessage.value = ''
  errorLine.value = 0
  errorColumn.value = 0
}

function validate() {
  if (!inputData.value) {
    formattedData.value = ''
    isValid.value = false
    errorMessage.value = ''
    return
  }

  if (format.value === 'json') {
    validateJSON()
  } else {
    validateXML()
  }
}

function validateJSON() {
  try {
    const parsed = JSON.parse(inputData.value)
    isValid.value = true
    errorMessage.value = ''
    errorLine.value = 0
    errorColumn.value = 0
    formattedData.value = JSON.stringify(parsed, null, 2)
  } catch (e: any) {
    isValid.value = false
    errorMessage.value = e.message

    // 尝试解析错误位置
    const match = e.message.match(/position (\d+)/)
    if (match) {
      const pos = parseInt(match[1])
      const textBefore = inputData.value.substring(0, pos)
      const lines = textBefore.split('\n')
      errorLine.value = lines.length
      errorColumn.value = lines[lines.length - 1].length + 1
    }
  }
}

function validateXML() {
  const xml = inputData.value

  // 基本XML验证
  const errors: string[] = []

  // 检查声明
  if (xml.includes('<?xml')) {
    if (!xml.match(/<\?xml[^>]*\?>/)) {
      errors.push('XML声明格式错误')
    }
  }

  // 检查标签匹配
  const tags = xml.match(/<\/?[\w-]+(?:\s+[^>]*)?\/?>/g) || []
  const stack: string[] = []

  for (const tag of tags) {
    if (tag.includes('</')) {
      // 闭合标签
      const tagName = tag.match(/<\/([\w-]+)>/)?.[1]
      if (tagName && stack[stack.length - 1] === tagName) {
        stack.pop()
      } else if (tagName) {
        errors.push(`标签 </${tagName}> 未正确闭合`)
      }
    } else if (tag.includes('/>')) {
      // 自闭合标签，无需处理
    } else {
      // 开始标签
      const tagName = tag.match(/<([\w-]+)/)?.[1]
      if (tagName && !tag.endsWith('/>')) {
        stack.push(tagName)
      }
    }
  }

  if (stack.length > 0) {
    errors.push(`以下标签未闭合: ${stack.join(', ')}`)
  }

  // 检查特殊字符转义
  const unescapedChars = xml.match(/&(?!amp;|lt;|gt;|quot;|apos;)/g)
  if (unescapedChars) {
    errors.push('发现未转义的 & 字符')
  }

  if (errors.length > 0) {
    isValid.value = false
    errorMessage.value = errors[0]
  } else {
    isValid.value = true
    errorMessage.value = ''
    // 简单格式化
    formattedData.value = formatXML(xml)
  }
}

function formatXML(xml: string): string {
  let formatted = ''
  let indent = 0
  const tab = '  '

  xml.split(/(<[^>]+>)/g).forEach((node) => {
    if (node.trim() === '') return

    if (node.match(/^<\//)) {
      // 闭合标签
      indent = Math.max(0, indent - 1)
      formatted += tab.repeat(indent) + node + '\n'
    } else if (node.match(/^<\?/)) {
      // 声明
      formatted += node + '\n'
    } else if (node.match(/^<\//) === false && node.match(/\/>$/)) {
      // 自闭合标签
      formatted += tab.repeat(indent) + node + '\n'
    } else if (node.match(/^<\w/)) {
      // 开始标签
      formatted += tab.repeat(indent) + node + '\n'
      indent++
    } else {
      // 内容
      formatted += tab.repeat(indent) + node.trim() + '\n'
    }
  })

  return formatted.trim()
}

watch(format, () => {
  clearAll()
  loadSample()
})

loadSample()
</script>
