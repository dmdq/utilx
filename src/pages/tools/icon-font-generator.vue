<template>
  <div class="max-w-4xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">图标字体生成器</h1>
      <p class="text-gray-600 dark:text-gray-400">将SVG图标转换为Web字体使用</p>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">添加SVG图标</h2>
      <div class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center mb-4">
        <input ref="fileInput" type="file" accept=".svg" multiple @change="handleFiles" class="hidden">
        <button @click="$refs.fileInput?.click()" class="px-6 py-3 bg-blue-500 text-white rounded-lg">选择SVG文件</button>
        <p class="text-sm text-gray-500 mt-2">或拖拽SVG文件到此处</p>
      </div>

      <div v-if="svgFiles.length > 0">
        <h3 class="font-medium mb-2">已添加的图标 ({{ svgFiles.length }})</h3>
        <div class="flex flex-wrap gap-2">
          <div v-for="(file, index) in svgFiles" :key="index" class="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-700 rounded">
            <span class="text-sm">{{ file.name }}</span>
            <button @click="removeFile(index)" class="text-red-500 hover:bg-red-50 rounded p-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">生成的CSS</h2>
      <p class="text-sm text-gray-500 mb-4">将以下CSS添加到您的样式表中</p>
      <div class="p-4 bg-gray-900 rounded-lg overflow-x-auto">
        <pre class="text-green-400 text-sm font-mono"><code>@font-face {
  font-family: 'icon-font';
  src: url('icon-font.woff2') format('woff2');
  font-weight: normal;
  font-style: normal;
  font-display: block;
}

.icon {
  display: inline-block;
  font-family: 'icon-font';
  font-weight: normal;
  font-style: normal;
  font-size: 24px;
  line-height: 1;
  text-transform: none;
  letter-spacing: normal;
  word-wrap: normal;
  white-space: nowrap;
  direction: ltr;
}

/* 图标类 */
{{ iconClasses }}
</code></pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

useHead({
  title: '图标字体生成器 - SVG转Web字体',
  meta: [{ name: 'description', content: '在线图标字体生成工具，将SVG图标转换为Web字体使用。' }],
  keywords: ['icon font', '图标字体', 'SVG转字体', 'webfont', '字体图标']
})

const fileInput = ref<HTMLInputElement>()
const svgFiles = ref<File[]>([])

const iconClasses = computed(() => {
  return svgFiles.value.map(file => {
    const name = file.name.replace('.svg', '').replace(/[^a-z0-9]/gi, '-')
    return `.icon-${name}:before { content: '\\e000'; }`
  }).join('\n')
})

function handleFiles(e: Event) {
  const input = e.target as HTMLInputElement
  const files = Array.from(input.files || []).filter(f => f.name.endsWith('.svg'))
  svgFiles.value.push(...files)
}

function removeFile(index: number) {
  svgFiles.value.splice(index, 1)
}
</script>
