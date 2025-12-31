<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">专业取色器</h1>
      <p class="text-gray-600 dark:text-gray-400">屏幕取色、HEX/RGB/HSL/HSV格式转换、色彩历史记录</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6 mb-6">
      <!-- 取色器 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">取色器</h2>
        <div class="space-y-4">
          <!-- 颜色输入 -->
          <div class="flex gap-4 items-center">
            <div class="relative">
              <input
                ref="nativePicker"
                v-model="hexValue"
                type="color"
                class="w-32 h-32 rounded-xl cursor-pointer border-4 border-gray-200 dark:border-gray-600 shadow-lg"
              >
            </div>
            <div class="flex-1 space-y-3">
              <div>
                <label class="block text-sm font-medium mb-1">HEX</label>
                <div class="flex gap-2">
                  <input
                    v-model="hexValue"
                    maxlength="7"
                    class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 font-mono uppercase"
                    @input="updateFromHex"
                  >
                  <button @click="copyHex" class="px-3 py-2 bg-blue-500 text-white rounded-lg">复制</button>
                </div>
              </div>
            </div>
          </div>

          <!-- 饱和度/亮度选择器 -->
          <div class="space-y-2">
            <label class="block text-sm font-medium">饱和度 / 亮度</label>
            <div
              ref="slCanvas"
              class="h-40 rounded-lg cursor-crosshair relative"
              :style="{
                background: `
                  linear-gradient(to top, #000 0%, transparent 100%),
                  linear-gradient(to right, #fff 0%, transparent 100%),
                  ${hueColor}
                `
              }"
              @mousedown="startSLDrag"
              @mousemove="onSLDrag"
              @mouseup="stopSLDrag"
              @mouseleave="stopSLDrag"
            >
              <div
                class="absolute w-4 h-4 rounded-full border-2 border-white shadow-lg transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                :style="{
                  left: saturation + '%',
                  top: (100 - lightness) + '%',
                  backgroundColor: hexValue
                }"
              ></div>
            </div>
          </div>

          <!-- 色相滑块 -->
          <div class="space-y-2">
            <label class="block text-sm font-medium">色相 (Hue: {{ hue }}°)</label>
            <div class="relative h-6 rounded-lg overflow-hidden" style="background: linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%);">
              <input
                v-model.number="hue"
                type="range"
                min="0"
                max="360"
                class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                @input="updateFromHsl"
              >
              <div
                class="absolute top-0 w-1 h-full bg-white shadow pointer-events-none transform -translate-x-1/2"
                :style="{ left: (hue / 360 * 100) + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 颜色值转换 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4">颜色值转换</h2>
        <div class="space-y-4">
          <!-- RGB -->
          <div>
            <label class="block text-sm font-medium mb-1">RGB</label>
            <div class="flex gap-2 items-center">
              <span class="text-red-500 font-bold">R</span>
              <input v-model.number="rgb.r" type="number" min="0" max="255" class="w-20 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700" @input="updateFromRgb">
              <span class="text-green-500 font-bold">G</span>
              <input v-model.number="rgb.g" type="number" min="0" max="255" class="w-20 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700" @input="updateFromRgb">
              <span class="text-blue-500 font-bold">B</span>
              <input v-model.number="rgb.b" type="number" min="0" max="255" class="w-20 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700" @input="updateFromRgb">
            </div>
            <div class="mt-2 font-mono text-sm text-gray-500 dark:text-gray-400">
              rgb({{ rgb.r }}, {{ rgb.g }}, {{ rgb.b }})
            </div>
          </div>

          <!-- HSL -->
          <div>
            <label class="block text-sm font-medium mb-1">HSL</label>
            <div class="flex gap-2 items-center">
              <input v-model.number="hsl.h" type="number" min="0" max="360" class="w-20 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700" @input="updateFromHsl">
              <span>°</span>
              <input v-model.number="hsl.s" type="number" min="0" max="100" class="w-20 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700" @input="updateFromHsl">
              <span>%</span>
              <input v-model.number="hsl.l" type="number" min="0" max="100" class="w-20 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700" @input="updateFromHsl">
              <span>%</span>
            </div>
            <div class="mt-2 font-mono text-sm text-gray-500 dark:text-gray-400">
              hsl({{ hsl.h }}°, {{ hsl.s }}%, {{ hsl.l }}%)
            </div>
          </div>

          <!-- HSV -->
          <div>
            <label class="block text-sm font-medium mb-1">HSV</label>
            <div class="flex gap-2 items-center">
              <input v-model.number="hsv.h" type="number" min="0" max="360" class="w-20 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700" @input="updateFromHsv">
              <span>°</span>
              <input v-model.number="hsv.s" type="number" min="0" max="100" class="w-20 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700" @input="updateFromHsv">
              <span>%</span>
              <input v-model.number="hsv.v" type="number" min="0" max="100" class="w-20 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700" @input="updateFromHsv">
              <span>%</span>
            </div>
            <div class="mt-2 font-mono text-sm text-gray-500 dark:text-gray-400">
              hsv({{ hsv.h }}°, {{ hsv.s }}%, {{ hsv.v }}%)
            </div>
          </div>

          <!-- 预览 -->
          <div class="p-4 rounded-lg border-2 border-gray-200 dark:border-gray-600" :style="{ backgroundColor: hexValue }">
            <div class="flex items-center justify-between">
              <span class="font-mono font-bold text-lg px-3 py-1 rounded" :class="isLight ? 'text-black' : 'text-white'">
                {{ hexValue }}
              </span>
              <button @click="addToHistory" class="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm" :class="isLight ? 'text-black' : 'text-white'">
                保存到历史
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 常用颜色 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">常用颜色</h2>
      <div class="grid grid-cols-8 md:grid-cols-12 lg:grid-cols-16 gap-2">
        <button
          v-for="color in commonColors"
          :key="color"
          @click="setColor(color)"
          class="w-full aspect-square rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:scale-110 hover:border-blue-500 transition"
          :style="{ backgroundColor: color }"
          :title="color"
        ></button>
      </div>
    </div>

    <!-- 历史记录 -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold">历史记录</h2>
        <button @click="clearHistory" class="px-3 py-1 text-sm bg-red-500 text-white rounded">清空</button>
      </div>
      <div v-if="colorHistory.length === 0" class="text-center py-8 text-gray-400">
        暂无历史记录
      </div>
      <div v-else class="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2">
        <button
          v-for="(color, index) in colorHistory"
          :key="index"
          @click="setColor(color)"
          class="w-full aspect-square rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:scale-110 hover:border-blue-500 transition relative group"
          :style="{ backgroundColor: color }"
        >
          <span class="absolute inset-0 flex items-center justify-center text-xs font-mono font-bold opacity-0 group-hover:opacity-100 transition" :class="isLightColor(color) ? 'text-black' : 'text-white'">
            {{ color }}
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

