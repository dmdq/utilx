<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">专业取色器 - 在线颜色选择与转换工具</h1>
      <p class="text-muted-foreground">屏幕取色、HEX/RGB/HSL/HSV格式转换、色彩历史记录。支持实时预览和一键复制。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid lg:grid-cols-2 gap-6 mb-8">
      <!-- 取色器 -->
      <div class="bg-card border border-border rounded-xl p-6">
        <h2 class="text-xl font-semibold text-foreground mb-4">取色器</h2>
        <div class="space-y-4">
          <!-- 颜色输入 -->
          <div class="flex gap-4 items-center">
            <div class="relative">
              <input
                ref="nativePicker"
                v-model="hexValue"
                type="color"
                class="w-32 h-32 rounded-xl cursor-pointer border-4 border-border shadow-lg"
              >
            </div>
            <div class="flex-1 space-y-3">
              <div>
                <label class="block text-sm font-medium text-foreground mb-1">HEX</label>
                <div class="flex gap-2">
                  <input
                    v-model="hexValue"
                    maxlength="7"
                    class="flex-1 px-3 py-2 border border-border rounded-lg bg-muted text-foreground font-mono uppercase"
                    @input="updateFromHex"
                  >
                  <button @click="copyHex" class="px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">复制</button>
                </div>
              </div>
            </div>
          </div>

          <!-- 饱和度/亮度选择器 -->
          <div class="space-y-2">
            <label class="block text-sm font-medium text-foreground">饱和度 / 亮度</label>
            <div
              ref="slCanvas"
              class="h-40 rounded-lg cursor-crosshair relative"
              :style="{
                background: `
                  linear-gradient(to top, rgb(0,0,0) 0%, transparent 100%),
                  linear-gradient(to right, rgb(255,255,255) 0%, transparent 100%),
                  ${hueColor}
                `
              }"
              @mousedown="startSLDrag"
              @mousemove="onSLDrag"
              @mouseup="stopSLDrag"
              @mouseleave="stopSLDrag"
            >
              <div
                class="absolute w-4 h-4 rounded-full border-2 border-primary-foreground shadow-lg transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
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
            <label class="block text-sm font-medium text-foreground">色相 (Hue: {{ hue }}°)</label>
            <div class="relative h-6 rounded-lg overflow-hidden" style="background: linear-gradient(to right, rgb(255,0,0) 0%, rgb(255,255,0) 17%, rgb(0,255,0) 33%, rgb(0,255,255) 50%, rgb(0,0,255) 67%, rgb(255,0,255) 83%, rgb(255,0,0) 100%);">
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
      <div class="bg-card border border-border rounded-xl p-6">
        <h2 class="text-xl font-semibold text-foreground mb-4">颜色值转换</h2>
        <div class="space-y-4">
          <!-- RGB -->
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">RGB</label>
            <div class="flex gap-2 items-center">
              <span class="text-red-500 font-bold">R</span>
              <input v-model.number="rgb.r" type="number" min="0" max="255" class="w-20 px-2 py-2 border border-border rounded bg-muted text-foreground" @input="updateFromRgb">
              <span class="text-green-500 font-bold">G</span>
              <input v-model.number="rgb.g" type="number" min="0" max="255" class="w-20 px-2 py-2 border border-border rounded bg-muted text-foreground" @input="updateFromRgb">
              <span class="text-blue-500 font-bold">B</span>
              <input v-model.number="rgb.b" type="number" min="0" max="255" class="w-20 px-2 py-2 border border-border rounded bg-muted text-foreground" @input="updateFromRgb">
            </div>
            <div class="mt-2 font-mono text-sm text-muted-foreground">
              rgb({{ rgb.r }}, {{ rgb.g }}, {{ rgb.b }})
            </div>
          </div>

          <!-- HSL -->
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">HSL</label>
            <div class="flex gap-2 items-center">
              <input v-model.number="hsl.h" type="number" min="0" max="360" class="w-20 px-2 py-2 border border-border rounded bg-muted text-foreground" @input="updateFromHsl">
              <span>°</span>
              <input v-model.number="hsl.s" type="number" min="0" max="100" class="w-20 px-2 py-2 border border-border rounded bg-muted text-foreground" @input="updateFromHsl">
              <span>%</span>
              <input v-model.number="hsl.l" type="number" min="0" max="100" class="w-20 px-2 py-2 border border-border rounded bg-muted text-foreground" @input="updateFromHsl">
              <span>%</span>
            </div>
            <div class="mt-2 font-mono text-sm text-muted-foreground">
              hsl({{ hsl.h }}°, {{ hsl.s }}%, {{ hsl.l }}%)
            </div>
          </div>

          <!-- HSV -->
          <div>
            <label class="block text-sm font-medium text-foreground mb-1">HSV</label>
            <div class="flex gap-2 items-center">
              <input v-model.number="hsv.h" type="number" min="0" max="360" class="w-20 px-2 py-2 border border-border rounded bg-muted text-foreground" @input="updateFromHsv">
              <span>°</span>
              <input v-model.number="hsv.s" type="number" min="0" max="100" class="w-20 px-2 py-2 border border-border rounded bg-muted text-foreground" @input="updateFromHsv">
              <span>%</span>
              <input v-model.number="hsv.v" type="number" min="0" max="100" class="w-20 px-2 py-2 border border-border rounded bg-muted text-foreground" @input="updateFromHsv">
              <span>%</span>
            </div>
            <div class="mt-2 font-mono text-sm text-muted-foreground">
              hsv({{ hsv.h }}°, {{ hsv.s }}%, {{ hsv.v }}%)
            </div>
          </div>

          <!-- 预览 -->
          <div class="p-4 rounded-lg border-2 border-border" :style="{ backgroundColor: hexValue }">
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
    <div class="bg-card border border-border rounded-xl p-6 mb-8">
      <h2 class="text-xl font-semibold text-foreground mb-4">常用颜色</h2>
      <div class="grid grid-cols-8 md:grid-cols-12 lg:grid-cols-16 gap-2">
        <button
          v-for="color in commonColors"
          :key="color"
          @click="setColor(color)"
          class="w-full aspect-square rounded-lg border-2 border-border hover:scale-110 hover:border-primary transition"
          :style="{ backgroundColor: color }"
          :title="color"
        ></button>
      </div>
    </div>

    <!-- 历史记录 -->
    <div class="bg-card border border-border rounded-xl p-6 mb-8">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold text-foreground">历史记录</h2>
        <button @click="clearHistory" class="px-3 py-1 text-sm bg-destructive text-destructive-foreground rounded">清空</button>
      </div>
      <div v-if="colorHistory.length === 0" class="text-center py-8 text-muted-foreground">
        暂无历史记录
      </div>
      <div v-else class="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2">
        <button
          v-for="(color, index) in colorHistory"
          :key="index"
          @click="setColor(color)"
          class="w-full aspect-square rounded-lg border-2 border-border hover:scale-110 hover:border-primary transition relative group"
          :style="{ backgroundColor: color }"
        >
          <span class="absolute inset-0 flex items-center justify-center text-xs font-mono font-bold opacity-0 group-hover:opacity-100 transition" :class="isLightColor(color) ? 'text-black' : 'text-white'">
            {{ color }}
          </span>
        </button>
      </div>
    </div>

    <!-- SEO 内容长尾区 -->
    <div class="p-6 mb-12 relative bg-card border border-border">
      <!-- 折叠按钮 -->
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        :title="isSeoContentVisible ? '折叠内容' : '展开内容'"
      >
        <HelpCircle v-if="!isSeoContentVisible" class="w-5 h-5" />
        <ChevronUp v-else class="w-5 h-5" />
      </button>

      <!-- 内容区域 -->
      <div v-show="isSeoContentVisible">
        <h2 class="text-2xl font-bold text-foreground mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          什么是颜色格式？
        </h2>
        <p class="text-muted-foreground mb-4">
          在网页设计和开发中，有多种颜色格式可供选择。每种格式都有其特点和适用场景。
          了解不同颜色格式之间的转换和用途，对于设计师和开发者来说都非常重要。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常用颜色格式
        </h2>
        <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
          <li><strong>HEX</strong>: 十六进制格式，如 #FF5733。最常用的网页颜色格式</li>
          <li><strong>RGB</strong>: 红绿蓝格式，如 rgb(255, 87, 51)。使用三个0-255的数值表示颜色</li>
          <li><strong>HSL</strong>: 色相、饱和度、亮度格式，如 hsl(11, 100%, 60%)。更直观的颜色调整方式</li>
          <li><strong>HSV</strong>: 色相、饱和度、明度格式，如 hsv(11, 100%, 100%)。常用于色彩选择器</li>
        </ul>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>使用颜色选择器选择颜色，或直接输入HEX值</li>
          <li>调整饱和度、亮度和色相滑块来微调颜色</li>
          <li>查看RGB、HSL、HSV格式的实时转换结果</li>
          <li>点击"复制"按钮快速复制颜色代码</li>
          <li>保存常用颜色到历史记录，方便日后使用</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">HEX 和 RGB 有什么区别？</h3>
            <p class="text-muted-foreground mt-1">
              HEX 是十六进制格式，更简洁，适合在代码中使用；RGB 是十进制格式，更直观，适合程序处理。
              两者可以相互转换，表示相同的颜色。HEX 格式如 #FF5733，对应的 RGB 格式是 rgb(255, 87, 51)。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">HSL 和 RGB 有什么区别？</h3>
            <p class="text-muted-foreground mt-1">
              HSL 使用色相、饱和度、亮度来描述颜色，更符合人类对颜色的感知方式；
              RGB 使用红、绿、蓝三个通道的强度来描述颜色，更符合显示器的工作原理。
              HSL 更适合调整颜色的色调和明暗，而 RGB 更适合精确控制颜色值。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何选择合适的颜色格式？</h3>
            <p class="text-muted-foreground mt-1">
              一般情况下，HEX 格式是最常用的选择，因为它简洁且广泛支持。
              如果需要动态调整颜色，HSL 格式会更方便。如果需要程序化处理颜色，RGB 格式更合适。
              在CSS中，所有这些格式都可以直接使用。
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 相关推荐区 -->
    <section class="mb-12">
      <h2 class="text-2xl font-bold text-foreground mb-4">您可能还需要...</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <NuxtLink
          v-for="relatedTool in relatedTools"
          :key="relatedTool.id"
          :to="`/tools/${relatedTool.id}`"
          class="block p-4 bg-card border border-border rounded-lg hover:bg-accent transition-colors"
        >
          <div class="flex items-center gap-2 mb-2">
            <component
              :is="iconMap[relatedTool.icon]"
              class="w-5 h-5 text-primary"
            />
            <span class="font-medium text-foreground">{{ relatedTool.name }}</span>
          </div>
          <p class="text-sm text-muted-foreground line-clamp-2">{{ relatedTool.description }}</p>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { HelpCircle, ChevronUp, Box, Palette, Layers, Droplets } from 'lucide-vue-next'
