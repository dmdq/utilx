<template>
  <div class="max-w-8xl mx-auto">
    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3 flex items-center gap-3">
        <Palette class="w-8 h-8 text-primary" />
        随机颜色生成
      </h1>
      <p class="text-muted-foreground">生成随机颜色和配色方案</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="space-y-6">
      <!-- 配置选项 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">颜色配置</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <!-- 颜色格式 -->
          <div>
            <label class="text-sm font-medium mb-2 block">颜色格式</label>
            <select v-model="colorFormat" class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="hex">HEX (#RRGGBB)</option>
              <option value="rgb">RGB (r,g,b)</option>
              <option value="hsl">HSL (h,s,l)</option>
              <option value="hsv">HSV (h,s,v)</option>
            </select>
          </div>

          <!-- 生成数量 -->
          <div>
            <label class="text-sm font-medium mb-2 block">生成数量</label>
            <div class="flex gap-2">
              <input
                v-model.number="colorCount"
                type="number"
                min="1"
                max="20"
                class="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <span class="px-3 py-2 bg-muted rounded-lg text-sm">个</span>
            </div>
          </div>

          <!-- 配色模式 -->
          <div>
            <label class="text-sm font-medium mb-2 block">配色模式</label>
            <select v-model="schemeMode" class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="random">完全随机</option>
              <option value="complementary">互补色</option>
              <option value="analogous">类似色</option>
              <option value="triadic">三色系</option>
              <option value="monochromatic">单色系</option>
            </select>
          </div>

          <!-- 亮度范围 -->
          <div>
            <label class="text-sm font-medium mb-2 block">亮度范围</label>
            <select v-model="brightness" class="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="all">所有亮度</option>
              <option value="light">亮色系</option>
              <option value="dark">暗色系</option>
              <option value="mid">中等亮度</option>
            </select>
          </div>
        </div>

        <!-- 快捷按钮 -->
        <div class="mt-6 flex flex-wrap gap-2">
          <button
            @click="colorCount = 1"
            class="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded transition-colors"
          >
            单个颜色
          </button>
          <button
            @click="colorCount = 5"
            class="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded transition-colors"
          >
            配色方案(5)
          </button>
          <button
            @click="schemeMode = 'complementary'"
            class="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded transition-colors"
          >
            互补色
          </button>
          <button
            @click="generatePastelColors"
            class="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded transition-colors"
          >
            粉彩系
          </button>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="flex justify-center gap-4">
        <button
          @click="generateColors"
          :disabled="isGenerating"
          class="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw v-if="isGenerating" class="w-5 h-5 animate-spin" />
          <Palette v-else class="w-5 h-5" />
          {{ isGenerating ? '生成中...' : '生成颜色' }}
        </button>

        <button
          v-if="results.length > 0"
          @click="clearResults"
          class="px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors flex items-center gap-2"
        >
          <Trash2 class="w-5 h-5" />
          清空结果
        </button>
      </div>

      <!-- 结果显示 -->
      <div v-if="results.length > 0" class="bg-card border border-border rounded-lg p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold">颜色方案</h2>
          <div class="flex gap-2">
            <button
              @click="copyColors"
              class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Copy class="w-4 h-4" />
              {{ copied ? '已复制' : '复制颜色' }}
            </button>
            <button
              @click="exportColors"
              class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Download class="w-4 h-4" />
              导出
            </button>
          </div>
        </div>

        <div class="space-y-6">
          <div
            v-for="(result, index) in results"
            :key="index"
            class="bg-muted/30 border border-border rounded-lg p-4"
          >
            <div class="flex items-center justify-between mb-4">
              <span class="text-sm text-muted-foreground">方案 {{ index + 1 }}</span>
              <span class="text-sm text-muted-foreground">{{ result.timestamp }}</span>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div
                v-for="color in result.colors"
                :key="color.hex"
                class="group relative"
              >
                <!-- 颜色预览 -->
                <div
                  :style="{ backgroundColor: color.hex }"
                  class="w-full aspect-square rounded-lg shadow-sm transition-transform group-hover:scale-105 cursor-pointer"
                  @click="copySingleColor(color.hex)"
                >
                  <div class="w-full h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Copy class="w-6 h-6 text-white drop-shadow-lg" />
                  </div>
                </div>

                <!-- 颜色信息 -->
                <div class="mt-2 text-center">
                  <div class="font-mono text-sm font-medium">{{ color.hex }}</div>
                  <div class="text-xs text-muted-foreground">{{ getFormattedColor(color) }}</div>
                </div>

                <!-- 颜色详情 -->
                <div class="mt-1 text-xs text-muted-foreground text-center">
                  RGB: {{ color.rgb.r }},{{ color.rgb.g }},{{ color.rgb.b }}
                </div>
              </div>
            </div>

            <!-- 配色预览 -->
            <div class="mt-4">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-sm font-medium">配色预览</span>
                <span class="text-xs text-muted-foreground">({{ result.colors.length }}色)</span>
              </div>
              <div class="h-12 rounded-lg overflow-hidden flex">
                <div
                  v-for="color in result.colors"
                  :key="color.hex"
                  :style="{ backgroundColor: color.hex, flex: '1' }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 颜色统计 -->
      <div v-if="results.length > 0" class="bg-card border border-border rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">颜色统计</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div class="text-center">
            <div class="text-2xl font-bold text-primary">{{ totalColors }}</div>
            <div class="text-muted-foreground">总颜色数</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-primary">{{ averageBrightness }}%</div>
            <div class="text-muted-foreground">平均亮度</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-primary">{{ uniqueHues }}</div>
            <div class="text-muted-foreground">色相数量</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-primary">{{ results.length }}</div>
            <div class="text-muted-foreground">方案数量</div>
          </div>
        </div>
      </div>

      <!-- 颜色理论 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">颜色理论</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 class="font-medium mb-3">配色模式说明</h3>
            <div class="space-y-2 text-sm">
              <div class="flex items-start gap-2">
                <div class="w-4 h-4 bg-red-500 rounded mt-0.5"></div>
                <div>
                  <div class="font-medium">互补色</div>
                  <div class="text-muted-foreground">色环上相对的颜色，对比强烈</div>
                </div>
              </div>
              <div class="flex items-start gap-2">
                <div class="w-4 h-4 bg-blue-500 rounded mt-0.5"></div>
                <div>
                  <div class="font-medium">类似色</div>
                  <div class="text-muted-foreground">色环上相邻的颜色，和谐统一</div>
                </div>
              </div>
              <div class="flex items-start gap-2">
                <div class="w-4 h-4 bg-green-500 rounded mt-0.5"></div>
                <div>
                  <div class="font-medium">三色系</div>
                  <div class="text-muted-foreground">色环上等距的三个颜色</div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 class="font-medium mb-3">应用场景</h3>
            <ul class="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>网站和应用的UI设计</li>
              <li>品牌视觉识别系统</li>
              <li>平面设计和艺术创作</li>
              <li>室内装饰和配色方案</li>
              <li>时尚搭配和服装设计</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- 使用说明 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h2 class="text-lg font-semibold mb-4">使用说明</h2>

        <div class="space-y-4 text-sm">
          <div>
            <h3 class="font-medium mb-2">功能特点</h3>
            <ul class="list-disc list-inside text-muted-foreground space-y-1">
              <li>支持多种颜色格式输出</li>
              <li>专业配色模式算法</li>
              <li>亮度和色相智能控制</li>
              <li>配色预览和可视化展示</li>
              <li>一键复制和导出功能</li>
            </ul>
          </div>

          <div>
            <h3 class="font-medium mb-2">使用技巧</h3>
            <p class="text-muted-foreground">
              选择合适的配色模式可以快速生成和谐的颜色组合。
              亮色系适合清爽明快的设计，暗色系适合高端商务风格。
              单色系配色最为安全，互补色配色最具视觉冲击力。
            </p>
          </div>
        </div>
      </div>

      <!-- 相关工具 -->
      <div class="bg-card border border-border rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">相关工具</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NuxtLink
            to="/tools/random-number-generator"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Hash class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">随机数字生成器</p>
              <p class="text-xs text-muted-foreground">生成指定范围的随机数</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
          <NuxtLink
            to="/tools/random-choice"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <List class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">随机选择器</p>
              <p class="text-xs text-muted-foreground">从列表中随机选择</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
          <NuxtLink
            to="/tools/random-dice"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Dice6 class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">随机骰子</p>
              <p class="text-xs text-muted-foreground">投掷虚拟骰子</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Palette, RefreshCw, Trash2, Copy, Download, Hash, List, Dice6, ArrowRight } from 'lucide-vue-next'

