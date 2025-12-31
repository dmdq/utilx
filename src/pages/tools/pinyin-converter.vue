<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">拼音转换工具</h1>
      <p class="text-gray-600 dark:text-gray-400">汉字转拼音，支持有声调、无声调、首字母多种格式</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6 mb-8">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">输入文本</h2>
        <textarea
          v-model="inputText"
          class="w-full h-48 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 resize-none font-mono text-sm"
          placeholder="输入需要转换的汉字..."
          @input="convert"
        ></textarea>
        <div class="mt-4 flex gap-2">
          <button @click="inputText = ''; convert()" class="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded">清空</button>
          <button @click="loadSample" class="px-3 py-1 text-sm bg-green-500 text-white rounded">示例</button>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">拼音结果</h2>
        <textarea
          v-model="outputText"
          class="w-full h-48 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 resize-none font-mono text-sm"
          readonly
        ></textarea>
        <div class="mt-4 flex gap-2">
          <button @click="copyResult" class="px-3 py-1 text-sm bg-green-500 text-white rounded">复制</button>
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">输出格式</h2>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="format in formats"
          :key="format.id"
          @click="currentFormat = format.id; convert()"
          :class="['px-4 py-2 rounded', currentFormat === format.id ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600']"
        >
          {{ format.name }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

useHead({
  title: '拼音转换工具 - 汉字转拼音带声调',
  meta: [{ name: 'description', content: '在线拼音转换工具，将汉字转换为拼音，支持有声调、无声调、首字母等多种格式输出。' }],
  keywords: ['拼音转换', '汉字转拼音', '带声调拼音', '拼音首字母', '中文拼音']
})

const inputText = ref('')
const outputText = ref('')
const currentFormat = ref('tone')

const formats = [
  { id: 'tone', name: '有声调' },
  { id: 'no-tone', name: '无声调' },
  { id: 'first', name: '首字母' },
  { id: 'number', name: '数字声调' }
]

// 简化拼音映射（常用字）
const pinyinMap: Record<string, string[]> = {
  '我': ['wǒ'], '爱': ['ài'], '你': ['nǐ'], '好': ['hǎo'],
  '中': ['zhōng'], '国': ['guó'], '人': ['rén'], '大': ['dà'],
  '学': ['xué'], '习': ['xí'], '天': ['tiān'], '气': ['qì'],
  '春': ['chūn'], '夏': ['xià'], '秋': ['qiū'], '冬': ['dōng'],
  '北': ['běi'], '京': ['jīng'], '上': ['shàng'], '海': ['hǎi'],
  '一': ['yī'], '二': ['èr'], '三': ['sān'], '四': ['sì'],
  '五': ['wǔ'], '六': ['liù'], '七': ['qī'], '八': ['bā'],
  '九': ['jiǔ'], '十': ['shí']
}

function convert() {
  const text = inputText.value
  let result = ''

  for (const char of text) {
    if (pinyinMap[char]) {
      let py = pinyinMap[char][0]

      switch (currentFormat.value) {
        case 'tone':
          // 保留声调
          break
        case 'no-tone':
          // 去除声调
          py = py.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          break
        case 'first':
          // 只保留首字母
          py = py.charAt(0)
          break
        case 'number':
          // 数字声调: hao3
          py = py.replace(/[āáǎà]/g, 'a1').replace(/[ēéěè]/g, 'e1')
            .replace(/[īíǐì]/g, 'i1').replace(/[ōóǒò]/g, 'o1')
            .replace(/[ūúǔù]/g, 'u1').replace(/[ǖǘǚǜ]/g, 'v1')
            .replace(/[āáǎà]/g, 'a1')
          break
      }
      result += py + ' '
    } else {
      result += char
    }
  }

  outputText.value = result.trim()
}

async function copyResult() {
  try {
    await navigator.clipboard.writeText(outputText.value)
    alert('已复制')
  } catch {}
}

function loadSample() {
  inputText.value = '我爱北京天安门'
  convert()
}

loadSample()
</script>