import { tools } from '~/data/tools'

// SEO配置
useSeoMeta({
  title: '专业取色器 - 在线颜色选择与转换工具 | Util工具箱',
  description: '在线专业取色工具，支持屏幕取色、HEX/RGB/HSL/HSV格式转换，提供颜色历史记录功能。',
  keywords: '取色器,颜色选择,HEX转换,RGB转换,HSL转换,HSV转换,色彩工具',
  author: 'Util工具箱',
  ogTitle: '专业取色器 - 在线颜色选择与转换',
  ogDescription: '专业的在线取色工具，支持多种颜色格式转换和历史记录功能。',
  ogImage: 'https://www.util.cn/images/tools/pro-color-picker.png',
  ogUrl: 'https://www.util.cn/tools/pro-color-picker',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: '专业取色器 - 在线颜色选择与转换',
  twitterDescription: '专业的在线取色工具，支持多种颜色格式转换和历史记录功能。',
  twitterImage: 'https://www.util.cn/images/tools/pro-color-picker.png'
})

// JSON-LD 结构化数据
useHead({
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebApplication',
            name: '专业取色器',
            description: '在线颜色选择与转换工具',
            url: 'https://www.util.cn/tools/pro-color-picker',
            applicationCategory: 'DeveloperApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              '多种颜色格式',
              '实时转换',
              '颜色历史',
              '常用颜色',
              '可视化选择',
              '一键复制'
            ]
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: '首页',
                item: 'https://www.util.cn'
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: '工具',
                item: 'https://www.util.cn/tools'
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: '专业取色器',
                item: 'https://www.util.cn/tools/pro-color-picker'
              }
            ]
          }
        ]
      })
    }
  ]
})

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

