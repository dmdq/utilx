<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">调色板生成器</h1>
      <p class="text-gray-600 dark:text-gray-400">从单色生成和谐的配色方案，支持多种配色规则</p>
    </div>

    <!-- 基础颜色选择 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">选择基础颜色</h2>
      <div class="flex flex-wrap gap-4 items-center">
        <div class="relative">
          <input
            ref="colorInput"
            v-model="baseColor"
            type="color"
            class="w-20 h-20 rounded-lg cursor-pointer border-2 border-gray-300 dark:border-gray-600"
          >
        </div>
        <div class="flex-1 min-w-[200px]">
          <div class="flex gap-2 mb-2">
            <input
              v-model="baseColor"
              type="text"
              maxlength="7"
              class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 uppercase font-mono"
              placeholder="#000000"
            >
            <button @click="randomColor" class="px-4 py-2 bg-purple-500 text-white rounded-lg">随机</button>
          </div>
          <div class="text-sm text-gray-500 dark:text-gray-400">
            RGB: {{ hexToRgb(baseColor).join(', ') }} | HSL: {{ hexToHsl(baseColor).join(', ') }}
          </div>
        </div>
      </div>
    </div>

    <!-- 配色规则选择 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">配色规则</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <button
          v-for="rule in colorRules"
          :key="rule.id"
          @click="selectedRule = rule.id"
          :class="['px-4 py-3 rounded-lg text-center transition', selectedRule === rule.id ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600']"
        >
          <div class="text-sm font-medium">{{ rule.name }}</div>
          <div class="text-xs opacity-75 mt-1">{{ rule.count }}色</div>
        </button>
      </div>
    </div>

    <!-- 生成的配色方案 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold">配色方案</h2>
        <button @click="copyPalette" class="px-4 py-2 bg-green-500 text-white rounded-lg text-sm">复制CSS</button>
      </div>

      <div class="flex flex-wrap gap-1" :style="{ height: paletteColors.length > 0 ? '120px' : '60px' }">
        <div
          v-for="(color, index) in paletteColors"
          :key="index"
          @click="copyColor(color)"
          class="flex-1 min-w-[80px] flex flex-col items-center justify-center cursor-pointer hover:opacity-90 transition group"
          :style="{ backgroundColor: color }"
        >
          <span class="text-sm font-mono font-bold px-2 py-1 rounded" :class="isLightColor(color) ? 'text-gray-800 bg-white/80' : 'text-white bg-black/30'">
            {{ color }}
          </span>
          <span class="text-xs mt-1 opacity-0 group-hover:opacity-100 transition" :class="isLightColor(color) ? 'text-gray-800' : 'text-white'">
            点击复制
          </span>
        </div>
      </div>

      <div v-if="paletteColors.length === 0" class="text-center py-8 text-gray-400">
        选择基础颜色和配色规则以生成方案
      </div>
    </div>

    <!-- 色卡详情 -->
    <div v-if="paletteColors.length > 0" class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">色卡详情</h2>
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="(color, index) in paletteColors"
          :key="index"
          class="flex items-center gap-3 p-4 rounded-lg border-2 hover:border-blue-500 transition"
          :style="{ borderColor: color }"
        >
          <div
            class="w-16 h-16 rounded-lg shadow-inner"
            :style="{ backgroundColor: color }"
          ></div>
          <div class="flex-1">
            <div class="font-mono font-bold">{{ color }}</div>
            <div class="text-sm text-gray-500 dark:text-gray-400">RGB: {{ hexToRgb(color).join(', ') }}</div>
            <div class="text-sm text-gray-500 dark:text-gray-400">HSL: {{ hexToHsl(color).map((v, i) => i === 0 ? v + '°' : v + '%').join(', ') }}</div>
          </div>
          <button @click="copyColor(color)" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 快捷预设 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">快捷预设</h2>
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <button
          v-for="preset in presets"
          :key="preset.name"
          @click="applyPreset(preset)"
          class="flex h-16 rounded-lg overflow-hidden hover:scale-105 transition"
        >
          <div
            v-for="(color, i) in preset.colors"
            :key="i"
            class="flex-1"
            :style="{ backgroundColor: color }"
          ></div>
          <span class="absolute inset-0 flex items-center justify-center text-white font-bold drop-shadow-lg bg-black/20 opacity-0 hover:opacity-100 transition">
            {{ preset.name }}
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

useHead({
  title: '调色板生成器 - 配色方案生成',
  meta: [{ name: 'description', content: '在线调色板生成工具，从单色生成和谐的配色方案，支持单色、类比、互补等多种配色规则。' }],
  keywords: ['调色板', '配色方案', '颜色搭配', '配色生成', '色彩设计']
})

const baseColor = ref('#3B82F6')
const selectedRule = ref('analogous')
const colorInput = ref<HTMLInputElement>()

