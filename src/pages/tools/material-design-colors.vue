<template>
  <div class="max-w-4xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">Material Design色板</h1>
      <p class="text-gray-600 dark:text-gray-400">Material Design 3官方色板参考</p>
    </div>

    <div class="space-y-6">
      <div v-for="palette in colors" :key="palette.name" class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">{{ palette.name }}</h2>
        <div class="grid grid-cols-5 md:grid-cols-10 gap-2">
          <div v-for="(color, index) in palette.shades" :key="index" class="text-center">
            <div
              class="w-full aspect-square rounded-lg cursor-pointer hover:scale-105 transition"
              :style="{ backgroundColor: color }"
              @click="copyColor(color)"
              :title="color"
            ></div>
            <div class="text-xs mt-1 font-mono">{{ palette.keys[index] }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

useHead({
  title: 'Material Design色板 - MD3颜色参考',
  meta: [{ name: 'description', content: 'Material Design 3官方色板参考，包含主色、次色、中性色等。' }],
  keywords: ['material design', 'MD3', '色板', '颜色', 'Material Color']
})

const colors = ref([
  {
    name: 'Primary',
    keys: ['10', '20', '25', '30', '40', '50', '60', '70', '80', '90'],
    shades: ['#D0BCFF', '#AAA7FF', '#9F9AF8', '#8F87FB', '#7C73EA', '#6750A4', '#553F93', '#442A7E', '#331C6A', '#21005D']
  },
  {
    name: 'Secondary',
    keys: ['10', '20', '25', '30', '40', '50', '60', '70', '80', '90'],
    shades: ['#E8DEF8', '#D0BCFF', '#C4B3FD', '#B69DF8', '#9E88F6', '#6D6280', '#4A4458', '#332D41', '#1D192B', '#141218']
  },
  {
    name: 'Tertiary',
    keys: ['10', '20', '25', '30', '40', '50', '60', '70', '80', '90'],
    shades: ['#FFD8E4', '#F2B8D5', '#E7A6CC', '#E391BC', '#D96FA9', '#7D5260', '#5E3F4A', '#4A2D38', '#351826', '#1B1118']
  }
])

async function copyColor(color: string) {
  try {
    await navigator.clipboard.writeText(color)
    alert(`已复制: ${color}`)
  } catch {}
}
</script>