const hexValue = ref('#3B82F6')
const hue = ref(217)
const saturation = ref(91)
const lightness = ref(60)

const rgb = ref({ r: 59, g: 130, b: 246 })
const hsl = ref({ h: 217, s: 91, l: 60 })
const hsv = ref({ h: 217, s: 76, v: 96 })

const slCanvas = ref()
const isDragging = ref(false)

const commonColors = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
  '#FFA500', '#800080', '#FFC0CB', '#A52A2A', '#808080', '#C0C0C0', '#FFD700', '#FF69B4',
  '#4B0082', '#006400', '#800000', '#808000', '#008080', '#000080', '#800080', '#FF4500',
  '#2E8B57', '#4682B4', '#FF6347', '#7B68EE', '#00CED1', '#FF1493', '#1E90FF', '#FFDAB9'
]

const colorHistory = ref([])

// 图标映射
const iconMap = {
  Box, Palette, Layers, Droplets
}

// 相关工具
const relatedTools = computed(() => {
  return [
    tools.find(t => t.id === 'border-radius-generator'),
    tools.find(t => t.id === 'css-filter-generator'),
    tools.find(t => t.id === 'backdrop-filter-generator'),
    tools.find(t => t.id === 'transform-generator')
  ].filter(Boolean)
})

const hueColor = computed(() => {
  return `rgb(${hue.value}, 100%, 50%)`
})

