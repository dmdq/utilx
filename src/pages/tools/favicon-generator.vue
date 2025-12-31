<template>
  <div class="max-w-4xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">Favicon生成器</h1>
      <p class="text-gray-600 dark:text-gray-400">上传图片生成各尺寸favicon和图标</p>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
      <div class="mb-6">
        <input ref="fileInput" type="file" accept="image/*" @change="handleImage" class="hidden">
        <button @click="$refs.fileInput?.click()" class="w-full px-4 py-3 bg-blue-500 text-white rounded-lg">上传图片</button>
      </div>

      <div v-if="previewSrc" class="grid md:grid-cols-2 gap-6">
        <div>
          <h3 class="font-semibold mb-3">预览</h3>
          <div class="space-y-4">
            <div class="flex items-center gap-4">
              <img :src="previewSrc" class="w-16 h-16">
              <span>Favicon (16x16)</span>
            </div>
            <div class="flex items-center gap-4">
              <img :src="previewSrc" class="w-32 h-32">
              <span>Icon (32x32)</span>
            </div>
            <div class="flex items-center gap-4">
              <img :src="previewSrc" class="w-48 h-48">
              <span>Apple Touch (180x180)</span>
            </div>
          </div>
        </div>

        <div>
          <h3 class="font-semibold mb-3">HTML代码</h3>
          <div class="p-4 bg-gray-900 rounded-lg">
            <pre class="text-green-400 text-sm font-mono"><code>&lt;link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png"&gt;
&lt;link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png"&gt;
&lt;link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png"&gt;</code></pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

useHead({
  title: 'Favicon生成器 - 网站图标生成',
  meta: [{ name: 'description', content: '在线Favicon生成工具，上传图片生成各尺寸网站图标。' }],
  keywords: ['favicon', '图标', '网站图标', 'favicon生成']
})

const fileInput = ref<HTMLInputElement>()
const previewSrc = ref('')

function handleImage(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      previewSrc.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}
</script>
