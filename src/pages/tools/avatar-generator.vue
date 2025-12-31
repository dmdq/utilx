<template>
  <div class="max-w-4xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">头像生成器</h1>
      <p class="text-gray-600 dark:text-gray-400">生成几何/文字头像</p>
    </div>

    <div class="grid md:grid-cols-2 gap-6 mb-6">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">设置</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">文字</label>
            <input v-model="text" maxlength="2" class="w-full px-3 py-2 border rounded" placeholder="最多2个字符">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">背景色</label>
            <input v-model="bgColor" type="color" class="w-full h-10 rounded cursor-pointer">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">文字色</label>
            <input v-model="textColor" type="color" class="w-full h-10 rounded cursor-pointer">
          </div>
          <button @click="randomize" class="w-full px-4 py-2 bg-blue-500 text-white rounded-lg">随机生成</button>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">预览</h2>
        <div class="flex flex-wrap gap-4">
          <div class="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold" :style="{ background: bgColor, color: textColor }">{{ text }}</div>
          <div class="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold" :style="{ background: bgColor, color: textColor }">{{ text }}</div>
          <div class="w-32 h-32 rounded-full flex items-center justify-center text-4xl font-bold" :style="{ background: bgColor, color: textColor }">{{ text }}</div>
          <div class="w-24 h-24 rounded-lg flex items-center justify-center text-3xl font-bold" :style="{ background: bgColor, color: textColor }">{{ text }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

useHead({
  title: '头像生成器 - 在线头像创建',
  meta: [{ name: 'description', content: '在线头像生成工具，创建几何和文字头像。' }],
  keywords: ['avatar', '头像生成', '用户头像']
})

const text = ref('U')
const bgColor = ref('#3B82F6')
const textColor = ref('#FFFFFF')

const colors = ['#EF4444', '#F97316', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899']

function randomize() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  text.value = chars[Math.floor(Math.random() * chars.length)]
  bgColor.value = colors[Math.floor(Math.random() * colors.length)]
}
</script>
