<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">全角半角转换工具</h1>
      <p class="text-gray-600 dark:text-gray-400">全角与半角字符相互转换，支持字母、数字、标点符号</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6 mb-8">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
          <ArrowRightLeft class="w-5 h-5 text-blue-500" />
          输入文本
        </h2>
        <textarea
          v-model="inputText"
          class="w-full h-64 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 resize-none font-mono text-sm"
          placeholder="在此输入需要转换的文本..."
          @input="convert"
        ></textarea>
        <div class="mt-4 flex gap-2">
          <button @click="inputText = ''; convert()" class="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded">清空</button>
          <button @click="pasteText" class="px-3 py-1 text-sm bg-blue-500 text-white rounded">粘贴</button>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
          <Sparkles class="w-5 h-5 text-green-500" />
          转换结果
        </h2>
        <textarea
          v-model="outputText"
          class="w-full h-64 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 resize-none font-mono text-sm"
          placeholder="转换后的文本将显示在这里..."
          readonly
        ></textarea>
        <div class="mt-4 flex gap-2">
          <button @click="copyResult" class="px-3 py-1 text-sm bg-green-500 text-white rounded">复制</button>
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
      <h2 class="text-xl font-semibold mb-4">转换选项</h2>
      <div class="flex flex-wrap gap-3">
        <button
          v-for="option in options"
          :key="option.id"
          @click="currentOption = option.id; convert()"
          :class="['px-4 py-2 rounded font-medium', currentOption === option.id ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600']"
        >
          {{ option.name }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ArrowRightLeft, Sparkles } from 'lucide-vue-next'

useHead({
  title: '全角半角转换工具 - 全角与半角字符互转',
  meta: [{ name: 'description', content: '在线全角半角转换工具，支持字母、数字、标点符号的全角与半角互转，适用于中英文混合文本处理。' }],
  keywords: ['全角半角转换', '全角转半角', '半角转全角', '字符转换', '中英文处理']
})

const inputText = ref('')
const outputText = ref('')
const currentOption = ref('to-half')

const options = [
  { id: 'to-half', name: '全角→半角' },
  { id: 'to-full', name: '半角→全角' },
  { id: 'to-half-punct', name: '仅标点转半角' },
  { id: 'to-full-punct', name: '仅标点转全角' }
]

// 全角半角映射
const fullWidthToHalfWidthMap: Record<string, string> = {}
const halfWidthToFullWidthMap: Record<string, string> = {}

// 字母数字映射
for (let i = 0; i < 26; i++) {
  const lower = String.fromCharCode(97 + i)
  const upper = String.fromCharCode(65 + i)
  fullWidthToHalfWidthMap[String.fromCharCode(65313 + i)] = lower // ａ-ｚ
  fullWidthToHalfWidthMap[String.fromCharCode(65281 + i)] = upper // Ａ-Ｚ
  halfWidthToFullWidthMap[lower] = String.fromCharCode(65313 + i)
  halfWidthToFullWidthMap[upper] = String.fromCharCode(65281 + i)
}

for (let i = 0; i < 10; i++) {
  const digit = String.fromCharCode(48 + i)
  fullWidthToHalfWidthMap[String.fromCharCode(65296 + i)] = digit // ０-９
  halfWidthToFullWidthMap[digit] = String.fromCharCode(65296 + i)
}

// 标点符号映射
const punctuations: [string, string][] = [
  ['，', ','], ['。', '.'], ['！', '!'], ['？', '?'],
  ['：', ':'], ['；', ';'], ['（', '('], ['）', ')'],
  ['【', '['], ['】', ']'], ['「', '"'], ['」', '"'],
  ['『', "'"], ['』', "'"], ['「', '"'], ['」', '"'],
  ['《', '<'], ['》', '>'], ['、', ','], ['＠', '@'],
  ['＃', '#'], ['＄', '$'], ['％', '%'], ['＆', '&'],
  ['＊', '*'], ['＋', '+'], ['－', '-'], ['／', '/'],
  ['：', ':'], ['＜', '<'], ['＝', '='], ['＞', '>'],
  ['？', '?'], ['＠', '@'], ['［', '['], ['＼', '\\'],
  ['］', ']'], ['＾', '^'], ['＿', '_'], ['｀', '`'],
  ['｛', '{'], ['｜', '|'], ['｝', '}'], ['～', '~']
]

punctuations.forEach(([full, half]) => {
  fullWidthToHalfWidthMap[full] = half
  halfWidthToFullWidthMap[half] = full
})

// 空格
fullWidthToHalfWidthMap['　'] = ' '
halfWidthToFullWidthMap[' '] = '　'

function convert() {
  let text = inputText.value

  if (currentOption.value === 'to-half') {
    text = text.replace(/[\uFF01-\uFF5E]/g, char => fullWidthToHalfWidthMap[char] || char)
  } else if (currentOption.value === 'to-full') {
    text = text.replace(/[a-zA-Z0-9\s!,.?;:()\[\]"'<>{}/\\|^_~@#$%&*+\-]/g, char => halfWidthToFullWidthMap[char] || char)
  } else if (currentOption.value === 'to-half-punct') {
    punctuations.forEach(([full, half]) => {
      text = text.split(full).join(half)
    })
    text = text.replace(/　/g, ' ')
  } else if (currentOption.value === 'to-full-punct') {
    punctuations.forEach(([full, half]) => {
      text = text.split(half).join(full)
    })
    text = text.replace(/ /g, '　')
  }

  outputText.value = text
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

inputText.value = 'Ｈｅｌｌｏ　Ｗｏｒｌｄ！１２３，ＡＢＣ。'
convert()
</script>