useHead({
  title: '专业取色器 - 在线颜色选择与转换',
  meta: [{ name: 'description', content: '在线专业取色工具，支持屏幕取色、HEX/RGB/HSL/HSV格式转换，提供颜色历史记录功能。' }],
  keywords: ['取色器', '颜色选择', 'HEX转换', 'RGB转换', 'HSL转换', 'HSV转换', '色彩工具']
})

const hexValue = ref('#3B82F6')
const hue = ref(217)
const saturation = ref(91)
const lightness = ref(60)

const rgb = ref({ r: 59, g: 130, b: 246 })
const hsl = ref({ h: 217, s: 91, l: 60 })
const hsv = ref({ h: 217, s: 76, v: 96 })

const slCanvas = ref<HTMLElement>()
const isDragging = ref(false)

const commonColors = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
  '#FFA500', '#800080', '#FFC0CB', '#A52A2A', '#808080', '#C0C0C0', '#FFD700', '#FF69B4',
  '#4B0082', '#006400', '#800000', '#808000', '#008080', '#000080', '#800080', '#FF4500',
  '#2E8B57', '#4682B4', '#FF6347', '#7B68EE', '#00CED1', '#FF1493', '#1E90FF', '#FFDAB9'
]

const colorHistory = ref<string[]>([])

const hueColor = computed(() => {
  return `hsl(${hue.value}, 100%, 50%)`
})

const isLight = computed(() => {
  return lightness.value > 50
})

watch([hue, saturation, lightness], () => {
  updateAllFormats()
})

function hexToRgb(hex: string): { r: number, g: number, b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : { r: 0, g: 0, b: 0 }
}

