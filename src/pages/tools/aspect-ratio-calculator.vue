<template>
  <div class="max-w-4xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">宽高比计算器</h1>
      <p class="text-gray-600 dark:text-gray-400">计算和锁定元素宽高比</p>
    </div>

    <div class="grid md:grid-cols-2 gap-6 mb-6">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">输入</h2>
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1">宽度</label>
              <input v-model.number="inputWidth" type="number" class="w-full px-3 py-2 border rounded" @input="calculateHeight">
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">高度</label>
              <input v-model.number="inputHeight" type="number" class="w-full px-3 py-2 border rounded" @input="calculateWidth">
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">宽高比</label>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <input v-model.number="ratioWidth" type="number" class="w-full px-3 py-2 border rounded" @input="updateRatio">
              </div>
              <div>
                <input v-model.number="ratioHeight" type="number" class="w-full px-3 py-2 border rounded" @input="updateRatio">
              </div>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">预设比例</label>
            <div class="grid grid-cols-3 gap-2">
              <button @click="setRatio(16, 9)" class="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200">16:9</button>
              <button @click="setRatio(4, 3)" class="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200">4:3</button>
              <button @click="setRatio(1, 1)" class="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200">1:1</button>
              <button @click="setRatio(21, 9)" class="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200">21:9</button>
              <button @click="setRatio(3, 2)" class="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200">3:2</button>
              <button @click="setRatio(5, 4)" class="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200">5:4</button>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">预览</h2>
        <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg mb-4">
          <div
            class="bg-blue-500 rounded mx-auto"
            :style="{ width: Math.min(previewWidth, 300) + 'px', height: Math.min(previewHeight, 300 * ratioHeight / ratioWidth) + 'px' }"
          ></div>
        </div>
        <div class="text-center text-sm text-gray-500">
          {{ inputWidth }} x {{ inputHeight }} ({{ (ratioWidth / ratioHeight).toFixed(2) }}:1)
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">CSS代码</h2>
      <div class="p-4 bg-gray-900 rounded-lg">
        <pre class="text-green-400 text-sm font-mono"><code>.element {
  aspect-ratio: {{ ratioWidth }} / {{ ratioHeight }};
  width: 100%;
}</code></pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

useHead({
  title: '宽高比计算器 - aspect-ratio工具',
  meta: [{ name: 'description', content: '在线宽高比计算工具，计算和锁定元素宽高比。' }],
  keywords: ['aspect-ratio', '宽高比', '比例计算', 'CSS']
})

const inputWidth = ref(1920)
const inputHeight = ref(1080)
const ratioWidth = ref(16)
const ratioHeight = ref(9)

const previewWidth = computed(() => inputWidth.value || 300)
const previewHeight = computed(() => inputHeight.value || (300 * ratioHeight.value / ratioWidth.value))

function calculateHeight() {
  inputHeight.value = Math.round(inputWidth.value * ratioHeight.value / ratioWidth.value)
}

function calculateWidth() {
  inputWidth.value = Math.round(inputHeight.value * ratioWidth.value / ratioHeight.value)
}

function updateRatio() {
  // 手动更新比例
}

function setRatio(w: number, h: number) {
  ratioWidth.value = w
  ratioHeight.value = h
  calculateHeight()
}
</script>
