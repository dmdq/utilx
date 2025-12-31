<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">维吉尼亚密码工具</h1>
      <p class="text-gray-600 dark:text-gray-400">使用密钥进行多表替换加密，安全性高于凯撒密码</p>
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
          <label class="block text-sm font-medium mb-2">密钥 (仅字母)</label>
          <input
            v-model="key"
            type="text"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 font-mono uppercase"
            placeholder="输入密钥，例如: KEY"
            @input="process"
          >
          <div class="flex gap-1 mt-2">
            <button
              @click="key = 'SECRET'; process()"
              class="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded hover:bg-blue-500 hover:text-white"
            >
              SECRET
            </button>
            <button
              @click="key = 'KEY'; process()"
              class="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded hover:bg-blue-500 hover:text-white"
            >
              KEY
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
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">加密原理</h2>
      <div class="text-sm text-gray-600 dark:text-gray-400">
        <p class="mb-2">维吉尼亚密码使用密钥进行多表替换加密，每个字母根据密钥中对应位置的字母进行偏移。</p>
        <p class="mb-2">密钥重复以匹配明文长度，例如密钥"KEY"用于"HELLO"：</p>
        <div class="font-mono bg-gray-100 dark:bg-gray-700 p-2 rounded mb-2">
          明文: H E L L O<br>
          密钥: K E Y K E
        </div>
        <p>每个字母使用不同的凯撒密码偏移量，因此相同明文字符可能产生不同密文。</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

useHead({
  title: '维吉尼亚密码工具 - 多表替换加密',
  meta: [{ name: 'description', content: '在线维吉尼亚密码工具，使用密钥进行多表替换加密和解密，安全性高于凯撒密码。' }],
  keywords: ['维吉尼亚密码', 'vigenere cipher', '多表密码', '多表替换', '古典密码', '加密解密']
})

const inputText = ref('')
const outputText = ref('')
const key = ref('KEY')
const mode = ref('encrypt')

function process() {
  const text = inputText.value.toUpperCase().replace(/[^A-Z]/g, '')
  const k = key.value.toUpperCase().replace(/[^A-Z]/g, '')

  if (!text || !k) {
    outputText.value = ''
    return
  }

  let result = ''
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) - 65
    const keyChar = k[i % k.length]
    const keyShift = keyChar.charCodeAt(0) - 65

    let newCode: number
    if (mode.value === 'encrypt') {
      newCode = (charCode + keyShift) % 26
    } else {
      newCode = (charCode - keyShift + 26) % 26
    }

    result += String.fromCharCode(newCode + 65)
  }

  outputText.value = result
}

inputText.value = 'HELLO'
key.value = 'KEY'
process()
</script>