definePageMeta({
  layout: 'default'
})

import { useSEO } from '~/composables/useSEO'

const { setPageTitle } = useSEO()
setPageTitle('随机颜色生成 - 在线配色工具')

// 配置
const colorFormat = ref('hex')
const colorCount = ref(5)
const schemeMode = ref('random')
const brightness = ref('all')

// 状态
const isGenerating = ref(false)
const results = ref([])
const copied = ref(false)

// 计算属性
const totalColors = computed(() => {
  return results.value.reduce((total, result) => total + result.colors.length, 0)
})

const allColors = computed(() => {
  return results.value.flatMap(result => result.colors)
})

const averageBrightness = computed(() => {
  if (allColors.value.length === 0) return 0

  const totalBrightness = allColors.value.reduce((sum, color) => {
    const { r, g, b } = color.rgb
    return sum + (r * 0.299 + g * 0.587 + b * 0.114) / 255 * 100
  }, 0)

  return Math.round(totalBrightness / allColors.value.length)
})

const uniqueHues = computed(() => {
  const hues = new Set()
  allColors.value.forEach(color => {
    hues.push(Math.round(color.hsl.h))
  })
  return new Set(hues).size
})

// RGB转HEX
const rgbToHex = (r, g, b) => {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('')
}

// RGB转HSL
const rgbToHsl = (r, g, b) => {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
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

  return { h: h * 360, s: s * 100, l: l * 100 }
}

