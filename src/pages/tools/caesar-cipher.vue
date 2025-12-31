<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">凯撒密码工具</h1>
      <p class="text-gray-600 dark:text-gray-400">经典凯撒密码加密与解密，支持自定义偏移量</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6 mb-8">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">输入文本</h2>
        <textarea
          v-model="inputText"
          class="w-full h-40 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 resize-none font-mono text-sm"
          placeholder="输入需要加密或解密的文本..."
          @input="process"
        ></textarea>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">输出结果</h2>
        <textarea
          v-model="outputText"
          class="w-full h-40 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 resize-none font-mono text-sm"
          readonly
        ></textarea>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
      <h2 class="text-xl font-semibold mb-4">设置</h2>

      <div class="grid md:grid-cols-2 gap-6">
        <div>
          <label class="block text-sm font-medium mb-2">偏移量 (1-25)</label>
          <input
            v-model.number="shift"
            type="number"
            min="1"
            max="25"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            @input="process"
          >
          <div class="flex gap-1 mt-2 flex-wrap">
            <button
              v-for="n in [1, 3, 5, 10, 13, 25]"
              :key="n"
              @click="shift = n; process()"
              class="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded hover:bg-blue-500 hover:text-white"
            >
              {{ n }}
            </button>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">操作模式</label>
          <div class="flex gap-2">
            <button
              @click="mode = 'encrypt'; process()"
              :class="['px-4 py-2 rounded', mode === 'encrypt' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600']"
            >
              加密
            </button>
            <button
              @click="mode = 'decrypt'; process()"
              :class="['px-4 py-2 rounded', mode === 'decrypt' ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-600']"
            >
              解密
            </button>
          </div>

          <div class="mt-4">
            <label class="flex items-center gap-2 text-sm">
              <input type="checkbox" v-model="options.preserveCase" @change="process" class="rounded">
              <span>保留大小写</span>
            </label>
            <label class="flex items-center gap-2 text-sm mt-2">
              <input type="checkbox" v-model="options.preserveNonAlpha" @change="process" class="rounded">
              <span>保留非字母字符</span>
            </label>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">加密原理</h2>
      <div class="text-sm text-gray-600 dark:text-gray-400">
        <p class="mb-2">凯撒密码是一种替换加密技术，通过将字母表中的每个字母移动固定位数来进行加密。</p>
        <p class="mb-2"><strong>加密公式:</strong> E(x) = (x + n) mod 26</p>
        <p class="mb-2"><strong>解密公式:</strong> D(x) = (x - n) mod 26</p>
        <p>例如偏移量为3时，A→D，B→E，...，X→A，Y→B，Z→C</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

useHead({
  title: '凯撒密码工具 - 在线加密解密',
  meta: [{ name: 'description', content: '在线凯撒密码工具，支持自定义偏移量的凯撒密码加密和解密，适用于密码学学习。' }],
  keywords: ['凯撒密码', 'caesar cipher', '加密', '解密', '密码学', '古典密码']
})

const inputText = ref('')
const outputText = ref('')
const shift = ref(3)
const mode = ref('encrypt')
const options = ref({
  preserveCase: true,
  preserveNonAlpha: true
})

function process() {
  const text = inputText.value
  const n = shift.value % 26
  let result = ''

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const code = text.charCodeAt(i)

    // 大写字母 A-Z (65-90)
    if (code >= 65 && code <= 90) {
      let newCode = mode.value === 'encrypt'
        ? ((code - 65 + n) % 26) + 65
        : ((code - 65 - n + 26) % 26) + 65
      result += String.fromCharCode(newCode)
    }
    // 小写字母 a-z (97-122)
    else if (code >= 97 && code <= 122) {
      let newCode = mode.value === 'encrypt'
        ? ((code - 97 + n) % 26) + 97
        : ((code - 97 - n + 26) % 26) + 97
      result += String.fromCharCode(newCode)
    }
    // 非字母字符
    else if (options.value.preserveNonAlpha) {
      result += char
    }
  }

  outputText.value = result
}

inputText.value = 'HELLO WORLD'
process()
</script>
