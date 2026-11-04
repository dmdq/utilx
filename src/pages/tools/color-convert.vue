<template>
  <div class="max-w-8xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">颜色编码转换工具</h1>
      <p class="text-muted-foreground">HEX、RGB、HSL、HSV 颜色格式之间的相互转换</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">输入颜色</h2>
          <div class="flex gap-2">
            <button @click="clearInput" class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground">清空</button>
            <button @click="loadExample" class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground">示例</button>
          </div>
        </div>

        <div class="flex gap-2">
          <input v-model="inputText" placeholder="#FF5733 或 rgb(255, 87, 51)" class="flex-1 p-3 border border-border rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary">
          <div class="w-16 h-12 rounded-lg border" :style="{ backgroundColor: previewColor }"></div>
        </div>

        <div class="bg-muted p-4 rounded-lg">
          <h3 class="font-medium text-sm mb-2">支持的格式</h3>
          <div class="text-xs text-muted-foreground space-y-1">
            <div>HEX: #FF5733 或 #F53</div>
            <div>RGB: rgb(255, 87, 51)</div>
            <div>HSL: hsl(11, 100%, 60%)</div>
            <div>HSV: hsv(11, 80%, 100%)</div>
          </div>
        </div>
      </div>

      <div class="space-y-3">
        <h2 class="text-lg font-semibold">转换结果</h2>
        <div v-if="results.hex" class="p-3 bg-muted rounded-lg">
          <p class="text-xs text-muted-foreground mb-1">HEX:</p>
          <code class="text-sm font-mono">{{ results.hex }}</code>
        </div>
        <div v-if="results.rgb" class="p-3 bg-muted rounded-lg">
          <p class="text-xs text-muted-foreground mb-1">RGB:</p>
          <code class="text-sm font-mono">{{ results.rgb }}</code>
        </div>
        <div v-if="results.hsl" class="p-3 bg-muted rounded-lg">
          <p class="text-xs text-muted-foreground mb-1">HSL:</p>
          <code class="text-sm font-mono">{{ results.hsl }}</code>
        </div>
        <div v-if="results.hsv" class="p-3 bg-muted rounded-lg">
          <p class="text-xs text-muted-foreground mb-1">HSV:</p>
          <code class="text-sm font-mono">{{ results.hsv }}</code>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useSeoMeta } from '#app'

const inputText = ref('')
const results = ref({ hex: '', rgb: '', hsl: '', hsv: '' })

const previewColor = computed(() => {
  if (results.hex) return results.hex
  return '#CCCCCC'
})

const examples = [
  '#FF5733',
  'rgb(255, 87, 51)',
  'hsl(11, 100%, 60%)',
  '#4CAF50'
]
const currentExample = ref(0)

const parseColor = (color) => {
  color = color.trim()

  // HEX
  if (color.startsWith('#')) {
    const hex = color.length === 4 ? color.split('').map((c, i) => i === 0 ? c : c + c).join('') : color
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return { r, g, b }
  }

  // RGB
  const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/i)
  if (rgbMatch) {
    return { r: parseInt(rgbMatch[1]), g: parseInt(rgbMatch[2]), b: parseInt(rgbMatch[3]) }
  }

  return null
}

const rgbToHex = (r, g, b) => {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase()
}

const rgbToHsl = (r, g, b) => {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h, s, l = (max + min) / 2

  if (max === min) {
    h = s = 0
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }

  return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`
}

const rgbToHsv = (r, g, b) => {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h, s, v = max
  const d = max - min
  s = max === 0 ? 0 : d / max

  if (max === min) {
    h = 0
  } else {
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }

  return `hsv(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(v * 100)}%)`
}

watch(inputText, (newText) => {
  if (newText) {
    const rgb = parseColor(newText)
    if (rgb) {
      results.value.hex = rgbToHex(rgb.r, rgb.g, rgb.b)
      results.value.rgb = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
      results.value.hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
      results.value.hsv = rgbToHsv(rgb.r, rgb.g, rgb.b)
    }
  } else {
    results.value = { hex: '', rgb: '', hsl: '', hsv: '' }
  }
})

const clearInput = () => { inputText.value = ''; results.value = { hex: '', rgb: '', hsl: '', hsv: '' } }
const loadExample = () => { inputText.value = examples[currentExample.value]; currentExample.value = (currentExample.value + 1) % examples.length }

useSeoMeta({
  title: '颜色编码转换 - 在线HEX/RGB/HSL/HSV颜色转换工具',
  description: '免费在线颜色编码转换工具，支持HEX、RGB、HSL、HSV颜色格式之间的相互转换。',
  keywords: ['color', '颜色', 'hex', 'rgb', 'hsl', 'hsv', '转换', '色彩']
})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('颜色编码转换工具')
</script>