// RGB转HSV
const rgbToHsv = (r, g, b) => {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
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

  return { h: h * 360, s: s * 100, v: v * 100 }
}

// 生成随机颜色
const generateRandomColor = () => {
  let r, g, b

  // 根据亮度要求调整
  if (brightness.value === 'light') {
    r = Math.floor(Math.random() * 55) + 200
    g = Math.floor(Math.random() * 55) + 200
    b = Math.floor(Math.random() * 55) + 200
  } else if (brightness.value === 'dark') {
    r = Math.floor(Math.random() * 100)
    g = Math.floor(Math.random() * 100)
    b = Math.floor(Math.random() * 100)
  } else if (brightness.value === 'mid') {
    r = Math.floor(Math.random() * 100) + 77
    g = Math.floor(Math.random() * 100) + 77
    b = Math.floor(Math.random() * 100) + 77
  } else {
    r = Math.floor(Math.random() * 256)
    g = Math.floor(Math.random() * 256)
    b = Math.floor(Math.random() * 256)
  }

  const hex = rgbToHex(r, g, b)
  const rgb = { r, g, b }
  const hsl = rgbToHsl(r, g, b)
  const hsv = rgbToHsv(r, g, b)

  return { hex, rgb, hsl, hsv }
}

// 生成配色方案
const generateColorScheme = (baseColor) => {
  const colors = [baseColor]
  const { h, s, l } = baseColor.hsl

  switch (schemeMode.value) {
    case 'complementary':
      // 互补色：色环相对
      colors.push(generateRandomColor()) // 简化实现
      break

    case 'analogous':
      // 类似色：色环相邻
      for (let i = 1; i < colorCount.value; i++) {
        const newH = (h + i * 30) % 360
        const color = hslToRgb(newH, s, l)
        colors.push(color)
      }
      break

    case 'triadic':
      // 三色系：120度间隔
      for (let i = 1; i < Math.min(colorCount.value, 3); i++) {
        const newH = (h + i * 120) % 360
        const color = hslToRgb(newH, s, l)
        colors.push(color)
      }
      break

    case 'monochromatic':
      // 单色系：相同色相，不同明度
      for (let i = 1; i < colorCount.value; i++) {
        const newL = Math.max(10, Math.min(90, l + (i - colorCount.value/2) * 15))
        const color = hslToRgb(h, s, newL)
        colors.push(color)
      }
      break
  }

  // 填充剩余颜色
  while (colors.length < colorCount.value) {
    colors.push(generateRandomColor())
  }

  return colors.slice(0, colorCount.value)
}

