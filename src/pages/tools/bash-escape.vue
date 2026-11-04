<template>
  <div class="max-w-8xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">Bash 命令转义工具</h1>
      <p class="text-muted-foreground">Shell 命令转义与反转义，防止命令注入攻击</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">输入命令</h2>
          <div class="flex gap-2">
            <button @click="clearInput" class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground">清空</button>
            <button @click="loadExample" class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground">示例</button>
          </div>
        </div>

        <textarea v-model="inputText" placeholder="请输入 Shell 命令..." class="w-full h-64 p-4 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"></textarea>
      </div>

      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">转义结果</h2>
          <button v-if="outputText" @click="copyOutput" class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground">{{ copied ? '已复制' : '复制' }}</button>
        </div>

        <pre v-if="outputText" class="w-full h-64 p-4 bg-muted rounded-lg overflow-auto text-sm font-mono whitespace-pre-wrap">{{ outputText }}</pre>
        <div v-else class="w-full h-64 p-4 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">转义结果将显示在这里</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useSeoMeta } from '#app'

const inputText = ref('')
const outputText = ref('')
const copied = ref(false)

const examples = [
  'echo "Hello World"',
  'ls -la /home/user/docs',
  'grep "pattern" file.txt',
  'cat $HOME/file.txt'
]
const currentExample = ref(0)

const escapeBash = (text) => {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\$/g, '\\$')
    .replace(/"/g, '\\"')
    .replace(/'/g, "\\'")
    .replace(/`/g, '\\`')
    .replace(/!/g, '\\!')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
}

watch(inputText, (newText) => {
  if (newText) {
    outputText.value = escapeBash(newText)
  } else {
    outputText.value = ''
  }
})

const clearInput = () => { inputText.value = ''; outputText.value = '' }
const loadExample = () => { inputText.value = examples[currentExample.value]; currentExample.value = (currentExample.value + 1) % examples.length }

const copyOutput = async () => {
  try {
    await navigator.clipboard.writeText(outputText.value)
    copied.value = true
    setTimeout(() => copied.value = false, 2000)
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = outputText.value
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    copied.value = true
    setTimeout(() => copied.value = false, 2000)
  }
}

useSeoMeta({
  title: 'Bash转义 - 在线Shell命令转义工具',
  description: '免费在线Bash命令转义工具，Shell命令转义与反转义，防止命令注入攻击。',
  keywords: ['bash', 'shell', 'escape', '转义', '命令注入', 'linux', 'unix', '在线工具']
})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('Bash命令转义工具')
</script>