const isLight = computed(() => {
  return lightness.value > 50
})

watch([hue, saturation, lightness], () => {
  updateAllFormats()
})

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : { r: 0, g: 0, b: 0 }
}

function rgbToHsl(r, g, b) {
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

function rgbToHsv(r, g, b) {
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

function hslToRgb(h, s, l) {
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

function rgbToHex(r, g, b) {
  const toHex = (n) => n.toString(16).padStart(2, '0').toUpperCase()
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function hsvToRgb(h, s, v) {
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
  const rgbValue = hexToRgb(hexValue.value)
  rgb.value = rgbValue
  const hslValue = rgbToHsl(rgbValue.r, rgbValue.g, rgbValue.b)
  const hsvValue = rgbToHsv(rgbValue.r, rgbValue.g, rgbValue.b)

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

function startSLDrag(e) {
  isDragging.value = true
  updateSLFromMouse(e)
}

function onSLDrag(e) {
  if (!isDragging.value) return
  updateSLFromMouse(e)
}

function stopSLDrag() {
  isDragging.value = false
}

function updateSLFromMouse(e) {
  if (!slCanvas.value) return
  const rect = slCanvas.value.getBoundingClientRect()
  saturation.value = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
  lightness.value = Math.max(0, Math.min(100, 100 - ((e.clientY - rect.top) / rect.height) * 100))
  updateAllFormats()
}

function setColor(color) {
  hexValue.value = color
  updateFromHex()
}

function isLightColor(hex) {
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

function toggleSeoContent() {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

// 初始化
updateFromHex()
</script>