function rgbToHsl(r: number, g: number, b: number): { h: number, s: number, l: number } {
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

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

function rgbToHsv(r: number, g: number, b: number): { h: number, s: number, v: number } {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  const s = max === 0 ? 0 : d / max
  const v = max

  if (max !== min) {
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

  return { h: Math.round(h * 360), s: Math.round(s * 100), v: Math.round(v * 100) }
}

function hslToRgb(h: number, s: number, l: number): { r: number, g: number, b: number } {
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

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255)
  }
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => n.toString(16).padStart(2, '0').toUpperCase()
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function hsvToRgb(h: number, s: number, v: number): { r: number, g: number, b: number } {
  s /= 100
  v /= 100

  const c = v * s
  const x = c * (1 - Math.abs((h / 60) % 2 - 1))
  const m = v - c
  let r = 0
  let g = 0
  let b = 0

  if (h < 60) { r = c; g = x; b = 0 }
  else if (h < 120) { r = x; g = c; b = 0 }
  else if (h < 180) { r = 0; g = c; b = x }
  else if (h < 240) { r = 0; g = x; b = c }
  else if (h < 300) { r = x; g = 0; b = c }
  else { r = c; g = 0; b = x }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255)
  }
}

function updateFromHex() {
  const rgb = hexToRgb(hexValue.value)
  rgb.value = rgb
  const hslValue = rgbToHsl(rgb.r, rgb.g, rgb.b)
  const hsvValue = rgbToHsv(rgb.r, rgb.g, rgb.b)

  hsl.value = hslValue
  hsv.value = hsvValue
  hue.value = hslValue.h
  saturation.value = hslValue.s
  lightness.value = hslValue.l
}

function updateFromRgb() {
  hsl.value = rgbToHsl(rgb.value.r, rgb.value.g, rgb.value.b)
  hsv.value = rgbToHsv(rgb.value.r, rgb.value.g, rgb.value.b)
  hue.value = hsl.value.h
  saturation.value = hsl.value.s
  lightness.value = hsl.value.l
  hexValue.value = rgbToHex(rgb.value.r, rgb.value.g, rgb.value.b)
}

function updateFromHsl() {
  const rgbValue = hslToRgb(hsl.value.h, hsl.value.s, hsl.value.l)
  rgb.value = rgbValue
  hsv.value = rgbToHsv(rgbValue.r, rgbValue.g, rgbValue.b)
  hue.value = hsl.value.h
  saturation.value = hsl.value.s
  lightness.value = hsl.value.l
  hexValue.value = rgbToHex(rgbValue.r, rgbValue.g, rgbValue.b)
}

function updateFromHsv() {
  const rgbValue = hsvToRgb(hsv.value.h, hsv.value.s, hsv.value.v)
  rgb.value = rgbValue
  hsl.value = rgbToHsl(rgbValue.r, rgbValue.g, rgbValue.b)
  hue.value = hsl.value.h
  saturation.value = hsl.value.s
  lightness.value = hsl.value.l
  hexValue.value = rgbToHex(rgbValue.r, rgbValue.g, rgbValue.b)
}

function updateAllFormats() {
  const rgbValue = hslToRgb(hue.value, saturation.value, lightness.value)
  rgb.value = rgbValue
  hsl.value = { h: hue.value, s: saturation.value, l: lightness.value }
  hsv.value = rgbToHsv(rgbValue.r, rgbValue.g, rgbValue.b)
  hexValue.value = rgbToHex(rgbValue.r, rgbValue.g, rgbValue.b)
}

function startSLDrag(e: MouseEvent) {
  isDragging.value = true
  updateSLFromMouse(e)
}

function onSLDrag(e: MouseEvent) {
  if (!isDragging.value) return
  updateSLFromMouse(e)
}

function stopSLDrag() {
  isDragging.value = false
}

function updateSLFromMouse(e: MouseEvent) {
  if (!slCanvas.value) return
  const rect = slCanvas.value.getBoundingClientRect()
  saturation.value = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
  lightness.value = Math.max(0, Math.min(100, 100 - ((e.clientY - rect.top) / rect.height) * 100))
  updateAllFormats()
}

function setColor(color: string) {
  hexValue.value = color
  updateFromHex()
}

function isLightColor(hex: string): boolean {
  const { l } = rgbToHsl(...Object.values(hexToRgb(hex)))
  return l > 50
}

function addToHistory() {
  const color = hexValue.value
  if (!colorHistory.value.includes(color)) {
    colorHistory.value.unshift(color)
    if (colorHistory.value.length > 48) {
      colorHistory.value.pop()
    }
  }
}

function clearHistory() {
  colorHistory.value = []
}

async function copyHex() {
  try {
    await navigator.clipboard.writeText(hexValue.value)
    alert(`已复制: ${hexValue.value}`)
  } catch {}
}

// 初始化
updateFromHex()
</script>
