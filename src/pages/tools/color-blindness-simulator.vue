<template>
  <div class="max-w-4xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">色盲模拟器</h1>
      <p class="text-gray-600 dark:text-gray-400">模拟不同类型的色盲视觉效果</p>
    </div>

    <div class="grid md:grid-cols-2 gap-6 mb-6">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">上传图片</h2>
        <div class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
          <input ref="fileInput" type="file" accept="image/*" @change="handleImage" class="hidden">
          <button @click="$refs.fileInput?.click()" class="px-4 py-2 bg-blue-500 text-white rounded-lg">选择图片</button>
        </div>
        <div v-if="imageSrc" class="mt-4">
          <label class="block text-sm font-medium mb-2">色盲类型</label>
          <div class="grid grid-cols-2 gap-2">
            <button @click="type = 'normal'" :class="type === 'normal' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700'" class="px-3 py-2 rounded text-sm">正常</button>
            <button @click="type = 'protanopia'" :class="type === 'protanopia' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700'" class="px-3 py-2 rounded text-sm">红色盲</button>
            <button @click="type = 'deuteranopia'" :class="type === 'deuteranopia' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700'" class="px-3 py-2 rounded text-sm">绿色盲</button>
            <button @click="type = 'tritanopia'" :class="type === 'tritanopia' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700'" class="px-3 py-2 rounded text-sm">蓝色盲</button>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">预览</h2>
        <div class="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
          <img v-if="imageSrc" :src="imageSrc" class="max-w-full max-h-full" :style="{ filter: colorFilter }">
          <div v-else class="text-gray-400">请先上传图片</div>
        </div>
        <div class="mt-2 text-center text-sm text-gray-500">{{ typeLabels[type] }}</div>
      </div>
    </div>

    <!-- 颜色测试 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">色彩测试图</h2>
      <div class="flex justify-center gap-4 flex-wrap">
        <div v-for="color in testColors" :key="color.name" class="text-center">
          <div class="w-20 h-20 rounded-lg mb-2" :style="{ backgroundColor: color.hex, filter: colorFilter }"></div>
          <div class="text-xs">{{ color.name }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

useHead({
  title: '色盲模拟器 - 色盲视觉效果模拟',
  meta: [{ name: 'description', content: '在线色盲模拟工具，模拟红色盲、绿色盲、蓝色盲等视觉效果。' }],
  keywords: ['色盲', 'color blindness', '色盲模拟', '无障碍']
})

const fileInput = ref<HTMLInputElement>()
const imageSrc = ref('')
const type = ref<'normal' | 'protanopia' | 'deuteranopia' | 'tritanopia'>('normal')

const typeLabels = {
  normal: '正常视觉',
  protanopia: '红色盲 (Protanopia)',
  deuteranopia: '绿色盲 (Deuteranopia)',
  tritanopia: '蓝色盲 (Tritanopia)'
}

const testColors = [
  { name: '红', hex: '#EF4444' },
  { name: '绿', hex: '#10B981' },
  { name: '蓝', hex: '#3B82F6' },
  { name: '黄', hex: '#F59E0B' },
  { name: '紫', hex: '#8B5CF6' }
]

const colorFilter = computed(() => {
  switch (type.value) {
    case 'protanopia':
      return 'url(#protanopia)'
    case 'deuteranopia':
      return 'url(#deuteranopia)'
    case 'tritanopia':
      return 'url(#tritanopia)'
    default:
      return 'none'
  }
})

function handleImage(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      imageSrc.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}
</script>
