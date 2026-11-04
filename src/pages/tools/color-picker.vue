<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" /> -->

    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">颜色选择器</h1>
      <p class="text-muted-foreground">取色器、颜色转换，支持多种颜色格式</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 左侧：颜色选择器 -->
      <div class="space-y-4">
        <div class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">颜色选择器</h2>

          <!-- 主选择器 -->
          <div class="space-y-4">
            <!-- 颜色区域 -->
            <div class="space-y-2">
              <label class="text-sm font-medium">选择颜色</label>
              <div class="relative">
                <input
                  v-model="hexColor"
                  type="color"
                  class="w-full h-20 rounded-lg cursor-pointer border border-border"
                  @input="updateColorFromHex"
                />
              </div>
            </div>

            <!-- RGB 滑块 -->
            <div class="space-y-3">
              <label class="text-sm font-medium">RGB 值</label>
              <div class="space-y-2">
                <div class="flex items-center gap-3">
                  <span class="text-sm font-medium w-8">R</span>
                  <input
                    v-model="rgb.r"
                    type="range"
                    min="0"
                    max="255"
                    class="flex-1"
                    @input="updateColorFromRGB"
                  />
                  <input
                    v-model.number="rgb.r"
                    type="number"
                    min="0"
                    max="255"
                    class="w-16 px-2 py-1 border border-border rounded text-sm"
                    @input="updateColorFromRGB"
                  />
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-sm font-medium w-8">G</span>
                  <input
                    v-model="rgb.g"
                    type="range"
                    min="0"
                    max="255"
                    class="flex-1"
                    @input="updateColorFromRGB"
                  />
                  <input
                    v-model.number="rgb.g"
                    type="number"
                    min="0"
                    max="255"
                    class="w-16 px-2 py-1 border border-border rounded text-sm"
                    @input="updateColorFromRGB"
                  />
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-sm font-medium w-8">B</span>
                  <input
                    v-model="rgb.b"
                    type="range"
                    min="0"
                    max="255"
                    class="flex-1"
                    @input="updateColorFromRGB"
                  />
                  <input
                    v-model.number="rgb.b"
                    type="number"
                    min="0"
                    max="255"
                    class="w-16 px-2 py-1 border border-border rounded text-sm"
                    @input="updateColorFromRGB"
                  />
                </div>
              </div>
            </div>

            <!-- HSL 滑块 -->
            <div class="space-y-3">
              <label class="text-sm font-medium">HSL 值</label>
              <div class="space-y-2">
                <div class="flex items-center gap-3">
                  <span class="text-sm font-medium w-8">H</span>
                  <input
                    v-model="hsl.h"
                    type="range"
                    min="0"
                    max="360"
                    class="flex-1"
                    @input="updateColorFromHSL"
                  />
                  <input
                    v-model.number="hsl.h"
                    type="number"
                    min="0"
                    max="360"
                    class="w-16 px-2 py-1 border border-border rounded text-sm"
                    @input="updateColorFromHSL"
                  />
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-sm font-medium w-8">S</span>
                  <input
                    v-model="hsl.s"
                    type="range"
                    min="0"
                    max="100"
                    class="flex-1"
                    @input="updateColorFromHSL"
                  />
                  <input
                    v-model.number="hsl.s"
                    type="number"
                    min="0"
                    max="100"
                    class="w-16 px-2 py-1 border border-border rounded text-sm"
                    @input="updateColorFromHSL"
                  />
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-sm font-medium w-8">L</span>
                  <input
                    v-model="hsl.l"
                    type="range"
                    min="0"
                    max="100"
                    class="flex-1"
                    @input="updateColorFromHSL"
                  />
                  <input
                    v-model.number="hsl.l"
                    type="number"
                    min="0"
                    max="100"
                    class="w-16 px-2 py-1 border border-border rounded text-sm"
                    @input="updateColorFromHSL"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 预设颜色 -->
        <div class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">预设颜色</h2>
          <div class="space-y-3">
            <!-- 基础颜色 -->
            <div>
              <label class="text-sm font-medium mb-2 block">基础颜色</label>
              <div class="grid grid-cols-8 gap-2">
                <button
                  v-for="color in basicColors"
                  :key="color.hex"
                  @click="setColor(color)"
                  :style="{ backgroundColor: color.hex }"
                  class="aspect-square rounded border hover:scale-110 transition-transform"
                  :title="color.name"
                ></button>
              </div>
            </div>

            <!-- Material Design 颜色 -->
            <div>
              <label class="text-sm font-medium mb-2 block">Material Design</label>
              <div class="space-y-2">
                <div
                  v-for="palette in materialColors"
                  :key="palette.name"
                  class="flex items-center gap-2"
                >
                  <span class="text-xs font-medium w-16">{{ palette.name }}</span>
                  <div class="flex gap-1">
                    <button
                      v-for="color in palette.colors"
                      :key="color"
                      @click="setColor({ hex: color })"
                      :style="{ backgroundColor: color }"
                      class="w-8 h-8 rounded hover:scale-110 transition-transform"
                    ></button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：颜色值和工具 -->
      <div class="lg:col-span-2 space-y-4">
        <!-- 颜色值显示 -->
        <div class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">颜色值</h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- HEX -->
            <div>
              <label class="text-sm font-medium">HEX</label>
              <div class="mt-2 flex gap-2">
                <input
                  v-model="hexColor"
                  type="text"
                  class="flex-1 px-3 py-2 border border-border rounded-md font-mono"
                  @input="updateColorFromHex"
                />
                <button
                  @click="copyValue(hexColor)"
                  class="px-3 py-2 border border-primary text-primary rounded-md hover:bg-primary/5 transition-colors"
                >
                  {{ copied === 'hex' ? '已复制' : '复制' }}
                </button>
              </div>
            </div>

            <!-- RGB -->
            <div>
              <label class="text-sm font-medium">RGB</label>
              <div class="mt-2 flex gap-2">
                <input
                  :value="`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`"
                  type="text"
                  readonly
                  class="flex-1 px-3 py-2 border border-border rounded-md font-mono bg-muted"
                />
                <button
                  @click="copyValue(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`)"
                  class="px-3 py-2 border border-primary text-primary rounded-md hover:bg-primary/5 transition-colors"
                >
                  {{ copied === 'rgb' ? '已复制' : '复制' }}
                </button>
              </div>
            </div>

            <!-- RGBA -->
            <div>
              <label class="text-sm font-medium">RGBA</label>
              <div class="mt-2 flex gap-2">
                <div class="flex-1 flex items-center gap-2">
                  <input
                    :value="`rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${rgba.a})`"
                    type="text"
                    readonly
                    class="flex-1 px-3 py-2 border border-border rounded-md font-mono bg-muted"
                  />
                  <input
                    v-model.number="rgba.a"
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    class="w-16 px-2 py-1 border border-border rounded text-sm"
                  />
                </div>
                <button
                  @click="copyValue(`rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${rgba.a})`)"
                  class="px-3 py-2 border border-primary text-primary rounded-md hover:bg-primary/5 transition-colors"
                >
                  {{ copied === 'rgba' ? '已复制' : '复制' }}
                </button>
              </div>
            </div>

            <!-- HSL -->
            <div>
              <label class="text-sm font-medium">HSL</label>
              <div class="mt-2 flex gap-2">
                <input
                  :value="`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`"
                  type="text"
                  readonly
                  class="flex-1 px-3 py-2 border border-border rounded-md font-mono bg-muted"
                />
                <button
                  @click="copyValue(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`)"
                  class="px-3 py-2 border border-primary text-primary rounded-md hover:bg-primary/5 transition-colors"
                >
                  {{ copied === 'hsl' ? '已复制' : '复制' }}
                </button>
              </div>
            </div>

            <!-- HSV -->
            <div>
              <label class="text-sm font-medium">HSV</label>
              <div class="mt-2 flex gap-2">
                <input
                  :value="`hsv(${hsv.h}, ${hsv.s}%, ${hsv.v}%)`"
                  type="text"
                  readonly
                  class="flex-1 px-3 py-2 border border-border rounded-md font-mono bg-muted"
                />
                <button
                  @click="copyValue(`hsv(${hsv.h}, ${hsv.s}%, ${hsv.v}%)`)"
                  class="px-3 py-2 border border-primary text-primary rounded-md hover:bg-primary/5 transition-colors"
                >
                  {{ copied === 'hsv' ? '已复制' : '复制' }}
                </button>
              </div>
            </div>

            <!-- CMYK -->
            <div>
              <label class="text-sm font-medium">CMYK</label>
              <div class="mt-2 flex gap-2">
                <input
                  :value="`cmyk(${cmyk.c}, ${cmyk.m}, ${cmyk.y}, ${cmyk.k})`"
                  type="text"
                  readonly
                  class="flex-1 px-3 py-2 border border-border rounded-md font-mono bg-muted"
                />
                <button
                  @click="copyValue(`cmyk(${cmyk.c}, ${cmyk.m}, ${cmyk.y}, ${cmyk.k})`)"
                  class="px-3 py-2 border border-primary text-primary rounded-md hover:bg-primary/5 transition-colors"
                >
                  {{ copied === 'cmyk' ? '已复制' : '复制' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 颜色历史 -->
        <div class="bg-card   rounded-lg p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-semibold">颜色历史</h2>
            <button
              @click="clearHistory"
              class="px-3 py-1 text-sm text-destructive hover:text-destructive/80 transition-colors"
            >
              清空
            </button>
          </div>

          <div v-if="colorHistory.length === 0" class="text-center py-8 text-muted-foreground">
            暂无历史记录
          </div>

          <div v-else class="grid grid-cols-8 gap-2">
            <button
              v-for="color in colorHistory"
              :key="color"
              @click="setColor({ hex: color })"
              :style="{ backgroundColor: color }"
              class="aspect-square rounded border hover:scale-110 transition-transform"
              :title="color"
            ></button>
          </div>
        </div>

        <!-- 渐变生成器 -->
        <div class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">渐变生成器</h2>

          <div class="space-y-4">
            <!-- 渐变类型 -->
            <div>
              <label class="text-sm font-medium">渐变类型</label>
              <div class="mt-2 flex gap-2">
                <button
                  v-for="type in gradientTypes"
                  :key="type.value"
                  @click="gradientType = type.value"
                  :class="[
                    'px-4 py-2 rounded-md transition-colors',
                    gradientType === type.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  ]"
                >
                  {{ type.name }}
                </button>
              </div>
            </div>

            <!-- 颜色停止点 -->
            <div>
              <label class="text-sm font-medium">颜色停止点</label>
              <div class="mt-2 space-y-2">
                <div
                  v-for="(stop, index) in gradientStops"
                  :key="index"
                  class="flex items-center gap-3"
                >
                  <input
                    v-model="stop.color"
                    type="color"
                    class="w-12 h-8 rounded"
                  />
                  <input
                    v-model.number="stop.position"
                    type="range"
                    min="0"
                    max="100"
                    class="flex-1"
                  />
                  <span class="text-sm w-12">{{ stop.position }}%</span>
                  <button
                    v-if="gradientStops.length > 2"
                    @click="removeGradientStop(index)"
                    class="text-destructive hover:text-destructive/80"
                  >
                    <X class="w-4 h-4" />
                  </button>
                </div>
              </div>
              <button
                @click="addGradientStop"
                class="mt-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-md transition-colors text-sm w-full"
              >
                添加停止点
              </button>
            </div>

            <!-- 渐变预览 -->
            <div>
              <label class="text-sm font-medium">预览</label>
              <div
                class="mt-2 h-32 rounded-lg border"
                :style="gradientStyle"
              ></div>
            </div>

            <!-- CSS 代码 -->
            <div>
              <label class="text-sm font-medium">CSS 代码</label>
              <div class="mt-2 flex gap-2">
                <textarea
                  :value="gradientCSS"
                  readonly
                  rows="3"
                  class="flex-1 px-3 py-2 border border-border rounded-md font-mono text-sm bg-muted resize-none"
                ></textarea>
                <button
                  @click="copyValue(gradientCSS)"
                  class="px-3 py-2 border border-primary text-primary rounded-md hover:bg-primary/5 transition-colors"
                >
                  {{ copied === 'gradient' ? '已复制' : '复制' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 对比度检查器 -->
        <div class="bg-card   rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">对比度检查器</h2>

          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-sm font-medium">文本颜色</label>
                <input
                  v-model="contrast.textColor"
                  type="color"
                  class="mt-2 w-full h-12 rounded"
                />
              </div>
              <div>
                <label class="text-sm font-medium">背景颜色</label>
                <input
                  v-model="contrast.bgColor"
                  type="color"
                  class="mt-2 w-full h-12 rounded"
                />
              </div>
            </div>

            <div>
              <label class="text-sm font-medium">预览</label>
              <div
                class="mt-2 p-4 rounded-lg text-center text-2xl font-bold"
                :style="{
                  color: contrast.textColor,
                  backgroundColor: contrast.bgColor
                }"
              >
                示例文本
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="p-4 bg-muted rounded-lg">
                <div class="text-sm text-muted-foreground mb-1">对比度</div>
                <div class="text-2xl font-bold">{{ contrastRatio }}:1</div>
              </div>
              <div class="p-4 bg-muted rounded-lg">
                <div class="text-sm text-muted-foreground mb-1">WCAG 等级</div>
                <div class="text-lg font-bold" :class="wcagLevel.color">
                  {{ wcagLevel.text }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 使用说明 -->
    <div class="mt-12 space-y-6">
      <div class="bg-card   rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
          <Info class="w-5 h-5 text-primary" />
          使用说明
        </h3>
        <div class="space-y-4 text-sm text-muted-foreground">
          <div>
            <h4 class="font-medium text-foreground mb-2">颜色格式说明</h4>
            <ul class="list-disc list-inside space-y-1 ml-4">
              <li><strong>HEX</strong>：十六进制颜色代码，如 #FF5733</li>
              <li><strong>RGB</strong>：红绿蓝三原色模式，取值 0-255</li>
              <li><strong>HSL</strong>：色相、饱和度、亮度模式</li>
              <li><strong>CMYK</strong>：印刷四色模式（青、品红、黄、黑）</li>
            </ul>
          </div>
          <div>
            <h4 class="font-medium text-foreground mb-2">WCAG 对比度标准</h4>
            <ul class="list-disc list-inside space-y-1 ml-4">
              <li>AA 级别：普通文本 4.5:1，大文本 3:1</li>
              <li>AAA 级别：普通文本 7:1，大文本 4.5:1</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- 相关工具 -->
      <div class="bg-card   rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">相关工具</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NuxtLink
            to="/tools/html-encode"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Hash class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">HTML 编码</p>
              <p class="text-xs text-muted-foreground">HTML实体编码</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
          <NuxtLink
            to="/tools/base64-encode"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <Code class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">Base64 编码</p>
              <p class="text-xs text-muted-foreground">文本Base64编码</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
          <NuxtLink
            to="/tools/css-formatter"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
          >
            <FileText class="w-5 h-5 text-primary" />
            <div>
              <p class="font-medium group-hover:text-primary">CSS 格式化</p>
              <p class="text-xs text-muted-foreground">CSS代码格式化</p>
            </div>
            <ArrowRight class="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Info, X, Hash, Code, FileText, ArrowRight, Palette } from 'lucide-vue-next'
import Breadcrumb from '~/components/Breadcrumb.vue'

// 分类信息
const category = { id: 'image', name: '图片处理', description: '图片处理工具集合' }

// 状态管理
const hexColor = ref('#FF5733')
const rgb = ref({ r: 255, g: 87, b: 51 })
const rgba = ref({ r: 255, g: 87, b: 51, a: 1 })
const hsl = ref({ h: 11, s: 100, l: 60 })
const hsv = ref({ h: 11, s: 80, v: 100 })
const cmyk = ref({ c: 0, m: 66, y: 80, k: 0 })
const colorHistory = ref([])
const copied = ref('')
const gradientType = ref('linear')
const gradientStops = ref([
  { color: '#FF5733', position: 0 },
  { color: '#33FF57', position: 100 }
])
const contrast = ref({
  textColor: '#000000',
  bgColor: '#FFFFFF'
})

// 基础颜色
const basicColors = [
  { name: '红', hex: '#FF0000' },
  { name: '橙', hex: '#FFA500' },
  { name: '黄', hex: '#FFFF00' },
  { name: '绿', hex: '#00FF00' },
  { name: '青', hex: '#00FFFF' },
  { name: '蓝', hex: '#0000FF' },
  { name: '紫', hex: '#800080' },
  { name: '粉', hex: '#FFC0CB' }
]

// Material Design 颜色
const materialColors = [
  {
    name: 'Red',
    colors: ['#FFEBEE', '#FFCDD2', '#EF9A9A', '#E57373', '#EF5350', '#F44336', '#E53935', '#D32F2F', '#C62828', '#B71C1C']
  },
  {
    name: 'Blue',
    colors: ['#E3F2FD', '#BBDEFB', '#90CAF9', '#64B5F6', '#42A5F5', '#2196F3', '#1E88E5', '#1976D2', '#1565C0', '#0D47A1']
  },
  {
    name: 'Green',
    colors: ['#E8F5E9', '#C8E6C9', '#A5D6A7', '#81C784', '#66BB6A', '#4CAF50', '#43A047', '#388E3C', '#2E7D32', '#1B5E20']
  }
]

// 渐变类型
const gradientTypes = [
  { value: 'linear', name: '线性' },
  { value: 'radial', name: '径向' }
]

// 计算属性
const gradientStyle = computed(() => {
  const stops = gradientStops.value
    .sort((a, b) => a.position - b.position)
    .map(stop => `${stop.color} ${stop.position}%`)
    .join(', ')

  if (gradientType.value === 'linear') {
    return { background: `linear-gradient(90deg, ${stops})` }
  } else {
    return { background: `radial-gradient(circle, ${stops})` }
  }
})

const gradientCSS = computed(() => {
  const stops = gradientStops.value
    .sort((a, b) => a.position - b.position)
    .map(stop => `${stop.color} ${stop.position}%`)
    .join(', ')

  if (gradientType.value === 'linear') {
    return `background: linear-gradient(90deg, ${stops});`
  } else {
    return `background: radial-gradient(circle, ${stops});`
  }
})

const contrastRatio = computed(() => {
  const rgb1 = hexToRgb(contrast.value.textColor)
  const rgb2 = hexToRgb(contrast.value.bgColor)
  return calculateContrastRatio(rgb1, rgb2)
})

const wcagLevel = computed(() => {
  const ratio = contrastRatio.value

  if (ratio >= 7) {
    return { text: 'AAA', color: 'text-green-600' }
  } else if (ratio >= 4.5) {
    return { text: 'AA', color: 'text-blue-600' }
  } else {
    return { text: '未通过', color: 'text-red-600' }
  }
})

// 方法
const updateColorFromHex = () => {
  const rgbValue = hexToRgb(hexColor.value)
  if (rgbValue) {
    rgb.value = { ...rgbValue }
    rgba.value = { ...rgbValue, a: rgba.value.a }
    updateDerivedFormats()
    addToHistory(hexColor.value)
  }
}

const updateColorFromRGB = () => {
  hexColor.value = rgbToHex(rgb.value.r, rgb.value.g, rgb.value.b)
  rgba.value = { ...rgb.value, a: rgba.value.a }
  updateDerivedFormats()
  addToHistory(hexColor.value)
}

const updateColorFromHSL = () => {
  const rgbValue = hslToRgb(hsl.value.h, hsl.value.s, hsl.value.l)
  if (rgbValue) {
    rgb.value = rgbValue
    hexColor.value = rgbToHex(rgbValue.r, rgbValue.g, rgbValue.b)
    updateHSV()
    updateCMYK()
    addToHistory(hexColor.value)
  }
}

const updateDerivedFormats = () => {
  updateHSL()
  updateHSV()
  updateCMYK()
}

const updateHSL = () => {
  const result = rgbToHsl(rgb.value.r, rgb.value.g, rgb.value.b)
  hsl.value = result
}

const updateHSV = () => {
  const result = rgbToHsv(rgb.value.r, rgb.value.g, rgb.value.b)
  hsv.value = result
}

const updateCMYK = () => {
  const result = rgbToCmyk(rgb.value.r, rgb.value.g, rgb.value.b)
  cmyk.value = result
}

const setColor = (color) => {
  if (color.hex) {
    hexColor.value = color.hex
    updateColorFromHex()
  } else if (color.rgb) {
    rgb.value = color.rgb
    updateColorFromRGB()
  }
}

const addToHistory = (color) => {
  if (!colorHistory.value.includes(color)) {
    colorHistory.value.unshift(color)
    if (colorHistory.value.length > 32) {
      colorHistory.value = colorHistory.value.slice(0, 32)
    }
  }
}

const clearHistory = () => {
  colorHistory.value = []
}

const copyValue = async (value) => {
  try {
    await navigator.clipboard.writeText(value)
    copied.value = 'temp'
    setTimeout(() => {
      copied.value = ''
    }, 2000)
  } catch (error) {
    console.error('复制失败:', error)
  }
}

const addGradientStop = () => {
  const lastPosition = gradientStops.value[gradientStops.value.length - 1].position
  const newPosition = Math.min(lastPosition + 20, 100)
  gradientStops.value.push({
    color: '#000000',
    position: newPosition
  })
}

const removeGradientStop = (index) => {
  gradientStops.value.splice(index, 1)
}

// 颜色转换函数
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

const rgbToHex = (r, g, b) => {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('').toUpperCase()
}

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

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  }
}

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

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  }
}

