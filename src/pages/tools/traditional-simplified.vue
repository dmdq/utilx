<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">繁简体转换工具</h1>
      <p class="text-gray-600 dark:text-gray-400">繁体字与简体字相互转换，支持常见词汇转换</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6 mb-8">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">输入文本</h2>
        <textarea
          v-model="inputText"
          class="w-full h-48 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 resize-none font-mono text-sm"
          placeholder="输入需要转换的繁体或简体中文..."
          @input="convert"
        ></textarea>
        <div class="mt-4 flex gap-2">
          <button @click="inputText = ''; convert()" class="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded">清空</button>
          <button @click="pasteText" class="px-3 py-1 text-sm bg-blue-500 text-white rounded">粘贴</button>
          <button @click="loadSample" class="px-3 py-1 text-sm bg-green-500 text-white rounded">示例</button>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">转换结果</h2>
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

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
      <h2 class="text-xl font-semibold mb-4">转换模式</h2>
      <div class="flex flex-wrap gap-2">
        <button
          @click="direction = 's2t'; convert()"
          :class="['px-4 py-2 rounded font-medium', direction === 's2t' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600']"
        >
          简体 → 繁体
        </button>
        <button
          @click="direction = 't2s'; convert()"
          :class="['px-4 py-2 rounded font-medium', direction === 't2s' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600']"
        >
          繁体 → 简体
        </button>
      </div>

      <div class="mt-4">
        <label class="flex items-center gap-2 text-sm">
          <input type="checkbox" v-model="options.phraseConversion" @change="convert" class="rounded">
          <span>启用词汇转换（更准确但可能改变原意）</span>
        </label>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">常见繁简对照示例</h2>
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
        <div v-for="item in examples" :key="item.simplified" class="p-3 border dark:border-gray-700 rounded">
          <div class="flex justify-between mb-1">
            <span class="text-gray-500">简体:</span>
            <span class="font-medium">{{ item.simplified }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">繁体:</span>
            <span class="font-medium">{{ item.traditional }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

useHead({
  title: '繁简体转换工具 - 繁体字与简体字互转',
  meta: [{ name: 'description', content: '在线繁简体转换工具，支持繁体字与简体字相互转换，支持常见词汇转换。' }],
  keywords: ['繁简体转换', '繁体转简体', '简体转繁体', '中文转换', '汉字转换']
})

const inputText = ref('')
const outputText = ref('')
const direction = ref('s2t')
const options = ref({
  phraseConversion: true
})

// 简化的繁简对照表（常用字）
const charMap: Record<string, string> = {
  // 简体 -> 繁体
  '爱': '愛', '国': '國', '语': '語', '学': '學', '习': '習',
  '长': '長', '开': '開', '关': '關', '门': '門', '东': '東',
  '车': '車', '马': '馬', '龙': '龍', '风': '風', '华': '華',
  '书': '書', '农': '農', '头': '頭', '见': '見', '觉': '覺',
  '贝': '貝', '车': '車', '东': '東', '冈': '岡', '业': '業',
  '电': '電', '钟': '鐘', '表': '錶', '识': '識', '专': '專'
}

// 繁体 -> 简体（反转映射）
const reverseMap: Record<string, string> = {}
Object.entries(charMap).forEach(([s, t]) => {
  reverseMap[t] = s
})

// 词汇对照表
const phraseMap: Record<string, string> = {
  // 简体 -> 繁体
  '软件': '軟件', '硬件': '硬件', '互联网': '互聯網', '网络': '網絡',
  '电脑': '電腦', '电话': '電話', '手机': '手機', '程序': '程式',
  '信息': '信息', '数据': '數據', '系统': '系統', '文件': '文件',
  '服务器': '服務器', '数据库': '數據庫', '算法': '算法', '内存': '內存'
}

const reversePhraseMap: Record<string, string> = {}
Object.entries(phraseMap).forEach(([s, t]) => {
  reversePhraseMap[t] = s
})

const examples = [
  { simplified: '我爱你', traditional: '我愛你' },
  { simplified: '中国', traditional: '中國' },
  { simplified: '学习', traditional: '學習' },
  { simplified: '电脑', traditional: '電腦' },
  { simplified: '网络', traditional: '網絡' },
  { simplified: '软件', traditional: '軟件' }
]

function convert() {
  let text = inputText.value

  if (direction.value === 's2t') {
    // 简体 -> 繁体
    // 先转换词汇
    if (options.value.phraseConversion) {
      Object.entries(phraseMap).forEach(([s, t]) => {
        text = text.split(s).join(t)
      })
    }
    // 再转换单字
    text = text.split('').map(c => charMap[c] || c).join('')
  } else {
    // 繁体 -> 简体
    if (options.value.phraseConversion) {
      Object.entries(reversePhraseMap).forEach(([t, s]) => {
        text = text.split(t).join(s)
      })
    }
    text = text.split('').map(c => reverseMap[c] || c).join('')
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

function loadSample() {
  direction.value = 's2t'
  inputText.value = '我喜欢使用电脑软件和网络。'
  convert()
}

// 初始化
loadSample()
</script>