// HSL转RGB
const hslToRgb = (h, s, l) => {
  h = h / 360
  s = s / 100
  l = l / 100

  let r, g, b

  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1/6) return p + (q - p) * 6 * t
      if (t < 1/2) return q
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
      return p
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1/3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1/3)
  }

  r = Math.round(r * 255)
  g = Math.round(g * 255)
  b = Math.round(b * 255)

  const hex = rgbToHex(r, g, b)
  return { hex, rgb: { r, g, b }, hsl: { h, s: s * 100, l: l * 100 }, hsv: rgbToHsv(r, g, b) }
}

// 生成粉彩系
const generatePastelColors = () => {
  brightness.value = 'light'
  colorCount.value = 5
  schemeMode.value = 'analogous'
  generateColors()
}

// 生成颜色
const generateColors = async () => {
  if (isGenerating.value) return

  isGenerating.value = true
  await new Promise(resolve => setTimeout(resolve, 500))

  const baseColor = generateRandomColor()
  const colorScheme = generateColorScheme(baseColor)

  const now = new Date()
  const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`

  results.value.unshift({
    colors: colorScheme,
    timestamp
  })

  if (results.value.length > 10) {
    results.value = results.value.slice(0, 10)
  }

  isGenerating.value = false
}

// 获取格式化颜色
const getFormattedColor = (color) => {
  switch (colorFormat.value) {
    case 'rgb':
      return `rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`
    case 'hsl':
      return `hsl(${Math.round(color.hsl.h)}, ${Math.round(color.hsl.s)}%, ${Math.round(color.hsl.l)}%)`
    case 'hsv':
      return `hsv(${Math.round(color.hsv.h)}, ${Math.round(color.hsv.s)}%, ${Math.round(color.hsv.v)}%)`
    default:
      return color.hex
  }
}

// 复制单个颜色
const copySingleColor = async (hex) => {
  try {
    await navigator.clipboard.writeText(hex)
    // 可以添加提示
  } catch (error) {
    console.error('复制失败:', error)
  }
}

// 复制所有颜色
const copyColors = async () => {
  try {
    const colors = results.value[0].colors.map(color => getFormattedColor(color))
    const text = colors.join(', ')

    await navigator.clipboard.writeText(text)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (error) {
    console.error('复制失败:', error)
  }
}

// 导出颜色
const exportColors = () => {
  if (results.value.length === 0) return

  const colors = results.value[0].colors
  let content = '颜色方案导出\n'
  content += '=============\n\n'

  colors.forEach((color, index) => {
    content += `颜色 ${index + 1}:\n`
    content += `HEX: ${color.hex}\n`
    content += `RGB: ${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}\n`
    content += `HSL: ${Math.round(color.hsl.h)}°, ${Math.round(color.hsl.s)}%, ${Math.round(color.hsl.l)}%\n\n`
  })

  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `color-scheme-${Date.now()}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

// 清空结果
const clearResults = () => {
  results.value = []
}
</script>