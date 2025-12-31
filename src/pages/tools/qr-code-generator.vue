<template>
  <div class="max-w-4xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">二维码生成器</h1>
      <p class="text-gray-600 dark:text-gray-400">生成自定义样式的二维码</p>
    </div>

    <div class="grid md:grid-cols-2 gap-6">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">设置</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">内容</label>
            <textarea v-model="content" rows="3" class="w-full px-3 py-2 border rounded" placeholder="输入URL或文本"></textarea>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1">前景色</label>
              <input v-model="foregroundColor" type="color" class="w-full h-10 rounded cursor-pointer">
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">背景色</label>
              <input v-model="backgroundColor" type="color" class="w-full h-10 rounded cursor-pointer">
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">尺寸</label>
            <input v-model.number="size" type="range" min="128" max="512" step="32" class="w-full">
            <span class="text-sm text-gray-500">{{ size }}x{{ size }}</span>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">预览</h2>
        <div class="flex justify-center p-4 bg-white rounded-lg mb-4">
          <img v-if="qrUrl" :src="qrUrl" class="border">
        </div>
        <button @click="downloadQR" class="w-full px-4 py-2 bg-green-500 text-white rounded-lg">下载二维码</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

useHead({
  title: '二维码生成器 - 在线QR码创建',
  meta: [{ name: 'description', content: '在线二维码生成工具，生成自定义样式的QR码。' }],
  keywords: ['qr code', '二维码', 'QR码', '二维码生成']
})

const content = ref('https://example.com')
const foregroundColor = ref('#000000')
const backgroundColor = ref('#FFFFFF')
const size = ref(256)

const qrUrl = computed(() => {
  if (!content.value) return ''
  const apiUrl = 'https://api.qrserver.com/v1/create-qr-code/'
  const params = new URLSearchParams({
    size: `${size.value}x${size.value}`,
    data: content.value,
    color: foregroundColor.value.slice(1),
    bgcolor: backgroundColor.value.slice(1)
  })
  return `${apiUrl}?${params.toString()}`
})

async function downloadQR() {
  if (!qrUrl.value) return
  try {
    const response = await fetch(qrUrl.value)
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'qrcode.png'
    a.click()
    URL.revokeObjectURL(url)
  } catch (e) {
    window.open(qrUrl.value, '_blank')
  }
}
</script>