const rgbToHsv = (r, g, b) => {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let h
  const s = max === 0 ? 0 : d / max
  const v = max

  if (max === min) {
    h = 0
  } else {
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    v: Math.round(v * 100)
  }
}

const rgbToCmyk = (r, g, b) => {
  let c = 1 - (r / 255)
  let m = 1 - (g / 255)
  let y = 1 - (b / 255)
  let k = Math.min(c, m, y)

  c = Math.round((c - k) / (1 - k) * 100)
  m = Math.round((m - k) / (1 - k) * 100)
  y = Math.round((y - k) / (1 - k) * 100)
  k = Math.round(k * 100)

  return { c, m, y, k }
}

const calculateContrastRatio = (rgb1, rgb2) => {
  const luminance = (rgb) => {
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(val => {
      val = val / 255
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }

  const lum1 = luminance(rgb1)
  const lum2 = luminance(rgb2)
  const brightest = Math.max(lum1, lum2)
  const darkest = Math.min(lum1, lum2)

  return Math.round((brightest + 0.05) / (darkest + 0.05) * 100) / 100
}

// 初始化
updateColorFromHex()

// SEO配置
useSeoMeta({
  title: '颜色选择器 - 在线取色器和颜色转换工具',
  description: '免费在线颜色选择器，支持RGB、HSL、HEX、CMYK等格式转换，渐变生成器，对比度检查。',
  keywords: ['颜色选择器', '取色器', '颜色转换', 'RGB', 'HSL', 'HEX', 'CMYK', '渐变生成器']
})


</script>