const colorRules = [
  { id: 'monochromatic', name: '单色', count: 5 },
  { id: 'analogous', name: '类比', count: 5 },
  { id: 'complementary', name: '互补', count: 4 },
  { id: 'split', name: '分裂互补', count: 4 },
  { id: 'triadic', name: '三角色', count: 4 },
  { id: 'tetradic', name: '四角色', count: 5 },
  { id: 'compound', name: '复合', count: 5 },
  { id: 'shades', name: '深浅', count: 6 }
]

const presets = [
  { name: '日落', colors: ['#FF6B6B', '#FFA07A', '#FFD93D', '#6BCB77', '#4D96FF'] },
  { name: '海洋', colors: ['#0077B6', '#00B4D8', '#90E0EF', '#CAF0F8', '#023E8A'] },
  { name: '森林', colors: ['#2D6A4F', '#40916C', '#52B788', '#74C69D', '#95D5B2'] },
  { name: '薰衣草', colors: ['#7400B8', '#6930C3', '#5E60CE', '#5390D9', '#4EA8DE'] },
  { name: '暖阳', colors: ['#FFBE0B', '#FB5607', '#FF006E', '#8338EC', '#3A86FF'] },
  { name: '大地', colors: ['#606C38', '#283618', '#FEFAE0', '#DDA15E', '#BC6C25'] }
]

const paletteColors = computed(() => {
  return generatePalette(baseColor.value, selectedRule.value)
})

watch([baseColor, selectedRule], () => {
  // 触发computed重新计算
})

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [0, 0, 0]
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
}

function hexToHsl(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgb(hex)
  return rgbToHsl(r, g, b)
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100
  l /= 100

  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs((h / 60) % 2 - 1))
  const m = l - c / 2
  let r = 0
  let g = 0
  let b = 0

  if (h < 60) { r = c; g = x; b = 0 }
  else if (h < 120) { r = x; g = c; b = 0 }
  else if (h < 180) { r = 0; g = c; b = x }
  else if (h < 240) { r = 0; g = x; b = c }
  else if (h < 300) { r = x; g = 0; b = c }
  else { r = c; g = 0; b = x }

  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase()
}

function generatePalette(hex: string, rule: string): string[] {
  const [h, s, l] = hexToHsl(hex)
  let colors: [number, number, number][] = []

  switch (rule) {
    case 'monochromatic':
      colors = [
        [h, s, Math.max(10, l - 30)],
        [h, s, Math.max(20, l - 15)],
        [h, s, l],
        [h, s, Math.min(95, l + 15)],
        [h, s, Math.min(90, l + 30)]
      ]
      break
    case 'analogous':
      colors = [
        [(h - 30 + 360) % 360, s, l],
        [(h - 15 + 360) % 360, s, l],
        [h, s, l],
        [(h + 15) % 360, s, l],
        [(h + 30) % 360, s, l]
      ]
      break
    case 'complementary':
      colors = [
        [h, s, Math.max(20, l - 20)],
        [h, s, l],
        [(h + 180) % 360, s, l],
        [(h + 180) % 360, s, Math.min(80, l + 20)]
      ]
      break
    case 'split':
      colors = [
        [h, s, l],
        [(h + 150) % 360, s, l],
        [(h + 210) % 360, s, l],
        [(h + 180) % 360, s, Math.min(80, l + 20)]
      ]
      break
    case 'triadic':
      colors = [
        [h, s, l],
        [(h + 120) % 360, s, l],
        [(h + 240) % 360, s, l],
        [h, s, Math.max(20, l - 20)]
      ]
      break
    case 'tetradic':
      colors = [
        [h, s, l],
        [(h + 90) % 360, s, l],
        [(h + 180) % 360, s, l],
        [(h + 270) % 360, s, l],
        [h, s, Math.min(80, l + 20)]
      ]
      break
    case 'compound':
      colors = [
        [h, s, l],
        [(h + 30) % 360, s, l],
        [(h + 30) % 360, s, Math.min(80, l + 25)],
        [(h + 160) % 360, s, l],
        [(h + 180) % 360, s, Math.min(70, l + 15)]
      ]
      break
    case 'shades':
      colors = [
        [h, s, Math.max(10, l - 40)],
        [h, s, Math.max(20, l - 25)],
        [h, s, Math.max(30, l - 10)],
        [h, s, l],
        [h, s, Math.min(90, l + 15)],
        [h, s, Math.min(95, l + 30)]
      ]
      break
  }

  return colors.map(([h, s, l]) => hslToHex(h, s, l))
}

function isLightColor(hex: string): boolean {
  const [, , l] = hexToHsl(hex)
  return l > 50
}

function randomColor() {
  const hex = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0').toUpperCase()
  baseColor.value = hex
}

function applyPreset(preset: any) {
  baseColor.value = preset.colors[0]
}

async function copyColor(color: string) {
  try {
    await navigator.clipboard.writeText(color)
    alert(`已复制: ${color}`)
  } catch {}
}

async function copyPalette() {
  const css = paletteColors.value.map((c, i) => `  --color-${i + 1}: ${c};`).join('\n')
  const text = `:root {\n${css}\n}`
  try {
    await navigator.clipboard.writeText(text)
    alert('已复制CSS变量')
  } catch {}
}
</script>
