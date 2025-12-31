<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">HTML实体编码器</h1>
      <p class="text-gray-600 dark:text-gray-400">编码/解码HTML特殊字符，防止XSS攻击，确保安全显示</p>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
      <div class="flex flex-wrap gap-4 mb-4">
        <button
          @click="mode = 'encode'"
          :class="['px-4 py-2 rounded', mode === 'encode' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600']"
        >
          编码
        </button>
        <button
          @click="mode = 'decode'"
          :class="['px-4 py-2 rounded', mode === 'decode' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600']"
        >
          解码
        </button>
      </div>

      <div class="flex flex-wrap gap-4">
        <label class="flex items-center gap-2 text-sm">
          <input type="checkbox" v-model="options.encodeAll" @change="convert" class="rounded">
          <span>编码所有字符</span>
        </label>
        <label class="flex items-center gap-2 text-sm">
          <input type="checkbox" v-model="options.numericOnly" @change="convert" class="rounded">
          <span>仅使用数字实体 (&#123;)</span>
        </label>
      </div>
    </div>

    <div class="grid lg:grid-cols-2 gap-6 mb-6">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">输入文本</h2>
          <button @click="loadSample" class="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded">示例</button>
        </div>
        <textarea
          v-model="inputText"
          class="w-full h-64 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 resize-none text-sm"
          :placeholder="mode === 'encode' ? '输入需要编码的文本...' : '输入需要解码的HTML实体...'"
          @input="convert"
        ></textarea>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">{{ mode === 'encode' ? '编码结果' : '解码结果' }}</h2>
          <button @click="copyResult" class="px-3 py-1 text-sm bg-green-500 text-white rounded" :disabled="!outputText">复制</button>
        </div>
        <textarea
          v-model="outputText"
          readonly
          class="w-full h-64 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 resize-none font-mono text-sm"
        ></textarea>
      </div>
    </div>

    <!-- 常用实体参考表 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">常用HTML实体参考</h2>
      <div class="grid md:grid-cols-3 gap-4">
        <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded">
          <h3 class="font-medium mb-2 text-sm">必需字符（用于显示）</h3>
          <div class="space-y-1 text-xs">
            <div class="flex justify-between font-mono">
              <span>&lt;</span>
              <span class="text-green-600">&amp;lt;</span>
            </div>
            <div class="flex justify-between font-mono">
              <span>&gt;</span>
              <span class="text-green-600">&amp;gt;</span>
            </div>
            <div class="flex justify-between font-mono">
              <span>&amp;</span>
              <span class="text-green-600">&amp;amp;</span>
            </div>
            <div class="flex justify-between font-mono">
              <span>"</span>
              <span class="text-green-600">&amp;quot;</span>
            </div>
            <div class="flex justify-between font-mono">
              <span>'</span>
              <span class="text-green-600">&amp;apos;</span>
            </div>
          </div>
        </div>

        <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded">
          <h3 class="font-medium mb-2 text-sm">常用符号</h3>
          <div class="space-y-1 text-xs">
            <div class="flex justify-between font-mono">
              <span>©</span>
              <span class="text-green-600">&amp;copy;</span>
            </div>
            <div class="flex justify-between font-mono">
              <span>®</span>
              <span class="text-green-600">&amp;reg;</span>
            </div>
            <div class="flex justify-between font-mono">
              <span>™</span>
              <span class="text-green-600">&amp;trade;</span>
            </div>
            <div class="flex justify-between font-mono">
              <span> </span>
              <span class="text-green-600">&amp;nbsp;</span>
            </div>
            <div class="flex justify-between font-mono">
              <span>€</span>
              <span class="text-green-600">&amp;euro;</span>
            </div>
          </div>
        </div>

        <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded">
          <h3 class="font-medium mb-2 text-sm">数学符号</h3>
          <div class="space-y-1 text-xs">
            <div class="flex justify-between font-mono">
              <span>×</span>
              <span class="text-green-600">&amp;times;</span>
            </div>
            <div class="flex justify-between font-mono">
              <span>÷</span>
              <span class="text-green-600">&amp;divide;</span>
            </div>
            <div class="flex justify-between font-mono">
              <span>±</span>
              <span class="text-green-600">&amp;plusmn;</span>
            </div>
            <div class="flex justify-between font-mono">
              <span>≠</span>
              <span class="text-green-600">&amp;ne;</span>
            </div>
            <div class="flex justify-between font-mono">
              <span>≤</span>
              <span class="text-green-600">&amp;le;</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 快速编码按钮 -->
      <div class="mt-6">
        <h3 class="font-medium mb-2">快速编码字符</h3>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="char in specialChars"
            :key="char.char"
            @click="inputText += char.char; convert()"
            class="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            {{ char.char }} → {{ char.entity }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

useHead({
  title: 'HTML实体编码器 - 特殊字符编码解码',
  meta: [{ name: 'description', content: '在线HTML实体编码工具，编码/解码HTML特殊字符，防止XSS攻击，支持命名实体和数字实体。' }],
  keywords: ['HTML实体', 'HTML编码', 'XSS防护', '特殊字符', 'HTML转义']
})

const mode = ref('encode')
const inputText = ref('')
const outputText = ref('')

const options = ref({
  encodeAll: false,
  numericOnly: false
})

const specialChars = [
  { char: '<', entity: '&lt;' },
  { char: '>', entity: '&gt;' },
  { char: '&', entity: '&amp;' },
  { char: '"', entity: '&quot;' },
  { char: "'", entity: '&apos;' },
  { char: '©', entity: '&copy;' },
  { char: '®', entity: '&reg;' },
  { char: '€', entity: '&euro;' }
]

const entityMap: Record<string, string> = {
  '<': '&lt;',
  '>': '&gt;',
  '&': '&amp;',
  '"': '&quot;',
  "'": '&apos;',
  '©': '&copy;',
  '®': '&reg;',
  '™': '&trade;',
  ' ': '&nbsp;',
  '€': '&euro;',
  '£': '&pound;',
  '¥': '&yen;',
  '×': '&times;',
  '÷': '&divide;',
  '±': '&plusmn;',
  '≠': '&ne;',
  '≤': '&le;',
  '≥': '&ge;'
}

const reverseEntityMap: Record<string, string> = Object.fromEntries(
  Object.entries(entityMap).map(([k, v]) => [v, k])
)

function loadSample() {
  if (mode.value === 'encode') {
    inputText.value = '<div class="alert">警告: <script>alert("XSS")<\/script></div>'
  } else {
    inputText.value = '&lt;div class=&quot;alert&quot;&gt;警告&lt;/div&gt;'
  }
  convert()
}

function convert() {
  if (!inputText.value) {
    outputText.value = ''
    return
  }

  if (mode.value === 'encode') {
    outputText.value = encodeHTML(inputText.value)
  } else {
    outputText.value = decodeHTML(inputText.value)
  }
}

function encodeHTML(text: string): string {
  let result = text

  if (options.value.encodeAll) {
    // 编码所有字符
    result = ''
    for (let i = 0; i < text.length; i++) {
      const char = text[i]
      const code = char.charCodeAt(0)
      if (options.value.numericOnly) {
        result += `&#${code};`
      } else {
        result += entityMap[char] || `&#${code};`
      }
    }
  } else {
    // 仅编码特殊字符
    for (const [char, entity] of Object.entries(entityMap)) {
      if (options.value.numericOnly) {
        const code = char.charCodeAt(0)
        const regex = new RegExp(escapeRegex(char), 'g')
        result = result.replace(regex, `&#${code};`)
      } else {
        const regex = new RegExp(escapeRegex(char), 'g')
        result = result.replace(regex, entity)
      }
    }
  }

  return result
}

function decodeHTML(text: string): string {
  let result = text

  // 解码命名实体
  for (const [entity, char] of Object.entries(reverseEntityMap)) {
    const regex = new RegExp(entity.replace(/;/g, '\\;?'), 'g')
    result = result.replace(regex, char)
  }

  // 解码数字实体 &#123; 和 &#x1F600;
  result = result.replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(parseInt(dec)))
  result = result.replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)))

  return result
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

async function copyResult() {
  try {
    await navigator.clipboard.writeText(outputText.value)
    alert('已复制')
  } catch {}
}
</script>
